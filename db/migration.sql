/*
-- Delete everything to start again.
DELETE FROM mdl_activities
DELETE FROM mdl_activities_approvals
DELETE FROM mdl_activities_assessments
DELETE FROM mdl_activities_cal_sync
DELETE FROM mdl_activities_comments
DELETE FROM mdl_activities_conflicts
DELETE FROM mdl_activities_emails
DELETE FROM mdl_activities_permissions
DELETE FROM mdl_activities_staff
DELETE FROM mdl_activities_students
DELETE FROM mdl_activities_students_temp
DELETE FROM mdl_activities_sys_emails

*/


-- Start the migration
BEGIN TRANSACTION;

BEGIN TRY


-- copy excursions
INSERT INTO mdl_activities (
    idnumber,
    creator,
    activityname,
    activitytype,
    campus,
    location,
    timestart,
    timeend,
    studentlistjson,
    description,
    transport,
    cost,
    status,
    permissions,
    permissionslimit,
    permissionsdueby,
    deleted,
    riskassessment,
    attachments,
    timecreated,
    timemodified,
    staffincharge,
    staffinchargejson,
    planningstaffjson,
    accompanyingstaffjson,
    otherparticipants,
    absencesprocessed,
    remindersprocessed,
    classrollprocessed,
    categoriesjson,
    colourcategory,
    areasjson,
    displaypublic,
    pushpublic,
    timesynclive,
    timesyncplanning,
    stepname,
    oldexcursionid
)
SELECT
    CONCAT('x', x.id) AS idnumber, -- Default or logic for idnumber
    e.creator,
    e.activityname, -- Using the activity name from mdl_excursions_events
    x.activitytype,
    x.campus,
    e.location,
    e.timestart,
    e.timeend,
    x.studentlistjson,
    e.notes AS description, -- Notes from mdl_excursions_events
    x.transport,
    x.cost,
    x.status,
    x.permissions,
    x.permissionslimit,
    x.permissionsdueby,
    e.deleted,
    x.riskassessment,
    x.attachments,
    e.timecreated,
    e.timemodified,
    x.staffincharge,
    x.staffinchargejson,
    x.planningstaffjson,
    x.accompanyingstaffjson,
    x.otherparticipants,
    x.absencesprocessed,
    x.remindersprocessed,
    1 AS classrollprocessed, -- Default value
    e.categoriesjson,
    e.colourcategory,
    e.areasjson,
    e.displaypublic,
    e.pushpublic,
    e.timesynclive,
    e.timesyncplanning,
    '' AS stepname, -- Default value
    x.id
FROM mdl_excursions x
JOIN mdl_excursions_events e ON x.id = e.activityid
WHERE e.assessment = 0
AND e.activityid > 0;



-- copy calendar events
INSERT INTO mdl_activities (
    idnumber,
    creator,
    activityname,
    activitytype,
    campus,
    location,
    timestart,
    timeend,
    studentlistjson,
    description,
    transport,
    cost,
    status,
    permissions,
    permissionslimit,
    permissionsdueby,
    deleted,
    riskassessment,
    attachments,
    timecreated,
    timemodified,
    staffincharge,
    staffinchargejson,
    planningstaffjson,
    accompanyingstaffjson,
    otherparticipants,
    absencesprocessed,
    remindersprocessed,
    classrollprocessed,
    categoriesjson,
    colourcategory,
    areasjson,
    displaypublic,
    pushpublic,
    timesynclive,
    timesyncplanning,
    stepname,
    oldexcursionid
)
SELECT
    CONCAT('e', e.id) AS idnumber, -- Generate unique idnumber for events
    e.creator,
    e.activityname, -- Use event name since no excursion exists
    'calendar' AS activitytype, -- Default activity type for standalone events
    e.campus,
    e.location,
    e.timestart,
    e.timeend,
    '[]' AS studentlistjson, -- Default empty JSON
    e.notes AS description,
    '' AS transport, -- No transport data available
    0 AS cost, -- Default cost
    CASE 
        WHEN e.status = 0 THEN 2 
        WHEN e.status = 1 THEN 3 
        ELSE e.status 
    END AS status, -- Adjusted status values
    0 AS permissions, -- Default empty permissions JSON
    0 AS permissionslimit,
    0 AS permissionsdueby,
    e.deleted,
    '{}' AS riskassessment, -- Default empty risk assessment JSON
    '{}' AS attachments, -- Default empty attachments JSON
    e.timecreated,
    e.timemodified,
    e.owner AS staffincharge, -- No staff assigned
    e.ownerjson AS staffinchargejson, -- Default empty JSON
    '[]' AS planningstaffjson, -- Default empty JSON
    '[]' AS accompanyingstaffjson, -- Default empty JSON
    '[]' AS otherparticipants, -- Default empty JSON
    1 AS absencesprocessed, -- Default value
    1 AS remindersprocessed, -- Default value
    1 AS classrollprocessed, -- Default to processed
    e.categoriesjson, -- Default empty JSON
    e.colourcategory,
    e.areasjson, 
    e.displaypublic,
    e.pushpublic, 
    e.timesynclive,
    e.timesyncplanning,
    '' AS stepname,
    0 AS oldexcursionid -- No corresponding excursion
