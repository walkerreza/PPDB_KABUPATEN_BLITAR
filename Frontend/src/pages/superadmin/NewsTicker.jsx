import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import Table from '../../components/table/TableVariant/Table';
import { EditButton, DeleteButton, AddButton } from '../../components/element/Button/variant';
import FormDialog from '../../components/dialog/FormDialog';
import NewsTickerForm from './Components/NewsTickerForm';
import DeleteDialog from '../../components/dialog/DeleteDialog';
import { SuperAdminGuard } from '../../utils/AuthGuard';
import { toast } from 'react-toastify';

const NewsTicker = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    data: null
  });
  const [newsData, setNewsData] = useState([]);
  const [formDialog, setFormDialog] = useState({
    open: false,
    isEdit: false
  });
  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    status: false // Default status non-aktif (0)
  });

  const columns = [
    { key: 'judul', label: 'Judul' },
    { key: 'deskripsi', label: 'Text' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-sm ${
          Number(value) === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {Number(value) === 1 ? 'Aktif' : 'Tidak  Aktif'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_, row) => (
        <div className="flex gap-2">
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleDelete(row)} />
        </div>
      ),
    },
  ];

  const getHeaders = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.token) {
      return {
        'Authorization': `Bearer ${userData.token}`,
        'Content-Type': 'application/json'
      };
    }
    
    // Redirect ke halaman login jika token tidak ada
    setTimeout(() => {
      localStorage.removeItem('userData'); // Hapus data user
      window.location.href = '/login';
    }, 2000);
    return new Headers();
  };

  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali');
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/news-ticker`, {
        headers: getHeaders(),
        credentials: 'include'
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }

      const data = await response.json();
      
      // Transform data untuk tabel
      const transformedData = data.map(item => ({
        id_news_ticker: item.id_news_ticker,
        judul: item.judul,
        deskripsi: item.deskripsi,
        status: Number(item.status), // Pastikan status berupa number
        raw: item // Simpan data asli jika diperlukan
      }));

      console.log('Transformed Data:', transformedData); // Debug
      setNewsData(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleAdd = () => {
    setFormData({
      judul: '',
      deskripsi: '',
      status: false // Default status non-aktif (0)
    });
    setFormDialog({ open: true, isEdit: false });
  };

  const handleEdit = (data) => {
    setFormData({
      id_news_ticker: data.id_news_ticker,
      judul: data.judul,
      deskripsi: data.deskripsi,
      status: data.status === 1 // Convert 1/0 to boolean
    });
    setFormDialog({ open: true, isEdit: true });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, isEdit: false });
    setFormData({
      judul: '',
      deskripsi: '',
      status: false // Reset ke status non-aktif (0)
    });
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const isEdit = formDialog.isEdit;
      const url = `${import.meta.env.VITE_API_URL}/news-ticker${isEdit ? `/${formData.id_news_ticker}` : ''}`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          judul: formData.judul,
          deskripsi: formData.deskripsi,
          status: formData.status ? 1 : 0 // Convert boolean to 1/0
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat menyimpan data');
      }
      
      toast.success(isEdit ? 'News ticker berhasil diupdate' : 'News ticker berhasil ditambahkan');
      await fetchData();
      handleCloseForm();
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (data) => {
    setDeleteDialog({ open: true, data });
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/news-ticker/${deleteDialog.data.id_news_ticker}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus data');
      }

      toast.success('News ticker berhasil dihapus');
      await fetchData();
      setDeleteDialog({ open: false, data: null });
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
                      News Ticker
                    </Typography>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <AddButton onClick={handleAdd}>
                        Tambah News
                      </AddButton>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Table 
                      columns={columns}
                      data={newsData}
                      searchable={true}
                      exportable={true}
                      pagination={true}
                      perPage={10}
                      loading={loading}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Form Dialog */}
        <FormDialog
          open={formDialog.open}
          onClose={handleCloseForm}
          title={formDialog.isEdit ? "Edit News Ticker" : "Tambah News Ticker"}
          onSubmit={handleSubmit}
          loading={loading}
        >
          <NewsTickerForm 
            formData={formData}
            onChange={handleFormChange}
            loading={loading}
          />
        </FormDialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, data: null })}
          onConfirm={handleConfirmDelete}
          title="Hapus News Ticker"
          message={`Apakah Anda yakin ingin menghapus news ticker: "${deleteDialog.data?.deskripsi || ''}"?`}
          itemName={deleteDialog.data?.deskripsi}
          loading={loading}
        />
      </div>
    </SuperAdminGuard>
  );
};

export default NewsTicker;