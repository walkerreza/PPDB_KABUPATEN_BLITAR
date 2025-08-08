import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from "@material-tailwind/react";
import Navbar from '../components/common/Navbar';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PPDBChart from '../components/charts/PPDBChart';
import { getPPDBData } from '../services/ppdbService';
import { formatChartData } from '../utils/chartUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import { asset } from '../assets/asset';

function GrafikHome() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Gunakan satu state object untuk semua data chart
  const [chartData, setChartData] = useState({
    tk: null,
    sd: null,
    smp: null
  });

  // Fungsi untuk mengambil data dengan timeout
  const fetchDataWithTimeout = useCallback(async (jenjang, timeout = 60000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`Mulai mengambil data ${jenjang}...`);
      const data = await getPPDBData(jenjang);
      clearTimeout(timeoutId);
      
      console.log(`Data ${jenjang} berhasil diambil:`, data.length, 'sekolah');
      return data;
    } catch (error) {
      console.error(`Error saat mengambil data ${jenjang}:`, error);
      if (error.name === 'AbortError') {
        throw new Error(`Pengambilan data ${jenjang} timeout setelah ${timeout/1000} detik`);
      }
      throw error;
    }
  }, []);

  // Fungsi untuk memuat data berdasarkan jenjang
  const loadDataForJenjang = useCallback(async (jenjang) => {
    try {
      setError(null);
      const data = await fetchDataWithTimeout(jenjang);
      
      setChartData(prevData => ({
        ...prevData,
        [jenjang.toLowerCase()]: data
      }));
      
      return true;
    } catch (error) {
      console.error(`Error loading data for ${jenjang}:`, error);
      setError(`Gagal memuat data ${jenjang}: ${error.message}`);
      return false;
    }
  }, [fetchDataWithTimeout]);

  // Fungsi untuk memuat semua data secara bertahap
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Prioritaskan tab yang aktif terlebih dahulu
      const jenjangOrder = ['TK', 'SD', 'SMP'];
      const activeJenjang = jenjangOrder[activeTab];
      
      // Muat data untuk tab aktif terlebih dahulu
      await loadDataForJenjang(activeJenjang);
      
      // Kemudian muat data untuk tab lainnya secara berurutan
      for (const jenjang of jenjangOrder) {
        if (jenjang !== activeJenjang) {
          await loadDataForJenjang(jenjang);
        }
      }
    } catch (error) {
      console.error('Error loading all data:', error);
      setError(`Gagal memuat data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadDataForJenjang]);

  // Memuat data saat komponen dimount
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize data chart yang aktif untuk mencegah re-render yang tidak perlu
  const activeChartData = useMemo(() => {
    const jenjang = ['TK', 'SD', 'SMP'][activeTab];
    const rawData = chartData[jenjang.toLowerCase()];
    
    if (!rawData) return null;
    
    console.log(`Memformat data chart untuk ${jenjang} dengan ${rawData.length} sekolah`);
    return formatChartData(rawData, jenjang);
  }, [activeTab, chartData]);

  // Handler untuk perubahan tab
  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <Navbar />

      {/* Banner Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={asset.banner1}
          alt="Banner Grafik"
          className="w-full h-full object-cover brightness-50 transform scale-105 hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            GRAFIK PPDB
          </h1>
          <div className="w-24 h-1 bg-blue-500 rounded-full animate-width"></div>
        </div>
      </div>

      {/* Grafik Content */}
      <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <Card className="w-full">
            {/* Header dengan Judul */}
            <div className="text-center py-2 sm:py-4 bg-gray-50 border-b">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                GRAFIK JUMLAH PAGU DAN PENDAFTAR
              </h2>
            </div>

            {/* Custom Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => handleTabChange(0)}
                className={`flex-1 py-2 sm:py-3 text-base sm:text-lg font-semibold transition-colors duration-200
                  ${activeTab === 0 
                    ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
              >
                Jenjang TK/RA
              </button>
              <button
                onClick={() => handleTabChange(1)}
                className={`flex-1 py-2 sm:py-3 text-base sm:text-lg font-semibold transition-colors duration-200
                  ${activeTab === 1 
                    ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
              >
                Jenjang SD/MI
              </button>
              <button
                onClick={() => handleTabChange(2)}
                className={`flex-1 py-2 sm:py-3 text-base sm:text-lg font-semibold transition-colors duration-200
                  ${activeTab === 2 
                    ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
              >
                Jenjang SMP/MTS
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {isLoading && !activeChartData ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                  <span className="ml-2">Memuat data...</span>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center p-4">
                  <p>{error}</p>
                  <button 
                    onClick={loadAllData} 
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <div>
                  {activeTab === 0 && activeChartData && (
                    <div className="w-full">
                      <PPDBChart data={activeChartData} jenjang="TK" />
                    </div>
                  )}
                  {activeTab === 1 && activeChartData && (
                    <div className="w-full">
                      <PPDBChart data={activeChartData} jenjang="SD" />
                    </div>
                  )}
                  {activeTab === 2 && activeChartData && (
                    <div className="w-full">
                      <PPDBChart data={activeChartData} jenjang="SMP" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Tampilkan pesan jika tidak ada data */}
          {!activeChartData && !error && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              Tidak ada data yang tersedia
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default GrafikHome;