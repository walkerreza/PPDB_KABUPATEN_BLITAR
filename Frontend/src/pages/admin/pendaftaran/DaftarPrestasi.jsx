import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Typography, Button } from "@material-tailwind/react";
import AdminHeader from '../../../components/common/admin/AdminHeader';
import AdminSidebar from '../../../components/common/admin/AdminSidebar';
import AdminFooter from '../../../components/common/admin/AdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import TableContainer from '../../../components/table/TableVariant/components/TableContainer';
import { InputField, SelectField, CheckboxField } from '../../../components/forms/FormsVariant/Forms';
import TableForm from '../../../components/forms/FormsVariant/Component/tableForm';
import { AdminGuard } from '../../../utils/AuthGuard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import EditButton from '../../../components/element/Button/variant/EditButton';
import DeleteButton from '../../../components/element/Button/variant/DeleteButton';
import DeleteDialog from '../../../components/dialog/DeleteDialog';
import PrestasiForm from '../components/PrestasiForm';
import moment from 'moment';

// Komponen form pendaftaran
const RegistrationForm = React.memo(() => {
  // Ambil data user dari localStorage
  const [userData, setUserData] = useState(() => {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  });

  // State untuk menyimpan data form pendaftaran
  const [formData, setFormData] = useState({
    // Data pribadi siswa
    nik: '',                    // NIK siswa
    nisn: '',                   // NISN siswa
    nama: '',                   // Nama lengkap siswa
    jenis_kelamin: '',          // ID jenis kelamin
    tempat_lahir: '',           // Tempat lahir siswa
    tanggal_lahir: '',          // Tanggal lahir siswa
    is_warga_blitar: true,      // Status warga Blitar
    // Data orang tua dan kontak
    nama_ayah: '',              // Nama ayah
    nama_ibu: '',               // Nama ibu
    nomor_telepon: '',          // Nomor telepon yang bisa dihubungi
    
    // Data alamat lengkap
    alamat: '',                 // Alamat lengkap
    id_provinsi: '',            // ID provinsi
    id_kabupaten_kota: '',      // ID kabupaten/kota
    id_kecamatan: '',           // ID kecamatan
    id_kelurahan: '',           // ID kelurahan
    
    // Data sekolah asal
    id_tipe_sekolah_asal: '',   // ID tipe sekolah asal (TK/SD)
    nama_sekolah_asal: '',      // ID sekolah asal dari database
    tidak_ada_sekolah: false,   // Flag jika sekolah tidak ada di database
    id_tipe_sekolah_asal_manual: '', // ID tipe sekolah untuk input manual
    nama_sekolah_manual: '',    // Nama sekolah untuk input manual
    
    // Data pendaftaran
    tahun_lulus: '',           // Tahun lulus
    jalur_pendaftaran: '2',    // ID jalur pendaftaran (2 = Prestasi)
    sekolah_tujuan: userData?.sekolah?.id_sekolah || '', // ID sekolah tujuan
    keterangan: '',             // Keterangan tambahan

    // Data nilai
    nilai: {
      bhs_indonesia: '0',
      matematika: '0',
      ipa: '0'
    }
  });

  // State untuk mengontrol visibilitas checkbox warga Blitar
  const [showWargaBlitarCheckbox, setShowWargaBlitarCheckbox] = useState(false);

  // Handler untuk perubahan NIK
  const handleNikChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler untuk memeriksa NIK
  const handlePeriksaNik = async () => {
    try {
      // Validasi NIK harus 16 digit
      if (!formData.nik || formData.nik.length !== 16) {
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>NIK harus 16 digit</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
        return;
      }

      // Mengambil data dapodik dari API berdasarkan NIK
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/dapodik/find/${formData.nik}`);
      const dapodikData = response.data;

      // Jika data ditemukan, ubah status checkbox menjadi false agar form muncul
      setFormData(prev => ({
        ...prev,
        is_warga_blitar: false
      }));

      // Memperbarui state formData dengan data dari dapodik
      setFormData(prevData => ({
        ...prevData,
        nisn: dapodikData.nisn || '',
        nama: dapodikData.nama_siswa || '',
        jenis_kelamin: dapodikData.jenis_kelamin === 'L' ? '1' : dapodikData.jenis_kelamin === 'P' ? '2' : '',
        tempat_lahir: dapodikData.tempat_lahir || '',
        tanggal_lahir: dapodikData.tanggal_lahir ? new Date(dapodikData.tanggal_lahir).toISOString().split('T')[0] : '',
        nama_ayah: dapodikData.nama_ayah || dapodikData.nama_wali || '',
        nama_ibu: dapodikData.nama_ibu || dapodikData.nama_wali || '',
        nomor_telepon: dapodikData.nomor_telepon || '',
        alamat: dapodikData.alamat_jalan || '',
        id_provinsi: dapodikData.id_provinsi || '',
        id_kabupaten_kota: dapodikData.id_kabupaten_kota || '',
        id_kecamatan: dapodikData.id_kecamatan || '',
        id_kelurahan: dapodikData.id_kelurahan || '',
      }));

      // Tampilkan notifikasi sukses
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
      console.error('Error in handlePeriksaNik:', error);
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
    }
  };

  // Fungsi untuk cek NIK
  const handleCheck = async () => {
    try {
      if (!formData.nik) {
        toast.error('Silakan masukkan NIK terlebih dahulu');
        return;
      }

      // Implementasi logika periksa NIK
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/check-nik/${formData.nik}`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Jika data ditemukan, isi form dengan data dari response
        setFormData(prev => ({
          ...prev,
          nama: data.data.nama || '',
          jenis_kelamin: data.data.jenis_kelamin || '',
          tempat_lahir: data.data.tempat_lahir || '',
          tanggal_lahir: data.data.tanggal_lahir || '',
          nama_ayah: data.data.nama_ayah || '',
          nama_ibu: data.data.nama_ibu || '',
          alamat: data.data.alamat || '',
          // ... field lainnya sesuai response
        }));
        toast.success('Data ditemukan');
      } else {
        toast.warning('Data tidak ditemukan');
      }
    } catch (error) {
      console.error('Error checking NIK:', error);
      toast.error('Terjadi kesalahan saat memeriksa NIK');
    }
  };

  // Effect untuk mengupdate sekolah tujuan saat userData berubah
  useEffect(() => {
    if (userData?.sekolah?.id_sekolah) {
      setFormData(prev => ({
        ...prev,
        sekolah_tujuan: userData.sekolah.id_sekolah,
        jalur_pendaftaran: '2' // Set default jalur pendaftaran ke Prestasi
      }));
    }
  }, [userData]);

  // State untuk menyimpan opsi jenis kelamin dari API
  const [jenisKelaminOptions, setJenisKelaminOptions] = useState([]);

  // State untuk menyimpan opsi jalur pendaftaran dari API
  const [jalurPendaftaranOptions, setJalurPendaftaranOptions] = useState([]);

  // State untuk menyimpan opsi tipe sekolah dari API
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([]);

  // State untuk menyimpan data sekolah berdasarkan tipe
  const [sekolahOptions, setSekolahOptions] = useState({});

  // State untuk menyimpan data provinsi
  const [provinsiOptions, setProvinsiOptions] = useState([]);

  // State untuk menyimpan data kabupaten/kota
  const [kabupatenKotaOptions, setKabupatenKotaOptions] = useState([]);

  // State untuk menyimpan data kecamatan
  const [kecamatanOptions, setKecamatanOptions] = useState([]);

  // State untuk menyimpan data kelurahan
  const [kelurahanOptions, setKelurahanOptions] = useState([]);

  // Fungsi untuk mendapatkan opsi sekolah berdasarkan tipe
  const getSekolahOptionsByType = useCallback((tipeSekolahId) => {
    if (!tipeSekolahId) return [];
    return sekolahOptions[tipeSekolahId] || [];
  }, [sekolahOptions]);

  // State untuk pencarian sekolah
  const [searchSekolah, setSearchSekolah] = useState('');
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false);

  // Fungsi untuk memfilter opsi sekolah berdasarkan pencarian
  const filteredSekolahOptions = useMemo(() => {
    if (!formData.id_tipe_sekolah_asal || formData.tidak_ada_sekolah) return [];
    
    const options = getSekolahOptionsByType(formData.id_tipe_sekolah_asal);
    if (!searchSekolah) return options;

    return options.filter(option => 
      option.label.toLowerCase().includes(searchSekolah.toLowerCase())
    );
  }, [searchSekolah, formData.id_tipe_sekolah_asal, formData.tidak_ada_sekolah, getSekolahOptionsByType]);

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

  // Handler untuk menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sekolah-dropdown-container')) {
        setShowSekolahDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Effect untuk mengambil data jenis kelamin dari API
  useEffect(() => {
    const fetchJenisKelamin = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/jenis-kelamin`,
          {
            headers: {
              'Authorization': `Bearer ${userData.token}`
            }
          }
        );
        const data = await response.json();
        
        // Transform data untuk select options
        const options = data.map(item => ({
          value: item.id_jenis_kelamin.toString(),
          label: item.nama
        }));
        
        setJenisKelaminOptions(options);
      } catch (error) {
        console.error('Error fetching jenis kelamin:', error);
        toast.error('Gagal mengambil data jenis kelamin');
      }
    };

    fetchJenisKelamin();
  }, [userData.token]);

  // Effect untuk mengambil data jalur pendaftaran dari API
  useEffect(() => {
    const fetchJalurPendaftaran = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/jalur-pendaftaran`,
          {
            headers: {
              'Authorization': `Bearer ${userData.token}`
            }
          }
        );
        const data = await response.json();
        
        // Transform data untuk select options
        const options = data.map(item => ({
          value: item.id_jalur_pendaftaran.toString(),
          label: item.nama,
          status: item.status
        })).filter(item => item.status === 1); // Hanya tampilkan yang aktif
        
        setJalurPendaftaranOptions(options);

        // Set default jalur pendaftaran ke Prestasi
        const prestasi = options.find(opt => opt.label.toLowerCase() === 'prestasi');
        if (prestasi) {
          setFormData(prev => ({
            ...prev,
            jalur_pendaftaran: prestasi.value
          }));
        }
      } catch (error) {
        console.error('Error fetching jalur pendaftaran:', error);
        toast.error('Gagal mengambil data jalur pendaftaran');
      }
    };

    fetchJalurPendaftaran();
  }, [userData.token]);

  // Effect untuk mengambil data tipe sekolah dari API
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
        const result = await response.json();
        
        // Transform data untuk select options
        if (result.data) {
          const options = result.data.map(item => ({
            value: item.id_tipe_sekolah.toString(),
            label: item.slug
          }));
          setTipeSekolahOptions(options);
        }
      } catch (error) {
        console.error('Error fetching tipe sekolah:', error);
        toast.error('Gagal mengambil data tipe sekolah');
      }
    };

    fetchTipeSekolah();
  }, [userData.token]);

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

  // Effect untuk mengambil data provinsi
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/provinsi`,
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
        console.log('Data provinsi dari API:', data);

        // Transform data untuk select options
        const options = Array.isArray(data) ? data.map(item => ({
          value: item.id_provinsi.toString(),
          label: item.nama_provinsi
        })) : [];

        setProvinsiOptions(options);
      } catch (error) {
        console.error('Error mengambil data provinsi:', error);
        toast.error('Gagal mengambil data provinsi');
      }
    };

    fetchProvinsi();
  }, [userData.token]);

  // Effect untuk mengambil data kabupaten/kota berdasarkan provinsi yang dipilih
  useEffect(() => {
    const fetchKabupatenKota = async () => {
      try {
        if (!formData.id_provinsi) {
          setKabupatenKotaOptions([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kabupaten-kota/provinsi/${formData.id_provinsi}`,
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
        console.log('Data kabupaten/kota dari API:', data);

        // Transform data untuk select options
        const options = Array.isArray(data) ? data.map(item => ({
          value: item.id_kabupaten_kota.toString(),
          label: item.nama_kabupaten_kota
        })) : [];

        setKabupatenKotaOptions(options);
      } catch (error) {
        console.error('Error mengambil data kabupaten/kota:', error);
        toast.error('Gagal mengambil data kabupaten/kota');
        setKabupatenKotaOptions([]);
      }
    };

    fetchKabupatenKota();
  }, [formData.id_provinsi, userData.token]);

  // Effect untuk mengambil data kecamatan berdasarkan kabupaten/kota yang dipilih
  useEffect(() => {
    const fetchKecamatan = async () => {
      try {
        if (!formData.id_kabupaten_kota) {
          setKecamatanOptions([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/${formData.id_kabupaten_kota}`,
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
        console.log('Data kecamatan dari API:', data);

        // Transform data untuk select options
        const options = Array.isArray(data) ? data.map(item => ({
          value: item.id_kecamatan.toString(),
          label: item.nama_kecamatan
        })) : [];

        setKecamatanOptions(options);
      } catch (error) {
        console.error('Error mengambil data kecamatan:', error);
        toast.error('Gagal mengambil data kecamatan');
        setKecamatanOptions([]);
      }
    };

    fetchKecamatan();
  }, [formData.id_kabupaten_kota, userData.token]);

  // Effect untuk mengambil data kelurahan berdasarkan kecamatan yang dipilih
  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        if (!formData.id_kecamatan) {
          setKelurahanOptions([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${formData.id_kecamatan}`,
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
        console.log('Data kelurahan dari API:', data);

        // Transform data untuk select options
        const options = Array.isArray(data) ? data.map(item => ({
          value: item.id_kelurahan.toString(),
          label: item.nama_kelurahan
        })) : [];

        setKelurahanOptions(options);
      } catch (error) {
        console.error('Error mengambil data kelurahan:', error);
        toast.error('Gagal mengambil data kelurahan');
        setKelurahanOptions([]);
      }
    };

    fetchKelurahan();
  }, [formData.id_kecamatan, userData.token]);

  // Effect untuk memantau perubahan state sekolah
  useEffect(() => {
    console.log('State sekolahOptions berubah:', sekolahOptions);
  }, [sekolahOptions]);

  // Effect untuk mengambil data sekolah saat tipe berubah
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

        // Update state sekolah options dengan cara yang lebih dinamis
        setSekolahOptions(prev => ({
          ...prev,
          [formData.id_tipe_sekolah_asal]: options
        }));

      } catch (error) {
        console.error('Error mengambil data sekolah:', error);
        // Reset state untuk tipe sekolah yang dipilih
        setSekolahOptions(prev => ({
          ...prev,
          [formData.id_tipe_sekolah_asal]: []
        }));
      }
    };

    fetchSekolahData();
  }, [formData.id_tipe_sekolah_asal, userData.token]);

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

  // Handler untuk perubahan input
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle perubahan nilai
      const [parent, child] = name.split('.');
      
      // Validasi nilai maksimal 100
      if (parent === 'nilai') {
        const numValue = parseFloat(value);
        if (numValue > 100) {
          toast.error('Nilai tidak boleh lebih dari 100');
          return;
        }
      }

      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle input biasa
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  // Handler untuk checkbox warga Blitar
  const handleWargaBlitarChange = (e) => {
    setFormData(prev => ({
      ...prev,
      is_warga_blitar: e.target.checked
    }));
  };

  // Fungsi untuk menangani pengiriman form pendaftaran
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');

    // Cek field-field yang wajib diisi
    const requiredFields = {
      nik: 'NIK',
      nisn: 'NISN',
      nama: 'Nama Lengkap',
      jenis_kelamin: 'Jenis Kelamin',
      tempat_lahir: 'Tempat Lahir',
      tanggal_lahir: 'Tanggal Lahir',
      nama_ayah: 'Nama Ayah',
      nama_ibu: 'Nama Ibu',
      nomor_telepon: 'Nomor Telepon',
      alamat: 'Alamat',
      id_provinsi: 'Provinsi',
      id_kabupaten_kota: 'Kabupaten/Kota',
      id_kecamatan: 'Kecamatan',
      id_kelurahan: 'Kelurahan',
      sekolah_tujuan: 'Sekolah Tujuan',
      jalur_pendaftaran: 'Jalur Pendaftaran',
      id_tipe_sekolah_asal: 'Tipe Sekolah Asal'
    };

    // Cek setiap field yang kosong
    const emptyFields = [];
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        emptyFields.push(label);
      }
    });

    // Khusus untuk nama sekolah asal, cek berdasarkan checkbox tidak_ada_sekolah
    if (!formData.tidak_ada_sekolah) {
      // Jika checkbox tidak dicentang, nama_sekolah_asal harus diisi
      if (!formData.nama_sekolah_asal || formData.nama_sekolah_asal.trim() === '') {
        emptyFields.push('Nama Sekolah Asal');
      }
    } else {
      // Jika checkbox dicentang, nama_sekolah_manual harus diisi
      if (!formData.nama_sekolah_manual || formData.nama_sekolah_manual.trim() === '') {
        emptyFields.push('Nama Sekolah (Manual)');
      }
    }

    // Cek tahun lulus terakhir
    if (!formData.tahun_lulus || formData.tahun_lulus.toString().trim() === '') {
      emptyFields.push('Tahun Lulus');
    }

    // Jika ada field yang kosong, tampilkan pesan error
    if (emptyFields.length > 0) {
      toast.error(
        <div>
          <p>❌ Mohon lengkapi data berikut:</p>
          <ul className="list-disc pl-4 mt-2">
            {emptyFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>,
        {
          autoClose: false,
          closeOnClick: true,
          toastId: 'error-validation'
        }
      );
      return;
    }

    // Jika semua field terisi, lanjutkan dengan pengiriman data
    try {
      console.log('Current form data:', formData);
      
      // Siapkan data yang akan dikirim
      const dataToSend = {
        nik: formData.nik,
        nisn: formData.nisn,
        nama_siswa: formData.nama,
        id_jenis_kelamin: parseInt(formData.jenis_kelamin),
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        nama_ayah: formData.nama_ayah,
        nama_ibu: formData.nama_ibu,
        nomor_telepon: formData.nomor_telepon,
        alamat: formData.alamat,
        id_provinsi: parseInt(formData.id_provinsi),
        id_kabupaten_kota: parseInt(formData.id_kabupaten_kota),
        id_kecamatan: parseInt(formData.id_kecamatan),
        id_kelurahan: parseInt(formData.id_kelurahan),
        id_sekolah_tujuan: parseInt(formData.sekolah_tujuan),
        id_jalur_pendaftaran: parseInt(formData.jalur_pendaftaran),
        tahun_lulus: formData.tahun_lulus || null,
        keterangan: formData.keterangan || '',
        // Set nilai default untuk sekolah asal
        id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal ? parseInt(formData.id_tipe_sekolah_asal) : null,
        id_sekolah_asal: formData.nama_sekolah_asal ? parseInt(formData.nama_sekolah_asal) : null,
        nama_sekolah_manual: formData.nama_sekolah_manual || null,
        // Convert nilai to float
        nilai_bhs_indonesia: formData.nilai?.bhs_indonesia ? parseFloat(formData.nilai.bhs_indonesia) : 0,
        nilai_matematika: formData.nilai?.matematika ? parseFloat(formData.nilai.matematika) : 0,
        nilai_ipa: formData.nilai?.ipa ? parseFloat(formData.nilai.ipa) : 0
      };

      console.log('Data yang akan dikirim ke server:', dataToSend);

      // Kirim data ke API menggunakan fetch
      console.log('Mengirim data ke server...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pendaftaran`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          },
          body: JSON.stringify(dataToSend)
        }
      );

      const data = await response.json();
      console.log('Response dari server:', data);

      // Jika pendaftaran berhasil
      if (response.ok) {
        console.log('Pendaftaran berhasil!');
        
        // Tampilkan notifikasi sukses dengan nomor pendaftaran
        toast.success(
          <div>
            <p>Pendaftaran berhasil disimpan!</p>
            <p>Nomor Pendaftaran: <strong>{data.data.no_pendaftaran}</strong></p>
          </div>,
          {
            autoClose: 5000, // Tampilkan selama 5 detik
            closeOnClick: false // Jangan tutup saat diklik
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
          is_warga_blitar: true,
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
          jalur_pendaftaran: '2', // Set kembali ke jalur prestasi
          sekolah_tujuan: userData?.sekolah?.id_sekolah || '',
          keterangan: ''
        });
        console.log('Form direset ke nilai awal');
      } else {
        // Jika terjadi error, tampilkan pesan error dari server
        console.error('Error dari server:', data);
        
        // Cek jika error karena kuota penuh
        if (data.message?.toLowerCase().includes('kuota') || 
            data.message?.toLowerCase().includes('penuh')) {
          toast.error(
            <div>
              <p>❌ Mohon maaf!</p>
              <p>{data.message}</p>              
            </div>,
            {
              autoClose: false, // Tidak otomatis hilang
              closeOnClick: true,
              toastId: 'error-kuota' // Menambahkan ID unik
            }
          );
        } else {
          // Error lainnya
          toast.error(
            <div>
              <p>❌ Terjadi Kesalahan</p>
              <p>{data.message || 'Terjadi kesalahan saat menyimpan pendaftaran'}</p>
            </div>,
            {
              autoClose: 5000,
              closeOnClick: true,
              toastId: 'error-lain' // Menambahkan ID unik
            }
          );
        }
        
        throw new Error(data.message || 'Terjadi kesalahan saat menyimpan pendaftaran');
      }
    } catch (error) {
      // Tangani error dan tampilkan pesan ke user
      console.error('Error detail:', error);
      
      // Hanya tampilkan error jika belum ada toast error yang aktif
      if (!toast.isActive('error-kuota') && !toast.isActive('error-lain')) {
        toast.error(
          <div>
            <p>❌ Terjadi Kesalahan</p>
            <p>{error.message || 'Terjadi kesalahan saat menyimpan pendaftaran'}</p>
          </div>,
          {
            toastId: 'error-system', // Menambahkan ID unik
            autoClose: 5000,
            closeOnClick: true
          }
        );
      }
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <ToastContainer />
      
      {/* Checkbox Warga Blitar */}
      {showWargaBlitarCheckbox && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_warga_blitar}
              onChange={handleWargaBlitarChange}
              className="w-4 h-4 text-blue-600"
            />
            <span>Mendaftar sebagai warga <span className="font-bold">Kabupaten Blitar</span></span>
          </label>
        </div>
      )}
      
      {/* Data Diri Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">👤</span>
          Data Diri
        </h3>

        {/* NIK Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="nik"
              value={formData.nik}
              onChange={handleNikChange}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan NIK"
              required
            />
            <button 
              type="button"
              onClick={handlePeriksaNik}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <FaSearch className="w-4 h-4" />
              <span>Periksa</span>
            </button>
          </div>
        </div>

        {/* Form fields lainnya hanya muncul jika bukan warga Blitar */}
        {!formData.is_warga_blitar && (
          <div className="space-y-4 mt-4">
            <InputField
              type="text"
              label="Nomor Induk Siswa Nasional (NISN)"
              name="nisn"
              value={formData.nisn}
              onChange={handleChange}
              required
              placeholder="Masukkan NISN"
              className="w-full"
            />

            <InputField
              type="text"
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              placeholder="Masukkan nama lengkap"
              className="w-full"
            />

            <SelectField
              label="Jenis Kelamin"
              name="jenis_kelamin"
              value={formData.jenis_kelamin}
              onChange={handleChange}
              options={jenisKelaminOptions}
              required
              placeholder="Pilih jenis kelamin"
              className="w-full"
            />

            <InputField
              type="text"
              label="Tempat Lahir"
              name="tempat_lahir"
              value={formData.tempat_lahir}
              onChange={handleChange}
              required
              placeholder="Masukkan tempat lahir"
              className="w-full"
            />

            <InputField
              type="date"
              label="Tanggal Lahir"
              name="tanggal_lahir"
              value={formData.tanggal_lahir}
              onChange={handleChange}
              required
              className="w-full"
            />

            <InputField
              type="text"
              label="Nama Ayah"
              name="nama_ayah"
              value={formData.nama_ayah}
              onChange={handleChange}
              required
              placeholder="Masukkan Nama Ayah"
              className="w-full"
            />

            <InputField
              type="text"
              label="Nama Ibu"
              name="nama_ibu"
              value={formData.nama_ibu}
              onChange={handleChange}
              required
              placeholder="Masukkan Nama Ibu"
              className="w-full"
            />

            <InputField
              type="text"
              label="Nomor Telepon"
              name="nomor_telepon"
              value={formData.nomor_telepon}
              onChange={handleChange}
              required
              placeholder="Masukkan Nomor Telepon"
              className="w-full"
            />

            <InputField
              type="text"
              label="Alamat"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              required
              placeholder="Masukkan alamat lengkap"
              className="w-full"
            />

            <SelectField
              label="Provinsi"
              name="id_provinsi"
              value={formData.id_provinsi}
              onChange={handleChange}
              options={provinsiOptions}
              required={true}
              placeholder="Pilih Provinsi"
              isSearchable={true}
              isClearable={true}
              isLoading={provinsiOptions.length === 0}
              helpText={provinsiOptions.length === 0 ? "Memuat data provinsi..." : ""}
              className="w-full"
            />

            <SelectField
              label="Kabupaten/Kota"
              name="id_kabupaten_kota"
              value={formData.id_kabupaten_kota}
              onChange={handleChange}
              options={kabupatenKotaOptions}
              required={true}
              placeholder="Pilih Kabupaten/Kota"
              isSearchable={true}
              isClearable={true}
              isLoading={formData.id_provinsi && kabupatenKotaOptions.length === 0}
              disabled={!formData.id_provinsi}
              helpText={!formData.id_provinsi ? 
                "Pilih provinsi terlebih dahulu" : 
                kabupatenKotaOptions.length === 0 ? 
                "Memuat data kabupaten/kota..." : ""}
              className="w-full"
            />

            <SelectField
              label="Kecamatan"
              name="id_kecamatan"
              value={formData.id_kecamatan}
              onChange={handleChange}
              options={kecamatanOptions}
              required={true}
              placeholder="Pilih Kecamatan"
              isSearchable={true}
              isClearable={true}
              isLoading={formData.id_kabupaten_kota && kecamatanOptions.length === 0}
              disabled={!formData.id_kabupaten_kota}
              helpText={!formData.id_kabupaten_kota ? 
                "Pilih kabupaten/kota terlebih dahulu" : 
                kecamatanOptions.length === 0 ? 
                "Memuat data kecamatan..." : ""}
              className="w-full"
            />

            <SelectField
              label="Kelurahan/Desa"
              name="id_kelurahan"
              value={formData.id_kelurahan}
              onChange={handleChange}
              options={kelurahanOptions}
              required={true}
              placeholder="Pilih Kelurahan/Desa"
              isSearchable={true}
              isClearable={true}
              isLoading={formData.id_kecamatan && kelurahanOptions.length === 0}
              disabled={!formData.id_kecamatan}
              helpText={!formData.id_kecamatan ? 
                "Pilih kecamatan terlebih dahulu" : 
                kelurahanOptions.length === 0 ? 
                "Memuat data kelurahan..." : ""}
              className="w-full"
            />

            <div className="col-span-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jalur Pendaftaran
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="jalur_pendaftaran"
                    value={formData.jalur_pendaftaran}
                    checked={true}
                    readOnly
                  />
                  <span className="ml-2">
                    {jalurPendaftaranOptions.find(opt => opt.value === formData.jalur_pendaftaran)?.label || 'Prestasi'}
                  </span>
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                  Sekolah Asal
                </Typography>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectField
                  label="Tipe Sekolah Asal"
                  name="id_tipe_sekolah_asal"
                  value={formData.id_tipe_sekolah_asal}
                  onChange={handleChange}
                  options={getFilteredTipeSekolahOptions()}
                  required={!formData.tidak_ada_sekolah}
                  placeholder="Pilih Tipe Sekolah Asal"
                  className="w-full"
                />

                <div className="relative sekolah-dropdown-container">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Sekolah Asal
                    {!formData.tidak_ada_sekolah && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                    placeholder={!formData.id_tipe_sekolah_asal ? 
                      "Pilih tipe sekolah terlebih dahulu" : 
                      getSekolahOptionsByType(formData.id_tipe_sekolah_asal).length === 0 ? 
                      "Cari dan pilih sekolah..." : "Cari dan pilih sekolah..."}
                    value={searchSekolah}
                    onChange={(e) => {
                      setSearchSekolah(e.target.value);
                      setShowSekolahDropdown(true);
                    }}
                    onFocus={() => setShowSekolahDropdown(true)}
                    disabled={!formData.id_tipe_sekolah_asal || formData.tidak_ada_sekolah}
                    required={!formData.tidak_ada_sekolah}
                  />
                  
                  {/* Dropdown hasil pencarian */}
                  {showSekolahDropdown && formData.id_tipe_sekolah_asal && !formData.tidak_ada_sekolah && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {/* Input pencarian sticky */}
                      <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          placeholder="Ketik untuk mencari sekolah..."
                          value={searchSekolah}
                          onChange={(e) => setSearchSekolah(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Daftar hasil pencarian */}
                      {filteredSekolahOptions.length > 0 ? (
                        filteredSekolahOptions.map(({ value, label }) => (
                          <div
                            key={value}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSekolahSelect(value, label)}
                          >
                            {label}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          {getSekolahOptionsByType(formData.id_tipe_sekolah_asal).length === 0 
                            ? "Tidak ada sekolah yang ditemukan" 
                            : "Tidak ada sekolah yang ditemukan"}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Help text */}
                  {!formData.tidak_ada_sekolah && (
                    <p className="text-sm text-gray-500 mt-1">
                      {!formData.id_tipe_sekolah_asal ? 
                        "" : 
                        getSekolahOptionsByType(formData.id_tipe_sekolah_asal).length === 0 ? 
                        "" : ""}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <CheckboxField
                    label="Sekolah saya tidak ada di daftar tersebut"
                    name="tidak_ada_sekolah"
                    checked={formData.tidak_ada_sekolah}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        tidak_ada_sekolah: checked
                      }));
                    }}
                  />
                </div>

                {formData.tidak_ada_sekolah && (
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Input Manual Sekolah Asal
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <SelectField
                        label="Tipe Sekolah Asal"
                        name="id_tipe_sekolah_asal_manual"
                        value={formData.id_tipe_sekolah_asal_manual}
                        onChange={handleChange}
                        options={getFilteredTipeSekolahOptions()}
                        required
                        placeholder="Pilih Tipe Sekolah Asal"
                        className="w-full"
                      />

                      <InputField
                        type="text"
                        label="Nama Sekolah Asal"
                        name="nama_sekolah_manual"
                        value={formData.nama_sekolah_manual}
                        onChange={handleChange}
                        required
                        placeholder="Masukkan nama sekolah asal"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <InputField
              type="text"
              label="Tahun Lulus"
              name="tahun_lulus"
              value={formData.tahun_lulus}
              onChange={handleChange}
              required
              className="col-span-2"
              placeholder="Pilih Tahun Lulus"
            />

            <input
              type="hidden"
              name="sekolah_tujuan"
              value={formData.sekolah_tujuan}
            />
          </div>
        )}
      </div>

      {/* Nilai */}
      <TableForm
        title="Nilai"
        fields={[
          { name: 'nilai.bhs_indonesia', label: 'Bhs. Indonesia' },
          { name: 'nilai.matematika', label: 'Matematika' },
          { name: 'nilai.ipa', label: 'IPA' }
        ]}
        values={formData.nilai || { bhs_indonesia: '0', matematika: '0', ipa: '0' }}
        onChange={handleChange}
        gridCols={3}
        inputType="number"
      />

      <div className="mt-4">
        <Button type="submit" className="bg-blue-500">
          Simpan Data
        </Button>
      </div>
    </form>
  );
});

// Komponen daftar prestasi
const DaftarPrestasi = () => {
  // State untuk sidebar
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('pendaftaran');
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));

  // State untuk data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State untuk menyimpan status kuota
  const [kuotaPenuh, setKuotaPenuh] = useState(false);

  // State untuk edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);

  // State untuk delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  // State untuk mengecek jadwal
  const [isPendaftaranDitutup, setIsPendaftaranDitutup] = useState(false);
  const [jadwalData, setJadwalData] = useState({
    sd: { tanggal_mulai: null, tanggal_selesai: null },
    smp: { tanggal_mulai: null, tanggal_selesai: null }
  });

  // Handler untuk aksi
  const handleEdit = useCallback((row) => {
    setEditData(row);
    setShowEditDialog(true);
  }, []);

  const handleEditSuccess = () => {
    toast.success('Data berhasil diperbarui');
    fetchData();
  };

  const handleOpenDelete = (row) => {
    setSelectedData(row);
    setShowDeleteDialog(true);
    console.log("Data yang akan dihapus:", row); // Tambah log untuk debugging
  };

  const handleDelete = async () => {
    if (!selectedData) return;
    
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.token) {
        throw new Error('Token tidak ditemukan');
      }

      console.log("Menghapus data dengan ID:", selectedData.id_pendaftaran);
      await axios.delete(`${import.meta.env.VITE_API_URL}/pendaftaran/${selectedData.id_pendaftaran}`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      toast.success('Data berhasil dihapus');
      fetchData(); // Refresh data setelah menghapus
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Gagal menghapus data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleView = useCallback((row) => {
    console.log('View data siswa:', row);
  }, []);

  // Konfigurasi kolom tabel
  const columns = useMemo(() => [
    {
      key: 'no_pendaftaran',
      label: 'No. Pendaftaran',
      className: 'bg-gray-900 text-white',
      exportValue: (value) => value || '-',
      render: (value) => value || '-'
    },
    {
      key: 'nama_siswa',
      label: 'Nama',
      className: 'bg-gray-900 text-white',
      exportValue: (value) => value || '-',
      render: (value) => value || '-'
    },
    {
      key: 'ttl',
      label: 'Tempat, Tanggal Lahir',
      className: 'bg-gray-900 text-white',
      exportValue: (_, row) => {
        if (!row.tempat_lahir && !row.tanggal_lahir) return '-';
        const tempat = row.tempat_lahir || '';
        const tanggal = row.tanggal_lahir ? new Date(row.tanggal_lahir).toLocaleDateString('id-ID') : '';
        return `${tempat}${tempat && tanggal ? ', ' : ''}${tanggal}`;
      },
      render: (_, row) => {
        if (!row.tempat_lahir && !row.tanggal_lahir) return '-';
        const tempat = row.tempat_lahir || '';
        const tanggal = row.tanggal_lahir ? new Date(row.tanggal_lahir).toLocaleDateString('id-ID') : '';
        return `${tempat}${tempat && tanggal ? ', ' : ''}${tanggal}`;
      }
    },
    {
      key: 'jenis_kelamin',
      label: 'Jenis Kelamin',
      className: 'bg-gray-900 text-white',
      exportValue: (_, row) => row.jenis_kelamin?.nama || '-',
      render: (_, row) => row.jenis_kelamin?.nama || '-'
    },
    {
      key: 'alamat',
      label: 'Alamat Lengkap',
      className: 'bg-gray-900 text-white',
      exportValue: (value) => value || '-',
      render: (value) => value || '-'
    },
    {
      key: 'sekolah_asal',
      label: 'Sekolah Asal',
      className: 'bg-gray-900 text-white',
      exportValue: (_, row) => {
        if (row.nama_sekolah_manual) return row.nama_sekolah_manual;
        return row.sekolah_asal_data?.nama || '-';
      },
      render: (_, row) => {
        if (row.nama_sekolah_manual) return row.nama_sekolah_manual;
        return row.sekolah_asal_data?.nama || '-';
      }
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'bg-gray-900 text-white',
      exportValue: () => '',
      render: (_, row) => (
        <div className="flex gap-2">
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleOpenDelete(row)} />
        </div>
      )
    }
  ], [handleEdit, handleDelete, handleView]);

  // Effect untuk handle responsive
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsOpen(width >= 768);
      setIsMobile(width < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fungsi untuk mengambil data pendaftar prestasi
  const fetchData = async () => {
    try {
      setLoading(true);
      // Mengambil userData dari localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.sekolah || !userData.sekolah.id_sekolah) {
        throw new Error('Data sekolah tidak ditemukan');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pendaftaran/data-pendaftar-prestasi/${userData.sekolah.id_sekolah}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }

      const result = await response.json();
      setData(result.data);
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

  // Handler untuk klik baris tabel
  const handleRowClick = useCallback((row) => {
    console.log('Data siswa:', row);
  }, []);

  const handleTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);

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

  // Effect untuk mengecek status jadwal pendaftaran
  useEffect(() => {
    const checkJadwalPendaftaran = async () => {
      try {
        const storedUserData = JSON.parse(localStorage.getItem('userData'));
        if (!storedUserData?.token) throw new Error('Token tidak ditemukan');

        const userSchoolType = storedUserData?.sekolah?.id_tipe_sekolah;
        if (!userSchoolType) throw new Error('Tipe sekolah tidak ditemukan');

        let jadwalId;
        if (isSMP(userSchoolType)) {
          jadwalId = 15;
        } else {
          throw new Error('Jalur prestasi hanya untuk SMP');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/${jadwalId}`, {
          headers: { 'Authorization': `Bearer ${storedUserData.token}` }
        });

        if (!response.ok) throw new Error('Gagal mengecek jadwal');

        const data = await response.json();
        if (data.status && data.data) {
          const jadwal = data.data;
          setJadwalData(prev => ({
            ...prev,
            smp: { tanggal_mulai: jadwal.tanggal_mulai, tanggal_selesai: jadwal.tanggal_selesai }
          }));

          const currentTime = moment();
          const startTime = moment(jadwal.tanggal_mulai);
          const endTime = moment(jadwal.tanggal_selesai);
          
          const isOutsideTimeRange = currentTime.isBefore(startTime) || currentTime.isAfter(endTime);
          const isJadwalInactive = jadwal.status === 0;
          
          setIsPendaftaranDitutup(isOutsideTimeRange || isJadwalInactive);
        } else {
          setIsPendaftaranDitutup(true);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsPendaftaranDitutup(true);
      }
    };

    checkJadwalPendaftaran();
  }, [isSMP]);

  // Effect untuk mengecek kuota saat komponen dimuat
  useEffect(() => {
    const checkKuota = async () => {
      try {
        // Ambil userData dari localStorage
        const storedUserData = JSON.parse(localStorage.getItem('userData'));
        console.log('Memeriksa data user dari localStorage:', storedUserData ? 'Ditemukan' : 'Tidak ditemukan');
        
       // Pastikan id_sekolah tersedia
       if (!storedUserData?.id_sekolah) {
        throw new Error('ID Sekolah tidak ditemukan');
      }

      // Panggil API dengan id_sekolah
      const url = `${import.meta.env.VITE_API_URL}/pendaftaran/kuota/jalur/2/${storedUserData.id_sekolah}`;
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
    <>
      <AdminGuard>
        <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
          <div className="fixed top-0 w-full z-50">
            <AdminHeader isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />
          </div>

          <div className="flex flex-1 pt-[60px]">
            <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
              <AdminSidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} isMobile={isMobile} userData={userData} />
            </div>

            <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''} p-4`}>
              <Card className="mt-6">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      Pendaftaran Prestasi
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === 'pendaftaran'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleTabChange('pendaftaran')}
                      >
                        Pendaftaran Siswa Prestasi
                      </button>
                      <button
                        className={`ml-8 px-4 py-2 text-sm font-medium ${
                          activeTab === 'daftar'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleTabChange('daftar')}
                      >
                        Daftar Siswa Sudah Mendaftar Prestasi
                      </button>
                    </div>
                  </div>

                  {/* Tampilkan konten berdasarkan tab aktif */}
                  {activeTab === 'pendaftaran' && (
                    <>
                      {!isSMP(userData?.sekolah?.id_tipe_sekolah) ? (
                        <div className="bg-red-100 rounded-lg p-8 text-center">      
                          <h2 className="text-2xl font-bold text-red-800 mb-4">
                            Akses Ditolak
                          </h2>
                          <p className="text-red-600">
                            Jalur Prestasi hanya tersedia untuk jenjang SMP/MTs.
                          </p>
                        </div>
                      ) : isPendaftaranDitutup ? (
                        <div className="bg-red-100 rounded-lg p-8 text-center">      
                          <h2 className="text-2xl font-bold text-red-800 mb-4">
                            Pendaftaran sudah ditutup!
                          </h2>
                          <p className="text-red-600">
                            Pendaftaran online Program Penerimaan Siswa Baru Kabupaten Blitar untuk jalur Prestasi sudah ditutup.
                          </p>
                        </div>
                      ) : kuotaPenuh ? (
                        <div className="bg-yellow-100 p-4 rounded-md border border-yellow-200 mt-4">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Maaf, Maksimum Pagu Prestasi Sudah Terpenuhi!</span>
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
                      <TableContainer
                        title="Data Pendaftar Jalur Prestasi"
                        subtitle="Daftar siswa yang mendaftar melalui jalur prestasi"
                      >
                        {loading ? (
                          <div className="text-center py-4">Memuat data...</div>
                        ) : error ? (
                          <div className="text-center text-red-500 py-4">{error}</div>
                        ) : (
                          <Table
                            data={data}
                            columns={columns}
                            onRowClick={handleRowClick}
                          />
                        )}
                      </TableContainer>
                    </div>
                  )}
                </div>
              </Card>
              <AdminFooter />
            </div>
          </div>
        </div>
        
      </AdminGuard>
      <PrestasiForm
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        data={editData}
        onSuccess={handleEditSuccess}
      />
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa ini?`}
        itemName={selectedData?.nama}
      />
    </>
  );
};

export default DaftarPrestasi;