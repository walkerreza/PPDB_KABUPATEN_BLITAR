// FUNGSI INDUK DARI GRAFIKHOME DAN GRAFIK (SUPER ADMIN)


// Fungsi untuk mendapatkan headers dengan token
const getHeaders = () => {
  // Jika halaman adalah GrafikHome, tidak perlu token
  if (window.location.pathname === '/GrafikHome') {
    return {
      'Content-Type': 'application/json'
    };
  }

  try {
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('Data user tidak ditemukan');
    }

    const userData = JSON.parse(userDataString);
    const token = userData.token;

    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting headers:', error);
    setTimeout(() => {
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }, 2000);
    return {};
  }
};

// Definisi kategori sekolah
const schoolCategories = {
  TK: { label: 'TK/RA', ids: [112, 122] },
  SD: { label: 'SD/MIN/MIS', ids: [211, 212, 221, 222] },
  SLTP: { label: 'SMP/MTSN/MTSS', ids: [311, 312, 321, 322] }
};

// Fungsi untuk mendapatkan label sekolah berdasarkan id_tipe_sekolah
const getSchoolLabel = (tipeSekolahId, defaultLabel = '') => {
  // Mapping spesifik untuk setiap tipe sekolah
  const specificLabels = {
    112: 'TK',
    122: 'RA',
    211: 'SDN',
    212: 'SDS',
    221: 'MIN',
    222: 'MIS',
    311: 'SMPN',
    312: 'SMPS',
    321: 'MTSN',
    322: 'MTSS'
  };

  return specificLabels[tipeSekolahId] || defaultLabel;
};

