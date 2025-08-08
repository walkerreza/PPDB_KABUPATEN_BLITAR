import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { InputField, SelectField, TextAreaField } from '../../../../components/forms/FormsVariant/Forms';
import { MdAutorenew } from "react-icons/md";
import toast from 'react-hot-toast';

const UserForm = ({ initialData = {}, onChange, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [sekolahOptions, setSekolahOptions] = useState([]);
  const [selectedSekolah, setSelectedSekolah] = useState(null);
  
  // Gunakan initialData langsung tanpa state internal
  // Ini karena form ini digunakan dalam FormDialog yang mengelola state sendiri

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika yang diubah adalah grup user
    if (name === 'id_grup_user') {
      // Reset id_sekolah jika grup bukan SEKOLAH
      if (value !== '2') {
        onChange({ target: { name: 'id_sekolah', value: '' } });
      }
    }
    
    // Jika yang diubah adalah sekolah
    if (name === 'id_sekolah') {
      // Validasi sekolah berdasarkan role
      if (value && !validateSekolahByRole(value)) {
        toast.error('Anda tidak memiliki akses untuk memilih sekolah ini');
        return;
      }
    }
    
    console.log('Form change:', name, value);
    onChange({ target: { name, value } });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onChange({ target: { name: 'photo', value: file } });
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    handleChange({ target: { name: 'password', value: password } });
  };

  const groupOptions = [
    { value: '', label: '-- Pilih Grup --' },
    { value: '1', label: 'DINAS' },
    { value: '2', label: 'SEKOLAH' },
    { value: '3', label: 'PENDAFTAR' },
    { value: '4', label: 'BIDANG PAUD/TK' },
    { value: '5', label: 'BIDANG SD' },
    { value: '6', label: 'BIDANG SMP' },
    { value: '7', label: 'BIDANG KEMENAG' }
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'AKTIF' },
    { value: 'INACTIVE', label: 'TIDAK AKTIF' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Laki-laki' },
    { value: 'Female', label: 'Perempuan' }
  ];

  // Fungsi untuk mendapatkan role user saat ini
  const getCurrentUserRole = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      return userData?.id_grup_user?.toString() || '1';
    } catch (error) {
      console.error('Error getting user role:', error);
      return '1';
    }
  };

  // Fungsi untuk mendapatkan opsi grup yang difilter berdasarkan role
  const getFilteredGroupOptions = () => {
    const currentRole = getCurrentUserRole();
    
    // Opsi grup dasar
    const groupOptions = [
      { value: '', label: 'Pilih Grup' },
      { value: '1', label: 'DINAS' },
      { value: '2', label: 'SEKOLAH' },
      { value: '3', label: 'PENDAFTAR' },
      { value: '4', label: 'BIDANG PAUD/TK' },
      { value: '5', label: 'BIDANG SD' },
      { value: '6', label: 'BIDANG SMP' },
      { value: '7', label: 'BIDANG KEMENAG' }
    ];
    
    // Filter berdasarkan role
    switch (currentRole) {
      case '1': // SuperAdmin (DINAS)
        return groupOptions; // Dapat melihat semua grup
      case '4': // Operator PAUD/TK
        return groupOptions.filter(option => 
          option.value === '' || option.value === '2' || option.value === '3' || option.value === '4'
        );
      case '5': // Operator SD
        return groupOptions.filter(option => 
          option.value === '' || option.value === '2' || option.value === '3' || option.value === '5'
        );
      case '6': // Operator SMP
        return groupOptions.filter(option => 
          option.value === '' || option.value === '2' || option.value === '3' || option.value === '6'
        );
      case '7': // Operator KEMENAG
        return groupOptions.filter(option => 
          option.value === '' || option.value === '2' || option.value === '3' || option.value === '7'
        );
      default:
        return groupOptions.filter(option => 
          option.value === '' || option.value === '2' || option.value === '3'
        );
    }
  };

  // Fungsi untuk mendapatkan nilai gender dari id_jenis_kelamin
  const getGenderValue = (id_jenis_kelamin) => {
    switch (id_jenis_kelamin) {
      case 1:
      case '1':
        return 'Male';
      case 2:
      case '2':
        return 'Female';
      default:
        return '';
    }
  };

  // Fungsi untuk handle perubahan gender
  const handleGenderChange = (e) => {
    const { value } = e.target;
    // Konversi Male/Female ke id_jenis_kelamin (1/2)
    const id_jenis_kelamin = value === 'Male' ? 1 : 2;
    onChange({ target: { name: 'id_jenis_kelamin', value: id_jenis_kelamin } });
  };

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

  // Fungsi untuk validasi sekolah berdasarkan role operator
  const validateSekolahByRole = (idSekolah) => {
    const currentRole = getCurrentUserRole();
    
    // Jika bukan operator bidang, semua sekolah valid
    if (!['4', '5', '6', '7'].includes(currentRole)) {
      return true;
    }
    
    // Cari sekolah yang dipilih
    const selectedSekolah = sekolahOptions.find(s => s.value === idSekolah);
    if (!selectedSekolah || !selectedSekolah.id_tipe_sekolah) {
      return false;
    }
    
    const tipeSekolah = parseInt(selectedSekolah.id_tipe_sekolah);
    
    // Validasi berdasarkan jenjang operator
    switch (currentRole) {
      case '4': // Operator PAUD/TK
        return [112, 122].includes(tipeSekolah); // TK, RA
      case '5': // Operator SD
        return [211, 212, 221, 222].includes(tipeSekolah); // SDN, SDS, MIN, MIS
      case '6': // Operator SMP
        return [311, 312, 321, 322].includes(tipeSekolah); // SMPN, SMPS, MTSN, MTSS
      case '7': // Operator KEMENAG
        return [122, 221, 222, 321, 322].includes(tipeSekolah); // RA, MIN, MIS, MTSN, MTSS
      default:
        return true;
    }
  };

  // Fungsi untuk mengambil data sekolah
  const fetchSekolahData = async () => {
    try {
      const headers = getHeaders();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah`, {
        headers: headers,
        credentials: 'include'
      });

      if (response.status === 401) {
        toast.error('Sesi anda telah berakhir, silahkan login kembali');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Data sekolah dari API:', result);
      
      if (result.data && Array.isArray(result.data)) {
        const sekolahData = result.data.map(sekolah => ({
          value: sekolah.id_sekolah.toString(),
          label: sekolah.nama,
          id_tipe_sekolah: sekolah.tipe_sekolah?.id_tipe_sekolah // Ambil dari relasi tipe_sekolah
        }));
        
        // Filter sekolah berdasarkan role operator
        const currentRole = getCurrentUserRole();
        const filteredSekolahData = sekolahData.filter(sekolah => {
          if (currentRole === '1') return true; // SuperAdmin bisa lihat semua
          if (!sekolah.id_tipe_sekolah) return false;
          
          const tipeSekolah = parseInt(sekolah.id_tipe_sekolah);
          switch (currentRole) {
            case '4': // Operator PAUD/TK
              return [112, 122].includes(tipeSekolah);
            case '5': // Operator SD
              return [211, 212, 221, 222].includes(tipeSekolah);
            case '6': // Operator SMP
              return [311, 312, 321, 322].includes(tipeSekolah);
            default:
              return true;
          }
        });
        
        console.log('Sekolah options yang sudah difilter:', filteredSekolahData);
        setSekolahOptions(filteredSekolahData);
      } else {
        console.error('Format data sekolah tidak sesuai:', result);
        toast.error('Format data sekolah tidak sesuai');
      }
    } catch (error) {
      console.error('Error saat mengambil data sekolah:', error);
      toast.error('Gagal mengambil data sekolah');
    }
  };

  // Fungsi untuk mengambil data sekolah berdasarkan id sekolah
  const fetchSekolahById = async (id_sekolah) => {
    try {
      if (!id_sekolah) {
        console.log('ID Sekolah tidak valid:', id_sekolah);
        return;
      }
      
      // Jika sudah ada initialData.lembaga, gunakan itu saja
      if (initialData.lembaga) {
        const sekolahData = {
          value: id_sekolah.toString(),
          label: initialData.lembaga
        };
        console.log('Setting selected sekolah from initialData.lembaga:', sekolahData);
        setSelectedSekolah(sekolahData);
        return;
      }
      
      const headers = getHeaders();
      console.log('Fetching sekolah with id:', id_sekolah);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/${id_sekolah}`, {
        headers: headers,
        credentials: 'include'
      });
  
      if (response.status === 401) {
        toast.error('Sesi anda telah berakhir, silahkan login kembali');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return;
      }
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Detail sekolah dari API:', data);
      
      if (data && data.id_sekolah) {
        const sekolahData = {
          value: data.id_sekolah.toString(),
          label: data.nama,
          id_tipe_sekolah: data.tipe_sekolah?.id_tipe_sekolah
        };
        console.log('Setting selected sekolah:', sekolahData);
        setSelectedSekolah(sekolahData);
      } else {
        console.error('Data sekolah tidak valid:', data);
      }
    } catch (error) {
      console.error('Error fetching sekolah by id:', error);
      toast.error('Gagal mengambil data sekolah');
    }
  };

  // Fungsi untuk memfilter sekolah berdasarkan role
  const getFilteredSekolahOptions = () => {
    const currentRole = getCurrentUserRole();
    
    // Jika bukan operator bidang, tampilkan semua sekolah
    if (!['4', '5', '6', '7'].includes(currentRole)) {
      return sekolahOptions;
    }
    
    // Filter sekolah berdasarkan jenjang operator
    return sekolahOptions.filter(sekolah => {
      if (!sekolah.id_tipe_sekolah) return false;
      
      const tipeSekolah = parseInt(sekolah.id_tipe_sekolah);
      
      switch (currentRole) {
        case '4': // Operator PAUD/TK
          return [112, 122].includes(tipeSekolah);
        case '5': // Operator SD
          return [211, 212, 221, 222].includes(tipeSekolah);
        case '6': // Operator SMP
          return [311, 312, 321, 322].includes(tipeSekolah);
        case '7': // Operator KEMENAG
          return [122, 221, 222, 321, 322].includes(tipeSekolah); // RA, MIN, MIS, MTSN, MTSS
        default:
          return true;
      }
    });
  };

  useEffect(() => {
    console.log('Initial Data berubah:', initialData);
    
    // Jika ada initialData dan form sedang dalam mode edit
    if (initialData && initialData.id_user) {
      console.log('Mode edit terdeteksi dengan data:', initialData);
      
      // Pastikan semua field terisi dengan benar
      if (initialData.id_jenis_kelamin) {
        // Konversi id_jenis_kelamin ke format yang diharapkan oleh form
        const genderValue = getGenderValue(initialData.id_jenis_kelamin);
        console.log('Setting gender value:', genderValue);
      }
    }
    
    // Fetch data sekolah saat komponen dimount atau initialData berubah
    fetchSekolahData().then(() => {
      // Setelah data sekolah tersedia, baru set selected sekolah
      if (initialData.id_sekolah) {
        console.log('Setting sekolah for id:', initialData.id_sekolah);
        fetchSekolahById(initialData.id_sekolah);
      }
    });
  }, [initialData]); // Tambahkan dependency initialData (keseluruhan objek)

