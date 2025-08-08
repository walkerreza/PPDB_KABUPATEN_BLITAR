import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import Table from '../../components/table/TableVariant/Table';
import { EditButton, DeleteButton, UploadButton, DownloadButton } from '../../components/element/Button/variant';
import FormDialog from '../../components/dialog/FormDialog';
import useFormDialog from '../../components/dialog/useFormDialog';
import ImportExcelForm from './Components/ImportExcelForm';
import DeleteDialog from '../../components/dialog/DeleteDialog';
import { SuperAdminGuard } from '../../utils/AuthGuard';
import DataPendaftaranForm from './Components/DataPendaftaranForm';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DataPendaftaran = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const importDialog = useFormDialog();
  const [formDialog, setFormDialog] = useState({
    isOpen: false,
    mode: 'add',
    data: null,
    currentId: null,
    loading: false
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, data: null });
  const [dialogContent, setDialogContent] = useState(null);

  const getHeaders = (isMultipart = false) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData && userData.token) {
      const headers = {
        'Authorization': `Bearer ${userData.token}`
      };
      
      if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
      }
      
      return headers;
    }
    
    setTimeout(() => {
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }, 2000);
    return new Headers();
  };

  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  const columns = [
    { key: 'nik', label: 'NIK' },
    { key: 'nama', label: 'Nama' },
    { key: 'tempatTanggalLahir', label: 'Tempat, Tanggal Lahir' },
    { key: 'sekolahAsal', label: 'Sekolah Asal' },
    { 
      key: 'aksi', 
      label: 'Aksi',
      render: (_, item) => (
        <div className="flex gap-2">
          <EditButton onClick={() => handleEdit(item)} />
          <DeleteButton onClick={() => handleDelete(item)} />
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data from:', `${import.meta.env.VITE_API_URL}/dapodik`);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/dapodik`,
        { 
          headers: getHeaders(),
          params: {
            _t: new Date().getTime()
          }
        }
      );
      
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      console.log('Response data:', response.data);

      const formattedData = response.data.data.map(item => {
        return {
          id_dapodik: item.id_dapodik,
          nik: item.nik,
          nama_siswa: item.nama_siswa,
          tempat_lahir: item.tempat_lahir,
          tanggal_lahir: item.tanggal_lahir,
          jenis_kelamin: item.jenis_kelamin,
          sekolah_asal: item.sekolah_asal,
          ...item, // Sisanya tetap ada
          // Format tampilan untuk tabel
          nama: item.nama_siswa || '-',
          tempatTanggalLahir: `${item.tempat_lahir || '-'}, ${item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '-'}`,
          sekolahAsal: item.sekolah_asal || '-'
        };
      });
      
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mengambil data pendaftaran', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleCloseDialog = () => {
    setFormDialog({
      isOpen: false,
      mode: 'add',
      data: null,
      currentId: null,
      loading: false
    });
  };

  const handleEdit = (item) => {
    console.log('Data yang akan diedit:', item);
    // Konversi jenis kelamin dari database (L/P) ke format form (LAKI-LAKI/PEREMPUAN)
    const formattedJenisKelamin = item.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN';
    console.log('Formatted jenis kelamin:', formattedJenisKelamin);
    
    const dataToEdit = {
      ...item,
      jenis_kelamin: formattedJenisKelamin,
      penerima_kps: item.penerima_kps || 0,
      penerima_kip: item.penerima_kip || 0,
      layak_pip: item.layak_pip || 0
    };
    
    setFormDialog({
      isOpen: true,
      mode: 'edit',
      data: dataToEdit,
      currentId: item.id_dapodik,
      loading: false
    });
  };

  const handleSubmit = async (formData) => {
    try {
      setFormDialog(prev => ({ ...prev, loading: true }));
      const headers = getHeaders();
  
      if (!headers || Object.keys(headers).length === 0) {
        toast.error("Terjadi kesalahan saat mengambil header autentikasi!");
        return;
      }
  
      if (!formData.nama_siswa || !formData.jenis_kelamin) {
        toast.error("Harap lengkapi semua data!");
        return;
      }
  
      // Konversi jenis kelamin hanya saat akan dikirim ke API
      const dataToSend = {
        ...formData,
        jenis_kelamin: formData.jenis_kelamin === 'LAKI-LAKI' ? 'L' : 'P',
        // Program bantuan sudah dalam bentuk numerik (1 atau 0)
        penerima_kps: formData.penerima_kps,
        penerima_kip: formData.penerima_kip,
        layak_pip: formData.layak_pip,
        // Pastikan koordinat dalam format yang benar
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };
  
      console.log('Data yang akan dikirim ke API:', dataToSend);
  
      if (formDialog.mode === 'edit' && formDialog.currentId) {
        const updateUrl = `${import.meta.env.VITE_API_URL}/dapodik/${formDialog.currentId}`;
        dataToSend.id_dapodik = formDialog.currentId;
  
        console.log('Data yang akan diupdate:', dataToSend);
        
        const response = await axios.put(updateUrl, dataToSend, { headers });
  
        if (response.data) {
          toast.success('Data berhasil diupdate!');
          setFormDialog(prev => ({ ...prev, isOpen: false }));
          fetchData();
        }
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/dapodik`, dataToSend, { headers });
        if (response.data) {
          toast.success('Data berhasil ditambahkan!');
          setFormDialog(prev => ({ ...prev, isOpen: false }));
          fetchData();
        }
      }
    } catch (error) {
      console.error('Error saat menyimpan data:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data!');
    } finally {
      setFormDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateFormData = (newData) => {
    console.log('handleUpdateFormData called with:', newData);
    
    // Pastikan kita tidak mengubah format jenis kelamin yang sudah benar
    setFormDialog(prev => {
      // Jika data sebelumnya sama dengan data baru, jangan update
      if (JSON.stringify(prev.data) === JSON.stringify(newData)) {
        return prev;
      }
      
      return {
        ...prev,
        data: newData
      };
    });
  };

  const handleDelete = (item) => {
    setDeleteDialog({ open: true, data: item });
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/dapodik/${deleteDialog.data.id_dapodik}`,
        { headers: getHeaders() }
      );
      
      toast.success('Data berhasil dihapus');
      setDeleteDialog({ open: false, data: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const handleImportExcel = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/dapodik/import`,
        formData,
        { 
          headers: getHeaders(true)
        }
      );

      toast.success('Data berhasil diimpor');
      importDialog.close();
      fetchData();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error(error.response?.data?.message || 'Gagal mengimpor data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/dapodik/download/template`,
        { 
          headers: getHeaders(),
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template Dapodik.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Data berhasil diunduh');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Gagal mengunduh data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcelDialog = () => {
    importDialog.openAdd();
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
                      Data Pendaftaran
                    </Typography>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <DownloadButton onClick={handleDownloadTemplate}>
                        Download Template
                      </DownloadButton>
                      <UploadButton onClick={handleImportExcelDialog}>
                        Import Excel
                      </UploadButton>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Table 
                      data={data}
                      columns={columns}
                      searchable={true}
                      exportable={true}
                      pagination={true}
                      perPage={10}
                      loading={loading}
                      className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                    />
                  </div>
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>

        {/* Import Excel Dialog */}
        <ImportExcelForm
          open={importDialog.isOpen}
          onClose={importDialog.close}
          onSuccess={() => {
            importDialog.close();
            fetchData();
          }}
        />

        {/* Form Dialog */}
        <FormDialog
          open={formDialog.isOpen}
          onClose={handleCloseDialog}
          title={formDialog.mode === 'add' ? 'Tambah Data Pendaftaran' : 'Edit Data Pendaftaran'}
          loading={formDialog.loading}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(formDialog.data);
          }}
        >
          <DataPendaftaranForm
            data={formDialog.data}
            mode={formDialog.mode}
            onSubmit={handleUpdateFormData}
            onClose={handleCloseDialog}
          />
        </FormDialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, data: null })}
          onConfirm={handleConfirmDelete}
          loading={loading}
          title="Hapus Data Pendaftaran"
          message="Apakah Anda yakin ingin menghapus data pendaftaran ini?"
        />
      </div>
    </SuperAdminGuard>
  );
};

export default DataPendaftaran;