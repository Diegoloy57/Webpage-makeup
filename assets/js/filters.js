'use strict';

/**
 * Aplica todos los filtros activos sobre el array de productos.
 * Puro — no modifica estado, solo devuelve el resultado.
 *
 * @param {object[]} products  - Lista completa de productos
 * @param {object}   filters   - { category, search, brand, price, sort }
 * @returns {object[]} Lista filtrada y ordenada
 */
export function applyFilters(products, filters) {
  const { category, search, brand, price, sort } = filters;
  let result = [...products];

  // — Categoría
  if (category && category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  // — Búsqueda de texto
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q)       ||
      p.brand.toLowerCase().includes(q)      ||
      p.description.toLowerCase().includes(q)
    );
  }

  // — Marca
  if (brand) {
    result = result.filter(p => p.brand === brand);
  }

  // — Precio  (formato: "0-50000" | "200000" para "más de X")
  if (price) {
    const parts = price.split('-').map(Number);
    const [min, max] = parts;
    result = max
      ? result.filter(p => p.price >= min && p.price <= max)
      : result.filter(p => p.price >= min);
  }

  // — Ordenamiento
  const sorters = {
    'price-asc':  (a, b) => a.price  - b.price,
    'price-desc': (a, b) => b.price  - a.price,
    'rating':     (a, b) => b.rating - a.rating,
  };
  if (sorters[sort]) result.sort(sorters[sort]);

  return result;
}

/**
 * Extrae marcas únicas ordenadas del catálogo.
 * @param {object[]} products
 * @returns {string[]}
 */
export function extractBrands(products) {
  return [...new Set(products.map(p => p.brand))].sort();
}