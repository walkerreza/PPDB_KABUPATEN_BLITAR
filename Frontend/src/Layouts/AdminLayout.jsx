// import React, { useState } from 'react';
// import { Outlet } from 'react-router-dom';
// import AdminHeader from '../components/layout/admin/AdminHeader';
// import AdminSidebar from '../components/layout/admin/AdminSidebar';

// const AdminLayout = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <AdminHeader toggleSidebar={toggleSidebar} />
//       <div className="flex">
//         <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
//         <main className="flex-1 p-4">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default AdminLayout;
