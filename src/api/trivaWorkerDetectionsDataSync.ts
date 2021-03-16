'use strict';

import { DBSession } from "../database/dbinterface";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';
import { WorkerDetectionUpdateList } from "../models/trivaWorkerDetection";

const WorkerDetectionDataSet = "workerdetections";

// Sync workers detections for given project
export async function doWorkerDetectionsSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateWorkerDetections) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WorkerDetectionDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WorkerDetections/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WorkerDetectionUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.workerDetectionUpdates) {
            throw new Error("Invalid worker detection data sync response");
        }
        cnt += rslts.workerDetectionUpdates.length;
        // Send updates to database
        await sess.dbUpdateWorkerDetections(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WorkerDetectionDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} worker detection updates for project=${clientID}:${projectID}`)};
}
