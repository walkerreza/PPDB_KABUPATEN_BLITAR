import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PPDBChart = ({ data, jenjang }) => {
  const chartRef = useRef(null);

  // Optimasi: Menggunakan useMemo untuk memproses data chart hanya ketika data berubah
  const chartData = useMemo(() => {
    if (!data || !data.labels || !data.datasets) return data;
    
    // Tidak ada batasan jumlah sekolah, tampilkan semua data
    // Namun tambahkan warning jika data sangat banyak
    const isLargeDataset = data.labels.length > 50;
    
    if (isLargeDataset) {
      console.warn(`Rendering chart dengan ${data.labels.length} sekolah. Performa mungkin terpengaruh.`);
    }
    
    return {
      ...data,
      isLargeDataset
    };
  }, [data]);

  // Log untuk debugging
  useEffect(() => {
    if (jenjang === 'TK') {
      console.log('Rendering PPDBChart untuk TK dengan data:', data);
    }
    
    if (data?.labels?.length > 30) {
      console.log(`Menampilkan grafik dengan ${data.labels.length} sekolah`);
    }
  }, [data, jenjang]);

  // Optimasi: Konfigurasi chart untuk data besar
  const options = useMemo(() => {
    const isLargeDataset = data?.labels?.length > 30;
    
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      // Optimasi untuk dataset besar
      animation: isLargeDataset ? false : true, // Matikan animasi untuk dataset besar
      plugins: {
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 50,
            padding: 15,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          enabled: true,
          // Optimasi tooltip untuk dataset besar
          mode: isLargeDataset ? 'nearest' : 'point',
          intersect: !isLargeDataset
        }
      },
      scales: {
        x: {
          stacked: false,
          ticks: {
            precision: 0 // Hanya tampilkan nilai bulat
          }
        },
        y: {
          stacked: false,
          // Optimasi untuk dataset besar
          ticks: {
            autoSkip: isLargeDataset,
            maxTicksLimit: isLargeDataset ? 30 : 50,
            font: {
              size: isLargeDataset ? 9 : 11
            }
          }
        }
      }
    };
  }, [data]);

  // Menghitung tinggi yang dibutuhkan berdasarkan jumlah data
  const getChartHeight = () => {
    if (!chartData || !chartData.labels) return 400;
    
    const minHeight = 400; // Tinggi minimum
    const maxHeight = 2000; // Tinggi maksimum untuk mencegah chart terlalu panjang
    
    // Hitung tinggi berdasarkan jumlah sekolah
    const heightPerItem = chartData.labels.length > 30 ? 25 : 35; // Kurangi tinggi per item untuk data besar
    const legendHeight = jenjang === 'TK' ? 40 : 80; // Tinggi untuk legend
    const paddingHeight = 40; // Tinggi untuk padding
    
    const calculatedHeight = (chartData.labels.length * heightPerItem) + legendHeight + paddingHeight;
    return Math.min(maxHeight, Math.max(minHeight, calculatedHeight)); // Batasi tinggi antara min dan max
  };

  return (
    <div style={{
      height: `${getChartHeight()}px`,
      width: '100%',
      position: 'relative'
    }}>
      <Bar 
        ref={chartRef}
        data={chartData} 
        options={options}
      />
      
      {/* Tampilkan peringatan jika data sangat banyak */}
      {chartData?.isLargeDataset && (
        <div className="text-amber-600 text-sm mt-2 text-center">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          Menampilkan {chartData.labels.length} sekolah. Performa mungkin terpengaruh untuk dataset besar.
        </div>
      )}
    </div>
  );
};

PPDBChart.displayName = 'PPDBChart';

export default PPDBChart;
