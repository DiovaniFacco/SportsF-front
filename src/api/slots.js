import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Busca a grade de horários disponíveis para uma quadra em uma data específica (YYYY-MM-DD).
 */
export async function getAvailableSlots(courtId, dateStr) {
  try {
    const response = await axios.get(`${API_URL}/courts/${courtId}/available-slots`, {
      timeout: 3000,
      params: { date: dateStr },
    });

    if (response.data && Array.isArray(response.data.slots)) {
      const now = new Date();
      response.data.slots = response.data.slots.filter(s => new Date(s.start_time.replace(' ', 'T')) > now);
      return response.data;
    }
    return generateMockSlots(courtId, dateStr);
  } catch (error) {
    console.warn(`Erro ao buscar horários da quadra ${courtId} para ${dateStr}, utilizando dados mockados:`, error.message);
    return generateMockSlots(courtId, dateStr);
  }
}

/**
 * Gerador de dados mockados realistas para horários de quadra.
 */
function generateMockSlots(courtId, dateStr) {
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
    if (slotStartDate <= now) {
      continue; // Ignora horários que já passaram
    }

    // Horários de pico (18h às 22h) têm acréscimo no valor
    const isPeakHour = hour >= 18 && hour < 22;
    const basePrice = 140;
    const price = isPeakHour ? basePrice + 30 : basePrice;

    // Simulação de ocupação realista
    const seed = (Number(courtId) * 17 + hour * 7 + dayOfWeek * 13) % 10;
    
    let available = true;
    let blocked = false;
    let block_reason = null;

    if (seed === 0 || seed === 3) {
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
