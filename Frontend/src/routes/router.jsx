import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Route } from "react-router-dom";
// import Loading from "../components/common/Loading";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { 
  SuperAdminGuard, 
  AdminGuard, 
  UserGuard, 
  PaudTkGuard, 
  SdGuard, 
  SmpGuard, 
  KemenagGuard,
  MediaInfoGuard 
} from "../utils/AuthGuard";

// Lazy loaded components
const Dashboard = lazy(() => import("../pages/Dashboard"));
const BuatAkun = lazy(() => import("../pages/BuatAkun"));
const Pengumuman = lazy(() => import("../pages/Pengumuman"));
const HasilPPDB = lazy(() => import("../pages/HasilPPDB"));
const Informasi = lazy(() => import("../pages/Informasi"));
const Loginform = lazy(() => import("../components/forms/Loginform"));
const GrafikHome = lazy(()=> import("../pages/GrafikHome"));

// Admin components
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const TerimaZonasi = lazy(() => import("../pages/admin/penerimaan/TerimaZonasi"));
const TerimaPindahan = lazy(() => import("../pages/admin/penerimaan/TerimaPindahan"));
const TerimaAfirmasi = lazy(() => import("../pages/admin/penerimaan/TerimaAfirmasi"));
const DaftarZonasi = lazy(() => import("../pages/admin/pendaftaran/DaftarZonasi"));
const DaftarMandiri = lazy(() => import("../pages/admin/pendaftaran/DaftarMandiri"));
const DaftarPrestasi = lazy(() => import("../pages/admin/pendaftaran/DaftarPrestasi"));
const DaftarPindahan = lazy(() => import("../pages/admin/pendaftaran/DaftarPindahan"));
const DaftarAfirmasi = lazy(() => import("../pages/admin/pendaftaran/DaftarAfirmasi"));
const AdminProfile = lazy(() => import("../pages/admin/AdminProfile"));

// Super admin components
const SuperAdminDashboard = lazy(() => import("../pages/superadmin/SuperAdminDashboard"));
const Jadwals = lazy(() => import("../pages/superadmin/Jadwals"));
const DaftarPendaftar = lazy(() => import("../pages/superadmin/Monitoring/DaftarPendaftar"));
const NewsTicker = lazy(() => import("../pages/superadmin/NewsTicker"));
const Pagu = lazy(() => import("../pages/superadmin/Pagu"));
const Sekolah = lazy(() => import("../pages/superadmin/Sekolah"));
const Users = lazy(() => import("../pages/superadmin/UserManagement/Users"));
const Informasis = lazy(() => import("../pages/superadmin/Informasis"));
const Grafik = lazy(() => import("../pages/superadmin/Monitoring/Grafik"));
const Diterima = lazy(() => import("../pages/superadmin/Monitoring/Diterima"));
const DetailSiswa = lazy(() => import("../pages/superadmin/Monitoring/DetailSiswa"));
const BelumTampung = lazy(() => import("../pages/superadmin/Monitoring/BelumTampung"));
const KelolaBlmTampung = lazy(() => import("../pages/superadmin/Monitoring/KelolaBlmTampung"));
const Sessions = lazy(() => import("../pages/superadmin/UserManagement/Sessions"));
const Banner = lazy(() => import("../pages/superadmin/Banner"));
const DataPendaftaran = lazy(() => import("../pages/superadmin/DataPendaftaran"));

// User components
const CtkBuktiDaftar = lazy(() => import("../pages/User/CtkBuktiDaftar"));
const UserDashboard = lazy(() => import("../pages/User/UserDashboard"));
const UserProfile = lazy(() => import("../pages/User/UserProfile"));
const UploadDoc = lazy(() => import("../pages/User/UploadDoc"));
// const Pendaftaran = lazy(() => import("../pages/User/Pendaftaran"));
const CtkFormulir = lazy(() => import("../pages/User/CtkFormulir"));
const Nilai = lazy(() => import("../pages/User/Nilai"));
const CetakPendaftaran = lazy(() => import("../pages/Cetak/cetak-pendaftaran"));
const CetakPenerimaan = lazy(() => import("../pages/cetak/cetak-penerimaan"));

// // Wrapper component for Suspense
// const SuspenseWrapper = ({ children }) => (
//   <Suspense fallback={<Loading />}>
//     {children}
//   </Suspense>
// );

