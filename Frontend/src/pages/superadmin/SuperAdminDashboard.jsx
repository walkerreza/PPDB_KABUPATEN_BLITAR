import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import { 
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/solid";
import { SuperAdminGuard } from '../../utils/AuthGuard';
import { toast } from 'react-toastify';
import adminPDF from '../../assets/doc/UM_admin_diknas.pdf';

const SuperAdminDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBanner, setShowBanner] = useState(true);
  const [sekolahStats, setSekolahStats] = useState({
    total: 0,
    perTipe: []
  });
  const [pendaftarStats, setPendaftarStats] = useState({
    total: 0,
    perTipe: []
  });
  const [diterimaStats, setDiterimaStats] = useState({
    total: 0,
    perTipe: []
  });

  // Mendapatkan role user
  const userRole = userData?.id_grup_user || 1;
  const isSuperAdmin = userRole === 1;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsOpen(width >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchSekolahStats(),
        fetchPendaftarStats(),
        fetchDiterimaStats()
      ]);
    };
    fetchData();
  }, []);

  const fetchSekolahStats = async () => {
    try {
      // Tambahkan parameter role jika bukan SuperAdmin
      let url = `${import.meta.env.VITE_API_URL}/sekolah/total`;
      
      // Jika bukan SuperAdmin, tambahkan parameter role
      if (!isSuperAdmin) {
        if (userRole === 4) { // PAUD/TK
          url += '?role=paud_tk';
        } else if (userRole === 5) { // SD
          url += '?role=sd';
        } else if (userRole === 6) { // SMP
          url += '?role=smp';
        } else if (userRole === 7) { // KEMENAG
          url += '?role=kemenag';
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data statistik sekolah');
      }

      const result = await response.json();
      console.log('Data dari API:', result);

      if (result.status) {
        setSekolahStats(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(error.message);
    }
  };

  const fetchPendaftarStats = async () => {
    try {
      // Tambahkan parameter role jika bukan SuperAdmin
      let url = `${import.meta.env.VITE_API_URL}/pendaftaran/total`;
      
      // Jika bukan SuperAdmin, tambahkan parameter role
      if (!isSuperAdmin) {
        if (userRole === 4) { // PAUD/TK
          url += '?role=paud_tk';
        } else if (userRole === 5) { // SD
          url += '?role=sd';
        } else if (userRole === 6) { // SMP
          url += '?role=smp';
        } else if (userRole === 7) { // KEMENAG
          url += '?role=kemenag';
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data statistik pendaftar');
      }

      const result = await response.json();
      if (result.status) {
        setPendaftarStats(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching pendaftar stats:', error);
      toast.error(error.message);
    }
  };

  const fetchDiterimaStats = async () => {
    try {
      // Tambahkan parameter role jika bukan SuperAdmin
      let url = `${import.meta.env.VITE_API_URL}/pendaftaran/total-diterima`;
      
      // Jika bukan SuperAdmin, tambahkan parameter role
      if (!isSuperAdmin) {
        if (userRole === 4) { // PAUD/TK
          url += '?role=paud_tk';
        } else if (userRole === 5) { // SD
          url += '?role=sd';
        } else if (userRole === 6) { // SMP
          url += '?role=smp';
        } else if (userRole === 7) { // KEMENAG
          url += '?role=kemenag';
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data statistik pendaftar yang diterima');
      }

      const result = await response.json();
      if (result.status) {
        setDiterimaStats(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching diterima stats:', error);
      toast.error(error.message);
    }
  };

  const mapSchoolLabel = (label) => {
    return label === 'SLTP' ? 'SMP' : label;
  };

  const stats = useMemo(() => {
    // Filter items berdasarkan role jika bukan SuperAdmin
    const filterItemsByRole = (items) => {
      if (isSuperAdmin) return items;
      
      if (userRole === 4) { // PAUD/TK
        return items.filter(item => ['TK', 'RA'].includes(item.label));
      } else if (userRole === 5) { // SD
        return items.filter(item => ['SD', 'MI'].includes(item.label));
      } else if (userRole === 6) { // SMP
        return items.filter(item => ['SMP', 'MTS'].includes(item.label));
      } else if (userRole === 7) { // KEMENAG
        return items.filter(item => ['RA', 'MI', 'MTS'].includes(item.label));
      }
      
      return items;
    };
    
    // Hitung total dari item yang sudah difilter
    const calculateTotal = (items) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((sum, item) => sum + parseInt(item.value || 0), 0);
    };
    
    // Filter items untuk setiap statistik
    const filteredSekolahItems = sekolahStats.perTipe?.length > 0 
      ? filterItemsByRole(sekolahStats.perTipe.map(item => ({
          ...item,
          label: mapSchoolLabel(item.label)
        })))
      : filterItemsByRole([
        { label: "TK", value: "0" },
        { label: "RA", value: "0" },
        { label: "SD", value: "0" },
        { label: "MI", value: "0" },
        { label: "SMP", value: "0" },
        { label: "MTS", value: "0" }
      ]);
      
    const filteredPendaftarItems = pendaftarStats.perTipe?.length > 0 
      ? filterItemsByRole(pendaftarStats.perTipe.map(item => ({
          ...item,
          label: mapSchoolLabel(item.label)
        })))
      : filterItemsByRole([
        { label: "TK", value: "0" },
        { label: "RA", value: "0" },
        { label: "SD", value: "0" },
        { label: "MI", value: "0" },
        { label: "SMP", value: "0" },
        { label: "MTS", value: "0" }
      ]);
      
    const filteredDiterimaItems = diterimaStats.perTipe?.length > 0 
      ? filterItemsByRole(diterimaStats.perTipe.map(item => ({
          ...item,
          label: mapSchoolLabel(item.label)
        })))
      : filterItemsByRole([
        { label: "TK", value: "0" },
        { label: "RA", value: "0" },
        { label: "SD", value: "0" },
        { label: "MI", value: "0" },
        { label: "SMP", value: "0" },
        { label: "MTS", value: "0" }
      ]);
    
    // Hitung total untuk setiap statistik berdasarkan items yang sudah difilter
    const sekolahTotal = isSuperAdmin ? (sekolahStats.total || 0) : calculateTotal(filteredSekolahItems);
    const pendaftarTotal = isSuperAdmin ? (pendaftarStats.total || 0) : calculateTotal(filteredPendaftarItems);
    const diterimaTotal = isSuperAdmin ? (diterimaStats.total || 0) : calculateTotal(filteredDiterimaItems);
    
    return [
      {
        title: "SEKOLAH",
        total: `TOTAL : ${sekolahTotal}`,
        items: filteredSekolahItems,
        icon: <BuildingLibraryIcon className="w-8 h-8 text-blue-500" />
      },
      {
        title: "PENDAFTAR",
        total: `TOTAL : ${pendaftarTotal}`,
        items: filteredPendaftarItems,
        icon: <UsersIcon className="w-8 h-8 text-green-500" />
      },
      {
        title: "DITERIMA",
        total: `TOTAL : ${diterimaTotal}`,
        items: filteredDiterimaItems,
        icon: <UserGroupIcon className="w-8 h-8 text-purple-500" />
      }
    ];
  }, [sekolahStats, pendaftarStats, diterimaStats, userRole, isSuperAdmin]);

  const toggleSidebar = () => setIsOpen(!isOpen);

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
            <main className="p-4 md:p-8">
              {showBanner && (
                <div className="bg-yellow-50 p-4 rounded-lg mb-6 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-yellow-800">
                      Panduan Penggunaan PPDB Online kabupaten  Blitar bisa download disini
                      <button 
                        onClick={() => window.open(adminPDF, '_blank')}
                        className="ml-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Download
                      </button>
                      atau langsung lihat videonya disini
                      <button 
                        onClick={() => window.open('https://www.youtube.com/watch?v=iF_dVivMEf0', '_blank')}
                        className="ml-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Lihat
                      </button>
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowBanner(false)} 
                    className="text-yellow-800 hover:text-yellow-900 ml-4"
                    title="Tutup banner"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Typography variant="h6" color="blue-gray" className="mb-2 font-bold">
                          {stat.title}
                        </Typography>
                        <Typography className="text-sm text-gray-600 font-semibold">
                          {stat.total}
                        </Typography>
                      </div>
                      {stat.icon}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {stat.items.map((item, i) => (
                        <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                          <Typography className="text-xs font-semibold text-gray-600 mb-1">
                            {item.label}
                          </Typography>
                          <Typography className="text-sm font-bold text-gray-800">
                            {item.value}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </main>
            <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />

            <SuperAdminFooter />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
};

export default SuperAdminDashboard;