'use strict';

import { UpdateList } from "./common";

// These models match the API definition for the Team Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Team_Data_Sync
interface TeamUpdate {
    clientID: string,
    projectID: string,
    teamCompanyID: string,
    teamCompanyName?: string,
    teamTrade?: string,
    deleted?: boolean,
    version: number
};

export interface TeamUpdateList extends UpdateList {
    teamUpdates: TeamUpdate[];
};
