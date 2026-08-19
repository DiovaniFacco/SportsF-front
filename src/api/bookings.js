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
 */
export async function getUserBookings(params = {}) {
  const response = await apiClient.get('/bookings', { params });
  return response.data;
}

/**
 * Obtém detalhes de um agendamento específico.
 * @param {number} bookingId
 */
export async function getBookingDetails(bookingId) {
  const response = await apiClient.get(`/bookings/${bookingId}`);
  return response.data;
}

/**
 * Cancela um agendamento existente.
 * @param {number} bookingId
 */
export async function cancelBooking(bookingId) {
  const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
  return response.data;
}
