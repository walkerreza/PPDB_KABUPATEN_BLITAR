import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Select, Option } from "@material-tailwind/react";
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import { DetailButton } from '../../../components/element/Button/variant';
import { SuperAdminGuard } from '../../../utils/AuthGuard';
import { toast } from 'react-toastify';

const Diterima = ({ jenjang = "SD" }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tingkatan, setTingkatan] = useState('SEMUA');
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

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

  // Handle unauthorized response
  const handleUnauthorized = () => {
    toast.error('Sesi anda telah berakhir, silahkan login kembali');
    localStorage.removeItem('userData');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Definisi tipe sekolah berdasarkan jenjang
  const tipeSekolahByJenjang = {
    'TK/RA': ['112', '122'], // TK, RA
    'TK': ['112'], // TK
    'RA': ['122'], // RA
    'SD': ['211', '212', '221', '222'], // SDN, SDS, MIN, MIS
    'SMP': ['311', '312', '321', '322'], // SMPN, SMPS, MTSN, MTSS
    'KEMENAG': ['122', '221', '222', '321', '322'] // RA, MI, MTs
  };

  // Fungsi untuk memeriksa apakah pengguna adalah SuperAdmin Dinas
  const checkIfSuperAdmin = () => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) return false;
      
      const userData = JSON.parse(userDataString);
      return userData.id_grup_user === 1; // 1 adalah ID grup SuperAdmin Dinas
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Fungsi untuk mendapatkan role pengguna
  const getUserRole = () => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) return null;
      
      const userData = JSON.parse(userDataString);
      setUserRole(userData.id_grup_user); // Set user role ke state
      console.log('User role set to:', userData.id_grup_user);
      
      // Tetapkan jenjang berdasarkan role untuk Admin Bidang
      if (userData.id_grup_user === 4) { // Admin PAUD/TK
        jenjang = 'TK/RA';
      } else if (userData.id_grup_user === 5) { // Admin SD
        jenjang = 'SD';
      } else if (userData.id_grup_user === 6) { // Admin SMP
        jenjang = 'SMP';
      } else if (userData.id_grup_user === 7) { // Admin Kemenag
        jenjang = 'KEMENAG';
      }
      
      return userData.id_grup_user;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Definisi kategori sekolah dengan nama lengkap
  const schoolCategories = {
    SEMUA: { label: 'SEMUA', ids: ['112', '122', '211', '212', '221', '222', '311', '312', '321', '322'] },
    TK: { label: 'TK', ids: ['112'] },
    RA: { label: 'RA', ids: ['122'] },
    SD: { label: 'SD', ids: ['211', '212'] },
    MI: { label: 'MI', ids: ['221', '222'] },
    SLTP: { label: 'SLTP', ids: ['311', '312'] },
    MTS: { label: 'MTS', ids: ['321', '322'] },
    KEMENAG: { label: 'KEMENAG', ids: ['122', '221', '222', '321', '322'] } // RA, MI, MTs
  };

  // Definisi pengelompokan kolom
  const normalColumns = ['sekolah'];
  const penerimaanColumns = [ 'zonasi', 'prestasi', 'pindahan', 'afirmasi', 'reguler','total'];
  const detailColumns = ['detail'];

  // Header text untuk merged header
  const mergedHeaders = {
    normal: '',
    penerimaan: 'Jumlah Penerimaan',
    detail: ''
  };

  // Fungsi untuk mengambil data sekolah dan pendaftaran yang diterima
  const fetchSchools = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      
      // Tambahkan parameter untuk jenjang
      let apiUrl = `${import.meta.env.VITE_API_URL}/pendaftaran/diterima-all`;
      
      // Tambahkan parameter jenjang=kemenag untuk Admin Kemenag
      if (userRole === 7) {
        apiUrl += '?jenjang=kemenag';
      }
      
      // Gunakan endpoint baru yang menggabungkan data sekolah dan pendaftaran
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
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
      
      // Data sudah dalam format yang siap digunakan dari backend
      setSchools(result.data);
      filterSchools('SEMUA', result.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error(error.message || 'Gagal mengambil data sekolah');
    } finally {
      setLoading(false);
    }
  };

  // Filter sekolah berdasarkan kategori dan jenjang
  const filterSchools = (category, schoolsData = schools) => {
    // Jika data sekolah kosong, kembalikan array kosong
    if (!schoolsData || !schoolsData.length) {
      setFilteredSchools([]);
      return;
    }

    console.log('Filtering schools: userRole =', userRole, 'jenjang =', jenjang, 'category =', category);
    
    // Set state tingkatan agar sesuai dengan nilai yang dipilih
    setTingkatan(category);

    // Jika SuperAdmin (id_grup_user = 1), tidak ada filter tambahan berdasarkan jenjang
    const isSuperAdmin = parseInt(userRole) === 1;
    console.log('Is SuperAdmin:', isSuperAdmin, 'currentUserRole:', userRole);
    
    // Filter awal berdasarkan jenjang untuk operator bidang
    let filteredByRole = [...schoolsData]; // Gunakan copy dari data untuk menghindari mutasi
    
    if (!isSuperAdmin) {
      console.log('Applying jenjang filter for non-SuperAdmin');
      // Filter berdasarkan jenjang sesuai role
      filteredByRole = schoolsData.filter(school => {
        const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah;
        
        // Pastikan id_tipe_sekolah ada sebelum memfilter
        if (!schoolTypeId) {
          console.warn('Missing id_tipe_sekolah for school:', school);
          return false;
        }
        
        // Verifikasi bahwa schoolTypeId adalah string
        const schoolTypeIdStr = schoolTypeId.toString();
        
        // Untuk Admin Kemenag
        if (userRole === 7) {
          const isKemenag = [122, 221, 222, 321, 322].includes(schoolTypeId); // RA, MIN, MIS, MTSN, MTSS
          console.log(`Kemenag Check for school ID ${school.id_sekolah}, type: ${schoolTypeId}, result: ${isKemenag}`);
          return isKemenag;
        }
        
        // Untuk Admin PAUD/TK
        if (userRole === 4) {
          const isPAUDTK = [112, 122].includes(schoolTypeId); // TK, RA
          console.log(`PAUD/TK Check for school ID ${school.id_sekolah}, type: ${schoolTypeId}, result: ${isPAUDTK}`);
          return isPAUDTK;
        }
        
        // Untuk Admin SD
        if (userRole === 5) {
          const isSD = [211, 212, 221, 222].includes(schoolTypeId); // SDN, SDS, MIN, MIS
          console.log(`SD Check for school ID ${school.id_sekolah}, type: ${schoolTypeId}, result: ${isSD}`);
          return isSD;
        }
        
        // Untuk Admin SMP
        if (userRole === 6) {
          const isSMP = [311, 312, 321, 322].includes(schoolTypeId); // SMPN, SMPS, MTSN, MTSS
          console.log(`SMP Check for school ID ${school.id_sekolah}, type: ${schoolTypeId}, result: ${isSMP}`);
          return isSMP;
        }
        
        // Jika SuperAdmin, tampilkan semua
        return true;
      });
    }
    
    console.log('After role filtering, schools count:', filteredByRole.length);
    
    // Filter lanjutan berdasarkan kategori yang dipilih user di dropdown
    if (category === 'SEMUA') {
      console.log('Using all schools from role filter');
      setFilteredSchools(filteredByRole);
      return;
    }
    
    console.log('Applying category filter:', category);
    // Pastikan kategori valid
    if (!schoolCategories[category] || !schoolCategories[category].ids) {
      console.error('Invalid category:', category);
      setFilteredSchools(filteredByRole);
      return;
    }
    
    const filtered = filteredByRole.filter(school => {
      const schoolTypeId = school.tipe_sekolah?.id_tipe_sekolah?.toString();
      
      // Pastikan id_tipe_sekolah ada sebelum memfilter
      if (!schoolTypeId) {
        console.warn('Missing id_tipe_sekolah for school during category filtering:', school);
        return false;
      }
      
      return schoolCategories[category].ids.includes(schoolTypeId);
    });
    
    console.log('After category filtering, schools count:', filtered.length);
    setFilteredSchools(filtered);
  };

  useEffect(() => {
    // Set user role terlebih dahulu
    const role = getUserRole();
    console.log("Initial user role:", role);
    
    // Set default tingkatan
    setTingkatan('SEMUA');
    
    // Kemudian ambil data sekolah
    fetchSchools();
  }, []);

  const handleTingkatanChange = (value) => {
    console.log("Tingkatan berubah ke:", value);
    // Memastikan state tingkatan berubah sebelum melakukan filter
    setTingkatan(value);
    // Menjalankan filter dengan timeout pendek untuk memastikan state sudah terupdate
    setTimeout(() => {
      filterSchools(value);
    }, 10);
  };

  const handleDetail = (item) => {
    // Cek apakah user SuperAdmin Dinas
    const isSuperAdmin = parseInt(userRole) === 1;
    
    // Jika SuperAdmin Dinas, arahkan ke rute khusus
    if (isSuperAdmin) {
      console.log("Routing SuperAdmin Dinas ke rute khusus detailsiswa");
      navigate(`/superadmin/detailsiswa/${item.id_sekolah}`);
      return;
    }
    
    // Routing untuk Admin Kemenag
    if (userRole === 7) {
      // Cek tipe sekolah untuk menentukan routing
      const schoolTypeId = parseInt(item.tipe_sekolah?.id_tipe_sekolah);
      console.log("Admin Kemenag mengakses detail sekolah dengan id_tipe_sekolah:", schoolTypeId);
      
      if (schoolTypeId === 122) { // RA
        navigate(`/superadmin/diterimakemenag/${item.id_sekolah}`);
      } else if (schoolTypeId === 221 || schoolTypeId === 222) { // MI
        navigate(`/superadmin/diterimakemenag/${item.id_sekolah}`);
      } else if (schoolTypeId === 321 || schoolTypeId === 322) { // MTs
        navigate(`/superadmin/diterimakemenag/${item.id_sekolah}`);
      } else {
        // Default route jika tidak bisa menentukan
        navigate(`/superadmin/diterimakemenag/${item.id_sekolah}`);
      }
      return;
    }
    
    // Jika bukan SuperAdmin atau Kemenag, gunakan rute sesuai jenjang
    if (jenjang === "TK/RA") {
      navigate(`/superadmin/diterimapaud/${item.id_sekolah}`);
    } else if (jenjang === "SMP") {
      navigate(`/superadmin/diterimasmp/${item.id_sekolah}`);
    } else {
      navigate(`/superadmin/diterima/${item.id_sekolah}`);
    }
  };

  const columns = [
    {
      key: 'sekolah',
      label: 'Sekolah',
    },
    {
      key: 'zonasi',
      label: 'Zonasi',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
          {value}
        </span>
      )
    },
    {
      key: 'prestasi',
      label: 'Prestasi',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
          {value}
        </span>
      )
    },
    {
      key: 'pindahan',
      label: 'Pindahan',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
          {value}
        </span>
      )
    },
    {
      key: 'afirmasi',
      label: 'Afirmasi',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
          {value}
        </span>
      )
    },
    {
      key: 'reguler',
      label: 'Reguler',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
          {value}
        </span>
      )
    },
    {
      key: 'total',
      label: 'Total',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
          {value}
        </span>
      )
    },
    {
      key: 'detail',
      label: 'Detail',
      render: (_, item) => (
        <DetailButton onClick={() => handleDetail(item)} />
      )
    },
  ];

  // Render Select Option berdasarkan jenjang
  const renderOptions = () => {
    // Jika Admin Kemenag, tampilkan opsi yang relevan
    if (userRole === 7) {
      const kemenagOptions = ['SEMUA', 'RA', 'MI', 'MTS'];
      return kemenagOptions.map((category) => (
        <Option key={category} value={category}>
          {schoolCategories[category]?.label || category}
        </Option>
      ));
    }
    
    // Jika SuperAdmin, tampilkan semua opsi
    if (userRole === 1) {
      return Object.keys(schoolCategories).map((category) => (
        <Option key={category} value={category}>
          {schoolCategories[category].label}
        </Option>
      ));
    }
    
    // Jika operator bidang, filter opsi sesuai jenjang
    let filteredCategories = [];
    
    if (jenjang === 'TK/RA') {
      // Tambahkan kategori TK/RA ke dalam opsi filter
      filteredCategories = ['SEMUA', 'TK', 'RA'];
    } else if (jenjang === 'SD') {
      filteredCategories = ['SEMUA', 'SD', 'MI'];
    } else if (jenjang === 'SMP') {
      filteredCategories = ['SEMUA', 'SLTP', 'MTS'];
    } else if (jenjang === 'KEMENAG') {
      filteredCategories = ['SEMUA', 'RA', 'MI', 'MTS'];
    }
    
    return filteredCategories.map((category) => (
      <Option key={category} value={category}>
        {schoolCategories[category]?.label || category}
      </Option>
    ));
  };

  useEffect(() => {
    if (schools.length > 0) {
      // Pastikan untuk menyinkronkan filter dengan nilai tingkatan saat ini
      filterSchools(tingkatan);
    }
  }, [schools]);

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
                  <div className="mb-4 sm:mb-8">
                    <Typography variant="h5" color="blue-gray" className="mb-4">
                      Siswa Diterima
                    </Typography>
                    <div className="w-72">
                      <Select 
                        size="md" 
                        value={tingkatan || 'SEMUA'} 
                        onChange={handleTingkatanChange}
                        label="Pilih Jenis Sekolah"
                        className="w-full"
                        key={`select-${tingkatan || 'SEMUA'}`} // Memaksa render ulang ketika nilai berubah
                      >
                        {renderOptions()}
                      </Select>
                    </div>
                  </div>
                  <Table
                    data={filteredSchools}
                    columns={columns}
                    searchable={true}
                    exportable={true}
                    pagination={true}
                    perPage={10}
                    showMergedHeader={true}
                    columnGroups={{
                      normal: normalColumns,
                      penerimaan: penerimaanColumns,
                      detail: detailColumns
                    }}
                    mergedHeaders={mergedHeaders}
                    className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                  />
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

export default Diterima;