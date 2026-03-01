// ============================================================
// Online Education Guru - Shared Utilities (common.js)
// ============================================================

// ---- CONFIGURATION ----
// Replace this URL after deploying code.gs as a Web App
const API_BASE = 'https://script.google.com/macros/s/AKfycbx3hrOtIB33IoEVaz9qzy7CSvhdM6RIC0hCm9kGo5f0eoU_ACMwE7FtiIJ2EbnQpGzB/exec';

// ---- CACHE ----
const APP_CACHE = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================
// API HELPER
// ============================================================

async function api(action, params = {}) {
    try {
        const url = API_BASE + '?action=' + encodeURIComponent(action);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(params)
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('API Error:', err);
        showToast('સર્વર સાથે કનેક્શન થયું નથી', 'error');
        return { success: false, error: err.message };
    }
}

async function apiCached(action, params = {}, forceRefresh = false) {
    const cacheKey = action + JSON.stringify(params);
    if (!forceRefresh && APP_CACHE[cacheKey] && Date.now() - APP_CACHE[cacheKey].time < CACHE_TTL) {
        return APP_CACHE[cacheKey].data;
    }
    const result = await api(action, params);
    if (result.success) {
        APP_CACHE[cacheKey] = { data: result, time: Date.now() };
    }
    return result;
}

function clearCache(action) {
    Object.keys(APP_CACHE).forEach(key => {
        if (key.startsWith(action)) delete APP_CACHE[key];
    });
}

// ============================================================
// AUTH MANAGEMENT
// ============================================================

function getUser() {
    const user = localStorage.getItem('oeg_user');
    return user ? JSON.parse(user) : null;
}

function setUser(user, role) {
    localStorage.setItem('oeg_user', JSON.stringify({ ...user, role }));
}

function logout() {
    localStorage.removeItem('oeg_user');
    window.location.href = 'login.html';
}

function isLoggedIn() {
    return getUser() !== null;
}

function isAdmin() {
    return localStorage.getItem('oeg_admin') === 'true';
}

function adminLogin(username, password) {
    localStorage.setItem('oeg_admin', 'true');
    localStorage.setItem('oeg_admin_user', username);
}

function adminLogout() {
    localStorage.removeItem('oeg_admin');
    localStorage.removeItem('oeg_admin_user');
    window.location.href = 'admin.html';
}

// ============================================================
// DYNAMIC HEADER
// ============================================================

async function loadHeader(activePage = '') {
    const headerEl = document.getElementById('site-header');
    if (!headerEl) return;

    const settings = await apiCached('getSettings');
    const siteName = settings.success ? (settings.data.siteName || 'Online Education Guru') : 'Online Education Guru';
    const logoUrl = settings.success ? (settings.data.logoUrl || '') : '';

    // Load nav tabs
    const tabsRes = await apiCached('getNavTabs');
    const tabs = tabsRes.success ? tabsRes.data : getDefaultNavTabs();

    let logoImg = logoUrl
        ? `<img src="${logoUrl}" alt="${siteName}" onerror="this.style.display='none'">`
        : `<span style="font-size:1.8rem">📚</span>`;

    headerEl.innerHTML = `
    <div class="header-main container">
      <a href="index.html" class="header-logo">
        ${logoImg}
        <span class="header-logo-text">${siteName}</span>
      </a>
      <div class="header-actions">
        ${isLoggedIn() ? `
          <button class="header-btn" onclick="window.location.href='leaderboard.html'" title="Leaderboard">🏆</button>
          <button class="header-btn" onclick="logout()" title="Logout">🚪</button>
        ` : `
          <button class="header-btn" onclick="window.location.href='login.html'" title="Login">👤</button>
        `}
      </div>
    </div>
    <nav class="header-nav container" id="headerNav">
      ${tabs.map(tab => `
        <a href="${tab.link}" class="nav-tab ${activePage === tab.link ? 'active' : ''}">
          <span class="icon">${tab.icon || ''}</span>
          ${tab.label}
        </a>
      `).join('')}
    </nav>
  `;

    // Update favicon if set
    if (settings.success && settings.data.faviconUrl) {
        let favicon = document.querySelector("link[rel='icon']");
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = settings.data.faviconUrl;
    }
}

function getDefaultNavTabs() {
    return [
        { label: 'હોમ', link: 'index.html', icon: '🏠' },
        { label: 'ધોરણ', link: 'index.html#standards', icon: '📖' },
        { label: 'વિષયો', link: 'subjects.html', icon: '📚' },
        { label: 'ક્વિઝ', link: 'quiz.html', icon: '❓' },
        { label: 'ટૂલ્સ', link: 'teacher-tools.html', icon: '🛠️' },
        { label: 'ગેમ્સ', link: 'games.html', icon: '🎮' }
    ];
}

