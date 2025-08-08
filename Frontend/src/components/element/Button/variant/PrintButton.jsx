import React from 'react';
import { Button } from '@material-tailwind/react';
import { PrinterIcon } from '@heroicons/react/24/solid';

const PrintButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  size = 'md',
  color = 'blue',
  variant = 'gradient',
  ...props 
}) => {
  return (
    <Button
      size={size}
      color={color}
      variant={variant}
      className={`group flex items-center gap-3 ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <PrinterIcon 
        strokeWidth={2} 
        className={`h-5 w-5 transition-transform group-hover:scale-110`}
      />
      {children}
    </Button>
  );
};

export default PrintButton;
