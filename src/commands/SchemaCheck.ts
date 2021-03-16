'use strict';
import { applyDefaults, coreOptions, CoreOptions, getDriver } from './common';
import CommandLineArgs from 'command-line-args';
import { dpaSchemaUpdate } from './SchemaUpdate';
import { TDPALog } from '../util/log';

export function handleSchemaCheckCommand(otherArgs: string[]) {
    TDPALog(`Schema check requested`);
    const schemaupdateOpts = CommandLineArgs(coreOptions, { argv: otherArgs });
    const opts = applyDefaults(schemaupdateOpts);
    dpaSchemaUpdate(opts, false)
    .then(isCurrent => { 
        if (isCurrent) {
            TDPALog(`DB Schema versions match`);
        }
        else {
            TDPALog('DB Schema versions do not match');
            process.exit(1);
        }
    })
    .catch(err => { TDPALog(`ERROR during schema check: ${err}`); process.exit(1); });
}
