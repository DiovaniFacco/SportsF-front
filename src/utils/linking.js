import { Platform, Share } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * Converte qualquer texto (nome do complexo/quadra) em um slug seguro e legível para URL.
 * Exemplo: "Arena Central Esportes" -> "arena-central-esportes"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extrai o identificador único (slug do complexo ou ID de fallback) de qualquer formato de URL suportado.
 * Ex: ?complex=arena-central-esportes, ?c=arena-central-esportes, /complex/arena-central-esportes, #complex-arena-central-esportes, sfacco://complex/arena-central-esportes
 */
export function getVenueIdFromUrl(urlStr) {
  if (!urlStr) return null;
  try {
    let cleanUrlStr = urlStr;
    if (!cleanUrlStr.includes('://') && !cleanUrlStr.startsWith('http')) {
      cleanUrlStr = `http://localhost${cleanUrlStr.startsWith('/') ? '' : '/'}${cleanUrlStr}`;
    }

    const url = new URL(cleanUrlStr);

    // 1. Busca em query params prioritários
    const params = url.searchParams;
    const venueIdentifier =
      params.get('complex') ||
      params.get('c') ||
      params.get('venue') ||
      params.get('complexSlug') ||
      params.get('venueSlug') ||
      params.get('venueId') ||
      params.get('complexId');

    if (venueIdentifier) return venueIdentifier;

    // 2. Busca na estrutura de caminhos (/complex/nome-da-quadra ou /venue/nome-da-quadra)
    const pathParts = url.pathname.split('/').filter(Boolean);
    const venueIndex = pathParts.findIndex(
      (part) => part.toLowerCase() === 'complex' || part.toLowerCase() === 'venue'
    );
    if (venueIndex !== -1 && pathParts[venueIndex + 1]) {
      return pathParts[venueIndex + 1];
    }

    // 3. Busca na âncora/hash (#complex-nome-da-quadra ou #venue-nome-da-quadra)
    if (url.hash) {
      const hashContent = url.hash.replace(/^#/, '');
      const match = hashContent.match(/(?:complex|venue)[/-]?([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (err) {
    console.error('Erro ao decodificar URL do complexo:', err);
  }
  return null;
}

/**
 * Obtém a chave slug única do complexo.
 */
export function getVenueSlug(venue) {
  if (!venue) return '';
  if (typeof venue === 'string') return venue;
  if (venue.slug) return venue.slug;
  if (venue.name) return slugify(venue.name);
  return String(venue.id || '');
}

/**
 * Gera a URL segura e amigável para o link direto do complexo.
 */
export function buildVenueUrl(venue) {
  const slug = getVenueSlug(venue);
  if (!slug) return '';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?complex=${slug}`;
  }
  return Linking.createURL(`complex/${slug}`);
}

/**
 * Atualiza a barra de endereço do navegador no ambiente Web mantendo URLs amigáveis sem recarregar a página.
 */
export function syncVenueUrlInBrowser(venue) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
    try {
      const currentUrl = new URL(window.location.href);
      const slug = getVenueSlug(venue);

      if (slug) {
        currentUrl.searchParams.set('complex', slug);
        // Limpa parâmetros antigos inseguros
        currentUrl.searchParams.delete('venueId');
        currentUrl.searchParams.delete('complexId');
        currentUrl.searchParams.delete('venue');
      } else {
        currentUrl.searchParams.delete('complex');
        currentUrl.searchParams.delete('c');
        currentUrl.searchParams.delete('venue');
        currentUrl.searchParams.delete('venueId');
        currentUrl.searchParams.delete('complexId');
      }
      window.history.pushState({}, '', currentUrl.toString());
    } catch (e) {
      console.warn('Não foi possível sincronizar URL no navegador:', e);
    }
  }
}

/**
 * Copia ou compartilha o link direto seguro do complexo esportivo.
 */
export async function shareVenueLink(venue) {
  if (!venue) return { success: false };
  const link = buildVenueUrl(venue);
  const title = typeof venue === 'object' ? venue.name : 'Complexo Esportivo';
  const message = `Confira o complexo "${title}" no SFACCO: ${link}`;

  // Tenta copiar para área de transferência na Web
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(link);
      return { success: true, method: 'copied', link };
    } catch (err) {
      console.warn('Falha na API clipboard, tentando Share:', err);
    }
  }

  // Fallback para API de Compartilhamento Nativo / Web Share API
  try {
    await Share.share({
      title,
      message,
      url: link,
    });
    return { success: true, method: 'shared', link };
  } catch (err) {
    console.error('Erro ao compartilhar link do complexo:', err);
    return { success: false, error: err };
  }
}
