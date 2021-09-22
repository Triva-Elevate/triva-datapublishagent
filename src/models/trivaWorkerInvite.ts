'use strict';

import { UpdateList, ISOTimeStamp } from "./common";

// These models match the API definition for the Worker Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Worker_Invitation_Data_Sync
interface WorkerInviteUpdate {
    invitationID: string,
    clientID: string,
    userID: string,
    invitingUserID?: string,
    sentTS?: ISOTimeStamp,
    expireTS?: ISOTimeStamp,
    inviteState?: string,
    inviteComments?: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    phoneNumber?: string,
    acceptedTS?: ISOTimeStamp,
    acceptedAccountID?: string,
    rejectedTS?: ISOTimeStamp,
    rejectedReason?: string,
    cancelledTS?: ISOTimeStamp,
    cancelledUserID?: string,
    cancelledReason?: string,
    revokedTS?: ISOTimeStamp,
    revokedUserID?: string,
    revokedReason?: string,
    deleted?: boolean,
    version: number
};

export interface WorkerInviteUpdateList extends UpdateList {
    workerInviteUpdates: WorkerInviteUpdate[]
};