FROM mdl_excursions_events e
WHERE e.assessment = 0
AND e.activityid = 0;



-- migrate assessments.
INSERT INTO mdl_activities_assessments (
    courseid,      -- Maps to courseid in mdl_excursions_events
    cmid,          -- Set to 0 as no direct mapping exists
    creator,       -- Maps to creator in mdl_excursions_events
    name,          -- Maps to activityname in mdl_excursions_events
    url,           -- Maps to assessmenturl in mdl_excursions_events
    timestart,       -- Maps to timestart in mdl_excursions_events
    timeend,       -- Maps to timeend in mdl_excursions_events
    deleted,       -- Maps to deleted in mdl_excursions_events
    timecreated,   -- Maps to timecreated in mdl_excursions_events
    timemodified   -- Maps to timemodified in mdl_excursions_events
)
SELECT 
    e.courseid,        -- Migrate courseid from mdl_excursions_events
    0 AS cmid,         -- Set cmid to 0 (adjust if specific mapping is required)
    e.creator,         -- Migrate creator from mdl_excursions_events
    e.activityname,    -- Migrate activityname from mdl_excursions_events to name
    e.assessmenturl,   -- Migrate assessmenturl from mdl_excursions_events to url
    e.timestart,       -- Migrate timestart from mdl_excursions_events
    e.timeend,         -- Migrate timeend from mdl_excursions_events
    e.deleted,         -- Migrate deleted status
    e.timecreated,     -- Migrate timecreated
    e.timemodified     -- Migrate timemodified
FROM mdl_excursions_events e
WHERE e.assessment = 1;            -- Only migrate records where assessment = 1


-- Migration for `mdl_excursions_approvals` to `mdl_activities_approvals`
INSERT INTO mdl_activities_approvals (activityid, type, username, nominated, sequence, description, status, invalidated, skip, timemodified)
SELECT new_activities.id, ea.type, ea.username, ea.nominated, ea.sequence, ea.description, ea.status, ea.invalidated, ea.skip, ea.timemodified
FROM mdl_excursions_approvals ea
JOIN mdl_excursions e ON ea.activityid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;

-- Migration for `mdl_excursions_comments` to `mdl_activities_comments`
INSERT INTO mdl_activities_comments (activityid, username, comment, timecreated)
SELECT new_activities.id, ec.username, ec.comment, ec.timecreated
FROM mdl_excursions_comments ec
JOIN mdl_excursions e ON ec.activityid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;

-- Migration for `mdl_excursions_events_sync` to `mdl_activities_cal_sync`
/*INSERT INTO mdl_activities_cal_sync (activityid, calendar, externalid, changekey, weblink, status, timesynced)
SELECT new_activities.id, ees.calendar, ees.externalid, ees.changekey, ees.weblink, ees.status, ees.timesynced
FROM mdl_excursions_events_sync ees
JOIN mdl_excursions e ON ees.eventid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;*/


-- Migration for `mdl_excursions_permissions` to `mdl_activities_permissions`
INSERT INTO mdl_activities_permissions (activityid, studentusername, parentusername, queueforsending, queuesendid, response, timecreated, timeresponded)
SELECT new_activities.id, ep.studentusername, ep.parentusername, ep.queueforsending, ep.queuesendid, ep.response, ep.timecreated, ep.timeresponded
FROM mdl_excursions_permissions ep
JOIN mdl_excursions e ON ep.activityid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;

-- Migration for `mdl_excursions_planning_staff` and `mdl_excursions_staff` to `mdl_activities_staff`
-- Planning staff
INSERT INTO mdl_activities_staff (activityid, username, usertype)
SELECT new_activities.id, eps.username, 'planning'
FROM mdl_excursions_planning_staff eps
JOIN mdl_excursions e ON eps.activityid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;

-- Accompanying staff
INSERT INTO mdl_activities_staff (activityid, username, usertype)
SELECT new_activities.id, es.username, 'accompany'
FROM mdl_excursions_staff es
JOIN mdl_excursions e ON es.activityid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;

