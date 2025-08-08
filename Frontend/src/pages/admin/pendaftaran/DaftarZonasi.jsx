import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Typography, Tabs, TabsHeader, TabsBody, Tab, TabPanel, Input, Select, Option, Button } from "@material-tailwind/react";
import AdminHeader from '../../../components/common/admin/AdminHeader';
import AdminSidebar from '../../../components/common/admin/AdminSidebar';
import AdminFooter from '../../../components/common/admin/AdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import TableContainer from '../../../components/table/TableVariant/components/TableContainer';
import { InputField, SelectField, CheckboxField } from '../../../components/forms/FormsVariant/Forms';
import TableForm from '../../../components/forms/FormsVariant/Component/tableForm';
import ExtendDaftarZonasi from './daftarextend/extendDaftarZonasi';
import { AdminGuard } from '../../../utils/AuthGuard';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { FaSearch } from 'react-icons/fa';
import { calculateDistance } from '../../../utils/distance';
import moment from 'moment-timezone';

// Komponen tabel untuk menampilkan data
const TableComponent = React.memo(({ headers }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-max table-auto text-left">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Data akan ditampilkan di sini */}
      </tbody>
    </table>
  </div>
));

// Komponen form pendaftaran
const RegistrationForm = React.memo(() => {
  // Ambil data user dari localStorage
  const [userData, setUserData] = useState(() => {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  });

  // State untuk menyimpan data form
  const [formData, setFormData] = useState({
    nik: '',
    nisn: '',
    nama: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    nama_ayah: '',
    nama_ibu: '',
    nomor_telepon: '',
    alamat: '',
    id_provinsi: '',
    id_kabupaten_kota: '',
    id_kecamatan: '',
    id_kelurahan: '',
    latitude: '',
    longitude: '',
    id_tipe_sekolah_asal: '',
    nama_sekolah_asal: '',
    tidak_ada_sekolah: false,
    id_tipe_sekolah_asal_manual: '',
    nama_sekolah_manual: '',
    tahun_lulus: '',
    jalur_pendaftaran: '1', // Default ke jalur zonasi
    sekolah_tujuan: userData?.sekolah?.id_sekolah || '',
    keterangan: '',
    pernyataan: false // Tambahkan state pernyataan
  });

  // State untuk menampilkan form extend
  const [showExtend, setShowExtend] = useState(false);

  // State untuk menyimpan opsi wilayah administratif
  const [provinsiOptions, setProvinsiOptions] = useState([]);
  const [kabupatenOptions, setKabupatenOptions] = useState([]);
  const [kecamatanOptions, setKecamatanOptions] = useState([]);
  const [kelurahanOptions, setKelurahanOptions] = useState([]);

  // State untuk menandai proses pencarian
  const [isSearching, setIsSearching] = useState(false);

  // State untuk menyimpan data sekolah
  const [sekolahOptions, setSekolahOptions] = useState({});
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([]);

  // State untuk status jadwal
  const [jadwalData, setJadwalData] = useState({
    sd: {
      tanggal_mulai: null,
      tanggal_selesai: null
    },
    smp: {
      tanggal_mulai: null,
      tanggal_selesai: null
    }
  });

  // Fungsi untuk mengubah data form
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      // Handle checkbox
      if (type === 'checkbox') {
        return {
          ...prev,
          [name]: checked
        };
      }

      // Handle perubahan id_kecamatan
      if (name === 'id_kecamatan') {
        return {
          ...prev,
          [name]: value,
          id_kelurahan: ''
        };
      }

      // Handle field biasa
      return {
        ...prev,
        [name]: value
      };
    });
  }, []);

  // Fungsi untuk mengirimkan form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Debug log saat submit
      console.log('=== Submit Form ===');
      console.log('Mode input sekolah:', formData.tidak_ada_sekolah ? 'Manual' : 'Dari Daftar');
      console.log('Data sekolah:', {
        id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal,
        nama_sekolah_asal: formData.nama_sekolah_asal,
        id_tipe_sekolah_asal_manual: formData.id_tipe_sekolah_asal_manual,
        nama_sekolah_manual: formData.nama_sekolah_manual,
        tidak_ada_sekolah: formData.tidak_ada_sekolah
      });

      // Validasi koordinat lokasi
      if (!formData.latitude || !formData.longitude) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Lokasi belum ditentukan. Silakan pilih lokasi pada peta.</p>
          </div>
        );
        return;
      }

      // Validasi data sekolah asal berdasarkan pilihan pengguna
      if (!formData.tidak_ada_sekolah) {
        // Jika memilih sekolah dari daftar yang tersedia
        if (!formData.id_tipe_sekolah_asal || !formData.nama_sekolah_asal) {
          toast.error(
            <div>
              <p>❌ Perhatian!</p>
              <p>Silakan pilih tipe sekolah dan nama sekolah asal dari daftar yang tersedia!</p>
            </div>
          );
          return;
        }
      } else {
        // Jika memilih input sekolah secara manual
        if (!formData.id_tipe_sekolah_asal_manual || !formData.nama_sekolah_manual) {
          toast.error(
            <div>
              <p>❌ Perhatian!</p>
              <p>Silakan lengkapi data tipe sekolah dan nama sekolah secara manual!</p>
            </div>
          );
          return;
        }
      }

      // Validasi data yang diperlukan
      if (!userData?.sekolah?.latitude || !userData?.sekolah?.longitude) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Data koordinat sekolah tidak ditemukan</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
        return;
      }

      // Hitung jarak antara lokasi siswa dan sekolah
      const distance = calculateDistance(
        parseFloat(formData.latitude),
        parseFloat(formData.longitude),
        parseFloat(userData.sekolah.latitude),
        parseFloat(userData.sekolah.longitude)
      );

      // Log detail koordinat dan jarak
      console.log('Detail Perhitungan Jarak:');
      console.log('Koordinat Siswa:', {
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      console.log('Koordinat Sekolah:', {
        latitude: userData.sekolah.latitude,
        longitude: userData.sekolah.longitude
      });
      console.log('Jarak:', distance.toFixed(2), 'kilometer');

      // Format data untuk dikirim ke API
      const dataToSubmit = {
        // Data pribadi
        nik: formData.nik,
        nisn: formData.nisn,
        nama_siswa: formData.nama,
        id_jenis_kelamin: formData.jenis_kelamin === 'LAKI-LAKI' ? 1 : 2,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: new Date(formData.tanggal_lahir).toISOString().split('T')[0],
        nama_ayah: formData.nama_ayah,
        nama_ibu: formData.nama_ibu,
        nomor_telepon: formData.nomor_telepon,

        // Data alamat
        alamat: formData.alamat,
        id_provinsi: parseInt(formData.id_provinsi),
        id_kabupaten_kota: parseInt(formData.id_kabupaten_kota),
        id_kecamatan: parseInt(formData.id_kecamatan),
        id_kelurahan: parseInt(formData.id_kelurahan),
        longitude: parseFloat(formData.longitude),
        latitude: parseFloat(formData.latitude),

        // Data sekolah
        id_jalur_pendaftaran: 1, // 1 = Zonasi
        id_tipe_sekolah_asal: formData.tidak_ada_sekolah 
          ? parseInt(formData.id_tipe_sekolah_asal_manual) 
          : (formData.id_tipe_sekolah_asal ? parseInt(formData.id_tipe_sekolah_asal) : null),
        id_sekolah_asal: formData.tidak_ada_sekolah ? null : (formData.nama_sekolah_asal ? parseInt(formData.nama_sekolah_asal) : null),
        sekolah_asal: formData.tidak_ada_sekolah ? formData.nama_sekolah_manual : null,
        tahun_lulus: parseInt(formData.tahun_lulus || new Date().getFullYear()),
        id_sekolah_tujuan: parseInt(userData?.id_sekolah),
        jarak_sekolah_tujuan: parseFloat(distance.toFixed(2)),

        // Status pendaftaran
        status_pendaftaran: 'DIPROSES',
        is_diterima: 0,
        sesuai_titik_dapodik: 1,
      };

      // Validasi data wajib sebelum dikirim
      if (!dataToSubmit.nik || !dataToSubmit.nama_siswa ||
        !dataToSubmit.id_jenis_kelamin || !dataToSubmit.id_sekolah_tujuan ||
        !dataToSubmit.id_jalur_pendaftaran || !dataToSubmit.nisn ||
        !dataToSubmit.tempat_lahir || !dataToSubmit.tanggal_lahir ||
        !dataToSubmit.nama_ayah || !dataToSubmit.nama_ibu || !dataToSubmit.nomor_telepon ||
        !dataToSubmit.alamat || !dataToSubmit.id_provinsi ||
        !dataToSubmit.id_kabupaten_kota || !dataToSubmit.id_kecamatan ||
        !dataToSubmit.id_kelurahan) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Semua data wajib harus diisi</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
        return;
      }

      // Validasi token
      if (!userData?.token) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Sesi login telah berakhir, silakan login ulang</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
        return;
      }

      // Log data untuk debugging
      console.log('Data yang akan dikirim:', dataToSubmit);

      // Kirim data ke API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pendaftaran`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          },
          body: JSON.stringify(dataToSubmit)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Cek jika error karena kuota penuh
        if (errorData.message?.toLowerCase().includes('kuota') ||
          errorData.message?.toLowerCase().includes('penuh')) {
          toast.error(
            <div>
              <p>❌ Mohon Maaf!</p>
              <p>{errorData.message}</p>
            </div>,
            {
              autoClose: false,
              closeOnClick: true,
              toastId: 'error-kuota'
            }
          );
        } else {
          // Error lainnya
          toast.error(
            <div>
              <p>❌ Perhatian!</p>
              <p>{errorData.message || 'Gagal menyimpan pendaftaran'}</p>
            </div>,
            {
              autoClose: false,
              closeOnClick: true
            }
          );
        }
        console.error('Error response:', errorData);
        return;
      }

      const data = await response.json();
      // Sukses
      toast.success(
        <div>
          <p>✅ Berhasil!</p>
          <p>Data pendaftaran berhasil disimpan</p>
        </div>,
        {
          autoClose: 3000,
          closeOnClick: false
        }
      );

      // Reset form ke nilai awal
      setFormData({
        nik: '',
        nisn: '',
        nama: '',
        jenis_kelamin: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        nama_ayah: '',
        nama_ibu: '',
        nomor_telepon: '',
        alamat: '',
        id_provinsi: '',
        id_kabupaten_kota: '',
        id_kecamatan: '',
        id_kelurahan: '',
        id_tipe_sekolah_asal: '',
        nama_sekolah_asal: '',
        tidak_ada_sekolah: false,
        id_tipe_sekolah_asal_manual: '',
        nama_sekolah_manual: '',
        tahun_lulus: '',
        jalur_pendaftaran: '1', // Set kembali ke jalur zonasi
        sekolah_tujuan: userData?.sekolah?.id_sekolah || '',
        keterangan: ''
      });
    } catch (error) {
      console.error('Error saat mendaftar:', error);
      toast.error(
        <div>
          <p>❌ Perhatian!</p>
          <p>Terjadi kesalahan saat mendaftar</p>
        </div>,
        {
          autoClose: false,
          closeOnClick: true
        }
      );
    }
  };

  /**
   * Fungsi untuk mencari data dapodik berdasarkan NIK dan mengisi form
   * - Mengambil data dari API dapodik
   * - Mencari ID wilayah administratif
   * - Mengisi form dengan data yang ditemukan
   */
  const handleSearch = async () => {
    try {
      // Validasi NIK harus diisi
      if (!formData.nik) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>NIK harus diisi</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
        return;
      }

      setIsSearching(true);

      // Mengambil data dapodik dari API berdasarkan NIK
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/dapodik/find/${formData.nik}`);
      const dapodikData = response.data;

      console.log('Data dari dapodik:', dapodikData); // Debugging

      // Memperbarui state formData dengan data dari dapodik
      setFormData(prevData => ({
        ...prevData,
        // Data pribadi
        nisn: dapodikData.nisn || '',
        nama: dapodikData.nama_siswa || '',
        jenis_kelamin: dapodikData.jenis_kelamin === 'L' ? 'LAKI-LAKI' : dapodikData.jenis_kelamin === 'P' ? 'PEREMPUAN' : '',
        tempat_lahir: dapodikData.tempat_lahir || '',
        tanggal_lahir: dapodikData.tanggal_lahir ? new Date(dapodikData.tanggal_lahir).toISOString().split('T')[0] : '',
        nama_ayah: dapodikData.nama_ayah || dapodikData.nama_wali || '',
        nama_ibu: dapodikData.nama_ibu || dapodikData.nama_wali || '',
        nomor_telepon: dapodikData.nomor_telepon || '',

        // Data alamat
        alamat: dapodikData.alamat_jalan || '',

        // Data wilayah administratif
        id_provinsi: dapodikData.id_provinsi || '',
        id_kabupaten_kota: dapodikData.id_kabupaten_kota || '',
        id_kecamatan: dapodikData.id_kecamatan || '',
        id_kelurahan: dapodikData.id_kelurahan || '',
        nama_provinsi: dapodikData.nama_provinsi || '',
        nama_kabupaten_kota: dapodikData.nama_kabupaten_kota || '',
        nama_kecamatan: dapodikData.nama_kecamatan || '',
        nama_kelurahan: dapodikData.nama_kelurahan || '',

        // Data koordinat
        latitude: dapodikData.latitude?.toString() || '',
        longitude: dapodikData.longitude?.toString() || ''
      }));

      console.log('Form data setelah diupdate:', formData); // Debugging

      // Menampilkan form extend setelah data ditemukan
      setShowExtend(true);
      toast.success(
        <div>
          <p>✅ Berhasil!</p>
          <p>Data ditemukan dan form telah diisi</p>
        </div>,
        {
          autoClose: 3000,
          closeOnClick: false
        }
      );
    } catch (error) {
      console.error('Error in handleSearch:', error);
      if (error.response?.status === 404) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Data dengan NIK tersebut tidak ditemukan</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
      } else {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Terjadi kesalahan saat mencari data</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Fungsi untuk mengecek apakah sekolah adalah SD (211, 212)
  const isSDMI = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['211', '212'].includes(strValue);
  }, []);

  // Fungsi untuk mengecek apakah sekolah adalah SMP (311, 312)
  const isSMP = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['311', '312'].includes(strValue);
  }, []);

  // Fungsi untuk mengecek status jadwal
  const checkJadwalStatus = useCallback(async () => {
    try {
      moment.tz.setDefault('Asia/Jakarta');
      
      // Cek tipe sekolah user
      const userSchoolType = userData?.sekolah?.id_tipe_sekolah;
      
      if (isSDMI(userSchoolType)) {
        // Ambil jadwal SD
        const responseSD = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/jadwal-sistem/1`);
        const { tanggal_mulai, tanggal_selesai } = responseSD.data.data.jadwal;
        setJadwalData(prev => ({
          ...prev,
          sd: { tanggal_mulai, tanggal_selesai }
        }));
      } else if (isSMP(userSchoolType)) {
        // Ambil jadwal SMP
        const responseSMP = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/jadwal-sistem/9`);
        const { tanggal_mulai, tanggal_selesai } = responseSMP.data.data.jadwal;
        setJadwalData(prev => ({
          ...prev,
          smp: { tanggal_mulai, tanggal_selesai }
        }));
      }

    } catch (error) {
      console.error('Error checking jadwal status:', error);
    }
  }, [userData?.sekolah?.id_tipe_sekolah, isSDMI, isSMP]);

  // Cek apakah pendaftaran ditutup berdasarkan jadwal
  const isPendaftaranDitutup = useMemo(() => {
    moment.tz.setDefault('Asia/Jakarta');
    const userSchoolType = userData?.sekolah?.id_tipe_sekolah;

    if (!userSchoolType) {
      return false;
    }

    const currentTime = moment();
    let isOutOfRange = false;

    if (isSDMI(userSchoolType) && jadwalData.sd.tanggal_mulai && jadwalData.sd.tanggal_selesai) {
      const startTime = moment(jadwalData.sd.tanggal_mulai);
      const endTime = moment(jadwalData.sd.tanggal_selesai);
      isOutOfRange = !currentTime.isBetween(startTime, endTime, null, '[]');
    } else if (isSMP(userSchoolType) && jadwalData.smp.tanggal_mulai && jadwalData.smp.tanggal_selesai) {
      const startTime = moment(jadwalData.smp.tanggal_mulai);
      const endTime = moment(jadwalData.smp.tanggal_selesai);
      isOutOfRange = !currentTime.isBetween(startTime, endTime, null, '[]');
    }

    return isOutOfRange;
  }, [jadwalData, userData?.sekolah?.id_tipe_sekolah, isSDMI, isSMP]);

  // Effect untuk mengecek jadwal saat komponen dimount atau userData berubah
  useEffect(() => {
    if (userData?.sekolah?.id_tipe_sekolah) {
      checkJadwalStatus();
    }
  }, [checkJadwalStatus, userData?.sekolah?.id_tipe_sekolah]);

  // Effect untuk mengambil data tipe sekolah
  useEffect(() => {
    const fetchTipeSekolah = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/tipe-sekolah`,
          {
            headers: {
              'Authorization': `Bearer ${userData.token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Pastikan data adalah array dan transform untuk select options
        const options = Array.isArray(data.data) ? data.data.map(item => ({
          value: item.id_tipe_sekolah.toString(),
          label: item.slug
        })) : [];

        console.log('Tipe Sekolah Options:', options);
        setTipeSekolahOptions(options);
      } catch (error) {
        console.error('Error mengambil data tipe sekolah:', error);
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Gagal mengambil data tipe sekolah</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
        setTipeSekolahOptions([]); // Set empty array jika error
      }
    };

    fetchTipeSekolah();
  }, [userData.token]);

  // Effect untuk memantau perubahan tipe sekolah
  useEffect(() => {
    // Reset nilai sekolah asal ketika tipe sekolah berubah
    setFormData(prev => ({
      ...prev,
      nama_sekolah_asal: ''
    }));

    // Debug log
    console.log('Tipe Sekolah Options:', tipeSekolahOptions);
    console.log('Tipe Sekolah yang dipilih:', formData.id_tipe_sekolah_asal);
    const selectedTipe = tipeSekolahOptions.find(opt => opt.value === formData.id_tipe_sekolah_asal);
    console.log('Detail Tipe Sekolah yang dipilih:', selectedTipe);
  }, [formData.id_tipe_sekolah_asal, tipeSekolahOptions]);

  // Fungsi untuk mendapatkan options sekolah berdasarkan tipe yang dipilih
  const getSekolahOptionsByType = useCallback((tipeSekolahId) => {
    console.log('getSekolahOptionsByType dipanggil dengan ID:', tipeSekolahId);
    console.log('Current sekolahOptions:', sekolahOptions);

    if (!tipeSekolahId) {
      console.log('tipeSekolahId kosong');
      return [];
    }

    // Mengembalikan options dari state berdasarkan tipe sekolah
    return sekolahOptions[tipeSekolahId] || [];
  }, [sekolahOptions]);

  // Effect untuk mengambil data sekolah berdasarkan tipe
  useEffect(() => {
    const fetchSekolahData = async () => {
      try {
        if (!formData.id_tipe_sekolah_asal) {
          console.log('Tipe sekolah belum dipilih');
          return;
        }

        console.log('Mengambil data sekolah untuk tipe:', formData.id_tipe_sekolah_asal);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/sekolah/tipe/${formData.id_tipe_sekolah_asal}`,
          {
            headers: {
              'Authorization': `Bearer ${userData.token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const sekolahData = await response.json();
        console.log('Data sekolah dari API:', sekolahData);

        // Transform data untuk select options
        const options = Array.isArray(sekolahData) ? sekolahData.map(item => ({
          value: item.id_sekolah.toString(),
          label: item.nama,
          npsn: item.npsn
        })) : [];

        console.log('Options yang akan diset:', options);

        // Update state sekolah options
        setSekolahOptions(prev => ({
          ...prev,
          [formData.id_tipe_sekolah_asal]: options
        }));

      } catch (error) {
        console.error('Error mengambil data sekolah:', error);        
        setSekolahOptions(prev => ({
          ...prev,
          [formData.id_tipe_sekolah_asal]: []
        }));
      }
    };

    fetchSekolahData();
  }, [formData.id_tipe_sekolah_asal, userData.token]);

  // State untuk pencarian sekolah
  const [searchSekolah, setSearchSekolah] = useState('');
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false);

  // Fungsi untuk memfilter opsi sekolah berdasarkan pencarian
  const filteredSekolahOptions = useMemo(() => {
    if (!formData.id_tipe_sekolah_asal) return [];
    
    const options = getSekolahOptionsByType(formData.id_tipe_sekolah_asal);
    if (!searchSekolah) return options;

    return options.filter(option => 
      option.label.toLowerCase().includes(searchSekolah.toLowerCase())
    );
  }, [searchSekolah, formData.id_tipe_sekolah_asal, getSekolahOptionsByType]);

  // Handler untuk memilih sekolah
  const handleSekolahSelect = (value, label) => {
    handleChange({
      target: {
        name: 'nama_sekolah_asal',
        value: value
      }
    });
    setSearchSekolah(label);
    setShowSekolahDropdown(false);
  };

  // Fungsi untuk memfilter opsi tipe sekolah berdasarkan tipe sekolah user
  const getFilteredTipeSekolahOptions = useCallback(() => {
    const userSchoolType = userData?.sekolah?.id_tipe_sekolah;
    
    // Jika user adalah SD (211, 212), tampilkan hanya TK dan RA
    if (isSDMI(userSchoolType)) {
      return tipeSekolahOptions.filter(option => 
        ['112', '122'].includes(String(option.value))
      );
    }
    
    // Jika user adalah SMP (311, 312), tampilkan hanya SD dan MI
    if (isSMP(userSchoolType)) {
      return tipeSekolahOptions.filter(option => 
        ['211', '212', '221', '222'].includes(String(option.value))
      );
    }
    
    return tipeSekolahOptions;
  }, [tipeSekolahOptions, userData?.sekolah?.id_tipe_sekolah, isSDMI, isSMP]);

  // Handler untuk perubahan input manual sekolah
  const handleManualSchoolChange = (e) => {
    const { name, value } = e.target;
    
    console.log('=== Input Manual Sekolah ===');
    console.log('Field yang diubah:', name);
    console.log('Nilai baru:', value);
    console.log('State sebelum update:', {
      id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal,
      nama_sekolah_asal: formData.nama_sekolah_asal,
      id_tipe_sekolah_asal_manual: formData.id_tipe_sekolah_asal_manual,
      nama_sekolah_manual: formData.nama_sekolah_manual
    });

    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: value,
        ...(name === 'id_tipe_sekolah_asal' && {
          id_tipe_sekolah_asal_manual: value
        }),
        ...(name === 'nama_sekolah_asal' && {
          nama_sekolah_manual: value
        })
      };

      console.log('State setelah update:', {
        id_tipe_sekolah_asal: newState.id_tipe_sekolah_asal,
        nama_sekolah_asal: newState.nama_sekolah_asal,
        id_tipe_sekolah_asal_manual: newState.id_tipe_sekolah_asal_manual,
        nama_sekolah_manual: newState.nama_sekolah_manual
      });
      
      return newState;
    });
  };

  // State untuk mengontrol visibilitas checkbox warga Blitar
  const [showWargaBlitarCheckbox, setShowWargaBlitarCheckbox] = useState(false);

  // Effect untuk mengecek jadwal checkbox warga Blitar
  useEffect(() => {
    const checkJadwalWargaBlitar = async () => {
      try {
        const storedUserData = JSON.parse(localStorage.getItem('userData'));
        if (!storedUserData?.token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/jadwal-sistem/21`, {
          headers: { 'Authorization': `Bearer ${storedUserData.token}` }
        });

        if (!response.ok) throw new Error('Gagal mengecek jadwal');

        const data = await response.json();
        if (data.status && data.data) {
          const jadwal = data.data.jadwal;
          const currentTime = moment();
          const startTime = moment(jadwal.tanggal_mulai);
          const endTime = moment(jadwal.tanggal_selesai);
          
          const isWithinTimeRange = currentTime.isBetween(startTime, endTime, null, '[]');
          const isJadwalActive = jadwal.status === 1;
          
          setShowWargaBlitarCheckbox(isWithinTimeRange && isJadwalActive);
        }
      } catch (error) {
        console.error('Error:', error);
        setShowWargaBlitarCheckbox(false);
      }
    };

    checkJadwalWargaBlitar();
  }, []);

  // Jika pendaftaran ditutup, tampilkan pesan
  if (isPendaftaranDitutup) {
    console.log('Pendaftaran ditutup karena:', {
      currentTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      jadwalData,
      isSDMI: isSDMI(userData?.sekolah?.id_tipe_sekolah),
      userType: userData?.sekolah?.id_tipe_sekolah
    });
    
    return (
      <div className="bg-red-100 rounded-lg p-8 text-center">      
        <h2 className="text-2xl font-bold text-red-800 mb-4">
          Pendaftaran sudah ditutup!
        </h2>
        <p className="text-red-600">
          Pendaftaran online Program Penerimaan Siswa Baru Kabupaten Blitar untuk jalur Domisili sudah ditutup.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="bg-white p-6 pt-2 rounded-lg shadow-sm">
        <div className="mb-6">
          {showWargaBlitarCheckbox && (
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-50 p-4 rounded-md w-full border border-blue-100">
                <CheckboxField
                  name="isWargaBlitar"
                  defaultChecked={true}
                  onChange={handleChange}
                  label={<span>Mendaftar sebagai warga <span className="font-bold">Kabupaten Blitar</span></span>}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          {/* NIK Input dengan Search Button */}
          <div className='mb-6'>
            <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-1">
              NIK {' '}<span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                id="nik"
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                placeholder="Masukan Nomor Induk Kependudukan (NIK)"
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
                required
              />
              <Button
                onClick={handleSearch}
                className="px-6 bg-blue-500 hover:bg-blue-600 rounded-l-none flex items-center gap-2"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                    <span>Mencari...</span>
                  </div>
                ) : (
                  <>
                    <FaSearch className="w-4 h-4" />
                    <span>Periksa</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Extend Form */}
          {showExtend && (
            <ExtendDaftarZonasi
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {/* Pernyataan */}
          <div className="mt-6">
            <CheckboxField
              name="pernyataan"
              checked={formData.pernyataan}
              onChange={handleChange}
              label="Menyatakan dengan sesungguhnya bahwa seluruh informasi/dokumen yang saya berikan pada saat pendaftaran PPDB Online ini adalah benar dan dapat dipertanggungjawabkan."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={!formData.pernyataan}
            >
              DAFTAR
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
});

// Komponen utama
const DaftarZonasi = () => {
  // State untuk menyimpan data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));

  // State untuk menyimpan status kuota
  const [kuotaPenuh, setKuotaPenuh] = useState(false);

  // Fungsi untuk mengambil data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Mengambil userData dari localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.sekolah || !userData.sekolah.id_sekolah) {
        throw new Error('Data sekolah tidak ditemukan');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/data-pendaftar-zonasi/${userData.sekolah.id_sekolah}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }
      const result = await response.json();

      // Transform data sesuai dengan format yang dibutuhkan
      const transformedData = result.data.map(item => ({
        no_pendaftaran: item.no_pendaftaran,
        nama: item.nama_siswa,
        ttl: `${item.tempat_lahir}, ${new Date(item.tanggal_lahir).toLocaleDateString('id-ID')}`,
        jk: item.jenis_kelamin ? item.jenis_kelamin.nama : '-',
        asal_sekolah: item.sekolah_asal_data?.nama || '-',
        alamat: item.alamat || '-',
        nilai: item.nilai_rapor || '',
        dokumen: item.status_dokumen || '',
        waktu: new Date(item.waktu_daftar).toLocaleString('id-ID')
      }));

      setData(transformedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetchData saat komponen dimount
  useEffect(() => {
    fetchData();
  }, []);

  // Definisi kolom tabel
  const columns = useMemo(() => [
    {
      key: 'no_pendaftaran',
      label: 'No. Pendaftaran'
    },
    {
      key: 'nama',
      label: 'Nama Lengkap'
    },
    {
      key: 'ttl',
      label: 'TTL'
    },
    {
      key: 'jk',
      label: 'Jenis Kelamin'
    },
    {
      key: 'asal_sekolah',
      label: 'Asal Sekolah'
    },
    {
      key: 'alamat',
      label: 'Alamat'
    },
    {
      key: 'nilai',
      label: 'Nilai'
    },
    {
      key: 'dokumen',
      label: 'Status Dokumen'
    },
    {
      key: 'waktu',
      label: 'Waktu Daftar'
    }
  ], []);

  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("pendaftaran");

  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        setIsOpen(width >= 768);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const tableHeaders = useMemo(() => [
    "No",
    "NIK",
    "Nama",
    "Sekolah Asal",
    "Jarak",
    "Status",
    "Aksi"
  ], []);

  const handleRowClick = (row) => {
    console.log('Data siswa:', row);
  };

  const handleEdit = (row) => {
    console.log('Edit data siswa:', row);
  };

  const handleDelete = (row) => {
    console.log('Delete data siswa:', row);
  };

  const handleView = (row) => {
    console.log('View data siswa:', row);
  };

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
  }, []);

  // Effect untuk mengecek kuota saat komponen dimuat
  useEffect(() => {
    const checkKuota = async () => {
      try {
        // Ambil userData dari localStorage
        const storedUserData = JSON.parse(localStorage.getItem('userData'));
        console.log('Memeriksa data user dari localStorage:', storedUserData ? 'Ditemukan' : 'Tidak ditemukan');

        if (!storedUserData || !storedUserData.token) {
          throw new Error('Token tidak ditemukan. Silakan login kembali');
        }

        // Pastikan id_sekolah tersedia
        if (!storedUserData?.id_sekolah) {
          throw new Error('ID Sekolah tidak ditemukan');
        }

        // Panggil API dengan id_sekolah
        const url = `${import.meta.env.VITE_API_URL}/pendaftaran/kuota/jalur/1/${storedUserData.id_sekolah}`;
        console.log('Mengakses endpoint:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${storedUserData.token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', response.status, errorText);
          throw new Error(`Gagal mengecek kuota: ${errorText}`);
        }

        const data = await response.json();
        console.log('Data kuota yang diterima:', data);

        if (!data.status) {
          throw new Error(data.message || 'Gagal mengecek kuota: Response tidak valid');
        }

        if (data.data) {
          console.log('Status kuota:', {
            total: data.data.total_kuota,
            terisi: data.data.total_pendaftar,
            sisa: data.data.sisa_kuota,
            penuh: data.data.is_penuh
          });
          setKuotaPenuh(data.data.is_penuh || false);
        } else {
          throw new Error('Data kuota tidak ditemukan dalam response');
        }
      } catch (error) {
        console.error('Error saat mengecek kuota:', error);
        toast.error(error.message || 'Terjadi kesalahan saat mengecek kuota');
      }
    };

    // Langsung jalankan fungsi checkKuota
    checkKuota();
  }, []);

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <AdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>

        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <AdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} userData={userData} />
          </div>

          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-2 sm:p-4">
              <Card className="h-full w-[calc(100vw-16px)] sm:w-full overflow-x-auto shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      Pendaftaran Domisili
                    </Typography>
                  </div>
                  <div className="mb-4">
                    <div className="flex border-b border-gray-200">
                      <button
                        className={`${activeTab === 'pendaftaran'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                          } flex items-center px-4 py-2 text-sm font-medium`}
                        onClick={() => handleTabChange('pendaftaran')}
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Pendaftaran Siswa Domisili
                      </button>
                      <button
                        className={`${activeTab === 'daftar'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                          } flex items-center px-4 py-2 text-sm font-medium`}
                        onClick={() => handleTabChange('daftar')}
                      >
                        <i className="fas fa-list mr-2"></i>
                        Daftar Siswa Sudah Mendaftar Domisili
                      </button>
                    </div>
                  </div>
                  
                  {/* Tampilkan konten berdasarkan tab aktif */}
                  {activeTab === 'pendaftaran' && (
                    <>
                      {kuotaPenuh ? (
                        // Tampilkan peringatan jika kuota penuh
                        <div className="bg-yellow-100 p-4 rounded-md border border-yellow-200 mt-4">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Maaf, Maksimum Pagu Domisili Sudah Terpenuhi!</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <RegistrationForm />
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'daftar' && (
                    <div className="mt-4">
                      {loading ? (
                        <p>Memuat data...</p>
                      ) : error ? (
                        <p className="text-red-500">Error: {error}</p>
                      ) : (
                        <TableContainer
                          title="Data Pendaftar Jalur Zonasi"
                          subtitle="Daftar siswa yang mendaftar melalui jalur zonasi"
                        >
                          <Table
                            columns={columns}
                            data={data}
                            enablePagination={true}
                            itemsPerPage={10}
                          />
                        </TableContainer>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
            <AdminFooter />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default DaftarZonasi;