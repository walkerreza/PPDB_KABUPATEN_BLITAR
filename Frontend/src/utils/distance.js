// Konstanta untuk menghindari kalkulasi berulang
const R = 6371; // Radius bumi dalam kilometer
const PI_180 = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

// Cache untuk menyimpan hasil perhitungan
const distanceCache = new Map();

// Fungsi untuk membuat key cache
const createCacheKey = (lat1, lon1, lat2, lon2) => `${lat1},${lon1}-${lat2},${lon2}`;

// Fungsi untuk menghitung jarak antara dua koordinat menggunakan formula Haversine
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const cacheKey = createCacheKey(lat1, lon1, lat2, lon2);
  
  // Cek cache terlebih dahulu
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey);
  }

  const dLat = (lat2 - lat1) * PI_180;
  const dLon = (lon2 - lon1) * PI_180;
  const lat1Rad = lat1 * PI_180;
  const lat2Rad = lat2 * PI_180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = +(R * c).toFixed(2); // Jarak dalam kilometer, 2 desimal
  
  // Simpan ke cache
  if (distanceCache.size > 100) { // Batasi ukuran cache
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  distanceCache.set(cacheKey, distance);
  
  return distance;
};

// Fungsi untuk mengurutkan lokasi berdasarkan jarak dengan optimasi
export const sortLocationsByDistance = (locations, userCoords) => {
  if (!userCoords || !locations?.length) return [];
  
  const { lat: userLat, lng: userLng } = userCoords;
  
  // Pre-calculate distances
  const locationsWithDistance = locations.map(location => {
    const { lat, lng } = location.coordinates;
    return {
      ...location,
      distance: calculateDistance(userLat, userLng, lat, lng)
    };
  });
  
  // Sort dengan stabilitas
  return locationsWithDistance.sort((a, b) => {
    const diff = a.distance - b.distance;
    return diff === 0 ? a.id - b.id : diff; // Gunakan ID sebagai tie-breaker
  });
};
