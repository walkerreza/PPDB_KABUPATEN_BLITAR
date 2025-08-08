import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Typography,
  Radio,
  Checkbox,
  Button
} from "@material-tailwind/react";
import { InputField } from '../../../components/forms/FormsVariant/Forms';
import Maps from '../../../components/element/Card/Maps';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix untuk icon marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapEvents = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      onClick(e);
    },
  });
  return null;
};

const DataPendaftaranForm = ({ data = {}, onSubmit, mode = 'add', onClose }) => {
  const [formValues, setFormValues] = useState(data);
  const [coordinates, setCoordinates] = useState({
    lat: data.latitude ? parseFloat(data.latitude) : -8.095555,
    lng: data.longitude ? parseFloat(data.longitude) : 112.165861
  });
  const [address, setAddress] = useState(data?.alamat_jalan || '');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data && !formValues) {  // Hanya jalankan jika formValues belum diset
      // Format tanggal dari ISO ke format yang sesuai untuk input type="date"
      let formattedDate = '';
      if (data.tanggal_lahir) {
        try {
          // Handle berbagai format tanggal yang mungkin
          let dateStr = data.tanggal_lahir;

          // Jika ada timezone offset, hilangkan
          if (dateStr.includes('+')) {
            dateStr = dateStr.split('+')[0];
          }

          // Hilangkan time component jika ada
          if (dateStr.includes(' ')) {
            dateStr = dateStr.split(' ')[0];
          } else if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          }

          // Pastikan format YYYY-MM-DD
          const dateParts = dateStr.split('-');
          if (dateParts.length === 3) {
            formattedDate = dateParts.join('-');
            console.log('Tanggal berhasil diformat:', formattedDate);
          }
        } catch (error) {
          console.error('Error memformat tanggal:', error);
        }
      }

      // Update formValues dengan semua data
      const newFormValues = {
        ...data,
        tanggal_lahir: formattedDate || '',
        jenis_kelamin: data.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN',
        penerima_kps: data.penerima_kps === 1 || data.penerima_kps === '1' ? 'Ya' : 'Tidak',
        penerima_kip: data.penerima_kip === 1 || data.penerima_kip === '1' ? 'Ya' : 'Tidak',
        layak_pip: data.layak_pip === 1 || data.layak_pip === '1' ? 'Ya' : 'Tidak',
        // Pastikan koordinat tersimpan dengan format yang benar
        latitude: data.latitude || '',
        longitude: data.longitude || ''
      };

      console.log('Setting initial form values:', newFormValues);
      setFormValues(newFormValues);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('handleChange called with:', { name, value });

    // Update local state
    const updatedValues = {
      ...formValues,
      [name]: value
    };

    // Khusus untuk tanggal_lahir, pastikan formatnya benar
    if (name === 'tanggal_lahir') {
      if (!value) {
        updatedValues.tanggal_lahir = '';
      } else {
        // Format sudah benar karena input type="date" mengembalikan YYYY-MM-DD
        updatedValues.tanggal_lahir = value;
      }
    }

    console.log('Updated form values:', updatedValues);
    setFormValues(updatedValues);
    onSubmit(updatedValues);
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    const boolValue = value === "Ya" ? 1 : 0;

    // Update state lokal
    const updatedValues = {
      ...formValues,
      [name]: boolValue
    };

    // Log untuk debugging
    console.log('Radio Change:', { name, value, boolValue });
    console.log('Updated Values:', updatedValues);

    // Set state dan kirim ke parent
    setFormValues(updatedValues);
    onSubmit(updatedValues);
  };

  const handleMapClick = (e) => {
    if (!e || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    console.log('Koordinat yang dipilih:', { lat, lng });

    // Update state coordinates
    const newCoords = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    setCoordinates(newCoords);

    // Update formValues dengan koordinat baru
    const updatedValues = {
      ...formValues,
      latitude: lat.toString(),
      longitude: lng.toString()
    };

    setFormValues(updatedValues);
    onSubmit(updatedValues);
  };

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Pastikan semua field required terisi
    if (!formValues.nama_siswa || !formValues.jenis_kelamin || !formValues.tempat_lahir || !formValues.tanggal_lahir) {
      toast.error('Harap lengkapi semua field yang wajib diisi!');
      return;
    }

    // Pastikan alamat dan koordinat terisi
    if (!formValues.alamat_jalan || !formValues.latitude || !formValues.longitude) {
      toast.error('Harap pilih lokasi pada peta!');
      return;
    }

    onSubmit(formValues);
  };

  const handleFormSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    try {
      setLoading(true);

      // Validasi data sebelum submit
      if (!formValues.nik || !formValues.nama_siswa) {
        toast.error('NIK dan Nama Siswa harus diisi');
        setLoading(false);
        return;
      }

      // Validasi koordinat
      if (!coordinates.lat || !coordinates.lng) {
        toast.error('Silakan pilih lokasi pada peta');
        setLoading(false);
        return;
      }

      // Konversi nilai form sebelum dikirim ke server
      const dataToSubmit = {
        ...formValues,
        // Konversi nilai radio button ke integer
        penerima_kps: formValues.penerima_kps === 'Ya' ? 1 : 0,
        penerima_kip: formValues.penerima_kip === 'Ya' ? 1 : 0,
        layak_pip: formValues.layak_pip === 'Ya' ? 1 : 0,
        // Pastikan koordinat tersimpan dengan format yang benar
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString()
      };

      console.log('Data yang akan dikirim:', dataToSubmit);
      onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    handleFormSubmit();
  };


  const formData = {
    nik: formValues?.nik || '',
    nisn: formValues?.nisn || '',
    nama_siswa: formValues?.nama_siswa || '',
    jenis_kelamin: formValues?.jenis_kelamin || '',
    tempat_lahir: formValues?.tempat_lahir || '',
    tanggal_lahir: formValues?.tanggal_lahir ? formValues.tanggal_lahir.split('T')[0] : '',
    no_kk: formValues?.no_kk || '',
    agama: formValues?.agama || '',
    kebutuhan_khusus: formValues?.kebutuhan_khusus || '',
    no_akta_lahir: formValues?.no_akta_lahir || '',
    nomor_telepon: formValues?.nomor_telepon || '',
    alamat_jalan: formValues?.alamat_jalan || '',
    provinsi: formValues?.provinsi || '',
    kabupaten_kota: formValues?.kabupaten_kota || '',
    Kecamatan: formValues?.Kecamatan || '',
    Kelurahan: formValues?.Kelurahan || '',
    dusun: formValues?.dusun || '',
    rt: formValues?.rt || '',
    rw: formValues?.rw || '',
    kode_pos: formValues?.kode_pos || '',
    latitude: formValues?.latitude || '',
    longitude: formValues?.longitude || '',
    jenis_domisili: formValues?.jenis_domisili || '',
    alat_transportasi: formValues?.alat_transportasi || '',
    anak_ke: formValues?.anak_ke || '',
    jumlah_saudara_kandung: formValues?.jumlah_saudara_kandung || '',
    sekolah_asal: formValues?.sekolah_asal || '',
    jarak_rumah_ke_sekolah: formValues?.jarak_rumah_ke_sekolah || '',
    nama_rombel: formValues?.nama_rombel || '',
    nipd: formValues?.nipd || '',
    tinggi_badan: formValues?.tinggi_badan || '',
    berat_badan: formValues?.berat_badan || '',
    lingkar_kepala: formValues?.lingkar_kepala || '',
    nik_ayah: formValues?.nik_ayah || '',
    nama_ayah: formValues?.nama_ayah || '',
    tahun_lahir_ayah: formValues?.tahun_lahir_ayah || '',
    pendidikan_terakhir_ayah: formValues?.pendidikan_terakhir_ayah || '',
    pekerjaan_ayah: formValues?.pekerjaan_ayah || '',
    penghasilan_ayah: formValues?.penghasilan_ayah || '',
    nik_ibu: formValues?.nik_ibu || '',
    nama_ibu: formValues?.nama_ibu || '',
    tahun_lahir_ibu: formValues?.tahun_lahir_ibu || '',
    pendidikan_terakhir_ibu: formValues?.pendidikan_terakhir_ibu || '',
    pekerjaan_ibu: formValues?.pekerjaan_ibu || '',
    penghasilan_ibu: formValues?.penghasilan_ibu || '',
    nik_wali: formValues?.nik_wali || '',
    nama_wali: formValues?.nama_wali || '',
    tahun_lahir_wali: formValues?.tahun_lahir_wali || '',
    pendidikan_terakhir_wali: formValues?.pendidikan_terakhir_wali || '',
    pekerjaan_wali: formValues?.pekerjaan_wali || '',
    penghasilan_wali: formValues?.penghasilan_wali || '',
    penerima_kps: formValues?.penerima_kps || false,
    no_kps: formValues?.no_kps || '',
    layak_pip: formValues?.layak_pip || false,
    penerima_kip: formValues?.penerima_kip || false,
    alasan_layak_pip: formValues?.alasan_layak_pip || '',
  };

  const inputProps = {
    className: "w-full !h-9 !text-black",
    containerProps: { className: 'mb-0 min-w-[50px]' },
    labelProps: { className: 'text-sm' }
  };

  const radioProps = {
    className: "w-4 h-4 !text-black",
    labelProps: { className: 'text-sm font-normal text-black' },
    color: "blue"
  };

  console.log('Current form values:', formValues);
  console.log('Current jenis_kelamin:', formValues?.jenis_kelamin);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="flex flex-col gap-2">
        {/* Data Pribadi */}
        <InputField
          required
          name="nik"
          label="NIK"
          value={formValues.nik || ''}
          onChange={handleChange}
          readOnly={mode === 'edit'}
          style={{
            backgroundColor: mode === 'edit' ? '#f3f4f6' : 'white',
            cursor: mode === 'edit' ? 'not-allowed' : 'text'
          }}
          {...inputProps}
        />

        <InputField
          type="text"
          name="nisn"
          label="NISN"
          value={formValues.nisn || ''}
          onChange={handleChange}
          required
          {...inputProps}
        />

        <InputField
          type="text"
          name="nama_siswa"
          label="Nama Siswa"
          value={formValues.nama_siswa || ''}
          onChange={handleChange}
          required
          {...inputProps}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Kelamin *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="jenis_kelamin"
                  value="LAKI-LAKI"
                  checked={formValues?.jenis_kelamin === 'LAKI-LAKI'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">LAKI-LAKI</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="jenis_kelamin"
                  value="PEREMPUAN"
                  checked={formValues?.jenis_kelamin === 'PEREMPUAN'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">PEREMPUAN</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="tempat_lahir"
            label="Tempat Lahir"
            value={formValues?.tempat_lahir || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Lahir *
            </label>
            <input
              type="date"
              name="tanggal_lahir"
              value={formValues?.tanggal_lahir ? formValues.tanggal_lahir.split('T')[0] : ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black h-[38px]"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <InputField
          type="text"
          name="no_kk"
          label="No KK"
          value={formValues.no_kk || ''}
          onChange={handleChange}
          required
          {...inputProps}
        />

        <InputField
          type="text"
          name="agama"
          label="Agama"
          value={formValues.agama || ''}
          onChange={handleChange}
          required
          {...inputProps}
        />

        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Kebutuhan Khusus</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <Radio
                name="kebutuhan_khusus"
                value="Ada"
                onChange={handleRadioChange}
                checked={formValues.kebutuhan_khusus === 'Ada'}
                color="blue"
                className="!border-blue-500 checked:!bg-blue-500"
                ripple={false}
              />
              <span className="text-gray-900">Ada</span>
            </label>
            <label className="flex items-center gap-2">
              <Radio
                name="kebutuhan_khusus"
                value="Tidak Ada"
                onChange={handleRadioChange}
                checked={formValues.kebutuhan_khusus === 'Tidak Ada'}
                color="blue"
                className="!border-blue-500 checked:!bg-blue-500"
                ripple={false}
              />
              <span className="text-gray-900">Tidak Ada</span>
            </label>
          </div>
        </div>

        <InputField
          type="text"
          name="no_akta_lahir"
          label="Nomor Akta Lahir"
          value={formValues.no_akta_lahir || ''}
          onChange={handleChange}
          required
          {...inputProps}
        />

        <InputField
          type="text"
          name="nomor_telepon"
          label="Nomor Telepon"
          value={formValues.nomor_telepon || ''}
          onChange={handleChange}
          required
          {...inputProps}
        />

        {/* Data Alamat */}
        <Typography variant="h6" color="blue-gray" className="mb-2">
          Data Alamat
        </Typography>
        <InputField
          type="textarea"
          name="alamat_jalan"
          label="Alamat Jalan"
          value={formValues?.alamat_jalan || ''}
          onChange={handleChange}
          required
          className="w-full !h-[100px]"
          containerProps={{ className: 'mb-0' }}
          labelProps={{ className: 'text-sm' }}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="rt"
            label="RT"
            value={formValues?.rt || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <InputField
            type="text"
            name="rw"
            label="RW"
            value={formValues?.rw || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="Kelurahan"
            label="Desa/Kelurahan"
            value={formValues?.Kelurahan || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <InputField
            type="text"
            name="Kecamatan"
            label="Kecamatan"
            value={formValues?.Kecamatan || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="kabupaten_kota"
            label="Kabupaten/Kota"
            value={formValues?.kabupaten_kota || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <InputField
            type="text"
            name="provinsi"
            label="Provinsi"
            value={formValues?.provinsi || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="kode_pos"
            label="Kode Pos"
            value={formValues?.kode_pos || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
        </div>

        {/* Lokasi Maps */}
        <div className="mb-4">
          <Maps
            center={coordinates}
            coordinates={coordinates}
            mapType="roadmap"
            handleMapClick={handleMapClick}
            onMapLoad={handleMapLoad}
            isMapLoaded={isMapLoaded}
            containerStyle={{
              width: '100%',
              height: '400px',
              borderRadius: '0.5rem'
            }}
          />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <InputField
              type="text"
              name="latitude"
              label="Latitude"
              value={formValues?.latitude || coordinates.lat.toString()}
              onChange={handleChange}
              required
              readOnly
              {...inputProps}
            />
            <InputField
              type="text"
              name="longitude"
              label="Longitude"
              value={formValues?.longitude || coordinates.lng.toString()}
              onChange={handleChange}
              required
              readOnly
              {...inputProps}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="jenis_domisili"
            label="Jenis Domisili"
            value={formValues?.jenis_domisili || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <InputField
            type="text"
            name="alat_transportasi"
            label="Alat Transportasi"
            value={formValues?.alat_transportasi || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InputField
            type="number"
            name="jarak_rumah_ke_sekolah"
            label="Jarak ke Sekolah (Km)"
            value={formValues.jarak_rumah_ke_sekolah || ''}
            onChange={handleChange}
            step="0.01"
            required
            {...inputProps}
          />
          <InputField
            type="number"
            name="jumlah_saudara_kandung"
            label="Jumlah Saudara Kandung"
            value={formValues.jumlah_saudara_kandung || ''}
            onChange={handleChange}
            min="0"
            {...inputProps}
          />
          <InputField
            type="number"
            name="anak_ke"
            label="Anak Keberapa"
            value={formValues.anak_ke || ''}
            onChange={handleChange}
            min="1"
            {...inputProps}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InputField
            type="number"
            name="tinggi_badan"
            label="Tinggi Badan (cm)"
            value={formValues.tinggi_badan || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <InputField
            type="number"
            name="berat_badan"
            label="Berat Badan (kg)"
            value={formValues.berat_badan || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
          <InputField
            type="number"
            name="lingkar_kepala"
            label="Lingkar Kepala (cm)"
            value={formValues.lingkar_kepala || ''}
            onChange={handleChange}
            required
            {...inputProps}
          />
        </div>

        {/* Data Sekolah */}
        <Typography variant="h6" color="blue-gray" className="mb-2 mt-4">
          Data Sekolah
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="text"
            name="sekolah_asal"
            label="Sekolah Asal"
            value={formValues.sekolah_asal || ''}
            onChange={handleChange}
            {...inputProps}
          />
          <InputField
            type="text"
            name="nama_rombel"
            label="Nama Rombel"
            value={formValues.nama_rombel || ''}
            onChange={handleChange}
            {...inputProps}
          />
          <InputField
            type="text"
            name="nipd"
            label="NIPD"
            value={formValues.nipd || ''}
            onChange={handleChange}
            {...inputProps}
          />
        </div>

        {/* Data Ayah */}
        <Typography variant="h6" color="blue-gray" className="mb-2">
          Data Ayah
        </Typography>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="nik_ayah"
              label="NIK Ayah"
              value={formValues.nik_ayah || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="nama_ayah"
              label="Nama Ayah"
              value={formValues.nama_ayah || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="number"
              name="tahun_lahir_ayah"
              label="Tahun Lahir Ayah"
              value={formValues.tahun_lahir_ayah || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="kebutuhan_khusus_ayah"
              label="Kebutuhan Khusus Ayah"
              value={formValues.kebutuhan_khusus_ayah || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="pendidikan_terakhir_ayah"
              label="Pendidikan Ayah"
              value={formValues.pendidikan_terakhir_ayah || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="pekerjaan_ayah"
              label="Pekerjaan Ayah"
              value={formValues.pekerjaan_ayah || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <InputField
            type="text"
            name="penghasilan_ayah"
            label="Penghasilan Ayah"
            value={formValues.penghasilan_ayah || ''}
            onChange={handleChange}
            {...inputProps}
          />
        </div>

        {/* Data Ibu */}
        <Typography variant="h6" color="blue-gray" className="mb-2">
          Data Ibu
        </Typography>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="nik_ibu"
              label="NIK Ibu"
              value={formValues.nik_ibu || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="nama_ibu"
              label="Nama Ibu"
              value={formValues.nama_ibu || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="number"
              name="tahun_lahir_ibu"
              label="Tahun Lahir Ibu"
              value={formValues.tahun_lahir_ibu || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="kebutuhan_khusus_ibu"
              label="Kebutuhan Khusus Ibu"
              value={formValues.kebutuhan_khusus_ibu || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="pendidikan_terakhir_ibu"
              label="Pendidikan Ibu"
              value={formValues.pendidikan_terakhir_ibu || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="pekerjaan_ibu"
              label="Pekerjaan Ibu"
              value={formValues.pekerjaan_ibu || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <InputField
            type="text"
            name="penghasilan_ibu"
            label="Penghasilan Ibu"
            value={formValues.penghasilan_ibu || ''}
            onChange={handleChange}
            {...inputProps}
          />
        </div>

        {/* Data Wali */}
        <Typography variant="h6" color="blue-gray" className="mb-2">
          Data Wali
        </Typography>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="nik_wali"
              label="NIK Wali"
              value={formValues.nik_wali || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="nama_wali"
              label="Nama Wali"
              value={formValues.nama_wali || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              type="text"
              name="pendidikan_terakhir_wali"
              label="Pendidikan Terakhir"
              value={formValues.pendidikan_terakhir_wali || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="pekerjaan_wali"
              label="Pekerjaan"
              value={formValues.pekerjaan_wali || ''}
              onChange={handleChange}
              {...inputProps}
            />
            <InputField
              type="text"
              name="penghasilan_wali"
              label="Penghasilan"
              value={formValues.penghasilan_wali || ''}
              onChange={handleChange}
              {...inputProps}
            />
          </div>
        </div>

        {/* Program Bantuan */}
        <Typography variant="h6" color="blue-gray" className="mb-2 mt-4">
          Program Bantuan
        </Typography>
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Typography variant="small" color="blue-gray" className="font-normal w-32">
                Penerima KPS
              </Typography>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Radio
                    name="penerima_kps"
                    value="Ya"
                    onChange={handleRadioChange}
                    checked={formValues?.penerima_kps === 1}
                    color="blue"
                    className="!border-blue-500 checked:!bg-blue-500"
                    ripple={false}
                    {...radioProps}
                  />
                  <span className="text-gray-900">Ya</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Radio
                    name="penerima_kps"
                    value="Tidak"
                    onChange={handleRadioChange}
                    checked={formValues?.penerima_kps === 0}
                    color="blue"
                    className="!border-blue-500 checked:!bg-blue-500"
                    ripple={false}
                    {...radioProps}
                  />
                  <span className="text-gray-900">Tidak</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <Typography variant='small' color="blue-gray" className="font-normal w-32">
                Layak PIP
              </Typography>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Radio
                    name="layak_pip"
                    value="Ya"
                    onChange={handleRadioChange}
                    checked={formValues?.layak_pip === 1}
                    color="blue"
                    className="!border-blue-500 checked:!bg-blue-500"
                    ripple={false}
                    {...radioProps}
                  />
                  <span className="text-gray-900">Ya</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Radio
                    name="layak_pip"
                    value="Tidak"
                    onChange={handleRadioChange}
                    checked={formValues?.layak_pip === 0}
                    color="blue"
                    className="!border-blue-500 checked:!bg-blue-500"
                    ripple={false}
                    {...radioProps}
                  />
                  <span className="text-gray-900">Tidak</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
              <Typography variant='small' color="blue-gray" className="font-normal w-32">
                No KPS
              </Typography>
              <InputField
                type="text"
                name="no_kps"
                label=""
                value={formValues?.no_kps || ''}
                onChange={handleChange}
                disabled={formValues?.penerima_kps === 0}
                {...inputProps}
              />
            </div>

            <div className="flex items-center gap-4">
              <Typography variant='small' color="blue-gray" className="font-normal w-32">
                Penerima KIP
              </Typography>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Radio
                    name="penerima_kip"
                    value="Ya"
                    onChange={handleRadioChange}
                    checked={formValues?.penerima_kip === 1}
                    color="blue"
                    className="!border-blue-500 checked:!bg-blue-500"
                    ripple={false}
                    {...radioProps}
                  />
                  <span className="text-gray-900">Ya</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Radio
                    name="penerima_kip"
                    value="Tidak"
                    onChange={handleRadioChange}
                    checked={formValues?.penerima_kip === 0}
                    color="blue"
                    className="!border-blue-500 checked:!bg-blue-500"
                    ripple={false}
                    {...radioProps}
                  />
                  <span className="text-gray-900">Tidak</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <Typography variant="small" color="blue-gray" className="mb-2 font-normal">
            Alasan Layak PIP
          </Typography>
          <textarea
            name="alasan_layak_pip"
            value={formValues?.alasan_layak_pip || ''}
            onChange={handleChange}
            disabled={formValues?.layak_pip === 0}
            className="w-full min-h-[100px] p-2 border rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Masukkan alasan kelayakan PIP..."
          />
        </div>
      </div>
    </form>
  );
};

DataPendaftaranForm.propTypes = {
  data: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['add', 'edit'])
};

DataPendaftaranForm.defaultProps = {
  data: {},
  mode: 'add'
};

export default DataPendaftaranForm;