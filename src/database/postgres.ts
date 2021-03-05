'use strict';
import { Pool, PoolClient, QueryResult } from 'pg';
import { LaborAttribVals } from '../models/common';
import { ClientUpdateList } from '../models/trivaClient';
import { ProjectUpdateList } from '../models/trivaProject';
import { StationUpdateList } from '../models/trivaStation';
import { TeamUpdateList } from '../models/trivaTeam';
import { WorkerUpdateList } from '../models/trivaWorker';
import { LocationDetectionRange, WorkerDetectionUpdateList } from '../models/trivaWorkerDetection';
import { WorkerLaborUpdateList } from '../models/trivaWorkerLabor';
import { WorkerOnProjectUpdateList } from '../models/trivaWorkerOnProject';
import { WorkerOnTeamUpdateList } from '../models/trivaWorkerOnTeam';
import { TDPALog } from '../util/log';

import { DBDriver, DBSession } from './dbinterface';

const DBVersionTable = "triva_db_version";
const DBSyncVersionTable = "triva_versionsync";
const DBClientTable = "triva_clients";
const DBProjectTable = "triva_projects";
const DBProjectLaborAttribsTable = "triva_project_labor_attribs";
const DBProjectBreakRulesTable = "triva_project_break_rules";
const DBProjectTimeLimitsTable = "triva_project_time_limits";
const DBTeamTable = "triva_teams";
const DBWorkerTable = "triva_workers";
const DBWorkerOnProjectTable = "triva_workers_on_project";
const DBWorkerOnProjectAssignedTimesTable = "triva_workers_on_project_assigned_times";
const DBWorkerOnTeamTable = "triva_workers_on_team";
const DBWorkerOnTeamAssignedTimesTable = "triva_workers_on_team_assigned_times";
const DBWorkerDetectionTable = "triva_worker_detections";
const DBWorkerLaborTable = "triva_worker_labor";
const DBStationTable = "triva_stations";

