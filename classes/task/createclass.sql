USE [CGS_Moodle]
GO

/****** Object:  StoredProcedure [cgs].[local_excursions_create_class]    Script Date: 12/03/2026 3:16:26 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



ALTER PROCEDURE [cgs].[local_excursions_create_class]
    @FileYear SMALLINT,
    @FileSemester SMALLINT,
    @ClassCampus VARCHAR(3),
    @ClassCode VARCHAR(15),
    @Description VARCHAR(100),
    @StaffID INTEGER,
    @leavingdate DATETIME,
    @returningdate DATETIME,
    @Students NVARCHAR(MAX) = '[]'
AS
BEGIN

	SET NOCOUNT ON;
	SET XACT_ABORT ON;

	DECLARE @SubjectClassesSeq INT = 0;
	DECLARE @StaffScheduleSeq INT = 0;

	------------------------------------------------------------
	-- 1. Find existing class
	------------------------------------------------------------

	SELECT TOP 1
		@SubjectClassesSeq = LinkedSubjectClassesSeq
	FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[SubjectClasses]
	WHERE ClassCode = @ClassCode;

	IF @SubjectClassesSeq IS NULL
		SET @SubjectClassesSeq = 0;

	------------------------------------------------------------
	-- 2. Create class if missing
	------------------------------------------------------------

	IF @SubjectClassesSeq = 0
	BEGIN

		EXEC [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[spiSubjectClasses]
			'C',
			@FileYear,
			@FileSemester,
			@ClassCampus,
			@ClassCode,
			@Description,
			NULL,
			NULL,
			NULL,
			NULL,
			@StaffID,
			NULL,
			@SubjectClassesSeqOut = @SubjectClassesSeq OUTPUT;

	END

	------------------------------------------------------------
	-- 2b. Update existing class description
	------------------------------------------------------------

	IF @SubjectClassesSeq > 0
	BEGIN
		UPDATE [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[SubjectClasses]
		SET Description = @Description
		WHERE SubjectClassesSeq = @SubjectClassesSeq;
	END

	------------------------------------------------------------
	-- 3. Get staff schedule
	------------------------------------------------------------

	SELECT TOP 1
		@StaffScheduleSeq = StaffScheduleSeq
	FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffSchedule]
	WHERE SubjectClassesSeq = @SubjectClassesSeq
	ORDER BY StaffScheduleSeq DESC;

	IF @StaffScheduleSeq IS NULL
		SET @StaffScheduleSeq = 0;

	------------------------------------------------------------
	-- 4. Update schedule if exists
	------------------------------------------------------------

	IF @StaffScheduleSeq > 0
	BEGIN

		UPDATE [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffSchedule]
		SET
			StaffID = @StaffID,
			ScheduleDateTimeFrom = @leavingdate,
			ScheduleDateTimeTo = @returningdate,
			ScheduleDateFrom = @leavingdate,
			ScheduleTimeFrom = @leavingdate,
			ScheduleDateTo = @returningdate,
			ScheduleTimeTo = @returningdate
		WHERE StaffScheduleSeq = @StaffScheduleSeq;

	END
	ELSE
	BEGIN

	------------------------------------------------------------
	-- 5. Insert new staff schedule
	------------------------------------------------------------

		INSERT INTO [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffSchedule]
		(
			StaffScheduleDefinitionSeq,
			StaffID,
			ScheduleDateTimeFrom,
			ScheduleDateTimeTo,
			ScheduleDateFrom,
			ScheduleTimeFrom,
			ScheduleDateTo,
			ScheduleTimeTo,
			Comment,
			Room,
			TeamCode,
			ParentStaffScheduleSeq,
			AttendanceCreatedByDate,
			AttendanceCreatedByID,
			AttendanceModifiedByDate,
			AttendanceModifiedByID,
			SubjectClassesSeq,
			TimesheetsSeq,
			ClassType,
			ModifiedDatetime,
			LocationCode,
			StaffScheduleTypeCode,
			Results,
			SummaryNotes,
			Opposition,
			ConfirmedDateTime,
			ConfirmedByUser,
			SystemProcessNumber
		)
		VALUES
		(
			0,
			@StaffID,
			@leavingdate,
			@returningdate,
			@leavingdate,
			@leavingdate,
			@returningdate,
			@returningdate,
			'',
			'',
			'',
			NULL,
			NULL,
			'0',
			NULL,
			'0',
			@SubjectClassesSeq,
			NULL,
			'',
			GETDATE(),
			NULL,
			NULL,
			'',
			'',
			'',
			NULL,
			'',
			NULL
		);

		-- SCOPE_IDENTITY() does not work across linked servers, so re-fetch.
		SELECT TOP 1
			@StaffScheduleSeq = StaffScheduleSeq
		FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffSchedule]
		WHERE SubjectClassesSeq = @SubjectClassesSeq
		ORDER BY StaffScheduleSeq DESC;

	END

	------------------------------------------------------------
	-- 6. Bulk insert/delete students from JSON array
	------------------------------------------------------------

	IF @Students IS NOT NULL AND @Students <> '[]'
	BEGIN

		-- 6a. Insert students into both tables (per-student to avoid linked server bulk issues).
		DECLARE @StudentID INTEGER;
		DECLARE student_cursor CURSOR LOCAL FAST_FORWARD FOR
			SELECT CAST(s.[value] AS INTEGER)
			FROM OPENJSON(@Students) s;

		OPEN student_cursor;
		FETCH NEXT FROM student_cursor INTO @StudentID;

		WHILE @@FETCH_STATUS = 0
		BEGIN
			-- Insert into StaffScheduleStudentClasses if not exists.
			IF NOT EXISTS (
				SELECT 1
				FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffScheduleStudentClasses]
				WHERE [ClassCode] = @ClassCode
				AND [ID] = @StudentID
				AND [FileYear] = @FileYear
				AND [FileSemester] = @FileSemester
			)
			BEGIN
				INSERT INTO [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffScheduleStudentClasses]
					([StaffScheduleSeq], [FileType], [FileYear], [FileSemester], [ClassCampus], [ClassCode], [ID], [AttendedFlag], [SubjectClassesSeq])
				VALUES
					(@StaffScheduleSeq, 'C', @FileYear, @FileSemester, @ClassCampus, @ClassCode, @StudentID, NULL, @SubjectClassesSeq);
			END

			-- Insert into StudentClasses via spiStudentClasses if not exists.
			IF NOT EXISTS (
				SELECT 1
				FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StudentClasses]
				WHERE [ClassCode] = @ClassCode
				AND [ID] = @StudentID
				AND [FileYear] = @FileYear
				AND [FileSemester] = @FileSemester
			)
			BEGIN
				EXEC [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[spiStudentClasses]
					'C', @FileYear, @FileSemester, @StudentID, @ClassCampus, @ClassCode, NULL, @SubjectClassesSeq;
			END

			FETCH NEXT FROM student_cursor INTO @StudentID;
		END

		CLOSE student_cursor;
		DEALLOCATE student_cursor;

		-- 6b. Delete students no longer in the JSON array from both tables.
		-- Build a temp table from JSON to use in NOT IN across linked server.
		CREATE TABLE #StudentList (ID INTEGER);
		INSERT INTO #StudentList (ID)
		SELECT CAST(s.[value] AS INTEGER) FROM OPENJSON(@Students) s;

		DELETE ss
		FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffScheduleStudentClasses] ss
		WHERE ss.[ClassCode] = @ClassCode
		AND ss.[FileYear] = @FileYear
		AND ss.[FileSemester] = @FileSemester
		AND ss.[ID] NOT IN (SELECT ID FROM #StudentList);

		DELETE sc
		FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StudentClasses] sc
		WHERE sc.[ClassCode] = @ClassCode
		AND sc.[FileYear] = @FileYear
		AND sc.[FileSemester] = @FileSemester
		AND sc.[ID] NOT IN (SELECT ID FROM #StudentList);

		DROP TABLE #StudentList;

	END

	------------------------------------------------------------
	-- 7. StopDate update (moved later to avoid race issues)
	------------------------------------------------------------

	UPDATE [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StudentClasses]
	SET StopDate = DATEADD(DAY,1,@returningdate)
	WHERE SubjectClassesSeq = @SubjectClassesSeq;

	------------------------------------------------------------
	-- 8. Return values
	------------------------------------------------------------

	SELECT
		@StaffScheduleSeq AS StaffScheduleSeq,
		@SubjectClassesSeq AS SubjectClassesSeq;

	END







GO


