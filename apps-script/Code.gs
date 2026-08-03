const DEFAULT_SPREADSHEET_ID = "1uxY_vagvXbJR6jNsvV-eFX8e-dUy2pCQW3ilTOMfhY4";
const APP_VERSION = "3.0.0";

const SHEET_HEADERS = {
  Config: ["Key", "Value", "Notes"],
  Rooms: ["room_id", "room_name", "campus", "building", "room_type", "capacity", "status", "updated_at", "updated_by", "source"],
  Lecturers: ["lecturer_id", "lecturer_name", "department", "max_weekly_hours", "availability", "preferred_campus", "weekly_hours", "workload", "assigned_modules", "updated_at", "updated_by", "source"],
  StudentGroups: ["group_id", "group_name", "course", "student_count", "campus", "academic_year", "intake", "updated_at", "updated_by", "source"],
  Modules: ["module_id", "module_code", "module_name", "course", "lecturer_id", "lecturer_name", "student_group", "weekly_sessions", "hours_per_session", "room_type_required", "updated_at", "updated_by", "source", "active"],
  Requirements: ["module_code", "student_group", "preferred_days", "preferred_time", "required_room_type", "avoid_days", "priority", "notes", "updated_at", "source"],
  Sessions: ["session_id", "session_date", "day", "recurring", "start_time", "end_time", "module_code", "module_name", "course", "lecturer_id", "lecturer_name", "room_id", "room_name", "student_group", "campus", "enrolled", "capacity", "status", "conflict", "generated_at", "updated_at", "source"],
  Conflicts: ["conflict_id", "type", "severity", "module_code", "lecturer", "room", "student_group", "day", "time", "description", "suggested_fix", "resolved", "resolved_at", "resolved_by", "created_at", "source"],
  ActivityTemplates: ["template_id", "template_name", "campus", "programme", "module_code", "activity_type", "planned_size", "duration_hours", "weekly_sessions", "teaching_weeks", "student_group", "lecturer_suitability", "room_suitability", "preferred_days", "preferred_time", "status", "validation_result", "publication_rule", "updated_at", "source"],
  AvailabilityExceptions: ["exception_id", "resource_type", "resource_id", "resource_name", "start_date", "end_date", "start_time", "end_time", "availability_type", "reason", "notes", "created_at", "created_by", "source"],
  PublicationLog: ["publication_id", "version", "status", "scope", "session_count", "validation_status", "change_summary", "published_by", "published_at", "notes", "source", "active"],
  Suggestions: ["suggestion_id", "submitted_at", "name", "email", "area", "category", "rating", "suggestion", "page", "status", "user_agent", "source", "review_notes", "reviewed_at"],
  AuditLog: ["timestamp", "action", "entity_type", "entity_id", "user", "details", "status", "request_id", "app_version", "source", "ip_or_session", "notes"],
  FAQs: ["faq_id", "category", "question", "answer", "active", "updated_at", "updated_by", "source"]
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "health");
    if (action === "health") return json_({
      ok: true,
      service: "Campus Timetable Intelligence Backend",
      version: APP_VERSION,
      spreadsheetId: getSpreadsheet_().getId(),
      geminiConfigured: Boolean(PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY"))
    });
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
    if (action === "saveAll") return json_({ ok: true, data: saveAll_(payload.data || {}, payload.user || "Timetable platform") });
    if (action === "clearAll") return json_({ ok: true, data: clearAll_(payload.user || "Timetable platform") });
    if (action === "submitSuggestion") return json_({ ok: true, data: submitSuggestion_(payload.suggestion || {}) });
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
    if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  });
  setConfigValue_("BACKEND_STATUS", "READY", "Apps Script backend initialised");
  setConfigValue_("SCHEMA_VERSION", APP_VERSION, "Current backend schema version");
  setConfigValue_("LAST_UPDATED", new Date().toISOString(), "Latest backend setup time");
  return { spreadsheetId: spreadsheet.getId(), sheets: Object.keys(SHEET_HEADERS), version: APP_VERSION };
}