const TABLE_EXISTS_SQL = "select exists(SELECT * FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)";
const GET_VERSION_SQL = `select version from ${DBVersionTable} where schema='base'`;
const CREATE_VERSION_SQL = `create table ${DBVersionTable} (schema TEXT PRIMARY KEY, version integer NOT NULL)`;
const UPSERT_VERSION_SQL = `INSERT INTO ${DBVersionTable} (schema, version) VALUES ('base', $1) ON CONFLICT (schema) DO UPDATE SET version = $1`;
const GET_DATASYNC_VERSION_SQL = `select version from ${DBSyncVersionTable} where dataset=$1 and clientid=$2 and projectid=$3`;
const UPSERT_DATASYNC_VERSION_SQL = `INSERT INTO ${DBSyncVersionTable} (dataset, clientid, projectid, version) VALUES ($1, $2, $3, $4) ON CONFLICT (dataset, clientid, projectid) DO UPDATE SET version = $4 RETURNING *`;
const DELETE_DATASYNC_VERSION_SQL = `DELETE FROM ${DBSyncVersionTable} WHERE dataset=$1 AND clientid=$2 AND projectid=$3 RETURNING *`;
const RESET_DATASYNC_VERSION_SQL = `DELETE FROM ${DBSyncVersionTable}`;
const DELETE_CLIENT_SQL = `DELETE FROM ${DBClientTable} WHERE clientid=$1`;
const UPSERT_CLIENT_SQL = `INSERT INTO ${DBClientTable} (clientid, clientname, timezone) VALUES ($1, $2, $3) ON CONFLICT (clientid) DO UPDATE SET clientname=$2, timezone=$3`;
const GET_ACTIVE_CLIENTIDS_SQL = `SELECT clientid from ${DBClientTable}`;
const DELETE_PROJECT_SQL = `DELETE FROM ${DBProjectTable} WHERE clientid=$1 and projectid=$2`;
const UPSERT_PROJECT_SQL = `INSERT INTO ${DBProjectTable} (clientid, projectid, projectname, timezone, address, roundtominutes, startofweek, overtimerules, currencyunit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (clientid, projectid) DO UPDATE SET projectname=$3, timezone=$4, address=$5, roundtominutes=$6, startofweek=$7, overtimerules=$8, currencyunit=$9`;
const GET_ACTIVE_PROJECTIDS_SQL = `SELECT projectid from ${DBProjectTable} where clientid=$1`;
const DELETE_PROJECT_LABORATTRIB_SQL = `DELETE FROM ${DBProjectLaborAttribsTable} WHERE clientid=$1 and projectid=$2`;
const UPSERT_PROJECT_LABORATTRIB_SQL = `INSERT INTO ${DBProjectLaborAttribsTable} (clientid, projectid, laborattribid, label, abbrev, type, subtype, isactive, parentattribid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (clientid, projectid, laborattribid) DO UPDATE SET label=$4, abbrev=$5, type=$6, subtype=$7, isactive=$8, parentattribid=$9`;
const DELETE_PROJECT_BREAKRULES_SQL = `DELETE FROM ${DBProjectBreakRulesTable} WHERE clientid=$1 and projectid=$2`;
const UPSERT_PROJECT_BREAKRULES_SQL = `INSERT INTO ${DBProjectBreakRulesTable} (clientid, projectid, ruleindex, limithours, breakhours) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (clientid, projectid, ruleindex) DO UPDATE SET limithours=$4, breakhours=$5`;
const DELETE_PROJECT_TIMELIMITS_SQL = `DELETE FROM ${DBProjectTimeLimitsTable} WHERE clientid=$1 and projectid=$2`;
const UPSERT_PROJECT_TIMELIMITS_SQL = `INSERT INTO ${DBProjectTimeLimitsTable} (clientid, projectid, dayofweek, starttime, endtime) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (clientid, projectid, dayofweek, starttime) DO UPDATE SET endtime=$5`;
const DELETE_TEAM_SQL = `DELETE FROM ${DBTeamTable} WHERE clientid=$1 and projectid=$2 and teamcompanyid=$3`;
const UPSERT_TEAM_SQL = `INSERT INTO ${DBTeamTable} (clientid, projectid, teamcompanyid, teamcompanyname, teamtrade) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (clientid, projectid, teamcompanyid) DO UPDATE SET teamcompanyname=$4, teamtrade=$5`;
const DELETE_WORKER_SQL = `DELETE FROM ${DBWorkerTable} WHERE clientid=$1 and userid=$2`;
const UPSERT_WORKER_SQL = `INSERT INTO ${DBWorkerTable} (clientid, userid, firstname, lastname, phonenumber, email, birthday, birthmonth, accountid, assignedtags, clientroles, employeeid, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (clientid, userid) DO UPDATE SET firstname=$3, lastname=$4, phonenumber=$5, email=$6, birthday=$7, birthmonth=$8, accountid=$9, assignedtags=$10, clientroles=$11, employeeid=$12, notes=$13`;
const DELETE_WORKERONPROJECT_SQL = `DELETE FROM ${DBWorkerOnProjectTable} WHERE clientid=$1 and projectid=$2 and userid=$3`;
const UPSERT_WORKERONPROJECT_SQL = `INSERT INTO ${DBWorkerOnProjectTable} (clientid, projectid, userid, firstname, lastname, title, projectroles, laborvalues) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (clientid, projectid, userid) DO UPDATE SET firstname=$4, lastname=$5, title=$6, projectroles=$7, laborvalues=$8`;
const DELETE_WORKERONPROJECTASSIGNEDTIMES_SQL = `DELETE FROM ${DBWorkerOnProjectAssignedTimesTable} WHERE clientid=$1 and projectid=$2 and userid=$3`;
const UPSERT_WORKERONPROJECTASSIGNEDTIMES_SQL = `INSERT INTO ${DBWorkerOnProjectAssignedTimesTable} (clientid, projectid, userid, startts, endts) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (clientid, projectid, userid, startts) DO UPDATE SET endts=$5`;
const DELETE_WORKERONTEAM_SQL = `DELETE FROM ${DBWorkerOnTeamTable} WHERE clientid=$1 and projectid=$2 and userid=$3 and teamcompanyid=$4`;
const UPSERT_WORKERONTEAM_SQL = `INSERT INTO ${DBWorkerOnTeamTable} (clientid, projectid, userid, teamcompanyid, firstname, lastname) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (clientid, projectid, userid, teamcompanyid) DO UPDATE SET firstname=$5, lastname=$6`;
const DELETE_WORKERONTEAMASSIGNEDTIMES_SQL = `DELETE FROM ${DBWorkerOnTeamAssignedTimesTable} WHERE clientid=$1 and projectid=$2 and userid=$3 and teamcompanyid=$4`;
const UPSERT_WORKERONTEAMASSIGNEDTIMES_SQL = `INSERT INTO ${DBWorkerOnTeamAssignedTimesTable} (clientid, projectid, userid, teamcompanyid, startts, endts) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (clientid, projectid, userid, teamcompanyid, startts) DO UPDATE SET endts=$6`;
const DELETE_WORKERDETECTION_SQL = `DELETE FROM ${DBWorkerDetectionTable} WHERE clientid=$1 and projectid=$2 and teamcompanyid=$3 and userid=$4 and startts=$5`;
const UPSERT_WORKERDETECTION_SQL = `INSERT INTO ${DBWorkerDetectionTable} (clientid, projectid, teamcompanyid, userid, startts, endts, projectdate, laborvalues, lastlocationid, lastlocationts, locatopmramges) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (clientid, projectid, teamcompanyid, userid, startts) DO UPDATE SET endts=$6, projectdate=$7, laborvalues=$8, lastlocationid=$9, lastlocationts=$10, locatopmramges=$11`;
const DELETE_WORKERLABOR_SQL = `DELETE FROM ${DBWorkerLaborTable} WHERE clientid=$1 and projectid=$2 and teamcompanyid=$3 and userid=$4 and startts=$5`;
const UPSERT_WORKERLABOR_SQL = `INSERT INTO ${DBWorkerLaborTable} (clientid, projectid, teamcompanyid, userid, startts, endts, projectdate, laborvalues, closedts, lasteditts, lastedituserid, lasteditnotes, checkints, checkinuserid, checkoutts, checkoutuserid, verifiedts, verifieduserid, checkinstatus) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) ON CONFLICT (clientid, projectid, teamcompanyid, userid, startts) DO UPDATE SET endts=$6, projectdate=$7, laborvalues=$8, closedts=$9, lasteditts=$10, lastedituserid=$11, lasteditnotes=$12, checkints=$13, checkinuserid=$14, checkoutts=$15, checkoutuserid=$16, verifiedts=$17, verifieduserid=$18, checkinstatus=$19`;
const DELETE_STATION_SQL = `DELETE FROM ${DBStationTable} WHERE clientid=$1 and projectid=$2 and stationid=$3`;
const UPSERT_STATION_SQL = `INSERT INTO ${DBStationTable} (clientid, projectid, stationid, stationname, isactive, stationsensorid, aliasstationid, minssi, gatewayid, latitude, longitude, isoffsite, ssigainoffset, loitertimelimit, isonline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (clientid, projectid, stationid) DO UPDATE SET stationname=$4, isactive=$5, stationsensorid=$6, aliasstationid=$7, minssi=$8, gatewayid=$9, latitude=$10, longitude=$11, isoffsite=$12, ssigainoffset=$13, loitertimelimit=$14, isonline=$15`;

