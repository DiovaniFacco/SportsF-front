import api from './client';

/**
 * Cria um novo bloqueio de horário para uma quadra.
 * @param {Object} params
 * @param {number|string} params.courtId
 * @param {string} params.startTime - 'YYYY-MM-DD HH:mm:ss'
 * @param {string|null} [params.endTime] - 'YYYY-MM-DD HH:mm:ss' ou null p/ indeterminado
 * @param {string} [params.reason]
 * @param {boolean} [params.isIndefinite] - true = bloqueio por tempo indeterminado (sem fim)
 */
export async function createCourtBlock({ courtId, startTime, endTime, reason, isIndefinite = false }) {
  try {
    const payload = {
      start_time: startTime,
      reason: reason || 'Manutenção de quadra',
      is_indefinite: Boolean(isIndefinite),
    };
    // Bloqueio indeterminado: end_time vai como null (backend trata como sem previsão de término).
    // Bloqueio normal: end_time obrigatório.
    if (isIndefinite) {
      payload.end_time = null;
    } else {
      payload.end_time = endTime;
    }
    const response = await api.post(`/courts/${courtId}/blockouts`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar bloqueio na API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Remove/cancela um bloqueio existente.
 */
export async function deleteCourtBlock(blockId) {
  try {
    const response = await api.delete(`/blockouts/${blockId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao excluir bloqueio ${blockId} na API:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Busca bloqueios ativos para uma data/quadra.
 */
export async function getCourtBlocks(params = {}) {
  try {
    const endpoint = params.courtId && params.courtId !== 'ALL'
      ? `/courts/${params.courtId}/blockouts`
      : '/blockouts';
    const response = await api.get(endpoint, { params });
    const dataList = response.data?.data || (Array.isArray(response.data) ? response.data : response.data?.blockouts) || [];
    return { success: true, data: Array.isArray(dataList) ? dataList : [] };
  } catch (error) {
    console.error('Erro ao buscar bloqueios na API:', error.message);
    throw error;
  }
}
