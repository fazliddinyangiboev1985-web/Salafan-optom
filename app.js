/* =========================================================
   САЛАФАН МОБИЛ ДАШБОРД — app.js
   ========================================================= */

'use strict';

// Safely get abort signal with timeout (compatible with iOS < 16)
function getTimeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms);
    }
    if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    }
    return undefined;
}

// ─── SOZLAMALAR (Local Storage) ────────────────────────────────────────────
const CFG_KEY = 'salafan_config';

function loadConfig() {
    try {
        let cfg = JSON.parse(localStorage.getItem(CFG_KEY));
        if (!cfg || !cfg.host) {
            cfg = {
                host: '100.123.166.11',
                pub: 'Sal',
                service: 'webapi',
                companyName: 'STAR SOFT'
            };
            localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
        }
        return cfg;
    } catch { 
        return {
            host: '100.123.166.11',
            pub: 'Sal',
            service: 'webapi',
            companyName: 'STAR SOFT'
        };
    }
}

function saveConfig(cfg) {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

function getBaseUrl(cfg) {
    const host    = cfg.host    || '127.0.0.1';
    const pub     = cfg.pub     || 'salafan';
    const service = cfg.service || 'webapi';
    
    // If the host starts with http:// or https://, use it directly
    if (host.startsWith('http://') || host.startsWith('https://')) {
        return `${host}/${pub}/hs/${service}`;
    }
    
    // If we are on HTTPS page, or the host is a remote domain (not IP), use https
    const isIp = /^[0-9.]+$/.test(host.split(':')[0]);
    const protocol = (window.location.protocol === 'https:' || !isIp) ? 'https' : 'http';
    
    return `${protocol}://${host}/${pub}/hs/${service}`;
}

// ─── SESSION ───────────────────────────────────────────────────────────────
const SESSION_KEY = 'salafan_session';

function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
}

