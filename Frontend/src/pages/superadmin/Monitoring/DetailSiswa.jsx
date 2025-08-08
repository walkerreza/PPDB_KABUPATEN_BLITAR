import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Table from '../../../components/table/TableVariant/Table';
import { Card, Typography, Button, Select, Option } from "@material-tailwind/react";
import { FaUserGraduate, FaArrowLeft } from 'react-icons/fa';
import SuperAdminSidebar from '../../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../../components/common/superadmin/SuperAdminFooter';
import { toast } from 'react-hot-toast';

// Definisi ID tipe sekolah berdasarkan jenjang
const tipeSekolahByJenjang = {
  'TK/RA': [112, 122], // TK, RA
  'SD': [211, 212, 221, 222], // SDN, SDS, MIN, MIS
  'SMP': [311, 312, 321, 322], // SMPN, SMPS, MTSN, MTSS
  'KEMENAG': [122, 221, 222, 321, 322], // RA, MIN, MIS, MTSN, MTSS
  'SEMUA': [] // Tambahkan SEMUA ke dalam definisi
};

// Fungsi untuk memeriksa apakah user adalah SuperAdmin Dinas
const checkIfSuperAdmin = () => {
  try {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (!userDataString) return false;
    
    const userData = JSON.parse(userDataString);
    return userData.id_grup_user === 1; // SuperAdmin Dinas memiliki id_grup_user = 1
  } catch (error) {
    console.error('Error checking SuperAdmin status:', error);
    return false;
  }
};

