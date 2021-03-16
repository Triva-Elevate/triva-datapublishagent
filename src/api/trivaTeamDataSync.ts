'use strict';

import { DBSession } from "../database/dbinterface";
import { TeamUpdateList } from "../models/trivaTeam";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const TeamDataSet = "teams";

// Sync teams for given project
export async function doTeamSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateTeams) return;

    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(TeamDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 100;
    let url = `${TrivaDataPublishBaseURL}/Teams/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<TeamUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.teamUpdates) {
            throw new Error("Invalid team data sync response");
        }
        cnt += rslts.teamUpdates.length;
        // Send updates to database
        await sess.dbUpdateTeams(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(TeamDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} team updates for project=${clientID}:${projectID}`)};

}
