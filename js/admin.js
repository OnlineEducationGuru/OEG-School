// ============================================================
// Online Education Guru - Admin Panel Logic (admin.js)
// ============================================================

let currentModal = null;
let currentEditId = null;

// ============================================================
// LOGIN / LOGOUT
// ============================================================

async function handleAdminLogin() {
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value.trim();
    if (!username || !password) { showToast('Username અને Password ભરો', 'error'); return; }

    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Loading...'; btn.disabled = true;

    const res = await api('adminLogin', { username, password });
    if (res.success) {
        adminLogin(username, password);
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        loadDashboard();
        showToast('Login successful', 'success');
    } else {
        showToast(res.error || 'Login failed', 'error');
    }
    btn.textContent = 'Login'; btn.disabled = false;
}

function handleAdminLogout() {
    adminLogout();
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminLoginScreen').style.display = 'flex';
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', function () {
    if (isAdmin()) {
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        loadDashboard();
    }

    // Enter key for login
    document.getElementById('adminPass').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleAdminLogin();
    });
});

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================

function switchSection(sectionId, el) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));

    const sec = document.getElementById('sec-' + sectionId);
    if (sec) sec.classList.add('active');
    if (el) el.classList.add('active');

    // Load data for section
    const loaders = {
        'dashboard': loadDashboard,
        'breaking-news': loadBreakingNews_admin,
        'nav-tabs': loadNavTabs,
        'standards': loadStandards,
        'subjects': loadSubjects,
        'materials': loadMaterialsAdmin,
        'teacher-tools': loadTeacherTools,
        'office-tools': loadOfficeTools,
        'vachan-lekhan': loadVachanLekhan,
        'ganan': loadGanan,
        'games': loadGames,
        'quiz-categories': loadQuizCategories,
        'quiz-questions': loadQuizQuestions,
        'quiz-results': loadQuizResults,
        'settings': loadSettings
    };
    if (loaders[sectionId]) loaders[sectionId]();

    // Close mobile sidebar
    document.getElementById('adminSidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('open');
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
    const [students, teachers, results, materials] = await Promise.all([
        api('getSheetData', { sheetName: 'Students' }),
        api('getSheetData', { sheetName: 'Teachers' }),
        api('getQuizResults'),
        api('getMaterials', {})
    ]);

    document.getElementById('statStudents').textContent = students.success ? students.data.length : 0;
    document.getElementById('statTeachers').textContent = teachers.success ? teachers.data.length : 0;
    document.getElementById('statQuizzes').textContent = results.success ? results.data.length : 0;
    document.getElementById('statMaterials').textContent = materials.success ? materials.data.length : 0;
}

// ============================================================
// GENERIC CRUD HELPERS
// ============================================================

function renderItemList(items, containerId, displayField, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="no-data"><div class="no-data-icon">📋</div>No data found</div>';
        return;
    }

    container.innerHTML = items.map(item => {
        const isActive = item.active === undefined || (String(item.active).toLowerCase() !== 'false');
        const toggleBtn = (item.active !== undefined || options.sheetName)
            ? `<button class="btn btn-sm ${isActive ? 'btn-success' : 'btn-secondary'}" style="min-width:80px;font-size:12px;" onclick="toggleItemActive('${item.id}', '${options.sheetName || ''}', '${containerId}')">${isActive ? '✅ Active' : '❌ Deactive'}</button>`
            : '';
        return `
    <div class="item-row" data-id="${item.id}" style="${!isActive ? 'opacity:0.55;' : ''}">
      <span style="font-size:1.3rem;">${item.icon || '📄'}</span>
      <span class="item-name">${item[displayField] || item.name || item.title || item.text || ''}</span>
      <div class="item-actions">
        ${toggleBtn}
        ${options.onEdit ? `<button class="btn btn-sm btn-secondary" onclick="${options.onEdit}('${item.id}')">✏️</button>` : ''}
        ${options.onDelete ? `<button class="btn btn-sm btn-danger" onclick="${options.onDelete}('${item.id}')">🗑️</button>` : ''}
      </div>
    </div>
  `;
    }).join('');
}

// Sheet name map for toggle
const sheetNameForContainer = {
    breakingNewsList: 'BreakingNews',
    navTabsList: 'NavTabs',
    standardsList: 'Standards',
    subjectsList: 'Subjects',
    materialsList: 'Materials',
    teacherToolsList: 'TeacherTools',
    officeToolsList: 'OfficeTools',
    vachanLekhanList: 'VachanLekhan',
    gananList: 'Ganan',
    gamesList: 'Games',
    quizCategoriesList: 'QuizCategories',
    quizQuestionsList: 'QuizQuestions'
};

// Reload function map
const reloadForContainer = {
    breakingNewsList: () => loadBreakingNews_admin(),
    navTabsList: () => loadNavTabs(),
    standardsList: () => loadStandards(),
    subjectsList: () => loadSubjects(),
    materialsList: () => loadMaterialsAdmin(),
    teacherToolsList: () => loadTeacherTools(),
    officeToolsList: () => loadOfficeTools(),
    vachanLekhanList: () => loadVachanLekhan(),
    gananList: () => loadGanan(),
    gamesList: () => loadGames(),
    quizCategoriesList: () => loadQuizCategories(),
    quizQuestionsList: () => loadQuizQuestions()
};

