'use strict';
import { UpdateList } from './common';

// These models match the API definition for the Client Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Client_Data_Sync
interface ClientUpdate {
    clientID: string,
    clientName?: string,
    timezone?: string,
    deleted?: boolean,
    version: number
};

export interface ClientUpdateList extends UpdateList {
    clientUpdates: ClientUpdate[];
};
