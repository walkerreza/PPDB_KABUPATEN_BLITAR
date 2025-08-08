/**
 * Format data untuk chart berdasarkan jenjang pendidikan
 * @param {Array} data - Data mentah dari API
 * @param {String} jenjang - Jenjang pendidikan (TK, SD, SMP)
 * @returns {Object} Data yang sudah diformat untuk Chart.js
 */
export const formatChartData = (data, jenjang) => {
  if (!data || data.length === 0) return null;

  // Sorting data berdasarkan nama sekolah untuk konsistensi
  const sortedData = [...data].sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  
  // Ekstrak label (nama sekolah)
  const labels = sortedData.map(item => item.nama_sekolah);
  
  // Datasets untuk jenjang TK (hanya reguler)
  if (jenjang === 'TK') {
    return {
      labels,
      datasets: [
        {
          label: 'Pagu Reguler',
          data: sortedData.map(item => item.pagu_reguler || 0),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Pendaftar Reguler',
          data: sortedData.map(item => item.pendaftar_reguler || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ]
    };
  }
  
  // Datasets untuk jenjang SD dan SMP (semua jalur)
  return {
    labels,
    datasets: [
      // Pagu
      {
        label: 'Pagu Zonasi',
        data: sortedData.map(item => item.pagu_zonasi || 0),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pagu Afirmasi',
        data: sortedData.map(item => item.pagu_afirmasi || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pagu Prestasi',
        data: sortedData.map(item => item.pagu_prestasi || 0),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pagu Pindahan',
        data: sortedData.map(item => item.pagu_pindahan || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
      
      // Pendaftar
      {
        label: 'Pendaftar Zonasi',
        data: sortedData.map(item => item.pendaftar_zonasi || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pendaftar Afirmasi',
        data: sortedData.map(item => item.pendaftar_afirmasi || 0),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pendaftar Prestasi',
        data: sortedData.map(item => item.pendaftar_prestasi || 0),
        backgroundColor: 'rgba(54, 235, 162, 0.5)', 
        borderColor: 'rgba(54, 235, 162, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pendaftar Pindahan',
        data: sortedData.map(item => item.pendaftar_pindahan || 0),
        backgroundColor: 'rgba(255, 99, 255, 0.5)',
        borderColor: 'rgba(255, 99, 255, 1)',
        borderWidth: 1,
      }
    ]
  };
};
