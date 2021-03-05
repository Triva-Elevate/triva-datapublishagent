'use strict';

import CommandLineArgs from 'command-line-args';
import { DBDriver, DBDriverList, DBSession } from '../database/dbinterface';
import { getPostgresDriver } from '../database/postgres';
import { TDPALog } from '../util/log';

export interface CoreOptions {
    dbtype: string,
    host: string,
    port: number,
    dbname: string,
    userid: string,
    password: string
};

export const coreOptions: CommandLineArgs.OptionDefinition[] = [
    { name: 'dbtype', alias: 't', type: String },
    { name: 'host', alias: 'h', type: String },
    { name: 'port', alias: 'p', type: Number },
    { name: 'dbname', alias: 'd', type: String },
    { name: 'userid', alias: 'u', type: String },
    { name: 'password', alias: 'P', type: String }
];

const dbDrivers: DBDriverList[] = [
    { dbtype: "postgres", driver: getPostgresDriver },  // Keep this first (default)

];

// Apply defaults for missing optoons
export function applyDefaults(opts: CommandLineArgs.CommandLineOptions): CoreOptions {
    let co: CoreOptions = {
        dbtype: opts.dbtype || process.env.TRIVA_DPA_DBTYPE || dbDrivers[0].dbtype,
        host: opts.host || process.env.TRIVA_DPA_HOST || "localhost",
        port: opts.port || (process.env.TRIVA_DPA_PORT && parseInt(process.env.TRIVA_DPA_PORT)) || 0,
        dbname: opts.dbname || process.env.TRIVA_DPA_DBNAME || 'triva',
        userid: opts.userid || process.env.TRIVA_DPA_USERID || '',
        password: opts.password || process.env.TRIVA_DPA_PASSWORD || ''
    };
    return co;
}

export function getDriver(dbtype: string): DBDriver {
    let rec = dbDrivers.find(d => d.dbtype == dbtype);
    let drv: DBDriver;
    if (rec) { drv = rec.driver(); }
    if (!drv) {
        throw Error(`Invalid dbtype: ${dbtype}`);
    }
    return drv;
}

export async function validateSchema(drv: DBDriver, dbConnect: DBSession): Promise<boolean> {
    // Check current schema version
    const currentSchemaVersion = await dbConnect.dbCheckSchema();
    // See if current schema matches driver
    TDPALog(`Current DB schema version: in database = ${currentSchemaVersion}, in driver = ${drv.schemaVersion}`);
    if (currentSchemaVersion > drv.schemaVersion) {
        throw new Error(`Driver is downlevel from target database - newer driver code needed for this database`);
    }    
    else if (currentSchemaVersion < drv.schemaVersion) {
        TDPALog(`Current DB schema in database is downlevel from driver - schema update required`);
        return false;
    }
    TDPALog(`DB Schema in database and driver match`);

    return true;
}
