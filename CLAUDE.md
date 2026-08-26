# local_activities — architecture and conventions

CGS "Activity Planning". A Moodle **local plugin** for planning excursions, incursions,
calendar entries and assessments, with a multi-step approval workflow, parent permissions,
risk assessments and Outlook sync.

---

## 1. What this is (and what it is not)

This is a **React 18 + TypeScript + Vite SPA** hosted by a single PHP shell page
(`index.php`), talking to a **hand-rolled JSON-RPC router** (`service.php`).

It deliberately does **not** use most of the Moodle framework. Before reaching for a
familiar Moodle pattern, check this list — none of these exist here, and adding one would
not be wired into anything:

| Not used | Used instead |
|---|---|
| `db/services.php`, `external_api` | `service.php` + `classes/lib/service.lib.php` router |
| `\core\persistent` | hand-rolled `Activity` active record |
| `moodleform` / `formslib` | Zustand store + a rule table (§7) |
| `classes/output/`, renderers, renderables | React components |
| AMD modules, `$PAGE->requires->js_call_amd()` | Vite bundle loaded by `bootstrap.php` |
| Mustache for UI | Mustache for **email and PDF only** |
| `message_send()` | email queue + forked mailer (§10) |
| `has_capability()` for authorisation | `CampusRoles` profile field (§4) |
| events / observers / `db/events.php` | nothing — no events are fired |
| `\core\notification` | JSON error responses |

What **is** normal Moodle: `db/install.xml`, `db/upgrade.php`, `db/tasks.php`,
`classes/task/*` scheduled tasks, `settings.php`, the file API, and `lib.php`'s
`local_activities_pluginfile()`.

---

## 2. Repository map

```
classes/
  api/     <domain>.api.php   — trait <domain>_api. Thin: parse params, delegate, return.
           api.php            — class API, composes all nine traits. The RPC entry point.
  lib/     <domain>.lib.php   — class <domain>_lib. Static service class. All business logic.
           activity.class.php — class Activity. The one model.
  task/    cron_<verb>_<noun>.php — scheduled tasks (autoloadable, unlike lib/ and api/)
db/        install.xml (24 tables), upgrade.php, tasks.php, access.php, messages.php
frontend/
  src/
    pages/<Page>/<Page>.tsx   + co-located components/
    components/               — cross-page components only
    hooks/                    — useFetch (canonical), useAjax (legacy)
    stores/                   — Zustand: formStore, stateStore, workflowStore, filterStore, calViewStore
    utils/, types/
  dist/                       — BUILT ASSETS, COMMITTED TO GIT (see §12)
templates/                    — email_*.mustache + risk_assessment.mustache. No UI templates.
lang/en/local_activities.php  — admin settings + cron task names only. UI copy is hardcoded in JSX.

index.php          SPA shell. Injects window.appdata.config, calls bootstrap().
service.php        Authenticated AJAX router (require_login + require_sesskey).
service-public.php Same router, NO login and NO sesskey. See §13.
bootstrap.php      Vite dev/prod asset bridge + SPA deep-link URL helpers.
config.php         local_activities_config::WORKFLOW — the entire approval chain. GITIGNORED.
config.sample.php  The tracked template for the above.
upload.php         Temp-dir file upload endpoint (used directly by FileUploader, not the router).
ical.php           Public unauthenticated iCal feed, rate-limited.
generate.php       PDF / spreadsheet generation.
lib.php            Only local_activities_pluginfile().
```

**`config.php` is gitignored but the code depends on it.** When adding or changing a workflow
step, edit **both** `config.php` (the live one) and `config.sample.php` (the tracked template),
or the change is invisible to everyone else.

---

## 3. The request lifecycle

Every data call in the app follows this path. Learn it before writing anything.

