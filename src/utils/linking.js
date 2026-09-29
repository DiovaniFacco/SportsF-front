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
 * Ex: /complexo/arena-central, ?complex=arena-central-esportes, ?c=arena-central-esportes, /complex/arena-central-esportes, #complex-arena-central-esportes, sfacco://complex/arena-central-esportes
 * O formato canônico do modo Simplificado é: /complexo/nome-do-complexo
 */
export function getVenueIdFromUrl(urlStr) {
  if (!urlStr) return null;
  try {
    let cleanUrlStr = urlStr;
    if (!cleanUrlStr.includes('://') && !cleanUrlStr.startsWith('http')) {
      cleanUrlStr = `http://localhost${cleanUrlStr.startsWith('/') ? '' : '/'}${cleanUrlStr}`;
    }

    const url = new URL(cleanUrlStr);

    // 1. Busca em query params prioritários (mantidos por compatibilidade)
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

    // 2. Busca na estrutura de caminhos
    // Suporta PT-BR canônico (/complexo/slug, /complexos/slug) e EN legado (/complex/slug, /venue/slug)
    const pathParts = url.pathname.split('/').filter(Boolean);
    const venueIndex = pathParts.findIndex(
      (part) => {
        const p = part.toLowerCase();
        return p === 'complex' || p === 'complexo' || p === 'complexos' || p === 'venue' || p === 'venues';
      }
    );
    if (venueIndex !== -1 && pathParts[venueIndex + 1]) {
      return decodeURIComponent(pathParts[venueIndex + 1]);
    }

    // 3. Busca na âncora/hash (#complex-nome-da-quadra ou #venue-nome-da-quadra)
    if (url.hash) {
      const hashContent = url.hash.replace(/^#/, '');
      const match = hashContent.match(/(?:complexo?s?|venue?s?)[/-]?([a-zA-Z0-9_-]+)/i);
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
 * Formato canônico (modo Simplificado): /complexo/nome-do-complexo
 */
export function buildVenueUrl(venue) {
  const slug = getVenueSlug(venue);
  if (!slug) return '';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/complexo/${slug}`;
  }
  return Linking.createURL(`complexo/${slug}`);
}

/**
 * Lê o slug padrão do complexo via env (white-label por domínio).
 * Ex: EXPO_PUBLIC_VENUE_SLUG=recanto
 * Aceita slug ("recanto") ou ID ("1") — o backend resolve os dois em GET /venues/{id|slug}.
 */
export function getDefaultVenueSlugFromEnv() {
  try {
    const raw =
      typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_VENUE_SLUG : null;
    let slug = String(raw || '').trim();
    // Tolerância a erro comum no Railway: colar "EXPO_PUBLIC_VENUE_SLUG=slug" no campo valor.
    slug = slug.replace(/^(EXPO_PUBLIC_VENUE_SLUG\s*=\s*)/i, '').trim();
    slug = slug.replace(/^["']|["']$/g, '').trim();
    return slug || null;
  } catch {
    return null;
  }
}

/**
 * Extrai o slug do tenant a partir do subdomínio.
 * Ex: recanto.sfacco.com.br -> "recanto"
 * Ignora www, api, admin e domínios fora do tenant (localhost, railway.app, etc).
 * O sufixo pode ser sobrescrito via EXPO_PUBLIC_TENANT_DOMAIN (ex: "sfacco.com.br").
 */
export function getSubdomainSlug(hostnameParam = null) {
  try {
    let hostname = hostnameParam;
    if (!hostname) {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
      hostname = window.location.hostname;
    }
    hostname = String(hostname || '').toLowerCase().trim();
    if (!hostname) return null;

    let suffix = 'sfacco.com.br';
    try {
      const envSuffix =
        typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_TENANT_DOMAIN : null;
      if (envSuffix && String(envSuffix).trim()) {
        suffix = String(envSuffix).trim().toLowerCase().replace(/^\./, '');
      }
    } catch {
      // mantém sufixo padrão
    }

    if (!hostname.endsWith(suffix)) return null;
    const sub = hostname.slice(0, hostname.length - suffix.length).replace(/\.$/, '');
    if (!sub || sub.includes('.')) return null;
    const ignored = new Set(['www', 'api', 'admin', 'app', 'gestao', 'painel']);
    if (ignored.has(sub)) return null;
    return sub;
  } catch {
    return null;
  }
}

/**
 * Resolve o identificador do complexo padrão do domínio atual.
 * Prioridade: subdomínio (recanto.sfacco.com.br) > EXPO_PUBLIC_VENUE_SLUG.
 * Retorna slug ou ID, ou null quando é o domínio genérico.
 */
export function getDefaultVenueSlug() {
  return getSubdomainSlug() || getDefaultVenueSlugFromEnv();
}

/**
 * Lista de candidatos a complexo padrão, na ordem de tentativa.
 * Ex em recanto.sfacco.com.br com EXPO_PUBLIC_VENUE_SLUG=recanto-beach-sports-e-lazer:
 * ["recanto", "recanto-beach-sports-e-lazer"].
 * Serve para quando o subdomínio curto não é igual ao slug real do complexo.
 */
export function getDefaultVenueCandidates() {
  const out = [];
  const sub = getSubdomainSlug();
  if (sub) out.push(sub);
  const env = getDefaultVenueSlugFromEnv();
  if (env && !out.includes(env)) out.push(env);
  return out;
}

/**
 * Retorna true quando a URL é a rota de gestão (/gestao ou /gestao/...).
 */
export function isGestaoRoute(urlStr) {
  if (!urlStr) return false;
  try {
    let cleanUrlStr = urlStr;
    if (!cleanUrlStr.includes('://') && !cleanUrlStr.startsWith('http')) {
      cleanUrlStr = `http://localhost${cleanUrlStr.startsWith('/') ? '' : '/'}${cleanUrlStr}`;
    }
    const path = new URL(cleanUrlStr).pathname.toLowerCase();
    return path === '/gestao' || path.startsWith('/gestao/');
  } catch {
    return false;
  }
}

/**
 * Atualiza a barra de endereço do navegador no ambiente Web mantendo URLs amigáveis sem recarregar a página.
 * Usa o formato canônico /complexo/slug. Mantém leitura dos formatos legados via query param.
 * Não sobrescreve a rota /gestao (a gestão tem URL própria).
 */
export function syncVenueUrlInBrowser(venue, opts = {}) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
    try {
      // Em /gestao a URL é própria — não clobber, salvo saída explícita (force:true).
      if (!opts.force && isGestaoRoute(window.location.href)) return;

      const slug = getVenueSlug(venue);

      if (slug) {
        const currentUrl = new URL(window.location.href);
        const targetPath = `/complexo/${slug}`;
        // Limpa query params legados ao usar o formato canônico
        currentUrl.searchParams.delete('complex');
        currentUrl.searchParams.delete('c');
        currentUrl.searchParams.delete('venue');
        currentUrl.searchParams.delete('venueId');
        currentUrl.searchParams.delete('complexId');
        currentUrl.searchParams.delete('venueSlug');
        currentUrl.searchParams.delete('complexSlug');
        window.history.pushState({}, '', `${targetPath}${currentUrl.search}${currentUrl.hash}`);
      } else {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('complex');
        currentUrl.searchParams.delete('c');
        currentUrl.searchParams.delete('venue');
        currentUrl.searchParams.delete('venueId');
        currentUrl.searchParams.delete('complexId');
        // Volta para a raiz somente se estávamos em uma rota de complexo
        if (/^\/(complexo|complexos|complex|venue|venues)(\/|$)/i.test(currentUrl.pathname)) {
          window.history.pushState({}, '', `/${currentUrl.search}${currentUrl.hash}`);
        } else {
          window.history.pushState({}, '', currentUrl.toString());
        }
      }
    } catch (e) {
      console.warn('Não foi possível sincronizar URL no navegador:', e);
    }
  }
}

/**
 * Leva o navegador para /gestao sem recarregar (usado ao abrir a gestão).
 */
export function syncGestaoUrlInBrowser() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
    try {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.pathname.toLowerCase() !== '/gestao') {
        window.history.pushState({}, '', `/gestao${currentUrl.search}${currentUrl.hash}`);
      }
    } catch (e) {
      console.warn('Não foi possível sincronizar URL de gestão:', e);
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
  const message = `Confira o complexo "${title}" no SportsF: ${link}`;

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
