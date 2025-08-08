import React from 'react';

const TableContainer = ({ children, title, subtitle, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-xl font-bold text-gray-900 font-calibri">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 font-calibri">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="rounded-lg border border-gray-200">
        <div className="min-w-full max-w-[calc(100vw-30rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TableContainer;
