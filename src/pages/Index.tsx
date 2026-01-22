import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { DrinkCard } from '@/components/DrinkCard';
import { Leaderboard } from '@/components/Leaderboard';
import { AuthForm } from '@/components/AuthForm';
import { AddDrinkModal } from '@/components/AddDrinkModal';
import { VenueNotes } from '@/components/VenueNotes';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface DrinkLog {
  id: string;
  category: string;
  drink_name: string | null;
  quantity: number;
  photo_url: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  has_recipe: boolean | null;
  recipe_ingredients: string | null;
  recipe_instructions: string | null;
  logged_at: string;
  user_id: string;
  location: string | null;
  promil_score: number | null;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface LeaderboardUser {
  username: string;
  drinkCount: number;
  totalPromil: number;
  rank: number;
  avatarUrl?: string;
}

const Index = () => {
  const { user, loading, isDrunkMode } = useApp();
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentVenue, setCurrentVenue] = useState<string | null>(null);
  const [venueTimestamp, setVenueTimestamp] = useState<string | null>(null);
  const [showVenueNotes, setShowVenueNotes] = useState(false);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const isPulling = useRef(false);

  const fetchFeed = async () => {
    if (!user) return;

    // Fetch all drink logs with profile info (global feed)
    const { data, error } = await supabase
      .from('drink_logs')
      .select(`
        id,
        category,
        drink_name,
        quantity,
        photo_url,
        before_photo_url,
        after_photo_url,
        has_recipe,
        recipe_ingredients,
        recipe_instructions,
        logged_at,
        user_id,
        location,
        promil_score
      `)
      .order('logged_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Feed hatası:', error);
      return;
    }

    if (data && data.length > 0) {
      // Fetch profiles for all unique user_ids (including is_private field)
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, is_private')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch user's accepted follows to check visibility
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      const followingIds = new Set(followsData?.map(f => f.following_id) || []);
      
      // Filter logs based on privacy settings
      const visibleLogs = data.filter(log => {
        const profile = profileMap.get(log.user_id);
        
        // Show own posts
        if (log.user_id === user.id) return true;
        
        // Show public profiles
        if (!profile?.is_private) return true;
        
        // Show private profiles only if following (accepted)
        return followingIds.has(log.user_id);
      });

      const logsWithProfiles = visibleLogs.map(log => ({
        ...log,
        profiles: profileMap.get(log.user_id) || null,
      }));

      setDrinkLogs(logsWithProfiles as unknown as DrinkLog[]);
    }
  };

  const fetchLeaderboard = async () => {
    if (!user) return;

    // Get users the current user follows (only accepted)
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    const followingIds = followingData?.map(f => f.following_id) || [];
    // Include current user + followed users
    const relevantUserIds = [user.id, ...followingIds];

    // Haftalık verileri al (son 7 gün)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get drink counts for relevant users (haftalık)
    const { data } = await supabase
      .from('drink_logs')
      .select('user_id, quantity, promil_score')
      .in('user_id', relevantUserIds)
      .gte('logged_at', oneWeekAgo.toISOString());

    if (data) {
      // Aggregate by user (promil skorlarına göre)
      const userStats: Record<string, { count: number; promil: number }> = {};
      data.forEach(log => {
        if (!userStats[log.user_id]) {
          userStats[log.user_id] = { count: 0, promil: 0 };
        }
        userStats[log.user_id].count += log.quantity;
        userStats[log.user_id].promil += log.promil_score || 0;
      });

      // Get profiles for leaderboard users
      const userIds = Object.keys(userStats);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Sort and rank by total promil
      const ranked = Object.entries(userStats)
        .sort(([, a], [, b]) => b.promil - a.promil)
        .slice(0, 5)
        .map(([userId, stats], index) => ({
          username: profileMap.get(userId)?.username || 'user',
          drinkCount: stats.count,
          totalPromil: stats.promil,
          rank: index + 1,
          avatarUrl: profileMap.get(userId)?.avatar_url,
        }));

      setLeaderboard(ranked);
    }
  };

  const fetchCurrentVenue = async () => {
    if (!user) return;

    try {
      // Calculate 12 hours ago timestamp
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

      // Get user's most recent drink log with location (within 12 hours)
      const { data: userLog } = await supabase
        .from('drink_logs')
        .select('location, logged_at')
        .eq('user_id', user.id)
        .not('location', 'is', null)
        .gte('logged_at', twelveHoursAgo) // Only last 12 hours
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userLog?.location) {
        setCurrentVenue(userLog.location);
        setVenueTimestamp(userLog.logged_at);
        setShowVenueNotes(true);
        return;
      }

      // If user has no recent location, check followed users' recent locations
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        
        const { data: followedLog } = await supabase
          .from('drink_logs')
          .select('location, logged_at')
          .in('user_id', followingIds)
          .not('location', 'is', null)
          .gte('logged_at', twelveHoursAgo) // Only last 12 hours
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (followedLog?.location) {
          setCurrentVenue(followedLog.location);
          setVenueTimestamp(followedLog.logged_at);
          setShowVenueNotes(true);
        } else {
          setCurrentVenue(null);
          setVenueTimestamp(null);
          setShowVenueNotes(false);
        }
      } else {
        setCurrentVenue(null);
        setVenueTimestamp(null);
        setShowVenueNotes(false);
      }
    } catch (error) {
      console.error('Error fetching current venue:', error);
      setCurrentVenue(null);
      setVenueTimestamp(null);
      setShowVenueNotes(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed();
      fetchLeaderboard();
      fetchCurrentVenue();
    }
  }, [user]);

  // Pull-to-refresh handlers
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchFeed(),
        fetchLeaderboard(),
        fetchCurrentVenue()
      ]);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current || !isPulling.current) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    
    if (distance > 0 && mainRef.current?.scrollTop === 0) {
      // Pull down - allow with resistance
      const maxPull = 100;
      const resistance = 0.5;
      const pull = Math.min(distance * resistance, maxPull);
      setPullDistance(pull);
      
      // Prevent default scrolling when pulling
      if (pull > 10) {
        e.preventDefault();
      }
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    touchStartY.current = null;
    isPulling.current = false;
  };

  // Mouse support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.clientY;
      isPulling.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartY.current || !isPulling.current) return;
    
    const currentY = e.clientY;
    const distance = currentY - touchStartY.current;
    
    if (distance > 0 && mainRef.current?.scrollTop === 0) {
      const maxPull = 100;
      const resistance = 0.5;
      const pull = Math.min(distance * resistance, maxPull);
      setPullDistance(pull);
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  };

  const handleMouseUp = () => {
    if (pullDistance > 50 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    touchStartY.current = null;
    isPulling.current = false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-6xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          🍺
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <FloatingBottles />
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <motion.div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: pullDistance > 10 ? 1 : 0,
            y: pullDistance > 10 ? 0 : -20,
            scale: Math.min(pullDistance / 50, 1)
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="glass-card rounded-full p-3 flex items-center justify-center">
            {isRefreshing ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <motion.div
                animate={{ rotate: pullDistance > 50 ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      <main
        ref={mainRef}
        className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance, 60)}px)` : 'translateY(0)',
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Leaderboard users={leaderboard} />
        </motion.div>

        {/* Active Venue Notes - Kişiselleştirilmiş Tek Mekan (12 Saat Kontrolü) */}
        {showVenueNotes && currentVenue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="glass-card rounded-2xl p-5 border-2 border-primary/30">
              {/* Aktif Mekan Başlığı */}
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-display font-bold text-foreground flex items-center gap-2 ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
                  <span className="text-2xl">✍️</span>
                  Aktif Mekan
                </h2>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">CANLI</span>
                </div>
              </div>

              {/* Mekan Bilgisi */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-2xl">📍</span>
                <h3 className={`font-semibold text-foreground ${isDrunkMode ? 'text-lg' : 'text-base'}`}>
                  {currentVenue}
                </h3>
              </div>

              {/* Masa Notları */}
              <VenueNotes venueName={currentVenue} maxNotes={3} compact />
            </div>
          </motion.div>
        )}

        <h2 className={`font-display font-bold text-foreground mb-4 ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
          Son Aktiviteler 🍻
        </h2>

        <div className="space-y-4">
          {drinkLogs.length === 0 ? (
            <motion.div
              className="glass-card rounded-2xl p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className={`block mb-3 ${isDrunkMode ? 'text-7xl' : 'text-5xl'}`}>🍺</span>
              <p className={`text-foreground font-medium ${isDrunkMode ? 'text-xl' : ''}`}>
                Henüz içki yok!
              </p>
              <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                İlk içkiyi sen ekle.
              </p>
            </motion.div>
          ) : (
            drinkLogs.map((log) => (
              <DrinkCard
                key={log.id}
                id={log.id}
                userId={log.user_id}
                username={log.profiles?.username || 'user'}
                avatarUrl={log.profiles?.avatar_url || undefined}
                category={log.category as any}
                drinkName={log.drink_name || undefined}
                quantity={log.quantity}
                photoUrl={log.photo_url || undefined}
                beforePhotoUrl={log.before_photo_url || undefined}
                afterPhotoUrl={log.after_photo_url || undefined}
                hasRecipe={!!log.has_recipe}
                recipeIngredients={log.recipe_ingredients || undefined}
                recipeInstructions={log.recipe_instructions || undefined}
                loggedAt={log.logged_at}
                location={log.location || undefined}
                promilScore={log.promil_score || undefined}
              />
            ))
          )}
        </div>
      </main>

      <BottomNav />
      <AddDrinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchFeed();
          fetchLeaderboard();
        }}
      />
    </div>
  );
};

export default Index;