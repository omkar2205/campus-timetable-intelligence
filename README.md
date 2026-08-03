# Campus Timetable Intelligence

Enterprise university timetable scheduling demo built with Next.js, React, TypeScript, Tailwind CSS and Recharts.

The application starts empty. Rooms, lecturers, student groups, modules, sessions and conflicts appear only after CSV data is staged and **Generate Timetable** is selected.

## GitHub Pages

The repository includes a GitHub Actions workflow that exports the Next.js application as a static site and deploys it to:

`https://omkar2205.github.io/campus-timetable-intelligence/`

In the repository, open **Settings → Pages** and select **GitHub Actions** as the source if it is not already selected.

## Demo flow

1. Open the application and log in.
2. Open **Data Import**.
3. Upload CSV files or load sample data for rooms, lecturers, student groups, modules and scheduling requirements.
4. Confirm the data is staged while the live application remains empty.
5. Select **Generate Timetable**.
6. Review the Dashboard, Timetable Builder, Rooms, Lecturers, Students, Conflicts and Analytics pages.
7. Export the generated timetable or make manual changes.

## Shared backend

The frontend supports two modes:

- **Local mode:** browser storage only; enabled by default.
- **Shared mode:** Google Apps Script and Google Sheets; allows generated data to be shared across users.

Runtime mode is controlled in `public/runtime-config.json`.

The Apps Script backend files are in `apps-script/`. Follow `apps-script/SETUP.md` to deploy the web app and enable shared data and Gemini assistance.

The prepared Google Sheets database uses these tabs:

- Config
- Rooms
- Lecturers
- StudentGroups
- Modules
- Requirements
- Sessions
- Conflicts
- AuditLog
- FAQs

Do not store the Gemini API key in this repository. Keep it in Apps Script **Script Properties**.

## Local development

```powershell
npm.cmd install
npm.cmd run dev -- --webpack
```

Open `http://localhost:3000`.

## Production build

```powershell
npm.cmd run build
```

The static export is written to the `out` folder.
