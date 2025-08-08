import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Select, Option, Dialog } from "@material-tailwind/react";
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import { SaveButton } from '../../../components/element/Button/variant';
import { SuperAdminGuard } from '../../../utils/AuthGuard';
import PengalihanButton from '../../../components/element/Button/variant/PengalihanButton';
import PengalihanForm from './Components/PengalihanForm';
import { toast, ToastContainer } from 'react-toastify';


const KelolaBlmTampung = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tingkatan, setTingkatan] = useState('SEMUA');
  const [jalur, setJalur] = useState('semuaJalurPendaftaran');
  const [domisili, setDomisili] = useState('semuaDomisili');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPengalihanForm, setShowPengalihanForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = useCallback(() => {
    if (!userData || !userData.token) {
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      setTimeout(() => {
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }, 2000);
      return {};
    }

    return {
      'Authorization': `Bearer ${userData.token}`,
      'Content-Type': 'application/json'
    };
  }, [userData]);

  // Fungsi untuk mendapatkan nama tipe sekolah berdasarkan grup user
  const getTipeSekolahByRole = useCallback(() => {
    if (!userData) return [];
    
    const idGrupUser = userData.id_grup_user;
    
    if (idGrupUser === 1) {
      // SuperAdmin - semua tipe sekolah
      return [];
    } else if (idGrupUser === 4) {
      // Admin Bidang PAUD/TK
      return ["Taman Kanak-Kanak", "Raudlatul Athfal"];
    } else if (idGrupUser === 5) {
      // Admin Bidang SD
      return ["Sekolah Dasar Negeri", "Sekolah Dasar Swasta", "Madrasah Ibtidaiyah Negeri", "Madrasah Ibtidaiyah Swasta"];
    } else if (idGrupUser === 6) {
      // Admin Bidang SMP
      return ["Sekolah Menengah Pertama Negeri", "Sekolah Menengah Pertama Swasta", "Madrasah Tsanawiyah Negeri", "Madrasah Tsanawiyah Swasta"];
    } else if (idGrupUser === 7) {
      // Admin Bidang Kemenag
      return ["Raudlatul Athfal", "Madrasah Ibtidaiyah Negeri", "Madrasah Ibtidaiyah Swasta", "Madrasah Tsanawiyah Negeri", "Madrasah Tsanawiyah Swasta"];
    }
    
    return [];
  }, [userData]);

  // Fungsi untuk mendapatkan parameter jenjang berdasarkan grup user
  const getJenjangParam = useCallback(() => {
    if (!userData) return '';
    
    const idGrupUser = userData.id_grup_user;
    
    // Jika SuperAdmin, tidak perlu parameter jenjang
    if (idGrupUser === 1) return '';
    
    // Parameter jenjang sesuai bidang admin
    if (idGrupUser === 4) return 'jenjang=paud';
    if (idGrupUser === 5) return 'jenjang=sd';
    if (idGrupUser === 6) return 'jenjang=smp';
    if (idGrupUser === 7) return 'jenjang=kemenag';
    
    return '';
  }, [userData]);

  // Fungsi untuk memfilter data berdasarkan tipe sekolah
  const filterDataByTipeSekolah = useCallback((dataArray) => {
    if (!userData || !dataArray || dataArray.length === 0) return [];
    
    const idGrupUser = userData.id_grup_user;
    console.log('Filter data untuk grup user:', idGrupUser);
    
    // Jika SuperAdmin Dinas, tampilkan semua data
    if (idGrupUser === 1) {
      console.log('SuperAdmin: menampilkan semua data');
      return dataArray;
    }

    // Mapping id_tipe_sekolah untuk setiap jenjang
    const tipeSekolahMapping = {
      4: [112, 122],                // PAUD/TK: TK, RA
      5: [211, 212, 221, 222],      // SD: SDN, SDS, MIN, MIS
      6: [311, 312, 321, 322],      // SMP: SMPN, SMPS, MTSN, MTSS
      7: [122, 221, 222, 321, 322]  // Kemenag: RA, MIN, MIS, MTSN, MTSS
    };

    // Jika tidak ada mapping untuk grup user ini
    if (!tipeSekolahMapping[idGrupUser]) {
      console.log('Tidak ada mapping tipe sekolah untuk grup:', idGrupUser);
      return [];
    }

    // Mapping jenjang untuk identifikasi berdasarkan kode awal id_sekolah
    const jenjangMapping = {
      4: ['11', '12'],    // PAUD/TK: 11x, 12x
      5: ['21', '22'],    // SD: 21x, 22x
      6: ['31', '32'],    // SMP: 31x, 32x
      7: ['12', '22', '32'] // Kemenag: 12x (RA), 22x (MI), 32x (MTs)
    };

    // Mapping id_jenjang ke grup user
    const jenjangToGrupMapping = {
      1: [4],     // PAUD/TK (id_jenjang 1)
      2: [5, 7],  // SD/MI (id_jenjang 2) - bisa dilihat oleh admin SD dan Kemenag
      3: [6, 7]   // SMP/MTs (id_jenjang 3) - bisa dilihat oleh admin SMP dan Kemenag
    };

    // Filter data berdasarkan sekolah tujuan
    const filteredData = dataArray.filter(item => {
      const namaItem = item?.nama_siswa || 'Unknown';
      
      // Coba dapatkan id_tipe_sekolah dari berbagai tempat
      let tipeSekolahId = null;
      let namaSekolahTujuan = item?.asal_sekolah || 'Unknown';
      let matched = false;

      // Prioritas 1: Cek id_tipe_sekolah jika tersedia
      if (item?.id_tipe_sekolah) {
        tipeSekolahId = parseInt(item.id_tipe_sekolah);
        console.log(`${namaItem}: Menggunakan id_tipe_sekolah langsung:`, tipeSekolahId);
        if (tipeSekolahMapping[idGrupUser].includes(tipeSekolahId)) {
          console.log(`${namaItem}: id_tipe_sekolah ${tipeSekolahId} sesuai untuk grup ${idGrupUser}`);
          matched = true;
        }
      }
      
      // Prioritas 2: Cek id_sekolah_tujuan.id_tipe_sekolah jika tersedia
      if (!matched && item?.sekolah_tujuan_data?.id_tipe_sekolah) {
        tipeSekolahId = parseInt(item.sekolah_tujuan_data.id_tipe_sekolah);
        namaSekolahTujuan = item.sekolah_tujuan_data.nama || 'Unknown';
        console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan id_tipe_sekolah dari sekolah_tujuan_data:`, tipeSekolahId);
        if (tipeSekolahMapping[idGrupUser].includes(tipeSekolahId)) {
          console.log(`${namaItem}: id_tipe_sekolah ${tipeSekolahId} dari sekolah_tujuan sesuai untuk grup ${idGrupUser}`);
          matched = true;
        }
      }
      
      // Prioritas 3: Cek id_sekolah_asal.id_tipe_sekolah jika tersedia
      if (!matched && item?.sekolah_asal_data?.id_tipe_sekolah) {
        tipeSekolahId = parseInt(item.sekolah_asal_data.id_tipe_sekolah);
        namaSekolahTujuan = item.sekolah_asal_data.nama || 'Unknown';
        console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan id_tipe_sekolah dari sekolah_asal_data:`, tipeSekolahId);
        if (tipeSekolahMapping[idGrupUser].includes(tipeSekolahId)) {
          console.log(`${namaItem}: id_tipe_sekolah ${tipeSekolahId} dari sekolah_asal sesuai untuk grup ${idGrupUser}`);
          matched = true;
        }
      }

      // Fallback 1: Cek berdasarkan id_jenjang jika tersedia
      if (!matched && (item?.id_jenjang || item?.sekolah_tujuan_data?.id_jenjang || item?.sekolah_asal_data?.id_jenjang)) {
        const idJenjang = parseInt(item?.id_jenjang || item?.sekolah_tujuan_data?.id_jenjang || item?.sekolah_asal_data?.id_jenjang);
        const allowedGrups = jenjangToGrupMapping[idJenjang] || [];
        if (allowedGrups.includes(idGrupUser)) {
          console.log(`${namaItem} (${namaSekolahTujuan}): id_jenjang ${idJenjang} sesuai untuk grup ${idGrupUser}`);
          matched = true;
        }
      }

      // Fallback 2: Cek berdasarkan kode awal id_sekolah jika ada
      if (!matched && (item?.id_sekolah || item?.sekolah_tujuan_data?.id_sekolah || item?.sekolah_asal_data?.id_sekolah)) {
        const idSekolah = (item?.id_sekolah || item?.sekolah_tujuan_data?.id_sekolah || item?.sekolah_asal_data?.id_sekolah).toString();
        // Cek 2 digit awal dari id_sekolah untuk menentukan jenjang
        if (idSekolah.length >= 2) {
          const kodeAwal = idSekolah.substring(0, 2);
          const jenjangKodes = jenjangMapping[idGrupUser] || [];
          
          if (jenjangKodes.includes(kodeAwal)) {
            console.log(`${namaItem} (${namaSekolahTujuan}): kode awal id_sekolah ${kodeAwal} sesuai untuk grup ${idGrupUser}`);
            matched = true;
          }
        }
      }

      // Tambahkan log jika data ditolak
      if (!matched) {
        console.log(`${namaItem} (${namaSekolahTujuan}): DITOLAK karena tidak sesuai dengan kriteria grup ${idGrupUser}`);
      }

      return matched;
    });

    console.log(`Total data setelah filter untuk grup ${idGrupUser}:`, filteredData.length);
    return filteredData;
  }, [userData]);

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
          toast.error('Terjadi kesalahan saat memuat data pengguna');
          setTimeout(() => {
            localStorage.removeItem('userData');
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        toast.error('Sesi anda telah berakhir, silahkan login kembali');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      setInitialized(true);
    };
    
    loadUserData();
  }, []);

  // Fungsi untuk mengambil data dari backend
  const fetchData = useCallback(async () => {
    if (!initialized) return;
    
    try {
      setLoading(true);
      const headers = getHeaders();

      const tingkatanMap = {
        SEMUA: 'semuaTingkatan',
        TK: '112',
        RA: '122',
        SD: '211',
        SDS: '212',
        MI: '221',
        MIS: '222',
        SMP: '311',
        SMPS: '312',
        MTS: '321',
        MTSS: '322'
      };

      // Dapatkan parameter tingkatan yang sesuai
      let tingkatanParam = tingkatanMap[tingkatan] || tingkatan;
      
      // Tambahkan parameter jenjang jika user adalah admin bidang
      const jenjangParam = getJenjangParam();
      
      // Jika admin bidang dan memilih SEMUA, gunakan jenjang yang sesuai
      if (userData && userData.id_grup_user !== 1 && tingkatan === 'SEMUA') {
        console.log('Admin bidang memilih SEMUA tingkatan, menggunakan jenjang yang sesuai');
        // Tidak perlu mengubah tingkatanParam, karena kita akan filter di frontend
      }
      
      const separator = jenjangParam ? '?' : '';
      
      const endpoint = `${import.meta.env.VITE_API_URL}/pendaftaran/kelola-belum-tertampung/${tingkatanParam}/${jalur}/${domisili}${separator}${jenjangParam}`;
      
      console.log('Mengambil data dari:', endpoint);
      console.log('Parameter tingkatan:', tingkatanParam);
      console.log('Parameter jenjang:', jenjangParam);
      console.log('User grup:', userData?.id_grup_user);

      const response = await fetch(
        endpoint,
        {
          method: 'GET',
          headers: headers,
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data');
      }

      const result = await response.json();
      console.log('Data mentah dari API:', result);
      
      if (result.status) {
        // Transformasi data untuk memastikan struktur yang benar
        const formattedData = result.data.map(item => {
          // Jika item adalah string JSON, parse terlebih dahulu
          const dataItem = typeof item === 'string' ? JSON.parse(item) : item;
          console.log('Data item sebelum format:', dataItem);
          
          return {
            id_pendaftaran: dataItem.id_pendaftaran || dataItem.id || null,
            nik: dataItem.nik || '',
            nama_siswa: dataItem.nama_siswa || '',
            telepon: dataItem.telepon || '',
            alamat: dataItem.alamat || '',
            asal_sekolah: dataItem.asal_sekolah || '',
            jalur_pendaftaran: dataItem.jalur_pendaftaran || '',
            status: dataItem.status || 'Belum Tertampung',
            // Tambahkan properti penting untuk filtering
            id_tipe_sekolah: dataItem.id_tipe_sekolah || dataItem.sekolah_tujuan_data?.id_tipe_sekolah || dataItem.sekolah_asal_data?.id_tipe_sekolah || null,
            id_jenjang: dataItem.id_jenjang || dataItem.sekolah_tujuan_data?.id_jenjang || dataItem.sekolah_asal_data?.id_jenjang || null,
            id_sekolah: dataItem.id_sekolah || dataItem.sekolah_tujuan_data?.id_sekolah || dataItem.sekolah_asal_data?.id_sekolah || null,
            sekolah_tujuan_data: dataItem.sekolah_tujuan_data || null,
            sekolah_asal_data: dataItem.sekolah_asal_data || null
          };
        });

        console.log('Data setelah diformat:', formattedData);
        
        // Filter data berdasarkan role jika diperlukan
        const filteredData = filterDataByTipeSekolah(formattedData);
        console.log('Data setelah filter role:', filteredData);
        
        setData(filteredData);
      } else {
        toast.error(result.message || 'Terjadi kesalahan saat mengambil data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mengambil data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [tingkatan, jalur, domisili, initialized, filterDataByTipeSekolah, getJenjangParam, userData]);

  useEffect(() => {
    if (initialized) {
      fetchData();
    }
  }, [fetchData, initialized]);

  // Fungsi untuk mendapatkan opsi tingkatan berdasarkan grup user
  const getTingkatanOptions = useCallback(() => {
    if (!userData) {
      return schoolCategories;
    }
    
    const idGrupUser = userData.id_grup_user;
    
    // SuperAdmin Dinas - semua opsi
    if (idGrupUser === 1) {
      return schoolCategories;
    }
    
    // Admin Bidang PAUD/TK
    else if (idGrupUser === 4) {
      const filteredCategories = {};
      filteredCategories.SEMUA = { label: 'Semua TK/RA', ids: [112, 122] };
      filteredCategories.TK = schoolCategories.TK;
      filteredCategories.RA = schoolCategories.RA;
      return filteredCategories;
    }
    
    // Admin Bidang SD
    else if (idGrupUser === 5) {
      const filteredCategories = {};
      filteredCategories.SEMUA = { label: 'Semua SD/MI', ids: [211, 212, 221, 222] };
      filteredCategories.SD = schoolCategories.SD;
      filteredCategories.SDS = schoolCategories.SDS;
      filteredCategories.MI = schoolCategories.MI;
      filteredCategories.MIS = schoolCategories.MIS;
      return filteredCategories;
    }
    
    // Admin Bidang SMP
    else if (idGrupUser === 6) {
      const filteredCategories = {};
      filteredCategories.SEMUA = { label: 'Semua SMP/MTS', ids: [311, 312, 321, 322] };
      filteredCategories.SMP = schoolCategories.SMP;
      filteredCategories.SMPS = schoolCategories.SMPS;
      filteredCategories.MTS = schoolCategories.MTS;
      filteredCategories.MTSS = schoolCategories.MTSS;
      return filteredCategories;
    }
    
    // Admin Bidang Kemenag
    else if (idGrupUser === 7) {
      const filteredCategories = {};
      filteredCategories.SEMUA = { label: 'Semua RA/MI/MTS', ids: [122, 221, 222, 321, 322] };
      filteredCategories.RA = schoolCategories.RA;
      filteredCategories.MI = schoolCategories.MI;
      filteredCategories.MIS = schoolCategories.MIS;
      filteredCategories.MTS = schoolCategories.MTS;
      filteredCategories.MTSS = schoolCategories.MTSS;
      return filteredCategories;
    }
    
    return schoolCategories;
  }, [userData]);

  // Data untuk filter
  const schoolCategories = {
    SEMUA: { label: 'Semua Tingkatan', ids: [112, 122, 211, 212, 221, 222, 311, 312, 321, 322] },
    TK: { label: 'TK', ids: [112] },
    RA: { label: 'RA', ids: [122] },
    SD: { label: 'SD Negeri', ids: [211, 212] },
    SDS: { label: 'SD Swasta', ids: [212] },
    MI: { label: 'MI Negeri', ids: [221, 222] },
    MIS: { label: 'MI Swasta', ids: [222] },
    SMP: { label: 'SMP Negeri', ids: [311, 312] },
    SMPS: { label: 'SMP Swasta', ids: [312] },
    MTS: { label: 'MTS Negeri', ids: [321, 322] },
    MTSS: { label: 'MTS Swasta', ids: [322] }
  };

  const jalurOptions = [
    { value: 'semuaJalurPendaftaran', label: 'Semua Jalur' },
    { value: '1', label: 'Zonasi' },
    { value: '2', label: 'Prestasi' },
    { value: '3', label: 'Pindahan' },
    { value: '4', label: 'Afirmasi' },
    { value: '5', label: 'Reguler' }
  ];

  const domisiliOptions = [
    { value: 'semuaDomisili', label: 'Semua Domisili' },
    { value: '3505', label: 'Dalam Kabupaten' },
    { value: 'luar', label: 'Luar Kabupaten' }
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const columns = [
    { key: 'nik', label: 'NIK' },
    { key: 'telepon', label: 'Telepon' },
    { key: 'nama_siswa', label: 'Nama Siswa' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'asal_sekolah', label: 'Asal Sekolah' },
    { 
      key: 'pengalihan', 
      label: 'Pengalihan',
      render: (value, item) => {
        // Pastikan item memiliki id_pendaftaran sebelum render button
        if (!item || !item.id_pendaftaran) {
          console.warn('Item tidak memiliki id_pendaftaran:', item);
          return null;
        }
        
        return (
          <div onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
            <PengalihanButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tombol diklik dengan item:', item);
                handlePengalihanClick(item);
              }}
            />
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
          Belum Tertampung
        </span>
      )
    }
  ];

  const handleChangeTingkatan = (value) => {
    setTingkatan(value);
  };

  const handleChangeJalur = (value) => {
    setJalur(value);
  };

  const handleChangeDomisili = (value) => {
    setDomisili(value);
  };

  const handlePengalihanClick = (item) => {
    console.log('Item yang diklik:', item);
    
    if (!item || !item.id_pendaftaran) {
      toast.error('Data pendaftaran tidak valid');
      console.error('Data tidak valid:', item);
      return;
    }
    
    setSelectedItem(item);
    setShowPengalihanForm(true);
  };

  const handlePengalihanSubmit = async (updatedData) => {
    try {
      const headers = getHeaders();
      
      // Pastikan ada id_pendaftaran
      if (!selectedItem?.id_pendaftaran) {
        throw new Error('ID Pendaftaran tidak ditemukan');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pendaftaran/kelola-belum-tertampung/${selectedItem.id_pendaftaran}`,
        {
          method: 'PUT',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify(updatedData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengupdate data');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Data berhasil diupdate');
        fetchData(); // Refresh data
      } else {
        throw new Error(result.message || 'Gagal mengupdate data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      toast.error(error.message);
    } finally {
      setShowPengalihanForm(false);
      setSelectedItem(null);
    }
  };

  const handleSimpan = () => {
    toast.success('Pengalihan berhasil disimpan');
    fetchData(); // Refresh data setelah menyimpan
  };

  // Handler untuk menutup form pengalihan
  const handleClosePengalihanForm = () => {
    setShowPengalihanForm(false);
    setSelectedItem(null);
  };

  // Handler untuk refresh data setelah pengalihan berhasil
  const handlePengalihanSuccess = async () => {
    try {
      setLoading(true);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Gagal memperbarui data');
    } finally {
      setLoading(false);
    }
  };

  // Ambil tingkatan options berdasarkan role
  const availableTingkatanOptions = getTingkatanOptions();

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
                      Pengelolaan Siswa Belum Tertampung
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Select 
                      value={tingkatan}
                      onChange={handleChangeTingkatan}
                      label="Tingkatan"
                    >
                      {Object.entries(availableTingkatanOptions).map(([key, { label }]) => (
                        <Option key={key} value={key}>
                          {label}
                        </Option>
                      ))}
                    </Select>

                    <Select 
                      value={jalur} 
                      onChange={handleChangeJalur}
                      label="Jalur Pendaftaran"
                    >
                      {jalurOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>

                    <Select 
                      value={domisili} 
                      onChange={handleChangeDomisili}
                      label="Domisili"
                    >
                      {domisiliOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>

                    <div className="flex items-end">
                      <SaveButton onClick={handleSimpan}>
                        Simpan Pengalihan
                      </SaveButton>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      <span className="ml-3">Memuat data...</span>
                    </div>
                  ) : (
                    <Table
                      data={data}
                      columns={columns}
                      searchable={true}
                      exportable={true}
                      pagination={true}
                      perPage={10}
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

      {/* Form Pengalihan */}
      {showPengalihanForm && (
        <PengalihanForm
          open={showPengalihanForm}
          data={selectedItem}
          onClose={handleClosePengalihanForm}
          onSuccess={handlePengalihanSuccess}
        />
      )}  

      {/* ToastContainer untuk notifikasi */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </SuperAdminGuard>
  );
};

export default KelolaBlmTampung;