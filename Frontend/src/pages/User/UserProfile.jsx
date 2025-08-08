import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  Typography,
  Radio,
} from "@material-tailwind/react";
import UserSidebar from '../../components/common/User/UserSidebar';
import UserHeader from '../../components/common/User/UserHeader';
import UserFooter from '../../components/common/User/UserFooter';
import SaveButton from '../../components/element/Button/variant/SaveButton';
import Maps from '../../components/element/Card/Maps';
import { InputField, TextAreaField } from '../../components/forms/FormsVariant/Forms';
import { UserGuard } from '../../utils/AuthGuard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const UserProfile = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [coordinates, setCoordinates] = useState(null);
  const [center, setCenter] = useState({ lat: -8.0952, lng: 112.1722 }); // Koordinat Blitar
  const [mapType, setMapType] = useState('roadmap');
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    nik: '',
    nisn: '',
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    nomor_telepon: '',
    nama_ayah: '',
    nama_ibu: '',
    alamat: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  // Load user data from localStorage and pendaftaran
  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userDataString);
    
    // Set initial form data from localStorage
    setFormData(prevData => ({
      ...prevData,
      nama: userData.fullname || '',  // Keep nama from localStorage
      password: ''  // Reset password field
    }));

    // Fetch pendaftaran data
    const fetchPendaftaranData = async () => {
      try {
        // Get pendaftaran by user ID
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/user/${userData.id_user}`);
        if (response.data.success) {
          const pendaftaranData = response.data.data;
          console.log('Pendaftaran data:', pendaftaranData);
          
          // Update form with pendaftaran data
          setFormData(prevData => ({
            ...prevData,
            nik: pendaftaranData.nik || '',
            nama: pendaftaranData.nama_siswa || '', // Use nama_siswa from pendaftaran
            nisn: pendaftaranData.nisn || '',
            tempat_lahir: pendaftaranData.tempat_lahir || '',
            tanggal_lahir: pendaftaranData.tanggal_lahir ? pendaftaranData.tanggal_lahir.split('T')[0] : '',
            jenis_kelamin: pendaftaranData.jenis_kelamin?.nama || '',
            nomor_telepon: pendaftaranData.nomor_telepon || '',
            nama_ayah: pendaftaranData.nama_ayah || '',
            nama_ibu: pendaftaranData.nama_ibu || '',
            alamat: pendaftaranData.alamat || '',
            latitude: pendaftaranData.latitude || '',
            longitude: pendaftaranData.longitude || ''
          }));

          // Set alamat if available
          if (pendaftaranData.alamat) {
            setAddress(pendaftaranData.alamat);
          }

          // Set coordinates if available
          if (pendaftaranData.latitude && pendaftaranData.longitude) {
            const coords = {
              lat: parseFloat(pendaftaranData.latitude),
              lng: parseFloat(pendaftaranData.longitude)
            };
            setCoordinates(coords);
            setCenter(coords);
          }
        }
      } catch (error) {
        console.error('Error fetching pendaftaran data:', error);
        toast.error('Gagal mengambil data pendaftaran');
      }
    };

    fetchPendaftaranData();
  }, [navigate]);

  const handleMapClick = async (e) => {
    const newCoords = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setCoordinates(newCoords);
    setCenter(newCoords);

    // Update form data with new coordinates
    setFormData(prev => ({
      ...prev,
      latitude: newCoords.lat.toString(),
      longitude: newCoords.lng.toString()
    }));
  };

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoordinates(newCoords);
          setCenter(newCoords);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Tidak dapat mengakses lokasi Anda. Pastikan GPS aktif dan izin lokasi diberikan.");
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      toast.error("Browser Anda tidak mendukung geolokasi.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      
      // Update password if provided
      if (formData.password) {
        try {
          const userResponse = await axios.put(`${import.meta.env.VITE_API_URL}/user/${userData.id_user}`, {
            password: formData.password
          });
          if (userResponse.data.success) {
            toast.success('Password berhasil diperbarui');
          }
        } catch (error) {
          console.error('Error updating password:', error);
          toast.error('Gagal memperbarui password');
          return;
        }
      }

      // Update pendaftaran data
      const pendaftaranData = {
        nisn: formData.nisn,
        nomor_telepon: formData.nomor_telepon,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/pendaftaran/user/${userData.id_user}`, pendaftaranData);
      
      if (response.data.success) {
        // Also update user data with the new phone number and name
        try {
          await axios.put(`${import.meta.env.VITE_API_URL}/user/${userData.id_user}`, {
            phone: formData.nomor_telepon,
            fullname: formData.nama
          });

          // Update localStorage with new user data
          const updatedUserData = {
            ...userData,
            phone: formData.nomor_telepon,
            fullname: formData.nama
          };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        } catch (error) {
          console.error('Error updating user data:', error);
          toast.error('Gagal memperbarui data user');
        }

        toast.success('Data berhasil diperbarui');
        // Update form data with response
        const updatedData = response.data.data;
        setFormData(prevData => ({
          ...prevData,
          nisn: updatedData.nisn || '',
          nomor_telepon: updatedData.nomor_telepon || '',
          latitude: updatedData.latitude || '',
          longitude: updatedData.longitude || '',
          password: '' // Clear password field after successful update
        }));
      } else {
        toast.error(response.data.message || 'Gagal memperbarui data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      const errorMessage = error.response?.data?.message || 'Gagal memperbarui data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };

  const containerStyle = {
    width: '100%',
    height: '100%'
  };

  const areaOptions = {
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.1,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    radius: 1000,
    zIndex: 1
  };

  return (
    <UserGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <UserHeader isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <UserSidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-2 sm:p-4 md:p-6 lg:p-8">
              <Card className="p-4 sm:p-6">
                <Typography variant="h5" color="blue-gray" className="mb-4 sm:mb-6 text-lg sm:text-xl">
                  Profil Pendaftar
                </Typography>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <InputField
                      label="NIK"
                      type="text"
                      name="nik"
                      value={formData.nik}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                    />

                    <InputField
                      label="Password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Kosongkan jika tidak ingin mengubah password"
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    />

                    <InputField
                      label="NISN"
                      type="text"
                      name="nisn"
                      value={formData.nisn}
                      onChange={handleChange}
                      required
                    />

                    <InputField
                      label="Nama Lengkap"
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <InputField
                        label="Tempat Lahir"
                        type="text"
                        name="tempat_lahir"
                        value={formData.tempat_lahir}
                        onChange={handleChange}
                        required
                        readOnly
                        className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                      />

                      <div className="w-3/4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Lahir
                        </label>
                        <input
                          type="text"
                          value={formData.tanggal_lahir ? formatDateDisplay(formData.tanggal_lahir) : ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                        />
                        <input 
                          type="date"
                          name="tanggal_lahir"
                          value={formData.tanggal_lahir}
                          onChange={handleChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="w-full">
                      <Typography variant="small" className="text-gray-700 mb-2">
                        Jenis Kelamin
                      </Typography>
                      <div className="flex gap-4">
                        <Radio
                          name="jenis_kelamin"
                          label="Laki-laki"
                          value="LAKI-LAKI"
                          checked={formData.jenis_kelamin === "LAKI-LAKI"}
                          onChange={handleChange}
                          disabled
                        />
                        <Radio
                          name="jenis_kelamin"
                          label="Perempuan"
                          value="PEREMPUAN"
                          checked={formData.jenis_kelamin === "PEREMPUAN"}
                          onChange={handleChange}
                          disabled
                        />
                      </div>
                    </div>

                    <InputField
                      label="No. Telepon"
                      type="tel"
                      name="nomor_telepon"
                      value={formData.nomor_telepon}
                      onChange={handleChange}
                      required
                    />

                    <InputField
                      label="Nama Ayah"
                      type="text"
                      name="nama_ayah"
                      value={formData.nama_ayah}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                    />

                    <InputField
                      label="Nama Ibu"
                      type="text"
                      name="nama_ibu"
                      value={formData.nama_ibu}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                    />

                    <TextAreaField
                      label="Alamat"
                      type="text"
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                    />

                    <div className="w-full space-y-2">
                      <Typography variant="small" className="text-gray-700 mb-2">
                        Lokasi Tempat Tinggal
                      </Typography>
                      <div className="mt-2">
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
                          containerStyle={{ width: '100%', height: '400px' }}
                          areaOptions={{}}
                          setCoordinates={setCoordinates}
                          setAddress={setAddress}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <InputField
                          label="Latitude"
                          type="text"
                          value={formData.latitude}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                        />
                        <InputField
                          label="Longitude"
                          type="text"
                          value={formData.longitude}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                        />
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      <SaveButton
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </form>
              </Card>
            </main>

            <div className="mt-auto">
              <UserFooter />
            </div>
          </div>
        </div>
      </div>
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
      />
    </UserGuard>
  );
};

export default UserProfile;