const SHEETS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSGlKxi2EdSM1-xerAQj8SG46kZFh5tWNClWOxS7XfH1Q2m24wuW8AVSlcU2U1mz1VNK99UL0ziGX9K/pub?output=csv';
const CACHE_KEY  = 'temuin_sheet_v1';

const CATEGORIES = [
  { id: 'bakery',    label: 'Bakery',    icon: '🎂', color: '#D97706', bg: '#FFFBEB' },
  { id: 'florist',   label: 'Florist',   icon: '🌸', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'laundry',   label: 'Laundry',   icon: '👕', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'guru-les',  label: 'Guru Les',  icon: '📚', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'katering',  label: 'Katering',  icon: '🍽️', color: '#EF4444', bg: '#FEF2F2' },
];

const AREAS = [
  { id: 'Jakarta Utara',   label: 'Jakarta Utara',   icon: '🏖️', color: '#0EA5E9', bg: '#F0F9FF' },
  { id: 'Jakarta Selatan', label: 'Jakarta Selatan', icon: '🌳', color: '#16A34A', bg: '#F0FDF4' },
  { id: 'Jakarta Barat',   label: 'Jakarta Barat',   icon: '🏙️', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'Jakarta Timur',   label: 'Jakarta Timur',   icon: '🌅', color: '#EA580C', bg: '#FFF7ED' },
  { id: 'Tangerang',       label: 'Tangerang',       icon: '🏘️', color: '#0D9488', bg: '#F0FDFA' },
];

// ─── Category fallback images (Pexels static CDN — no API key needed) ────────

const PEXELS = 'https://images.pexels.com/photos';
const Q      = '?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';

const CATEGORY_IMAGES = {
  'bakery':   `${PEXELS}/1291712/pexels-photo-1291712.jpeg${Q}`,  // layered cake
  'florist':  `${PEXELS}/931177/pexels-photo-931177.jpeg${Q}`,    // flower bouquet
  'laundry':  `${PEXELS}/5591575/pexels-photo-5591575.jpeg${Q}`,  // washing machine
  'guru-les': `${PEXELS}/256395/pexels-photo-256395.jpeg${Q}`,    // books / library
  'katering': `${PEXELS}/1640777/pexels-photo-1640777.jpeg${Q}`,  // food spread
};
const DEFAULT_IMAGE = `${PEXELS}/1005638/pexels-photo-1005638.jpeg${Q}`;

function getCategoryImage(catId) {
  return CATEGORY_IMAGES[catId] || DEFAULT_IMAGE;
}

// ─── Category / area helpers ──────────────────────────────────────────────────

function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || {
    id,
    label: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    icon: '🏪',
    color: '#6B7280',
    bg: '#F3F4F6',
  };
}

function getAreaById(id) {
  return AREAS.find(a => a.id === id) || null;
}

// ─── CSV parser (handles quoted fields containing commas) ─────────────────────

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"')            { inQuotes = false; }
      else                            { field += ch; }
    } else {
      if      (ch === '"')  { inQuotes = true; }
      else if (ch === ',')  { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && next === '\n') i++;
        row.push(field); field = '';
        if (row.some(f => f.trim())) rows.push(row);
        row = [];
      } else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); if (row.some(f => f.trim())) rows.push(row); }
  return rows;
}

// ─── Map one CSV row → business object ───────────────────────────────────────

function rowToBusiness(headers, values, id) {
  const col = name => {
    const idx = headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
    return idx >= 0 ? (values[idx] || '').trim() : '';
  };

  const phone  = col('phone').replace(/\D/g, '');
  const wa     = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  const catId  = col('category').toLowerCase().replace(/\s+/g, '-');
  const featRaw = col('featured').toLowerCase();

  return {
    id,
    name:        col('name'),
    category:    catId,
    description: col('description'),
    address:     col('address'),
    city:        col('city'),
    whatsapp:    wa,
    instagram:   col('instagram').replace(/^@/, ''),
    photo:       col('image') || col('photo') || null,
    featured:    featRaw === 'yes' || featRaw === 'true',
  };
}

// ─── Fetch sheet, parse, cache; fall back to cache when offline ───────────────

async function fetchBusinesses() {
  try {
    const res = await fetch(SHEETS_CSV, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = parseCSV(await res.text());
    if (rows.length < 2) throw new Error('empty sheet');

    const headers = rows[0];
    let businesses = rows.slice(1).map((r, i) => rowToBusiness(headers, r, i + 1));

    // No Featured column? Auto-feature the first entry per category
    const hasFeaturedCol = headers.some(h => h.toLowerCase().trim() === 'featured');
    if (!hasFeaturedCol) {
      const seen = new Set();
      businesses = businesses.map(b => {
        if (!seen.has(b.category)) { seen.add(b.category); return { ...b, featured: true }; }
        return b;
      });
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(businesses));
    return businesses;

  } catch (err) {
    console.warn('Temuin: sheet fetch failed, using cache.', err.message);
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

// ─── Runtime data accessors ───────────────────────────────────────────────────

function getAllBusinesses() {
  const sheet     = JSON.parse(localStorage.getItem(CACHE_KEY)          || '[]');
  const submitted = JSON.parse(localStorage.getItem('temuin_businesses') || '[]');
  return [...sheet, ...submitted];
}

function saveBusinesses(businesses) {
  localStorage.setItem('temuin_businesses', JSON.stringify(businesses));
}
