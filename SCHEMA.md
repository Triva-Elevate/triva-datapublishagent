# Database schemas

This document describes the references database schemas provided by each 'dbytype' supported by the Triva Data Publish Agent.

In general, it should be understood that the schemas are defined and produced in such a way as to enable general use, but
do not include indexes or other usage-specific optimizations that may be important for certain use cases.  A customer should
feel free to add desired indexes to the database published by the DPA, with the understanding that it is possible (but unlikely)
that future schema updates may conflict with these - in general, the intention for the schemas is to add compatibly to them, via
new tables and new columns, while maintaining the existing schemas as much as is possible, in order to avoid impacts on customer
defined queries, reports, or other consumers of the published data.

## dbtype=postgres Schema

### triva_clients

Each client represents a specific TRIVA customer.  Any user will generally have access to at least one.

   Column   | Type | Is Key? | Description |
 ---------- | ---- | ------- | -------------------- |
 clientid   | text | Yes     | Unique ID of the client |
 clientname | text | No      | Label for the client |
 timezone   | text | No      | Default timezone for client (per the IANA timezone database - https://www.iana.org/time-zones) |

### triva_projects

Each project is unique to a given customer (client).

   Column   | Type | Is Key? | Description |
 -------------- | ------- | ------- | -------------------- |
 clientid       | text    | Yes     | Unique ID of the client |
 projectid      | text    | Yes     | ID of the project |
 projectname    | text    | No      | Label for the project |
 timezone       | text    | No      | Default timezone for project (per the IANA timezone database - https://www.iana.org/time-zones) |
 address        | text    | No      | Address of project (freeform string) |
 roundtominutes | integer | No      | If nonzero, rounding limit for labor data, in minutes. |
 startofweek    | text    | No      | Start of work week, with regard to hours-per-week totals for overtime (e.g. Sun, Mon, Tue, etc) |
 overtimerules  | text[]  | No      | Set of zero or more overtime rules to be applied. Values include over8hoursperday, over40hoursperweek, saturday, sunday |
 currencyunit   | text    | No      | ISO 4217 currency code for currency used by project (e.g. USD, CAD, EUR) |

### triva_project_labor_attribs

Each project may have zero or more labor attributes defined (including disabled/inactive ones).

   Column   | Type | Is Key? | Description |
 -------------- | ------- | ------- | --------------------
 clientid       | text    | Yes     | Unique ID of the client
 projectid      | text    | Yes     | ID of the project
 laborattribid  | text    | Yes     | ID of the labor attribute
 label          | text    | No      | Presentation label for attribute
 abbrev         | text    | No      | Optional shorter label for table column headers. If defined, this should be used for column headers instead of 'label'. 'label' should still always be used for non-tables (such as "label: value" list presentation). If not defined, 'label' should be used for column headers.
 type           | text    | No      | Data type for attribute (number, text, or enum (text value from list of choices))
 subtype        | text    | No      | Optional field to identify a specific well-known use or definition for the field. This field's values are well defined, but new values can be added at any time in the future. Existing values include HourlyRate (for worker pay rate per hour)/
 isactive       | boolean | No      | If this attribute is defined, but is now inactive, this will defined and set to false.
 parentattribid | text    | No      | Optional field used to indicate that this attribute is logically a child of the attribute with the given ID. The special value 'teamCompanyID' can also be present, if the choices for the labor attribute's value are limited by the worker's team.

### triva_project_time_limits

Each project can provide a range of time limits for which times on which days of the week labor data can be reported for workers on the project.  These values can be overridden by specific team or worker settings.  A specific day may have more than one range of allowed times.

   Column   | Type | Is Key? | Description |
 -------------- | ------- | ------- | --------------------
 clientid       | text    | Yes     | Unique ID of the client
 projectid      | text    | Yes     | ID of the project
 dayofweek      | text    | Yes     | Day of week with defined limits (Sun, Mon, Tue, etc)
 starttime      | time without time zone | Yes | Starting time for allowed time range within the day 
 endtime   | time without time zone | No | Ending time for allowed time range within the day.

### triva_project_break_rules

Each project can provide specific rules for applying break times based on cumulated time recorded for a given work day.

   Column   | Type | Is Key? | Description |
 -------------- | ------- | ------- | --------------------
 clientid       | text    | Yes     | Unique ID of the client
 projectid      | text    | Yes     | ID of the project
 ruleindex      | integer | Yes     | Index of the rule (0-based) - allows for more than one rule
 limithours     | double precision | No | Number of hours of labor logged before the limit is applied
 breakhours     | double precision | No | Number of hours reported as break hours, given the limithours has been reached or exceeded

### triva_stations

Each project can have zero or more tag reporting base stations.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 projectid       | text    | Yes     | ID of the project
 stationid       | text    | Yes     | ID of the station
 stationname     | text    | No      | Label for the station
 isactive        | boolean | No      | Indicates whether the station is disabled or active
 stationsensorid | text    | No      | Sensor (tag) ID of the station's tag
 aliasstationid  | text    | No      | Alias for the stations' location (for multiple stations reporting same zone)
 minssi          | integer | No      | If defined, minimum RSSI value for station to report tags
 gatewayid       | text    | No      | ID of the physical gateway
 latitude        | double precision | No | If defined, latitude of the station (in degrees north, negative for south)
 longitude       | double precision | No | If defined, longitude of the station (in degrees east, negative for west)
 isoffsite       | boolean  | No     | If set to true, station is 'offsite' station (used to report worker exits)
 ssigainoffset   | integer  | No     | If defined, RSSI value added to detected tag RSSI (antenna gain adjustment) 
 loitertimelimit | integer  | No     | If defined, time for workers to be detected by station continuously before labor time accumulation stops
 isonline        | boolean  | No     | Indicates if the station is online or offline

### triva_teams

Each project can have one or more teams assigned - assigned workers on a project must be assigned to a team.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 projectid       | text    | Yes     | ID of the project
 teamcompanyid   | text    | Yes     | ID of the company of the team
 teamcompanyname | text    | No      | Label for the team
 teamtrade       | text    | No      | Label for trade for the team

### triva_workers

Each worker defined within a client will have a record shared across any projects where they may be assigned.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 userid          | text    | Yes     | Unique ID of the worker
 firstname       | text    | No      | First name of the worker
 lastname        | text    | No      | Last name of the worker
 phonenumber     | text    | No      | Phone number of the worker in E.123 format
 email           | text    | No      | Email address of the worker
 birthday        | integer | No      | Birth day-of-month for the worker (if defined)
 birthmonth      | integer | No      | Birth month-of-year for the worker (if defined)
 accountid       | text    | No      | Login account ID of the worker (if defined)
 assignedtags    | text[]  | No      | List of tracking tags associated with the worker, if any
 clientroles     | text[]  | No      | List of client-level permission roles granted to the worker
 employeeid      | text    | No      | Employee ID of the worker, if defined
 notes           | text    | No      | Free form notes provided about the worker.

### triva_workers_on_project

Each worker currently (or previously) assigned to a given project has a record particular to that project.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 projectid       | text    | Yes     | ID of the project
 userid          | text    | Yes     | ID of the worker assigned to the project
 firstname       | text    | No      | First name of the worker
 lastname        | text    | No      | Last name of the worker
 title           | text    | No      | Title set for the worker, if any
 projectroles    | text[]  | No      | List of project-level permission roles granted to the worker
 laborvalues     | jsonb   | No      | JSON encoded object containing any currently defined labor attribute ID/value pairs for the worker

### triva_workers_on_project_assigned_teams

Each worker assigned to a project will have one or more records describing each time they were assigned to the project (and possibly removed from the project).

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 projectid       | text    | Yes     | ID of the project
 userid          | text    | Yes     | ID of the worker assigned to the project
 startts         | timestamp with time zone | Yes | Timestamp when worker was assigned to the project
 endts           | timestamp with time zone | No | If defined, timestamp when worker was unassigned from the project.  If NULL, worker is still assigned.
 
### triva_workers_on_team

Each worker assigned to a project is assigned to one team at a given time, but may have been assigned to more than one team over their time on a project.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 projectid       | text    | Yes     | ID of the project
 teamcompanyid   | text    | Yes     | ID of the company of the assigned team
 userid          | text    | Yes     | ID of the worker assigned to the team
 firstname       | text    | No      | First name of the worker
 lastname        | text    | No      | Last name of the worker
 title           | text    | No      | Title set for the worker, if any
 projectroles    | text[]  | No      | List of project-level permission roles granted to the worker
 laborvalues     | jsonb   | No      | JSON encoded object containing any currently defined labor attribute ID/value pairs for the worker

### triva_workers_on_team_assigned_times

Each worker assigned to a project will be a member of one team at a given time, so these records reflect the time ranges where a given worker was a member of a given team on a given project (one row for each period of time when they were on a team on the project).

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid        | text    | Yes     | Unique ID of the client
 teamcompanyid   | text    | Yes     | ID of the company of the assigned team
 userid          | text    | Yes     | ID of the worker assigned to the team
 startts         | timestamp with time zone | Yes | Timestamp when worker was assigned to the team
 endts           | timestamp with time zone | No | If defined, timestamp when worker was unassigned from the team.  If NULL, worker is still assigned.

### triva_worker_labor

### triva_worker_detections

### triva_weather_alerts

### triva_weather_conditions

### triva_versionsync

### triva_db_version
