'use strict';

export interface VersionRsp {
    version: number
};

export interface UpdateList {
    moreUpdates: boolean,
    finalVersion?: number
};
  
export interface LaborAttribVals {
    id: string,
    value: number | string
};

interface TimeLimitRec {
    startTime: number,  // Integer seconds after midnight
    endTime: number,    // Integer seconds after midnight
};

export interface TimeLimitDayRec {
    day: string,  // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    allowedTimes: TimeLimitRec[]    // If empty, no valid times for day
};

export type ISOTimeStamp = string;  // RFC3339 timestamp (YYYY-MM-DDThh:mm:ssZ)
export type ISODate = string;   // RFC3339 date (YYYY-MM-DD)
