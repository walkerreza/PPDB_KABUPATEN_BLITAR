import React, { useState, useEffect, useMemo } from 'react';
import { InputField, SelectField, TextAreaField, CheckboxField } from '../../../components/forms/FormsVariant/Forms';
import { Radio, Button, Input } from "@material-tailwind/react";
import Maps from '../../../components/element/Card/Maps';
import { MdMyLocation, MdSearch } from "react-icons/md";
import { FaUniversity } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { calculateDistance } from '../../../utils/distance';
import SearchableSelect from '../../../components/forms/FormsVariant/Component/SearchableSelect';

const PendaftarForm = ({ formData = {}, onChange, isEditMode }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [center, setCenter] = useState({ lat: -8.0952, lng: 112.1665 });
  const [address, setAddress] = useState(formData.alamat || '');
  const [gpsLocationName, setGpsLocationName] = useState('');
  const [mapType, setMapType] = useState('roadmap');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isLoadedState, setIsLoaded] = useState(true);
  const [isTelpReadOnly, setIsTelpReadOnly] = useState(true);  // State untuk readonly nomor telepon
  const [jalurPendaftaran, setJalurPendaftaran] = useState(formData.jalur_pendaftaran || ''); // State untuk jalur pendaftaran
  const [isSekolahTidakTerdaftar, setIsSekolahTidakTerdaftar] = useState(formData.isSekolahTidakTerdaftar || false);

  // State untuk data wilayah
  const [provinsiOptions, setProvinsiOptions] = useState([
    { value: "", label: "-- PILIH PROVINSI --" }
  ]);
  const [kabupatenOptions, setKabupatenOptions] = useState([
    { value: "", label: "-- PILIH KAB/KOTA --" }
  ]);
  const [kecamatanOptions, setKecamatanOptions] = useState([
    { value: "", label: "-- PILIH KECAMATAN --" }
  ]);
  const [kelurahanOptions, setKelurahanOptions] = useState([
    { value: "", label: "-- PILIH KELURAHAN --" }
  ]);

  // State untuk data sekolah
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([]);
  const [sekolahOptions, setSekolahOptions] = useState([]);
  const [selectedTipeSekolah, setSelectedTipeSekolah] = useState('');
  const [nearbySchools, setNearbySchools] = useState([]);

  // State untuk loading
  const [isLoadingTipeSekolah, setIsLoadingTipeSekolah] = useState(false);
  const [isLoadingSekolah, setIsLoadingSekolah] = useState(false);

  // State untuk loading setiap select
  const [loadingState, setLoadingState] = useState({
    sekolah: false,
    tipeSekolah: false,
    sekolahData: false
  });

  // State untuk menyimpan sekolah yang diurutkan berdasarkan jarak
  const [sortedSekolah, setSortedSekolah] = useState([]);
  const [sekolahData, setSekolahData] = useState([]);
  const [isLoadingSekolahData, setIsLoadingSekolahData] = useState(false);

  // State untuk pencarian sekolah
  const [searchSekolah, setSearchSekolah] = useState('');
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false);

  // State untuk menyimpan tipe sekolah tujuan berdasarkan grup user
  const [idTipeSekolah, setIdTipeSekolah] = useState(null);

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

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      headers.append('Content-Type', 'application/json');
      
      return headers;
    } catch (error) {
      console.error('Error getting headers:', error);
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      setTimeout(() => {
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }, 2000);
      return new Headers();
    }
  };

  // Fungsi untuk mengambil data provinsi
  const fetchProvinsi = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/provinsi`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data provinsi');
      }

      const data = await response.json();
      console.log('Response Provinsi:', data); // Debug response

      const options = data.map(prov => ({
        value: prov.id_provinsi.toString(), // Konversi ke string
        label: prov.nama_provinsi
      }));

      console.log('Provinsi Options:', options); // Debug options

      setProvinsiOptions([
        { value: '', label: '-- PILIH PROVINSI --' },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data provinsi');
    }
  };

  // Fungsi untuk mengambil data kabupaten berdasarkan provinsi
  const fetchKabupaten = async (provinsiId) => {
    // Validasi dan konversi provinsiId
    if (!provinsiId || typeof provinsiId === 'object') {
      setKabupatenOptions([{ value: '', label: '-- PILIH KAB/KOTA --' }]);
      return;
    }

    // Pastikan provinsiId adalah string
    const id = provinsiId.toString();
    console.log('Fetching kabupaten with ID:', id); // Debug ID

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kabupaten-kota/provinsi/${id}`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kabupaten');
      }

      const data = await response.json();
      console.log('Response Kabupaten:', data); // Debug response

      const options = data.map(kab => ({
        value: kab.id_kabupaten_kota.toString(), // Konversi ke string
        label: kab.nama_kabupaten_kota
      }));

      console.log('Kabupaten Options:', options); // Debug options

      setKabupatenOptions([
        { value: '', label: '-- PILIH KAB/KOTA --' },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data kabupaten');
    }
  };

  // Fungsi untuk mengambil data kecamatan berdasarkan kabupaten
  const fetchKecamatan = async (kabupatenId) => {
    if (!kabupatenId) {
      setKecamatanOptions([{ value: '', label: '-- PILIH KECAMATAN --' }]);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/${kabupatenId}`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kecamatan');
      }

      const data = await response.json();
      const options = data.map(kec => ({
        value: kec.id_kecamatan.toString(), // Konversi ke string
        label: kec.nama_kecamatan
      }));

      console.log('Kecamatan Options:', options); // Debug options

      setKecamatanOptions([
        { value: '', label: '-- PILIH KECAMATAN --' },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data kecamatan');
    }
  };

  // Fungsi untuk mengambil data kelurahan berdasarkan kecamatan
  const fetchKelurahan = async (kecamatanId) => {
    // Validasi dan konversi kecamatanId
    if (!kecamatanId || typeof kecamatanId === 'object') {
      setKelurahanOptions([{ value: '', label: '-- PILIH KELURAHAN --' }]);
      return;
    }

    // Pastikan kecamatanId adalah string
    const id = kecamatanId.toString();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${id}`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kelurahan');
      }

      const data = await response.json();
      const options = data.map(kel => ({
        value: kel.id_kelurahan.toString(), // Konversi ke string
        label: kel.nama_kelurahan
      }));

      console.log('Kelurahan Options:', options); // Debug options

      setKelurahanOptions([
        { value: '', label: '-- PILIH KELURAHAN --' },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data kelurahan');
    }
  };

  // Fetch tipe sekolah saat komponen mount
  useEffect(() => {
    const fetchTipeSekolah = async () => {
      setIsLoadingTipeSekolah(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
          headers: getHeaders(),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Gagal mengambil data tipe sekolah');
        }

        const data = await response.json();
        // Filter hanya tipe sekolah TK, SDN, dan SDS
        const filteredTipeSekolah = data.data
          .filter(tipe => ['112', '122', '211', '212', '221', '222'].includes(tipe.id_tipe_sekolah.toString()))
          .map(tipe => ({
            value: tipe.id_tipe_sekolah.toString(),
            label: tipe.slug
          }));
        setTipeSekolahOptions(filteredTipeSekolah);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Gagal mengambil data tipe sekolah');
      } finally {
        setIsLoadingTipeSekolah(false);
      }
    };

    fetchTipeSekolah();
  }, []);

  // Fetch sekolah asal berdasarkan tipe
  const fetchSekolahAsal = async (tipeId) => {
    setIsLoadingSekolah(true);
    try {
      // Mapping tipe sekolah ke kode
      const tipeMapping = {
        'TK': ['112'],  // TK
        'RA': ['122'],  // RA
        'SDN': ['211'],  // SDN
        'SDS': ['212'],  // SDS
        'MIN': ['221'],  // MIN
        'MIS': ['222']   // MIS
      };

      const selectedTipes = tipeMapping[tipeId] || [];
      console.log('Selected tipe sekolah:', tipeId);
      console.log('Selected kode tipe:', selectedTipes);

      const allSekolah = [];

      // Fetch sekolah untuk setiap tipe
      for (const tipe of selectedTipes) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${tipe}`, {
            headers: getHeaders(),
            credentials: 'include'
          });

          if (!response.ok) {
            console.log(`Skip tipe ${tipe}: response not OK (${response.status})`);
            continue; // Lanjutkan ke tipe berikutnya tanpa memunculkan error
          }

          const result = await response.json();
          console.log(`Data sekolah for tipe ${tipe}:`, result);

          // Result adalah array of sekolah
          if (Array.isArray(result)) {
            const validSekolah = result.filter(sekolah => 
              sekolah && 
              typeof sekolah === 'object' && 
              'id_sekolah' in sekolah && 
              'nama' in sekolah
            );
            allSekolah.push(...validSekolah);
          } else if (result.data && Array.isArray(result.data)) {
            // Fallback kalau API return format { data: [] }
            const validSekolah = result.data.filter(sekolah => 
              sekolah && 
              typeof sekolah === 'object' && 
              'id_sekolah' in sekolah && 
              'nama' in sekolah
            );
            allSekolah.push(...validSekolah);
          } else {
            console.error(`Invalid data format for tipe ${tipe}:`, result);
          }
        } catch (error) {
          console.error(`Error processing tipe ${tipe}:`, error);
          // Continue with other tipes even if one fails
          continue;
        }
      }

      console.log('All sekolah data:', allSekolah);

      // Format options untuk select dengan validasi tambahan
      const options = allSekolah
        .filter(sekolah => {
          // Double check validasi data
          const isValid = sekolah && 
            typeof sekolah === 'object' && 
            sekolah.id_sekolah && 
            sekolah.nama;
          
          if (!isValid) {
            console.warn('Invalid sekolah data:', sekolah);
          }
          return isValid;
        })
        .map(sekolah => ({
          value: String(sekolah.id_sekolah),
          label: sekolah.nama
        }));

      console.log('Formatted options:', options);
      setSekolahOptions(options);

      if (options.length === 0) {
        toast.warning('Tidak ada sekolah untuk tipe yang dipilih');
      }
    } catch (error) {
      console.error('Error in fetchSekolahAsal:', error);
      toast.error('Gagal mengambil data sekolah');
      setSekolahOptions([]);
    } finally {
      setIsLoadingSekolah(false);
    }
  };

  // Fungsi untuk mendapatkan tipe sekolah tujuan berdasarkan sekolah asal
  const getTipeSekolahTujuan = (tipeSekolahAsal) => {
    const mapping = {
      'TK': ['211', '212', '221', '222'], // TK -> SD/MI (Negeri & Swasta)
      'RA': ['211', '212', '221', '222'], // RA -> SD/MI (Negeri & Swasta)
      'SDN': ['311', '312', '321', '322'],  // SD -> SMP/MTs (Negeri & Swasta)
      'SDS': ['311', '312', '321', '322'],  // SDS -> SMP/MTs (Negeri & Swasta)
      'MIN': ['311', '312', '321', '322'],  // MIN -> SMP/MTs (Negeri & Swasta)
      'MIS': ['311', '312', '321', '322']   // MIS -> SMP/MTs (Negeri & Swasta)
    };
    return mapping[tipeSekolahAsal] || [];
  };

  // Effect untuk fetch sekolah tujuan saat tipe sekolah asal berubah
  useEffect(() => {
    const fetchSekolahTujuan = async () => {
      try {
        setIsLoadingSekolahData(true);
        
        if (!formData.id_tipe_sekolah_asal || !formData.latitude || !formData.longitude) {
          setSortedSekolah([]);
          return;
        }

        const tipeSekolahTujuan = getTipeSekolahTujuan(formData.id_tipe_sekolah_asal);
        const allSekolah = [];

        // Fetch sekolah untuk setiap tipe
        for (const tipe of tipeSekolahTujuan) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${tipe}`, {
              headers: getHeaders(),
              credentials: 'include'
            });

            if (!response.ok) {
              console.log(`Skip tipe ${tipe}: response not OK (${response.status})`);
              continue; // Lanjutkan ke tipe berikutnya tanpa memunculkan error
            }

            const result = await response.json();
            if (Array.isArray(result)) {
              allSekolah.push(...result);
            } else if (result.data && Array.isArray(result.data)) {
              allSekolah.push(...result.data);
            }
          } catch (error) {
            console.error(`Error processing tipe ${tipe}:`, error);
            // Continue with other tipes even if one fails
            continue;
          }
        }

        // Simpan data sekolah tanpa menghitung jarak dulu
        const sekolahData = allSekolah
          .filter(sekolah => sekolah.latitude && sekolah.longitude)
          .map(sekolah => ({
            id: sekolah.id_sekolah.toString(),
            nama: sekolah.nama,
            latitude: parseFloat(sekolah.latitude),
            longitude: parseFloat(sekolah.longitude)
          }));
        
        setSekolahData(sekolahData);
        
        // Jika sudah ada koordinat, hitung jarak
        if (formData.latitude && formData.longitude) {
          const sekolahWithDistance = sekolahData.map(sekolah => ({
            ...sekolah,
            distance: calculateDistance(
              parseFloat(formData.latitude),
              parseFloat(formData.longitude),
              sekolah.latitude,
              sekolah.longitude
            )
          })).sort((a, b) => a.distance - b.distance);
          
          setSortedSekolah(sekolahWithDistance);
        } else {
          // Jika tidak ada koordinat, tampilkan tanpa jarak
          setSortedSekolah(sekolahData);
        }

      } catch (error) {
        console.error('Error fetching sekolah tujuan:', error);
        toast.error('Gagal mengambil data sekolah tujuan');
        setSortedSekolah([]);
      } finally {
        setIsLoadingSekolahData(false);
      }
    };

    fetchSekolahTujuan();
  }, [formData.id_tipe_sekolah_asal, formData.latitude, formData.longitude]);

  // Fetch sekolah tujuan berdasarkan tipe
  const fetchSekolahTujuan = async (tipeId) => {
    try {
      setIsLoadingSekolahData(true);
      console.log('Memanggil fetchSekolahTujuan dengan tipeId:', tipeId);
      
      // Mapping untuk tipe sekolah tujuan
      const tipeSekolahTujuanMapping = {
        'tk': [211, 212, 221, 222],  // TK -> SD/MI (Negeri & Swasta)
        'ra': [211, 212, 221, 222],  // RA -> SD/MI (Negeri & Swasta)
        'paud': [211, 212, 221, 222], // PAUD -> SD/MI
        'sd': [311, 312, 321, 322],  // SD -> SMP/MTs (Negeri & Swasta)
        'sdn': [311, 312, 321, 322],  // SDN -> SMP/MTs (Negeri & Swasta)
        'sds': [311, 312, 321, 322],  // SDS -> SMP/MTs (Negeri & Swasta)
        'min': [311, 312, 321, 322],  // MIN -> SMP/MTs (Negeri & Swasta)
        'mis': [311, 312, 321, 322]   // MIS -> SMP/MTs (Negeri & Swasta)
      };

      let tipesToFetch = [];
      
      // Jika tipeId tidak valid, coba deteksi dari id_tipe_sekolah_asal
      if (!tipeId && formData.id_tipe_sekolah_asal) {
        // Cek slug dari tipe_sekolah_asal
        const tipeSekolahKey = formData.tipe_sekolah?.slug?.toLowerCase() || '';
        tipesToFetch = tipeSekolahTujuanMapping[tipeSekolahKey] || [];
        
        if (tipesToFetch.length === 0) {
          const id_asal = parseInt(formData.id_tipe_sekolah_asal);
          // TK/RA/PAUD (1xx) -> SD/MI
          if (id_asal >= 100 && id_asal < 200) {
            tipesToFetch = [211, 212, 221, 222];
          } 
          // SD/MI (2xx) -> SMP/MTs
          else if (id_asal >= 200 && id_asal < 300) {
            tipesToFetch = [311, 312, 321, 322];
          }
        }
      } else {
        tipesToFetch = tipeSekolahTujuanMapping[tipeId] || [];
      }

      console.log('Tipe sekolah yang akan di-fetch:', tipesToFetch);
      
      if (tipesToFetch.length === 0) {
        console.log('Tidak ada tipe sekolah yang sesuai');
        setNearbySchools([]);
        setSortedSekolah([]);
        setIsLoadingSekolahData(false);
        return;
      }

      const allSchools = [];

      // Fetch sekolah untuk setiap tipe
      for (const type of tipesToFetch) {
        try {
          console.log(`Fetching sekolah untuk tipe ${type}...`);
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${type}`, {
            headers: getHeaders(),
            credentials: 'include'
          });

          if (!response.ok) {
            console.log(`Skip tipe ${type}: response not OK (${response.status})`);
            continue; // Lanjutkan ke tipe berikutnya tanpa memunculkan error
          }

          const data = await response.json();
          console.log(`Data sekolah untuk tipe ${type}:`, data);
          if (Array.isArray(data)) {
            allSchools.push(...data);
          } else if (data.data && Array.isArray(data.data)) {
            allSchools.push(...data.data);
          }
        } catch (error) {
          console.error(`Error fetching tipe ${type}:`, error);
          // Continue with other tipes even if one fails
          continue;
        }
      }

      console.log('Total sekolah tujuan yang ditemukan:', allSchools.length);

      if (allSchools.length > 0) {
        // Filter sekolah berdasarkan tipe dan urutkan berdasarkan jarak
        const filteredSekolah = allSchools.map(school => ({
          id: school.id_sekolah,
          nama: school.nama,
          type: school.tipe_sekolah?.slug || 'Unknown',
          latitude: school.latitude || center.lat,
          longitude: school.longitude || center.lng,
          distance: calculateDistance(
            formData.latitude || center.lat,
            formData.longitude || center.lng,
            school.latitude || center.lat,
            school.longitude || center.lng
          )
        }))
        .filter(school => school.id && school.nama)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Ambil 10 sekolah terdekat

        console.log('10 sekolah terdekat:', filteredSekolah);
        setNearbySchools(filteredSekolah);
        setSortedSekolah(filteredSekolah);
      } else {
        setNearbySchools([]);
        setSortedSekolah([]);
        toast.info('Belum ada sekolah tujuan dengan tipe tersebut');
      }
    } catch (error) {
      console.error('Error dalam fetchSekolahTujuan:', error);
      toast.error('Gagal mengambil data sekolah');
      setNearbySchools([]);
      setSortedSekolah([]);
    } finally {
      setIsLoadingSekolahData(false);
    }
  };

  // Fungsi untuk menghitung jarak antara dua titik koordinat
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  // Handler untuk memilih sekolah dari dropdown
  const handleSekolahSelect = (value, label) => {
    handleInputChange({
      target: {
        name: 'id_sekolah_asal',
        value: value
      }
    });
    setSearchSekolah(label);
    setShowSekolahDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sekolah-dropdown-container')) {
        setShowSekolahDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update search value when sekolah is selected
  useEffect(() => {
    if (formData.id_sekolah_asal) {
      const selectedSekolah = sekolahOptions.find(opt => opt.value === formData.id_sekolah_asal);
      if (selectedSekolah) {
        setSearchSekolah(selectedSekolah.label);
      }
    } else {
      setSearchSekolah('');
    }
  }, [formData.id_sekolah_asal, sekolahOptions]);

  // Handle perubahan tipe sekolah
  const handleTipeSekolahChange = async (e) => {
    const { name, value } = e.target;
    
    // Reset sekolah asal when tipe sekolah changes
    const newFormData = {
      ...formData,
      [name]: value,
      id_sekolah_asal: ''
    };
    
    onChange(newFormData);
    setSelectedTipeSekolah(value);
    
    if (value) {
      await fetchSekolahAsal(value);
    } else {
      setSekolahOptions([]);
    }
  };

  // Fetch data sekolah dari API
  const fetchSekolahData = async () => {
    try {
      setIsLoadingSekolahData(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data sekolah');
      }

      const result = await response.json();
      
      const formattedData = result.data
        .filter(sekolah => sekolah?.latitude && sekolah?.longitude)
        .map(sekolah => ({
          id: String(sekolah.id_sekolah),
          nama: sekolah.nama,
          latitude: Number(sekolah.latitude),
          longitude: Number(sekolah.longitude)
        }));

      setSekolahData(formattedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data sekolah');
    } finally {
      setIsLoadingSekolahData(false);
    }
  };

  // Effect untuk mengambil data sekolah saat komponen dimount
  useEffect(() => {
    fetchSekolahData();
  }, []);

  // Effect untuk set initial coordinates
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      const coords = {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude)
      };
      setCoordinates(coords);
      setCenter(coords);
    }
  }, [formData.latitude, formData.longitude]);

  // Effect untuk get nama lokasi dari koordinat
  useEffect(() => {
    const getLocationName = async () => {
      if (coordinates) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ 
            location: coordinates
          });
          
          if (result.results[0]) {
            setGpsLocationName(result.results[0].formatted_address);
          }
        } catch (error) {
          console.error('Error getting location name:', error);
        }
      }
    };

    getLocationName();
  }, [coordinates]);

  // Effect untuk update formData saat koordinat berubah
  useEffect(() => {
    if (coordinates) {
      onChange({
        ...formData,
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString()
      });
    }
  }, [coordinates]);

  // Update jarak sekolah saat koordinat berubah
  useEffect(() => {
    if (formData.latitude && formData.longitude && sekolahData.length > 0) {
      const updatedSchools = sekolahData.map(school => ({
        ...school,
        distance: calculateDistance(
          parseFloat(formData.latitude),
          parseFloat(formData.longitude),
          school.latitude,
          school.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Ambil 10 sekolah terdekat

      setNearbySchools(updatedSchools);
    }
  }, [formData.latitude, formData.longitude, sekolahData]);

  // Effect untuk load data provinsi saat komponen mount
  useEffect(() => {
    fetchProvinsi();
  }, []);

  // Effect untuk load data kabupaten saat provinsi berubah
  useEffect(() => {
    if (formData.id_provinsi) {
      fetchKabupaten(formData.id_provinsi);
    }
  }, [formData.id_provinsi]);

  // Effect untuk load data kecamatan saat kabupaten berubah
  useEffect(() => {
    if (formData.id_kabupaten_kota) {
      fetchKecamatan(formData.id_kabupaten_kota);
    }
  }, [formData.id_kabupaten_kota]);

  // Effect untuk load data kelurahan saat kecamatan berubah
  useEffect(() => {
    if (formData.id_kecamatan) {
      fetchKelurahan(formData.id_kecamatan);
    }
  }, [formData.id_kecamatan]);

  // Effect untuk get data pendaftaran saat edit mode
  useEffect(() => {
    const fetchPendaftaranData = async () => {
      if (formData.id_pendaftaran) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/pendaftaran/${formData.id_pendaftaran}`,
            {
              headers: getHeaders(),
              credentials: 'include'
            }
          );

          if (!response.ok) {
            throw new Error('Gagal mengambil data pendaftaran');
          }

          const result = await response.json();
          const data = result.data;

          console.log('Data pendaftaran:', data);

          // Tentukan tipe sekolah berdasarkan kode
          let tipeSekolah = '';
          const kodeTipe = String(data.id_tipe_sekolah_asal);
          if (['112'].includes(kodeTipe)) {
            tipeSekolah = 'TK';
          } else if (['122'].includes(kodeTipe)) {
            tipeSekolah = 'RA';
          } else if (['211'].includes(kodeTipe)) {
            tipeSekolah = 'SDN';
          } else if (['212'].includes(kodeTipe)) {
            tipeSekolah = 'SDS';
          } else if (['221'].includes(kodeTipe)) {
            tipeSekolah = 'MIN';
          } else if (['222'].includes(kodeTipe)) {
            tipeSekolah = 'MIS';
          }

          // Format data untuk form
          const formattedData = {
            ...formData,
            id_jalur_pendaftaran: data.id_jalur_pendaftaran?.toString() || '',
            id_tipe_sekolah_asal: tipeSekolah || '',
            id_sekolah_asal: data.id_sekolah_asal?.toString() || '',
            tahun_lulus: data.tahun_lulus?.toString() || new Date().getFullYear().toString(),
            id_sekolah_tujuan: data.id_sekolah_tujuan?.toString() || '',
            // Tambah data sekolah asal untuk display
            nama_sekolah_asal: data.sekolah_asal_data?.nama || '',
            // Tambah data sekolah tujuan untuk display
            nama_sekolah_tujuan: data.sekolah_tujuan_data?.nama || '',
            // Pastikan koordinat tersedia
            latitude: data.latitude || formData.latitude,
            longitude: data.longitude || formData.longitude,
            // Cek apakah sekolah tidak terdaftar
            isSekolahTidakTerdaftar: !data.id_sekolah_asal || data.sekolah_asal_data?.nama === 'Sekolah Tidak Terdaftar',
            // Set tipe_sekolah_manual jika sekolah tidak terdaftar
            tipe_sekolah_manual: !data.id_sekolah_asal || data.sekolah_asal_data?.nama === 'Sekolah Tidak Terdaftar' ? tipeSekolah : '',
            // Set nama_sekolah_manual jika sekolah tidak terdaftar
            nama_sekolah_manual: (!data.id_sekolah_asal || data.sekolah_asal_data?.nama === 'Sekolah Tidak Terdaftar') && data.sekolah_asal ? data.sekolah_asal : ''
          };
          
          // Set form data
          onChange(formattedData);
          
          // Update state checkbox sekolah tidak terdaftar
          setIsSekolahTidakTerdaftar(!data.id_sekolah_asal || data.sekolah_asal_data?.nama === 'Sekolah Tidak Terdaftar');
          
          // Fetch sekolah asal jika ada tipe sekolah
          if (tipeSekolah) {
            await fetchSekolahAsal(tipeSekolah);
            
            // Double check setelah data sekolah di-fetch
            if (data.id_sekolah_asal) {
              const newFormData = {
                ...formattedData,
                id_sekolah_asal: data.id_sekolah_asal.toString()
              };
              onChange(newFormData);
            }
          }

          // Fetch sekolah tujuan jika ada tipe sekolah dan koordinat
          if (tipeSekolah && data.latitude && data.longitude) {
            // Mapping untuk tipe sekolah tujuan
            const tipeSekolahTujuanMapping = {
              'TK': 'tk',
              'RA': 'tk',
              'SDN': 'sd',
              'SDS': 'sd',
              'MIN': 'sd',
              'MIS': 'sd'
            };
            
            const tipeForTujuan = tipeSekolahTujuanMapping[tipeSekolah];
            if (tipeForTujuan) {
              await fetchSekolahTujuan(tipeForTujuan);
              
              // Pastikan sekolah tujuan terpilih setelah data di-fetch
              if (data.id_sekolah_tujuan) {
                const updatedFormData = {
                  ...formattedData,
                  id_sekolah_tujuan: data.id_sekolah_tujuan.toString()
                };
                onChange(updatedFormData);
              }
            }
          }
        } catch (error) {
          console.error('Error:', error);
          toast.error('Gagal mengambil data pendaftaran');
        }
      }
    };

    fetchPendaftaranData();
  }, [formData.id_pendaftaran]);

  // Effect untuk memuat sekolah tujuan berdasarkan tipe_sekolah_manual saat isSekolahTidakTerdaftar aktif
  useEffect(() => {
    if (isSekolahTidakTerdaftar && formData.tipe_sekolah_manual && formData.latitude && formData.longitude) {
      console.log('Memanggil fetchSekolahTujuan dari useEffect dengan tipe:', formData.tipe_sekolah_manual.toLowerCase());
      // Tentukan tipe untuk sekolah tujuan (TK/RA -> tk, SDN/SDS/MIN/MIS -> sd)
      const tipeForTujuan = ['TK', 'RA'].includes(formData.tipe_sekolah_manual) ? 'tk' : 'sd';
      fetchSekolahTujuan(tipeForTujuan);
    }
  }, [isSekolahTidakTerdaftar, formData.tipe_sekolah_manual, formData.latitude, formData.longitude]);

  // Effect untuk load data sekolah asal saat tipe sekolah berubah
  useEffect(() => {
    if (formData.id_tipe_sekolah_asal && !isSekolahTidakTerdaftar) {
      fetchSekolahAsal(formData.id_tipe_sekolah_asal);
    }
  }, [formData.id_tipe_sekolah_asal, isSekolahTidakTerdaftar]);

  // Effect untuk cek user role dan set ID tipe sekolah tujuan berdasarkan jenjang
  useEffect(() => {
    const loadUserRole = () => {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          const idGrupUser = userData.id_grup_user;
          
          // Set tipe sekolah tujuan berdasarkan grup user
          if (idGrupUser === 4) { // Admin PAUD/TK
            // Admin PAUD/TK hanya bisa mendaftarkan ke TK/RA/PAUD
            setIdTipeSekolah([112, 122]); // TK, RA
          } else if (idGrupUser === 5) { // Admin SD
            // Admin SD hanya bisa mendaftarkan ke SD/MI
            setIdTipeSekolah([211, 212, 221, 222]); // SDN, SDS, MIN, MIS
          } else if (idGrupUser === 6) { // Admin SMP
            // Admin SMP hanya bisa mendaftarkan ke SMP/MTs
            setIdTipeSekolah([311, 312, 321, 322]); // SMPN, SMPS, MTSN, MTSS
          } else {
            // User lain (superadmin) bisa mendaftarkan ke semua jenjang
            setIdTipeSekolah(null);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    
    loadUserRole();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Debug data jenis kelamin
    if (name === 'id_jenis_kelamin') {
      console.log('Jenis Kelamin Value:', value);
      console.log('Current formData:', formData);
    }
    
    let newValue = type === 'checkbox' ? checked : value;

    // Format data sesuai tipe input
    if (name === 'tahun_lulus') {
      newValue = value ? parseInt(value) : '';
    }

    // Update formData
    const newFormData = { ...formData, [name]: newValue };
    
    // Jika yang diubah adalah tipe sekolah manual dan checkbox sekolah tidak terdaftar aktif
    if (name === 'tipe_sekolah_manual' && isSekolahTidakTerdaftar && newValue && formData.latitude && formData.longitude) {
      console.log('Memanggil fetchSekolahTujuan dari handleInputChange dengan tipe:', newValue.toLowerCase());
      // Tentukan tipe untuk sekolah tujuan (TK/RA -> tk, SDN/SDS/MIN/MIS -> sd)
      const tipeForTujuan = ['TK', 'RA'].includes(newValue) ? 'tk' : 'sd';
      fetchSekolahTujuan(tipeForTujuan);
    }
    
    // Jika yang diubah adalah id_tipe_sekolah_asal dan bukan sekolah tidak terdaftar
    if (name === 'id_tipe_sekolah_asal' && !isSekolahTidakTerdaftar && newValue && formData.latitude && formData.longitude) {
      console.log('Memanggil fetchSekolahTujuan dari handleInputChange dengan tipe:', newValue.toLowerCase());
      // Tentukan tipe untuk sekolah tujuan (TK/RA -> tk, SDN/SDS/MIN/MIS -> sd)
      const tipeForTujuan = ['TK', 'RA'].includes(newValue) ? 'tk' : 'sd';
      fetchSekolahTujuan(tipeForTujuan);
    }

    // Panggil onChange untuk update state di parent component
    onChange(newFormData);
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

  const areaOptions = useMemo(() => {
    return coordinates ? {
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.1,
      clickable: false,
      draggable: false,
      editable: false,
      visible: true,
      radius: 5000, // 5 km dalam meter
      zIndex: 1
    } : null;
  }, [coordinates]);

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

  const handleTelpDoubleClick = () => {
    setIsTelpReadOnly(!isTelpReadOnly);
  };

  const handleJalurPendaftaranChange = (e) => {
    const selectedValue = e.target.value;
    setJalurPendaftaran(selectedValue);
    onChange({
      ...formData,
      jalur_pendaftaran: selectedValue
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {formData.id_pendaftaran && (
          <InputField
            label="NIK"
            name="nik"
            value={formData.nik || ''}
            onChange={handleInputChange}
            placeholder="Masukkan NIK"
            required
            readOnly={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
        )}
        <InputField
          label="NISN"
          name="nisn"
          value={formData.nisn || ''}
          onChange={handleInputChange}
          placeholder="Masukkan NISN"
          required
        />

        <InputField
          label="Nama Siswa"
          name="nama_siswa"
          value={formData.nama_siswa || ''}
          onChange={handleInputChange}
          placeholder="Masukkan nama siswa"
          required
          readOnly={formData.id_pendaftaran}
          className={formData.id_pendaftaran ? "bg-gray-100" : ""}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Tempat Lahir"
            name="tempat_lahir"
            value={formData.tempat_lahir || ''}
            onChange={handleInputChange}
            placeholder="Masukkan tempat lahir"
            required
            readOnly={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
          <InputField
            type="date"
            label="Tanggal Lahir"
            name="tanggal_lahir"
            value={formData.tanggal_lahir || ''}
            onChange={handleInputChange}
            required
            readOnly={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin
              </label>
              <div className="flex gap-4">
                <Radio
                  name="id_jenis_kelamin"
                  label="Laki-laki"
                  value="1"
                  checked={formData.id_jenis_kelamin === '1'}
                  onChange={handleInputChange}
                  disabled={formData.id_pendaftaran}
                />
                <Radio
                  name="id_jenis_kelamin"
                  label="Perempuan"
                  value="2"
                  checked={formData.id_jenis_kelamin === '2'}
                  onChange={handleInputChange}
                  disabled={formData.id_pendaftaran}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Orang Tua */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Nama Ayah"
            name="nama_ayah"
            value={formData.nama_ayah || ''}
            onChange={handleInputChange}
            placeholder="Masukkan nama ayah"
            required
            readOnly={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
          <InputField
            label="Nama Ibu"
            name="nama_ibu"
            value={formData.nama_ibu || ''}
            onChange={handleInputChange}
            placeholder="Masukkan nama ibu"
            required
            readOnly={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
        </div>

        <InputField
          label="Nomor Telepon"
          name="nomor_telepon"
          value={formData.nomor_telepon || ''}
          onChange={handleInputChange}
          placeholder="Masukkan nomor telepon"
          required
          readOnly={!formData.id_pendaftaran ? false : isTelpReadOnly}
          onDoubleClick={formData.id_pendaftaran ? handleTelpDoubleClick : undefined}
          className={!formData.id_pendaftaran ? "" : (isTelpReadOnly ? "bg-gray-100" : "")}
        />
        {formData.id_pendaftaran && (
          <p className="text-sm text-gray-500 -mt-3 ml-1">Klik dua kali untuk mengubah nomor telepon</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Provinsi"
            name="id_provinsi"
            value={formData.id_provinsi || ''}
            onChange={handleInputChange}
            options={provinsiOptions}
            required
            disabled={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />

          <SelectField
            label="Kabupaten/Kota"
            name="id_kabupaten_kota"
            value={formData.id_kabupaten_kota || ''}
            onChange={handleInputChange}
            options={kabupatenOptions}
            required
            disabled={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Kecamatan"
            name="id_kecamatan"
            value={formData.id_kecamatan || ''}
            onChange={handleInputChange}
            options={kecamatanOptions}
            required
            disabled={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />

          <SelectField
            label="Kelurahan"
            name="id_kelurahan"
            value={formData.id_kelurahan || ''}
            onChange={handleInputChange}
            options={kelurahanOptions}
            required
            disabled={formData.id_pendaftaran}
            className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          />
        </div>

        <TextAreaField
          label="Alamat"
          name="alamat"
          value={formData.alamat || ''}
          onChange={handleInputChange}
          placeholder="Masukkan alamat lengkap"
          required
          readOnly={formData.id_pendaftaran}
          className={formData.id_pendaftaran ? "bg-gray-100" : ""}
          rows={4}
        />

        {/* Maps Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Lokasi GPS
          </label>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <Input
                type="text"
                value={gpsLocationName || 'Pilih lokasi di peta'}
                readOnly
                className="!border !border-gray-300 bg-gray-100 text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
              />
            </div>
            <Button 
              variant="outlined"
              className="flex items-center gap-2"
              onClick={() => {
                if (coordinates) {
                  setCenter(coordinates);
                }
              }}
            >
              <MdMyLocation className="h-4 w-4" /> Lihat di Peta
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
              readOnly={formData.id_pendaftaran}
              additionalMarkers={nearbySchools.map(school => ({
                id: school.id,
                coordinates: { lat: school.latitude, lng: school.longitude }
              }))}
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
          />
          <InputField
            label="Longitude"
            name="longitude"
            value={coordinates ? coordinates.lng : ''}
            onChange={() => {}}
            readOnly
          />
        </div>
      
   

        {/* Form Pendaftaran Sekolah */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center space-x-2">
            <FaUniversity className="text-xl text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-700">Pendaftaran Sekolah</h2>
          </div>

          {!formData.id_pendaftaran && (
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
              <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                Jalur Pendaftaran
              </label>
              <div className="w-full md:w-3/4 flex gap-4">
                <Radio
                  name="id_jalur_pendaftaran"
                  label="Zonasi"
                  value="1"
                  checked={formData.id_jalur_pendaftaran === "1"}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                />
                <Radio
                  name="id_jalur_pendaftaran"
                  label="Prestasi"
                  value="2"
                  checked={formData.id_jalur_pendaftaran === "2"}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                />
                <Radio
                  name="id_jalur_pendaftaran"
                  label="Pindahan"
                  value="3"
                  checked={formData.id_jalur_pendaftaran === "3"}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                />
                <Radio
                  name="id_jalur_pendaftaran"
                  label="Afirmasi"
                  value="4"
                  checked={formData.id_jalur_pendaftaran === "4"}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
              Sekolah Asal
            </label>
            <div className='w-full md:w-3/4 flex flex-col gap-4'>
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  name="id_tipe_sekolah_asal"
                  value={formData.id_tipe_sekolah_asal}
                  onChange={handleTipeSekolahChange}
                  className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  disabled={isLoadingTipeSekolah || (isEditMode && isSekolahTidakTerdaftar)}
                >
                  <option value="">Pilih Tipe Sekolah</option>
                  <option value="TK">TK</option>
                  <option value="RA">RA</option>
                  <option value="SDN">SDN</option>
                  <option value="SDS">SDS</option>
                  <option value="MIN">MIN</option>
                  <option value="MIS">MIS</option>
                </select>

                {isEditMode && formData.id_sekolah_asal ? (
                  <div className="w-full md:w-3/4 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md">
                    {formData.nama_sekolah_asal || 'Sekolah tidak ditemukan'}
                  </div>
                ) : (
                  <SearchableSelect
                    name="id_sekolah_asal"
                    value={formData.id_sekolah_asal}
                    onChange={handleInputChange}
                    options={sekolahOptions}
                    placeholder="Cari dan pilih sekolah..."
                    className="w-full md:w-3/4"
                    error={null}
                    required={!isSekolahTidakTerdaftar}
                    {...(isLoadingSekolah || !formData.id_tipe_sekolah_asal || isSekolahTidakTerdaftar ? { disabled: true } : {})}
                  />
                )}
              </div>

              {/* Checkbox untuk sekolah tidak terdaftar */}
              <div className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="sekolah_tidak_terdaftar"
                  checked={isSekolahTidakTerdaftar}
                  onChange={(e) => {
                    // Update state
                    setIsSekolahTidakTerdaftar(e.target.checked);
                    
                    // Update formData
                    const newFormData = {
                      ...formData,
                      isSekolahTidakTerdaftar: e.target.checked,
                      // Reset id_sekolah_asal saat checkbox dicentang
                      id_sekolah_asal: e.target.checked ? null : formData.id_sekolah_asal
                    };
                    
                    // Jika checkbox dicentang dan sudah ada nilai tipe_sekolah_manual, set id_tipe_sekolah
                    if (e.target.checked && formData.tipe_sekolah_manual) {
                      const tipeValue = formData.tipe_sekolah_manual;
                      newFormData.id_tipe_sekolah_asal = tipeValue === 'TK' ? '112' : 
                                               tipeValue === 'RA' ? '122' : 
                                               tipeValue === 'SDN' ? '211' : 
                                               tipeValue === 'SDS' ? '212' : 
                                               tipeValue === 'MIN' ? '221' : 
                                               tipeValue === 'MIS' ? '222' : '';
                      
                      // Panggil fetchSekolahTujuan jika ada tipe sekolah
                      if (formData.latitude && formData.longitude) {
                        const tipeForTujuan = ['TK', 'RA'].includes(tipeValue) ? 'tk' : 'sd';
                        fetchSekolahTujuan(tipeForTujuan);
                      }
                    }
                    
                    onChange(newFormData);
                  }}
                  className="form-checkbox h-4 w-4 text-blue-500"
                />
                <label htmlFor="sekolah_tidak_terdaftar" className="text-sm text-gray-600">
                  Sekolah tidak ada di daftar tersebut
                </label>
              </div>

              {/* Form untuk sekolah tidak terdaftar */}
              {isSekolahTidakTerdaftar && (
                <div className="flex flex-col md:flex-row gap-4">
                  <select
                    name="tipe_sekolah_manual"
                    value={formData.tipe_sekolah_manual || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Update tipe_sekolah_manual
                      const newFormData = { 
                        ...formData, 
                        tipe_sekolah_manual: value,
                        // Set id_tipe_sekolah_asal berdasarkan pilihan tipe sekolah
                        id_tipe_sekolah_asal: value === 'TK' ? '112' : 
                                              value === 'RA' ? '122' : 
                                              value === 'SDN' ? '211' : 
                                              value === 'SDS' ? '212' : 
                                              value === 'MIN' ? '221' : 
                                              value === 'MIS' ? '222' : '',
                        // Reset id_sekolah_asal karena menggunakan input manual
                        id_sekolah_asal: null
                      };
                      onChange(newFormData);
                      
                      // Jika ada koordinat, panggil fetchSekolahTujuan
                      if (value && formData.latitude && formData.longitude) {
                        // Tentukan tipe untuk sekolah tujuan (TK/RA -> tk, SDN/SDS/MIN/MIS -> sd)
                        const tipeForTujuan = ['TK', 'RA'].includes(value) ? 'tk' : 'sd';
                        fetchSekolahTujuan(tipeForTujuan);
                      }
                    }}
                    className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    disabled={isLoadingTipeSekolah}
                    required
                  >
                    <option value="">Pilih Tipe Sekolah</option>
                    <option value="TK">TK</option>
                    <option value="RA">RA</option>
                    <option value="SDN">SDN</option>
                    <option value="SDS">SDS</option>
                    <option value="MIN">MIN</option>
                    <option value="MIS">MIS</option>
                  </select>
                  <input
                    type="text"
                    name="nama_sekolah_manual"
                    value={formData.nama_sekolah_manual || ''}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama sekolah"
                    className="w-full md:w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}
            </div>                                    
          </div>

          {!isEditMode && (
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
              <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
                Tahun Lulus
              </label>
              <div className="w-full md:w-3/4">
                <input
                  type="number"
                  name="tahun_lulus"
                  value={formData.tahun_lulus || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
            <label className="w-full md:w-1/4 text-sm font-medium text-gray-700">
              Pilihan Sekolah
            </label>
            <div className="w-full md:w-3/4">
              {!formData.latitude || !formData.longitude ? (
                <div className="p-4 text-center text-gray-500 border border-gray-300 rounded-md">
                  Silakan pilih lokasi pada peta terlebih dahulu
                </div>
              ) : (!formData.id_tipe_sekolah_asal && !(isSekolahTidakTerdaftar && formData.tipe_sekolah_manual)) ? (
                <div className="p-4 text-center text-gray-500 border border-gray-300 rounded-md">
                  Silakan pilih tipe sekolah asal terlebih dahulu
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-200 border border-gray-300 rounded-md">
                  {isLoadingSekolahData ? (
                    <div className="p-4 text-center text-gray-500">Memuat data sekolah...</div>
                  ) : sortedSekolah.length > 0 ? (
                    sortedSekolah.map((sekolah) => (
                      <label key={sekolah.id} className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="id_sekolah_tujuan"
                            value={sekolah.id.toString()}
                            className="form-radio mr-3 h-4 w-4 text-blue-500"
                            checked={formData.id_sekolah_tujuan?.toString() === sekolah.id.toString()}
                            onChange={(e) => {
                              console.log('Radio sekolah dipilih:', sekolah.id.toString());
                              const newFormData = { 
                                ...formData, 
                                id_sekolah_tujuan: sekolah.id.toString() 
                              };
                              onChange(newFormData);
                            }}
                          />
                          <span>{sekolah.nama}</span>
                        </div>
                        <span className="font-semibold md:ml-4">
                          {typeof sekolah.distance === 'number' ? `${sekolah.distance.toFixed(2)} KM` : ''}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      - Tidak ada sekolah tersedia -
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendaftarForm;