async function toggleItemActive(id, sheetName, containerId) {
    const sheet = sheetName || sheetNameForContainer[containerId] || '';
    if (!sheet) { showToast('Sheet not found', 'error'); return; }

    showLoader('Updating...');
    const res = await api('toggleActive', { sheetName: sheet, id });
    hideLoader();

    if (res.success) {
        showToast(res.active === 'true' ? '🟢 Activated' : '🔴 Deactivated', 'success');
        // Reload the section
        if (reloadForContainer[containerId]) reloadForContainer[containerId]();
    } else {
        showToast(res.error || 'Error', 'error');
    }
}

// ============================================================
// MODAL SYSTEM
// ============================================================

function openModal(title, bodyHtml, saveCallback) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('adminModal').classList.add('active');
    currentModal = saveCallback;
}

function closeModal() {
    document.getElementById('adminModal').classList.remove('active');
    currentModal = null;
    currentEditId = null;
}

function modalSave() {
    if (currentModal) currentModal();
}

// ============================================================
// BREAKING NEWS CRUD
// ============================================================

async function loadBreakingNews_admin() {
    const res = await api('getBreakingNews');
    renderItemList(res.success ? res.data : [], 'breakingNewsList', 'text', {
        onEdit: 'editBreakingNews',
        onDelete: 'deleteBreakingNewsItem'
    });
}

function openAddModal(type) {
    const modalConfigs = {
        breakingNews: {
            title: 'Add Breaking News',
            body: `
        <div class="form-group"><label class="form-label">Text</label><input class="form-input" id="mText" placeholder="News text"></div>
        <div class="form-group"><label class="form-label">Link</label><input class="form-input" id="mLink" placeholder="https://..."></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
      `,
            save: saveBreakingNews
        },
        navTabs: {
            title: 'Add Nav Tab',
            body: `
        <div class="form-group"><label class="form-label">Label</label><input class="form-input" id="mLabel" placeholder="Tab label"></div>
        <div class="form-group"><label class="form-label">Link</label><input class="form-input" id="mLink" placeholder="page.html"></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mIcon" placeholder="🏠"></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
      `,
            save: saveNavTab
        },
        standards: {
            title: 'Add Standard',
            body: `
        <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="mName" placeholder="ધોરણ X"></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mIcon" placeholder="📖"></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
      `,
            save: saveStandard
        },
        subjects: {
            title: 'Add Subject',
            body: `
        <div class="form-group"><label class="form-label">Subject Name</label><input class="form-input" id="mSubjectName" placeholder="ગુજરાતી"></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mIcon" placeholder="📝"></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
      `,
            save: saveSubject
        },
        materials: {
            title: 'Add Material',
            body: `
        <div class="form-group"><label class="form-label">Standard</label><select class="form-select" id="mStandardId"></select></div>
        <div class="form-group"><label class="form-label">Subject</label><select class="form-select" id="mSubjectId"></select></div>
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-select" id="mType" onchange="toggleCustomType()">
            <option value="textbook">પાઠ્યપુસ્તક</option>
            <option value="workbook">સ્વાધ્યાયપોથી</option>
            <option value="testpaper">ટેસ્ટ પેપર</option>
            <option value="solution">પેપર સોલ્યુશન</option>
            <option value="other">અન્ય</option>
            <option value="__custom__">➕ નવો Type ઉમેરો...</option>
          </select>
        </div>
        <div class="form-group" id="customTypeGroup" style="display:none;">
          <label class="form-label">Custom Type Name</label>
          <input class="form-input" id="mCustomType" placeholder="e.g. નોટ્સ, પ્રેક્ટિસ પેપર...">
        </div>
        <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="mTitle" placeholder="Material title"></div>
        <div class="form-group"><label class="form-label">Google Drive Link</label><input class="form-input" id="mDriveLink" placeholder="https://drive.google.com/..."></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
      `,
            save: saveMaterial,
            onOpen: loadMaterialDropdowns
        },
        vachanLekhan: {
            title: 'Add વાંચન-લેખન Item',
            body: `
        <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="mTitle" placeholder="Title"></div>
        <div class="form-group"><label class="form-label">Link</label><input class="form-input" id="mLink" placeholder="https://..."></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mIcon" placeholder="📖"></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
      `,
            save: saveVachanLekhan
        },
        ganan: {
            title: 'Add ગણન Item',
            body: `
        <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="mTitle" placeholder="Title"></div>
        <div class="form-group"><label class="form-label">Link</label><input class="form-input" id="mLink" placeholder="https://..."></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mIcon" placeholder="🔢"></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
      `,
            save: saveGanan
        },
        quizCategories: {
            title: 'Add Quiz Category',
            body: `
        <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="mName" placeholder="Category name"></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mIcon" placeholder="❓"></div>
        <div class="form-group"><label class="form-label">Question Count</label><input type="number" class="form-input" id="mQuestionCount" value="20"></div>
        <div class="form-group"><label class="form-label">Order</label><input type="number" class="form-input" id="mOrder" value="1"></div>
        <div class="form-group"><label class="form-label">Active</label><select class="form-select" id="mActive"><option value="true">Yes</option><option value="false">No</option></select></div>
      `,
            save: saveQuizCategory
        },
        quizQuestions: {
            title: 'Add Quiz Question',
            body: `
        <div class="form-group"><label class="form-label">Category</label><select class="form-select" id="mCategoryId"></select></div>
        <div class="form-group"><label class="form-label">Standard</label><select class="form-select" id="mStdId"><option value="">-</option></select></div>
        <div class="form-group"><label class="form-label">Subject</label><select class="form-select" id="mSubjectId"><option value="">-</option></select></div>
        <div class="form-group"><label class="form-label">Chapter</label><input class="form-input" id="mChapter" placeholder="Chapter name or number"></div>
        <div class="form-group"><label class="form-label">Question</label><textarea class="form-input" id="mQuestion" rows="3" placeholder="Question text"></textarea></div>
        <div class="form-group"><label class="form-label">Option A</label><input class="form-input" id="mOptA"></div>
        <div class="form-group"><label class="form-label">Option B</label><input class="form-input" id="mOptB"></div>
        <div class="form-group"><label class="form-label">Option C</label><input class="form-input" id="mOptC"></div>
        <div class="form-group"><label class="form-label">Option D</label><input class="form-input" id="mOptD"></div>
        <div class="form-group"><label class="form-label">Correct Answer</label>
          <select class="form-select" id="mAnswer">
            <option value="A">A</option><option value="B">B</option>
            <option value="C">C</option><option value="D">D</option>
          </select>
        </div>
      `,
            save: saveQuizQuestion,
            onOpen: loadQuizQuestionDropdowns
        }
    };

    const config = modalConfigs[type];
    if (!config) return;

    currentEditId = null;
    openModal(config.title, config.body, config.save);
    if (config.onOpen) config.onOpen();
}

