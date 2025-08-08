import React, { useState, useRef, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import { DeleteButton, ReloadButton } from '../../../components/element/Button/variant';
import { SuperAdminGuard } from '../../../utils/AuthGuard';
import toast from 'react-hot-toast';

const Sessions = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);

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

  // Fungsi untuk mengambil data sesi
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/session-user`, {
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
      // Transform data untuk menampilkan data user
      const transformedData = data.data.map(session => ({
        id: session.id_session_user,
        id_user: session.id_user,
        email: session.user?.email || '-',
        full_name: session.user?.fullname || '-',
        session_expired: session.session_expired,
        ip_address: session.ip_address,
        user_agent: session.user_agent
      }));

      setTableData(transformedData);
      toast.success('Data sesi berhasil dimuat');
      toast.success('Data sesi berhasil dimuat');
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error(error.message || 'Gagal mengambil data sesi');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menghapus session
  const handleDeleteSession = async (sessionId) => {
    try {
      setLoading(true);
      const headers = getHeaders();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/session-user/${sessionId}`, {
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
        throw new Error(errorData.message || 'Terjadi kesalahan saat menghapus sesi');
      }

      setTableData(prevData => prevData.filter(session => session.id !== sessionId));
      toast.success('Sesi berhasil dihapus');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Gagal menghapus sesi');
    } finally {
      setLoading(false);
    }
  };

  // Load data saat komponen mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Konfigurasi kolom tabel
  const columns = [
    { 
      key: 'full_name', 
      label: 'Nama Lengkap',
      render: (value, row) => value || row.email || '-'
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value) => value || '-'
    },
    { 
      key: 'session_expired', 
      label: 'Sesi Berakhir',
      render: (value) => new Date(value).toLocaleString('id-ID')
    },
    { key: 'ip_address', label: 'Alamat IP' },
    { 
      key: 'user_agent', 
      label: 'User Agent',
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    { 
      key: 'action', 
      label: 'Aksi',
      render: (_, session) => (
        <DeleteButton 
          size="sm" 
          className="bg-red-500"
          onClick={() => handleDeleteSession(session.id)}
          disabled={loading}
        >
          <i className="fas fa-times"></i>
        </DeleteButton>
      )
    }
  ];

  // Handle window resize untuk responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
                      Manajemen Sesi
                    </Typography>
                    <ReloadButton 
                      onClick={fetchSessions} 
                      className="w-auto sm:w-auto"
                      disabled={loading}
                    >
                      <i className={`fas fa-sync-alt mr-2 ${loading ? 'animate-spin' : ''}`}></i>
                      Muat Ulang
                    </ReloadButton>
                  </div>

                  <Table
                    ref={tableRef}
                    data={tableData}
                    columns={columns}
                    searchable={true}
                    exportable={true}
                    pagination={true}
                    perPage={10}
                    loading={loading}
                    className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                    noDataMessage="Tidak ada data sesi"
                  />
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
};

export default Sessions;