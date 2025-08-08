import React from 'react';

const Skeleton = ({ height = 'h-64', width = 'w-full' }) => {
  return (
    <div className={`animate-pulse ${width}`}>
      <div className={`${height} bg-gray-200 rounded`} 
           style={{minHeight: typeof height === 'number' ? `${height}px` : undefined}} />
    </div>
  );
};

// Card skeleton untuk dashboard
export const CardSkeleton = () => (
  <div className="animate-pulse bg-white p-4 rounded-lg shadow">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-1/2" />
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5 }) => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-full mb-4" />
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 rounded w-full mb-2" />
    ))}
  </div>
);

// Form field skeleton
export const FormFieldSkeleton = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 rounded w-1/4" />
    <div className="h-10 bg-gray-200 rounded w-full" />
  </div>
);

export default Skeleton;