// ============================================================
// BREAKING NEWS TICKER
// ============================================================

async function loadBreakingNews() {
    const tickerEl = document.getElementById('news-ticker');
    if (!tickerEl) return;

    const res = await apiCached('getBreakingNews');
    const newsItems = res.success ? res.data.filter(n => String(n.active) !== 'false') : [];

    if (newsItems.length === 0) {
        tickerEl.style.display = 'none';
        // Adjust page wrapper
        const wrapper = document.querySelector('.page-wrapper');
        if (wrapper) wrapper.style.paddingTop = '90px';
        return;
    }

    // Duplicate for seamless scroll
    const itemsHtml = newsItems.map(n =>
        `<a href="${n.link || '#'}" class="news-ticker-item">${n.text}</a><span class="news-ticker-divider">|</span>`
    ).join('');

    tickerEl.innerHTML = `
    <div class="news-ticker-inner">
      ${itemsHtml}${itemsHtml}
    </div>
  `;
}

// ============================================================
// FOOTER
// ============================================================

async function loadFooter() {
    const footerEl = document.getElementById('site-footer');
    if (!footerEl) return;

    const settings = await apiCached('getSettings');
    const footerText = settings.success
        ? (settings.data.footerText || '© 2026 Online Education Guru. All Rights Reserved.')
        : '© 2026 Online Education Guru. All Rights Reserved.';
    const contactEmail = settings.success ? (settings.data.contactEmail || '') : '';
    const contactPhone = settings.success ? (settings.data.contactPhone || '') : '';

    footerEl.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-section-title">📚 Online Education Guru</div>
          <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;">
            ગુજરાત શિક્ષણ માટેનું સંપૂર્ણ ઓનલાઈન પ્લેટફોર્મ.<br>
            બાલ વાટિકા થી ધોરણ 12 સુધીનું સંપૂર્ણ શૈક્ષણિક સામગ્રી.
          </p>
        </div>
        <div>
          <div class="footer-section-title">ક્વિક લિંક્સ</div>
          <div class="footer-links">
            <a href="index.html" class="footer-link">🏠 હોમ</a>
            <a href="quiz.html" class="footer-link">❓ ક્વિઝ</a>
            <a href="teacher-tools.html" class="footer-link">🛠️ Teacher's Tools</a>
            <a href="office-tools.html" class="footer-link">🏢 Office Tools</a>
          </div>
        </div>
        <div>
          <div class="footer-section-title">અન્ય</div>
          <div class="footer-links">
            <a href="about.html" class="footer-link">ℹ️ અમારા વિશે</a>
            <a href="contact.html" class="footer-link">📧 સંપર્ક</a>
            <a href="privacy-policy.html" class="footer-link">🔒 પ્રાઈવસી પોલિસી</a>
            <a href="terms.html" class="footer-link">📋 ટર્મ્સ ઓફ સર્વિસ</a>
          </div>
        </div>
        <div>
          <div class="footer-section-title">સંપર્ક</div>
          <div class="footer-links">
            ${contactEmail ? `<a href="mailto:${contactEmail}" class="footer-link">📧 ${contactEmail}</a>` : ''}
            ${contactPhone ? `<a href="tel:${contactPhone}" class="footer-link">📱 ${contactPhone}</a>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom">${footerText}</div>
    </div>
  `;
}

// ============================================================
// RENDERERS
// ============================================================

function renderFolderGrid(items, containerId, linkPrefix = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <div class="empty-text">કોઈ ડેટા ઉપલબ્ધ નથી</div>
      </div>
    `;
        return;
    }

    const colors = ['', 'orange', 'green', 'pink', 'yellow'];

    container.innerHTML = items.map((item, i) => {
        const color = colors[i % colors.length];
        const href = linkPrefix ? `${linkPrefix}?id=${item.id}` : (item.link || '#');
        return `
      <a href="${href}" class="folder-card" data-color="${color}" data-id="${item.id || ''}">
        <div class="folder-icon">${item.icon || '📁'}</div>
        <div class="folder-name">${item.name || item.subjectName || item.standardName || item.title || ''}</div>
      </a>
    `;
    }).join('');
}

function renderStripList(items, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">કોઈ ડેટા ઉપલબ્ધ નથી</div>
      </div>
    `;
        return;
    }

    container.innerHTML = items.map((item, i) => {
        const href = item.link || item.fileUrl || options.linkPrefix
            ? `${options.linkPrefix || ''}?id=${item.id}`
            : '#';
        return `
      <a href="${href}" class="strip-item" ${options.target ? `target="${options.target}"` : ''} data-id="${item.id || ''}">
        <div class="strip-icon">${item.icon || '📄'}</div>
        <div class="strip-content">
          <div class="strip-title">${item.name || item.title || ''}</div>
          ${item.subtitle ? `<div class="strip-subtitle">${item.subtitle}</div>` : ''}
        </div>
        <span class="strip-arrow">›</span>
      </a>
    `;
    }).join('');
}

