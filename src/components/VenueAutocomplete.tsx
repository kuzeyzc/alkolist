import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VenueOption {
  name: string;
  address?: string;
  distance?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  foursquareId?: string;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string, venue?: VenueOption) => void;
  className?: string;
}

const getCategoryIcon = (category?: string): string => {
  if (!category) return '📍';
  const lower = category.toLowerCase();
  if (lower.includes('bar') || lower.includes('pub')) return '🍺';
  if (lower.includes('rest') || lower.includes('food')) return '🍽️';
  if (lower.includes('night') || lower.includes('club')) return '🕺';
  if (lower.includes('cafe') || lower.includes('coffee')) return '☕';
  return '📍';
};

// OpenStreetMap Nominatim API (TAMAMEN ÜCRETSİZ!)
const searchOpenStreetMapVenues = async (
  query: string,
  userLat?: number,
  userLon?: number
): Promise<VenueOption[]> => {
  try {
    const hasQuery = query && query.trim().length > 0;
    
    if (!hasQuery && (!userLat || !userLon)) return [];

    // Nominatim API endpoint
    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('limit', '20');
    params.append('addressdetails', '1');
    
    if (hasQuery) {
      // Mekan adı araması
      params.append('q', query.trim());
      if (userLat && userLon) {
        params.append('lat', userLat.toString());
        params.append('lon', userLon.toString());
        params.append('bounded', '1');
        params.append('viewbox', `${userLon - 0.1},${userLat + 0.1},${userLon + 0.1},${userLat - 0.1}`);
      }
    } else {
      // GPS modu: yakındaki bar, restoran vb. ara
      params.append('q', 'bar restaurant cafe pub');
      params.append('lat', userLat!.toString());
      params.append('lon', userLon!.toString());
      params.append('bounded', '1');
      params.append('viewbox', `${userLon! - 0.05},${userLat! + 0.05},${userLon! + 0.05},${userLat! - 0.05}`);
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    
    console.log('🗺️ OpenStreetMap İsteği:', { query, lat: userLat, lon: userLon });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Alkolist App (https://alkolist.app)',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn('⚠️ OpenStreetMap hatası:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('⚠️ OpenStreetMap sonuç döndürmedi');
      return [];
    }

    // Filter: sadece bar, restoran, cafe gibi mekanları al
    const filteredData = data.filter((place: any) => {
      const type = place.type?.toLowerCase() || '';
      const placeClass = place.class?.toLowerCase() || '';
      const name = place.display_name?.toLowerCase() || '';
      
      return (
        type.includes('bar') || type.includes('restaurant') || type.includes('cafe') || 
        type.includes('pub') || type.includes('nightclub') || type.includes('biergarten') ||
        placeClass === 'amenity' || placeClass === 'tourism' ||
        name.includes('bar') || name.includes('cafe') || name.includes('restaurant')
      );
    });

    console.log('✅ OpenStreetMap:', filteredData.length, 'mekan bulundu');

    // Map response to VenueOption
    return filteredData.slice(0, 10).map((place: any) => {
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      
      // Mesafe hesapla
      let distance: number | undefined;
      if (userLat && userLon) {
        const R = 6371; // Earth radius in km
        const dLat = (lat - userLat) * Math.PI / 180;
        const dLon = (lon - userLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = Math.round(R * c * 10) / 10; // km
      }
      
      // İsim çıkar
      const name = place.name || place.display_name?.split(',')[0] || 'İsimsiz Mekan';
      
      // Kategori belirle
      let category = 'Mekan';
      const type = place.type?.toLowerCase() || '';
      if (type.includes('bar') || type.includes('pub')) category = 'Bar';
      else if (type.includes('restaurant')) category = 'Restoran';
      else if (type.includes('cafe')) category = 'Kafe';
      else if (type.includes('nightclub')) category = 'Gece Kulübü';
      
      return {
        name,
        address: place.display_name,
        latitude: lat,
        longitude: lon,
        distance,
        category,
        placeId: place.place_id?.toString(),
      };
    });

  } catch (error) {
    console.error('❌ OpenStreetMap hatası:', error);
    return [];
  }
};

export const VenueAutocomplete = ({ value, onChange, className = '' }: VenueAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    setLoadingLocation(true);
    setIsOpen(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocationPermission('granted');
        setLoadingLocation(false);
        
        setLoading(true);
        
        // 1. OpenStreetMap'ten yakındaki mekanları al (GPS modu)
        let venues = await searchOpenStreetMapVenues('', coords.lat, coords.lon);
        
        // 2. OpenStreetMap sonuç döndürmediyse local popüler mekanlar
        if (venues.length === 0) {
          const { data: popularVenues } = await supabase
            .from('drink_logs')
            .select('location, category')
            .not('location', 'is', null)
            .order('logged_at', { ascending: false })
            .limit(30);
          
          const venueMap = new Map<string, { name: string; count: number; category?: string }>();
          popularVenues?.forEach(log => {
            if (log.location) {
              const key = log.location.toLowerCase();
              const existing = venueMap.get(key);
              if (existing) {
                existing.count++;
              } else {
                venueMap.set(key, { name: log.location, count: 1, category: log.category });
              }
            }
          });
          
          venues = Array.from(venueMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map(v => ({ name: v.name, category: v.category }));
        }
        
        setSuggestions(venues);
        if (venues.length === 0) setNoResultsMessage('Yakınınızda mekan bulunamadı. İstediğiniz ismi yazabilirsiniz.');
        setLoading(false);
      },
      (error) => {
        console.error('GPS Hatası:', error);
        setLocationPermission('denied');
        setLoadingLocation(false);
        setNoResultsMessage('Konum alınamadı. Lütfen manuel arama yapın.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (isOpen && value.trim().length > 1) {
      const timer = setTimeout(async () => {
        setLoading(true);
        
        // 1. OpenStreetMap'ten ara
        let venues = await searchOpenStreetMapVenues(value, userLocation?.lat, userLocation?.lon);
        
        // 2. OpenStreetMap sonuç yoksa local database (fallback)
        if (venues.length === 0) {
          const lowerQuery = value.toLowerCase();
          const { data: drinkLogs } = await supabase
            .from('drink_logs')
            .select('location, category')
            .not('location', 'is', null)
            .ilike('location', `%${lowerQuery}%`)
            .limit(10);
          
          const venueMap = new Map<string, VenueOption>();
          drinkLogs?.forEach(log => {
            if (log.location && !venueMap.has(log.location.toLowerCase())) {
              venueMap.set(log.location.toLowerCase(), {
                name: log.location,
                category: log.category,
              });
            }
          });
          
          venues = Array.from(venueMap.values());
        }
        
        setSuggestions(venues.slice(0, 8));
        setNoResultsMessage(venues.length === 0 ? 'Mekan bulunamadı. İstediğiniz ismi yazabilirsiniz.' : null);
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [value, isOpen, userLocation]);

  useEffect(() => {
    getUserLocation();
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVenue = (venue: VenueOption) => {
    onChange(venue.name, venue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Search className="h-4 w-4 text-[#8B6F47]" />
        </div>
        
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Mekan ara..."
          className="bg-[#F5E6D3] border-2 border-[#D4B896] rounded-none pl-10 pr-24 text-[#3E2723] focus:border-[#8B6F47] focus:ring-0 font-serif"
        />
        
        <button
          type="button"
          onClick={getUserLocation}
          disabled={loadingLocation}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-none bg-[#8B6F47] hover:bg-[#6D5637] text-[#F5E6D3] flex items-center gap-1.5"
        >
          {loadingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Navigation className="h-3 w-3" /> GPS</>}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || loading || noResultsMessage) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#F5E6D3] border-2 border-[#D4B896] shadow-xl z-50 max-h-[300px] overflow-y-auto"
          >
            {loading ? (
              <div className="p-8 text-center text-[#8B6F47] font-serif animate-pulse">Mekanlar yükleniyor...</div>
            ) : noResultsMessage ? (
              <div className="p-6 text-center text-[#8B6F47] font-serif text-xs">{noResultsMessage}</div>
            ) : (
              suggestions.map((venue, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectVenue(venue)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[#E8D4B8] border-b border-[#D4B896]/30 text-left group"
                >
                  <span className="text-lg">{getCategoryIcon(venue.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#3E2723] font-serif truncate">{venue.name}</p>
                    <p className="text-[10px] text-[#8B6F47] font-serif truncate opacity-70">{venue.address}</p>
                  </div>
                  {venue.distance && <span className="text-[10px] text-[#A0826D] font-serif">~{venue.distance}km</span>}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};