import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Select, Option } from "@material-tailwind/react";
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import { DetailButton } from '../../../components/element/Button/variant';
import { SuperAdminGuard } from '../../../utils/AuthGuard';
import { toast } from 'react-toastify';

const BelumTampung = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tingkatan, setTingkatan] = useState('semua');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = () => {
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
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      setTimeout(() => {
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }, 2000);
      return {};
    }
  };

  // Fungsi untuk mendapatkan nama tipe sekolah berdasarkan role admin
  const getTipeSekolahByRole = useCallback(() => {
    if (!userData) return [];
    
    const idGrupUser = parseInt(userData.id_grup_user) || 0;
    
    if (idGrupUser === 1) {
      // SuperAdmin - tampilkan semua
      return [];
    } else if (idGrupUser === 4) {
      // Admin Bidang PAUD/TK - kode 112, 122
      return ["Taman Kanak-Kanak", "Raudhatul Athfal"];
    } else if (idGrupUser === 5) {
      // Admin Bidang SD - kode 211, 212, 221, 222
      return ["Sekolah Dasar Negeri", "Sekolah Dasar Swasta", "Madrasah Ibtidaiyah Negeri", "Madrasah Ibtidaiyah Swasta"];
    } else if (idGrupUser === 6) {
      // Admin Bidang SMP - kode 311, 312, 321, 322
      return ["Sekolah Menengah Pertama Negeri", "Sekolah Menengah Pertama Swasta", "Madrasah Tsanawiyah Negeri", "Madrasah Tsanawiyah Swasta"];
    } else if (idGrupUser === 7) {
      // Admin Bidang Kemenag - kode 122, 221, 222, 321, 322
      return ["Raudhatul Athfal", "Madrasah Ibtidaiyah Negeri", "Madrasah Ibtidaiyah Swasta", "Madrasah Tsanawiyah Negeri", "Madrasah Tsanawiyah Swasta"];
    }
    
    return [];
  }, [userData]);

  // Fungsi untuk menentukan endpoint berdasarkan grup user
  const getEndpointByRole = useCallback((selectedTingkatan) => {
    if (!userData) return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${selectedTingkatan}`;
    
    const idGrupUser = userData.id_grup_user;
    
    // Pastikan tingkatan selalu dikonversi menjadi string untuk endpoint
    const tingkatanValue = selectedTingkatan.toString();
    
    // Jika SuperAdmin Dinas, gunakan endpoint default tanpa filter jenjang
    if (idGrupUser === 1) {
      return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${tingkatanValue}`;
    }
    
    // Untuk Admin Bidang, selalu tambahkan filter jenjang sesuai bidangnya
    // Admin Bidang PAUD/TK
    if (idGrupUser === 4) {
      // Jika memilih tingkatan spesifik, gunakan tingkatan tersebut
      // Jika memilih "semua", tetap filter untuk jenjang PAUD/TK saja
      return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${tingkatanValue}?jenjang=paud`;
    } 
    // Admin Bidang SD
    else if (idGrupUser === 5) {
      return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${tingkatanValue}?jenjang=sd`;
    } 
    // Admin Bidang SMP
    else if (idGrupUser === 6) {
      return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${tingkatanValue}?jenjang=smp`;
    }
    // Admin Bidang Kemenag
    else if (idGrupUser === 7) {
      return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${tingkatanValue}?jenjang=kemenag`;
    }
    
    // Default jika tidak ada kondisi yang terpenuhi
    return `${import.meta.env.VITE_API_URL}/pendaftaran/belum-tertampung/${tingkatanValue}`;
  }, [userData]);

  // Fungsi untuk memfilter data berdasarkan tipe sekolah
  const filterDataByTipeSekolah = useCallback((dataArray) => {
    // Cek data array terlebih dahulu
    console.log('Data array yang akan difilter:', dataArray);
    
    if (!userData || !dataArray || dataArray.length === 0) {
      console.log('Data kosong atau userData tidak tersedia, mengembalikan data asli');
      return dataArray;
    }
    
    const idGrupUser = parseInt(userData.id_grup_user) || 0;
    console.log('ID Grup User:', idGrupUser);
    
    // Jika SuperAdmin Dinas, tampilkan semua data
    if (idGrupUser === 1) {
      console.log('SuperAdmin: menampilkan semua data');
      return dataArray;
    }
    
    // Ambil daftar nama tipe sekolah berdasarkan jenjang admin
    const allowedTipeSekolah = getTipeSekolahByRole();
    console.log('Nama tipe sekolah yang diizinkan:', allowedTipeSekolah);
    
    // Jika tidak ada filter khusus, tampilkan semua data
    if (!allowedTipeSekolah || allowedTipeSekolah.length === 0) {
      console.log('Tidak ada filter khusus, menampilkan semua data');
      return dataArray;
    }
    
    // Filter data berdasarkan nama tipe sekolah
    const filteredData = dataArray.filter(item => {
      // Pastikan item memiliki objek tipe_sekolah dengan properti nama
      if (!item || !item.tipe_sekolah || !item.tipe_sekolah.nama) {
        console.log('Item tidak memiliki tipe_sekolah.nama:', item);
        return false;
      }
      
      // Cek apakah nama tipe sekolah sesuai dengan jenjang admin
      const namaTipeSekolah = item.tipe_sekolah.nama;
      
      // Khusus untuk Admin Bidang Kemenag, hanya tampilkan sekolah berbasis Islam
      if (idGrupUser === 7) {
        // Gunakan beberapa variasi nama untuk RA, MI, MTS untuk pencocokan yang lebih fleksibel
        const isAllowed = ['raudlatul', 'raudhatul', 'ra ', 'ra-', 'r.a', 'madrasah ibtidaiyah', 'mi ', 'mi-', 'm.i', 
                           'madrasah tsanawiyah', 'mts', 'mt-s', 'm.ts'].some(allowed => 
          namaTipeSekolah.toLowerCase().includes(allowed.toLowerCase())
        );
        
        if (!isAllowed) {
          console.log(`Item ditolak (Kemenag): ${item.nama}, tipe: ${namaTipeSekolah}`);
        }
        
        return isAllowed;
      }
      
      // Khusus untuk Admin Bidang PAUD/TK (mencegah interferensi)
      if (idGrupUser === 4) {
        // Tambahkan kriteria yang lebih ketat untuk TK
        // Cek untuk "Taman Kanak-kanak" atau "TK" tapi hindari untuk mencocokkan "MTS"
        const isPAUDTK = (
          namaTipeSekolah.toLowerCase().includes('taman kanak') || 
          namaTipeSekolah.toLowerCase().match(/\btk\b/) ||
          namaTipeSekolah.toLowerCase().match(/\bt\.k\b/) ||
          namaTipeSekolah.toLowerCase().includes('raudhat') || 
          namaTipeSekolah.toLowerCase().includes('raudlat') ||
          namaTipeSekolah.toLowerCase().match(/\bra\b/) ||
          namaTipeSekolah.toLowerCase().match(/\br\.a\b/)
        );
        
        if (!isPAUDTK) {
          console.log(`Item ditolak (PAUD/TK): ${item.nama}, tipe: ${namaTipeSekolah}`);
        }
        
        return isPAUDTK;
      }
      
      // Khusus untuk Admin Bidang SD (mencegah interferensi)
      if (idGrupUser === 5) {
        const isSD = (
          namaTipeSekolah.toLowerCase().includes('sekolah dasar') ||
          namaTipeSekolah.toLowerCase().match(/\bsd\b/) ||
          namaTipeSekolah.toLowerCase().match(/\bs\.d\b/) ||
          namaTipeSekolah.toLowerCase().includes('madrasah ibtidaiyah') ||
          namaTipeSekolah.toLowerCase().match(/\bmi\b/) ||
          namaTipeSekolah.toLowerCase().match(/\bm\.i\b/)
        );
        
        if (!isSD) {
          console.log(`Item ditolak (SD): ${item.nama}, tipe: ${namaTipeSekolah}`);
        }
        
        return isSD;
      }
      
      // Khusus untuk Admin Bidang SMP (mencegah interferensi)
      if (idGrupUser === 6) {
        const isSMP = (
          namaTipeSekolah.toLowerCase().includes('sekolah menengah pertama') ||
          namaTipeSekolah.toLowerCase().match(/\bsmp\b/) ||
          namaTipeSekolah.toLowerCase().match(/\bs\.m\.p\b/) ||
          namaTipeSekolah.toLowerCase().includes('madrasah tsanawiyah') ||
          namaTipeSekolah.toLowerCase().match(/\bmts\b/) ||
          namaTipeSekolah.toLowerCase().match(/\bm\.t\.s\b/)
        );
        
        if (!isSMP) {
          console.log(`Item ditolak (SMP): ${item.nama}, tipe: ${namaTipeSekolah}`);
        }
        
        return isSMP;
      }
      
      // Untuk kasus lain, gunakan daftar dari getTipeSekolahByRole
      const isAllowed = allowedTipeSekolah.some(allowed => 
        namaTipeSekolah.toLowerCase().includes(allowed.toLowerCase())
      );
      
      if (!isAllowed) {
        console.log(`Item ditolak: ${item.nama}, tipe: ${namaTipeSekolah}`);
      }
      
      return isAllowed;
    });
    
    console.log(`Data terfilter: ${filteredData.length} dari ${dataArray.length} item`);
    return filteredData;
  }, [userData, getTipeSekolahByRole]);

  // Fungsi untuk mengambil data dari backend
  const fetchData = useCallback(async () => {
    if (!initialized) return;
    
    try {
      setLoading(true);
      const headers = getHeaders();
      
      const endpoint = getEndpointByRole(tingkatan);
      
      console.log('Mengambil data dari:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesi anda telah berakhir, silahkan login kembali');
          setTimeout(() => {
            localStorage.removeItem('userData');
            window.location.href = '/login';
          }, 2000);
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data');
      }

      const result = await response.json();
      if (result.status) {
        // Log data asli untuk debugging
        console.log('Data dari server:', result.data);
        console.log('Tipe data dari server:', typeof result.data);
        console.log('Apakah array?', Array.isArray(result.data));
        
        if (result.data && result.data.length > 0) {
          console.log('Properti objek pertama:', Object.keys(result.data[0]));
        }
        
        // Filter data berdasarkan id_tipe_sekolah yang sesuai dengan role
        const filteredData = filterDataByTipeSekolah(result.data);
        
        console.log('Data setelah filter:', filteredData);
        console.log(`Jumlah data setelah filter: ${filteredData ? filteredData.length : 0}`);
        
        setData(filteredData || []);
      } else {
        toast.error(result.message || 'Terjadi kesalahan saat mengambil data');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mengambil data: ' + error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tingkatan, getEndpointByRole, initialized, filterDataByTipeSekolah]);

  // Ambil data user saat komponen mount
  useEffect(() => {
    const loadUserData = () => {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      setInitialized(true);
    };
    
    loadUserData();
  }, []);

  // Panggil fetchData saat tingkatan berubah atau userData berubah
  useEffect(() => {
    if (initialized) {
      fetchData();
    }
  }, [fetchData, initialized]);

  // Definisi pengelompokan kolom
  const kabupatenColumns = ['mendaftar_dalam', 'diterima_dalam', 'sisa_dalam'];
  const luarKabupatenColumns = ['mendaftar_luar', 'diterima_luar', 'sisa_luar'];
  const normalColumns = ['npsn', 'nama'];

  // Header text untuk merged header
  const mergedHeaders = {
    normal: '',
    Kabupaten: 'Kabupaten Blitar',
    luarkabupaten: 'Luar Kabupaten Blitar'
  };

  const columns = [
    { key: 'npsn', label: 'NPSN' },
    { key: 'nama', label: 'Nama Sekolah' },
    { key: 'mendaftar_dalam', label: 'Mendaftar' },
    { key: 'diterima_dalam', label: 'Diterima' },
    { key: 'sisa_dalam', label: 'Sisa' },
    { key: 'mendaftar_luar', label: 'Mendaftar' },
    { key: 'diterima_luar', label: 'Diterima' },
    { key: 'sisa_luar', label: 'Sisa' }
  ];

  // Fungsi untuk mendapatkan label "Semua" yang sesuai dengan jenjang admin
  const getSemualLabel = useCallback(() => {
    if (!userData) return 'Semua Tingkatan';
    
    const idGrupUser = parseInt(userData.id_grup_user) || 0;
    
    if (idGrupUser === 1) return 'Semua Tingkatan';
    if (idGrupUser === 4) return 'Semua PAUD/TK';
    if (idGrupUser === 5) return 'Semua SD/MI';
    if (idGrupUser === 6) return 'Semua SMP/MTS';
    if (idGrupUser === 7) return 'Semua Madrasah';
    
    return 'Semua Tingkatan';
  }, [userData]);

  // Fungsi untuk mendapatkan opsi tingkatan berdasarkan grup user
  const getTingkatanOptions = useCallback(() => {
    if (!userData) {
      return [
        { value: 'semua', label: 'Semua Tingkatan' }
      ];
    }
    
    const idGrupUser = parseInt(userData.id_grup_user) || 0;
    
    // SuperAdmin Dinas - semua opsi
    if (idGrupUser === 1) {
      return [
        { value: 'semua', label: 'Semua Tingkatan' },
        { value: '211', label: 'SD Negeri' },
        { value: '212', label: 'SD Swasta' },
        { value: '221', label: 'MI Negeri' },
        { value: '222', label: 'MI Swasta' },
        { value: '311', label: 'SMP Negeri' },
        { value: '312', label: 'SMP Swasta' },
        { value: '321', label: 'MTS Negeri' },
        { value: '322', label: 'MTS Swasta' }
      ];
    }
    
    // Admin Bidang PAUD/TK
    else if (idGrupUser === 4) {
      return [
        { value: 'semua', label: getSemualLabel() },
        { value: '112', label: 'TK' },
        { value: '122', label: 'RA' }
      ];
    }
    
    // Admin Bidang SD
    else if (idGrupUser === 5) {
      return [
        { value: 'semua', label: getSemualLabel() },
        { value: '211', label: 'SD Negeri' },
        { value: '212', label: 'SD Swasta' },
        { value: '221', label: 'MI Negeri' },
        { value: '222', label: 'MI Swasta' }
      ];
    }
    
    // Admin Bidang SMP
    else if (idGrupUser === 6) {
      return [
        { value: 'semua', label: getSemualLabel() },
        { value: '311', label: 'SMP Negeri' },
        { value: '312', label: 'SMP Swasta' },
        { value: '321', label: 'MTS Negeri' },
        { value: '322', label: 'MTS Swasta' }
      ];
    }
    
    // Admin Bidang Kemenag
    else if (idGrupUser === 7) {
      return [
        { value: 'semua', label: getSemualLabel() },
        { value: '122', label: 'RA' },
        { value: '221', label: 'MI Negeri' },
        { value: '222', label: 'MI Swasta' },
        { value: '321', label: 'MTS Negeri' },
        { value: '322', label: 'MTS Swasta' }
      ];
    }
    
    // Default jika tidak ada kondisi yang terpenuhi
    return [
      { value: 'semua', label: 'Semua Tingkatan' }
    ];
  }, [userData, getSemualLabel]);

  const tingkatanOptions = getTingkatanOptions();

  const handleChangeTingkatan = (value) => {
    setLoading(true);
    setTimeout(() => {
      setTingkatan(value);
    }, 100);
  };

  // Fungsi untuk mendapatkan judul halaman berdasarkan grup user
  const getPageTitle = useCallback(() => {
    if (!userData) return 'Siswa Belum Tertampung';
    
    const idGrupUser = parseInt(userData.id_grup_user) || 0;
    
    if (idGrupUser === 1) return 'Siswa Belum Tertampung';
    if (idGrupUser === 4) return 'Siswa Belum Tertampung - PAUD/TK';
    if (idGrupUser === 5) return 'Siswa Belum Tertampung - SD/MI';
    if (idGrupUser === 6) return 'Siswa Belum Tertampung - SMP/MTS';
    if (idGrupUser === 7) return 'Siswa Belum Tertampung - Madrasah';
    
    return 'Siswa Belum Tertampung';
  }, [userData]);

  return (
    <SuperAdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-2 sm:p-4">
              <Card className="h-full w-[calc(100vw-16px)] sm:w-full overflow-x-auto shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      {getPageTitle()}
                    </Typography>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Select 
                        key={userData ? userData.id_grup_user : 'loading'}
                        value={tingkatan} 
                        onChange={handleChangeTingkatan}
                        className="w-48 min-w-[192px]"
                        disabled={loading || !initialized}
                      >
                        {tingkatanOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <Typography>Loading...</Typography>
                    </div>
                  ) : (
                    <Table
                      data={data}
                      columns={columns}
                      searchable={true}
                      exportable={true}
                      pagination={true}
                      perPage={10}
                      showMergedHeader={true}
                      columnGroups={{
                        normal: normalColumns,
                        Kabupaten: kabupatenColumns,
                        luarkabupaten: luarKabupatenColumns
                      }}
                      mergedHeaders={mergedHeaders}
                      className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                    />
                  )}
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
};

export default BelumTampung;