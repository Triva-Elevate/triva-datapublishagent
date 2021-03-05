'use strict';

import { DBSession } from "../database/dbinterface";
import { ProjectUpdateList } from "../models/trivaProject";
import { doGET, TrivaDataPublishBaseURL } from "./common";
import { TDPALog } from '../util/log';

const ProjectDataSet = "projects";

// Sync projects for given client, and return list of current undeleted projects we are sunchronizing with
export async function doProjectSync(sess: DBSession, clientID: string, projectIDs: string[]): Promise<string[]> {
    // Get current DB content version for data set in database
    let currentVersion = await sess.dbGetCurrentSyncVersion(ProjectDataSet, clientID, "");
    let done = false;
    let offset = 0;
    let limit = 100;
    let url = `${TrivaDataPublishBaseURL}/Projects/${clientID}/sinceVersion/${currentVersion}`;
    let newVersion: BigInt;
    let cnt = 0;

    while (!done) {
        let rslts = await doGET<ProjectUpdateList>(`${url}?offset=${offset}&limit=${limit}`);
        if (!rslts.projectUpdates) {
            throw new Error("Invalid project data sync response");
        }
        cnt += rslts.projectUpdates.length;
        // Send updates to database
        await sess.dbUpdateProjects(clientID, rslts);
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
        await sess.dbUpdateCurrentSyncVersion(ProjectDataSet, clientID, "", newVersion);
    }
    if (cnt) { TDPALog(`Processed ${cnt} project updates for client=${clientID}`)};
    let projects = await sess.dbGetProjectIDs(clientID);
    // Prune list of needed
    if (projectIDs && projectIDs.length) {
        projects = projects.filter(v => projectIDs.includes(v));
    }
    return projects;    
}
