'use strict';

import { DBSession } from "../database/dbinterface";
import { WorkerUpdateList } from "../models/trivaWorker";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const WorkerDataSet = "workers";

// Sync workers for given client
export async function doWorkerSync(sess: DBSession, clientID: string): Promise<void> {
    if (!sess.dbUpdateWorkers) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WorkerDataSet, clientID, "");
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/Workers/${clientID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WorkerUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.workerUpdates) {
            throw new Error("Invalid worker data sync response");
        }
        cnt += rslts.workerUpdates.length;
        // Send updates to database
        await sess.dbUpdateWorkers(clientID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WorkerDataSet, clientID, "", newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} worker updates for client=${clientID}`)};
}
