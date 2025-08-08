import React, { useMemo } from 'react';
import { Marker } from '@react-google-maps/api';
import markerIcon from '../../../assets/icons/marker.svg';

const NearestMarker = ({ schools, userLocation }) => {
  // Jika tidak ada lokasi user atau sekolah, return null
  if (!userLocation || !schools || schools.length === 0) return null;

  // Fungsi untuk menghitung jarak antara dua titik koordinat
  const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Radius bumi dalam kilometer
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const deltaLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const deltaLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Jarak dalam kilometer
  };

  // Menghitung jarak untuk semua sekolah dan mencari yang terdekat
  const schoolsWithDistance = useMemo(() => {
    return schools.map(school => ({
      ...school,
      distance: calculateDistance(userLocation, school.coordinates)
    })).sort((a, b) => a.distance - b.distance);
  }, [schools, userLocation]);

  const nearestSchool = schoolsWithDistance[0];

  return (
    <>
      {/* Render semua marker sekolah */}
      {schoolsWithDistance.map((school, index) => (
        <Marker
          key={school.id || index}
          position={school.coordinates}
          icon={{
            url: markerIcon,
            scaledSize: new window.google.maps.Size(
              school === nearestSchool ? 40 : 30,
              school === nearestSchool ? 40 : 30
            ),
            anchor: new window.google.maps.Point(
              school === nearestSchool ? 20 : 15,
              school === nearestSchool ? 40 : 30
            ),
            labelOrigin: new window.google.maps.Point(
              school === nearestSchool ? 20 : 15,
              -8
            )
          }}
          label={{
            text: String(index + 1),
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title={`${school.name} (${school.distance.toFixed(2)} km)${school === nearestSchool ? ' - Terdekat' : ''}`}
        />
      ))}
    </>
  );
};

export default NearestMarker;
