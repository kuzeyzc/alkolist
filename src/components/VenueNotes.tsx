import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { FileText, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface VenueNote {
  id: string;
  venue_name: string;
  note: string;
  created_at: string;
  decoration_type: number;
}

interface VenueNotesProps {
  venueName: string;
  maxNotes?: number;
  compact?: boolean;
}

// Minimal decorations - emojiler kaldırıldı
const decorations = [
  { type: 1, emoji: '', label: '', position: '', rotation: '0deg' },
  { type: 2, emoji: '', label: '', position: '', rotation: '0deg' },
  { type: 3, emoji: '', label: '', position: '', rotation: '0deg' },
  { type: 4, emoji: '', label: '', position: '', rotation: '0deg' },
  { type: 5, emoji: '', label: '', position: '', rotation: '0deg' },
];

export const VenueNotes = ({ venueName, maxNotes = 10, compact = false }: VenueNotesProps) => {
  const { isDrunkMode } = useApp();
  const [notes, setNotes] = useState<VenueNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (venueName) {
      fetchNotes();
    }
  }, [venueName]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Calculate 24 hours ago timestamp for server-side filtering
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('venue_notes')
        .select('*')
        .eq('venue_name', venueName)
        .gte('created_at', twentyFourHoursAgo) // Server-side 24 hour filter
        .order('created_at', { ascending: false })
        .limit(maxNotes);

      if (error) {
        console.error('Venue notes error:', error);
        return;
      }

      if (data) {
        setNotes(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching venue notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDecoration = (decorationType: number) => {
    return decorations.find((d) => d.type === decorationType) || decorations[0];
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
    } catch {
      return 'Biraz önce';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          className="text-4xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          ✍️
        </motion.div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <motion.div
        className="glass-card rounded-2xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-5xl mb-3">📝</div>
        <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
          Henüz masa notu yok
        </p>
        <p className={`text-muted-foreground ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
          İlk notu sen bırak!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-xl' : 'text-lg'}`}>
            Masa Notları ✍️
          </h3>
        </div>
      )}

      {/* Notes Grid */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <AnimatePresence>
          {notes.map((note, index) => {
            const decoration = getDecoration(note.decoration_type);
            
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Gerçekçi Yırtık Peçete/Kağıt */}
                <div 
                  className={`
                    relative
                    shadow-lg
                    p-3
                    scale-90
                    ${compact ? 'min-h-[64px]' : 'min-h-[96px]'}
                    hover:shadow-xl hover:scale-[0.92] transition-all duration-200
                  `}
                  style={{
                    background: 'linear-gradient(135deg, #f5f5dc 0%, #fffaf0 50%, #f5f5dc 100%)',
                    clipPath: 'polygon(2% 1%, 1% 4%, 0% 10%, 1% 20%, 0% 35%, 1% 50%, 0% 65%, 2% 80%, 1% 90%, 3% 96%, 10% 99%, 20% 100%, 35% 99%, 50% 100%, 65% 99%, 80% 100%, 90% 99%, 96% 97%, 99% 90%, 100% 80%, 99% 65%, 100% 50%, 99% 35%, 100% 20%, 98% 10%, 99% 4%, 96% 1%, 80% 0%, 65% 1%, 50% 0%, 35% 1%, 20% 0%, 10% 1%)',
                    boxShadow: 'inset 0 2px 4px rgba(139, 119, 101, 0.1), inset 0 -2px 3px rgba(139, 119, 101, 0.05), 0 4px 8px rgba(0, 0, 0, 0.15)',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                    transform: `rotate(${Math.random() * 4 - 2}deg)`,
                  }}
                >
                  {/* Paper texture */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139, 119, 101, 0.3) 1px, rgba(139, 119, 101, 0.3) 2px),
                      repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(139, 119, 101, 0.3) 1px, rgba(139, 119, 101, 0.3) 2px)
                    `,
                    backgroundSize: '3px 3px',
                  }} />

                  {/* Subtle coffee/wine stain */}
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 35%, rgba(139, 119, 101, 0.4) 0%, transparent 30%)',
                  }} />

                  {/* Not İçeriği - El Yazısı Tarzı */}
                  <p 
                    className={`
                      text-gray-800
                      leading-relaxed
                      ${compact ? 'text-xs' : 'text-sm'}
                      relative z-10
                    `}
                    style={{
                      fontFamily: '"Caveat", "Comic Sans MS", cursive',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {note.note}
                  </p>

                  {/* Zaman Damgası - El yazısı */}
                  <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-600 opacity-70 relative z-10">
                    <Clock className="h-2.5 w-2.5" />
                    <span className="italic" style={{
                      fontFamily: '"Caveat", cursive',
                      transform: 'rotate(-0.5deg)',
                    }}>
                      {getTimeAgo(note.created_at)}
                    </span>
                  </div>

                  {/* Prominent folded corner */}
                  <div className="absolute bottom-0 right-0 w-12 h-12 opacity-40" style={{
                    background: 'linear-gradient(135deg, transparent 48%, rgba(139, 119, 101, 0.15) 48%, rgba(139, 119, 101, 0.25) 52%, transparent 52%)',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                    boxShadow: '-2px -2px 4px rgba(0, 0, 0, 0.1)',
                  }} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* "Uçup Gitti" Mesajı (24 saatten eski notlar için) */}
      {notes.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <p className="text-muted-foreground text-sm italic">
            Eski notlar uçup gitti 🕊️
          </p>
        </motion.div>
      )}
    </div>
  );
};
