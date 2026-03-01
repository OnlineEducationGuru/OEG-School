// ============================================================
// Online Education Guru - Google Apps Script Backend (code.gs)
// Deploy as Web App: Execute as ME, Access: Anyone
// ============================================================

// ---- CONFIGURATION ----
const SPREADSHEET_ID = '1mn5SnJRuXTqtq_fnMWTVqoHPyLqy2GVvrhWVOCfdIKQ'; // <-- Replace with your Sheet ID
const DRIVE_TEACHER_FOLDER_ID = '1qsjFHpg4fyKRaWL6Xuf1U0rkp2WsfbIG'; // Google Drive folder for teacher tools
const DRIVE_OFFICE_FOLDER_ID = '13XK52iTtAsqafShxoKeMhktnbPQqOcv6';   // Google Drive folder for office tools
const DRIVE_GAMES_FOLDER_ID = '18UoifVWIX5tddQhYbBr6eEO41PgIZS-v';     // Google Drive folder for games
const DRIVE_ASSETS_FOLDER_ID = '1Yq8cZ1eQYYJv3NTVEJC-QladOCUowTb1';   // Google Drive folder for logos/favicons

// ---- CORS & ENTRY POINTS ----
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || '';
    let postData = {};
    
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }
    
    // Merge GET params and POST body
    const allParams = Object.assign({}, params, postData);
    let result = {};

    switch (action) {
      // ---- Admin ----
      case 'adminLogin':
        result = adminLogin(allParams);
        break;
      case 'changeAdminPassword':
        result = changeAdminPassword(allParams);
        break;

      // ---- Site Settings ----
      case 'getSettings':
        result = getSettings();
        break;
      case 'updateSetting':
        result = updateSetting(allParams);
        break;
      case 'uploadAsset':
        result = uploadAsset(allParams);
        break;

      // ---- Breaking News ----
      case 'getBreakingNews':
        result = getSheetData('BreakingNews');
        break;
      case 'addBreakingNews':
        result = addRow('BreakingNews', allParams);
        break;
      case 'updateBreakingNews':
        result = updateRow('BreakingNews', allParams);
        break;
      case 'deleteBreakingNews':
        result = deleteRow('BreakingNews', allParams);
        break;

      // ---- Nav Tabs ----
      case 'getNavTabs':
        result = getSheetData('NavTabs');
        break;
      case 'addNavTab':
        result = addRow('NavTabs', allParams);
        break;
      case 'updateNavTab':
        result = updateRow('NavTabs', allParams);
        break;
      case 'deleteNavTab':
        result = deleteRow('NavTabs', allParams);
        break;

      // ---- Teacher Tools ----
      case 'getTeacherTools':
        result = getSheetData('TeacherTools');
        break;
      case 'addTeacherTool':
        result = addRow('TeacherTools', allParams);
        break;
      case 'updateTeacherTool':
        result = updateRow('TeacherTools', allParams);
        break;
      case 'deleteTeacherTool':
        result = deleteRow('TeacherTools', allParams);
        break;
      case 'uploadTeacherTool':
        result = uploadFileToDrive(allParams, DRIVE_TEACHER_FOLDER_ID, 'teacher');
        break;

      // ---- Office Tools ----
      case 'getOfficeTools':
        result = getSheetData('OfficeTools');
        break;
      case 'addOfficeTool':
        result = addRow('OfficeTools', allParams);
        break;
      case 'updateOfficeTool':
        result = updateRow('OfficeTools', allParams);
        break;
      case 'deleteOfficeTool':
        result = deleteRow('OfficeTools', allParams);
        break;
      case 'uploadOfficeTool':
        result = uploadFileToDrive(allParams, DRIVE_OFFICE_FOLDER_ID, 'office');
        break;

      // ---- Subjects ----
      case 'getSubjects':
        result = getSheetData('Subjects');
        break;
      case 'addSubject':
        result = addRow('Subjects', allParams);
        break;
      case 'updateSubject':
        result = updateRow('Subjects', allParams);
        break;
      case 'deleteSubject':
        result = deleteRow('Subjects', allParams);
        break;

      // ---- Standards ----
      case 'getStandards':
        result = getSheetData('Standards');
        break;
      case 'addStandard':
        result = addRow('Standards', allParams);
        break;
      case 'updateStandard':
        result = updateRow('Standards', allParams);
        break;
      case 'deleteStandard':
        result = deleteRow('Standards', allParams);
        break;

      // ---- Materials ----
      case 'getMaterials':
        result = getMaterials(allParams);
        break;
      case 'addMaterial':
        result = addRow('Materials', allParams);
        break;
      case 'updateMaterial':
        result = updateRow('Materials', allParams);
        break;
      case 'deleteMaterial':
        result = deleteRow('Materials', allParams);
        break;

      // ---- Vachan Lekhan ----
      case 'getVachanLekhan':
        result = getSheetData('VachanLekhan');
        break;
      case 'addVachanLekhan':
        result = addRow('VachanLekhan', allParams);
        break;
      case 'updateVachanLekhan':
        result = updateRow('VachanLekhan', allParams);
        break;
      case 'deleteVachanLekhan':
        result = deleteRow('VachanLekhan', allParams);
        break;

      // ---- Ganan ----
      case 'getGanan':
        result = getSheetData('Ganan');
        break;
      case 'addGanan':
        result = addRow('Ganan', allParams);
        break;
      case 'updateGanan':
        result = updateRow('Ganan', allParams);
        break;
      case 'deleteGanan':
        result = deleteRow('Ganan', allParams);
        break;

      // ---- Games ----
      case 'getGames':
        result = getSheetData('Games');
        break;
      case 'addGame':
        result = addRow('Games', allParams);
        break;
      case 'updateGame':
        result = updateRow('Games', allParams);
        break;
      case 'deleteGame':
        result = deleteRow('Games', allParams);
        break;
      case 'uploadGame':
        result = uploadFileToDrive(allParams, DRIVE_GAMES_FOLDER_ID, 'games');
        break;

      // ---- Quiz Categories ----
      case 'getQuizCategories':
        result = getSheetData('QuizCategories');
        break;
      case 'addQuizCategory':
        result = addRow('QuizCategories', allParams);
        break;
      case 'updateQuizCategory':
        result = updateRow('QuizCategories', allParams);
        break;
      case 'deleteQuizCategory':
        result = deleteRow('QuizCategories', allParams);
        break;

      // ---- Quiz Questions ----
      case 'getQuizQuestions':
        result = getQuizQuestions(allParams);
        break;
      case 'addQuizQuestion':
        result = addRow('QuizQuestions', allParams);
        break;
      case 'updateQuizQuestion':
        result = updateRow('QuizQuestions', allParams);
        break;
      case 'deleteQuizQuestion':
        result = deleteRow('QuizQuestions', allParams);
        break;

      // ---- Quiz Results ----
      case 'submitQuizResult':
        result = submitQuizResult(allParams);
        break;
      case 'getQuizResults':
        result = getSheetData('QuizResults');
        break;
      case 'getLeaderboard':
        result = getLeaderboard(allParams);
        break;
      case 'getMyScores':
        result = getMyScores(allParams);
        break;

      // ---- Student Auth ----
      case 'studentRegister':
        result = studentRegister(allParams);
        break;
      case 'studentLogin':
        result = studentLogin(allParams);
        break;

      // ---- Teacher Auth ----
      case 'teacherRegister':
        result = teacherRegister(allParams);
        break;
      case 'teacherLogin':
        result = teacherLogin(allParams);
        break;
      case 'verifyTeacherOTP':
        result = verifyTeacherOTP(allParams);
        break;
      case 'resendTeacherOTP':
        result = resendTeacherOTP(allParams);
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// GENERIC SHEET HELPERS
// ============================================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1; // 1-indexed sheet row
    rows.push(row);
  }

  // Filter active items if 'active' column exists
  const filtered = headers.includes('active')
    ? rows.filter(r => String(r.active).toLowerCase() !== 'false')
    : rows;

  // Sort by 'order' if exists
  if (headers.includes('order')) {
    filtered.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }

  return { success: true, data: filtered };
}

