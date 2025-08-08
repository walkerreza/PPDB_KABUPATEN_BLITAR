import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, Circle, Marker, useLoadScript } from '@react-google-maps/api';
import { MdMyLocation } from 'react-icons/md';
import { Typography } from '@material-tailwind/react';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import markerBlueIcon from '../../../assets/icons/marker-blue.svg';

const libraries = ['places', 'geometry'];

// Wrapper component yang menangani loading Google Maps
const MapsWrapper = (props) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    googleMapsClientId: import.meta.env.VITE_GOOGLE_MAPS_CLIENT_ID,
    language: 'id',
    region: 'ID',
    version: 'weekly'
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return <Maps {...props} />;
};

const MapComponent = ({ 
  mapStyle,
  center,
  coordinates,
  mapType,
  isMapLoaded,
  onMapLoad,
  handleMapClick,
  areaOptions,
  additionalMarkers = []
}) => {
  // Bikin marker icon di dalam komponen setelah maps load
  const markerIcon = {
    url: markerBlueIcon,
    scaledSize: new window.google.maps.Size(40, 40),
    origin: new window.google.maps.Point(0, 0),
    anchor: new window.google.maps.Point(20, 40)
  };

  // Optimize marker rendering dengan useMemo
  const memoizedMarkers = useMemo(() => 
    additionalMarkers.map((marker) => (
      <Marker
        key={marker.id}
        position={marker.coordinates}
      />
    )),
    [additionalMarkers]
  );

  return (
    <GoogleMap
      mapContainerStyle={mapStyle}
      center={center}
      zoom={15}
      onLoad={onMapLoad}
      onClick={handleMapClick}
      options={{
        zoomControl: true,
        mapTypeId: mapType,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        maxZoom: 20,
        minZoom: 10,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        disableDoubleClickZoom: true,
        scrollwheel: true,
        optimized: true
      }}
    >
      {coordinates && (
        <Marker
          position={coordinates}
          icon={markerIcon}
        />
      )}
      {memoizedMarkers}
      {areaOptions && (
        <Circle
          center={coordinates}
          options={areaOptions}
        />
      )}
    </GoogleMap>
  );
};

const Maps = ({ 
  center,
  coordinates,
  mapType = 'roadmap',
  setMapType,
  isLocating,
  onMapLoad,
  handleMapClick,
  isMapLoaded,
  containerStyle,
  areaOptions,
  setCoordinates,
  setAddress,
  additionalMarkers = []
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const getCurrentLocation = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (navigator.geolocation) {
      setIsTracking(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCoordinates(newCoords);

          try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: newCoords });
            if (response.results[0]) {
              setAddress(response.results[0].formatted_address);
            }
          } catch (error) {
            console.error('Error getting address:', error);
          }

          // Start watching position after getting initial location
          const id = navigator.geolocation.watchPosition(
            async (pos) => {
              const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              };
              
              setCoordinates(coords);

              try {
                const geocoder = new window.google.maps.Geocoder();
                const response = await geocoder.geocode({ location: coords });
                if (response.results[0]) {
                  setAddress(response.results[0].formatted_address);
                }
              } catch (error) {
                console.error('Error getting address:', error);
              }
            },
            (error) => {
              console.error('Error tracking location:', error);
              setIsTracking(false);
              if (error.code === error.PERMISSION_DENIED) {
                alert('Izin lokasi ditolak. Silakan aktifkan GPS dan izinkan akses lokasi di pengaturan browser Anda.');
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
          setWatchId(id);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsTracking(false);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Izin lokasi ditolak. Silakan aktifkan GPS dan izinkan akses lokasi di pengaturan browser Anda.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert('Lokasi tidak tersedia. Pastikan GPS Anda aktif dan cobalah di luar ruangan.');
          } else if (error.code === error.TIMEOUT) {
            alert('Waktu pencarian lokasi habis. Silakan coba lagi.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Browser Anda tidak mendukung geolokasi');
    }
  }, [setCoordinates, setAddress]);

  const stopTracking = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Cleanup watch position when component unmounts
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const mapStyle = {
    width: '100%',
    height: '100%',
    ...containerStyle
  };

  return (
    <div className="w-full space-y-2">
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
        <div className={`flex justify-between items-center ${isFullscreen ? 'p-4 border-b' : ''}`}>
          <Typography variant="small" className="text-gray-700">Peta</Typography>
          <div className="flex gap-2">
            {/* Tombol Lokasi Saya - dinonaktifkan untuk sementara
            <button
              type="button"
              onClick={isTracking ? stopTracking : getCurrentLocation}
              className={`flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors
                ${isTracking 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              title={isTracking ? 'Matikan Pelacakan Lokasi' : 'Aktifkan Pelacakan Lokasi'}
            >
              <MdMyLocation size={16} className={isTracking ? 'animate-pulse' : ''} />
              <span>Lokasi Saya</span>
            </button>
            */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFullscreen(!isFullscreen);
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <MdFullscreenExit size={20} /> : <MdFullscreen size={20} />}
            </button>
          </div>
        </div>

        <div className={`relative ${isFullscreen ? 'h-[calc(100vh-64px)]' : 'h-[400px]'}`}>
          <MapComponent
            mapStyle={mapStyle}
            center={coordinates || center}
            coordinates={coordinates}
            mapType={mapType}
            isMapLoaded={isMapLoaded}
            onMapLoad={onMapLoad}
            handleMapClick={handleMapClick}
            areaOptions={areaOptions}
            additionalMarkers={additionalMarkers}
          />
        </div>
      </div>
    </div>
  );
};

export default MapsWrapper;