import React from 'react';
import { Button } from "@material-tailwind/react";
import { FaInfoCircle } from "react-icons/fa";

const DetailButton = ({ onClick, children, ...props }) => {
  return (
    <Button
      size="sm"
      variant="filled"
      className="flex items-center gap-2 bg-blue-500 px-4 py-2"
      onClick={onClick}
      {...props}
    >
      <FaInfoCircle className="h-4 w-4" />
      {children || "Detail"}
    </Button>
  );
};

export default DetailButton;
