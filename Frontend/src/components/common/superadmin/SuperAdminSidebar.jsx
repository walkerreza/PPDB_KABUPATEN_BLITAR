import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, List } from "@material-tailwind/react";
import { 
  PresentationChartBarIcon,
  UserCircleIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  NewspaperIcon,
  ChartBarIcon,
  UsersIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  ChevronDownIcon
} from "@heroicons/react/24/solid";
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SuperAdminSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Menggunakan useRef untuk menyimpan referensi dropdown
  const userManagementRef = useRef(null);
  const monitoringRef = useRef(null);
  
  // Ambil data user dari localStorage
  const userData = useMemo(() => {
    try {
      const data = localStorage.getItem('userData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing userData:', error);
      return null;
    }
  }, []);
  
  // Dapatkan id_grup_user
  const userRole = useMemo(() => {
    return userData ? userData.id_grup_user : null;
  }, [userData]);
  
  // Fungsi untuk cek apakah user memiliki akses ke menu tertentu
  const hasAccess = (allowedRoles) => {
    return allowedRoles.includes(userRole);
  };
  
  // Fungsi untuk mendapatkan jenjang berdasarkan role
  const getJenjangByRole = (role) => {
    switch(role) {
      case 4: return ['TK', 'PAUD']; // ID tipe sekolah untuk TK/PAUD
      case 5: return ['SD']; // ID tipe sekolah untuk SD
      case 6: return ['SMP']; // ID tipe sekolah untuk SMP
      case 7: return ['RA', 'MI', 'MTS']; // ID tipe sekolah untuk KEMENAG
      default: return []; // Untuk DINAS, tidak ada filter
    }
  };
  
  // Fungsi untuk mendapatkan URL berdasarkan role untuk halaman monitoring
  const getMonitoringUrlByRole = (baseUrl) => {
    switch(userRole) {
      case 4: return `${baseUrl}paud`; // Operator PAUD/TK
      case 5: return baseUrl; // Operator SD (default)
      case 6: return `${baseUrl}smp`; // Operator SMP
      case 7: return `${baseUrl}kemenag`; // Operator KEMENAG
      default: return baseUrl; // DINAS (default)
    }
  };

  // Initialize state from localStorage dengan lazy initialization
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('isUserManagementOpen');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('isMonitoringOpen');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Update localStorage when dropdown states change dengan debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('isUserManagementOpen', JSON.stringify(isUserManagementOpen));
    }, 100);
    return () => clearTimeout(timer);
  }, [isUserManagementOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('isMonitoringOpen', JSON.stringify(isMonitoringOpen));
    }, 100);
    return () => clearTimeout(timer);
  }, [isMonitoringOpen]);

  // Mengoptimalkan event listener dengan useCallback
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserManagementOpen && 
          userManagementRef.current && 
          !userManagementRef.current.contains(event.target)) {
        setIsUserManagementOpen(false);
      }
      
      if (isMonitoringOpen && 
          monitoringRef.current && 
          !monitoringRef.current.contains(event.target)) {
        setIsMonitoringOpen(false);
      }
    };

    // Hanya tambahkan event listener jika dropdown terbuka
    if (isUserManagementOpen || isMonitoringOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isUserManagementOpen, isMonitoringOpen]);

  // Memoize class styles untuk menghindari re-render yang tidak perlu
  const activeClass = useMemo(() => "align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-3 rounded-lg bg-gradient-to-tr from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:opacity-[0.85] w-full flex items-center gap-4 px-4 capitalize mb-1", []);
  const inactiveClass = useMemo(() => "align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-3 rounded-lg text-gray-200 hover:bg-gray-700 active:bg-gray-800 w-full flex items-center gap-4 px-4 capitalize mb-1", []);

  // Memoize toggle function untuk menghindari re-render
  const memoizedToggleSidebar = useMemo(() => {
    return isMobile ? toggleSidebar : () => {};
  }, [isMobile, toggleSidebar]);

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

   
      <div
        className={`fixed z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out ${
          isMobile 
            ? 'h-screen top-0 pt-[60px]' 
            : 'h-[calc(100vh-60px)] top-[60px]'
        } overflow-y-auto bg-gray-900`}
      >
        <Card className={`min-h-full ${
          isMobile 
            ? 'w-[260px] sm:w-[280px] md:w-[320px]' 
            : 'w-56 xl:w-64'
        } p-3 shadow-xl shadow-blue-gray-900/5 bg-gray-900 rounded-none border-0`}>
          <div className="mb-2 p-2">
            <p className="text-center text-sm font-semibold text-gray-200"></p>
          </div>

          {/* Title dengan padding lebih kecil */}
          <div className="mb-3">
            <h5 className="text-xs font-bold text-gray-400 uppercase px-4">MAIN NAVIGATION</h5>
          </div>

          <List className="min-w-[42px]">
            <Link 
              to="/superadmin" 
              className={location.pathname === '/superadmin' ? activeClass : inactiveClass}
              onClick={(e) => {
                e.preventDefault();
                memoizedToggleSidebar();
                navigate('/superadmin');
              }}
            >
              <PresentationChartBarIcon className="h-5 w-5" />
              Dashboard
            </Link>

            {/* MANAGEMENT */}
            <div className="my-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase px-4">MANAGEMENT</h5>
            </div>

            {/* User Management Dropdown */}
            {hasAccess([1, 4, 5, 6, 7]) && (
              <div ref={userManagementRef}>
                <button 
                  onClick={() => setIsUserManagementOpen(!isUserManagementOpen)}
                  className={inactiveClass}
                >
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="flex-1 text-left">User Management</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isUserManagementOpen ? 'rotate-180' : ''}`} />
                </button>
                {isUserManagementOpen && (
                  <div className="pl-4">
                    <Link 
                      to={getMonitoringUrlByRole("/superadmin/users")} 
                      className={location.pathname === '/superadmin/users' || 
                                location.pathname === '/superadmin/userspaud' || 
                                location.pathname === '/superadmin/userssmp' || 
                                location.pathname === '/superadmin/userskemenag' 
                                ? activeClass : inactiveClass}
                      onClick={(e) => {
                        e.preventDefault();
                        memoizedToggleSidebar();
                        navigate(getMonitoringUrlByRole("/superadmin/users"));
                      }}
                    >
                      <UsersIcon className="h-5 w-5" />
                      Users
                    </Link>
                    {/* Sessions hanya untuk DINAS */}
                    {hasAccess([1]) && (
                      <Link 
                        to="/superadmin/sessions" 
                        className={location.pathname === '/superadmin/sessions' ? activeClass : inactiveClass}
                        onClick={(e) => {
                          e.preventDefault();
                          memoizedToggleSidebar();
                          navigate('/superadmin/sessions');
                        }}
                      >
                        <ClipboardDocumentListIcon className="h-5 w-5" />
                        Sessions
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Monitoring Dropdown */}
            {hasAccess([1, 4, 5, 6, 7]) && (
              <div ref={monitoringRef}>
                <button 
                  onClick={() => setIsMonitoringOpen(!isMonitoringOpen)}
                  className={inactiveClass}
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span className="flex-1 text-left">Monitoring</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isMonitoringOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMonitoringOpen && (
                  <div className="pl-4">
                    <Link 
                      to={getMonitoringUrlByRole("/superadmin/daftarpendaftar")} 
                      className={location.pathname === '/superadmin/daftarpendaftar' || 
                                location.pathname === '/superadmin/daftarpendaftarpaud' || 
                                location.pathname === '/superadmin/daftarpendaftarsmp' || 
                                location.pathname === '/superadmin/daftarpendaftarkemenag' 
                                ? activeClass : inactiveClass}
                      onClick={(e) => {
                        e.preventDefault();
                        memoizedToggleSidebar();
                        navigate(getMonitoringUrlByRole("/superadmin/daftarpendaftar"));
                      }}
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                      Daftar Pendaftar
                    </Link>
                    <Link 
                      to={getMonitoringUrlByRole("/superadmin/diterima")}
                      className={location.pathname === '/superadmin/diterima' || 
                                location.pathname === '/superadmin/diterimapaud' || 
                                location.pathname === '/superadmin/diterimasmp' || 
                                location.pathname === '/superadmin/diterimakemenag' || 
                                location.pathname.startsWith('/superadmin/diterima/') || 
                                location.pathname.startsWith('/superadmin/diterimapaud/') || 
                                location.pathname.startsWith('/superadmin/diterimasmp/') || 
                                location.pathname.startsWith('/superadmin/diterimakemenag/') 
                                ? activeClass : inactiveClass}
                      onClick={(e) => {
                        e.preventDefault();
                        memoizedToggleSidebar();
                        navigate(getMonitoringUrlByRole("/superadmin/diterima"));
                      }}
                    >
                      <UsersIcon className="h-5 w-5" />
                      Diterima
                    </Link>
                    <Link 
                      to={getMonitoringUrlByRole("/superadmin/belumtampung")}
                      className={location.pathname === '/superadmin/belumtampung' || 
                                location.pathname === '/superadmin/belumtampungpaud' || 
                                location.pathname === '/superadmin/belumtampungsmp' || 
                                location.pathname === '/superadmin/belumtampungkemenag' 
                                ? activeClass : inactiveClass}
                      onClick={(e) => {
                        e.preventDefault();
                        memoizedToggleSidebar();
                        navigate(getMonitoringUrlByRole("/superadmin/belumtampung"));
                      }}
                    >
                      <UsersIcon className="h-5 w-5" />
                      Blm Tertampung
                    </Link>
                    <Link 
                      to={getMonitoringUrlByRole("/superadmin/kelolablmtampung")}
                      className={location.pathname === '/superadmin/kelolablmtampung' || 
                                location.pathname === '/superadmin/kelolablmtampungpaud' || 
                                location.pathname === '/superadmin/kelolablmtampungsmp' || 
                                location.pathname === '/superadmin/kelolablmtampungkemenag' 
                                ? activeClass : inactiveClass}
                      onClick={(e) => {
                        e.preventDefault();
                        memoizedToggleSidebar();
                        navigate(getMonitoringUrlByRole("/superadmin/kelolablmtampung"));
                      }}
                    >
                      <UsersIcon className="h-5 w-5" />
                      Kelola Blm Tampung
                    </Link>
                    {/* Grafik hanya untuk SuperAdmin Dinas */}
                    {hasAccess([1]) && (
                      <Link 
                        to="/superadmin/grafik"
                        className={location.pathname === '/superadmin/grafik' || 
                                  location.pathname === '/superadmin/grafikpaud' || 
                                  location.pathname === '/superadmin/grafiksmp' || 
                                  location.pathname === '/superadmin/grafikkemenag' 
                                  ? activeClass : inactiveClass}
                        onClick={(e) => {
                          e.preventDefault();
                          memoizedToggleSidebar();
                          navigate('/superadmin/grafik');
                        }}
                      >
                        <ChartBarIcon className="h-5 w-5" />
                        Grafik
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasAccess([1, 4, 5, 6, 7]) && (
              <Link 
                to={getMonitoringUrlByRole("/superadmin/pagu")}
                className={location.pathname === '/superadmin/pagu' || 
                          location.pathname === '/superadmin/pagupaud' || 
                          location.pathname === '/superadmin/pagusmp' || 
                          location.pathname === '/superadmin/pagukemenag' 
                          ? activeClass : inactiveClass}
                onClick={(e) => {
                  e.preventDefault();
                  memoizedToggleSidebar();
                  navigate(getMonitoringUrlByRole("/superadmin/pagu"));
                }}
              >
                <UsersIcon className="h-5 w-5" />
                Pagu
              </Link>
            )}

            {hasAccess([1, 4, 5, 6, 7]) && (
              <Link 
                to={getMonitoringUrlByRole("/superadmin/sekolah")}
                className={location.pathname === '/superadmin/sekolah' || 
                          location.pathname === '/superadmin/sekolahpaud' || 
                          location.pathname === '/superadmin/sekolahsmp' || 
                          location.pathname === '/superadmin/sekolahkemenag' 
                          ? activeClass : inactiveClass}
                onClick={(e) => {
                  e.preventDefault();
                  memoizedToggleSidebar();
                  navigate(getMonitoringUrlByRole("/superadmin/sekolah"));
                }}
              >
                <BuildingLibraryIcon className="h-5 w-5" />
                Sekolah
              </Link>
            )}

            {/* MEDIA & INFORMASI - Hanya untuk DINAS */}
            {hasAccess([1]) && (
              <>
                <div className="my-4">
                  <h5 className="text-xs font-bold text-gray-400 uppercase px-4">MEDIA & INFORMASI</h5>
                </div>

                <Link 
                  to="/superadmin/jadwals" 
                  className={location.pathname === '/superadmin/jadwals' ? activeClass : inactiveClass}
                  onClick={(e) => {
                    e.preventDefault();
                    memoizedToggleSidebar();
                    navigate('/superadmin/jadwals');
                  }}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Jadwal
                </Link>


                <Link 
                  to="/superadmin/DataPendaftaran" 
                  className={location.pathname === '/superadmin/DataPendaftaran' ? activeClass : inactiveClass}
                  onClick={(e) => {
                    e.preventDefault();
                    memoizedToggleSidebar();
                    navigate('/superadmin/DataPendaftaran');
                  }}
                >
                  <InformationCircleIcon className="h-5 w-5" />
                  Data Pendaftaran
                </Link>

                <Link 
                  to="/superadmin/informasis" 
                  className={location.pathname === '/superadmin/informasis' ? activeClass : inactiveClass}
                  onClick={(e) => {
                    e.preventDefault();
                    memoizedToggleSidebar();
                    navigate('/superadmin/informasis');
                  }}
                >
                  <InformationCircleIcon className="h-5 w-5" />
                  Informasi
                </Link>


                <Link 
                  to="/superadmin/newsticker" 
                  className={location.pathname === '/superadmin/newsticker' ? activeClass : inactiveClass}
                  onClick={(e) => {
                    e.preventDefault();
                    memoizedToggleSidebar();
                    navigate('/superadmin/newsticker');
                  }}
                >
                  <NewspaperIcon className="h-5 w-5" />
                  News Ticker
                </Link>

                
                <Link 
                  to="/superadmin/banner" 
                  className={location.pathname === '/superadmin/banner' ? activeClass : inactiveClass}
                  onClick={(e) => {
                    e.preventDefault();
                    memoizedToggleSidebar();
                    navigate('/superadmin/banner');
                  }}
                >
                  <PhotoIcon className="h-5 w-5" />
                  Banner
                </Link>
              </>
            )}
          </List>
        </Card>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
