'use strict';

import { DBSession } from "../database/dbinterface";
import { WorkerOnProjectUpdateList } from "../models/trivaWorkerOnProject";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const WorkerOnProjectDataSet = "workersonproject";

// Sync workers for given client
export async function doWorkersOnProjectSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateWorkersOnProject) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WorkerOnProjectDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WorkersOnProject/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WorkerOnProjectUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.workerOnProjectUpdates) {
            throw new Error("Invalid worker-on-project data sync response");
        }
        cnt += rslts.workerOnProjectUpdates.length;
        // Send updates to database
        await sess.dbUpdateWorkersOnProject(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WorkerOnProjectDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} worker-on-project updates for project=${clientID}:${projectID}`)};
}