// Router configuration with error boundary
const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/buat-akun",
    element: <BuatAkun />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/pengumuman",
    element: <Pengumuman />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/hasil-ppdb",
    element: <HasilPPDB />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/GrafikHome",
    element: <GrafikHome />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/informasi",
    element: <Informasi />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/login",
    element: <Loginform />,
    errorElement: <ErrorBoundary />,
  },
  // Admin routes
  {
    path: "/admin",
    element: <AdminGuard><AdminDashboard /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/terimazonasi",
    element: <AdminGuard><TerimaZonasi /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/terimapindahan",
    element: <AdminGuard><TerimaPindahan /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/terimaafirmasi",
    element: <AdminGuard><TerimaAfirmasi /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/daftarzonasi",
    element: <AdminGuard><DaftarZonasi /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/daftarpindahan",
    element: <AdminGuard><DaftarPindahan /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/daftarafirmasi",
    element: <AdminGuard><DaftarAfirmasi /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/daftarprestasi",
    element: <AdminGuard><DaftarPrestasi /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/daftarmandiri",
    element: <AdminGuard><DaftarMandiri /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin/profile",
    element: <AdminGuard><AdminProfile /></AdminGuard>,
    errorElement: <ErrorBoundary />,
  },


  // Super admin routes
  {
    path: "/superadmin",
    element: <SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/jadwals",
    element: <MediaInfoGuard><Jadwals /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/daftarpendaftar",
    element: <SdGuard><DaftarPendaftar jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/daftarpendaftarpaud",
    element: <PaudTkGuard><DaftarPendaftar jenjang="PAUD" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/daftarpendaftarsmp",
    element: <SmpGuard><DaftarPendaftar jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/daftarpendaftarkemenag",
    element: <KemenagGuard><DaftarPendaftar jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/newsticker",
    element: <MediaInfoGuard><NewsTicker /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/pagu",
    element: <SdGuard><Pagu jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/pagupaud",
    element: <PaudTkGuard><Pagu jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/pagusmp",
    element: <SmpGuard><Pagu jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/pagukemenag",
    element: <KemenagGuard><Pagu jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/sekolah",
    element: <SdGuard><Sekolah jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/sekolahpaud",
    element: <PaudTkGuard><Sekolah jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/sekolahsmp",
    element: <SmpGuard><Sekolah jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/sekolahkemenag",
    element: <KemenagGuard><Sekolah jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/users",
    element: <SdGuard><Users jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/userspaud",
    element: <PaudTkGuard><Users jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/userssmp",
    element: <SmpGuard><Users jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/userskemenag",
    element: <KemenagGuard><Users jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/informasis",
    element: <MediaInfoGuard><Informasis /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/grafik",
    element: <SuperAdminGuard><Grafik jenjang="SD" /></SuperAdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/grafikpaud",
    element: <SuperAdminGuard><Grafik jenjang="PAUD/TK" /></SuperAdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/grafiksmp",
    element: <SuperAdminGuard><Grafik jenjang="SMP" /></SuperAdminGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterima",
    element: <SdGuard><Diterima jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimapaud",
    element: <PaudTkGuard><Diterima jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimasmp",
    element: <SmpGuard><Diterima jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimakemenag",
    element: <KemenagGuard><Diterima jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterima/:sekolahId",
    element: <SdGuard><DetailSiswa jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimapaud/:sekolahId",
    element: <PaudTkGuard><DetailSiswa jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimasmp/:sekolahId",
    element: <SmpGuard><DetailSiswa jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimakemenag/:sekolahId",
    element: <KemenagGuard><DetailSiswa jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/detailsiswa/:sekolahId",
    element: <MediaInfoGuard><DetailSiswa jenjang="SEMUA" /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/belumtampung",
    element: <SdGuard><BelumTampung jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/belumtampungpaud",
    element: <PaudTkGuard><BelumTampung jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/belumtampungsmp",
    element: <SmpGuard><BelumTampung jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/belumtampungkemenag",
    element: <KemenagGuard><BelumTampung jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/kelolablmtampung",
    element: <SdGuard><KelolaBlmTampung jenjang="SD" /></SdGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/kelolablmtampungpaud",
    element: <PaudTkGuard><KelolaBlmTampung jenjang="PAUD/TK" /></PaudTkGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/kelolablmtampungsmp",
    element: <SmpGuard><KelolaBlmTampung jenjang="SMP" /></SmpGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/kelolablmtampungkemenag",
    element: <KemenagGuard><KelolaBlmTampung jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/sessions",
    element: <MediaInfoGuard><Sessions /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/banner",
    element: <MediaInfoGuard><Banner /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/datapendaftaran",
    element: <MediaInfoGuard><DataPendaftaran /></MediaInfoGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimakemenag",
    element: <KemenagGuard><Diterima jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/superadmin/diterimakemenag/:sekolahId",
    element: <KemenagGuard><DetailSiswa jenjang="KEMENAG" /></KemenagGuard>,
    errorElement: <ErrorBoundary />,
  },
  // User routes
  {
    path: "/user",
    element: <UserGuard><UserDashboard /></UserGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/user/profile",
    element: <UserGuard><UserProfile /></UserGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/user/uploaddoc",
    element: <UserGuard><UploadDoc /></UserGuard>,
    errorElement: <ErrorBoundary />,
  },

  {
    path: "/user/ctkbuktidaftar",
    element: <UserGuard><CtkBuktiDaftar /></UserGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/user/ctkformulir",
    element: <UserGuard><CtkFormulir /></UserGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/user/nilai",
    element: <UserGuard><Nilai /></UserGuard>,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/cetak-pendaftaran/:id",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <CetakPendaftaran />
      </Suspense>
    ),
  },
  {
    path: "/cetak-penerimaan/:id",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <CetakPenerimaan />
      </Suspense>
    ),
  },
]);

export default router;
