import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from "@material-tailwind/react";
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import PPDBChart from '../../../components/charts/PPDBChart';
import { getPPDBData } from '../../../services/ppdbService';
import { formatChartData } from '../../../utils/chartUtils';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { SuperAdminGuard } from '../../../utils/AuthGuard';

function Grafik() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
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
            <div className="p-2 sm:p-4">
              <Card className="h-full w-[calc(100vw-16px)] sm:w-full overflow-x-auto shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                      GRAFIK JUMLAH PAGU DAN PENDAFTAR
                    </h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {isLoading ? (
                        <div className="flex items-center">
                          <LoadingSpinner />
                          <span className="ml-2 text-sm text-gray-600">Memuat...</span>
                        </div>
                      ) : (
                        <button 
                          onClick={loadAllData} 
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          <i className="fas fa-sync-alt mr-2"></i> Refresh
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Custom Tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => handleTabChange(0)}
                      className={`flex-1 py-2 text-base font-semibold transition-colors duration-200
                        ${activeTab === 0 
                          ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      Jenjang TK/RA
                    </button>
                    <button
                      onClick={() => handleTabChange(1)}
                      className={`flex-1 py-2 text-base font-semibold transition-colors duration-200
                        ${activeTab === 1 
                          ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      Jenjang SD/MI
                    </button>
                    <button
                      onClick={() => handleTabChange(2)}
                      className={`flex-1 py-2 text-base font-semibold transition-colors duration-200
                        ${activeTab === 2 
                          ? "bg-white text-blue-600 border-b-2 border-blue-600" 
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      Jenjang SMP/MTS
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4">
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
                </div>
              </Card>

              {/* Tampilkan pesan jika tidak ada data */}
              {!activeChartData && !error && !isLoading && (
                <div className="text-center text-gray-500 py-4">
                  Tidak ada data yang tersedia
                </div>
              )}
            </div>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
}

export default Grafik;