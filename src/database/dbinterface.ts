'use strict';

import { ClientUpdateList } from "../models/trivaClient";
import { ProjectUpdateList } from "../models/trivaProject";
import { StationUpdateList } from "../models/trivaStation";
import { TeamUpdateList } from "../models/trivaTeam";
import { WeatherAlertsUpdateList } from "../models/trivaWeatherAlerts";
import { WeatherConditionsUpdateList } from "../models/trivaWeatherCondition";
import { WorkerUpdateList } from "../models/trivaWorker";
import { WorkerDetectionUpdateList } from "../models/trivaWorkerDetection";
import { WorkerInviteUpdateList } from "../models/trivaWorkerInvite";
import { WorkerLaborUpdateList } from "../models/trivaWorkerLabor";
import { WorkerOnProjectUpdateList } from "../models/trivaWorkerOnProject";
import { WorkerOnTeamUpdateList } from "../models/trivaWorkerOnTeam";

export interface DBDriver {
    // Open connection to DB server, using given parameters
    dbConnect: (host: string, port: number, dbName: string, userID: string, password: string) => Promise<DBSession>,
    // Current schema version for driver
    schemaVersion: number,
};

export interface DBSession {
    // Close connection to DB server
    dbDisconnect: () => Promise<void>,
    // Check if DB schema version in server: should be equal to schemaVersion for driver
    dbCheckSchema: () => Promise<number>,
    // Update DB schema (requires that userid provided have necessary roles to do so)
    dbUpdateSchema: () => Promise<number>,
    // Get current symc version for given data set with given scope (client and/or project)
    dbGetCurrentSyncVersion: (datasetID: string, clientID: string, projectID: string) => Promise<BigInt>,
    // Update sync version for given data set with given scope (client and/or project) - returns new version
    dbUpdateCurrentSyncVersion: (datasetID: string, clientID: string, projectID: string, version: BigInt) => Promise<BigInt>,
    // Reset all sync versions
    dbResetSyncVersion: () => Promise<void>,
    // Deliver ClientUpdateList to database
    dbUpdateClients: (updates: ClientUpdateList) => Promise<void>,
    // Get active (undeleted) client IDs
    dbGetClientIDs: () => Promise<string[]>,
    // Deliver ProjectUpdateList to database
    dbUpdateProjects: (clientID: string, updates: ProjectUpdateList) => Promise<void>,
    // Get active (undeleted) client IDs
    dbGetProjectIDs: (clientID: string) => Promise<string[]>,
    // Deliver TeamUpdateList to database
    dbUpdateTeams?: (clientID: string, projectID: string, updates: TeamUpdateList) => Promise<void>,
    // Deliver WorkerUpdateList to database
    dbUpdateWorkers?: (clientID: string, updates: WorkerUpdateList) => Promise<void>,
    // Deliver WorkerOnProjectUpdateList to database
    dbUpdateWorkersOnProject?: (clientID: string, projectID: string, updates: WorkerOnProjectUpdateList) => Promise<void>,
    // Deliver WorkerOnTeamUpdateList to database
    dbUpdateWorkersOnTeam?: (clientID: string, projectID: string, updates: WorkerOnTeamUpdateList) => Promise<void>,
    // Deliver WorkerDetectionUpdateList to database
    dbUpdateWorkerDetections?: (clientID: string, projectID: string, updates: WorkerDetectionUpdateList) => Promise<void>,
    // Deliver WorkerLaborUpdateList to database
    dbUpdateWorkerLabor?: (clientID: string, projectID: string, updates: WorkerLaborUpdateList) => Promise<void>,
    // Deliver StationUpdateList to database
    dbUpdateStations?: (clientID: string, projectID: string, updates: StationUpdateList) => Promise<void>,
    // Deliver WeatherConditionsUpdateList to database
    dbUpdateWeatherConditions?: (clientID: string, projectID: string, updates: WeatherConditionsUpdateList) => Promise<void>,
    // Deliver WeatherAlertsUpdateList to database
    dbUpdateWeatherAlerts?: (clientID: string, projectID: string, updates: WeatherAlertsUpdateList) => Promise<void>,
    // Deliver WorkerInviteUpdateList to database
    dbUpdateWorkerInvites?: (clientID: string, updates: WorkerInviteUpdateList) => Promise<void>,
};

export interface DBDriverList {
    dbtype: string,
    driver: () => DBDriver
};
