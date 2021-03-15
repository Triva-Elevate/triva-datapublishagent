'use strict';

import { UpdateList, ISOTimeStamp } from "./common";

// These models match the API definition for the Weather Alerts Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Weather_Alerts_Data_Sync
interface WeatherAlertsUpdate {
    clientID: string,
    projectID: string,
    id?: string,
    areaDesc?: string,
    sentTS?: ISOTimeStamp,
    effectiveTS?: ISOTimeStamp,
    onsetTS?: ISOTimeStamp,
    expiresTS?: ISOTimeStamp,
    endsTS?: ISOTimeStamp,
    severity?: string,
    certainty?: string,
    urgency?: string,
    event?: string,
    senderName?: string,
    headline?: string,
    description?: string,
    instruction?: string,
    response?: string,
    polygon?: { lat: number, lon: number }[],
    geocodeUGSList?: string[],
    replacedBy?: string,
    replacedTS?: ISOTimeStamp,
    lastActiveTS?: ISOTimeStamp,
    isActive?: boolean,
    deleted?: boolean,
    version?: number
};

export interface WeatherAlertsUpdateList extends UpdateList {
    weatherAlertsUpdates: WeatherAlertsUpdate[]
};