```
useFetch().call({ query: { methodname: 'local_activities-get_activity', id } })
  │
  ├─ createUrl()                    frontend/src/utils/index.ts
  │    defaults to wwwroot + '/local/activities/service.php'
  │    auto-appends sesskey from getConfig()
  │
  ├─ service.php                    require_login(); require_sesskey(); reject guests
  │    GET  → methodname + query params
  │    POST → JSON body { methodname, args, format }
  │
  ├─ service_lib::call_service_function()      classes/lib/service.lib.php:68
  │    service_function_info() splits 'local_activities-get_activity' on '-'
  │      → class  local_activities\API
  │      → method get_activity
  │      → path   classes/api/api.php
  │    authorisation: unless the method is in PUBLIC_FUNCTIONS or PARENT_FUNCTIONS,
  │                   utils_lib::require_staff() is enforced
  │
  ├─ local_activities\API::get_activity()      classes/api/activities.api.php (trait)
  │    required_param('id', PARAM_INT) → delegate
  │
  └─ activities_lib::get_activity($id)         classes/lib/activities.lib.php
       │
       └─ returns → { error: false, data: ... }
                or  { error: true,  exception: { message, ... } }
```

**Wire format for `methodname` is always `<component>-<method>`.** The router is generic —
it can dispatch into any `local_*` plugin's `classes/api/api.php`.

The frontend reads failures as `response.error` / `response.exception?.message`.

---

## 4. Backend conventions

### Three layers, strictly

1. **`classes/api/<domain>.api.php`** — a `trait <domain>_api`. Methods are thin: read
   params, call the lib, return. No business logic, no `$DB`.
2. **`classes/lib/<domain>.lib.php`** — a `class <domain>_lib` of `public static` methods.
   All business logic and all `$DB` access.
3. **`classes/lib/activity.class.php`** — the single `Activity` model.

### Adding an API method

Add a `static public function` to the relevant trait. **That is all.** `API` already composes
all nine traits (`classes/api/api.php`), so the method is immediately callable as
`local_activities-<method>`. Only edit `api.php` when introducing a whole new domain trait.

```php
// classes/api/activities.api.php — GET style: no args, read $_GET directly
static public function get_activity() {
    $id = required_param('id', PARAM_INT);
    return activities_lib::get_activity($id);
}

// POST style: takes $args (the decoded JSON body), destructured
static public function update_status($args) {
    ['id' => $id, 'status' => $status] = $args;
    return activities_lib::update_status($id, $status);
}
```

**GET methods take no arguments** and use `required_param()` / `optional_param()`.
**POST methods take `$args`** and destructure with list-assignment.

> **Gap to be aware of:** POST `args` are never run through `clean_param()` anywhere in this
> codebase. When you add a POST method, validate and cast explicitly in the lib. Do not
> assume the router sanitised anything but `methodname` and `format`.

### Naming

| Thing | Convention | Example |
|---|---|---|
| API file / trait | `<domain>.api.php` / `<domain>_api` | `workflow.api.php`, `trait workflow_api` |
| Lib file / class | `<domain>.lib.php` / `<domain>_lib` | `risks.lib.php`, `class risks_lib` |
| Task file / class | `cron_<verb>_<noun>.php` | `cron_send_approval_reminders` |
| Methods | `public static`, verb-first snake_case | `get_*`, `save_*`, `search_*`, `is_*`, `has_*`, `send_*`, `sync_*` |
| Read families | `get_for_<audience>()`, `get_by_<key>()` | `get_for_approver()`, `get_by_ids()` |
| Decorators | `*_helper()`, `*_stub()` | `status_helper()`, `user_stub()` |
| Table constants | `const TABLE_<UPPER>` on the owning lib | `TABLE_ACTIVITY_STUDENTS` |
| Status enums | `const <DOMAIN>_STATUS_<STATE>` | `ACTIVITY_STATUS_INREVIEW` |

API trait methods are written `static public function` (that order) by convention.

### No autoloading for lib/ and api/

Filenames are `*.lib.php` / `*.api.php`, which Moodle's autoloader cannot resolve. Every file
opens with explicit requires, then `use` aliases:

