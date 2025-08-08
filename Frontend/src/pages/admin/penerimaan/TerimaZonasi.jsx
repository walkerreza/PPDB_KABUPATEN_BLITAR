import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Dialog } from "@material-tailwind/react";
import AdminHeader from '../../../components/common/admin/AdminHeader';
import AdminSidebar from '../../../components/common/admin/AdminSidebar';
import AdminFooter from '../../../components/common/admin/AdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import TableContainer from '../../../components/table/TableVariant/components/TableContainer';
import Maps from '../../../components/element/Card/Maps';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { AdminGuard } from '../../../utils/AuthGuard';
import { SaveButton } from '../../../components/element/Button/variant';
import { ToastContainer, toast } from 'react-toastify'; // Import toast
import axios from 'axios';
import moment from 'moment-timezone';
import { FaTimes } from 'react-icons/fa';
import { FaFileAlt } from 'react-icons/fa';

const TerimaZonasi = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedRows, setSelectedRows] = useState(() => {
    // Memuat status checkbox dari localStorage saat komponen dimount
    const savedSelectedRows = localStorage.getItem('selectedRowsZonasi');
    return savedSelectedRows ? JSON.parse(savedSelectedRows) : [];
  });
  const [showMaps, setShowMaps] = useState(false);
  const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem('selectedMapLocation');
    return saved ? JSON.parse(saved) : null;
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [center, setCenter] = useState({ lat: -8.0952, lng: 112.1722 }); // Koordinat Blitar
  const [mapType, setMapType] = useState('roadmap');
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [data, setData] = useState([]); // Mengubah data dari const menjadi state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markers, setMarkers] = useState([]); // State untuk menyimpan semua marker

  // State untuk status jadwal
  const [jadwalData, setJadwalData] = useState({
    tanggal_mulai: null,
    tanggal_selesai: null
  });

  // State untuk status penerimaan ditutup
  const [penerimaanDitutup, setPenerimaanDitutup] = useState(false);

  // Tambahkan state untuk dialog detail siswa
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Tambahkan state untuk tipe detail yang ditampilkan
  const [detailType, setDetailType] = useState(null);

  // Fungsi untuk mengambil data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Mengambil userData dari localStorage
      if (!userData || !userData.sekolah || !userData.sekolah.id_sekolah) {
        throw new Error('Data sekolah tidak ditemukan');
      }

      // Menggunakan endpoint data-pendaftar-zonasi yang menampilkan semua data (termasuk yang sudah diterima)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/data-pendaftar-zonasi/${userData.sekolah.id_sekolah}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }
      const result = await response.json();

      console.log('Raw data from API:', result.data); // Debug raw data

      // Transform data sesuai dengan format yang dibutuhkan
      const transformedData = result.data.map(item => {
        // Parse koordinat dengan benar, pastikan hasilnya adalah number
        const latitude = item.latitude !== null ? parseFloat(item.latitude) : null;
        const longitude = item.longitude !== null ? parseFloat(item.longitude) : null;

        return {
          id: item.id_pendaftaran, // Gunakan id_pendaftaran sebagai id utama
          no_pendaftaran: item.no_pendaftaran,
          nama: item.nama_siswa,
          ttl: `${item.tempat_lahir}, ${new Date(item.tanggal_lahir).toLocaleDateString('id-ID')}`,
          jk: item.jenis_kelamin ? item.jenis_kelamin.nama : '-',
          asal_sekolah: item.sekolah_asal_data?.nama || '-',
          alamat: item.alamat || '-',
          // Gunakan data nilai_rapor dari response API
          nilai: item.nilai_rapor ? 
            `B.Indo: ${item.nilai_rapor.bhs_indonesia}, MTK: ${item.nilai_rapor.matematika}, IPA: ${item.nilai_rapor.ipa}` : 
            'Belum ada nilai',
          // Gunakan status_dokumen dari response API
          dokumen: item.status_dokumen || 'Belum lengkap',
          jarak: item.jarak_sekolah_tujuan || 0,         
          latitude,
          longitude,
          waktu: new Date(item.waktu_daftar).toLocaleString('id-ID'),
          // Tambahkan detail dokumen untuk keperluan tampilan
          detail_dokumen: item.dokumen || {},
          // Tambahkan detail nilai untuk keperluan tampilan
          detail_nilai: item.nilai_rapor || {},
          status: item.is_diterima ? 1 : 0
        };
      });

      // Set markers untuk peta dengan validasi yang lebih ketat
      const validMarkers = transformedData.filter(item => {
        const isValid =
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number' &&
          !isNaN(item.latitude) &&
          !isNaN(item.longitude) &&
          Math.abs(item.latitude) <= 90 && // Validasi range latitude
          Math.abs(item.longitude) <= 180; // Validasi range longitude

        if (!isValid && (item.latitude !== null || item.longitude !== null)) {
          console.warn('Koordinat tidak valid untuk:', item.nama, { lat: item.latitude, lng: item.longitude });
        }

        return isValid;
      });

      console.log('Marker valid:', validMarkers); // Debug valid markers
      setMarkers(validMarkers);
      setData(transformedData);
      
      // Mempertahankan checkbox yang dipilih setelah refresh
      // Hanya mempertahankan checkbox untuk item yang masih ada di data baru
      setSelectedRows(prevSelected => prevSelected.filter(id => 
        transformedData.some(item => item.id === id)
      ));
      
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengecek apakah sekolah adalah SD (211, 212)
  const isSDMI = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['211', '212'].includes(strValue);
  }, []);

  // Fungsi untuk mengecek apakah sekolah adalah SMP (311, 312)
  const isSMP = useCallback((value) => {
    if (!value) return false;
    const strValue = String(value);
    return ['311', '312'].includes(strValue);
  }, []);

  // Effect untuk mengambil data jadwal
  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        // Cek jika user adalah SD atau SMP
        const tipeSekolah = userData?.sekolah?.id_tipe_sekolah;        
        
        let jadwalEndpoint = '';
        if (isSDMI(tipeSekolah)) {
          jadwalEndpoint = '23';
        } else if (isSMP(tipeSekolah)) {
          jadwalEndpoint = '10';
        }

        if (jadwalEndpoint) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/jadwal-sistem/${jadwalEndpoint}`);
          const jadwal = response.data.data.jadwal;
          console.log('Data Jadwal:', jadwal);
          
          setJadwalData({
            tanggal_mulai: jadwal.tanggal_mulai,
            tanggal_selesai: jadwal.tanggal_selesai
          });

          // Cek apakah saat ini di luar rentang waktu pendaftaran
          const currentTime = moment();
          const startTime = moment(jadwal.tanggal_mulai);
          const endTime = moment(jadwal.tanggal_selesai);

          // Menggunakan inclusive true agar batas waktu termasuk dalam rentang
          const isInRange = currentTime.isBetween(startTime, endTime, null, '[]');

          setPenerimaanDitutup(!isInRange);
        }
      } catch (error) {
        console.error('Error mengambil jadwal:', error);
      }
    };

    fetchJadwal();
  }, [userData?.sekolah?.id_tipe_sekolah, isSDMI, isSMP]);

  // Fungsi untuk mendapatkan base URL
  const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return apiUrl.replace('/api', ''); // Hapus '/api' dari URL
  };

  // Fungsi untuk mendapatkan API URL
  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL;
  };

  // Panggil fetchData saat komponen dimount
  useEffect(() => {
    console.log('API URL:', getApiUrl()); // Tambahkan ini untuk debugging
    console.log('Base URL:', getBaseUrl());
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('selectedMapLocation', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  const clearSelectedLocation = () => {
    localStorage.removeItem('selectedMapLocation');
    setSelectedLocation(null);
  };

  // Handler untuk checkbox
  const handleCheckboxChange = (id) => {
    // Cari item dengan id yang sesuai
    const item = data.find(item => item.id === id);
    
    // Jika item sudah diterima (status = 1), jangan izinkan untuk dicentang
    if (item && item.status === 1) {
      return; // Tidak melakukan apa-apa jika siswa sudah diterima
    }
    
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handler untuk select all checkbox
  const handleSelectAll = () => {
    // Hanya pilih siswa yang belum diterima (status = 0)
    const pendaftarBelumDiterima = data.filter(item => item.status === 0).map(item => item.id);
    
    // Cek apakah semua siswa yang belum diterima sudah dipilih
    const allBelumDiterimaSelected = pendaftarBelumDiterima.every(id => selectedRows.includes(id));
    
    if (allBelumDiterimaSelected) {
      // Jika semua sudah dipilih, hapus semua pilihan
      setSelectedRows(prev => prev.filter(id => {
        // Pertahankan siswa yang sudah diterima dalam pilihan
        const item = data.find(item => item.id === id);
        return item && item.status === 1;
      }));
    } else {
      // Jika belum semua dipilih, pilih semua siswa yang belum diterima
      // dan pertahankan siswa yang sudah diterima dalam pilihan
      const newSelectedRows = [...selectedRows];
      
      pendaftarBelumDiterima.forEach(id => {
        if (!newSelectedRows.includes(id)) {
          newSelectedRows.push(id);
        }
      });
      
      setSelectedRows(newSelectedRows);
    }
  };

  // Effect untuk menyimpan selectedRows ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem('selectedRowsZonasi', JSON.stringify(selectedRows));
  }, [selectedRows]);

  // Effect untuk membersihkan selectedRows yang tidak ada di data saat data berubah
  useEffect(() => {
    if (data.length > 0) {
      // Filter selectedRows agar hanya berisi ID yang ada di data
      const validSelectedRows = selectedRows.filter(id => 
        data.some(item => item.id === id)
      );
      
      // Update selectedRows jika ada perubahan
      if (validSelectedRows.length !== selectedRows.length) {
        setSelectedRows(validSelectedRows);
      }
    }
  }, [data]);

  // Fungsi untuk menangani konfirmasi penerimaan
  const handleKonfirmasiPenerimaan = async () => {
    try {
      setLoading(true);

      // Validasi jika tidak ada yang dipilih
      if (selectedRows.length === 0) {
        toast.error('Gagal menerima siswa: Pilih siswa yang akan diterima terlebih dahulu', {
          style: {
            padding: '16px',
            color: '#000',
            fontWeight: '500'
          },
        });
        return;
      }

      // Filter hanya siswa yang belum diterima (status = 0)
      const siswaYangBelumDiterima = selectedRows.filter(id => {
        const item = data.find(item => item.id === id);
        return item && item.status === 0;
      });

      // Jika tidak ada siswa yang belum diterima, tampilkan pesan
      if (siswaYangBelumDiterima.length === 0) {
        toast.info('Semua siswa yang dipilih sudah diterima', {
          style: {
            padding: '16px',
            color: '#000',
            fontWeight: '500'
          },
        });
        setLoading(false);
        return;
      }

      // Konfirmasi ke pengguna
      if (!window.confirm(`Apakah Anda yakin akan menerima ${siswaYangBelumDiterima.length} siswa yang dipilih?`)) {
        setLoading(false);
        return;
      }

      // Proses setiap siswa yang dipilih dan belum diterima
      const promises = siswaYangBelumDiterima.map(async (row) => {
        try {
          console.log('Mengirim konfirmasi untuk siswa:', row); // Debug
          const response = await fetch(`${getApiUrl()}/pendaftaran/${row}/konfirmasi`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal mengkonfirmasi penerimaan');
          }

          return await response.json();
        } catch (error) {
          console.error(`Error saat mengkonfirmasi siswa ${row}:`, error);
          throw error;
        }
      });

      // Tunggu semua proses selesai
      const results = await Promise.all(promises);

      // Tampilkan pesan sukses
      toast.success(`Berhasil menerima ${siswaYangBelumDiterima.length} siswa yang dipilih`, {
        style: {
          padding: '16px',
          color: '#000',
          fontWeight: '500'
        },
      });

      // Update status siswa yang diterima di data lokal tanpa menghilangkan dari tabel
      setData(prevData => prevData.map(item => {
        if (siswaYangBelumDiterima.includes(item.id)) {
          return { ...item, status: 1 };
        }
        return item;
      }));

      // Tidak perlu reset pilihan agar checkbox tetap tercentang
      // setSelectedRows([]);
    } catch (error) {
      console.error('Error saat konfirmasi penerimaan:', error);
      toast.error('Gagal menerima siswa: ' + error.message, {
        style: {
          padding: '16px',
          color: '#000',
          fontWeight: '500'
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menampilkan detail siswa
  const handleDetailClick = (row, event) => {
    event.stopPropagation(); // Hentikan event bubbling
    console.log('Data siswa:', row);
    setSelectedStudent(row);
    setShowDetailDialog(true);
  };

  // Fungsi untuk menangani klik pada kolom
  const handleColumnClick = (type, student) => {
    setDetailType(type); // Set tipe detail yang akan ditampilkan
    setSelectedStudent(student);
    setShowDetailDialog(true);
  };

  // Komponen untuk menampilkan detail nilai
  const NilaiDetail = ({ nilai }) => (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Detail Nilai Rapor</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-medium">Bahasa Indonesia</p>
          <p>{nilai.bhs_indonesia || '-'}</p>
        </div>
        <div>
          <p className="font-medium">Matematika</p>
          <p>{nilai.matematika || '-'}</p>
        </div>
        <div>
          <p className="font-medium">IPA</p>
          <p>{nilai.ipa || '-'}</p>
        </div>
      </div>
    </div>
  );

  // Komponen untuk menampilkan detail dokumen
  const DokumenDetail = ({ dokumen }) => {
    // Daftar dokumen yang akan ditampilkan
    const requiredDocs = {
      akta: 'Akta Kelahiran',
      kk: 'Kartu Keluarga',
      kis: 'Kartu Identitas Anak',
      skhun: 'SKHUN',
      skdomisili: 'Surat Keterangan Domisili',
      foto: 'Foto Diri Terbaru Berwarna'
    };

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Status Dokumen</h3>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {Object.entries(requiredDocs).map(([key, label]) => (
            <div key={key} className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{label}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded ${dokumen[key] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {dokumen[key] ? 'Lengkap' : 'Belum Lengkap'}
                </span>
                {dokumen[key] && (
                  <a 
                    href={`${getBaseUrl()}/content/uploads/pendaftaran/${key}/${dokumen[key]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    title="Lihat Berkas"
                  >
                    <FaFileAlt />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Konfigurasi kolom
  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          checked={data.filter(item => item.status === 0).length > 0 && 
                  data.filter(item => item.status === 0).every(item => selectedRows.includes(item.id))}
          onChange={handleSelectAll}
        />
      ),
      width: '50px',
      render: (_, row) => (
        <input
          type="checkbox"
          className={`w-4 h-4 rounded border-gray-300 ${row.status === 1 ? 'text-gray-400 bg-gray-100' : 'text-blue-500'} focus:ring-blue-500`}
          checked={selectedRows.includes(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleCheckboxChange(row.id);
          }}
          disabled={row.status === 1} // Nonaktifkan checkbox untuk siswa yang sudah diterima
          style={{ 
            cursor: row.status === 1 ? 'not-allowed' : 'pointer', 
            opacity: row.status === 1 ? 0.6 : 1 
          }}
        />
      )
    },
    {
      key: 'no_pendaftaran',
      label: 'No Pendaftaran',
    },
    {
      key: 'nama',
      label: 'Nama Siswa',
    },
    {
      key: 'ttl',
      label: 'TTL',
    },
    {
      key: 'jk',
      label: 'JK',
    },
    {
      key: 'asal_sekolah',
      label: 'Asal Sekolah',
    },
    {
      key: 'alamat',
      label: 'Alamat',
    },
    {
      key: 'nilai',
      label: 'Nilai',
      render: (value, row) => (
        <button
          onClick={() => handleColumnClick('nilai', row)}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Lihat Nilai
        </button>
      ),
    },
    {
      key: 'dokumen',
      label: 'Dokumen',
      render: (value, row) => (
        <button
          onClick={() => handleColumnClick('dokumen', row)}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Lihat Dokumen
        </button>
      ),
    },
    {
      key: 'jarak',
      label: 'Jarak',
      render: (value) => `${value} km`,
    },
    {
      key: 'maps',
      label: 'Maps Lokasi',
      render: (_, row) => {
        if (!row.latitude || !row.longitude) {
          return (
            <span className="text-gray-500 italic">Belum ada lokasi</span>
          );
        }
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const location = {
                id: row.id,
                nama: row.nama,
                latitude: row.latitude,
                longitude: row.longitude
              };
              setSelectedLocation(location);
              setShowMaps(true);
            }}
            className="p-2 text-blue-500 hover:text-blue-700"
            title="Lihat Lokasi"
          >
            <FaMapMarkerAlt size={20} />
          </button>
        );
      }
    },
    {
      key: 'waktu',
      label: 'Waktu Daftar',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <span className={`px-2 py-1 rounded ${row.status === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
          {row.status === 1 ? 'Diterima' : 'Mendaftar'}
        </span>
      ),
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <AdminGuard>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center',
          width: 'auto',
          minWidth: '300px'
        }}
      />
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <AdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>

        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <AdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} userData={userData}/>
          </div>

          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <div className="p-2 sm:p-4">
              <Card className="h-full w-[calc(100vw-16px)] sm:w-full overflow-x-auto shadow-lg">
                <div className="p-2 sm:p-4">
                  <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Typography variant="h5" color="blue-gray" className="text-lg sm:text-xl">
                      Penerimaan Zonasi
                    </Typography>
                    <SaveButton
                      onClick={handleKonfirmasiPenerimaan}
                      disabled={
                        selectedRows.length === 0 || 
                        loading || 
                        ((isSDMI(userData?.sekolah?.id_tipe_sekolah) || isSMP(userData?.sekolah?.id_tipe_sekolah)) && penerimaanDitutup) ||
                        // Tombol dinonaktifkan hanya jika tidak ada siswa yang belum diterima di antara yang dipilih
                        !selectedRows.some(id => {
                          const item = data.find(item => item.id === id);
                          return item && item.status === 0;
                        })
                      }
                    >
                      Simpan Sebagai Siswa Diterima
                    </SaveButton>
                  </div>
                  <div className="overflow-x-auto">
                    <TableContainer
                      title="Data Pendaftar Jalur Zonasi"
                      subtitle="Daftar peserta didik yang mendaftar melalui jalur zonasi"
                    >
                      {loading ? (
                        <div>Loading...</div> 
                      ) : error ? (
                        <div>Error: {error}</div>
                      ) : (
                        <Table
                          data={data}
                          columns={columns}
                        >
                          {({ currentItems }) => (
                            <tbody>
                              {currentItems.map((item, index) => (
                                <tr 
                                  key={index} 
                                  className="even:bg-blue-gray-50/50"
                                >
                                  {columns.map((column) => (
                                    <td 
                                      key={column.key} 
                                      className={`p-4 ${column.key === 'nilai' || column.key === 'dokumen' ? '' : 'cursor-default'}`}
                                    >
                                      <Typography
                                        variant="small"
                                        color="blue-gray"
                                        className="font-normal"
                                      >
                                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                                      </Typography>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          )}
                        </Table>
                      )}
                    </TableContainer>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal Maps */}
        <Dialog
          open={showMaps}
          handler={() => {
            setShowMaps(false);
          }}
          size="xl"
        >
          <div className="p-0 overflow-hidden">
            <div className="relative">
              <button
                onClick={clearSelectedLocation}
                className="absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow-md"
                title="Reset Lokasi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="h-[70vh]">
                {markers.length === 0 ? (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <p className="text-gray-500 text-center">
                      Belum ada pendaftar dengan data lokasi yang valid<br />
                      Silakan pastikan data koordinat sudah diisi dengan benar
                    </p>
                  </div>
                ) : (
                  <Maps
                    center={selectedLocation ?
                      {
                        lat: typeof selectedLocation.latitude === 'number' ? selectedLocation.latitude : parseFloat(selectedLocation.latitude),
                        lng: typeof selectedLocation.longitude === 'number' ? selectedLocation.longitude : parseFloat(selectedLocation.longitude)
                      } :
                      markers.length > 0 ?
                        {
                          lat: markers[0].latitude,
                          lng: markers[0].longitude
                        } :
                        center
                    }
                    coordinates={selectedLocation ?
                      {
                        lat: typeof selectedLocation.latitude === 'number' ? selectedLocation.latitude : parseFloat(selectedLocation.latitude),
                        lng: typeof selectedLocation.longitude === 'number' ? selectedLocation.longitude : parseFloat(selectedLocation.longitude)
                      } :
                      null
                    }
                    address={address}
                    mapType={mapType}
                    setMapType={setMapType}
                    isLocating={isLocating}
                    onMapLoad={(map) => {
                      setIsMapLoaded(true);
                      console.log('Map loaded with markers:', markers); // Debug loaded markers
                    }}
                    handleMapClick={(e) => {
                      // Disable lokasi tidak bisa dipindahkan
                      // const lat = e.latLng.lat();
                      // const lng = e.latLng.lng();
                      // setSelectedLocation({ ...selectedLocation, latitude: lat, longitude: lng });
                    }}
                    isMapLoaded={isMapLoaded}
                    containerStyle={{ width: '100%', height: '100%' }}
                    setCoordinates={(coords) => {
                      // Disable lokasi tidak bisa dipindahkan
                      // setSelectedLocation({ ...selectedLocation, ...coords });
                    }}
                    setAddress={setAddress}
                    additionalMarkers={markers.map(marker => ({
                      position: {
                        lat: marker.latitude,
                        lng: marker.longitude
                      },
                      title: `${marker.nama} - ${marker.jarak} KM`,
                      info: `
                        Nama: ${marker.nama}
                        Jarak: ${marker.jarak} KM
                        Alamat: ${marker.alamat}
                      `
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
        </Dialog>

        {/* Dialog Detail Siswa */}
        <Dialog
          open={showDetailDialog}
          handler={() => setShowDetailDialog(false)}
          className="min-w-[80%] md:min-w-[60%]"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <Typography variant="h6">
              Detail {detailType === 'nilai' ? 'Nilai' : 'Dokumen'} - {selectedStudent?.nama}
            </Typography>
            <button
              onClick={() => setShowDetailDialog(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {detailType === 'nilai' && selectedStudent && (
              <NilaiDetail nilai={selectedStudent.detail_nilai} />
            )}
            {detailType === 'dokumen' && selectedStudent && (
              <DokumenDetail dokumen={selectedStudent.detail_dokumen} />
            )}
          </div>
        </Dialog>
        <AdminFooter />
      </div>
    </AdminGuard>
  );
};

export default TerimaZonasi;