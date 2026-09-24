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
