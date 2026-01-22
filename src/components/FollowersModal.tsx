import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FollowUser {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export const FollowersModal = ({ isOpen, onClose, userId, type }: FollowersModalProps) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FollowUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  useEffect(() => {
    // Arama filtresi
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.display_name?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Takipçiler veya takip edilenleri çek (sadece accepted olanlar)
      const { data: followData } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .eq(type === 'followers' ? 'following_id' : 'follower_id', userId)
        .eq('status', 'accepted');

      if (followData && followData.length > 0) {
        // Kullanıcı ID'lerini topla
        const userIds = type === 'followers' 
          ? followData.map(f => f.follower_id)
          : followData.map(f => f.following_id);

        // Profil bilgilerini çek
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        if (profiles) {
          setUsers(profiles);
          setFilteredUsers(profiles);
        }
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (clickedUserId: string) => {
    onClose();
    navigate(`/user/${clickedUserId}`);
  };

  const title = type === 'followers' ? 'Takipçiler' : 'Takip Edilenler';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative glass-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-5 border-b border-border/50">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                {title} 👥
              </h2>

              {/* Arama Çubuğu */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kullanıcı ara..."
                  className="pl-10 bg-muted/30 border-border rounded-xl"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {searchQuery ? '🔍' : '🍺'}
                  </div>
                  <p className="text-foreground font-medium mb-1">
                    {searchQuery ? 'Kullanıcı bulunamadı' : 'Henüz kimse yok'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? 'Farklı bir arama dene' : type === 'followers' ? 'Henüz takipçin yok' : 'Henüz kimseyi takip etmiyor'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.user_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handleUserClick(user.user_id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>

                      {/* Arrow Icon */}
                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Sonuç Sayısı */}
            {!loading && filteredUsers.length > 0 && (
              <div className="p-4 border-t border-border/50">
                <p className="text-center text-sm text-muted-foreground">
                  {searchQuery ? (
                    <>
                      <span className="font-bold text-foreground">{filteredUsers.length}</span> sonuç bulundu
                    </>
                  ) : (
                    <>
                      Toplam <span className="font-bold text-foreground">{users.length}</span> {type === 'followers' ? 'takipçi' : 'takip'}
                    </>
                  )}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
