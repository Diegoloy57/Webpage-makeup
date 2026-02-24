'use strict';

/**
 * Construye el link de WhatsApp con mensaje pre-armado.
 * @param {object} store   - Config de la tienda (whatsapp, currency)
 * @param {object} product - Producto seleccionado
 * @param {object|null} shade - Tono seleccionado (puede ser null)
 * @returns {string} URL completa de wa.me
 */
export function buildWALink(store, product, shade = null) {
  const shadePart = shade ? ` - Tono: ${shade.name}` : '';
  const price     = formatPrice(product.price);
  const msg = `Hola! 👋 Me interesa: *${product.name}* de *${product.brand}*${shadePart} (${price}). ¿Está disponible?`;
  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`;
}

/**
 * Formatea un número como precio colombiano.
 * @param {number} amount
 * @returns {string} Ej: "$38.000"
 */
export function formatPrice(amount) {
  return '$' + amount.toLocaleString('es-CO');
}

/**
 * Calcula el porcentaje de descuento.
 * @param {number} original
 * @param {number} current
 * @returns {number} Porcentaje entero
 */
export function calcDiscount(original, current) {
  return Math.round((1 - current / original) * 100);
}