-- Migration for `mdl_excursions_students` to `mdl_activities_students`
INSERT INTO mdl_activities_students (activityid, username)
SELECT new_activities.id, es.username
FROM mdl_excursions_students es
JOIN mdl_excursions e ON es.activityid = e.id
JOIN mdl_activities new_activities ON e.id = new_activities.oldexcursionid;


-- Update staffinchargejson in mdl_activities
UPDATE mdl_activities
SET staffinchargejson = 
    CASE 
        WHEN staffinchargejson IS NULL OR LTRIM(RTRIM(staffinchargejson)) = '' OR LTRIM(RTRIM(staffinchargejson)) = '[]' THEN '[]'
        ELSE (
            SELECT JSON_QUERY(
				'{"un":"' + CONVERT(NVARCHAR(MAX), JSON_VALUE(value, '$.idfield')) + 
				'","fn":"' + CONVERT(NVARCHAR(MAX), LTRIM(RTRIM(SUBSTRING(JSON_VALUE(value, '$.fullname'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.fullname')) - 1)))) + 
				'","ln":"' + CONVERT(NVARCHAR(MAX), LTRIM(RTRIM(SUBSTRING(JSON_VALUE(value, '$.fullname'), CHARINDEX(' ', JSON_VALUE(value, '$.fullname')) + 1, LEN(JSON_VALUE(value, '$.fullname')))))) + 
				'"}'
            )
            FROM OPENJSON(staffinchargejson)
        )
    END
WHERE staffinchargejson IS NOT NULL;



-- Update planningstaffjson in mdl_activities
UPDATE mdl_activities
SET planningstaffjson = 
    CASE 
        WHEN planningstaffjson IS NULL OR LTRIM(RTRIM(planningstaffjson)) = '' OR LTRIM(RTRIM(planningstaffjson)) = '[]' THEN '[]'
        ELSE (
            SELECT JSON_QUERY(
                '[' + STRING_AGG(
                    ('{"un":"' + CONVERT(NVARCHAR(MAX), JSON_VALUE(value, '$.idfield')) + 
                    '","fn":"' + CONVERT(NVARCHAR(MAX), LTRIM(RTRIM(SUBSTRING(JSON_VALUE(value, '$.fullname'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.fullname')) - 1)))) + 
                    '","ln":"' + CONVERT(NVARCHAR(MAX), LTRIM(RTRIM(SUBSTRING(JSON_VALUE(value, '$.fullname'), CHARINDEX(' ', JSON_VALUE(value, '$.fullname')) + 1, LEN(JSON_VALUE(value, '$.fullname')))))) + 
                    '"}')
                , ','
                ) + ']'
            )
            FROM OPENJSON(planningstaffjson)
        )
    END
WHERE planningstaffjson IS NOT NULL;


-- Update accompanyingstaffjson in mdl_activities
UPDATE mdl_activities
SET accompanyingstaffjson = 
    CASE 
        WHEN accompanyingstaffjson IS NULL OR LTRIM(RTRIM(accompanyingstaffjson)) = '' OR LTRIM(RTRIM(accompanyingstaffjson)) = '[]' THEN '[]'
        ELSE (
            SELECT JSON_QUERY(
                '[' + STRING_AGG(
                    ('{"un":"' + CONVERT(NVARCHAR(MAX), JSON_VALUE(value, '$.idfield')) + 
                    '","fn":"' + CONVERT(NVARCHAR(MAX), LTRIM(RTRIM(SUBSTRING(JSON_VALUE(value, '$.fullname'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.fullname')) - 1)))) + 
                    '","ln":"' + CONVERT(NVARCHAR(MAX), LTRIM(RTRIM(SUBSTRING(JSON_VALUE(value, '$.fullname'), CHARINDEX(' ', JSON_VALUE(value, '$.fullname')) + 1, LEN(JSON_VALUE(value, '$.fullname')))))) + 
                    '"}')
                , ','
                ) + ']'
            )
            FROM OPENJSON(accompanyingstaffjson)
        )
    END
WHERE accompanyingstaffjson IS NOT NULL;




COMMIT TRANSACTION; -- Commit the transaction if everything succeeds
PRINT 'Migration completed successfully.';


END TRY
BEGIN CATCH
  -- Roll back the transaction if there's an error
    ROLLBACK TRANSACTION;
    PRINT 'Migration failed. Changes have been rolled back.';

    -- Optionally, log the error details
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;

    SELECT 
        @ErrorMessage = ERROR_MESSAGE(),
        @ErrorSeverity = ERROR_SEVERITY(),
        @ErrorState = ERROR_STATE();

    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;

select * from mdl_activities
--select * FROM mdl_files where component = 'local_excursions' and itemid = 2038
--select * from mdl_activities where id = 3829