// ================================================================
// Physics with Vikas — Google Apps Script Backend
// File: Code.gs
// ================================================================
// SETUP INSTRUCTIONS:
// 1. Open Google Sheets → Extensions → Apps Script
// 2. Paste this entire file content
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the deployment URL → paste into script.js APP_CONFIG.APPS_SCRIPT_URL
// ================================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ── Sheet name constants ──────────────────────────────────────
const SHEET_USERS    = "Users";
const SHEET_PAYMENTS = "Payments";
const SHEET_REELS    = "Reels_Data";

// ── Main entry point ─────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    let result;
    switch(action) {
      case "signup":   result = handleSignup(body);   break;
      case "login":    result = handleLogin(body);    break;
      case "payment":  result = handlePayment(body);  break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET requests (for admin reads) ───────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    switch(action) {
      case "getPayments": result = getPayments(); break;
      case "getReels":    result = getReels();    break;
      case "getUsers":    result = getUsers();    break;
      default:
        result = { success: true, message: "Physics with Vikas API is running." };
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── SIGNUP ────────────────────────────────────────────────────
function handleSignup(data) {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEET_USERS, ["Name","Phone","Email","Class","Created_At"]);

  // Duplicate check by phone
  const rows = sheet.getDataRange().getValues();
  for(let i = 1; i < rows.length; i++) {
    if(String(rows[i][1]) === String(data.phone)) {
      return { success: false, error: "Phone already registered." };
    }
  }

  sheet.appendRow([
    data.name       || "",
    data.phone      || "",
    data.email      || "",
    data.class      || "",
    data.created_at || new Date().toISOString()
  ]);

  return { success: true, message: "User registered." };
}

// ── LOGIN ─────────────────────────────────────────────────────
function handleLogin(data) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  if(!sheet) return { success: false, error: "Users sheet not found." };

  const rows = sheet.getDataRange().getValues();
  for(let i = 1; i < rows.length; i++) {
    if(String(rows[i][1]) === String(data.phone)) {
      return {
        success: true,
        found: true,
        user: {
          name:  rows[i][0],
          phone: rows[i][1],
          email: rows[i][2],
          class: rows[i][3]
        }
      };
    }
  }
  return { success: false, found: false, error: "User not found." };
}

// ── PAYMENT ───────────────────────────────────────────────────
function handlePayment(data) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEET_PAYMENTS, [
    "Timestamp","Name","Phone","Email","UPI_Remark","Verified","Access_Given"
  ]);

  sheet.appendRow([
    data.timestamp  || new Date().toISOString(),
    data.name       || "",
    data.phone      || "",
    data.email      || "",
    data.upi_remark || "",
    "NO",
    "NO"
  ]);

  return { success: true, message: "Payment recorded. Verification pending." };
}

// ── GET PAYMENTS (admin) ──────────────────────────────────────
function getPayments() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PAYMENTS);
  if(!sheet) return { payments: [] };

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const payments = rows.map(r => ({
    timestamp:    r[0],
    name:         r[1],
    phone:        r[2],
    email:        r[3],
    upi_remark:   r[4],
    verified:     r[5],
    access_given: r[6]
  })).reverse(); // newest first

  return { success: true, payments };
}

// ── GET REELS ─────────────────────────────────────────────────
function getReels() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_REELS);
  if(!sheet) return { reels: [] };

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const reels = rows.map(r => ({
    id:         r[0],
    topic:      r[1],
    class:      String(r[2]),
    tags:       r[3] ? r[3].split(",").map(t=>t.trim()) : [],
    videoUrl:   r[4],
    difficulty: r[5]
  }));

  return { success: true, reels };
}

// ── GET USERS (admin) ─────────────────────────────────────────
function getUsers() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  if(!sheet) return { users: [] };

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const users = rows.map(r => ({
    name:       r[0],
    phone:      r[1],
    email:      r[2],
    class:      r[3],
    created_at: r[4]
  }));

  return { success: true, users };
}

// ── HELPER: get or create sheet with headers ──────────────────
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if(!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0284C7")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── UTILITY: Grant Drive access to a student email ────────────
// Run this manually from the Apps Script editor after verifying payment
function grantDriveAccess(studentEmail, folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    folder.addViewer(studentEmail);
    Logger.log("Access granted to: " + studentEmail);

    // Update Payments sheet
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_PAYMENTS);
    if(sheet) {
      const rows = sheet.getDataRange().getValues();
      for(let i = 1; i < rows.length; i++) {
        if(rows[i][3] === studentEmail) {
          sheet.getRange(i+1, 6).setValue("YES"); // Verified
          sheet.getRange(i+1, 7).setValue("YES"); // Access Given
          break;
        }
      }
    }
    return "Done";
  } catch(e) {
    Logger.log("Error: " + e.toString());
    return "Error: " + e.toString();
  }
}

// ── SAMPLE REELS SEEDER (run once manually) ───────────────────
function seedReelsData() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getOrCreateSheet(ss, SHEET_REELS, ["ID","Topic","Class","Tags","Video_URL","Difficulty"]);

  const sample = [
    ["r1","Newton's First Law","11","mechanics,newton","https://www.youtube.com/embed/VIDEO_ID","Easy"],
    ["r2","Projectile Motion","11","mechanics,kinematics","https://www.youtube.com/embed/VIDEO_ID","Medium"],
    ["r3","Work-Energy Theorem","11","energy,work","https://www.youtube.com/embed/VIDEO_ID","Medium"],
    ["r4","Coulomb's Law","12","electrostatics","https://www.youtube.com/embed/VIDEO_ID","Easy"],
    ["r5","Ohm's Law","12","current,circuits","https://www.youtube.com/embed/VIDEO_ID","Easy"],
    ["r6","Photoelectric Effect","12","modern physics","https://www.youtube.com/embed/VIDEO_ID","Hard"],
  ];

  sample.forEach(row => sheet.appendRow(row));
  Logger.log("Reels seeded: " + sample.length + " rows");
}
