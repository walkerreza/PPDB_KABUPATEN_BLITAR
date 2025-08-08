import React from 'react';
import PropTypes from 'prop-types';

//tabel inputan untuk nilai dll

const TableForm = ({ 
  fields,
  values,
  onChange,
  inputType = "text"
}) => {
  return (
    <div className="w-full border border-gray-300 rounded">
      {/* Header */}
      <div className="grid grid-cols-3 border-b border-gray-300">
        {fields.map((field, index) => (
          <div 
            key={`header-${field.name}`}
            className={`px-4 py-2 text-center font-medium text-gray-700 text-sm
              ${index !== fields.length - 1 ? 'border-r border-gray-300' : ''}`}
          >
            {field.label}
          </div>
        ))}
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-3">
        {fields.map((field, index) => (
          <div 
            key={`input-${field.name}`}
            className={`p-1 ${index !== fields.length - 1 ? 'border-r border-gray-300' : ''}`}
          >
            <input
              type={inputType}
              name={field.name}
              value={values[field.name.split('.').pop()] || ''}
              onChange={onChange}
              className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none text-center"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

TableForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  inputType: PropTypes.string
};

export default TableForm;