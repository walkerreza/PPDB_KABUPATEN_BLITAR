import React from 'react';
import { InputField } from '../../../components/forms/FormsVariant/Forms';
import { Switch } from "@material-tailwind/react";

const NewsTickerForm = ({ formData = {}, onChange, loading }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleStatusChange = (e) => {
    onChange({ ...formData, status: e.target.checked });
  };

  return (
    <div className="space-y-4">
      <InputField
        label="Judul"
        name="judul"
        value={formData.judul || ''}
        onChange={handleInputChange}
        placeholder="Masukkan judul news ticker"
        required
      />

      <InputField
        type="textarea"
        label="Deskripsi"
        name="deskripsi"
        value={formData.deskripsi || ''}
        onChange={handleInputChange}
        placeholder="Masukkan text news ticker"
        required
      />

      <div className="flex items-center gap-2">
        <Switch
          id="status"
          checked={!!formData.status}
          onChange={handleStatusChange}
          label="Status"
          disabled={loading}
        />
        <span className="text-sm text-gray-700">
          {formData.status ? 'Aktif' : 'Non Aktif'}
        </span>
      </div>
    </div>
  );
};

export default NewsTickerForm;
