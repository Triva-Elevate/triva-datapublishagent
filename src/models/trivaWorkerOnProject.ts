'use strict';

import { LaborAttribVals, UpdateList, ISOTimeStamp } from "./common";

// These models match the API definition for the Worker-On-Project Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker-On-Project_Data_Sync
interface AssignedTimeRange {
    startTS: ISOTimeStamp,    // ISODsteTIme
    endTS?: ISOTimeStamp      // ISODateTime
};

interface WorkerOnProjectUpdate {
    clientID: string,
    projectID: string,
    userID: string,
    firstName?: string,
    lastName?: string,
    title?: string,
    projectRoles?: string[],
    assignedTimes?: AssignedTimeRange[],
    laborValues?: LaborAttribVals[]
    deleted?: boolean,
    version: number
};

export interface WorkerOnProjectUpdateList extends UpdateList {
    workerOnProjectUpdates: WorkerOnProjectUpdate[]
};
