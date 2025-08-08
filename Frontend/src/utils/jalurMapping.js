// File untuk mapping nama jalur
// Digunakan untuk menampilkan nama jalur yang berbeda di UI tanpa mengubah logika kode
//INI UNTUK BAGIAN HASIL PPDB PAPER

const jalurDisplayNames = {
  // Key: nama jalur di sistem (jangan diubah)
  // Value: nama jalur yang ditampilkan di UI (bisa diubah)
  'zonasi': 'DOMISILI (ZONASI)',
  'afirmasi': 'AFIRMASI',
  'prestasi': 'PRESTASI',
  'perpindahan': 'MUTASI (PERPINDAHAN)',
  'reguler': 'REGULER'
};

// Fungsi untuk mendapatkan nama display dari jalur
export const getJalurDisplayName = (jalurKey) => {
  // Jika jalur ada di mapping, gunakan nama display
  // Jika tidak, kembalikan jalur asli dengan huruf besar
  return jalurDisplayNames[jalurKey.toLowerCase()] || jalurKey.toUpperCase();
};

export default jalurDisplayNames;
