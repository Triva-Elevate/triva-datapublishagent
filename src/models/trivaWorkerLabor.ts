'use strict';

import { UpdateList, LaborAttribVals } from "./common";

// These models match the API definition for the Worker Labor Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker_Labor_Data_Sync

interface WorkerLaborUpdate {
    clientID: string,
    projectID: string,
    teamCompanyID: string,
    userID: string,
    startTS: string,    // ISODateTime
    endTS?: string,  // ISODateTime
    closedTS?: string,  // ISODateTime
    projectDate?: string,    // ISODate
    laborValues?: LaborAttribVals[],
    lastEditTS?: string,  // ISODateTime
    lastEditUserID?: string,
    lastEditNotes?: string,
    checkInUserID?: string,
    checkOutUserID?: string,
    checkInTS?: string,  // ISODateTime
    checkOutTS?: string,  // ISODateTime
    verifiedUserID?: string,
    verifiedTS?: string,  // ISODateTime
    checkInStatus?: string
    deleted?: boolean,
    version: number
};

export interface WorkerLaborUpdateList extends UpdateList {
    workerLaborUpdates: WorkerLaborUpdate[]
};
