import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { X, Search, MapPin, Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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
  const [coords, setCoords] = useState({
    latitude: initialLocation?.latitude || 46.7712,
    longitude: initialLocation?.longitude || 23.6236,
  });

  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const iframeRef = useRef<any>(null);
  const isMapInitialized = useRef(false);

  // Memoize map HTML so it doesn't change and cause iframe reloads
  const mapHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .center-marker {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1000;
          pointer-events: none;
        }
        .marker-icon {
          width: 40px;
          height: 40px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="center-marker">
         <svg class="marker-icon" viewBox="0 0 24 24" fill="#F4C542" stroke="#5A2D82" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
           <circle cx="12" cy="10" r="3" fill="#5A2D82"></circle>
         </svg>
      </div>
      <script>
        let map;
        function initMap(lat, lon) {
          if (map) return;
          map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([lat, lon], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          map.on('moveend', function() {
            const center = map.getCenter();
            window.parent.postMessage({
              type: 'onLocationChange',
              latitude: center.lat,
              longitude: center.lng
            }, '*');
          });
        }

        window.addEventListener('message', function(event) {
          if (event.data.type === 'init') {
            initMap(event.data.latitude, event.data.longitude);
          } else if (event.data.type === 'setCenter') {
            if (!map) initMap(event.data.latitude, event.data.longitude);
            // flyTo preserves current zoom if we don't pass a second argument
            // but here we want to either move to the searched location or just center
            map.flyTo([event.data.latitude, event.data.longitude], map.getZoom());
          }
        });

        // Notify parent that we are ready to receive the init message
        window.parent.postMessage({ type: 'ready' }, '*');
      </script>
    </body>
    </html>
  `, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ready') {
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({
            type: 'init',
            latitude: coords.latitude,
            longitude: coords.longitude
          }, '*');
        }
      } else if (event.data.type === 'onLocationChange') {
        const { latitude, longitude } = event.data;
        setCoords({ latitude, longitude });
        reverseGeocode(latitude, longitude);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [coords.latitude, coords.longitude]);

  const reverseGeocode = async (lat: number, lon: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'WearWiseApp-Web' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Web Reverse Geocoding error:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`,
        { headers: { 'User-Agent': 'WearWiseApp-Web' } }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Web Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectResult = (result: any) => {
    const newCoords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    setCoords(newCoords);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
    
    // Tell iframe to move map
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        type: 'setCenter',
        ...newCoords
      }, '*');
    }
  };

  const handleConfirm = () => {
    onConfirm({
      address,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Header & Search */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#2B2B2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selectează Locația</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.searchBox}>
            <View style={styles.searchInputWrapper}>
              <Search size={20} color="#5A2D82" />
              <TextInput
                style={styles.input}
                placeholder="Căutare după adresă..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              {loading && <ActivityIndicator size="small" color="#5A2D82" />}
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>CAUTĂ</Text>
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              {searchResults.map((res, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.resultItem}
                  onPress={() => selectResult(res)}
                >
                  <MapPin size={16} color="#8E44AD" />
                  <Text style={styles.resultText} numberOfLines={2}>{res.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Interactive Leaflet Map via iframe */}
          <View style={styles.mapPreview}>
             <iframe
               ref={iframeRef}
               title="Interactive Map"
               width="100%"
               height="100%"
               style={{ border: 0, borderRadius: 32 }}
               srcDoc={mapHtml}
             />
          </View>

          {/* Current Selection */}
          <View style={styles.selectionCard}>
            <View style={styles.selectionInfo}>
              {addressLoading ? (
                 <ActivityIndicator size="small" color="#5A2D82" />
              ) : (
                 <MapPin size={24} color="#F4C542" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.selectionLabel}>
                  {addressLoading ? 'Se actualizează locația...' : 'Adresa Selectată'}
                </Text>
                <Text style={styles.selectionText} numberOfLines={2}>
                  {address || 'Mută harta pentru a actualiza adresa'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.confirmBtn, !address && styles.disabledBtn]} 
              onPress={handleConfirm}
              disabled={!address || addressLoading}
            >
              <Text style={styles.confirmText}>CONFIRMĂ ACEST PUNCT</Text>
              <Check size={20} color="#F4C542" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#2B2B2B' },
  closeBtn: { padding: 12 },
  content: { flex: 1, padding: 24 },
  searchBox: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.1)',
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#2B2B2B' },
  searchBtn: {
    backgroundColor: '#5A2D82',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 16,
  },
  searchBtnText: { color: '#FAF7F2', fontWeight: '900', fontSize: 12 },
  resultsContainer: {
    position: 'absolute',
    top: 80,
    left: 24,
    right: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.1)',
    maxHeight: 250,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  resultText: { flex: 1, fontSize: 13, color: '#2B2B2B', fontWeight: '500' },
  mapPreview: {
    flex: 1,
    backgroundColor: '#F0EBE3',
    borderRadius: 32,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.05)',
  },
  selectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  selectionInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  selectionLabel: { fontSize: 10, fontWeight: '900', color: '#8E44AD', textTransform: 'uppercase' },
  selectionText: { fontSize: 14, fontWeight: '700', color: '#2B2B2B', marginTop: 2 },
  confirmBtn: {
    backgroundColor: '#5A2D82',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  disabledBtn: { opacity: 0.5 },
  confirmText: { color: '#F4C542', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
