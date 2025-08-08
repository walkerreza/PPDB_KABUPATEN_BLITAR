import React from 'react';
import { Typography } from "@material-tailwind/react";

const UserFooter = () => {
  return (
    <footer className="py-2 sm:py-4 px-4 sm:px-8 bg-white shadow-md">
      <div className="flex flex-col sm:flex-row w-full flex-wrap items-center justify-center gap-3 sm:gap-6 px-2">
        <Typography color="blue-gray" className="text-sm sm:text-base font-normal"> Copyright
          &copy; {new Date().getFullYear()} DISKOMINFO KOTA BLITAR
        </Typography>
      
        
      </div>
    </footer>
  );
};

export default UserFooter;