function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ─── LOCAL CACHE (Offline-first) ──────────────────────────────────────────
function getCachedData(key) {
    try {
        const item = localStorage.getItem('cache_' + key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
}

function setCachedData(key, data) {
    try {
        localStorage.setItem('cache_' + key, JSON.stringify(data));
    } catch (e) {}
}

function formatPhoneRaw(val) {
    let formatted = '';
    if (val.length > 0) {
        formatted += val.substring(0, 2);
    }
    if (val.length > 2) {
        formatted += ' ' + val.substring(2, 5);
    }
    if (val.length > 5) {
        formatted += ' ' + val.substring(5, 7);
    }
    if (val.length > 7) {
        formatted += ' ' + val.substring(7, 9);
    }
    return formatted;
}

// ─── LOADER ───────────────────────────────────────────────────────────────
function showLoader(text = 'Маълумотлар юкланмоқда...') {
    document.getElementById('global-loader-text').textContent = text;
    document.getElementById('global-loader').style.display = 'flex';
}
function hideLoader() {
    document.getElementById('global-loader').style.display = 'none';
}

// ─── STATUS BANNER ────────────────────────────────────────────────────────
function showStatus(msg, type = 'info') {
    const el = document.getElementById('app-status-banner');
    el.textContent = msg;
    el.className = `app-status-banner ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────
function fmt(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return '0 сўм';
    return n.toLocaleString('uz-UZ') + ' сўм';
}

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    // Replace space with T for ISO string parsing in Safari
    let cleanStr = dateStr;
    if (typeof dateStr === 'string') {
        cleanStr = dateStr.replace(' ', 'T');
    }
    const d = new Date(cleanStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'2-digit' });
}

// ─── DATE DEFAULTS ────────────────────────────────────────────────────────
function initDates() {
    const now = new Date();
    document.getElementById('date-from').value = toInputDate(now);
    document.getElementById('date-to').value   = toInputDate(now);
}

function toInputDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ─── SCREEN SWITCHER ──────────────────────────────────────────────────────
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-screen').style.display  = 'none';
    
    // Auto-fill saved credentials
    const savedPhone = localStorage.getItem('saved_phone') || '';
    const savedPass  = localStorage.getItem('saved_password') || '';
    if (savedPhone) {
        document.getElementById('phone').value = formatPhoneRaw(savedPhone);
    }
    if (savedPass) {
        document.getElementById('password').value = savedPass;
    }
}

function showMainScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-screen').style.display  = 'flex';
    showHomeMenu();
}

function showHomeMenu() {
    document.getElementById('header-blue').style.display    = 'flex';
    document.getElementById('tab-header').style.display     = 'none';
    document.getElementById('date-filter-bar').style.display = 'none';
    document.getElementById('home-menu').style.display      = 'flex';
    document.getElementById('content-scroll-container').style.display = 'none';
}

function handleBackBtnClick() {
    if (currentTab && currentTab.tabId === 'overdue') {
        if (activeOverdueSubTab === 'customers') {
            openTab('haridorlar', '👥 Харидорлар Қарзи', fetchHaridorlar);
        } else {
            openTab('taminotchilar', '🏢 Таъминотчилар ҳаққи', fetchTaminotchilar);
        }
    } else {
        showHomeMenu();
    }
}

// ─── TAB NAVIGATION ───────────────────────────────────────────────────────
let currentTab = null;

function openTab(tabId, title, fetchFn) {
    currentTab = { tabId, title, fetchFn };

    // Show sub-screen elements
    document.getElementById('header-blue').style.display    = 'none';
    document.getElementById('tab-header').style.display     = 'flex';
    document.getElementById('tab-header-title').textContent = title;
    document.getElementById('home-menu').style.display      = 'none';
    document.getElementById('content-scroll-container').style.display = 'block';

    const hasDates = (fetchFn !== null);
    document.getElementById('date-filter-bar').style.display = hasDates ? 'block' : 'none';

    // Activate correct tab content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-content-' + tabId).classList.add('active');

    if (fetchFn) fetchFn(false);
}

// ─── API CALLS ────────────────────────────────────────────────────────────
async function apiGet(endpoint) {
    const cfg = loadConfig();
    const url = getBaseUrl(cfg) + endpoint;
    const authHeader = 'Basic ' + btoa(unescape(encodeURIComponent('Админ:2162340')));
    const resp = await fetch(url, {
        headers: { 
            'Accept': 'application/json',
            'Authorization': authHeader
        },
        signal: getTimeoutSignal(15000)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}

async function apiPost(endpoint, body) {
    const cfg = loadConfig();
    const url = getBaseUrl(cfg) + endpoint;
    const authHeader = 'Basic ' + btoa(unescape(encodeURIComponent('Админ:2162340')));
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json',
            'Authorization': authHeader
        },
        body: JSON.stringify(body),
        signal: getTimeoutSignal(15000)
    });
    
    let data;
    try {
        data = await resp.json();
    } catch(e) {}
    
    if (!resp.ok) {
        if (data && data.message) {
            throw new Error(data.message);
        }
        throw new Error(`HTTP ${resp.status}`);
    }
    return data;
}

function getDateRange() {
    return {
        date1: document.getElementById('date-from').value,
        date2: document.getElementById('date-to').value
    };
}

// ─── FETCH FUNCTIONS ──────────────────────────────────────────────────────
async function fetchKassaKirimi(force = false) {
    const { date1, date2 } = getDateRange();
    const cacheKey = `kassa_kirim_${date1}_${date2}`;
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderKassaKirimi(cached);
            return;
        }
    }
    showLoader('Касса Кирими юкланмоқда...');
    try {
        const data = await apiGet(`/data?type=kassa_kirim&date1=${date1}&date2=${date2}`);
        setCachedData(cacheKey, data);
        renderKassaKirimi(data);
    } catch (e) {
        renderListError('list-kassa-kir', e);
    } finally { hideLoader(); }
}

async function fetchKassaChiqimi(force = false) {
    const { date1, date2 } = getDateRange();
    const cacheKey = `kassa_chiqim_${date1}_${date2}`;
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderKassaChiqimi(cached);
            return;
        }
    }
    showLoader('Касса Чиқими юкланмоқда...');
    try {
        const data = await apiGet(`/data?type=kassa_chiqim&date1=${date1}&date2=${date2}`);
        setCachedData(cacheKey, data);
        renderKassaChiqimi(data);
    } catch (e) {
        renderListError('list-kassa-chiq', e);
    } finally { hideLoader(); }
}

async function fetchTovarlar(force = false) {
    const cacheKey = 'tovarlar';
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderTovarlar(cached);
            return;
        }
    }
    showLoader('Товарлар рўйхати юкланмоқда...');
    try {
        const data = await apiGet('/data?type=tovarlar');
        setCachedData(cacheKey, data);
        renderTovarlar(data);
    } catch (e) {
        renderListError('list-tovar', e);
    } finally { hideLoader(); }
}

async function fetchHaridorlar(force = false) {
    const { date1, date2 } = getDateRange();
    const cacheKey = `haridorlar_${date1}_${date2}`;
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderHaridorlar(cached);
            return;
        }
    }
    showLoader('Харидорлар қарзи юкланмоқда...');
    try {
        const data = await apiGet(`/data?type=haridorlar&date1=${date1}&date2=${date2}`);
        setCachedData(cacheKey, data);
        renderHaridorlar(data);
    } catch (e) {
        renderListError('list-haridorlar', e);
    } finally { hideLoader(); }
}

async function fetchTaminotchilar(force = false) {
    const cacheKey = 'taminotchilar';
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderTaminotchilar(cached);
            return;
        }
    }
    showLoader('Таъминотчилар юкланмоқда...');
    try {
        const data = await apiGet('/data?type=taminotchilar');
        setCachedData(cacheKey, data);
        renderTaminotchilar(data);
    } catch (e) {
        renderListError('list-taminotchilar', e);
    } finally { hideLoader(); }
}

async function fetchDokBuyicha(force = false) {
    const { date1, date2 } = getDateRange();
    const cacheKey = `dok_buyicha_${date1}_${date2}`;
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderDokBuyicha(cached);
            return;
        }
    }
    showLoader('Документ бўйича қарзлар юкланмоқда...');
    try {
        const data = await apiGet(`/data?type=overdue_debts_by_doc&date1=${date1}&date2=${date2}`);
        setCachedData(cacheKey, data);
        renderDokBuyicha(data);
    } catch (e) {
        renderListError('list-dok-buyicha', e);
    } finally { hideLoader(); }
}

function renderDokBuyicha(data) {
    const rows = data.rows || [];
    const list = document.getElementById('list-dok-buyicha');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = 0;
    if (!rows.length) {
        list.innerHTML = emptyState('📋', 'Муддати келган ҳужжатлар йўқ');
    } else {
        list.innerHTML = rows.map(r => {
            const qarz = parseFloat(r.qarz) || 0;
            total += qarz;
            const daysLeft = r.tulov_kuni ? getDaysLeft(r.tulov_kuni, today) : null;
            let dueBadge = '';
            if (daysLeft !== null) {
                if (daysLeft < 0) {
                    dueBadge = `<span style="font-size:0.68rem; font-weight:700; color:#fb7185; background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.3); border-radius:6px; padding:2px 7px;">⚠️ ${Math.abs(daysLeft)} кун ўтди</span>`;
                } else if (daysLeft === 0) {
                    dueBadge = `<span style="font-size:0.68rem; font-weight:700; color:#fcd34d; background:rgba(245,158,11,0.18); border:1px solid rgba(245,158,11,0.4); border-radius:6px; padding:2px 7px;">🔔 Бугун!</span>`;
                } else {
                    dueBadge = `<span style="font-size:0.68rem; font-weight:700; color:#fcd34d; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:2px 7px;">⏰ ${daysLeft} кун қолди</span>`;
                }
            }
            return `<div class="item-card" data-search="${r.haridor || ''}" style="border-color:rgba(139,92,246,0.35); background:rgba(139,92,246,0.05);">
                <div class="item-card-header">
                    <span class="item-name" style="color:#e2d9f3;">${r.haridor || 'Номаълум'}</span>
                    <span class="badge" style="background:rgba(139,92,246,0.18); color:#c4b5fd; border:1px solid rgba(139,92,246,0.35);">${fmt(r.qarz)}</span>
                </div>
                <div class="item-row"><span style="color:#8b5cf6; font-weight:600;">📄 Ҳужжат</span><span style="font-size:0.8rem;">${r.dok_nomi}</span></div>
                <div class="item-row"><span>Ҳужжат санаси</span><span>${r.dok_sana}</span></div>
                <div class="item-row"><span>Тўлов куни</span><span>${fmtDate(r.tulov_kuni)} ${dueBadge}</span></div>
                ${r.telefon ? `<div class="item-row"><span>Телефон</span><span>${r.telefon}</span></div>` : ''}
            </div>`;
        }).join('');
    }
    document.getElementById('val-dok-total').textContent = fmt(total);
    document.getElementById('val-dok-count').textContent = rows.length ? `${rows.length} та ҳужжат` : '';
}

async function fetchReconciliation(force = false) {
    const select = document.getElementById('reconciliation-counterparty');
    const counterpartyId = select?.value;
    const list = document.getElementById('list-reconciliation');
    const summaryBox = document.getElementById('reconciliation-summary-box');
    
    if (!counterpartyId) {
        list.innerHTML = emptyState('📄', 'Илтимос, контрагентни танланг');
        summaryBox.style.display = 'none';
        return;
    }
    
    const { date1, date2 } = getDateRange();
    const cacheKey = `reconciliation_${counterpartyId}_${date1}_${date2}`;
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            renderReconciliation(cached);
            return;
        }
    }
    
    showLoader('Акт сверка юкланмоқда...');
    try {
        const data = await apiGet(`/data?type=reconciliation&counterparty=${counterpartyId}&date1=${date1}&date2=${date2}`);
        setCachedData(cacheKey, data);
        renderReconciliation(data);
    } catch (e) {
        renderListError('list-reconciliation', e);
        summaryBox.style.display = 'none';
    } finally { hideLoader(); }
}

async function openReconciliationTab() {
    openTab('reconciliation', '📄 Акт Сверка', fetchReconciliation);
    
    const select = document.getElementById('reconciliation-counterparty');
    if (select) {
        showLoader('Контрагентлар юкланмоқда...');
        await loadCounterparties();
        hideLoader();
        
        select.innerHTML = '<option value="">— Контрагентни танланг —</option>';
        counterparties.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nomi;
            select.appendChild(opt);
        });
    }
}

// ─── RENDER FUNCTIONS ─────────────────────────────────────────────────────
function buildSearch(inputId, listId, rowSelector = '.item-card') {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.addEventListener('input', () => {
        const q = inp.value.toLowerCase();
        document.querySelectorAll(`#${listId} ${rowSelector}`).forEach(card => {
            const text = card.dataset.search || card.textContent;
            card.style.display = text.toLowerCase().includes(q) ? 'block' : 'none';
        });
    });
}

