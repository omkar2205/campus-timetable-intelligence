# Apps Script Backend Setup

The shared reference database is stored in Google Sheets:

- Spreadsheet ID: `1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4`
- Spreadsheet: **Campus Timetable Intelligence - Full Dummy Data**

The workbook includes rooms, lecturers, student groups, modules, scheduling requirements, sessions, conflicts, activity templates, availability exceptions, publication history, suggestions, audit history and FAQs.

## Update the Apps Script web app

1. Open the spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the existing code with the complete contents of `apps-script/Code.gs`.
4. Open **Project Settings** and enable **Show appsscript.json manifest file in editor**.
5. Replace the manifest with `apps-script/appsscript.json`.
6. Open **Project Settings → Script Properties** and add:
   - `SPREADSHEET_ID` = `1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4`
7. Run `setupBackend` once and approve the permissions. This updates the sheet structures required by the current frontend.

## Add Gemini securely

In **Project Settings → Script Properties**, add:

- `GEMINI_API_KEY` = your Gemini API key
- `GEMINI_MODEL` = `gemini-2.5-flash` (optional)

Never add the Gemini API key to GitHub or frontend code.

## Deploy the updated version

For an existing deployment:

1. Select **Deploy → Manage deployments**.
2. Edit the active web-app deployment.
3. Select **New version**.
4. Execute as: **Me**.
5. Access: **Anyone**.
6. Deploy.

The existing `/exec` URL remains the same when the current deployment is updated.

## Connected frontend

The repository already points to the deployed Apps Script URL in `public/runtime-config.json`.

The web app supports:

- Shared timetable data
- Gemini assistance when the key is configured
- Suggestions submitted from the platform into the `Suggestions` sheet
- Audit entries for saves, Gemini requests and feedback submissions

The platform is intended for limited pilot testing. Do not use sensitive live student or staff data during evaluation.
