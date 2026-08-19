import apiClient from './client';

/**
 * Busca as quadras de um determinado complexo/venue.
 */
export async function getCourtsByVenue(venueId) {
  try {
    const response = await apiClient.get(`/venues/${venueId}/courts`);
    return response.data?.courts || response.data || [];
  } catch (error) {
    console.warn(`Erro ao buscar quadras do espaço ${venueId}:`, error.message);
    throw error;
  }
}

/**
 * Cadastra uma nova quadra em um espaço esportivo.
 */
export async function createCourt(venueId, courtData) {
  try {
    const response = await apiClient.post(`/venues/${venueId}/courts`, courtData);
    return response.data?.court || response.data;
  } catch (error) {
    console.warn('Erro ao criar quadra:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Atualiza uma quadra existente.
 */
export async function updateCourt(courtId, courtData) {
  try {
    const response = await apiClient.put(`/courts/${courtId}`, courtData);
    return response.data?.court || response.data;
  } catch (error) {
    console.warn(`Erro ao atualizar quadra ${courtId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Deleta/remove uma quadra.
 */
export async function deleteCourt(courtId) {
  try {
    const response = await apiClient.delete(`/courts/${courtId}`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao excluir quadra ${courtId}:`, error.response?.data || error.message);
    throw error;
  }
}
