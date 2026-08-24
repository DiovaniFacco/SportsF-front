import axios from 'axios';
import apiClient from './client';
import { optimizeImageUrl } from '../utils/imageUtils';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const DEFAULT_VENUE_IMAGE = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=90';
const DEFAULT_COURT_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1593786416058-251d7c31d1ef?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=90',
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=90',
];

/**
 * Cadastra um novo complexo esportivo (exclusivo para ADMIN).
 */
export async function createVenue(venueData) {
  try {
    const response = await apiClient.post('/venues', venueData);
    return response.data?.venue || response.data;
  } catch (error) {
    console.error('Erro ao criar complexo:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Atualiza um complexo esportivo existente.
 */
export async function updateVenue(venueId, venueData) {
  try {
    const response = await apiClient.put(`/venues/${venueId}`, venueData);
    return response.data?.venue || response.data;
  } catch (error) {
    console.error(`Erro ao atualizar complexo ${venueId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Remove/exclui um complexo esportivo (exclusivo para ADMIN).
 */
export async function deleteVenue(venueId) {
  try {
    const response = await apiClient.delete(`/venues/${venueId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao excluir complexo ${venueId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Busca a lista de cidades com complexos esportivos cadastrados.
 */
export async function getCities() {
  try {
    const response = await axios.get(`${API_URL}/cities`, { timeout: 5000 });
    return response.data?.cities || [];
  } catch (error) {
    console.error('Erro ao buscar cidades:', error.message);
    return [];
  }
}

/**
 * Busca a lista de comodidades (amenities) cadastradas.
 */
export async function getAmenities() {
  try {
    const response = await apiClient.get('/amenities');
    return response.data?.amenities || response.data || [];
  } catch (error) {
    console.error('Erro ao buscar comodidades:', error.message);
    return [];
  }
}

/**
 * Cadastra uma nova comodidade (amenity).
 */
export async function createAmenity(name) {
  try {
    const response = await apiClient.post('/amenities', { name });
    return response.data?.amenity || response.data;
  } catch (error) {
    console.error('Erro ao criar comodidade:', error.response?.data || error.message);
    const msg = error.response?.data?.message || (error.response?.data?.errors?.name ? error.response.data.errors.name[0] : null) || 'Erro ao cadastrar comodidade.';
    throw new Error(msg);
  }
}

/**
 * Remove uma comodidade (amenity).
 */
export async function deleteAmenity(amenityId) {
  try {
    const response = await apiClient.delete(`/amenities/${amenityId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao excluir comodidade ${amenityId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Busca a lista de complexos esportivos consumindo a API Laravel.
 */
export async function getVenues({ city, sport, search } = {}) {
  try {
    const params = {};
    if (city) params.city = city;
    if (sport && sport !== 'Todos') params.sport = sport;
    if (search) params.search = search;

    const response = await axios.get(`${API_URL}/venues`, {
      timeout: 5000,
      params,
    });

    let rawList = response.data.data || response.data || [];
    if (!Array.isArray(rawList)) {
      rawList = [];
    }

    const venues = rawList.map((venue, idx) => normalizeVenue(venue, idx));
    return filterVenues(venues, { search, sport });
  } catch (error) {
    console.error('Erro ao buscar venues na API:', error.message);
    return [];
  }
}

/**
 * Busca detalhes de um complexo específico e suas quadras.
 */
export async function getVenueDetails(venueId) {
  try {
    const response = await axios.get(`${API_URL}/venues/${venueId}`, { timeout: 5000 });
    const rawVenue = response.data.venue || response.data;
    if (!rawVenue || !rawVenue.id) return null;
    return normalizeVenue(rawVenue, rawVenue.id);
  } catch (error) {
    console.error(`Erro ao buscar detalhes do espaço ${venueId}:`, error.message);
    throw error;
  }
}

export function normalizeVenue(venue, idx = 0) {
  if (!venue) return null;

  // Endereço formatado
  let fullAddress = venue.address || '';
  if (venue.number && !fullAddress.includes(venue.number)) {
    fullAddress += fullAddress ? `, ${venue.number}` : venue.number;
  }
  if (venue.neighborhood && !fullAddress.includes(venue.neighborhood)) {
    fullAddress += fullAddress ? ` - ${venue.neighborhood}` : venue.neighborhood;
  }

  // Comodidades (Amenities)
  let amenitiesList = [];
  if (Array.isArray(venue.amenities)) {
    amenitiesList = venue.amenities.map((a) => (typeof a === 'object' ? a.name : a));
  }

  // Modalidades (Sports)
  let sportsList = [];
  if (Array.isArray(venue.sports)) {
    sportsList = venue.sports.map((s) => (typeof s === 'object' ? s.name : s));
  }

  // Quadras
  let courts = [];
  if (Array.isArray(venue.courts) && venue.courts.length > 0) {
    courts = venue.courts.map((court, cIdx) => {
      let courtSports = [];
      if (Array.isArray(court.sports_list) && court.sports_list.length > 0) {
        courtSports = court.sports_list;
      } else if (Array.isArray(court.sports) && court.sports.length > 0) {
        courtSports = court.sports.map((s) => (typeof s === 'object' ? s.name : s));
      } else if (court.type) {
        courtSports = court.type.split(',').map((s) => capitalize(s.trim()));
      }

      return {
        id: court.id,
        venue_id: venue.id,
        name: court.name || `Quadra ${cIdx + 1}`,
        type: courtSports.join(' • ') || 'Multiuso',
        sports: courtSports,
        surface: court.surface || '',
        capacity: court.capacity || '',
        is_covered: court.is_covered !== undefined ? Boolean(court.is_covered) : true,
        hourly_rate: parseFloat(court.hourly_rate || 0),
        rating: court.rating !== undefined && court.rating !== null ? parseFloat(court.rating) : 0,
        image_url: optimizeImageUrl(court.image_url || DEFAULT_COURT_IMAGES[cIdx % DEFAULT_COURT_IMAGES.length], { width: 1400, quality: 90 }),
      };
    });
  }

  // Se não extraiu sports do complexo, tenta extrair das quadras
  if (sportsList.length === 0 && courts.length > 0) {
    const allSports = new Set();
    courts.forEach((c) => c.sports.forEach((s) => allSports.add(s)));
    sportsList = Array.from(allSports);
  }

  const validRates = courts.map((c) => c.hourly_rate).filter((r) => r > 0);
  const startingPrice = venue.starting_price
    ? parseFloat(venue.starting_price)
    : validRates.length > 0
    ? Math.min(...validRates)
    : 0;

  return {
    ...venue,
    address: fullAddress,
    rating: venue.rating !== undefined && venue.rating !== null ? parseFloat(venue.rating) : 0,
    review_count: venue.review_count !== undefined && venue.review_count !== null ? parseInt(venue.review_count, 10) : 0,
    sports: sportsList,
    amenities: amenitiesList,
    starting_price: startingPrice,
    courts_count: courts.length,
    is_open_today: venue.is_open_today !== undefined ? Boolean(venue.is_open_today) : true,
    image_url: optimizeImageUrl(venue.cover_image_url || venue.image_url || DEFAULT_VENUE_IMAGE, { width: 1600, quality: 90 }),
    courts,
  };
}

function filterVenues(list, { search, sport }) {
  let filtered = [...list];

  if (search && search.trim() !== '') {
    const query = search.toLowerCase().trim();
    filtered = filtered.filter(
      (v) =>
        (v.name && v.name.toLowerCase().includes(query)) ||
        (v.city && v.city.toLowerCase().includes(query)) ||
        (v.address && v.address.toLowerCase().includes(query)) ||
        (v.description && v.description.toLowerCase().includes(query))
    );
  }

  if (sport && sport !== 'Todos') {
    filtered = filtered.filter(
      (v) => v.sports && v.sports.some((s) => s.toLowerCase() === sport.toLowerCase())
    );
  }

  return filtered;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
