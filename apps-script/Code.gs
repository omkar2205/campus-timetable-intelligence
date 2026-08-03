const DEFAULT_SPREADSHEET_ID = "1NuKbEDZTg7zAaCZnf0c-LmAupJx3CoVNEXz8EYXqqkw";
const APP_VERSION = "1.0.0";

const SHEET_HEADERS = {
  Config: ["Key", "Value", "Notes"],
  Rooms: ["room_id", "room_name", "campus", "building", "room_type", "capacity", "status", "updated_at", "updated_by", "source"],
  Lecturers: ["lecturer_id", "lecturer_name", "department", "max_weekly_hours", "availability", "preferred_campus", "weekly_hours", "workload", "assigned_modules", "updated_at", "updated_by", "source"],
  StudentGroups: ["group_id", "group_name", "course", "student_count", "campus", "academic_year", "intake", "updated_at", "updated_by", "source"],
  Modules: ["module_id", "module_code", "module_name", "course", "lecturer_id", "lecturer_name", "student_group", "weekly_sessions", "hours_per_session", "room_type_required", "updated_at", "updated_by", "source", "active"],
  Requirements: ["module_code", "student_group", "preferred_days", "preferred_time", "required_room_type", "avoid_days", "priority", "notes", "updated_at", "source"],
  Sessions: ["session_id", "day", "start_time", "end_time", "module_code", "module_name", "lecturer_id", "lecturer_name", "room_id", "room_name", "student_group", "campus", "enrolled", "capacity", "conflict", "generated_at", "updated_at", "source"],
  Conflicts: ["conflict_id", "type", "severity", "module_code", "lecturer", "room", "student_group", "day", "time", "description", "suggested_fix", "resolved", "resolved_at", "resolved_by", "created_at", "source"],
  AuditLog: ["timestamp", "action", "entity_type", "entity_id", "user", "details", "status", "request_id", "app_version", "source", "ip_or_session", "notes"],
  FAQs: ["faq_id", "category", "question", "answer", "active", "updated_at", "updated_by", "source"]
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "health");
    if (action === "health") return json_({ ok: true, service: "Campus Timetable Intelligence Backend", version: APP_VERSION, geminiConfigured: Boolean(PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY")) });
    if (action === "loadAll") return json_({ ok: true, data: loadAll_() });
    if (action === "faqs") return json_({ ok: true, data: getFaqs_() });
    return json_({ ok: false, error: "Unknown GET action" });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const action = String(payload.action || "");
    if (action === "saveAll") return json_({ ok: true, data: saveAll_(payload.data || {}, payload.user || "GitHub Pages Demo") });
    if (action === "clearAll") return json_({ ok: true, data: clearAll_(payload.user || "GitHub Pages Demo") });
    if (action === "askGemini") return json_({ ok: true, answer: askGemini_(payload.question, payload.context || {}) });
    if (action === "setup") return json_({ ok: true, data: setupBackend() });
    return json_({ ok: false, error: "Unknown POST action" });
  } catch (error) {
    appendAudit_("ERROR", "system", "", "Apps Script", error.stack || error.message || String(error), "Failed");
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function setupBackend() {
  const spreadsheet = getSpreadsheet_();
  Object.keys(SHEET_HEADERS).forEach(function(name) {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  });
  setConfigValue_("BACKEND_STATUS", "READY", "Apps Script backend initialised");
  setConfigValue_("LAST_UPDATED", new Date().toISOString(), "Latest backend setup time");
  return { spreadsheetId: spreadsheet.getId(), sheets: Object.keys(SHEET_HEADERS) };
}

function loadAll_() {
  const config = readKeyValueSheet_("Config");
  return {
    rooms: readObjects_("Rooms").map(function(r) { return { id: r.room_id, room: r.room_name, campus: r.campus, building: r.building, type: r.room_type, capacity: number_(r.capacity), status: r.status || "Available" }; }),
    lecturers: readObjects_("Lecturers").map(function(r) { return { id: r.lecturer_id, name: r.lecturer_name, department: r.department, maxWeeklyHours: number_(r.max_weekly_hours), availability: r.availability, preferredCampus: r.preferred_campus, weeklyHours: number_(r.weekly_hours), workload: r.workload || "Normal", modules: splitList_(r.assigned_modules) }; }),
    studentGroups: readObjects_("StudentGroups").map(function(r) { return { id: r.group_id, name: r.group_name, course: r.course, studentCount: number_(r.student_count), campus: r.campus }; }),
    modules: readObjects_("Modules").map(function(r) { return { id: r.module_id, code: r.module_code, name: r.module_name, course: r.course, lecturerId: r.lecturer_id || undefined, lecturerName: r.lecturer_name || undefined, studentGroup: r.student_group || undefined, weeklySessions: number_(r.weekly_sessions), hoursPerSession: number_(r.hours_per_session), roomTypeRequired: r.room_type_required }; }),
    requirements: readObjects_("Requirements").map(function(r) { return { moduleCode: r.module_code, studentGroup: r.student_group, preferredDays: r.preferred_days, preferredTime: r.preferred_time, requiredRoomType: r.required_room_type, avoidDays: r.avoid_days }; }),
    sessions: readObjects_("Sessions").map(function(r) { return { id: r.session_id, day: r.day, start: r.start_time, end: r.end_time, moduleCode: r.module_code, moduleName: r.module_name, lecturer: r.lecturer_name, room: r.room_name, campus: r.campus, group: r.student_group, course: r.course || "", enrolled: number_(r.enrolled), capacity: number_(r.capacity), conflict: r.conflict || undefined }; }),
    conflicts: readObjects_("Conflicts").map(function(r) { return { id: r.conflict_id, type: r.type, severity: r.severity, module: r.module_code, lecturer: r.lecturer, room: r.room, time: [r.day, r.time].filter(Boolean).join(" "), description: r.description, fix: r.suggested_fix, resolved: boolean_(r.resolved) }; }),
    generatedAt: config.LAST_GENERATED_AT || undefined
  };
}

function saveAll_(data, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const now = new Date().toISOString();
    replaceRows_("Rooms", (data.rooms || []).map(function(r) { return [r.id || "", r.room || "", r.campus || "", r.building || "", r.type || "", number_(r.capacity), r.status || "Available", now, user, "GitHub Pages"]; }));
    replaceRows_("Lecturers", (data.lecturers || []).map(function(r) { return [r.id || "", r.name || "", r.department || "", number_(r.maxWeeklyHours), r.availability || "", r.preferredCampus || "", number_(r.weeklyHours), r.workload || "Normal", (r.modules || []).join("|"), now, user, "GitHub Pages"]; }));
    replaceRows_("StudentGroups", (data.studentGroups || []).map(function(r) { return [r.id || "", r.name || "", r.course || "", number_(r.studentCount), r.campus || "", "", "", now, user, "GitHub Pages"]; }));
    replaceRows_("Modules", (data.modules || []).map(function(r) { return [r.id || "", r.code || "", r.name || "", r.course || "", r.lecturerId || "", r.lecturerName || "", r.studentGroup || "", number_(r.weeklySessions), number_(r.hoursPerSession), r.roomTypeRequired || "", now, user, "GitHub Pages", true]; }));
    replaceRows_("Requirements", (data.requirements || []).map(function(r) { return [r.moduleCode || "", r.studentGroup || "", r.preferredDays || "", r.preferredTime || "", r.requiredRoomType || "", r.avoidDays || "", "Normal", "", now, "GitHub Pages"]; }));
    replaceRows_("Sessions", (data.sessions || []).map(function(r) { return [r.id || "", r.day || "", r.start || "", r.end || "", r.moduleCode || "", r.moduleName || "", "", r.lecturer || "", "", r.room || "", r.group || "", r.campus || "", number_(r.enrolled), number_(r.capacity), r.conflict || "", data.generatedAt || now, now, "GitHub Pages"]; }));
    replaceRows_("Conflicts", (data.conflicts || []).map(function(r) { const parsed = splitDayTime_(r.time || ""); return [r.id || "", r.type || "", r.severity || "", r.module || "", r.lecturer || "", r.room || "", "", parsed.day, parsed.time, r.description || "", r.fix || "", Boolean(r.resolved), r.resolved ? now : "", r.resolved ? user : "", now, "GitHub Pages"]; }));
    setConfigValue_("LAST_GENERATED_AT", data.generatedAt || now, "Last published timetable generation time");
    setConfigValue_("BACKEND_STATUS", "CONNECTED", "Latest frontend save completed");
    appendAudit_("SAVE_ALL", "timetable", "shared", user, "Saved complete application state", "Success");
    return { savedAt: now, counts: { rooms: (data.rooms || []).length, lecturers: (data.lecturers || []).length, studentGroups: (data.studentGroups || []).length, modules: (data.modules || []).length, sessions: (data.sessions || []).length, conflicts: (data.conflicts || []).length } };
  } finally {
    lock.releaseLock();
  }
}

function clearAll_(user) {
  ["Rooms", "Lecturers", "StudentGroups", "Modules", "Requirements", "Sessions", "Conflicts"].forEach(function(name) { replaceRows_(name, []); });
  setConfigValue_("LAST_GENERATED_AT", "", "Cleared from shared demo");
  appendAudit_("CLEAR_ALL", "timetable", "shared", user, "Cleared shared demo data", "Success");
  return { clearedAt: new Date().toISOString() };
}

function askGemini_(question, context) {
  if (!question) throw new Error("Question is required");
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in Apps Script Properties");
  const model = properties.getProperty("GEMINI_MODEL") || "gemini-2.5-flash";
  const faqText = getFaqs_().map(function(item) { return "Q: " + item.question + "\nA: " + item.answer; }).join("\n\n");
  const contextText = JSON.stringify(context || {}).slice(0, 35000);
  const prompt = [
    "You are the Campus Timetable Intelligence assistant.",
    "Help university users understand the tool, imported data, timetable conflicts, room capacity, lecturer workload and scheduling decisions.",
    "Use only the supplied application context and FAQs for data-specific answers. If the answer is not available, say what information is missing.",
    "The current environment is for dummy/training data. Never request sensitive personal data.",
    "Keep answers clear, practical and concise.",
    "FAQs:\n" + faqText,
    "Application context:\n" + contextText,
    "User question:\n" + question
  ].join("\n\n");

  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
  const response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: { "x-goog-api-key": apiKey },
    payload: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 800 } }),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = JSON.parse(response.getContentText() || "{}");
  if (status < 200 || status >= 300) throw new Error((body.error && body.error.message) || "Gemini request failed with status " + status);
  const parts = body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts;
  const answer = (parts || []).map(function(part) { return part.text || ""; }).join("\n").trim();
  appendAudit_("ASK_GEMINI", "assistant", "", "GitHub Pages Demo", question.slice(0, 500), "Success");
  return answer || "No answer was returned.";
}

