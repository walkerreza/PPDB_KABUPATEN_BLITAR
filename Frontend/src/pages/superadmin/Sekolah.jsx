import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import Table from '../../components/table/TableVariant/Table';
import { AddButton, EditButton, DeleteButton } from '../../components/element/Button/variant';
import FormDialog from '../../components/dialog/FormDialog';
import DeleteDialog from '../../components/dialog/DeleteDialog';
import useFormDialog from '../../components/dialog/useFormDialog';
import SekolahForm from './Components/SekolahForm';
import { SuperAdminGuard } from '../../utils/AuthGuard';
import { toast } from 'react-toastify';

const Sekolah = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // State untuk form dan dialog
  const formDialog = useFormDialog();
  const [deleteDialog, setDeleteDialog] = useState({ 
    open: false, 
    data: null,
    errorMessage: '',
    showError: false 
  });
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [pageTitle, setPageTitle] = useState('Data Sekolah');

  // Dapatkan role user
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = userData.id_grup_user;

  // Set judul halaman berdasarkan role
  useEffect(() => {
    if (userRole === 4) {
      setPageTitle('Data Sekolah PAUD/TK');
    } else if (userRole === 5) {
      setPageTitle('Data Sekolah SD');
    } else if (userRole === 6) {
      setPageTitle('Data Sekolah SMP');
    } else if (userRole === 7) {
      setPageTitle('Data Sekolah KEMENAG');
    } else {
      setPageTitle('Data Sekolah');
    }
  }, [userRole]);

  const toggleSidebar = () => setIsOpen(!isOpen);

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

  // Fungsi untuk mengambil data sekolah
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah`, {
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
      
      const result = await response.json();
      console.log('Response from API:', result);
      
      // Ambil data dari result.data
      const schoolData = result.data || [];
      console.log('School data:', schoolData);

      // Dapatkan role user
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userRole = userData.id_grup_user;

      // Filter data sekolah berdasarkan role
      let filteredSchoolData = schoolData;
      
      if (userRole === 4) { // PAUD/TK
        filteredSchoolData = schoolData.filter(sekolah => {
          const schoolTypeId = sekolah.tipe_sekolah?.id_tipe_sekolah;
          return [112, 122].includes(schoolTypeId); // TK, RA
        });
      } else if (userRole === 5) { // SD
        filteredSchoolData = schoolData.filter(sekolah => {
          const schoolTypeId = sekolah.tipe_sekolah?.id_tipe_sekolah;
          return [211, 212, 221, 222].includes(schoolTypeId); // SDN, SDS, MIN, MIS
        });
      } else if (userRole === 6) { // SMP
        filteredSchoolData = schoolData.filter(sekolah => {
          const schoolTypeId = sekolah.tipe_sekolah?.id_tipe_sekolah;
          return [311, 312, 321, 322].includes(schoolTypeId); // SMPN, SMPS, MTSN, MTSS
        });
      } else if (userRole === 7) { // KEMENAG
        filteredSchoolData = schoolData.filter(sekolah => {
          const schoolTypeId = sekolah.tipe_sekolah?.id_tipe_sekolah;
          return [122, 221, 222, 321, 322].includes(schoolTypeId); // RA, MIN, MIS, MTSN, MTSS
        });
      }

      // Transform data
      const transformedData = filteredSchoolData.map(sekolah => {
        console.log('Processing school:', sekolah); // Log setiap sekolah
        return {
          id: sekolah.id_sekolah,
          id_sekolah: sekolah.id_sekolah,
          npsn: sekolah.npsn || '-',
          nama: sekolah.nama || '-',
          address: sekolah.address || '-',
          raw: sekolah // Simpan data asli
        };
      });
      
      console.log('Final transformed data:', transformedData);
      setSchools(transformedData);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error(error.message || 'Gagal mengambil data sekolah');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetchSchools saat komponen mount
  useEffect(() => {
    fetchSchools();
  }, []);

  const columns = [
    { 
      key: 'npsn', 
      label: 'NPSN',
      render: (_, row) => row.npsn
    },
    { 
      key: 'nama', 
      label: 'Nama Sekolah',
      render: (_, row) => row.nama
    },
    { 
      key: 'address', 
      label: 'Alamat',
      render: (_, row) => row.address
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

  const handleAdd = () => {
    // Buka dialog tambah sekolah
    formDialog.openAdd({});
  };

  const handleEdit = (row) => {
    console.log('Edit row:', row);
    
    // Persiapkan data untuk form edit
    const formData = {
      id_sekolah: row.id_sekolah || row.id,
      npsn: row.raw?.npsn || row.npsn,
      id_tipe_sekolah: row.raw?.tipe_sekolah?.id_tipe_sekolah || row.id_tipe_sekolah,
      nama_sekolah: row.raw?.nama || row.nama,
      alamat: row.raw?.address || row.address,
      id_kecamatan: row.raw?.kecamatan?.id_kecamatan || row.id_kecamatan,
      id_kelurahan: row.raw?.kelurahan?.id_kelurahan || row.id_kelurahan,
      latitude: row.raw?.latitude || row.latitude,
      longitude: row.raw?.longitude || row.longitude,
      raw: row.raw // Simpan data mentah untuk referensi
    };
    console.log('Prepared Edit Data:', formData);
    
    // Buka dialog edit dengan data yang sudah disiapkan
    formDialog.openEdit(formData);
  };

  const handleDelete = (row) => {
    console.log('Delete row:', row);
    const schoolId = row.id_sekolah || row.id || row.raw?.id_sekolah;
    
    if (!schoolId) {
      console.error('No valid school ID found in:', row);
      toast.error('ID Sekolah tidak valid');
      return;
    }

    setSelectedSchool({
      id_sekolah: schoolId,
      nama: row.nama || row.raw?.nama,
      ...row
    });
    setDeleteDialog({ 
      open: true, 
      data: row,
      errorMessage: '',
      showError: false 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Dapatkan data form dari event
      const formElement = e.target;
      const formData = {
        npsn: formElement.npsn.value,
        id_tipe_sekolah: formElement.id_tipe_sekolah.value,
        nama: formElement.nama_sekolah.value,
        address: formElement.alamat.value,
        id_kecamatan: formElement.id_kecamatan.value,
        id_kelurahan: formElement.id_kelurahan.value,
        latitude: formElement.latitude.value,
        longitude: formElement.longitude.value,
        // Default values untuk field lain
        phone: '-',
        email: '-',
        zonasi: 0,
        prestasi: 0,
        pindahan: 0,
        afirmasi: 0,
        reguler: 0,
        // ID Provinsi dan Kota Blitar
        id_provinsi: 35, // Jawa Timur
        id_kabupaten_kota: 3505 // Kota Blitar
      };

      // Validasi form
      if (!formData.npsn?.trim()) {
        toast.error('NPSN harus diisi');
        return;
      }
      if (!formData.id_tipe_sekolah?.trim()) {
        toast.error('Jenis sekolah harus dipilih');
        return;
      }
      if (!formData.nama?.trim()) {
        toast.error('Nama sekolah harus diisi');
        return;
      }
      if (!formData.address?.trim()) {
        toast.error('Alamat harus diisi');
        return;
      }
      if (!formData.id_kecamatan?.trim()) {
        toast.error('Kecamatan harus dipilih');
        return;
      }
      if (!formData.id_kelurahan?.trim()) {
        toast.error('Kelurahan harus dipilih');
        return;
      }
      if (!formData.latitude || !formData.longitude) {
        toast.error('Lokasi harus dipilih pada peta');
        return;
      }

      // Tentukan URL dan method berdasarkan mode
      const url = formDialog.mode === 'edit' 
        ? `${import.meta.env.VITE_API_URL}/sekolah/${formDialog.data.id_sekolah}`
        : `${import.meta.env.VITE_API_URL}/sekolah`;
      const method = formDialog.mode === 'edit' ? 'PUT' : 'POST';

      // Kirim data ke API
      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan data sekolah');
      }

      toast.success(
        formDialog.mode === 'edit' 
          ? 'Data sekolah berhasil diperbarui'
          : 'Data sekolah berhasil disimpan'
      );
      formDialog.close();
      fetchSchools(); // Refresh data sekolah
    } catch (error) {
      console.error('Error saving school:', error);
      toast.error(error.message || 'Gagal menyimpan data sekolah');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSchool) return;
    
    try {
      setLoading(true);
      console.log('Selected School Data:', selectedSchool);
      
      const headers = getHeaders();
      const deleteUrl = `${import.meta.env.VITE_API_URL}/sekolah/${selectedSchool.id_sekolah}`;
      console.log('Attempting to delete school at URL:', deleteUrl);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include'
      });

      const responseData = await response.json();
      console.log('Server Response:', {
        status: response.status,
        data: responseData
      });

      switch (response.status) {
        case 200:
        case 201:
        case 204:
          toast.success(responseData.message || 'Sekolah berhasil dihapus');
          setDeleteDialog({ open: false, data: null, errorMessage: '', showError: false });
          setSelectedSchool(null);
          await fetchSchools();
          break;
          
        case 401:
          handleUnauthorized();
          break;
          
        case 404:
          setDeleteDialog(prev => ({
            ...prev,
            errorMessage: 'Sekolah tidak ditemukan atau sudah dihapus',
            showError: true
          }));
          break;
          
        case 500:
          console.error('Server Error Details:', responseData);
          if (responseData.error && responseData.error.includes('violates foreign key constraint')) {
            setDeleteDialog(prev => ({
              ...prev,
              errorMessage: 'Sekolah ini tidak dapat dihapus karena masih memiliki data pendaftaran siswa yang terkait. Untuk menghapus sekolah ini:',
              showError: true,
              errorDetails: [
                '1. Pastikan tidak ada data pendaftaran siswa yang terkait',
                '2. Hapus atau pindahkan data pendaftaran siswa ke sekolah lain',
                '3. Setelah itu, Anda dapat mencoba menghapus sekolah ini kembali'
              ]
            }));
          } else {
            throw new Error(responseData.error || responseData.message || 'Terjadi kesalahan server saat menghapus sekolah');
          }
          break;
          
        default:
          throw new Error(responseData.message || `Terjadi kesalahan dengan status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Delete Error Details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      setDeleteDialog(prev => ({
        ...prev,
        errorMessage: error.message,
        showError: true
      }));
      
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
              <Card className="h-full w-full shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      {pageTitle}
                    </Typography>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <AddButton onClick={handleAdd}>
                        Tambah Sekolah
                      </AddButton>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table
                        data={schools}
                        columns={columns}
                        searchable={true}
                        searchPlaceholder="Cari sekolah..."
                        exportable={true}
                        pagination={true}
                        perPage={10}
                        className="w-full"
                      />
                      {schools.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          Tidak ada data sekolah
                        </div>
                      )}
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
          open={formDialog.isOpen}
          onClose={formDialog.close}
          title={
            formDialog.mode === 'add' 
              ? userRole === 4 ? 'Tambah Sekolah PAUD/TK' : userRole === 5 ? 'Tambah Sekolah SD' : userRole === 6 ? 'Tambah Sekolah SMP' : userRole === 7 ? 'Tambah Sekolah KEMENAG' : 'Tambah Sekolah'
              : userRole === 4 ? 'Edit Sekolah PAUD/TK' : userRole === 5 ? 'Edit Sekolah SD' : userRole === 6 ? 'Edit Sekolah SMP' : userRole === 7 ? 'Edit Sekolah KEMENAG' : 'Edit Sekolah'
          }
          onSubmit={handleSubmit}
          loading={loading}
        >
          <SekolahForm
            initialData={formDialog.data}
            mode={formDialog.mode}
          />
        </FormDialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={deleteDialog.open}
          onClose={() => {
            setDeleteDialog({ open: false, data: null, errorMessage: '', showError: false });
            setSelectedSchool(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Hapus Sekolah"
          message={
            deleteDialog.showError ? (
              <div className="space-y-2">
                <p className="text-red-500 font-medium">{deleteDialog.errorMessage}</p>
                {deleteDialog.errorDetails && (
                  <ul className="list-none space-y-1 text-sm text-gray-600 mt-2">
                    {deleteDialog.errorDetails.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              "Apakah Anda yakin ingin menghapus sekolah ini?"
            )
          }
          itemName={selectedSchool?.nama}
          loading={loading}
          showCancelButton={true}
          cancelLabel={deleteDialog.showError ? "Tutup" : "Batal"}
          confirmLabel={deleteDialog.showError ? null : "Hapus"}
        />
      </div>
    </SuperAdminGuard>
  );
};

export default Sekolah;