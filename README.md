# triva-datapublishagent

The TRIVA Data Publishing Agent (DPA) provides an example application for efficiently mirroring and incrementally updating
data from the TRIVA application environment into a customer-managed database server.  The agent is intended to
both be buildable and runnable from the source code in this repository, or to be used via an officially
published Docker container image produced from this code.

## Building the DPA
To build the Triva DPA, you will need to install Node.JS v12.x or later (v12.x is recommended).

Once installed, building the code can be accomplished by running

     npm install
     npm run build

The resulting code will runnable directly using the dist/TrivaDataPublishAgent.js:

     node dist/TrivaDataPublishAgent.js <other options>

## Preparing the local database environment

### Postgres Database
The DPA support for PostgreSQL requires version 9.x or higher of PostgreSQL.  Once the database server is
configured and operational, create an appropriate database on the server:

    CREATE DATABASE triva

Also, be sure to create a role with the access needed to allow the database to be initialized by the DBA - this
role will require full support for creating and altering tables and indexes, so a role assigned ownership of the
database is best.  For best security, a second role should be defined with just SELECT, UPDATE, and DELETE access
to all the tables in the database - this role can be used for routine running the DPA 'update' process, where
the privileges needed for schema initialization and updates are not needed.  The first role can, of course, be used
for the 'update' process, if desired.

### Other Databases
The DPA code is structured to allow easy adding of other databases.  Currently only PostgreSQL is supported.

## Running the DPA

### Database schema initialization and update

Once the database and roles(s) are defined, run the DPA as follows:

    node dist/TrivaDataPublishAgent.js schemaupdate <options>

where options include:

* --host <hostname> - hostname of the database server (also can be provided by the TRIVA_DPA_HOST environment variable)
* --userud <userid> - userid of the role to be used to access the database server (also can be provided by the TRIVA_DPA_USERID environment variable) - use the role with access sufficient to create and alter tables and indexes.
* --password <password> - password for the role to be used to access the server (also can be provided by the TRVIA_DPA_PASSWORD environment variable)
* --dbtype postgres - selects the database type (default is 'postgres', so not needed here)
* --port <portnum> - post number for the database server (default is 5432 for postgres) (also can be provided by the TRIVA_DPA_PORT environment variable)
* --dbname <dbname> - provides the name for the database (default is 'triva') (also can be provided by the TRIVA_DPA_DBNAME environment variable)

When run successfully, this operation will create and initialize the database tables.  Also, each time the TRIVA DBA is updated, it may be
necessary to repeat running this operation, which will incrementally update the database schema, if needed.

### Initial and incremental mirroring of the database content

Once the database schema has been prepared, the database can be initially mirrored, and then incrementally updated as needed, by running the DPA 'update' command:

    node dist/TrivaDataPublishAgent.js update <options>

where the otpions include all the prior options for 'schemaupdate', plus the following additional ones:

* --accountid <accountid> - account ID for the TRIVA account to be used to access your TRIVA application data (also can be provided by the TRIVA_DPA_ACCOUNTID environment variable)
* --trivapwd <triva-password> - Password for the TRIVA account (can also be provided by the TRIVA_DPA_TRIVAPWD environment variable)
* --clientids <clientid>,<clientid>,... - List of client IDs to be mirrored - if not provided, all client IDs accessible to the user's account are assumed (also may be provided by the TRIVA_DPA_CLIENTIDS environment variable)
* --projectids <projectid>,<projectid>,... - list of project IDs to be mirrored - if not provided, all project IDs accessible to the user's account AND consistent with the '--clientids' list (if any) will be mirrored (also can be provided by the TRIVA_DPA_PROJECTIDS environment variable)
* --repeat <period-in-minutes> - if provided, causes the update process to not terminate, and instead repeat every N minutes (N >= 15).  If not proved, the DPA terminates once a single update pass is completed (also can be provided by the TRIVA_DPA_REPEAT environment variable)

## Building the Docker container image

In order to build the DPA as a docker container, run the following command:

    docker build -t trivadatapublishagent .

This will build and publish the agent to your local registry under the name trivadatapublishagent.
The Docker container, when run, provides the same interfaces as specified above, with the options being able to be provided
by the command line and via environment variables, as described earlier.  For example:

    docker run -it --rm --name triva-dba trivadatapublishagent update <options>

Note: if your database server is on localhost, you may need to specify 'host.docker.internal' as the hostname for your database server.

To use the latest TRIVA published version use triva/datapublishagent:latest as the image name.  Be cautious about running the 'latest' versions,
as unplanned upgrades may result in the requirement to run the 'schemaupdate' command in order to upgrade the schema to match the newer code.

## Test environment

If developing and testing using the TRIVA development or test environments, specify the environment using the TRIVA_DPA_ENVIRONMENT variable. If not defined, production environment is assumed.