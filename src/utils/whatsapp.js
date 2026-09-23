import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

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
 * Resolve o número de WhatsApp efetivo do complexo.
 * Prioriza `whatsapp_number`, com fallback para `phone`.
 */
export function getVenueWhatsappNumber(venue) {
  if (!venue) return '';
  return normalizeWhatsappNumber(venue.whatsapp_number || venue.phone || '');
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
 * Ex: "Olá! Gostaria de agendar a quadra [nome] para o dia [data], às [horário]."
 */
export function buildWhatsappMessage({ courtName, date, times }) {
  const dateFormatted = formatDateBR(date);
  const timesText = Array.isArray(times) ? times.join(', ') : String(times || '');
  return `Olá! Gostaria de agendar a quadra ${courtName || ''} para o dia ${dateFormatted}, às ${timesText}.`;
}

/**
 * Monta a URL wa.me com mensagem pré-preenchida.
 * Retorna null se não houver número configurado.
 */
export function buildWhatsappUrl({ venue, courtName, date, times }) {
  const number = getVenueWhatsappNumber(venue);
  if (!number) return null;
  const message = buildWhatsappMessage({ courtName, date, times });
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Abre o WhatsApp com a mensagem de agendamento.
 * NÃO cria nenhuma reserva no sistema.
 * Retorna { success, error } — error = 'no-number' quando o complexo não configurou WhatsApp.
 */
export async function openWhatsappBooking({ venue, courtName, date, times }) {
  const url = buildWhatsappUrl({ venue, courtName, date, times });
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
