import React from 'react';
import { Button } from "@material-tailwind/react";
import { FaEdit } from "react-icons/fa";

const EditButton = ({ onClick, children, className, ...props }) => {
  return (
    <Button
      className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 ${className}`}
      onClick={onClick}
      {...props}
    >
      <FaEdit className="h-4 w-4" /> {children || ""}
    </Button>
  );
};

export default EditButton;