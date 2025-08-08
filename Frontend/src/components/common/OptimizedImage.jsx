import React, { useState } from 'react';
import Skeleton from './Skeleton';

const OptimizedImage = ({ 
  src, 
  alt, 
  width = 800, 
  height = 450, 
  className = '',
  priority = false 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className="relative" style={{ aspectRatio: `${width}/${height}` }}>
      {isLoading && <Skeleton height={height} />}
      
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover ${isLoading ? 'invisible' : 'visible'} ${className}`}
        loading={priority ? 'eager' : 'lazy'}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          Gambar tidak tersedia
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
