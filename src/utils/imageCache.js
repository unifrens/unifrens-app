// Cache duration in milliseconds (7 days)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
// Rate limiting: max 5 requests per second
const RATE_LIMIT_WINDOW = 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestQueue = [];
let processingQueue = false;

const processQueue = async () => {
  if (processingQueue) return;
  processingQueue = true;

  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, MAX_REQUESTS_PER_WINDOW);
    await Promise.allSettled(batch.map(req => req()));
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW));
    }
  }

  processingQueue = false;
};

const queueImageLoad = (name) => {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const img = new Image();
        const imageLoadPromise = new Promise((resolveLoad, rejectLoad) => {
          img.onload = resolveLoad;
          img.onerror = (err) => {
            // Don't log 429 errors as they're expected during rate limiting
            if (!err.message?.includes('429')) {
              console.warn(`Failed to load image for ${name}:`, err);
            }
            rejectLoad(err);
          };
          img.crossOrigin = 'anonymous';
        });

        img.src = getNFTImageUrl(name);
        await imageLoadPromise;
        resolve(img);
      } catch (err) {
        reject(err);
      }
    };
    requestQueue.push(task);
    processQueue();
  });
};

export const getNFTImageUrl = (name) => `https://imgs.unifrens.com/${encodeURIComponent(name)}`;

export const cacheNFTImage = async (name) => {
  try {
    // Check if we already have a valid cache
    const cached = localStorage.getItem(`unifrens_nft_${name}`);
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return true; // Cache is still valid
      }
    }

    // Load and cache the image with rate limiting
    const img = await queueImageLoad(name);

    // Cache the loaded image
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    localStorage.setItem(
      `unifrens_nft_${name}`,
      JSON.stringify({
        data: canvas.toDataURL('image/png'),
        timestamp: Date.now()
      })
    );

    return true;
  } catch (err) {
    // Only log non-rate-limit errors
    if (!err.message?.includes('429')) {
      console.warn('Failed to cache NFT image:', err);
    }
    return false;
  }
};

export const getCachedNFTImage = (name) => {
  try {
    const cached = localStorage.getItem(`unifrens_nft_${name}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`unifrens_nft_${name}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Error reading cached NFT image:', err);
    return null;
  }
};

export const preloadNFTImage = async (name) => {
  const cached = getCachedNFTImage(name);
  if (cached) {
    const img = new Image();
    img.src = cached;
    return;
  }

  await cacheNFTImage(name);
};

export const downloadNFTImage = async (name) => {
  const cached = getCachedNFTImage(name);
  
  if (cached) {
    const a = document.createElement('a');
    a.href = cached;
    a.download = `${name}.fren.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // If no cache, download directly and cache for next time
  const url = getNFTImageUrl(name);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.fren.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Cache in background for next time
  cacheNFTImage(name);
}; 