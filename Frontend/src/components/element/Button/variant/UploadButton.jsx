import React from 'react';
import { Button } from '@material-tailwind/react';
import { CloudArrowUpIcon } from '@heroicons/react/24/solid';

const UploadButton = ({ onClick, disabled = false, className = '', children = 'Upload' }) => {
  return (
    <Button
      type="submit"
      className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <CloudArrowUpIcon className="h-4 w-4" />
      {children}
    </Button>
  );
};

export default UploadButton;