// Tambahkan useEffect khusus untuk debugging selectedSekolah
useEffect(() => {
  console.log('Selected Sekolah berubah:', selectedSekolah);
}, [selectedSekolah]);

// Tambahkan useEffect untuk set selectedSekolah dari initialData jika belum ada
useEffect(() => {
  if (initialData.id_sekolah && initialData.lembaga && !selectedSekolah) {
    const sekolahData = {
      value: initialData.id_sekolah,
      label: initialData.lembaga
    };
    console.log('Setting selected sekolah from initialData:', sekolahData);
    setSelectedSekolah(sekolahData);
  }
}, [initialData, selectedSekolah]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Kolom Kiri */}
      <div className="space-y-4">
        <InputField
          label="Username"
          name="username"
          value={initialData.username || ''}
          onChange={handleChange}
          required
        />

        <InputField
          label="Full Name"
          name="fullName"
          value={initialData.fullName || ''}
          onChange={handleChange}
          required
        />

        <InputField
          type="email"
          label="Email"
          name="email"
          value={initialData.email || ''}
          onChange={handleChange}
          required
        />

        <InputField
          label="Phone"
          name="phone"
          value={initialData.phone || ''}
          onChange={handleChange}
        />

        <TextAreaField
          label="Address"
          name="address"
          value={initialData.address || ''}
          onChange={handleChange}
        />
      </div>

      {/* Kolom Kanan */}
      <div className="space-y-4">
        <SelectField
          label="Group"
          name="id_grup_user"
          value={initialData.id_grup_user?.toString() || ''}
          onChange={handleChange}
          options={getFilteredGroupOptions()}
          required
        />

