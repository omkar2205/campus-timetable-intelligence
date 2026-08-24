# Apps Script Backend Setup

The shared pilot database is stored in Google Sheets:

- Spreadsheet ID: `1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4`
- Spreadsheet: **Campus Timetable Intelligence - Full Dummy Data**

The workbook includes campus locations, staff, individual students, campus-specific Programmes of Study, campus-specific modules, scheduling requirements, sessions, conflicts, activity templates, availability exceptions, publication history, suggestions, audit history and FAQs.

## Current backend schema

The current repository backend is **version 4.0.0**. It adds:

- Staff primary campus and additional teaching campuses
- Separate Programmes of Study for each campus
- Separate module records for each campus
- Individual student records and module allocations
- Individual student IDs on timetable sessions and Activity Templates
- Campus-aware scheduling and conflict checks
- Shared Activity Template, Availability and Publication persistence
- JSONP read fallback for GitHub Pages
- Strengthened Gemini assistant rules and guardrails

## Update the existing Apps Script web app

1. Open the spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the existing code with the complete contents of `apps-script/Code.gs`.
4. Open **Project Settings** and enable **Show appsscript.json manifest file in editor** if it is not already visible.
5. Replace the manifest with `apps-script/appsscript.json` if required.
6. Confirm the Script Property:
   - `SPREADSHEET_ID` = `1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4`
7. Run `setupBackend` once and approve permissions if requested.

The Google Sheet has already been prepared for the v4 schema. Running `setupBackend` confirms all required headers and sheets.

## Gemini

In **Project Settings → Script Properties**, keep:

- `GEMINI_API_KEY` = your Gemini API key
- `GEMINI_MODEL` = `gemini-2.5-flash` (optional)

Never add the Gemini API key to GitHub or frontend code.

## Deploy the updated version

Update the existing deployment so the `/exec` URL stays unchanged:

1. Select **Deploy → Manage deployments**.
2. Edit the active web-app deployment.
3. Under Version, choose **New version**.
4. Execute as: **Me**.
5. Access: **Anyone**.
6. Deploy.

After deployment, opening the health endpoint should report `"version":"4.0.0"`.

## Connected frontend

`public/runtime-config.json` already points to the existing Apps Script deployment.

The pilot supports shared timetable/master data, Gemini assistance, Suggestions submitted into the `Suggestions` sheet, and audit entries for saves and feedback. It is designed for a small number of test users and a modest reference dataset; it is not intended for large-scale concurrent production use or sensitive live student/staff data.