function addRow(sheetName, params) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    // No headers yet, create them from params
    const keys = Object.keys(params).filter(k => k !== 'action');
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    const values = keys.map(k => params[k] || '');
    sheet.appendRow(values);
    return { success: true, message: 'Row added with headers' };
  }

  const newRow = headers.map(h => params[h] !== undefined ? params[h] : '');
  
  // Auto-generate ID if 'id' column exists and no id provided
  if (headers.includes('id') && !params.id) {
    const idIndex = headers.indexOf('id');
    const lastRow = sheet.getLastRow();
    let maxId = 0;
    if (lastRow > 1) {
      const ids = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getValues();
      ids.forEach(r => {
        const n = parseInt(r[0]);
        if (!isNaN(n) && n > maxId) maxId = n;
      });
    }
    newRow[idIndex] = maxId + 1;
  }

  sheet.appendRow(newRow);
  return { success: true, message: 'Row added successfully' };
}

function updateRow(sheetName, params) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  if (idIndex === -1) {
    return { success: false, error: 'No id column found' };
  }

  const targetId = String(params.id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === targetId) {
      headers.forEach((h, j) => {
        if (params[h] !== undefined && h !== 'id') {
          sheet.getRange(i + 1, j + 1).setValue(params[h]);
        }
      });
      return { success: true, message: 'Row updated' };
    }
  }
  return { success: false, error: 'Row not found with id: ' + targetId };
}

