'use strict';

import { UpdateList, LaborAttribVals } from "./common";

// These models match the API definition for the Worker Detection Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker_Detections_Data_Sync
interface DetectedTimeRange {
    startTS: string,    // ISODsteTIme
    endTS?: string      // ISODateTime
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
    startTS: string,    // ISODateTime
    endTS?: string,  // ISODateTime
    projectDate?: string,    // ISODate
    laborValues?: LaborAttribVals[],
    lastLocationID?: string,   // ID of last location (if detected or checked in onsite)
    lastLocationTS?: string,   // ISODateTIme
    ranges?: LocationDetectionRange[]
    deleted?: boolean,
    version: number
};

export interface WorkerDetectionUpdateList extends UpdateList {
    moreUpdates: boolean,
    finalVersion?: number,
    workerDetectionUpdates: WorkerDetectionUpdate[]
};