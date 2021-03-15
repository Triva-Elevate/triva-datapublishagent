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
 projectid       | text    | Yes     | ID of the project
 teamcompanyid   | text    | Yes     | ID of the company of the assigned team
 userid          | text    | Yes     | ID of the worker assigned to the team
 startts         | timestamp with time zone | Yes | Timestamp when worker was assigned to the team
 endts           | timestamp with time zone | No | If defined, timestamp when worker was unassigned from the team.  If NULL, worker is still assigned.

### triva_worker_labor

Any labor data recorded for a worker while assigned to a team on a project will be recorded here.  Any given labor record will
be particular to a given date on the project, and a worker can have zero or more records for a given date.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid       | text                     | Yes     | Unique ID of the client
 projectid      | text                     | Yes     | ID of the project
 teamcompanyid  | text                     | Yes     | ID of the company of the assigned team
 userid         | text                     | Yes     | ID of the worker
 startts        | timestamp with time zone | Yes     | Timestamp of the start of the record labor time
 endts          | timestamp with time zone | No      | Current ending time for the worker labor record (this can change for currently ongoing checkins)
 projectdate    | date                     | No      | Date of the recorded labor data (relative to the timezone of the project)
 laborvalues    | jsonb                    | No      | JSON encoded object containing any defined labor attribute ID/value pairs for the worker during this labor period
 closedts       | timestamp with time zone | No      | Time the record become closed - corresponds to time record was manually checked out (if manual) or last updated (if automated)
 lasteditts     | timestamp with time zone | No      | Timestamp of last change to the record by a user (including check in or check out). If undefined, the record was created automatically, and may still be updated by automated processing. Timestamp is RFC3339 format.
 lastedituserid | text                     | No      | UserID of the person who made the last manual change to this record.
 lasteditnotes  | text                     | No      | Notes provided by last user who edited the records, if any
 checkints      | timestamp with time zone | No      | Timestamp when a user created the record by checking in, in RFC3339 format. Only defined if manual check-in occurred.
 checkinuserid  | text                     | No | UserID of the person who created the record by checking in, if this is how the record was created.
 checkoutts     | timestamp with time zone | No | Timestamp when a user that completed the record by checking out, in RFC3339 format.
Only defined if manual check-out occurred. If checkInTS is defined, but checkOutTS is not, the record is still checked in. 
 checkoutuserid | text                     | No | UserID of the person who completed the record by checking out, if this is how the record was completed.
 verifiedts     | timestamp with time zone | No | UserID of the person who completed the record by checking out, if this is how the record was completed.
 verifieduserid | text                     | No | UserID of the person who last marked the record as verified.
 checkinstatus  | text                     | No | Current status of the labor record (none, automated, checkedin, checkedout)

### triva_worker_detections

Any tag detection data recorded for a worker while assigned to a project will be recorded here.  Any detection record will
be particular to a given date on the project, and a worker can have zero or more records for a given date.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid       | text                     | Yes     | Unique ID of the client
 projectid      | text                     | Yes     | ID of the project
 teamcompanyid  | text                     | Yes     | ID of the company of the assigned team (blank if no team)
 userid         | text                     | Yes     | ID of the worker
 startts        | timestamp with time zone | Yes     | Timestamp of the start of the record detection time
 endts          | timestamp with time zone | No      | Current ending time for the worker detection (this can change for currently ongoing detections).
 projectdate    | date                     | No      | Date of the recorded detection data (relative to the timezone of the project)
 laborvalues    | jsonb                    | No      | JSON encoded object containing any defined labor attribute ID/value pairs for the worker during this detection period
 lastlocationid | text                     | No      | Last location ID within the project where the tag was detected
 lastlocationts | timestamp with time zone | No      | Timestamp of the last detection of the tag within the project during this detection period
 locationranges | jsonb                    | No | JSON encoded object with a field for each location ID where the tag was detected during the period of the record, each with a value containing an array of time ranges (as RFC3339 timestamps) where the tag was detected at that corresponding location.

### triva_weather_alerts

