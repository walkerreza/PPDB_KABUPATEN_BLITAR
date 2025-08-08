import React from 'react';
import PropTypes from 'prop-types';

// Input Field Component
export const InputField = ({ 
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  className,
  error,
  label,
  required,
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

InputField.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool
};

// Select Field Component
export const SelectField = ({
  name,
  value,
  onChange,
  options,
  placeholder,
  className,
  error,
  label,
  required,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

SelectField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool
};

// TextArea Field Component
export const TextAreaField = ({
  name,
  value,
  onChange,
  placeholder,
  className,
  error,
  label,
  required,
  rows = 4,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full text-sm tracking-wider
        leading-relaxed shadow-sm ${error ? 'border-red-500' : ''} ${className}`}
        style={{
          fontSize: '0.875rem',
          maxWidth: '100%',
          borderRadius: '5px',
          border: '1px solid #ccc',
         
        }}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

TextAreaField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  rows: PropTypes.number
};

// Checkbox Field Component
export const CheckboxField = ({
  name,
  checked,
  onChange,
  label,
  className,
  error,
  ...props
}) => {
  return (
    <div className="flex items-center mb-4">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {label && (
        <label className="ml-2 block text-sm text-gray-700" htmlFor={name}>
          {label}
        </label>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

CheckboxField.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.string
};