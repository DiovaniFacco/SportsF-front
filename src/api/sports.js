import apiClient from './client';

export async function getSports() {
  try {
    const response = await apiClient.get('/sports');
    const sportsList = response.data?.sports || response.data || [];
    return sportsList;
  } catch (error) {
    console.warn('Erro ao buscar esportes da API, usando fallback:', error.message);
    return [
      { id: 1, name: 'Futebol', slug: 'futebol', icon: 'FootballIcon' },
      { id: 2, name: 'Futsal', slug: 'futsal', icon: 'FutsalIcon' },
      { id: 3, name: 'Vôlei', slug: 'volei', icon: 'VolleyballIcon' },
      { id: 4, name: 'Basquete', slug: 'basquete', icon: 'BasketballIcon' },
      { id: 5, name: 'Beach Tennis', slug: 'beach-tennis', icon: 'BeachTennisIcon' },
      { id: 6, name: 'Tênis', slug: 'tenis', icon: 'TennisIcon' },
      { id: 7, name: 'Padel', slug: 'padel', icon: 'PadelIcon' },
    ];
  }
}