// ============================================================
// SAVE FUNCTIONS
// ============================================================

async function saveBreakingNews() {
    const data = {
        text: document.getElementById('mText').value,
        link: document.getElementById('mLink').value,
        active: document.getElementById('mActive').value,
        order: document.getElementById('mOrder').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateBreakingNews' : 'addBreakingNews';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadBreakingNews_admin(); }
    else showToast(res.error, 'error');
}

async function saveNavTab() {
    const data = {
        label: document.getElementById('mLabel').value,
        link: document.getElementById('mLink').value,
        icon: document.getElementById('mIcon').value,
        order: document.getElementById('mOrder').value,
        active: document.getElementById('mActive').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateNavTab' : 'addNavTab';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadNavTabs(); }
    else showToast(res.error, 'error');
}

async function saveStandard() {
    const data = {
        standardName: document.getElementById('mName').value,
        icon: document.getElementById('mIcon').value,
        order: document.getElementById('mOrder').value,
        active: document.getElementById('mActive').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateStandard' : 'addStandard';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadStandards(); }
    else showToast(res.error, 'error');
}

async function saveSubject() {
    const data = {
        subjectName: document.getElementById('mSubjectName').value,
        icon: document.getElementById('mIcon').value,
        order: document.getElementById('mOrder').value,
        active: document.getElementById('mActive').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateSubject' : 'addSubject';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadSubjects(); }
    else showToast(res.error, 'error');
}

async function saveMaterial() {
    let typeVal = document.getElementById('mType').value;
    if (typeVal === '__custom__') {
        typeVal = document.getElementById('mCustomType').value.trim();
        if (!typeVal) { showToast('Custom Type name ભરો', 'error'); return; }
    }
    const data = {
        standardId: document.getElementById('mStandardId').value,
        subjectId: document.getElementById('mSubjectId').value,
        type: typeVal,
        title: document.getElementById('mTitle').value,
        driveLink: document.getElementById('mDriveLink').value,
        order: document.getElementById('mOrder').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateMaterial' : 'addMaterial';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadMaterialsAdmin(); }
    else showToast(res.error, 'error');
}

function toggleCustomType() {
    const sel = document.getElementById('mType').value;
    document.getElementById('customTypeGroup').style.display = sel === '__custom__' ? 'block' : 'none';
}

async function saveVachanLekhan() {
    const data = {
        title: document.getElementById('mTitle').value,
        link: document.getElementById('mLink').value,
        icon: document.getElementById('mIcon').value,
        order: document.getElementById('mOrder').value,
        active: document.getElementById('mActive').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateVachanLekhan' : 'addVachanLekhan';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadVachanLekhan(); }
    else showToast(res.error, 'error');
}

async function saveGanan() {
    const data = {
        title: document.getElementById('mTitle').value,
        link: document.getElementById('mLink').value,
        icon: document.getElementById('mIcon').value,
        order: document.getElementById('mOrder').value,
        active: document.getElementById('mActive').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateGanan' : 'addGanan';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadGanan(); }
    else showToast(res.error, 'error');
}

async function saveQuizCategory() {
    const data = {
        name: document.getElementById('mName').value,
        icon: document.getElementById('mIcon').value,
        questionCount: document.getElementById('mQuestionCount').value,
        order: document.getElementById('mOrder').value,
        active: document.getElementById('mActive').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateQuizCategory' : 'addQuizCategory';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadQuizCategories(); }
    else showToast(res.error, 'error');
}

async function saveQuizQuestion() {
    const data = {
        categoryId: document.getElementById('mCategoryId').value,
        stdId: document.getElementById('mStdId').value,
        subjectId: document.getElementById('mSubjectId').value,
        chapter: document.getElementById('mChapter').value,
        question: document.getElementById('mQuestion').value,
        optA: document.getElementById('mOptA').value,
        optB: document.getElementById('mOptB').value,
        optC: document.getElementById('mOptC').value,
        optD: document.getElementById('mOptD').value,
        answer: document.getElementById('mAnswer').value
    };
    if (currentEditId) data.id = currentEditId;
    const action = currentEditId ? 'updateQuizQuestion' : 'addQuizQuestion';
    const res = await api(action, data);
    if (res.success) { showToast('Saved!', 'success'); closeModal(); loadQuizQuestions(); }
    else showToast(res.error, 'error');
}

// ============================================================
// EXCEL BULK UPLOAD FOR QUIZ QUESTIONS
// ============================================================

function openExcelUploadModal() {
    const body = `
    <div style="margin-bottom:var(--space-md);padding:var(--space-md);background:rgba(108,99,255,0.08);border-radius:var(--radius-md);font-size:var(--font-size-sm);">
      <strong>📋 Excel Format:</strong><br>
      Excel ની પ્રથમ row header હોવી જોઈએ:<br>
      <code>categoryId | stdId | subjectId | chapter | question | optA | optB | optC | optD | answer</code><br>
      <span style="color:var(--text-muted);">answer = A, B, C, or D</span>
    </div>
    <div class="form-group">
      <label class="form-label">📁 Excel File (.xlsx, .xls, .csv)</label>
      <input type="file" class="form-input" id="excelFileInput" accept=".xlsx,.xls,.csv">
    </div>
    <div id="excelPreview" style="display:none;margin-top:var(--space-md);">
      <div style="font-weight:600;margin-bottom:var(--space-sm);">Preview:</div>
      <div id="excelPreviewContent" style="max-height:200px;overflow-y:auto;font-size:var(--font-size-xs);"></div>
    </div>
  `;
    openModal('📁 Excel થી Questions Upload', body, submitExcelQuestions);

    // Listen for file selection
    setTimeout(() => {
        document.getElementById('excelFileInput').addEventListener('change', previewExcelFile);
    }, 100);
}

let parsedExcelQuestions = [];

function previewExcelFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);

            if (json.length === 0) {
                showToast('Excel ખાલી છે', 'error');
                return;
            }

            parsedExcelQuestions = json;

            // Show preview
            const previewEl = document.getElementById('excelPreview');
            previewEl.style.display = 'block';
            document.getElementById('excelPreviewContent').innerHTML = `
              <div style="color:var(--accent-green);font-weight:600;margin-bottom:var(--space-xs);">✅ ${json.length} questions found</div>
              <table style="width:100%;border-collapse:collapse;font-size:var(--font-size-xs);">
                <tr style="background:var(--bg-surface);">
                  <th style="padding:4px 8px;text-align:left;">Question</th>
                  <th style="padding:4px 8px;">Answer</th>
                </tr>
                ${json.slice(0, 5).map(q => `
                  <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:4px 8px;">${(q.question || '').substring(0, 50)}...</td>
                    <td style="padding:4px 8px;text-align:center;">${q.answer || '-'}</td>
                  </tr>
                `).join('')}
                ${json.length > 5 ? `<tr><td colspan="2" style="padding:4px 8px;color:var(--text-muted);">...and ${json.length - 5} more</td></tr>` : ''}
              </table>
            `;
        } catch (err) {
            showToast('Excel parse error: ' + err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

async function submitExcelQuestions() {
    if (!parsedExcelQuestions || parsedExcelQuestions.length === 0) {
        showToast('Excel file select કરો', 'error');
        return;
    }

    showLoader(parsedExcelQuestions.length + ' questions upload થઈ રહ્યા છે...');
    closeModal();

    try {
        const res = await api('bulkAddQuizQuestions', { questions: parsedExcelQuestions });
        if (res.success) {
            showToast(res.message || 'Uploaded!', 'success');
            parsedExcelQuestions = [];
            loadQuizQuestions();
        } else {
            showToast(res.error || 'Upload failed', 'error');
        }
    } catch (err) {
        showToast('Upload error: ' + err.message, 'error');
    }

    hideLoader();
}

// ============================================================
// LOAD FUNCTIONS
// ============================================================

async function loadBreakingNews_admin() {
    const res = await api('getSheetData', { sheetName: 'BreakingNews', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'breakingNewsList', 'text', {
        onEdit: 'editBreakingNews',
        onDelete: 'deleteBreakingNewsItem',
        sheetName: 'BreakingNews'
    });
}

async function editBreakingNews(id) {
    const res = await api('getSheetData', { sheetName: 'BreakingNews', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('breakingNews');
    setTimeout(() => {
        document.getElementById('mText').value = item.text || '';
        document.getElementById('mLink').value = item.link || '';
        document.getElementById('mActive').value = String(item.active);
        document.getElementById('mOrder').value = item.order || 1;
    }, 100);
}

async function deleteBreakingNewsItem(id) {
    if (!confirm('Are you sure?')) return;
    const res = await api('deleteBreakingNews', { id });
    if (res.success) { showToast('Deleted', 'success'); loadBreakingNews_admin(); }
    else showToast(res.error, 'error');
}

async function loadNavTabs() {
    const res = await api('getSheetData', { sheetName: 'NavTabs', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'navTabsList', 'label', {
        onEdit: 'editNavTab',
        onDelete: 'deleteNavTabItem',
        sheetName: 'NavTabs'
    });
}

async function editNavTab(id) {
    const res = await api('getSheetData', { sheetName: 'NavTabs', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('navTabs');
    setTimeout(() => {
        document.getElementById('mLabel').value = item.label || '';
        document.getElementById('mLink').value = item.link || '';
        document.getElementById('mIcon').value = item.icon || '';
        document.getElementById('mOrder').value = item.order || 1;
        document.getElementById('mActive').value = String(item.active);
    }, 100);
}

async function deleteNavTabItem(id) {
    if (!confirm('Are you sure?')) return;
    const res = await api('deleteNavTab', { id });
    if (res.success) { showToast('Deleted', 'success'); loadNavTabs(); }
    else showToast(res.error, 'error');
}

async function loadStandards() {
    const res = await api('getSheetData', { sheetName: 'Standards', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'standardsList', 'standardName', {
        onEdit: 'editStandard',
        onDelete: 'deleteStandardItem',
        sheetName: 'Standards'
    });
}

async function editStandard(id) {
    const res = await api('getSheetData', { sheetName: 'Standards', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('standards');
    setTimeout(() => {
        document.getElementById('mName').value = item.standardName || '';
        document.getElementById('mIcon').value = item.icon || '';
        document.getElementById('mOrder').value = item.order || 1;
        document.getElementById('mActive').value = String(item.active);
    }, 100);
}
async function deleteStandardItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteStandard', { id });
    loadStandards();
}

async function loadSubjects() {
    const res = await api('getSheetData', { sheetName: 'Subjects', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'subjectsList', 'subjectName', {
        onEdit: 'editSubject',
        onDelete: 'deleteSubjectItem',
        sheetName: 'Subjects'
    });
}

async function editSubject(id) {
    const res = await api('getSheetData', { sheetName: 'Subjects', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('subjects');
    setTimeout(() => {
        document.getElementById('mSubjectName').value = item.subjectName || '';
        document.getElementById('mIcon').value = item.icon || '';
        document.getElementById('mOrder').value = item.order || 1;
        document.getElementById('mActive').value = String(item.active);
    }, 100);
}
async function deleteSubjectItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteSubject', { id });
    loadSubjects();
}

async function loadMaterialsAdmin() {
    const stdFilter = document.getElementById('matFilterStd')?.value || '';
    const typeFilter = document.getElementById('matFilterType')?.value || '';
    const params = {};
    if (stdFilter) params.standardId = stdFilter;
    if (typeFilter) params.type = typeFilter;

    // Get ALL materials (unfiltered) to extract types
    const allRes = await api('getMaterials', {});
    const allMaterials = allRes.success ? allRes.data : [];

    // Build type filter dropdown dynamically from sheet data
    const typeSelect = document.getElementById('matFilterType');
    if (typeSelect) {
        const currentVal = typeSelect.value;
        const defaultTypes = {
            textbook: 'પાઠ્યપુસ્તક', workbook: 'સ્વાધ્યાયપોથી',
            testpaper: 'ટેસ્ટ પેપર', solution: 'પેપર સોલ્યુશન', other: 'અન્ય'
        };
        // Collect all unique types from sheet data
        const sheetTypes = [...new Set(allMaterials.map(m => m.type).filter(Boolean))];
        // Merge: default labels + any new types from sheet
        const allTypes = { ...defaultTypes };
        sheetTypes.forEach(t => { if (!allTypes[t]) allTypes[t] = t; });

        typeSelect.innerHTML = '<option value="">બધા Type</option>' +
            Object.entries(allTypes).map(([val, label]) =>
                `<option value="${val}">${label}</option>`
            ).join('');
        typeSelect.value = currentVal;
    }

    // Now render filtered list
    let displayData = allMaterials;
    if (stdFilter) displayData = displayData.filter(m => String(m.standardId) === stdFilter);
    if (typeFilter) displayData = displayData.filter(m => String(m.type) === typeFilter);

    renderItemList(displayData, 'materialsList', 'title', {
        onEdit: 'editMaterial',
        onDelete: 'deleteMaterialItem'
    });

    // Populate standard dropdown filter
    const stdSelect = document.getElementById('matFilterStd');
    if (stdSelect && stdSelect.options.length <= 1) {
        const stds = await api('getStandards');
        if (stds.success) {
            stds.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.standardName;
                stdSelect.appendChild(opt);
            });
        }
    }
}

async function editMaterial(id) {
    const res = await api('getMaterials', {});
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('materials');
    setTimeout(() => {
        document.getElementById('mStandardId').value = item.standardId || '';
        document.getElementById('mSubjectId').value = item.subjectId || '';
        document.getElementById('mType').value = item.type || 'textbook';
        document.getElementById('mTitle').value = item.title || '';
        document.getElementById('mDriveLink').value = item.driveLink || '';
        document.getElementById('mOrder').value = item.order || 1;
    }, 200);
}
async function deleteMaterialItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteMaterial', { id });
    loadMaterialsAdmin();
}

async function loadMaterialDropdowns() {
    const [stds, subs, mats] = await Promise.all([
        api('getStandards'), api('getSubjects'), api('getMaterials', {})
    ]);
    const stdSelect = document.getElementById('mStandardId');
    const subSelect = document.getElementById('mSubjectId');
    if (stdSelect && stds.success) {
        stdSelect.innerHTML = stds.data.map(s => `<option value="${s.id}">${s.standardName}</option>`).join('');
    }
    if (subSelect && subs.success) {
        subSelect.innerHTML = subs.data.map(s => `<option value="${s.id}">${s.subjectName}</option>`).join('');
    }
    // Add existing custom types to the modal type dropdown
    const typeSelect = document.getElementById('mType');
    if (typeSelect && mats.success) {
        const defaultVals = ['textbook', 'workbook', 'testpaper', 'solution', 'other', '__custom__'];
        const existingTypes = [...new Set(mats.data.map(m => m.type).filter(Boolean))];
        existingTypes.forEach(t => {
            if (!defaultVals.includes(t)) {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                // Insert before the __custom__ option
                const customOpt = typeSelect.querySelector('option[value="__custom__"]');
                typeSelect.insertBefore(opt, customOpt);
            }
        });
    }
}

// ============================================================
// TEACHER / OFFICE TOOLS
// ============================================================

async function loadTeacherTools() {
    const res = await api('getSheetData', { sheetName: 'TeacherTools', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'teacherToolsList', 'name', {
        onDelete: 'deleteTeacherToolItem',
        sheetName: 'TeacherTools'
    });
}
async function deleteTeacherToolItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteTeacherTool', { id });
    loadTeacherTools();
}

async function loadOfficeTools() {
    const res = await api('getSheetData', { sheetName: 'OfficeTools', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'officeToolsList', 'name', {
        onDelete: 'deleteOfficeToolItem',
        sheetName: 'OfficeTools'
    });
}
async function deleteOfficeToolItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteOfficeTool', { id });
    loadOfficeTools();
}

// ============================================================
// FILE UPLOAD MODAL
// ============================================================

function openUploadModal(type) {
    const actionMap = {
        teacher: { action: 'uploadTeacherTool', addAction: 'addTeacherTool', reload: loadTeacherTools, title: 'Import Teacher Tool' },
        office: { action: 'uploadOfficeTool', addAction: 'addOfficeTool', reload: loadOfficeTools, title: 'Import Office Tool' },
        games: { action: 'uploadGame', addAction: 'addGame', reload: loadGames, title: 'Import Game' }
    };
    const config = actionMap[type];
    if (!config) return;

    const extraField = type === 'games'
        ? '<div class="form-group"><label class="form-label">Subject (for category)</label><input class="form-input" id="mUpSubject" placeholder="e.g. ગણિત"></div>'
        : '';

    openModal(config.title, `
    <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="mUpName" placeholder="Tool name"></div>
    ${extraField}
    <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="mUpIcon" placeholder="🛠️"></div>
    <div class="form-group">
      <label class="form-label">.html File</label>
      <div class="upload-area" id="uploadArea" onclick="document.getElementById('mUpFile').click()">
        <div class="upload-icon">📁</div>
        <div class="upload-text">Click to select <strong>.html</strong> file</div>
      </div>
      <input type="file" id="mUpFile" accept=".html" style="display:none" onchange="handleFileSelect(this)">
    </div>
    <div id="uploadStatus"></div>
  `, async function () {
        const name = document.getElementById('mUpName').value;
        const icon = document.getElementById('mUpIcon').value || '📄';
        const file = document.getElementById('mUpFile').files[0];

        if (!name || !file) { showToast('Name અને File આપો', 'error'); return; }
        if (!file.name.endsWith('.html')) { showToast('Only .html files allowed', 'error'); return; }

        document.getElementById('uploadStatus').innerHTML = '<div class="spinner" style="width:24px;height:24px;margin:8px auto;"></div>';

        const base64 = await fileToBase64(file);
        const res = await api(config.action, {
            fileName: file.name,
            fileContent: base64,
            mimeType: 'text/html'
        });

        if (res.success) {
            // Add entry to sheet
            const addData = { name, icon, fileName: file.name, fileUrl: res.fileUrl || '', active: 'true', order: 1 };
            if (type === 'games') addData.subject = document.getElementById('mUpSubject')?.value || '';
            await api(config.addAction, addData);
            showToast('Uploaded!', 'success');
            closeModal();
            config.reload();
        } else {
            showToast(res.error || 'Upload failed', 'error');
            document.getElementById('uploadStatus').innerHTML = '';
        }
    });
}

function handleFileSelect(input) {
    const area = document.getElementById('uploadArea');
    if (input.files.length > 0) {
        area.innerHTML = `<div class="upload-icon">✅</div><div class="upload-text">${input.files[0].name}</div>`;
    }
}

// ============================================================
// VACHAN-LEKHAN / GANAN
// ============================================================

async function loadVachanLekhan() {
    const res = await api('getSheetData', { sheetName: 'VachanLekhan', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'vachanLekhanList', 'title', {
        onEdit: 'editVachanLekhan',
        onDelete: 'deleteVachanLekhanItem',
        sheetName: 'VachanLekhan'
    });
}
async function editVachanLekhan(id) {
    const res = await api('getSheetData', { sheetName: 'VachanLekhan', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('vachanLekhan');
    setTimeout(() => {
        document.getElementById('mTitle').value = item.title || '';
        document.getElementById('mLink').value = item.link || '';
        document.getElementById('mIcon').value = item.icon || '';
        document.getElementById('mOrder').value = item.order || 1;
        document.getElementById('mActive').value = String(item.active);
    }, 100);
}
async function deleteVachanLekhanItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteVachanLekhan', { id });
    loadVachanLekhan();
}

async function loadGanan() {
    const res = await api('getSheetData', { sheetName: 'Ganan', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'gananList', 'title', {
        onEdit: 'editGanan',
        onDelete: 'deleteGananItem',
        sheetName: 'Ganan'
    });
}
async function editGanan(id) {
    const res = await api('getSheetData', { sheetName: 'Ganan', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('ganan');
    setTimeout(() => {
        document.getElementById('mTitle').value = item.title || '';
        document.getElementById('mLink').value = item.link || '';
        document.getElementById('mIcon').value = item.icon || '';
        document.getElementById('mOrder').value = item.order || 1;
        document.getElementById('mActive').value = String(item.active);
    }, 100);
}
async function deleteGananItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteGanan', { id });
    loadGanan();
}

// ============================================================
// GAMES
// ============================================================

async function loadGames() {
    const res = await api('getSheetData', { sheetName: 'Games', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'gamesList', 'name', {
        onDelete: 'deleteGameItem',
        sheetName: 'Games'
    });
}
async function deleteGameItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteGame', { id });
    loadGames();
}

// ============================================================
// QUIZ
// ============================================================

async function loadQuizCategories() {
    const res = await api('getSheetData', { sheetName: 'QuizCategories', includeAll: 'true' });
    renderItemList(res.success ? res.data : [], 'quizCategoriesList', 'name', {
        onEdit: 'editQuizCategory',
        onDelete: 'deleteQuizCategoryItem',
        sheetName: 'QuizCategories'
    });
}
async function editQuizCategory(id) {
    const res = await api('getSheetData', { sheetName: 'QuizCategories', includeAll: 'true' });
    const item = res.data.find(i => String(i.id) === String(id));
    if (!item) return;
    currentEditId = id;
    openAddModal('quizCategories');
    setTimeout(() => {
        document.getElementById('mName').value = item.name || '';
        document.getElementById('mIcon').value = item.icon || '';
        document.getElementById('mQuestionCount').value = item.questionCount || 20;
        document.getElementById('mOrder').value = item.order || 1;
        document.getElementById('mActive').value = String(item.active);
    }, 100);
}
async function deleteQuizCategoryItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteQuizCategory', { id });
    loadQuizCategories();
}

async function loadQuizQuestions() {
    const res = await api('getQuizQuestions', {});
    const container = document.getElementById('quizQuestionsList');
    if (!res.success || res.data.length === 0) {
        container.innerHTML = '<div class="no-data"><div class="no-data-icon">📝</div>No questions found</div>';
        return;
    }
    container.innerHTML = res.data.slice(0, 50).map(q => `
    <div class="item-row" data-id="${q.id}">
      <span style="font-size:1.3rem;">❓</span>
      <span class="item-name" style="flex:1;">${q.question ? q.question.substring(0, 80) + '...' : ''}</span>
      <span class="badge badge-primary">${q.answer || ''}</span>
      <div class="item-actions">
        <button class="btn btn-sm btn-danger" onclick="deleteQuizQuestionItem('${q.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}
async function deleteQuizQuestionItem(id) {
    if (!confirm('Are you sure?')) return;
    await api('deleteQuizQuestion', { id });
    loadQuizQuestions();
}

async function loadQuizQuestionDropdowns() {
    const cats = await api('getQuizCategories');
    const stds = await api('getStandards');
    const subs = await api('getSubjects');

    setTimeout(() => {
        const catSel = document.getElementById('mCategoryId');
        const stdSel = document.getElementById('mStdId');
        const subSel = document.getElementById('mSubjectId');

        if (catSel && cats.success) catSel.innerHTML = cats.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (stdSel && stds.success) stdSel.innerHTML = '<option value="">-</option>' + stds.data.map(s => `<option value="${s.id}">${s.standardName}</option>`).join('');
        if (subSel && subs.success) subSel.innerHTML = '<option value="">-</option>' + subs.data.map(s => `<option value="${s.id}">${s.subjectName}</option>`).join('');
    }, 100);
}

// ============================================================
// QUIZ RESULTS
// ============================================================

async function loadQuizResults() {
    const res = await api('getQuizResults');
    const tbody = document.getElementById('quizResultsBody');
    if (!res.success || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No results yet</td></tr>';
        return;
    }
    tbody.innerHTML = res.data.slice(-100).reverse().map(r => `
    <tr>
      <td>${r.timestamp || ''}</td>
      <td>${r.studentName || ''}</td>
      <td>${r.mobile || ''}</td>
      <td>${r.categoryName || ''}</td>
      <td>${r.score || 0}/${r.total || 0}</td>
      <td><span class="badge ${Number(r.percentage) >= 60 ? 'badge-success' : 'badge-danger'}">${r.percentage || 0}%</span></td>
    </tr>
  `).join('');
}

// ============================================================
// SETTINGS
// ============================================================

async function loadSettings() {
    const res = await api('getSettings');
    if (!res.success) return;
    const s = res.data;
    document.getElementById('setSiteName').value = s.siteName || '';
    document.getElementById('setEmail').value = s.contactEmail || '';
    document.getElementById('setPhone').value = s.contactPhone || '';
    document.getElementById('setFooter').value = s.footerText || '';
    document.getElementById('setAbout').value = s.aboutText || '';
    document.getElementById('setAddress').value = s.address || '';
    document.getElementById('setSocialFacebook').value = s.socialFacebook || '';
    document.getElementById('setSocialYoutube').value = s.socialYoutube || '';
    document.getElementById('setSocialInstagram').value = s.socialInstagram || '';
    document.getElementById('setSocialTwitter').value = s.socialTwitter || '';
    document.getElementById('setSocialTelegram').value = s.socialTelegram || '';
    document.getElementById('setSocialWhatsapp').value = s.socialWhatsapp || '';
}

async function saveSettings() {
    showLoader('Saving...');
    const fields = [
        { key: 'siteName', el: 'setSiteName' },
        { key: 'contactEmail', el: 'setEmail' },
        { key: 'contactPhone', el: 'setPhone' },
        { key: 'footerText', el: 'setFooter' },
        { key: 'aboutText', el: 'setAbout' },
        { key: 'address', el: 'setAddress' },
        { key: 'socialFacebook', el: 'setSocialFacebook' },
        { key: 'socialYoutube', el: 'setSocialYoutube' },
        { key: 'socialInstagram', el: 'setSocialInstagram' },
        { key: 'socialTwitter', el: 'setSocialTwitter' },
        { key: 'socialTelegram', el: 'setSocialTelegram' },
        { key: 'socialWhatsapp', el: 'setSocialWhatsapp' }
    ];

    for (const f of fields) {
        await api('updateSetting', { key: f.key, value: document.getElementById(f.el).value });
    }

    // Upload logo
    const logoFile = document.getElementById('setLogo').files[0];
    if (logoFile) {
        const base64 = await fileToBase64(logoFile);
        const res = await api('uploadAsset', { fileName: 'logo.png', fileContent: base64, mimeType: logoFile.type });
        if (res.success) await api('updateSetting', { key: 'logoUrl', value: res.url });
    }

    // Upload favicon
    const favFile = document.getElementById('setFavicon').files[0];
    if (favFile) {
        const base64 = await fileToBase64(favFile);
        const res = await api('uploadAsset', { fileName: 'favicon.ico', fileContent: base64, mimeType: favFile.type });
        if (res.success) await api('updateSetting', { key: 'faviconUrl', value: res.url });
    }

    hideLoader();
    showToast('Settings saved!', 'success');
    clearCache('getSettings');
}

// ============================================================
// CHANGE PASSWORD
// ============================================================

async function changePassword() {
    const oldPass = document.getElementById('oldPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;

    if (!oldPass || !newPass) { showToast('All fields required', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Passwords do not match', 'error'); return; }
    if (newPass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

    const username = localStorage.getItem('oeg_admin_user') || 'admin';
    const res = await api('changeAdminPassword', { username, oldPassword: oldPass, newPassword: newPass });
    if (res.success) {
        showToast('Password changed!', 'success');
        document.getElementById('oldPass').value = '';
        document.getElementById('newPass').value = '';
        document.getElementById('confirmPass').value = '';
    } else {
        showToast(res.error, 'error');
    }
}
