'use strict';

import { DBSession } from "../database/dbinterface";
import { WeatherConditionsUpdateList } from "../models/trivaWeatherCondition";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const WeatherConditionDataSet = "weatherconds";

// Sync weather conditions for given project
export async function doWeatherConditionSync(sess: DBSession, clientID: string, projectID: string): Promise<void> {
    if (!sess.dbUpdateWeatherConditions) return;
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(WeatherConditionDataSet, clientID, projectID);
    let done = false;
    let offset = 0;
    let limit = 1000;
    let url = `${TrivaDataPublishBaseURL}/WeatherConditions/${clientID}/${projectID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<WeatherConditionsUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.weatherConditionsUpdates) {
            throw new Error("Invalid weather conditions data sync response");
        }
        cnt += rslts.weatherConditionsUpdates.length;
        // Send updates to database
        await sess.dbUpdateWeatherConditions(clientID, projectID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(WeatherConditionDataSet, clientID, projectID, newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} weather conditions updates for project=${clientID}:${projectID}`)};
}
