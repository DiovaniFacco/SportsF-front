/**
 * Datas do backend vêm como "YYYY-MM-DD HH:mm:ss" / ISO sem offset, sempre no
 * fuso oficial do sistema (America/Sao_Paulo, igual ao APP_TIMEZONE do backend).
 * Estes helpers evitam comparar com o relógio/fuso LOCAL do dispositivo (B15).
 */

// SP está em UTC-3 o ano todo (sem horário de verão desde 2019).
export const SERVER_UTC_OFFSET_MINUTES = -180;
export const SERVER_TIME_ZONE = 'America/Sao_Paulo';

/**
 * "YYYY-MM-DD HH:mm:ss" (ou ISO) do servidor -> Date, interpretado como horário de SP.
 * Retorna null se inválido.
 */
export function parseServerDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();
  // Já traz offset/Z? Usa direto.
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // Sem offset = horário de SP: completa com -03:00 para o parse ser absoluto.
  const iso = str.includes('T') ? str : str.replace(' ', 'T');
  const d = new Date(`${iso}-03:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Hoje ("YYYY-MM-DD") no fuso de SP, independente do fuso do dispositivo.
 */
export function getTodayStrInSaoPaulo(now = new Date()) {
  try {
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: SERVER_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
  } catch {
    // Intl indisponível: cai no cálculo manual abaixo.
  }
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const sp = new Date(utc + SERVER_UTC_OFFSET_MINUTES * 60000);
  const yyyy = sp.getUTCFullYear();
  const mm = String(sp.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(sp.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * true se dateStr ("YYYY-MM-DD") é anterior a hoje em SP.
 */
export function isPastDateStr(dateStr, todayStr = getTodayStrInSaoPaulo()) {
  if (!dateStr || !todayStr) return false;
  return String(dateStr).slice(0, 10) < String(todayStr).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Desacoplamento exibição x duração (grade de 60min pode vender 1h30, etc).
// A disponibilidade é definida por SOBREPOSIÇÃO de intervalos [start, end),
// nunca por igualdade de horário de início.
// ---------------------------------------------------------------------------

/**
 * "YYYY-MM-DD HH:mm:ss" / ISO -> ms (horário local). NaN se inválido.
 */
export function parseDateTimeMs(value) {
  if (!value) return NaN;
  if (value instanceof Date) return value.getTime();
  const s = String(value).trim().replace('T', ' ');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, Y, Mo, D, H, Mi, S] = m;
    return new Date(Number(Y), Number(Mo) - 1, Number(D), Number(H), Number(Mi), Number(S || '0')).getTime();
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? NaN : t;
}

export function isSameDateStr(dateTimeStr, targetDateStr) {
  if (!dateTimeStr || !targetDateStr) return false;
  return String(dateTimeStr).trim().substring(0, 10) === String(targetDateStr).substring(0, 10);
}

export function extractTimeStr(dateTimeStr) {
  if (!dateTimeStr) return '';
  const str = String(dateTimeStr).trim();
  if (str.includes('T')) return str.split('T')[1]?.substring(0, 5) || '';
  if (str.includes(' ')) return str.split(' ')[1]?.substring(0, 5) || '';
  return str.substring(0, 5);
}

/**
 * true se [aStart, aEnd) intersecta [bStart, bEnd).
 * Encosto exato (aEnd === bStart) NÃO é conflito.
 */
export function intervalsOverlap(aStartMs, aEndMs, bStartMs, bEndMs) {
  if ([aStartMs, aEndMs, bStartMs, bEndMs].some((v) => Number.isNaN(v))) return false;
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

function bookingEndMs(booking) {
  return parseDateTimeMs(booking?.end_time);
}

/**
 * Encontra a primeira reserva ativa que se sobrepõe ao slot.
 * Ignora canceladas. Fallback: igualdade de início quando sem end parseável.
 */
export function findOverlappingBooking(bookings = [], slot, selectedDate = null) {
  if (!slot || !Array.isArray(bookings) || bookings.length === 0) return null;
  const slotStartMs = parseDateTimeMs(slot.start_time);
  const slotEndMs = parseDateTimeMs(slot.end_time);
  const slotStartStr = extractTimeStr(slot.start_time);

  if (Number.isNaN(slotStartMs) || Number.isNaN(slotEndMs)) {
    return (
      bookings.find(
        (b) =>
          b?.status !== 'cancelled' &&
          (!selectedDate || isSameDateStr(b.start_time, selectedDate)) &&
          extractTimeStr(b.start_time) === slotStartStr
      ) || null
    );
  }

  const overlapping = bookings.filter((b) => {
    if (!b || b.status === 'cancelled') return false;
    if (selectedDate && !isSameDateStr(b.start_time, selectedDate)) {
      // Reserva multi-slot pode começar no dia anterior; mantém checagem por intervalo.
      // Só ignora se ambos os extremos estão fora do dia.
      if (!isSameDateStr(b.end_time, selectedDate)) return false;
    }
    const bS = parseDateTimeMs(b.start_time);
    const bE = bookingEndMs(b);
    if (Number.isNaN(bS) || Number.isNaN(bE)) {
      return extractTimeStr(b.start_time) === slotStartStr;
    }
    return intervalsOverlap(slotStartMs, slotEndMs, bS, bE);
  });

  if (overlapping.length === 0) return null;
  overlapping.sort((a, b) => parseDateTimeMs(a.start_time) - parseDateTimeMs(b.start_time));
  return overlapping[0];
}

/**
 * true se o novo intervalo [newStart, newEnd) conflita com alguma reserva/bloqueio.
 * Retorna o primeiro conflitante ou null.
 */
export function findConflictForInterval({ startMs, endMs, bookings = [], blocks = [] }) {
  const all = [
    ...bookings.filter((b) => b?.status !== 'cancelled').map((b) => ({ kind: 'booking', ...b })),
    ...blocks.filter((b) => b && !b.is_indefinite && b.end_time != null).map((b) => ({ kind: 'block', ...b })),
  ];
  for (const item of all) {
    const s = parseDateTimeMs(item.start_time);
    const e = parseDateTimeMs(item.end_time);
    if (intervalsOverlap(startMs, endMs, s, e)) return item;
  }
  return null;
}

/** "HH:MM" -> minutos desde 00:00 (null se inválido). */
export function timeStrToMinutes(t) {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Duração em horas fracionárias entre "HH:MM" inicial/final. */
export function durationHoursBetween(startTime, endTime) {
  const s = timeStrToMinutes(startTime);
  const e = timeStrToMinutes(endTime);
  if (s == null || e == null || e <= s) return null;
  return (e - s) / 60;
}

/** 90 -> "1h30", 60 -> "1h", 45 -> "45min". */
export function formatDurationMinutes(totalMinutes) {
  if (totalMinutes == null || !Number.isFinite(totalMinutes) || totalMinutes <= 0) return '';
  const m = Math.round(totalMinutes);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h > 0 && rest > 0) return `${h}h${String(rest).padStart(2, '0')}`;
  if (h > 0) return `${h}h`;
  return `${rest}min`;
}
