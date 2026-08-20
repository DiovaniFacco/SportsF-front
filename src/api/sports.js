import apiClient from './client';

export async function getSports() {
  try {
    const response = await apiClient.get('/sports');
    const sportsList = response.data?.sports || response.data || [];
    return Array.isArray(sportsList) ? sportsList : [];
  } catch (error) {
    console.error('Erro ao buscar esportes da API:', error.message);
    throw error;
  }
}
