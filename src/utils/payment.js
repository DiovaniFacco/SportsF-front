export const PAYMENT_PAGO = 'pago';
export const PAYMENT_PENDENTE = 'pendente';
export const PAYMENT_NAO_PAGO = 'nao_pago';

export const PAYMENT_LABELS = {
  [PAYMENT_PAGO]: 'PAGO',
  [PAYMENT_PENDENTE]: 'PENDENTE',
  [PAYMENT_NAO_PAGO]: 'NÃO PAGO',
};

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * O SISTEMA define o status a partir do valor pago:
 * - pago: paid >= total (valor exato da quadra)
 * - pendente: 0 < paid < total
 * - nao_pago: paid <= 0
 */
export function resolvePaymentStatus(paidAmount, totalPrice) {
  const paid = Math.round(toNumber(paidAmount) * 100) / 100;
  const total = Math.round(toNumber(totalPrice) * 100) / 100;
  if (paid >= total && total > 0) return PAYMENT_PAGO;
  if (paid > 0) return PAYMENT_PENDENTE;
  return PAYMENT_NAO_PAGO;
}

/**
 * Status efetivo do agendamento: prefere payment_status do backend,
 * com fallback para is_paid/paid_amount (compat com dados antigos).
 */
export function getPaymentStatus(booking = {}) {
  const s = booking?.payment_status;
  if (s === PAYMENT_PAGO || s === PAYMENT_PENDENTE || s === PAYMENT_NAO_PAGO) return s;
  // compat legado
  if (booking?.is_paid) return PAYMENT_PAGO;
  return resolvePaymentStatus(booking?.paid_amount, booking?.total_price);
}

export function getPaidAmount(booking = {}) {
  return Math.round(toNumber(booking?.paid_amount) * 100) / 100;
}

export function getTotalPrice(booking = {}) {
  return Math.round(toNumber(booking?.total_price) * 100) / 100;
}

export function getRemainingAmount(booking = {}) {
  return Math.max(0, Math.round((getTotalPrice(booking) - getPaidAmount(booking)) * 100) / 100);
}

export function formatBRL(value) {
  const n = toNumber(value);
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

/** Aceita "40", "40,50", "R$ 40.50" -> 40.5 */
export function parseBRLInput(text) {
  if (text == null) return 0;
  const cleaned = String(text).replace(/R\$\s?/gi, '').trim().replace(',', '.');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100) / 100;
}
