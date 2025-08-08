import React, { useState, useEffect } from 'react';
import { InputField, SelectField, TextAreaField } from '../../../../components/forms/FormsVariant/Forms';
import { Radio, Button, Input, Dialog, IconButton } from "@material-tailwind/react";
import Maps from '../../../../components/element/Card/Maps';
import { MdMyLocation, MdSearch } from "react-icons/md";
import { FaUniversity } from 'react-icons/fa';
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PengalihanForm = ({ open, data, onSubmit, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nik: '',
    nisn: '',
    nama_siswa: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    id_jenis_kelamin: '',
    nama_ayah: '',
    nama_ibu: '',
    nomor_telepon: '',
    id_provinsi: '',
    id_kabupaten_kota: '',
    id_kecamatan: '',
    id_kelurahan: '',
    alamat: '',
    latitude: '',
    longitude: '',
    id_jalur_pendaftaran: '',
    id_tipe_sekolah_asal: '',
    id_sekolah_asal: '',
    tahun_lulus: '',
    id_sekolah_tujuan: ''
  });

  const [coordinates, setCoordinates] = useState(null);
  const [center, setCenter] = useState({ lat: -8.0952, lng: 112.1665 });
  const [address, setAddress] = useState(formData.alamat || '');
  const [mapType, setMapType] = useState('roadmap');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isLoadedState, setIsLoaded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk menyimpan opsi wilayah
  const [wilayahOptions, setWilayahOptions] = useState({
    provinsi: [],
    kabupaten: [],
    kecamatan: [],
    kelurahan: []
  });

  // State untuk loading setiap select
  const [loadingState, setLoadingState] = useState({
    provinsi: false,
    kabupaten: false,
    kecamatan: false,
    kelurahan: false
  });

  // State untuk menyimpan opsi sekolah
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([
    { value: "", label: "Pilih TK/SD" }
  ]);
  const [sekolahOptions, setSekolahOptions] = useState([]);
  const [isLoadingSekolah, setIsLoadingSekolah] = useState(false);
  const [isLoadingTipeSekolah, setIsLoadingTipeSekolah] = useState(false);

  // State untuk menyimpan sekolah yang diurutkan berdasarkan jarak
  const [sortedSekolah, setSortedSekolah] = useState([]);
  const [sekolahData, setSekolahData] = useState([]);
  const [isLoadingSekolahData, setIsLoadingSekolahData] = useState(false);

  // Fungsi untuk mendapatkan tipe sekolah tujuan berdasarkan sekolah asal
  const getTipeSekolahTujuan = (tipeSekolahAsal) => {
    // Mapping untuk slug sekolah
    const slugMapping = {
      'TK': ['211', '212', '221', '222'], // TK -> SD/MI (Negeri & Swasta)
      'SD': ['311', '312', '321', '322'],  // SD -> SMP/MTs (Negeri & Swasta)
      'SDN': ['311', '312', '321', '322'], // SDN -> SMP/MTs (Negeri & Swasta)
      'MI': ['311', '312', '321', '322']   // MI -> SMP/MTs (Negeri & Swasta)
    };

    // Normalisasi input ke uppercase dan hapus spasi
    const normalizedInput = tipeSekolahAsal.replace(/\s+/g, '');
    
    // Cek jika ada di mapping
    return slugMapping[normalizedInput] || [];
  };

  // Fungsi untuk mengambil data sekolah dari API
  const fetchSekolahData = async () => {
    try {
      setIsLoadingSekolahData(true);
      
      // Jika tidak ada tipe sekolah asal yang dipilih, tidak perlu mengambil data sekolah tujuan
      if (!formData.id_tipe_sekolah_asal) {
        setSortedSekolah([]);
        return;
      }
      
      // Cari tipe sekolah asal
      const tipeSekolahAsalObj = tipeSekolahOptions.find(option => 
        option.value === formData.id_tipe_sekolah_asal
      );
      
      if (!tipeSekolahAsalObj) {
        setSortedSekolah([]);
        return;
      }
      
      // Ambil tipe sekolah dari slug
      const tipeSekolahAsalSlug = tipeSekolahAsalObj.label.toUpperCase();
      console.log('Tipe Sekolah Asal Slug:', tipeSekolahAsalSlug);
      
      // Dapatkan tipe sekolah tujuan yang sesuai
      const tipeSekolahTujuan = getTipeSekolahTujuan(tipeSekolahAsalSlug);
      console.log('Tipe Sekolah Tujuan:', tipeSekolahTujuan);
      
      if (tipeSekolahTujuan.length === 0) {
        setSortedSekolah([]);
        return;
      }
      
      const allSekolah = [];
      
      // Ambil token dari localStorage
      const userDataString = localStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const token = userData?.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }
      
      // Fetch sekolah untuk setiap tipe
      for (const tipe of tipeSekolahTujuan) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${tipe}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Gagal mengambil data sekolah');
          }
          
          const result = await response.json();
          if (Array.isArray(result)) {
            allSekolah.push(...result);
          } else if (result.data && Array.isArray(result.data)) {
            allSekolah.push(...result.data);
          }
        } catch (error) {
          console.error('Error fetching sekolah tujuan:', error);
        }
      }
      
      // Mengubah format data sekolah
      const formattedData = allSekolah
        .filter(sekolah => sekolah && sekolah.latitude && sekolah.longitude) // Filter data valid
        .map(sekolah => ({
          id: String(sekolah.id_sekolah || ''),
          nama: sekolah.nama || '',
          coordinates: {
            lat: Number(sekolah.latitude) || 0,
            lng: Number(sekolah.longitude) || 0
          }
        }));

      console.log('Data sekolah tujuan yang sudah diformat:', formattedData);
      setSekolahData(formattedData);
    } catch (error) {
      console.error('Error saat mengambil data sekolah:', error);
      setSekolahData([]);
    } finally {
      setIsLoadingSekolahData(false);
    }
  };

  // Effect untuk mengambil data sekolah saat tipe sekolah asal berubah
  useEffect(() => {
    if (formData.id_tipe_sekolah_asal) {
      fetchSekolahData();
    }
  }, [formData.id_tipe_sekolah_asal]);

  useEffect(() => {
    // Fetch data provinsi saat komponen dimount
    fetchProvinsi();
  }, []);

  useEffect(() => {
    // Fetch kabupaten ketika provinsi berubah
    if (formData.id_provinsi) {
      fetchKabupaten(formData.id_provinsi);
    }
  }, [formData.id_provinsi]);

  useEffect(() => {
    // Fetch kecamatan ketika kabupaten berubah
    if (formData.id_kabupaten_kota) {
      fetchKecamatan(formData.id_kabupaten_kota);
    }
  }, [formData.id_kabupaten_kota]);

  useEffect(() => {
    // Fetch kelurahan ketika kecamatan berubah
    if (formData.id_kecamatan) {
      fetchKelurahan(formData.id_kecamatan);
    }
  }, [formData.id_kecamatan]);

  useEffect(() => {
    if (formData.id_tipe_sekolah_asal) {
      fetchSekolahByTipe(formData.id_tipe_sekolah_asal);
    } else {
      setSekolahOptions([{ value: "", label: "Pilih Sekolah Asal" }]);
    }
  }, [formData.id_tipe_sekolah_asal]);

  useEffect(() => {
    if (data && data.id_tipe_sekolah_asal) {
      fetchSekolahByTipe(data.id_tipe_sekolah_asal);
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      console.log('Data yang diterima:', data);
      console.log('ID Tipe Sekolah Asal:', data.id_tipe_sekolah_asal);
      
      // Ambil semua tipe sekolah
      fetchAllTipeSekolah();
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      // Debug log untuk melihat data yang diterima
      console.log('Data lengkap yang diterima:', data);
      console.log('Tahun lulus yang diterima:', data.tahun_lulus);

      // Set form data dengan semua field yang diperlukan
      const formattedData = {
        nik: data.nik || '',
        nisn: data.nisn || '',
        nama_siswa: data.nama_siswa || '',
        tempat_lahir: data.tempat_lahir || '',
        tanggal_lahir: data.tanggal_lahir || '',
        id_jenis_kelamin: data.id_jenis_kelamin?.toString() || '',
        nama_ayah: data.nama_ayah || '',
        nama_ibu: data.nama_ibu || '',
        nomor_telepon: data.nomor_telepon || '',
        id_provinsi: data.id_provinsi?.toString() || '',
        id_kabupaten_kota: data.id_kabupaten_kota?.toString() || '',
        id_kecamatan: data.id_kecamatan?.toString() || '',
        id_kelurahan: data.id_kelurahan?.toString() || '',
        alamat: data.alamat || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        id_jalur_pendaftaran: data.id_jalur_pendaftaran?.toString() || '',
        id_tipe_sekolah_asal: data.id_tipe_sekolah_asal?.toString() || '',
        id_sekolah_asal: data.id_sekolah_asal?.toString() || '',
        tahun_lulus: data.tahun_lulus || new Date().toISOString().split('T')[0], // Default ke hari ini jika kosong
        id_sekolah_tujuan: data.id_sekolah_tujuan?.toString() || ''
      };

      console.log('Form data yang akan diset:', formattedData);
      setFormData(formattedData);

      // Fetch data sekolah jika ada tipe sekolah
      if (data.id_tipe_sekolah_asal) {
        fetchSekolahByTipe(data.id_tipe_sekolah_asal);
      }
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setFormData({
        nik: data.nik || '',
        nisn: data.nisn || '',
        nama_siswa: data.nama_siswa || '',
        tempat_lahir: data.tempat_lahir || '',
        tanggal_lahir: data.tanggal_lahir || '',
        id_jenis_kelamin: data.id_jenis_kelamin ? data.id_jenis_kelamin.toString() : '',
        nama_ayah: data.nama_ayah || '',
        nama_ibu: data.nama_ibu || '',
        nomor_telepon: data.nomor_telepon || '',
        id_provinsi: data.id_provinsi ? data.id_provinsi.toString() : '',
        id_kabupaten_kota: data.id_kabupaten_kota ? data.id_kabupaten_kota.toString() : '',
        id_kecamatan: data.id_kecamatan ? data.id_kecamatan.toString() : '',
        id_kelurahan: data.id_kelurahan ? data.id_kelurahan.toString() : '',
        alamat: data.alamat || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        id_jalur_pendaftaran: data.id_jalur_pendaftaran ? data.id_jalur_pendaftaran.toString() : '',
        id_tipe_sekolah_asal: data.id_tipe_sekolah_asal ? data.id_tipe_sekolah_asal.toString() : '',
        id_sekolah_asal: data.id_sekolah_asal ? data.id_sekolah_asal.toString() : '',
        tahun_lulus: data.tahun_lulus || '',
        id_sekolah_tujuan: data.id_sekolah_tujuan ? data.id_sekolah_tujuan.toString() : ''
      });

      // Set koordinat jika ada
      if (data.latitude && data.longitude) {
        setCoordinates({
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude)
        });
      }

      // Set alamat jika ada
      if (data.alamat) {
        setAddress(data.alamat);
      }
    }
  }, [data]);

  useEffect(() => {
    if (coordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        alamat: address
      }));
    }
  }, [coordinates, address]);

  useEffect(() => {
    if (formData.id_kelurahan && formData.id_kecamatan && formData.id_kabupaten_kota && formData.id_provinsi) {
      const kelurahan = wilayahOptions.kelurahan.find(k => k.value === formData.id_kelurahan)?.label || '';
      const kecamatan = wilayahOptions.kecamatan.find(k => k.value === formData.id_kecamatan)?.label || '';
      const kabupaten = wilayahOptions.kabupaten.find(k => k.value === formData.id_kabupaten_kota)?.label || '';
      const provinsi = wilayahOptions.provinsi.find(p => p.value === formData.id_provinsi)?.label || '';

      const formattedLocation = `${kelurahan}, ${kecamatan}, ${kabupaten}, ${provinsi}`;
      setSearchQuery(formattedLocation);
    }
  }, [formData.id_kelurahan, formData.id_kecamatan, formData.id_kabupaten_kota, formData.id_provinsi, wilayahOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCoordinates({ lat, lng });
  };

  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  const areaOptions = {
    center: { lat: -8.0952, lng: 112.1665 },
    zoom: 14,
    restriction: {
      latLngBounds: {
        north: -8.0452,
        south: -8.1452,
        east: 112.2165,
        west: 112.1165,
      },
      strictBounds: true,
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ address: searchQuery + ' Blitar' });

      if (response.results && response.results[0]) {
        const { lat, lng } = response.results[0].geometry.location;
        setCoordinates({ 
          lat: lat(), 
          lng: lng() 
        });
        setAddress(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });

          try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await geocoder.geocode({ 
              location: { lat: latitude, lng: longitude } 
            });

            if (result.results[0]) {
              setAddress(result.results[0].formatted_address);
            }
          } catch (error) {
            console.error('Error getting address:', error);
          }

          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
        }
      );
    }
  };

  const handleCheckboxChange = () => {
    setIsCheckboxChecked(!isCheckboxChecked);
  };

  // Fungsi untuk memformat tanggal ke format yang sesuai dengan input type="date"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleTipeSekolahChange = (e) => {
    const { name, value } = e.target;
    console.log('Tipe sekolah berubah:', { name, value });
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      id_sekolah_asal: '' // Reset sekolah asal ketika tipe berubah
    }));

    if (value) {
      fetchSekolahByTipe(value);
    } else {
      setSekolahOptions([{ value: "", label: "Pilih Sekolah Asal" }]);
    }
  };

  const handleWilayahChange = (name, value) => {
    // Reset nilai wilayah yang lebih rendah
    if (name === 'id_provinsi') {
      setFormData(prev => ({
        ...prev,
        id_provinsi: value,
        id_kabupaten_kota: '',
        id_kecamatan: '',
        id_kelurahan: ''
      }));
      setWilayahOptions(prev => ({
        ...prev,
        kabupaten: [],
        kecamatan: [],
        kelurahan: []
      }));
    } else if (name === 'id_kabupaten_kota') {
      setFormData(prev => ({
        ...prev,
        id_kabupaten_kota: value,
        id_kecamatan: '',
        id_kelurahan: ''
      }));
      setWilayahOptions(prev => ({
        ...prev,
        kecamatan: [],
        kelurahan: []
      }));
    } else if (name === 'id_kecamatan') {
      setFormData(prev => ({
        ...prev,
        id_kecamatan: value,
        id_kelurahan: ''
      }));
      setWilayahOptions(prev => ({
        ...prev,
        kelurahan: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      // Ambil token dari localStorage
      const userDataString = localStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const token = userData?.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      // 1. Update is_diterima menjadi 1
      const updateResponse = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/${data.id_pendaftaran}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_diterima: 1
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Gagal mengupdate status pendaftaran');
      }

      // 2. Ambil data sekolah untuk update kuota
      const sekolahResponse = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/${formData.id_sekolah_tujuan}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!sekolahResponse.ok) {
        throw new Error('Gagal mengambil data sekolah');
      }

      const sekolahResult = await sekolahResponse.json();
      const sekolahData = sekolahResult.data || sekolahResult; // Handle jika data dibungkus dalam property 'data'
      
      console.log('Data sekolah yang diterima:', sekolahData);

      // Tentukan field yang akan dikurangi berdasarkan jalur pendaftaran
      let updateField = '';
      switch (formData.id_jalur_pendaftaran) {
        case '1': updateField = 'zonasi'; break;
        case '2': updateField = 'prestasi'; break;
        case '3': updateField = 'pindahan'; break;
        case '4': updateField = 'afirmasi'; break;
        default: throw new Error('Jalur pendaftaran tidak valid');
      }

      // Pastikan nilai kuota saat ini adalah angka
      const kuotaSaatIni = sekolahData[updateField];
      if (typeof kuotaSaatIni !== 'number' && kuotaSaatIni !== null) {
        throw new Error(`Nilai kuota ${updateField} tidak valid: ${kuotaSaatIni}`);
      }

      // Hitung kuota baru (pastikan tidak negatif)
      const kuotaBaru = Math.max(0, (kuotaSaatIni || 0) - 1);

      console.log(`Kuota ${updateField} saat ini:`, kuotaSaatIni);
      console.log('Kuota baru:', kuotaBaru);

      // 3. Update kuota sekolah
      const kuotaResponse = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/${formData.id_sekolah_tujuan}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [updateField]: kuotaBaru
        })
      });

      if (!kuotaResponse.ok) {
        const errorText = await kuotaResponse.text();
        console.error('Response error:', errorText);
        throw new Error('Gagal mengupdate kuota sekolah');
      }

      toast.success('Berhasil menerima siswa!');
      
      // Panggil onSuccess callback untuk refresh data
      if (onSuccess) {
        onSuccess();
      }
      
      // Tutup form
      onClose();

    } catch (error) {
      console.error('Error saat submit:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchPendaftaranData = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      const pendaftaranData = result.data;
      
      // Update form data
      setFormData({
        nik: pendaftaranData.nik || '',
        nisn: pendaftaranData.nisn || '',
        nama_siswa: pendaftaranData.nama_siswa || '',
        tempat_lahir: pendaftaranData.tempat_lahir || '',
        tanggal_lahir: pendaftaranData.tanggal_lahir || '',
        id_jenis_kelamin: pendaftaranData.id_jenis_kelamin ? pendaftaranData.id_jenis_kelamin.toString() : '',
        nama_ayah: pendaftaranData.nama_ayah || '',
        nama_ibu: pendaftaranData.nama_ibu || '',
        nomor_telepon: pendaftaranData.nomor_telepon || '',
        id_provinsi: pendaftaranData.id_provinsi ? pendaftaranData.id_provinsi.toString() : '',
        id_kabupaten_kota: pendaftaranData.id_kabupaten_kota ? pendaftaranData.id_kabupaten_kota.toString() : '',
        id_kecamatan: pendaftaranData.id_kecamatan ? pendaftaranData.id_kecamatan.toString() : '',
        id_kelurahan: pendaftaranData.id_kelurahan ? pendaftaranData.id_kelurahan.toString() : '',
        alamat: pendaftaranData.alamat || '',
        latitude: pendaftaranData.latitude || '',
        longitude: pendaftaranData.longitude || '',
        id_jalur_pendaftaran: pendaftaranData.id_jalur_pendaftaran ? pendaftaranData.id_jalur_pendaftaran.toString() : '',
        id_tipe_sekolah_asal: pendaftaranData.id_tipe_sekolah_asal ? pendaftaranData.id_tipe_sekolah_asal.toString() : '',
        id_sekolah_asal: pendaftaranData.id_sekolah_asal ? pendaftaranData.id_sekolah_asal.toString() : '',
        tahun_lulus: pendaftaranData.tahun_lulus || '',
        id_sekolah_tujuan: pendaftaranData.id_sekolah_tujuan ? pendaftaranData.id_sekolah_tujuan.toString() : ''
      });

      // Set koordinat jika ada
      if (pendaftaranData.latitude && pendaftaranData.longitude) {
        setCoordinates({
          lat: parseFloat(pendaftaranData.latitude),
          lng: parseFloat(pendaftaranData.longitude)
        });
      }

      // Set alamat jika ada
      if (pendaftaranData.alamat) {
        setAddress(pendaftaranData.alamat);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching pendaftaran data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && data?.id_pendaftaran) {
      fetchPendaftaranData(data.id_pendaftaran);
    }
  }, [open, data?.id_pendaftaran]);

  // Fungsi untuk mengambil data provinsi
  const fetchProvinsi = async () => {
    try {
      setLoadingState(prev => ({ ...prev, provinsi: true }));
      // Mengambil semua data provinsi
      const response = await fetch(`${import.meta.env.VITE_API_URL}/provinsi`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setWilayahOptions(prev => ({
          ...prev,
          provinsi: data.map(prov => ({
            value: prov.id_provinsi,
            label: prov.nama_provinsi
          }))
        }));
      } else {
        console.error('Data provinsi tidak valid:', data);
      }
    } catch (error) {
      console.error('Error mengambil data provinsi:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, provinsi: false }));
    }
  };

  // Fungsi untuk mengambil data kabupaten berdasarkan provinsi
  const fetchKabupaten = async (idProvinsi) => {
    try {
      setLoadingState(prev => ({ ...prev, kabupaten: true }));
      // Mengambil data kabupaten berdasarkan ID provinsi
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kabupaten-kota/provinsi/${idProvinsi}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setWilayahOptions(prev => ({
          ...prev,
          kabupaten: data.map(kab => ({
            value: kab.id_kabupaten_kota,
            label: kab.nama_kabupaten_kota
          }))
        }));
      } else {
        console.error('Data kabupaten tidak valid:', data);
      }
    } catch (error) {
      console.error('Error mengambil data kabupaten:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, kabupaten: false }));
    }
  };

  // Fungsi untuk mengambil data kecamatan berdasarkan kabupaten
  const fetchKecamatan = async (idKabupaten) => {
    try {
      setLoadingState(prev => ({ ...prev, kecamatan: true }));
      // Mengambil data kecamatan berdasarkan ID kabupaten/kota
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/${idKabupaten}`);
      const data = await response.json();
      
      console.log('Response kecamatan:', data); // Debug log
      
      if (Array.isArray(data)) {
        setWilayahOptions(prev => ({
          ...prev,
          kecamatan: data.map(kec => ({
            value: kec.id_kecamatan,
            label: kec.nama_kecamatan
          }))
        }));
      } else {
        console.error('Data kecamatan tidak valid:', data);
      }
    } catch (error) {
      console.error('Error mengambil data kecamatan:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, kecamatan: false }));
    }
  };

  // Fungsi untuk mengambil data kelurahan berdasarkan kecamatan
  const fetchKelurahan = async (idKecamatan) => {
    try {
      setLoadingState(prev => ({ ...prev, kelurahan: true }));
      
      // Mengambil data kelurahan berdasarkan ID kecamatan
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${idKecamatan}`);
      const data = await response.json();
      
      console.log('Response kelurahan:', data); // Debug log
      
      if (Array.isArray(data)) {
        setWilayahOptions(prev => ({
          ...prev,
          kelurahan: data.map(kel => ({
            value: kel.id_kelurahan,
            label: kel.nama_kelurahan
          }))
        }));
      } else {
        console.error('Data kelurahan tidak valid:', data);
      }
    } catch (error) {
      console.error('Error mengambil data kelurahan:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, kelurahan: false }));
    }
  };

  // Fungsi untuk mengambil data sekolah berdasarkan tipe
  const fetchSekolahByTipe = async (tipeId) => {
    setIsLoadingSekolah(true);
    try {
      // Ambil token dari localStorage (data user dalam format JSON)
      const userDataString = localStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const token = userData?.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      // Lakukan request ke API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${tipeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data sekolah');
      }

      const sekolahList = await response.json();
      console.log('Response API:', sekolahList);

      if (!Array.isArray(sekolahList)) {
        throw new Error('Format data sekolah tidak valid');
      }

      // Transform data sekolah menjadi format options
      const options = sekolahList.map(sekolah => {
        if (!sekolah || !sekolah.id_sekolah || !sekolah.nama) {
          console.warn('Data sekolah tidak lengkap:', sekolah);
          return null;
        }
        return {
          value: sekolah.id_sekolah.toString(),
          label: sekolah.nama
        };
      }).filter(option => option !== null);

      // Update state dengan options baru
      setSekolahOptions([
        { value: "", label: "Pilih Sekolah Asal" },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error.message);
      setSekolahOptions([{ value: "", label: "Pilih Sekolah Asal" }]);
    } finally {
      setIsLoadingSekolah(false);
    }
  };

  // Fungsi untuk mengambil semua tipe sekolah
  const fetchAllTipeSekolah = async () => {
    setIsLoadingTipeSekolah(true);
    try {
      // Ambil token dari localStorage
      const userDataString = localStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const token = userData?.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      // Lakukan request ke API untuk mengambil semua tipe sekolah
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Response Tipe Sekolah:', result);

      // Periksa status response
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data tipe sekolah');
      }

      // Pastikan data ada dan berbentuk array
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Format data tipe sekolah tidak valid');
      }

      // Transform data tipe sekolah menjadi format options
      const options = result.data.map(tipe => ({
        value: tipe.id_tipe_sekolah.toString(),
        label: tipe.slug
      }));

      // Update state dengan options baru
      setTipeSekolahOptions([
        { value: "", label: "Pilih TK/SD" },
        ...options
      ]);

      // Set nilai tipe sekolah jika ada di data
      if (data && data.id_tipe_sekolah_asal) {
        setFormData(prev => ({
          ...prev,
          id_tipe_sekolah_asal: data.id_tipe_sekolah_asal.toString()
        }));
      }
    } catch (error) {
      console.error('Error:', error.message);
      setTipeSekolahOptions([{ value: "", label: "Pilih TK/SD" }]);
    } finally {
      setIsLoadingTipeSekolah(false);
    }
  };

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="xl"
      className="min-w-[85%] max-h-[90vh] overflow-y-auto p-0"
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Memuat data...</span>
        </div>
      ) : error ? (
        <div className="p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <div className="mt-4 flex justify-end">
            <Button color="red" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Form Pengalihan Sekolah</h2>
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={onClose}
            >
              <XMarkIcon strokeWidth={2} className="h-5 w-5" />
            </IconButton>
          </div>
          
          {/* Form Data Pribadi */}
          <div className="space-y-6 max-w-[1000px] mx-auto">
            <InputField
              label="NIK"
              name="nik"
              value={formData.nik}
              onChange={handleInputChange}
              placeholder="Masukkan NIK"
              required
              disabled
            />

            <InputField
              label="NISN"
              name="nisn"
              value={formData.nisn}
              onChange={handleInputChange}
              placeholder="Masukkan NISN"
              required
              disabled
            />

            <InputField
              label="Nama Siswa"
              name="nama_siswa"
              value={formData.nama_siswa}
              onChange={handleInputChange}
              placeholder="Masukkan nama siswa"
              required
              disabled
            />

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <InputField
                  label="Tempat Lahir"
                  name="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={handleInputChange}
                  placeholder="Masukkan tempat lahir"
                  required
                  disabled
                />
              </div>
              <div className="flex-1">
                <InputField
                  type="date"
                  label="Tanggal Lahir"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleInputChange}
                  required
                  disabled
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin
              </label>
              <div className="flex gap-4">
                <Radio
                  name="id_jenis_kelamin"
                  label="Laki-laki"
                  value="1"
                  checked={formData.id_jenis_kelamin === "1"}
                  onChange={handleInputChange}
                  disabled
                />
                <Radio
                  name="id_jenis_kelamin"
                  label="Perempuan"
                  value="2"
                  checked={formData.id_jenis_kelamin === "2"}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>

            <InputField
              label="Nama Ayah"
              name="nama_ayah"
              value={formData.nama_ayah}
              onChange={handleInputChange}
              placeholder="Masukkan nama ayah"
              required
              disabled
            />

            <InputField
              label="Nama Ibu"
              name="nama_ibu"
              value={formData.nama_ibu}
              onChange={handleInputChange}
              placeholder="Masukkan nama ibu"
              required
              disabled
            />

            <InputField
              label="Nomor Telepon"
              name="nomor_telepon"
              value={formData.nomor_telepon}
              onChange={handleInputChange}
              placeholder="Masukkan nomor telepon"
              required
              disabled
            />

            {/* Wilayah Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <SelectField
                label="Provinsi"
                name="id_provinsi"
                value={formData.id_provinsi}
                onChange={(value) => handleWilayahChange('id_provinsi', value)}
                options={[
                  { value: '', label: '-- PILIH PROVINSI --' },
                  ...wilayahOptions.provinsi
                ]}
                required
                loading={loadingState.provinsi}
              />
              
              <SelectField
                label="Kabupaten/Kota"
                name="id_kabupaten_kota"
                value={formData.id_kabupaten_kota}
                onChange={(value) => handleWilayahChange('id_kabupaten_kota', value)}
                options={[
                  { value: '', label: '-- PILIH KAB/KOTA --' },
                  ...wilayahOptions.kabupaten
                ]}
                required
                loading={loadingState.kabupaten}
                disabled={!formData.id_provinsi}
              />
              
              <SelectField
                label="Kecamatan"
                name="id_kecamatan"
                value={formData.id_kecamatan}
                onChange={(value) => handleWilayahChange('id_kecamatan', value)}
                options={[
                  { value: '', label: '-- PILIH KECAMATAN --' },
                  ...wilayahOptions.kecamatan
                ]}
                required
                loading={loadingState.kecamatan}
                disabled={!formData.id_kabupaten_kota}
              />
              
              <SelectField
                label="Kelurahan"
                name="id_kelurahan"
                value={formData.id_kelurahan}
                onChange={(value) => handleWilayahChange('id_kelurahan', value)}
                options={[
                  { value: '', label: '-- PILIH KELURAHAN --' },
                  ...wilayahOptions.kelurahan
                ]}
                required
                loading={loadingState.kelurahan}
                disabled={!formData.id_kecamatan}
              />
            </div>

            <TextAreaField
              label="Alamat"
              name="alamat"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masukkan alamat lengkap"
              required
              rows={4}
              className="w-full"
              disabled
            />

            {/* Maps Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pilih Lokasi
              </label>

              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Cari lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchLocation();
                      }
                    }}
                    className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{ className: "min-w-[100px]" }}
                    disabled
                  />
                </div>
                <Button 
                  variant="outlined"
                  className="flex items-center gap-2"
                  onClick={handleSearchLocation}
                  disabled
                >
                  <MdSearch className="h-4 w-4" /> Cari
                </Button>
              </div>
              
              {isLoadedState ? (
                <Maps
                  center={center}
                  coordinates={coordinates}
                  address={address}
                  mapType={mapType}
                  setMapType={setMapType}
                  isLocating={isLocating}
                  onMapLoad={handleMapLoad}
                  handleMapClick={handleMapClick}
                  isMapLoaded={isMapLoaded}
                  containerStyle={containerStyle}
                  areaOptions={areaOptions}
                  setCoordinates={setCoordinates}
                  setAddress={setAddress}
                />
              ) : (
                <div className="h-[400px] w-full flex items-center justify-center bg-gray-100">
                  Loading maps...
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Latitude"
                name="latitude"
                value={coordinates ? coordinates.lat : ''}
                onChange={() => {}}
                readOnly
                disabled
              />
              <InputField
                label="Longitude"
                name="longitude"
                value={coordinates ? coordinates.lng : ''}
                onChange={() => {}}
                readOnly
                disabled
              />
            </div>

            {/* Pendaftaran Sekolah */}
            <div className="flex items-center gap-4 mt-20 mb-6">
              <FaUniversity className="h-6 w-6" />
              <h3 className="text-xl font-bold">Pendaftaran Sekolah</h3>
            </div>

            {/* Form Pendaftaran Sekolah */}
            <div className="space-y-4">              
              <div className="flex items-center gap-4">
                <label className="w-1/4 text-gray-700 font-medium">
                  Jalur Pendaftaran
                </label>
                <div className="w-3/4 flex gap-4">
                  <Radio
                    name="id_jalur_pendaftaran"
                    label="Zonasi"
                    value="1"
                    checked={formData.id_jalur_pendaftaran === "1"}
                    onChange={handleInputChange}
                    disabled
                  />
                  <Radio
                    name="id_jalur_pendaftaran"
                    label="Afirmasi"
                    value="2"
                    checked={formData.id_jalur_pendaftaran === "2"}
                    onChange={handleInputChange}
                    disabled
                  />
                  <Radio
                    name="id_jalur_pendaftaran"
                    label="Pindahan"
                    value="3"
                    checked={formData.id_jalur_pendaftaran === "3"}
                    onChange={handleInputChange}
                    disabled
                  />
                  <Radio
                    name="id_jalur_pendaftaran"
                    label="Prestasi"
                    value="4"
                    checked={formData.id_jalur_pendaftaran === "4"}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="w-1/4 text-gray-700 font-medium">
                  Sekolah Asal
                </label>
                <div className='w-3/4 flex flex-col gap-4'>
                  <div className="flex gap-4">
                    <SelectField
                      name="id_tipe_sekolah_asal"
                      value={formData.id_tipe_sekolah_asal}
                      onChange={handleTipeSekolahChange}
                      options={tipeSekolahOptions}
                      className="w-1/2"
                      placeholder="Pilih TK/SD"
                      isDisabled={isLoadingTipeSekolah}
                      disabled
                    />
                    <SelectField
                      name="id_sekolah_asal"
                      value={formData.id_sekolah_asal}
                      onChange={handleInputChange}
                      options={sekolahOptions}
                      className="w-1/2"
                      placeholder="Pilih Sekolah Asal"
                      isDisabled={isLoadingSekolah || !formData.id_tipe_sekolah_asal}
                      disabled
                    />
                  </div>
                </div>                                    
              </div>

              <div className="flex items-center gap-4">
                <label className="w-1/4 text-gray-700 font-medium">
                  Tahun Lulus
                </label>
                <InputField
                  type="text"
                  name="tahun_lulus"
                  value={formData.tahun_lulus || ''}
                  onChange={handleInputChange}
                  className="w-3/4"
                  required
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Pilihan Sekolah</label>
                <div className="flex flex-col gap-4 px-4 py-2 border border-gray-300 rounded-md">
                  {isLoadingSekolahData ? (
                    <div className="text-center text-gray-500">Memuat data sekolah...</div>
                  ) : sekolahData.map((sekolah) => (
                    <div key={sekolah.id} className="flex items-center justify-between">
                      <Radio
                        name="id_sekolah_tujuan"
                        label={sekolah.nama}
                        value={sekolah.id}
                        checked={formData.id_sekolah_tujuan === sekolah.id}
                        onChange={handleInputChange}
                      />
                      <span className="text-sm text-gray-500">
                        {sekolah.distance ? `${sekolah.distance.toFixed(2)} km` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <Button 
              color="red" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              color="green"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};

export default PengalihanForm;