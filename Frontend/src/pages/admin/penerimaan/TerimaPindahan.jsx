import React, { useState } from 'react';
import { Card, Typography } from "@material-tailwind/react";
import AdminHeader from '../../../components/common/admin/AdminHeader';
import AdminSidebar from '../../../components/common/admin/AdminSidebar';
import AdminFooter from '../../../components/common/admin/AdminFooter';
import Table from '../../../components/table/TableVariant/Table';
import TableContainer from '../../../components/table/TableVariant/components/TableContainer';
import { AdminGuard } from '../../../utils/AuthGuard';

const TerimaPindahan = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Data dummy untuk contoh
  const data = [
    { id: 'P001', nama: 'John Doe', ttl: 'Jakarta, 15 Jan 2010', jk: 'L', asal_sekolah: 'SDN 1 Jakarta', alamat: 'Jl. Sudirman No. 1', nilai: '85.5', dokumen: 'Lengkap', jarak: 2.5, maps: 'Lihat', waktu: '2024-01-15 08:30', aksi: '' },
    { id: 'P002', nama: 'Jane Smith', ttl: 'Surabaya, 22 Mar 2010', jk: 'P', asal_sekolah: 'SDN 2 Surabaya', alamat: 'Jl. Thamrin No. 2', nilai: '90.0', dokumen: 'Lengkap', jarak: 1.8, maps: 'Lihat', waktu: '2024-01-15 09:15', aksi: '' },
    // ... data lainnya
  ];

  // Konfigurasi kolom
  const columns = [
    { 
      key: 'checkbox',
      label: '#',
      width: '50px'
    },
    { 
      key: 'id', 
      label: 'No. Pendaftaran'
    },
    { 
      key: 'nama', 
      label: 'Nama'
    },
    { 
      key: 'ttl', 
      label: 'Tempat, Tanggal Lahir'
    },
    { 
      key: 'jk', 
      label: 'Jenis Kelamin'
    },
    { 
      key: 'asal_sekolah', 
      label: 'Asal Sekolah'
    },
    { 
      key: 'alamat', 
      label: 'Alamat Lengkap'
    },
    { 
      key: 'nilai', 
      label: 'Nilai'
    },
    { 
      key: 'dokumen', 
      label: 'Dokumen'
    },
    { 
      key: 'jarak', 
      label: 'Jarak (KM)',
      render: (value) => `${value} KM`
    },
    { 
      key: 'maps', 
      label: 'Maps Lokasi'
    },
    { 
      key: 'waktu', 
      label: 'Waktu Daftar'
    },
    { 
      key: 'aksi', 
      label: 'Aksi'
    }
  ];

  const handleRowClick = (row) => {
    console.log('Data siswa:', row);
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <AdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <AdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-8">
              <Card className="p-6">
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  Penerimaan Jalur Pindahan
                </Typography>
                <TableContainer 
                  title="Data Pendaftar Jalur Pindahan"
                  subtitle="Daftar siswa yang mendaftar melalui jalur pindahan"
                >
                  <Table 
                    data={data}
                    columns={columns}
                    onRowClick={handleRowClick}
                  />
                </TableContainer>
              </Card>
            </main>
            <AdminFooter />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default TerimaPindahan;