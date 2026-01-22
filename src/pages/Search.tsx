import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private?: boolean;
}

interface FollowStatus {
  userId: string;
  status: 'none' | 'pending' | 'accepted';
}

const Search = () => {
  const { user, isDrunkMode } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [followStatuses, setFollowStatuses] = useState<Map<string, 'none' | 'pending' | 'accepted'>>(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch who the current user follows with status
  useEffect(() => {
    if (user) {
      supabase
        .from('follows')
        .select('following_id, status')
        .eq('follower_id', user.id)
        .then(({ data }) => {
          if (data) {
            const statusMap = new Map<string, 'none' | 'pending' | 'accepted'>();
            data.forEach(f => {
              statusMap.set(f.following_id, f.status as 'pending' | 'accepted');
            });
            setFollowStatuses(statusMap);
          }
        });
    }
  }, [user]);

  // Search users with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(20);

      if (!error && data) {
        // Filter out current user
        setResults(data.filter((p) => p.user_id !== user?.id));
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const handleFollow = async (profileUserId: string, isPrivate: boolean) => {
    if (!user) return;

    const currentStatus = followStatuses.get(profileUserId) || 'none';

    if (currentStatus !== 'none') {
      // Unfollow or cancel request
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileUserId);

      if (!error) {
        setFollowStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.delete(profileUserId);
          return newMap;
        });
        toast.success(currentStatus === 'accepted' ? 'Takipten çıkıldı' : 'İstek iptal edildi');
      }
    } else {
      // Follow or send request
      const newStatus = isPrivate ? 'pending' : 'accepted';
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profileUserId,
        status: newStatus,
      });

      if (!error) {
        // Create notification
        const notificationType = isPrivate ? 'follow_request' : 'follow';
        await supabase.from('notifications').insert({
          user_id: profileUserId,
          type: notificationType,
          actor_id: user.id,
        });
        
        setFollowStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.set(profileUserId, newStatus);
          return newMap;
        });
        toast.success(newStatus === 'accepted' ? 'Takip ediliyor! 🍻' : 'İstek kadehlere yazıldı! 🥂');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kullanıcı ara..."
              className={`pl-12 bg-card/60 backdrop-blur-xl border-white/10 rounded-2xl ${isDrunkMode ? 'h-14 text-lg' : 'h-12'}`}
            />
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <motion.div
                className="text-4xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                🔍
              </motion.div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((profile) => (
                <motion.div
                  key={profile.id}
                  className="glass-card rounded-2xl p-4 flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/user/${profile.user_id}`)}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/user/${profile.user_id}`)}
                  >
                    <p className={`font-semibold text-foreground ${isDrunkMode ? 'text-lg' : ''}`}>
                      @{profile.username}
                    </p>
                    {profile.bio && (
                      <p className="text-muted-foreground text-sm line-clamp-1">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <Button
                    variant={
                      followStatuses.get(profile.user_id) === 'accepted' 
                        ? 'secondary' 
                        : followStatuses.get(profile.user_id) === 'pending' 
                        ? 'outline' 
                        : 'default'
                    }
                    size={isDrunkMode ? 'lg' : 'sm'}
                    onClick={() => handleFollow(profile.user_id, profile.is_private || false)}
                    className="rounded-xl gap-1"
                  >
                    {followStatuses.get(profile.user_id) === 'accepted' ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Takip
                      </>
                    ) : followStatuses.get(profile.user_id) === 'pending' ? (
                      <>
                        <UserPlus className="h-4 w-4" />
                        İstek
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Takip Et
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <span className="text-5xl block mb-3">😔</span>
              <p className="text-foreground font-medium">Kullanıcı bulunamadı</p>
              <p className="text-muted-foreground text-sm">
                Farklı bir kullanıcı adı dene
              </p>
            </div>
          )}

          {!query && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <span className="text-5xl block mb-3">🔍</span>
              <p className={`text-foreground font-medium ${isDrunkMode ? 'text-xl' : ''}`}>
                İçki arkadaşlarını bul
              </p>
              <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                Kullanıcı adına göre ara ve takip et
              </p>
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Search;