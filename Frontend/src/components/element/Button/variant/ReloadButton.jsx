import React from 'react';
import { Button } from "@material-tailwind/react";
import { FaSync } from "react-icons/fa";

const ReloadButton = ({ className, ...props }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Button
      className={`flex items-center gap-2 bg-white hover:bg-gray-500 text-black ${className}`}
      onClick={handleReload}
      {...props}
    >
      <FaSync className="h-4 w-4" /> Reload
    </Button>
  );
};

export default ReloadButton;
