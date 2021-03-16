'use strict';

import { TimeLimitDayRec, UpdateList } from "./common";

// These models match the API definition for the Station Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Station_Data_Sync
interface LoiterLimit {
    timeLimit: number,  // Number of seconds before limit kicks in
    schedule: TimeLimitDayRec[]
};

interface StationUpdate {
    clientID: string,
    projectID: string,
    stationID: string,
    stationName?: string,
    isActive?: boolean,
    stationSensorID?: string,
    aliasStationID?: string,
    minSSI?: number,
    gatewayID?: string,
    latitude?: number,
    longitude?: number,
    isOffSite?: boolean, // Assumed false if undefined
    ssiGainOffset?: number, // Integer db to add to detected RSSI (for location use)
    loiterLimits?: LoiterLimit,
    isOnline?: boolean       // current status
    deleted?: boolean,
    version: number
};

export interface StationUpdateList extends UpdateList {
    stationUpdates: StationUpdate[]
};
