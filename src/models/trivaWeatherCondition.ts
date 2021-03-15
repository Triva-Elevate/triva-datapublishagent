'use strict';

import { UpdateList, ISOTimeStamp } from "./common";

// These models match the API definition for the Weather Conditions Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Weather_Conditions_Data_Sync
interface WeatherConditionsUpdate {
    clientID: string,
    projectID: string,
    conditionTime: ISOTimeStamp,   // RFC3339
    actualTime?: ISOTimeStamp,   // RFC3339
    tempF?: number,  // Actual temperature
    feelsLikeF?: number, // "Feels like" temperature
    dewPointF?: number,  // Dew point temperature
    humidityPct?: number,   // RH value
    precipInches?: number,  // Precipitation, in inches
    snowDepthInches?: number,    // Snow accumulation, in inches
    pressureMilliBars?: number, // Pressure in millibars
    windDirDeg?: number,   // Wind speed and direction
    windDir?: string, // Compass rose (16 points) - derived
    windSpeedMPH?: number,
    windGustMPH?: number,   // Gust speed, MPH
    skyPercent?: number,    // Sky percentage clear
    cloudsCoded?: string,    // Clouds code
    weather?: string,       // Plain text weather
    weatherPrimaryCoded?: string, // Primary weather code
    icon?: string,    // Icon base name
    iconURL?: string,  // Icon name for weather summary
    bigIconURL?: string,  // Icon name for weather summary
    visibilityMiles?: number,   // Visibility in miles
    uVIndex?: number,   // UV Index (0-12)
    solarRadiationWM2?: number,
    ceilingFt?: number,  // cloud ceiling
    isDay?: boolean,
    closestStationID?: string,
    deleted?: boolean,
    version?: number
};

export interface WeatherConditionsUpdateList extends UpdateList {
    weatherConditionsUpdates: WeatherConditionsUpdate[]
};