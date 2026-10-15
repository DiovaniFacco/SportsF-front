import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import secureStorage from './secureStorage';
import { trackAccessEvent } from '../api/analytics';

/**
 * Serviço de telemetria de acesso.
 *
 * Conceitos:
 * - visitor_id: identificador ANÔNIMO do dispositivo, persistido entre sessões.
 *   Permite contar "visitantes únicos" sem identificar a pessoa.
 * - session_id: novo a cada abertura do app (agrupa as telas de uma sessão).
 * - O backend usa o token Bearer para decidir se o acesso é logado ou anônimo.
 *
 * Toda a telemetria é best-effort: nunca lança erro para a UI.
 */

const VISITOR_KEY = '@analytics_visitor_id';

let visitorId = null;
let sessionId = null;
let initPromise = null;

function randomId() {
  try {
    if (typeof Crypto?.randomUUID === 'function') return Crypto.randomUUID();
  } catch {
    // segue para o fallback
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getPlatform() {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function getReferrer() {
  try {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      return document.referrer || null;
    }
  } catch {
    // ignora
  }
  return null;
}

/**
 * Inicializa os identificadores (idempotente). Retorna a promise em andamento
 * para que vários chamadores aguardem a mesma inicialização.
 */
export function initAnalytics() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    sessionId = randomId();
    try {
      visitorId = await secureStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId = randomId();
        await secureStorage.setItem(VISITOR_KEY, visitorId);
      }
    } catch {
      visitorId = visitorId || randomId();
    }
    return { visitorId, sessionId };
  })();

  return initPromise;
}

export function getVisitorId() {
  return visitorId;
}

export function getSessionId() {
  return sessionId;
}

async function send(payload) {
  try {
    await initAnalytics();
    await trackAccessEvent({
      visitor_id: visitorId,
      session_id: sessionId,
      platform: getPlatform(),
      referrer: getReferrer(),
      ...payload,
    });
  } catch {
    // telemetria nunca deve quebrar o app
  }
}

/**
 * Registra a abertura do app (uma vez por sessão).
 */
export function trackAppOpen() {
  return send({ event_type: 'app_open', screen: 'app' });
}

// Dedupe de disparos idênticos muito próximos (re-renders / StrictMode).
let lastKey = null;
let lastAt = 0;

/**
 * Registra a visualização de uma tela.
 * @param {string} screen Identificador estável da tela (ex: 'complexo', 'quadra-slots').
 * @param {{ venueId?: number|null }} [options]
 */
export function trackScreen(screen, { venueId = null } = {}) {
  if (!screen) return Promise.resolve();

  const key = `${screen}:${venueId ?? ''}`;
  const now = Date.now();
  // Evita contar a mesma tela duas vezes em menos de 1,5s (ex: re-render).
  if (key === lastKey && now - lastAt < 1500) return Promise.resolve();

  lastKey = key;
  lastAt = now;

  return send({ event_type: 'page_view', screen, venue_id: venueId ?? null });
}
