import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Typography, Button, Radio } from "@material-tailwind/react";
import AdminHeader from '../../components/common/admin/AdminHeader';
import AdminSidebar from '../../components/common/admin/AdminSidebar';
import AdminFooter from '../../components/common/admin/AdminFooter';
import { InputField, SelectField, TextAreaField  } from '../../components/forms/FormsVariant/Forms';
import { AdminGuard } from '../../utils/AuthGuard';

// Komponen formulir profil
const ProfileForm = React.memo(({ formData, handleChange, handleSubmit }) => {
  // Daftar sekolah
  const schools = useMemo(() => [
    { value: "UPT SD NEGERI BABADAN 01", label: "UPT SD NEGERI BABADAN 01" },
    { value: "UPT SD NEGERI BABADAN 02", label: "UPT SD NEGERI BABADAN 02" },
    { value: "UPT SD NEGERI BENDOGERIT 01", label: "UPT SD NEGERI BENDOGERIT 01" },
    { value: "UPT SD NEGERI BENDOGERIT 02", label: "UPT SD NEGERI BENDOGERIT 02" },
  ], []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="p-4">
        <Typography variant="h6" color="blue-gray" className="mb-4">
          Profil Admin Sekolah
        </Typography>

        <div className="space-y-4">
          <InputField
            type="text"
            label="Full Name"
            name="nama_lengkap"
            value={formData.nama_lengkap}
            onChange={handleChange}
            required
            placeholder="Kosongkan jika tidak ingin mengubah nama"
          />

          <InputField
            type="text"
            label="Username"
            name="nama_pengguna"
            value={formData.nama_pengguna}
            onChange={handleChange}
            placeholder="Kosongkan jika tidak ingin mengubah nama pengguna"
          />

          <InputField
            type="password"
            label="Password"
            name="kata_sandi"
            value={formData.kata_sandi}
            onChange={handleChange}
            placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
          />

          <InputField
            type="password"
            label="Konfirmasi Password"
            name="konfirmasi_kata_sandi"
            value={formData.konfirmasi_kata_sandi}
            onChange={handleChange}
            placeholder="Kosongkan jika tidak ingin mengubah konfirmasi kata sandi"
          />

          <InputField
            type="text"
            label="Sekolah"
            name="sekolah"
            value={formData.sekolah}
            disabled
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Kosongkan jika tidak ingin mengubah email"
            />

            <InputField
              type="tel"
              label="No. Telepon"
              name="telepon"
              value={formData.telepon}
              onChange={handleChange}
              required
              placeholder="Kosongkan jika tidak ingin mengubah no. telepon"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="h6" color="blue-gray" className="-mb-3">
              Jenis Kelamin
            </Typography>
            <div className="flex gap-10">
              <Radio
                name="jenis_kelamin"
                label="LAKI-LAKI"
                value="1"
                checked={formData.jenis_kelamin === '1'}
                onChange={handleChange}
              />
              <Radio
                name="jenis_kelamin"
                label="PEREMPUAN"
                value="2"
                checked={formData.jenis_kelamin === '2'}
                onChange={handleChange}
              />
              <Radio
                name="jenis_kelamin"
                label="Undefined"
                value="U"
                checked={formData.jenis_kelamin === 'U'}
                onChange={handleChange}
              />
            </div>
          </div>

          <TextAreaField
            label="Alamat"
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            required
            placeholder="Kosongkan jika tidak ingin mengubah alamat"
            rows={3}
          />

          <div className="flex justify-start">
            <Button type="submit" className="mt-6 bg-blue-500 hover:bg-blue-700">
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
});

// Komponen profil admin
const AdminProfile = () => {
  // State untuk mengatur tampilan sidebar
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
  // State untuk menyimpan data formulir
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nama_pengguna: '',
    kata_sandi: '',
    konfirmasi_kata_sandi: '',
    sekolah: '',
    email: '',
    telepon: '',
    jenis_kelamin: 'U',
    alamat: ''
  });

  // Mengambil data pengguna dari localStorage saat komponen dimuat
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setFormData({
        nama_lengkap: userData.fullname || '',
        nama_pengguna: userData.username || '',
        kata_sandi: '',
        konfirmasi_kata_sandi: '',
        sekolah: userData.sekolah?.nama || '',
        email: userData.email || '',
        telepon: userData.phone || '',
        jenis_kelamin: userData.id_jenis_kelamin?.toString() || 'U',
        alamat: userData.address || ''
      });
    }
  }, []);

  // Fungsi untuk menangani perubahan input
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Fungsi untuk menangani pengiriman formulir
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi kata sandi
    if (formData.kata_sandi !== formData.konfirmasi_kata_sandi) {
      alert('Kata sandi dan konfirmasi kata sandi tidak cocok!');
      return;
    }

    try {
      // Ambil data user dari localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      // Siapkan data yang akan diupdate
      const dataUpdate = {
        fullname: formData.nama_lengkap,
        username: formData.nama_pengguna,
        email: formData.email,
        phone: formData.telepon,
        address: formData.alamat,
        id_jenis_kelamin: parseInt(formData.jenis_kelamin)
      };

      // Tambahkan password jika diisi
      if (formData.kata_sandi) {
        dataUpdate.password = formData.kata_sandi;
      }

      // Kirim permintaan ke API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${userData.id_user}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify(dataUpdate)
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui profil');
      }

      const hasil = await response.json();
      
      // Perbarui data di localStorage
      const dataPenggunaBaru = {
        ...userData,
        fullname: formData.nama_lengkap,
        username: formData.nama_pengguna,
        email: formData.email,
        phone: formData.telepon,
        address: formData.alamat,
        id_jenis_kelamin: parseInt(formData.jenis_kelamin)
      };
      localStorage.setItem('userData', JSON.stringify(dataPenggunaBaru));

      alert('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal memperbarui profil: ' + error.message);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <AdminHeader isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <AdminSidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} isMobile={isMobile} userData={userData}/>
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-8">
              <ProfileForm 
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
              />
            </main>
            <AdminFooter />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminProfile;