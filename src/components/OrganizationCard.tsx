import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrganizationCardProps {
  organizationName: string;
  organizationType: string;
  organizationLogo?: string;
  organizationLocationId?: string;
  organizationLocationName?: string;
  organizationStatus?: string;
}

const organizationTypeEmojis: Record<string, string> = {
  'Techno': '🎧',
  'Stand-up': '🎤',
  'Jazz': '🎷',
  'Türkçe Pop': '🎵',
  'Parti': '🎉',
  'Yabancı Pop': '🎸',
  'Rock': '🤘',
  'Elektronik': '🎛️',
  'Kültürel Etkinlik': '🎭',
};

export const OrganizationCard = ({
  organizationName,
  organizationType,
  organizationLogo,
  organizationLocationId,
  organizationLocationName,
  organizationStatus,
}: OrganizationCardProps) => {
  const { isDrunkMode } = useApp();
  const navigate = useNavigate();
  const typeEmoji = organizationTypeEmojis[organizationType] || '🎵';

  // Konum kontrolü: Sadece locationName yeterli!
  const hasLocation = !!organizationLocationName;
  const canNavigate = !!(organizationLocationId && organizationLocationName);
  
  // Approval status
  const isApproved = organizationStatus === 'approved';

  // Debug: Tüm props'ları kontrol et
  console.log('🎪 OrganizationCard Debug:', {
    name: organizationName,
    type: organizationType,
    logo: organizationLogo ? '✅ Var' : '❌ Yok',
    locationId: organizationLocationId || '❌ Yok',
    locationName: organizationLocationName || '❌ Yok',
    hasLocation: hasLocation,
    canNavigate: canNavigate,
    willRenderLocation: hasLocation  // ← Sadece locationName'e bağlı!
  });
  
  // Dinamik font boyutu - isim uzunluğuna göre
  const getNameFontSize = () => {
    const nameLength = organizationName.length;
    if (isDrunkMode) {
      if (nameLength > 30) return 'text-2xl sm:text-3xl';
      if (nameLength > 20) return 'text-3xl sm:text-3xl';
      return 'text-3xl sm:text-4xl';
    } else {
      if (nameLength > 30) return 'text-xl sm:text-2xl';
      if (nameLength > 20) return 'text-2xl sm:text-2xl';
      return 'text-2xl sm:text-3xl';
    }
  };

  // URL slug oluştur: "Kite Bar" -> "kite-bar"
  const createSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleLocationClick = () => {
    if (organizationLocationId && organizationLocationName) {
      const slug = createSlug(organizationLocationName);
      navigate(`/venue/${slug}`, { 
        state: { 
          locationId: organizationLocationId,
          locationName: organizationLocationName 
        } 
      });
    } else if (organizationLocationName) {
      // Sadece name var, slug ile git (ID state'te yok)
      const slug = createSlug(organizationLocationName);
      console.log('⚠️ Venue ID yok ama name ile yönlendiriliyor:', slug);
      navigate(`/venue/${slug}`, { 
        state: { locationName: organizationLocationName } 
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 80, 
        damping: 15,
        duration: 0.6 
      }}
      className="relative max-w-lg mx-auto"
      style={{
        filter: 'drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.15)) drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Main Paper Card */}
      <div
        className="relative p-6 sm:p-8"
        style={{
          backgroundColor: '#F5E6D3',
          imageRendering: 'pixelated',
          // Pikselli yırtık kenarlar
          clipPath: `polygon(
            0% 2%, 2% 0%, 4% 2%, 6% 1%, 8% 3%, 10% 1%, 12% 2%, 14% 0%, 16% 2%, 18% 1%, 20% 3%, 
            22% 1%, 24% 2%, 26% 0%, 28% 2%, 30% 1%, 32% 3%, 34% 1%, 36% 2%, 38% 0%, 40% 2%, 
            42% 1%, 44% 3%, 46% 1%, 48% 2%, 50% 0%, 52% 2%, 54% 1%, 56% 3%, 58% 1%, 60% 2%, 
            62% 0%, 64% 2%, 66% 1%, 68% 3%, 70% 1%, 72% 2%, 74% 0%, 76% 2%, 78% 1%, 80% 3%, 
            82% 1%, 84% 2%, 86% 0%, 88% 2%, 90% 1%, 92% 3%, 94% 1%, 96% 2%, 98% 0%, 100% 2%,
            
            100% 98%, 98% 100%, 96% 98%, 94% 99%, 92% 97%, 90% 99%, 88% 98%, 86% 100%, 84% 98%, 
            82% 99%, 80% 97%, 78% 99%, 76% 98%, 74% 100%, 72% 98%, 70% 99%, 68% 97%, 66% 99%, 
            64% 98%, 62% 100%, 60% 98%, 58% 99%, 56% 97%, 54% 99%, 52% 98%, 50% 100%, 48% 98%, 
            46% 99%, 44% 97%, 42% 99%, 40% 98%, 38% 100%, 36% 98%, 34% 99%, 32% 97%, 30% 99%, 
            28% 98%, 26% 100%, 24% 98%, 22% 99%, 20% 97%, 18% 99%, 16% 98%, 14% 100%, 12% 98%, 
            10% 99%, 8% 97%, 6% 99%, 4% 98%, 2% 100%, 0% 98%
          )`,
        }}
      >
        {/* Paper Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            imageRendering: 'pixelated',
          }}
        />

        {/* Fine grain texture */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139, 115, 85, 0.3) 1px, rgba(139, 115, 85, 0.3) 2px),
                              repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(139, 115, 85, 0.3) 1px, rgba(139, 115, 85, 0.3) 2px)`,
            imageRendering: 'pixelated',
          }}
        />

        {/* Content Container */}
        <div className="relative z-10">
          {/* Logo with Paper Clip Effect - Top Right (Fixed Position) */}
          {organizationLogo && (
            <motion.div 
              className="absolute top-4 right-4 z-20 flex flex-col items-end"
              initial={{ scale: 1.5, opacity: 0, rotate: 10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              {/* Pixel Paper Clip */}
              <motion.div
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Paper clip shape */}
                <div className="relative mb-1 mr-2" style={{ imageRendering: 'pixelated' }}>
                  <div className="w-8 h-2 bg-gray-400 rounded-sm" style={{ boxShadow: '1px 1px 0px rgba(0,0,0,0.3)' }} />
                  <div className="absolute top-0 left-1 w-1 h-8 bg-gray-500" style={{ boxShadow: '1px 1px 0px rgba(0,0,0,0.3)' }} />
                  <div className="absolute top-0 right-1 w-1 h-8 bg-gray-400" style={{ boxShadow: '1px 1px 0px rgba(0,0,0,0.3)' }} />
                </div>
              </motion.div>

              {/* Logo Frame */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="relative bg-white border-4 border-gray-700 p-1"
                style={{
                  imageRendering: 'pixelated',
                  boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden">
                  <img
                    src={organizationLogo}
                    alt="Organization Logo"
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                {/* Corner damage effect */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#F5E6D3]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
              </motion.div>
            </motion.div>
          )}

          {/* Stamp/Seal Badge - Top Left (Damga Animasyonu) */}
          <motion.div
            initial={{ scale: 1.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{ 
              delay: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            className="inline-block mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="relative px-4 py-2 border-4 border-red-800/40 bg-red-900/10"
              style={{
                imageRendering: 'pixelated',
                boxShadow: 'inset 0 0 0 1px rgba(127, 29, 29, 0.2)',
              }}
            >
              <span 
                className={`font-mono font-bold tracking-wider uppercase ${isDrunkMode ? 'text-base' : 'text-sm'}`}
                style={{ 
                  color: '#7F1D1D',
                  textShadow: '1px 1px 0px rgba(127, 29, 29, 0.2)',
                  letterSpacing: '0.1em',
                }}
              >
                {typeEmoji} {organizationType}
              </span>
              {/* Stamp texture overlay */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(127, 29, 29, 0.1) 2px, rgba(127, 29, 29, 0.1) 4px)`,
                  imageRendering: 'pixelated',
                }}
              />
            </motion.div>
          </motion.div>

          {/* Organization Name - Handwritten Style (Logo ile çakışmayı önle) */}
          <div className="mb-8 mt-4 relative">
            <div className={`${organizationLogo ? 'pr-28 sm:pr-32' : 'pr-4'} w-full`}>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.5,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100
                }}
                className={`font-mono font-bold leading-tight break-words hyphens-auto ${getNameFontSize()}`}
                style={{
                  color: '#3F3F3F',
                  textShadow: '1px 1px 0px rgba(0, 0, 0, 0.05)',
                  letterSpacing: '0.02em',
                  transform: 'rotate(-0.5deg)',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: organizationLogo ? 'calc(100% - 7rem)' : '100%',
                }}
              >
                <span className="inline">{organizationName}</span>
                
                {/* Approval Badge - Pikselli Onay Rozeti (Bira Bardağı) */}
                {isApproved && (
                  <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
                    className="inline-block ml-2"
                    style={{
                      imageRendering: 'pixelated',
                      transform: 'rotate(5deg)',
                    }}
                    title="Onaylı Organizasyon"
                  >
                    <span
                      className="text-2xl"
                      style={{
                        filter: 'drop-shadow(1px 1px 0px rgba(255, 215, 0, 0.6))',
                      }}
                    >
                      🍺
                    </span>
                  </motion.span>
                )}
              </motion.h2>
              
              {/* Underline drawn effect - Daktilo efekti gibi */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ 
                  delay: 0.8, 
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className="h-1 bg-gray-700 mt-2 origin-left"
                style={{
                  width: organizationName.length > 25 ? '80%' : '60%',
                  maxWidth: '200px',
                  imageRendering: 'pixelated',
                  clipPath: 'polygon(0 20%, 100% 40%, 100% 100%, 0 80%)',
                }}
              />
            </div>
          </div>

          {/* Pixel Decoration Line - Stagger animasyonu */}
          <div className="flex items-center gap-1 mb-6 opacity-30">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: Math.random() > 0.5 ? 1 : 0.5, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.03 }}
                className="w-2 h-2 bg-gray-600"
                style={{
                  imageRendering: 'pixelated',
                }}
              />
            ))}
          </div>

          {/* Bottom Section - Organizatör & Konum */}
          <div className="flex flex-wrap items-start gap-3">
            {/* Organizatör Label - Bottom Left (Hafif titreme animasyonu) */}
            <motion.div 
              className="inline-block"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              whileHover={{ x: 2, scale: 1.05 }}
            >
              <div
                className="px-3 py-1 border-2 border-gray-600 bg-gray-200/50"
                style={{
                  imageRendering: 'pixelated',
                  transform: 'rotate(1deg)',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)',
                }}
              >
                <span 
                  className={`font-mono text-gray-700 tracking-wide ${isDrunkMode ? 'text-sm' : 'text-xs'}`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  ⚡ Organizatör
                </span>
              </div>
            </motion.div>

            {/* Location Label - Sadece locationName varsa göster */}
            {organizationLocationName && (
              <motion.div
                className="inline-block"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <motion.button
                  onClick={handleLocationClick}
                  className={`group relative ${canNavigate ? 'cursor-pointer' : 'cursor-default'}`}
                  whileHover={canNavigate ? { x: 2, scale: 1.02 } : undefined}
                  whileTap={canNavigate ? { scale: 0.98 } : undefined}
                >
                  <div
                    className={`px-3 py-1 border-2 border-gray-600 bg-gray-200/50 flex items-center gap-1.5 transition-all duration-200 ${canNavigate ? 'hover:bg-gray-300/60' : ''}`}
                    style={{
                      imageRendering: 'pixelated',
                      transform: 'rotate(-1deg)',
                      boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {/* Pikselli Pin İkonu */}
                    <div 
                      className="w-3 h-3 relative flex-shrink-0"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      <div className="absolute inset-0">
                        <svg viewBox="0 0 16 16" className="w-full h-full text-gray-700 fill-current">
                          <rect x="6" y="2" width="4" height="2" />
                          <rect x="5" y="4" width="6" height="2" />
                          <rect x="4" y="6" width="8" height="2" />
                          <rect x="6" y="8" width="4" height="4" />
                          <rect x="5" y="12" width="6" height="2" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Mekan İsmi */}
                    <span 
                      className={`font-mono font-bold text-gray-700 tracking-wide ${isDrunkMode ? 'text-sm' : 'text-xs'} max-w-[160px] truncate relative`}
                      style={{ 
                        letterSpacing: '0.05em',
                        textShadow: '0.5px 0.5px 0px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {organizationLocationName}
                    </span>
                  </div>

                  {/* Hover Underline - Sadece tıklanabilirse göster */}
                  {canNavigate && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-700 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)',
                      }}
                    />
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Coffee Stain Effect (optional) */}
        <div
          className="absolute bottom-4 right-8 w-12 h-12 rounded-full opacity-[0.08] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(101, 67, 33, 0.4) 0%, transparent 70%)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </motion.div>
  );
};