interface PGDBSession extends DBSession {
    session: PGSessionInfo
}

interface PGSessionInfo {
    pool: Pool
};

interface DBSteps {
    steps: { name: string, sql: string }[]
};

// Each of these is a migration step in the SQL schema
const dbVersions: DBSteps[] = [
    {
        steps: [
            {
                name: `Create ${DBSyncVersionTable} table`,
                sql: `CREATE TABLE ${DBSyncVersionTable} (dataset TEXT, clientid TEXT, projectid TEXT, version BIGINT, PRIMARY KEY (dataset, clientid, projectid))`
            },
            {
                name: `Create ${DBClientTable} table`,
                sql: `CREATE TABLE ${DBClientTable} (clientid TEXT PRIMARY KEY, clientname TEXT, timezone TEXT)`
            },
            {
                name: `Create ${DBProjectTable} table`,
                sql: `CREATE TABLE ${DBProjectTable} (clientid TEXT, projectid TEXT, projectname TEXT, timezone TEXT, address TEXT, roundtominutes INTEGER, startofweek TEXT, overtimerules TEXT[], currencyunit TEXT, PRIMARY KEY (clientid, projectid))`
            },
            {
                name: `Create ${DBProjectLaborAttribsTable} table`,
                sql: `CREATE TABLE ${DBProjectLaborAttribsTable} (clientid TEXT, projectid TEXT, laborattribid TEXT, label TEXT, abbrev TEXT, type TEXT, subtype TEXT, isactive boolean, parentattribid TEXT, PRIMARY KEY (clientid, projectid, laborattribid))`
            },
            {
                name: `Create ${DBProjectBreakRulesTable} table`,
                sql: `CREATE TABLE ${DBProjectBreakRulesTable} (clientid TEXT, projectid TEXT, ruleindex INTEGER, limithours FLOAT, breakhours FLOAT, PRIMARY KEY (clientid, projectid, ruleindex))`
            },
            {
                name: `Create ${DBProjectTimeLimitsTable} table`,
                sql: `CREATE TABLE ${DBProjectTimeLimitsTable} (clientid TEXT, projectid TEXT, dayofweek TEXT, starttime TIME, endtime TIME, PRIMARY KEY (clientid, projectid, dayofweek, starttime))`
            },
            {
                name: `Create ${DBTeamTable} table`,
                sql: `CREATE TABLE ${DBTeamTable} (clientid TEXT, projectid TEXT, teamcompanyid TEXT, teamcompanyname TEXT, teamtrade TEXT, PRIMARY KEY (clientid, projectid, teamcompanyid))`
            },
            {
                name: `Create ${DBWorkerTable} table`,
                sql: `CREATE TABLE ${DBWorkerTable} (clientid TEXT, userid TEXT, firstname TEXT, lastname TEXT, phonenumber TEXT, email TEXT, birthday INTEGER, birthmonth INTEGER, accountid TEXT, assignedtags TEXT[], clientroles TEXT[], employeeid TEXT, notes TEXT, PRIMARY KEY (clientid, userid))`
            },        
            {
                name: `Create ${DBWorkerOnProjectTable} table`,
                sql: `CREATE TABLE ${DBWorkerOnProjectTable} (clientid TEXT, projectid TEXT, userid TEXT, firstname TEXT, lastname TEXT, title TEXT, projectroles TEXT[], laborvalues JSONB, PRIMARY KEY (clientid, projectid, userid))`
            },        
            {
                name: `Create ${DBWorkerOnProjectAssignedTimesTable} table`,
                sql: `CREATE TABLE ${DBWorkerOnProjectAssignedTimesTable} (clientid TEXT, projectid TEXT, userid TEXT, startts timestamptz, endts timestamptz, PRIMARY KEY (clientid, projectid, userid, startts))`
            },        
            {
                name: `Create ${DBWorkerOnTeamTable} table`,
                sql: `CREATE TABLE ${DBWorkerOnTeamTable} (clientid TEXT, projectid TEXT, teamcompanyid TEXT, userid TEXT, firstname TEXT, lastname TEXT, title TEXT, projectroles TEXT[], laborvalues JSONB, PRIMARY KEY (clientid, projectid, teamcompanyid, userid))`
            },        
            {
                name: `Create ${DBWorkerOnTeamAssignedTimesTable} table`,
                sql: `CREATE TABLE ${DBWorkerOnTeamAssignedTimesTable} (clientid TEXT, projectid TEXT, teamcompanyid TEXT, userid TEXT, startts timestamptz, endts timestamptz, PRIMARY KEY (clientid, projectid, teamcompanyid, userid, startts))`
            },        
            {
                name: `Create ${DBWorkerDetectionTable} table`,
                sql: `CREATE TABLE ${DBWorkerDetectionTable} (clientid TEXT, projectid TEXT, teamcompanyid TEXT, userid TEXT, startts timestamptz, endts timestamptz, projectdate DATE, laborvalues JSONB, lastlocationid TEXT, lastlocationts timestamptz, locatopmramges JSONB, PRIMARY KEY (clientid, projectid, teamcompanyid, userid, startts))`
            },                
            {
                name: `Create ${DBWorkerLaborTable} table`, 
                sql: `CREATE TABLE ${DBWorkerLaborTable} (clientid TEXT, projectid TEXT, teamcompanyid TEXT, userid TEXT, startts timestamptz, endts timestamptz, projectdate DATE, laborvalues JSONB, closedts timestamptz, lasteditts timestamptz, lastedituserid TEXT, lasteditnotes TEXT, checkints timestamptz, checkinuserid TEXT, checkoutts timestamptz, checkoutuserid TEXT, verifiedts timestamptz, verifieduserid TEXT, checkinstatus TEXT, PRIMARY KEY (clientid, projectid, teamcompanyid, userid, startts))`
            },                
            {
                name: `Create ${DBStationTable} table`,
                sql: `CREATE TABLE ${DBStationTable} (clientid TEXT, projectid TEXT, stationid TEXT, stationname TEXT, isactive BOOLEAN, stationsensorid TEXT, aliasstationid TEXT, minssi INTEGER, gatewayid TEXT, latitude FLOAT, longitude FLOAT, isoffsite BOOLEAN, ssigainoffset INTEGER, loitertimelimit INTEGER, isonline BOOLEAN, PRIMARY KEY (clientid, projectid, stationid))`
            },
        ]
    }
];

