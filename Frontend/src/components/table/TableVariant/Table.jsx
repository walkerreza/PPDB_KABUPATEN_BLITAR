import React, { useState, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import SortIcon from './components/SortIcon';
import ExportDropdown from './components/ExportDropdown';
import TablePagination from './components/TablePagination';
import PerPageSelect from './components/PerPageSelect';

const Table = forwardRef(({ 
  data = [], 
  columns = [], 
  searchable = true,
  exportable = true,
  pagination = true,
  perPage = 10,
  className = '',
  onRowClick = () => {},
  onDataChange = () => {},
  showMergedHeader = false,
  columnGroups = null,
  mergedHeaders = {}
}, ref) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(perPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLoading, setIsLoading] = useState(false);

  // Expose refresh method
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    }
  }));

  // Optimasi pencarian dengan index
  const searchIndex = useMemo(() => {
    if (!data.length) return new Map();
    
    const index = new Map();
    const searchableColumns = columns
      .filter(col => !col.noSearch)
      .map(col => col.key);

    data.forEach((item, idx) => {
      const searchString = searchableColumns
        .map(key => item[key]?.toString().toLowerCase() || '')
        .join(' ');
      index.set(idx, searchString);
    });
    
    return index;
  }, [data, columns]);

  // Optimized search dengan debounce yang lebih efisien
  const debouncedSetSearchQuery = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 250), // Menurunkan delay debounce
    []
  );

  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    e.persist();
    debouncedSetSearchQuery(value);
  }, [debouncedSetSearchQuery]);

  // Memoized filtered data dengan optimasi
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const searchLower = searchQuery.toLowerCase();
    const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
    
    if (searchTerms.length === 0) return data;

    return data.filter((_, idx) => {
      const searchString = searchIndex.get(idx);
      return searchTerms.every(term => searchString.includes(term));
    });
  }, [data, searchQuery, searchIndex]);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle null/undefined values
      if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Optimize string comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      // Numeric comparison
      return sortConfig.direction === 'asc'
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });
  }, [filteredData, sortConfig]);

  // Memoized current page data
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePerPageChange = useCallback((newPerPage) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1);
  }, []);

  // Menggunakan columnGroups dari props jika ada
  const { jumlahPenerimaan: jumlahPenerimaanColumns = [], normal: normalColumns = [], action: actionColumns = [] } = columnGroups || {};

  // Hitung jumlah kolom untuk colspan
  const jumlahPenerimaanColSpan = columns.filter(col => jumlahPenerimaanColumns.includes(col.key)).length;
  const normalColSpan = columns.filter(col => normalColumns.includes(col.key)).length;
  const actionColSpan = columns.filter(col => actionColumns.includes(col.key)).length;

  return (
    <div className={`relative ${className}`}>
      <div className="mb-4 flex justify-between items-start">
        <div className="flex flex-col space-y-2">
          {pagination && (
            <PerPageSelect
              perPage={itemsPerPage}
              onPerPageChange={handlePerPageChange}
            />
          )}
          {exportable && (
            <ExportDropdown data={data} columns={columns} />
          )}
        </div>
        {searchable && (
          <div className="relative w-72">
            <input
              type="search"
              className="w-full p-2 pl-8 border rounded"
              placeholder="Cari..."
              onChange={handleSearch}
              // Menghapus value prop untuk menghindari controlled input lag
              defaultValue={searchQuery}
            />
            <svg
              className="absolute left-2 top-2.5 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        )}
        
        <table className="w-full text-sm text-left border border-gray-200">
          <thead>
            {showMergedHeader && columnGroups && (
              <tr>
                {Object.entries(columnGroups).map(([groupKey, cols]) => (
                  <th
                    key={groupKey}
                    colSpan={cols?.length || 0}
                    className={`bg-gray-900 text-white p-3 border-r border-gray-600 ${
                      groupKey === 'normal' ? 'text-left' : 'text-center'
                    }`}
                  >
                    {mergedHeaders[groupKey] || ''}
                  </th>
                ))}
              </tr>
            )}
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={!column.sortable ? undefined : () => handleSort(column.key)}
                  className={`bg-gray-900 text-white p-3 ${!column.sortable ? 'cursor-default' : 'cursor-pointer'} border-r border-gray-600 ${
                    columnGroups?.normal?.includes(column.key) ? 'text-left' : 'text-center'
                  }`}
                >
                  <div className={`flex items-center ${
                    columnGroups?.normal?.includes(column.key) ? 'justify-start' : 'justify-center'
                  } gap-2`}>
                    {column.label}
                    {!column.sortable ? null : (
                      <SortIcon
                        active={sortConfig.key === column.key}
                        direction={sortConfig.direction}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, rowIndex) => (
              <tr
                key={item.id || rowIndex}
                onClick={() => onRowClick(item)}
                className={`hover:bg-gray-50 cursor-pointer
                  ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`p-3 border border-gray-200 ${
                      columnGroups?.jumlahPenerimaan?.includes(column.key) ? 'text-center' : 
                      columnGroups?.normal?.includes(column.key) ? 'text-left' : 'text-center'
                    }`}
                  >
                    {column.render ? 
                      column.render(
                        item[column.key], 
                        item, 
                        rowIndex, 
                        (value) => {
                          // Buat salinan data
                          const newData = [...data];
                          // Pastikan value adalah string kosong jika backspace sampai habis
                          const newValue = value === '' ? 0 : parseInt(value) || 0;
                          // Update nilai di item yang diedit
                          newData[rowIndex] = {
                            ...newData[rowIndex],
                            [column.key]: newValue
                          };
                          // Kirim data yang sudah diupdate ke parent component
                          onDataChange(newData);
                        }
                      ) 
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="mt-4">
          <TablePagination
            currentPage={currentPage}
            totalItems={sortedData.length}
            perPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
});

Table.displayName = 'Table';

export default Table;