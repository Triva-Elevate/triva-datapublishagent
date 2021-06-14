'use strict';

import { TimeLimitDayRec, UpdateList } from "./common";

// These models match the API definition for the Project Data Sync API -  https://apigw-prod.api.triva.xyz/DataPublish/docs/#/Project_Data_Sync
interface LaborAttribute {
    id: string,
    label: string,
    abbrev?: string,        // Optional abbreviated table column label - if undefined, label should be used
    type: string,
    subtype?: string,    // When defined, used for well known types (such as hourly rates)
    isActive?: boolean,
    parentAttribID?: string,    // Parent attribute of the attribute - only meaningful for type enum and when parent is active
};

interface BreakRuleRec {
    limitHours: number, // Amount of hours in a given day before break rule triggers
    breakHours: number  // Number of hours deducted from time when break triggered (will be affected by roundToMinutes)
};

interface ProjectUpdate {
    clientID: string,
    projectID: string,
    projectName?: string,
    timezone?: string,   // TZ database timezone
    address?: string,    // Project address
    laborAttribs?: LaborAttribute[], // Defined labor attributes
    roundToMinutes?: number,    // If defined and positive interger, round dwell start/stop times to nearest N minutes when computing data
    startOfWeek?: string,    // Start of work week: if undefined, Sun is assumed
    overtimeRules?: string[],  // If defined, list of enabled overtime rules - default is none
    timeLimits?: TimeLimitDayRec[],  // If defined, whitelist of allowed time of day and day of week - missing day is assumed allowed all
    breakRules?: BreakRuleRec[], // If defined, list of break rules (rules to reduce hours in day when above thresholds)
    currencyUnit?: string,   // If not defined, USD is assumed
    deleted?: boolean,
    version: number,
    projectState: string,
};

export interface ProjectUpdateList extends UpdateList {
    projectUpdates: ProjectUpdate[];
};
