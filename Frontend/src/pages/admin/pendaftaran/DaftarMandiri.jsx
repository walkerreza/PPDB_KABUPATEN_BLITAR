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
import MandiriForm from '../components/MandiriForm';
import moment from 'moment';

// Komponen form pendaftaran
const RegistrationForm = React.memo(() => {
  // Ambil data user dari localStorage
  const [userData, setUserData] = useState(() => {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  });

  // State untuk checkbox warga Blitar
  const [isWargaBlitar, setIsWargaBlitar] = useState(true);

  // State untuk menyimpan data form pendaftaran
  const [formData, setFormData] = useState({
    // Data pribadi siswa
    nik: '',                    // NIK siswa
    nisn: '',                   // NISN siswa
    nama: '',                   // Nama lengkap siswa
    jenis_kelamin: '',          // ID jenis kelamin
    tempat_lahir: '',           // Tempat lahir siswa
    tanggal_lahir: '',          // Tanggal lahir siswa

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
    id_sekolah_asal: '',        // ID sekolah asal dari database
    tidak_ada_sekolah: false,   // Flag jika sekolah tidak ada di database
    id_tipe_sekolah_asal_manual: '', // ID tipe sekolah untuk input manual
    nama_sekolah_manual: '',    // Nama sekolah untuk input manual

    // Data pendaftaran
    tahun_lulus: '',           // Tahun lulus
    jalur_pendaftaran: 'REGULER',    // ID jalur pendaftaran (REGULER)
    sekolah_tujuan: userData?.sekolah?.id_sekolah || '', // ID sekolah tujuan
    keterangan: '',             // Keterangan tambahan

    // Data nilai
    nilai: {
      bhs_indonesia: '0',
      matematika: '0',
      ipa: '0'
    }
  });

  // Log initial state untuk debugging
  useEffect(() => {
    console.log('Initial formData:', formData);
    console.log('userData:', userData);
  }, []);

  // Handler untuk checkbox
  const handleCheckboxChange = (e) => {
    setIsWargaBlitar(e.target.checked);
    if (e.target.checked) {
      // Reset form kecuali NIK jika checkbox dicentang
      setFormData(prev => ({
        ...prev,
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
        id_sekolah_asal: ''
      }));
    }
  };

  // Effect untuk mengupdate sekolah tujuan saat userData berubah
  useEffect(() => {
    if (userData?.sekolah?.id_sekolah) {
      setFormData(prev => ({
        ...prev,
        sekolah_tujuan: userData.sekolah.id_sekolah,
        jalur_pendaftaran: 'REGULER' // Pastikan jalur pendaftaran selalu diisi
      }));
      console.log('Sekolah tujuan diatur ke:', userData.sekolah.id_sekolah);
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

  // State untuk menyimpan data sekolah
  const [searchSekolah, setSearchSekolah] = useState('');
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false);

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
        console.log('Data tipe sekolah:', result);

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

  // Fungsi untuk mengecek apakah sekolah adalah TK (112)
  const isTK = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['112'].includes(strValue);
  }, []);

  // Fungsi untuk mengecek apakah sekolah adalah RA (122)
  const isRA = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['122'].includes(strValue);
  }, []);

  // Fungsi untuk mengecek apakah sekolah adalah MI (221, 222)
  const isMI = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['221', '222'].includes(strValue);
  }, []);

  // Fungsi untuk mengecek apakah sekolah adalah MTs (321, 322)
  const isMTs = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['321', '322'].includes(strValue);
  }, []);

  // Fungsi untuk memfilter opsi tipe sekolah berdasarkan tipe sekolah user
  const getFilteredTipeSekolahOptions = useCallback(() => {
    const userSchoolType = userData?.sekolah?.id_tipe_sekolah;

    // Jika user adalah TK (112), tampilkan hanya TK
    if (isTK(userSchoolType)) {
      return tipeSekolahOptions.filter(option =>
        ['112'].includes(String(option.value))
      );
    }

    // Jika user adalah RA (122), tampilkan hanya RA
    if (isRA(userSchoolType)) {
      return tipeSekolahOptions.filter(option =>
        ['122'].includes(String(option.value))
      );
    }

    // Jika user adalah MI (221, 222), tampilkan hanya TK dan RA
    if (isMI(userSchoolType)) {
      return tipeSekolahOptions.filter(option =>
        ['112', '122'].includes(String(option.value))
      );
    }

    // Jika user adalah MTs (321, 322), tampilkan hanya MI
    if (isMTs(userSchoolType)) {
      return tipeSekolahOptions.filter(option =>
        ['221', '222'].includes(String(option.value))
      );
    }

    return tipeSekolahOptions;
  }, [tipeSekolahOptions, userData?.sekolah?.id_tipe_sekolah, isTK, isRA, isMI, isMTs]);

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
      setIsWargaBlitar(false);

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
      jalur_pendaftaran: 'Jalur Pendaftaran'
    };

    // Cek setiap field yang kosong
    const emptyFields = [];
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        emptyFields.push(label);
      }
    });

    // Jika ada field yang kosong, tampilkan pesan error
    if (emptyFields.length > 0) {
      console.log('Field yang kosong:', emptyFields);
      console.log('Data form saat ini:', formData);

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
        id_jalur_pendaftaran: formData.jalur_pendaftaran === 'REGULER' ? 5 : parseInt(formData.jalur_pendaftaran),
        tahun_lulus: formData.tahun_lulus || null,
        keterangan: formData.keterangan || '',
        // Set nilai default untuk sekolah asal
        id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal ? parseInt(formData.id_tipe_sekolah_asal) : null,
        id_sekolah_asal: formData.id_sekolah_asal ? parseInt(formData.id_sekolah_asal) : null,
        nama_sekolah_manual: formData.nama_sekolah_manual || null,
        nilai_bhs_indonesia: formData.nilai?.bhs_indonesia ? parseFloat(formData.nilai.bhs_indonesia) : 0,
        nilai_matematika: formData.nilai?.matematika ? parseFloat(formData.nilai.matematika) : 0,
        nilai_ipa: formData.nilai?.ipa ? parseFloat(formData.nilai.ipa) : 0
      };

      console.log('Data yang akan dikirim ke server:', dataToSend);
      console.log('Jalur pendaftaran yang dikirim:', dataToSend.id_jalur_pendaftaran);

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
          nama_ayah: '',
          nama_ibu: '',
          nomor_telepon: '',
          alamat: '',
          id_provinsi: '',
          id_kabupaten_kota: '',
          id_kecamatan: '',
          id_kelurahan: '',
          id_tipe_sekolah_asal: '',
          id_sekolah_asal: '',
          tidak_ada_sekolah: false,
          id_tipe_sekolah_asal_manual: '',
          nama_sekolah_manual: '',
          tahun_lulus: '',
          jalur_pendaftaran: 'REGULER', // Set kembali ke REGULER
          sekolah_tujuan: userData?.sekolah?.id_sekolah || '',
          keterangan: '',
          nilai: {
            bhs_indonesia: '0',
            matematika: '0',
            ipa: '0'
          }
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

  const handleCheck = async () => {
    try {
      if (!formData.nik) {
        toast.error('Silakan masukkan NIK terlebih dahulu');
        return;
      }

      // Implementasi logika periksa NIK
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/check-nik/${formData.nik}`, {
        headers: {
          Authorization: `Bearer ${userData.token}`
        }
      });

      if (response.data.success) {
        // Jika data ditemukan, isi form dengan data dari response
        const data = response.data.data;
        setFormData(prev => ({
          ...prev,
          nama: data.nama || '',
          jenis_kelamin: data.jenis_kelamin || '',
          tempat_lahir: data.tempat_lahir || '',
          tanggal_lahir: data.tanggal_lahir || '',
          nama_ayah: data.nama_ayah || '',
          nama_ibu: data.nama_ibu || '',
          alamat: data.alamat || '',
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

  // Handler untuk memilih sekolah
  const handleSekolahSelect = (value, label) => {
    setFormData(prev => ({
      ...prev,
      id_sekolah_asal: value
    }));
    setSearchSekolah(label);
    setShowSekolahDropdown(false);
  };

  // Computed property untuk memfilter sekolah berdasarkan pencarian
  const filteredSekolahOptions = useMemo(() => {
    if (!formData.id_tipe_sekolah_asal) return [];
    const options = sekolahOptions[formData.id_tipe_sekolah_asal] || [];
    if (!searchSekolah) return options;

    return options.filter(option =>
      option.label.toLowerCase().includes(searchSekolah.toLowerCase())
    );
  }, [formData.id_tipe_sekolah_asal, searchSekolah, sekolahOptions]);

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

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
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

      {/* Checkbox Warga Blitar */}
      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isWargaBlitar}
            onChange={handleCheckboxChange}
            className="form-checkbox h-5 w-5 text-blue-500"
          />
          <span>Mendaftar sebagai warga <span className="font-bold">Kabupaten Blitar</span></span>
        </label>
      </div>

      {/* Data Diri Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">👤</span>
          Data Diri
        </h3>

        <div className="space-y-4">
          {/* NIK Field - Selalu ditampilkan */}
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                onClick={handlePeriksaNik}
              >
                <FaSearch className="w-4 h-4" />
                <span>Periksa</span>
              </button>
            </div>
          </div>

          {!isWargaBlitar && (
            <div className="space-y-4">
              {/* NISN Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                <input
                  type="text"
                  name="nisn"
                  value={formData.nisn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan NISN"
                  required
                />
              </div>

              {/* Nama Lengkap Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              {/* Jenis Kelamin Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih jenis kelamin</option>
                  {jenisKelaminOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Tempat Lahir Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  name="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan tempat lahir"
                  required
                />
              </div>

              {/* Tanggal Lahir Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Nama Ayah Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ayah</label>
                <input
                  type="text"
                  name="nama_ayah"
                  value={formData.nama_ayah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama ayah"
                  required
                />
              </div>

              {/* Nama Ibu Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ibu</label>
                <input
                  type="text"
                  name="nama_ibu"
                  value={formData.nama_ibu}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama ibu"
                  required
                />
              </div>

              {/* Nomor Telepon Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  name="nomor_telepon"
                  value={formData.nomor_telepon}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nomor telepon"
                  required
                />
              </div>

              {/* Alamat Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input
                  type="text"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan alamat"
                  required
                />
              </div>

              {/* Provinsi Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_provinsi"
                  value={formData.id_provinsi}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih provinsi</option>
                  {provinsiOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Kabupaten/Kota Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
                <select
                  name="id_kabupaten_kota"
                  value={formData.id_kabupaten_kota}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.id_provinsi}
                >
                  <option value="">Pilih kabupaten/kota</option>
                  {kabupatenKotaOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Kecamatan Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                <select
                  name="id_kecamatan"
                  value={formData.id_kecamatan}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.id_kabupaten_kota}
                >
                  <option value="">Pilih kecamatan</option>
                  {kecamatanOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Kelurahan Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan</label>
                <select
                  name="id_kelurahan"
                  value={formData.id_kelurahan}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.id_kecamatan}
                >
                  <option value="">Pilih kelurahan</option>
                  {kelurahanOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Pendaftaran */}
      {!isWargaBlitar && (
        <div className="mt-4">
          {/* Jalur Pendaftaran */}
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Jalur Pendaftaran</h3>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="jalur_pendaftaran"
                  value="REGULER"
                  checked={formData.jalur_pendaftaran === 'REGULER'}
                  onChange={handleChange}
                />
                <span className="ml-2">REGULER</span>
              </label>
            </div>
          </div>

          {/* Tipe Sekolah Asal */}
          <div className="col-span-2">
            <div className="mb-4">
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
          </div>

          {/* Tahun Lulus */}
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
        </div>
      )}
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

// Komponen daftar mandiri
const DaftarMandiri = () => {
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

  // State untuk delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  // State untuk edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);

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
  };

  const handleDelete = async () => {
    if (!selectedData) return;

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.token) {
        throw new Error('Token tidak ditemukan');
      }

      console.log("Menghapus data dengan ID:", selectedData.id_pendaftaran); // Tambah log untuk debugging
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

  // Fungsi untuk mengambil data pendaftar mandiri
  const fetchData = async () => {
    try {
      setLoading(true);
      // Mengambil userData dari localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.sekolah || !userData.sekolah.id_sekolah) {
        throw new Error('Data sekolah tidak ditemukan');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pendaftaran/data-pendaftar-mandiri/${userData.sekolah.id_sekolah}`,
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

  // Fungsi untuk mengecek apakah sekolah adalah TK/RA (111, 112)
  const isTKRA = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['111', '112'].includes(strValue);
  }, []);

  // State untuk menyimpan status jadwal pendaftaran
  const [isPendaftaranDitutup, setIsPendaftaranDitutup] = useState(false);
  const [jadwalData, setJadwalData] = useState({
    tkra: { tanggal_mulai: null, tanggal_selesai: null }
  });

  // Effect untuk mengecek status jadwal pendaftaran
  useEffect(() => {
    const checkJadwalPendaftaran = async () => {
      try {
        const storedUserData = JSON.parse(localStorage.getItem('userData'));
        if (!storedUserData?.token) throw new Error('Token tidak ditemukan');

        const userSchoolType = storedUserData?.sekolah?.id_tipe_sekolah;
        if (!userSchoolType) throw new Error('Tipe sekolah tidak ditemukan');

        // Mandiri hanya untuk TK/RA (ID: 26)
        if (isTKRA(userSchoolType)) {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/26`, {
            headers: { 'Authorization': `Bearer ${storedUserData.token}` }
          });

          if (!response.ok) throw new Error('Gagal mengecek jadwal');

          const data = await response.json();
          if (data.status && data.data) {
            const jadwal = data.data;
            setJadwalData(prev => ({
              ...prev,
              tkra: { tanggal_mulai: jadwal.tanggal_mulai, tanggal_selesai: jadwal.tanggal_selesai }
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
        }
      } catch (error) {
        console.error('Error:', error);
        setIsPendaftaranDitutup(true);
      }
    };

    checkJadwalPendaftaran();
  }, [isTKRA]);

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
        const url = `${import.meta.env.VITE_API_URL}/pendaftaran/kuota/jalur/5/${storedUserData.id_sekolah}`;
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
            <div className="fixed">
              <AdminSidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} isMobile={isMobile} userData={userData} />
            </div>

            <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''} p-4`}>
              <Card className="mt-6">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      Pendaftaran Reguler
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
                        Pendaftaran Siswa Reguler
                      </button>
                      <button
                        className={`${activeTab === 'daftar'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                          } flex items-center px-4 py-2 text-sm font-medium`}
                        onClick={() => handleTabChange('daftar')}
                      >
                        <i className="fas fa-list mr-2"></i>
                        Daftar Siswa Sudah Mendaftar Reguler
                      </button>
                    </div>
                  </div>
                  {/* Tampilkan konten berdasarkan tab aktif */}
                  {activeTab === 'pendaftaran' && (
                    <>
                      {!isTKRA(userData?.sekolah?.id_tipe_sekolah) ? (
                        <div className="bg-red-100 rounded-lg p-8 text-center">      
                          <h2 className="text-2xl font-bold text-red-800 mb-4">
                            Akses Ditolak
                          </h2>
                          <p className="text-red-600">
                            Jalur Mandiri hanya tersedia untuk jenjang TK/RA.
                          </p>
                        </div>
                      ) : isPendaftaranDitutup ? (
                        <div className="bg-red-100 rounded-lg p-8 text-center">      
                          <h2 className="text-2xl font-bold text-red-800 mb-4">
                            Pendaftaran sudah ditutup!
                          </h2>
                          <p className="text-red-600">
                            Pendaftaran online Program Penerimaan Siswa Baru Kabupaten Blitar untuk jalur Mandiri sudah ditutup.
                          </p>
                        </div>
                      ) : kuotaPenuh ? (
                        <div className="bg-yellow-100 p-4 rounded-md border border-yellow-200 mt-4">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Maaf, Maksimum Pagu Mandiri Sudah Terpenuhi!</span>
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
                        title="Data Pendaftar Jalur Reguler"
                        subtitle="Daftar siswa yang mendaftar melalui jalur reguler"
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
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa ini?`}
        itemName={selectedData?.nama}
      />
      <MandiriForm
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        data={editData}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default DaftarMandiri;