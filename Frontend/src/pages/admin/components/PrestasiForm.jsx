import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import FormDialog from '../../../components/dialog/FormDialog';
import SaveButton from '../../../components/element/Button/variant/SaveButton';
import { InputField } from '../../../components/forms/FormsVariant/Forms';
import { SelectField } from '../../../components/forms/FormsVariant/Forms';
import { CheckboxField } from '../../../components/forms/FormsVariant/Forms';
import { Typography } from '@material-tailwind/react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PrestasiForm = ({ open, onClose, data, onSuccess }) => {
  const [formData, setFormData] = useState({
    id_pendaftaran: '',
    nik: '',
    nisn: '',
    nama_lengkap: '',
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
    id_tipe_sekolah_asal: '',
    id_sekolah_asal: '',
    tidak_ada_sekolah: false,
    id_tipe_sekolah_asal_manual: '',
    nama_sekolah_manual: '',
    nilai_bhs_indonesia: '',
    nilai_matematika: '',
    nilai_ipa: ''
  });

  const [jenisKelaminOptions, setJenisKelaminOptions] = useState([]);
  const [provinsiOptions, setProvinsiOptions] = useState([]);
  const [kabupatenKotaOptions, setKabupatenKotaOptions] = useState([]);
  const [kecamatanOptions, setKecamatanOptions] = useState([]);
  const [kelurahanOptions, setKelurahanOptions] = useState([]);
  const [tipeSekolahOptions, setTipeSekolahOptions] = useState([]);
  const [sekolahOptions, setSekolahOptions] = useState([]);
  const [searchSekolah, setSearchSekolah] = useState('');
  const [showSekolahDropdown, setShowSekolahDropdown] = useState(false);

  const fetchTipeSekolah = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('Mengambil data tipe sekolah...'); // Debug log
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      });
      console.log('Response tipe sekolah:', response.data); // Debug log
      
      // Pastikan response.data.data adalah array sebelum menggunakan map
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Set options dari API
        const options = response.data.data.map(item => ({
          value: item.id_tipe_sekolah,
          label: item.nama
        }));
        
        setTipeSekolahOptions(options);
        console.log('Tipe sekolah options setelah diset:', options); // Debug log
        
        // Jika ada data.id_tipe_sekolah_asal, cari dan set label yang sesuai
        if (data && data.id_tipe_sekolah_asal) {
          console.log('Mencari tipe sekolah untuk ID:', data.id_tipe_sekolah_asal);
          const tipeSekolah = response.data.data.find(item => 
            item.id_tipe_sekolah === parseInt(data.id_tipe_sekolah_asal)
          );
          
          if (tipeSekolah) {
            console.log('Tipe sekolah ditemukan:', tipeSekolah);
          } else {
            console.log('Tipe sekolah tidak ditemukan untuk ID:', data.id_tipe_sekolah_asal);
          }
        }
      } else {
        console.error('Format data tipe sekolah tidak sesuai:', response.data);
        // Jika format tidak sesuai, set options kosong
        setTipeSekolahOptions([]);
      }
    } catch (error) {
      console.error('Error fetching tipe sekolah:', error);
      console.error('Error detail:', error.response?.data); // Debug log detail error
    }
  }, [data]);

  const [loading, setLoading] = useState(false);

  // Fungsi untuk fetch data alamat dan sekolah
  const fetchSekolah = useCallback(async () => {
    if (!formData.id_tipe_sekolah_asal) {
      console.log('id_tipe_sekolah_asal tidak ada, tidak bisa fetch sekolah');
      return;
    }
    
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('Fetching sekolah untuk tipe:', formData.id_tipe_sekolah_asal);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sekolah/tipe/${formData.id_tipe_sekolah_asal}`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      });
      console.log('Response sekolah:', response.data);
      
      // Pastikan response.data adalah array atau response.data.data adalah array
      if (Array.isArray(response.data)) {
        const options = response.data.map(item => ({
          value: item.id_sekolah,
          label: item.nama
        }));
        setSekolahOptions(options);
        console.log('Sekolah options setelah diset:', options);
        
        // Jika ada data.id_sekolah_asal, cari sekolah yang sesuai
        if (data && data.id_sekolah_asal) {
          console.log('Mencari sekolah untuk ID:', data.id_sekolah_asal);
          const sekolah = response.data.find(item => 
            item.id_sekolah === parseInt(data.id_sekolah_asal)
          );
          
          if (sekolah) {
            console.log('Sekolah ditemukan:', sekolah);
          } else {
            console.log('Sekolah tidak ditemukan untuk ID:', data.id_sekolah_asal);
          }
        }
      } else if (response.data && Array.isArray(response.data.data)) {
        const options = response.data.data.map(item => ({
          value: item.id_sekolah,
          label: item.nama
        }));
        setSekolahOptions(options);
        console.log('Sekolah options setelah diset (dari data.data):', options);
        
        // Jika ada data.id_sekolah_asal, cari sekolah yang sesuai
        if (data && data.id_sekolah_asal) {
          console.log('Mencari sekolah untuk ID:', data.id_sekolah_asal);
          const sekolah = response.data.data.find(item => 
            item.id_sekolah === parseInt(data.id_sekolah_asal)
          );
          
          if (sekolah) {
            console.log('Sekolah ditemukan:', sekolah);
          } else {
            console.log('Sekolah tidak ditemukan untuk ID:', data.id_sekolah_asal);
          }
        }
      } else {
        console.error('Format data sekolah tidak sesuai:', response.data);
        setSekolahOptions([]);
      }
    } catch (error) {
      console.error('Error fetching sekolah:', error);
    }
  }, [formData.id_tipe_sekolah_asal, data]);

  const fetchKabupatenKota = useCallback(async () => {
    if (!formData.id_provinsi) {
      setKabupatenKotaOptions([]);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/kabupaten-kota/provinsi/${formData.id_provinsi}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      setKabupatenKotaOptions(response.data.map(item => ({
        value: item.id_kabupaten_kota.toString(),
        label: item.nama_kabupaten_kota
      })));
    } catch (error) {
      console.error('Error fetching kabupaten/kota:', error);
      toast.error('Gagal mengambil data kabupaten/kota');
    }
  }, [formData.id_provinsi]);

  const fetchKecamatan = useCallback(async () => {
    if (!formData.id_kabupaten_kota) {
      setKecamatanOptions([]);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/${formData.id_kabupaten_kota}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      setKecamatanOptions(response.data.map(item => ({
        value: item.id_kecamatan.toString(),
        label: item.nama_kecamatan
      })));
    } catch (error) {
      console.error('Error fetching kecamatan:', error);
      toast.error('Gagal mengambil data kecamatan');
    }
  }, [formData.id_kabupaten_kota]);

  const fetchKelurahan = useCallback(async () => {
    if (!formData.id_kecamatan) {
      setKelurahanOptions([]);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${formData.id_kecamatan}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      setKelurahanOptions(response.data.map(item => ({
        value: item.id_kelurahan.toString(),
        label: item.nama_kelurahan
      })));
    } catch (error) {
      console.error('Error fetching kelurahan:', error);
      toast.error('Gagal mengambil data kelurahan');
    }
  }, [formData.id_kecamatan]);

  // Fungsi untuk mendapatkan tipe sekolah berdasarkan ID
  const fetchTipeSekolahById = useCallback(async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('Mengambil data tipe sekolah by ID:', id); // Debug log
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tipe-sekolah/${id}`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      });
      console.log('Response tipe sekolah by ID:', response.data); // Debug log
      
      if (response.data && response.data.data) {
        // Tambahkan ke options jika belum ada
        const existingOption = tipeSekolahOptions.find(opt => opt.value === response.data.data.id_tipe_sekolah);
        if (!existingOption) {
          setTipeSekolahOptions(prev => [
            ...prev, 
            {
              value: response.data.data.id_tipe_sekolah,
              label: response.data.data.nama
            }
          ]);
        }
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tipe sekolah by ID:', error);
      return null;
    }
  }, [tipeSekolahOptions]);

  // Effect untuk mengisi form data saat data prop berubah
  useEffect(() => {
    if (data) {
      console.log('Data yang diterima:', data); // Tambah log untuk debug
      console.log('Tipe sekolah asal dari data:', data.id_tipe_sekolah_asal); // Log khusus untuk tipe sekolah
      console.log('Sekolah asal dari data:', data.id_sekolah_asal); // Log khusus untuk sekolah asal

      // Panggil fetchTipeSekolah untuk memastikan data tipe sekolah sudah diambil
      fetchTipeSekolah();

      // Set form data setelah memastikan data tipe sekolah diambil
      setFormData({
        id_pendaftaran: data.id_pendaftaran,
        nik: data.nik || '',
        nisn: data.nisn || '',
        nama_lengkap: data.nama_siswa || '', // Sesuaikan dengan nama field dari API
        tempat_lahir: data.tempat_lahir || '',
        tanggal_lahir: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : '', // Format tanggal untuk input date
        id_jenis_kelamin: data.id_jenis_kelamin || '',
        nama_ayah: data.nama_ayah || '',
        nama_ibu: data.nama_ibu || '',
        nomor_telepon: data.nomor_telepon || '',
        id_provinsi: data.id_provinsi || '',
        id_kabupaten_kota: data.id_kabupaten_kota || '',
        id_kecamatan: data.id_kecamatan || '',
        id_kelurahan: data.id_kelurahan || '',
        alamat: data.alamat || '',
        id_tipe_sekolah_asal: data.id_tipe_sekolah_asal || '',
        id_sekolah_asal: data.id_sekolah_asal || '',
        tidak_ada_sekolah: !!data.nama_sekolah_manual,
        id_tipe_sekolah_asal_manual: data.id_tipe_sekolah_asal_manual || '',
        nama_sekolah_manual: data.nama_sekolah_manual || '',
        nilai_bhs_indonesia: data.nilai_bhs_indonesia || '',
        nilai_matematika: data.nilai_matematika || '',
        nilai_ipa: data.nilai_ipa || ''
      });
    }
  }, [data, fetchTipeSekolah]);

  // Effect untuk mengambil data provinsi
  useEffect(() => {
    const fetchProvinsi = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/provinsi`,
          {
            headers: {
              'Authorization': `Bearer ${userData.token}`
            }
          }
        );
        setProvinsiOptions(response.data.map(item => ({
          value: item.id_provinsi.toString(),
          label: item.nama_provinsi
        })));
      } catch (error) {
        console.error('Error fetching provinsi:', error);
        toast.error('Gagal mengambil data provinsi');
      }
    };

    fetchProvinsi();
  }, []);

  // Effect untuk data dependent dropdowns
  useEffect(() => {
    if (formData.id_provinsi) fetchKabupatenKota();
  }, [formData.id_provinsi, fetchKabupatenKota]);

  useEffect(() => {
    if (formData.id_kabupaten_kota) fetchKecamatan();
  }, [formData.id_kabupaten_kota, fetchKecamatan]);

  useEffect(() => {
    if (formData.id_kecamatan) fetchKelurahan();
  }, [formData.id_kecamatan, fetchKelurahan]);

  // Fetch data untuk dropdown
  const fetchJenisKelamin = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jenis-kelamin`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      });
      setJenisKelaminOptions(response.data.map(item => ({
        value: item.id_jenis_kelamin,
        label: item.nama
      })));
    } catch (error) {
      console.error('Error fetching jenis kelamin:', error);
    }
  }, []);

  // Load data saat komponen mount
  useEffect(() => {
    console.log('Component mounted, fetching initial data...'); // Debug log
    
    // Panggil semua fungsi fetch data awal
    fetchTipeSekolah();
    fetchJenisKelamin();
    
    // Jangan panggil fetchSekolah di sini karena bergantung pada formData.id_tipe_sekolah_asal
  }, []); // Hapus dependencies untuk mencegah re-render berulang

  // Load data dependent dropdowns
  useEffect(() => { fetchKabupatenKota(); }, [formData.id_provinsi, fetchKabupatenKota]);
  useEffect(() => { fetchKecamatan(); }, [formData.id_kabupaten_kota, fetchKecamatan]);
  useEffect(() => { fetchKelurahan(); }, [formData.id_kecamatan, fetchKelurahan]);

  // Debug log untuk melihat perubahan tipeSekolahOptions
  useEffect(() => {
    console.log('tipeSekolahOptions updated:', tipeSekolahOptions);
    
    // Jika tipeSekolahOptions sudah diisi dan formData.id_tipe_sekolah_asal sudah ada
    // maka kita bisa memanggil fetchSekolah
    if (tipeSekolahOptions.length > 0 && formData.id_tipe_sekolah_asal) {
      console.log('tipeSekolahOptions sudah ada dan id_tipe_sekolah_asal ada, memanggil fetchSekolah');
      fetchSekolah();
    }
  }, [tipeSekolahOptions, formData.id_tipe_sekolah_asal, fetchSekolah]);

  // Effect untuk memastikan sekolah diambil setelah data diload dan tipe sekolah sudah ada
  useEffect(() => {
    if (formData.id_tipe_sekolah_asal) {
      console.log('Effect: id_tipe_sekolah_asal berubah:', formData.id_tipe_sekolah_asal);
      
      // Langsung panggil fetchSekolah
      fetchSekolah();
    }
  }, [formData.id_tipe_sekolah_asal, fetchSekolah]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} diubah menjadi:`, value); // Debug log
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      // Log data yang akan dikirim untuk debugging
      console.log('Data yang akan diupdate:', formData);
      
      const payload = {
        ...formData,
        id_sekolah_tujuan: userData.sekolah.id_sekolah,
        id_jalur_pendaftaran: 5 // ID untuk jalur reguler (mandiri)
      };

      // Log payload lengkap yang akan dikirim
      console.log('Payload lengkap yang akan dikirim:', payload);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/pendaftaran/${formData.id_pendaftaran}`,
        payload,
        {
          headers: { 
            Authorization: `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response dari server:', response.data);

      if (response.data) {
        toast.success('Data berhasil diperbarui');
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating data:', error);
      console.error('Error detail:', error.response?.data);
      toast.error('Gagal mengupdate data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Edit Data Pendaftaran Jalur Mandiri"
      onSubmit={handleSubmit}
      loading={loading}
      buttons={
        <>
          <button
            type="button"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={onClose}
          >
            BATAL
          </button>
          <SaveButton type="submit" loading={loading} />
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="NIK"
          name="nik"
          value={formData.nik}
          onChange={handleChange}
          required
        />
        <InputField
          label="NISN"
          name="nisn"
          value={formData.nisn}
          onChange={handleChange}
          required
        />
        <InputField
          label="Nama Lengkap"
          name="nama_lengkap"
          value={formData.nama_lengkap}
          onChange={handleChange}
          required
          className="col-span-2"
        />
        <InputField
          label="Tempat Lahir"
          name="tempat_lahir"
          value={formData.tempat_lahir}
          onChange={handleChange}
          required
        />
        <InputField
          type="date"
          label="Tanggal Lahir"
          name="tanggal_lahir"
          value={formData.tanggal_lahir}
          onChange={handleChange}
          required
        />
        <SelectField
          label="Jenis Kelamin"
          name="id_jenis_kelamin"
          value={formData.id_jenis_kelamin}
          onChange={handleChange}
          options={jenisKelaminOptions}
          required
        />
      </div>

      <Typography variant="h6" color="blue-gray" className="mt-6 mb-4">
        Alamat
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Provinsi"
          name="id_provinsi"
          value={formData.id_provinsi}
          onChange={handleChange}
          options={provinsiOptions}
          required
        />
        <SelectField
          label="Kabupaten/Kota"
          name="id_kabupaten_kota"
          value={formData.id_kabupaten_kota}
          onChange={handleChange}
          options={kabupatenKotaOptions}
          required
          disabled={!formData.id_provinsi}
        />
        <SelectField
          label="Kecamatan"
          name="id_kecamatan"
          value={formData.id_kecamatan}
          onChange={handleChange}
          options={kecamatanOptions}
          required
          disabled={!formData.id_kabupaten_kota}
        />
        <SelectField
          label="Kelurahan"
          name="id_kelurahan"
          value={formData.id_kelurahan}
          onChange={handleChange}
          options={kelurahanOptions}
          required
          disabled={!formData.id_kecamatan}
        />
        <div className="col-span-2">
          <InputField
            label="Alamat"
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <Typography variant="h6" color="blue-gray" className="mt-6 mb-4">
        Sekolah Asal
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Tipe Sekolah Asal"
          name="id_tipe_sekolah_asal"
          value={formData.id_tipe_sekolah_asal}
          onChange={(e) => {
            const value = e.target.value;
            console.log('Tipe sekolah asal dipilih:', value);
            setFormData(prev => ({
              ...prev,
              id_tipe_sekolah_asal: value,
              id_sekolah_asal: '' // Reset sekolah asal saat tipe berubah
            }));
          }}
          options={tipeSekolahOptions}
          required={!formData.tidak_ada_sekolah}
        />
        <div className="relative">
          <SelectField
            label="Sekolah Asal"
            name="id_sekolah_asal"
            value={formData.id_sekolah_asal}
            onChange={(e) => {
              const value = e.target.value;
              console.log('Sekolah asal dipilih:', value);
              setFormData(prev => ({
                ...prev,
                id_sekolah_asal: value
              }));
            }}
            options={sekolahOptions}
            required={!formData.tidak_ada_sekolah}
            disabled={!formData.id_tipe_sekolah_asal || formData.tidak_ada_sekolah}
          />
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
                tidak_ada_sekolah: checked,
                id_sekolah_asal: checked ? '' : prev.id_sekolah_asal
              }));
            }}
          />
        </div>

        {formData.tidak_ada_sekolah && (
          <>
            <SelectField
              label="Tipe Sekolah Asal"
              name="id_tipe_sekolah_asal_manual"
              value={formData.id_tipe_sekolah_asal_manual}
              onChange={handleChange}
              options={tipeSekolahOptions}
              required
            />
            <InputField
              label="Nama Sekolah Asal"
              name="nama_sekolah_manual"
              value={formData.nama_sekolah_manual}
              onChange={handleChange}
              required
            />
          </>
        )}
      </div>

      <Typography variant="h6" color="blue-gray" className="mt-6 mb-4">
        Data Orang Tua
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nama Ayah"
          name="nama_ayah"
          value={formData.nama_ayah}
          onChange={handleChange}
          required
        />
        <InputField
          label="Nama Ibu"
          name="nama_ibu"
          value={formData.nama_ibu}
          onChange={handleChange}
          required
        />
        <InputField
          label="Nomor Telepon"
          name="no_telepon"
          value={formData.nomor_telepon}
          onChange={handleChange}
          required
        />
      </div>

      <Typography variant="h6" color="blue-gray" className="mt-6 mb-4">
        Nilai
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nilai BHS Indonesia"
          name="nilai_bhs_indonesia"
          value={formData.nilai_bhs_indonesia}
          onChange={handleChange}
          required
        />
        <InputField
          label="Nilai Matematika"
          name="nilai_matematika"
          value={formData.nilai_matematika}
          onChange={handleChange}
          required
        />
        <InputField
          label="Nilai IPA"
          name="nilai_ipa"
          value={formData.nilai_ipa}
          onChange={handleChange}
          required
        />
      </div>
    </FormDialog>
  );
};

PrestasiForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  onSuccess: PropTypes.func.isRequired
};

export default PrestasiForm;