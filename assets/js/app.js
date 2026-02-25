'use strict';

import { applyFilters, extractBrands }              from './filters.js';
import { renderCategories, renderBrandSelect,
         renderProducts, renderSkeletons,
         updateResultsCount }                        from './catalog.js';
import { buildWALink }                              from './whatsapp.js';

/* ── Estado global de la app ─────────────────────────────── */
const state = {
  store:          {},
  categories:     [],
  products:       [],
  filtered:       [],
  activeCategory: 'all',
  search:         '',
  brand:          '',
  price:          '',
  sort:           '',
  activeProduct:  null,
  selectedShade:  null,
  wishlist: new Set(JSON.parse(localStorage.getItem('lm_wishlist') || '[]')),
};

/* ── Referencias DOM ─────────────────────────────────────── */
const DOM = {
  categoryFilters: document.getElementById('categoryFilters'),
  searchInput:     document.getElementById('searchInput'),
  brandFilter:     document.getElementById('brandFilter'),
  priceFilter:     document.getElementById('priceFilter'),
  sortFilter:      document.getElementById('sortFilter'),
  resultsCount:    document.getElementById('resultsCount'),
  productsGrid:    document.getElementById('productsGrid'),
  modalOverlay:    document.getElementById('modalOverlay'),
  modal:           document.getElementById('modal'),
  modalImg:        document.getElementById('modalImg'),
  modalBrand:      document.getElementById('modalBrand'),
  modalName:       document.getElementById('modalName'),
  modalDesc:       document.getElementById('modalDesc'),
  modalShades:     document.getElementById('modalShades'),
  modalShadesSection: document.getElementById('modalShadesSection'),
  modalPrice:      document.getElementById('modalPrice'),
  modalPriceOriginal: document.getElementById('modalPriceOriginal'),
  modalWaBtn:      document.getElementById('modalWaBtn'),
  modalCloseBtn:   document.getElementById('modalCloseBtn'),
  header:          document.getElementById('header'),
  toast:           document.getElementById('toast'),
};

/* ── Helpers ─────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  setTimeout(() => DOM.toast.classList.remove('show'), 2800);
}

/* ── Render + filtros ────────────────────────────────────── */
function refresh() {
  state.filtered = applyFilters(state.products, {
    category: state.activeCategory,
    search:   state.search,
    brand:    state.brand,
    price:    state.price,
    sort:     state.sort,
  });

  renderCategories(
    DOM.categoryFilters,
    state.categories,
    state.activeCategory,
    (id) => { state.activeCategory = id; refresh(); }
  );

  renderProducts(
    DOM.productsGrid,
    state.filtered,
    state.wishlist,
    state.store,
    {
      onCardClick: openModal,
      onWish:      toggleWishlist,
      onWACard:    (product) =>
        window.open(buildWALink(state.store, product), '_blank', 'noopener,noreferrer'),
    }
  );

  updateResultsCount(DOM.resultsCount, state.filtered.length);
}

/* ── Wishlist ────────────────────────────────────────────── */
function toggleWishlist(id) {
  if (state.wishlist.has(id)) {
    state.wishlist.delete(id);
    showToast('Eliminado de favoritos');
  } else {
    state.wishlist.add(id);
    showToast('❤️ Agregado a favoritos');
  }
  localStorage.setItem('lm_wishlist', JSON.stringify([...state.wishlist]));
  refresh();
}

/* ── Modal ───────────────────────────────────────────────── */
function openModal(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  state.activeProduct = product;
  state.selectedShade = product.shades[0] ?? null;

  DOM.modalImg.src          = product.image;
  DOM.modalImg.alt          = product.name;
  DOM.modalBrand.textContent = product.brand;
  DOM.modalName.textContent  = product.name;
  DOM.modalDesc.textContent  = product.description;

  const fmt = (n) => '$' + n.toLocaleString('es-CO');
  DOM.modalPrice.textContent         = fmt(product.price);
  DOM.modalPriceOriginal.textContent = product.originalPrice ? fmt(product.originalPrice) : '';

  // Tonos
  if (product.shades.length > 0) {
    DOM.modalShadesSection.style.display = 'block';
    DOM.modalShades.innerHTML = product.shades.map((s, i) => `
      <button class="shade-btn${i === 0 ? ' selected' : ''}" data-shade="${i}" aria-pressed="${i === 0}">
        <span class="shade-btn__dot" style="background:${s.hex}" aria-hidden="true"></span>
        ${s.name}
      </button>
    `).join('');

    DOM.modalShades.querySelectorAll('.shade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.modalShades.querySelectorAll('.shade-btn').forEach(b => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        state.selectedShade = product.shades[Number(btn.dataset.shade)];
      });
    });
  } else {
    DOM.modalShadesSection.style.display = 'none';
  }

  // Botón WA
  DOM.modalWaBtn.onclick = () =>
    window.open(
      buildWALink(state.store, product, state.selectedShade),
      '_blank', 'noopener,noreferrer'
    );

  DOM.modalOverlay.removeAttribute('hidden');
  requestAnimationFrame(() => DOM.modalOverlay.classList.add('open'));
  document.body.style.overflow = 'hidden';
  DOM.modalCloseBtn.focus();
}

function closeModal() {
  DOM.modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => DOM.modalOverlay.setAttribute('hidden', ''), 350);
  state.activeProduct = null;
}

/* ── Intersection Observer (fade-up) ────────────────────── */
function initFadeUp() {
  const io = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}

/* ── Eventos globales ────────────────────────────────────── */
function initEvents() {
  DOM.searchInput.addEventListener('input', debounce(e => {
    state.search = e.target.value.trim();
    refresh();
  }, 300));

  DOM.brandFilter.addEventListener('change', e => { state.brand = e.target.value; refresh(); });
  DOM.priceFilter.addEventListener('change', e => { state.price = e.target.value; refresh(); });
  DOM.sortFilter.addEventListener('change',  e => { state.sort  = e.target.value; refresh(); });

  DOM.modalCloseBtn.addEventListener('click', closeModal);
  DOM.modalOverlay.addEventListener('click', e => {
    if (e.target === DOM.modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.activeProduct) closeModal();
  });

  window.addEventListener('scroll', () => {
    DOM.header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ── Bootstrap: carga el JSON y arranca ─────────────────── */
async function init() {
  renderSkeletons(DOM.productsGrid, 6);
  try {
    const res  = await fetch('./data/products.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.store      = data.store;
    state.categories = data.categories;
    state.products   = data.products;

    renderBrandSelect(DOM.brandFilter, extractBrands(state.products));
    refresh();
    initFadeUp();
    initEvents();

  } catch (err) {
    console.error('Error cargando productos:', err);
    DOM.productsGrid.innerHTML = `
      <div class="empty-state visible">
        <p class="empty-state__emoji">⚠️</p>
        <p class="empty-state__title">Error al cargar el catálogo</p>
        <p class="empty-state__desc">Recarga la página o revisa tu conexión.</p>
      </div>`;
  }
}

init();