```php
namespace local_activities\api;
defined('MOODLE_INTERNAL') || die();
require_once(__DIR__.'/../lib/activities.lib.php');
use \local_activities\lib\activities_lib;
```

`classes/task/` **is** autoloadable — keep those files named `cron_*.php` matching the class.

Composer libraries are pulled in ad hoc where used:
`require_once($CFG->dirroot . '/local/activities/vendor/autoload.php');`

### Authorisation

The declared capability `local/activities:manage` in `db/access.php` is **never checked**.
Real authorisation is the `CampusRoles` custom user profile field:

```php
utils_lib::require_staff()    // throws unless CampusRoles contains 'staff'
utils_lib::is_user_staff()
utils_lib::is_user_parent()
utils_lib::is_user_approver()
```

Per-activity edit rights come from `Activity::get_other_values()`, exported as `usercanedit`
and checked via `utils_lib::has_capability_edit_activity($id)`.

### Errors and logging

Throw `\Exception` with a short message. The router catches it, logs the full backtrace to
`error_log` with a `[local_activities]` prefix, and strips the detail from the response
unless `DEBUG_DEVELOPER` is on.

**Diagnostics go to `error_log`, never into the response body.** `service.php` defines
`NO_DEBUG_DISPLAY`, so the log is the only record of a production failure.

Never `var_export($e); exit;` — let exceptions reach the router (see §13).

In scheduled tasks, use the Moodle idiom: `use \core\task\logging_trait;` with
`$this->log_start()` / `$this->log()` / `$this->log_finish()`.

---

## 5. Database conventions

- **Tables have no `local_` prefix**: `activities`, `activities_students`,
  `activities_approvals`, … 24 tables in `db/install.xml`.
- `Activity` (`classes/lib/activity.class.php`) is a hand-rolled active record — *not*
  `\core\persistent`. No `define_properties()`, no validation, no casting:

  ```php
  $activity = new Activity($id);
  $activity->set('activityname', $data->activityname);
  $activity->save();          // insert if no id, else update; stamps timemodified
  $exported = $activity->export();
  ```

- Everything else is raw `global $DB` inside a `*_lib` static class.
- **Use placeholders, not string interpolation**, in SQL. Some existing code interpolates
  (e.g. `cron_emails_sys.php`); don't copy it.
- No transactions are used anywhere. If you add multi-table writes that must be atomic,
  introduce `start_delegated_transaction()` deliberately rather than assuming one is in scope.
- **Denormalised `*json` columns mirror join tables** — `studentlistjson` alongside
  `activities_students`, `planningstaffjson` alongside `activities_staff`. Both are written
  on save and both are read in different code paths. Keep them in sync.
- External SIS (Synergetic) access goes through **admin-configured SQL settings**, never a
  hardcoded query. The pattern is in `utils_lib::get_students_from_taglist()`:

  ```php
  $config = get_config('local_activities');
  $externalDB = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
  $externalDB->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
  $rows = $externalDB->get_records_sql($config->taglistuserssql . ' :taglistseq', [...]);
  ```

  A new SIS read means a new setting in `settings.php`, not new SQL in code.

### Schema changes

Any `db/` change needs all three: `db/install.xml`, a guarded step in `db/upgrade.php`
(`field_exists()` / `table_exists()` then `upgrade_plugin_savepoint()`), and a bumped
`$plugin->version` in `version.php`.

---

## 6. Frontend conventions

**Stack:** React 18 + TypeScript, Vite 5, **Mantine 7** (UI kit), Tailwind (layout utilities),
Zustand (state), React Router 6, dayjs, FullCalendar, TipTap.

### Canonical choices

The codebase currently offers several options for the same job. For new code:

| Job | Use | Do not use |
|---|---|---|
| Data fetching in a component | **`useFetch()`** — awaitable, returns `{call, state, setState}` | `useAjax()` — legacy 5-tuple callback style, ~16 existing call sites. Don't add more. |
| Fetching outside React | `fetchData()` from `utils/index.ts` | — |
| UI components | **Mantine** | MUI — present only for `@mui/x-date-pickers` |
| Styling | Tailwind utilities via `cn()` (`utils/utils.tsx`) | New hand-written CSS, unless utilities genuinely can't express it — then `App.css` |
| New files | `.tsx` | `.jsx` — the five remaining ones are legacy |

```ts
const api = useFetch()
const res = await api.call({ query: { methodname: 'local_activities-get_activity', id } })
if (res.error) { setError(res.exception?.message ?? "Error"); return }
```

### File placement

- Page: `src/pages/<Page>/<Page>.tsx`
- Parts used only by that page: `src/pages/<Page>/components/`
- Parts used across pages: `src/components/`

Several `Calendar`/`List`/`Table`/`FilterModal` implementations are duplicated per page.
That is drift, not a pattern — prefer lifting to `src/components/` when you touch them.

### Component style

Feature sections take **zero or one props** and subscribe to the Zustand store directly.
Props are for callbacks and modal control only. Don't introduce prop drilling.

```tsx
export function BasicDetails() {
  const formData = useFormStore()
  const setState = useFormStore(state => state.setState)
  const viewStateProps = useStateStore(state => state.viewStateProps)

  const updateField = (name: string, value: any) => {
    if (viewStateProps.readOnly) { return }      // ← every editable control must do this
    setState({ [name]: value } as Form)
  }
```

**Read-only gating** is the global `viewStateProps {readOnly, editable}` in `stateStore`.
Every control that writes to the form must check it.

### Server-injected config

`getConfig()` (`utils/index.ts`) is the **only** accessor for `window.appdata.config`, which
`index.php` writes inline into `<head>`. Never read `window.appdata` directly.

It carries `sesskey`, `wwwroot`, `user`, `roles`, `calroles`, `toolname`, header colours,
login/logout URLs, and `dualaccount` (for staff who also hold a parent account).

### Routing

Flat routes in `App.tsx`, `basename: '/local/activities'`. **The bare `:id` catch-all must
stay last.** No nested routes, loaders, actions, or error boundaries.

Deep links survive the SSO round trip via a rewrite: `.htaccess` / `web.config` send any
non-file path to `index.php?route=<path>`, `bootstrap.php::activities_request_url()`
reconstructs it server-side, and `utils/restoreRoute.ts` cleans it out of the address bar
client-side. Don't change one half without the other.

### Stores

Five Zustand singletons in `src/stores/`, all shaped `{...defaults, setState, reset}`.
No persistence middleware, no `localStorage`. Because they're module singletons, **reset them
on page unmount** — see the cleanup in `EditActivity`'s `useEffect`.

---

## 7. Forms

There is no `moodleform`, and `@mantine/form` is **not** used for the activity form. The
pattern is a Zustand store plus a hand-rolled rule table.

- **State** — a field on the `Form` type in `stores/formStore.tsx` and an entry in `defaults`.
- **Client validation** — a rule in `useFormValidationStore.rules`, signature
  `(value, formData) => string | null`:

  ```ts
  activityname: [
    (value: string, formData: Form) => (value.length ? null : 'Activity name is required. '),
  ],
  ```

  Rules are executed by a loop in `EditActivity.handleSubmit`, collected into
  `Errors = {[field]: string[]}`, and rendered from `formErrors`. The `<form>` is `noValidate`.

- **Serialisation** — array/object fields are `JSON.stringify`d into their `*json` twin on
  submit and `JSON.parse`d back on load. Booleans arrive from PHP as `"0"`/`"1"` and are
  coerced with `!!Number()`.

- **Dirty tracking** — `utils/activityHash.tsx` `object-hash`es the form minus an exclusion
  list; `haschanges` is `hash !== oldhash`. The hash is re-baselined optimistically before the
  POST and rolled back with `resetHash()` if the save fails.

