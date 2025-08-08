import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import AdminSidebar from '../../components/common/admin/AdminSidebar';
import AdminHeader from '../../components/common/admin/AdminHeader';
import AdminFooter from '../../components/common/admin/AdminFooter';
import { 
  UsersIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/solid";
import { AdminGuard } from '../../utils/AuthGuard';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));

  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [statistik, setStatistik] = useState({
    pendaftar: 0,
    mendaftar: 0,
    diterima: 0
  });

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
    const fetchStatistik = async () => {
      try {        
        if (!userData?.sekolah?.id_sekolah) {
          console.error("ID Sekolah tidak ditemukan dalam userData");
          return;
        }

        const id_sekolah = userData.sekolah.id_sekolah;
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/statistik/pendaftaran/${id_sekolah}`);        
        if (response.data.status === "success") {
          setStatistik(response.data.data);
        } else {
          console.error("Error response:", response.data);
        }
      } catch (error) {
        console.error("Error detail:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setStatistik({
          pendaftar: 0,
          mendaftar: 0,
          diterima: 0
        });
      }
    };

    fetchStatistik();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const stats = [
    {
      title: "PENDAFTAR",
      value: statistik.pendaftar.toString(),
      icon: <UsersIcon className="w-8 h-8 text-blue-500" />
    },
    {
      title: "MENDAFTAR",
      value: statistik.mendaftar.toString(),
      icon: <UsersIcon className="w-8 h-8 text-green-500" />
    },
    {
      title: "DITERIMA",
      value: statistik.diterima.toString(),
      icon: <BuildingLibraryIcon className="w-8 h-8 text-purple-500" />
    }
  ];

  const schoolInfo = {
    npsn: userData?.sekolah?.npsn || "-",
    name: userData?.sekolah?.nama || "-",
    address: userData?.sekolah?.address || "-"
  };

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
      <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <div className="fixed top-0 w-full z-50">
          <AdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px] ">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <AdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} userData={userData} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-4 md:p-8">
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-yellow-800">
                    Panduan Penggunaan PPDB Online Kota Blitar bisa download disini
                    <button className="ml-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                      Download
                    </button>
                    atau langsung lihat videonya disini
                    <button className="ml-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                      Lihat
                    </button>
                  </p>
                </div>
                <button className="text-yellow-800 hover:text-yellow-900">
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="p-6 flex flex-col items-center justify-center text-center">
                    {stat.icon}
                    <Typography variant="h1" className="mt-4 text-4xl font-bold">
                      {stat.value}
                    </Typography>
                    <Typography className="text-sm text-gray-600 font-semibold mt-2">
                      {stat.title}
                    </Typography>
                  </Card>
                ))}
              </div>

              <Card className="mt-6 p-6">
                <Typography variant="h6" color="blue-gray" className="mb-4">
                  Informasi Sekolah
                </Typography>
                <div className="space-y-4">
                  <div className="flex">
                    <Typography className="w-32 text-gray-600">NPSN</Typography>
                    <Typography className="text-gray-800">: {schoolInfo.npsn}</Typography>
                  </div>
                  <div className="flex">
                    <Typography className="w-32 text-gray-600">Nama Sekolah</Typography>
                    <Typography className="text-gray-800">: {schoolInfo.name}</Typography>
                  </div>
                  <div className="flex">
                    <Typography className="w-32 text-gray-600">Alamat</Typography>
                    <Typography className="text-gray-800">: {schoolInfo.address}</Typography>
                  </div>
                </div>
              </Card>
            </main>
            <br /><br /><br /><br /><br /><br />
            <AdminFooter />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;