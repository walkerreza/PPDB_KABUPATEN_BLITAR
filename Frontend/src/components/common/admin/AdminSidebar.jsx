import React, { useState, useEffect, useRef } from 'react';
import { Card, List, IconButton } from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  UserPlusIcon,
  DocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/solid";
import { useLocation, useNavigate } from 'react-router-dom';
import { asset } from '../../../assets/asset';

const AdminSidebar = ({ isOpen, toggleSidebar, isMobile, userData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRefs = useRef({
    pendaftaran: useRef(null),
    penerimaan: useRef(null),
    mendaftarkan: useRef(null)
  });

  const [pendaftaranOpen, setPendaftaranOpen] = useState(() => {
    const saved = localStorage.getItem('pendaftaranOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [penerimaanOpen, setPenerimaanOpen] = useState(() => {
    const saved = localStorage.getItem('penerimaanOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [mendaftarkanOpen, setMendaftarkanOpen] = useState(() => {
    const saved = localStorage.getItem('mendaftarkanOpen');
    return saved ? JSON.parse(saved) : false;
  });

  // Update localStorage when dropdown states change
  useEffect(() => {
    localStorage.setItem('pendaftaranOpen', JSON.stringify(pendaftaranOpen));
  }, [pendaftaranOpen]);

  useEffect(() => {
    localStorage.setItem('penerimaanOpen', JSON.stringify(penerimaanOpen));
  }, [penerimaanOpen]);

  useEffect(() => {
    localStorage.setItem('mendaftarkanOpen', JSON.stringify(mendaftarkanOpen));
  }, [mendaftarkanOpen]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check Pendaftaran dropdown
      if (pendaftaranOpen &&
        dropdownRefs.current.pendaftaran.current &&
        !dropdownRefs.current.pendaftaran.current.contains(event.target)) {
        setPendaftaranOpen(false);
      }

      // Check Penerimaan dropdown
      if (penerimaanOpen &&
        dropdownRefs.current.penerimaan.current &&
        !dropdownRefs.current.penerimaan.current.contains(event.target)) {
        setPenerimaanOpen(false);
      }

      // Check Mendaftarkan dropdown
      if (mendaftarkanOpen &&
        dropdownRefs.current.mendaftarkan.current &&
        !dropdownRefs.current.mendaftarkan.current.contains(event.target)) {
        setMendaftarkanOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pendaftaranOpen, penerimaanOpen, mendaftarkanOpen]);

  const activeClass = "align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-3 rounded-lg bg-gradient-to-tr from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:opacity-[0.85] w-full flex items-center gap-4 px-4 capitalize mb-1";
  const inactiveClass = "align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-3 rounded-lg text-gray-200 hover:bg-gray-700 active:bg-gray-800 w-full flex items-center gap-4 px-4 capitalize mb-1";
  // const subMenuClass = "pl-8 py-2 pr-20 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-all flex items-center gap-4";
  // const activeSubMenuClass = "pl-8 py-2 pr-20 text-sm bg-gradient-to-tr from-blue-500 to-blue-600 text-white rounded-lg transition-all flex items-center gap-4";

  const handleLinkClick = (path) => {
    if (isMobile) {
      toggleSidebar();
    }
    navigate(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out ${isMobile
            ? 'h-screen top-0 pt-[60px]'
            : 'h-[calc(100vh-60px)] top-[60px]'
          } overflow-y-auto bg-gray-900`}
      >
        <Card className={`min-h-full ${isMobile
          ? 'w-[240px] sm:w-[280px] md:w-[320px]'
          : 'w-56 xl:w-64'
          } p-3 shadow-xl shadow-blue-gray-900/5 bg-gray-900 rounded-none border-0`}>
          <div className="mb-2 p-2">
            <p className="text-center text-sm font-semibold text-gray-200">Admin Sekolah</p>
          </div>

          {/* Title Section */}
          <div className="mb-3">
            <h5 className="text-xs font-bold text-gray-400 uppercase px-2">MAIN NAVIGATION</h5>
          </div>

          <List className="min-w-[42px]">
            <button
              onClick={() => handleLinkClick('/admin')}
              className={location.pathname === '/admin' ? activeClass : inactiveClass}
            >
              <PresentationChartBarIcon className="h-5 w-5" />
              Dashboard
            </button>



            {/* Title Section */}
            <div className="my-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase px-2 sm:px-4">PENERIMAAN / PENDAFTARAN</h5>
            </div>


            {/* Penerimaan Dropdown */}
            {/* Tombol Pindahan hanya ditampilkan untuk SDN, SDS, SMPN, dan SMPS */}
            {(userData?.sekolah?.id_tipe_sekolah === 211 ||
              userData?.sekolah?.id_tipe_sekolah === 212 ||
              userData?.sekolah?.id_tipe_sekolah === 311 ||
              userData?.sekolah?.id_tipe_sekolah === 312) && (
                <div ref={dropdownRefs.current.penerimaan}>
                  <button
                    onClick={() => setPenerimaanOpen(!penerimaanOpen)}
                    className={`${inactiveClass} mb-1 justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <DocumentCheckIcon className="h-5 w-5" />
                      <span>Penerimaan</span>
                    </div>
                    {penerimaanOpen ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                  {penerimaanOpen && (
                    <div className="mb-2">
                      <button
                        onClick={() => handleLinkClick('/admin/terimazonasi')}
                        className={location.pathname.includes('/admin/terimazonasi') ? activeClass : inactiveClass}
                      >
                        <CheckCircleIcon className="h-5 w-5 text-red-500" />
                        Domisili
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* Pendaftaran Dropdown */}
            <div ref={dropdownRefs.current.pendaftaran}>
              <button
                onClick={() => setPendaftaranOpen(!pendaftaranOpen)}
                className={`${inactiveClass} mb-1 justify-between`}
              >
                <div className="flex items-center gap-4">
                  <UserPlusIcon className="h-5 w-5" />
                  <span>Pendaftaran</span>
                </div>
                {pendaftaranOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              {pendaftaranOpen && (
                <div className="mb-2">

                  {/* Tombol Pindahan hanya ditampilkan untuk SDN, SDS, SMPN, dan SMPS */}
                  {(userData?.sekolah?.id_tipe_sekolah === 211 ||
                    userData?.sekolah?.id_tipe_sekolah === 212 ||
                    userData?.sekolah?.id_tipe_sekolah === 311 ||
                    userData?.sekolah?.id_tipe_sekolah === 312) && (
                      <button
                        onClick={() => handleLinkClick('/admin/daftarpindahan')}
                        className={location.pathname.includes('/admin/daftarpindahan') ? activeClass : inactiveClass}
                      >
                        <div className="flex items-center gap-4 rounded-lg px-2 py-1">
                          <UserIcon className="h-5 w-5 text-blue-700" />
                          <span>Pindahan</span>
                        </div>
                      </button>
                    )}

                  {/* Tombol Afirmasi hanya ditampilkan untuk SDN, SDS, MIN, MIS, SMPN, SMPS, MTSN dan MTSS */}
                  {(userData?.sekolah?.id_tipe_sekolah === 211 ||
                    userData?.sekolah?.id_tipe_sekolah === 212 ||
                    userData?.sekolah?.id_tipe_sekolah === 221 ||
                    userData?.sekolah?.id_tipe_sekolah === 222 ||
                    userData?.sekolah?.id_tipe_sekolah === 311 ||
                    userData?.sekolah?.id_tipe_sekolah === 312 ||
                    userData?.sekolah?.id_tipe_sekolah === 321 ||
                    userData?.sekolah?.id_tipe_sekolah === 322) && (
                      <button
                        onClick={() => handleLinkClick('/admin/daftarafirmasi')}
                        className={location.pathname.includes('/admin/daftarafirmasi') ? activeClass : inactiveClass}
                      >
                        <div className="flex items-center gap-4 rounded-lg px-2 py-1">
                          <UserIcon className="h-5 w-5 text-green-600" />
                          <span>Afirmasi</span>
                        </div>
                      </button>
                    )}

                  {/* Tombol Prestasi hanya ditampilkan untuk MIN, MIS, SMPN, SMPS, MTSN dan MTSS */}
                  {(userData?.sekolah?.id_tipe_sekolah === 221 ||
                    userData?.sekolah?.id_tipe_sekolah === 222 ||
                    userData?.sekolah?.id_tipe_sekolah === 311 ||
                    userData?.sekolah?.id_tipe_sekolah === 312 ||
                    userData?.sekolah?.id_tipe_sekolah === 321 ||
                    userData?.sekolah?.id_tipe_sekolah === 322) && (
                      <button
                        onClick={() => handleLinkClick('/admin/daftarprestasi')}
                        className={location.pathname.includes('/admin/daftarprestasi') ? activeClass : inactiveClass}
                      >
                        <div className="flex items-center gap-4 rounded-lg px-2 py-1">
                          <UserIcon className="h-5 w-5 text-yellow-600" />
                          <span>Prestasi</span>
                        </div>
                      </button>
                    )}

                  {/* Tombol Reguler hanya ditampilkan untuk TK, RA, MIN, MIS, MTSN dan MTSS */}
                  {(userData?.sekolah?.id_tipe_sekolah === 112 ||
                    userData?.sekolah?.id_tipe_sekolah === 122 ||
                    userData?.sekolah?.id_tipe_sekolah === 221 ||
                    userData?.sekolah?.id_tipe_sekolah === 222 ||
                    userData?.sekolah?.id_tipe_sekolah === 321 ||
                    userData?.sekolah?.id_tipe_sekolah === 322) && (
                      <button
                        onClick={() => handleLinkClick('/admin/daftarmandiri')}
                        className={location.pathname.includes('/admin/daftarmandiri') ? activeClass : inactiveClass}
                      >
                        <div className="flex items-center gap-4 rounded-lg px-2 py-1">
                          <UserIcon className="h-5 w-5 text-red-600" />
                          <span>Reguler</span>
                        </div>
                      </button>
                    )}
                </div>
              )}
            </div>

            {/* Mendaftarkan Dropdown */}
            {/* Tombol Mendaftarkan hanya ditampilkan untuk SDN, SDS, SMPN, dan SMPS */}
            {(userData?.sekolah?.id_tipe_sekolah === 211 ||
              userData?.sekolah?.id_tipe_sekolah === 212 ||
              userData?.sekolah?.id_tipe_sekolah === 311 ||
              userData?.sekolah?.id_tipe_sekolah === 312) && (
                <div ref={dropdownRefs.current.mendaftarkan}>
                  <button
                    onClick={() => setMendaftarkanOpen(!mendaftarkanOpen)}
                    className={`${inactiveClass} mb-1 justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <UserPlusIcon className="h-5 w-5" />
                      <span>Mendaftarkan</span>
                    </div>
                    {mendaftarkanOpen ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                  {mendaftarkanOpen && (
                    <div className="mb-2">
                      <button
                        onClick={() => handleLinkClick('/admin/daftarzonasi')}
                        className={location.pathname.includes('/admin/daftarzonasi') ? activeClass : inactiveClass}
                      >
                        <div className="flex items-center gap-4 rounded-lg px-2 py-1">
                          <UserIcon className="h-5 w-5 text-red-500" />
                          <span>Domisili</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

            <button
              onClick={() => handleLinkClick('/admin/profile')}
              className={location.pathname === '/admin/profile' ? activeClass : inactiveClass}
            >
              <UserCircleIcon className="h-5 w-5" />
              Profile
            </button>
          </List>
        </Card>
      </div>
    </>
  );
};

export default AdminSidebar;