// Fungsi untuk mendapatkan role pengguna
const getUserRole = () => {
  try {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (!userDataString) return null;
    
    const userData = JSON.parse(userDataString);
    return userData.id_grup_user;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Fungsi untuk memeriksa apakah user adalah Admin Kemenag
const checkIfKemenagAdmin = () => {
  try {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (!userDataString) return false;
    
    const userData = JSON.parse(userDataString);
    return userData.id_grup_user === 7; // Admin Kemenag memiliki id_grup_user = 7
  } catch (error) {
    console.error('Error checking Kemenag admin status:', error);
    return false;
  }
};

// Service untuk mengambil data dari API
export const getDetailSiswa = async (sekolahId, headers, jenjang = 'SD') => {
  try {
    console.log(`Fetching data with sekolahId: ${sekolahId}, jenjang: ${jenjang}`);
    // Ambil data semua sekolah dan pendaftaran dari endpoint baru
    // Cek apakah user adalah SuperAdmin Dinas
    const isSuperAdmin = checkIfSuperAdmin();
    const isKemenagAdmin = checkIfKemenagAdmin();
    console.log(`User is SuperAdmin: ${isSuperAdmin}, is Kemenag Admin: ${isKemenagAdmin}`);
    
    let apiUrl = `${import.meta.env.VITE_API_URL}/pendaftaran/diterima-all`;
    
    // Tambahkan parameter jenjang=kemenag untuk Admin Kemenag
    if (isKemenagAdmin) {
      apiUrl += '?jenjang=kemenag';
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });

    if (!response.ok) {
      console.error(`API response not OK: ${response.status} ${response.statusText}`);
      throw new Error('Gagal mengambil data');
    }

    const result = await response.json();
    console.log(`API response received, total schools: ${result.data?.length || 0}`);
    
    // Filter data berdasarkan jenjang, kecuali untuk SuperAdmin atau jenjang "SEMUA"
    let filteredData = result.data;
    
    // Untuk Admin Kemenag, filter berdasarkan tipe sekolah Kemenag
    if (isKemenagAdmin) {
      filteredData = result.data.filter(school => {
        const tipeSekolahId = parseInt(school.tipe_sekolah?.id_tipe_sekolah);
        const isKemenagSchool = tipeSekolahByJenjang['KEMENAG'].includes(tipeSekolahId);
        console.log(`School ${school.id_sekolah} (${school.sekolah}) - Type: ${tipeSekolahId}, Is Kemenag School: ${isKemenagSchool}`);
        return isKemenagSchool;
      });
      console.log(`Filtered schools for Kemenag: ${filteredData.length}`);
    }
    // Hanya filter jika bukan SuperAdmin dan jenjang bukan "SEMUA"
    else if (!isSuperAdmin && jenjang !== "SEMUA") {
      filteredData = result.data.filter(school => {
        const tipeSekolahId = parseInt(school.tipe_sekolah?.id_tipe_sekolah);
        const isIncluded = tipeSekolahByJenjang[jenjang]?.includes(tipeSekolahId);
        console.log(`School ${school.id_sekolah} (${school.sekolah}) - Type: ${tipeSekolahId}, Included in ${jenjang}: ${isIncluded}`);
        return isIncluded;
      });
      console.log(`Filtered schools for jenjang ${jenjang}: ${filteredData.length}`);
    } else {
      console.log(`SuperAdmin access or SEMUA jenjang: showing all ${filteredData.length} schools`);
    }
    
    // Cari data sekolah yang sesuai dengan sekolahId
    const sekolahData = filteredData.find(school => school.id_sekolah == sekolahId);
    
    if (!sekolahData) {
      console.error(`School with ID ${sekolahId} not found in filtered data for jenjang ${jenjang}`);
      throw new Error('Data sekolah tidak ditemukan');
    }

    console.log(`Found school: ${sekolahData.sekolah} (${sekolahData.id_sekolah})`);
    // Data pendaftaran sudah tersedia dalam sekolahData.pendaftaran
    const pendaftaranData = sekolahData.pendaftaran || [];

    // Optimasi: Hitung total siswa diterima per jalur dan transformasi data siswa dalam satu iterasi
    const jalurCounts = { prestasi: 0, pindahan: 0, afirmasi: 0, reguler: 0 };
    const transformedSiswa = pendaftaranData.map(item => {
      // Hitung jumlah per jalur
      const jalur = item.jalur_pendaftaran?.nama;
      if (jalur) {
        switch(jalur.toLowerCase()) {
          case 'prestasi':
            jalurCounts.prestasi++;
            break;
          case 'pindahan':
            jalurCounts.pindahan++;
            break;
          case 'afirmasi':
            jalurCounts.afirmasi++;
            break;
          case 'reguler':
          case 'zonasi': // Zonasi masuk ke reguler
            jalurCounts.reguler++;
            break;
        }
      }

      // Transformasi data siswa
      return {
        no_pendaftaran: item.no_pendaftaran,
        nama_siswa: item.nama_siswa,
        alamat: item.alamat,
        sekolah_asal: item.sekolah_asal_data?.nama || '-',
        nilai_akhir: parseFloat(((parseFloat(item.nilai_bhs_indonesia) || 0) + 
                     (parseFloat(item.nilai_matematika) || 0) + 
                     (parseFloat(item.nilai_ipa) || 0)) / 3).toFixed(2),
        jalur: item.jalur_pendaftaran?.nama || '-'
      };
    });

    return {
      sekolah: {
        id: sekolahId,
        npsn: sekolahData.npsn || sekolahId,
        nama: sekolahData.sekolah || 'Nama Sekolah Tidak Tersedia',
        total_kuota: (parseInt(sekolahData.prestasi) || 0) + 
                    (parseInt(sekolahData.afirmasi) || 0) + 
                    (parseInt(sekolahData.pindahan) || 0) +
                    (parseInt(sekolahData.reguler) || 0),
        total_diterima: pendaftaranData.length,
        ...jalurCounts
      },
      siswa: transformedSiswa
    };
  } catch (error) {
    console.error('Error fetching detail siswa:', error);
    throw error;
  }
};

const DetailSiswa = ({ jenjang = 'SD' }) => {
  const { sekolahId } = useParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [jalurFilter, setJalurFilter] = React.useState("Semua Jalur");

  const toggleSidebar = () => setIsOpen(!isOpen);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = getHeaders();
        const result = await getDetailSiswa(sekolahId, headers, jenjang);
        setData(result);
      } catch (error) {
        console.error('Error fetching detail siswa:', error);
        toast.error('Gagal mengambil data detail siswa');
      } finally {
        setLoading(false);
      }
    };

    if (sekolahId) {
      fetchData();
    }
  }, [sekolahId, jenjang]);

  const handleJalurChange = (value) => {
    setJalurFilter(value);
  };

  // Optimasi dengan useMemo untuk columns
  const columns = React.useMemo(() => [
    {
      key: 'no_pendaftaran',
      label: 'No. Pendaftaran'
    },
    {
      key: 'nama_siswa',
      label: 'Nama Siswa'
    },
    {
      key: 'alamat',
      label: 'Alamat'
    },
    {
      key: 'sekolah_asal',
      label: 'Sekolah Asal'
    },
    {
      key: 'nilai_akhir',
      label: 'Nilai Akhir',
      render: (nilai) => (
        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
          {nilai}
        </span>
      )
    },
    {
      key: 'jalur',
      label: 'Jalur',
      render: (jalur) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          jalur === 'Prestasi' ? 'bg-blue-100 text-blue-800' :
          jalur === 'Zonasi' ? 'bg-green-100 text-green-800' :
          jalur === 'Afirmasi' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {jalur}
        </span>
      )
    }
  ], []);

  const handleBack = () => {
    // Redirect sesuai jenjang
    const isSuperAdmin = checkIfSuperAdmin();
    const isKemenagAdmin = checkIfKemenagAdmin();
    const userRole = getUserRole();
    
    if (isSuperAdmin) {
      navigate('/superadmin/diterima'); // SuperAdmin Dinas kembali ke halaman diterima utama
      return;
    }
    
    // Routing khusus untuk Admin Kemenag
    if (isKemenagAdmin || userRole === 7) {
      navigate('/superadmin/diterimakemenag'); // Admin Kemenag ke halaman diterima kemenag
      return;
    }
    
    switch (jenjang) {
      case 'SEMUA':
        navigate('/superadmin/diterima');
        break;
      case 'TK/RA':
        navigate('/superadmin/diterimapaud');
        break;
      case 'SMP':
        navigate('/superadmin/diterimasmp');
        break;
      default:
        navigate('/superadmin/diterima');
        break;
    }
  };

  const filteredData = React.useMemo(() => {
    if (!data) return { sekolah: null, siswa: [] };
    
    // Logging untuk membantu debugging
    console.log('Jalur filter:', jalurFilter);
    console.log('Data siswa sample:', data.siswa.slice(0, 2));
    
    return {
      sekolah: data.sekolah,
      siswa: jalurFilter === "Semua Jalur" 
        ? data.siswa
        : data.siswa.filter(s => {
            // Bandingkan case-insensitive dengan trim
            const siswaJalur = (s.jalur || '').trim().toUpperCase();
            const filterJalur = jalurFilter.trim().toUpperCase();
            
            // Handle nama jalur "PINDAHAN" vs "PERPINDAHAN"
            if (filterJalur === "PERPINDAHAN" && siswaJalur === "PINDAHAN") {
              return true;
            }
            
            return siswaJalur === filterJalur;
          })
    };
  }, [data, jalurFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-4">
              <div className="flex justify-center items-center h-full">
                Loading...
              </div>
            </div>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    console.error('Data is null or undefined when rendering');
    return (
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-4">
              <Card className="h-full w-full shadow-lg">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-6">
                    <Typography variant="h5" color="blue-gray">
                      Siswa Diterima - {jenjang}
                    </Typography>
                    <Button 
                      color="blue-gray" 
                      size="sm" 
                      variant="outlined"
                      className="flex items-center gap-2"
                      onClick={handleBack}
                    >
                      <FaArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                  </div>
                  <div className="flex justify-center items-center h-[200px]">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">Data tidak ditemukan</div>
                      <div className="text-gray-600 text-sm">
                        Silakan periksa parameter URL dan pastikan sekolah dengan ID: {sekolahId} tersedia untuk jenjang {jenjang}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
      <div className="fixed top-0 w-full z-50">
        <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
      </div>
      
      <div className="flex flex-1 pt-[60px]">
        <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
          <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
        </div>
        
        <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
          <div className="p-4">
            <Card className="h-full w-full shadow-lg">
              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                  <Typography variant="h5" color="blue-gray">
                    Siswa Diterima - {jenjang}
                  </Typography>
                  <Button 
                    color="blue-gray" 
                    size="sm" 
                    variant="outlined"
                    className="flex items-center gap-2"
                    onClick={handleBack}
                  >
                    <FaArrowLeft className="h-4 w-4" /> Kembali
                  </Button>
                </div>

                <div className="grid gap-4 mb-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-32">
                      <p className="text-sm text-gray-700 font-medium">NPSN</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{data.sekolah.npsn}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-32">
                      <p className="text-sm text-gray-700 font-medium">Nama Sekolah</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{data.sekolah.nama}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-32">
                      <p className="text-sm text-gray-700 font-medium">Jalur Pendaftaran</p>
                    </div>
                    <div className="w-48">
                      <Select
                        value={jalurFilter}
                        onChange={handleJalurChange}
                        label="Jalur"
                      >
                        <Option value="Semua Jalur">Semua Jalur</Option>
                        <Option value="PRESTASI">Prestasi</Option>
                        <Option value="ZONASI">Zonasi</Option>
                        <Option value="AFIRMASI">Afirmasi</Option>
                        <Option value="PINDAHAN">Perpindahan</Option>
                        <Option value="REGULER">Reguler</Option>
                      </Select>
                    </div>
                  </div>
                </div>

                <Table 
                  data={filteredData.siswa}
                  columns={columns}
                  searchable={true}
                  exportable={true}
                  pagination={true}
                  perPage={10}
                  className="[&_tbody_tr:nth-child(odd)]:bg-white [&_tbody_tr:nth-child(even)]:bg-blue-gray-50/50"
                />
              </div>
            </Card>
          </div>
          <SuperAdminFooter />
        </div>
      </div>
    </div>
  );
};

export default DetailSiswa;
