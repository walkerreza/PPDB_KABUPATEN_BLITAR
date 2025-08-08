import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { asset } from '../assets/asset';
import { FaTimesCircle, FaUser, FaUniversity, FaSearch } from 'react-icons/fa';
import Maps from '../components/element/Card/Maps';
import { calculateDistance, sortLocationsByDistance } from '../utils/distance';
import { SaveButton, ReloadButton } from '../components/element/Button/variant';
import { CheckboxField } from '../components/forms/FormsVariant/Forms';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { result } from 'lodash';
import moment from 'moment-timezone';

const SCHOOLS_DATA = [];

const BuatAkun = () => {
  const navigate = useNavigate();
  const [hasFormData, setHasFormData] = useState(true);
  const [isWargaBlitar, setIsWargaBlitar] = useState(true); // State untuk checkbox warga Blitar
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [center, setCenter] = useState({ lat: -8.0952, lng: 112.1722 }); // Koordinat default Blitar
  const [coordinates, setCoordinates] = useState(null);
  const [address, setAddress] = useState('');
  const [gpsLokasi, setGpsLokasi] = useState('');
  const [mapType, setMapType] = useState('roadmap');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [schoolDistances, setSchoolDistances] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDataVerified, setIsDataVerified] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [infoAkun, setInfoAkun] = useState(null);

  // State untuk menyimpan opsi-opsi sekolah
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([]); // Opsi untuk tipe sekolah (TK/SD)
  const [sekolahOptions, setSekolahOptions] = useState([]); // Opsi untuk daftar sekolah
  const [selectedTipeSekolah, setSelectedTipeSekolah] = useState(''); // Tipe sekolah yang dipilih

  // State untuk menyimpan data sekolah
  const [sekolahList, setSekolahList] = useState([]);

  // State untuk Maps
  const [coordinatesMap, setCoordinatesMap] = useState(null);
  const [centerMap, setCenterMap] = useState({ lat: -8.0952, lng: 112.1722 }); // Koordinat default Blitar
  const [mapTypeMap, setMapTypeMap] = useState('roadmap');
  const [isMapLoadedMap, setIsMapLoadedMap] = useState(false);
  const [isLocatingMap, setIsLocatingMap] = useState(false);
  const [addressMap, setAddressMap] = useState('');

  // State untuk menyimpan opsi wilayah
  const [provinsiOptions, setProvinsiOptions] = useState([]);
  const [kabupatenKotaOptions, setKabupatenKotaOptions] = useState([]);
  const [kecamatanOptions, setKecamatanOptions] = useState([]);
  const [kelurahanOptions, setKelurahanOptions] = useState([]);

  // State untuk menyimpan daftar sekolah terdekat
  const [nearbySchools, setNearbySchools] = useState([]);

  // State untuk menyimpan info kuota sekolah
  const [kuotaSekolah, setKuotaSekolah] = useState({});

  // State untuk pencarian sekolah
  const [searchSekolah, setSearchSekolah] = useState('');
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false);
  const [formData, setFormData] = useState({
    // Data pribadi
    nik: '',
    nisn: '',
    nama_siswa: '',
    jenis_kelamin: 'LAKI-LAKI',
    tempat_lahir: '',
    tanggal_lahir: '',
    nama_ayah: '',
    nama_ibu: '',
    nomor_telepon: '',
    pernyataan: false,
    alamat: '',
    provinsi: '',
    kabupaten_kota: '',
    kecamatan: '',
    kelurahan_desa: '',
    id_provinsi: '',
    id_kabupaten_kota: '',
    id_kecamatan: '',
    id_kelurahan: '',
    latitude: '',
    longitude: '',
    id_tipe_sekolah_asal: '',
    id_sekolah_asal: '',
    sekolah_asal: '',
    pilihan_sekolah: '',
    tahun_lulus: new Date().getFullYear(),
  });

  const [isLuarBlitarScheduleActive, setIsLuarBlitarScheduleActive] = useState(false);

  // Effect untuk memeriksa jadwal pendaftaran domisili luar Kabupaten Blitar (ID 21)
  useEffect(() => {
    const checkScheduleValidity = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran`);
        
        if (response.data && response.data.data) {
          // Cari jadwal dengan ID 21 (Pendaftaran Domisili Luar Kabupaten Blitar)
          const schedule = response.data.data.find(item => 
            item.id_jadwal_pendaftaran === 21 && 
            item.status === 1 &&
            new Date(item.tanggal_mulai) <= new Date() && 
            new Date(item.tanggal_selesai) >= new Date()
          );
          
          // Update state berdasarkan keberadaan jadwal
          setIsLuarBlitarScheduleActive(!!schedule);
          console.log('Jadwal pendaftaran luar Blitar aktif:', !!schedule);
        }
      } catch (error) {
        console.error('Error memeriksa jadwal pendaftaran:', error);
        setIsLuarBlitarScheduleActive(false);
      }
    };

    checkScheduleValidity();
  }, []);

  const initialDummyData = {
    '3505101234567890': {
      nisn: '1234567890',
      nama_siswa: 'John Doe',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Blitar',
      tanggal_lahir: '2010-01-01',
      nama_orang_tua: 'Jane Doe',
      no_telepon: '081234567890',
      alamat: 'Jl. Sumberingin No.1, Sumberingin',
      provinsi: 'Jawa Timur',
      kabupaten_kota: 'Kabupaten Blitar',
      kecamatan: 'Sanankulon',
      kelurahan_desa: 'Sumberingin',
      jalur_pendaftaran: 'zonasi',
      sekolah_asal: {
        jenis: 'SD',
        nama: 'UPT SD NEGERI 1'
      },
      tahun_lulus: '2024-06-30',
      pilihan_sekolah: 'UPT SD NEGERI SUMBERIDEN 01',
      coordinates: {
        lat: -8.098422,
        lng: 112.161865
      },
      address: 'Sumberingin, Kec. Sanankulon, Kabupaten Blitar, Jawa Timur'
    },
    '3505109876543210': {
      nisn: '9876543210',
      nama_siswa: 'Jane Smith',
      jenis_kelamin: 'Perempuan',
      tempat_lahir: 'Blitar',
      tanggal_lahir: '2011-02-02',
      nama_orang_tua: 'John Smith',
      no_telepon: '089876543210',
      alamat: 'Jl. Garum No.10, Garum',
      provinsi: 'Jawa Timur',
      kabupaten_kota: 'Kabupaten Blitar',
      kecamatan: 'Garum',
      kelurahan_desa: 'Garum',
      jalur_pendaftaran: 'zonasi',
      sekolah_asal: {
        jenis: 'SD',
        nama: 'UPT SD NEGERI 2'
      },
      tahun_lulus: '2024-06-30',
      pilihan_sekolah: 'UPT SD NEGERI SUMBERIDEN 01',
      coordinates: {
        lat: -8.072669,
        lng: 112.213898
      },
      address: 'Garum, Kec. Garum, Kabupaten Blitar, Jawa Timur'
    }
  };

  const [dummyData, setDummyData] = useState(() => {
    try {
      const savedData = localStorage.getItem('ppdb_dummy_data');
      return savedData ? JSON.parse(savedData) : initialDummyData;
    } catch (error) {
      console.error('Error loading dummy data from localStorage:', error);
      return initialDummyData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ppdb_dummy_data', JSON.stringify(dummyData));
    } catch (error) {
      console.error('Error saving dummy data to localStorage:', error);
    }
  }, [dummyData]);

  const schoolsData = useMemo(() => SCHOOLS_DATA, []);

  const centerMemo = useMemo(() => ({ lat: -8.0952, lng: 112.1722 }), []);

  const schoolDistancesMemo = useMemo(() => {
    return sortLocationsByDistance(schoolsData, coordinates);
  }, [schoolsData, coordinates]);

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setIsCheckboxChecked(isChecked);

    // Reset nilai sekolah saat checkbox berubah
    setFormData(prev => ({
      ...prev,
      id_sekolah_asal: null,
      sekolah_asal: '',
      id_tipe_sekolah_asal: null
    }));
  }

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  const handleMapCoordinateChange = useCallback((newCoords) => {
    setCoordinates(newCoords);
    setGpsLokasi(`${newCoords.lat}, ${newCoords.lng}`);
  }, []);

  const handleNikChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      nik: value
    }));
    setNik(value); // Pastikan state nik juga diupdate
    setIsDataVerified(false);
    setCoordinates(null);
    setAddress('');
    setGpsLokasi('');
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Fungsi untuk memeriksa NIK dan mengisi form otomatis
   * - Mengambil data dari API dapodik
   * - Mengisi form dengan data yang ditemukan
   */
  const handlePeriksaNik = async () => {
    try {
      // Validasi NIK harus 16 digit
      if (nik.length !== 16) {
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

      setLoading(true);
      setError('');

      // Mengambil data dapodik dari API berdasarkan NIK
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/dapodik/find/${nik}`);
      const dapodikData = response.data;

      // Memperbarui state formData dengan data dari dapodik
      setFormData(prevData => ({
        ...prevData,
        nik: nik,
        nisn: dapodikData.nisn || '',
        nama_siswa: dapodikData.nama_siswa || '',
        jenis_kelamin: dapodikData.jenis_kelamin === 'L' ? 'LAKI-LAKI' : dapodikData.jenis_kelamin === 'P' ? 'PEREMPUAN' : '',
        tempat_lahir: dapodikData.tempat_lahir || '',
        tanggal_lahir: dapodikData.tanggal_lahir ? new Date(dapodikData.tanggal_lahir).toISOString().split('T')[0] : '',
        nama_ayah: dapodikData.nama_ayah || '',
        nama_ibu: dapodikData.nama_ibu || '',
        nomor_telepon: dapodikData.nomor_telepon || '',
        alamat: dapodikData.alamat_jalan || '',
        provinsi: dapodikData.nama_provinsi || '',
        kabupaten_kota: dapodikData.nama_kabupaten_kota || '',
        kecamatan: dapodikData.nama_kecamatan || '',
        kelurahan_desa: dapodikData.nama_kelurahan || '',
        id_provinsi: dapodikData.id_provinsi || '',
        id_kabupaten_kota: dapodikData.id_kabupaten_kota || '',
        id_kecamatan: dapodikData.id_kecamatan || '',
        id_kelurahan: dapodikData.id_kelurahan || '',
        latitude: dapodikData.latitude?.toString() || '',
        longitude: dapodikData.longitude?.toString() || '',
        tahun_lulus: new Date().getFullYear(),
      }));

      // Set data terverifikasi
      setIsDataVerified(true);

      // Tampilkan pesan sukses
      toast.success(
        <div>
          <p>✅ Berhasil!</p>
          <p>Data ditemukan dan form telah diisi</p>
        </div>,
        {
          autoClose: 3000,
          closeOnClick: true
        }
      );

    } catch (error) {
      setIsDataVerified(false);

      // Handle error 404 (data tidak ditemukan)
      if (error.response?.status === 404) {
        setError('Data dengan NIK tersebut tidak ditemukan');
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
        // Error lainnya
        setError('Terjadi kesalahan saat mencari data');
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
      console.error('Error saat mencari data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateNik = async () => {
    setLoading(true);
    setError('');

    try {
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (dummyData[nik]) {
          setShowForm(true);
          setFormData(dummyData[nik]);
          setError('');
        } else {
          setShowForm(false);
          setError('Data NIK tidak ditemukan');
        }
      } else {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/siswa/validate-nik/${nik}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok) {
          setShowForm(true);
          setFormData(data.siswa);
          setError('');
        } else {
          setShowForm(false);
          setError(data.message || 'Data NIK tidak ditemukan');
        }
      }
    } catch (err) {
      console.error('Error validating NIK:', err);
      setError('Terjadi kesalahan saat memvalidasi NIK');
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Variabel untuk melacak apakah validasi berhasil
      let isValid = true;
      let errorMessage = null;

      // Validasi data yang diperlukan
      if (!formData.latitude || !formData.longitude) {
        errorMessage = (
          <div>
            <p>❌ Perhatian!</p>
            <p>Lokasi belum ditentukan</p>
          </div>
        );
        isValid = false;
      } 
      else if (!formData.pilihan_sekolah) {
        errorMessage = (
          <div>
            <p>❌ Perhatian!</p>
            <p>Silakan pilih sekolah tujuan</p>
          </div>
        );
        isValid = false;
      }
      // Validasi password
      else if (formData.password && formData.konfirmasi_password && formData.password !== formData.konfirmasi_password) {
        errorMessage = (
          <div>
            <p>❌ Perhatian!</p>
            <p>Password dan konfirmasi password tidak sama</p>
          </div>
        );
        isValid = false;
      }

      // Validasi data sebelum dikirim
      const requiredFields = {
        nik: 'NIK',
        nama_siswa: 'Nama Siswa',
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
        id_kelurahan: 'Kelurahan/Desa',
      };

      // Cek field yang kosong
      const emptyFields = Object.entries(requiredFields)
        .filter(([key]) => {
          const value = formData[key];
          // Cek apakah nilai ada dan bukan string kosong
          return value === undefined || value === null || value.toString().trim() === '';
        })
        .map(([_, label]) => label);

      // Debug: tampilkan nilai field yang dicek
      console.log('Nilai field yang dicek:', Object.fromEntries(
        Object.keys(requiredFields).map(key => [key, formData[key]])
      ));

      if (emptyFields.length > 0 && isValid) {
        console.log('Field yang kosong:', emptyFields);
        errorMessage = (
          <div>
            <p>❌ Error!</p>
            <p>Mohon lengkapi data berikut:</p>
            <ul className="mt-2 list-disc list-inside">
              {emptyFields.map((field) => (
                <li key={field} className="text-sm">{field}</li>
              ))}
            </ul>
          </div>
        );
        isValid = false;
      }

      // Tampilkan pesan error jika validasi gagal
      if (!isValid) {
        toast.error(errorMessage, {
          autoClose: false,
          closeOnClick: true
        });
        setLoading(false);
      } 
      else {
        // Ambil jarak dari data sekolah terdekat yang sudah dihitung sebelumnya
        const selectedSchool = nearbySchools.find(school => school.id === formData.pilihan_sekolah);
        const distance = selectedSchool?.distance || 0;

        // Konversi data ke format yang sesuai
        const pendaftaranData = {
          // Data pribadi siswa
          nik: nik.trim(), // Gunakan state nik langsung
          nisn: (formData.nisn || '').trim(),
          nama_siswa: formData.nama_siswa.trim(),
          id_jenis_kelamin: formData.jenis_kelamin === 'LAKI-LAKI' ? 1 : 2,
          tempat_lahir: formData.tempat_lahir.trim(),
          tanggal_lahir: formData.tanggal_lahir,
          nama_ayah: formData.nama_ayah.trim(),
          nama_ibu: formData.nama_ibu.trim(),
          nomor_telepon: formData.nomor_telepon.trim(),

          // Data alamat dan wilayah administratif
          alamat: formData.alamat.trim(),
          id_provinsi: parseInt(formData.id_provinsi),
          id_kabupaten_kota: parseInt(formData.id_kabupaten_kota),
          id_kecamatan: parseInt(formData.id_kecamatan),
          id_kelurahan: parseInt(formData.id_kelurahan),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,

          // Data sekolah
          id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal ? parseInt(formData.id_tipe_sekolah_asal) : null, // Konversi ke integer jika ada nilai
          id_sekolah_asal: formData.id_sekolah_asal ? parseInt(formData.id_sekolah_asal) : null,
          sekolah_asal: formData.sekolah_asal ? formData.sekolah_asal.trim() : null,
          id_sekolah_tujuan: formData.pilihan_sekolah ? parseInt(formData.pilihan_sekolah) : null,
          jarak_sekolah_tujuan: distance ? parseFloat(distance) : 0,
          tahun_lulus: formData.tahun_lulus || null,
          id_jalur_pendaftaran: 1,
          sesuai_titik_dapodik: 1
        };

        // Debug: tampilkan data yang akan dikirim
        console.log('Data yang akan dikirim:', pendaftaranData);

        try {
          // Kirim data ke API
          const response = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pendaftaranData)
          });

          // Log response headers dan status
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));

          const responseData = await response.json();
          console.log('Response data (formatted):', JSON.stringify(responseData, null, 2));

          if (!response.ok) {
            // Log error detail
            console.error('Error dari server:', {
              status: response.status,
              statusText: response.statusText,
              data: responseData
            });

            // Tampilkan pesan error dari backend dengan detail lebih lengkap
            toast.error(
              <div>
                <p>❌ Error!</p>
                <p>{responseData.message || 'Gagal mengirim data pendaftaran'}</p>
                {responseData.errors && (
                  <ul className="mt-2 list-disc list-inside">
                    {Object.entries(responseData.errors).map(([field, error]) => (
                      <li key={field} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>,
              {
                autoClose: false,
                closeOnClick: true
              }
            );
            return;
          }

          // Tampilkan pesan sukses
          toast.success(
            <div>
              <p>✅ Berhasil!</p>
              <p>Pendaftaran berhasil disimpan</p>
            </div>
          );

          // Simpan informasi akun dari response API
          if (responseData.data && responseData.data.user) {
            const userData = responseData.data.user;
            setInfoAkun({
              username: userData.username,
              password: userData.password
            });
            console.log('Info akun diset:', {
              username: userData.username,
              password: userData.password
            });
          }

          // Set success state ke true untuk menampilkan pesan sukses
          setIsSuccess(true);

          // Reset form dan state
          setFormData({
            nik: '',
            nisn: '',
            nama_siswa: '',
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
            id_sekolah_asal: '',
            sekolah_asal: '',
            pilihan_sekolah: '',
            tahun_lulus: '',
            pernyataan: false
          });

        } catch (error) {
          console.error('Error saat mengirim data pendaftaran:', error);
          toast.error(
            <div>
              <p>❌ Perhatian!</p>
              <p>Gagal menyimpan data pendaftaran</p>
            </div>,
            {
              autoClose: false,
              closeOnClick: true
            }
          );
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error saat mengirim data pendaftaran:', error);
      toast.error(
        <div>
          <p>❌ Perhatian!</p>
          <p>Gagal menyimpan data pendaftaran</p>
        </div>,
        {
          autoClose: false,
          closeOnClick: true
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setIsSuccess(false);
    setIsDataVerified(false);
    setNik('');
    setFormData({});
  };

  useEffect(() => {
    console.log('Data form saat ini:', formData);
  }, [formData]);

  useEffect(() => {
    console.log('Koordinat saat ini:', coordinates);
    console.log('Alamat saat ini:', address);
  }, [coordinates, address]);

  // Fungsi untuk mendapatkan detail lokasi dari koordinat
  const getLocationDetails = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const result = data.results[0];
        const addressComponents = result.address_components;

        // Mencari komponen alamat
        const getComponent = (type) => {
          const component = addressComponents.find(comp => comp.types.includes(type));
          return component ? component.long_name : '';
        };

        // Update formData dengan data lokasi
        setFormData(prev => ({
          ...prev,
          kelurahan_desa: getComponent('administrative_area_level_4') || getComponent('sublocality_level_1'),
          kecamatan: getComponent('administrative_area_level_3') || getComponent('sublocality'),
          kabupaten_kota: getComponent('administrative_area_level_2'),
          provinsi: getComponent('administrative_area_level_1'),
          latitude: lat.toString(),
          longitude: lng.toString()
        }));

        // Update alamat lengkap
        setAddress(result.formatted_address);
      }
    } catch (error) {
      console.error('Error getting location details:', error);
      toast.error('Terjadi kesalahan saat mengambil detail lokasi');
    }
  }, []);

  // Fungsi untuk mencari lokasi berdasarkan alamat
  const handleSearchLocation = async () => {
    try {
      const address = gpsLokasi;

      if (!address) {
        toast.error('Silakan pilih alamat lengkap terlebih dahulu');
      } else {
        // Menggunakan Geocoding API untuk mendapatkan koordinat
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );

        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;

          // Update koordinat untuk marker
          setCoordinatesMap({ lat, lng });

          // Update center map ke lokasi yang ditemukan
          setCenter({ lat, lng });

          // Update formData dengan koordinat baru
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));

          toast.success('Lokasi ditemukan!');
        } else {
          toast.error('Lokasi tidak ditemukan, silakan coba alamat lain');
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Terjadi kesalahan saat mencari lokasi');
    }
  };

  const mapMarkers = useMemo(() => {
    return schoolDistancesMemo.map(school => ({
      id: school.id,
      position: school.coordinates,
      title: `${school.name} (${school.distance.toFixed(2)} km)`,
      distance: school.distance
    }));
  }, [schoolDistancesMemo]);

  // Mempersiapkan marker sekolah
  const schoolMarkers = useMemo(() => {
    return SCHOOLS_DATA.map(school => ({
      id: school.id,
      position: school.coordinates,
      title: school.name
    }));
  }, []);



  // Effect untuk update coordinates dari formData
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setCoordinatesMap({
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude)
      });
    }
  }, [formData.latitude, formData.longitude]);

  // Effect untuk update address
  useEffect(() => {
    if (formData.alamat) {
      setAddressMap(formData.alamat);
    }
  }, [formData.alamat]);

  const handleMapLoadMap = useCallback(() => {
    setIsMapLoadedMap(true);
  }, []);

  const handleMapClickMap = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // Update coordinates untuk marker
    setCoordinatesMap({ lat, lng });

    // Update formData
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));

    // Reverse geocoding untuk mendapatkan alamat
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const newAddress = results[0].formatted_address;
          setAddressMap(newAddress);
          setFormData(prev => ({
            ...prev,
            alamat: newAddress,
            gps_lokasi: `${lat}, ${lng}`
          }));
        }
      });
    }
  }, []);

  const containerStyleMap = {
    width: '100%',
    height: '400px',
    marginTop: '1rem'
  };

  const areaOptionsMap = {
    clickable: false,
    visible: true,
    editable: false,
    draggable: false,
  };

  // Fungsi untuk membuat string alamat lengkap
  const getFormattedAddress = useCallback(() => {
    const parts = [];

    if (formData.kelurahan_desa) parts.push(formData.kelurahan_desa);
    if (formData.kecamatan) parts.push(formData.kecamatan);
    if (formData.kabupaten_kota) parts.push(formData.kabupaten_kota);
    if (formData.provinsi) parts.push(formData.provinsi);

    return parts.join(' ') || '';
  }, [formData.kelurahan_desa, formData.kecamatan, formData.kabupaten_kota, formData.provinsi]);

  // Effect untuk update gpsLokasi saat data wilayah berubah
  useEffect(() => {
    // Cek apakah alamat berasal dari dropdown manual (bukan warga Blitar)
    const isManualSelection = formData.kabupaten_kota && formData.kabupaten_kota !== 'Kabupaten Blitar' && formData.kabupaten_kota !== 'Kota Blitar';
    
    // Jika alamat dipilih manual, tidak perlu memformat gpsLokasi
    if (isManualSelection) {
      // Biarkan gpsLokasi seperti apa adanya
      return;
    }
    
    // Jika alamat dari warga Blitar, format alamat seperti biasa
    setGpsLokasi(getFormattedAddress());
  }, [formData.kelurahan_desa, formData.kecamatan, formData.kabupaten_kota, formData.provinsi, getFormattedAddress]);

  useEffect(() => {
    if (coordinates) {
      getLocationDetails(coordinates.lat, coordinates.lng);
    }
  }, [coordinates, getLocationDetails]);

  useEffect(() => {
    if (nik && initialDummyData[nik]) {
      const data = initialDummyData[nik];
      setFormData(data);

      // Update koordinat dan center map
      if (data.coordinates) {
        setCoordinates(data.coordinates);
        setCenter(data.coordinates);
      }

      // Update alamat dan GPS lokasi
      if (data.address) {
        setAddress(data.address);
        setGpsLokasi(data.address);
      }
    }
  }, [nik]);

  useEffect(() => {
    if (nik && dummyData[nik]?.coordinates) {
      setCoordinates(dummyData[nik].coordinates);
      setCenter(dummyData[nik].coordinates);
    }
  }, [nik, dummyData]);

  // Fungsi untuk mengambil data sekolah berdasarkan tipe
  const fetchSekolahByTipe = async (tipeId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${tipeId}`);
      if (response.data && response.data.length > 0) {
        // Filter sekolah berdasarkan tipe yang dipilih dan urutkan berdasarkan jarak
        const filteredSekolah = response.data
          .map(school => ({
            id: school.id_sekolah,
            name: school.nama,
            distance: calculateDistance(
              formData.latitude || center.lat,
              formData.longitude || center.lng,
              school.latitude,
              school.longitude
            ).toFixed(2)
          }))
          .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        setNearbySchools(filteredSekolah);
      } else {
        setNearbySchools([]);
        toast.info('Belum ada sekolah dengan tipe tersebut');
      }
    } catch (error) {
      console.error('Error fetching sekolah:', error);
      setNearbySchools([]);
      toast.info('Belum ada sekolah dengan tipe tersebut');
    }
  };

  /**
   * Effect untuk mengambil data tipe sekolah dari API
   * - Mengambil data saat komponen pertama kali dimuat
   * - Mengubah format data untuk dropdown
   * - Menangani error jika gagal mengambil data
   */
  useEffect(() => {
    const fetchTipeSekolah = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/tipe-sekolah`);
        // Filter hanya tipe sekolah TK, SDN, dan SDS
        const filteredTipeSekolah = response.data.data.filter(tipe =>
          ['112', '122', '211', '212', '221', '222'].includes(tipe.id_tipe_sekolah.toString())
        ).map(tipe => ({
          value: tipe.id_tipe_sekolah.toString(),
          label: tipe.slug
        }));
        setTipeSekolahOptions(filteredTipeSekolah);
      } catch (error) {
        console.error('Error fetching tipe sekolah:', error);
        toast.error('Gagal mengambil data tipe sekolah');
      }
    };

    fetchTipeSekolah();
  }, []);

  /**
   * Effect untuk mengambil data sekolah asal berdasarkan tipe
   * - Dipanggil saat tipe sekolah berubah
   * - Mengosongkan daftar sekolah jika tidak ada tipe yang dipilih
   * - Mengubah format data untuk dropdown
   */
  useEffect(() => {
    const fetchSekolahAsal = async () => {
      try {
        if (selectedTipeSekolah) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${selectedTipeSekolah}`);

          if (response.data && response.data.length > 0) {
            // Ubah format data untuk dropdown
            const options = response.data.map(item => ({
              value: item.id_sekolah.toString(),
              label: item.nama
            }));
            setSekolahOptions(options);
          } else {
            setSekolahOptions([]);
            // toast.info('Belum ada sekolah dengan tipe tersebut');
          }
        } else {
          setSekolahOptions([]);
        }
      } catch (error) {
        console.error('Error mengambil data sekolah:', error);
        setSekolahOptions([]);
        // toast.info('Belum ada sekolah dengan tipe tersebut');
      }
    };

    fetchSekolahAsal();
  }, [selectedTipeSekolah]);

  /**
   * Handler untuk perubahan tipe sekolah
   * - Mengupdate state tipe sekolah yang dipilih
   * - Mereset pilihan sekolah di formData
   */
  const handleTipeSekolahChange = async (e) => {
    const selectedValue = e.target.value;
    console.log('Selected Tipe Sekolah:', selectedValue);
    setSelectedTipeSekolah(selectedValue);

    // Reset dan update formData ketika tipe sekolah berubah
    setFormData(prev => {
      console.log('Previous FormData:', prev);
      const newFormData = {
        ...prev,
        id_tipe_sekolah_asal: selectedValue ? parseInt(selectedValue) : null, // Konversi ke integer jika ada nilai
        pilihan_sekolah: '',
        id_sekolah_asal: ''
      };
      console.log('New FormData after tipe sekolah change:', newFormData);
      return newFormData;
    });

    if (selectedValue) {
      // Jika memilih TK (id: 112) atau RA (id: 122), tampilkan sekolah SD (id: 211)
      // Jika memilih SD/MI (id: 211, 212, 221, 222), tampilkan SMPN (id: 311)
      const tipeToFetch = selectedValue === '112' ? '211'
        : selectedValue === '122' ? '211'
          : ['211', '212', '221', '222'].includes(selectedValue) ? '311'
            : selectedValue;
      console.log('Tipe to Fetch:', tipeToFetch);
      await fetchSekolahByTipe(tipeToFetch);
    } else {
      setNearbySchools([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'isWargaBlitar') {
      handleWargaBlitarChange(e);
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };


  /**
   * Fungsi untuk mengecek kuota sekolah
   * @param {number} idSekolah - ID sekolah yang akan dicek
   * @param {number} idJalur - ID jalur pendaftaran
   */
  const cekKuotaSekolah = async (idSekolah, idJalur) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/cek-kuota/${idJalur}/${idSekolah}`);
      if (response.data.status) {
        setKuotaSekolah(prev => ({
          ...prev,
          [idSekolah]: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error saat cek kuota:', error);
    }
  };

  /**
   * Effect untuk mengecek kuota setiap sekolah saat daftar sekolah berubah
   */
  useEffect(() => {
    const checkAllSchoolsQuota = async () => {
      // Reset kuota state
      setKuotaSekolah({});

      // Cek kuota untuk setiap sekolah
      for (const school of nearbySchools) {
        await cekKuotaSekolah(school.id, 1); // 1 adalah ID untuk jalur zonasi
      }
    };

    if (nearbySchools.length > 0) {
      checkAllSchoolsQuota();
    }
  }, [nearbySchools]);

  /**
   * Fungsi untuk menghitung jarak antara dua koordinat menggunakan formula Haversine
   * @param {number} lat1 - Latitude titik pertama
   * @param {number} lon1 - Longitude titik pertama
   * @param {number} lat2 - Latitude titik kedua
   * @param {number} lon2 - Longitude titik kedua
   * @returns {number} Jarak dalam kilometer
   */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Number(distance.toFixed(2));
  }, []);

  /**
   * Effect untuk mengambil dan mengurutkan sekolah terdekat
   * - Dipanggil saat koordinat berubah dari formData atau coordinatesMap
   * - Mengambil data sekolah dari API
   * - Menghitung jarak ke setiap sekolah
   * - Mengurutkan berdasarkan jarak terdekat
   */
  useEffect(() => {
    const fetchNearbySchools = async () => {
      try {
        // Ambil koordinat dari formData atau coordinatesMap
        const latitude = formData.latitude ? parseFloat(formData.latitude) : coordinatesMap ? coordinatesMap.lat : null;
        const longitude = formData.longitude ? parseFloat(formData.longitude) : coordinatesMap ? coordinatesMap.lng : null;

        if (latitude && longitude) {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah`);
          if (!response.ok) throw new Error('Gagal mengambil data sekolah');

          const schools = await response.json();

          // Hitung jarak untuk setiap sekolah
          const schoolsWithDistance = schools.data
            .map(school => ({
              id: school.id_sekolah,
              name: school.nama,
              distance: calculateDistance(
                latitude,
                longitude,
                parseFloat(school.latitude),
                parseFloat(school.longitude)
              )
            }))
            .sort((a, b) => a.distance - b.distance) // Urutkan berdasarkan jarak
            .slice(0, 5); // Ambil 5 sekolah terdekat

          setNearbySchools(schoolsWithDistance);
        } else {
          setNearbySchools([]);
        }
      } catch (error) {
        console.error('Error fetching nearby schools:', error);
        toast.error(
          <div>
            <p>❌ Perhatian!</p>
            <p>Gagal mengambil data sekolah terdekat</p>
          </div>,
          {
            autoClose: false,
            closeOnClick: true
          }
        );
      }
    };

    fetchNearbySchools();
  }, [formData.latitude, formData.longitude, coordinatesMap, calculateDistance]);

  // Fungsi untuk mengambil data sekolah asal berdasarkan tipe
  useEffect(() => {
    const fetchSekolahAsal = async () => {
      try {
        if (selectedTipeSekolah) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${selectedTipeSekolah}`);

          if (response.data && response.data.length > 0) {
            // Ubah format data untuk dropdown
            const options = response.data.map(item => ({
              value: item.id_sekolah.toString(),
              label: item.nama
            }));
            setSekolahOptions(options);
          } else {
            setSekolahOptions([]);
            // toast.info('Belum ada sekolah dengan tipe tersebut');
          }
        } else {
          setSekolahOptions([]);
        }
      } catch (error) {
        console.error('Error mengambil data sekolah:', error);
        setSekolahOptions([]);
        // toast.info('Belum ada sekolah dengan tipe tersebut');
      }
    };

    fetchSekolahAsal();
  }, [selectedTipeSekolah]);

  // State untuk menyimpan status jadwal
  const [jadwalData, setJadwalData] = useState({
    tanggal_mulai: null,
    tanggal_selesai: null
  });
  const [jadwalSDData, setJadwalSDData] = useState({
    tanggal_mulai: null,
    tanggal_selesai: null
  });

  // Fungsi untuk mengecek status jadwal
  const checkJadwalStatus = async () => {
    try {
      // Cek jadwal untuk TK/RA
      const responseTK = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/jadwal-sistem/1`);
      const { tanggal_mulai, tanggal_selesai } = responseTK.data.data.jadwal;
      setJadwalData({ tanggal_mulai, tanggal_selesai });

      // Cek jadwal untuk SD/MI
      const responseSD = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/jadwal-sistem/9`);
      const { tanggal_mulai: mulaiSD, tanggal_selesai: selesaiSD } = responseSD.data.data.jadwal;
      setJadwalSDData({ tanggal_mulai: mulaiSD, tanggal_selesai: selesaiSD });
    } catch (error) {
      console.error('Error checking jadwal status:', error);
    }
  };

  // Fungsi untuk mengecek apakah waktu sekarang dalam rentang jadwal TK/RA
  const isDateInRange = useMemo(() => {
    if (!jadwalData.tanggal_mulai || !jadwalData.tanggal_selesai) return false;

    const currentTime = moment();
    const startTime = moment(jadwalData.tanggal_mulai);
    const endTime = moment(jadwalData.tanggal_selesai);

    return currentTime.isBetween(startTime, endTime, null, '[]');
  }, [jadwalData]);

  // Fungsi untuk mengecek apakah waktu sekarang dalam rentang jadwal SD/MI
  const isDateInRangeSD = useMemo(() => {
    if (!jadwalSDData.tanggal_mulai || !jadwalSDData.tanggal_selesai) return false;

    const currentTime = moment();
    const startTime = moment(jadwalSDData.tanggal_mulai);
    const endTime = moment(jadwalSDData.tanggal_selesai);

    return currentTime.isBetween(startTime, endTime, null, '[]');
  }, [jadwalSDData]);

  // Fungsi untuk mengecek apakah sekolah adalah TK/RA (112/122)
  const isTKRA = useCallback((value) => {
    return value === '112' || value === '122';
  }, []);

  // Fungsi untuk mengecek apakah sekolah adalah SD/MI (211, 212, 221, 222)
  const isSDMI = useCallback((value) => {
    return ['211', '212', '221', '222'].includes(value);
  }, []);

  // Fungsi untuk menentukan apakah opsi harus dinonaktifkan
  const shouldDisableOption = useCallback((optionValue) => {
    // Nonaktifkan opsi TK/RA jika di luar rentang waktu jadwal TK/RA
    if (isTKRA(optionValue)) {
      return !isDateInRange;
    }
    // Nonaktifkan opsi SD/MI jika di luar rentang waktu jadwal SD/MI
    if (isSDMI(optionValue)) {
      return !isDateInRangeSD;
    }
    return false;
  }, [isDateInRange, isDateInRangeSD, isTKRA, isSDMI]);

  // Filter dan modifikasi opsi tipe sekolah berdasarkan jadwal
  const filteredTipeSekolahOptions = useMemo(() => {
    return tipeSekolahOptions.map(option => ({
      ...option,
      disabled: shouldDisableOption(option.value)
    }));
  }, [tipeSekolahOptions, shouldDisableOption]);

  // Panggil fungsi checkJadwalStatus saat komponen dimount
  useEffect(() => {
    checkJadwalStatus();
  }, []);

  // Cek apakah semua opsi tipe sekolah dinonaktifkan
  const isAllOptionsDisabled = useMemo(() => {
    // Filter hanya opsi yang merupakan TK/RA atau SD/MI
    const relevantOptions = tipeSekolahOptions.filter(option =>
      isTKRA(option.value) || isSDMI(option.value)
    );
    // Cek apakah semua opsi yang relevan dinonaktifkan
    return relevantOptions.length > 0 && relevantOptions.every(option =>
      shouldDisableOption(option.value)
    );
  }, [tipeSekolahOptions, isTKRA, isSDMI, shouldDisableOption]);

  // Fungsi untuk memfilter opsi sekolah berdasarkan pencarian
  const filteredSekolahOptions = useMemo(() => {
    if (!selectedTipeSekolah || !sekolahOptions) return [];
    if (!searchSekolah) return sekolahOptions;

    return sekolahOptions.filter(option =>
      option.label.toLowerCase().includes(searchSekolah.toLowerCase())
    );
  }, [searchSekolah, selectedTipeSekolah, sekolahOptions]);

  // Handler untuk memilih sekolah
  const handleSekolahSelect = (value, label) => {
    setFormData(prev => ({
      ...prev,
      id_sekolah_asal: parseInt(value),
      sekolah_asal: label // Simpan juga nama sekolah
    }));
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

  // Simpan konten yang akan ditampilkan jika semua opsi dinonaktifkan
  const disabledContent = (
    <>
      {/* Banner Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={asset.banner1}
          alt="Banner Pendaftaran"
          className="w-full h-full object-cover brightness-50 transform scale-105 hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            PENDAFTARAN
          </h1>
          <div className="w-24 h-1 bg-blue-500 rounded-full animate-width"></div>
        </div>
      </div>

      {/* Pesan Pendaftaran Ditutup */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            PENDAFTARAN SUDAH DITUTUP
          </h2>
          <p className="text-red-600">
            Pendaftaran online Program Penerimaan Siswa Baru Kabupaten Blitar sudah ditutup.
          </p>
        </div>
      </div>
    </>
  );

  const handleWargaBlitarChange = (e) => {
    setIsWargaBlitar(e.target.checked);
    // Reset data verifikasi jika checkbox diubah
    setIsDataVerified(false);
    setFormData(prev => ({
      ...prev,
      // Reset data wilayah jika checkbox diubah
      id_provinsi: '',
      provinsi: '',
      id_kabupaten_kota: '',
      kabupaten_kota: '',
      id_kecamatan: '',
      kecamatan: '',
      id_kelurahan: '',
      kelurahan_desa: ''
    }));
  };

  /**
   * Effect untuk mengambil data provinsi dari API
   * - Mengambil data provinsi saat komponen dimount
   * - Mengubah format data untuk select options
   */
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/provinsi`
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
  }, []);

  /**
   * Effect untuk mengambil data kabupaten/kota berdasarkan provinsi yang dipilih
   * - Mengambil data kabupaten/kota ketika provinsi dipilih
   * - Reset data kabupaten/kota jika provinsi kosong
   */
  useEffect(() => {
    const fetchKabupatenKota = async () => {
      try {
        if (!formData.id_provinsi) {
          setKabupatenKotaOptions([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kabupaten-kota/provinsi/${formData.id_provinsi}`
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
  }, [formData.id_provinsi]);

  /**
   * Effect untuk mengambil data kecamatan berdasarkan kabupaten/kota yang dipilih
   * - Mengambil data kecamatan ketika kabupaten/kota dipilih
   * - Reset data kecamatan jika kabupaten/kota kosong
   */
  useEffect(() => {
    const fetchKecamatan = async () => {
      try {
        if (!formData.id_kabupaten_kota) {
          setKecamatanOptions([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/${formData.id_kabupaten_kota}`
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
  }, [formData.id_kabupaten_kota]);

  /**
   * Effect untuk mengambil data kelurahan berdasarkan kecamatan yang dipilih
   * - Mengambil data kelurahan ketika kecamatan dipilih
   * - Reset data kelurahan jika kecamatan kosong
   */
  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        if (!formData.id_kecamatan) {
          setKelurahanOptions([]);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${formData.id_kecamatan}`
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
  }, [formData.id_kecamatan]);

  // Handler untuk perubahan provinsi
  const handleProvinsiChange = (e) => {
    const { value } = e.target;
    const selectedProvinsi = provinsiOptions.find(p => p.value === value);

    setFormData(prev => ({
      ...prev,
      id_provinsi: value,
      provinsi: selectedProvinsi?.label || '',
      id_kabupaten_kota: '',
      kabupaten_kota: '',
      id_kecamatan: '',
      kecamatan: '',
      id_kelurahan: '',
      kelurahan_desa: ''
    }));
  };

  // Handler untuk perubahan kabupaten/kota
  const handleKabupatenChange = (e) => {
    const { value } = e.target;
    const selectedKabupaten = kabupatenKotaOptions.find(k => k.value === value);

    setFormData(prev => ({
      ...prev,
      id_kabupaten_kota: value,
      kabupaten_kota: selectedKabupaten?.label || '',
      id_kecamatan: '',
      kecamatan: '',
      id_kelurahan: '',
      kelurahan_desa: ''
    }));
  };

  // Handler untuk perubahan kecamatan
  const handleKecamatanChange = (e) => {
    const { value } = e.target;
    const selectedKecamatan = kecamatanOptions.find(k => k.value === value);

    setFormData(prev => ({
      ...prev,
      id_kecamatan: value,
      kecamatan: selectedKecamatan?.label || '',
      id_kelurahan: '',
      kelurahan_desa: ''
    }));
  };

  // Handler untuk perubahan kelurahan/desa
  const handleKelurahanChange = (e) => {
    const { value } = e.target;
    const selectedKelurahan = kelurahanOptions.find(k => k.value === value);

    setFormData(prev => ({
      ...prev,
      id_kelurahan: value,
      kelurahan_desa: selectedKelurahan?.label || ''
    }));
  };

  const handleGpsLokasiChange = (e) => {
    setGpsLokasi(e.target.value);
  };

  if (isAllOptionsDisabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar />

        {disabledContent}

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
      <Header />
      <Navbar />

      {/* Banner Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={asset.banner1}
          alt="Banner Pendaftaran"
          className="w-full h-full object-cover brightness-50 transform scale-105 hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            PENDAFTARAN
          </h1>
          <div className="w-24 h-1 bg-blue-500 rounded-full animate-width"></div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {isSuccess ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 text-center">
              <div className="mb-6">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Akun Telah Berhasil Dibuat!
              </h2>
              {infoAkun && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
                  <div className="mb-3">
                    <span className="font-semibold">Username:</span>
                    <div className="text-blue-600 mt-1 text-lg">{infoAkun.username}</div>
                  </div>
                  <div>
                    <span className="font-semibold">Password:</span>
                    <div className="text-blue-600 mt-1 text-lg">{infoAkun.username}</div>
                  </div>
                </div>
              )}
              <p className="text-gray-600 mb-8">
                Silahkan klik tombol login di bawah ini untuk masuk ke akun Anda.
              </p>
              <div className="flex flex-col gap-4 justify-center items-center">
                <a
                  href="/login"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Login Sekarang
                </a>
                <button
                  onClick={handleBack}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Kembali ke Form Pendaftaran
                </button>
              </div>
            </div>
          ) : hasFormData ? (
            <div className='bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden'>
              <div className='p-8'>
                <h2 className='text-2xl md:text-3xl text-center font-bold text-gray-800 mb-10'>
                  Pendaftaran
                </h2>

                {isLuarBlitarScheduleActive && (
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

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {/* Data Diri */}
                  <div className="flex items-center gap-4 mb-6">
                    <FaUser icon="fa-solid fa-user" className='h-6 w-6' />
                    <h3 className='text-xl font-bold'>Data Diri</h3>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                    <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                      NIK
                    </label>
                    <div className="w-full md:w-3/4 flex">
                      <input
                        type="text"
                        id="nik"
                        name="nik"
                        value={nik} // Gunakan state nik langsung
                        onChange={handleNikChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
                        placeholder="Masukkan NIK"
                      />
                      <button
                        type="button"
                        onClick={handlePeriksaNik}
                        disabled={loading || nik.length !== 16 || !isWargaBlitar}
                        className={`px-4 py-2 bg-blue-500 text-white rounded-r-lg focus:outline-none focus:shadow-outline hover:bg-blue-600 transition-colors ${loading || nik.length !== 16 || !isWargaBlitar ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
                      >
                        {loading ? (
                          <>
                            <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                            <span>Memeriksa...</span>
                          </>
                        ) : (
                          <>
                            <FaSearch className="w-4 h-4" />
                            <span>Periksa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="text-red-500 text-sm mt-1">
                      {error}
                    </div>
                  )}
                  {nik && nik.length !== 16 && (
                    <div className="text-red-500 text-sm mt-1">
                      NIK harus terdiri dari 16 digit
                    </div>
                  )}

                  {(!isWargaBlitar || isDataVerified) && (
                    <>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          NISN
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="text"
                            id="nisn"
                            name="nisn"
                            value={formData.nisn || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Nama Siswa
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="text"
                            id="nama_siswa"
                            name="nama_siswa"
                            value={formData.nama_siswa || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Jenis Kelamin
                        </label>
                        <div className="w-full md:w-3/4 flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="jenis_kelamin"
                              value="LAKI-LAKI"
                              checked={formData.jenis_kelamin === 'LAKI-LAKI'}
                              onChange={handleChange}
                              disabled={isWargaBlitar && isDataVerified}
                              className="form-radio mr-2"
                            />
                            <span>Laki-laki</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="jenis_kelamin"
                              value="PEREMPUAN"
                              checked={formData.jenis_kelamin === 'PEREMPUAN'}
                              onChange={handleChange}
                              disabled={isWargaBlitar && isDataVerified}
                              className="form-radio mr-2"
                            />
                            <span>Perempuan</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Tempat Lahir
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="text"
                            id="tempat_lahir"
                            name="tempat_lahir"
                            value={formData.tempat_lahir || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Tanggal Lahir
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="date"
                            id="tanggal_lahir"
                            name="tanggal_lahir"
                            value={formData.tanggal_lahir || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Nama Ayah
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="text"
                            id="nama_ayah"
                            name="nama_ayah"
                            value={formData.nama_ayah || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Nama Ibu
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="text"
                            id="nama_ibu"
                            name="nama_ibu"
                            value={formData.nama_ibu || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Nomor Telepon
                        </label>
                        <div className="w-full md:w-3/4">
                          <input
                            type="text"
                            id="nomor_telepon"
                            name="nomor_telepon"
                            value={formData.nomor_telepon || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Alamat
                        </label>
                        <div className="w-full md:w-3/4">
                          <textarea
                            id="alamat"
                            name="alamat"
                            value={formData.alamat || ''}
                            onChange={handleChange}
                            readOnly={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Provinsi
                        </label>
                        <div className="w-full md:w-3/4">
                          <select
                            id="provinsi"
                            name="provinsi"
                            value={formData.id_provinsi || ''}
                            onChange={handleProvinsiChange}
                            disabled={isWargaBlitar && isDataVerified}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          >
                            <option value="">Pilih Provinsi</option>
                            {provinsiOptions.map(prov => (
                              <option key={prov.value} value={prov.value}>{prov.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Kabupaten/Kota
                        </label>
                        <div className="w-full md:w-3/4">
                          <select
                            id="kabupaten_kota"
                            name="kabupaten_kota"
                            value={formData.id_kabupaten_kota || ''}
                            onChange={handleKabupatenChange}
                            disabled={isWargaBlitar && isDataVerified || !formData.id_provinsi}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          >
                            <option value="">Pilih Kabupaten/Kota</option>
                            {kabupatenKotaOptions.map(kab => (
                              <option key={kab.value} value={kab.value}>{kab.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Kecamatan
                        </label>
                        <div className="w-full md:w-3/4">
                          <select
                            id="kecamatan"
                            name="kecamatan"
                            value={formData.id_kecamatan || ''}
                            onChange={handleKecamatanChange}
                            disabled={isWargaBlitar && isDataVerified || !formData.id_kabupaten_kota}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          >
                            <option value="">Pilih Kecamatan</option>
                            {kecamatanOptions.map(kec => (
                              <option key={kec.value} value={kec.value}>{kec.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Kelurahan/Desa
                        </label>
                        <div className="w-full md:w-3/4">
                          <select
                            id="kelurahan_desa"
                            name="kelurahan_desa"
                            value={formData.id_kelurahan || ''}
                            onChange={handleKelurahanChange}
                            disabled={isWargaBlitar && isDataVerified || !formData.id_kecamatan}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${isWargaBlitar && isDataVerified ? 'bg-gray-100' : 'bg-white'}`}
                          >
                            <option value="">Pilih Kelurahan/Desa</option>
                            {kelurahanOptions.map(kel => (
                              <option key={kel.value} value={kel.value}>{kel.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          GPS Lokasi
                        </label>
                        <div className="w-full md:w-3/4 flex">
                          <input
                            type="text"
                            id="gps_lokasi"
                            name="gps_lokasi"
                            value={gpsLokasi}
                            onChange={handleGpsLokasiChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
                            placeholder="Masukkan koordinat atau gunakan tombol Cari"
                          />
                          <button
                            type="button"
                            onClick={handleSearchLocation}
                            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg focus:outline-none focus:shadow-outline hover:bg-blue-600 transition-colors"
                          >
                            Cari
                          </button>
                        </div>
                      </div>
                      <div className="mb-4">
                        <Maps
                          center={centerMap}
                          coordinates={coordinatesMap}
                          address={addressMap}
                          mapType={mapTypeMap}
                          setMapType={setMapTypeMap}
                          isLocating={isLocatingMap}
                          onMapLoad={handleMapLoadMap}
                          isMapLoaded={isMapLoadedMap}
                          containerStyle={containerStyleMap}
                          areaOptions={areaOptionsMap}
                          setCoordinates={setCoordinatesMap}
                          setAddress={setAddressMap}
                          additionalMarkers={schoolMarkers}
                        />
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <span className="font-medium text-sm text-gray-700">Latitude:</span>
                            <div className="mt-1 font-mono text-sm">
                              {formData.latitude ? parseFloat(formData.latitude).toFixed(6) : coordinatesMap ? coordinatesMap.lat.toFixed(6) : '-'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <span className="font-medium text-sm text-gray-700">Longitude:</span>
                            <div className="mt-1 font-mono text-sm">
                              {formData.longitude ? parseFloat(formData.longitude).toFixed(6) : coordinatesMap ? coordinatesMap.lng.toFixed(6) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                    </>
                  )}

                  {/* Pendaftaran Sekolah */}
                  <div className="flex items-center gap-4 mt-20 mb-6">
                    <FaUniversity icon="fa-solid fa-user" className="h-6 w-6" />
                    <h3 className="text-xl font-bold">Pendaftaran Sekolah</h3>
                  </div>

                  {/* Form Pendaftaran Sekolah */}
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                      <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                        Jalur Pendaftaran
                      </label>
                      <div className="w-full md:w-3/4 flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="zonasi"
                            value="zonasi"
                            defaultChecked={true}
                            className="form-radio mr-2"
                          />
                          <span>Domisili</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                      <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                        Sekolah Asal
                      </label>
                      <div className='w-full md:w-3/4 flex flex-col gap-4'>
                        <div className="flex flex-col md:flex-row gap-4">
                          <select
                            id="pilih_tksd"
                            name="id_tipe_sekolah_asal"
                            value={selectedTipeSekolah}
                            onChange={handleTipeSekolahChange}
                            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Pilih TK/SD</option>
                            {filteredTipeSekolahOptions.map(option => (
                              <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <div className="relative sekolah-dropdown-container w-full md:w-2/3">
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                              placeholder="Cari dan pilih sekolah..."
                              value={searchSekolah}
                              onChange={(e) => {
                                setSearchSekolah(e.target.value);
                                setShowSekolahDropdown(true);
                              }}
                              onFocus={() => setShowSekolahDropdown(true)}
                              disabled={!selectedTipeSekolah}
                            />

                            {/* Dropdown hasil pencarian */}
                            {showSekolahDropdown && selectedTipeSekolah && (
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
                                    Tidak ada sekolah yang ditemukan
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className='flex items-center gap-4 cursor-pointer'>
                          <input
                            type="checkbox"
                            id="sekolah_tidak_terdaftar"
                            name="sekolah_tidak_terdaftar"
                            onChange={handleCheckboxChange}
                          />
                          <label htmlFor="sekolah_tidak_terdaftar">
                            Sekolah saya tidak ada di daftar tersebut
                          </label>
                        </div>

                        {isCheckboxChecked && (
                          <div className='flex flex-col md:flex-row gap-4'>
                            <select
                              id="pilih_tksd"
                              name="id_tipe_sekolah_asal"
                              value={selectedTipeSekolah}
                              onChange={handleTipeSekolahChange}
                              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Pilih TK/SD</option>
                              {filteredTipeSekolahOptions.map(option => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                  disabled={option.disabled}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              id="pilih_sekolah"
                              name="sekolah_asal"
                              value={formData.sekolah_asal || ''}
                              onChange={handleChange}
                              placeholder='Masukan nama sekolah asal'
                              className='w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                      <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                        Tahun Lulus
                      </label>
                      <div className="w-full md:w-3/4">
                        <div className="flex flex-col">
                          <input
                            type="number"
                            id="tahun_lulus"
                            name="tahun_lulus"
                            value={formData.tahun_lulus}
                            onChange={handleChange}
                            min="2000"
                            max={new Date().getFullYear()}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    {(!isWargaBlitar || isDataVerified) && (
                      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                        <label htmlFor="pilihan_sekolah" className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                          Pilihan Sekolah
                        </label>
                        <div className='w-full md:w-3/4 flex flex-col gap-4'>
                          {(() => {
                            const availableSchools = nearbySchools.filter(school => {
                              const schoolQuota = kuotaSekolah[school.id];
                              return !schoolQuota || !schoolQuota.is_penuh;
                            });

                            if (availableSchools.length === 0) {
                              return (
                                <div className="p-4 text-center text-gray-500">
                                  - Tidak ada sekolah tersedia -
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col divide-y divide-gray-200 border border-gray-300 rounded-md">
                                {availableSchools.slice(0, 5).map((school) => (
                                  <label key={school.id} className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                      <input
                                        type="radio"
                                        name="pilihan_sekolah"
                                        value={school.id}
                                        className="form-radio mr-3 h-4 w-4 text-blue-500"
                                        onChange={(e) => {
                                          setFormData(prev => ({
                                            ...prev,
                                            pilihan_sekolah: school.id
                                          }));
                                        }}
                                        checked={formData.pilihan_sekolah === school.id}
                                      />
                                      <span>{school.name}</span>
                                    </div>
                                    <span className="font-semibold md:ml-4">{school.distance} KM</span>
                                  </label>
                                ))}
                              </div>
                            );
                          })()}
                          <div className="flex gap-4">
                            <input type="hidden" name="id_provinsi" value={formData.id_provinsi} />
                            <input type="hidden" name="id_kabupaten_kota" value={formData.id_kabupaten_kota} />
                            <input type="hidden" name="id_kecamatan" value={formData.id_kecamatan} />
                            <input type="hidden" name="id_kelurahan" value={formData.id_kelurahan} />
                          </div>
                          {/* Pernyataan */}
                          <div className='-mt-4'>
                            <CheckboxField
                              name="pernyataan"
                              checked={formData.pernyataan}
                              onChange={handleChange}
                              label="Menyatakan dengan sesungguhnya bahwa seluruh informasi/dokumen yang saya berikan pada saat pendaftaran PPDB Online ini adalah benar dan dapat dipertanggungjawabkan."
                              className="flex items-start gap-2"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Tombol Submit */}
                  {(!isWargaBlitar || isDataVerified) && (
                    <div className="flex justify-end mt-8">
                      <SaveButton
                        type="submit"
                        disabled={loading || !formData.pernyataan} // Tambahkan kondisi pernyataan
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Data'}
                      </SaveButton>
                    </div>
                  )}
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BuatAkun;