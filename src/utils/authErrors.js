/**
 * Mapeia erros da API de auth para mensagens amigáveis em PT-BR.
 * Cobre 429 (throttle/lockout) e extrai a primeira mensagem de validação.
 */
export function mapAuthError(error, fallback) {
  const status = error?.response?.status;
  if (status === 429) {
    return (
      error?.response?.data?.message ||
      'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
    );
  }
  const msg =
    error?.response?.data?.message ||
    (error?.response?.data?.errors ? Object.values(error.response.data.errors)[0]?.[0] : null);
  if (msg) return msg;
  if (error?.message === 'Network Error') {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  return fallback;
}
