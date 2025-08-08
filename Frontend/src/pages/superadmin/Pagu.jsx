import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import Table from '../../components/table/TableVariant/Table';
import { SaveButton } from '../../components/element/Button/variant';
import { SuperAdminGuard } from '../../utils/AuthGuard';
import { toast } from 'react-toastify';
import SelectField from '../../components/forms/FormsVariant/Component/SelectField';

// Komponen SelectField yang dimodifikasi tanpa search bar
const SelectFieldSimple = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  className,
  error,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (selectedValue) => {
    onChange({ target: { name, value: selectedValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div 
        className={`w-full p-2.5 text-gray-700 bg-white border rounded-md shadow-sm outline-none appearance-none cursor-pointer flex items-center justify-between ${className} ${error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="block truncate font-medium">
          {selectedOption ? selectedOption.label : placeholder || 'Pilih opsi'}
        </span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2 hover:bg-blue-50 cursor-pointer ${
                  option.value === value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-2 text-gray-500 text-center">
                Tidak ada hasil
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

const Pagu = ({ jenjang = "SD" }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [savingData, setSavingData] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [tipeSekolahList, setTipeSekolahList] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Definisi kategori sekolah dengan nama lengkap
  const schoolCategories = {
    all: { label: 'Semua Tipe Sekolah', ids: [] },
    TK: { label: 'TK (Taman Kanak-kanak)', ids: [112] },
    RA: { label: 'RA (Raudatul Athfal)', ids: [122] },
    SD: { label: 'SD (Sekolah Dasar)', ids: [211, 212] },
    MI: { label: 'MI (Madrasah Ibtidaiyah)', ids: [221, 222] },
    SLTP: { label: 'SLTP (Sekolah Lanjutan Tingkat Pertama)', ids: [311, 312] },
    MTS: { label: 'MTS (Madrasah Tsanawiyah)', ids: [321, 322] }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userRole = userData.id_grup_user;
    
    // Set kategori default berdasarkan role
    if (userRole === 4) { // PAUD/TK
      setSelectedCategory('TK');
    } else if (userRole === 5) { // SD
      setSelectedCategory('SD');
    } else if (userRole === 6) { // SMP
      setSelectedCategory('SLTP');
    } else if (userRole === 7) { // KEMENAG
      setSelectedCategory('RA');
    }
  }, []);

  // Mendapatkan kategori yang sesuai dengan role user
  const getFilteredCategories = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userRole = userData.id_grup_user;
    
    // Filter kategori berdasarkan role
    let availableCategories = [];
    
    if (userRole === 4) { // PAUD/TK
      availableCategories = ['TK', 'RA'];
    } else if (userRole === 5) { // SD
      availableCategories = ['SD', 'MI'];
    } else if (userRole === 6) { // SMP
      availableCategories = ['SLTP', 'MTS'];
    } else if (userRole === 7) { // KEMENAG
      availableCategories = ['RA', 'MI', 'MTS'];
    } else { // SuperAdmin Dinas
      // Semua kategori tersedia untuk SuperAdmin
      availableCategories = Object.keys(schoolCategories).filter(key => key !== 'all');
    }
    
    return availableCategories;
  };

  useEffect(() => {
    // Set kategori yang tersedia berdasarkan role
    const availableCategories = getFilteredCategories();
    setFilteredCategories(availableCategories);
    
    // Set kategori default ke 'all'
    setSelectedCategory('all');
  }, []);

  // Efek untuk memfilter sekolah saat pertama kali komponen dimuat
  useEffect(() => {
    if (selectedCategory && schools.length > 0) {
      filterSchools({ target: { value: selectedCategory } });
    }
  }, [schools]);

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = (includeContentType = true) => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        throw new Error('Data user tidak ditemukan');
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      
      if (includeContentType) {
        headers.append('Content-Type', 'application/json');
      }
      
      return headers;
    } catch (error) {
      console.error('Error getting headers:', error);
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      setTimeout(() => {
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }, 2000);
      return new Headers();
    }
  };

  // Fungsi untuk handle unauthorized response
  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali');
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Handle perubahan data pada tabel
  const handleDataChange = (newData) => {
    // Set semua data baru ke state
    setSchools(newData);
    
    // Cek role user
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userRole = userData.id_grup_user;
    
    // Terapkan filter yang sedang aktif
    if (selectedCategory === 'all') {
        // Jika 'all' dipilih, filter berdasarkan role
        if (userRole === 4) { // PAUD/TK
          const filtered = newData.filter(school => {
            const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
            return [112, 122].includes(schoolTypeId);
          });
          setFilteredSchools(filtered);
        } else if (userRole === 5) { // SD
          const filtered = newData.filter(school => {
            const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
            return [211, 212, 221, 222].includes(schoolTypeId);
          });
          setFilteredSchools(filtered);
        } else if (userRole === 6) { // SMP
          const filtered = newData.filter(school => {
            const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
            return [311, 312, 321, 322].includes(schoolTypeId);
          });
          setFilteredSchools(filtered);
        } else if (userRole === 7) { // KEMENAG
          const filtered = newData.filter(school => {
            const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
            return [122, 221, 222, 321, 322].includes(schoolTypeId); // RA, MIN, MIS, MTSN, MTSS
          });
          setFilteredSchools(filtered);
        } else {
          setFilteredSchools(newData);
        }
    } else {
      // Filter berdasarkan kategori yang dipilih
      let filtered = newData;
      
      if (userRole === 4) { // PAUD/TK
        filtered = filtered.filter(school => {
          const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
          return [112, 122].includes(schoolTypeId);
        });
      } else if (userRole === 5) { // SD
        filtered = filtered.filter(school => {
          const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
          return [211, 212, 221, 222].includes(schoolTypeId);
        });
      } else if (userRole === 6) { // SMP
        filtered = filtered.filter(school => {
          const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
          return [311, 312, 321, 322].includes(schoolTypeId);
        });
      } else if (userRole === 7) { // KEMENAG
        filtered = filtered.filter(school => {
          const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
          return [122, 221, 222, 321, 322].includes(schoolTypeId); // RA, MIN, MIS, MTSN, MTSS
        });
      }
      
      filtered = filtered.filter(school => {
        const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
        return schoolCategories[selectedCategory].ids.includes(schoolTypeId);
      });
      
      setFilteredSchools(filtered);
    }
  };

  const columns = [
    { 
        key: 'npsn', 
        label: 'NPSN',
        render: (value) => value
    },
    { 
        key: 'nama', 
        label: 'Sekolah',
        render: (value) => value
    },
    { 
        key: 'zonasi', 
        label: 'Domisili (Zonasi)',
        render: (value, row, rowIndex, onChange) => (
            editingCell?.rowIndex === rowIndex && editingCell?.field === 'zonasi' ? (
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setEditingCell(null);
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            onChange(row.zonasi);
                        }
                    }}
                    onBlur={() => setEditingCell(null)}
                    autoFocus
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div 
                    onClick={() => setEditingCell({ rowIndex, field: 'zonasi' })}
                    className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                >
                    {value}
                </div>
            )
        )
    },
    { 
        key: 'afirmasi', 
        label: 'Afirmasi',
        render: (value, row, rowIndex, onChange) => (
            editingCell?.rowIndex === rowIndex && editingCell?.field === 'afirmasi' ? (
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setEditingCell(null);
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            onChange(row.afirmasi);
                        }
                    }}
                    onBlur={() => setEditingCell(null)}
                    autoFocus
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div 
                    onClick={() => setEditingCell({ rowIndex, field: 'afirmasi' })}
                    className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                >
                    {value}
                </div>
            )
        )
    },
    { 
        key: 'prestasi', 
        label: 'Prestasi',
        render: (value, row, rowIndex, onChange) => (
            editingCell?.rowIndex === rowIndex && editingCell?.field === 'prestasi' ? (
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setEditingCell(null);
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            onChange(row.prestasi);
                        }
                    }}
                    onBlur={() => setEditingCell(null)}
                    autoFocus
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div 
                    onClick={() => setEditingCell({ rowIndex, field: 'prestasi' })}
                    className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                >
                    {value}
                </div>
            )
        )
    },
    { 
        key: 'pindahan', 
        label: 'Mutasi (pindahan)',
        render: (value, row, rowIndex, onChange) => (
            editingCell?.rowIndex === rowIndex && editingCell?.field === 'pindahan' ? (
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setEditingCell(null);
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            onChange(row.pindahan);
                        }
                    }}
                    onBlur={() => setEditingCell(null)}
                    autoFocus
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div 
                    onClick={() => setEditingCell({ rowIndex, field: 'pindahan' })}
                    className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                >
                    {value}
                </div>
            )
        )
    },
    { 
        key: 'reguler', 
        label: 'Reguler',
        render: (value, row, rowIndex, onChange) => (
            editingCell?.rowIndex === rowIndex && editingCell?.field === 'reguler' ? (
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setEditingCell(null);
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            onChange(row.reguler);
                        }
                    }}
                    onBlur={() => setEditingCell(null)}
                    autoFocus
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div 
                    onClick={() => setEditingCell({ rowIndex, field: 'reguler' })}
                    className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                >
                    {value}
                </div>
            )
        )
    }
  ];

  // Fetch tipe sekolah
  const fetchTipeSekolah = async () => {
    try {
      const headers = getHeaders();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tipe-sekolah`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data tipe sekolah');
      }

      const result = await response.json();
      setTipeSekolahList(result.data);
    } catch (error) {
      console.error('Error fetching tipe sekolah:', error);
      toast.error('Gagal mengambil data tipe sekolah');
    }
  };

  // Fetch semua data sekolah
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userRole = userData.id_grup_user;
      
      let url = `${import.meta.env.VITE_API_URL}/sekolah`;
      
      // Tambahkan filter berdasarkan role user
      if (userRole === 4) { // PAUD/TK
        url += '?tipe=paud';
      } else if (userRole === 5) { // SD
        url += '?tipe=sd';
      } else if (userRole === 6) { // SMP
        url += '?tipe=smp';
      } else if (userRole === 7) { // KEMENAG
        url += '?tipe=kemenag';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Transform data
      const transformedData = result.data.map(school => ({
        id_sekolah: school.id_sekolah,
            npsn: school.npsn || '-',
            nama: school.nama || '-',
            zonasi: parseInt(school.zonasi) || 0,
            afirmasi: parseInt(school.afirmasi) || 0,
            prestasi: parseInt(school.prestasi) || 0,
            pindahan: parseInt(school.pindahan) || 0,
            reguler: parseInt(school.reguler) || 0,
            tipe_sekolah: school.tipe_sekolah
        }));

        setSchools(transformedData);
        setFilteredSchools(transformedData);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error(error.message || 'Gagal mengambil data sekolah');
    } finally {
      setLoading(false);
    }
  };

  // Filter sekolah berdasarkan kategori
  const filterSchools = (event) => {
    // Mendapatkan nilai kategori yang dipilih
    const categoryValue = event.target ? event.target.value : event;
    
    setSelectedCategory(categoryValue);
    
    // Cek role user
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userRole = userData.id_grup_user;
    
    let filtered = [...schools];
    
    // Filter berdasarkan role terlebih dahulu
    if (userRole === 4) { // PAUD/TK
      filtered = filtered.filter(school => {
        const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
        return [112, 122].includes(schoolTypeId);
      });
    } else if (userRole === 5) { // SD
      filtered = filtered.filter(school => {
        const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
        return [211, 212, 221, 222].includes(schoolTypeId);
      });
    } else if (userRole === 6) { // SMP
      filtered = filtered.filter(school => {
        const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
        return [311, 312, 321, 322].includes(schoolTypeId);
      });
    } else if (userRole === 7) { // KEMENAG
      filtered = filtered.filter(school => {
        const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
        return [122, 221, 222, 321, 322].includes(schoolTypeId); // RA, MIN, MIS, MTSN, MTSS
      });
    }
    
    // Kemudian filter berdasarkan kategori yang dipilih
    if (categoryValue !== 'all') {
      const categoryIds = schoolCategories[categoryValue]?.ids || [];
      filtered = filtered.filter(school => categoryIds.includes(school.tipe_sekolah?.id_tipe_sekolah));
    }
    
    setFilteredSchools(filtered);
  };

  useEffect(() => {
    fetchSchools();
    fetchTipeSekolah();
  }, []);

  const handleSimpan = async () => {
    try {
      setSavingData(true);
        
        // Siapkan headers
        const headers = new Headers();
        const userDataString = localStorage.getItem('userData');
        const userData = JSON.parse(userDataString);
        headers.append('Authorization', `Bearer ${userData.token}`);
        headers.append('Content-Type', 'application/json');
        
        // Siapkan data untuk update - gunakan schools (data lengkap) bukan filteredSchools
      const updates = schools.map(school => ({
        id_sekolah: school.id_sekolah,
            zonasi: parseInt(school.zonasi) || 0,
            afirmasi: parseInt(school.afirmasi) || 0,
            prestasi: parseInt(school.prestasi) || 0,
            pindahan: parseInt(school.pindahan) || 0,
            reguler: parseInt(school.reguler) || 0
        }));

        const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/pagu`, {
          method: 'PUT',
          headers: headers,
          credentials: 'include',
            body: JSON.stringify({ data: updates })
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menyimpan data pagu');
      }

      toast.success('Data pagu berhasil disimpan');
        await fetchSchools(); // Ini akan memperbarui schools dan filteredSchools

    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(error.message || 'Gagal menyimpan data pagu');
    } finally {
      setSavingData(false);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SuperAdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-2 sm:p-4">
              <Card className="h-full w-[calc(100vw-16px)] sm:w-full overflow-x-auto shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      Pagu Sekolah
                    </Typography>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <SelectFieldSimple 
                          value={selectedCategory} 
                          onChange={filterSchools}
                          label=" "
                          options={[
                            { value: 'all', label: schoolCategories.all.label },
                            ...filteredCategories.map(category => ({ value: category, label: schoolCategories[category].label }))
                          ]}
                          className="w-96"
                        />
                      </div>
                    </div>
                    <SaveButton 
                      onClick={handleSimpan}
                      disabled={loading || savingData}
                    >
                      {savingData ? 'Menyimpan...' : 'Simpan Pagu'}
                    </SaveButton>
                  </div>
                  
                  <div className="mt-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <Table
                        data={filteredSchools}
                        columns={columns}
                        searchable={true}
                        exportable={true}
                        pagination={true}
                        perPage={10}
                        onDataChange={handleDataChange}
                        className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                      />
                    )}
                  </div>
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
};

export default Pagu;