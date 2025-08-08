import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import UserSidebar from '../../components/common/User/UserSidebar';
import UserHeader from '../../components/common/User/UserHeader';
import UserFooter from '../../components/common/User/UserFooter';
import axios from 'axios';
import { UserGuard } from '../../utils/AuthGuard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [progressStatus, setProgressStatus] = useState({
    dokumen: false,
    profil: false
  });
  const [pendaftaranData, setPendaftaranData] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({
    status: 'pending',
    message: 'Menunggu kelengkapan data'
  });

  useEffect(() => {
    const fetchPendaftaranData = async () => {
      try {
        const userDataString = localStorage.getItem('userData');
        if (!userDataString) {
          toast.error('Silakan login terlebih dahulu');
          navigate('/login');
          return;
        }

        const userData = JSON.parse(userDataString);
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/user/${userData.id_user}`);
        
        console.log('Response from backend:', response.data); // Log response

        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          setPendaftaranData(data);

          // Check profile completion
          const hasProfile = !!(
            data.nik &&
            data.nisn &&
            data.nama_siswa &&
            data.tempat_lahir &&
            data.tanggal_lahir &&
            data.alamat &&
            data.id_sekolah_asal &&
            data.id_sekolah_tujuan
          );

          // Check document status
          const hasDocuments = !!(
            data.dok_akta &&
            data.dok_kk &&
            data.dok_kis &&
            data.dok_skhun &&
            data.dok_skdomisili &&
            data.dok_foto
          );

          setProgressStatus({
            dokumen: hasDocuments,
            profil: hasProfile
          });

          // Set registration status
          if (data.is_diterima === 1) {
            setRegistrationStatus({
              status: 'accepted',
              message: 'Selamat! Anda diterima di sekolah tujuan'
            });
          } else if (data.is_diterima === 0 && hasDocuments && hasProfile) {
            setRegistrationStatus({
              status: 'complete',
              message: 'Pendaftaran lengkap, menunggu pengumuman'
            });
          } else {
            setRegistrationStatus({
              status: 'incomplete',
              message: 'Silakan lengkapi persyaratan pendaftaran'
            });
          }
        } else {
          toast.error('Data pendaftaran tidak ditemukan');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal mengambil data pendaftaran');
      } finally {
        setLoading(false);
      }
    };

    fetchPendaftaranData();
    // Polling setiap 30 detik
    const interval = setInterval(fetchPendaftaranData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateProgress = () => {
    const totalSteps = 2; // dokumen, profil
    const completedSteps = 
      (progressStatus.dokumen ? 1 : 0) +
      (progressStatus.profil ? 1 : 0);
    return (completedSteps / totalSteps) * 100;
  };

  const progress = calculateProgress();
  const getStatusText = () => {
    if (progress === 0) return "Anda belum melengkapi persyaratan pendaftaran";
    if (progress === 100) return "Selamat! Anda telah melengkapi semua persyaratan pendaftaran";
    
    const incomplete = [];
    if (!progressStatus.dokumen) incomplete.push("dokumen");
    if (!progressStatus.profil) incomplete.push("profil");
    
    return `Silakan lengkapi ${incomplete.join(", ")} untuk melanjutkan proses pendaftaran`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const [year, month, day] = dateString.split('-');
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <UserGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <UserHeader isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <UserSidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <Card className="w-full">
                    <div className="p-4 sm:p-6">
                      <Typography variant="h4" color="blue-gray" className="text-lg sm:text-xl md:text-2xl mb-3">
                        Status Pendaftaran
                      </Typography>
                      <Typography variant="paragraph" className="text-sm sm:text-base mb-4">
                        Silakan lengkapi persyaratan pendaftaran
                      </Typography>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${progressStatus.profil ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm sm:text-base ${progressStatus.profil ? 'text-green-500' : 'text-gray-500'}`}>
                            Data Profil Lengkap
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${progressStatus.dokumen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm sm:text-base ${progressStatus.dokumen ? 'text-green-500' : 'text-gray-500'}`}>
                            Dokumen {!progressStatus.dokumen && 'Belum'} Lengkap
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${calculateProgress()}%` }}
                        />
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        Progress: {Math.round(calculateProgress())}%
                      </div>
                    </div>
                  </Card>

                  {pendaftaranData && (
                    <>
                      <Card className="w-full">
                        <div className="p-4 sm:p-6">
                          <Typography variant="h4" color="blue-gray" className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6">
                            Data Diri
                          </Typography>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                NIK
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.nik || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                NISN
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.nisn || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Nama Lengkap
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.nama_siswa || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Tempat, Tanggal Lahir
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.tempat_lahir}, {formatDate(pendaftaranData?.tanggal_lahir)}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Alamat
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.alamat || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Sekolah Asal
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.sekolah_asal_data?.nama || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Sekolah Tujuan
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.sekolah_tujuan_data?.nama || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Jalur Pendaftaran
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className="flex-1 text-gray-700 font-bold">
                                {pendaftaranData?.jalur_pendaftaran?.nama === 'ZONASI' ? 'Domisili' : pendaftaranData?.jalur_pendaftaran?.nama || '-'}
                              </Typography>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <Typography variant="small" color="blue-gray" className="w-full sm:w-48 font-bold mb-1 sm:mb-0">
                                Status Pendaftaran
                              </Typography>
                              <Typography variant="small" color="blue-gray" className="hidden sm:block w-4 font-bold">:</Typography>
                              <Typography variant="small" className={`flex-1 font-bold ${pendaftaranData?.is_diterima === 1 ? 'text-green-500' : 'text-blue-500'}`}>
                                {pendaftaranData?.is_diterima === 1 ? 'Diterima' : 'Dalam Proses'}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </>
                  )}
                </>
              )}
            </main>
            <UserFooter />
          </div>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </UserGuard>
  );
};

export default UserDashboard;