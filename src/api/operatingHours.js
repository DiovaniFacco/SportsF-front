import apiClient from './client';

/**
 * Busca os horários de funcionamento de uma quadra por dia da semana.
 */
export async function getCourtOperatingHours(courtId) {
  try {
    const response = await apiClient.get(`/courts/${courtId}/operating-hours`);
    return response.data?.data?.operating_hours || response.data?.operating_hours || [];
  } catch (error) {
    console.warn(`Erro ao buscar horários de funcionamento da quadra ${courtId}:`, error.message);
    throw error;
  }
}

/**
 * Cadastra ou atualiza o horário de funcionamento de um dia específico da semana para uma quadra.
 * @param {number|string} courtId
 * @param {Object} data { id?: number, day_of_week: 0-6, start_time: "08:00", end_time: "22:00", slot_duration_minutes: 60 }
 */
export async function saveCourtOperatingHour(courtId, data) {
  try {
    const response = await apiClient.post(`/courts/${courtId}/operating-hours`, data);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao salvar horário de funcionamento da quadra ${courtId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Remove um turno de funcionamento de uma quadra pelo seu ID.
 * @param {number|string} operatingHourId
 */
export async function deleteCourtOperatingHour(operatingHourId) {
  try {
    const response = await apiClient.delete(`/operating-hours/${operatingHourId}`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao remover turno ${operatingHourId}:`, error.response?.data || error.message);
    throw error;
  }
}
