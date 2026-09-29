import api from './client';

/**
 * Horários fixos semanais (recorrência virtual).
 * Ex: toda segunda 19:00-20:00 do "Time do João".
 */

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_FULL = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export function weekdayLabel(dow, full = false) {
  const n = Number(dow);
  if (Number.isNaN(n) || n < 0 || n > 6) return '';
  return full ? WEEKDAYS_FULL[n] : WEEKDAYS_SHORT[n];
}

export function formatTime(hhmmss) {
  if (!hhmmss) return '';
  return String(hhmmss).substring(0, 5);
}

export function formatDateBR(iso) {
  if (!iso) return '';
  const clean = String(iso).substring(0, 10);
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return clean;
  return `${d}/${m}/${y}`;
}

/**
 * Lista séries fixas (gestor). Filtra por quadra quando courtId informado.
 */
export async function getFixedSchedules({ courtId = null, includeInactive = true } = {}) {
  const endpoint = courtId && courtId !== 'ALL'
    ? `/courts/${courtId}/fixed-schedules`
    : '/fixed-schedules';
  const response = await api.get(endpoint, {
    params: includeInactive ? { include_inactive: 1 } : {},
  });
  const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
  return Array.isArray(list) ? list : [];
}

export async function getFixedSchedule(fixedId) {
  const response = await api.get(`/fixed-schedules/${fixedId}`);
  return response.data?.data || null;
}

export async function createFixedSchedule({
  courtId,
  dayOfWeek,
  startTime,
  endTime,
  customerName,
  customerPhone = null,
  validFrom,
  validUntil = null,
  notes = null,
}) {
  const payload = {
    day_of_week: Number(dayOfWeek),
    start_time: startTime,
    end_time: endTime,
    customer_name: customerName,
    valid_from: validFrom,
  };
  if (customerPhone) payload.customer_phone = customerPhone;
  if (validUntil) payload.valid_until = validUntil;
  if (notes) payload.notes = notes;
  const response = await api.post(`/courts/${courtId}/fixed-schedules`, payload);
  return response.data?.data || response.data;
}

export async function updateFixedSchedule(fixedId, fields) {
  const response = await api.put(`/fixed-schedules/${fixedId}`, fields);
  return response.data?.data || response.data;
}

export async function deleteFixedSchedule(fixedId) {
  const response = await api.delete(`/fixed-schedules/${fixedId}`);
  return response.data;
}

/**
 * Desmarca UMA ocorrência (a série continua nos demais dias).
 * @param {string} date 'YYYY-MM-DD'
 */
export async function skipFixedScheduleDate(fixedId, date, reason = null) {
  const payload = { date };
  if (reason) payload.reason = reason;
  const response = await api.post(`/fixed-schedules/${fixedId}/exceptions`, payload);
  return response.data?.data || response.data;
}

/** Reativa uma data desmarcada. */
export async function unskipFixedScheduleDate(fixedId, exceptionId) {
  const response = await api.delete(`/fixed-schedules/${fixedId}/exceptions/${exceptionId}`);
  return response.data;
}

/** Expande próximas ocorrências da série (para conferência). */
export async function getFixedScheduleOccurrences(fixedId, { from = null, to = null } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await api.get(`/fixed-schedules/${fixedId}/occurrences`, { params });
  return response.data?.data || [];
}

/**
 * Lança o dia como agendamento normal (com pagamento), sem remover a série.
 * Cria um booking manual vinculado ao fixo.
 */
export async function launchFixedScheduleDay(fixedId, {
  courtId,
  date,
  startTime,
  endTime,
  customerName,
  customerPhone = null,
  paidAmount = 0,
  notes = null,
}) {
  const { createBooking } = await import('./bookings');
  const res = await createBooking({
    courtId,
    startTime: `${date} ${startTime.length === 5 ? startTime + ':00' : startTime}`,
    endTime: `${date} ${endTime.length === 5 ? endTime + ':00' : endTime}`,
    notes: notes || `Dia lançado do horário fixo`,
    isManual: true,
    customerName,
    customerPhone,
    paidAmount,
    fixedScheduleId: fixedId,
  });
  return res.booking || res;
}

/**
 * Próxima ocorrência válida da série a partir de hoje
 * (respeitando dia da semana e início da vigência).
 * Usada para pré-preencher o "desmarcar dia" e evitar o erro de
 * dia da semana (ex: série de quarta com o campo em hoje=terça).
 */
export function nextOccurrence(fixed, todayStr = null) {
  if (!fixed) return null;
  const dow = Number(fixed.day_of_week);
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayIso = todayStr
    || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  let base = String(fixed.valid_from || todayIso).substring(0, 10);
  if (base < todayIso) base = todayIso;
  const [y, m, d] = base.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  for (let i = 0; i < 8; i++) {
    if (cursor.getDay() === dow) break;
    cursor.setDate(cursor.getDate() + 1);
  }
  if (fixed.valid_until && formatDateOnly(cursor) > String(fixed.valid_until).substring(0, 10)) {
    return null;
  }
  return formatDateOnly(cursor);
}

function formatDateOnly(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Dia da semana (0=dom..6=sáb) de uma data YYYY-MM-DD no fuso local. */
export function weekdayOfDate(iso) {
  const parts = String(iso || '').substring(0, 10).split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Number.isNaN(d.getTime()) ? null : d.getDay();
}

export function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return fallback;
}