- **Server validation** — client rules are UX only. Re-validate in
  `activities_lib::save_from_data()`. Today that method does permission checks and a malformed-
  payload check but almost no field validation; new fields should not follow that example.

### Checklist: add a field to the activity form

It touches up to nine places. Missing one usually fails silently.

1. `db/install.xml` — the column
2. `db/upgrade.php` — a guarded `add_field` step + `upgrade_plugin_savepoint()`
3. `version.php` — bump `$plugin->version`
4. `Activity::defaults` (`classes/lib/activity.class.php`) — the default value
5. `activities_lib::save_from_data()` — `$activity->set('yourfield', $data->yourfield);`
6. `stores/formStore.tsx` — the `Form` type **and** `defaults`
7. The section component under `pages/Activity/components/` — the control, via `updateField`
8. `EditActivity.getActivity()` — any coercion (`!!Number()`, `JSON.parse`) on load, and
   `handleSubmit` — any `JSON.stringify` on save
9. If the field should **not** mark the form dirty (or is an `initial*` mirror), add it to the
   destructured exclusion list in `utils/activityHash.tsx`

Plus, if relevant: a rule in `useFormValidationStore.rules`, and an entry in the workflow
steps' `invalidated_on_edit` if changing it should void approvals (§9).

Use `ext_attendees` (version `2026052500`) as the worked reference — it appears in every one
of the places above.

---

## 8. Domain model

An "activity" is a **unified event record**. `activitytype` discriminates behaviour:

```php
activities_lib::is_activity($activitytype)   // true only for 'excursion' | 'incursion'
```

- **`excursion` / `incursion`** — the full thing: draft state, approval workflow, students,
  parent permissions, risk assessment, absences, class rolls.
- **`calendar` / `assessment`** — no draft state; straight to `INREVIEW` on first save, and
  only needs cal-reviewer approval.

**Branch on `is_activity()`, never on a literal string compare.**

Other axes that change behaviour: `campus` (`senior|primary|whole|commercial`) and `cocurr`
select the approval chain; `recurring`/`recurrence` produce a series in
`activities_occurrences`; `displaypublic`/`pushpublic` drive the public calendar;
`ext_attendees` triggers a CDO notification.

### Where UI permissions come from

`Activity::export()` → `get_other_values()` computes every boolean the UI keys off:
`iscreator`, `isapprover`, `isplanner`, `isaccompanying`, `issecondincharge`,
`isstaffincharge`, `isacknowledger`, `usercanedit`, `usercansendmail`, `canpermissionsend`,
plus `statushelper` and `occurrences`.

**New per-user gating belongs there**, not ad hoc in the API layer, so the frontend gets it
in the same payload as everything else.

`export_minimal()` is the cut-down version used for calendar rendering — keep it cheap.

### Files

Attachments and risk assessments use the Moodle file API under component `local_activities`,
areas `attachments`, `riskassessment`, `ra_generations`, served by
`local_activities_pluginfile()`. Uploads land in `$CFG->dataroot/temp/local_activities/` via
`upload.php` and are only committed to permanent storage on activity save, driven by
`NEW::` / `REMOVED::` / `EXISTING::` instruction strings built in `FileUploader.tsx` and
parsed by `activities_lib::process_files()`.

---

## 9. Workflow and approvals

### Definition

Steps live in `config.php` as `local_activities_config::WORKFLOW`, keyed `<campus>_<step>`
(`senior_ra`, `senior_admin`, `senior_hoss`, `primary_*`, `whole_*`, `commercial_*`,
`cocurr_*`). `workflow_lib extends local_activities_config`.

```php
'senior_hoss' => array(
    'name' => 'SS HoSS Approval',
    'invalidated_on_edit' => array('location', 'timestart', 'timeend', 'riskassessment'),
    'approvers' => array(
        'admin' => array('username' => 'admin', 'contacts' => null),
    ),
    'prerequisites' => array('senior_admin'),
    'canskip' => true,
    'selectable' => true,
),
```

