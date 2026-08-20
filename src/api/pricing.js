import apiClient from './client';

// --- Regras de Horários Nobres / Pico ---

/**
 * Busca as regras de horários nobres configuradas para uma quadra.
 */
export async function getCourtPricingRules(courtId) {
  try {
    const response = await apiClient.get(`/courts/${courtId}/pricing-rules`);
    return response.data?.pricing_rules || [];
  } catch (error) {
    console.warn(`Erro ao buscar regras de preço da quadra ${courtId}:`, error.message);
    throw error;
  }
}

/**
 * Adiciona uma regra de horário nobre para uma quadra.
 * @param {number|string} courtId
 * @param {Object} ruleData { day_of_week: 0-6, start_time: "18:00", end_time: "22:00", hourly_rate: 150.00, label: "Horário de Pico" }
 */
export async function createCourtPricingRule(courtId, ruleData) {
  try {
    const response = await apiClient.post(`/courts/${courtId}/pricing-rules`, ruleData);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao criar regra de preço para quadra ${courtId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Remove uma regra de horário nobre.
 * @param {number|string} ruleId
 */
export async function deleteCourtPricingRule(ruleId) {
  try {
    const response = await apiClient.delete(`/pricing-rules/${ruleId}`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao deletar regra de preço ${ruleId}:`, error.response?.data || error.message);
    throw error;
  }
}

// --- Preços Especiais (Feriados / Datas Festivas) ---

/**
 * Busca os preços especiais configurados por data para uma quadra.
 */
export async function getCourtSpecialPrices(courtId) {
  try {
    const response = await apiClient.get(`/courts/${courtId}/special-prices`);
    return response.data?.special_prices || [];
  } catch (error) {
    console.warn(`Erro ao buscar preços especiais da quadra ${courtId}:`, error.message);
    throw error;
  }
}

/**
 * Adiciona um preço especial de data/feriado para uma quadra.
 * @param {number|string} courtId
 * @param {Object} priceData { event_date: "YYYY-MM-DD", hourly_rate: 180.00, label: "Feriado de Carnaval" }
 */
export async function createCourtSpecialPrice(courtId, priceData) {
  try {
    const response = await apiClient.post(`/courts/${courtId}/special-prices`, priceData);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao cadastrar preço especial na quadra ${courtId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Remove um preço especial por data.
 * @param {number|string} specialPriceId
 */
export async function deleteCourtSpecialPrice(specialPriceId) {
  try {
    const response = await apiClient.delete(`/special-prices/${specialPriceId}`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao remover preço especial ${specialPriceId}:`, error.response?.data || error.message);
    throw error;
  }
}