{initialData.id_grup_user === '2' && (
  <SelectField
    label="Sekolah"
    name="id_sekolah"
    value={selectedSekolah ? selectedSekolah.value : initialData.id_sekolah || ''}
    onChange={(e) => {
      handleChange(e);
      const selected = sekolahOptions.find(opt => opt.value === e.target.value);
      setSelectedSekolah(selected);
    }}
    options={getFilteredSekolahOptions()}
    required
  />
)}

        {/* Password field dengan toggle show/hide dan generate password */}
        <div className="relative">
        <InputField
  type={showPassword ? "text" : "password"}
  label="Password"
  name="password"
  value={initialData.password || ''}
  onChange={handleChange}
  required={!initialData.id_user} // Required hanya untuk user baru
  placeholder={initialData.id_user ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
/>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-10 top-9 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={generatePassword}
            className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
            title="Generate Password"
          >
            <MdAutorenew className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Kelamin <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={getGenderValue(initialData.id_jenis_kelamin) === 'Male'}
                onChange={handleGenderChange}
                className="form-radio text-blue-500"
                required
              />
              <span className="ml-2">Laki-laki</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={getGenderValue(initialData.id_jenis_kelamin) === 'Female'}
                onChange={handleGenderChange}
                className="form-radio text-blue-500"
                required
              />
              <span className="ml-2">Perempuan</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Photo
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
            "
            accept="image/*"
          />
        </div>

        <SelectField
          label="Active"
          name="active"
          value={initialData.active || ''}
          onChange={handleChange}
          options={statusOptions}
          required
        />
      </div>
    </div>
  );
};

UserForm.propTypes = {
  initialData: PropTypes.shape({
    id_user: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
    id_grup_user: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id_jenis_kelamin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id_sekolah: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    active: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default UserForm;
