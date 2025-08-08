import React from 'react';
import { Typography } from "@material-tailwind/react";

const SuperAdminFooter = () => {
  // Menggunakan variabel tahun yang tetap selama komponen hidup
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-2 sm:py-4 px-4 sm:px-8 bg-white shadow-md">
      <div className="flex flex-col sm:flex-row w-full flex-wrap items-center justify-center gap-3 sm:gap-6 px-2">
        <Typography color="blue-gray" className="text-sm sm:text-base font-normal">
          &copy; {currentYear} Dinas Pendidikan Kabupaten Blitar
        </Typography>
      </div>
    </footer>
  );
};

// Menggunakan React.memo untuk mencegah render ulang yang tidak perlu
export default React.memo(SuperAdminFooter);