function deleteRow(sheetName, params) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  if (idIndex === -1) {
    return { success: false, error: 'No id column found' };
  }

  const targetId = String(params.id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Row deleted' };
    }
  }
  return { success: false, error: 'Row not found' };
}

// ============================================================
// ADMIN AUTH
// ============================================================

function adminLogin(params) {
  const sheet = getSheet('AdminLogin');
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    // Create default admin if no rows
    sheet.getRange(1, 1, 1, 2).setValues([['username', 'password']]);
    sheet.appendRow(['admin', 'admin123']);
    if (params.username === 'admin' && params.password === 'admin123') {
      return { success: true, message: 'Login successful' };
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.username && data[i][1] === params.password) {
      return { success: true, message: 'Login successful' };
    }
  }
  return { success: false, error: 'Invalid username or password' };
}

function changeAdminPassword(params) {
  const sheet = getSheet('AdminLogin');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.username && data[i][1] === params.oldPassword) {
      sheet.getRange(i + 1, 2).setValue(params.newPassword);
      return { success: true, message: 'Password changed' };
    }
  }
  return { success: false, error: 'Invalid current credentials' };
}

// ============================================================
// SITE SETTINGS
// ============================================================

function getSettings() {
  const sheet = getSheet('SiteSettings');
  const data = sheet.getDataRange().getValues();
  const settings = {};

  if (data.length < 2) {
    // Initialize default settings
    const defaults = [
      ['key', 'value'],
      ['siteName', 'Online Education Guru'],
      ['logoUrl', ''],
      ['faviconUrl', ''],
      ['headerColor', '#1a1a2e'],
      ['footerText', '© 2026 Online Education Guru. All Rights Reserved.'],
      ['contactEmail', ''],
      ['contactPhone', ''],
      ['aboutText', 'Online Education Guru એ ગુજરાત શિક્ષણ માટેનું એક સંપૂર્ણ ઓનલાઈન પ્લેટફોર્મ છે.'],
      ['address', '']
    ];
    sheet.getRange(1, 1, defaults.length, 2).setValues(defaults);
    defaults.slice(1).forEach(r => { settings[r[0]] = r[1]; });
    return { success: true, data: settings };
  }

  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  return { success: true, data: settings };
}

function updateSetting(params) {
  const sheet = getSheet('SiteSettings');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.key) {
      sheet.getRange(i + 1, 2).setValue(params.value);
      return { success: true, message: 'Setting updated' };
    }
  }
  // Add new setting
  sheet.appendRow([params.key, params.value]);
  return { success: true, message: 'Setting added' };
}

