import React from 'react';

const TablePagination = ({ 
  totalItems,
  currentPage,
  perPage = 10,
  onPageChange,
  labels = {
    showing: 'Menampilkan',
    to: 'sampai',
    of: 'dari',
    entries: 'data'
  }
}) => {
  const totalPages = Math.ceil(totalItems / perPage);
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  // Fungsi untuk menentukan halaman yang ditampilkan
  const getVisiblePages = () => {
    const delta = 2; // Jumlah halaman yang ditampilkan di kiri dan kanan halaman aktif
    const range = [];
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    // Jika di awal, tampilkan lebih banyak di kanan
    if (currentPage <= delta) {
      end = Math.min(totalPages, 5);
    }
    
    // Jika di akhir, tampilkan lebih banyak di kiri
    if (currentPage > totalPages - delta) {
      start = Math.max(1, totalPages - 4);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      {/* Info Text */}
      <div className="text-sm text-gray-700">
        {labels.showing} {startItem} {labels.to} {endItem} {labels.of} {totalItems} {labels.entries}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center">
        <button
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>
        
        <div className="flex">
          {getVisiblePages().map((page) => (
            <button
              key={page}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 
                ${page === 1 ? 'rounded-l-lg' : ''} 
                ${page === totalPages ? 'rounded-r-lg' : ''} 
                ${currentPage === page
                  ? 'z-10 bg-primary-600 text-white focus:z-20 hover:bg-primary-700'
                  : 'bg-white text-gray-500 hover:bg-gray-50 focus:z-20'
                }
                focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500
                -ml-px first:ml-0
              `}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
