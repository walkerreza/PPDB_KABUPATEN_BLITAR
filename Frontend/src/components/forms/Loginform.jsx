import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { asset } from '../../assets/asset';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from "axios";
import { toast } from "react-toastify";

// Konfigurasi axios
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const Loginform = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Selalu true sebagai pajangan
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  // Fungsi untuk memeriksa apakah token sudah expired
  const isTokenExpired = (tokenExpiredTime) => {
    if (!tokenExpiredTime) return true;
    const expiredTime = new Date(tokenExpiredTime).getTime();
    const currentTime = new Date().getTime();
    return currentTime >= expiredTime;
  };

  // Fungsi untuk membersihkan localStorage
  const clearLocalStorage = () => {
    localStorage.removeItem('userData');
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  // Cek jika user sudah login
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        
        // Cek apakah data lengkap
        if (!parsedData || !parsedData.token || !parsedData.token_expired) {
          clearLocalStorage();
          return;
        }

        // Cek apakah token expired
        if (isTokenExpired(parsedData.token_expired)) {
          toast.error("Sesi anda telah berakhir. Silakan login kembali.");
          clearLocalStorage();
          return;
        }

        // Set header authorization
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${parsedData.token}`;
        
        // Redirect ke halaman sesuai role
        redirectBasedOnRole(parsedData.id_grup_user);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      clearLocalStorage();
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username tidak boleh kosong";
    }
    if (!formData.password) {
      newErrors.password = "Password tidak boleh kosong";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const redirectBasedOnRole = (id_grup_user) => {
    const from = location.state?.from?.pathname;
    switch(parseInt(id_grup_user)) {
      case 1: // Dinas
        navigate(from || '/superadmin/');
        break;
      case 2: // Sekolah
        navigate(from || '/admin/');
        break;
      case 3: // Pendaftar
        navigate(from || '/user/');
        break;
      case 4: // Operator Bidang PAUD/TK
        navigate(from || '/superadmin/');
        break;
      case 5: // Operator Bidang SD
        navigate(from || '/superadmin/');
        break;
      case 6: // Operator Bidang SMP
        navigate(from || '/superadmin/');
        break;
      default:
        navigate(from || '/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/login', formData);

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }

      const { data } = response.data;

      // Bersihkan storage yang ada
      clearLocalStorage();

      // Simpan data user ke localStorage
      const userData = {
        // Data utama user
        id_user: data.id_user,
        username: data.username,
        fullname: data.fullname,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        email: data.email,
        status: data.status,
        
        // Data relasi
        id_jenis_kelamin: data.id_jenis_kelamin,
        jenis_kelamin: data.jenis_kelamin,
        id_grup_user: data.id_grup_user,
        id_sekolah: data.id_sekolah,
        sekolah: data.sekolah,

        // Data session
        token: data.token,
        token_expired: data.token_expired,
        session_id: data.session_id,
        last_login: new Date().toISOString()
      };

      // Simpan ke localStorage
      localStorage.setItem("userData", JSON.stringify(userData));

      // Set header authorization
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      toast.success("Login berhasil! Selamat datang kembali!");
      
      // Redirect berdasarkan grup user
      redirectBasedOnRole(data.id_grup_user);

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data.message;
        
        switch (error.response.status) {
          case 401:
            toast.error(errorMessage || "Username atau password salah");
            setErrors({ auth: "Username atau password salah" });
            break;
          case 400:
            toast.error(errorMessage || "Data yang dimasukkan tidak valid");
            if (error.response.data.errors) {
              setErrors(error.response.data.errors);
            }
            break;
          case 500:
            toast.error(errorMessage || "Terjadi kesalahan pada server");
            break;
          default:
            toast.error(errorMessage || "Terjadi kesalahan saat login");
        }
      } else if (error.request) {
        toast.error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        toast.error(error.message || "Terjadi kesalahan saat login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <motion.div 
        className="absolute inset-0"
        animate={{ scale: 1.1 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
      >
        <img
          src={asset.banner_fix}
          alt="Classroom"
          className="w-full h-full object-cover brightness-50"
        />
      </motion.div>

      {/* Animated Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-blue-800/30" />

      {/* Login Form */}
      <motion.div 
        className="relative w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-8 border border-white/20">
          <motion.div 
            className="text-center mb-4 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Logo */}
            <motion.div
              className="flex justify-center mb-2 sm:mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <img 
                src={asset.Logo_blitar} 
                alt="Logo Blitar" 
                className="w-full h-auto object-contain max-w-[150px] sm:max-w-[200px] mx-auto"
              />
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1 sm:mb-2">
              Login PPDB
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Masuk ke akun PPDB Anda</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Username Input */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className={`h-4 w-4 text-base ${errors.username ? 'text-red-500' : 'text-gray-700 group-hover:text-blue-600'} transition-colors duration-300`} />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}   
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 sm:py-3 border-2 ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50 transition-all duration-300 hover:bg-white/80 cursor-pointer text-sm sm:text-base`}
                placeholder="Username"
                required
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              )}
            </motion.div>

            {/* Password Input */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className={`h-5 w-5 text-base ${errors.password ? 'text-red-500' : 'text-gray-700 group-hover:text-blue-600'}`} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-12 py-2 sm:py-3 border-2 ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-600'
                } rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50 transition-all duration-300 hover:bg-white/80 cursor-pointer text-sm sm:text-base`}
                placeholder="Password"
                required
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors duration-300" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors duration-300" />
                )}
              </button>
            </motion.div>

            {/* Remember Me Checkbox (Pajangan) */}
            <motion.div 
              className="flex items-center ml-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-xs sm:text-sm text-gray-700">
                Remember me
              </label>
            </motion.div>

            {/* General Auth Error */}
            {errors.auth && (
              <motion.div
                className="text-center text-red-500 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {errors.auth}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-300 via-blue-700 to-blue-800 text-white py-2 sm:py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-900 transition duration-300 flex items-center justify-center group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              disabled={isLoading}
            >
              <span className="font-semibold text-sm sm:text-base md:text-lg">
                {isLoading ? "Loading..." : "Masuk"}
              </span>
            </motion.button>
          </form>

          {/* Links */} 
          <motion.div 
            className="mt-4 sm:mt-8 text-center space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <p className="text-sm sm:text-base text-black">Belum punya akun ?</p>
            <Link 
              to="/buat-akun" 
              className="block text-blue-600 hover:text-blue-700 transition-all ease-in-out duration-500 hover:scale-105 text-sm sm:text-base"
            >
              Daftar sekarang
            </Link>
    
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-20 h-20 sm:w-40 sm:h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-10 -left-10 w-20 h-20 sm:w-40 sm:h-40 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Loginform;