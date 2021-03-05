'use strict';

import fetch from 'node-fetch';
import { TDPALog } from '../util/log';
const trivaEnv = process.env.TRIVA_DPA_ENVIRONMENT;

export const TrivaAPIBaseURL = (!trivaEnv) ? "https://apigw-prod.api.triva.xyz" : `https://apigw-${trivaEnv}.api.triva.xyz`;
export const TrivaDataPublishBaseURL = `${TrivaAPIBaseURL}/DataPublish`;

// Input per https://apigw-prod.api.triva.xyz/mobile-methods/login/docs/#/default/login
interface LoginReq {
    UserID?: string,
    PhoneNumber?: string
    Email?: string,
    Password?: string,
    ChallengeResponseType?: string,
    ChallengeResponseData?: string,
    NewPassword?: string
};
interface LoginRsp {
    ChallengeType?: string,
    ChallengeData?: string,
    IDToken?: string,   // This is main token for other APIs
    AuthToken?: string,
    RefreshToken?: string,  // Use this to refresh, if we happen to run long
    ExpireTimestamp?: string,
    UserID?: string,
    EULANeeded?: string
};
interface RefreshReq {
    UserID: string,
    RefreshToken: string
};

export const TrivaLoginBaseURL = `${TrivaAPIBaseURL}/mobile-methods/login`;

let userID: string;
let idToken: string;
let refreshToken: string;
let refreshTime: Date;
let refreshInProgress: boolean;
let refreshWaitingList: ((err: any) => void)[] = [];

// Generic no-auth-token POST - JSON body, JSON response
export async function doPOSTNoAuth<T>(url: string, body: any): Promise<T> {
    let rsp: T = await fetch(
        url, 
        { 
            method: "post", 
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        }
    ).then(rsp => { if (rsp.ok) { return rsp.json(); } else { throw new Error(rsp.statusText); }});

    return rsp;
}

// Do login in order to get TRIVA credentials
export async function doLogin(userID: string, password: string): Promise<void> {
    let loginReq: LoginReq = { UserID: userID, Password: password };
    let rsp: LoginRsp = await doPOSTNoAuth<LoginRsp>(`${TrivaLoginBaseURL}/Login`, loginReq);
    handleLoginRsp(rsp);
}

// Handle login and refresh login responses
function handleLoginRsp(rsp: LoginRsp) {
    // Clear existing state
    userID = idToken = refreshToken = refreshTime = undefined;
    if (rsp.IDToken) {
        userID = rsp.UserID;    // Save userID
        idToken = rsp.IDToken;  // Save ID token
        refreshToken = rsp.RefreshToken;    // And refresh
        refreshTime = new Date(Date.now() + 30*60*1000);
    }
    else if (rsp.ChallengeType) {
        throw new Error("Login failed: received challenge requiring user action - " + rsp.ChallengeType);
    }
    else {
        throw new Error("Login failed: no ID token received");
    }
}

// Fetch ID token (do lazy refresh if we're due for one)
export async function getIDToken(): Promise<string> {
    if (!idToken) {
        throw new Error("No valid login");
    }
    else if (Date.now() > refreshTime.getTime()) {  // We need to refresh
        if (refreshInProgress) {    // Already in progress - someone else is handling it
            await new Promise((resolve, reject) => {
                refreshWaitingList.push(function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(undefined);
                });
            });
        }
        else {
            refreshInProgress = true;   // Indicate we're handling refresh
            TDPALog('Refreshing login token');
            let req: RefreshReq = { UserID: userID, RefreshToken: refreshToken };
            let rsp: LoginRsp = await doPOSTNoAuth<LoginRsp>(`${TrivaLoginBaseURL}/RefreshLogin`, req);
            let hadError;
            try {
                handleLoginRsp(rsp);
            } catch (err) {
                hadError = err;
            }
            // No longer refreshing
            refreshInProgress = false;
            // Wake up anyone else wwaiting for the same record load
            let waiting = refreshWaitingList;
            refreshWaitingList = [];
            waiting.map(r => {
                r(hadError);
            });
            if (hadError) {
                TDPALog('Login refresh failed');
                throw hadError;
            }
            TDPALog('Login refresh complete');
        }
    }
    return idToken;
}

// Generic GET - JSON response
export async function doGET<T>(url: string): Promise<T> {
    let token = await getIDToken();

    let rsp: T = await fetch(
        url, 
        { 
            headers: { 'Content-Type': 'application/json', 'Authorization': token }
        }
    ).then(rsp => { if (rsp.ok) { return rsp.json(); } else { throw new Error(rsp.statusText); }});

    return rsp;
}
