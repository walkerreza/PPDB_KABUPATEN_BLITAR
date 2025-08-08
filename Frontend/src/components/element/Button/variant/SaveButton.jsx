import React from 'react';
import { Button } from "@material-tailwind/react";
import { FaSave } from "react-icons/fa";

const SaveButton = ({ onClick, children, className, ...props }) => {
  return (
    <Button
      className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white ${className}`}
      onClick={onClick}
      {...props}
    >
      <FaSave className="h-4 w-4" /> {children || "Simpan"}
    </Button>
  );
};

export default SaveButton;