'use strict';
import { applyDefaults, coreOptions, CoreOptions, getDriver, validateSchema } from './common';
import CommandLineArgs from 'command-line-args';
import { TDPALog } from '../util/log';

export async function dpaSchemaUpdate(opts: CoreOptions, doUpdate: boolean): Promise<boolean> {
    const driver = getDriver(opts.dbtype);    // Get driver
    // Set up DB connection
    const dbConnect = await driver.dbConnect(opts.host, opts.port, opts.dbname, opts.userid, opts.password);
    // Check schema version
    let isCurrent = await validateSchema(driver, dbConnect);
    // If schema is not current, and update requested
    if ((!isCurrent) && doUpdate) {
        let newVersion = await dbConnect.dbUpdateSchema();
        TDPALog(`DB Schema for database updated to ${newVersion}`);
        isCurrent = await validateSchema(driver, dbConnect);    // Validate to be sure
    }
    return isCurrent;
}

export function handleSchemaUpdateCommand(otherArgs: string[]) {
    TDPALog(`Schema update requested`);
    const schemaupdateOpts = CommandLineArgs(coreOptions, { argv: otherArgs });
    const opts = applyDefaults(schemaupdateOpts);
    dpaSchemaUpdate(opts, true)
    .then(isCurrent => { 
        if (isCurrent) {
            TDPALog(`DB Schema versions match`);
        }
        else {
            TDPALog('DB Schema versions do not match');
            process.exit(1);
        }
    })
    .catch(err => { TDPALog(`ERROR during update: ${err}`); process.exit(1); });
}
