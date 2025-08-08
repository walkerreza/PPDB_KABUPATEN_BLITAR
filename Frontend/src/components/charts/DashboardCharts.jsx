import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Line Chart Component
export const LineChart = ({ data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Grafik Pendaftaran per Hari',
      },
    },
  };

  return <Line options={{ ...defaultOptions, ...options }} data={data} />;
};

// Bar Chart Component
export const BarChart = ({ data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistik Pendaftaran per Sekolah',
      },
    },
  };

  return <Bar options={{ ...defaultOptions, ...options }} data={data} />;
};

// Pie Chart Component
export const PieChart = ({ data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribusi Pendaftar',
      },
    },
  };

  return <Pie options={{ ...defaultOptions, ...options }} data={data} />;
};

// Contoh data untuk Line Chart
export const lineChartData = {
  labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
  datasets: [
    {
      label: 'Jumlah Pendaftar',
      data: [12, 19, 3, 5, 2, 3, 7],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.3,
    },
  ],
};

// Contoh data untuk Bar Chart
export const barChartData = {
  labels: ['SMAN 1', 'SMAN 2', 'SMAN 3', 'SMAN 4', 'SMAN 5'],
  datasets: [
    {
      label: 'Jumlah Pendaftar',
      data: [65, 59, 80, 81, 56],
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
  ],
};

// Contoh data untuk Pie Chart
export const pieChartData = {
  labels: ['Laki-laki', 'Perempuan'],
  datasets: [
    {
      data: [300, 200],
      backgroundColor: [
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 99, 132, 0.5)',
      ],
      borderColor: [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
      ],
      borderWidth: 1,
    },
  ],
};
