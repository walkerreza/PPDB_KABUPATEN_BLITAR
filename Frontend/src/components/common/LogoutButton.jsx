import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip, Typography } from "@material-tailwind/react";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import axios from 'axios';
import { toast } from 'react-toastify';

// Konfigurasi axios
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Ambil token dari storage
      const storage = localStorage.getItem('userData') ? localStorage : sessionStorage;
      const userData = JSON.parse(storage.getItem('userData'));

      if (userData?.token) {
        // Set token untuk request
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

        // Kirim request logout ke backend
        await axiosInstance.post('/login/logout');

        // Hapus data user dari storage
        storage.removeItem('userData');
        
        // Hapus header Authorization
        delete axiosInstance.defaults.headers.common['Authorization'];

        toast.success('Logout berhasil');

        // Redirect ke halaman login
        navigate('/');
      } else {
        // Jika tidak ada token, langsung redirect
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      if (error.response) {
        toast.error(error.response.data.message || 'Terjadi kesalahan saat logout');
      } else {
        toast.error('Terjadi kesalahan saat logout');
      }
    }
  };

  return (
    <Tooltip content="Logout" placement="bottom">
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-red-500 hover:bg-red-50/60 transition-colors"
      >
        <span className="text-sm font-medium">Logout</span>
        <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
      </button>
    </Tooltip>
  );
};

export default LogoutButton;
