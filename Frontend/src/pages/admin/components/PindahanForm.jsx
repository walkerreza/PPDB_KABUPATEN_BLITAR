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

const PindahanForm = ({ open, onClose, data, onSuccess }) => {
  const [formData, setFormData] = useState({
    id_pendaftaran: '',
    no_pendaftaran: '',
    nama_lengkap: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    id_jenis_kelamin: '',
    id_provinsi: '',
    id_kabupaten_kota: '',
    id_kecamatan: '',
    id_kelurahan: '',
    alamat: '',
    nisn: '',
    id_tipe_sekolah_asal: '',
    id_sekolah_asal: '',
    nama_sekolah_manual: '',
    tidak_ada_sekolah: false,
    nilai_bhs_indonesia: '',
    nilai_matematika: '',
    nilai_ipa: '',
    nilai: { bhs_indonesia: '0', matematika: '0', ipa: '0' }
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
      console.log('Mengambil data tipe sekolah...');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      console.log('Response tipe sekolah:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const options = response.data.data.map(item => ({
          value: item.id_tipe_sekolah.toString(),
          label: item.nama
        }));
        console.log('Tipe sekolah options:', options);
        setTipeSekolahOptions(options);
      } else {
        console.error('Format data tipe sekolah tidak sesuai:', response.data);
        setTipeSekolahOptions([]);
      }
    } catch (error) {
      console.error('Error fetching tipe sekolah:', error);
      console.error('Error detail:', error.response?.data);
      toast.error('Gagal mengambil data tipe sekolah');
    }
  }, []);

  const fetchJenisKelamin = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jenis-kelamin`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      setJenisKelaminOptions(response.data.map(item => ({
        value: item.id_jenis_kelamin.toString(),
        label: item.nama
      })));
    } catch (error) {
      console.error('Error fetching jenis kelamin:', error);
      toast.error('Gagal mengambil data jenis kelamin');
    }
  }, []);

  const fetchProvinsi = useCallback(async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/provinsi`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      setProvinsiOptions(response.data.map(item => ({
        value: item.id_provinsi.toString(),
        label: item.nama_provinsi
      })));
    } catch (error) {
      console.error('Error fetching provinsi:', error);
      toast.error('Gagal mengambil data provinsi');
    }
  }, []);

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

  const fetchSekolah = useCallback(async () => {
    if (!formData.id_tipe_sekolah_asal) {
      console.log('id_tipe_sekolah_asal tidak ada, tidak bisa fetch sekolah');
      setSekolahOptions([]);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('Mengambil data sekolah untuk tipe:', formData.id_tipe_sekolah_asal);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sekolah/tipe/${formData.id_tipe_sekolah_asal}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      console.log('Response sekolah:', response.data);

      // Handle dua kemungkinan format response
      if (Array.isArray(response.data)) {
        const options = response.data.map(item => ({
          value: item.id_sekolah.toString(),
          label: item.nama
        }));
        console.log('Sekolah options (dari array):', options);
        setSekolahOptions(options);
      } else if (response.data && Array.isArray(response.data.data)) {
        const options = response.data.data.map(item => ({
          value: item.id_sekolah.toString(),
          label: item.nama
        }));
        console.log('Sekolah options (dari data.data):', options);
        setSekolahOptions(options);
      } else {
        console.error('Format data sekolah tidak sesuai:', response.data);
        setSekolahOptions([]);
      }
    } catch (error) {
      console.error('Error fetching sekolah:', error);
      console.error('Error detail:', error.response?.data);
      toast.error('Gagal mengambil data sekolah');
    }
  }, [formData.id_tipe_sekolah_asal]);

  // Effect untuk fetch data master ketika dialog dibuka
  useEffect(() => {
    if (open) {
      // Inisialisasi array kosong untuk options
      setJenisKelaminOptions([]);
      setProvinsiOptions([]);
      setKabupatenKotaOptions([]);
      setKecamatanOptions([]);
      setKelurahanOptions([]);
      setTipeSekolahOptions([]);
      setSekolahOptions([]);
      
      // Fetch data master
      fetchJenisKelamin();
      fetchProvinsi();
      fetchTipeSekolah();
    }
  }, [open, fetchJenisKelamin, fetchProvinsi, fetchTipeSekolah]);

  // Effect untuk menginisialisasi data form ketika dialog dibuka
  useEffect(() => {
    if (open && data) {
      setFormData(prevData => ({
        ...prevData,
        ...data,
        nama_lengkap: data.nama_siswa || '', // Menyesuaikan field nama dari database
        tanggal_lahir: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : '',
        nilai_bhs_indonesia: data.nilai_bhs_indonesia || '',
        nilai_matematika: data.nilai_matematika || '',
        nilai_ipa: data.nilai_ipa || ''
      }));

      // Fetch data untuk dropdown yang bergantung pada nilai yang ada
      if (data.id_provinsi) {
        fetchKabupatenKota();
      }
      if (data.id_kabupaten_kota) {
        fetchKecamatan();
      }
      if (data.id_kecamatan) {
        fetchKelurahan();
      }
      if (data.id_tipe_sekolah_asal) {
        fetchSekolah();
      }
    }
  }, [open, data, fetchKabupatenKota, fetchKecamatan, fetchKelurahan, fetchSekolah]);

  // Effect untuk mengisi data nilai dari prop data ke formData
  useEffect(() => {
    if (data) {
      console.log('Data dari API:', data);
      
      // Konversi nilai ke string dengan penanganan null/undefined
      const formatNilai = (nilai) => {
        if (nilai === null || nilai === undefined || nilai === '') {
          return '';
        }
        return parseFloat(nilai).toString();
      };
      
      setFormData({
        id_pendaftaran: data.id_pendaftaran || '',
        nisn: data.nisn || '',
        alamat: data.alamat || '',
        id_tipe_sekolah_asal: data.id_tipe_sekolah_asal || '',
        id_sekolah_asal: data.id_sekolah_asal || '',
        nilai_bhs_indonesia: data.nilai_bhs_indonesia || '',
        nilai_matematika: data.nilai_matematika || '',
        nilai_ipa: data.nilai_ipa || ''
      });

      // Log untuk debugging
      console.log('Form data setelah diupdate:', formData);
    }
  }, [data]);

  // Effect untuk fetch data dependent
  useEffect(() => {
    fetchKabupatenKota();
  }, [formData.id_provinsi, fetchKabupatenKota]);

  useEffect(() => {
    fetchKecamatan();
  }, [formData.id_kabupaten_kota, fetchKecamatan]);

  useEffect(() => {
    fetchKelurahan();
  }, [formData.id_kecamatan, fetchKelurahan]);

  useEffect(() => {
    if (formData.id_tipe_sekolah_asal) {
      fetchSekolah();
    }
  }, [formData.id_tipe_sekolah_asal, fetchSekolah]);

  const handleChange = (field) => (event) => {
    let value = event;
    
    // Jika event adalah object (dari input HTML), ambil value-nya
    if (event?.target) {
      value = event.target.value;
    }

    // Untuk field nilai, pastikan hanya angka yang valid
    if (['nilai_bhs_indonesia', 'nilai_matematika', 'nilai_ipa'].includes(field)) {
      // Hapus karakter non-numerik kecuali titik
      value = value.replace(/[^\d.]/g, '');
      
      // Pastikan hanya ada satu titik desimal
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Konversi ke float dan validasi range
      if (value === '' || value === '.') {
        // Biarkan input kosong
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          value = '';
        } else if (numValue < 0) {
          value = '0';
        } else if (numValue > 100) {
          value = '100';
        } else {
          value = numValue.toString();
        }
      }

      console.log(`Nilai ${field} diubah:`, value);
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('Form data setelah update:', newData);
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.token) {
        throw new Error('Token tidak ditemukan');
      }

      // Validasi input
      if (!formData.alamat) {
        toast.error('Alamat harus diisi');
        return;
      }

      if (!formData.nisn) {
        toast.error('NISN harus diisi');
        return;
      }

      if (!formData.id_tipe_sekolah_asal) {
        toast.error('Tipe sekolah asal harus dipilih');
        return;
      }

      if (!formData.id_sekolah_asal) {
        toast.error('Sekolah asal harus dipilih');
        return;
      }

      // Prepare data untuk dikirim
      const dataToSend = {
        ...formData,
        nisn: formData.nisn,
        alamat: formData.alamat,
        id_tipe_sekolah_asal: formData.id_tipe_sekolah_asal,
        id_sekolah_asal: formData.id_sekolah_asal,
        nilai_bhs_indonesia: formData.nilai_bhs_indonesia || null,
        nilai_matematika: formData.nilai_matematika || null,
        nilai_ipa: formData.nilai_ipa || null
      };

      // Kirim data ke API
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/pendaftaran/${formData.id_pendaftaran}`,
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Data berhasil disimpan');
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Edit Data Pendaftar Jalur Pindahan"
      onSubmit={handleSubmit}
      actionButtons={
        <SaveButton type="submit" />
      }
    >
      <div className="space-y-4">
        <Typography variant="h6" color="blue-gray" className="mb-4">
          Data Pribadi
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="NIK"
            name="nik"
            value={formData.nik}
            onChange={handleChange('nik')}
            required
          />
          <InputField
            label="NISN"
            name="nisn"
            value={formData.nisn}
            onChange={handleChange('nisn')}
            required
          />
          <InputField
            label="Nama Lengkap"
            name="nama_lengkap"
            value={formData.nama_lengkap}
            onChange={handleChange('nama_lengkap')}
            required
          />
          <InputField
            label="Tempat Lahir"
            name="tempat_lahir"
            value={formData.tempat_lahir}
            onChange={handleChange('tempat_lahir')}
            required
          />
          <InputField
            type="date"
            label="Tanggal Lahir"
            name="tanggal_lahir"
            value={formData.tanggal_lahir}
            onChange={handleChange('tanggal_lahir')}
            required
          />
          <SelectField
            label="Jenis Kelamin"
            name="id_jenis_kelamin"
            value={formData.id_jenis_kelamin}
            onChange={handleChange('id_jenis_kelamin')}
            options={jenisKelaminOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
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
            onChange={handleChange('id_provinsi')}
            options={provinsiOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            required
          />
          <SelectField
            label="Kabupaten/Kota"
            name="id_kabupaten_kota"
            value={formData.id_kabupaten_kota}
            onChange={handleChange('id_kabupaten_kota')}
            options={kabupatenKotaOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            required
            disabled={!formData.id_provinsi}
          />
          <SelectField
            label="Kecamatan"
            name="id_kecamatan"
            value={formData.id_kecamatan}
            onChange={handleChange('id_kecamatan')}
            options={kecamatanOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            required
            disabled={!formData.id_kabupaten_kota}
          />
          <SelectField
            label="Kelurahan"
            name="id_kelurahan"
            value={formData.id_kelurahan}
            onChange={handleChange('id_kelurahan')}
            options={kelurahanOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            required
            disabled={!formData.id_kecamatan}
          />
          <div className="col-span-2">
            <InputField
              label="Alamat"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange('alamat')}
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
            onChange={handleChange('id_tipe_sekolah_asal')}
            options={tipeSekolahOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            required={!formData.tidak_ada_sekolah}
            disabled={formData.tidak_ada_sekolah}
          />
          <SelectField
            label="Sekolah Asal"
            name="id_sekolah_asal"
            value={formData.id_sekolah_asal}
            onChange={handleChange('id_sekolah_asal')}
            options={sekolahOptions || []}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            required={!formData.tidak_ada_sekolah}
            disabled={!formData.id_tipe_sekolah_asal || formData.tidak_ada_sekolah}
          />
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tidak_ada_sekolah"
                name="tidak_ada_sekolah"
                checked={formData.tidak_ada_sekolah}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    tidak_ada_sekolah: checked,
                    id_tipe_sekolah_asal: checked ? '' : prev.id_tipe_sekolah_asal,
                    id_sekolah_asal: checked ? '' : prev.id_sekolah_asal,
                    nama_sekolah_manual: checked ? prev.nama_sekolah_manual : ''
                  }));
                }}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="tidak_ada_sekolah" className="text-sm text-gray-700">
                Sekolah saya tidak ada di daftar tersebut
              </label>
            </div>
          </div>
          {formData.tidak_ada_sekolah && (
            <div className="col-span-2">
              <InputField
                label="Nama Sekolah"
                name="nama_sekolah_manual"
                value={formData.nama_sekolah_manual}
                onChange={handleChange('nama_sekolah_manual')}
                required={formData.tidak_ada_sekolah}
                placeholder="Masukkan nama sekolah Anda"
              />
            </div>
          )}
        </div>

        <Typography variant="h6" color="blue-gray" className="mt-6 mb-4">
          Nilai Ujian
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Nilai Bahasa Indonesia"
            name="nilai_bhs_indonesia"
            type="number"
            value={formData.nilai_bhs_indonesia}
            onChange={handleChange('nilai_bhs_indonesia')}
            required
          />
          <InputField
            label="Nilai Matematika"
            name="nilai_matematika"
            type="number"
            value={formData.nilai_matematika}
            onChange={handleChange('nilai_matematika')}
            required
          />
          <InputField
            label="Nilai IPA"
            name="nilai_ipa"
            type="number"
            value={formData.nilai_ipa}
            onChange={handleChange('nilai_ipa')}
            required
          />
        </div>
      </div>
    </FormDialog>
  );
};

PindahanForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  onSuccess: PropTypes.func.isRequired
};

export default PindahanForm;