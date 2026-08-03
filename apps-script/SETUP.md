# Apps Script Backend Setup

The full dummy/training reference database has been created in Google Sheets:

- Spreadsheet ID: `1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4`
- Spreadsheet: **Campus Timetable Intelligence - Full Dummy Data**

It contains rooms, lecturers, student groups, modules, scheduling requirements, generated sessions, conflicts, audit history and FAQs for Birmingham and Manchester.

## Create the Apps Script web app

1. Open the spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the default code with the complete contents of `apps-script/Code.gs`.
4. Open **Project Settings** and enable **Show appsscript.json manifest file in editor**.
5. Replace the manifest with `apps-script/appsscript.json`.
6. Open **Project Settings → Script Properties** and add:
   - `SPREADSHEET_ID` = `1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4`
7. Run `setupBackend` once and approve the permissions.

## Add Gemini securely

In **Project Settings → Script Properties**, add:

- `GEMINI_API_KEY` = your Gemini API key
- `GEMINI_MODEL` = `gemini-2.5-flash` (optional)

Never add the Gemini API key to GitHub or the frontend.

## Deploy

1. Select **Deploy → New deployment**.
2. Choose **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy and copy the URL ending in `/exec`.

## Connect the frontend

Update `public/runtime-config.json`:

```json
{
  "backendEnabled": true,
  "appsScriptUrl": "PASTE_YOUR_EXEC_URL_HERE",
  "geminiEnabled": true,
  "dataMode": "training"
}
```

Commit the update to `main`. GitHub Actions will rebuild and deploy the site.

Until the Apps Script URL is added, the GitHub Pages demo uses the embedded full dummy dataset and stores user edits in that browser only.
