// ─── State ───────────────────────────────────────────────────────────────────
const STATE = {
  view: 'home',
  category: null,
  area: null,
  query: '',
};

// ─── Router ──────────────────────────────────────────────────────────────────
function navigate(view, category = null, query = '', area = null) {
  STATE.view = view;
  STATE.category = category;
  STATE.area = area;
  STATE.query = query;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeModal();
}

// ─── Render dispatcher ───────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  switch (STATE.view) {
    case 'home':   app.innerHTML = renderHome();   break;
    case 'browse': app.innerHTML = renderBrowse(); break;
    case 'search': app.innerHTML = renderSearch(); break;
    case 'submit': app.innerHTML = renderSubmit(); break;
    default:       app.innerHTML = renderHome();
  }
  bindEvents();
}

// ─── Home view ───────────────────────────────────────────────────────────────
function renderHome() {
  const featured = getAllBusinesses().filter(b => b.featured);

  return `
    <section class="hero">
      <div class="hero-inner">
        <img src="temuin_logo.png" alt="Temuin" class="hero-logo" />
        <h1 class="hero-title">Temuin bisnis lokal<br/>terbaik di Jakarta</h1>
        <p class="hero-sub">Dari laundry, florist, hingga katering — semua ada di sini. Dukung UMKM Jakarta!</p>
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            id="heroSearch"
            class="search-input"
            placeholder="Cari laundry, florist, katering…"
            onkeydown="handleSearchKey(event)"
          />
          <button class="btn-search" onclick="doSearch()">Cari</button>
        </div>
      </div>
    </section>

    <section class="categories-section">
      <div class="section-inner">
        <h2 class="section-title">Jelajahi Kategori</h2>
        <div class="category-grid">
          ${CATEGORIES.map(cat => `
            <button class="category-card" onclick="navigate('browse', '${cat.id}')"
              style="--cat-color: ${cat.color}; --cat-bg: ${cat.bg}">
              <span class="cat-icon">${cat.icon}</span>
              <span class="cat-label">${cat.label}</span>
              <span class="cat-count">${getAllBusinesses().filter(b => b.category === cat.id).length} bisnis</span>
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="areas-section">
      <div class="section-inner">
        <h2 class="section-title">Jelajahi Area</h2>
        <div class="area-grid">
          ${AREAS.map(area => `
            <button class="area-card" onclick="navigate('browse', null, '', '${area.id}')"
              style="--area-color: ${area.color}; --area-bg: ${area.bg}">
              <span class="area-icon">${area.icon}</span>
              <div class="area-info">
                <span class="area-label">${area.label}</span>
                <span class="area-count">${getAllBusinesses().filter(b => b.city === area.id).length} bisnis</span>
              </div>
              <span class="area-arrow">→</span>
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="featured-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">Bisnis Unggulan</h2>
          <button class="btn-text" onclick="navigate('browse', null)">Lihat semua →</button>
        </div>
        <div class="business-grid">
          ${featured.map(b => renderBusinessCard(b)).join('')}
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-inner">
        <div class="cta-icon">🏪</div>
        <h2>Punya bisnis di Jakarta?</h2>
        <p>Daftarkan bisnis kamu secara gratis dan jangkau lebih banyak pelanggan di sekitarmu.</p>
        <button class="btn-primary btn-lg" onclick="navigate('submit')">Daftarkan Bisnis Sekarang</button>
      </div>
    </section>
  `;
}

// ─── Browse view ──────────────────────────────────────────────────────────────
function renderBrowse() {
  const all = getAllBusinesses();
  const businesses = all.filter(b =>
    (!STATE.category || b.category === STATE.category) &&
    (!STATE.area     || b.city     === STATE.area)
  );

  const cat  = STATE.category ? getCategoryById(STATE.category) : null;
  const area = STATE.area     ? getAreaById(STATE.area)         : null;

  let titleIcon = '';
  let titleText = 'Semua Bisnis';
  if (cat && area) {
    titleIcon = `<span class="browse-cat-icon" style="background:${cat.bg}; color:${cat.color}">${cat.icon}</span>`;
    titleText = `${cat.label} di ${area.label}`;
  } else if (cat) {
    titleIcon = `<span class="browse-cat-icon" style="background:${cat.bg}; color:${cat.color}">${cat.icon}</span>`;
    titleText = cat.label;
  } else if (area) {
    titleIcon = `<span class="browse-cat-icon" style="background:${area.bg}; color:${area.color}">${area.icon}</span>`;
    titleText = `Bisnis di ${area.label}`;
  }

  return `
    <section class="browse-section">
      <div class="section-inner">
        <div class="browse-header">
          <button class="btn-back" onclick="navigate('home')">← Kembali</button>
          <div class="browse-title-wrap">
            ${titleIcon}
            <h1 class="browse-title">${titleText}</h1>
          </div>
          <p class="browse-count">${businesses.length} bisnis ditemukan</p>
        </div>

        <div class="filter-group">
          <p class="filter-label">Kategori</p>
          <div class="filter-chips">
            <button class="chip ${!STATE.category ? 'active' : ''}"
              onclick="navigate('browse', null, '', STATE.area)">Semua</button>
            ${CATEGORIES.map(c => `
              <button class="chip ${STATE.category === c.id ? 'active' : ''}"
                onclick="navigate('browse', '${c.id}', '', STATE.area)"
                style="${STATE.category === c.id ? `--chip-color:${c.color}` : ''}">
                ${c.icon} ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="filter-group">
          <p class="filter-label">Area</p>
          <div class="filter-chips">
            <button class="chip ${!STATE.area ? 'active' : ''}"
              onclick="navigate('browse', STATE.category, '', null)">Semua Area</button>
            ${AREAS.map(a => `
              <button class="chip ${STATE.area === a.id ? 'active' : ''}"
                onclick="navigate('browse', STATE.category, '', '${a.id}')"
                style="${STATE.area === a.id ? `--chip-color:${a.color}` : ''}">
                ${a.icon} ${a.label}
              </button>
            `).join('')}
          </div>
        </div>

        ${businesses.length === 0
          ? `<div class="empty-state"><div class="empty-icon">🔍</div><p>Tidak ada bisnis yang cocok.</p><button class="btn-primary" onclick="navigate('submit')">Daftarkan yang pertama!</button></div>`
          : `<div class="business-grid">${businesses.map(b => renderBusinessCard(b)).join('')}</div>`
        }
      </div>
    </section>
  `;
}

// ─── Search view ─────────────────────────────────────────────────────────────
function renderSearch() {
  const q = STATE.query.toLowerCase();
  const results = getAllBusinesses().filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q) ||
    b.address.toLowerCase().includes(q) ||
    (b.city || '').toLowerCase().includes(q) ||
    (getCategoryById(b.category)?.label || '').toLowerCase().includes(q)
  );

  return `
    <section class="browse-section">
      <div class="section-inner">
        <div class="browse-header">
          <button class="btn-back" onclick="navigate('home')">← Kembali</button>
          <h1 class="browse-title">Hasil pencarian untuk "<em>${escHtml(STATE.query)}</em>"</h1>
          <p class="browse-count">${results.length} bisnis ditemukan</p>
        </div>

        <div class="search-wrap search-wrap--inline">
          <span class="search-icon">🔍</span>
          <input type="text" id="inlineSearch" class="search-input" value="${escHtml(STATE.query)}"
            placeholder="Cari bisnis…" onkeydown="handleSearchKey(event)" />
          <button class="btn-search" onclick="doSearchInline()">Cari</button>
        </div>

        ${results.length === 0
          ? `<div class="empty-state"><div class="empty-icon">😔</div><p>Tidak ada bisnis yang cocok dengan pencarian kamu.</p><button class="btn-text" onclick="navigate('home')">Kembali ke beranda</button></div>`
          : `<div class="business-grid">${results.map(b => renderBusinessCard(b)).join('')}</div>`
        }
      </div>
    </section>
  `;
}

// ─── Submit view ──────────────────────────────────────────────────────────────
function renderSubmit() {
  return `
    <section class="submit-section">
      <div class="submit-inner">
        <button class="btn-back" onclick="navigate('home')">← Kembali</button>
        <div class="submit-header">
          <div class="submit-icon">🏪</div>
          <h1>Daftarkan Bisnis Kamu</h1>
          <p>Gratis, mudah, dan langsung tampil di direktori Temuin.</p>
        </div>
        <form class="submit-form" onsubmit="handleSubmit(event)">
          <div class="form-group">
            <label>Nama Bisnis *</label>
            <input type="text" name="name" required placeholder="cth: Laundry Bersih Kilat" maxlength="80" />
          </div>

          <div class="form-group">
            <label>Kategori *</label>
            <select name="category" required>
              <option value="" disabled selected>Pilih kategori</option>
              ${CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Deskripsi Bisnis *</label>
            <textarea name="description" required placeholder="Ceritakan tentang bisnis kamu, layanan yang ditawarkan, keunggulan, dll." rows="4" maxlength="300"></textarea>
            <span class="char-hint">Maks. 300 karakter</span>
          </div>

          <div class="form-group">
            <label>Alamat Lengkap *</label>
            <input type="text" name="address" required placeholder="cth: Jl. Kemang Raya No. 12, Jakarta Selatan" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Nomor WhatsApp *</label>
              <input type="tel" name="whatsapp" required placeholder="cth: 081234567890" />
              <span class="char-hint">Tanpa spasi atau tanda +</span>
            </div>
            <div class="form-group">
              <label>Username Instagram</label>
              <div class="input-prefix-wrap">
                <span class="input-prefix">@</span>
                <input type="text" name="instagram" placeholder="usernamemu" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>URL Foto Bisnis</label>
            <input type="url" name="photo" placeholder="https://…" />
            <span class="char-hint">Link langsung ke gambar (opsional)</span>
          </div>

          <button type="submit" class="btn-primary btn-lg btn-full">✓ Daftarkan Bisnis</button>
        </form>
      </div>
    </section>
  `;
}

// ─── Business card ────────────────────────────────────────────────────────────
function renderBusinessCard(b) {
  const cat      = getCategoryById(b.category);
  const imgSrc   = b.photo || getCategoryImage(b.category, b.id);
  const fallback = getCategoryImage(b.category, b.id + 99);

  return `
    <article class="business-card" onclick="openBusinessModal(${b.id})">
      <div class="card-photo-wrap">
        <img src="${escHtml(imgSrc)}" alt="${escHtml(b.name)}" class="card-photo" loading="lazy"
          onerror="this.onerror=null;this.src='${escHtml(fallback)}'"
        />
        ${b.featured ? '<span class="card-badge">⭐ Unggulan</span>' : ''}
        <span class="card-cat-pill" style="background:${cat?.bg}; color:${cat?.color}">${cat?.icon} ${cat?.label}</span>
      </div>
      <div class="card-body">
        <h3 class="card-name">${escHtml(b.name)}</h3>
        <p class="card-desc">${escHtml(b.description)}</p>
        <p class="card-addr">📍 ${escHtml(b.address)}${b.city ? ` <span class="card-city-pill">${escHtml(b.city)}</span>` : ''}</p>
        <p class="card-distance">📡 ~${mockKm(b.id)} km dari kamu</p>
        <div class="card-actions" onclick="event.stopPropagation()">
          <a href="https://wa.me/${sanitizeWA(b.whatsapp)}" target="_blank" rel="noopener" class="btn-wa">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
            WhatsApp
          </a>
          ${b.instagram ? `<a href="https://instagram.com/${escHtml(b.instagram)}" target="_blank" rel="noopener" class="btn-ig">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            Instagram
          </a>` : ''}
        </div>
      </div>
    </article>
  `;
}

// ─── Business detail modal ────────────────────────────────────────────────────
function openBusinessModal(id) {
  const b = getAllBusinesses().find(b => b.id === id);
  if (!b) return;
  const cat      = getCategoryById(b.category);
  const imgSrc   = b.photo || getCategoryImage(b.category, b.id);
  const fallback = getCategoryImage(b.category, b.id + 99);
  const photoHtml = `<img src="${escHtml(imgSrc)}" alt="${escHtml(b.name)}" class="modal-photo"
    onerror="this.onerror=null;this.src='${escHtml(fallback)}'">`;

  document.getElementById('modalContent').innerHTML = `
    ${photoHtml}
    <div class="modal-body">
      <span class="modal-cat-pill" style="background:${cat?.bg}; color:${cat?.color}">${cat?.icon} ${cat?.label}</span>
      ${b.featured ? '<span class="card-badge modal-badge">⭐ Unggulan</span>' : ''}
      <h2 class="modal-name">${escHtml(b.name)}</h2>
      <p class="modal-desc">${escHtml(b.description)}</p>

      <div class="modal-info-grid">
        <div class="modal-info-item">
          <span class="info-label">📍 Alamat</span>
          <span class="info-value">${escHtml(b.address)}${b.city ? `, ${escHtml(b.city)}` : ''}</span>
        </div>
        <div class="modal-info-item">
          <span class="info-label">📡 Jarak</span>
          <span class="info-value">~${mockKm(b.id)} km dari kamu <span class="coming-soon-tag">Segera hadir</span></span>
        </div>
        ${b.whatsapp ? `<div class="modal-info-item">
          <span class="info-label">📱 WhatsApp</span>
          <span class="info-value">${formatWA(b.whatsapp)}</span>
        </div>` : ''}
        ${b.instagram ? `<div class="modal-info-item">
          <span class="info-label">📸 Instagram</span>
          <span class="info-value">@${escHtml(b.instagram)}</span>
        </div>` : ''}
      </div>

      <div class="modal-actions">
        <a href="https://wa.me/${sanitizeWA(b.whatsapp)}" target="_blank" rel="noopener" class="btn-wa btn-lg">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
          Hubungi via WhatsApp
        </a>
        ${b.instagram ? `<a href="https://instagram.com/${escHtml(b.instagram)}" target="_blank" rel="noopener" class="btn-ig">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          Lihat Instagram
        </a>` : ''}
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Search ───────────────────────────────────────────────────────────────────
function doSearch() {
  const q = document.getElementById('heroSearch')?.value.trim();
  if (!q) return;
  navigate('search', null, q);
}

function doSearchInline() {
  const q = document.getElementById('inlineSearch')?.value.trim();
  if (!q) return;
  navigate('search', null, q);
}

function handleSearchKey(e) {
  if (e.key === 'Enter') {
    if (e.target.id === 'heroSearch') doSearch();
    else doSearchInline();
  }
}

// ─── Submit form ──────────────────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  if (!data.name || !data.category || !data.description || !data.address || !data.whatsapp) {
    showToast('Harap lengkapi semua kolom yang wajib diisi.', 'error');
    return;
  }

  const wa = data.whatsapp.replace(/\D/g, '');
  if (wa.length < 8 || wa.length > 15) {
    showToast('Nomor WhatsApp tidak valid.', 'error');
    return;
  }

  const stored = JSON.parse(localStorage.getItem('temuin_businesses') || '[]');
  const newBusiness = {
    id: Date.now(),
    name: data.name.trim(),
    category: data.category,
    description: data.description.trim(),
    address: data.address.trim(),
    whatsapp: wa.startsWith('0') ? '62' + wa.slice(1) : wa,
    instagram: data.instagram?.trim().replace(/^@/, '') || '',
    photo: data.photo?.trim() || null,
    featured: false,
  };

  stored.push(newBusiness);
  saveBusinesses(stored);
  showToast('Bisnis kamu berhasil didaftarkan! 🎉', 'success');
  setTimeout(() => navigate('browse', data.category), 1500);
}

// ─── Event bindings ───────────────────────────────────────────────────────────
function bindEvents() {
  // Navbar scroll shadow
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 10);
  window.removeEventListener('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Fade in card images once loaded
  document.querySelectorAll('.card-photo').forEach(img => {
    if (img.complete) { img.classList.add('loaded'); }
    else { img.addEventListener('load', () => img.classList.add('loaded'), { once: true }); }
  });
}

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mockKm(id) {
  return (((id * 7 + 3) % 20 + 1) * 0.5).toFixed(1);
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeWA(num) {
  if (!num) return '';
  const clean = String(num).replace(/\D/g, '');
  return clean.startsWith('0') ? '62' + clean.slice(1) : clean;
}

function formatWA(num) {
  const clean = sanitizeWA(num);
  return '+' + clean;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── Loading state ────────────────────────────────────────────────────────────
function renderLoading() {
  return `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Memuat bisnis…</p>
    </div>
  `;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('app').innerHTML = renderLoading();
  await fetchBusinesses();
  render();
});
