'use strict';

import { DBSession } from "../database/dbinterface";
import { WorkerOnTeamUpdateList } from "../models/trivaWorkerOnTeam";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const WorkerOnTeamDataSet = "workersonteam";

// Sync workers on team for given project
export async function doWorkersOnTeamSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateWorkersOnTeam) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WorkerOnTeamDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WorkersOnTeam/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WorkerOnTeamUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.workerOnTeamUpdates) {
            throw new Error("Invalid worker-on-team data sync response");
        }
        cnt += rslts.workerOnTeamUpdates.length;
        // Send updates to database
        await sess.dbUpdateWorkersOnTeam(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WorkerOnTeamDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} worker-on-team updates for project=${clientID}:${projectID}`)};
}
