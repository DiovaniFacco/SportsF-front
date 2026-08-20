import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const DEFAULT_VENUE_IMAGE = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';
const DEFAULT_COURT_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1593786416058-251d7c31d1ef?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
];

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
        image_url: court.image_url || DEFAULT_COURT_IMAGES[cIdx % DEFAULT_COURT_IMAGES.length],
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
    is_open_today: true,
    image_url: venue.cover_image_url || venue.image_url || DEFAULT_VENUE_IMAGE,
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