// ============================================================
// FILE UPLOAD TO GOOGLE DRIVE
// ============================================================

function uploadFileToDrive(params, folderId, folderName) {
  try {
    const fileName = params.fileName;
    const fileContent = params.fileContent; // Base64 encoded
    const mimeType = params.mimeType || 'text/html';

    if (!fileName || !fileContent) {
      return { success: false, error: 'fileName and fileContent are required' };
    }

    // Validate .html extension
    if (!fileName.toLowerCase().endsWith('.html')) {
      return { success: false, error: 'Only .html files are allowed' };
    }

    const decoded = Utilities.base64Decode(fileContent);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getUrl();
    const fileId = file.getId();

    return {
      success: true,
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      fileId: fileId,
      fileName: fileName,
      folder: folderName
    };
  } catch (err) {
    return { success: false, error: 'Upload failed: ' + err.toString() };
  }
}

function uploadAsset(params) {
  try {
    const fileName = params.fileName;
    const fileContent = params.fileContent; // Base64 encoded
    const mimeType = params.mimeType || 'image/png';

    const decoded = Utilities.base64Decode(fileContent);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    const folder = DriveApp.getFolderById(DRIVE_ASSETS_FOLDER_ID);
    
    // Delete old file with same name
    const existing = folder.getFilesByName(fileName);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const directUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    
    return { success: true, url: directUrl, fileId: file.getId() };
  } catch (err) {
    return { success: false, error: 'Asset upload failed: ' + err.toString() };
  }
}

// ============================================================
// MATERIALS (Filtered)
// ============================================================

function getMaterials(params) {
  const sheet = getSheet('Materials');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1;

    // Apply filters
    let match = true;
    if (params.standardId && String(row.standardId) !== String(params.standardId)) match = false;
    if (params.subjectId && String(row.subjectId) !== String(params.subjectId)) match = false;
    if (params.type && String(row.type) !== String(params.type)) match = false;

    if (match) rows.push(row);
  }

  rows.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  return { success: true, data: rows };
}

// ============================================================
// QUIZ QUESTIONS (Filtered)
// ============================================================

function getQuizQuestions(params) {
  const sheet = getSheet('QuizQuestions');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }

    let match = true;
    if (params.categoryId && String(row.categoryId) !== String(params.categoryId)) match = false;
    if (params.stdId && String(row.stdId) !== String(params.stdId)) match = false;
    if (params.subjectId && String(row.subjectId) !== String(params.subjectId)) match = false;
    if (params.chapter && String(row.chapter) !== String(params.chapter)) match = false;

    if (match) rows.push(row);
  }

  // Shuffle questions
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  // Limit to questionCount if specified
  const limit = parseInt(params.limit) || rows.length;
  return { success: true, data: rows.slice(0, limit) };
}

// ============================================================
// QUIZ RESULTS & LEADERBOARD
// ============================================================

function submitQuizResult(params) {
  const sheet = getSheet('QuizResults');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    const cols = ['timestamp', 'studentName', 'mobile', 'categoryId', 'categoryName', 'stdId', 'subjectId', 'chapter', 'score', 'total', 'percentage'];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
  }

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const percentage = params.total > 0 ? Math.round((params.score / params.total) * 100) : 0;

  sheet.appendRow([
    now,
    params.studentName || '',
    params.mobile || '',
    params.categoryId || '',
    params.categoryName || '',
    params.stdId || '',
    params.subjectId || '',
    params.chapter || '',
    params.score || 0,
    params.total || 0,
    percentage
  ]);

  return {
    success: true,
    message: 'Result submitted',
    certificate: {
      name: params.studentName,
      score: params.score,
      total: params.total,
      percentage: percentage,
      category: params.categoryName,
      date: now,
      signedBy: 'Online Education Guru'
    }
  };
}

function getLeaderboard(params) {
  const sheet = getSheet('QuizResults');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }

    let match = true;
    if (params.categoryId && String(row.categoryId) !== String(params.categoryId)) match = false;

    if (match) rows.push(row);
  }

  // Sort by percentage descending
  rows.sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0));

  // Return top 50
  return { success: true, data: rows.slice(0, 50) };
}