export function getPostgresDriver(): DBDriver {
    let dbdriver: DBDriver = {
        dbConnect: connectDB,
        schemaVersion: dbVersions.length
    };
    return dbdriver
}

async function connectDB(host: string, port: number, dbName: string, userID: string, password: string): Promise<PGDBSession> {
    let pc: Pool = new Pool({
        host: host,
        port: port || 5432,
        user: userID,
        password: password,
        database: dbName,
        application_name: "triva-databpublishagent",
        keepAlive: true,
        min: 0,
        max: 5,
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 5000
    });
    let session: PGSessionInfo = { pool: pc };
    return {
        session: session,
        
        dbDisconnect: (): Promise<void> => { return disconnectDB(session); },
        dbCheckSchema: (): Promise<number> => { return getSchemaVersion(session); },
        dbUpdateSchema: (): Promise<number> => { return updateDBSchema(session); },
        dbGetCurrentSyncVersion: (datasetID, clientID, projectID): Promise<BigInt> => { return getCurrentSyncVersion(session, datasetID, clientID, projectID); },
        dbUpdateCurrentSyncVersion: (datasetID, clientID, projectID, version): Promise<BigInt> => { return updateCurrentSyncVersion(session, datasetID, clientID, projectID, version); },
        dbResetSyncVersion: (): Promise<void> => { return resetAllSyncVersion(session); },
        dbUpdateClients: (updates): Promise<void> => { return doUpdateClients(session, updates); },
        dbGetClientIDs: (): Promise<string[]> => { return doGetClientIDs(session); },
        dbUpdateProjects: (clientID, updates): Promise<void> => { return doUpdateProjects(session, clientID, updates); },
        dbGetProjectIDs: (clientID): Promise<string[]> => { return doGetProjectIDs(session, clientID); },
        dbUpdateTeams: (clientID, projectID, updates): Promise<void> => { return doUpdateTeams(session, clientID, projectID, updates); },
        dbUpdateWorkers: (clientID, updates): Promise<void> => { return doUpdateWorkers(session, clientID, updates); },
        dbUpdateWorkersOnProject: (clientID, projectID, updates): Promise<void> => { return doUpdateWorkersOnProject(session, clientID, projectID, updates); },
        dbUpdateWorkersOnTeam: (clientID, projectID, updates): Promise<void> => { return doUpdateWorkersOnTeam(session, clientID, projectID, updates); },
        dbUpdateWorkerDetections: (clientID, projectID, updates): Promise<void> => { return doUpdateWorkerDetections(session, clientID, projectID, updates); },
        dbUpdateWorkerLabor: (clientID, projectID, updates): Promise<void> => { return doUpdateWorkerLabor(session, clientID, projectID, updates); },
        dbUpdateStations: (clientID, projectID, updates): Promise<void> => { return doUpdateStations(session, clientID, projectID, updates); },
    };
}

