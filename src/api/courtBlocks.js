import api from './client';

// Mock storage para bloqueios em memória durante os testes
export let mockCourtBlocks = [
  {
    id: 1,
    court_id: 1,
    date: new Date().toISOString().split('T')[0],
    start_time: `${new Date().toISOString().split('T')[0]} 12:00:00`,
    end_time: `${new Date().toISOString().split('T')[0]} 14:00:00`,
    reason: 'Manutenção do Piso',
    created_at: new Date().toISOString(),
  },
];

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
    const blockout = response.data?.data || response.data?.blockout || response.data;
    if (blockout && blockout.id) {
      mockCourtBlocks = mockCourtBlocks.filter((b) => b.id !== blockout.id);
      mockCourtBlocks.push(blockout);
    }
    return response.data;
  } catch (error) {
    console.warn('API /courts/{id}/blockouts offline. Utilizando fallback mock data:', error.message);
    const newBlock = {
      id: Date.now(),
      court_id: courtId,
      date: startTime.split(' ')[0],
      start_time: startTime,
      end_time: endTime,
      reason: reason || 'Manutenção de quadra',
      created_at: new Date().toISOString(),
    };
    mockCourtBlocks.push(newBlock);
    return { success: true, data: newBlock };
  }
}

/**
 * Remove/cancela um bloqueio existente.
 */
export async function deleteCourtBlock(blockId) {
  try {
    const response = await api.delete(`/blockouts/${blockId}`);
    mockCourtBlocks = mockCourtBlocks.filter((b) => b.id !== blockId);
    return response.data;
  } catch (error) {
    console.warn(`API /blockouts/${blockId} delete offline. Utilizando fallback mock:`, error.message);
    mockCourtBlocks = mockCourtBlocks.filter((b) => b.id !== blockId);
    return { success: true };
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
    const dataList = response.data?.data || (Array.isArray(response.data) ? response.data : response.data?.blockouts);
    if (Array.isArray(dataList)) {
      return { success: true, data: dataList };
    }
    return response.data;
  } catch (error) {
    console.warn('API /blockouts list offline. Utilizando fallback mock data:', error.message);
    let filtered = [...mockCourtBlocks];
    if (params.date) {
      filtered = filtered.filter((b) => b.start_time && b.start_time.startsWith(params.date));
    }
    if (params.courtId && params.courtId !== 'ALL') {
      filtered = filtered.filter((b) => String(b.court_id) === String(params.courtId));
    }
    return { success: true, data: filtered };
  }
}
