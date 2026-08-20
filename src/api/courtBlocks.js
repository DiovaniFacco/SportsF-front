import api from './client';

/**
 * Cria um novo bloqueio de horário para uma quadra.
 */
export async function createCourtBlock({ courtId, startTime, endTime, reason }) {
  try {
    const response = await api.post(`/courts/${courtId}/blockouts`, {
      start_time: startTime,
      end_time: endTime,
      reason: reason || 'Manutenção de quadra',
    });
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
