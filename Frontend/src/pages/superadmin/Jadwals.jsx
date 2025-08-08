import React, { useState, useCallback, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import Table from '../../components/table/TableVariant/Table';
import { AddButton, DeleteButton, EditButton, SaveButton } from '../../components/element/Button/variant';
import FormDialog from '../../components/dialog/FormDialog';
import useFormDialog from '../../components/dialog/useFormDialog';
import DeleteDialog from '../../components/dialog/DeleteDialog';
import JadwalForm from './Components/JadwalForm';
import { SuperAdminGuard } from '../../utils/AuthGuard';
import toast from 'react-hot-toast';
import moment from 'moment/moment';
import 'moment/locale/id';

// Set locale ke Indonesia
moment.locale('id');

const Jadwals = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("frontend");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    event: '',
    status: 1,
    is_public: 0 // Tambah default is_public
  });
  const [formDialog, setFormDialog] = useState({
    open: false,
    isEdit: false
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, data: null });
  const [frontEndData, setFrontEndData] = useState([]); // Data untuk tab frontend
  const [systemData, setSystemData] = useState([]); // Data untuk tab sistem

  // Fungsi untuk format tanggal
  const formatDate = (date) => {
    if (!date) return '-';
    return moment(date).format('DD MMMM YYYY HH:mm');
  };

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = (includeContentType = true) => {
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
      
      if (includeContentType) {
        headers.append('Content-Type', 'application/json');
      }
      
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

  // Fungsi untuk handle unauthorized response
  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali');
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Fungsi untuk mengambil data jadwal
  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const timestamp = new Date().getTime(); // Tambah timestamp untuk prevent cache
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran?t=${timestamp}`, {
        headers: headers,
        credentials: 'include'
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Gagal mengambil data jadwal');
      }

      const result = await response.json();
      console.log('Raw data:', result.data); // Debug

      const jadwalData = result.data || [];

      // Transform data
      const transformedData = jadwalData.map(item => ({
        id: item.id_jadwal_pendaftaran,
        tanggal_mulai: item.tanggal_mulai,
        tanggal_selesai: item.tanggal_selesai,
        event: item.event,
        status: Number(item.status),
        is_public: Number(item.is_public || 0), // Default ke 0 jika tidak ada
        raw: item
      }));

      console.log('Transformed data:', transformedData); // Debug

      // Filter data berdasarkan tab aktif
      const frontEndData = transformedData.filter(item => item.is_public === 0);
      const systemData = transformedData.filter(item => item.is_public === 1);

      // Sort data
      setFrontEndData(frontEndData.sort((a, b) => new Date(b.tanggal_mulai) - new Date(a.tanggal_mulai)));
      setSystemData(systemData.sort((a, b) => a.id - b.id)); // Urutkan berdasarkan ID

    } catch (error) {
      console.error('Error fetching jadwal:', error);
      toast.error(error.message || 'Terjadi kesalahan saat mengambil data jadwal');
      setFrontEndData([]);
      setSystemData([]);
    } finally {
      setLoading(false);
    }
  };

  // Tambahkan useEffect untuk polling
  useEffect(() => {
    // Fetch pertama kali
    fetchJadwal();

    // Set interval untuk fetch setiap 5 detik
    const interval = setInterval(() => {
      fetchJadwal();
    }, 5000);

    // Cleanup interval saat component unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        setIsOpen(width >= 768);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
  }, []);

  const openAdd = () => {
    setFormDialog({
      open: true,
      isEdit: false
    });
    setFormData({
      tanggal_mulai: '',
      tanggal_selesai: '',
      event: '',
      status: 1,
      is_public: activeTab === 'frontend' ? 0 : 1 // Set is_public berdasarkan tab aktif
    });
  };

  const openEdit = () => {
    setFormDialog({
      open: true,
      isEdit: true
    });
  };

  const close = () => {
    setFormDialog({
      open: false,
      isEdit: false
    });
    setFormData({
      tanggal_mulai: '',
      tanggal_selesai: '',
      event: '',
      status: 1,
      is_public: 0
    });
  };

  const handleAdd = () => {
    console.log('Opening add dialog');
    openAdd();
  };

  const handleEdit = (row) => {
    console.log('Edit row:', row);
    const formatDate = (date) => {
      return moment(date).format('YYYY-MM-DDTHH:mm');
    };

    setFormData({
      id: row.id,
      tanggal_mulai: formatDate(row.tanggal_mulai),
      tanggal_selesai: formatDate(row.tanggal_selesai),
      event: row.event,
      status: row.raw.status,
      is_public: row.is_public
    });
    openEdit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validasi
      if (!formData.event?.trim()) {
        toast.error('Nama event harus diisi');
        return;
      }
      
      if (!formData.tanggal_mulai) {
        toast.error('Tanggal mulai harus diisi');
        return;
      }
      
      if (!formData.tanggal_selesai) {
        toast.error('Tanggal selesai harus diisi');
        return;
      }

      const headers = getHeaders();
      
      // Set is_public berdasarkan tab aktif
      const dataToSend = {
        ...formData,
        is_public: activeTab === 'frontend' ? 0 : 1,
        event: formData.event.trim()
      };

      console.log('Sending data:', dataToSend); // Debug

      const url = formDialog.isEdit 
        ? `${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/${formData.id}`
        : `${import.meta.env.VITE_API_URL}/jadwal-pendaftaran`;

      const response = await fetch(url, {
        method: formDialog.isEdit ? 'PUT' : 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan');
      }

      toast.success(result.message || 'Data berhasil disimpan');
      close();
      fetchJadwal(); // Refresh data
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    setDeleteDialog({
      open: true,
      data: row
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return;
    
    try {
      setLoading(true);
      const headers = getHeaders();
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/${deleteDialog.data.id}`,
        {
          method: 'DELETE',
          headers: headers,
          credentials: 'include'
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menghapus jadwal');
      }

      const result = await response.json();
      console.log('Delete result:', result);

      toast.success(result.message || 'Jadwal berhasil dihapus');
      await fetchJadwal();
      
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menghapus jadwal');
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, data: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, data: null });
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
  };

  // Kolom untuk tabel Frontend
  const frontEndColumns = [
    { 
      key: 'tanggal_mulai', 
      label: 'Tanggal Dimulai',
      className: 'bg-gray-900 text-white',
      render: (_, row) => formatDate(row.tanggal_mulai)
    },
    { 
      key: 'tanggal_selesai', 
      label: 'Tanggal Berakhir',
      className: 'bg-gray-900 text-white',
      render: (_, row) => formatDate(row.tanggal_selesai)
    },
    { 
      key: 'event', 
      label: 'Event',
      className: 'bg-gray-900 text-white',
      render: (_, row) => row.event || '-'
    },
    { 
      key: 'aksi', 
      label: 'Aksi',
      className: 'bg-gray-900 text-white',
      render: (_, row) => (
        <div className="flex gap-2">
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleDelete(row)} />
        </div>
      )
    }
  ];

  // Kolom untuk tabel Sistem
  const sistemColumns = [
    { 
      key: 'tanggal_mulai', 
      label: 'Tanggal Dimulai',
      className: 'bg-gray-900 text-white',
      render: (_, row) => formatDate(row.tanggal_mulai),
      sortable: false
    },
    { 
      key: 'tanggal_selesai', 
      label: 'Tanggal Berakhir',
      className: 'bg-gray-900 text-white',
      render: (_, row) => formatDate(row.tanggal_selesai),
      sortable: false
    },
    { 
      key: 'event', 
      label: 'Event',
      className: 'bg-gray-900 text-white',
      render: (_, row) => row.event || '-',
      sortable: false
    },
    { 
      key: 'aksi', 
      label: 'Aksi',
      className: 'bg-gray-900 text-white',
      render: (_, row) => (
        <div className="flex gap-2">
          <EditButton onClick={() => handleEdit(row)} />
        </div>
      ),
      sortable: false
    }
  ];

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
                  <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                    Jadwal PPDB
                  </Typography>
                  
                  <div className="mb-4">
                    <div className="flex border-b border-gray-200">
                      <button
                        className={`${
                          activeTab === 'frontend'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        } flex items-center px-4 py-2 text-sm font-medium`}
                        onClick={() => handleTabChange('frontend')}
                      >
                        <i className="fas fa-calendar mr-2"></i>
                        Penjadwalan PPDB Front End
                      </button>
                      <button
                        className={`${
                          activeTab === 'sistem'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        } flex items-center px-4 py-2 text-sm font-medium`}
                        onClick={() => handleTabChange('sistem')}
                      >
                        <i className="fas fa-cog mr-2"></i>
                        Penjadwalan Sistem
                      </button>
                    </div>
                  </div>

                  {activeTab === 'frontend' && (
                    <div className="mt-4">
                      <div className="mb-4 flex justify-end">
                        <AddButton onClick={openAdd}>Tambah Jadwal</AddButton>
                      </div>
                      <Table 
                        data={frontEndData}
                        columns={frontEndColumns}
                        loading={loading}
                        onRowClick={(row) => console.log('Row clicked:', row)}
                        searchable={true}
                        exportable={false}
                      />
                    </div>
                  )}

                  {activeTab === 'sistem' && (
                    <div className="mt-4">
                      <Table 
                        data={systemData}
                        columns={sistemColumns}
                        loading={loading}
                        onRowClick={(row) => console.log('Row clicked:', row)}
                        searchable={true}
                        exportable={false}
                        sortable={false}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>

        {/* Form Dialog */}
        <FormDialog
          open={formDialog.open}
          onClose={close}
          title={formDialog.isEdit ? "Edit Jadwal" : "Tambah Jadwal"}
          onSubmit={handleSubmit}
        >
          <JadwalForm 
            formData={formData}
            onChange={handleFormChange}
            loading={loading}
          />
        </FormDialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={deleteDialog.open}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Hapus Jadwal"
          message={`Apakah Anda yakin ingin menghapus jadwal "${deleteDialog.data?.event || ''}"?`}
          loading={loading}
        />
      </div>
    </SuperAdminGuard>
  );
};

export default Jadwals;
