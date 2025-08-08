import React from 'react';
import { Button } from "@material-tailwind/react";
import { FaTrash } from "react-icons/fa";

const DeleteButton = ({ onClick, children, className, ...props }) => {
  return (
    <Button
      className={`flex items-center gap-2 bg-red-500 hover:bg-red-600 ${className}`}
      onClick={onClick}
      {...props}
    >
      <FaTrash className="h-4 w-4" /> {children || ""}
    </Button>
  );
};

export default DeleteButton;