import apiClient from './client';

/**
 * Registra um evento de acesso (page view / abertura do app).
 *
 * Best-effort: se falhar (offline, throttle, 401), não deve quebrar a UI.
 * O token Bearer é anexado automaticamente pelo apiClient quando existe —
 * é assim que o backend distingue visitante anônimo de usuário logado.
 */
export async function trackAccessEvent(payload) {
  try {
    const response = await apiClient.post('/analytics/track', payload, { timeout: 8000 });
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics] Falha ao registrar acesso:', error?.response?.status || error?.message);
    }
    return null;
  }
}

/**
 * Busca a visão geral de métricas de acesso.
 * @param {{ period?: 'today'|'week'|'month'|'30d' }} params
 */
export async function getAnalyticsOverview(params = {}) {
  try {
    const response = await apiClient.get('/analytics/overview', { params });
    return response.data;
  } catch (error) {
    console.error('[analytics] Erro ao buscar métricas de acesso:', error?.response?.data || error?.message);
    throw error;
  }
}

/**
 * Busca as métricas de acesso de um complexo específico (dono ou admin).
 */
export async function getVenueAnalytics(venueId, params = {}) {
  try {
    const response = await apiClient.get(`/venues/${venueId}/analytics`, { params });
    return response.data;
  } catch (error) {
    console.error(`[analytics] Erro ao buscar métricas do complexo ${venueId}:`, error?.response?.data || error?.message);
    throw error;
  }
}
