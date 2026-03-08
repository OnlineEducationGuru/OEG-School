// ============================================================
// Online Education Guru - Shared Utilities (common.js)
// ============================================================

// ---- CONFIGURATION ----
// Replace this URL after deploying code.gs as a Web App
const API_BASE = 'https://script.google.com/macros/s/AKfycbxsMCIsaWrpV-HDtkH1CYQ28_KQEKKXZRJP_gx3htVRBbJ4NjTWigScfzycr0zDY5iC/exec';

// ---- CACHE ----
const APP_CACHE = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ---- PERSISTENT CACHE (localStorage) ----
const LS_CACHE_PREFIX = 'oeg_cache_v2_';
const LS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes persistent cache

// ============================================================
// API HELPER
// ============================================================

async function api(action, params = {}) {
  try {
    const url = API_BASE + '?action=' + encodeURIComponent(action) + '&_t=' + Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(params),
      cache: 'no-store'
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

  // Check memory cache first
  if (!forceRefresh && APP_CACHE[cacheKey] && Date.now() - APP_CACHE[cacheKey].time < CACHE_TTL) {
    return APP_CACHE[cacheKey].data;
  }

  // Check localStorage persistent cache
  if (!forceRefresh) {
    try {
      const lsData = localStorage.getItem(LS_CACHE_PREFIX + cacheKey);
      if (lsData) {
        const parsed = JSON.parse(lsData);
        if (Date.now() - parsed.time < LS_CACHE_TTL) {
          APP_CACHE[cacheKey] = { data: parsed.data, time: parsed.time };
          // Background refresh — don't await
          api(action, params).then(r => {
            if (r.success) {
              APP_CACHE[cacheKey] = { data: r, time: Date.now() };
              try { localStorage.setItem(LS_CACHE_PREFIX + cacheKey, JSON.stringify({ data: r, time: Date.now() })); } catch (e) { }
            }
          }).catch(() => { });
          return parsed.data;
        }
      }
    } catch (e) { }
  }

  const result = await api(action, params);
  if (result.success) {
    APP_CACHE[cacheKey] = { data: result, time: Date.now() };
    try { localStorage.setItem(LS_CACHE_PREFIX + cacheKey, JSON.stringify({ data: result, time: Date.now() })); } catch (e) { }
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
  const logoUrl = settings.success ? convertDriveUrl(settings.data.logoUrl || '') : '';

  // Load nav tabs
  const tabsRes = await apiCached('getNavTabs');
  const tabs = tabsRes.success ? tabsRes.data : getDefaultNavTabs();

  let logoImg = logoUrl
    ? `<img src="${logoUrl}" alt="${siteName}" onerror="this.style.display='none'" crossorigin="anonymous">`
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
          <button class="header-btn" onclick="window.location.href='profile.html'" title="Profile" style="font-weight:700;color:var(--primary-light);">${(getUser().name || '?').charAt(0).toUpperCase()}</button>
          <button class="header-btn" onclick="logout()" title="Logout" style="font-size:0.7rem;width:auto;padding:0 10px;gap:4px;border-radius:var(--radius-sm);">🚪 Logout</button>
        ` : `
          <button class="header-btn" onclick="window.location.href='login.html'" title="Login" style="font-size:0.75rem;width:auto;padding:0 12px;gap:4px;border-radius:var(--radius-sm);">👤 Login</button>
        `}
      </div>
    </div>
    <nav class="header-nav container">
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
    const favUrl = convertDriveUrl(settings.data.faviconUrl);
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = favUrl;
  }
}

// Convert Google Drive share URLs to direct image URLs
function convertDriveUrl(url) {
  if (!url) return '';
  // Already a direct URL (not Drive)
  if (!url.includes('drive.google.com')) return url;
  // Extract file ID from various Drive URL formats
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!match) match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return 'https://lh3.googleusercontent.com/d/' + match[1];
  }
  return url;
}

function getDefaultNavTabs() {
  return [
    { label: 'હોમ', link: 'index.html', icon: '🏠' },
    { label: 'ધોરણ', link: 'standard.html', icon: '📖' },
    { label: 'વિષયો', link: 'subjects.html', icon: '📚' },
    { label: 'ક્વિઝ', link: 'quiz.html', icon: '❓' },
    { label: 'Teacher Tools', link: 'teacher-tools.html', icon: '🛠️' },
    { label: 'Office Tools', link: 'office-tools.html', icon: '🏢' },
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
    <div class="news-ticker-label">Breaking News ⚡</div>
    <div class="news-ticker-content">
      <div class="news-ticker-inner">
        ${itemsHtml}${itemsHtml}
      </div>
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

  // Social media links
  const socials = [];
  if (settings.success) {
    const s = settings.data;
    if (s.socialFacebook) socials.push({ url: s.socialFacebook, label: 'Facebook', color: '#1877F2', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' });
    if (s.socialYoutube) socials.push({ url: s.socialYoutube, label: 'YouTube', color: '#FF0000', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' });
    if (s.socialInstagram) socials.push({ url: s.socialInstagram, label: 'Instagram', color: '#E4405F', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.882 0 1.441 1.441 0 0 1 2.882 0z"/></svg>' });
    if (s.socialTwitter) socials.push({ url: s.socialTwitter, label: 'X', color: '#000000', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' });
    if (s.socialTelegram) socials.push({ url: s.socialTelegram, label: 'Telegram', color: '#0088cc', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>' });
    if (s.socialWhatsapp) socials.push({ url: s.socialWhatsapp, label: 'WhatsApp', color: '#25D366', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' });
  }

  const socialHtml = socials.length > 0 ? `
    <div style="margin-top:var(--space-md);">
      <div class="footer-section-title">Follow Us</div>
      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-top:var(--space-sm);">
        ${socials.map(s => `
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" title="${s.label}"
             style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:${s.color};color:#fff;transition:transform 0.2s,box-shadow 0.2s;text-decoration:none;"
             onmouseover="this.style.transform='scale(1.15)';this.style.boxShadow='0 4px 15px ${s.color}66'"
             onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">
            ${s.icon}
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';

  footerEl.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-section-title">📚 Online Education Guru</div>
          <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;">
            ગુજરાત શિક્ષણ માટેનું સંપૂર્ણ ઓનલાઈન પ્લેટફોર્મ.<br>
            બાલ વાટિકા થી ધોરણ 12 સુધીનું સંપૂર્ણ શૈક્ષણિક સામગ્રી.
          </p>
          ${socialHtml}
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
    let href = '#';
    if (item.link) {
      href = item.link;
    } else if (item.fileUrl) {
      href = item.fileUrl;
    } else if (options.linkPrefix) {
      href = `${options.linkPrefix}?id=${item.id}`;
    }
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
    loader.innerHTML = `<div class="spinner"></div><div class="loader-text"></div>`;
    document.body.appendChild(loader);
  }
  loader.querySelector('.loader-text').textContent = text;
  loader.classList.add('active');
}

function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (loader) loader.classList.remove('active');
}

// ============================================================
// RIGHT-CLICK, COPY, SCREENSHOT & PRINT PROTECTION
// ============================================================

function disableRightClick() {
  document.body.classList.add('protected');

  // Disable right-click context menu
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showToast('Right click disabled', 'info');
    return false;
  });

  // Disable keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Disable F12 (DevTools)
    if (e.key === 'F12') { e.preventDefault(); return false; }
    // Disable Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return false; }
    // Disable Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
    // Disable Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return false; }
    // Disable Ctrl+U (View source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
    // Disable Ctrl+S (Save page)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) { e.preventDefault(); return false; }
    // Disable Ctrl+C (Copy)
    if (e.ctrlKey && (e.key === 'C' || e.key === 'c') && !e.shiftKey) { e.preventDefault(); return false; }
    // Disable Ctrl+A (Select all)
    if (e.ctrlKey && (e.key === 'A' || e.key === 'a')) { e.preventDefault(); return false; }
    // Disable Ctrl+P (Print)
    if (e.ctrlKey && (e.key === 'P' || e.key === 'p')) { e.preventDefault(); return false; }
    // Disable PrintScreen
    if (e.key === 'PrintScreen') { e.preventDefault(); return false; }
  });

  // Block copy event
  document.addEventListener('copy', function (e) {
    e.preventDefault();
    showToast('કોપી કરવાની મંજૂરી નથી', 'info');
    return false;
  });

  // Block cut event
  document.addEventListener('cut', function (e) {
    e.preventDefault();
    return false;
  });

  // Block drag (prevents drag-to-copy images/text)
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  });

  // Block select all via selectstart
  document.addEventListener('selectstart', function (e) {
    e.preventDefault();
    return false;
  });

  // Blur page on PrintScreen / screenshot attempt
  document.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') {
      navigator.clipboard.writeText('').catch(() => { });
      showToast('Screenshot disabled', 'info');
    }
  });

  // Hide content when tab loses focus (anti-screenshot for some tools)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      document.body.style.filter = 'blur(30px)';
    } else {
      document.body.style.filter = 'none';
    }
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
      ins.setAttribute('data-ad-client', 'ca-pub-1217460377621795'); // Replace with your pub ID
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

  // Load header, footer & news in parallel for speed
  Promise.all([
    loadHeader(),
    loadFooter(),
    loadBreakingNews()
  ]).catch(() => { });

  // Init ad slots
  setTimeout(initAdSlots, 1000);

  // Hide URL params after .html on all pages (delay to allow page scripts to capture params first)
  setTimeout(function () {
    if (window.history && window.history.replaceState && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, 100);
});
