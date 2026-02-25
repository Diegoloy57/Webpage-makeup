'use strict';

import { formatPrice, calcDiscount, buildWALink } from './whatsapp.js';

/**
 * Renderiza las pills de categoría.
 * @param {HTMLElement} container
 * @param {object[]}    categories
 * @param {string}      activeId
 * @param {Function}    onSelect  - callback(categoryId)
 */
export function renderSkeletons(grid, count = 6) {
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="product-card skeleton-card" aria-hidden="true">
      <div class="product-card__img-wrap skeleton"></div>
      <div class="product-card__body" style="gap:12px">
        <div class="skeleton" style="height:12px;width:60%;border-radius:99px"></div>
        <div class="skeleton" style="height:16px;width:85%;border-radius:99px"></div>
        <div class="skeleton" style="height:14px;width:40%;border-radius:99px"></div>
        <div class="skeleton" style="height:40px;border-radius:12px;margin-top:auto"></div>
      </div>
    </div>
  `).join('');
}
export function renderCategories(container, categories, activeId, onSelect) {
  container.innerHTML = categories.map(cat => `
    <button
      class="cat-pill${cat.id === activeId ? ' active' : ''}"
      data-cat="${cat.id}"
      role="listitem"
      aria-pressed="${cat.id === activeId}"
    >
      <span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>
      ${cat.label}
    </button>
  `).join('');

  container.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => onSelect(btn.dataset.cat));
  });
}

/**
 * Renderiza el select de marcas.
 * @param {HTMLSelectElement} selectEl
 * @param {string[]}          brands
 */
export function renderBrandSelect(selectEl, brands) {
  selectEl.innerHTML =
    '<option value="">Todas las marcas</option>' +
    brands.map(b => `<option value="${b}">${b}</option>`).join('');
}

/**
 * Renderiza la grilla de productos.
 * @param {HTMLElement} grid
 * @param {object[]}    products      - Lista ya filtrada
 * @param {Set}         wishlist      - IDs en favoritos
 * @param {object}      store         - Config tienda
 * @param {object}      callbacks     - { onCardClick, onWish, onWACard }
 */

export function renderProducts(grid, products, wishlist, store, callbacks) {
  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state visible" role="status">
        <p class="empty-state__emoji">🔍</p>
        <p class="empty-state__title">Sin resultados</p>
        <p class="empty-state__desc">Intenta con otras palabras o categorías.</p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => `
    <article
      class="product-card${!p.stock ? ' out-of-stock' : ''}"
      role="listitem"
      data-id="${p.id}"
      style="animation-delay:${i * 0.06}s"
      tabindex="0"
      aria-label="${p.name} — ${formatPrice(p.price)}${!p.stock ? ' — Agotado' : ''}"
    >
      <div class="product-card__img-wrap">
        <img
          class="product-card__img"
          src="${p.image}"
          alt="${p.name}"
          loading="lazy"
          width="600" height="600"
        />

        ${!p.stock ? `
          <div class="product-card__out-of-stock" aria-hidden="true">Agotado</div>
        ` : ''}

        ${p.badge && p.stock ? `
          <span class="product-card__badge badge--${p.badge}" aria-label="${p.badgeLabel}">
            ${p.badgeLabel}
          </span>` : ''}

        <button
          class="product-card__wish${wishlist.has(p.id) ? ' active' : ''}"
          data-id="${p.id}"
          aria-label="${wishlist.has(p.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24"
               fill="${wishlist.has(p.id) ? '#E05C5C' : 'none'}"
               stroke="${wishlist.has(p.id) ? '#E05C5C' : '#8B6F6F'}"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>

        ${p.shades.length > 0 ? `
          <div class="product-card__shades" aria-label="Tonos disponibles">
            ${p.shades.slice(0, 4).map(s =>
              `<span class="shade-dot" style="background:${s.hex}" title="${s.name}"></span>`
            ).join('')}
            ${p.shades.length > 4
              ? `<span class="shade-dot shade-dot--more">+${p.shades.length - 4}</span>`
              : ''}
          </div>` : ''}
      </div>

      <div class="product-card__body">
        <div class="product-card__meta">
          <span class="product-card__brand">${p.brand}</span>
          <span class="product-card__rating" aria-label="Calificación ${p.rating}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            ${p.rating}
          </span>
        </div>

        <h3 class="product-card__name">${p.name}</h3>

        <div class="product-card__price-row">
          <span class="product-card__price">${formatPrice(p.price)}</span>
          ${p.originalPrice ? `
            <span class="product-card__price-original">${formatPrice(p.originalPrice)}</span>
            <span class="product-card__discount-pct">${calcDiscount(p.originalPrice, p.price)}% OFF</span>
          ` : ''}
        </div>

        <button
          class="btn-wa-card"
          data-id="${p.id}"
          aria-label="Pedir ${p.name} por WhatsApp"
          ${!p.stock ? 'disabled' : ''}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          ${p.stock ? 'Pedir por WhatsApp' : 'No disponible'}
        </button>
      </div>
    </article>
  `).join('');
  // — Eventos
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.product-card__wish') || e.target.closest('.btn-wa-card')) return;
      callbacks.onCardClick(card.dataset.id);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callbacks.onCardClick(card.dataset.id);
      }
    });
  });

  grid.querySelectorAll('.product-card__wish').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      callbacks.onWish(btn.dataset.id);
    });
  });

  grid.querySelectorAll('.btn-wa-card').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const product = products.find(p => p.id === btn.dataset.id);
      callbacks.onWACard(product);
    });
  });
}

/**
 * Actualiza el texto del contador de resultados.
 * @param {HTMLElement} el
 * @param {number}      count
 */
export function updateResultsCount(el, count) {
  el.textContent = count === 0 ? '' : `${count} producto${count !== 1 ? 's' : ''}`;
}