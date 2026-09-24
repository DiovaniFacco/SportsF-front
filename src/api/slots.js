import apiClient from './client';
import { parseServerDateTime } from '../utils/datetime';

/**
 * Busca a grade de horários e turnos de funcionamento disponíveis para uma quadra em uma data específica (YYYY-MM-DD).
 * @param {number|string} courtId
 * @param {string} dateStr
 * @param {Object} options { includePast?: boolean }
 */
export async function getAvailableSlots(courtId, dateStr, options = {}) {
  const includePast = Boolean(options.includePast);
  try {
    const response = await apiClient.get(`/courts/${courtId}/available-slots`, {
      params: {
        date: dateStr,
        include_past: includePast ? 1 : 0,
      },
    });

    if (response.data && Array.isArray(response.data.slots)) {
      if (!includePast) {
        const now = new Date();
        response.data.slots = response.data.slots.filter((s) => {
          const slotDate = parseServerDateTime(s.start_time);
          return slotDate ? slotDate > now : true;
        });
      }
      return response.data;
    }
    return { court_id: courtId, date: dateStr, operating: false, slots: [] };
  } catch (error) {
    console.error(`Erro ao buscar horários da quadra ${courtId} para ${dateStr}:`, error.message);
    throw error;
  }
}