function loadAll_() {
  const config = readKeyValueSheet_("Config");
  return {
    rooms: readObjects_("Rooms").map(function(row) {
      return { id: row.room_id, room: row.room_name, campus: row.campus, building: row.building, type: row.room_type, capacity: number_(row.capacity), status: row.status || "Available" };
    }),
    lecturers: readObjects_("Lecturers").map(function(row) {
      return { id: row.lecturer_id, name: row.lecturer_name, department: row.department, maxWeeklyHours: number_(row.max_weekly_hours), availability: row.availability, preferredCampus: row.preferred_campus, weeklyHours: number_(row.weekly_hours), workload: row.workload || "Normal", modules: splitList_(row.assigned_modules) };
    }),
    studentGroups: readObjects_("StudentGroups").map(function(row) {
      return { id: row.group_id, name: row.group_name, course: row.course, studentCount: number_(row.student_count), campus: row.campus };
    }),
    modules: readObjects_("Modules").map(function(row) {
      return { id: row.module_id, code: row.module_code, name: row.module_name, course: row.course, lecturerId: row.lecturer_id || undefined, lecturerName: row.lecturer_name || undefined, studentGroup: row.student_group || undefined, weeklySessions: number_(row.weekly_sessions), hoursPerSession: number_(row.hours_per_session), roomTypeRequired: row.room_type_required };
    }),
    requirements: readObjects_("Requirements").map(function(row) {
      return { moduleCode: row.module_code, studentGroup: row.student_group, preferredDays: row.preferred_days, preferredTime: row.preferred_time, requiredRoomType: row.required_room_type, avoidDays: row.avoid_days };
    }),
    sessions: readObjects_("Sessions").map(function(row) {
      return { id: row.session_id, date: row.session_date || undefined, day: row.day, recurring: boolean_(row.recurring), start: row.start_time, end: row.end_time, moduleCode: row.module_code, moduleName: row.module_name, course: row.course || "", lecturer: row.lecturer_name, room: row.room_name, campus: row.campus, group: row.student_group, enrolled: number_(row.enrolled), capacity: number_(row.capacity), status: row.status || "Scheduled", conflict: row.conflict || undefined };
    }),
    conflicts: readObjects_("Conflicts").map(function(row) {
      return { id: row.conflict_id, type: row.type, severity: row.severity, module: row.module_code, lecturer: row.lecturer, room: row.room, time: [row.day, row.time].filter(Boolean).join(" "), description: row.description, fix: row.suggested_fix, resolved: boolean_(row.resolved) };
    }),
    generatedAt: config.LAST_GENERATED_AT || undefined
  };
}

function saveAll_(data, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const now = new Date().toISOString();
    replaceRows_("Rooms", (data.rooms || []).map(function(row) {
      return [row.id || "", row.room || "", row.campus || "", row.building || "", row.type || "", number_(row.capacity), row.status || "Available", now, user, "GitHub Pages"];
    }));
    replaceRows_("Lecturers", (data.lecturers || []).map(function(row) {
      return [row.id || "", row.name || "", row.department || "", number_(row.maxWeeklyHours), row.availability || "", row.preferredCampus || "", number_(row.weeklyHours), row.workload || "Normal", (row.modules || []).join("|"), now, user, "GitHub Pages"];
    }));
    replaceRows_("StudentGroups", (data.studentGroups || []).map(function(row) {
      return [row.id || "", row.name || "", row.course || "", number_(row.studentCount), row.campus || "", "", "", now, user, "GitHub Pages"];
    }));
    replaceRows_("Modules", (data.modules || []).map(function(row) {
      return [row.id || "", row.code || "", row.name || "", row.course || "", row.lecturerId || "", row.lecturerName || "", row.studentGroup || "", number_(row.weeklySessions), number_(row.hoursPerSession), row.roomTypeRequired || "", now, user, "GitHub Pages", true];
    }));
    replaceRows_("Requirements", (data.requirements || []).map(function(row) {
      return [row.moduleCode || "", row.studentGroup || "", row.preferredDays || "", row.preferredTime || "", row.requiredRoomType || "", row.avoidDays || "", "Normal", "", now, "GitHub Pages"];
    }));
    replaceRows_("Sessions", (data.sessions || []).map(function(row) {
      return [row.id || "", row.date || "", row.day || "", row.recurring !== false, row.start || "", row.end || "", row.moduleCode || "", row.moduleName || "", row.course || "", "", row.lecturer || "", "", row.room || "", row.group || "", row.campus || "", number_(row.enrolled), number_(row.capacity), row.status || "Scheduled", row.conflict || "", data.generatedAt || now, now, "GitHub Pages"];
    }));
    replaceRows_("Conflicts", (data.conflicts || []).map(function(row) {
      const parsed = splitDayTime_(row.time || "");
      return [row.id || "", row.type || "", row.severity || "", row.module || "", row.lecturer || "", row.room || "", "", parsed.day, parsed.time, row.description || "", row.fix || "", Boolean(row.resolved), row.resolved ? now : "", row.resolved ? user : "", now, "GitHub Pages"];
    }));
    setConfigValue_("LAST_GENERATED_AT", data.generatedAt || now, "Last published timetable generation time");
    setConfigValue_("BACKEND_STATUS", "CONNECTED", "Latest frontend save completed");
    setConfigValue_("SCHEMA_VERSION", APP_VERSION, "Current backend schema version");
    appendAudit_("SAVE_ALL", "timetable", "shared", user, "Saved complete application state", "Success");
    return { savedAt: now, counts: { rooms: (data.rooms || []).length, lecturers: (data.lecturers || []).length, studentGroups: (data.studentGroups || []).length, modules: (data.modules || []).length, sessions: (data.sessions || []).length, conflicts: (data.conflicts || []).length } };
  } finally {
    lock.releaseLock();
  }
}

