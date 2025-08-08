import React, { useState } from 'react';
import { toast } from 'react-toastify';
import CopyNotification from './CopyNotification';

const ExportDropdown = ({ data = [], columns = [] }) => {
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: 'success' });
  };

  const processData = () => {
    try {
      // Validasi data
      if (!Array.isArray(data) || !Array.isArray(columns)) {
        throw new Error('Data atau columns tidak valid');
      }

      // Ambil header dan data
      const headers = columns.map(col => col.label || col.key);
      const rows = data.map(item => 
        columns.map(col => {
          const value = item[col.key];
          // Handle nilai null/undefined
          return value === null || value === undefined ? '' : value;
        })
      );

      return { headers, rows };
    } catch (error) {
      console.error('Error processing data:', error);
      toast.error('Terjadi kesalahan saat memproses data');
      return { headers: [], rows: [] };
    }
  };

  const handleCopy = async () => {
    try {
      const { headers, rows } = processData();
      if (headers.length === 0 || rows.length === 0) {
        throw new Error('Tidak ada data untuk disalin');
      }

      const text = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      await navigator.clipboard.writeText(text);
      showNotification('Berhasil disalin ke clipboard!', 'success');
    } catch (error) {
      toast.error(error.message || 'Gagal menyalin data ke clipboard');
      console.error('Copy error:', error);
    }
  };

  const handleExcel = async () => {
    try {
      const { headers, rows } = processData();
      if (headers.length === 0 || rows.length === 0) {
        throw new Error('Tidak ada data untuk di-export');
      }

      const { utils, writeFile } = await import('xlsx/xlsx.mjs');
      
      const ws = utils.aoa_to_sheet([headers, ...rows]);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Data");
      
      writeFile(wb, "data_export.xlsx");
      showNotification('File Excel berhasil di-download!', 'download');
    } catch (error) {
      toast.error(error.message || 'Gagal mengexport Excel');
      console.error('Excel export error:', error);
    }
  };

  const handleCSV = () => {
    try {
      const { headers, rows } = processData();
      if (headers.length === 0 || rows.length === 0) {
        throw new Error('Tidak ada data untuk di-export');
      }

      const csvContent = [
        headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
        ...rows.map(row => 
          row.map(cell => {
            if (cell === null || cell === undefined) return '""';
            return typeof cell === 'string' 
              ? `"${cell.replace(/"/g, '""')}"` 
              : `"${cell}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'data_export.csv';
      link.click();
      showNotification('File CSV berhasil di-download!', 'download');
    } catch (error) {
      toast.error(error.message || 'Gagal mengexport CSV');
      console.error('CSV export error:', error);
    }
  };

  const handlePDF = async () => {
    try {
      const { headers, rows } = processData();
      if (headers.length === 0 || rows.length === 0) {
        throw new Error('Tidak ada data untuk di-export');
      }

      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      doc.autoTable({
        head: [headers],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.text(
            `Halaman ${doc.internal.getCurrentPageInfo().pageNumber}/${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.width - 20, 
            doc.internal.pageSize.height - 10
          );
        }
      });

      doc.save('data_export.pdf');
      showNotification('File PDF berhasil di-download!', 'download');
    } catch (error) {
      toast.error(error.message || 'Gagal mengexport PDF');
      console.error('PDF export error:', error);
    }
  };

  return (
    <>
      <div className="inline-flex rounded-md shadow-sm bg-gray-50 p-1" role="group">
        <button 
          onClick={handleCopy}
          type="button" 
          className="px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700"
        >
          Copy
        </button>
        <button 
          onClick={handleExcel}
          type="button" 
          className="px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700"
        >
          Excel
        </button>
        <button 
          onClick={handleCSV}
          type="button" 
          className="px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700"
        >
          CSV
        </button>
        <button 
          onClick={handlePDF}
          type="button" 
          className="px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700"
        >
          PDF
        </button>
      </div>
      <CopyNotification 
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </>
  );
};

export default ExportDropdown;
