import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { StatsCard } from '@/components/StatsCard';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { DrinkCard } from '@/components/DrinkCard';
import { ImageModal } from '@/components/ImageModal';
import { FollowersModal } from '@/components/FollowersModal';
import { OrganizationCard } from '@/components/OrganizationCard';
import { EventPosterCreator } from '@/components/EventPosterCreator';
import { EventPosterPreview } from '@/components/EventPosterPreview';
import { DeleteEventDialog } from '@/components/DeleteEventDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Save, X, Edit2, Loader2, Grid3x3, Bookmark, Calendar, Sparkles, Trash2, Edit } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const { user, isDrunkMode } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ beer: 0, wine: 0, spirits: 0, cocktails: 0, raki: 0, vodka: 0, whiskey: 0, tequila: 0, gin: 0, rum: 0, cider: 0, liqueur: 0, sake: 0, soju: 0, cognac: 0, other: 0 });
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'myPosts' | 'saved'>('myPosts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Followers Modal States
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  
  // Event Creator States
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
      fetchFollowCounts();
      fetchUserPosts();
      fetchSavedPosts();
      fetchOrganizerEvents();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, is_organizer, organization_name, organization_type, organization_logo, organization_location_id, organization_location_name')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    // Debug: Fetch edilen verileri kontrol et
    console.log('👤 Profile.tsx - Fetched Data:', {
      hasData: !!data,
      error: error,
      isOrganizer: data?.is_organizer,
      orgName: data?.organization_name,
      locationId: data?.organization_location_id || '❌ YOK!',
      locationName: data?.organization_location_name || '❌ YOK!',
    });
    
    if (data) {
      setProfile(data);
      setEditDisplayName(data.display_name || '');
      setEditBio(data.bio || '');
    }
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('drink_logs')
      .select('category, quantity')
      .eq('user_id', user?.id);

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
    if (!user) return;

    // Followers count (only accepted)
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .eq('status', 'accepted');

    // Following count (only accepted)
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)
      .eq('status', 'accepted');

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const fetchOrganizerEvents = async () => {
    if (!user) return;

    // Fetch upcoming events for this organizer
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('organization_events')
      .select('*')
      .eq('organizer_id', user.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching organizer events:', error);
      return;
    }

    console.log('📅 Fetched organizer events:', data);
    setOrganizerEvents(data || []);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setShowEventCreator(true);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('organization_events')
        .delete()
        .eq('id', deletingEventId);

      if (error) {
        console.error('❌ Delete error:', error);
        toast.error(`Etkinlik silinemedi: ${error.message}`);
        return;
      }

      toast.success('🗑️ Etkinlik başarıyla silindi!');
      fetchOrganizerEvents(); // Refresh list
      setShowDeleteDialog(false);
      setDeletingEventId(null);
    } catch (error: any) {
      console.error('❌ Unexpected delete error:', error);
      toast.error(`Hata: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (eventId: string) => {
    setDeletingEventId(eventId);
    setShowDeleteDialog(true);
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('drink_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false });

    if (data) {
      setUserPosts(data);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('saved_posts')
      .select('*, log:drink_logs(*)')
      .eq('user_id', user.id);

    if (data) {
      // Extract drink logs from the nested structure
      const logs = data.map((item: any) => item.log).filter(Boolean);
      setSavedPosts(logs);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    setUploading(true);
    try {
      const path = `${user.id}/avatar_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: urlData.publicUrl });
      toast.success('Avatar güncellendi! 📸');
    } catch (error: any) {
      toast.error(error.message || 'Avatar yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate display name length
    if (editDisplayName.trim().length < 3) {
      toast.error('Görünen ad en az 3 karakter olmalıdır');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editDisplayName, bio: editBio })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, display_name: editDisplayName, bio: editBio });
      setIsEditing(false);
      toast.success('Profil güncellendi! ✨');
    } catch (error: any) {
      toast.error(error.message || 'Profil güncellenemedi');
    }
  };

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  
  // Show top 4 categories for stats display
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

  const badges = [
    { id: '1', name: 'Alkolik Yolunda', nameEn: 'On The Path', description: '2+ içki/hafta', icon: '🍺', earned: total >= 2 },
    { id: '2', name: 'Kıdemli Ayyaş', nameEn: 'Senior Drunk', description: '50+ toplam', icon: '🥴', earned: total >= 50 },
    { id: '3', name: 'Bira Ustası', nameEn: 'Beer Master', description: '20+ bira', icon: '🍻', earned: stats.beer >= 20 },
    { id: '4', name: 'Şarap Gurusu', nameEn: 'Wine Guru', description: '15+ şarap', icon: '🍷', earned: stats.wine >= 15 },
    { id: '5', name: 'Rakı Babası', nameEn: 'Raki Father', description: '10+ rakı', icon: '🥛', earned: stats.raki >= 10 },
    { id: '6', name: 'Kokteyl Kralı', nameEn: 'Cocktail King', description: '25+ kokteyl', icon: '🍹', earned: stats.cocktails >= 25 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10 space-y-4">
        <motion.div
          className="glass-card rounded-2xl p-5 text-center relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar with upload */}
          <div className="relative w-24 h-24 mx-auto mb-3">
            <div 
              className={`w-full h-full rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ${profile?.avatar_url ? 'cursor-zoom-in' : 'cursor-pointer'} ${isDrunkMode ? 'text-5xl' : 'text-4xl'}`}
              onClick={() => {
                if (profile?.avatar_url) {
                  setLightboxImage(profile.avatar_url);
                } else {
                  fileInputRef.current?.click();
                }
              }}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="w-full h-full rounded-full object-cover"
                  alt="Avatar"
                />
              ) : (
                '👤'
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Görünen Ad"
                className="text-center bg-muted/50 rounded-xl"
                maxLength={20}
              />
              <div className="relative">
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Biyografi"
                  className="text-center bg-muted/50 rounded-xl resize-none"
                  rows={3}
                  maxLength={160}
                />
                <div 
                  className={`text-xs text-right mt-1 transition-colors ${
                    editBio.length >= 140 
                      ? 'text-orange-500 font-medium' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {editBio.length} / 160
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleSaveProfile} 
                  size="sm" 
                  className="gap-1 rounded-xl"
                  disabled={editBio.length > 160}
                >
                  <Save className="h-4 w-4" /> Kaydet
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="gap-1 rounded-xl">
                  <X className="h-4 w-4" /> İptal
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-2xl' : 'text-xl'}`}>
                {profile?.display_name || profile?.username || 'user'}
              </h2>
              <p className={`text-muted-foreground ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                @{profile?.username}
              </p>
              <p className={`text-muted-foreground mt-1 break-words whitespace-pre-wrap overflow-hidden ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                {profile?.bio || 'Henüz biyografi yok'}
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

              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="mt-4 gap-1 rounded-xl"
              >
                <Edit2 className="h-4 w-4" /> Profili Düzenle
              </Button>
            </>
          )}
        </motion.div>

        {/* Organization Card - Show if user is an organizer */}
        {profile?.is_organizer && profile?.organization_name && profile?.organization_type && (
          <>
            {/* Debug: Prop'ları kontrol et */}
            {console.log('📤 Profile.tsx - Passing to OrganizationCard:', {
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

            {/* Create Event Button or Pending Message */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {profile.organization_status === 'approved' ? (
                <Button
                  onClick={() => setShowEventCreator(true)}
                  className="w-full bg-[#8B6F47] hover:bg-[#6D5637] text-white font-mono font-bold py-6 border-4 border-[#6D5637] shadow-lg"
                  style={{ imageRendering: 'pixelated' }}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Yeni Etkinlik Paylaş
                </Button>
              ) : profile.organization_status === 'pending' ? (
                <div
                  className="w-full bg-[#F5E6D3] border-4 border-[#D4B896] p-6 text-center"
                  style={{ imageRendering: 'pixelated' }}
                >
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-lg font-mono font-bold text-[#3E2723] mb-2">
                    Profiliniz İnceleniyor
                  </p>
                  <p className="text-sm font-mono text-gray-700">
                    Organizasyon profiliniz yönetici onayı bekliyor. 
                    Onaylandıktan sonra etkinlik paylaşabileceksiniz.
                  </p>
                </div>
              ) : profile.organization_status === 'rejected' ? (
                <div
                  className="w-full bg-red-100 border-4 border-red-600 p-6 text-center"
                  style={{ imageRendering: 'pixelated' }}
                >
                  <div className="text-4xl mb-3">⛔</div>
                  <p className="text-lg font-mono font-bold text-red-800 mb-2">
                    Profil Reddedildi
                  </p>
                  <p className="text-sm font-mono text-red-700">
                    Organizasyon profiliniz onaylanmadı. 
                    Daha fazla bilgi için bizimle iletişime geçin.
                  </p>
                </div>
              ) : (
                <div
                  className="w-full bg-gray-100 border-4 border-gray-400 p-6 text-center"
                  style={{ imageRendering: 'pixelated' }}
                >
                  <div className="text-4xl mb-3">⏳</div>
                  <p className="text-lg font-mono font-bold text-gray-800 mb-2">
                    Onay Bekleniyor
                  </p>
                  <p className="text-sm font-mono text-gray-600">
                    Organizasyon profiliniz henüz onaylanmamış.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Active Events List */}
            {organizerEvents.length > 0 && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-[#8B6F47]" />
                  <h3 className="text-lg font-mono font-bold text-foreground">
                    Aktif Etkinlikler
                  </h3>
                </div>

                <div className="space-y-4">
                  {organizerEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative"
                    >
                      <EventPosterPreview
                        eventName={event.event_name}
                        eventType={event.event_type}
                        date={event.date}
                        time={event.time}
                        locationName={event.location_name}
                        organizationName={profile.organization_name}
                        organizationLogo={profile.organization_logo}
                        ticketUrl={event.ticket_url}
                      />

                      {/* Edit & Delete Buttons */}
                      <div className="absolute top-4 right-4 flex gap-2 z-20">
                        <motion.button
                          onClick={() => handleEditEvent(event)}
                          className="p-2 bg-[#8B6F47] hover:bg-[#6D5637] text-white border-2 border-[#6D5637] shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ imageRendering: 'pixelated' }}
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => openDeleteDialog(event.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white border-2 border-red-800 shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ imageRendering: 'pixelated' }}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        <StatsCard stats={statsArray} totalDrinks={total} />
        <BadgeDisplay badges={badges} />

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab('myPosts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all ${
              activeTab === 'myPosts'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
            <span className={isDrunkMode ? 'text-base' : 'text-sm'}>Gönderilerim</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all ${
              activeTab === 'saved'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span className={isDrunkMode ? 'text-base' : 'text-sm'}>Kaydedilenler</span>
          </button>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {activeTab === 'myPosts' && (
            <>
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <DrinkCard
                    key={post.id}
                    id={post.id}
                    userId={post.user_id}
                    username={profile?.username || 'user'}
                    avatarUrl={profile?.avatar_url || undefined}
                    category={post.category}
                    drinkName={post.drink_name || undefined}
                    quantity={post.quantity}
                    photoUrl={post.photo_url || undefined}
                    beforePhotoUrl={post.before_photo_url || undefined}
                    afterPhotoUrl={post.after_photo_url || undefined}
                    loggedAt={post.logged_at}
                    location={post.location || undefined}
                    promilScore={post.promil_score || undefined}
                  />
                ))
              ) : (
                <div className="text-center py-12 glass-card rounded-2xl">
                  <div className="text-6xl mb-4">📭</div>
                  <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                    Henüz gönderin yok
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {savedPosts.length > 0 ? (
                savedPosts.map((post) => (
                  <DrinkCard
                    key={post.id}
                    id={post.id}
                    userId={post.user_id}
                    username={profile?.username || 'user'}
                    avatarUrl={profile?.avatar_url || undefined}
                    category={post.category}
                    drinkName={post.drink_name || undefined}
                    quantity={post.quantity}
                    photoUrl={post.photo_url || undefined}
                    beforePhotoUrl={post.before_photo_url || undefined}
                    afterPhotoUrl={post.after_photo_url || undefined}
                    loggedAt={post.logged_at}
                    location={post.location || undefined}
                    promilScore={post.promil_score || undefined}
                  />
                ))
              ) : (
                <div className="text-center py-12 glass-card rounded-2xl">
                  <div className="text-6xl mb-4">🔖</div>
                  <p className={`text-muted-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                    Henüz bir şey kaydetmedin
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />

      {/* Image Modal - Profile mode for avatar */}
      <ImageModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        mode="profile"
      />

      {/* Followers/Following Modal */}
      {user && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={user.id}
          type={followModalType}
        />
      )}

      {/* Event Poster Creator Modal */}
      {showEventCreator && (
        <EventPosterCreator
          organizationName={profile?.organization_name}
          organizationLogo={profile?.organization_logo}
          editMode={!!editingEvent}
          existingEvent={editingEvent}
          onClose={() => {
            setShowEventCreator(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            fetchOrganizerEvents();
            setShowEventCreator(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Delete Event Confirmation Dialog */}
      <DeleteEventDialog
        isOpen={showDeleteDialog}
        eventName={
          organizerEvents.find((e) => e.id === deletingEventId)?.event_name || ''
        }
        onConfirm={handleDeleteEvent}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletingEventId(null);
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Profile;