function getMyScores(params) {
  const sheet = getSheet('QuizResults');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    if (String(row.mobile) === String(params.mobile)) {
      rows.push(row);
    }
  }

  rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return { success: true, data: rows };
}

// ============================================================
// STUDENT AUTH
// ============================================================

function studentRegister(params) {
  const sheet = getSheet('Students');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    sheet.getRange(1, 1, 1, 5).setValues([['id', 'name', 'schoolName', 'mobile', 'password']]);
  }

  // Check if mobile already exists
  const mobileIndex = headers.indexOf('mobile');
  if (mobileIndex !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][mobileIndex]) === String(params.mobile)) {
        return { success: false, error: 'આ મોબાઈલ નંબર પહેલેથી રજિસ્ટર્ડ છે' };
      }
    }
  }

  // Validate mobile
  if (!params.mobile || String(params.mobile).length !== 10) {
    return { success: false, error: 'કૃપયા 10 અંકનો સાચો મોબાઈલ નંબર નાખો' };
  }

  const id = Date.now();
  sheet.appendRow([id, params.name, params.schoolName, params.mobile, params.password || params.mobile]);
  return { success: true, message: 'રજિસ્ટ્રેશન સફળ', studentId: id };
}

function studentLogin(params) {
  const sheet = getSheet('Students');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, error: 'કોઈ વિદ્યાર્થી રજિસ્ટર્ડ નથી' };

  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => { row[h] = data[i][j]; });

    if (String(row.mobile) === String(params.mobile) && String(row.password) === String(params.password)) {
      return {
        success: true,
        message: 'Login successful',
        student: { id: row.id, name: row.name, schoolName: row.schoolName, mobile: row.mobile }
      };
    }
  }
  return { success: false, error: 'ખોટો મોબાઈલ નંબર અથવા પાસવર્ડ' };
}

// ============================================================
// TEACHER AUTH (with OTP verification)
// ============================================================

function teacherRegister(params) {
  const sheet = getSheet('Teachers');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    sheet.getRange(1, 1, 1, 9).setValues([['id', 'name', 'schoolName', 'daysCode', 'mobile', 'email', 'verified', 'otp', 'password']]);
  }

  // Validate mobile
  if (!params.mobile || String(params.mobile).length !== 10) {
    return { success: false, error: 'કૃપયા 10 અંકનો સાચો મોબાઈલ નંબર નાખો' };
  }

  // Check if email already exists
  const emailIndex = headers.indexOf('email');
  if (emailIndex !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][emailIndex]) === String(params.email)) {
        return { success: false, error: 'આ ઈમેલ પહેલેથી રજિસ્ટર્ડ છે' };
      }
    }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  const id = Date.now();

  sheet.appendRow([
    id,
    params.name,
    params.schoolName,
    params.daysCode,
    params.mobile,
    params.email,
    'false',
    otp,
    params.password || params.mobile
  ]);

  // Send OTP email
  try {
    MailApp.sendEmail({
      to: params.email,
      subject: 'Online Education Guru - OTP Verification',
      htmlBody: '<div style="font-family:Arial;padding:20px;background:#f5f5f5;">' +
        '<h2 style="color:#6c63ff;">Online Education Guru</h2>' +
        '<p>નમસ્તે ' + params.name + ',</p>' +
        '<p>તમારો OTP કોડ છે:</p>' +
        '<h1 style="color:#6c63ff;font-size:36px;letter-spacing:5px;">' + otp + '</h1>' +
        '<p>આ OTP નો ઉપયોગ તમારું ઈમેલ verify કરવા માટે કરો.</p>' +
        '<hr><p style="color:#999;">Online Education Guru Team</p></div>'
    });
  } catch (e) {
    // Email sending failed, but registration is done
    return { success: true, message: 'રજિસ્ટ્રેશન થયું, પરંતુ OTP મોકલવામાં સમસ્યા. ફરી ટ્રાય કરો.', teacherId: id };
  }

  return { success: true, message: 'રજિસ્ટ્રેશન સફળ. OTP ' + params.email + ' પર મોકલ્યો.', teacherId: id };
}

