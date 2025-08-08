import React from 'react';

const PerPageSelect = ({ 
  perPage = 10,
  perPageSelect = [1,5, 10, 15, 20, 25],
  onPerPageChange,
  labels = {
    perPage: 'per halaman'
  }
}) => {
  return (
    <div className="flex items-center space-x-2">
      <select
        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        value={perPage}
        onChange={(e) => onPerPageChange(Number(e.target.value))}
      >
        {perPageSelect.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-700">{labels.perPage}</span>
    </div>
  );
};

export default PerPageSelect;
