# Apps Script Backend Setup

The Google Sheets database has already been created:

- Spreadsheet ID: `1NuKbEDZTg7zAaCZnf0c-LmAupJx3CoVNEXz8EYXqqkw`
- Spreadsheet: Campus Timetable Intelligence Database

## Create the Apps Script web app

1. Open the spreadsheet.
2. Select **Extensions → Apps Script**.
3. Replace the default code with the complete contents of `apps-script/Code.gs`.
4. Open **Project Settings** and enable **Show appsscript.json manifest file in editor**.
5. Replace the manifest with `apps-script/appsscript.json`.
6. Run `setupBackend` once and approve the permissions.

## Add Gemini securely

Open **Project Settings → Script Properties** and add:

- `GEMINI_API_KEY` = your Gemini API key
- `GEMINI_MODEL` = `gemini-2.5-flash` (optional; this is the default in Code.gs)
- `SPREADSHEET_ID` = `1NuKbEDZTg7zAaCZnf0c-LmAupJx3CoVNEXz8EYXqqkw` (optional because the current ID is already included as a fallback)

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

Until this file is updated, the application continues to work using browser storage only.
