# Risk Version Control System

This document describes the version control system implemented for risks and classifications in the Moodle Activities plugin.

## Overview

The version control system allows administrators to:
- Create draft versions of risk configurations
- Edit risks and classifications in draft mode
- Publish versions to make them live
- Maintain a history of all versions
- Roll back to previous versions if needed

## Database Schema

### New Tables

#### `activities_risk_versions`
Stores version metadata:
- `id`: Primary key
- `version`: Version number (auto-incrementing)
- `is_published`: Boolean flag (1 = published, 0 = draft)
- `published_by`: Username of who published the version
- `timepublished`: Unix timestamp when published
- `timecreated`: Unix timestamp when created
- `description`: Optional description of the version

### Modified Tables

#### `activities_risks`
Added field:
- `version`: Version number this risk belongs to

#### `activities_classifications`
Added field:
- `version`: Version number this classification belongs to

#### `activities_risk_classifications`
Added field:
- `version`: Version number this relationship belongs to

## API Methods

### Version Management

- `get_published_version()`: Get the current published version number
- `get_draft_version()`: Get the next draft version number
- `get_working_version()`: Get the current working version (published if no draft, otherwise draft)
- `create_draft_version()`: Create a new draft version by copying the current published version
- `publish_version($description)`: Publish the current draft version
- `get_versions()`: Get all versions with their status
- `get_version_details($version)`: Get detailed information about a specific version
- `delete_version($version)`: Delete a draft version
- `has_draft_changes()`: Check if there are changes in the current draft

### Modified Risk/Classification Methods

All existing methods now support versioning:
- `get_classifications($version = null)`: Get classifications for a specific version
- `get_risks($version = null)`: Get risks for a specific version
- `save_classification($data)`: Automatically creates draft version if needed
- `save_risk($data)`: Automatically creates draft version if needed

## Workflow

### Normal Operation
1. Users view the published version by default
2. When an admin edits risks/classifications, a draft version is automatically created
3. Changes are made in the draft version
4. Admin clicks "Publish" to make the draft the new published version
5. Previous published version becomes archived

### Creating a New Draft
1. Admin clicks "Create Draft" button
2. System copies all data from current published version to new draft
3. Admin can now make changes without affecting the live version

### Publishing Changes
1. Admin makes changes in draft mode
2. Admin clicks "Publish Version" button
3. System marks current published version as unpublished
4. System marks draft version as published
5. Changes are now live for all users

## Frontend Integration

### Risk Settings Page (`Settings.tsx`)
- Shows current published and draft version badges
- Version control section with version history table
- Create Draft and Publish Version buttons
- Draft mode alert when editing

### Risk Assessment Page (`Risk.tsx`)
- Automatically uses published version for display
- No changes needed - versioning is transparent to end users

## Installation

1. Run the database upgrade script:
   ```bash
   php admin/cli/upgrade.php
   ```

2. The upgrade will:
   - Add version fields to existing tables
   - Create the `activities_risk_versions` table
   - Create initial version 1 with existing data marked as published

## Testing

Run the test script to verify the system:
```bash
php test_version_control.php
```

## Security

- Only users with CAL reviewer permissions can manage versions
- Published versions cannot be deleted
- Draft versions can only be deleted by the system or admins
- All version operations are logged

## Future Enhancements

- Version comparison/diff functionality
- Rollback to previous versions
- Version branching for different environments
- Automated version archiving
- Version approval workflows 