function verifyTeacherOTP(params) {
  const sheet = getSheet('Teachers');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('email');
  const otpIndex = headers.indexOf('otp');
  const verifiedIndex = headers.indexOf('verified');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailIndex]) === String(params.email)) {
      if (String(data[i][otpIndex]) === String(params.otp)) {
        sheet.getRange(i + 1, verifiedIndex + 1).setValue('true');
        return { success: true, message: 'ઈમેલ વેરિફાઈ થયું' };
      } else {
        return { success: false, error: 'ખોટો OTP' };
      }
    }
  }
  return { success: false, error: 'ઈમેલ મળ્યું નહીં' };
}

function resendTeacherOTP(params) {
  const sheet = getSheet('Teachers');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('email');
  const otpIndex = headers.indexOf('otp');
  const nameIndex = headers.indexOf('name');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailIndex]) === String(params.email)) {
      const newOtp = Math.floor(100000 + Math.random() * 900000);
      sheet.getRange(i + 1, otpIndex + 1).setValue(newOtp);

      try {
        MailApp.sendEmail({
          to: params.email,
          subject: 'Online Education Guru - New OTP',
          htmlBody: '<div style="font-family:Arial;padding:20px;">' +
            '<h2 style="color:#6c63ff;">Online Education Guru</h2>' +
            '<p>નવો OTP: <strong style="font-size:24px;">' + newOtp + '</strong></p></div>'
        });
        return { success: true, message: 'નવો OTP મોકલ્યો' };
      } catch (e) {
        return { success: false, error: 'OTP મોકલવામાં સમસ્યા' };
      }
    }
  }
  return { success: false, error: 'ઈમેલ મળ્યું નહીં' };
}

function teacherLogin(params) {
  const sheet = getSheet('Teachers');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, error: 'કોઈ શિક્ષક રજિસ્ટર્ડ નથી' };

  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => { row[h] = data[i][j]; });

    if (String(row.email) === String(params.email) && String(row.password) === String(params.password)) {
      if (String(row.verified) !== 'true') {
        return { success: false, error: 'કૃપયા પહેલા ઈમેલ વેરિફાઈ કરો', needVerification: true, email: row.email };
      }
      return {
        success: true,
        message: 'Login successful',
        teacher: { id: row.id, name: row.name, schoolName: row.schoolName, email: row.email, mobile: row.mobile }
      };
    }
  }
  return { success: false, error: 'ખોટો ઈમેલ અથવા પાસવર્ડ' };
}

// ============================================================
// INITIALIZATION - Create all required sheets
// ============================================================

