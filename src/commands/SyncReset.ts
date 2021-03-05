'use strict';
import { applyDefaults, coreOptions, CoreOptions, getDriver, validateSchema } from './common';
import CommandLineArgs from 'command-line-args';
import { TDPALog } from '../util/log';

export async function dpaSyncReset(opts: CoreOptions): Promise<void> {
    const driver = getDriver(opts.dbtype);    // Get driver
    // Set up DB connection
    const dbConnect = await driver.dbConnect(opts.host, opts.port, opts.dbname, opts.userid, opts.password);
    // Check schema version
    let isCurrent = await validateSchema(driver, dbConnect);
    if (!isCurrent) {
        throw new Error('DB Schema versions do not match');
    }
    await dbConnect.dbResetSyncVersion();
}

export function handleSyncResetCommand(otherArgs: string[]) {
    TDPALog(`Sync reset requested`);
    const schemaupdateOpts = CommandLineArgs(coreOptions, { argv: otherArgs });
    const opts = applyDefaults(schemaupdateOpts);
    dpaSyncReset(opts)
    .then(() => { 
        TDPALog(`Sync reset completed`);
    })
    .catch(err => { TDPALog(`ERROR during sync reset: ${err}`); process.exit(1); });
}