async function disconnectDB(sess: PGSessionInfo): Promise<void> {
    if (sess.pool) {
        let p = sess.pool;
        delete sess.pool;
        await p.end();
    }
}

async function tableExists(sess: PGSessionInfo, tname: string): Promise<boolean> {
    let rslt = await sess.pool.query(TABLE_EXISTS_SQL, [tname]);
    return (rslt && rslt.rowCount == 1 && rslt.rows[0].exists) || false;
}

async function getSchemaVersion(sess: PGSessionInfo): Promise<number> {
    let version = -1;
    let version_exists = await tableExists(sess, DBVersionTable);
    if (version_exists) {
        let vrslt = await sess.pool.query(GET_VERSION_SQL, []);
        if (vrslt && vrslt.rowCount) {
            version = vrslt.rows[0].version;
        }
    }
    return version;
}

async function updateDBSchema(sess: PGSessionInfo): Promise<number> {
    // See if version table exists
    let version_exists = await tableExists(sess, DBVersionTable);
    if (!version_exists) {  // If not, create it with version zero
        let rslt = await sess.pool.query(CREATE_VERSION_SQL, []);
        if (!rslt) {
            throw Error("Error creating version table");
        }
    }
    // Get current schema version - this is the index in the dbVersions list that should be next
    let version = await getSchemaVersion(sess);
    TDPALog(`Starting update from ${version} to ${dbVersions.length}`);

    if (version < 0) {  // If no version set, add our base version at zero
        await sess.pool.query(UPSERT_VERSION_SQL, [ 0 ]); // And set to zero
        version = 0;
    }
    while (version < dbVersions.length) { // Walk through pending steps in order
        let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
        try {
            await c.query("BEGIN");         // Start transaction for update
            for (let step of dbVersions[version].steps) {
                TDPALog(`Applying schema update: ${step.name}`);
                await c.query(step.sql);
            }
            version = version + 1;
            await c.query(UPSERT_VERSION_SQL, [ version ]); // And upsert version
            await c.query("COMMIT")
        } catch (err) {
            TDPALog(`ERROR during SQL schema update: ${err}`);
            await c.query("ROLLBACK");
            throw err;
        } finally {
            await c.release();
        }
        TDPALog(`Completed update to version ${version}`);
    }
    return 0;
}

