import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDownIcon,
  CalculatorIcon
} from "@heroicons/react/24/solid";
import { Link, useLocation, useNavigate } from 'react-router-dom';

const UserSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRefs = useRef({
    userManagement: useRef(null),
    monitoring: useRef(null)
  });
  
  // Initialize state from localStorage
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(() => {
    const saved = localStorage.getItem('isUserManagementOpen');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(() => {
    const saved = localStorage.getItem('isMonitoringOpen');
    return saved ? JSON.parse(saved) : false;
  });

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const savedFormData = localStorage.getItem('formPendaftaran');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // Update localStorage when dropdown states change
  useEffect(() => {
    localStorage.setItem('isUserManagementOpen', JSON.stringify(isUserManagementOpen));
  }, [isUserManagementOpen]);

  useEffect(() => {
    localStorage.setItem('isMonitoringOpen', JSON.stringify(isMonitoringOpen));
  }, [isMonitoringOpen]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check User Management dropdown
      if (isUserManagementOpen && 
          dropdownRefs.current.userManagement.current && 
          !dropdownRefs.current.userManagement.current.contains(event.target)) {
        setIsUserManagementOpen(false);
      }
      
      // Check Monitoring dropdown
      if (isMonitoringOpen && 
          dropdownRefs.current.monitoring.current && 
          !dropdownRefs.current.monitoring.current.contains(event.target)) {
        setIsMonitoringOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserManagementOpen, isMonitoringOpen]);

  const activeClass = "align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-3 rounded-lg bg-gradient-to-tr from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:opacity-[0.85] w-full flex items-center gap-4 px-4 capitalize mb-1";
  const inactiveClass = "align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-sm py-3 rounded-lg text-gray-200 hover:bg-gray-700 active:bg-gray-800 w-full flex items-center gap-4 px-4 capitalize mb-1";

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

   
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out ${
          isMobile 
            ? 'h-screen top-0 pt-[60px]' 
            : 'h-[calc(100vh-60px)] top-[60px]'
        } overflow-y-auto custom-scrollbar bg-gray-900`}
      >
        <Card className={`min-h-full ${
          isMobile 
            ? 'w-[240px] sm:w-[280px] md:w-[320px]' 
            : 'w-56 xl:w-64'
        } p-3 shadow-xl shadow-blue-gray-900/5 bg-gray-900 rounded-none border-0`}>
        

          {/* Title dengan padding lebih kecil */}
          <div className="my-4">
            <h5 className="text-xs font-bold text-gray-400 uppercase px-4">MAIN NAVIGATION</h5>
          </div>

          <List className="min-w-[42px]">
            <Link to="/user" className={location.pathname === '/user' ? activeClass : inactiveClass}>
              <PresentationChartBarIcon className="h-5 w-5" />
              Dashboard
            </Link>
        
            

            <Link to="/user/nilai" className={location.pathname === '/user/nilai' ? activeClass : inactiveClass}>
              <CalculatorIcon className="h-5 w-5" />
              Nilai
            </Link>

            {/* PENDAFTARAN */}
      

            <Link to="/user/uploaddoc" className={location.pathname === '/user/uploaddoc' ? activeClass : inactiveClass}>
              <PhotoIcon className="h-5 w-5" />
              Upload Dokumen
            </Link>
            <Link to="/user/ctkbuktidaftar" className={location.pathname === '/user/ctkbuktidaftar' ? activeClass : inactiveClass}>
                  <NewspaperIcon className="h-5 w-5" />
                  Cetak Bukti Daftar
                </Link>

            {/* {formData && (
              <> */}

                <Link to="/user/ctkformulir" className={location.pathname === '/user/ctkformulir' ? activeClass : inactiveClass}>
                  <NewspaperIcon className="h-5 w-5" />
                  Cetak Formulir
                </Link>
              {/* </>
            )} */}


            {/* PROFILE */}
            <div className="my-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase px-4">PROFILE</h5>
            </div>

            <Link to="/user/profile" className={location.pathname === '/user/profile' ? activeClass : inactiveClass}>
              <UserCircleIcon className="h-5 w-5" />
              Profile
            </Link>
          </List>
        </Card>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </>
  );
};

export default UserSidebar;
