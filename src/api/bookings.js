import apiClient from './client';

/**
 * Cria um novo agendamento para uma quadra.
 */
export async function createBooking({
  courtId,
  startTime,
  endTime,
  notes = null,
  isManual = false,
  customerName = null,
  customerPhone = null,
  isPaid = false,
}) {
  const payload = {
    court_id: courtId,
    start_time: startTime,
    end_time: endTime,
    notes,
    is_manual: isManual,
    customer_name: customerName,
    customer_phone: customerPhone,
    is_paid: isPaid,
  };

  const response = await apiClient.post('/bookings', payload);
  return response.data;
}

/**
 * Cria várias reservas de uma vez, de forma atômica (tudo ou nada).
 * Usado pela seleção multi-slot: ou todos os horários são reservados, ou nenhum.
 */
export async function createBookingsBatch({ courtId, slots, notes = null }) {
  const payload = {
    court_id: courtId,
    slots: slots.map((s) => ({ start_time: s.startTime, end_time: s.endTime })),
    notes,
  };

  const response = await apiClient.post('/bookings/batch', payload);
  return response.data;
}

/**
 * Lista os agendamentos do usuário logado (ou todos para gestor/admin).
 */
export async function getUserBookings(params = {}) {
  try {
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos na API:', error.message);
    throw error;
  }
}

/**
 * Obtém detalhes de um agendamento específico.
 */
export async function getBookingDetails(bookingId) {
  try {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do agendamento ${bookingId}:`, error.message);
    throw error;
  }
}

/**
 * Cancela um agendamento existente.
 */
export async function cancelBooking(bookingId) {
  try {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao cancelar agendamento ${bookingId} na API:`, error.message);
    throw error;
  }
}

/**
 * Marca um agendamento como pago ou pendente (gestor do complexo ou admin).
 */
export async function updateBookingPayment(bookingId, isPaid) {
  try {
    const response = await apiClient.patch(`/bookings/${bookingId}/payment`, { is_paid: isPaid });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar pagamento do agendamento ${bookingId} na API:`, error.message);
    throw error;
  }
}
