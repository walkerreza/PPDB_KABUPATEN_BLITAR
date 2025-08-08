import React from 'react';
import PropTypes from 'prop-types';

const DistanceInfo = ({ locations, className = '' }) => {
  if (!locations?.length) return null;

  return (
    <div className={`bg-white p-3 rounded-lg shadow-lg ${className}`}>
      <h3 className="font-bold mb-2 text-gray-800">Jarak ke Lokasi:</h3>
      {locations.map(location => (
        <div key={location.id} className="text-sm text-gray-600 mb-1">
          {location.name}: <span className="font-semibold">{location.distance} km</span>
        </div>
      ))}
    </div>
  );
};

DistanceInfo.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      distance: PropTypes.number.isRequired
    })
  ),
  className: PropTypes.string
};

export default DistanceInfo;
