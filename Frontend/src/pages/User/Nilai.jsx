import React, { useState, useEffect } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import UserHeader from '../../components/common/user/UserHeader';
import UserSidebar from '../../components/common/user/UserSidebar';
import UserFooter from '../../components/common/user/UserFooter';
import { UserGuard } from '../../utils/AuthGuard';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const Nilai = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nilaiData, setNilaiData] = useState({
    nilai_bhs_indonesia: '',
    nilai_ipa: '',
    nilai_matematika: '',
    rata_rata: '',
    id_tipe_sekolah_asal: '',
    id_sekolah_tujuan: ''
  });

  const handleNilaiChange = (field, value) => {
    // Pastikan input adalah angka dan tidak lebih dari 100
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setNilaiData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        
        // Hitung rata-rata jika semua nilai telah diisi
        if (newData.nilai_bhs_indonesia && newData.nilai_ipa && newData.nilai_matematika) {
          const total = parseFloat(newData.nilai_bhs_indonesia) + 
                       parseFloat(newData.nilai_ipa) +
                       parseFloat(newData.nilai_matematika);
          newData.rata_rata = (total / 3).toFixed(2);
        }
        
        return newData;
      });
    }
  };

  const handleSaveNilai = async () => {
    try {
      setSaving(true);
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/login');
        return;
      }

      // Validasi nilai
      if (!nilaiData.nilai_bhs_indonesia || !nilaiData.nilai_ipa || !nilaiData.nilai_matematika) {
        toast.error('Semua nilai harus diisi');
        return;
      }

      const userData = JSON.parse(userDataString);
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/pendaftaran/user/${userData.id_user}`,
        {
          nilai_bhs_indonesia: parseFloat(nilaiData.nilai_bhs_indonesia),
          nilai_ipa: parseFloat(nilaiData.nilai_ipa),
          nilai_matematika: parseFloat(nilaiData.nilai_matematika)
        }
      );

      if (response.data.success) {
        toast.success('Nilai berhasil disimpan');
      } else {
        toast.error(response.data.message || 'Gagal menyimpan nilai');
      }
    } catch (error) {
      console.error('Error saving nilai:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

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
        
        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          console.log('Data dari API:', data);
          
          const nilai = {
            nilai_bhs_indonesia: data.nilai_bhs_indonesia || '',
            nilai_ipa: data.nilai_ipa || '',
            nilai_matematika: data.nilai_matematika || '',
            rata_rata: '',
            id_tipe_sekolah_asal: data.id_tipe_sekolah_asal,
            id_sekolah_tujuan: data.id_sekolah_tujuan
          };

          console.log('Nilai yang diset:', nilai);
          console.log('Tipe sekolah asal:', data.id_tipe_sekolah_asal);
          console.log('Sekolah tujuan:', data.id_sekolah_tujuan);

          if (data.nilai_bhs_indonesia && data.nilai_ipa && data.nilai_matematika) {
            const total = parseFloat(data.nilai_bhs_indonesia) + 
                         parseFloat(data.nilai_ipa) +
                         parseFloat(data.nilai_matematika);
            nilai.rata_rata = (total / 3).toFixed(2);
          }
          
          setNilaiData(nilai);
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
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsOpen(width >= 768);
      setIsMobile(width < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <UserGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="fixed top-0 w-full z-50">
          <UserHeader isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />
        </div>
        
        <div className="flex flex-1 pt-[60px] bg-gray-50">
          <div className="fixed left-0 h-[calc(100vh-64px)] z-40">
            <UserSidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''} bg-gray-50`}>
            <main className="p-2 sm:p-4 md:p-6 lg:p-8 bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Card className="p-6 shadow-lg">
                  <div className="border-b pb-4 mb-6">
                    <Typography variant="h4" color="blue-gray" className="font-bold text-xl md:text-2xl">
                      Data Nilai
                    </Typography>
                    <Typography variant="small" color="gray" className="mt-1">
                      Masukkan nilai ujian akhir sekolah
                    </Typography>
                  </div>

                  {(nilaiData.id_tipe_sekolah_asal === 211 || 
                    nilaiData.id_tipe_sekolah_asal === 212 ||
                    nilaiData.id_tipe_sekolah_asal === 221 ||
                    nilaiData.id_tipe_sekolah_asal === 222 ||
                    nilaiData.id_tipe_sekolah_asal === 311 || 
                    nilaiData.id_tipe_sekolah_asal === 312 ||
                    nilaiData.id_tipe_sekolah_asal === 321 ||
                    nilaiData.id_tipe_sekolah_asal === 322 ||
                    nilaiData.id_tipe_sekolah_asal === 411 ||
                    nilaiData.id_tipe_sekolah_asal === 412 ||
                    nilaiData.id_tipe_sekolah_asal === 421 ||
                    nilaiData.id_tipe_sekolah_asal === 422 ||
                    nilaiData.id_tipe_sekolah_asal === 431 ||
                    nilaiData.id_tipe_sekolah_asal === 432 ||
                    nilaiData.id_tipe_sekolah_asal === 441 ||
                    nilaiData.id_tipe_sekolah_asal === 442) ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Bahasa Indonesia */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-100 transition-all duration-300">
                          <h3 className="text-center text-gray-700 font-medium mb-3">Bahasa Indonesia</h3>
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={nilaiData.nilai_bhs_indonesia}
                              onChange={(e) => handleNilaiChange('nilai_bhs_indonesia', e.target.value)}
                              className="w-24 text-center text-4xl font-bold p-2 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                            />
                          </div>
                        </div>

                        {/* IPA */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-100 transition-all duration-300">
                          <h3 className="text-center text-gray-700 font-medium mb-3">Ilmu Pengetahuan Alam</h3>
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={nilaiData.nilai_ipa}
                              onChange={(e) => handleNilaiChange('nilai_ipa', e.target.value)}
                              className="w-24 text-center text-4xl font-bold p-2 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                            />
                          </div>
                        </div>

                        {/* Matematika */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-100 transition-all duration-300">
                          <h3 className="text-center text-gray-700 font-medium mb-3">Matematika</h3>
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={nilaiData.nilai_matematika}
                              onChange={(e) => handleNilaiChange('nilai_matematika', e.target.value)}
                              className="w-24 text-center text-4xl font-bold p-2 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rata-rata Nilai */}
                      <div className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <div className="text-center">
                          <h3 className="text-gray-700 font-medium mb-2">Rata-rata Nilai</h3>
                          <div className="text-4xl font-bold text-blue-600">
                            {nilaiData.rata_rata || '0.00'}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Simpan */}
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={handleSaveNilai}
                          disabled={saving}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Typography variant="h6" color="gray" className="font-normal">
                        Mohon maaf, Halaman nilai tidak tersedia untuk jenjang pendidikan Anda saat ini.
                      </Typography>
                    </div>
                  )}
                </Card>
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

export default Nilai;