// Get current symc version for given data set with given scope (client and/or project)
async function getCurrentSyncVersion(sess: PGSessionInfo, datasetID: string, clientID: string, projectID: string): Promise<BigInt> {
    let rslt = await sess.pool.query(GET_DATASYNC_VERSION_SQL, [ datasetID, clientID || "", projectID || "" ]);
    if (rslt && rslt.rowCount) {
        return rslt.rows[0].version;
    }
    return BigInt(0);
}

// Update sync version for given data set with given scope (client and/or project) - returns previous version
async function updateCurrentSyncVersion(sess: PGSessionInfo, datasetID: string, clientID: string, projectID: string, version: BigInt): Promise<BigInt> {
    let rslt: QueryResult;
    // If setting to zero or invalid value, clear record
    if ((!version) || (version <= BigInt(0))) {
        rslt = await sess.pool.query(DELETE_DATASYNC_VERSION_SQL, [ datasetID, clientID || "", projectID || "" ]);
    }
    else {  // Else upsert record
        rslt = await sess.pool.query(UPSERT_DATASYNC_VERSION_SQL, [ datasetID, clientID || "", projectID || "", version ]);
    }
    if (rslt && rslt.rowCount) {
        return rslt.rows[0].version;
    }
    return undefined;
}

// Reset all sync versions
async function resetAllSyncVersion(sess: PGSessionInfo): Promise<void> {
    let rslt: QueryResult;
    rslt = await sess.pool.query(RESET_DATASYNC_VERSION_SQL, [ ]);
}