function renderListError(listId, e) {
    document.getElementById(listId).innerHTML =
        `<div class="empty-state"><div class="empty-icon">⚠️</div>Маълумот юклашда хатолик:<br><small>${e.message}</small></div>`;
}

function emptyState(icon, text) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div>${text}</div>`;
}

function renderKassaKirimi(data) {
    const rows = data.rows || [];
    let total = 0;
    const list = document.getElementById('list-kassa-kir');
    if (!rows.length) { list.innerHTML = emptyState('📥', 'Бу давр учун маълумот йўқ'); }
    else {
        list.innerHTML = rows.map(r => {
            total += parseFloat(r.summa) || 0;
            
            const docDate = r.sana_vaqt ? new Date(r.sana_vaqt.replace(' ', 'T')) : null;
            const diffHours = docDate ? (new Date() - docDate) / (1000 * 60 * 60) : 999;
            const canEdit = diffHours <= 24;
            const actionButtons = canEdit ? `
                <div class="item-card-actions" style="margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                    <button class="btn-action-edit btn-secondary" onclick="editPaymentClick('${r.id}', 'receipt', '${r.kontragent_id}', ${r.summa}, '${escapeHtml(r.izoh || '')}')" style="height: 28px; padding: 0 8px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05);">✏️ Таҳрир</button>
                    <button class="btn-action-delete btn-secondary" onclick="deletePaymentClick('${r.id}', 'receipt')" style="height: 28px; padding: 0 8px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; color: #f87171; border-color: rgba(244,63,94,0.3); display: flex; align-items: center; gap: 4px; background: rgba(244,63,94,0.05);">🗑️ Ўчириш</button>
                </div>
            ` : '';

            return `<div class="item-card" data-search="${r.kontragent || ''} ${r.summa}">
                <div class="item-card-header">
                    <span class="item-name">${r.kontragent || 'Номаълум'}</span>
                    <span class="badge badge-emerald">${fmt(r.summa)}</span>
                </div>
                <div class="item-row"><span>Сана</span><span>${fmtDate(r.sana)}</span></div>
                ${r.izoh ? `<div class="item-row"><span>Изоҳ</span><span>${r.izoh}</span></div>` : ''}
                ${actionButtons}
            </div>`;
        }).join('');
    }
    document.getElementById('val-kir-total').textContent = fmt(total);
}

function renderKassaChiqimi(data) {
    const rows = data.rows || [];
    let total = 0;
    const list = document.getElementById('list-kassa-chiq');
    if (!rows.length) { list.innerHTML = emptyState('📤', 'Бу давр учун маълумот йўқ'); }
    else {
        list.innerHTML = rows.map(r => {
            total += parseFloat(r.summa) || 0;

            const docDate = r.sana_vaqt ? new Date(r.sana_vaqt.replace(' ', 'T')) : null;
            const diffHours = docDate ? (new Date() - docDate) / (1000 * 60 * 60) : 999;
            const canEdit = diffHours <= 24;
            const actionButtons = canEdit ? `
                <div class="item-card-actions" style="margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                    <button class="btn-action-edit btn-secondary" onclick="editPaymentClick('${r.id}', 'disbursement', '${r.kontragent_id}', ${r.summa}, '${escapeHtml(r.izoh || '')}')" style="height: 28px; padding: 0 8px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05);">✏️ Таҳрир</button>
                    <button class="btn-action-delete btn-secondary" onclick="deletePaymentClick('${r.id}', 'disbursement')" style="height: 28px; padding: 0 8px; font-size: 0.78rem; border-radius: 6px; cursor: pointer; color: #f87171; border-color: rgba(244,63,94,0.3); display: flex; align-items: center; gap: 4px; background: rgba(244,63,94,0.05);">🗑️ Ўчириш</button>
                </div>
            ` : '';

            return `<div class="item-card" data-search="${r.kontragent || ''} ${r.summa}">
                <div class="item-card-header">
                    <span class="item-name">${r.kontragent || 'Номаълум'}</span>
                    <span class="badge badge-rose">${fmt(r.summa)}</span>
                </div>
                <div class="item-row"><span>Сана</span><span>${fmtDate(r.sana)}</span></div>
                ${r.izoh ? `<div class="item-row"><span>Изоҳ</span><span>${r.izoh}</span></div>` : ''}
                ${actionButtons}
            </div>`;
        }).join('');
    }
    document.getElementById('val-chiq-total').textContent = fmt(total);
}

function renderTovarlar(data) {
    const rows = data.rows || [];
    const list = document.getElementById('list-tovar');
    if (!rows.length) { list.innerHTML = emptyState('📦', 'Омборда товар йўқ'); }
    else {
        list.innerHTML = rows.map(r => {
            const kg = parseFloat(r.kg) || 0;
            const kop = parseFloat(r.kop) || 0;
            const badge = kop > 0 ? 'badge-blue' : 'badge-rose';
            return `<div class="item-card" data-search="${r.nomi || ''}">
                <div class="item-card-header">
                    <span class="item-name">${r.nomi || 'Номаълум'}</span>
                    <span class="badge ${badge}">${kop.toLocaleString('uz-UZ')} қоп</span>
                </div>
                <div class="item-row"><span>Оғирлиги</span><span>${kg.toLocaleString('uz-UZ')} кг</span></div>
                ${r.narx ? `<div class="item-row"><span>Нарх</span><span>${fmt(r.narx)}</span></div>` : ''}
                ${r.ombor ? `<div class="item-row"><span>Омбор</span><span>${r.ombor}</span></div>` : ''}
            </div>`;
        }).join('');
    }
}

function renderHaridorlar(data) {
    const rows = data.rows || [];
    let total = 0;

    const list = document.getElementById('list-haridorlar');
    if (!rows.length) { 
        list.innerHTML = emptyState('👥', 'Қарздор харидор йўқ'); 
    } else {
        rows.sort((a, b) => (a.nomi || '').localeCompare(b.nomi || '', 'uz-UZ'));

        list.innerHTML = rows.map(r => {
            const qarz = parseFloat(r.qarz) || 0;
            total += qarz;
            return `<div class="item-card" data-search="${r.nomi || ''}" style="border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.12);">
                <div class="item-card-header">
                    <span class="item-name">${r.nomi || 'Номаълум'}</span>
                    <span class="badge badge-rose">${fmt(qarz)}</span>
                </div>
                ${r.telefon ? `<div class="item-row"><span>Телефон</span><span>${r.telefon}</span></div>` : ''}
            </div>`;
        }).join('');
    }

    document.getElementById('val-haridorlar-total').textContent = fmt(total);
}

function buildHaridorCard(r, cutoff, overdue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromToday = r.muddati ? getDaysLeft(r.muddati, today) : null;

    let dueBadge = '';
    if (r.muddati) {
        if (overdue) {
            // Nechi kun oldin o'tgan (bugundan hisoblaganda)
            const daysAgo = daysFromToday !== null ? Math.abs(daysFromToday) : '?';
            dueBadge = `<span style="font-size:0.68rem; font-weight:700; color:#fb7185; background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.3); border-radius:6px; padding:2px 7px; margin-left:6px;">⚠️ ${daysAgo} кун ќтди</span>`;
        } else if (daysFromToday !== null && daysFromToday <= 7) {
            dueBadge = `<span style="font-size:0.68rem; font-weight:700; color:#fcd34d; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:2px 7px; margin-left:6px;">⏰ ${daysFromToday} кун қолди</span>`;
        } else if (daysFromToday !== null) {
            dueBadge = `<span style="font-size:0.68rem; font-weight:600; color:#6ee7b7; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.25); border-radius:6px; padding:2px 7px; margin-left:6px;">${daysFromToday} кун қолди</span>`;
        }
    }

    const cardStyle = overdue
        ? 'border-color:rgba(244,63,94,0.55); background:rgba(244,63,94,0.08);'
        : 'border-color:rgba(16,185,129,0.25); background:rgba(16,185,129,0.04);';

    return `<div class="item-card" data-search="${r.nomi || ''}" style="${cardStyle}">
        <div class="item-card-header">
            <span class="item-name">${r.nomi || 'Номаълум'}</span>
            <span class="badge ${overdue ? 'badge-rose' : 'badge-orange'}">${fmt(r.qarz)}</span>
        </div>
        ${r.muddati ? `<div class="item-row"><span>Муддати</span><span>${fmtDate(r.muddati)}${dueBadge}</span></div>` : ''}
        ${r.telefon ? `<div class="item-row"><span>Телефон</span><span>${r.telefon}</span></div>` : ''}
    </div>`;
}

function isOverdueByDate(muddati, cutoff) {
    if (!muddati) return false;
    let cleanStr = muddati;
    if (typeof muddati === 'string') {
        cleanStr = muddati.replace(' ', 'T');
    }
    const d = new Date(cleanStr);
    if (isNaN(d)) return false;
    d.setHours(0, 0, 0, 0);
    return d <= cutoff;
}

function getDaysLeft(muddati, today) {
    let cleanStr = muddati;
    if (typeof muddati === 'string') {
        cleanStr = muddati.replace(' ', 'T');
    }
    const d = new Date(cleanStr);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
}

function renderTaminotchilar(data) {
    const rows = data.rows || [];
    let total = 0;
    const list = document.getElementById('list-taminotchilar');
    if (!rows.length) { list.innerHTML = emptyState('🏢', 'Таъминотчи қарзи йўқ'); }
    else {
        list.innerHTML = rows.map(r => {
            total += parseFloat(r.qarz) || 0;
            return `<div class="item-card" data-search="${r.nomi || ''}">
                <div class="item-card-header">
                    <span class="item-name">${r.nomi || 'Номаълум'}</span>
                    <span class="badge badge-orange">${fmt(r.qarz)}</span>
                </div>
                ${r.muddati ? `<div class="item-row"><span>Муддати</span><span>${fmtDate(r.muddati)}</span></div>` : ''}
                ${r.telefon ? `<div class="item-row"><span>Телефон</span><span>${r.telefon}</span></div>` : ''}
            </div>`;
        }).join('');
    }
    document.getElementById('val-taminot-total').textContent = fmt(total);
}

function renderReconciliation(data) {
    const list = document.getElementById('list-reconciliation');
    const summaryBox = document.getElementById('reconciliation-summary-box');
    
    const startVal = parseFloat(data.nach_ostatok) || 0;
    const endVal = parseFloat(data.kon_ostatok) || 0;
    const debetVal = parseFloat(data.total_debet) || 0;
    const kreditVal = parseFloat(data.total_kredit) || 0;
    
    document.getElementById('val-rec-start').innerHTML = fmtRecBalance(startVal);
    document.getElementById('val-rec-end').innerHTML = fmtRecBalance(endVal);
    document.getElementById('val-rec-debet').textContent = fmt(debetVal);
    document.getElementById('val-rec-kredit').textContent = fmt(kreditVal);
    
    summaryBox.style.display = 'block';
    
    const rows = data.rows || [];
    if (!rows.length) {
        list.innerHTML = emptyState('📄', 'Ушбу давр учун ҳаракатлар мавжуд эмас');
    } else {
        list.innerHTML = rows.map(r => {
            const deb = parseFloat(r.debet) || 0;
            const kred = parseFloat(r.kredit) || 0;
            const bal = parseFloat(r.qoldiq) || 0;
            
            let valLabel = '';
            if (deb > 0) valLabel = `<span class="badge badge-rose">-${fmt(deb)}</span>`;
            else if (kred > 0) valLabel = `<span class="badge badge-emerald">+${fmt(kred)}</span>`;
            
            return `<div class="item-card">
                <div class="item-card-header">
                    <span class="item-name" style="font-size:0.82rem; font-weight:600; color:var(--text-secondary);">${r.dok || 'Ҳужжат'}</span>
                    ${valLabel}
                </div>
                <div class="item-row"><span>Сана</span><span>${r.sana}</span></div>
                ${r.izoh ? `<div class="item-row"><span>Изоҳ</span><span>${r.izoh}</span></div>` : ''}
                <div class="item-row"><span>Қолдиқ</span><span>${fmtRecBalance(bal)}</span></div>
            </div>`;
        }).join('');
    }
}

function fmtRecBalance(val) {
    if (val < 0) {
        return `<span style="color:var(--accent-emerald); font-weight:700;">${fmt(-val)} (Бизнинг ҳақ)</span>`;
    } else if (val > 0) {
        return `<span style="color:var(--accent-rose); font-weight:700;">${fmt(val)} (Қарз)</span>`;
    } else {
        return `<span>0 сўм</span>`;
    }
}

let overdueData = { customers: [], suppliers: [] };
let activeOverdueSubTab = 'customers';

async function fetchOverdueDebts(force = false) {
    const cacheKey = 'overdue_debts';
    if (!force) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            overdueData = cached || { customers: [], suppliers: [] };
            renderOverdueDebts();
            return;
        }
    }
    showLoader('Тўлов муддати келган қарзлар юкланмоқда...');
    try {
        const data = await apiGet('/data?type=overdue_debts');
        setCachedData(cacheKey, data);
        overdueData = data || { customers: [], suppliers: [] };
        renderOverdueDebts();
    } catch (e) {
        renderListError('list-overdue', e);
        document.getElementById('val-overdue-total').textContent = '0 сўм';
    } finally { hideLoader(); }
}

function renderOverdueDebts() {
    const list = document.getElementById('list-overdue');
    const items = activeOverdueSubTab === 'customers' ? (overdueData.customers || []) : (overdueData.suppliers || []);
    
    let grandTotal = 0;
    
    const labelText = activeOverdueSubTab === 'customers' ? 'Жами харидорлар муддати келган қарзи' : 'Жами таъминотчилардан муддати келган қарзимиз';
    const badgeColor = activeOverdueSubTab === 'customers' ? 'badge-rose' : 'badge-orange';
    const textStyle = activeOverdueSubTab === 'customers' ? 'text-rose' : 'text-orange';
    
    document.getElementById('overdue-total-label').textContent = labelText;
    
    const totalEl = document.getElementById('val-overdue-total');
    totalEl.className = 'summary-value ' + textStyle;
    
    if (!items.length) {
        list.innerHTML = emptyState('📅', 'Муддати келган қарзлар мавжуд эмас');
        totalEl.textContent = '0 сўм';
        return;
    }
    
    list.innerHTML = items.map(c => {
        grandTotal += parseFloat(c.total) || 0;
        return `<div class="item-card" data-search="${c.nomi || ''}">
            <div class="item-card-header" style="margin-bottom:6px;">
                <span class="item-name" style="font-size:0.92rem; font-weight:700;">${c.nomi || 'Номаълум'}</span>
                <span class="badge ${badgeColor}">${fmt(c.total)}</span>
            </div>
            ${c.telefon ? `<div class="item-row" style="margin-bottom:6px;"><span>Телефон</span><span>${c.telefon}</span></div>` : ''}
            <div class="docs-list" style="border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; margin-top:8px; display:flex; flex-direction:column; gap:8px;">
                ${(c.docs || []).map(d => `
                    <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; flex-direction:column; gap:2px; flex:1; padding-right:10px;">
                            <span style="font-weight:600; color:var(--text-secondary); line-height:1.2;">${d.dok_nomi}</span>
                            <span style="font-size:0.68rem; color:var(--text-muted);">Муддати: ${d.sana}</span>
                        </div>
                        <span style="font-weight:700; color:var(--text-primary);">${fmt(d.summa)}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }).join('');
    
    totalEl.textContent = fmt(grandTotal);
}

function openOverdueTab(subTab) {
    activeOverdueSubTab = subTab;
    const title = subTab === 'customers' ? '👥 Муддати Ўтган Қарзлар' : '🏢 Муддати Келган Тўловлар';
    openTab('overdue', title, fetchOverdueDebts);
    document.getElementById('date-filter-bar').style.display = 'none';
    
    // Hide sub-tab toggles container so only the requested list type shows up
    const tabsHeader = document.getElementById('overdue-tabs-header');
    if (tabsHeader) tabsHeader.style.display = 'none';
}

// ─── LOGIN ────────────────────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const raw = document.getElementById('phone').value.replace(/\D/g, '');
    const raw9 = raw.slice(-9);
    const phone = '+998' + raw9;
    const password = document.getElementById('password').value;

    if (!password || raw.length < 7) {
        showStatus('⚠️ Телефон ёки паролни тўлдиринг!', 'warning');
        return;
    }

    // Bypass check for special developer credentials
    if (raw9 === '993292340' && password === '2340') {
        saveSession({ user_id: 'admin_bypass', name: 'Фазлиддин', role: 'admin' });
        localStorage.setItem('saved_phone', raw);
        localStorage.setItem('saved_password', password);
        document.getElementById('header-user-name').textContent = 'Фазлиддин';
        showMainScreen();
        showStatus('✅ Муваффақиятли тизимга кирилди (тезкор)', 'info');
        return;
    }

    const btn = document.getElementById('login-submit-btn');
    btn.textContent = 'Кирилмоқда...';
    btn.disabled = true;
    showLoader('Авторизация...');

    // Local authentication from cached users (offline login)
    let cachedUsers = [];
    try {
        cachedUsers = JSON.parse(localStorage.getItem('cached_users')) || [];
    } catch(e) {}

    if (cachedUsers.length > 0) {
        // Find user by clean 9-digit phone
        const matchedUser = cachedUsers.find(u => u.phone === raw9);
        if (!matchedUser) {
            showStatus('❌ Бу телефон рақами рўйхатдан ўтмаган!', 'error');
            btn.textContent = 'Кириш';
            btn.disabled = false;
            hideLoader();
            return;
        }

        if (matchedUser.password !== password) {
            showStatus('❌ Парол нотўғри!', 'error');
            btn.textContent = 'Кириш';
            btn.disabled = false;
            hideLoader();
            return;
        }

        // Login successful (offline)
        saveSession({ user_id: matchedUser.user_id, name: matchedUser.name, role: matchedUser.role });
        localStorage.setItem('saved_phone', raw);
        localStorage.setItem('saved_password', password);
        document.getElementById('header-user-name').textContent = matchedUser.name || 'Хуш келибсиз';
        showMainScreen();
        showStatus('✅ Авторизация (офлайн)', 'info');
        
        btn.textContent = 'Кириш';
        btn.disabled = false;
        hideLoader();
        return;
    }

    // Fallback to online login if no cached users list exists
    try {
        const data = await apiPost('/login', { phone, password });
        if (data.status === 'success') {
            saveSession({ user_id: data.user_id, name: data.name, role: data.role });
            localStorage.setItem('saved_phone', raw);
            localStorage.setItem('saved_password', password);
            document.getElementById('header-user-name').textContent = data.name || 'Хуш келибсиз';
            showMainScreen();
        } else {
            showStatus('❌ ' + (data.message || 'Авторизация хатолиги'), 'error');
        }
    } catch (err) {
        if (err.name === 'TypeError' || err.name === 'TimeoutError') {
            showStatus('❌ Сервер билан алоқа йўқ! Созламаларни текширинг.', 'error');
        } else {
            showStatus('❌ Хатолик: ' + err.message, 'error');
        }
    } finally {
        btn.textContent = 'Кириш';
        btn.disabled = false;
        hideLoader();
    }
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────
let selectedPaymentType = 'receipt';
let counterparties = [];

async function loadCounterparties() {
    if (counterparties.length > 0) return;
    try {
        const data = await apiGet('/data?type=counterparties');
        counterparties = data.rows || [];
    } catch (e) {
        console.error('Failed to load counterparties:', e);
        showStatus('⚠️ Контрагентларни юклаб бўлмади', 'warning');
    }
}

function updateCounterpartySelect(forceIncludeId = null) {
    const select = document.getElementById('payment-counterparty');
    if (!select) return;
    select.innerHTML = '<option value="">— Танланг —</option>';
    
    const targetTur = selectedPaymentType === 'receipt' ? 'customer' : 'supplier';
    const filtered = counterparties.filter(c => c.tur === targetTur);
    
    if (forceIncludeId) {
        const found = filtered.some(c => c.id === forceIncludeId);
        if (!found) {
            const extra = counterparties.find(c => c.id === forceIncludeId);
            if (extra) filtered.push(extra);
        }
    }
    
    filtered.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nomi;
        select.appendChild(opt);
    });
}

let editingPaymentId = null;

async function openPaymentModal(type, forceIncludeId = null) {
    editingPaymentId = null;
    showLoader('Контрагентлар юкланмоқда...');
    await loadCounterparties();
    hideLoader();
    
    const payTypeGroup = document.getElementById('modal-pay-type-group');
    const titleEl = document.querySelector('.modal-title');
    const btn = document.getElementById('save-payment-btn');
    if (btn) btn.textContent = '💾 Сақлаш';
    
    if (type) {
        selectedPaymentType = type;
        document.querySelectorAll('.pay-type-btn').forEach(btn => {
            if (btn.dataset.type === type) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        if (payTypeGroup) payTypeGroup.style.display = 'none';
        if (titleEl) titleEl.textContent = type === 'receipt' ? 'Янги Кирим Тўлови' : 'Янги Чиқим Тўлови';
    } else {
        if (payTypeGroup) payTypeGroup.style.display = 'block';
        if (titleEl) titleEl.textContent = 'Янги Тўлов';
    }
    
    // Reset new counterparty container
    document.getElementById('payment-counterparty-group').style.display = 'block';
    document.getElementById('new-counterparty-container').style.display = 'none';
    document.getElementById('new-counterparty-name').value = '';
    document.getElementById('new-counterparty-phone').value = '';
    
    updateCounterpartySelect(forceIncludeId);
    document.getElementById('payment-modal').style.display = 'flex';
}

function closePaymentModal() {
    editingPaymentId = null;
    document.getElementById('payment-modal').style.display = 'none';
    document.getElementById('payment-amount').value  = '';
    document.getElementById('payment-comment').value = '';
    const select = document.getElementById('payment-counterparty');
    if (select) select.value = '';
    
    // Reset new counterparty container
    document.getElementById('payment-counterparty-group').style.display = 'block';
    document.getElementById('new-counterparty-container').style.display = 'none';
    document.getElementById('new-counterparty-name').value = '';
    document.getElementById('new-counterparty-phone').value = '';
}

async function handleSavePayment() {
    const counterpartyEl = document.getElementById('payment-counterparty');
    const amountRaw = document.getElementById('payment-amount').value.replace(/\s/g, '');
    const amount  = parseFloat(amountRaw);
    const comment = document.getElementById('payment-comment').value;

    if (!counterpartyEl || !counterpartyEl.value) { showStatus('⚠️ Илтимос, контрагентни танланг!', 'warning'); return; }
    if (isNaN(amount) || amount <= 0) { showStatus('⚠️ Суммани тўғри киритинг!', 'warning'); return; }

    const btn = document.getElementById('save-payment-btn');
    btn.textContent = 'Сақланмоқда...';
    btn.disabled = true;
    showLoader('Тўлов сақланмоқда...');

    try {
        const payload = {
            type:         selectedPaymentType,
            counterparty: counterpartyEl.value,
            amount,
            comment
        };
        if (editingPaymentId) {
            payload.action = 'edit';
            payload.id = editingPaymentId;
        }
        
        const result = await apiPost('/save_payment', payload);
        if (result.status === 'success') {
            showStatus('✅ ' + (result.message || 'Тўлов муваффақиятли сақланди'), 'info');
            closePaymentModal();
            if (currentTab && currentTab.fetchFn) {
                currentTab.fetchFn(true);
            }
        } else {
            showStatus('❌ ' + (result.message || 'Сақлашда хатолик'), 'error');
        }
    } catch (err) {
        showStatus('❌ ' + err.message, 'error');
    } finally {
        btn.textContent = '💾 Сақлаш';
        btn.disabled = false;
        hideLoader();
    }
}

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────
function openSettingsModal() {
    const cfg = loadConfig();
    document.getElementById('settings-host').value    = cfg.host    || '';
    document.getElementById('settings-pub').value     = cfg.pub     || 'salafan';
    document.getElementById('settings-service').value = cfg.service || 'webapi';
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

async function testSettings() {
    const cfg = {
        host:    document.getElementById('settings-host').value.trim(),
        pub:     document.getElementById('settings-pub').value.trim(),
        service: document.getElementById('settings-service').value.trim()
    };
    const btn = document.getElementById('test-settings-btn');
    btn.textContent = '🔄 Текширилмоқда...';
    btn.disabled = true;
    try {
        const url = `http://${cfg.host}/${cfg.pub}/hs/${cfg.service}/data?type=ping`;
        const authHeader = 'Basic ' + btoa(unescape(encodeURIComponent('Админ:2162340')));
        const resp = await fetch(url, { 
            headers: { 'Authorization': authHeader },
            signal: AbortSignal.timeout(5000) 
        });
        if (resp.ok) {
            const resData = await resp.json();
            const companyName = resData.message || 'STAR SOFT';
            
            const existingCfg = loadConfig();
            existingCfg.host = cfg.host;
            existingCfg.pub = cfg.pub;
            existingCfg.service = cfg.service;
            existingCfg.companyName = companyName;
            saveConfig(existingCfg);

            // Fetch and cache web users list
            try {
                const usersUrl = `http://${cfg.host}/${cfg.pub}/hs/${cfg.service}/data?type=web_users`;
                const usersResp = await fetch(usersUrl, {
                    headers: { 'Authorization': authHeader },
                    signal: AbortSignal.timeout(5000)
                });
                if (usersResp.ok) {
                    const usersData = await usersResp.json();
                    if (usersData && usersData.users) {
                        localStorage.setItem('cached_users', JSON.stringify(usersData.users));
                    }
                }
            } catch (e) {
                console.error("Failed to cache users list:", e);
            }

            showStatus('✅ Сервер билан алоқа ўрнатилди ва фойдаланувчилар юкланди', 'info');

            // Update DOM company name
            const headerComp = document.getElementById('header-company-name');
            if (headerComp) headerComp.textContent = companyName;
        } else {
            showStatus(`❌ Сервер билан алоқа йўқ! (HTTP ${resp.status})`, 'error');
        }
    } catch (err) {
        showStatus(`❌ Сервер билан алоқа йўқ! ${err.message}`, 'error');
    } finally {
        btn.textContent = '🔌 Текшириш';
        btn.disabled = false;
    }
}

