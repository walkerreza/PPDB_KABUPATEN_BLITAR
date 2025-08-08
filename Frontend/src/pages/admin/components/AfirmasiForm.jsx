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

const AfirmasiForm = ({ open, onClose, data, onSuccess }) => {
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
    const [loading, setLoading] = useState(false);

    // Fungsi untuk fetch data jenis kelamin
    const fetchJenisKelamin = useCallback(async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log('Fetching jenis kelamin...');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/jenis-kelamin`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            console.log('Response jenis kelamin:', response.data);
            
            if (response.data && Array.isArray(response.data)) {
                setJenisKelaminOptions(response.data.map(item => ({
                    value: item.id_jenis_kelamin,
                    label: item.nama
                })));
            } else if (response.data && Array.isArray(response.data.data)) {
                setJenisKelaminOptions(response.data.data.map(item => ({
                    value: item.id_jenis_kelamin,
                    label: item.nama
                })));
            }
            console.log('Jenis kelamin options:', jenisKelaminOptions);
        } catch (error) {
            console.error('Error fetching jenis kelamin:', error);
            toast.error('Gagal mengambil data jenis kelamin');
        }
    }, []);

    // Effect untuk mengisi data form jika ada
    useEffect(() => {
        const initializeData = async () => {
            console.log('Component mounted, fetching initial data...');
            await fetchJenisKelamin();
            
            if (data) {
                console.log('Data dari API:', data);
                setFormData(prev => ({
                    ...prev,
                    id_pendaftaran: data.id_pendaftaran || '',
                    nik: data.nik || '',
                    nisn: data.nisn || '',
                    nama_lengkap: data.nama_siswa || '',
                    tempat_lahir: data.tempat_lahir || '',
                    tanggal_lahir: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : '',
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
                    nilai_bhs_indonesia: data.nilai_bhs_indonesia || '',
                    nilai_matematika: data.nilai_matematika || '',
                    nilai_ipa: data.nilai_ipa || ''
                }));

                // Fetch data untuk dropdown
                fetchProvinsi();
                if (data.id_provinsi) fetchKabupatenKota(data.id_provinsi);
                if (data.id_kabupaten_kota) fetchKecamatan(data.id_kabupaten_kota);
                if (data.id_kecamatan) fetchKelurahan(data.id_kecamatan);
                fetchTipeSekolah();
                if (data.id_tipe_sekolah_asal) fetchSekolah(data.id_tipe_sekolah_asal);
            }
        };

        initializeData();
    }, [data, fetchJenisKelamin]);

    // Fungsi untuk fetch data provinsi
    const fetchProvinsi = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log('Fetching provinsi...');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/provinsi`,
                {
                    headers: {
                        'Authorization': `Bearer ${userData.token}`
                    }
                }
            );
            console.log('Response provinsi:', response.data);
            
            if (Array.isArray(response.data)) {
                setProvinsiOptions(response.data.map(item => ({
                    value: item.id_provinsi.toString(),
                    label: item.nama_provinsi
                })));
            }
        } catch (error) {
            console.error('Error fetching provinsi:', error);
            toast.error('Gagal mengambil data provinsi');
        }
    };

    // Fungsi untuk fetch data kabupaten/kota
    const fetchKabupatenKota = async (provinsiId) => {
        if (!provinsiId) return;
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/kabupaten-kota/provinsi/${provinsiId}`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            setKabupatenKotaOptions(response.data.map(item => ({
                value: item.id_kabupaten_kota.toString(),
                label: item.nama_kabupaten_kota
            })));
        } catch (error) {
            console.error('Error fetching kabupaten/kota:', error);
            toast.error('Gagal mengambil data kabupaten/kota');
        }
    };

    // Fungsi untuk fetch data kecamatan
    const fetchKecamatan = async (kabupatenId) => {
        if (!kabupatenId) return;
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/kecamatan/kabupaten-kota/${kabupatenId}`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            setKecamatanOptions(response.data.map(item => ({
                value: item.id_kecamatan.toString(),
                label: item.nama_kecamatan
            })));
        } catch (error) {
            console.error('Error fetching kecamatan:', error);
            toast.error('Gagal mengambil data kecamatan');
        }
    };

    // Fungsi untuk fetch data kelurahan
    const fetchKelurahan = async (kecamatanId) => {
        if (!kecamatanId) return;
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/kelurahan/kecamatan/${kecamatanId}`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            setKelurahanOptions(response.data.map(item => ({
                value: item.id_kelurahan.toString(),
                label: item.nama_kelurahan
            })));
        } catch (error) {
            console.error('Error fetching kelurahan:', error);
            toast.error('Gagal mengambil data kelurahan');
        }
    };

    // Fungsi untuk fetch data sekolah
    const fetchSekolah = useCallback(async (idTipeSekolah) => {
        if (!idTipeSekolah) {
            console.log('ID tipe sekolah tidak ada, tidak bisa fetch sekolah');
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log('Fetching sekolah untuk tipe:', idTipeSekolah);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/sekolah/tipe/${idTipeSekolah}`,
                {
                    headers: { Authorization: `Bearer ${userData.token}` }
                }
            );
            console.log('Response sekolah:', response.data);

            if (Array.isArray(response.data)) {
                const options = response.data.map(item => ({
                    value: item.id_sekolah,
                    label: item.nama
                }));
                setSekolahOptions(options);
                console.log('Sekolah options setelah diset:', options);
            } else if (response.data && Array.isArray(response.data.data)) {
                const options = response.data.data.map(item => ({
                    value: item.id_sekolah,
                    label: item.nama
                }));
                setSekolahOptions(options);
                console.log('Sekolah options setelah diset (dari data.data):', options);
            } else {
                console.error('Format data sekolah tidak sesuai:', response.data);
                setSekolahOptions([]);
            }
        } catch (error) {
            console.error('Error fetching sekolah:', error);
            toast.error('Gagal mengambil data sekolah');
        }
    }, []);

    // Effect untuk mengambil data sekolah ketika tipe sekolah berubah
    useEffect(() => {
        console.log('Effect tipe sekolah berubah:', formData.id_tipe_sekolah_asal);
        if (formData.id_tipe_sekolah_asal) {
            fetchSekolah(formData.id_tipe_sekolah_asal);
        } else {
            setSekolahOptions([]);
        }
    }, [formData.id_tipe_sekolah_asal, fetchSekolah]);

    // Fungsi untuk fetch data tipe sekolah
    const fetchTipeSekolah = useCallback(async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            console.log('Mengambil data tipe sekolah...');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
                headers: { Authorization: `Bearer ${userData.token}` }
            });
            console.log('Response tipe sekolah:', response.data);
            
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                const options = response.data.data.map(item => ({
                    value: item.id_tipe_sekolah,
                    label: item.nama
                }));
                
                setTipeSekolahOptions(options);
                console.log('Tipe sekolah options setelah diset:', options);
                
                // Jika ada data.id_tipe_sekolah_asal, fetch sekolah
                if (data && data.id_tipe_sekolah_asal) {
                    fetchSekolah(data.id_tipe_sekolah_asal);
                }
            } else {
                console.error('Format data tipe sekolah tidak sesuai:', response.data);
                setTipeSekolahOptions([]);
            }
        } catch (error) {
            console.error('Error fetching tipe sekolah:', error);
            toast.error('Gagal mengambil data tipe sekolah');
        }
    }, [data, fetchSekolah]);

    // Effect untuk inisialisasi data
    useEffect(() => {
        console.log('Initializing data...');
        fetchTipeSekolah();
    }, [fetchTipeSekolah]);

    // Handler untuk perubahan input
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
        }

        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Jika field yang berubah adalah provinsi
            if (field === 'id_provinsi') {
                fetchKabupatenKota(value);
                newData.id_kabupaten_kota = '';
                newData.id_kecamatan = '';
                newData.id_kelurahan = '';
            }
            // Jika field yang berubah adalah kabupaten/kota
            else if (field === 'id_kabupaten_kota') {
                fetchKecamatan(value);
                newData.id_kecamatan = '';
                newData.id_kelurahan = '';
            }
            // Jika field yang berubah adalah kecamatan
            else if (field === 'id_kecamatan') {
                fetchKelurahan(value);
                newData.id_kelurahan = '';
            }
            // Jika field yang berubah adalah tipe sekolah
            else if (field === 'id_tipe_sekolah_asal') {
                if (value) {
                    console.log('Memanggil fetchSekolah dengan ID:', value);
                    fetchSekolah(value);
                }
                newData.id_sekolah_asal = '';
            }

            return newData;
        });
    };

    // Handler untuk submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData || !userData.token) {
                throw new Error('Token tidak ditemukan');
            }

            // Validasi input
            if (!formData.nik || !formData.nisn || !formData.nama_lengkap) {
                toast.error('NIK, NISN, dan Nama Lengkap harus diisi');
                return;
            }

            // Log data yang akan dikirim untuk debugging
            console.log('Data yang akan diupdate:', formData);
            
            const payload = {
                ...formData,
                id_sekolah_tujuan: userData.sekolah.id_sekolah,
                id_jalur_pendaftaran: 2 // ID untuk jalur afirmasi
            };

            // Log payload lengkap yang akan dikirim
            console.log('Payload lengkap yang akan dikirim:', payload);

            // Kirim data ke API
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/pendaftaran/${formData.id_pendaftaran}`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${userData.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Response update:', response.data);

            if (response.data) {
                toast.success('Data berhasil disimpan');
                onSuccess && onSuccess(response.data);
                onClose();
            } else {
                toast.error(response.data.message || 'Gagal menyimpan data');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            console.error('Error detail:', error.response?.data);
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            title="Edit Data Pendaftar Jalur Afirmasi"
            onSubmit={handleSubmit}
            loading={loading}
            footer={
                <SaveButton type="submit" loading={loading}>
                    Simpan
                </SaveButton>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Typography variant="h6" className="mb-4">
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
                        label="Tanggal Lahir"
                        name="tanggal_lahir"
                        type="date"
                        value={formData.tanggal_lahir}
                        onChange={handleChange('tanggal_lahir')}
                        required
                    />
                    <SelectField
                        label="Jenis Kelamin"
                        name="id_jenis_kelamin"
                        value={formData.id_jenis_kelamin}
                        onChange={handleChange('id_jenis_kelamin')}
                        options={jenisKelaminOptions}
                        required
                    />
                </div>

                <Typography variant="h6" className="mb-4 mt-6">
                    Alamat
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        label="Provinsi"
                        name="id_provinsi"
                        value={formData.id_provinsi}
                        onChange={handleChange('id_provinsi')}
                        options={provinsiOptions}
                        required
                    />
                    <SelectField
                        label="Kabupaten/Kota"
                        name="id_kabupaten_kota"
                        value={formData.id_kabupaten_kota}
                        onChange={handleChange('id_kabupaten_kota')}
                        options={kabupatenKotaOptions}
                        required
                    />
                    <SelectField
                        label="Kecamatan"
                        name="id_kecamatan"
                        value={formData.id_kecamatan}
                        onChange={handleChange('id_kecamatan')}
                        options={kecamatanOptions}
                        required
                    />
                    <SelectField
                        label="Kelurahan"
                        name="id_kelurahan"
                        value={formData.id_kelurahan}
                        onChange={handleChange('id_kelurahan')}
                        options={kelurahanOptions}
                        required
                    />
                    <div className="col-span-2">
                        <InputField
                            label="Alamat Lengkap"
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleChange('alamat')}
                            required
                            multiline
                            rows={3}
                        />
                    </div>
                </div>

                <Typography variant="h6" className="mb-4 mt-6">
                    Sekolah Asal
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        label="Tipe Sekolah Asal"
                        name="id_tipe_sekolah_asal"
                        value={formData.id_tipe_sekolah_asal}
                        onChange={handleChange('id_tipe_sekolah_asal')}
                        options={tipeSekolahOptions}
                        required
                    />
                    <SelectField
                        label="Sekolah Asal"
                        name="id_sekolah_asal"
                        value={formData.id_sekolah_asal}
                        onChange={handleChange('id_sekolah_asal')}
                        options={sekolahOptions}
                        required
                    />
                    <CheckboxField
                        label="Tidak Ada Sekolah"
                        name="tidak_ada_sekolah"
                        value={formData.tidak_ada_sekolah}
                        onChange={handleChange('tidak_ada_sekolah')}
                    />
                    {formData.tidak_ada_sekolah && (
                        <>
                            <InputField
                                label="Tipe Sekolah Asal Manual"
                                name="id_tipe_sekolah_asal_manual"
                                value={formData.id_tipe_sekolah_asal_manual}
                                onChange={handleChange('id_tipe_sekolah_asal_manual')}
                                required
                            />
                            <InputField
                                label="Nama Sekolah Manual"
                                name="nama_sekolah_manual"
                                value={formData.nama_sekolah_manual}
                                onChange={handleChange('nama_sekolah_manual')}
                                required
                            />
                        </>
                    )}
                </div>

                <Typography variant="h6" className="mb-4 mt-6">
                    Data Orang Tua
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Nama Ayah"
                        name="nama_ayah"
                        value={formData.nama_ayah}
                        onChange={handleChange('nama_ayah')}
                        required
                    />
                    <InputField
                        label="Nama Ibu"
                        name="nama_ibu"
                        value={formData.nama_ibu}
                        onChange={handleChange('nama_ibu')}
                        required
                    />
                    <InputField
                        label="Nomor Telepon"
                        name="nomor_telepon"
                        value={formData.nomor_telepon}
                        onChange={handleChange('nomor_telepon')}
                        required
                    />
                </div>

                <Typography variant="h6" className="mb-4 mt-6">
                    Nilai
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="Nilai Bahasa Indonesia"
                        name="nilai_bhs_indonesia"
                        value={formData.nilai_bhs_indonesia}
                        onChange={handleChange('nilai_bhs_indonesia')}
                        type="text"
                    />
                    <InputField
                        label="Nilai Matematika"
                        name="nilai_matematika"
                        value={formData.nilai_matematika}
                        onChange={handleChange('nilai_matematika')}
                        type="text"
                    />
                    <InputField
                        label="Nilai IPA"
                        name="nilai_ipa"
                        value={formData.nilai_ipa}
                        onChange={handleChange('nilai_ipa')}
                        type="text"
                    />
                </div>
            </form>
        </FormDialog>
    );
};

AfirmasiForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    data: PropTypes.object,
    onSuccess: PropTypes.func
};

export default AfirmasiForm;