function renderMaterialList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">કોઈ મટિરિયલ ઉપલબ્ધ નથી</div>
      </div>
    `;
        return;
    }

    container.innerHTML = items.map(item => `
    <div class="material-card">
      <div class="material-icon">📄</div>
      <div class="material-info">
        <div class="material-title">${item.title || ''}</div>
      </div>
      <div class="material-actions">
        ${item.driveLink ? `
          <a href="${item.driveLink}" target="_blank" class="btn btn-sm btn-secondary" title="View">👁️ View</a>
          <a href="${item.driveLink.replace('/view', '/export?format=pdf')}" class="btn btn-sm btn-primary" title="Download">⬇️</a>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function renderLeaderboard(items, containerId, limit = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<div class="no-data"><div class="no-data-icon">🏆</div>હજુ સુધી કોઈ સ્કોર નથી</div>`;
        return;
    }

    const top = items.slice(0, limit);
    container.innerHTML = top.map((item, i) => {
        const rank = i + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        return `
      <div class="lb-item">
        <div class="lb-rank ${rankClass}">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}</div>
        <div class="lb-info">
          <div class="lb-name">${item.studentName || ''}</div>
          <div class="lb-meta">${item.categoryName || ''}</div>
        </div>
        <div class="lb-score">${item.percentage || 0}%</div>
      </div>
    `;
    }).join('');
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ============================================================
// LOADER
// ============================================================

function showLoader(text = 'લોડ થઈ રહ્યું છે...') {
    let loader = document.getElementById('app-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.className = 'loader-overlay';
        loader.innerHTML = `<div class="spinner"></div><div class="loader-text">${text}</div>`;
        document.body.appendChild(loader);
    }
    loader.classList.add('active');
}

function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.remove('active');
}

// ============================================================
// RIGHT-CLICK & COPY PROTECTION
// ============================================================

function disableRightClick() {
    document.body.classList.add('protected');

    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        showToast('Right click disabled', 'info');
        return false;
    });

    document.addEventListener('keydown', function (e) {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+C (on protected text)
        if (e.key === 'F12') { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return false; }
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
        if (e.ctrlKey && (e.key === 'S' || e.key === 's')) { e.preventDefault(); return false; }
    });

    document.addEventListener('copy', function (e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener('cut', function (e) {
        e.preventDefault();
        return false;
    });
}

// ============================================================
// ADSENSE HELPERS
// ============================================================

function initAdSlots() {
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach(container => {
        // AdSense will auto-fill these if configured
        if (!container.querySelector('ins.adsbygoogle')) {
            const ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.display = 'block';
            ins.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX'); // Replace with your pub ID
            ins.setAttribute('data-ad-slot', container.dataset.adSlot || '');
            ins.setAttribute('data-ad-format', container.dataset.adFormat || 'auto');
            ins.setAttribute('data-full-width-responsive', 'true');
            container.appendChild(ins);

            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                // AdSense not loaded
            }
        }
    });
}

// ============================================================
// URL PARAMETERS
// ============================================================

function getUrlParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

function setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
}

// ============================================================
// MOBILE PHONE NUMBER VALIDATION
// ============================================================

function isValidMobile(num) {
    const cleaned = String(num).replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
}

// ============================================================
// FILE TO BASE64
// ============================================================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================
// SKELETON LOADING
// ============================================================

function renderSkeletonFolders(containerId, count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Array(count).fill(`
    <div class="folder-card">
      <div class="folder-icon skeleton" style="width:60px;height:60px;margin:0 auto 8px;"></div>
      <div class="skeleton" style="width:80%;height:14px;margin:0 auto;"></div>
    </div>
  `).join('');
}

function renderSkeletonStrips(containerId, count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Array(count).fill(`
    <div class="strip-item" style="pointer-events:none;">
      <div class="strip-icon skeleton" style="width:48px;height:48px;"></div>
      <div class="strip-content">
        <div class="skeleton" style="width:60%;height:16px;margin-bottom:6px;"></div>
        <div class="skeleton" style="width:40%;height:12px;"></div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// INIT ON PAGE LOAD
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    // Disable right-click on all pages
    disableRightClick();

    // Load header & footer if elements exist
    loadHeader();
    loadFooter();
    loadBreakingNews();

    // Init ad slots
    setTimeout(initAdSlots, 1000);
});
