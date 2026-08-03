# Campus Timetable Intelligence

Enterprise university timetable scheduling demo built with Next.js, React, TypeScript, Tailwind CSS and Recharts.

The application opens directly into a working timetable platform. It includes a full dummy/training dataset for Birmingham and Manchester so the dashboard, timetable builder, rooms, lecturers, students, conflicts and analytics can be tested immediately.

## GitHub Pages

The repository includes a GitHub Actions workflow that exports the Next.js application as a static site and deploys it to:

`https://omkar2205.github.io/campus-timetable-intelligence/`

In the repository, open **Settings → Pages** and select **GitHub Actions** as the source if it is not already selected.

## Included dummy dataset

- 28 rooms
- 16 lecturers
- 16 student groups
- 40 modules
- 40 scheduling requirements
- 56 generated sessions
- Capacity conflicts for testing resolution workflows
- Birmingham and Manchester campuses
- PGDL, BPC, SQE1, LLB and LLM courses

The dataset was expanded from the supplied room, lecturer, student-group and scheduling CSV structures. It is for training and product testing only.

## Demo flow

1. Open the platform; no login is required.
2. Review the Dashboard and Analytics pages.
3. Open Timetable Builder and change a session day, time or room.
4. Review how conflicts update.
5. Open Data Import to upload replacement CSV files into staging.
6. Select **Generate Timetable** to publish the staged data, or re-optimise the current dummy dataset.
7. Select **Restore Full Demo Data** to return to the prepared working model.
8. Export the timetable as CSV.

## Shared backend

The frontend supports two modes:

- **Local mode:** the full dummy dataset is included in the site and user changes are stored in that browser.
- **Shared mode:** Google Apps Script and Google Sheets can be enabled so all users work from the same saved dataset.

Runtime mode is controlled in `public/runtime-config.json`.

The Apps Script backend files are in `apps-script/`. Follow `apps-script/SETUP.md` to deploy the web app and enable shared data and Gemini assistance.

The full Google Sheets reference database contains:

- Summary
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

The static export is written to the `out` folder and includes the GitHub Pages `index.html`.
