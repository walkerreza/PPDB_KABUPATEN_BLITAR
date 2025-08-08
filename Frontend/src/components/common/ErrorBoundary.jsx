import React from 'react';
import { useRouteError } from 'react-router-dom';

const ErrorBoundary = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Terjadi Kesalahan</h1>
        <p className="text-gray-600 mb-4">
          {error.message || 'Terjadi kesalahan yang tidak diketahui.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
