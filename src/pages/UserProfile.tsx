import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { StatsCard } from '@/components/StatsCard';
import { DrinkCard } from '@/components/DrinkCard';
import { ImageModal } from '@/components/ImageModal';
import { FollowersModal } from '@/components/FollowersModal';
import { OrganizationCard } from '@/components/OrganizationCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DrinkLog {
  id: string;
  category: string;
  drink_name: string | null;
  quantity: number;
  photo_url: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  logged_at: string;
  user_id: string;
  promil_score: number | null;
  location: string | null;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isDrunkMode } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ beer: 0, wine: 0, spirits: 0, cocktails: 0, raki: 0, vodka: 0, whiskey: 0, tequila: 0, gin: 0, rum: 0, cider: 0, liqueur: 0, sake: 0, soju: 0, cognac: 0, other: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userDrinks, setUserDrinks] = useState<DrinkLog[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Followers Modal States
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
      checkFollowing();
      fetchFollowCounts();
      fetchUserDrinks();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, is_organizer, organization_name, organization_type, organization_logo, organization_location_id, organization_location_name')
      .eq('user_id', userId)
      .maybeSingle();

    // Debug: Fetch edilen verileri kontrol et
    console.log('👥 UserProfile.tsx - Fetched Data:', {
      userId: userId,
      hasData: !!data,
      error: error,
      isOrganizer: data?.is_organizer,
      orgName: data?.organization_name,
      locationId: data?.organization_location_id || '❌ YOK!',
      locationName: data?.organization_location_name || '❌ YOK!',
    });

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('drink_logs')
      .select('category, quantity')
      .eq('user_id', userId);

    if (data) {
      const s = { beer: 0, wine: 0, spirits: 0, cocktails: 0, raki: 0, vodka: 0, whiskey: 0, tequila: 0, gin: 0, rum: 0, cider: 0, liqueur: 0, sake: 0, soju: 0, cognac: 0, other: 0 };
      data.forEach((d: any) => {
        if (s.hasOwnProperty(d.category)) {
          s[d.category as keyof typeof s] += d.quantity;
        }
      });
      setStats(s);
    }
  };

  const fetchFollowCounts = async () => {
    if (!userId) return;

    // Followers count (only accepted)
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
      .eq('status', 'accepted');

    // Following count (only accepted)
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const fetchUserDrinks = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('drink_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(10);

    if (data) {
      setUserDrinks(data);
    }
  };

  const checkFollowing = async () => {
    if (!user || !userId) return;

    const { data } = await supabase
      .from('follows')
      .select('id, status')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    if (data) {
      setFollowStatus(data.status);
      setIsFollowing(data.status === 'accepted');
    } else {
      setFollowStatus('none');
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      // If already following or request is pending, handle unfollow/cancel
      if (followStatus === 'accepted' || followStatus === 'pending') {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Unfollow error:', error);
          toast.error(`Hata: ${error.message}`);
          return;
        }

        setFollowStatus('none');
        setIsFollowing(false);
        if (followStatus === 'accepted') {
          setFollowersCount(prev => prev - 1);
          toast.success('Takipten çıkıldı');
        } else {
          toast.success('İstek iptal edildi');
        }
      } else {
        // Check if profile is private
        const isPrivateProfile = profile?.is_private || false;
        const newStatus = isPrivateProfile ? 'pending' : 'accepted';

        console.log('Sending follow request:', { userId, newStatus, isPrivate: isPrivateProfile });

        // Insert follow with appropriate status
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
            status: newStatus,
          })
          .select();

        if (followError) {
          console.error('Follow error:', followError);
          
          if (followError.message.includes('duplicate')) {
            toast.error('Zaten takip isteği gönderilmiş');
          } else if (followError.message.includes('permission')) {
            toast.error('İzin hatası');
          } else {
            toast.error(`Hata: ${followError.message}`);
          }
          return;
        }

        console.log('Follow request created:', followData);

        // Create notification for the followed user
        const notificationType = isPrivateProfile ? 'follow_request' : 'follow';
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: userId,
          type: notificationType,
          actor_id: user.id,
        });

        if (notifError) {
          console.error('Notification error:', notifError);
          // Bildirim hatası kritik değil, devam ediyoruz
        }

        setFollowStatus(newStatus);
        if (newStatus === 'accepted') {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
          toast.success('Takip edildi! 🍻');
        } else {
          setIsFollowing(false);
          toast.success('İstek kadehlere yazıldı! 🥂');
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in handleFollow:', error);
      toast.error(`Beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}`);
    }
  };

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const sortedStats = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const categoryEmojis: Record<string, string> = {
    beer: '🍺',
    wine: '🍷',
    raki: '🥛',
    vodka: '🧊',
    whiskey: '🥃',
    tequila: '🌵',
    gin: '🍸',
    rum: '🏴‍☠️',
    cocktails: '🍹',
    cider: '🍎',
    liqueur: '🍬',
    sake: '🍶',
    soju: '🇰🇷',
    spirits: '🥃',
    cognac: '🥃',
    other: '🍾',
  };

  const statsArray = sortedStats.map(([category, count]) => ({
    category,
    count,
    emoji: categoryEmojis[category] || '🍺',
  }));

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <FloatingBottles />
        <Header />
        <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10">
          <div className="glass-card rounded-2xl p-8 text-center">
            <span className="text-5xl block mb-3">😔</span>
            <p className="text-foreground font-medium">Kullanıcı bulunamadı</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="mt-4 rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" /> Geri Dön
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10 space-y-4">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="sm"
          className="gap-1 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" /> Geri
        </Button>

        <motion.div
          className="glass-card rounded-2xl p-5 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div 
            className={`w-24 h-24 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center overflow-hidden ${profile.avatar_url ? 'cursor-zoom-in' : ''} ${isDrunkMode ? 'text-5xl' : 'text-4xl'}`}
            onClick={() => profile.avatar_url && setLightboxImage(profile.avatar_url)}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="w-full h-full rounded-full object-cover"
                alt="Avatar"
              />
            ) : (
              '👤'
            )}
          </div>
          <h2 className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
            {profile.display_name || profile.username}
          </h2>
          <p className={`text-muted-foreground ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
            @{profile.username}
          </p>
          <p className={`text-muted-foreground mt-1 ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
            {profile.bio || 'Henüz biyografi yok'}
          </p>

          {/* Followers/Following Counts - Tıklanabilir */}
          <div className="flex justify-center gap-6 mt-4">
            <button
              onClick={() => {
                setFollowModalType('followers');
                setShowFollowersModal(true);
              }}
              className="text-center p-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
            >
              <p className={`font-display font-bold text-foreground group-hover:text-primary transition-colors ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
                {followersCount}
              </p>
              <p className={`text-muted-foreground group-hover:text-primary transition-colors ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                Takipçi
              </p>
            </button>
            <div className="w-px bg-border/50" />
            <button
              onClick={() => {
                setFollowModalType('following');
                setShowFollowersModal(true);
              }}
              className="text-center p-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
            >
              <p className={`font-display font-bold text-foreground group-hover:text-primary transition-colors ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
                {followingCount}
              </p>
              <p className={`text-muted-foreground group-hover:text-primary transition-colors ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                Takip
              </p>
            </button>
          </div>

          {user?.id !== userId && (
            <Button
              onClick={handleFollow}
              variant={followStatus === 'accepted' ? 'secondary' : followStatus === 'pending' ? 'outline' : 'default'}
              className={`mt-4 rounded-xl gap-2 ${isDrunkMode ? 'h-12 text-lg' : ''}`}
            >
              {followStatus === 'accepted' ? (
                <>
                  <UserCheck className="h-4 w-4" /> Takip Ediliyor
                </>
              ) : followStatus === 'pending' ? (
                <>
                  <UserPlus className="h-4 w-4" /> İstek Gönderildi
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Takip Et
                </>
              )}
            </Button>
          )}
        </motion.div>

        {/* Check if profile is private and user is not following */}
        {profile?.is_private && !isFollowing && user?.id !== userId ? (
          <motion.div
            className="glass-card rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4 opacity-30 blur-sm select-none">🔒</div>
            <h3 className={`font-display font-bold text-foreground mb-2 ${isDrunkMode ? 'text-xl' : 'text-lg'}`}>
              Bu hesap gizli
            </h3>
            <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
              {followStatus === 'pending' 
                ? 'Takip isteğin onay bekliyor. Kabul edilince gönderileri görebileceksin!' 
                : 'Paylaşımları görmek için takip isteği gönder!'}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Organization Card - Show if user is an organizer */}
            {profile?.is_organizer && profile?.organization_name && profile?.organization_type && (
              <>
                {/* Debug: Prop'ları kontrol et */}
                {console.log('📤 UserProfile.tsx - Passing to OrganizationCard:', {
                  name: profile.organization_name,
                  locationId: profile.organization_location_id || '❌ UNDEFINED!',
                  locationName: profile.organization_location_name || '❌ UNDEFINED!',
                  profileKeys: Object.keys(profile).filter(k => k.includes('location'))
                })}
                
                <OrganizationCard
                  organizationName={profile.organization_name}
                  organizationType={profile.organization_type}
                  organizationLogo={profile.organization_logo}
                  organizationLocationId={profile.organization_location_id}
                  organizationLocationName={profile.organization_location_name}
                  organizationStatus={profile.organization_status}
                />
              </>
            )}

            <StatsCard stats={statsArray} totalDrinks={total} />

            {/* User's Drink Logs */}
            {userDrinks.length > 0 && (
              <div>
                <h3 className={`font-display font-bold text-foreground mb-3 ${isDrunkMode ? 'text-xl' : 'text-lg'}`}>
                  İçki Geçmişi 🍻
                </h3>
                <div className="space-y-4">
                  {userDrinks.map((log) => (
                    <DrinkCard
                      key={log.id}
                      id={log.id}
                      userId={log.user_id}
                      username={profile?.username || 'user'}
                      avatarUrl={profile?.avatar_url || undefined}
                      category={log.category}
                      drinkName={log.drink_name || undefined}
                      quantity={log.quantity}
                      photoUrl={log.photo_url || undefined}
                      beforePhotoUrl={log.before_photo_url || undefined}
                      afterPhotoUrl={log.after_photo_url || undefined}
                      loggedAt={log.logged_at}
                      location={log.location || undefined}
                      promilScore={log.promil_score || undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {/* Image Modal - Profile mode for user avatar */}
      <ImageModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        mode="profile"
      />

      {/* Followers/Following Modal */}
      {userId && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={userId}
          type={followModalType}
        />
      )}
    </div>
  );
};

export default UserProfile;