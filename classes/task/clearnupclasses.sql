USE [CGS_Moodle]
GO

/****** Object:  StoredProcedure [cgs].[local_excursions_cleanup_classes]    Script Date: 12/03/2026 3:34:57 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Michael Vangelovski
-- Create date: 12 Mar 2026
-- Description: Bulk cleanup of obsolete X-prefixed classes not in valid list
-- =============================================
ALTER PROCEDURE [cgs].[local_excursions_cleanup_classes]
    @FileYear SMALLINT,
    @FileSemester SMALLINT,
    @ValidClassCodes NVARCHAR(MAX) = '[]'
AS
BEGIN
    SET NOCOUNT ON;

    -------------------------------------------------------------------
    -- 1. Parse valid class codes JSON into temp table
    -------------------------------------------------------------------
    CREATE TABLE #ValidCodes (ClassCode VARCHAR(15));
    INSERT INTO #ValidCodes (ClassCode)
    SELECT CAST(v.[value] AS VARCHAR(15))
    FROM OPENJSON(@ValidClassCodes) v;

    -------------------------------------------------------------------
    -- 2. DELETE StaffScheduleStudentClasses (child of StaffSchedule)
    -------------------------------------------------------------------
    DELETE sssc
    FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffScheduleStudentClasses] sssc
    WHERE sssc.ClassCode LIKE 'X%'
      AND sssc.FileYear = @FileYear
      AND sssc.FileSemester = @FileSemester
      AND sssc.ClassCode NOT IN (SELECT ClassCode FROM #ValidCodes);

    -------------------------------------------------------------------
    -- 3. DELETE StudentClasses
    -------------------------------------------------------------------
    DELETE sc
    FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StudentClasses] sc
    WHERE sc.ClassCode LIKE 'X%'
      AND sc.FileYear = @FileYear
      AND sc.FileSemester = @FileSemester
      AND sc.ClassCode NOT IN (SELECT ClassCode FROM #ValidCodes);

    -------------------------------------------------------------------
    -- 4. DELETE StaffSchedule (references SubjectClasses)
    -------------------------------------------------------------------
    DELETE ss
    FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[StaffSchedule] ss
    INNER JOIN [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[SubjectClasses] sc
            ON ss.SubjectClassesSeq = sc.SubjectClassesSeq
    WHERE sc.ClassCode LIKE 'X%'
      AND sc.FileYear = @FileYear
      AND sc.FileSemester = @FileSemester
      AND sc.ClassCode NOT IN (SELECT ClassCode FROM #ValidCodes);

    -------------------------------------------------------------------
    -- 5. DELETE SubjectClasses (parent table, deleted last)
    -------------------------------------------------------------------
    DELETE sc
    FROM [CGSSQLC0102\SYNERGETIC].[Synergetic_AUACT_CGS_PRD].[dbo].[SubjectClasses] sc
    WHERE sc.ClassCode LIKE 'X%'
      AND sc.FileYear = @FileYear
      AND sc.FileSemester = @FileSemester
      AND sc.ClassCode NOT IN (SELECT ClassCode FROM #ValidCodes);

    -------------------------------------------------------------------
    -- 6. Cleanup
    -------------------------------------------------------------------
    DROP TABLE #ValidCodes;

END
GO


