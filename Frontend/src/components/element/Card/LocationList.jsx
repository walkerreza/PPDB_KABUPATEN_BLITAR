import React from 'react';
import PropTypes from 'prop-types';

const LocationList = ({ 
  locations, 
  selectedId,
  onChange,
  className = ''
}) => {
  if (!locations?.length) return null;

  return (
    <div className={`flex flex-col gap-4 px-4 py-2 border border-gray-300 rounded-md ${className}`}>
      {locations.map(location => (
        <label key={location.id} className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="selected_location"
            value={location.id}
            checked={selectedId === location.id}
            onChange={() => onChange?.(location)}
            className="form-radio mr-2"
          />
          <span>
            {location.name}
            {location.distance !== undefined && (
              <span className="ml-2 text-gray-500">({location.distance} km)</span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
};

LocationList.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      distance: PropTypes.number
    })
  ),
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string
};

export default LocationList;
