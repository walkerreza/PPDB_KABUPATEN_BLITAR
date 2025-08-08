import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import { AddButton, DownloadButton, EditButton, DeleteButton } from '../../../components/element/Button/variant';
import FormDialog from '../../../components/dialog/FormDialog';
import useFormDialog from '../../../components/dialog/useFormDialog';
import DeleteDialog from '../../../components/dialog/DeleteDialog';
import PendaftarForm from '../Components/PendaftarForm';
import { SuperAdminGuard } from '../../../utils/AuthGuard';
import toast from 'react-hot-toast';

const DaftarPendaftar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const formDialog = useFormDialog();
  const [deleteDialog, setDeleteDialog] = useState({ open: false, data: null });
  const [pendaftarList, setPendaftarList] = useState([]);
  const [userData, setUserData] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const tableRef = useRef(null);

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = useCallback((includeContentType = true) => {
    if (!userData || !userData.token) {
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      setTimeout(() => {
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }, 2000);
      return new Headers();
    }

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${userData.token}`);
    
    if (includeContentType) {
      headers.append('Content-Type', 'application/json');
    }
    
    return headers;
  }, [userData]);

  // Fungsi untuk handle unauthorized response
  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali');
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Fungsi untuk mendapatkan parameter jenjang berdasarkan grup user
  const getJenjangParam = useCallback(() => {
    if (!userData) return '';
    
    const idGrupUser = userData.id_grup_user;
    console.log('Get jenjang param untuk grup user:', idGrupUser);
    
    // Jika SuperAdmin, tidak perlu parameter jenjang
    if (idGrupUser === 1) {
      console.log('SuperAdmin: tidak menggunakan filter jenjang');
      return '';
    }
    
    // Parameter jenjang sesuai bidang admin
    const jenjangMapping = {
      4: 'jenjang=paud',    // Admin PAUD/TK -> lihat pendaftar TK/PAUD
      5: 'jenjang=sd',      // Admin SD -> lihat pendaftar SD/MI
      6: 'jenjang=smp',     // Admin SMP -> lihat pendaftar SMP/MTs
      7: 'jenjang=kemenag'  // Admin Kemenag -> lihat pendaftar RA/MI/MTs
    };
    
    const param = jenjangMapping[idGrupUser] || '';
    console.log('Parameter jenjang yang digunakan:', param);
    return param;
  }, [userData]);

  // Fungsi untuk memfilter data berdasarkan tipe sekolah tujuan
  const filterData = useCallback((dataArray) => {
    if (!dataArray || !Array.isArray(dataArray)) {
      console.log('Data array kosong atau invalid');
      return [];
    }

    const idGrupUser = userData?.id_grup_user;
    console.log('Filter data untuk grup user:', idGrupUser);

    // Jika SuperAdmin, tampilkan semua data
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

    // Mapping slug ke id_tipe_sekolah
    const slugToIdMapping = {
      'TK': 112,
      'RA': 122,
      'SDN': 211,
      'SDS': 212,
      'MIN': 221,
      'MIS': 222,
      'MI': 221,  // MI (tanpa N/S) untuk menangkap MI secara umum
      'SMPN': 311,
      'SMPS': 312,
      'MTSN': 321,
      'MTSS': 322,
      'MTS': 321  // MTS (tanpa N/S) untuk menangkap MTS secara umum
    };

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
      // Jika tidak ada data sekolah tujuan, tolak
      if (!item?.raw?.sekolah_tujuan_data) {
        console.log(`${item?.nama || 'Unknown'}: Tidak ada data sekolah tujuan, ditolak`);
        return false;
      }

      const namaItem = item?.nama || 'Unknown';
      const sekolahTujuan = item.raw.sekolah_tujuan_data;
      const namaSekolahTujuan = sekolahTujuan.nama || 'Unknown';
      
      // Coba dapatkan id_tipe_sekolah dari berbagai tempat
      let tipeSekolahId = null;

      // Prioritas 1: id_tipe_sekolah dari sekolah_tujuan_data
      if (sekolahTujuan.id_tipe_sekolah) {
        tipeSekolahId = parseInt(sekolahTujuan.id_tipe_sekolah);
        console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan id_tipe_sekolah dari sekolah_tujuan_data:`, tipeSekolahId);
      }
      // Prioritas 2: id_tipe_sekolah dari tipe_sekolah
      else if (sekolahTujuan.tipe_sekolah?.id_tipe_sekolah) {
        tipeSekolahId = parseInt(sekolahTujuan.tipe_sekolah.id_tipe_sekolah);
        console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan id_tipe_sekolah dari tipe_sekolah:`, tipeSekolahId);
      }
      // Prioritas 3: Coba dapatkan dari slug
      else if (sekolahTujuan.tipe_sekolah?.slug) {
        const slug = sekolahTujuan.tipe_sekolah.slug.toUpperCase();
        if (slugToIdMapping[slug]) {
          tipeSekolahId = slugToIdMapping[slug];
          console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan id_tipe_sekolah dari slug:`, slug, '->', tipeSekolahId);
        }
      }
      // Prioritas 4: Coba dapatkan dari nama sekolah tujuan (hanya untuk kode tipe sekolah)
      else if (namaSekolahTujuan) {
        const namaSekolah = namaSekolahTujuan.toUpperCase();
        console.log(`${namaItem}: Memeriksa nama sekolah tujuan untuk kode tipe:`, namaSekolah);
        
        // Cek apakah nama mengandung kode tipe sekolah (SDN, MIN, dll)
        for (const [slug, id] of Object.entries(slugToIdMapping)) {
          // Pastikan kita mencari kode yang diikuti spasi atau di akhir nama
          // untuk menghindari false positive (mis. MISTER tidak akan cocok dengan MIS)
          if (namaSekolah.includes(slug + ' ') || namaSekolah.includes(slug + '-') || 
              namaSekolah.endsWith(slug)) {
            tipeSekolahId = id;
            console.log(`${namaItem} (${namaSekolahTujuan}): Menemukan kode ${slug} dalam nama sekolah -> id_tipe_sekolah:`, tipeSekolahId);
            break;
          }
        }
      }

      // Jika berhasil mendapatkan id_tipe_sekolah, cek apakah sesuai dengan mapping
      if (tipeSekolahId !== null) {
        const allowed = tipeSekolahMapping[idGrupUser].includes(tipeSekolahId);
        console.log(`${namaItem} (${namaSekolahTujuan}): id_tipe_sekolah ${tipeSekolahId} untuk grup ${idGrupUser}: ${allowed ? 'Diizinkan' : 'Ditolak'}`);
        return allowed;
      }

      // Fallback 1: Cek berdasarkan id_jenjang jika tersedia
      if (sekolahTujuan.id_jenjang) {
        const idJenjang = parseInt(sekolahTujuan.id_jenjang);
        const allowedGrups = jenjangToGrupMapping[idJenjang] || [];
        const allowed = allowedGrups.includes(idGrupUser);
        console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan id_jenjang ${idJenjang} untuk grup ${idGrupUser}: ${allowed ? 'Diizinkan' : 'Ditolak'}`);
        return allowed;
      }

      // Fallback 2: Cek berdasarkan kode awal id_sekolah
      if (sekolahTujuan.id_sekolah) {
        const idSekolah = sekolahTujuan.id_sekolah.toString();
        // Cek 2 digit awal dari id_sekolah untuk menentukan jenjang
        if (idSekolah.length >= 2) {
          const kodeAwal = idSekolah.substring(0, 2);
          const jenjangKodes = jenjangMapping[idGrupUser] || [];
          
          const jenjangMatch = jenjangKodes.includes(kodeAwal);
          console.log(`${namaItem} (${namaSekolahTujuan}): Menggunakan kode awal id_sekolah ${kodeAwal} untuk grup ${idGrupUser}: ${jenjangMatch ? 'Diizinkan' : 'Ditolak'}`);
          return jenjangMatch;
        }
      }

      // Jika tidak bisa menentukan jenjang dengan cara apapun, izinkan data untuk menghindari kehilangan data
      console.log(`${namaItem} (${namaSekolahTujuan}): Tidak dapat menentukan jenjang sekolah tujuan, DIIZINKAN untuk menghindari kehilangan data`);
      return true;
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

  const fetchPendaftar = useCallback(async () => {
    if (!initialized) return;
    
    try {
      setLoading(true);
      const headers = getHeaders();
      
      // Tambahkan parameter jenjang jika user adalah admin bidang
      const jenjangParam = getJenjangParam();
      const endpoint = `${import.meta.env.VITE_API_URL}/pendaftaran${jenjangParam ? `?${jenjangParam}` : ''}`;
      
      console.log('Mengambil data dari endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized: Token tidak valid atau kadaluarsa');
          handleUnauthorized();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Response dari API:', {
        status: result.status,
        message: result.message,
        totalData: result.data?.length || 0
      });
      
      if (!result.data || !Array.isArray(result.data)) {
        console.error('Data tidak valid:', result);
        toast.error('Format data tidak valid');
        return;
      }

      // Log contoh data pertama untuk melihat struktur lengkap
      if (result.data.length > 0) {
        console.log('Contoh struktur data dari API:', {
          item: result.data[0],
          sekolahTujuanData: result.data[0]?.sekolah_tujuan_data || 'Tidak ada',
          idTipeSekolah: result.data[0]?.sekolah_tujuan_data?.id_tipe_sekolah || 'Tidak ada',
          tipeSekolah: result.data[0]?.sekolah_tujuan_data?.tipe_sekolah || 'Tidak ada'
        });
      }

      // Transform data dengan informasi lengkap
      const transformedData = result.data.map(item => {
        // Coba dapatkan id_tipe_sekolah dari berbagai tempat
        let idTipeSekolah = null;
        if (item?.sekolah_tujuan_data?.id_tipe_sekolah) {
          idTipeSekolah = item.sekolah_tujuan_data.id_tipe_sekolah;
        } else if (item?.sekolah_tujuan_data?.tipe_sekolah?.id_tipe_sekolah) {
          idTipeSekolah = item.sekolah_tujuan_data.tipe_sekolah.id_tipe_sekolah;
        }

        console.log('Processing item:', {
          id: item.id_pendaftaran,
          nama: item.nama_siswa,
          sekolahTujuan: item.sekolah_tujuan_data?.nama || 'Tidak ada',
          idTipeSekolah: idTipeSekolah || 'Tidak ditemukan'
        });

        return {
          id_pendaftaran: item.id_pendaftaran,
          nik: item.nik || '',
          nisn: item.nisn,
          nama: item.nama_siswa,
          nama_ayah: item.nama_ayah || '-',
          nama_ibu: item.nama_ibu || '-',
          tempat_tanggal_lahir: `${item.tempat_lahir}, ${moment(item.tanggal_lahir).format('DD-MM-YYYY')}`,
          sekolah_asal: item.sekolah_asal || item.sekolah_asal_data?.nama || '-',
          sekolah_tujuan: item.sekolah_tujuan_data?.nama || '-',
          sesuai_titik_dapodik: item.sesuai_titik_dapodik === 1,
          raw: item,
          identifier: item.nik || item.nisn
        };
      });

      console.log('Data setelah transformasi:', {
        total: transformedData.length,
        sample: transformedData[0] ? {
          id: transformedData[0].id_pendaftaran,
          nama: transformedData[0].nama,
          raw: transformedData[0].raw ? 'Ada' : 'Tidak ada'
        } : 'No data'
      });

      // Filter data berdasarkan role
      const filteredData = filterData(transformedData);
      console.log('Data setelah filter:', {
        totalSebelum: transformedData.length,
        totalSetelah: filteredData.length
      });
      
      setPendaftarList(filteredData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mengambil data pendaftar');
    } finally {
      setLoading(false);
    }
  }, [initialized, getHeaders, getJenjangParam, filterData]);

  useEffect(() => {
    if (initialized) {
      fetchPendaftar();
    }
  }, [fetchPendaftar, initialized]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleDownloadLaporan = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/export/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_PPDB_${moment().format('YYYY-MM-DD')}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleDownloadRekapitulasi = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/export/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rekapitulasi_PPDB_${moment().format('YYYY-MM-DD')}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleTambahPendaftar = () => {
    setFormData({});
    formDialog.openAdd();
  };

  const handleEdit = (identifier) => {
    // Cari pendaftar berdasarkan identifier yang tepat sama
    const pendaftar = pendaftarList.find(item => item.identifier === identifier);
    
    if (pendaftar?.raw) {
      // Log untuk debugging
      console.log('Editing pendaftar with identifier:', identifier);
      console.log('Found pendaftar data:', pendaftar);
      
      // Ambil data mentah dari raw
      const formDataEdit = {
        id_pendaftaran: pendaftar.raw.id_pendaftaran,
        nik: pendaftar.raw.nik || '',
        nisn: pendaftar.raw.nisn,
        nama_siswa: pendaftar.raw.nama_siswa,
        tempat_lahir: pendaftar.raw.tempat_lahir,
        tanggal_lahir: pendaftar.raw.tanggal_lahir,
        id_jenis_kelamin: pendaftar.raw.id_jenis_kelamin?.toString(),
        nama_ayah: pendaftar.raw.nama_ayah || '',  // Tambah field nama ayah
        nama_ibu: pendaftar.raw.nama_ibu || '',    // Tambah field nama ibu
        // nama_orang_tua: pendaftar.raw.nama_orang_tua,  // Hapus field lama
        nomor_telepon: pendaftar.raw.nomor_telepon,
        id_provinsi: pendaftar.raw.id_provinsi,
        id_kabupaten_kota: pendaftar.raw.id_kabupaten_kota,
        id_kecamatan: pendaftar.raw.id_kecamatan,
        id_kelurahan: pendaftar.raw.id_kelurahan,
        alamat: pendaftar.raw.alamat,
        latitude: pendaftar.raw.latitude,
        longitude: pendaftar.raw.longitude,
        sekolah_asal: pendaftar.raw.sekolah_asal,
        pilihan_sekolah: pendaftar.raw.pilihan_sekolah,
        // Tambahkan field lain yang diperlukan
        id_sekolah_tujuan: pendaftar.raw.id_sekolah_tujuan,
        id_jalur_pendaftaran: pendaftar.raw.id_jalur_pendaftaran,
        tahun_lulus: pendaftar.raw.tahun_lulus,
        id_tipe_sekolah_asal: pendaftar.raw.id_tipe_sekolah_asal,
        id_sekolah_asal: pendaftar.raw.id_sekolah_asal,
        // Tentukan status isSekolahTidakTerdaftar berdasarkan data
        isSekolahTidakTerdaftar: pendaftar.raw.sekolah_asal && !pendaftar.raw.id_sekolah_asal
      };
      
      // Jika sekolah tidak terdaftar, isi field nama_sekolah_manual
      if (formDataEdit.isSekolahTidakTerdaftar && formDataEdit.sekolah_asal) {
        // Coba ekstrak tipe sekolah dari sekolah_asal (jika formatnya "TK Nama" atau "SD Nama")
        const match = formDataEdit.sekolah_asal.match(/^(TK|SD)\s+(.+)$/);
        if (match) {
          formDataEdit.tipe_sekolah_manual = match[1];
          formDataEdit.nama_sekolah_manual = match[2];
        } else {
          formDataEdit.nama_sekolah_manual = formDataEdit.sekolah_asal;
        }
      }
      
      setFormData(formDataEdit);
      formDialog.openEdit();
    } else {
      toast.error('Data pendaftar tidak ditemukan');
    }
  };

  const handleDelete = (identifier, rawData) => {
    try {
      // Gunakan data yang sudah ada dari parameter, tidak perlu mencari lagi
      if (rawData?.id_pendaftaran) {
        console.log('Data yang akan dihapus:', rawData); // Debug
        
        setDeleteDialog({ 
          open: true, 
          data: rawData // Gunakan data mentah yang berisi id_pendaftaran
        });
      } else {
        throw new Error('ID Pendaftaran tidak ditemukan');
      }
    } catch (error) {
      console.error('Error preparing delete:', error);
      toast.error('Gagal mempersiapkan penghapusan data: ' + error.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.data?.id_pendaftaran) {
      toast.error('ID Pendaftaran tidak valid');
      return;
    }

    try {
      setLoading(true);
      const headers = getHeaders();
      
      // Log request details
      console.log('Deleting pendaftaran with ID:', deleteDialog.data.id_pendaftaran);
      console.log('Request headers:', Object.fromEntries(headers.entries()));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/${deleteDialog.data.id_pendaftaran}`, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include'
      });

      // Log response status
      console.log('Response status:', response.status);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 404) {
        throw new Error('Data pendaftaran tidak ditemukan');
      }

      // Try to parse response as text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Format response dari server tidak valid');
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Terjadi kesalahan saat menghapus data');
      }

      // Jika berhasil
      toast.success(responseData.message || 'Data berhasil dihapus');
      
      // Tutup dialog
      setDeleteDialog({ open: false, data: null });
      
      // Update state secara langsung tanpa fetch ulang
      setPendaftarList(prevList => 
        prevList.filter(item => item.id_pendaftaran !== deleteDialog.data.id_pendaftaran)
      );
      
    } catch (error) {
      console.error('Error deleting pendaftar:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific error messages
      let errorMessage = 'Gagal menghapus data';
      
      if (error.message.includes('not found') || error.message.includes('tidak ditemukan')) {
        errorMessage = 'Data pendaftaran tidak ditemukan';
      } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        errorMessage = 'Data tidak dapat dihapus karena masih terkait dengan data lain';
      } else if (error.message.includes('Format response')) {
        errorMessage = 'Terjadi kesalahan pada server';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, data: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi data wajib
      const requiredFields = [
        'nisn', 'nama_siswa', 'tempat_lahir', 'tanggal_lahir', 'id_jenis_kelamin',
        'alamat', 'nomor_telepon', 'id_provinsi', 'id_kabupaten_kota', 'id_kecamatan',
        'id_kelurahan', 'id_sekolah_tujuan', 'id_jalur_pendaftaran', 'tahun_lulus'
      ];

      for (const field of requiredFields) {
        if (!formData[field]) {
          toast.error(`Field ${field.replace('id_', '')} wajib diisi`);
          setLoading(false);
          return;
        }
      }

      // Validasi tambahan untuk memastikan field numeric tidak NaN
      const numericFields = [
        'id_provinsi', 'id_kabupaten_kota', 'id_kecamatan', 'id_kelurahan',
        'id_sekolah_tujuan', 'id_jalur_pendaftaran', 'id_jenis_kelamin', 'tahun_lulus'
      ];

      for (const field of numericFields) {
        if (formData[field] && isNaN(parseInt(formData[field]))) {
          toast.error(`Field ${field.replace('id_', '')} harus berupa angka`);
          setLoading(false);
          return;
        }
      }

      // Siapkan data yang akan dikirim
      const dataToSend = {
        ...formData,
        // Konversi field ID ke integer jika ada nilainya
        id_provinsi: formData.id_provinsi ? parseInt(formData.id_provinsi) : null,
        id_kabupaten_kota: formData.id_kabupaten_kota ? parseInt(formData.id_kabupaten_kota) : null,
        id_kecamatan: formData.id_kecamatan ? parseInt(formData.id_kecamatan) : null,
        id_kelurahan: formData.id_kelurahan ? parseInt(formData.id_kelurahan) : null,
        id_sekolah_tujuan: formData.id_sekolah_tujuan ? parseInt(formData.id_sekolah_tujuan) : null,
        id_jalur_pendaftaran: formData.id_jalur_pendaftaran ? parseInt(formData.id_jalur_pendaftaran) : null,
        id_jenis_kelamin: formData.id_jenis_kelamin ? parseInt(formData.id_jenis_kelamin) : null,
        tahun_lulus: formData.tahun_lulus ? parseInt(formData.tahun_lulus) : null,
        // Pastikan id_tipe_sekolah_asal dan id_sekolah_asal adalah integer atau null
        id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal ? parseInt(formData.id_tipe_sekolah_asal) : null,
        id_sekolah_asal: formData.id_sekolah_asal ? parseInt(formData.id_sekolah_asal) : null,
        // Konversi koordinat ke float
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      // Jika sekolah tidak terdaftar, gunakan nilai dari tipe_sekolah_manual dan nama_sekolah_manual
      if (formData.isSekolahTidakTerdaftar && formData.nama_sekolah_manual) {
        const tipeSekolah = formData.tipe_sekolah_manual || '';
        const namaSekolah = formData.nama_sekolah_manual.trim();
        
        // Simpan nama sekolah saja tanpa prefiks tipe sekolah untuk menghindari duplikasi
        dataToSend.sekolah_asal = namaSekolah;
        
        // Set id_sekolah_asal ke null karena menggunakan input manual
        dataToSend.id_sekolah_asal = null;
        
        // Mapping tipe_sekolah_manual ke id_tipe_sekolah_asal (integer)
        if (tipeSekolah === 'TK') {
          dataToSend.id_tipe_sekolah_asal = 112; // ID untuk TK
        } else if (tipeSekolah === 'SD') {
          dataToSend.id_tipe_sekolah_asal = 211; // ID untuk SD
        } else {
          dataToSend.id_tipe_sekolah_asal = null;
        }
      }

      console.log('Sending data:', dataToSend); // Debug

      // Tentukan URL berdasarkan mode (add/edit)
      const url = formDialog.mode === 'add' 
        ? `${import.meta.env.VITE_API_URL}/pendaftaran/create-without-nik`
        : `${import.meta.env.VITE_API_URL}/pendaftaran/update-without-nik/${formData.id_pendaftaran}`;
      
      const response = await fetch(url, {
        method: formDialog.mode === 'add' ? 'POST' : 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Terjadi kesalahan saat menyimpan data');
      }

      toast.success(responseData.message || 'Data berhasil disimpan');
      formDialog.close(); // Tutup form dialog
      fetchPendaftar(); // Refresh data tabel

    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
  };

  const columns = [
    { 
      key: 'identifier', 
      label: 'NIK', 
      render: (value, data) => {
        // Hanya tampilkan NIK jika ada
        return data.nik || '-';
      }
    },
    { key: 'nama', label: 'Nama' },
    // { key: 'nama_ayah', label: 'Nama Ayah' },
    // { key: 'nama_ibu', label: 'Nama Ibu' },
    { 
      key: 'tempat_tanggal_lahir', 
      label: 'Tempat, Tanggal Lahir'
    },
    { key: 'sekolah_asal', label: 'Sekolah Asal' },
    { key: 'sekolah_tujuan', label: 'Sekolah Tujuan' },
    { 
      key: 'sesuai_titik_dapodik', 
      label: 'Sesuai Titik Dapodik',
      render: (value) => (
        <div className="flex justify-center">
          {value && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (_, data) => (
        <div className="flex gap-2">
          <EditButton 
            size="sm"
            className="bg-blue-500"
            onClick={() => handleEdit(data.identifier)}
          >
            Edit
          </EditButton>
          <DeleteButton 
            size="sm"
            className="bg-red-500"
            onClick={() => handleDelete(data.identifier, data.raw)}
          >
            Hapus
          </DeleteButton>
        </div>
      )
    }
  ];

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
                      Siswa Diterima
                    </Typography>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <DownloadButton onClick={handleDownloadLaporan}>
                        <i className="fas fa-download mr-2"></i>
                        Laporan Siswa Diterima
                      </DownloadButton>
                      <DownloadButton onClick={handleDownloadRekapitulasi}>
                        <i className="fas fa-download mr-2"></i>
                        Download Rekapitulasi PPDB
                      </DownloadButton>
                      <AddButton onClick={handleTambahPendaftar}>
                        <i className="fas fa-plus mr-2"></i>
                        Tambah Pendaftar Non KK
                      </AddButton>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <Table
                      ref={tableRef}
                      data={pendaftarList}
                      columns={columns}
                      searchable={true}
                      pagination={true}
                      perPage={20}
                      className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                    />
                  )}
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>

        <FormDialog
          open={formDialog.isOpen}
          onClose={formDialog.close}
          title={formDialog.mode === 'add' ? "Tambah Pendaftar Non KK" : "Edit Pendaftar Non KK"}
          onSubmit={handleSubmit}
          loading={loading}
          size="xl"
        >
          <PendaftarForm 
            formData={formData}
            onChange={handleFormChange}
            isEditMode={formDialog.mode === 'edit'}
          />
        </FormDialog>

        <DeleteDialog
          open={deleteDialog.open}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          loading={loading}
          title="Hapus Pendaftar"
          message={`Apakah Anda yakin ingin menghapus data pendaftar ${deleteDialog.data?.nik ? `dengan NIK: ${deleteDialog.data.nik}` : `dengan NISN: ${deleteDialog.data?.nisn || ''}`} (${deleteDialog.data?.nama_siswa || ''})?`}
        />
      </div>
    </SuperAdminGuard>
  );
};

export default DaftarPendaftar;