function saveSettings() {
    const cfg = {
        host:    document.getElementById('settings-host').value.trim(),
        pub:     document.getElementById('settings-pub').value.trim() || 'salafan',
        service: document.getElementById('settings-service').value.trim() || 'webapi'
    };
    if (!cfg.host) { showStatus('⚠️ Сервер манзилини киритинг!', 'warning'); return; }
    
    const existingCfg = loadConfig();
    existingCfg.host = cfg.host;
    existingCfg.pub = cfg.pub;
    existingCfg.service = cfg.service;
    saveConfig(existingCfg);
    
    closeSettingsModal();
    showStatus('✅ Созламалар сақланди', 'info');
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────
function logout() {
    clearSession();
    showLoginScreen();
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Initialize dates
    initDates();

    // Load settings into settings modal
    const cfg = loadConfig();
    if (cfg.host) {
        document.getElementById('settings-host').value    = cfg.host;
        document.getElementById('settings-pub').value     = cfg.pub    || 'salafan';
        document.getElementById('settings-service').value = cfg.service || 'webapi';
    }
    if (cfg.companyName) {
        const headerComp = document.getElementById('header-company-name');
        if (headerComp) headerComp.textContent = cfg.companyName;
    }

    // Auto-login if session exists
    const session = loadSession();
    if (session) {
        document.getElementById('header-user-name').textContent = session.name || 'Хуш келибсиз';
        showMainScreen();
    } else {
        showLoginScreen();
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Login settings button
    document.getElementById('login-settings-btn').addEventListener('click', openSettingsModal);

    // Back button
    document.getElementById('tab-back-btn').addEventListener('click', handleBackBtnClick);

    // Refresh button
    document.getElementById('tab-refresh-btn').addEventListener('click', () => {
        if (currentTab?.fetchFn) currentTab.fetchFn(true);
    });

    // Logout buttons
    document.getElementById('logout-btn-header').addEventListener('click', logout);
    const logoutBtnMain = document.getElementById('logout-btn-main');
    if (logoutBtnMain) logoutBtnMain.addEventListener('click', logout);

    // ── MENU ITEMS ──────────────────────────────────────────────────────
    document.getElementById('menu-btn-kassa-kir').addEventListener('click', () =>
        openTab('kassa-kir', '📥 Касса Кирими', fetchKassaKirimi)
    );
    document.getElementById('menu-btn-kassa-chiq').addEventListener('click', () =>
        openTab('kassa-chiq', '📤 Касса Чиқими', fetchKassaChiqimi)
    );
    document.getElementById('menu-btn-tovar').addEventListener('click', () =>
        openTab('tovar', '📦 Товарлар', fetchTovarlar)
    );
    document.getElementById('menu-btn-haridorlar').addEventListener('click', () =>
        openTab('haridorlar', '👥 Харидорлар Қарзи', fetchHaridorlar)
    );
    document.getElementById('menu-btn-taminotchilar').addEventListener('click', () =>
        openTab('taminotchilar', '🏢 Таъминотчилар ҳаққи', fetchTaminotchilar)
    );
    // New payment triggers inside cash receipts and cash disbursements tabs
    document.getElementById('btn-add-payment-kir').addEventListener('click', () => openPaymentModal('receipt'));
    document.getElementById('btn-add-payment-chiq').addEventListener('click', () => openPaymentModal('disbursement'));
    document.getElementById('menu-btn-reconciliation').addEventListener('click', openReconciliationTab);
    document.getElementById('reconciliation-counterparty').addEventListener('change', fetchReconciliation);
    
    // Overdue tab triggers
    document.getElementById('btn-haridorlar-overdue').addEventListener('click', () => openOverdueTab('customers'));
    document.getElementById('btn-taminotchilar-overdue').addEventListener('click', () => openOverdueTab('suppliers'));
    const btnDokBuyicha = document.getElementById('btn-haridorlar-dok-buyicha');
    if (btnDokBuyicha) {
        btnDokBuyicha.addEventListener('click', () =>
            openTab('dok-buyicha', '📋 Дол Буйича — Ҳужжатлар', fetchDokBuyicha)
        );
    }
    
    document.getElementById('btn-overdue-customers').addEventListener('click', () => {
        document.getElementById('btn-overdue-customers').classList.add('active');
        document.getElementById('btn-overdue-suppliers').classList.remove('active');
        activeOverdueSubTab = 'customers';
        renderOverdueDebts();
    });
    document.getElementById('btn-overdue-suppliers').addEventListener('click', () => {
        document.getElementById('btn-overdue-customers').classList.remove('active');
        document.getElementById('btn-overdue-suppliers').classList.add('active');
        activeOverdueSubTab = 'suppliers';
        renderOverdueDebts();
    });

    // ── PAYMENT MODAL ───────────────────────────────────────────────────
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('payment-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closePaymentModal();
    });
    document.getElementById('save-payment-btn').addEventListener('click', handleSavePayment);

    // ── NEW COUNTERPARTY ACTIONS ────────────────────────────────────────
    const addNewBtn = document.getElementById('add-new-counterparty-btn');
    const cancelNewBtn = document.getElementById('cancel-new-counterparty-btn');
    const saveNewBtn = document.getElementById('save-new-counterparty-btn');
    const newPhoneInput = document.getElementById('new-counterparty-phone');

    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            document.getElementById('payment-counterparty-group').style.display = 'none';
            document.getElementById('new-counterparty-container').style.display = 'block';
            document.getElementById('new-counterparty-name').focus();
        });
    }

    if (cancelNewBtn) {
        cancelNewBtn.addEventListener('click', () => {
            document.getElementById('payment-counterparty-group').style.display = 'block';
            document.getElementById('new-counterparty-container').style.display = 'none';
            document.getElementById('new-counterparty-name').value = '';
            document.getElementById('new-counterparty-phone').value = '';
        });
    }

    if (newPhoneInput) {
        newPhoneInput.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            if (val.length > 9) val = val.substring(0, 9);
            
            let formatted = '';
            if (val.length > 0) {
                formatted += val.substring(0, 2);
            }
            if (val.length > 2) {
                formatted += ' ' + val.substring(2, 5);
            }
            if (val.length > 5) {
                formatted += ' ' + val.substring(5, 7);
            }
            if (val.length > 7) {
                formatted += ' ' + val.substring(7, 9);
            }
            this.value = formatted;
        });
    }

    if (saveNewBtn) {
        saveNewBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('new-counterparty-name');
            const name = nameInput ? nameInput.value.trim() : '';
            const phoneVal = newPhoneInput ? newPhoneInput.value.replace(/\D/g, '') : '';
            let phone = '';
            if (phoneVal) {
                phone = '+998' + phoneVal.slice(-9);
            }

            if (!name) {
                showStatus('⚠️ Илтимос, контрагент номини киритинг!', 'warning');
                return;
            }

            saveNewBtn.textContent = 'Сақланмоқда...';
            saveNewBtn.disabled = true;
            showLoader('Янги контрагент сақланмоқда...');

            try {
                const targetTur = selectedPaymentType === 'receipt' ? 'customer' : 'supplier';
                const result = await apiPost('/save_counterparty', {
                    name: name,
                    phone: phone,
                    type: targetTur
                });

                if (result.status === 'success') {
                    showStatus('✅ ' + (result.message || 'Контрагент муваффақиятли яратилди!'), 'info');
                    
                    // Add to cache
                    counterparties.push({
                        id: result.id,
                        nomi: result.name,
                        tur: targetTur
                    });

                    // Update payment dropdown list
                    updateCounterpartySelect();
                    
                    // Select the newly created counterparty
                    document.getElementById('payment-counterparty').value = result.id;
                    
                    // Hide new counterparty panel
                    document.getElementById('payment-counterparty-group').style.display = 'block';
                    document.getElementById('new-counterparty-container').style.display = 'none';
                    if (nameInput) nameInput.value = '';
                    if (newPhoneInput) newPhoneInput.value = '';
                } else {
                    showStatus('❌ ' + (result.message || 'Хатолик юз берди'), 'error');
                }
            } catch (err) {
                showStatus('❌ ' + err.message, 'error');
            } finally {
                saveNewBtn.textContent = '💾 Сақлаш';
                saveNewBtn.disabled = false;
                hideLoader();
            }
        });
    }
    document.querySelectorAll('.pay-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pay-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentType = btn.dataset.type;
            updateCounterpartySelect();
        });
    });

    // ── SETTINGS MODAL ──────────────────────────────────────────────────
    document.getElementById('close-settings-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeSettingsModal();
    });
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('test-settings-btn').addEventListener('click', testSettings);

    // ── SEARCH BINDINGS ─────────────────────────────────────────────────
    buildSearch('search-kir',       'list-kassa-kir');
    buildSearch('search-chiq',      'list-kassa-chiq');
    buildSearch('search-tovar',     'list-tovar');
    buildSearch('search-haridorlar','list-haridorlar');
    buildSearch('search-taminot',   'list-taminotchilar');
    buildSearch('search-overdue',   'list-overdue');

    // Phone input formatting (99 329 23 40)
    document.getElementById('phone').addEventListener('input', function() {
        let val = this.value.replace(/\D/g, ''); // faqat raqamlar
        if (val.length > 9) val = val.substring(0, 9);
        
        let formatted = '';
        if (val.length > 0) {
            formatted += val.substring(0, 2);
        }
        if (val.length > 2) {
            formatted += ' ' + val.substring(2, 5);
        }
        if (val.length > 5) {
            formatted += ' ' + val.substring(5, 7);
        }
        if (val.length > 7) {
            formatted += ' ' + val.substring(7, 9);
        }
        this.value = formatted;
    });

    // Payment amount formatting (1000000 -> 1 000 000)
    document.getElementById('payment-amount').addEventListener('input', function() {
        let val = this.value.replace(/\D/g, '');
        if (val) {
            let formatted = parseInt(val, 10).toLocaleString('ru-RU');
            formatted = formatted.replace(/\u00a0/g, ' ');
            this.value = formatted;
        } else {
            this.value = '';
        }
    });
});

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function editPaymentClick(id, type, counterpartyId, amount, comment) {
    // 1. Open payment modal and wait for counterparties to load,
    //    passing counterpartyId so the dropdown always includes the counterparty
    //    (handles both receipt=customer and disbursement=supplier cases)
    await openPaymentModal(type, counterpartyId);
    
    // 2. Set editing payment id (must be done after openPaymentModal resets it to null)
    editingPaymentId = id;
    
    // Change modal title and button text
    document.querySelector('#payment-modal .modal-title').textContent = 'Тўловни ўзгартириш';
    document.getElementById('save-payment-btn').textContent = '💾 Ўзгартиришни сақлаш';
    
    // Hide payment type selection row (since type is locked when editing)
    document.getElementById('modal-pay-type-group').style.display = 'none';
    
    // Pre-fill counterparty, amount, comment (dropdown is fully loaded)
    document.getElementById('payment-counterparty').value = counterpartyId;
    
    // Format amount
    let formattedAmount = parseInt(amount, 10).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
    document.getElementById('payment-amount').value = formattedAmount;
    document.getElementById('payment-comment').value = comment;
}

async function deletePaymentClick(id, type) {
    if (!confirm('Ушбу тўловни ҳақиқатдан ҳам ўчирмоқчимисиз?')) return;
    
    showLoader('Тўлов ўчирилмоқда...');
    try {
        const payload = {
            action: 'delete',
            id: id,
            type: type
        };
        
        const result = await apiPost('/save_payment', payload);
        if (result.status === 'success') {
            showStatus('✅ ' + (result.message || 'Тўлов муваффақиятли ўчирилди!'), 'info');
            if (currentTab && currentTab.fetchFn) {
                currentTab.fetchFn(true);
            }
        } else {
            showStatus('❌ ' + (result.message || 'Ўчириб бўлмади'), 'error');
        }
    } catch(err) {
        showStatus('❌ ' + err.message, 'error');
    } finally {
        hideLoader();
    }
}
