import React, { useState, useEffect, useCallback } from 'react';
import { InputField, SelectField,TextAreaField } from '../../../components/forms/FormsVariant/Forms';
import Maps from '../../../components/element/Card/Maps';
import { toast } from 'react-hot-toast';
import { MdSearch, MdMyLocation } from 'react-icons/md';

const SekolahForm = ({ initialData, mode }) => {
  const [formData, setFormData] = useState({
    npsn: '',
    id_tipe_sekolah: '',
    nama_sekolah: '',
    alamat: '',
    id_kecamatan: '',
    id_kelurahan: '',
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState({});
  const [coordinates, setCoordinates] = useState(null);
  const [center, setCenter] = useState({ lat: -8.0952, lng: 112.1722 }); // Koordinat Blitar
  const [mapType, setMapType] = useState('roadmap');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState(formData.alamat || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([
    { value: '', label: '-- PILIH JENIS SEKOLAH --' }
  ]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // State untuk data kecamatan dan kelurahan
  const [kecamatanOptions, setKecamatanOptions] = useState([
    { value: '', label: '-- PILIH KECAMATAN --' }
  ]);
  const [kelurahanOptions, setKelurahanOptions] = useState([
    { value: '', label: '-- PILIH KELURAHAN --' }
  ]);

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

      // Cek apakah user adalah SuperAdmin (id_grup_user = 1)
      if (userData.id_grup_user === 1) {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
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

  // Fungsi untuk mengambil data tipe sekolah
  const fetchTipeSekolah = async () => {
    try {
      const headers = getHeaders();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data tipe sekolah');
      }

      const result = await response.json();
      console.log('Tipe Sekolah Data:', result);

      // Dapatkan role user
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userRole = userData.id_grup_user;
      
      // Filter tipe sekolah berdasarkan role
      let filteredTipeSekolah = result.data;
      
      // Filter berdasarkan role user jika bukan SuperAdmin
      if (userRole !== 1) {
        if (userRole === 4) { // PAUD/TK
          // Filter untuk PAUD/TK (id_tipe_sekolah: 112, 122)
          filteredTipeSekolah = result.data.filter(tipe => 
            [112, 122].includes(tipe.id_tipe_sekolah)
          );
        } else if (userRole === 5) { // SD
          // Filter untuk SD (id_tipe_sekolah: 211, 212, 221, 222)
          filteredTipeSekolah = result.data.filter(tipe => 
            [211, 212, 221, 222].includes(tipe.id_tipe_sekolah)
          );
        } else if (userRole === 6) { // SMP
          // Filter untuk SMP (id_tipe_sekolah: 311, 312, 321, 322)
          filteredTipeSekolah = result.data.filter(tipe => 
            [311, 312, 321, 322].includes(tipe.id_tipe_sekolah)
          );
        } else if (userRole === 7) { // KEMENAG
          // Filter untuk KEMENAG (RA, MI, MTs - id_tipe_sekolah: 122, 221, 222, 321, 322)
          filteredTipeSekolah = result.data.filter(tipe => 
            [122, 221, 222, 321, 322].includes(tipe.id_tipe_sekolah)
          );
        }
      }

      const options = [
        { value: '', label: '-- PILIH JENIS SEKOLAH --' },
        ...filteredTipeSekolah.map(tipe => ({
          value: tipe.id_tipe_sekolah.toString(),
          label: tipe.nama
        }))
      ];

      setTipeSekolahOptions(options);
    } catch (error) {
      console.error('Error fetching tipe sekolah:', error);
      toast.error('Gagal mengambil data tipe sekolah');
    }
  };

  // Fungsi untuk mengambil data kecamatan berdasarkan ID Kabupaten Blitar (3505)
  const fetchKecamatan = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/3505`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kecamatan');
      }

      const data = await response.json();
      const options = data.map(kec => ({
        value: kec.id_kecamatan,
        label: kec.nama_kecamatan
      }));

      setKecamatanOptions([
        { value: '', label: '-- PILIH KECAMATAN --' },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data kecamatan');
    }
  };

  // Fungsi untuk mengambil data kelurahan berdasarkan ID kecamatan
  const fetchKelurahan = async (kecamatanId) => {
    if (!kecamatanId) {
      setKelurahanOptions([{ value: '', label: '-- PILIH KELURAHAN --' }]);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${kecamatanId}`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kelurahan');
      }

      const data = await response.json();
      const options = data.map(kel => ({
        value: kel.id_kelurahan,
        label: kel.nama_kelurahan
      }));

      setKelurahanOptions([
        { value: '', label: '-- PILIH KELURAHAN --' },
        ...options
      ]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data kelurahan');
    }
  };

  // Fungsi pencarian lokasi
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

        // Mendapatkan komponen alamat
        const addressComponents = response.results[0].address_components;
        let provinsi = '', kabupaten = '', kecamatan = '', kelurahan = '';

        addressComponents.forEach(component => {
          const types = component.types;

          if (types.includes('administrative_area_level_1')) {
            provinsi = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            kabupaten = component.long_name;
          } else if (types.includes('administrative_area_level_3')) {
            kecamatan = component.long_name;
          } else if (types.includes('administrative_area_level_4')) {
            kelurahan = component.long_name;
          }
        });

        // Mencari ID wilayah yang sesuai dari options
        if (provinsi) {
          const foundProvinsi = wilayahOptions.provinsi.find(p => 
            p.label.toLowerCase().includes(provinsi.toLowerCase())
          );
          if (foundProvinsi) {
            setFormData(prev => ({ ...prev, id_provinsi: foundProvinsi.value }));
            // Fetch kabupaten setelah provinsi ditemukan
            const kabupatenData = await fetchKabupaten(foundProvinsi.value);
            
            if (kabupaten && kabupatenData) {
              const foundKabupaten = kabupatenData.find(k => 
                k.label.toLowerCase().includes(kabupaten.toLowerCase())
              );
              if (foundKabupaten) {
                setFormData(prev => ({ ...prev, id_kabupaten_kota: foundKabupaten.value }));
                // Fetch kecamatan setelah kabupaten ditemukan
                const kecamatanData = await fetchKecamatan(foundKabupaten.value);

                if (kecamatan && kecamatanData) {
                  const foundKecamatan = kecamatanData.find(k => 
                    k.label.toLowerCase().includes(kecamatan.toLowerCase())
                  );
                  if (foundKecamatan) {
                    setFormData(prev => ({ ...prev, id_kecamatan: foundKecamatan.value }));
                    // Fetch kelurahan setelah kecamatan ditemukan
                    const kelurahanData = await fetchKelurahan(foundKecamatan.value);

                    if (kelurahan && kelurahanData) {
                      const foundKelurahan = kelurahanData.find(k => 
                        k.label.toLowerCase().includes(kelurahan.toLowerCase())
                      );
                      if (foundKelurahan) {
                        setFormData(prev => ({ ...prev, id_kelurahan: foundKelurahan.value }));
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Update alamat lengkap
        setFormData(prev => ({
          ...prev,
          alamat: address,
          latitude: coordinates.lat.toString(),
          longitude: coordinates.lng.toString()
        }));

      }
    } catch (error) {
      console.error('Error mencari lokasi:', error);
      toast.error('Gagal mencari lokasi');
    }
  };

  // Fungsi mendapatkan lokasi saat ini
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
            console.error('Error mendapatkan alamat:', error);
            toast.error('Gagal mendapatkan alamat');
          }

          setIsLocating(false);
        },
        (error) => {
          console.error('Error mendapatkan lokasi:', error);
          toast.error('Gagal mendapatkan lokasi saat ini');
          setIsLocating(false);
        }
      );
    }
  };

  // Panggil fetchTipeSekolah saat komponen mount
  useEffect(() => {
    fetchTipeSekolah();
  }, []);

  // Effect untuk mengambil data kecamatan saat komponen dimount
  useEffect(() => {
    fetchKecamatan();
  }, []);

  // Effect untuk mengecek apakah user adalah SuperAdmin
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        if (userData.id_grup_user === 1) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }, []);

  // Effect untuk mengisi form data saat mode edit
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(prev => ({
        ...prev,
        npsn: initialData.npsn || '',
        id_tipe_sekolah: initialData.id_tipe_sekolah || '',
        nama_sekolah: initialData.nama_sekolah || '',
        alamat: initialData.alamat || '',
        id_kecamatan: initialData.id_kecamatan || '',
        id_kelurahan: initialData.id_kelurahan || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || ''
      }));

      // Set coordinates untuk marker
      if (initialData.latitude && initialData.longitude) {
        const lat = parseFloat(initialData.latitude);
        const lng = parseFloat(initialData.longitude);
        setCoordinates({ lat, lng });
        setCenter({ lat, lng }); // Update center juga biar fokus ke marker
      }

      // Jika ada id_kecamatan, ambil data kelurahan
      if (initialData.id_kecamatan) {
        fetchKelurahan(initialData.id_kecamatan);
      }
    } else if (mode === 'add' && initialData && initialData.role_filter) {
      // Jika mode add dan ada role_filter, panggil fetchTipeSekolah lagi untuk memastikan filter diterapkan
      fetchTipeSekolah();
    }
  }, [mode, initialData]);

  // Effect untuk mengambil data kelurahan saat kecamatan berubah
  useEffect(() => {
    if (formData.id_kecamatan) {
      fetchKelurahan(formData.id_kecamatan);
    }
  }, [formData.id_kecamatan]);

  // Debug untuk melihat perubahan form data
  useEffect(() => {
    console.log('Current Form Data:', formData);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to:`, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMapLoad = useCallback((map) => {
    setIsMapLoaded(true);
  }, []);

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    // Update coordinates for map marker
    setCoordinates({ lat, lng });
    
    // Update form data with coordinates only
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
  }, []);

  const containerStyle = {
    width: '100%',
    height: '400px',
    marginTop: '1rem'
  };

  const areaOptions = {
    clickable: false,
    visible: true,
    editable: false,
    draggable: false,
  };

  // Handler untuk perubahan kecamatan
  const handleKecamatanChange = (e) => {
    const kecamatanId = e.target.value;
    setFormData(prev => ({
      ...prev,
      id_kecamatan: kecamatanId,
      id_kelurahan: '' // Reset kelurahan saat kecamatan berubah
    }));
  };

  // Handler untuk perubahan kelurahan
  const handleKelurahanChange = (e) => {
    const kelurahanId = e.target.value;
    setFormData(prev => ({
      ...prev,
      id_kelurahan: kelurahanId
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Informasi Role */}
      {!isSuperAdmin && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-2">
          <p className="text-blue-700 font-medium">
            {(() => {
              const userData = JSON.parse(localStorage.getItem('userData') || '{}');
              const userRole = userData.id_grup_user;
              
              if (userRole === 4) {
                return `${mode === 'add' ? 'Menambahkan' : 'Mengedit'} Sekolah untuk Jenjang PAUD/TK`;
              } else if (userRole === 5) {
                return `${mode === 'add' ? 'Menambahkan' : 'Mengedit'} Sekolah untuk Jenjang SD`;
              } else if (userRole === 6) {
                return `${mode === 'add' ? 'Menambahkan' : 'Mengedit'} Sekolah untuk Jenjang SMP`;
              } else if (userRole === 7) {
                return `${mode === 'add' ? 'Menambahkan' : 'Mengedit'} Sekolah untuk Jenjang RA/MI/MTs (Kemenag)`;
              } else {
                return '';
              }
            })()}
          </p>
        </div>
      )}
      
      {/* Form Fields */}
      <InputField
        label="NPSN"
        name="npsn"
        value={formData.npsn}
        onChange={handleInputChange}
        placeholder="Masukkan NPSN"
        required
        error={errors.npsn}
      />

      <SelectField
        label="Jenis Sekolah"
        name="id_tipe_sekolah"
        value={formData.id_tipe_sekolah}
        onChange={handleInputChange}
        options={tipeSekolahOptions}
        required
        error={errors.id_tipe_sekolah}
      />
      {!isSuperAdmin && (
        <div className="mt-1 text-xs text-blue-600 italic">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pilihan jenis sekolah dibatasi sesuai dengan bidang Anda
          </span>
        </div>
      )}

      <InputField
        label="Nama Sekolah"
        name="nama_sekolah"
        value={formData.nama_sekolah}
        onChange={handleInputChange}
        placeholder="Masukkan nama sekolah"
        required
        error={errors.nama_sekolah}
      />

      <TextAreaField
        label="Alamat"
        name="alamat"
        value={formData.alamat}
        onChange={handleInputChange}
        placeholder="Masukkan alamat lengkap"
        required
        error={errors.alamat}
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Kecamatan"
          name="id_kecamatan"
          value={formData.id_kecamatan}
          onChange={handleKecamatanChange}
          options={kecamatanOptions}
          required
          error={errors.id_kecamatan}
        />

        <SelectField
          label="Kelurahan"
          name="id_kelurahan"
          value={formData.id_kelurahan}
          onChange={handleKelurahanChange}
          options={kelurahanOptions}
          required
          error={errors.id_kelurahan}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Latitude"
          name="latitude"
          value={formData.latitude}
          onChange={handleInputChange}
          readOnly
          error={errors.latitude}
        />
        <InputField
          label="Longitude"
          name="longitude"
          value={formData.longitude}
          onChange={handleInputChange}
          readOnly
          error={errors.longitude}
        />
      </div>

      <div className="mb-4">
        <div className="flex w-full gap-2 mb-2">
          <div className="flex-1 relative">
            <InputField
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukan alamat sekolah"
              className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSearchLocation();
            }}
            className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <MdSearch className="h-5 w-5" />
            Cari
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleGetCurrentLocation();
            }}
            className="h-10 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
            disabled={isLocating}
          >
            <MdMyLocation className="h-5 w-5" />
            {isLocating ? "Mencari..." : "Lokasi Saat Ini"}
          </button>
        </div>
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
      </div>

    </div>
  );
};

export default SekolahForm;