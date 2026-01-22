import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, Heart, MessageCircle, UserCheck, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  actor_id: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    venue_name?: string;
    event_name?: string;
    event_id?: string;
    note_id?: string;
  };
  actor_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface FollowRequest {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Notifications = () => {
  const { user, isDrunkMode } = useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchFollowRequests();
      markAllAsRead();
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch actor profiles for notifications that have real actors (not system)
      const systemActorId = '00000000-0000-0000-0000-000000000000';
      const actorIds = [...new Set(data.map(n => n.actor_id).filter(id => id !== systemActorId))];
      
      let profileMap = new Map();
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', actorIds);

        profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

      const notificationsWithProfiles = data.map(n => {
        // For system notifications (venue notifications), use default profile
        if (n.actor_id === systemActorId) {
          return {
            ...n,
            actor_profile: { username: 'Sistem', avatar_url: null }
          };
        }
        return {
          ...n,
          actor_profile: profileMap.get(n.actor_id) || { username: 'Bilinmeyen', avatar_url: null }
        };
      });

      setNotifications(notificationsWithProfiles);
    }
    setLoading(false);
  };

  const fetchFollowRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching follow requests:', error);
        toast.error('Takip istekleri yüklenirken hata oluştu');
        return;
      }

      if (data && data.length > 0) {
        // Fetch follower profiles
        const followerIds = data.map(f => f.follower_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', followerIds);

        if (profileError) {
          console.error('Error fetching follower profiles:', profileError);
        }

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const requestsWithProfiles = data.map(r => ({
          ...r,
          follower_profile: profileMap.get(r.follower_id) || { 
            username: 'Bilinmeyen', 
            display_name: null,
            avatar_url: null 
          }
        }));

        console.log('Follow requests loaded:', requestsWithProfiles.length);
        setFollowRequests(requestsWithProfiles);
      } else {
        // No pending requests
        setFollowRequests([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching follow requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, followerId: string) => {
    if (!user) {
      toast.error('Oturum hatası. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      // Update follow status to accepted with detailed error handling
      const { data: updateData, error: updateError } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('following_id', user.id) // RLS policy için gerekli
        .select();

      if (updateError) {
        console.error('Follow update error:', updateError);
        
        // Detailed error messages
        if (updateError.message.includes('permission') || updateError.code === 'PGRST301') {
          toast.error('İzin hatası: Bu işlemi yapmaya yetkiniz yok');
        } else if (updateError.message.includes('policy')) {
          toast.error('Güvenlik politikası hatası. Lütfen tekrar deneyin.');
        } else {
          toast.error(`Hata: ${updateError.message}`);
        }
        return;
      }

      if (!updateData || updateData.length === 0) {
        toast.error('Takip isteği bulunamadı veya zaten işleme alınmış');
        return;
      }

      // Create notification for the follower
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: followerId,
        type: 'follow_accepted',
        actor_id: user.id,
      });

      if (notifError) {
        console.error('Notification error:', notifError);
        // Bildirim hatası kritik değil, devam ediyoruz
      }

      // Remove from pending list (optimistic update)
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast.success('Takip isteği kabul edildi! 🍻');
      
      // Refresh follow requests to ensure sync
      setTimeout(() => fetchFollowRequests(), 1000);
    } catch (error: any) {
      console.error('Unexpected error in handleAcceptRequest:', error);
      toast.error(`Beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user) {
      toast.error('Oturum hatası. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      // Delete follow request with detailed error handling
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('id', requestId)
        .eq('following_id', user.id); // RLS policy için gerekli

      if (deleteError) {
        console.error('Follow delete error:', deleteError);
        
        if (deleteError.message.includes('permission') || deleteError.code === 'PGRST301') {
          toast.error('İzin hatası: Bu işlemi yapmaya yetkiniz yok');
        } else if (deleteError.message.includes('policy')) {
          toast.error('Güvenlik politikası hatası. Lütfen tekrar deneyin.');
        } else {
          toast.error(`Hata: ${deleteError.message}`);
        }
        return;
      }

      // Remove from pending list (optimistic update)
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast.success('Takip isteği reddedildi');
      
      // Refresh follow requests to ensure sync
      setTimeout(() => fetchFollowRequests(), 1000);
    } catch (error: any) {
      console.error('Unexpected error in handleRejectRequest:', error);
      toast.error(`Beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}`);
    }
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return {
          icon: <UserPlus className="h-5 w-5 text-primary" />,
          text: 'seni takip etmeye başladı',
          emoji: '🍻',
          onClick: () => navigate(`/user/${notification.actor_id}`)
        };
      case 'follow_request':
        return {
          icon: <UserPlus className="h-5 w-5 text-amber-500" />,
          text: 'sana takip isteği gönderdi',
          emoji: '🥂',
          onClick: () => navigate(`/user/${notification.actor_id}`)
        };
      case 'follow_accepted':
        return {
          icon: <UserCheck className="h-5 w-5 text-green-500" />,
          text: 'takip isteğini kabul etti',
          emoji: '✅',
          onClick: () => navigate(`/user/${notification.actor_id}`)
        };
      case 'like':
        return {
          icon: <Heart className="h-5 w-5 text-red-500" />,
          text: 'gönderini beğendi',
          emoji: '❤️',
          onClick: () => navigate(`/user/${notification.actor_id}`)
        };
      case 'comment':
        return {
          icon: <MessageCircle className="h-5 w-5 text-primary" />,
          text: 'yorum yaptı',
          emoji: '💬',
          onClick: () => navigate(`/user/${notification.actor_id}`)
        };
      case 'venue_new_event':
        return {
          icon: <Calendar className="h-5 w-5 text-amber-500" />,
          text: notification.metadata?.venue_name 
            ? `${notification.metadata.venue_name} mekanında yeni bir etkinlik var: ${notification.metadata.event_name || 'Etkinlik'}!`
            : 'Yeni bir etkinlik var!',
          emoji: '🎸',
          onClick: () => {
            if (notification.metadata?.venue_name) {
              navigate(`/venue/${encodeURIComponent(notification.metadata.venue_name)}`);
            }
          }
        };
      case 'venue_new_note':
        return {
          icon: <MessageCircle className="h-5 w-5 text-primary" />,
          text: notification.metadata?.venue_name
            ? `${notification.metadata.venue_name} için yeni bir not bırakıldı.`
            : 'Yeni bir not bırakıldı.',
          emoji: '📝',
          onClick: () => {
            if (notification.metadata?.venue_name) {
              navigate(`/venue/${encodeURIComponent(notification.metadata.venue_name)}`);
            }
          }
        };
      default:
        return {
          icon: <Bell className="h-5 w-5 text-primary" />,
          text: 'sana bildirim gönderdi',
          emoji: '🔔',
          onClick: () => notification.actor_id && navigate(`/user/${notification.actor_id}`)
        };
    }
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10 space-y-6">
        <motion.h1
          className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-3xl' : 'text-2xl'}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Bildirimler 🔔
        </motion.h1>

        {/* Follow Requests Section */}
        {followRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className={`font-display font-semibold text-foreground flex items-center gap-2 ${isDrunkMode ? 'text-xl' : 'text-lg'}`}>
              <UserPlus className="h-5 w-5 text-primary" />
              Takip İstekleri
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                {followRequests.length}
              </span>
            </h2>
            <div className="space-y-2">
              {followRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  className="glass-card rounded-xl p-4 flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div 
                    className={`rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer ${isDrunkMode ? 'w-14 h-14' : 'w-12 h-12'}`}
                    onClick={() => navigate(`/user/${request.follower_id}`)}
                  >
                    {request.follower_profile?.avatar_url ? (
                      <img
                        src={request.follower_profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={isDrunkMode ? 'text-2xl' : 'text-xl'}>👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className={`text-foreground font-semibold cursor-pointer hover:text-primary transition-colors ${isDrunkMode ? 'text-lg' : 'text-sm'}`}
                      onClick={() => navigate(`/user/${request.follower_id}`)}
                    >
                      {request.follower_profile?.display_name || request.follower_profile?.username}
                    </p>
                    <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-xs'}`}>
                      @{request.follower_profile?.username}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleAcceptRequest(request.id, request.follower_id)}
                      size="sm"
                      className="rounded-xl gap-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <UserCheck className="h-4 w-4" />
                      {!isDrunkMode && <span className="hidden sm:inline">Kabul</span>}
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.id)}
                      size="sm"
                      variant="destructive"
                      className="rounded-xl gap-1"
                    >
                      <X className="h-4 w-4" />
                      {!isDrunkMode && <span className="hidden sm:inline">Reddet</span>}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regular Notifications */}
        <div>
          <h2 className={`font-display font-semibold text-foreground mb-3 ${isDrunkMode ? 'text-xl' : 'text-lg'}`}>
            Tüm Bildirimler
          </h2>

          {notifications.length === 0 ? (
            <motion.div
              className="glass-card rounded-2xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-5xl block mb-3">😴</span>
              <p className="text-muted-foreground">Henüz bildirim yok</p>
              <p className={`text-foreground mt-1 ${isDrunkMode ? 'text-lg' : 'text-sm'}`}>
                Biri seni takip ettiğinde burada göreceksin!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => {
                const content = getNotificationContent(notification);
                const isVenueNotification = notification.type === 'venue_new_event' || notification.type === 'venue_new_note';
                
                return (
                  <motion.div
                    key={notification.id}
                    className={`glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'border-l-4 border-primary' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={content.onClick}
                  >
                    {!isVenueNotification && (
                      <div className={`rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 ${isDrunkMode ? 'w-14 h-14' : 'w-12 h-12'}`}>
                        {notification.actor_profile?.avatar_url ? (
                          <img
                            src={notification.actor_profile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={isDrunkMode ? 'text-2xl' : 'text-xl'}>👤</span>
                        )}
                      </div>
                    )}
                    {isVenueNotification && (
                      <div className={`rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 ${isDrunkMode ? 'w-14 h-14' : 'w-12 h-12'}`}>
                        <span className={isDrunkMode ? 'text-2xl' : 'text-xl'}>
                          {notification.type === 'venue_new_event' ? '🎸' : '📝'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-foreground ${isDrunkMode ? 'text-lg' : 'text-sm'}`}>
                        {!isVenueNotification && (
                          <span className="font-semibold">@{notification.actor_profile?.username}</span>
                        )}
                        {!isVenueNotification && ' '}
                        {content.text} {content.emoji}
                      </p>
                      <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-xs'}`}>
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {content.icon}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;