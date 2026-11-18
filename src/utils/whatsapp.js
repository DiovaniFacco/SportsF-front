import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { formatBRL } from './payment';

/**
 * Modo Simplificado: agenda visual + agendamento via WhatsApp.
 * Nenhuma reserva é criada no sistema — apenas abre o WhatsApp com mensagem pré-preenchida.
 */

/**
 * Normaliza telefone/WhatsApp para somente dígitos (para wa.me).
 * Ex: "(11) 98888-8888" -> "11988888888", "+55 11 98888-8888" -> "5511988888888"
 */
export function normalizeWhatsappNumber(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D+/g, '');
  return digits;
}

/**
 * Garante o formato internacional exigido pelo wa.me (código do país + número).
 * Números BR em formato local (10-11 dígitos, ex: "(55) 99134-2669" -> "55991342669")
 * ganham o DDI 55. Números que já trazem DDI (12-13 dígitos iniciados em 55)
 * são mantidos. Demais formatos são devolvidos como estão.
 */
export function toInternationalWhatsappNumber(raw) {
  const digits = normalizeWhatsappNumber(raw).replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  // Número BR em formato local tem 10-11 dígitos (nunca é um número
  // internacional completo, que teria 12-13 com o DDI) → prefixa 55.
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Retorna true se o complexo está no modo Simplificado.
 * Aceita tanto `mode === 'simplificado'` (novo) quanto `is_simplified === true` (accessor do backend).
 * Qualquer outro valor é tratado como modo completo (comportamento atual preservado).
 */
export function isSimplifiedVenue(venue) {
  if (!venue) return false;
  if (venue.is_simplified === true) return true;
  const mode = String(venue.mode || '').trim().toLowerCase();
  return mode === 'simplificado';
}

/**
 * Resolve o número de WhatsApp efetivo do complexo em formato internacional.
 * Prioriza `whatsapp_number`, com fallback para `phone`.
 */
export function getVenueWhatsappNumber(venue) {
  if (!venue) return '';
  return toInternationalWhatsappNumber(venue.whatsapp_number || venue.phone || '');
}

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY.
 */
export function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return String(dateStr);
}

/**
 * Monta a mensagem pré-preenchida do WhatsApp.
 *
 * Formato rico (relatório UI/UX): nome do cliente, quadra destacada,
 * horários agrupados por dia e total/sinal quando informados:
 * "Olá! Sou *João*. Quero reservar a *Quadra externa 4* — seg 16/11: 20:30–21:30 e 22:30–23:30. Total R$ 137,00 (sinal R$ 68,50)."
 *
 * Aceita dois formatos:
 * - Multi-dia: `days` = [{ date: 'YYYY-MM-DD', times: ['20:30 - 21:30', ...] }]
 * - Legado (1 dia): `date` + `times` (string ou array)
 */
const WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdayShort(dateStr) {
  const parts = String(dateStr || '').split('-');
  if (parts.length !== 3) return '';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return '';
  return WEEKDAYS_PT[d.getDay()];
}

export function buildWhatsappMessage({ courtName, date, times, days, customerName, totalPrice }) {
  const court = String(courtName || '').trim();
  const name = String(customerName || '').trim();

  // Normaliza os dias: [{ date, times }]
  let daysList = Array.isArray(days) ? days : null;
  if (!daysList && date) {
    const timesText = Array.isArray(times) ? times.filter(Boolean) : times ? [String(times)] : [];
    daysList = timesText.length > 0 ? [{ date, times: timesText }] : [];
  }
  if (!daysList || daysList.length === 0) {
    return `Olá! Gostaria de agendar a quadra ${court}.`;
  }

  // Monta os trechos por dia: "seg 16/11: 20:30–21:30 e 22:30–23:30"
  const dayParts = daysList
    .map((d) => {
      const rawTimes = Array.isArray(d.times) ? d.times.filter(Boolean) : d.times ? [String(d.times)] : [];
      if (rawTimes.length === 0) return null;
      const shortTimes = rawTimes.map((t) => String(t).replace(/\s*-\s*/g, '–'));
      const label = weekdayShort(d.date);
      const dateFormatted = formatDateBR(d.date);
      const timesJoined =
        shortTimes.length > 1
          ? `${shortTimes.slice(0, -1).join(', ')} e ${shortTimes[shortTimes.length - 1]}`
          : shortTimes[0];
      return `${label ? `${label} ` : ''}${dateFormatted}: ${timesJoined}`;
    })
    .filter(Boolean);

  if (dayParts.length === 0) {
    return `Olá! Gostaria de agendar a quadra ${court}.`;
  }

  const courtBold = court ? `*${court}*` : '';
  const greeting = name ? `Olá! Sou *${name}*. Quero reservar a ${courtBold}` : `Olá! Quero reservar a ${courtBold}`;
  let msg = `${greeting} — ${dayParts.join('; ')}.`;

  // Total e sinal (regra do complexo: sinal = 50% do total)
  if (totalPrice != null && Number.isFinite(Number(totalPrice)) && Number(totalPrice) > 0) {
    const total = Math.round(Number(totalPrice) * 100) / 100;
    const deposit = Math.round((total / 2) * 100) / 100;
    msg += ` Total ${formatBRL(total)} (sinal ${formatBRL(deposit)}).`;
  }
  return msg;
}

/**
 * Monta a URL wa.me com mensagem pré-preenchida.
 * Retorna null se não houver número configurado.
 */
export function buildWhatsappUrl({ venue, courtName, date, times, days, customerName, totalPrice }) {
  const number = getVenueWhatsappNumber(venue);
  if (!number) return null;
  const message = buildWhatsappMessage({ courtName, date, times, days, customerName, totalPrice });
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Abre o WhatsApp com a mensagem de agendamento.
 * NÃO cria nenhuma reserva no sistema.
 * Retorna { success, error } — error = 'no-number' quando o complexo não configurou WhatsApp.
 */
export async function openWhatsappBooking({ venue, courtName, date, times, days, customerName, totalPrice }) {
  const url = buildWhatsappUrl({ venue, courtName, date, times, days, customerName, totalPrice });
  if (!url) {
    return { success: false, error: 'no-number' };
  }
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true, method: 'window-open', url };
    }
    const canOpen = await Linking.canOpenURL(url).catch(() => true);
    if (canOpen === false) {
      return { success: false, error: 'cannot-open' };
    }
    await Linking.openURL(url);
    return { success: true, method: 'linking', url };
  } catch (err) {
    console.error('Erro ao abrir WhatsApp:', err);
    return { success: false, error: err };
  }
}