National Weather Service alerts reported for the location of the project.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid       | text                     | Yes     | Unique ID of the client
 projectid      | text                     | Yes     | ID of the project
 id           | text                     | Yes | Unique NWS alert ID
 areadesc     | text                     | No | Human friendly summary of area affected by alert
 sentts       | timestamp with time zone | No | Timestamp when alert issued
 effectivets  | timestamp with time zone | No | Timestamp when alert is effective
 onsetts      | timestamp with time zone | No | Timestamp for the onset of conditions associated with alert
 expirests    | timestamp with time zone | No | Timestamp for expiration of the alert (if not replaced).
 endsts       | timestamp with time zone | No | Timestamp for the end of the conditions associated with the alerts
 severity     | text                     | No | Severity of the alert.
 certainty    | text                     | No | Certainty of the alert.
 urgency      | text                     | No | Urgency of the alert.
 event        | text                     | No | Type of alert - see https://api.weather.gov/alerts/types for list
 sendername   | text                     | No | Office issuing the alert
 headline     | text                     | No | Headline/summary of the alert
 description  | text                     | No | Detailed text describing the alert
 instruction  | text                     | No | Detailed text providing instruction on how to respond to the alert
 response     | text                     | No | Summary of response suggested to the alert
 polygon      | text[]                   | No | If provided, list of JSON latitude/longitide pairs for the area indicated by the alert
 geocodelist  | text[]                   | No | List of affected areas, using UGS (US Geophysical Survey) codes. List can include counties (??C???) or forecast zones (??Z???).
 replacedby   | text                     | No | If defined, alert has been superceded by a newer notice, with the given ID.
 replacedts   | timestamp with time zone | No | If defined, alert has been superceded by a newer notice, as of the given timestamp
 lastactivets | timestamp with time zone | No | Indicates the last time the alert was reported as active, when the weather service was last checked.
 isactive     | boolean                  | No | Indicates whether the alert is currently active (true) versus having expired or been replaced by a newer alert.

### triva_weather_conditions

History of hourly weather conditions associated with a given project.

   Column   | Type | Is Key? | Description |
 --------------- | ------- | ------- | --------------------
 clientid       | text                     | Yes     | Unique ID of the client
 projectid      | text                     | Yes     | ID of the project
 conditiontime    | timestamp with time zone | Yes    | Timestamp associated with conditions (hourly)
 actualtime       | timestamp with time zone | No | Time that the weather condition was collected by weather station 
 temp             | double precision         | No | Temperature measured, in degrees F.
 feelslike        | double precision         | No | 'Feels like' temperature measuted, in degrees F.
 dewpoint         | double precision         | No | Dew point temperature measured, in degrees F.
 humidity         | double precision         | No | Relative humidity measured, in percent RH.
 precip           | double precision         | No | Accumulated preciptation quantity, in inches
 snowdepth        | double precision         | No | Snow accumulation, in inches
 pressure         | double precision         | No | Atmospheric pressure measured, in millibars
 winddir          | double precision         | No | Measured wind direction, in degrees from North
 wind             | text                     | No | Measured wind direction (16 point compass rose - N, NW, NNW)
 windspeed        | double precision         | No | Measured wind speed, in miles per hour
 windgust         | double precision         | No | Measured wind gust speed, in miles per hour
 sky              | double precision         | No | Portion of the sky clear, in percent
 clouds           | text                     | No | Code for cloud conditions. Defined values: CL - Clear, FW - Mostly Sunny, SC - Partly Cloudy, BK - Mostly Cloudy, OV - Cloudy/Overcast
 weather          | text                     | No | Plain English summary of weather conditions
 weatherprimary   | text                     | No | Coded description of primary weather event. See https://www.aerisweather.com/support/docs/api/reference/weather-codes/
 icon             | text                     | No | Base name for icon summarizing primary weather.
 iconurl          | text                     | No | URL for icon summarizing primary weather. Icon at given URL is indefinitely cacheable (new icons will have new URLs). This icon will be 55 x 55 pixels.
 bigiconurl       | text                     | No | URL for icon summarizing primary weather. Icon at given URL is indefinitely cacheable (new icons will have new URLs). This icon will be 110 x 110 pixels.
 visibility       | double precision         | No | Predicted visibility in miles
 solarrad         | double precision         | No | Average solar radiation, in watts per square meter
 ceiling          | double precision         | No | Estimated height of cloud ceiling, in feet
 isday            | boolean                  | No | 
Indicates whether predicted period is considered day (true) or night (false)
 closeststationid | text                     | No | Indicates the unique ID of the closest weather station providing the given conditions deleted: type: boolean description: If true, the weather condition has been deleted version: type: integer format: int64 description: Version of the data set associated with the last update of this record
 uvindex          | double precision         | No | Ultraviolet (UV) index - from 0 to 12

### triva_versionsync

### triva_db_version
