'use strict';

import { DBSession } from "../database/dbinterface";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';
import { WorkerLaborUpdateList } from "../models/trivaWorkerLabor";

const WorkerLaborDataSet = "workerlabor";

// Sync workers detections for given project
export async function doWorkerLaborSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateWorkerLabor) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WorkerLaborDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WorkerLabor/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WorkerLaborUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.workerLaborUpdates) {
            throw new Error("Invalid worker labor data sync response");
        }
        cnt += rslts.workerLaborUpdates.length;
        // Send updates to database
        await sess.dbUpdateWorkerLabor(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WorkerLaborDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} worker labor updates for project=${clientID}:${projectID}`)};
}
