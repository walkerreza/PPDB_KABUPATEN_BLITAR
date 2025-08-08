import React, { useState, useEffect } from 'react';
import { InputField } from '../../../components/forms/FormsVariant/Forms';
import { Switch } from "@material-tailwind/react";
import { MdUpload } from "react-icons/md";
import toast from 'react-hot-toast';

const BannerForm = ({ formData = {}, onChange, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (formData.gambar_banner) {
      if (formData.gambar_banner instanceof File) {
        setPreview(URL.createObjectURL(formData.gambar_banner));
      } else {
        setPreview(formData.gambar_banner);
      }
    }
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [formData.gambar_banner]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.checked ? 1 : 0; // 1 untuk aktif, 0 untuk tidak aktif
    onChange({ ...formData, status: newStatus });
  };

  const validateFile = (file) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return 'Ukuran file maksimal 2MB';
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Format file harus JPG, PNG, atau GIF';
    }

    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        setSelectedFile(null);
        onChange({ ...formData, gambar_banner: null });
        return;
      }

      setSelectedFile(file);
      setError('');
      onChange({
        ...formData,
        gambar_banner: file
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        setSelectedFile(null);
        onChange({ ...formData, gambar_banner: null });
        return;
      }

      setSelectedFile(file);
      setError('');
      onChange({
        ...formData,
        gambar_banner: file
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Judul */}
      <InputField
        label="Judul Banner"
        name="judul"
        value={formData.judul || ''}
        onChange={handleInputChange}
        required
        error={!formData.judul?.trim() ? 'Judul harus diisi' : ''}
      />

      {/* Status Switch */}
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.status === 1}
          onChange={handleStatusChange}
          label="Status"
          labelProps={{
            className: "text-sm font-normal"
          }}
        />
        <span className="text-sm text-gray-700">
          {formData.status === 1 ? 'Aktif' : 'Tidak Aktif'}
        </span>
      </div>

      {/* Area Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}
          transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Klik atau drop gambar baru untuk mengganti
            </p>
          </div>
        ) : (
          <>
            <MdUpload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Drag and drop gambar di sini, atau{' '}
                <span className="text-blue-500">pilih file</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Format yang didukung: JPG, PNG, GIF (Maks. 2MB)
              </p>
            </div>
          </>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default BannerForm;
