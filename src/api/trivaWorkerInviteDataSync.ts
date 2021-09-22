'use strict';

import { DBSession } from "../database/dbinterface";
import { WorkerInviteUpdateList } from "../models/trivaWorkerInvite";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const WorkerInviteDataSet = "workerinvites";

// Sync worker invites for given client
export async function doWorkerInviteSync(sess: DBSession, clientID: string): Promise<void> {
    if (!sess.dbUpdateWorkerInvites) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WorkerInviteDataSet, clientID, "");
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WorkerInvites/${clientID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WorkerInviteUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.workerInviteUpdates) {
            throw new Error("Invalid worker invite data sync response");
        }
        cnt += rslts.workerInviteUpdates.length;
        // Send updates to database
        await sess.dbUpdateWorkerInvites(clientID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WorkerInviteDataSet, clientID, "", newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} worker invite updates for client=${clientID}`)};
}
