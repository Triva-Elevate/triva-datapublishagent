'use strict';

import { DBSession } from "../database/dbinterface";
import { WeatherAlertsUpdateList } from "../models/trivaWeatherAlerts";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const WeatherAlertsDataSet = "weatheralerts";

// Sync weather alerts for given project
export async function doWeatherAlertsSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateWeatherAlerts) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WeatherAlertsDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WeatherAlerts/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WeatherAlertsUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.weatherAlertsUpdates) {
            throw new Error("Invalid weather alerts data sync response");
        }
        cnt += rslts.weatherAlertsUpdates.length;
        // Send updates to database
        await sess.dbUpdateWeatherAlerts(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WeatherAlertsDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} weather alerts updates for project=${clientID}:${projectID}`)};
}
