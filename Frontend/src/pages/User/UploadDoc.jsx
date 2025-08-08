import React, { useState, useEffect } from 'react';
import { Card, Typography, Input, Checkbox } from "@material-tailwind/react";
import UserHeader from '../../components/common/User/UserHeader';
import UserSidebar from '../../components/common/User/UserSidebar';
import UserFooter from '../../components/common/User/UserFooter';
import { UploadButton } from '../../components/element/Button/variant';
import { BsPersonSquare } from "react-icons/bs";
import { UserGuard } from '../../utils/AuthGuard';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const UploadDoc = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dok_akta: null,
    dok_kk: null,
    dok_kis: null,
    dok_skhun: null,
    dok_skdomisili: null,
    dok_foto: null,
    pernyataan: false
  });
  const [previewImage, setPreviewImage] = useState('/images/default-avatar.png');
  const [uploadStatus, setUploadStatus] = useState({
    dok_akta: false,
    dok_kk: false,
    dok_kis: false,
    dok_skhun: false,
    dok_skdomisili: false,
    dok_foto: false
  });
  const [pendaftaranId, setPendaftaranId] = useState(null);
  const [documentUrls, setDocumentUrls] = useState({
    dok_akta: '',
    dok_kk: '',
    dok_kis: '',
    dok_skhun: '',
    dok_skdomisili: '',
    dok_foto: ''
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
    const fetchPendaftaranData = async () => {
      try {
        const userDataString = localStorage.getItem('userData');
        if (!userDataString) {
          toast.error('Silakan login terlebih dahulu');
          return;
        }

        const userData = JSON.parse(userDataString);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/user/${userData.id_user}`);
        
        console.log('Response from backend:', response.data); // Log response

        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          setPendaftaranId(data.id_pendaftaran);
          
          setUploadStatus({
            dok_akta: !!data.dok_akta,
            dok_kk: !!data.dok_kk,
            dok_kis: !!data.dok_kis,
            dok_skhun: !!data.dok_skhun,
            dok_skdomisili: !!data.dok_skdomisili,
            dok_foto: !!data.dok_foto
          });

          if (data.dok_foto) {
            setPreviewImage(`${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/foto/${data.dok_foto}`);
          }

          // Set document URLs
          setDocumentUrls({
            dok_akta: data.dok_akta ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/akta/${data.dok_akta}` : '',
            dok_kk: data.dok_kk ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/kk/${data.dok_kk}` : '',
            dok_kis: data.dok_kis ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/kis/${data.dok_kis}` : '',
            dok_skhun: data.dok_skhun ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/skhun/${data.dok_skhun}` : '',
            dok_skdomisili: data.dok_skdomisili ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/sk_domisili/${data.dok_skdomisili}` : '',
            dok_foto: data.dok_foto ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/foto/${data.dok_foto}` : ''
          });
        } else {
          toast.error('Data pendaftaran tidak ditemukan');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal mengambil data pendaftaran');
      }
    };

    fetchPendaftaranData();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file tidak boleh lebih dari 2MB');
        e.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipe file harus JPG, PNG, atau PDF');
        e.target.value = '';
        return;
      }

      if (field === 'dok_foto') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));

      setUploadStatus(prev => ({
        ...prev,
        [field]: true
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData(prev => ({
      ...prev,
      pernyataan: e.target.checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pendaftaranId) {
      toast.error('Data pendaftaran tidak ditemukan');
      return;
    }

    if (!formData.pernyataan) {
      toast.error('Anda harus menyetujui pernyataan terlebih dahulu');
      return;
    }

    // Show loading toast
    setLoading(true);
    const loadingToast = toast.loading('Sedang mengupload dokumen...');

    try {
      const formDataToSend = new FormData();

      // Mapping nama field ke nama kolom di database
      const fieldMapping = {
        dok_akta: 'dok_akta',
        dok_kk: 'dok_kk',
        dok_kis: 'dok_kis',
        dok_skhun: 'dok_skhun',
        dok_skdomisili: 'dok_skdomisili',
        dok_foto: 'dok_foto'
      };

      let fileCount = 0;
      const uploadedFiles = [];
      
      // Append files dengan nama field yang sesuai
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'pernyataan' && value instanceof File) {
          const dbField = fieldMapping[key];
          if (dbField) {
            formDataToSend.append(dbField, value);
            fileCount++;
            uploadedFiles.push(key.replace('dok_', '').toUpperCase());
          }
        }
      });

      if (fileCount === 0) {
        toast.dismiss(loadingToast);
        toast.error('Pilih minimal satu dokumen untuk diupload');
        setLoading(false);
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/pendaftaran/${pendaftaranId}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.dismiss(loadingToast);
        toast.success('Dokumen berhasil diupload!');
        
        // Show which files were uploaded
        if (uploadedFiles.length > 0) {
          toast.success(`Berhasil mengupload dokumen: ${uploadedFiles.join(', ')}`);
        }
        
        // Refresh data
        const refreshResponse = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/${pendaftaranId}`);
        if (refreshResponse.data.success && refreshResponse.data.data) {
          const data = refreshResponse.data.data;
          setUploadStatus({
            dok_akta: !!data.dok_akta,
            dok_kk: !!data.dok_kk,
            dok_kis: !!data.dok_kis,
            dok_skhun: !!data.dok_skhun,
            dok_skdomisili: !!data.dok_skdomisili,
            dok_foto: !!data.dok_foto
          });

          if (data.dok_foto) {
            setPreviewImage(`${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/foto/${data.dok_foto}`);
            toast.success('Foto profil berhasil diperbarui');
          }

          // Set document URLs
          setDocumentUrls({
            dok_akta: data.dok_akta ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/akta/${data.dok_akta}` : '',
            dok_kk: data.dok_kk ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/kk/${data.dok_kk}` : '',
            dok_kis: data.dok_kis ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/kis/${data.dok_kis}` : '',
            dok_skhun: data.dok_skhun ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/skhun/${data.dok_skhun}` : '',
            dok_skdomisili: data.dok_skdomisili ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/sk_domisili/${data.dok_skdomisili}` : '',
            dok_foto: data.dok_foto ? `${import.meta.env.VITE_API_URL}/content/uploads/pendaftaran/foto/${data.dok_foto}` : ''
          });
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error(response.data.message || 'Gagal mengupload dokumen');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error uploading documents:', error);
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat mengupload dokumen';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <UserHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <UserSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-4 md:p-8">
              <Card className="p-6">
                <Typography variant="h4" color="blue-gray" className="mb-4">
                  Upload Dokumen
                </Typography>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    <li>Dokumen yang diupload harus memiliki ukuran/format jpg, png atau pdf</li>
                    <li>File dokumen tidak lebih dari 2 mb disetiap satu file dalam bentuk pdf</li>
                    <li>Ukuran file yang diupload maksimal 2MB</li>
                  </ul>
                </div>

                <div className="flex gap-8">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-2 flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="small" color="blue-gray" className="font-medium w-1/3">
                          Akta Kelahiran
                        </Typography>
                        <div className="w-3/5 flex flex-col gap-1">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileChange(e, 'dok_akta')}
                            className="!border !border-gray-300 bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                              className: "hidden",
                            }}
                            containerProps={{ className: "min-w-[100px]" }}
                          />
                          {uploadStatus.dok_akta && (
                            <div className="text-xs text-gray-600">
                              Dokumen sudah diupload. Mengupload ulang dokumen akan menghapus dokumen sebelumnya
                            </div>
                          )}
                          {uploadStatus.dok_akta && documentUrls.dok_akta && (
                            <a 
                              href={documentUrls.dok_akta} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
                            >
                              Buka dokumen
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="small" color="blue-gray" className="font-medium w-1/3">
                          Kartu Keluarga
                        </Typography>
                        <div className="w-3/5 flex flex-col gap-1">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileChange(e, 'dok_kk')}
                            className="!border !border-gray-300 bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                              className: "hidden",
                            }}
                            containerProps={{ className: "min-w-[100px]" }}
                          />
                          {uploadStatus.dok_kk && (
                            <div className="text-xs text-gray-600">
                              Dokumen sudah diupload. Mengupload ulang dokumen akan menghapus dokumen sebelumnya
                            </div>
                          )}
                          {uploadStatus.dok_kk && documentUrls.dok_kk && (
                            <a 
                              href={documentUrls.dok_kk} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
                            >
                              Buka dokumen
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="small" color="blue-gray" className="font-medium w-1/3">
                          Kartu Identitas Anak
                        </Typography>
                        <div className="w-3/5 flex flex-col gap-1">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileChange(e, 'dok_kis')}
                            className="!border !border-gray-300 bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                              className: "hidden",
                            }}
                            containerProps={{ className: "min-w-[100px]" }}
                          />
                          {uploadStatus.dok_kis && (
                            <div className="text-xs text-gray-600">
                              Dokumen sudah diupload. Mengupload ulang dokumen akan menghapus dokumen sebelumnya
                            </div>
                          )}
                          {uploadStatus.dok_kis && documentUrls.dok_kis && (
                            <a 
                              href={documentUrls.dok_kis} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
                            >
                              Buka dokumen
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="small" color="blue-gray" className="font-medium w-1/3">
                          SKHUN
                        </Typography>
                        <div className="w-3/5 flex flex-col gap-1">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileChange(e, 'dok_skhun')}
                            className="!border !border-gray-300 bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                              className: "hidden",
                            }}
                            containerProps={{ className: "min-w-[100px]" }}
                          />
                          {uploadStatus.dok_skhun && (
                            <div className="text-xs text-gray-600">
                              Dokumen sudah diupload. Mengupload ulang dokumen akan menghapus dokumen sebelumnya
                            </div>
                          )}
                          {uploadStatus.dok_skhun && documentUrls.dok_skhun && (
                            <a 
                              href={documentUrls.dok_skhun} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
                            >
                              Buka dokumen
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="small" color="blue-gray" className="font-medium w-1/3">
                          Surat Keterangan Domisili   
                        </Typography>
                        <div className="w-3/5 flex flex-col gap-1">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileChange(e, 'dok_skdomisili')}
                            className="!border !border-gray-300 bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                              className: "hidden",
                            }}
                            containerProps={{ className: "min-w-[100px]" }}
                          />
                          {uploadStatus.dok_skdomisili && (
                            <div className="text-xs text-gray-600">
                              Dokumen sudah diupload. Mengupload ulang dokumen akan menghapus dokumen sebelumnya
                            </div>
                          )}
                          {uploadStatus.dok_skdomisili && documentUrls.dok_skdomisili && (
                            <a 
                              href={documentUrls.dok_skdomisili} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
                            >
                              Buka dokumen
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <Typography variant="small" color="blue-gray" className="font-medium w-1/3">
                          Foto Diri Terbaru Berwarna
                        </Typography>
                        <div className="w-3/5 flex flex-col gap-1">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileChange(e, 'dok_foto')}
                            className="!border !border-gray-300 bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                              className: "hidden",
                            }}
                            containerProps={{ className: "min-w-[100px]" }}
                          />
                          {uploadStatus.dok_foto && (
                            <div className="text-xs text-gray-600">
                              Dokumen sudah diupload. Mengupload ulang dokumen akan menghapus dokumen sebelumnya
                            </div>
                          )}
                          {uploadStatus.dok_foto && documentUrls.dok_foto && (
                            <a 
                              href={documentUrls.dok_foto} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700 whitespace-nowrap"
                            >
                              Buka dokumen
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="block sm:hidden">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center p-2 mx-auto my-4">
                        {previewImage === '/images/default-avatar.png' ? (
                          <BsPersonSquare className="w-full h-full text-gray-400" />
                        ) : (
                          <img
                            src={previewImage}
                            alt="Profile"
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.pernyataan}
                        onChange={(e) => setFormData({ ...formData, pernyataan: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Typography color="gray" className="font-normal ml-2">
                         Menyatakan dengan sesungguhnya bahwa seluruh informasi/dokumen yang saya berikan pada saat pendaftaran PPDB Online ini
                         adalah benar dan dapat dipertanggungjawabkan. Apabila data tersebut ternyata terbukti tidak benar dikemudian hari, maka saya siap
                         dibatalkan
                      </Typography>
                    </div>

                    <div className="flex justify-center mt-4">
                      <button
                        onClick={handleSubmit}
                        disabled={!formData.pernyataan || loading}
                        className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                          formData.pernyataan && !loading
                            ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                            <span>Mengupload...</span>
                          </div>
                        ) : (
                          'Upload Dokumen'
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="hidden sm:block">
                    <div className="w-72 h-72 bg-gray-100 rounded-lg flex items-center justify-center p-2">
                      {previewImage === '/images/default-avatar.png' ? (
                        <BsPersonSquare className="w-full h-full text-gray-400" />
                      ) : (
                        <img
                          src={previewImage}
                          alt="Profile"
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </main>

            <UserFooter />
          </div>
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
    </UserGuard>
  );
};

export default UploadDoc;