// Fungsi untuk mendapatkan dataset chart
const getChartDatasets = (apiData, useSchoolLabel = false) => {
  const schoolLabel = useSchoolLabel ? 
    `${getSchoolLabel(apiData[0]?.sekolah_tujuan_data?.tipe_sekolah?.id_tipe_sekolah)} - ` : 
    '';

  return [
    {
      label: `${schoolLabel}AFIRMASI`,
      data: apiData.map(item => item.pendaftar_afirmasi),
      backgroundColor: 'rgba(255, 206, 86, 0.5)',
      borderColor: 'rgb(255, 206, 86)',
      borderWidth: 1,
    },
    {
      label: 'PAGU AFIRMASI',
      data: apiData.map(item => item.pagu_afirmasi),
      backgroundColor: 'rgba(255, 206, 86, 0.8)',
      borderColor: 'rgb(255, 206, 86)',
      borderWidth: 1,
    },
    {
      label: `${schoolLabel}MUTASI (PINDAHAN)`,
      data: apiData.map(item => item.pendaftar_pindahan),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1,
    },
    {
      label: 'PAGU MUTASI (PINDAHAN)',
      data: apiData.map(item => item.pagu_pindahan),
      backgroundColor: 'rgba(75, 192, 192, 0.8)',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1,
    },
    {
      label: `${schoolLabel}PRESTASI`,
      data: apiData.map(item => item.pendaftar_prestasi),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
    {
      label: 'PAGU PRESTASI',
      data: apiData.map(item => item.pagu_prestasi),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
    {
      label: `${schoolLabel}DOMISILI (ZONASI)`,
      data: apiData.map(item => item.pendaftar_zonasi),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1,
    },
    {
      label: 'PAGU DOMISILI (ZONASI)',
      data: apiData.map(item => item.pagu_zonasi),
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1,
    },
  ];
};

// Fungsi untuk mendapatkan dataset chart khusus untuk TK (hanya pagu reguler dan jalur reguler)
const getTKChartDatasets = (apiData, useSchoolLabel = false) => {
  const schoolLabel = useSchoolLabel ? 
    `${getSchoolLabel(apiData[0]?.sekolah_tujuan_data?.tipe_sekolah?.id_tipe_sekolah)} - ` : 
    '';

  // Log untuk debugging
  console.log('Membuat dataset untuk TK/RA dengan data:', 
    apiData.map(item => ({
      sekolah: item.nama_sekolah,
      pendaftar_reguler: item.pendaftar_reguler,
      pagu_reguler: item.pagu_reguler
    }))
  );

  return [
    {
      label: `${schoolLabel}REGULER`,
      data: apiData.map(item => item.pendaftar_reguler || 0),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
    {
      label: 'PAGU REGULER',
      data: apiData.map(item => item.pagu_reguler || 0),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
  ];
};

// Fungsi untuk memformat data ke format Chart.js
// ini tidak boleh diedit
export const formatPPDBData = (apiData) => {
  if (!apiData || apiData.length === 0) return null;

  const labels = apiData.map(item => item.nama_sekolah);
  
  // Tentukan jenjang berdasarkan data
  let jenjang = '';
  
  // Cek apakah data adalah untuk TK/RA
  if (apiData.some(item => 
      item.nama_sekolah.includes('TK') || 
      item.nama_sekolah.includes('RA') || 
      (item.pagu_reguler > 0 && item.pagu_zonasi === 0 && item.pagu_prestasi === 0)
  )) {
    jenjang = 'TK';
  }
  
  // Log untuk debugging
  if (jenjang === 'TK') {
    console.log('Data TK/RA yang akan ditampilkan:', apiData);
  }
  
  // Gunakan dataset khusus untuk TK, dataset normal untuk jenjang lain
  const datasets = jenjang === 'TK' ? 
    getTKChartDatasets(apiData) : 
    getChartDatasets(apiData);

  return { labels, datasets };
};

// Fungsi untuk memformat data dengan level dan id sekolah
export const formatPPDBDataWithLevel = (apiData, jenjang) => {
  if (!apiData || !apiData.length) return null;

  return {
    labels: apiData.map(item => item.nama_sekolah),
    datasets: getChartDatasets(apiData, true)
  };
};

export const getPPDBData = async (jenjang) => {
  try {
    const isPublicPage = window.location.pathname === '/GrafikHome';
    const baseHeaders = {
      'Content-Type': 'application/json'
    };

    // Tambahkan token jika bukan halaman publik
    const headers = isPublicPage ? baseHeaders : getHeaders();
    
    // Gunakan endpoint grafik yang sudah dioptimasi jika tersedia
    try {
      // Coba gunakan endpoint grafik yang dioptimasi terlebih dahulu
      const optimizedResponse = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/grafik/${jenjang}`, {
        method: 'GET',
        headers: headers
      });
      
      if (optimizedResponse.ok) {
        const result = await optimizedResponse.json();
        return result.data || [];
      }
    } catch (error) {
      console.log('Endpoint grafik yang dioptimasi tidak tersedia, menggunakan metode fallback');
    }
    
    // Fallback ke metode lama jika endpoint baru tidak tersedia
    // 1. Ambil daftar sekolah terlebih dahulu
    const sekolahResponse = await fetch(`${import.meta.env.VITE_API_URL}/sekolah`, {
      method: 'GET',
      headers: headers
    });

    if (!sekolahResponse.ok) {
      throw new Error('Gagal mengambil data sekolah');
    }

    const sekolahResult = await sekolahResponse.json();
    const sekolahList = sekolahResult.data;

    // Filter sekolah berdasarkan jenjang - gunakan Map untuk lookup yang lebih cepat
    const jenjangTipeMap = {
      'TK': [112, 122],
      'SD': [211, 212, 221, 222],
      'SMP': [311, 312, 321, 322]
    };
    
    // Filter sekolah berdasarkan jenjang tanpa batasan jumlah
    const filteredSekolah = sekolahList.filter(sekolah => {
      if (jenjang === 'TK') {
        return jenjangTipeMap['TK'].includes(sekolah.tipe_sekolah?.id_tipe_sekolah) || 
               sekolah.nama.includes('TK') || 
               sekolah.nama.includes('RA');
      } else {
        return jenjangTipeMap[jenjang]?.includes(sekolah.tipe_sekolah?.id_tipe_sekolah);
      }
    });

    console.log(`Total ${filteredSekolah.length} sekolah ditemukan untuk jenjang ${jenjang}`);

    // 2. Ambil data pendaftaran untuk setiap sekolah secara batch
    // Bagi menjadi batch untuk menghindari terlalu banyak request paralel
    const batchSize = 10; // Meningkatkan batch size untuk mengurangi jumlah iterasi
    const formattedData = [];
    
    // Tampilkan progress untuk data besar
    console.log(`Memproses data ${jenjang} dalam ${Math.ceil(filteredSekolah.length / batchSize)} batch`);
    
    for (let i = 0; i < filteredSekolah.length; i += batchSize) {
      const batch = filteredSekolah.slice(i, i + batchSize);
      console.log(`Memproses batch ${Math.floor(i/batchSize) + 1} dari ${Math.ceil(filteredSekolah.length / batchSize)}`);
      
      const pendaftaranPromises = batch.map(sekolah => 
        fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/diterima/sekolah/${sekolah.id_sekolah}`, {
          method: 'GET',
          headers: headers
        })
        .then(res => res.json())
        .then(data => ({ sekolah, pendaftaran: data.data || [] }))
        .catch(error => {
          console.error('Error fetching data for school:', sekolah.nama, error);
          return { sekolah, pendaftaran: [] }; // Return empty data on error
        })
      );

      const batchResults = await Promise.all(pendaftaranPromises);
      
      // 3. Transform data untuk grafik - optimasi untuk performa
      for (let j = 0; j < batchResults.length; j++) {
        const { sekolah, pendaftaran } = batchResults[j];
        
        // Gunakan object untuk menghitung jalur lebih cepat
        const jalurCounts = {
          pendaftar_zonasi: 0,
          pendaftar_prestasi: 0,
          pendaftar_pindahan: 0,
          pendaftar_afirmasi: 0,
          pendaftar_reguler: 0
        };
        
        // Gunakan for loop biasa untuk performa yang lebih baik daripada reduce
        for (let k = 0; k < pendaftaran.length; k++) {
          const jalur = pendaftaran[k].jalur_pendaftaran?.nama?.toLowerCase();
          
          if (jalur === 'zonasi') jalurCounts.pendaftar_zonasi++;
          else if (jalur === 'prestasi') jalurCounts.pendaftar_prestasi++;
          else if (jalur === 'pindahan') jalurCounts.pendaftar_pindahan++;
          else if (jalur === 'afirmasi') jalurCounts.pendaftar_afirmasi++;
          else if (jalur === 'reguler') jalurCounts.pendaftar_reguler++;
        }
        
        // Untuk TK, kita hitung total pendaftar sebagai pendaftar reguler jika tidak ada jalur reguler
        if (jenjang === 'TK' && jalurCounts.pendaftar_reguler === 0) {
          jalurCounts.pendaftar_reguler = pendaftaran.length;
        }

        formattedData.push({
          nama_sekolah: sekolah.nama,
          ...jalurCounts,
          // Data pagu dari sekolah
          pagu_zonasi: parseInt(sekolah.zonasi) || 0,
          pagu_prestasi: parseInt(sekolah.prestasi) || 0,
          pagu_afirmasi: parseInt(sekolah.afirmasi) || 0,
          pagu_pindahan: parseInt(sekolah.pindahan) || 0,
          // Untuk TK, gunakan nilai pagu reguler dari API jika tersedia
          pagu_reguler: jenjang === 'TK' ? 
            (parseInt(sekolah.reguler) || 0) : 0
        });
      }
    }

    console.log(`Selesai memproses ${formattedData.length} sekolah untuk jenjang ${jenjang}`);
    return formattedData;
  } catch (error) {
    console.error('Error fetching PPDB data:', error);
    throw error;
  }
};
