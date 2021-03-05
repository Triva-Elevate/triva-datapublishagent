'use strict';

import { DBSession } from "../database/dbinterface";
import { ClientUpdateList } from "../models/trivaClient";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const ClientDataSet = "clients";

export async function doClientSync(sess: DBSession, clientIDs: string[]): Promise<string[]> {
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(ClientDataSet, "", "");
    let done = false;
    let offset = 0;
    let limit = 100;
    let url = `${TrivaDataPublishBaseURL}/Clients/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<ClientUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.clientUpdates) {
            throw new Error("Invalid client data sync response");
        }
        cnt += rslts.clientUpdates.length;
        // Send updates to database
        if (rslts.clientUpdates)
            await sess.dbUpdateClients(rslts);
        if (!rslts.moreUpdates) {
            done = true;
            newVersion = BigInt(rslts.finalVersion);
        }
        else {  // Else, step and get next batch of records
            offset += limit;
        }
    }
    // If we got a new version, apply it to the DB
    if (newVersion) {
        await sess.dbUpdateCurrentSyncVersion(ClientDataSet, "", "", newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} client updates`)};
    let clients = await sess.dbGetClientIDs();
    if (clientIDs && clientIDs.length) {
        clients = clients.filter(v => clientIDs.includes(v));
    }
    return clients;
}