function clearAll_(user) {
  ["Rooms", "Lecturers", "StudentGroups", "Modules", "Requirements", "Sessions", "Conflicts"].forEach(function(name) { replaceRows_(name, []); });
  setConfigValue_("LAST_GENERATED_AT", "", "Cleared from shared platform");
  appendAudit_("CLEAR_ALL", "timetable", "shared", user, "Cleared shared timetable data", "Success");
  return { clearedAt: new Date().toISOString() };
}

function submitSuggestion_(suggestion) {
  const text = String(suggestion.suggestion || "").trim();
  if (text.length < 10) throw new Error("Suggestion must contain at least 10 characters");
  const now = suggestion.submittedAt || new Date().toISOString();
  const suggestionId = "SUG-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  const sheet = ensureSheet_("Suggestions");
  sheet.appendRow([
    suggestionId,
    now,
    clean_(suggestion.name, 150),
    clean_(suggestion.email, 200),
    clean_(suggestion.area, 150),
    clean_(suggestion.category, 150),
    Math.min(5, Math.max(1, number_(suggestion.rating) || 1)),
    clean_(text, 3000),
    clean_(suggestion.page, 250),
    "New",
    clean_(suggestion.userAgent, 500),
    clean_(suggestion.source || "GitHub Pages pilot", 150),
    "",
    ""
  ]);
  appendAudit_("SUBMIT_SUGGESTION", "suggestion", suggestionId, clean_(suggestion.name || "Anonymous", 150), clean_(suggestion.area, 150), "Success");
  return { suggestionId: suggestionId, submittedAt: now };
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
    "Help users understand activity planning, availability, timetable filters, room booking, schedule changes, conflicts, review, publication and reports.",
    "Use only the supplied application context and FAQs for data-specific answers. If information is missing, say what is missing.",
    "Do not request personal or sensitive information.",
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
  appendAudit_("ASK_GEMINI", "assistant", "", "Timetable platform", String(question).slice(0, 500), "Success");
  return answer || "No answer was returned.";
}

function getFaqs_() {
  return readObjects_("FAQs").filter(function(row) { return boolean_(row.active); }).map(function(row) {
    return { id: row.faq_id, category: row.category, question: row.question, answer: row.answer };
  });
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || DEFAULT_SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(sheetName) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(sheetName);
  const headers = SHEET_HEADERS[sheetName];
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (headers) {
    if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function replaceRows_(sheetName, rows) {
  const sheet = ensureSheet_(sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const rowsToClear = Math.max(sheet.getLastRow() - 1, 1);
  sheet.getRange(2, 1, rowsToClear, headers.length).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function readObjects_(sheetName) {
  const sheet = ensureSheet_(sheetName);
  const headers = SHEET_HEADERS[sheetName];
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
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
  const sheet = ensureSheet_("Config");
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
    ensureSheet_("AuditLog").appendRow([new Date().toISOString(), action, entityType, entityId, user, details, status, Utilities.getUuid(), APP_VERSION, "Apps Script", "", ""]);
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
  const match = text.match(/^((?:\d{4}-\d{2}-\d{2})|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(.*)$/i);
  return match ? { day: match[1], time: match[2] } : { day: "", time: text };
}

function clean_(value, maximumLength) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maximumLength || 1000);
}

function number_(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolean_(value) {
  if (typeof value === "boolean") return value;
  return ["true", "yes", "1", "active"].indexOf(String(value || "").toLowerCase()) >= 0;
}
