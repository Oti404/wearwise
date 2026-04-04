import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { X, Search, MapPin, Check } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}) => {
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 46.7712, // Default Cluj
    longitude: initialLocation?.longitude || 23.6236,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialLocation?.latitude || 46.7712,
    longitude: initialLocation?.longitude || 23.6236,
  });

  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat: number, lon: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: { 'User-Agent': 'WearWiseApp' },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    setMarkerPosition({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
    // Trigger reverse geocode when map stops moving
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      // Use Nominatim (OpenStreetMap) Geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        {
          headers: {
            'User-Agent': 'WearWiseApp',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newCoords = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        };
        setRegion({
          ...newCoords,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        });
        setAddress(display_name);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      address,
      latitude: region.latitude,
      longitude: region.longitude,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#2B2B2B" />
          </TouchableOpacity>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Search address..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#5A2D82" />
              ) : (
                <Search size={20} color="#5A2D82" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Pin Crosshair Overlay */}
        <View style={[styles.markerFixed, { pointerEvents: 'none' as any }]}>
           <MapPin size={40} color="#5A2D82" fill="#FAF7F2" strokeWidth={3} />
           <View style={styles.pinShadow} />
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        />

        {/* Info Card & Action */}
        <View style={styles.footer}>
          <View style={styles.infoRow}>
            {addressLoading ? (
               <ActivityIndicator size="small" color="#5A2D82" />
            ) : (
               <MapPin size={20} color="#5A2D82" />
            )}
            <Text style={styles.addressText} numberOfLines={2}>
              {addressLoading ? 'Searching address...' : (address || 'Move the map to choose the location')}
            </Text>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm Location</Text>
            <Check size={20} color="#F4C542" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    gap: 12,
  },
  closeBtn: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }
    }),
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderRadius: 20,
    height: 52,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }
    }),
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2B2B2B' },
  map: { width: width, height: height },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40, // Half of icon size + some offset for center
    marginLeft: -20,
    zIndex: 5,
    alignItems: 'center',
  },
  pinShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: -2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.15)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
      }
    }),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  addressText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#5A2D82' },
  confirmBtn: {
    backgroundColor: '#5A2D82',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  confirmText: { color: '#F4C542', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  customMarker: {
    ...Platform.select({
      web: { boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.3)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      }
    }),
  }
});
