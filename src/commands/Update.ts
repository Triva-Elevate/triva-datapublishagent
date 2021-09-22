'use strict';
import { doLogin } from '../api/common';
import { applyDefaults, coreOptions, CoreOptions, getDriver, validateSchema } from './common';
import CommandLineArgs from 'command-line-args';
import { doClientSync } from '../api/trivaClientDataSync';
import { doProjectSync } from '../api/trivaProjectDataSync';
import { doTeamSync } from '../api/trivaTeamDataSync';
import { doWorkerSync } from '../api/trivaWorkerDataSync';
import { doWorkersOnProjectSync } from '../api/trivaWorkerOnProjectDataSync';
import { doWorkersOnTeamSync } from '../api/trivaWorkerOnTeamDataSync';
import { TDPALog } from '../util/log';
import { doWorkerDetectionsSync } from '../api/trivaWorkerDetectionsDataSync';
import { doWorkerLaborSync } from '../api/trivaWorkerLaborDataSync';
import { doStationSync } from '../api/trivaStationDataSync';
import moment from 'moment-timezone';
import { doWeatherConditionSync } from '../api/trivaWeatherConditionsDataSync';
import { doWeatherAlertsSync } from '../api/trivaWeatherAlertsDataSync';

interface UpdateOptions extends CoreOptions {
    trivauserid: string,
    trivapassword: string,
    clientids: string[],
    projectids: string[],
    repeat: number
};

export const updateOptions: CommandLineArgs.OptionDefinition[] = coreOptions.concat([
    { name: 'accountid', alias: 'A', type: String },
    { name: 'trivapwd', alias: 'T', type: String },
    { name: "clientids", alias: "C", type: String },
    { name: "projectids", alias: "R", type: String },
    { name: "repeat", alias: "r", type: Number }
]);

// Apply defaults for missing optoons
function applyUpdateDefaults(opts: CommandLineArgs.CommandLineOptions): UpdateOptions {
    let co: UpdateOptions = applyDefaults(opts) as UpdateOptions;
    co.trivauserid = opts.accountid || process.env.TRIVA_DPA_ACCOUNTID || "";
    co.trivapassword = opts.trivapwd || process.env.TRIVA_DPA_TRIVAPWD || "";
    let clients = opts.clientids || process.env.TRIVA_DPA_CLIENTIDS;
    if (clients) {
        co.clientids = clients.split(',');
    }
    let projs = opts.projectids || process.env.TRIVA_DPA_PROJECTIDS;
    if (projs) {
        co.projectids = projs.split(',');
    }
    co.repeat = opts.repeat || parseInt(process.env.TRIVA_DPA_REPEAT || "0");
    if ((co.repeat > 0) && (co.repeat < 15)) co.repeat = 15;

    return co;
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}   

async function dpaUpdate(opts: UpdateOptions): Promise<void> {
    const driver = getDriver(opts.dbtype);    // Get driver
    // Set up DB connection
    const dbConnect = await driver.dbConnect(opts.host, opts.port, opts.dbname, opts.userid, opts.password);
    // Check schema version
    let isCurrent = await validateSchema(driver, dbConnect);
    if (!isCurrent) {
        throw new Error("Cannot update with DB Schema version mismatch: need to run schemaupdate");
    }
    if ((!opts.trivauserid) && (!opts.trivapassword)) {
        throw new Error("Cannot update without valid accountid and password for TRIVA");
    }
    await doLogin(opts.trivauserid, opts.trivapassword);    // Establish login
    TDPALog(`Logged in to TRIVA using ${opts.trivauserid} account`);
    if (opts.repeat) {
        TDPALog(`Repeat update every ${opts.repeat} minutes`);
    }
    // Repeat if specified
    let done = false;
    while (!done) {
        // Start with client refresh
        let clientIDs = await doClientSync(dbConnect, opts.clientids);
        // Now loop through clients
        for (let clientID of clientIDs) {
            // Sync workers
            await doWorkerSync(dbConnect, clientID);
            // Sync projects
            let projectIDs = await doProjectSync(dbConnect, clientID, opts.projectids);
            for (let projectID of projectIDs) {
                await doStationSync(dbConnect, clientID, projectID);
                await doTeamSync(dbConnect, clientID, projectID);
                await doWorkersOnProjectSync(dbConnect, clientID, projectID);
                await doWorkersOnTeamSync(dbConnect, clientID, projectID);
                await doWorkerDetectionsSync(dbConnect, clientID, projectID);
                await doWorkerLaborSync(dbConnect, clientID, projectID);
                await doWeatherConditionSync(dbConnect, clientID, projectID);
                await doWeatherAlertsSync(dbConnect, clientID, projectID);
            }
        }
        if (opts.repeat > 0) {
            // Figure out delay to next multiple of time, relative to start of day
            let now = moment();
            let nextdue = (now.minutes() + (60 * now.hours()) + opts.repeat);
            let togo = opts.repeat - (nextdue % opts.repeat);
            TDPALog(`Pausing ${togo} minutes`)
            await sleep(togo * 60000);
        }
        else {
            done = true;
        }
    }
}

export function handleUpdateCommand(args: string[]) {
    TDPALog(`Database update requested`);
    const updateOpts = CommandLineArgs(updateOptions, { argv: args });
    const opts = applyUpdateDefaults(updateOpts);
    dpaUpdate(opts)
        .then(() => { TDPALog(`Update completed`); })
        .catch(err => { TDPALog(`ERROR during update: ${err}`); TDPALog(err.stack); process.exit(1); });
}