function initializeSheets() {
  const sheetNames = [
    'AdminLogin', 'SiteSettings', 'BreakingNews', 'NavTabs',
    'TeacherTools', 'OfficeTools', 'Subjects', 'Standards',
    'Materials', 'VachanLekhan', 'Ganan', 'Games',
    'QuizCategories', 'QuizQuestions', 'QuizResults',
    'Students', 'Teachers'
  ];

  const headers = {
    'AdminLogin': ['username', 'password'],
    'SiteSettings': ['key', 'value'],
    'BreakingNews': ['id', 'text', 'link', 'active', 'order'],
    'NavTabs': ['id', 'label', 'link', 'icon', 'order', 'active'],
    'TeacherTools': ['id', 'name', 'fileName', 'fileUrl', 'icon', 'order', 'active'],
    'OfficeTools': ['id', 'name', 'fileName', 'fileUrl', 'icon', 'order', 'active'],
    'Subjects': ['id', 'subjectName', 'icon', 'order', 'active'],
    'Standards': ['id', 'standardName', 'icon', 'order', 'active'],
    'Materials': ['id', 'standardId', 'subjectId', 'type', 'title', 'driveLink', 'order'],
    'VachanLekhan': ['id', 'title', 'link', 'icon', 'order', 'active'],
    'Ganan': ['id', 'title', 'link', 'icon', 'order', 'active'],
    'Games': ['id', 'name', 'subject', 'fileName', 'fileUrl', 'icon', 'order', 'active'],
    'QuizCategories': ['id', 'name', 'icon', 'order', 'active', 'questionCount'],
    'QuizQuestions': ['id', 'categoryId', 'stdId', 'subjectId', 'chapter', 'question', 'optA', 'optB', 'optC', 'optD', 'answer'],
    'QuizResults': ['timestamp', 'studentName', 'mobile', 'categoryId', 'categoryName', 'stdId', 'subjectId', 'chapter', 'score', 'total', 'percentage'],
    'Students': ['id', 'name', 'schoolName', 'mobile', 'password'],
    'Teachers': ['id', 'name', 'schoolName', 'daysCode', 'mobile', 'email', 'verified', 'otp', 'password']
  };

  const ss = getSpreadsheet();
  sheetNames.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (headers[name]) {
        sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
      }
    }
  });

  // Add default admin
  const adminSheet = ss.getSheetByName('AdminLogin');
  if (adminSheet.getLastRow() < 2) {
    adminSheet.appendRow(['admin', 'admin123']);
  }

  // Add default standards
  const stdSheet = ss.getSheetByName('Standards');
  if (stdSheet.getLastRow() < 2) {
    const stds = [
      [1, 'બાલ વાટિકા', '💒', 1, 'true'],
      [2, 'ધોરણ 1', '📖', 2, 'true'],
      [3, 'ધોરણ 2', '📖', 3, 'true'],
      [4, 'ધોરણ 3', '📖', 4, 'true'],
      [5, 'ધોરણ 4', '📖', 5, 'true'],
      [6, 'ધોરણ 5', '📖', 6, 'true'],
      [7, 'ધોરણ 6', '📖', 7, 'true'],
      [8, 'ધોરણ 7', '📖', 8, 'true'],
      [9, 'ધોરણ 8', '📖', 9, 'true'],
      [10, 'ધોરણ 9', '📗', 10, 'true'],
      [11, 'ધોરણ 10', '📗', 11, 'true'],
      [12, 'ધોરણ 11', '📘', 12, 'true'],
      [13, 'ધોરણ 12', '📘', 13, 'true']
    ];
    sheet.getRange(2, 1, stds.length, 5).setValues(stds);
  }

  // Add default subjects
  const subSheet = ss.getSheetByName('Subjects');
  if (subSheet.getLastRow() < 2) {
    const subs = [
      [1, 'ગુજરાતી', '📝', 1, 'true'],
      [2, 'હિન્દી', '📝', 2, 'true'],
      [3, 'English', '📝', 3, 'true'],
      [4, 'ગણિત', '🔢', 4, 'true'],
      [5, 'વિજ્ઞાન', '🔬', 5, 'true'],
      [6, 'સામાજિક વિજ્ઞાન', '🌍', 6, 'true'],
      [7, 'સંસ્કૃત', '📜', 7, 'true'],
      [8, 'ચિત્રકામ', '🎨', 8, 'true'],
      [9, 'શારીરિક શિક્ષણ', '🏃', 9, 'true'],
      [10, 'કમ્પ્યુટર', '💻', 10, 'true']
    ];
    subSheet.getRange(2, 1, subs.length, 5).setValues(subs);
  }

  // Add default quiz categories
  const quizSheet = ss.getSheetByName('QuizCategories');
  if (quizSheet.getLastRow() < 2) {
    const cats = [
      [1, 'ધોરણ વાઈઝ Quiz', '📖', 1, 'true', 20],
      [2, 'GK Quiz', '🧠', 2, 'true', 25],
      [3, 'NMMS Quiz', '🏆', 3, 'true', 30],
      [4, 'PSE Quiz', '📋', 4, 'true', 25],
      [5, 'CET Quiz', '🎯', 5, 'true', 30],
      [6, 'Gyan Sadhana Quiz', '📚', 6, 'true', 20]
    ];
    quizSheet.getRange(2, 1, cats.length, 6).setValues(cats);
  }

  return { success: true, message: 'All sheets initialized successfully!' };
}
