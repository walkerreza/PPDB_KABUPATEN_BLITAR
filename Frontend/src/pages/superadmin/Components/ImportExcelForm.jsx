import React, { useState } from 'react';
import { Button, Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { MdUpload } from "react-icons/md";
import axios from 'axios';
import { toast } from 'react-toastify';

const ImportExcelForm = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setSelectedFile(file);
        setError('');
      } else {
        setSelectedFile(null);
        setError('File harus berupa Excel (.xlsx atau .xls)');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/dapodik/download/template`,
        { 
          headers: getHeaders(),
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_dapodik.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Gagal mengunduh template');
    }
  };

  const getHeaders = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return userData?.token ? {
      'Authorization': `Bearer ${userData.token}`,
      'Content-Type': 'multipart/form-data'
    } : {};
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pilih file Excel terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/dapodik/import`,
        formData,
        { headers: getHeaders() }
      );

      toast.success(response.data.message);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Gagal mengupload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="xl"
    >
      <DialogHeader className="justify-between">
        <h4 className="text-xl font-bold">Import Data dari Excel</h4>
        <button
          className="p-1 bg-transparent hover:bg-gray-100 rounded-full"
          onClick={onClose}
        >
          ✕
        </button>
      </DialogHeader>

      <DialogBody className="overflow-y-auto">
        <div className="space-y-4">
          {/* Area Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <MdUpload className="mx-auto text-4xl mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              Drag and drop file Excel di sini, atau klik untuk pilih file
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Format yang didukung: .xlsx, .xls
            </p>
          </div>

          {/* Nama File Terpilih */}
          {selectedFile && (
            <p className="text-sm text-gray-600">
              File terpilih: {selectedFile.name}
            </p>
          )}

          {/* Pesan Error */}
          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          {/* Download Template */}
          <div className="text-center">
            <button
              onClick={handleDownloadTemplate}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Download Template Excel
            </button>
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-4 mt-4">
            <Button 
              color="red" 
              variant="text" 
              onClick={onClose}
              disabled={loading}
            >
              BATAL
            </Button>
            <Button 
              color="blue"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? 'MENGIMPOR...' : 'SIMPAN'}
            </Button>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
};

export default ImportExcelForm;