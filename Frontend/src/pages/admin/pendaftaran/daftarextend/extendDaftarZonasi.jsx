import React, { useState, useEffect } from 'react';
import { InputField, SelectField } from '../../../../components/forms/FormsVariant/Forms';
import Maps from '../../../../components/element/Card/Maps';
import { Button } from "@material-tailwind/react";
import { Autocomplete, useLoadScript } from '@react-google-maps/api';

const libraries = ['places', 'geometry'];

const ExtendDaftarZonasi = ({ formData, setFormData }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    googleMapsClientId: import.meta.env.VITE_GOOGLE_MAPS_CLIENT_ID,
    language: 'id',
    region: 'ID',
    version: 'weekly'
  });

  const [mapCenter, setMapCenter] = useState({ lat: -8.0983, lng: 112.1681 }); // Koordinat Blitar
  const [coordinates, setCoordinates] = useState(null);
  const [address, setAddress] = useState('');
  const [mapType, setMapType] = useState('roadmap');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // State untuk data wilayah
  const [wilayah, setWilayah] = useState({
    provinsi: [{ value: 'JAWA TIMUR', label: 'JAWA TIMUR' }],
    kabupaten: [{ value: 'KABUPATEN BLITAR', label: 'KABUPATEN BLITAR' }],
    kecamatan: [],
    kelurahan: []
  });

  useEffect(() => {
    // Inisialisasi koordinat dari formData jika ada
    if (formData.latitude && formData.longitude) {
      const coords = {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude)
      };
      setCoordinates(coords);
      setMapCenter(coords);
      
      // Update alamat pencarian
      if (formData.alamat) {
        setAddress(formData.alamat);
        setSearchLocation(formData.alamat);
      }
    }
  }, [formData.latitude, formData.longitude, formData.alamat]);

  // Effect untuk mengatur options kecamatan dan kelurahan
  useEffect(() => {
    if (formData.nama_kecamatan) {
      setWilayah(prev => ({
        ...prev,
        kecamatan: [{ value: formData.nama_kecamatan, label: formData.nama_kecamatan }]
      }));
    }
    if (formData.nama_kelurahan) {
      setWilayah(prev => ({
        ...prev,
        kelurahan: [{ value: formData.nama_kelurahan, label: formData.nama_kelurahan }]
      }));
    }
  }, [formData.nama_kecamatan, formData.nama_kelurahan]);

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  const handleMapClick = async (e) => {
    const newCoords = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setCoordinates(newCoords);
    setMapCenter(newCoords);
    
    // Update formData dengan koordinat baru
    setFormData(prev => ({
      ...prev,
      latitude: newCoords.lat.toString(),
      longitude: newCoords.lng.toString()
    }));

    // Get address from coordinates using Google Geocoding
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: newCoords });
      if (response.results[0]) {
        const newAddress = response.results[0].formatted_address;
        setAddress(newAddress);
        setSearchLocation(newAddress);
        setFormData(prev => ({
          ...prev,
          alamat: newAddress
        }));
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const onLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const newCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setCoordinates(newCoords);
        setMapCenter(newCoords);
        setAddress(place.formatted_address);
        setSearchLocation(place.formatted_address);
        
        setFormData(prev => ({
          ...prev,
          latitude: newCoords.lat.toString(),
          longitude: newCoords.lng.toString(),
          alamat: place.formatted_address
        }));
      }
    }
  };

  const handleSearchByText = () => {
    if (searchLocation) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchLocation }, (results, status) => {
        if (status === 'OK') {
          const newCoords = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          setCoordinates(newCoords);
          setMapCenter(newCoords);
          setAddress(results[0].formatted_address);
          setSearchLocation(results[0].formatted_address);
          
          setFormData(prev => ({
            ...prev,
            latitude: newCoords.lat.toString(),
            longitude: newCoords.lng.toString(),
            alamat: results[0].formatted_address
          }));
        }
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isLoaded) return <div className="flex items-center justify-center h-[400px] bg-gray-100">
    <p className="text-gray-500">Loading map...</p>
  </div>;

  return (
    <div className="space-y-6 mt-4">
      {/* Data Siswa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="NISN"
          name="nisn"
          value={formData.nisn || ''}
          onChange={handleChange}
          disabled
        />
        <InputField
          label="Nama Siswa"
          name="nama"
          value={formData.nama || ''}
          onChange={handleChange}
          disabled
        />
      </div>

      {/* Jenis Kelamin */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="jenis_kelamin"
              value="LAKI-LAKI"
              checked={formData.jenis_kelamin === 'LAKI-LAKI'}
              onChange={handleChange}
              className="form-radio text-blue-500"
              disabled
            />
            <span className="ml-2">Laki-laki</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="jenis_kelamin"
              value="PEREMPUAN"
              checked={formData.jenis_kelamin === 'PEREMPUAN'}
              onChange={handleChange}
              className="form-radio text-blue-500"
              disabled
            />
            <span className="ml-2">Perempuan</span>
          </label>
        </div>
      </div>

      {/* Tempat & Tanggal Lahir */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Tempat Lahir"
          name="tempat_lahir"
          value={formData.tempat_lahir || ''}
          onChange={handleChange}
          disabled
        />
        <InputField
          label="Tanggal Lahir"
          name="tanggal_lahir"
          type="date"
          value={formData.tanggal_lahir || ''}
          onChange={handleChange}
          disabled
        />
      </div>

      {/* Data Orang Tua */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Nama Ayah"
          name="nama_ayah"
          value={formData.nama_ayah || ''}
          onChange={handleChange}
          disabled
        />
        <InputField
          label="Nama Ibu"
          name="nama_ibu"
          value={formData.nama_ibu || ''}
          onChange={handleChange}
          disabled
        />
      </div>
        <InputField
          label="Nomor Telepon"
          name="nomor_telepon"
          value={formData.nomor_telepon || ''}
          onChange={handleChange}          
        />

      {/* Alamat */}
      <div>
        <InputField
          label="Alamat"
          name="alamat"
          value={formData.alamat || ''}
          onChange={handleChange}
          disabled
        />
      </div>

      {/* Provinsi & Kabupaten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Provinsi"
          name="provinsi"
          value={formData.nama_provinsi || ''}
          onChange={handleChange}
          options={wilayah.provinsi}
          disabled // Provinsi tidak bisa diubah
        />
        <SelectField
          label="Kabupaten/Kota"
          name="kabupaten"
          value={formData.nama_kabupaten_kota || ''}
          onChange={handleChange}
          options={wilayah.kabupaten}
          disabled // Kabupaten tidak bisa diubah
        />
      </div>

      {/* Kecamatan & Kelurahan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Kecamatan"
          name="kecamatan"
          value={formData.nama_kecamatan || ''}
          onChange={handleChange}
          options={wilayah.kecamatan}
          disabled // Kecamatan tidak bisa diubah
        />
        <SelectField
          label="Kelurahan/Desa"
          name="kelurahan"
          value={formData.nama_kelurahan || ''}
          onChange={handleChange}
          options={wilayah.kelurahan}
          disabled // Kelurahan tidak bisa diubah
        />
      </div>

      {/* Hidden input untuk menyimpan ID wilayah */}
      <input type="hidden" name="id_provinsi" value={formData.id_provinsi || ''} />
      <input type="hidden" name="id_kabupaten_kota" value={formData.id_kabupaten_kota || ''} />
      <input type="hidden" name="id_kecamatan" value={formData.id_kecamatan || ''} />
      <input type="hidden" name="id_kelurahan" value={formData.id_kelurahan || ''} />

      {/* GPS Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GPS Lokasi
        </label>
        <div>
          <div className="flex gap-2 mb-4">
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              restrictions={{ country: 'id' }}
            >
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Masukkan lokasi atau gunakan alamat di atas"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
                disabled
              />
            </Autocomplete>
            <Button
              onClick={handleSearchByText}
              className="px-6 bg-blue-500 hover:bg-blue-600"
            >
              Cari
            </Button>
          </div>
          
          <div className="h-[400px] w-full mb-4 border border-gray-300 rounded-lg overflow-hidden">
            <Maps
              center={mapCenter}
              coordinates={coordinates}
              address={address}
              mapType={mapType}
              setMapType={setMapType}
              isLocating={isLocating}
              isMapLoaded={isMapLoaded}
              onMapLoad={handleMapLoad}
              // handleMapClick={handleMapClick}
              // setCoordinates={setCoordinates}
              setAddress={setAddress}
              containerStyle={{ height: '100%', width: '100%' }}
              areaOptions={{}}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <InputField
              label="Latitude"
              name="latitude"
              value={formData.latitude || ''}
              onChange={handleChange}
              disabled
            />
            <InputField
              label="Longitude"
              name="longitude"
              value={formData.longitude || ''}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtendDaftarZonasi;