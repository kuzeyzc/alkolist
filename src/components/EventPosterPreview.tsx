import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface EventPosterPreviewProps {
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  locationName: string;
  organizationName?: string;
  organizationLogo?: string;
  ticketUrl?: string;
}

const eventTypeEmojis: Record<string, string> = {
  'Techno': '🎧',
  'Stand-up': '🎤',
  'Jazz': '🎷',
  'Türkçe Pop': '🎵',
  'Parti': '🎉',
  'Yabancı Pop': '🎶',
  'Rock': '🎸',
  'Elektronik': '🔊',
  'Kültürel Etkinlik': '🎭',
};

export const EventPosterPreview = ({
  eventName,
  eventType,
  date,
  time,
  locationName,
  organizationName,
  organizationLogo,
  ticketUrl,
}: EventPosterPreviewProps) => {
  const typeEmoji = eventTypeEmojis[eventType] || '🎵';

  // Format date - Türkçe (YYYY-MM-DD -> "21 Ocak 2026, Çarşamba")
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
      return format(date, 'd MMMM yyyy, EEEE', { locale: tr });
    } catch (error) {
      console.error('Date format error:', error);
      return dateStr;
    }
  };

  // Format time - 24 saatlik format (HH:MM -> "22:00")
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr; // Already in HH:MM format
  };

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Vintage Torn Paper Poster */}
      <div
        className="relative bg-[#F5E6D3] p-8 shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          clipPath: 'polygon(2% 0%, 98% 1%, 99% 2%, 100% 5%, 100% 95%, 99% 98%, 97% 99%, 95% 100%, 5% 100%, 3% 99%, 1% 97%, 0% 95%, 0% 5%, 1% 2%)',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.15), 4px 4px 0px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Background Texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 111, 71, 0.03) 2px, rgba(139, 111, 71, 0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 111, 71, 0.03) 2px, rgba(139, 111, 71, 0.03) 4px)
            `,
            imageRendering: 'pixelated',
          }}
        />

        {/* Organization Header */}
        {organizationName && (
          <motion.div
            className="relative mb-6 pb-4 border-b-2 border-gray-400/30 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ imageRendering: 'pixelated' }}
          >
            {organizationLogo && (
              <img
                src={organizationLogo}
                alt={organizationName}
                className="w-12 h-12 object-cover border-2 border-gray-600"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
            <div>
              <p className="text-xs font-mono text-gray-600 tracking-wide">SUNAR</p>
              <p className="text-sm font-mono font-bold text-gray-800">{organizationName}</p>
            </div>
          </motion.div>
        )}

        {/* Event Type Badge */}
        <motion.div
          className="inline-block mb-4"
          initial={{ scale: 1.5, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: -3 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div
            className="px-4 py-2 border-2 border-gray-600 bg-gray-200/60 inline-flex items-center gap-2"
            style={{
              imageRendering: 'pixelated',
              transform: 'rotate(-3deg)',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span className="text-lg">{typeEmoji}</span>
            <span className="text-xs font-mono font-bold text-gray-800 uppercase">{eventType}</span>
          </div>
        </motion.div>

        {/* Event Name */}
        <motion.h2
          className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 mb-6 leading-tight"
          style={{
            textShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)',
            wordBreak: 'break-word',
            hyphens: 'auto',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {eventName || 'Etkinlik Adı'}
        </motion.h2>

        {/* Event Details */}
        <motion.div
          className="space-y-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Date */}
          <div className="flex items-center gap-3">
            <div
              className="p-2 border-2 border-gray-600 bg-gray-200/40"
              style={{ imageRendering: 'pixelated' }}
            >
              <Calendar className="h-4 w-4 text-gray-800" />
            </div>
            <span className="text-sm font-mono font-bold text-gray-800">
              {date ? formatDate(date) : 'GG/AA/YYYY'}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3">
            <div
              className="p-2 border-2 border-gray-600 bg-gray-200/40"
              style={{ imageRendering: 'pixelated' }}
            >
              <Clock className="h-4 w-4 text-gray-800" />
            </div>
            <span className="text-sm font-mono font-bold text-gray-800">
              {time ? formatTime(time) : 'SS:DD'}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <div
              className="p-2 border-2 border-gray-600 bg-gray-200/40"
              style={{ imageRendering: 'pixelated' }}
            >
              <MapPin className="h-4 w-4 text-gray-800" />
            </div>
            <span className="text-sm font-mono font-bold text-gray-800">
              {locationName || 'Mekan Seçiniz'}
            </span>
          </div>

          {/* Ticket URL */}
          {ticketUrl && (
            <div className="flex items-center gap-3">
              <div
                className="p-2 border-2 border-gray-600 bg-gray-200/40"
                style={{ imageRendering: 'pixelated' }}
              >
                <Ticket className="h-4 w-4 text-gray-800" />
              </div>
              <span className="text-xs font-mono text-gray-700 truncate">{ticketUrl}</span>
            </div>
          )}
        </motion.div>

        {/* Decorative Pixel Line */}
        <motion.div
          className="flex gap-1 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400"
              style={{ imageRendering: 'pixelated' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.02 }}
            />
          ))}
        </motion.div>

        {/* Footer Tag */}
        <motion.div
          className="inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div
            className="px-3 py-1 border-2 border-gray-600 bg-gray-200/50 inline-block"
            style={{
              imageRendering: 'pixelated',
              transform: 'rotate(1deg)',
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span className="text-xs font-mono font-bold text-gray-700">📅 ETKİNLİK AFİŞİ</span>
          </div>
        </motion.div>
      </div>

      {/* Shadow */}
      <div
        className="absolute -bottom-2 left-2 right-2 h-4 bg-black/10 blur-sm -z-10"
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
};
