'use strict';

import { UpdateList } from "./common";

// These models match the API definition for the Worker Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker_Data_Sync
interface WorkerUpdate {
    clientID: string,
    userID: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    email?: string,
    birthDay?: number,
    birthMonth?: number,
    accountID?: string,
    assignedTags?: string[],
    clientRoles?: string[],
    employeeID?: string,
    notes?: string,
    deleted?: boolean,
    version: number
};

export interface WorkerUpdateList extends UpdateList {
    workerUpdates: WorkerUpdate[]
};
