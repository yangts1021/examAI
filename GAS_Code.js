/* 
  ExamAI Master Backend Script 
  包含圖片上傳至 Drive 功能 & 效能優化版
*/

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    var action = payload.action;
    var data = payload.data;

    if (action === 'upload') {
      return handleUpload(ss, data);
    } else if (action === 'saveResult') {
      return handleSaveResult(ss, data);
    }

    return createResponse({ status: 'error', message: 'Unknown action' });

  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() });
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;

  if (action === 'getQuestions') {
    return handleGetQuestions(ss, e.parameter.subject, e.parameter.scope);
  } else if (action === 'getScopes') {
    return handleGetScopes(ss, e.parameter.subject);
  } else if (action === 'getSubjects') {
    return handleGetSubjects(ss);
  }

  return createResponse({ status: 'error', message: 'Unknown GET action' });
}

// 優化：從 [分類索引] 工作表讀取，速度快很多
function handleGetSubjects(ss) {
  var sheet = getOrInitMetadataSheet(ss);
  var data = sheet.getDataRange().getValues();

  var uniqueSubjects = {};
  var subjectsList = [];

  // Skip header (row 0)
  for (var i = 1; i < data.length; i++) {
    var sub = data[i][0]; // Column A: Subject
    if (sub && !uniqueSubjects[sub]) {
      uniqueSubjects[sub] = true;
      subjectsList.push(sub);
    }
  }

  subjectsList.sort();
  return createResponse({ status: 'success', subjects: subjectsList });
}

// 優化：從 [分類索引] 工作表讀取
function handleGetScopes(ss, subject) {
  var sheet = getOrInitMetadataSheet(ss);
  var data = sheet.getDataRange().getValues();

  var uniqueScopes = {};
  var scopesList = [];

  for (var i = 1; i < data.length; i++) {
    var rowSubject = data[i][0]; // Column A: Subject
    var rowScope = data[i][1];   // Column B: Scope

    if (rowSubject == subject && rowScope) {
      if (!uniqueScopes[rowScope]) {
        uniqueScopes[rowScope] = true;
        scopesList.push(rowScope);
      }
    }
  }

  scopesList.sort();
  return createResponse({ status: 'success', scopes: scopesList });
}

function handleUpload(ss, data) {
  var sheet = ss.getSheetByName("科目");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [科目] 工作表' });

  // 1. Update Metadata Index (Category Index)
  updateMetadata(ss, data.subject, data.scope);

  // 2. Save Questions
  var folderName = "ExamAI_Images";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  var questions = data.questions;
  var rows = [];

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var id = Utilities.getUuid();

    var imageUrl = "";
    if (q.diagramUrl && q.diagramUrl.indexOf("base64,") !== -1) {
      try {
        imageUrl = saveImageToDrive(folder, q.diagramUrl, data.subject + "_" + (q.questionNumber || i));
      } catch (e) {
        imageUrl = "Error saving image: " + e.toString();
      }
    }

    rows.push([
      id,
      data.subject,
      data.scope,
      q.questionNumber || (i + 1),
      q.text,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.correctAnswer,
      q.explanation,
      imageUrl,
      q.groupId || "",
      q.groupContent || ""
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return createResponse({ status: 'success', count: rows.length });
}

// Helper: Ensure Metadata Sheet exists and return it
function getOrInitMetadataSheet(ss) {
  var sheetName = "分類索引";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Subject", "Scope"]); // Header
  }
  return sheet;
}

// Helper: Update Metadata Sheet if new Subject/Scope combination
function updateMetadata(ss, subject, scope) {
  var sheet = getOrInitMetadataSheet(ss);
  var data = sheet.getDataRange().getValues();

  var exists = false;
  // Start from 1 to skip header
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == subject && data[i][1] == scope) {
      exists = true;
      break;
    }
  }

  if (!exists) {
    sheet.appendRow([subject, scope]);
  }
}

// -------------------------------------------------------------
// Migration Tool: Run this ONCE to populate the new index
// -------------------------------------------------------------
function rebuildMetadataIndex() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var questionSheet = ss.getSheetByName("科目");
  var metaSheet = getOrInitMetadataSheet(ss); // Creates if not exists

  // Clear existing data (except header if you want, but easier to clear all)
  metaSheet.clear();
  metaSheet.appendRow(["Subject", "Scope"]);

  var data = questionSheet.getDataRange().getValues();
  var seen = {};

  // Scan all questions
  // Assuming Subject is Col B (Index 1), Scope is Col C (Index 2)
  for (var i = 1; i < data.length; i++) {
    var sub = data[i][1];
    var scp = data[i][2];

    if (sub && scp) {
      var key = sub + "_" + scp;
      if (!seen[key]) {
        seen[key] = true;
        metaSheet.appendRow([sub, scp]);
      }
    }
  }

  console.log("Rebuild complete. Metadata sheet updated.");
}

function saveImageToDrive(folder, base64String, fileName) {
  var data = base64String.split('base64,')[1];
  var decodedBlob = Utilities.newBlob(Utilities.base64Decode(data), "image/png", fileName + ".png");
  var file = folder.createFile(decodedBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://lh3.googleusercontent.com/d/" + file.getId();
}

function handleGetQuestions(ss, subject, scope) {
  var sheet = ss.getSheetByName("科目");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [科目] 工作表' });

  var data = sheet.getDataRange().getValues();
  var resultQuestions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1] == subject && (scope === "" || row[2] == scope)) {
      resultQuestions.push({
        id: row[0],
        questionNumber: row[3],
        text: row[4],
        optionA: row[5],
        optionB: row[6],
        optionC: row[7],
        optionD: row[8],
        correctAnswer: row[9],
        explanation: row[10],
        diagramUrl: row[11] || "",
        groupId: row[12] || "",
        groupContent: row[13] || ""
      });
    }
  }

  return createResponse({ status: 'success', questions: resultQuestions });
}

function handleSaveResult(ss, data) {
  var sheet = ss.getSheetByName("紀錄");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [紀錄] 工作表' });

  var correctCount = data.results.filter(function (r) { return r.isCorrect }).length;
  var total = data.results.length;
  var scoreString = correctCount + " / " + total;

  sheet.appendRow([
    new Date(),
    data.subject,
    data.scope,
    scoreString,
    JSON.stringify(data.results)
  ]);

  return createResponse({ status: 'success' });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