Approvers are either literal usernames or resolved at runtime from an external SIS stored
proc (`fromsqlproc` → `workflow_lib::get_approvers_from_proc()`).

### Status

```php
activities_lib::ACTIVITY_STATUS_AUTOSAVE  = 0;
activities_lib::ACTIVITY_STATUS_DRAFT     = 1;
activities_lib::ACTIVITY_STATUS_INREVIEW  = 2;
activities_lib::ACTIVITY_STATUS_APPROVED  = 3;
activities_lib::ACTIVITY_STATUS_CANCELLED = 4;

workflow_lib::APPROVAL_STATUS_UNAPPROVED  = 0;   // per step
workflow_lib::APPROVAL_STATUS_APPROVED    = 1;
workflow_lib::APPROVAL_STATUS_REJECTED    = 2;
```

The JS mirror is `statuses` in `frontend/src/utils/index.ts`. **Keep the two in sync.**

### Transitions

**`workflow_lib::check_status()` is the single transition point.** It recomputes status from
remaining approvals, caches `stepname` on the activity, and fans out emails. Anything that
changes approval state must route through it rather than writing `status` directly.

- Chain selection is `get_approval_stubs()`: `cocurr` overrides everything; otherwise by
  `campus`. `senior_ra` is appended only for overnight activities.
- Editing a submitted activity re-runs `generate_approvals()`, which invalidates approvals
  whose `invalidated_on_edit` fields changed, drops steps no longer in the chain (e.g. campus
  changed), and inserts missing stubs.
- `get_unactioned_approvals()` is `invalidated = 0 AND skip = 0 AND status != 1`. Note a
  **rejected step still counts as unactioned**, so a rejection holds the activity at
  `INREVIEW` rather than moving it to a rejected state. Rejection emails are commented out.

**If a new field should void approvals when changed**, add it to the relevant steps'
`invalidated_on_edit` — in **both** `config.php` and `config.sample.php`.

### Parent permissions

`generate_permissions()` creates one `activities_permissions` row per (student × mentor),
filtering disallowed parents via an external SQL setting. `submit_permission()` re-checks
expiry server-side through `permissions_helper()` (`ispastdueby`, `ispastlimit`,
`activitystarted`) and scopes its update to `$USER->username`. Permissions can only be sent
once all approvals are complete (`canpermissionsend`).

---

## 10. Email

**Never call `message_send()` or core `email_to_user()`.**

```php
service_lib::wrap_and_email_to_user($recipient, $fromUser, $subject, $body, $attachments);
```

This renders `local_activities/email_template` as the wrapper and **queues** the message into
`activities_sys_emails`; `cron_emails_sys` drains the queue every minute and delivers via
`real_email_to_user()` — a forked copy of core's mailer that supports multiple attachments.

A new email needs a `templates/email_*.mustache` file rendered with
`$OUTPUT->render_from_template()`, passed as `$body`.

`db/messages.php` declares `notifications` and `emails` providers for user *preferences* only;
the Message API is never used for delivery.

---

## 11. External integrations

- **Microsoft Graph / Outlook** (`classes/lib/graph.lib.php`) — app-only OAuth2 client
  credentials from admin settings. `cron_sync_events` (every minute) pushes activities where
  `timesynclive < timemodified`, routing to per-campus mailboxes by category;
  `cron_sync_reconciliation` does a nightly two-way pass. Sync state in `activities_cal_sync`
  (`externalid`, `changekey`). **There is no Google Calendar and no Moodle core calendar
  integration.**
- **Synergetic SIS** — absences, class rolls, taglists, consent and HoD lookup, all via
  admin-configured SQL/proc-name settings (§5).
- **Public iCal** — `ical.php`, unauthenticated, serves `activities_ical_cache` with
  file-based per-IP rate limiting; generated by `cron_generate_ical`.
