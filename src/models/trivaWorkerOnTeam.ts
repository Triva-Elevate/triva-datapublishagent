'use strict';

import { UpdateList } from "./common";

// These models match the API definition for the Worker-On-Team Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker-On-Team_Data_Sync
interface AssignedTimeRange {
    startTS: string,    // ISODsteTIme
    endTS?: string      // ISODateTime
};

interface WorkerOnTeamUpdate {
    clientID: string,
    projectID: string,
    teamCompanyID: string,
    userID: string,
    firstName?: string,
    lastName?: string,
    assignedTimes?: AssignedTimeRange[],
    deleted?: boolean,
    version: number
};

export interface WorkerOnTeamUpdateList extends UpdateList {
    workerOnTeamUpdates: WorkerOnTeamUpdate[]
};
