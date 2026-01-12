/* 
  ExamAI Master Backend Script 
  包含圖片上傳至 Drive 功能
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
    // 新增：處理取得科目列表的請求
    return handleGetSubjects(ss);
  }
  
  return createResponse({ status: 'error', message: 'Unknown GET action' });
}

// 新增：取得不重複科目列表
function handleGetSubjects(ss) {
  var sheet = ss.getSheetByName("科目");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [科目] 工作表' });
  
  var data = sheet.getDataRange().getValues();
  var uniqueSubjects = {};
  var subjectsList = [];
  
  // 從第 1 列開始 (跳過標題列)
  for (var i = 1; i < data.length; i++) {
    // 假設 Subject 在第 2 欄 (Index 1)
    var rowSubject = data[i][1]; 
    
    if (rowSubject) {
      var cleanSubject = rowSubject.toString().trim();
      if (cleanSubject && !uniqueSubjects[cleanSubject]) {
        uniqueSubjects[cleanSubject] = true;
        subjectsList.push(cleanSubject);
      }
    }
  }
  
  // 排序後回傳
  subjectsList.sort();
  return createResponse({ status: 'success', subjects: subjectsList });
}

function handleGetScopes(ss, subject) {
  var sheet = ss.getSheetByName("科目");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [科目] 工作表' });
  
  var data = sheet.getDataRange().getValues();
  var uniqueScopes = {};
  var scopesList = [];
  
  for (var i = 1; i < data.length; i++) {
    var rowSubject = data[i][1];
    var rowScope = data[i][2];
    
    if (rowSubject == subject && rowScope) {
      var cleanScope = rowScope.toString().trim();
      if (cleanScope && !uniqueScopes[cleanScope]) {
        uniqueScopes[cleanScope] = true;
        scopesList.push(cleanScope);
      }
    }
  }
  
  return createResponse({ status: 'success', scopes: scopesList });
}

function handleUpload(ss, data) {
  var sheet = ss.getSheetByName("科目");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [科目] 工作表' });
  
  // 建立或取得存放圖片的資料夾
  var folderName = "ExamAI_Images";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    // 設定資料夾為公開讀取 (為了讓網頁能顯示圖片)
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  
  var questions = data.questions;
  var rows = [];
  
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var id = Utilities.getUuid();
    
    // 處理圖片上傳
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
      imageUrl // 新增第 12 欄 (Index 11) 存放圖片網址
    ]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  return createResponse({ status: 'success', count: rows.length });
}

// 輔助函式：將 Base64 存入 Drive 並回傳公開連結
function saveImageToDrive(folder, base64String, fileName) {
  var data = base64String.split('base64,')[1];
  var decodedBlob = Utilities.newBlob(Utilities.base64Decode(data), "image/png", fileName + ".png");
  var file = folder.createFile(decodedBlob);
  
  // 確保檔案也是公開的
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // 使用特殊的 URL 格式以確保可以直接在 <img> 標籤中載入
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
        diagramUrl: row[11] || "" // 讀取第 12 欄的圖片網址
      });
    }
  }
  
  return createResponse({ status: 'success', questions: resultQuestions });
}

function handleSaveResult(ss, data) {
  var sheet = ss.getSheetByName("紀錄");
  if (!sheet) return createResponse({ status: 'error', message: '找不到 [紀錄] 工作表' });
  
  var correctCount = data.results.filter(function(r){ return r.isCorrect }).length;
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

// 請執行此函式來完成授權
function runAuth() {
  DriveApp.getRootFolder();
  SpreadsheetApp.getActiveSpreadsheet();
  console.log("授權成功！請記得建立新版部署。");
}

function doAuth() {
  DriveApp.createFolder("Test_Auth_Folder");
}