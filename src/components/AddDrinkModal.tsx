import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Camera, ImagePlus, Loader2, ChefHat, Clock, AlertTriangle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { FlyingPaper } from '@/components/FlyingPaper';
import { VenueAutocomplete } from '@/components/VenueAutocomplete';

// 1. LİSTE GARANTİSİ: Buraya Rakı, Votka vb. hepsini ekledik.
// Promil değerleri x100 formatında saklanır (0.3 promil = 30)
const categories = [
  { id: 'beer', label: 'Bira', emoji: '🍺', promil: 30 }, // 50cl = 0.3 promil
  { id: 'wine', label: 'Şarap', emoji: '🍷', promil: 30 }, // 15cl = 0.3 promil
  { id: 'raki', label: 'Rakı', emoji: '🥛', promil: 40 }, // 4cl = 0.4 promil
  { id: 'whiskey', label: 'Viski', emoji: '🥃', promil: 40 }, // 4cl = 0.4 promil
  { id: 'vodka', label: 'Votka', emoji: '🧊', promil: 40 }, // 4cl = 0.4 promil
  { id: 'gin', label: 'Cin', emoji: '🍸', promil: 40 }, // 4cl = 0.4 promil
  { id: 'tequila', label: 'Tekila', emoji: '🌵', promil: 40 }, // 4cl = 0.4 promil
  { id: 'liqueur', label: 'Likör', emoji: '🍬', promil: 30 }, // 5cl = 0.3 promil
  { id: 'rum', label: 'Rom', emoji: '🏴‍☠️', promil: 40 }, // 4cl = 0.4 promil
  { id: 'cognac', label: 'Konyak', emoji: '🥃', promil: 40 }, // 4cl = 0.4 promil
  { id: 'cocktail', label: 'Kokteyl', emoji: '🍹', promil: 50 }, // ~0.5 promil
  { id: 'other', label: 'Diğer', emoji: '🍾', promil: 30 },
];

