import React from 'react';
import { Typography } from "@material-tailwind/react";

const AdminFooter = () => {
  return (
    <footer className="py-2 sm:py-4 px-4 sm:px-8 bg-white shadow-md">
      <div className="flex flex-col sm:flex-row w-full flex-wrap items-center justify-center gap-3 sm:gap-6 px-2">
        <Typography color="blue-gray" className="text-sm sm:text-base font-normal">
          &copy; {new Date().getFullYear()} Dinas Pendidikan Kabupaten Blitar
        </Typography>
        
      </div>
    </footer>
  );
};

export default AdminFooter;
