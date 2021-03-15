'use strict';

import { UpdateList, LaborAttribVals, ISOTimeStamp, ISODate } from "./common";

// These models match the API definition for the Worker Labor Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker_Labor_Data_Sync

interface WorkerLaborUpdate {
    clientID: string,
    projectID: string,
    teamCompanyID: string,
    userID: string,
    startTS: ISOTimeStamp,    // ISODateTime
    endTS?: ISOTimeStamp,  // ISODateTime
    closedTS?: ISOTimeStamp,  // ISODateTime
    projectDate?: ISODate,    // ISODate
    laborValues?: LaborAttribVals[],
    lastEditTS?: ISOTimeStamp,  // ISODateTime
    lastEditUserID?: string,
    lastEditNotes?: string,
    checkInUserID?: string,
    checkOutUserID?: string,
    checkInTS?: ISOTimeStamp,  // ISODateTime
    checkOutTS?: ISOTimeStamp,  // ISODateTime
    verifiedUserID?: string,
    verifiedTS?: ISOTimeStamp,  // ISODateTime
    checkInStatus?: string
    deleted?: boolean,
    version: number
};

export interface WorkerLaborUpdateList extends UpdateList {
    workerLaborUpdates: WorkerLaborUpdate[]
};
