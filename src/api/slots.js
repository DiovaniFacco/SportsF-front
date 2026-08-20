import apiClient from './client';
import { mockCourtBlocks } from './courtBlocks';

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
        response.data.slots = response.data.slots.filter(
          (s) => new Date(s.start_time.replace(' ', 'T')) > now
        );
      }
      return response.data;
    }
    return generateMockSlots(courtId, dateStr, includePast);
  } catch (error) {
    console.warn(`Erro ao buscar horários da quadra ${courtId} para ${dateStr}:`, error.message);
    return generateMockSlots(courtId, dateStr, includePast);
  }
}

/**
 * Gerador de dados mockados realistas para horários de quadra.
 */
function generateMockSlots(courtId, dateStr, includePast = false) {
  const baseDate = dateStr || new Date().toISOString().split('T')[0];
  const dateObj = new Date(baseDate + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();
  const now = new Date();

  // Gera slots das 07:00 às 23:00
  const slots = [];
  const startHour = 7;
  const endHour = 23;

  for (let hour = startHour; hour < endHour; hour++) {
    const startStr = `${String(hour).padStart(2, '0')}:00`;
    const endStr = `${String(hour + 1).padStart(2, '0')}:00`;
    const formattedTime = `${startStr} - ${endStr}`;
    const fullStart = `${baseDate} ${startStr}:00`;
    const fullEnd = `${baseDate} ${endStr}:00`;

    const slotStartDate = new Date(`${baseDate}T${startStr}:00`);
    if (!includePast && slotStartDate <= now) {
      continue; // Ignora horários que já passaram se não solicitado
    }

    // Horários de pico (18h às 22h) têm acréscimo no valor
    const isPeakHour = hour >= 18 && hour < 22;
    const basePrice = 140;
    const price = isPeakHour ? basePrice + 30 : basePrice;

    const seed = (Number(courtId) * 17 + hour * 7 + dayOfWeek * 13) % 10;
    
    let available = true;
    let blocked = false;
    let block_reason = null;

    const activeMockBlock = (mockCourtBlocks || []).find(
      (b) => String(b.court_id) === String(courtId) && b.start_time && b.start_time.startsWith(`${baseDate} ${startStr}`)
    );

    if (activeMockBlock) {
      available = false;
      blocked = true;
      block_reason = activeMockBlock.reason || 'Quadra bloqueada';
    } else if (seed === 0 || seed === 3) {
      available = false;
      blocked = false;
    } else if (seed === 7 && hour === 12) {
      available = false;
      blocked = true;
      block_reason = 'Manutenção da quadra';
    }

    slots.push({
      start_time: fullStart,
      end_time: fullEnd,
      formatted_time: formattedTime,
      price: price,
      available: available,
      blocked: blocked,
      block_reason: block_reason,
    });
  }

  return {
    court_id: courtId,
    date: baseDate,
    day_of_week: dayOfWeek,
    operating: true,
    slots: slots,
  };
}