async function doUpdateClients(sess: PGSessionInfo, updates: ClientUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.clientUpdates) {
            if (upd.deleted) {  // Deleted record?
                await sess.pool.query(DELETE_CLIENT_SQL, [ upd.clientID || null ]);
            }
            else {
                await sess.pool.query(UPSERT_CLIENT_SQL, [ upd.clientID, upd.clientName || upd.clientID, upd.timezone || "America/New_York" ]);
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL client update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

// Get active (undeleted) client IDs
async function doGetClientIDs(sess: PGSessionInfo): Promise<string[]> {
    let rslt = await sess.pool.query(GET_ACTIVE_CLIENTIDS_SQL, []);
    if (rslt) {
        return rslt.rows.map(r => r.clientid);
    }
    return [];
}

const DOW = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];

function toTime(n: number): string {
    return `${Math.floor(n/3600)}:${Math.floor((n / 60) % 60)}:${Math.floor(n % 60)}`;
}

async function doUpdateProjects(sess: PGSessionInfo, clientID: string, updates: ProjectUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.projectUpdates) {
            await sess.pool.query(DELETE_PROJECT_LABORATTRIB_SQL, [ upd.clientID, upd.projectID ]);
            await sess.pool.query(DELETE_PROJECT_BREAKRULES_SQL, [ upd.clientID, upd.projectID ]);
            await sess.pool.query(DELETE_PROJECT_TIMELIMITS_SQL, [ upd.clientID, upd.projectID ]);
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_PROJECT_SQL, [ upd.clientID, upd.projectID ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID,
                    upd.projectName || upd.projectID,
                    upd.timezone || null,
                    upd.address || null,
                    upd.roundToMinutes || 0,
                    upd.startOfWeek || null,
                    upd.overtimeRules || [],
                    upd.currencyUnit || null
                ];
                await sess.pool.query(UPSERT_PROJECT_SQL, args);
                // Replace labor attribs
                if (upd.laborAttribs) {
                    for (let la of upd.laborAttribs) {
                        let param = [
                            upd.clientID,
                            upd.projectID,
                            la.id,
                            la.label || la.id,
                            la.abbrev || la.label || la.id,
                            la.type || null,
                            la.subtype || null,
                            la.isActive || false,
                            la.parentAttribID || null
                        ];
                        await sess.pool.query(UPSERT_PROJECT_LABORATTRIB_SQL, param);
                    }
                }
                // Replace break rules
                if (upd.breakRules) {
                    for (let idx = 0; idx < upd.breakRules.length; idx++) {
                        let br = upd.breakRules[idx];
                        let param = [
                            upd.clientID,
                            upd.projectID,
                            idx,
                            br.limitHours,
                            br.breakHours
                        ];
                        await sess.pool.query(UPSERT_PROJECT_BREAKRULES_SQL, param);
                    }
                }
                // Replace tmme limits
                if (!upd.timeLimits) { upd.timeLimits = [] }
                for (let dow of DOW) {
                    let dowrec = upd.timeLimits.find(r => r.day == dow);
                    if (!dowrec) { dowrec = { day: dow, allowedTimes: [ { startTime: 0, endTime: 86400 }]}; }
                    for (let allow of dowrec.allowedTimes) {
                        let param = [
                            upd.clientID,
                            upd.projectID,
                            dow,
                            toTime(allow.startTime),
                            toTime(allow.endTime)
                        ];
                        await sess.pool.query(UPSERT_PROJECT_TIMELIMITS_SQL, param);    
                    }
                }
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL project update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

// Get active (undeleted) project IDs
async function doGetProjectIDs(sess: PGSessionInfo, clientID: string): Promise<string[]> {
    let rslt = await sess.pool.query(GET_ACTIVE_PROJECTIDS_SQL, [ clientID ]);
    if (rslt) {
        return rslt.rows.map(r => r.projectid);
    }
    return [];
}

async function doUpdateTeams(sess: PGSessionInfo, clientID: string, projectID: string, updates: TeamUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.teamUpdates) {
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_TEAM_SQL, [ upd.clientID, upd.projectID, upd.teamCompanyID ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID || projectID,
                    upd.teamCompanyID,
                    upd.teamCompanyName || null,
                    upd.teamTrade || null
                ];
                await sess.pool.query(UPSERT_TEAM_SQL, args);
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL team update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

async function doUpdateWorkers(sess: PGSessionInfo, clientID: string, updates: WorkerUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.workerUpdates) {
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_WORKER_SQL, [ upd.clientID, upd.userID ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.userID,
                    upd.firstName || "",
                    upd.lastName || "",
                    upd.phoneNumber || null,
                    upd.email || null,
                    upd.birthDay || null,
                    upd.birthMonth || null,
                    upd.accountID || null,
                    upd.assignedTags || [],
                    upd.clientRoles || [],
                    upd.employeeID || null,
                    upd.notes || null
                ];
                await sess.pool.query(UPSERT_WORKER_SQL, args);
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL worker update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

// Flatten labor attribute value list into an object with properties (more JSON friendly)
function formatLaborAttribValues(lst: LaborAttribVals[]): { [key: string]: number | string } {
    let obj: { [key: string]: number | string } = {};
    if (lst) {
        lst.forEach(v => {
            obj[v.id] = v.value;
        });
    }
    return obj;
}

async function doUpdateWorkersOnProject(sess: PGSessionInfo, clientID: string, projectID: string, updates: WorkerOnProjectUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.workerOnProjectUpdates) {
            await sess.pool.query(DELETE_WORKERONPROJECTASSIGNEDTIMES_SQL, [ upd.clientID, upd.projectID, upd.userID ]);
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_WORKERONPROJECT_SQL, [ upd.clientID, upd.projectID, upd.userID ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID || projectID,
                    upd.userID,
                    upd.firstName || "",
                    upd.lastName || "",
                    upd.title || null,
                    upd.projectRoles || [],
                    formatLaborAttribValues(upd.laborValues)
                ];
                await sess.pool.query(UPSERT_WORKERONPROJECT_SQL, args);
                if (upd.assignedTimes) {
                    for (let at of upd.assignedTimes) {
                        let atargs = [
                            upd.clientID || clientID,
                            upd.projectID || projectID,
                            upd.userID,
                            at.startTS,
                            at.endTS || null
                        ];
                        await sess.pool.query(UPSERT_WORKERONPROJECTASSIGNEDTIMES_SQL, atargs);
        
                    }
                }
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL worker update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

async function doUpdateWorkersOnTeam(sess: PGSessionInfo, clientID: string, projectID: string, updates: WorkerOnTeamUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.workerOnTeamUpdates) {
            await sess.pool.query(DELETE_WORKERONTEAMASSIGNEDTIMES_SQL, [ upd.clientID, upd.projectID, upd.userID, upd.teamCompanyID ]);
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_WORKERONTEAM_SQL, [ upd.clientID, upd.projectID, upd.userID ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID || projectID,
                    upd.userID,
                    upd.teamCompanyID || "",
                    upd.firstName || "",
                    upd.lastName || "",
                ];
                await sess.pool.query(UPSERT_WORKERONTEAM_SQL, args);
                if (upd.assignedTimes) {
                    for (let at of upd.assignedTimes) {
                        let atargs = [
                            upd.clientID || clientID,
                            upd.projectID || projectID,
                            upd.userID,
                            upd.teamCompanyID || "",
                            at.startTS,
                            at.endTS || null
                        ];
                        await sess.pool.query(UPSERT_WORKERONTEAMASSIGNEDTIMES_SQL, atargs);
                    }
                }
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL worker-on-team update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

interface LocationRange {
    startTS: string,    // RFC3339
    endTS: string       // RFC3339
};

// Flatten labor attribute value list into an object with properties (more JSON friendly)
function formatLocationRanges(lst: LocationDetectionRange[]): { [key: string]: LocationRange[] } {
    let obj: { [key: string]: LocationRange[] } = {};
    if (lst) {
        lst.forEach(v => {
            obj[v.locationID] = v.ranges.map(r => { return { startTS: r.startTS, endTS: r.endTS || r.startTS }});
        });
    }
    return obj;
}

async function doUpdateWorkerDetections(sess: PGSessionInfo, clientID: string, projectID: string, updates: WorkerDetectionUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.workerDetectionUpdates) {
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_WORKERDETECTION_SQL, [ upd.clientID, upd.projectID, upd.teamCompanyID, upd.userID, upd.startTS ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID || projectID,
                    upd.teamCompanyID || "",
                    upd.userID,
                    upd.startTS,
                    upd.endTS || null,
                    upd.projectDate,
                    formatLaborAttribValues(upd.laborValues),
                    upd.lastLocationID || null,
                    upd.lastLocationTS || null,
                    formatLocationRanges(upd.ranges)
                ];
                await sess.pool.query(UPSERT_WORKERDETECTION_SQL, args);
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL worker detection update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

async function doUpdateWorkerLabor(sess: PGSessionInfo, clientID: string, projectID: string, updates: WorkerLaborUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.workerLaborUpdates) {
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_WORKERLABOR_SQL, [ upd.clientID, upd.projectID, upd.teamCompanyID, upd.userID, upd.startTS ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID || projectID,
                    upd.teamCompanyID || "",
                    upd.userID,
                    upd.startTS,
                    upd.endTS || null,
                    upd.projectDate,
                    formatLaborAttribValues(upd.laborValues),
                    upd.closedTS || null,
                    upd.lastEditTS || null,
                    upd.lastEditUserID || null,
                    upd.lastEditNotes || null,
                    upd.checkInTS || null,
                    upd.checkInUserID || null,
                    upd.checkOutTS || null,
                    upd.checkOutUserID || null,
                    upd.verifiedTS || null,
                    upd.verifiedUserID || null,
                    upd.checkInStatus || null
                ];
                await sess.pool.query(UPSERT_WORKERLABOR_SQL, args);
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL worker labor update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}

async function doUpdateStations(sess: PGSessionInfo, clientID: string, projectID: string, updates: StationUpdateList): Promise<void> {
    let c = await sess.pool.connect(); // Get a connection, so we do this as transaction
    try {
        await c.query("BEGIN");         // Start transaction for update
        // Apply updates in order
        for (let upd of updates.stationUpdates) {
            if (upd.deleted) {  // Deleted record and subrecords
                await sess.pool.query(DELETE_STATION_SQL, [ upd.clientID, upd.projectID, upd.stationID ]);
            }
            else {
                let args = [
                    upd.clientID || clientID,
                    upd.projectID || projectID,
                    upd.stationID,
                    upd.stationName || upd.stationID,
                    upd.isActive || false,
                    upd.stationSensorID || null,
                    upd.aliasStationID || null,
                    (typeof upd.minSSI == "number") ? upd.minSSI : null,
                    upd.gatewayID || null,
                    (typeof upd.latitude == 'number') ? upd.latitude : null,
                    (typeof upd.longitude == 'number') ? upd.longitude : null,
                    upd.isOffSite || false,
                    (typeof upd.ssiGainOffset == 'number') ? upd.ssiGainOffset : null,
                    (typeof upd.loiterLimits?.timeLimit == 'number') ? upd.loiterLimits.timeLimit : null,
                    upd.isOnline || false
                ];
                await sess.pool.query(UPSERT_STATION_SQL, args);
            }
        }
        await c.query("COMMIT")
    } catch (err) {
        TDPALog(`ERROR during SQL station update: ${err}`);
        await c.query("ROLLBACK");
        throw err;
    } finally {
        await c.release();
    }
}