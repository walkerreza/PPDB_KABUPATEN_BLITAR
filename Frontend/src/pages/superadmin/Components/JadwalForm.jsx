import React, { useEffect, useState } from 'react';
import { InputField, TextAreaField } from '../../../components/forms/FormsVariant/Forms';
import { Switch } from "@material-tailwind/react";
import moment from 'moment';

const JadwalForm = ({ formData = {}, onChange }) => {
  const [localFormData, setLocalFormData] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    event: '',
    status: 0
  });

  const [touched, setTouched] = useState({
    tanggal_mulai: false,
    tanggal_selesai: false,
    event: false
  });

  const [errors, setErrors] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    event: ''
  });

  useEffect(() => {
    if (formData) {
      // Konversi status ke number
      const status = typeof formData.status === 'string' 
        ? Number(formData.status) 
        : (formData.status ?? 0);

      setLocalFormData({
        tanggal_mulai: formData.tanggal_mulai || '',
        tanggal_selesai: formData.tanggal_selesai || '',
        event: formData.event || '',
        status: status
      });

      // Reset touched state saat form data berubah
      setTouched({
        tanggal_mulai: false,
        tanggal_selesai: false,
        event: false
      });

      // Reset errors
      setErrors({
        tanggal_mulai: '',
        tanggal_selesai: '',
        event: ''
      });
    }
  }, [formData]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'event':
        if (!value?.trim()) {
          error = 'Nama event harus diisi';
        } else if (value.trim().length < 3) {
          error = 'Nama event minimal 3 karakter';
        }
        break;
      case 'tanggal_mulai':
        if (!value) {
          error = 'Tanggal mulai harus diisi';
        } else if (localFormData.tanggal_selesai && moment(value).isAfter(localFormData.tanggal_selesai)) {
          error = 'Tanggal mulai harus sebelum tanggal selesai';
        }
        break;
      case 'tanggal_selesai':
        if (!value) {
          error = 'Tanggal selesai harus diisi';
        } else if (localFormData.tanggal_mulai && moment(localFormData.tanggal_mulai).isAfter(value)) {
          error = 'Tanggal selesai harus setelah tanggal mulai';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update local state
    const updatedFormData = {
      ...localFormData,
      [name]: value
    };
    setLocalFormData(updatedFormData);

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }

    // Kirim data ke parent
    onChange({
      ...formData,
      [name]: value,
      errors: {
        ...errors,
        [name]: error
      }
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate on blur
    const error = validateField(name, localFormData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleStatusChange = () => {
    // Toggle status antara 0 dan 1
    const newStatus = localFormData.status === 1 ? 0 : 1;
    
    // Update local state
    setLocalFormData(prev => ({
      ...prev,
      status: newStatus
    }));

    // Kirim ke parent component
    onChange({
      ...formData,
      status: String(newStatus) // Konversi ke string untuk konsistensi
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            type="datetime-local"
            label="Tanggal Mulai"
            name="tanggal_mulai"
            value={localFormData.tanggal_mulai}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            error={touched.tanggal_mulai ? errors.tanggal_mulai : ''}
          />

          <InputField
            type="datetime-local"
            label="Tanggal Selesai"
            name="tanggal_selesai"
            value={localFormData.tanggal_selesai}
            onChange={handleInputChange}
            onBlur={handleBlur}
            required
            error={touched.tanggal_selesai ? errors.tanggal_selesai : ''}
          />
        </div>

        <TextAreaField
          type="text"
          label="Event"
          name="event"
          value={localFormData.event}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          error={touched.event ? errors.event : ''}
          readOnly={formData.is_public === 1}
          className={formData.is_public === 1 ? 'bg-gray-100' : ''}
        />
        <div className="flex items-center gap-2">
          <Switch
            label={localFormData.status === 1 ? "Aktif" : "Non-aktif"}
            checked={localFormData.status === 1}
            onChange={handleStatusChange}
            color="green"
          />
          <span className="text-sm text-gray-700">
            {localFormData.status === 1 ? "Aktif" : "Non-aktif"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JadwalForm;
