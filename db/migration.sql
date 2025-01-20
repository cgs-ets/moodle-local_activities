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
    e.status,
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
    0 AS classrollprocessed, -- Default value
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
WHERE x.timecreated > 1735689600;





-- Migration for `mdl_excursions_approvals` to `mdl_activity_approvals`
INSERT INTO mdl_activity_approvals (activityid, type, username, nominated, sequence, description, status, invalidated, skip, timemodified)
SELECT e.id, ea.type, ea.username, ea.nominated, ea.sequence, ea.description, ea.status, ea.invalidated, ea.skip, ea.timemodified
FROM mdl_excursions_approvals ea
JOIN mdl_excursion e ON ea.activityid = e.id
WHERE e.timecreated > 1735689600;

-- Migration for `mdl_excursions_comments` to `mdl_activity_comments`
INSERT INTO mdl_activity_comments (activityid, username, comment, timecreated)
SELECT e.id, ec.username, ec.comment, ec.timecreated
FROM mdl_excursions_comments ec
JOIN mdl_excursion e ON ec.activityid = e.id
WHERE e.timecreated > 1735689600;

-- Migration for `mdl_excursions_events_areas` to `mdl_activity_cal_areas`
INSERT INTO mdl_activity_cal_areas (activityid, area)
SELECT e.id, eea.area
FROM mdl_excursions_events_areas eea
JOIN mdl_excursion e ON eea.eventid = e.id
WHERE e.timecreated > 1735689600;

-- Migration for `mdl_excursions_events_sync` to `mdl_activity_cal_sync`
INSERT INTO mdl_activity_cal_sync (activityid, calendar, externalid, changekey, weblink, status, timesynced)
SELECT e.id, ees.calendar, ees.externalid, ees.changekey, ees.weblink, ees.status, ees.timesynced
FROM mdl_excursions_events_sync ees
JOIN mdl_excursion e ON ees.eventid = e.id
WHERE e.timecreated > 1735689600;

-- Migration for `mdl_excursions_event_conflicts` to `mdl_activity_conflicts`
--INSERT INTO mdl_activity_conflicts (activityid1, activityid2, event2istype, status)
--SELECT e1.id, e2.id, eec.event2istype, eec.status
--FROM mdl_excursions_event_conflicts eec
--JOIN mdl_excursion e1 ON eec.eventid1 = e1.id
--JOIN mdl_excursion e2 ON eec.eventid2 = e2.id
--WHERE e1.timecreated > 1735689600;

-- Migration for `mdl_excursions_permissions` to `mdl_activity_permissions`
INSERT INTO mdl_activity_permissions (activityid, studentusername, parentusername, queueforsending, queuesendid, response, timecreated, timeresponded)
SELECT e.id, ep.studentusername, ep.parentusername, ep.queueforsending, ep.queuesendid, ep.response, ep.timecreated, ep.timeresponded
FROM mdl_excursions_permissions ep
JOIN mdl_excursion e ON ep.activityid = e.id
WHERE e.timecreated > 1735689600;

-- Migration for `mdl_excursions_planning_staff` and `mdl_excursions_staff` to `mdl_activity_staff`
INSERT INTO mdl_activity_staff (activityid, username, usertype)
SELECT e.id, eps.username, 'planning'
FROM mdl_excursions_planning_staff eps
JOIN mdl_excursion e ON eps.activityid = e.id
WHERE e.timecreated > 1735689600;

INSERT INTO mdl_activity_staff (activityid, username, usertype)
SELECT e.id, es.username, 'accompany'
FROM mdl_excursions_staff es
JOIN mdl_excursion e ON es.activityid = e.id
WHERE e.timecreated > 1735689600;

-- Migration for `mdl_excursions_students` to `mdl_activity_students`
INSERT INTO mdl_activity_students (activityid, username)
SELECT e.id, es.username
FROM mdl_excursions_students es
JOIN mdl_excursion e ON es.activityid = e.id
WHERE e.timecreated > 1735689600;

-- Copy files...
-- Insert copied records into mdl_files with updated values
INSERT INTO mdl_files (
    contenthash, pathnamehash, contextid, component, filearea, itemid, filepath, filename, userid, filesize, mimetype,
    status, source, author, license, timecreated, timemodified, sortorder, referencefileid
)
SELECT 
    contenthash,
    pathnamehash,
    contextid,
    'local_activities' AS component, -- Update component to 'local_activities'
    CASE 
        WHEN filearea = 'ra' THEN 'riskassessment' -- Map 'ra' to 'riskassessment'
        ELSE filearea -- Retain other fileareas as they are
    END AS filearea,
    new_activities.id AS itemid, -- Use the new mdl_activities.id based on oldexcursionid mapping
    filepath,
    filename,
    userid,
    filesize,
    mimetype,
    status,
    source,
    author,
    license,
    timecreated,
    timemodified,
    sortorder,
    referencefileid
FROM mdl_files
INNER JOIN mdl_excursions 
    ON mdl_files.itemid = mdl_excursions.id
INNER JOIN mdl_activities AS new_activities
    ON mdl_excursions.id = new_activities.oldexcursionid -- Map excursions to activities using oldexcursionid
WHERE mdl_files.component = 'local_excursions';