interface AddDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddDrinkModal = ({ isOpen, onClose, onSuccess }: AddDrinkModalProps) => {
  const { user, isDrunkMode } = useApp();
  const [category, setCategory] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [drinkName, setDrinkName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Fotoğraf Modu: 'single' | 'beforeAfter'
  const [photoMode, setPhotoMode] = useState<'single' | 'beforeAfter'>('single');

  // Fotoğraf Yükleme State'leri
  const [uploadingSingle, setUploadingSingle] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  
  // Tarif (Recipe) State'leri
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  
  // Konum (Location) State'leri
  const [location, setLocation] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<{
    name: string;
    placeId?: string;
    foursquareId?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  } | null>(null);
  
  // Masa Notu (Venue Note) State'leri
  const [showVenueNote, setShowVenueNote] = useState(false);
  const [venueNote, setVenueNote] = useState('');
  const [showPaperAnimation, setShowPaperAnimation] = useState(false);
  const [paperStartPosition, setPaperStartPosition] = useState({ x: 0, y: 0 });
  const venueNoteRef = useRef<HTMLTextAreaElement>(null);
  
  // Promil & Sistem State'leri
  const [currentPromil, setCurrentPromil] = useState(0);
  const [drinksToday, setDrinksToday] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // 2. BUTON BAĞLANTILARI: Gizli dosya seçiciler için referanslar
  const singleInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchPromilData();
    }
  }, [user, isOpen]);

  // Sayaç (Cooldown)
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const fetchPromilData = async () => {
    if (!user) return;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: recentDrinks } = await supabase
      .from('drink_logs')
      .select('promil_score, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', yesterday.toISOString())
      .order('logged_at', { ascending: false });

    if (recentDrinks && recentDrinks.length > 0) {
      setDrinksToday(recentDrinks.length);
      
      let totalPromil = 0;
      recentDrinks.forEach(drink => {
        const drinkTime = new Date(drink.logged_at);
        const hoursElapsed = (now.getTime() - drinkTime.getTime()) / (1000 * 60 * 60);
        const decay = Math.floor(hoursElapsed) * 15;
        const remainingPromil = Math.max(0, (drink.promil_score || 0) - decay);
        totalPromil += remainingPromil;
      });

      setCurrentPromil(totalPromil);
      setIsLocked(totalPromil >= 400); // 4.0 promil limiti

      const lastDrink = new Date(recentDrinks[0].logged_at);
      const minutesSinceLast = (now.getTime() - lastDrink.getTime()) / (1000 * 60);
      if (minutesSinceLast < 10) {
        setCooldownRemaining(Math.ceil((10 - minutesSinceLast) * 60));
      }
    }
  };

  // Fotoğraf modu değişince diğer modun state'lerini temizle
  useEffect(() => {
    if (photoMode === 'single') {
      // before/after temizle
      setBeforeFile(null);
      setAfterFile(null);
      setBeforePreview(null);
      setAfterPreview(null);
      setUploadingBefore(false);
      setUploadingAfter(false);
    } else {
      // tek fotoğraf temizle
      setSingleFile(null);
      setSinglePreview(null);
      setUploadingSingle(false);
    }
  }, [photoMode]);

  // 3. TIKLAMA OLAYLARI: Butona basınca dosya seçicileri açar
  const handleSingleClick = () => {
    singleInputRef.current?.click();
  };

  const handleBeforeClick = () => {
    // Bu satır dosya seçiciyi tetikler
    beforeInputRef.current?.click();
  };

  const handleAfterClick = () => {
    afterInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'single' | 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Önizleme oluştur
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'single') {
        setSinglePreview(event.target?.result as string);
        setSingleFile(file);
      } else if (type === 'before') {
        setBeforePreview(event.target?.result as string);
        setBeforeFile(file);
      } else {
        setAfterPreview(event.target?.result as string);
        setAfterFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVenueChange = (value: string, venue?: any) => {
    setLocation(value);
    if (venue && venue.foursquareId) {
      // Sadece Foursquare'den gelen mekanları kabul et
      setSelectedVenue({
        name: venue.name,
        placeId: venue.placeId,
        foursquareId: venue.foursquareId,
        latitude: venue.latitude,
        longitude: venue.longitude,
        address: venue.address,
      });
      console.log('✅ Venue selected from list:', {
        name: venue.name,
        foursquareId: venue.foursquareId,
        address: venue.address,
      });
    } else {
      // Manuel yazma durumunda venue bilgisini temizle
      setSelectedVenue(null);
      console.log('⚠️ Manual typing - venue not selected');
    }
  };

  // Dosya Yükleme Fonksiyonu
  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true });
      
      if (error) {
        console.error('Yükleme hatası:', error);
        return null;
      }
      
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!user || !category) return;

    if (isLocked) {
      toast.error('Limit doldu! Biraz su iç. 💧');
      return;
    }

    if (cooldownRemaining > 0) {
      toast.error(`${Math.ceil(cooldownRemaining / 60)} dakika bekle!`);
      return;
    }

    // 2. içkiden sonra fotoğraf zorunlu
    const hasAnyPhoto =
      (photoMode === 'single' && !!singleFile) ||
      (photoMode === 'beforeAfter' && (!!beforeFile || !!afterFile));

    if (drinksToday >= 1 && !hasAnyPhoto) {
      toast.error('İkinci içkiden itibaren fotoğraf zorunlu! 📸');
      return;
    }

    // Manuel mekan girişine izin ver (Foursquare opsiyonel)

    setLoading(true);
    try {
      let photoUrl = null;
      let beforePhotoUrl = null;
      let afterPhotoUrl = null;

      // Fotoğrafları Yükle
      if (photoMode === 'single' && singleFile) {
        setUploadingSingle(true);
        const path = `${user.id}/${Date.now()}_single_${singleFile.name}`;
        photoUrl = await uploadFile(singleFile, path);
        setUploadingSingle(false);
      } else {
        if (beforeFile) {
          setUploadingBefore(true);
          const path = `${user.id}/${Date.now()}_before_${beforeFile.name}`;
          beforePhotoUrl = await uploadFile(beforeFile, path);
          setUploadingBefore(false);
        }
        
        if (afterFile) {
          setUploadingAfter(true);
          const path = `${user.id}/${Date.now()}_after_${afterFile.name}`;
          afterPhotoUrl = await uploadFile(afterFile, path);
          setUploadingAfter(false);
        }
      }

      const selectedCategory = categories.find(c => c.id === category);
      // Güvenli Hesaplama: Backend'de de kontrol edilmeli ama frontend'de de doğrula
      const basePromil = selectedCategory?.promil || 30; // Varsayılan: bira
      const safeQuantity = Math.min(Math.max(1, quantity), 10); // 1-10 arası zorla
      const promilScore = basePromil * safeQuantity;
      
      // Ekstra Güvenlik: 4.0 promil (400) kontrolü
      if (promilScore > 400) {
        toast.error('Bu miktar çok yüksek! Lütfen gerçekçi bir değer gir. 🚨');
        setLoading(false);
        return;
      }

      // Veritabanına Kaydet (Venue bilgileriyle birlikte)
      const { error } = await supabase.from('drink_logs').insert({
        user_id: user.id,
        category,
        quantity,
        drink_name: drinkName || null,
        photo_url: photoUrl,
        before_photo_url: beforePhotoUrl,
        after_photo_url: afterPhotoUrl,
        promil_score: promilScore,
        has_recipe: showRecipe,
        recipe_ingredients: showRecipe ? recipeIngredients : null,
        recipe_instructions: showRecipe ? recipeInstructions : null,
        location: location || null,
        // Venue detayları (Foursquare'den geliyorsa)
        venue_foursquare_id: selectedVenue?.foursquareId || null,
        venue_latitude: selectedVenue?.latitude || null,
        venue_longitude: selectedVenue?.longitude || null,
        venue_address: selectedVenue?.address || null,
      });

      if (error) throw error;

      // Masa Notu Kaydet (Anonim) - Animasyonlu
      if (showVenueNote && venueNote.trim() && location.trim()) {
        try {
          // Animasyon başlangıç pozisyonunu al
          if (venueNoteRef.current) {
            const rect = venueNoteRef.current.getBoundingClientRect();
            setPaperStartPosition({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
          }

          // Animasyonu tetikle
          setShowPaperAnimation(true);

          const { error: noteError } = await supabase.from('venue_notes').insert({
            venue_name: location,
            note: venueNote.trim(),
          });

          if (noteError) {
            console.error('Venue note error:', noteError);
            setShowPaperAnimation(false);
            // Not hatası kritik değil, devam ediyoruz
          }
          // Toast animasyon bitince gösterilecek
        } catch (noteErr) {
          console.error('Unexpected venue note error:', noteErr);
          setShowPaperAnimation(false);
        }
      }

      toast.success(`Puan liderlik tablosuna eklendi! (+${(promilScore / 100).toFixed(1)} promil)`);
      
      // Eğer animasyon yoksa direkt kapat
      if (!showVenueNote || !venueNote.trim()) {
        onSuccess?.();
        onClose();
      }
      // Animasyon varsa, animasyon bitince kapatılacak
    } catch (error: any) {
      console.error(error);
      toast.error('Hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
      setUploadingSingle(false);
      setUploadingBefore(false);
      setUploadingAfter(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === category);
  const estimatedPromil = (selectedCategory?.promil || 0) * quantity;
  
  // Gerçekçilik Kontrolü: 4.0 promil (400) üstü engelle
  const isPromilTooHigh = estimatedPromil > 400;
  const canSubmit = !loading && category && !isLocked && cooldownRemaining === 0 && !isPromilTooHigh;

  // Animasyon bitince çağrılacak callback
  const handlePaperAnimationComplete = () => {
    setShowPaperAnimation(false);
    toast.success('Notun dijital peçeteye yazıldı! ✍️');
    setVenueNote(''); // Metin alanını temizle
    onSuccess?.();
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-lg glass-card rounded-t-3xl p-6 pb-10 max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Ne içiyorsun? 🍻
            </h2>

            {/* Promil Göstergesi */}
            <div className={`mb-4 p-3 rounded-xl border flex justify-between items-center ${isLocked ? 'bg-red-900/20 border-red-500' : 'bg-muted/30 border-border'}`}>
              <span className="text-sm">Mevcut Promil:</span>
              <span className={`font-bold ${isLocked ? 'text-red-500' : 'text-primary'}`}>
                {(currentPromil / 100).toFixed(1)} / 4.0 promil
              </span>
            </div>
            
            {/* Tehlike Uyarısı */}
            {currentPromil >= 400 && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border-2 border-red-500 flex items-start gap-2">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                  <p className="text-red-400 font-bold text-sm mb-1">Dikkat: Tehlikeli Sınır!</p>
                  <p className="text-red-300 text-xs">Bu değerler tıbbi olarak tehlikeli sınırdadır. Lütfen dikkatli ol!</p>
                </div>
              </div>
            )}

            {/* KATEGORİ SEÇİMİ (Grid) */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  disabled={isLocked}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                    category === cat.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* ADET SEÇİMİ */}
            <div className={`mb-6 flex items-center justify-between p-4 rounded-xl transition-all ${
              quantity >= 8 ? 'bg-orange-900/20 border-2 border-orange-500' : 'bg-muted/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Kaç Tane?</span>
                {quantity >= 10 && <span className="text-lg">🛑</span>}
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className={`text-xl font-bold w-8 text-center transition-colors ${
                  quantity >= 8 ? 'text-orange-500' : ''
                }`}>
                  {quantity}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    if (quantity >= 10) {
                      toast.error('Tek seferde bu kadar içki girişi yapılamaz, lütfen porsiyonları kontrol et! 🍺', {
                        duration: 4000,
                      });
                    } else {
                      setQuantity(quantity + 1);
                    }
                  }}
                  disabled={quantity >= 10}
                  className={quantity >= 10 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Maksimum Adet Uyarısı */}
            {quantity >= 8 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-900/30 border-2 border-amber-500 flex items-start gap-2 animate-pulse">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-amber-400 font-bold text-sm">Dikkat: Yüksek Miktar!</p>
                  <p className="text-amber-300 text-xs">Maksimum 10 adet girilebilir.</p>
                </div>
              </div>
            )}
            
            {category && (
              <div className="mb-4 space-y-2">
                <p className={`text-center text-base font-bold ${isPromilTooHigh ? 'text-red-400' : 'text-[#f59e0b]'}`}>
                  Kafa Raporu: +{(estimatedPromil / 100).toFixed(1)} promil {isPromilTooHigh ? '🚨' : '🍻'}
                </p>
                
                {/* Promil Çubuğu */}
                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      estimatedPromil <= 200 ? 'bg-green-500' :
                      estimatedPromil <= 300 ? 'bg-yellow-500' :
                      estimatedPromil <= 400 ? 'bg-orange-500' :
                      'bg-red-500 animate-pulse'
                    }`}
                    style={{ width: `${Math.min((estimatedPromil / 400) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Kritik Promil Uyarısı - Sempatik Engelleyici */}
            {isPromilTooHigh && (
              <div className="mb-4 p-4 rounded-xl bg-red-900/40 border-2 border-red-500 animate-pulse">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-6xl">🛑</span>
                </div>
                <p className="text-red-400 font-bold text-center mb-1">STOP!</p>
                <p className="text-red-300 text-sm text-center">
                  Bu miktar tıbbi sınırların çok üzerinde.
                </p>
                <p className="text-red-200 text-xs text-center mt-1">
                  Lütfen gerçekçi bir giriş yap! Maksimum: 4.0 promil
                </p>
                <div className="mt-3 text-center">
                  <span className="text-4xl animate-bounce inline-block">🥴</span>
                </div>
              </div>
            )}

            {/* FOTOĞRAF YÜKLEME ALANI */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">
                Fotoğraf Kanıtı {drinksToday >= 1 && <span className="text-red-500">*</span>}
              </label>

              {/* Fotoğraf Modu Seçici */}
              <div className="mb-3 inline-flex rounded-full bg-muted/40 p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setPhotoMode('single')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                    photoMode === 'single'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tek Fotoğraf
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('beforeAfter')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                    photoMode === 'beforeAfter'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Önce / Sonra
                </button>
              </div>

              {photoMode === 'single' ? (
                // Tek Fotoğraf Modu
                <div
                  onClick={handleSingleClick}
                  className="mt-2 relative aspect-video rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <input
                    ref={singleInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'single')}
                  />

                  {uploadingSingle ? (
                    <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                  ) : singlePreview ? (
                    <img
                      src={singlePreview}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-400">Tek Kanıt Fotoğrafı Yükle</span>
                    </>
                  )}
                </div>
              ) : (
                // Önce / Sonra Modu
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {/* Before Butonu */}
                  <div
                    onClick={handleBeforeClick}
                    className="relative aspect-square rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors"
                  >
                    <input
                      ref={beforeInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'before')}
                    />

                    {uploadingBefore ? (
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    ) : beforePreview ? (
                      <img
                        src={beforePreview}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-400">Şişe Fotosu</span>
                      </>
                    )}
                  </div>

                  {/* After Butonu */}
                  <div
                    onClick={handleAfterClick}
                    className="relative aspect-square rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors"
                  >
                    <input
                      ref={afterInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'after')}
                    />
                    {uploadingAfter ? (
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    ) : afterPreview ? (
                      <img
                        src={afterPreview}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-400">Son Durum</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* KONUM EKLEME - Yırtık Kağıt Teması */}
            <div className="mb-4">
              <label className="text-sm text-[#6D5637] mb-2 block font-serif font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#8B6F47]" />
                Mekan Seç (Opsiyonel)
              </label>
              
              <VenueAutocomplete 
                value={location}
                onChange={handleVenueChange}
              />

              {location && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-none bg-[#FFF8E7] border-2 border-[#D4A574] text-[#3E2723] text-sm font-serif shadow-sm">
                  <MapPin className="h-3.5 w-3.5 text-[#8B6F47]" />
                  <span className="max-w-[200px] truncate font-semibold">{location}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocation('');
                      setSelectedVenue(null);
                    }}
                    className="p-1 rounded-none hover:bg-[#E8D4B8] transition-colors"
                  >
                    <X className="h-3 w-3 text-[#8B6F47]" />
                  </button>
                </div>
              )}
            </div>

            {/* MASA NOTU BIRAK - Yırtık Kağıt Teması */}
            {location && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3 p-3 bg-[#FFF8E7] border-2 border-[#D4B896] rounded-none shadow-sm"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139, 111, 71, 0.02) 10px, rgba(139, 111, 71, 0.02) 20px)`
                     }}>
                  <span className="flex items-center gap-2 text-sm font-bold text-[#6D5637] font-serif">
                    <span className="text-lg">✍️</span> Masa Notu Bırak
                  </span>
                  <Switch 
                    checked={showVenueNote} 
                    onCheckedChange={setShowVenueNote}
                    className="data-[state=checked]:bg-[#8B6F47]"
                  />
                </div>
                
                {showVenueNote && (
                  <div className="space-y-3 animate-in slide-in-from-top-2">
                    {/* Textarea - Vintage Kağıt */}
                    <div className="relative bg-[#F5E6D3] border-2 border-[#D4B896] rounded-none p-4 shadow-sm"
                         style={{
                           backgroundImage: `
                             linear-gradient(to bottom, rgba(139, 111, 71, 0.03) 1px, transparent 1px),
                             url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
                           `,
                           backgroundSize: '100% 24px, 100px 100px',
                         }}>
                      <Textarea 
                        ref={venueNoteRef}
                        value={venueNote}
                        onChange={(e) => setVenueNote(e.target.value)}
                        placeholder="Anonim notunu bırak... (maks. 100 karakter)" 
                        className="bg-transparent border-2 border-[#D4B896] rounded-none text-[#3E2723] placeholder:text-[#8B6F47]/50 resize-none font-serif leading-relaxed focus:border-[#8B6F47] focus:ring-0 transition-colors"
                        rows={3}
                        maxLength={100}
                        style={{
                          letterSpacing: '0.3px',
                        }}
                      />
                      
                      {/* Karakter Sayacı - Vintage */}
                      <div className="flex items-center justify-between mt-2 text-xs font-serif">
                        <span className="text-[#8B6F47] tracking-wide">Karakter Sayısı</span>
                        <span className={`font-bold ${venueNote.length >= 90 ? 'text-[#D4A574]' : 'text-[#8B6F47]'}`}>
                          {venueNote.length}/100
                        </span>
                      </div>
                    </div>

                    {/* Bilgi Kutusu - Vintage */}
                    <div className="flex items-start gap-3 p-3 bg-[#FFF8E7]/80 border-2 border-[#D4A574] rounded-none backdrop-blur-sm">
                      <span className="text-lg shrink-0">🔒</span>
                      <div className="space-y-1">
                        <p className="text-xs text-[#6D5637] font-serif leading-relaxed">
                          <span className="font-bold">Anonim</span> olarak "<span className="text-[#3E2723] font-semibold">{location}</span>" mekanına kaydedilecek.
                        </p>
                        <p className="text-xs text-[#8B6F47] font-serif">
                          ⏱️ 24 saat sonra otomatik silinir.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TARİF PAYLAŞMA */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ChefHat className="h-4 w-4" /> Tarif Ekle
                </span>
                <Switch checked={showRecipe} onCheckedChange={setShowRecipe} />
              </div>
              
              {showRecipe && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Textarea 
                    placeholder="Malzemeler (örn: 5cl Cin, Tonik...)" 
                    value={recipeIngredients}
                    onChange={(e) => setRecipeIngredients(e.target.value)}
                    className="bg-muted/50"
                  />
                  <Textarea 
                    placeholder="Yapılış (örn: Hepsini karıştır...)" 
                    value={recipeInstructions}
                    onChange={(e) => setRecipeInstructions(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full h-12 text-lg font-bold transition-all ${
                isPromilTooHigh 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isPromilTooHigh ? (
                <>🚫 Çok Yüksek Miktar!</>
              ) : (
                'KAYDET 🍻'
              )}
            </Button>
            
            {/* Buton Altı Uyarı */}
            {isPromilTooHigh && (
              <p className="text-center text-xs text-red-400 mt-2 animate-pulse">
                ⚠️ Lütfen içki miktarını azalt (Maks: 4.0 promil)
              </p>
            )}
            
            {isLocked && (
              <p className="text-center text-xs text-red-400 mt-2">
                💧 24 saatlik limitin doldu. Biraz dinlen!
              </p>
            )}
            
            {cooldownRemaining > 0 && (
              <p className="text-center text-xs text-orange-400 mt-2">
                ⏳ {Math.ceil(cooldownRemaining / 60)} dakika bekle
              </p>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Pikselli Kağıt Uçma Animasyonu */}
    {showPaperAnimation && (
      <FlyingPaper
        onComplete={handlePaperAnimationComplete}
        startPosition={paperStartPosition}
      />
    )}
    </>
  );
};