import React from 'react'
import Navbar from '../components/common/Navbar'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { asset } from '../assets/asset' 
import { Carousel } from "@material-tailwind/react";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy, FaExchangeAlt, FaUsers } from 'react-icons/fa';
// import { jadwalSD, jadwalSMP } from '../components/element/inputs/Jadwal';
import { useState, useEffect } from 'react';
import moment from 'moment';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  // Cek apakah user sudah login
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
  
  // Redirect ke halaman sesuai dengan peran pengguna jika sudah login
  if (userData && userData.token) {
    const id_grup_user = parseInt(userData.id_grup_user);
    
    switch(id_grup_user) {
      case 1: // Dinas
        return <Navigate to="/superadmin" replace />;
      case 2: // Sekolah
        return <Navigate to="/admin" replace />;
      case 3: // Pendaftar
        return <Navigate to="/user" replace />;
      case 4: // Operator Bidang PAUD/TK
      case 5: // Operator Bidang SD
      case 6: // Operator Bidang SMP
      case 7: // Operator Bidang KEMENAG
        return <Navigate to="/superadmin" replace />;
    }
  }
  
  // State untuk news ticker
  const [newsTickers, setNewsTickers] = useState([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // Fetch data news ticker
  const fetchNewsTickers = async () => {
    try {
      setIsLoadingNews(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/news-ticker`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data news ticker');
      }
      
      const data = await response.json();
      // Filter hanya news ticker yang aktif
      const activeNews = data.filter(news => news.status === 1);
      setNewsTickers(activeNews);
    } catch (error) {
      console.error('Error fetching news tickers:', error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Fetch news ticker saat komponen mount
  useEffect(() => {
    fetchNewsTickers();
  }, []);

  // Efek untuk rotasi news ticker
  useEffect(() => {
    if (newsTickers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % newsTickers.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [newsTickers.length]);

  // State untuk banner
  const [banners, setBanners] = useState([]);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);

  // State untuk menyimpan rasio gambar
  const [imageRatios, setImageRatios] = useState({});

  // Fungsi untuk mengecek rasio gambar
  const checkImageRatio = (imageUrl, bannerId) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      setImageRatios(prev => ({
        ...prev,
        [bannerId]: ratio
      }));
    };
    img.src = imageUrl;
  };

  // Fetch data banner
  const fetchBanners = async () => {
    try {
      setIsLoadingBanner(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/banner`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data banner');
      }
      
      const data = await response.json();
      // Filter hanya banner yang aktif
      const activeBanners = data.filter(banner => banner.status === 1);
      setBanners(activeBanners);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setIsLoadingBanner(false);
    }
  };

  // Fetch banner saat komponen mount
  useEffect(() => {
    fetchBanners();
  }, []);

  // Effect untuk mengecek rasio gambar saat banners berubah
  useEffect(() => {
    banners.forEach(banner => {
      const imageUrl = `${import.meta.env.VITE_BASE_URL}${banner.gambar}`;
      checkImageRatio(imageUrl, banner.id_banner);
    });
  }, [banners]);

  // Fungsi untuk menentukan object-fit berdasarkan rasio
  const getObjectFit = (bannerId) => {
    const ratio = imageRatios[bannerId];
    if (!ratio) return 'contain'; // default ke contain jika ratio belum tersedia
    
    // Jika gambar lebih lebar dari 16:9, gunakan contain
    return ratio > 16/9 ? 'contain' : 'cover';
  };

  // State untuk jadwal
  const [jadwalList, setJadwalList] = useState([]);
  const [loadingJadwal, setLoadingJadwal] = useState(true);

  // Fungsi untuk mengambil data jadwal
  const fetchJadwal = async () => {
    try {
      setLoadingJadwal(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data jadwal');
      }

      const result = await response.json();
      console.log('Raw response:', result);
      
      // Ambil data dari result.data
      const jadwalData = result.data || [];
      console.log('Jadwal data:', jadwalData);

      // Filter jadwal yang aktif dan urutkan berdasarkan tanggal
      const activeJadwal = jadwalData
        .filter(jadwal => jadwal.status === 1 && jadwal.is_public === 0)
        .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai));

      setJadwalList(activeJadwal);
    } catch (error) {
      console.error('Error fetching jadwal:', error);
      setJadwalList([]);
    } finally {
      setLoadingJadwal(false);
    }
  };

  // Panggil fetchJadwal saat komponen dimount
  useEffect(() => {
    fetchJadwal();
  }, []);

  // Fungsi untuk format tanggal
  const formatDateRange = (startDate, endDate) => {
    const start = moment(startDate).format('DD-MM-YYYY');
    const end = moment(endDate).format('DD-MM-YYYY');
    return `${start} s/d ${end}`;
  };

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      {/* Header */}
      <Header />
      <Navbar />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/4 md:w-1/6">
            <div className="bg-red-500 text-white p-2 sm:p-4 rounded-md">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-center">INFORMASI</h3>
            </div>
          </div>
          <div className="w-full sm:w-3/4 md:w-5/6 bg-white rounded-md shadow-sm overflow-hidden">
            <style jsx>{`
              @keyframes slideUp {
                0% {
                  transform: translateY(100%);
                  opacity: 0;
                }
                10% {
                  transform: translateY(0);
                  opacity: 1;
                }
                90% {
                  transform: translateY(0);
                  opacity: 1;
                }
                100% {
                  transform: translateY(-100%);
                  opacity: 0;
                }
              }
              .announcement-slide {
                animation: slideUp 3s ease-in-out;
              }
            `}</style>
            <div className="p-2 sm:p-4">
              {isLoadingNews ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              ) : newsTickers.length > 0 ? (
                <div key={currentNewsIndex} className="announcement-slide">
                  <p className="text-base sm:text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
                    {newsTickers[currentNewsIndex].deskripsi}
                  </p>
                </div>
              ) : (
                <p className="text-center text-gray-500">Tidak ada informasi saat ini</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Carousel
          className="rounded-xl shadow-xl h-[300px] sm:h-[400px]"
          autoplay={true}
          autoplayDelay={5000}
          loop={true}
          navigation={({ setActiveIndex, activeIndex, length }) => (
            <div className="absolute bottom-4 left-2/4 z-50 flex -translate-x-2/4 gap-1 sm:gap-2">
              {new Array(length).fill("").map((_, i) => (
                <span
                  key={i}
                  className={`block h-1 cursor-pointer rounded-2xl transition-all content-[''] ${
                    activeIndex === i ? "w-6 sm:w-8 bg-white" : "w-3 sm:w-4 bg-white/50"
                  }`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}
        >
          {isLoadingBanner ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : banners.length > 0 ? (
            banners.map((banner) => (
              <div key={banner.id_banner} className="w-full h-full bg-white flex items-center justify-center">
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${banner.gambar}`}
                  alt={banner.judul}
                  className={`w-full h-full ${getObjectFit(banner.id_banner) === 'contain' ? 'object-contain' : 'object-cover'}`}
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Tidak ada banner aktif</p>
            </div>
          )}
        </Carousel>
      </div>

      {/* Jadwal Pendaftaran Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-4 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4">
          {/* Header with Cyan Background */}
          <div className="bg-[#14b8a6] p-2 sm:p-4 rounded-t-2xl shadow-lg">
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Jadwal Pendaftaran
              </h2>
            </div>
          </div>

          {/* Content with White Background */}
          <div className="bg-white rounded-b-2xl shadow-lg p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row">
              <div className="hidden sm:block mr-4">
                <svg className="w-12 sm:w-16 h-12 sm:h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="20" x="2" y="2" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 8h20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 4V2M17 4V2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="overflow-x-auto w-full">
                {loadingJadwal ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]"></div>
                  </div>
                ) : jadwalList.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Tanggal</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Event</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jadwalList.map((jadwal, index) => (
                        <tr key={jadwal.id_jadwal_pendaftaran} className="hover:bg-gray-50 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-800 whitespace-normal sm:whitespace-nowrap">
                            {formatDateRange(jadwal.tanggal_mulai, jadwal.tanggal_selesai)}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-base text-gray-700">
                            {jadwal.event}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada jadwal pendaftaran yang aktif
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tentang PPDB Section */}
      <div className="bg-white py-8 sm:py-16">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="text-center mb-8">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
              TENTANG PPDB KABUPATEN BLITAR
            </h2>
            <div className="w-12 h-1 bg-blue-600 mx-auto rounded-full mb-4"></div>
            <p className="max-w-4xl mx-auto text-gray-600 sm:text-base leading-relaxed mb-8">
              Sistem Informasi Managemen PPDB (SIM-PPDB) ini menangani penerimaan peserta didik baru jenjang SD Negeri dan SMP Negeri di Kabupaten Blitar. SIM-PPDB ini menangani proses pendataan, pendaftaran dan pengumuman jalur domisili. Sejumlah fitur/modul dalam SIM-PPDB ini disediakan untuk operator sekolah dan sebuah fitur pendaftaran/pengumuman disediakan untuk masyarakat/orang tua/wali peserta seleksi.
            </p>
            <p className="max-w-4xl mx-auto text-gray-600 leading-relaxed mb-8">
              Seleksi PPDB Kabupaten Blitar tahun pelajaran 2024-2025 pada jenjang SD dilaksanakan dalam melalui jalur apresiasi (offline), jalur afirmasi, jalur perpindahan/tempat tugas orang tua dan jalur domisili, sedangkan pada jenjang SMP dilaksanakan melalui 4 (tiga) jalur yaitu : jalur prestasi akademik dan non akademi, jalur afirmasi, jalur perpindahan / mutasi dan jalur domisili.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {/* Jalur Domisili */}
            <div className="bg-white rounded-xl shadow-lg p-4 transform transition-all hover:scale-105 duration-300">
              <div className="-mx-4 -mt-4 mb-2">
                <img src={asset.zonasi} alt="" className='w-full h-auto rounded-[5%]'/>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-center mb-2">JALUR DOMISILI <br /><br /></h3>
              <p className="text-gray-600 text-sm text-center text-justify">
                Jalur PPDB untuk jenjang SD dan SMP yang ditentukan berdasarkan jarak tempat tinggal/domisili calon peserta didik dengan Sekolah terdekat.
                <span className="hidden" id="jalur-zonasi">
                  Domisili calon peserta didik sesuai alamat pada kartu keluarga. Penentuan jarak terdekat menggunakan aplikasi map.
                  Pendaftaran dilaksanakan secara online.
                </span>
              </p>
              <button 
                onClick={() => {
                  const element = document.getElementById('jalur-zonasi');
                  element.classList.toggle('hidden');
                  event.target.textContent = element.classList.contains('hidden') ? 'Lihat selengkapnya' : 'Sembunyikan';
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Lihat selengkapnya
              </button>
            </div>

            {/* Jalur Prestasi */}
            <div className="bg-white rounded-xl shadow-lg p-4 transform transition-all hover:scale-105 duration-300">
              <div className="-mx-4 -mt-4 mb-2">
                <img src={asset.prestasi} alt="" className='w-full h-auto rounded-[5%]'/>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-center mb-2">JALUR PRESTASI DAN APRESIASI</h3>
              <p className="text-gray-600 text-sm text-center text-justify">
                Jalur PPDB untuk jenjang SMP yang ditentukan berdasarkan nilai ujian Sekolah berstandar nasional dan/atau hasil perlombaan atau penghargaan di bidang akademik maupun non akademik pada tingkat internasional, tingkat nasional, tingkat provinsi dan/atau tingkat kabupaten/kota.<span className="hidden" id="jalur-prestasi"> Peserta didik yang masuk melalui jalur Prestasi merupakan peserta didik yang berdomisili di luar zonasi Sekolah yang bersangkutan. Pendaftaran dilaksanakan secara offline di Sekolah yang dituju.</span>
              </p>
              <button 
                onClick={() => {
                  const element = document.getElementById('jalur-prestasi');  
                  element.classList.toggle('hidden');
                  event.target.textContent = element.classList.contains('hidden') ? 'Lihat selengkapnya' : 'Sembunyikan';
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Lihat selengk apnya
              </button>
            </div>

            {/* Jalur Perpindahan */}
            <div className="bg-white rounded-xl shadow-lg p-4 transform transition-all hover:scale-105 duration-300">
              <div className="-mx-4 -mt-4 mb-2">
                <img src={asset.zonasi_khusus} alt="" className='w-full h-auto rounded-[5%]'/>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-center mb-2">JALUR PERPINDAHAN / MUTASI </h3>
              <p className="text-gray-600 text-sm text-center text-justify">
              Jalur PPDB untuk jenjang SD dan SMP dapat diikuti oleh calon peserta didik yang berdomisili di luar zonasi Sekolah yang bersangkutan. <span className="hidden" id="jalur-perpindahan"> Perpindahan/mutasi dibuktikan dengan surat penugasan dan instansi, lembaga, kantor, atau perusahaan yang mempekerjakan.</span>

              </p>
               <button 
                onClick={() => {
                  const element = document.getElementById('jalur-perpindahan');
                  element.classList.toggle('hidden');
                  event.target.textContent = element.classList.contains('hidden') ? 'Lihat selengkapnya' : 'Sembunyikan';
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Lihat selengkapnya
              </button>
            </div>

            {/* Jalur Afirmasi */}
            <div className="bg-white rounded-xl shadow-lg p-4 transform transition-all hover:scale-105 duration-300">
              <div className="-mx-4 -mt-4 mb-2">
                <img src={asset.afirmasi} alt="" className='w-full h-auto rounded-[5%]'/>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-center mb-2">JALUR AFIRMASI <br /><br /></h3>
              <p className="text-gray-600 text-sm text-center text-justify">
              Jalur PPDB untuk jenjang SD dan SMP yang ditujukan bagi calon peserta didik dari keluarga tidak mampu yang berdomisili di dalam zonasi <span className="hidden" id="jalur-afirmasi">maupun di luar zonasi dan dibuktikan dengan keikutsertaan calon peserta didik dalam program penanganan keluarga tidak mampu dari Pemerintah Pusat atau Pemerintah Daerah.</span>
              </p>
              <button 
                onClick={() => {
                  const element = document.getElementById('jalur-afirmasi');
                  element.classList.toggle('hidden');
                  event.target.textContent = element.classList.contains('hidden') ? 'Lihat selengkapnya' : 'Sembunyikan';
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Lihat selengkapnya
              </button>
            </div>

                   {/* Jalur Reguler */}
                   <div className="bg-white rounded-xl shadow-lg p-4 transform transition-all hover:scale-105 duration-300">
              <div className="-mx-4 -mt-4 mb-2">
                <img src={asset.afirmasi} alt="" className='w-full h-auto rounded-[5%]'/>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-center mb-2">JALUR REGULER <br /><br /></h3>
              <p className="text-gray-600 text-sm text-center text-justify">
                Jalur PPDB untuk jenjang TK/RA yang diperuntukkan bagi seluruh calon peserta didik tanpa mempertimbangkan zonasi atau kriteria khusus. <span className="hidden" id="jalur-reguler">Pendaftaran dilakukan secara langsung di sekolah yang dituju dengan memenuhi persyaratan administrasi yang telah ditetapkan oleh masing-masing sekolah.</span>
              </p>
              <button 
                onClick={() => {
                  const element = document.getElementById('jalur-reguler');
                  element.classList.toggle('hidden');
                  event.target.textContent = element.classList.contains('hidden') ? 'Lihat selengkapnya' : 'Sembunyikan';
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Lihat selengkapnya
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;