import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, Typography, Select, Option } from "@material-tailwind/react";
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import { AddButton, ReloadButton, EditButton, DeleteButton } from '../../../components/element/Button/variant';
import FormDialog from '../../../components/dialog/FormDialog';
import DeleteDialog from '../../../components/dialog/DeleteDialog';
import UserForm from './components/UserForm';
import useFormDialog from '../../../components/dialog/useFormDialog';
import { SuperAdminGuard } from '../../../utils/AuthGuard';
import toast from 'react-hot-toast';

const Users = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const tableRef = useRef(null);

  // State untuk form dan dialog
  const formDialog = useFormDialog();
  const [formData, setFormData] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, data: null });
  const [loading, setLoading] = useState(false);

  // Tambahkan state untuk menyimpan data user dari API
  const [users, setUsers] = useState([]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Data untuk filter groups sesuai dengan id_grup_user di database
  const groups = [
    { value: 'all', label: 'Semua Grup' },
    { value: '1', label: 'DINAS' },
    { value: '2', label: 'SEKOLAH' },
    { value: '3', label: 'PENDAFTAR' },
    { value: '4', label: 'BIDANG PAUD/TK' },
    { value: '5', label: 'BIDANG SD' },
    { value: '6', label: 'BIDANG SMP' },
    { value: '7', label: 'BIDANG KEMENAG' }
  ];

  const genders = [
    { value: 'all', label: 'Semua Jenis Kelamin' },
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' }
  ];

  const userStatus = [
    { value: 'all', label: 'Semua Status User' },
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Tidak Aktif', label: 'Tidak Aktif' }
  ];

  // Fungsi untuk mendapatkan opsi grup yang sesuai dengan role pengguna
  const getFilteredGroupOptions = () => {
    const currentRole = getCurrentUserRole();
    
    // DINAS (id: 1) bisa melihat semua grup
    if (currentRole === '1') {
      return groups;
    }
    
    // Operator bidang (4, 5, 6, 7) hanya bisa melihat grup tertentu
    if (['4', '5', '6', '7'].includes(currentRole)) {
      // Operator bidang hanya bisa melihat SEKOLAH, PENDAFTAR, dan grupnya sendiri
      return [
        { value: 'all', label: 'Semua Grup' },
        { value: '2', label: 'SEKOLAH' },
        { value: '3', label: 'PENDAFTAR' },
        { value: currentRole, label: groups.find(g => g.value === currentRole)?.label || '' }
      ];
    }
    
    // Default: kembalikan semua grup
    return groups;
  };

  // Fungsi untuk mendapatkan headers dengan token (sama seperti di Banner.jsx)
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

  // Fungsi untuk mendapatkan nama grup berdasarkan id
  const getGroupName = (groupId) => {
    // Pastikan groupId adalah string untuk konsistensi
    const id = String(groupId);
    console.log('getGroupName called with:', groupId, 'converted to:', id);
    
    switch (id) {
      case '1':
        return 'DINAS';
      case '2':
        return 'SEKOLAH';
      case '3':
        return 'PENDAFTAR';
      case '4':
        return 'BIDANG PAUD/TK';
      case '5':
        return 'BIDANG SD';
      case '6':
        return 'BIDANG SMP';
      case '7':
        return 'BIDANG KEMENAG';
      default:
        return id;
    }
  };

  // Fungsi untuk mendapatkan role user saat ini
  const getCurrentUserRole = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      return userData?.id_grup_user?.toString() || '1';
    } catch (error) {
      console.error('Error getting user role:', error);
      return '1';
    }
  };

  // Fungsi untuk mengecek apakah sekolah sesuai dengan jenjang operator
  const isSekolahMatchJenjang = (sekolah, operatorRole) => {
    if (!sekolah?.id_tipe_sekolah) return false;
    const tipeSekolahStr = sekolah.id_tipe_sekolah.toString();
    const tipeSekolah = parseInt(tipeSekolahStr);
    
    // Validasi hasil konversi ke integer
    if (isNaN(tipeSekolah)) return false;
    
    switch (operatorRole) {
      case '4': // Operator PAUD/TK
        return [112, 122].includes(tipeSekolah);
      case '5': // Operator SD
        return [211, 212, 221, 222].includes(tipeSekolah);
      case '6': // Operator SMP
        return [311, 312, 321, 322].includes(tipeSekolah);
      case '7': // Operator KEMENAG
        return [122, 221, 222, 321, 322].includes(tipeSekolah); // RA, MIN, MIS, MTSN, MTSS
      default:
        return false;
    }
  };

  // Fungsi untuk fetch data user
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const currentRole = getCurrentUserRole();
      
      // Ambil data user dengan include sekolah dan tipe_sekolah
      let baseUrl = `${import.meta.env.VITE_API_URL}/user?include=sekolah,tipe_sekolah`;
      
      // Tambahkan filter berdasarkan role jika user adalah operator bidang
      if (['4', '5', '6', '7'].includes(currentRole)) {
        let jenjangFilter = '';
        
        switch (currentRole) {
          case '4': // Operator PAUD/TK
            jenjangFilter = '112,122'; // TK, RA
            break;
          case '5': // Operator SD
            jenjangFilter = '211,212,221,222'; // SDN, SDS, MIN, MIS
            break;
          case '6': // Operator SMP
            jenjangFilter = '311,312,321,322'; // SMPN, SMPS, MTSN, MTSS
            break;
          case '7': // Operator KEMENAG
            jenjangFilter = '122,221,222,321,322'; // RA, MIN, MIS, MTSN, MTSS
            break;
        }
        
        if (jenjangFilter) {
          baseUrl += `&jenjang=${encodeURIComponent(jenjangFilter)}`;
        }
      }
      
      console.log('Fetching users from URL:', baseUrl);
      
      const response = await fetch(baseUrl, {
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
      console.log('Data mentah dari API:', data);

      // Transform data sesuai dengan struktur yang dibutuhkan
      const transformedData = data.map(user => {
        // Pastikan data sekolah ada
        const sekolahData = user.sekolah || {};
        
        return {
          id: user.id_user,
          username: user.username || '',
          full_name: user.nama_lengkap || user.fullname || '',
          email: user.email || '',
          phone: user.no_telp || user.phone || '',
          address: user.alamat || user.address || '',
          group: user.id_grup_user?.toString() || '',
          id_sekolah: sekolahData.id_sekolah?.toString() || '',
          lembaga: sekolahData.nama || '',
          id_tipe_sekolah: sekolahData.id_tipe_sekolah?.toString() || '',
          gender: user.id_jenis_kelamin === 1 ? 'L' : 'P',
          status: user.status === 1 ? 'Aktif' : 'Tidak Aktif',
          sekolah: sekolahData // Simpan data sekolah lengkap untuk keperluan filtering
        };
      });

      console.log('Data yang sudah ditransform:', transformedData);
      setUsers(transformedData);
    } catch (error) {
      console.error('Error mengambil data user:', error);
      toast.error(error.message || 'Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk handle submit form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    formDialog.setLoading(true);
    
    try {
      const headers = getHeaders();
      
      // Validasi data wajib
      if (!formData.username || !formData.fullName) {
        throw new Error('Username dan Nama Lengkap wajib diisi');
      }

      // Validasi password untuk user baru
      if (formDialog.mode === 'add' && !formData.password) {
        throw new Error('Password wajib diisi untuk user baru');
      }

      // Validasi format email hanya jika email diisi
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error('Format email tidak valid');
        }
      }

  // Siapkan data untuk dikirim
const dataToSubmit = {
  username: formData.username,
  fullname: formData.fullName,
  email: formData.email || null,
  phone: formData.phone || null,
  address: formData.address || null,
  id_grup_user: parseInt(formData.id_grup_user || '0'),
  id_jenis_kelamin: formData.id_jenis_kelamin ? parseInt(formData.id_jenis_kelamin) : null,
  id_sekolah: formData.id_sekolah || null,
  status: formData.active === 'ACTIVE' ? 1 : 0
};

// Hanya tambahkan password jika diisi dan bukan edit mode, atau jika diisi dan edit mode
if (formData.password) {
  dataToSubmit.password = formData.password;
}

      // Validasi jenis kelamin
      if (!formData.id_jenis_kelamin) {
        throw new Error('Jenis kelamin wajib dipilih');
      }

      // Validasi khusus untuk grup sekolah
      const grupSekolah = 2;
      if (parseInt(formData.id_grup_user) === grupSekolah && !formData.id_sekolah) {
        throw new Error('Sekolah wajib dipilih untuk grup SEKOLAH');
      }

      // Pastikan URL menggunakan id_user yang benar
      const url = formDialog.mode === 'add' 
        ? `${import.meta.env.VITE_API_URL}/user`
        : `${import.meta.env.VITE_API_URL}/user/${formData.id_user}`;

      console.log('URL:', url);
      console.log('Data yang akan dikirim:', dataToSubmit);

      const response = await fetch(url, {
        method: formDialog.mode === 'add' ? 'POST' : 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(dataToSubmit)
      });

      // Log response untuk debugging
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Terjadi kesalahan saat menyimpan user');
      }

      toast.success(responseData.message || `User berhasil ${formDialog.mode === 'add' ? 'ditambahkan' : 'diupdate'}`);
      
      formDialog.close();
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan user');
    } finally {
      formDialog.setLoading(false);
    }
  };

  // Fungsi untuk menghapus session user
  const deleteUserSessions = async (userId) => {
    try {
      // Hapus semua session user berdasarkan id_user
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/session-user/delete-by-user/${userId}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Gagal menghapus session user');
      }
    } catch (error) {
      console.error('Error menghapus session user:', error);
      throw new Error('Gagal menghapus session user: ' + error.message);
    }
  };

  // Fungsi untuk handle delete user
  const handleConfirmDelete = async () => {
    if (!deleteDialog.data) return;
    
    setLoading(true);
    try {
      // Hapus semua session user terlebih dahulu
      await deleteUserSessions(deleteDialog.data.id);

      // Kemudian hapus user
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${deleteDialog.data.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menghapus user');
      }

      const result = await response.json();
      toast.success(result.message || 'User berhasil dihapus');
      
      setDeleteDialog({ open: false, data: null });
      fetchUsers(); // Refresh data setelah hapus
    } catch (error) {
      console.error('Error menghapus user:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menghapus user');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk membuka dialog konfirmasi hapus
  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      data: row
    });
  };

  // Fungsi untuk menutup dialog konfirmasi hapus
  const handleCancelDelete = () => {
    setDeleteDialog({
      open: false,
      data: null
    });
  };

  const handleEditUser = (row) => {
    console.log('Raw row data:', row);
  
    // Reset form terlebih dahulu
    setFormData({});
    
    // Gunakan setTimeout untuk memastikan reset selesai sebelum mengisi data baru
    setTimeout(() => {
      const formDataForEdit = {
        id_user: row.id,
        username: row.username,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        id_grup_user: row.group,
        id_sekolah: row.id_sekolah,
        lembaga: row.lembaga, // Tambahkan nama lembaga/sekolah
        id_jenis_kelamin: row.gender === 'L' ? 1 : 2,
        active: row.status === 'Aktif' ? 'ACTIVE' : 'INACTIVE',
        password: '' // Tambahkan password kosong agar field password tidak undefined
      };
  
      console.log('Data for edit:', formDataForEdit);
      setFormData(formDataForEdit);
      
      // Tambahkan delay sebelum membuka dialog
      setTimeout(() => {
        formDialog.openEdit();
      }, 100);
    }, 100);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    console.log('Form change:', name, value); // Debugging perubahan form
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler untuk perubahan filter
  const handleGroupChange = (value) => {
    console.log('Group changed to:', value); // Debugging
    setSelectedGroup(value);
    // Tidak perlu memanggil getFilteredData() karena akan otomatis dipanggil saat render
  };

  const handleGenderChange = (value) => {
    console.log('Gender changed to:', value); // Debugging
    setSelectedGender(value);
  };

  const handleStatusChange = (value) => {
    console.log('Status changed to:', value); // Debugging
    setSelectedStatus(value);
  };

  // Fungsi untuk reload tabel
  const handleReload = () => {
    if (tableRef.current) {
      tableRef.current.refresh();
    }
  };

  // Fungsi untuk filter data
  const getFilteredData = () => {
    const currentRole = getCurrentUserRole();
    console.log('Current role:', currentRole);
    console.log('Selected filters:', { group: selectedGroup, gender: selectedGender, status: selectedStatus });
    
    return users.filter(user => {
      // Filter dasar (gender dan status)
      const matchGender = selectedGender === 'all' || user.gender === selectedGender;
      const matchStatus = selectedStatus === 'all' || user.status === selectedStatus;
      
      // Debugging untuk melihat nilai grup user
      console.log(`User: ${user.full_name}, Group: ${user.group}, SelectedGroup: ${selectedGroup}`);
      
      // Filter grup - periksa selectedGroup dengan nilai yang benar
      // Pastikan perbandingan tipe data konsisten (string dengan string)
      const matchGroup = selectedGroup === 'all' || String(user.group) === String(selectedGroup);
      
      // Jika filter grup dipilih secara khusus, gunakan itu dulu
      if (selectedGroup !== 'all') {
        // Jika user memilih grup tertentu, hanya tampilkan user dengan grup tersebut
        // yang memenuhi kriteria gender dan status
        return matchGroup && matchGender && matchStatus;
      }
      
      // Jika user adalah operator bidang (4, 5, 6, 7)
      if (['4', '5', '6', '7'].includes(currentRole)) {
        // Operator bidang hanya bisa melihat user dengan grup SEKOLAH, PENDAFTAR, dan grup mereka sendiri
        if (!['2', '3', currentRole].includes(String(user.group))) {
          return false;
        }
        
        // Jika user adalah SEKOLAH, filter berdasarkan jenjang sekolah
        if (String(user.group) === '2' && user.sekolah) {
          return matchGender && matchStatus && isSekolahMatchJenjang(user.sekolah, currentRole);
        }
        
        // Untuk PENDAFTAR dan user dengan grup yang sama, tampilkan sesuai filter gender dan status
        return matchGender && matchStatus;
      }
      
      // Untuk SuperAdmin dan DINAS, tampilkan semua data sesuai filter yang dipilih
      return matchGender && matchStatus;
    });
  };

  const columns = [
    { key: 'full_name', label: 'Full Name' },
    { 
      key: 'group', 
      label: 'Group',
      render: (value) => (
        <span>{getGroupName(value)}</span>
      )
    },
    { key: 'lembaga', label: 'Lembaga' },
    { 
      key: 'contact_information', 
      label: 'Contact Information',
      render: (_, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <i className="fas fa-envelope text-sm"></i>
            <a href={`mailto:${row.email}`} className="text-blue-500 hover:underline">
              {row.email}
            </a>
          </div>
          {row.phone && (
            <div className="flex items-center gap-2">
              <i className="fas fa-phone text-sm"></i>
              <span>{row.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-sm"></i>
            <span>{row.address}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <EditButton onClick={() => handleEditUser(row)} />
          <DeleteButton onClick={() => handleDeleteClick(row)} />
        </div>
      )
    }
  ];

  // Tambahkan useEffect untuk fetch data saat komponen mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form
  const handleAddUser = () => {
    setFormData({}); // Reset form
    formDialog.openAdd();
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
                      Users
                    </Typography>
                    <div className="flex items-center gap-2">
                      <AddButton onClick={handleAddUser}>
                        <i className="fas fa-plus mr-2"></i>
                        Add User
                      </AddButton>
                      <ReloadButton onClick={handleReload}>
                        <i className="fas fa-sync-alt mr-2"></i>
                        Reload
                      </ReloadButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Select 
                      value={selectedGroup} 
                      onChange={handleGroupChange}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      labelProps={{
                        className: "hidden",
                      }}
                      containerProps={{
                        className: "min-w-[100px]",
                      }}
                    >
                      {getFilteredGroupOptions().map(group => (
                        <Option key={group.value} value={group.value}>
                          {group.label}
                        </Option>
                      ))}
                    </Select>

                    <Select 
                      value={selectedGender} 
                      onChange={handleGenderChange}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      labelProps={{
                        className: "hidden",
                      }}
                      containerProps={{
                        className: "min-w-[100px]",
                      }}
                    >   
                      {genders.map(gender => (
                        <Option key={gender.value} value={gender.value}>
                          {gender.label}
                        </Option>
                      ))}
                    </Select>

                    <Select 
                      value={selectedStatus} 
                      onChange={handleStatusChange}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      labelProps={{
                        className: "hidden",
                      }}
                      containerProps={{
                        className: "min-w-[100px]",
                      }}
                    >
                      {userStatus.map(status => (
                        <Option key={status.value} value={status.value}>
                          {status.label}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <Table
                    ref={tableRef}
                    data={getFilteredData()}
                    columns={columns}
                    searchable={true}
                    exportable={true}
                    pagination={true}
                    perPage={10}
                    className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                  />
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>

        {/* Form Dialog untuk Add/Edit User */}
        <FormDialog
          open={formDialog.isOpen}
          onClose={formDialog.close}
          title={formDialog.mode === 'add' ? 'Add New User' : 'Edit User'}
          onSubmit={handleSubmitForm}
          loading={formDialog.loading}
        >
          <UserForm
            initialData={formData}
            onChange={handleFormChange}
          />
        </FormDialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={deleteDialog.open}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          loading={loading}
          title="Hapus User"
          message={`Apakah Anda yakin ingin menghapus user "${deleteDialog.data?.full_name}"?`}
          confirmText="Hapus"
          cancelText="Batal"
        />
      </div>
    </SuperAdminGuard>
  );
};

export default Users;