- **PDF / spreadsheet** — dompdf via `risks.lib.php` and `generator.lib.php`;
  phpspreadsheet for the risk import; `d4h/finediff` for change diffs in emails.

Ten scheduled tasks are registered in `db/tasks.php`.

---

## 12. Build and deploy

```bash
cd frontend
npm run dev      # Vite dev server on port 5133 (strictPort)
npm run build    # tsc -b && vite build
npx eslint src   # ESLint is configured but NOT wired into build
```

`bootstrap.php::isDev()` curls `localhost:5133` on each request and falls back to the built
manifest if the dev server isn't running — so the PHP side needs no switch between dev and
prod.

> **`frontend/dist/` is committed to git.** Moodle installs have no npm build step, so a
> frontend change is **not deployed** until `dist` is rebuilt and committed. This is what the
> recurring "Rebuild" commits in the history are. Forgetting this is the single most common
> way a frontend change appears to do nothing.

Bump `version.php` for any `db/` change.

---

## 13. Traps and known issues

Documented, not fixed. Know these before touching adjacent code.

### Correctness

- **`Activity::save()` swallows update exceptions** — `var_export($e); exit;`
  (`activity.class.php`). Do not replicate; let exceptions reach the router.
- **`get_approvers_from_proc()` fails silently** — it suppresses the external DB connect with
  `@` and returns `null` on any exception (`workflow.lib.php`). A SIS outage silently drops
  approval steps from the chain, after which `check_status()` sees nothing remaining and marks
  the activity **approved**.
- **`store_files()` catches unqualified `Exception`** inside a namespaced file
  (`activities.lib.php`), so it never matches a thrown `\Exception`.
- **`save_approval()` does not restrict the update to the user's own step types** — that
  clause is commented out (`workflow.lib.php`). Per-step gating (`canapprove`, prerequisites,
  `iswaitingforyou`) is computed only in `get_workflow()` for *display*.
- **The pre-3-Nov-2025 `senior_hod` cutover is duplicated** in `workflow.lib.php` and
  `activity.class.php`. Change both or neither.
- **`get_other_values($usercontext)` overwrites its own parameter with `$USER`**, so
  per-recipient export does not actually vary by recipient.

### Things that look load-bearing but aren't

- `utils_lib::has_capability_create_activity()` is a stub that always returns `true`.
- `local/activities:manage` is declared in `db/access.php` but never checked — it appears only
  in an exception message.
- `activities_logs` is defined and migrated but **never written** (the only insert is
  commented out).
- **`service-public.php` has no session and no sesskey.** It routes through the same
  dispatcher, so anything on `PUBLIC_FUNCTIONS` *or* `PARENT_FUNCTIONS` is reachable
  unauthenticated there. Adding a method to either list is a security decision.
- POST `args` are never `clean_param()`'d anywhere in the API layer.
- `classes/api/api.php` forces `display_errors` / `E_ALL` globally for every API request,
  masked at runtime only by `NO_DEBUG_DISPLAY`.

### Dead code — don't extend, don't take as precedent

- `frontend/src/utils/resetAllStores.tsx` — calls hooks outside a render; unused and broken.
- `frontend/src/index.css` — unmodified Vite scaffolding, not imported.
- `frontend/src/utils/emotionCache.js` — imports a package that isn't installed.
- `frontend/src/utils/utils.tsx` imports `clsx`, which resolves only transitively and is not
  in `package.json`.
- `classes/task/cron_create_classes_old{,2,3}.php`, `shakedown-test.php` (empty), `debug.php`,
  `test_version_control.php`.

### Tooling

- **There is no test suite** — no phpunit, no behat, no JS tests. Verification is manual:
  run the app and exercise the path.
- ESLint is configured (`frontend/eslint.config.js`) but has no `lint` script and is not part
  of `build`. Run `npx eslint src` explicitly.
- No phpcs, PHPStan or Psalm config. (`vendor/` contains third-party ones — those aren't ours.)
