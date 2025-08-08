import React from 'react';
import { Button } from "@material-tailwind/react";
import { FaDownload } from "react-icons/fa";

const DownloadButton = ({ onClick, children, className, ...props }) => {
  return (
    <Button
      className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 ${className}`}
      onClick={onClick}
      {...props}
    >
      <FaDownload className="h-4 w-4" /> {children || "Download"}
    </Button>
  );
};

export default DownloadButton;