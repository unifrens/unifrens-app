// Cache duration in milliseconds (7 days)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

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

    // Load and cache the image
    const img = new Image();
    const imageLoadPromise = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.crossOrigin = 'anonymous'; // Enable CORS for canvas operations
    });

    img.src = getNFTImageUrl(name);
    await imageLoadPromise;

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
    console.warn('Failed to cache NFT image:', err);
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