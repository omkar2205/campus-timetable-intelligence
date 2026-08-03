# Campus Timetable Intelligence - v3 Empty Live Working Model

This version starts with an empty live system. Rooms, lecturers, student groups, modules, sessions and conflicts do not appear across the tool until data is imported/staged and **Generate Timetable** is clicked.

## Demo Flow
1. Open the app and log in.
2. Go to **Data Import**.
3. Upload CSVs or click **Load Sample** for Rooms, Lecturers, Student Groups, Modules and Requirements.
4. Check the staged vs live summary. Live data should remain empty before generation.
5. Click **Generate Timetable**.
6. Go to Dashboard, Timetable Builder, Rooms, Lecturers, Students, Conflicts and Analytics to see the generated working model.

## Run
```powershell
cd "C:\Users\poreddy\Downloads\campus-timetable-intelligence-v3-empty-live\campus-timetable-intelligence"
npm.cmd install
npm.cmd run dev -- --webpack
```

Open http://localhost:3000
