import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Wine, Loader2, Sparkles, Send, Calendar } from 'lucide-react';
import { EventPosterPreview } from '@/components/EventPosterPreview';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface VenueNote {
  id: string;
  note: string;
  created_at: string;
  decoration_type: number;
  cheers_count: number;
}

const VenueDetail = () => {
  const { venueName } = useParams<{ venueName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDrunkMode, user } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [venueNotes, setVenueNotes] = useState<VenueNote[]>([]);
  const [totalGlasses, setTotalGlasses] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [userCheers, setUserCheers] = useState<Set<string>>(new Set());
  const [cheersAnimation, setCheersAnimation] = useState<string | null>(null);
  const [topNote, setTopNote] = useState<VenueNote | null>(null);
  const [canPostNote, setCanPostNote] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [flyingPaper, setFlyingPaper] = useState(false);
  const [lastNoteTime, setLastNoteTime] = useState<Date | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [venueEvents, setVenueEvents] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  // Önce state'ten location name'i al, yoksa URL'den decode et
  const stateLocationName = (location.state as any)?.locationName;
  const decodedVenueName = stateLocationName || (venueName ? decodeURIComponent(venueName) : '');
  
  console.log('🏢 VenueDetail:', { 
    urlParam: venueName, 
    stateLocationName, 
    finalVenueName: decodedVenueName 
  });
  
  // 5-minute cooldown (in milliseconds)
  const COOLDOWN_MS = 5 * 60 * 1000;
  
  // Generate or retrieve user fingerprint for anonymous users
  const getUserFingerprint = () => {
    let fingerprint = localStorage.getItem('user_fingerprint');
    if (!fingerprint) {
      fingerprint = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_fingerprint', fingerprint);
    }
    return fingerprint;
  };

  useEffect(() => {
    if (decodedVenueName) {
      fetchVenueData();
      fetchUserCheers();
      checkUserPermission();
      checkLastNoteTime();
      fetchVenueEvents();
      checkFollowStatus();
    }
  }, [decodedVenueName, user]);

  // Cooldown timer effect
  useEffect(() => {
    if (!lastNoteTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastNoteTime.getTime();
      const remaining = Math.max(0, COOLDOWN_MS - elapsed);
      setCooldownRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastNoteTime]);

  const checkUserPermission = async () => {
    if (!user) {
      setCanPostNote(false);
      setCheckingPermission(false);
      return;
    }

    setCheckingPermission(true);
    try {
      // Check if user has posted from this venue in the last 12 hours
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

      const { data, error } = await supabase
        .from('drink_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('location', decodedVenueName)
        .gte('logged_at', twelveHoursAgo.toISOString())
        .limit(1);

      if (error) throw error;

      setCanPostNote(data && data.length > 0);
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
      setCanPostNote(false);
    } finally {
      setCheckingPermission(false);
    }
  };

  const checkLastNoteTime = async () => {
    if (!user) return;
    
    try {
      // Check last note from this user at this venue
      const { data, error } = await supabase
        .from('venue_notes')
        .select('created_at')
        .eq('venue_name', decodedVenueName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      if (data) {
        const lastTime = new Date(data.created_at);
        const elapsed = Date.now() - lastTime.getTime();
        
        if (elapsed < COOLDOWN_MS) {
          setLastNoteTime(lastTime);
          setCooldownRemaining(COOLDOWN_MS - elapsed);
        }
      }
    } catch (error) {
      console.error('Son not zamanı kontrol hatası:', error);
    }
  };

  const fetchVenueData = async () => {
    setLoading(true);
    try {
      // Fetch venue notes with cheers_count (son 24 saat)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: notes, error: notesError } = await supabase
        .from('venue_notes')
        .select('*')
        .eq('venue_name', decodedVenueName)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('cheers_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (notesError) {
        console.error('Notlar yüklenirken hata:', notesError);
        throw notesError;
      }
      
      // Find "Gecenin Sözü" - most cheered note
      const topRecentNote = notes && notes.length > 0 && notes[0].cheers_count > 0
        ? notes[0]
        : null;
      
      if (topRecentNote) {
        setTopNote(topRecentNote);
        setVenueNotes(notes?.filter(n => n.id !== topRecentNote.id) || []);
      } else {
        setTopNote(null);
        setVenueNotes(notes || []);
      }

      // Fetch stats - total glasses and unique users at this venue
      const { data: statsData, error: statsError } = await supabase
        .from('drink_logs')
        .select('quantity, user_id')
        .eq('location', decodedVenueName);

      if (!statsError && statsData) {
        const total = statsData.reduce((sum, log) => sum + log.quantity, 0);
        const uniqueUserIds = new Set(statsData.map(log => log.user_id));
        setTotalGlasses(total);
        setUniqueUsers(uniqueUserIds.size);
      }
    } catch (error) {
      console.error('Mekan verisi çekilemedi:', error);
      toast.error('Mekan bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's and upcoming events for this venue
      // IMPORTANT: Only show events from APPROVED organizations
      const { data, error } = await supabase
        .from('organization_events')
        .select(`
          *,
          organizer:organizer_id (
            organization_name,
            organization_logo,
            organization_type,
            organization_status
          )
        `)
        .eq('location_name', decodedVenueName)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(10); // Fetch more, will filter below

      if (error) {
        console.error('❌ Error fetching venue events:', error);
        return;
      }

      // Filter: Only show events from approved organizations
      const approvedEvents = (data || []).filter((event: any) => {
        const isApproved = event.organizer?.organization_status === 'approved';
        if (!isApproved) {
          console.log('🚫 Filtered out non-approved event:', event.event_name, 'from', event.organizer?.organization_name);
        }
        return isApproved;
      }).slice(0, 3); // Take top 3 after filtering

      console.log('📅 Venue events (approved only):', approvedEvents.length, 'of', data?.length);
      setVenueEvents(approvedEvents);
    } catch (error) {
      console.error('❌ Venue events error:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !decodedVenueName) {
      setIsFollowing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('venue_followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('venue_id', decodedVenueName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Follow status check error:', error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Follow status check error:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error('Takip etmek için giriş yapmalısın! 🔒');
      return;
    }

    setIsTogglingFollow(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('venue_followers')
          .delete()
          .eq('user_id', user.id)
          .eq('venue_id', decodedVenueName);

        if (error) throw error;

        setIsFollowing(false);
        toast.success('Takip bırakıldı');
      } else {
        // Follow
        const { error } = await supabase
          .from('venue_followers')
          .insert({
            user_id: user.id,
            venue_id: decodedVenueName,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast.success('Mekan takip ediliyor! 🔔');
      }
    } catch (error: any) {
      console.error('Follow toggle error:', error);
      if (error.code === '23505') {
        toast.info('Zaten takip ediyorsun!');
        setIsFollowing(true);
      } else {
        toast.error('Bir hata oluştu. Tekrar dene!');
      }
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const fetchUserCheers = async () => {
    try {
      let query = supabase
        .from('venue_note_cheers')
        .select('note_id');
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        const fingerprint = getUserFingerprint();
        query = query.eq('user_fingerprint', fingerprint);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setUserCheers(new Set(data.map(c => c.note_id)));
      }
    } catch (error) {
      console.error('Şerefeler yüklenemedi:', error);
    }
  };

  const handleCheer = async (noteId: string) => {
    const hasAlreadyCheered = userCheers.has(noteId);
    
    // Store original state for rollback
    const originalCheers = new Set(userCheers);
    const originalNotes = [...venueNotes];
    const originalTopNote = topNote ? { ...topNote } : null;
    
    try {
      if (hasAlreadyCheered) {
        // Optimistic update - remove cheer immediately
        const newCheers = new Set(userCheers);
        newCheers.delete(noteId);
        setUserCheers(newCheers);
        
        setVenueNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, cheers_count: Math.max(0, note.cheers_count - 1) }
            : note
        ));
        if (topNote?.id === noteId) {
          setTopNote({ ...topNote, cheers_count: Math.max(0, topNote.cheers_count - 1) });
        }
        
        // Actually remove from database
        let deleteQuery = supabase
          .from('venue_note_cheers')
          .delete()
          .eq('note_id', noteId);
        
        if (user) {
          deleteQuery = deleteQuery.eq('user_id', user.id);
        } else {
          const fingerprint = getUserFingerprint();
          deleteQuery = deleteQuery.eq('user_fingerprint', fingerprint);
        }
        
        const { error } = await deleteQuery;
        if (error) throw error;
        
      } else {
        // Optimistic update - add cheer immediately
        const newCheers = new Set(userCheers);
        newCheers.add(noteId);
        setUserCheers(newCheers);
        
        setVenueNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, cheers_count: note.cheers_count + 1 }
            : note
        ));
        if (topNote?.id === noteId) {
          setTopNote({ ...topNote, cheers_count: topNote.cheers_count + 1 });
        }
        
        // Show animation
        setCheersAnimation(noteId);
        setTimeout(() => setCheersAnimation(null), 800);
        
        // Add cheer to database
        const cheerData: any = { note_id: noteId };
        
        if (user) {
          cheerData.user_id = user.id;
        } else {
          cheerData.user_fingerprint = getUserFingerprint();
        }
        
        const { error } = await supabase
          .from('venue_note_cheers')
          .insert(cheerData);
        
        if (error) {
          // Rollback optimistic update
          setUserCheers(originalCheers);
          setVenueNotes(originalNotes);
          setTopNote(originalTopNote);
          setCheersAnimation(null);
          
          // Check for specific error types
          if (error.code === '23505') {
            // Unique constraint violation - already cheered
            toast.info('Zaten şerefe demişsin! 🍻');
            return;
          }
          throw error;
        }
        
        toast.success('Şerefe! 🍻');
      }
    } catch (error: any) {
      console.error('Şerefe hatası:', error);
      
      // Rollback on any error
      setUserCheers(originalCheers);
      setVenueNotes(originalNotes);
      setTopNote(originalTopNote);
      setCheersAnimation(null);
      
      // Better error messages
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        toast.error('Bunun için giriş yapmalısın! 🔒');
      } else if (error.code === '23505') {
        toast.info('Zaten şerefe demişsin! 🍻');
      } else if (error.message?.includes('rate') || error.message?.includes('too many')) {
        toast.error('Biraz bekle... ⏳');
      } else {
        toast.error('Şerefe eklenemedi. Tekrar dene!');
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Lütfen bir not yazın');
      return;
    }
    if (newNote.length > 100) {
      toast.error('Not maksimum 100 karakter olabilir');
      return;
    }
    if (!canPostNote) {
      toast.error('Not bırakmak için önce buradan bir kadeh paylaşmalısın! 🍻');
      return;
    }
    
    // Check cooldown (5 minutes)
    if (cooldownRemaining > 0) {
      const minutes = Math.floor(cooldownRemaining / 60000);
      const seconds = Math.floor((cooldownRemaining % 60000) / 1000);
      toast.error(`Çok hızlı gidiyorsun! Yeni bir peçete için biraz bekle... ⏳ (${minutes}:${seconds.toString().padStart(2, '0')})`);
      return;
    }

    setIsSubmittingNote(true);
    const noteText = newNote.trim();
    
    // Optimistic update - create temporary note
    const tempNote: VenueNote = {
      id: `temp-${Date.now()}`,
      note: noteText,
      created_at: new Date().toISOString(),
      decoration_type: Math.floor(Math.random() * 5) + 1,
      cheers_count: 0,
    };
    
    setVenueNotes(prev => [tempNote, ...prev]);
    setNewNote('');
    
    // Trigger flying paper animation
    setFlyingPaper(true);
    setTimeout(() => setFlyingPaper(false), 1000);

    try {
      const { data, error } = await supabase
        .from('venue_notes')
        .insert({
          venue_name: decodedVenueName,
          note: noteText,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp note with real note
      setVenueNotes(prev => prev.map(n => 
        n.id === tempNote.id ? data : n
      ));

      // Set cooldown
      setLastNoteTime(new Date());
      setCooldownRemaining(COOLDOWN_MS);

      toast.success('Notun peçeteye yazıldı! ✍️');
    } catch (error: any) {
      console.error('Not eklenemedi:', error);
      // Remove temp note on error
      setVenueNotes(prev => prev.filter(n => n.id !== tempNote.id));
      setNewNote(noteText); // Restore text
      toast.error(error.message || 'Not eklenemedi');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Decoration emojis for notes (like napkin doodles)
  const decorations = ['🍺', '🍷', '🥃', '🍸', '🍹'];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header />

      {/* Flying Paper Animation */}
      <AnimatePresence>
        {flyingPaper && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-6xl"
              initial={{ y: 100, rotate: 0, scale: 1 }}
              animate={{ y: -200, rotate: 360, scale: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              📄
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venue Header */}
      <div className="sticky top-16 z-10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950/95 border-b border-slate-800 backdrop-blur-sm pt-4">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="hover:bg-slate-800 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 
                className={`font-black text-white leading-tight ${
                  isDrunkMode ? 'text-4xl' : 'text-2xl'
                }`}
                style={{ fontFamily: '"Press Start 2P", cursive' }}
              >
                {decodedVenueName}
              </h1>
              <div className="flex items-center gap-1 text-amber-500 mt-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-medium">Mekan Detayları</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Google Maps Button - Pikselli Retro Style */}
            <motion.a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(decodedVenueName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                relative w-full py-4 px-6
                border-4 border-blue-500
                bg-blue-500 hover:bg-blue-600
                text-white font-black
                transition-all duration-200
                active:scale-95
                text-center
                no-underline
              `}
              style={{
                fontFamily: '"Press Start 2P", cursive',
                fontSize: isDrunkMode ? '14px' : '12px',
                imageRendering: 'pixelated',
                boxShadow: `
                  0 0 0 2px #1e293b,
                  0 0 0 4px #3b82f6,
                  0 8px 0 -4px #1e293b,
                  0 8px 0 0 #2563eb,
                  inset 0 -4px 0 rgba(0, 0, 0, 0.3)
                `,
                clipPath: 'polygon(0% 0%, 4px 0%, 4px 4px, calc(100% - 4px) 4px, calc(100% - 4px) 0%, 100% 0%, 100% 4px, calc(100% - 4px) 4px, calc(100% - 4px) calc(100% - 4px), 4px calc(100% - 4px), 4px 4px, 0% 4px)',
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: `
                  0 0 0 2px #1e293b,
                  0 0 0 4px #3b82f6,
                  0 10px 0 -4px #1e293b,
                  0 10px 0 0 #2563eb,
                  inset 0 -4px 0 rgba(0, 0, 0, 0.3),
                  0 0 20px rgba(59, 130, 246, 0.5)
                `
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Pixelated inner border effect */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(0, 0, 0, 0.1) 2px,
                      rgba(0, 0, 0, 0.1) 4px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(0, 0, 0, 0.1) 2px,
                      rgba(0, 0, 0, 0.1) 4px
                    )
                  `,
                  opacity: 0.3,
                }}
              />
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>📍</span>
                <span>HARİTADA GÖR</span>
              </span>
            </motion.a>

            {/* Follow Button - Pikselli Retro Style */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  onClick={handleToggleFollow}
                  disabled={isTogglingFollow}
                  className={`
                    relative w-full py-4 px-6
                    border-4 border-amber-500
                    ${isFollowing 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-amber-500 hover:bg-amber-600'
                    }
                    text-white font-black
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-95
                  `}
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: isDrunkMode ? '14px' : '12px',
                    imageRendering: 'pixelated',
                    boxShadow: `
                      0 0 0 2px #1e293b,
                      0 0 0 4px ${isFollowing ? '#dc2626' : '#f59e0b'},
                      0 8px 0 -4px #1e293b,
                      0 8px 0 0 ${isFollowing ? '#b91c1c' : '#d97706'},
                      inset 0 -4px 0 rgba(0, 0, 0, 0.3)
                    `,
                    clipPath: 'polygon(0% 0%, 4px 0%, 4px 4px, calc(100% - 4px) 4px, calc(100% - 4px) 0%, 100% 0%, 100% 4px, calc(100% - 4px) 4px, calc(100% - 4px) calc(100% - 4px), 4px calc(100% - 4px), 4px 4px, 0% 4px)',
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `
                      0 0 0 2px #1e293b,
                      0 0 0 4px ${isFollowing ? '#dc2626' : '#f59e0b'},
                      0 10px 0 -4px #1e293b,
                      0 10px 0 0 ${isFollowing ? '#b91c1c' : '#d97706'},
                      inset 0 -4px 0 rgba(0, 0, 0, 0.3),
                      0 0 20px ${isFollowing ? 'rgba(220, 38, 38, 0.5)' : 'rgba(245, 158, 11, 0.5)'}
                    `
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Pixelated inner border effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 2px,
                          rgba(0, 0, 0, 0.1) 2px,
                          rgba(0, 0, 0, 0.1) 4px
                        ),
                        repeating-linear-gradient(
                          90deg,
                          transparent,
                          transparent 2px,
                          rgba(0, 0, 0, 0.1) 2px,
                          rgba(0, 0, 0, 0.1) 4px
                        )
                      `,
                      opacity: 0.3,
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isTogglingFollow ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>YÜKLENİYOR...</span>
                      </>
                    ) : isFollowing ? (
                      <>
                        <span>🔔</span>
                        <span>TAKİBİ BIRAK</span>
                      </>
                    ) : (
                      <>
                        <span>➕</span>
                        <span>TAKİP ET</span>
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Stats Panel */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Wine className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-amber-500" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                {totalGlasses}
              </p>
              <p className="text-xs text-slate-400 mt-1">Tokuşan Kadeh</p>
            </motion.div>

            <motion.div
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-500" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                {uniqueUsers}
              </p>
              <p className="text-xs text-slate-400 mt-1">Kişi Burada</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Gecenin Sözü - Top Note Highlight */}
        {topNote && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="flex items-center gap-2 mb-3">
              <h2 
                className="text-lg font-black text-amber-400" 
                style={{ fontFamily: '"Press Start 2P", cursive' }}
              >
                GECENİN SÖZÜ
              </h2>
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            </div>
            
            <motion.div
              className="relative p-4 scale-90"
              animate={{ 
                filter: [
                  'drop-shadow(0 0 12px rgba(251, 191, 36, 0.5)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                  'drop-shadow(0 0 20px rgba(251, 191, 36, 0.7)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))',
                  'drop-shadow(0 0 12px rgba(251, 191, 36, 0.5)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: 'linear-gradient(135deg, #f5f5dc 0%, #fffaf0 50%, #f5f5dc 100%)',
                clipPath: 'polygon(3% 1%, 1% 3%, 0% 8%, 1% 15%, 0% 25%, 2% 35%, 0% 50%, 1% 65%, 0% 75%, 2% 85%, 1% 92%, 3% 97%, 8% 99%, 15% 100%, 25% 99%, 35% 100%, 50% 99%, 65% 100%, 75% 99%, 85% 100%, 92% 99%, 97% 97%, 99% 92%, 100% 85%, 99% 75%, 100% 65%, 98% 50%, 100% 35%, 99% 25%, 100% 15%, 98% 8%, 99% 3%, 97% 1%, 85% 0%, 75% 1%, 65% 0%, 50% 1%, 35% 0%, 25% 1%, 15% 0%, 8% 1%)',
                boxShadow: 'inset 0 2px 4px rgba(139, 119, 101, 0.1), inset 0 -2px 4px rgba(139, 119, 101, 0.05), 0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Paper texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139, 119, 101, 0.3) 1px, rgba(139, 119, 101, 0.3) 2px),
                  repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(139, 119, 101, 0.3) 1px, rgba(139, 119, 101, 0.3) 2px)
                `,
                backgroundSize: '4px 4px',
              }} />
              
              {/* Subtle stains */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(139, 119, 101, 0.3) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(139, 119, 101, 0.2) 0%, transparent 30%)',
              }} />
              
              {/* Crown Icon */}
              <span className="absolute top-2 right-2 text-3xl">👑</span>
              
              <p className="text-gray-800 text-sm leading-relaxed font-semibold pr-10 relative z-10" style={{
                fontFamily: '"Caveat", "Comic Sans MS", cursive',
                letterSpacing: '0.3px',
                textShadow: '0 0 1px rgba(0,0,0,0.1)',
              }}>
                {topNote.note}
              </p>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-300/40 relative z-10">
                <p className="text-[10px] text-gray-600 italic" style={{
                  fontFamily: '"Caveat", cursive',
                  transform: 'rotate(-1deg)',
                }}>
                  {formatDistanceToNow(new Date(topNote.created_at), { addSuffix: true, locale: tr })}
                </p>
                
                <motion.button
                  onClick={() => handleCheer(topNote.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    userCheers.has(topNote.id)
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  animate={userCheers.has(topNote.id) ? {
                    boxShadow: [
                      '0 0 10px rgba(251, 191, 36, 0.5)',
                      '0 0 20px rgba(251, 191, 36, 0.8)',
                      '0 0 10px rgba(251, 191, 36, 0.5)',
                    ],
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <motion.span 
                    className="text-lg"
                    animate={userCheers.has(topNote.id) ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0]
                    } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    🍻
                  </motion.span>
                  <span className="text-sm" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                    {topNote.cheers_count}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* Bu Gece - Event Posters */}
        {venueEvents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                Bu Gece
              </h2>
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-6">
              {venueEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <EventPosterPreview
                    eventName={event.event_name}
                    eventType={event.event_type}
                    date={event.date}
                    time={event.time}
                    locationName={event.location_name}
                    organizationName={event.organizer?.organization_name}
                    organizationLogo={event.organizer?.organization_logo}
                    ticketUrl={event.ticket_url}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Masa Notları (Digital Napkin) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Press Start 2P", cursive' }}>
              Masa Notları
            </h2>
            <span className="text-2xl">✍️</span>
          </div>

          {/* Add Note Form */}
          {checkingPermission ? (
            <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500 mx-auto" />
            </div>
          ) : !user ? (
            <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-400">
                Not bırakmak için giriş yapın
              </p>
            </div>
          ) : !canPostNote ? (
            <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-400 font-semibold">
                Not bırakmak için önce buradan bir kadeh paylaşmalısın! 🍻
              </p>
              <p className="text-xs text-slate-500 mt-1">
                (Son 12 saat içinde bu mekandan paylaşım yapmalısınız)
              </p>
            </div>
          ) : (
            <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2">
                Bu mekana özel anonim bir not bırak (24 saat sonra silinir)
              </p>
              {cooldownRemaining > 0 && (
                <div className="mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400 text-center">
                    ⏳ Yeni not için {Math.floor(cooldownRemaining / 60000)}:{(Math.floor((cooldownRemaining % 60000) / 1000)).toString().padStart(2, '0')} bekle
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Burası çok güzel! 🍺"
                  maxLength={100}
                  disabled={cooldownRemaining > 0}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={(e) => e.key === 'Enter' && !isSubmittingNote && cooldownRemaining === 0 && handleAddNote()}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isSubmittingNote || cooldownRemaining > 0}
                  className="bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                >
                  {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">
                {newNote.length}/100
              </p>
            </div>
          )}

          {/* Notes List */}
          {venueNotes.length === 0 && !topNote ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Henüz not yok. İlk notu sen bırak! 📝</p>
            </div>
          ) : (
            <div className="space-y-3">
              {venueNotes.map((note, index) => {
                const isPopular = note.cheers_count >= 5;
                const isHot = note.cheers_count >= 10;
                const hasCheered = userCheers.has(note.id);
                const isAnimating = cheersAnimation === note.id;
                const isTemp = note.id.startsWith('temp-');
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10, rotate: Math.random() * 6 - 3 }}
                    animate={{ opacity: isTemp ? 0.6 : 1, y: 0, rotate: Math.random() * 4 - 2 }}
                    transition={{ delay: isTemp ? 0 : index * 0.05 }}
                    className="relative p-3 scale-90"
                    style={{
                      background: 'linear-gradient(135deg, #f5f5dc 0%, #fffaf0 50%, #f5f5dc 100%)',
                      clipPath: 'polygon(2% 1%, 1% 4%, 0% 10%, 1% 20%, 0% 35%, 1% 50%, 0% 65%, 2% 80%, 1% 90%, 3% 96%, 10% 99%, 20% 100%, 35% 99%, 50% 100%, 65% 99%, 80% 100%, 90% 99%, 96% 97%, 99% 90%, 100% 80%, 99% 65%, 100% 50%, 99% 35%, 100% 20%, 98% 10%, 99% 4%, 96% 1%, 80% 0%, 65% 1%, 50% 0%, 35% 1%, 20% 0%, 10% 1%)',
                      boxShadow: isHot 
                        ? 'inset 0 2px 4px rgba(139, 119, 101, 0.1), 0 6px 12px rgba(249, 115, 22, 0.3), 0 3px 6px rgba(0, 0, 0, 0.2)'
                        : isPopular
                        ? 'inset 0 2px 4px rgba(139, 119, 101, 0.1), 0 6px 12px rgba(251, 191, 36, 0.25), 0 3px 6px rgba(0, 0, 0, 0.2)'
                        : 'inset 0 2px 4px rgba(139, 119, 101, 0.1), inset 0 -2px 3px rgba(139, 119, 101, 0.05), 0 4px 8px rgba(0, 0, 0, 0.15)',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
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
                    
                    {/* Subtle stains */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(139, 119, 101, 0.4) 0%, transparent 35%)',
                    }} />
                    
                    {/* Folded corner effect - more prominent */}
                    <div className="absolute bottom-0 right-0 w-10 h-10 opacity-40" style={{
                      background: 'linear-gradient(135deg, transparent 48%, rgba(139, 119, 101, 0.15) 48%, rgba(139, 119, 101, 0.25) 52%, transparent 52%)',
                      clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                      boxShadow: '-2px -2px 4px rgba(0, 0, 0, 0.1)',
                    }} />
                    
                    {/* Popularity Indicator */}
                    {isHot && (
                      <span className="absolute top-1 left-1 text-lg animate-bounce">🔥</span>
                    )}
                    {isPopular && !isHot && (
                      <span className="absolute top-1 left-1 text-lg">⭐</span>
                    )}
                    
                    <p className={`text-gray-800 text-xs leading-relaxed relative z-10 ${isPopular ? 'pr-6' : ''}`} style={{
                      fontFamily: '"Caveat", "Comic Sans MS", cursive',
                      letterSpacing: '0.3px',
                    }}>
                      {note.note}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-300/30 relative z-10">
                      <p className="text-[9px] text-gray-600 italic" style={{
                        fontFamily: '"Caveat", cursive',
                        transform: 'rotate(-0.5deg)',
                      }}>
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: tr })}
                      </p>
                      
                      <motion.button
                        onClick={() => handleCheer(note.id)}
                        disabled={isTemp}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          hasCheered
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                        } ${isTemp ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileTap={{ scale: isTemp ? 1 : 0.9 }}
                        animate={hasCheered ? {
                          boxShadow: [
                            '0 0 8px rgba(251, 191, 36, 0.4)',
                            '0 0 16px rgba(251, 191, 36, 0.7)',
                            '0 0 8px rgba(251, 191, 36, 0.4)',
                          ],
                        } : isAnimating ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.8, repeat: hasCheered ? Infinity : 0 }}
                      >
                        <motion.span 
                          className="text-base"
                          animate={hasCheered ? { 
                            scale: [1, 1.15, 1],
                            rotate: [0, -8, 8, 0]
                          } : {}}
                          transition={{ duration: 0.5, repeat: hasCheered ? Infinity : 0, repeatDelay: 1 }}
                        >
                          🍻
                        </motion.span>
                        <span style={{ fontFamily: '"Press Start 2P", cursive', fontSize: '10px' }}>
                          {note.cheers_count}
                        </span>
                      </motion.button>
                    </div>
                    
                    {/* Cheers Animation */}
                    <AnimatePresence>
                      {isAnimating && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none flex items-center justify-center"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.5 }}
                          transition={{ duration: 0.5 }}
                        >
                          <span className="text-6xl">🍻</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default VenueDetail;
