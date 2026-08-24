/**
 * Utilitário para Otimização, Compressão e Presets de Imagens para Quadras e Complexos
 */

// Presets HD para Complexos Esportivos
export const PRESET_VENUE_IMAGES = [
  {
    id: 'venue-1',
    name: 'Arena Sunset',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=90',
  },
  {
    id: 'venue-2',
    name: 'Club Premium',
    url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1600&q=90',
  },
  {
    id: 'venue-3',
    name: 'Complexo Noturno LED',
    url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1600&q=90',
  },
  {
    id: 'venue-4',
    name: 'Arena Areia Gourmet',
    url: 'https://images.unsplash.com/photo-1593786416058-251d7c31d1ef?auto=format&fit=crop&w=1600&q=90',
  },
];

// Presets HD para Quadras por Modalidade
export const PRESET_COURT_IMAGES = [
  {
    id: 'court-beach-tennis',
    name: 'Beach Tennis Pro',
    url: 'https://images.unsplash.com/photo-1593786416058-251d7c31d1ef?auto=format&fit=crop&w=1400&q=90',
  },
  {
    id: 'court-volei',
    name: 'Vôlei de Areia Quartzosa',
    url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=90',
  },
  {
    id: 'court-futevolei',
    name: 'Futevôlei Sunset',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=90',
  },
  {
    id: 'court-padel',
    name: 'Padel Vidro Panorama',
    url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=90',
  },
  {
    id: 'court-society',
    name: 'Futebol Society Sintética',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=90',
  },
];

/**
 * Otimiza a URL de uma imagem para garantir alta definição e boa qualidade de renderização.
 * Se for uma URL do Unsplash, ajusta os parâmetros de resolução (w) e qualidade (q).
 */
export function optimizeImageUrl(url, options = {}) {
  const { width = 1400, quality = 90 } = options;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return PRESET_VENUE_IMAGES[0].url;
  }

  const cleanUrl = url.trim();

  // Otimização para links do Unsplash
  if (cleanUrl.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(cleanUrl);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('w', String(width));
      urlObj.searchParams.set('q', String(quality));
      return urlObj.toString();
    } catch {
      return cleanUrl;
    }
  }

  return cleanUrl;
}

/**
 * Redimensiona e comprime um arquivo de imagem selecionado pelo usuário no navegador.
 * Limita o tamanho máximo (largura/altura) e comprime a qualidade para evitar envios pesados.
 * Retorna uma promessa com a Data URL comprimida em WebP/JPEG.
 */
export function compressAndResizeImage(file, options = {}) {
  const { maxWidth = 1600, maxHeight = 1200, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Arquivo de imagem inválido.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao processar conteúdo da imagem.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo a proporção de aspecto (aspect ratio)
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        // Criar canvas HTML para redimensionamento e compressão
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target.result); // Fallback para data URL original
        }

        // Desenhar com suavização de imagem ativada
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG comprimido
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
