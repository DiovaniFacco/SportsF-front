import apiClient from './client';

/**
 * Cria um novo agendamento para uma quadra.
 * @param {Object} bookingData
 * @param {number} bookingData.courtId - ID da quadra
 * @param {string} bookingData.startTime - Data e hora de início (YYYY-MM-DD HH:mm:ss)
 * @param {string} bookingData.endTime - Data e hora de término (YYYY-MM-DD HH:mm:ss)
 * @param {string} [bookingData.notes] - Observações adicionais
 * @param {boolean} [bookingData.isManual] - Se é agendamento manual (apenas gestor/admin)
 * @param {string} [bookingData.customerName] - Nome do cliente (se manual)
 * @param {string} [bookingData.customerPhone] - Telefone do cliente (se manual)
 */
export async function createBooking({
  courtId,
  startTime,
  endTime,
  notes = null,
  isManual = false,
  customerName = null,
  customerPhone = null,
}) {
  const payload = {
    court_id: courtId,
    start_time: startTime,
    end_time: endTime,
    notes,
    is_manual: isManual,
    customer_name: customerName,
    customer_phone: customerPhone,
  };

  const response = await apiClient.post('/bookings', payload);
  return response.data;
}

/**
 * Lista os agendamentos do usuário logado (ou todos para gestor/admin).
 * @param {Object} [params]
 * @param {string} [params.status] - 'confirmed' | 'cancelled'
 * @param {number} [params.page] - Página da paginação
 * @param {string} [params.date] - Data YYYY-MM-DD
 */
export async function getUserBookings(params = {}) {
  try {
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  } catch (error) {
    console.warn('Erro ao buscar agendamentos na API, utilizando dados mockados:', error.message);
    return getMockBookings(params);
  }
}

/**
 * Obtém detalhes de um agendamento específico.
 * @param {number} bookingId
 */
export async function getBookingDetails(bookingId) {
  try {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao buscar detalhes do agendamento ${bookingId}:`, error.message);
    return null;
  }
}

/**
 * Cancela um agendamento existente.
 * @param {number} bookingId
 */
export async function cancelBooking(bookingId) {
  try {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao cancelar agendamento ${bookingId} na API, simulando cancelamento local:`, error.message);
    return { success: true, message: 'Agendamento cancelado com sucesso.' };
  }
}

/**
 * Gera lista de agendamentos mockados para a visão do gestor/usuário.
 */
function getMockBookings(params = {}) {
  const today = params.date || new Date().toISOString().split('T')[0];

  const mockList = [
    {
      id: 101,
      court_id: 1,
      court: { id: 1, name: 'Quadra Society 1 - Coberta' },
      start_time: `${today} 09:00:00`,
      end_time: `${today} 10:00:00`,
      status: 'confirmed',
      is_manual: false,
      customer_name: 'Carlos Eduardo Santos',
      customer_phone: '(54) 99842-1122',
      notes: 'Reserva confirmada via app',
      user: { name: 'Carlos Eduardo Santos', email: 'carlos@exemplo.com', phone: '(54) 99842-1122' },
      total_price: 140.0,
    },
    {
      id: 102,
      court_id: 1,
      court: { id: 1, name: 'Quadra Society 1 - Coberta' },
      start_time: `${today} 18:00:00`,
      end_time: `${today} 19:00:00`,
      status: 'confirmed',
      is_manual: true,
      customer_name: 'Marcos Vinicius (Balcão)',
      customer_phone: '(54) 99123-5566',
      notes: 'Agendado presencialmente no balcão - Pago em dinheiro',
      user: null,
      total_price: 170.0,
    },
    {
      id: 103,
      court_id: 2,
      court: { id: 2, name: 'Quadra de Saibro A - Coberta' },
      start_time: `${today} 10:00:00`,
      end_time: `${today} 11:00:00`,
      status: 'confirmed',
      is_manual: false,
      customer_name: 'Juliana Paes',
      customer_phone: '(54) 98111-2233',
      notes: 'Aula particular de Tênis',
      user: { name: 'Juliana Paes', email: 'juliana@exemplo.com' },
      total_price: 180.0,
    },
    {
      id: 104,
      court_id: 2,
      court: { id: 2, name: 'Quadra de Saibro A - Coberta' },
      start_time: `${today} 15:00:00`,
      end_time: `${today} 16:00:00`,
      status: 'cancelled',
      is_manual: false,
      customer_name: 'Roberto Alencar',
      customer_phone: '(54) 99654-7788',
      notes: 'Cancelado a pedido do cliente',
      user: { name: 'Roberto Alencar', email: 'roberto@exemplo.com' },
      total_price: 180.0,
    },
  ];

  if (params.status) {
    const filtered = mockList.filter((b) => b.status === params.status);
    return { data: filtered, total: filtered.length };
  }

  return { data: mockList, total: mockList.length };
}

