'use strict';
import 'source-map-support/register';
import CommandLineArgs from 'command-line-args';
import { handleSchemaCheckCommand } from './commands/SchemaCheck';
import { handleUpdateCommand } from './commands/Update';
import { handleSchemaUpdateCommand } from './commands/SchemaUpdate';
import { TDPALog } from './util/log';
import { handleSyncResetCommand } from './commands/SyncReset';

// Command syntax
//  node <agent.js> schemaupdate <args>    (to initialize or update DB schema, and return)
//  node <agent.js> update <args>          (to update data from TRIVA into DB, and return
//  node <agent.js> schemacheck <args>     (to check if DB schema in database matches driver, and return)
//  node <agent.js> versionreset <args>    (to reset all version sync data - causes next update command to reload all data)
//
// Arguments include:
// --dbtype <driver> - DB driver (currently just postgres) - default is postgres (can also be passed using TRIVA_DPA_DBTYPE environment variable)
// --host <hostname> - DB hostname (default is localhost) (can also be passed using TRIVA_DPA_HOST environment variable)
// --port <port> - DB port number (default is DB specific) (can also be passed using TRIVA_DPA_PORT environment variable)
// --dbname <name> - DB name (default is triva) (can also be passed using TRIVA_DPA_DBNAME environment variable)
// --userid <userid> - DB user ID (default is blank) (can also be passed using TRIVA_DPA_USERID environment variable)
// --password <pwd> - DB password (default is blank) (can also be passed using TRIVA_DPA_PASSWORD environment variable)
//
// For update, additional arguments include
// --accountid <accountid> - account ID of triva login (can also be passed using TRIVA_DPA_ACCOUNTID environment variable)
// --trivapwd <password> - password for triva login (can also be passed using TRIVA_DPA_TRIVAPWD environment variable)
// --clientid <clientid>,<clientid>,... - if specifified, limit sync to given clientIDs (otherwise all) (can also be passed using TRIVA_DPA_CLIENTIDS)
// --projectid <projectid>,<projectid>,... - if specifified, limit sync to given projectIDs (otherwise all) (can also be passed using TRIVA_DPA_PROJECTIDS)
// --repeat <period-in-minutes< - if specified, DPA will repeat refresh operation even N minutes (N must be at least 10)

const mainCLIDef: CommandLineArgs.OptionDefinition[] = [
    { name: 'command', defaultOption: true }
];

const mainCommand = CommandLineArgs(mainCLIDef, { stopAtFirstUnknown: true });
const otherArgs = mainCommand._unknown || [];   // Additional args after the command

// Check the main command, and parse other args as needed
if (mainCommand.command == "schemaupdate") {
    handleSchemaUpdateCommand(otherArgs);
}
else if (mainCommand.command == 'update') {
    handleUpdateCommand(otherArgs);
}
else if (mainCommand.command == "schemacheck") {
    handleSchemaCheckCommand(otherArgs);
}
else if (mainCommand.command == "syncreset") {
    handleSyncResetCommand(otherArgs);
}
else {
    TDPALog(`Missing or unknown command: must be 'schemaupdate', 'schemacheck', 'syncreset' or 'update'`);
}