function getFaqs_() {
  return readObjects_("FAQs").filter(function(row) { return boolean_(row.active); }).map(function(row) { return { id: row.faq_id, category: row.category, question: row.question, answer: row.answer }; });
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || DEFAULT_SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

function replaceRows_(sheetName, rows) {
  const spreadsheet = getSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const lastRow = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function readObjects_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = values.shift().map(function(value) { return String(value).trim(); });
  return values.filter(function(row) { return row.some(function(value) { return value !== ""; }); }).map(function(row) {
    const object = {};
    headers.forEach(function(header, index) { object[header] = row[index]; });
    return object;
  });
}

function readKeyValueSheet_(sheetName) {
  const result = {};
  readObjects_(sheetName).forEach(function(row) { result[String(row.Key || "")] = row.Value; });
  return result;
}

function setConfigValue_(key, value, notes) {
  const sheet = getSpreadsheet_().getSheetByName("Config");
  const values = sheet.getDataRange().getValues();
  for (let row = 1; row < values.length; row += 1) {
    if (String(values[row][0]) === key) {
      sheet.getRange(row + 1, 2, 1, 2).setValues([[value, notes || values[row][2] || ""]]);
      return;
    }
  }
  sheet.appendRow([key, value, notes || ""]);
}

function appendAudit_(action, entityType, entityId, user, details, status) {
  try {
    const sheet = getSpreadsheet_().getSheetByName("AuditLog");
    if (!sheet) return;
    sheet.appendRow([new Date().toISOString(), action, entityType, entityId, user, details, status, Utilities.getUuid(), APP_VERSION, "Apps Script", "", ""]);
  } catch (error) {
    console.error(error);
  }
}

function parsePayload_(e) {
  const text = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  return JSON.parse(text);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function splitList_(value) {
  if (!value) return [];
  return String(value).split(/[|,]/).map(function(item) { return item.trim(); }).filter(Boolean);
}

function splitDayTime_(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(.*)$/i);
  return match ? { day: match[1], time: match[2] } : { day: "", time: text };
}

function number_(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolean_(value) {
  if (typeof value === "boolean") return value;
  return ["true", "yes", "1", "active"].indexOf(String(value || "").toLowerCase()) >= 0;
}
