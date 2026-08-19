import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Dados mock de alta qualidade para resiliência
export const MOCK_VENUES = [
  {
    id: 1,
    name: 'Arena Central Esportes',
    description: 'Complexo esportivo completo com 4 quadras de futebol society, futsal e beach tennis, vestiários climatizados e lanchonete gourmet com área de convivência.',
    address: 'Av. Paulista, 1500 - Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 98888-8888',
    rating: 5.0,
    review_count: 2,
    sports: ['Futebol', 'Beach Tennis', 'Vôlei', 'Futsal'],
    amenities: ['Vestiário Climatizado', 'Estacionamento com Valet', 'Iluminação LED Pro', 'Lanchonete Gourmet', 'Quadra Coberta'],
    starting_price: 130.0,
    courts_count: 4,
    is_open_today: true,
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    courts: [
      {
        id: 101,
        venue_id: 1,
        name: 'Quadra Society 1 — Grama FIFA 50mm',
        type: 'Futebol',
        sports: ['Futebol'],
        surface: 'Grama Sintética Pro',
        capacity: '12 a 14 Jogadores (6x6)',
        is_covered: true,
        hourly_rate: 150.0,
        rating: 4.9,
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 102,
        venue_id: 1,
        name: 'Quadra Society 2 — Coberta VIP',
        type: 'Futebol',
        sports: ['Futebol'],
        surface: 'Grama Sintética Monofilamento',
        capacity: '10 a 12 Jogadores (5x5)',
        is_covered: true,
        hourly_rate: 160.0,
        rating: 4.8,
        image_url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 103,
        venue_id: 1,
        name: 'Arena Areia 1 — Beach Tennis & Vôlei',
        type: 'Beach Tennis • Vôlei',
        sports: ['Beach Tennis', 'Vôlei'],
        surface: 'Areia Quartzosa Filtrada',
        capacity: '2 a 6 Jogadores',
        is_covered: false,
        hourly_rate: 130.0,
        rating: 5.0,
        image_url: 'https://images.unsplash.com/photo-1593786416058-251d7c31d1ef?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 104,
        venue_id: 1,
        name: 'Quadra Futsal Pro — Piso de Madeira',
        type: 'Futsal',
        sports: ['Futsal'],
        surface: 'Piso Flutuante Oficial',
        capacity: '10 Jogadores (5x5)',
        is_covered: true,
        hourly_rate: 140.0,
        rating: 4.7,
        image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 2,
    name: 'Metropolitan Racket Club',
    description: 'Centro de alta performance especializado em esportes de raquete: Padel e Tênis, com treinadores certificados.',
    address: 'Rua das Palmeiras, 450 - Jardins',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 97777-6666',
    rating: 4.5,
    review_count: 2,
    sports: ['Tênis', 'Padel'],
    amenities: ['Vestiário Climatizado', 'Estacionamento com Valet', 'Loja Pro Shop', 'Bar Sunset'],
    starting_price: 180.0,
    courts_count: 2,
    is_open_today: true,
    image_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    courts: [
      {
        id: 201,
        venue_id: 2,
        name: 'Quadra 1 — Tênis & Padel Pro',
        type: 'Tênis • Padel',
        sports: ['Tênis', 'Padel'],
        surface: 'Saibro Vermelho / Vidro Panorama',
        capacity: '2 a 4 Jogadores',
        is_covered: true,
        hourly_rate: 180.0,
        rating: 4.9,
        image_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 202,
        venue_id: 2,
        name: 'Quadra de Padel 2 — Vidro Panorama 10mm',
        type: 'Padel',
        sports: ['Padel'],
        surface: 'Grama Sintética Azul Pro',
        capacity: '4 Jogadores',
        is_covered: true,
        hourly_rate: 200.0,
        rating: 4.9,
        image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
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
      timeout: 3000,
      params,
    });

    let venues = response.data.data || response.data;
    if (Array.isArray(venues) && venues.length > 0) {
      venues = venues.map((venue, idx) => normalizeVenue(venue, idx));
    } else {
      venues = filterVenues(MOCK_VENUES, { search, sport });
    }

    return filterVenues(venues, { search, sport });
  } catch (error) {
    console.warn('API indisponível, utilizando dados mockados de resiliência:', error.message);
    return filterVenues(MOCK_VENUES, { search, sport });
  }
}

/**
 * Busca detalhes de um complexo específico e suas quadras.
 */
export async function getVenueDetails(venueId) {
  try {
    const response = await axios.get(`${API_URL}/venues/${venueId}`, { timeout: 3000 });
    const rawVenue = response.data.venue || response.data;
    return normalizeVenue(rawVenue, rawVenue.id || 1);
  } catch (error) {
    console.warn(`Erro ao buscar detalhes da venue ${venueId}, utilizando fallback:`, error.message);
    const mock = MOCK_VENUES.find((v) => String(v.id) === String(venueId));
    return mock || normalizeVenue({ id: venueId, name: 'Complexo Esportivo' }, 1);
  }
}

function normalizeVenue(venue, idx = 0) {
  const defaultMock = MOCK_VENUES[idx % MOCK_VENUES.length] || MOCK_VENUES[0];

  // Tratar Endereço Completo (logradouro, número e bairro)
  let fullAddress = venue.address || defaultMock.address;
  if (venue.number && !fullAddress.includes(venue.number)) {
    fullAddress += `, ${venue.number}`;
  }
  if (venue.neighborhood && !fullAddress.includes(venue.neighborhood)) {
    fullAddress += ` - ${venue.neighborhood}`;
  }

  // Tratar Comodidades (Amenities) vindas da relação N:N
  let amenitiesList = defaultMock.amenities;
  if (Array.isArray(venue.amenities) && venue.amenities.length > 0) {
    amenitiesList = venue.amenities.map((a) => (typeof a === 'object' ? a.name : a));
  }

  // Tratar Modalidades (Sports) do complexo
  let sportsList = defaultMock.sports;
  if (Array.isArray(venue.sports) && venue.sports.length > 0) {
    sportsList = venue.sports;
  }

  const courts = Array.isArray(venue.courts) && venue.courts.length > 0
    ? venue.courts.map((court, cIdx) => {
        let courtSports = [];
        if (Array.isArray(court.sports_list) && court.sports_list.length > 0) {
          courtSports = court.sports_list;
        } else if (Array.isArray(court.sports) && court.sports.length > 0) {
          courtSports = court.sports.map((s) => (typeof s === 'object' ? s.name : s));
        } else if (court.type) {
          courtSports = court.type.split(',').map((s) => capitalize(s.trim()));
        } else {
          courtSports = ['Futebol'];
        }

        return {
          id: court.id || (idx * 100 + cIdx + 1),
          venue_id: venue.id,
          name: court.name || `Quadra ${cIdx + 1}`,
          type: courtSports.join(' • '),
          sports: courtSports,
          surface: court.surface || 'Grama Sintética Pro',
          capacity: court.capacity || '10 a 12 Jogadores',
          is_covered: court.is_covered !== undefined ? Boolean(court.is_covered) : true,
          hourly_rate: parseFloat(court.hourly_rate || 150),
          rating: court.rating || defaultMock.rating,
          image_url: defaultMock.courts[cIdx % defaultMock.courts.length]?.image_url || defaultMock.image_url,
        };
      })
    : defaultMock.courts;

  return {
    ...venue,
    address: fullAddress,
    rating: venue.rating !== undefined && venue.rating !== null ? parseFloat(venue.rating) : defaultMock.rating,
    review_count: venue.review_count !== undefined && venue.review_count !== null ? parseInt(venue.review_count, 10) : defaultMock.review_count,
    sports: sportsList,
    amenities: amenitiesList,
    starting_price: venue.starting_price || (courts.length > 0 ? Math.min(...courts.map(c => c.hourly_rate)) : 150.0),
    courts_count: courts.length,
    is_open_today: true,
    image_url: venue.cover_image_url || venue.image_url || defaultMock.image_url,
    courts,
  };
}

function filterVenues(list, { search, sport }) {
  let filtered = [...list];

  if (search && search.trim() !== '') {
    const query = search.toLowerCase().trim();
    filtered = filtered.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.city.toLowerCase().includes(query) ||
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
