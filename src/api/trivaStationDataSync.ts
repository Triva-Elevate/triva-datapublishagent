'use strict';

import { DBSession } from "../database/dbinterface";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';
import { StationUpdateList } from "../models/trivaStation";

const StationDataSet = "stations";

// Sync stations for given project
export async function doStationSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateStations) return;

    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(StationDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 100;
    let url = `${TrivaDataPublishBaseURL}/Stations/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<StationUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.stationUpdates) {
            throw new Error("Invalid station data sync response");
        }
        cnt += rslts.stationUpdates.length;
        // Send updates to database
        await sess.dbUpdateStations(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(StationDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} station updates for project=${clientID}:${projectID}`) };
}
