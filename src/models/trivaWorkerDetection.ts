'use strict';

import { UpdateList, LaborAttribVals, ISOTimeStamp, ISODate } from "./common";

// These models match the API definition for the Worker Detection Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker_Detections_Data_Sync
interface DetectedTimeRange {
    startTS: ISOTimeStamp,    // ISODsteTIme
    endTS?: ISOTimeStamp      // ISODateTime
};

export interface LocationDetectionRange {
    locationID: string,
    ranges: DetectedTimeRange[]
};

interface WorkerDetectionUpdate {
    clientID: string,
    projectID: string,
    teamCompanyID: string,
    userID: string,
    startTS: ISOTimeStamp,    // ISODateTime
    endTS?: ISOTimeStamp,  // ISODateTime
    projectDate?: ISODate,    // ISODate
    laborValues?: LaborAttribVals[],
    lastLocationID?: string,   // ID of last location (if detected or checked in onsite)
    lastLocationTS?: ISOTimeStamp,   // ISODateTIme
    ranges?: LocationDetectionRange[]
    deleted?: boolean,
    version: number
};

export interface WorkerDetectionUpdateList extends UpdateList {
    workerDetectionUpdates: WorkerDetectionUpdate[]
};