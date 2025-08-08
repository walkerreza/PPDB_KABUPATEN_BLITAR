import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import Table from '../../components/table/TableVariant/Table';
import { EditButton, DeleteButton, AddButton } from '../../components/element/Button/variant';
import FormDialog from '../../components/dialog/FormDialog';
import DeleteDialog from '../../components/dialog/DeleteDialog';
import BannerForm from './Components/BannerForm';
import { SuperAdminGuard } from '../../utils/AuthGuard';
import toast from 'react-hot-toast';

const Banner = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    status: 1,
    gambar_banner: null
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [banners, setBanners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const columns = [
    { key: 'banner', label: 'Banner', 
      render: (value) => (
        <img 
          src={value} 
          alt="Banner" 
          className="w-32 h-20 object-cover rounded"
        />
      )
    },
    { key: 'nama_banner', label: 'Judul' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-sm ${
          value === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'aksi', 
      label: 'Aksi',
      render: (_, row) => (
        <div className="flex gap-2">
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleDelete(row)} />
        </div>
      )
    }
  ];

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = (includeContentType = true) => {
    try {
      // Ambil data user dari localStorage
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        throw new Error('Data user tidak ditemukan');
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      // Log untuk debugging
      console.log('User Data:', userData);
      console.log('Token:', token);

      const headers = new Headers();
      
      // Format token: Bearer <token>
      headers.append('Authorization', `Bearer ${token}`);
      
      if (includeContentType) {
        headers.append('Content-Type', 'application/json');
      }
      
      // Log headers untuk debugging
      console.log('Request headers:', Object.fromEntries(headers.entries()));
      
      return headers;
    } catch (error) {
      console.error('Error getting headers:', error);
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      // Redirect ke halaman login jika token tidak ada
      setTimeout(() => {
        localStorage.removeItem('userData'); // Hapus data user
        window.location.href = '/login';
      }, 2000);
      return new Headers();
    }
  };

  // Fungsi untuk handle unauthorized response
  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali');
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Fetch data banner
  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching banners...');
      const headers = getHeaders();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/banner`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      const transformedData = data.map(banner => ({
        id_banner: banner.id_banner,
        banner: `${import.meta.env.VITE_BASE_URL}${banner.gambar}`,
        nama_banner: banner.judul,
        status: banner.status === 1 ? 'Aktif' : 'Tidak Aktif',
        raw: banner
      }));
      
      console.log('All transformed data:', transformedData);
      setBanners(transformedData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error(error.message || 'Gagal mengambil data banner');
    } finally {
      setIsLoading(false);
    }
  };

  // Search banner
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/banner/search?search=${searchQuery}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const transformedData = data.map(banner => ({
        id_banner: banner.id_banner,
        banner: `${import.meta.env.VITE_BASE_URL}${banner.gambar}`,
        nama_banner: banner.judul,
        status: banner.status === 1 ? 'Aktif' : 'Tidak Aktif',
        raw: banner
      }));
      
      setBanners(transformedData);
    } catch (error) {
      console.error('Error searching banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data saat komponen mount
  useEffect(() => {
    fetchBanners();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const openAdd = () => {
    setIsEdit(false);
    setFormData({
      judul: '',
      status: 1,
      gambar_banner: null
    });
    setIsDialogOpen(true);
  };

  const openEdit = () => {
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const close = () => {
    setIsDialogOpen(false);
    setFormData({
      judul: '',
      status: 1,
      gambar_banner: null
    });
  };

  const handleFormChange = (newData) => {
    console.log('Form data changed:', newData);
    setFormData(newData);
  };

  const handleAdd = () => {
    console.log('Opening add dialog');
    openAdd();
  };

  const handleEdit = (row) => {
    setFormData({
      id: row.id_banner,
      judul: row.nama_banner,
      status: row.raw.status,
      gambar_banner: row.banner,
    });
    openEdit();
  };

  const handleSubmit = async (formData, isEdit) => {
    try {
      // Validasi form
      if (!formData.judul?.trim()) {
        toast.error('Judul banner harus diisi');
        return;
      }

      if (!isEdit && !formData.gambar_banner) {
        toast.error('Gambar banner harus diupload');
        return;
      }

      setLoading(true);
      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/banner/${formData.id}`
        : `${import.meta.env.VITE_API_URL}/banner`;

      const form = new FormData();
      form.append('judul', formData.judul);
      form.append('status', formData.status); // status sudah dalam bentuk 1 atau 0
      
      if (formData.gambar_banner instanceof File) {
        form.append('gambar', formData.gambar_banner); // Mengubah 'file' menjadi 'gambar'
      }

      const headers = getHeaders(false); // false karena kita menggunakan FormData

      console.log('Submitting form data:', {
        url,
        method: isEdit ? 'PUT' : 'POST',
        headers: Object.fromEntries(headers.entries()),
        formData: Object.fromEntries(form.entries())
      });

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: headers,
        credentials: 'include',
        body: form
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menyimpan banner');
      }

      const result = await response.json();
      console.log('Submit result:', result);

      toast.success(result.message || (isEdit ? 'Banner berhasil diupdate' : 'Banner berhasil ditambahkan'));

      await fetchBanners();
      close();
      
    } catch (error) {
      console.error('Error submitting banner:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    setSelectedBanner(row);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBanner) return;
    
    try {
      setLoading(true);
      const headers = getHeaders();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/banner/${selectedBanner.id_banner}`, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include'
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menghapus banner');
      }

      const result = await response.json();
      console.log('Delete result:', result);

      toast.success(result.message || 'Banner berhasil dihapus');

      await fetchBanners();
      
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menghapus banner');
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedBanner(null);
    }
  };

  return (
    <SuperAdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-2 sm:p-4">
              <Card className="h-full w-[calc(100vw-16px)] sm:w-full overflow-x-auto shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      Banner
                    </Typography>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <AddButton onClick={handleAdd}>
                        Tambah Banner
                      </AddButton>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Table 
                      columns={columns}
                      data={banners}
                      loading={isLoading}
                      />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Form Dialog */}
        <FormDialog
          open={isDialogOpen}
          onClose={close}
          title={isEdit ? "Edit Banner" : "Tambah Banner"}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(formData, isEdit);
          }}
          loading={loading}
          size="lg"
          submitLabel="Simpan"
          cancelLabel="Batal"
        >
          <BannerForm
            formData={formData}
            onChange={handleFormChange}
            loading={loading}
          />
        </FormDialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedBanner(null);
          }}
          onConfirm={confirmDelete}
          title="Hapus Banner"
          message="Apakah Anda yakin ingin menghapus banner ini?"
          itemName={selectedBanner?.nama_banner}
          loading={loading}
        />

        <div className="mt-auto">
          <SuperAdminFooter />
        </div>
      </div>
    </SuperAdminGuard>
  );
};

export default Banner;