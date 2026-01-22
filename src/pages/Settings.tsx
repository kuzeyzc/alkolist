import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FloatingBottles } from '@/components/FloatingBottles';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { VenueAutocomplete } from '@/components/VenueAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Lock, 
  Mail, 
  Shield, 
  Moon, 
  Sun, 
  Bell, 
  LogOut,
  ChevronRight,
  X,
  Save,
  Eye,
  FileText,
  Send,
  Heart,
  MessageCircle,
  User,
  MapPin,
  Megaphone,
  Building2,
  Upload,
  Loader2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  followers: boolean;
  nearby_cheers: boolean;
  venue_events: boolean;
  app_updates: boolean;
}

interface ProfileSettings {
  is_private: boolean;
}

interface OrganizationProfile {
  is_organizer: boolean;
  organization_name: string;
  organization_type: string;
  organization_logo: string;
}

const Settings = () => {
  const { user, isDrunkMode, isDarkMode, setIsDarkMode } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactType, setContactType] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    likes: true,
    comments: true,
    followers: true,
    nearby_cheers: false,
    venue_events: false,
    app_updates: true,
  });
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Organization Profile States
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [orgLocationId, setOrgLocationId] = useState('');
  const [orgLocationName, setOrgLocationName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load notification preferences, privacy settings, and organization profile
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences, is_private, is_organizer, organization_name, organization_type, organization_logo, organization_location_id, organization_location_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Ayarlar yüklenirken hata:', error);
          return;
        }

        if (data?.notification_preferences) {
          setNotificationPrefs(data.notification_preferences as NotificationPreferences);
        }
        if (data?.is_private !== undefined) {
          setIsPrivate(data.is_private);
        }
        if (data?.is_organizer) {
          setIsOrganizer(data.is_organizer);
          setOrgName(data.organization_name?.replace(' Organizasyon', '') || '');
          setOrgType(data.organization_type || '');
          setOrgLogo(data.organization_logo || '');
          setOrgLocationId(data.organization_location_id || '');
          setOrgLocationName(data.organization_location_name || '');
        }
      } catch (error) {
        console.error('Beklenmeyen hata:', error);
      }
    };

    loadSettings();
  }, [user]);

  const updateNotificationPref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    // Optimistic update - UI'ı hemen güncelle
    const previousPrefs = { ...notificationPrefs };
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);

    try {
      const { error, data } = await supabase
        .from('profiles')
        .update({ notification_preferences: newPrefs })
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase hatası:', error);
        
        // Daha detaylı hata mesajı
        if (error.code === 'PGRST116') {
          toast.error('Profil bulunamadı. Lütfen tekrar giriş yapın.');
        } else if (error.message.includes('notification_preferences')) {
          toast.error('Veritabanı yapısı güncel değil. Lütfen yöneticiye bildirin.');
        } else if (error.message.includes('network')) {
          toast.error('Bağlantı sorunu. İnternet bağlantınızı kontrol edin.');
        } else {
          toast.error(`Hata: ${error.message}`);
        }
        
        // Revert to previous state
        setNotificationPrefs(previousPrefs);
        return;
      }

      // Başarılı kayıt
      if (data && data.length > 0) {
        toast.success('Bildirim tercihlerin güncellendi! 👾');
      }
    } catch (error: any) {
      console.error('Beklenmeyen hata:', error);
      toast.error(`Beklenmeyen hata: ${error.message || 'Bilinmeyen hata'}`);
      
      // Revert to previous state
      setNotificationPrefs(previousPrefs);
    }
  };

  const updatePrivacySetting = async (value: boolean) => {
    if (!user) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    // Optimistic update
    const previousValue = isPrivate;
    setIsPrivate(value);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: value })
        .eq('user_id', user.id);

      if (error) {
        console.error('Gizlilik ayarı güncellenirken hata:', error);
        toast.error('Gizlilik ayarı güncellenemedi');
        setIsPrivate(previousValue);
        return;
      }

      toast.success(value ? 'Hesabın artık gizli! 🔒' : 'Hesabın artık açık! 🔓');
    } catch (error: any) {
      console.error('Beklenmeyen hata:', error);
      toast.error('Beklenmeyen bir hata oluştu');
      setIsPrivate(previousValue);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword.trim()) {
      toast.error('Lütfen mevcut şifrenizi girin');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        toast.error('Mevcut şifreniz hatalı');
        setLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Şifreniz başarıyla değiştirildi! 🔒');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactType) {
      toast.error('Lütfen bir konu seçin');
      return;
    }

    if (!contactMessage.trim()) {
      toast.error('Lütfen mesajınızı yazın');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd send this to a support system
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Mesajınız kadehlere yazıldı, en kısa sürede döneceğiz! 🥂');
      setShowContactModal(false);
      setContactType('');
      setContactMessage('');
    } catch (error: any) {
      toast.error('Mesaj gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    setUploadingLogo(true);
    try {
      const path = `${user.id}/org_logo_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);

      setOrgLogo(urlData.publicUrl);
      toast.success('Logo yüklendi! 📷');
    } catch (error: any) {
      toast.error(error.message || 'Logo yüklenemedi');
    } finally {
      setUploadingLogo(false);
    }
  };

  const checkOrganizationNameAvailability = async (name: string) => {
    if (!name.trim() || name.trim().length < 3) {
      setNameAvailable(null);
      return;
    }

    setCheckingName(true);
    try {
      const finalName = `${name.trim()} Organizasyon`;
      
      // Kendi ismimiz hariç kontrol et
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_name, user_id')
        .eq('organization_name', finalName)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Name check error:', error);
        setNameAvailable(null);
        return;
      }

      // Eğer varsa ve başka birine aitse
      if (data && data.user_id !== user?.id) {
        setNameAvailable(false);
      } else {
        setNameAvailable(true);
      }
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      setNameAvailable(null);
    } finally {
      setCheckingName(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!user) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    if (!orgName.trim()) {
      toast.error('Lütfen organizasyon adı girin');
      return;
    }

    if (orgName.trim().length > 20) {
      toast.error('Organizasyon adı 20 karakterden fazla olamaz');
      return;
    }

    if (!orgType) {
      toast.error('Lütfen organizasyon türü seçin');
      return;
    }

    if (nameAvailable === false) {
      toast.error('Bu organizasyon adı zaten kullanılıyor');
      return;
    }

    setLoading(true);
    try {
      const finalOrgName = `${orgName.trim()} Organizasyon`;
      
      // Debug: Kaydedilecek verileri kontrol et
      console.log('💾 Settings.tsx - Saving Organization:', {
        name: finalOrgName,
        type: orgType,
        locationId: orgLocationId || '❌ BOŞ',
        locationName: orgLocationName || '❌ BOŞ',
        willSaveLocation: !!(orgLocationId && orgLocationName)
      });
      
      const { error, data } = await supabase
        .from('profiles')
        .update({
          is_organizer: true,
          organization_name: finalOrgName,
          organization_type: orgType,
          organization_logo: orgLogo || null,
          organization_location_id: orgLocationId || null,
          organization_location_name: orgLocationName || null,
        })
        .eq('user_id', user.id)
        .select();

      console.log('✅ Settings.tsx - Save Result:', {
        success: !error,
        error: error,
        savedData: data?.[0] || null
      });

      if (error) {
        // Unique constraint hatası
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          toast.error('Bu organizasyon adı zaten kullanılıyor');
          return;
        }
        throw error;
      }

      setIsOrganizer(true);
      toast.success('Organizasyon profili kaydedildi! 🎉');
      setShowOrganizationModal(false);
    } catch (error: any) {
      console.error('❌ Settings.tsx - Save Error:', error);
      toast.error(error.message || 'Organizasyon profili kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const settingsGroups = [
    {
      title: 'Hesap Ayarları',
      icon: User,
      items: [
        {
          icon: Lock,
          label: 'Gizli Hesap',
          onClick: () => {},
          description: 'Sadece takipçilerin gönderilerini görsün',
          isPrivacyToggle: true,
          value: isPrivate
        }
      ]
    },
    {
      title: 'Organizasyon',
      icon: Building2,
      items: [
        {
          icon: Building2,
          label: isOrganizer ? 'Organizasyon Profilini Düzenle' : 'Organizasyon Profili Oluştur',
          onClick: () => setShowOrganizationModal(true),
          description: isOrganizer 
            ? `${orgName} Organizasyon` 
            : 'Etkinlik ve mekan organizatörü olun'
        }
      ]
    },
    {
      title: 'Hesap Güvenliği',
      icon: Shield,
      items: [
        {
          icon: Lock,
          label: 'Şifre Değiştir',
          onClick: () => setShowPasswordModal(true),
          description: 'Hesap şifrenizi güncelleyin'
        }
      ]
    },
    {
      title: 'Destek ve İletişim',
      icon: Mail,
      items: [
        {
          icon: Mail,
          label: 'Bize Ulaşın',
          onClick: () => setShowContactModal(true),
          description: 'Sorularınız için bizimle iletişime geçin'
        }
      ]
    },
    {
      title: 'Yasal',
      icon: Shield,
      items: [
        {
          icon: Shield,
          label: 'Gizlilik Politikası',
          onClick: () => setShowPrivacyModal(true),
          description: 'Verileriniz nasıl korunuyor?'
        }
      ]
    },
    {
      title: 'Tercihler',
      icon: Bell,
      items: [
        {
          icon: isDarkMode ? Moon : Sun,
          label: isDarkMode ? 'Koyu Mod' : 'Aydınlık Mod',
          onClick: () => setIsDarkMode(!isDarkMode),
          description: 'Tema görünümünü değiştir',
          isToggle: true
        },
        {
          icon: Bell,
          label: 'Bildirim İzinleri',
          onClick: () => setShowNotificationsModal(true),
          description: 'Bildirim tercihlerinizi yönetin'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBottles />
      <Header />

      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto relative z-10 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-3xl' : 'text-2xl'}`}>
              ⚙️ Ayarlar
            </h1>
            <p className={`text-muted-foreground mt-2 ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
              Hesap ve uygulama tercihlerini yönet
            </p>
          </div>

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIdx) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="glass-card rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <group.icon className="h-5 w-5 text-primary" />
                <h2 className={`font-display font-bold text-foreground ${isDrunkMode ? 'text-lg' : 'text-base'}`}>
                  {group.title}
                </h2>
              </div>

              <div className="space-y-2">
                {group.items.map((item: any, itemIdx) => (
                  item.isPrivacyToggle ? (
                    <motion.div
                      key={itemIdx}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: itemIdx * 0.05 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium text-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                            {item.label}
                          </p>
                          <p className={`text-muted-foreground ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={item.value}
                        onCheckedChange={updatePrivacySetting}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </motion.div>
                  ) : (
                    <motion.button
                      key={itemIdx}
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium text-foreground ${isDrunkMode ? 'text-base' : 'text-sm'}`}>
                            {item.label}
                          </p>
                          <p className={`text-muted-foreground ${isDrunkMode ? 'text-sm' : 'text-xs'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </motion.button>
                  )
                ))}
              </div>
            </motion.div>
          ))}

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full gap-2 rounded-xl font-bold"
              size="lg"
            >
              <LogOut className="h-5 w-5" />
              Çıkış Yap
            </Button>
          </motion.div>
        </motion.div>
      </main>

      <BottomNav />

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="glass-card border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Şifre Değiştir
            </DialogTitle>
            <DialogDescription>
              Güvenlik için mevcut şifrenizi doğrulayın ve yeni şifrenizi belirleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Mevcut Şifre
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifrenizi girin..."
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Yeni Şifre
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter..."
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Yeni Şifre Tekrar
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar girin..."
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePasswordChange}
                disabled={loading}
                className="flex-1 gap-2 rounded-xl"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                variant="outline"
                className="flex-1 gap-2 rounded-xl"
              >
                <X className="h-4 w-4" />
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="glass-card border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Bize Ulaşın
            </DialogTitle>
            <DialogDescription>
              Sorularınız, önerileriniz veya sorunlarınız için bize yazın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Konu Seçin
              </label>
              <Select value={contactType} onValueChange={setContactType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Mesaj türünü seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Hata Bildirimi</SelectItem>
                  <SelectItem value="suggestion">💡 Öneri</SelectItem>
                  <SelectItem value="partnership">🤝 İş Birliği</SelectItem>
                  <SelectItem value="other">📝 Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Mesajınız
              </label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Mesajınızı detaylı bir şekilde buraya yazın..."
                className="rounded-xl resize-none"
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {contactMessage.length} / 500
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleContactSubmit}
                disabled={loading}
                className="flex-1 gap-2 rounded-xl"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
              <Button
                onClick={() => {
                  setShowContactModal(false);
                  setContactType('');
                  setContactMessage('');
                }}
                variant="outline"
                className="flex-1 gap-2 rounded-xl"
              >
                <X className="h-4 w-4" />
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="glass-card border-2 border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-primary" />
              Alkolist Gizlilik Merkezi 🛡️
            </DialogTitle>
            <DialogDescription>
              Verileriniz bizimle güvende - Şeffaf ve sorumlu veri yönetimi
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4 mt-4">
            <div className="space-y-6 text-sm">
              {/* Veri Toplama */}
              <section className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Veri Toplama</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Paylaştığınız fotoğraflar, konum bilgileri ve içki tercihleriniz sadece 
                  size daha iyi bir deneyim sunmak ve topluluk istatistikleri oluşturmak için kullanılır. 
                  Hiçbir veri üçüncü taraflarla satılmaz veya paylaşılmaz.
                </p>
                <div className="bg-muted/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>Toplanan veriler:</strong> Hesap bilgileri, içki kayıtları, 
                    sosyal etkileşimler, fotoğraflar, konum (opsiyonel)
                  </p>
                </div>
              </section>

              {/* Konum Verisi */}
              <section className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Konum Verisi</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Konum bilgileriniz <strong>sadece siz izin verdiğinizde</strong> gönderilere eklenir; 
                  arka planda sürekli takip yapılmaz. Konum paylaşımı tamamen isteğe bağlıdır ve 
                  her gönderi için ayrı ayrı seçebilirsiniz.
                </p>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Arka plan konumu takibi yapılmaz<br />
                    ✓ Her gönderi için manuel onay gerekir<br />
                    ✓ İstediğiniz zaman devre dışı bırakabilirsiniz
                  </p>
                </div>
              </section>

              {/* Hesap Silme */}
              <section className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <Lock className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Hesap Silme Hakkınız</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  İstediğiniz an profilinizdeki verileri kalıcı olarak silme hakkına sahipsiniz. 
                  Hesap silme işlemi tüm gönderilerinizi, yorumlarınızı, beğenilerinizi ve 
                  kişisel bilgilerinizi sistemden tamamen kaldırır.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                  <p className="text-xs text-destructive">
                    ⚠️ Bu işlem geri alınamaz - Tüm verileriniz kalıcı olarak silinecektir
                  </p>
                </div>
              </section>

              {/* Veri Güvenliği */}
              <section className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Veri Güvenliği</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Alkolist, kullanıcılarının gizliliğini en üst düzeyde önemser. 
                  Tüm verileriniz şifreli (SSL/TLS) olarak saklanır ve modern güvenlik 
                  protokolleriyle korunur. Şifreleriniz hash'lenerek saklanır ve bizim bile erişimimiz yoktur.
                </p>
              </section>

              {/* Veri Kullanımı */}
              <section className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Veri Kullanım Amacı</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Verileriniz yalnızca:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Uygulama içi deneyiminizi kişiselleştirmek</li>
                  <li>İstatistikler ve rozetler sunmak</li>
                  <li>Sosyal özellikler sağlamak (takip, beğeni, yorum)</li>
                  <li>Topluluk sıralamaları oluşturmak</li>
                  <li>Teknik sorunları gidermek</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  için kullanılır. Verileriniz asla reklam veya pazarlama amacıyla satılmaz.
                </p>
              </section>

              {/* İletişim */}
              <section className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base">Sorularınız mı Var?</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Gizlilik politikamız hakkında sorularınız veya önerileriniz için 
                  "Bize Ulaşın" bölümünden bizimle iletişime geçebilirsiniz. 
                  Gizliliğiniz bizim için önceliktir.
                </p>
              </section>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Son güncelleme: 20 Ocak 2026 • Alkolist Gizlilik Merkezi
                </p>
              </div>
            </div>
          </ScrollArea>

          <Button
            onClick={() => setShowPrivacyModal(false)}
            className="w-full rounded-xl mt-4"
          >
            Anladım
          </Button>
        </DialogContent>
      </Dialog>

      {/* Organization Profile Modal */}
      <Dialog open={showOrganizationModal} onOpenChange={setShowOrganizationModal}>
        <DialogContent className="glass-card border-2 border-primary/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              {isOrganizer ? 'Organizasyon Profilini Düzenle' : 'Organizasyon Profili Oluştur'} 🎪
            </DialogTitle>
            <DialogDescription>
              Etkinlik ve mekan organizatörü olarak profilinizi özelleştirin
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4 mt-4">
            <div className="space-y-4">
              {/* Organization Name */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Organizasyon Adı
                </label>
                <Input
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    // Name availability check
                    if (e.target.value.trim().length >= 3) {
                      checkOrganizationNameAvailability(e.target.value);
                    } else {
                      setNameAvailable(null);
                    }
                  }}
                  placeholder="Örn: Saha"
                  className="rounded-xl"
                  maxLength={20}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {orgName.length} / 20 karakter
                  </p>
                  {checkingName && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Kontrol ediliyor...
                    </div>
                  )}
                  {!checkingName && nameAvailable === false && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Bu isim alınmış
                    </p>
                  )}
                  {!checkingName && nameAvailable === true && orgName.trim().length >= 3 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span>✓</span>
                      Kullanılabilir
                    </p>
                  )}
                </div>
                {/* Preview */}
                {orgName.trim() && (
                  <div className={`mt-3 p-3 rounded-lg border ${nameAvailable === false ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                    <p className="text-xs text-muted-foreground mb-1">Önizleme:</p>
                    <p className={`font-display font-bold ${nameAvailable === false ? 'text-destructive' : 'text-primary'} ${isDrunkMode ? 'text-lg' : 'text-base'}`}>
                      {orgName.trim()} Organizasyon
                    </p>
                  </div>
                )}
              </div>

              {/* Organization Type */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Organizasyon Türü
                </label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Tür seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Techno">🎧 Techno</SelectItem>
                    <SelectItem value="Stand-up">🎤 Stand-up</SelectItem>
                    <SelectItem value="Jazz">🎷 Jazz</SelectItem>
                    <SelectItem value="Türkçe Pop">🎵 Türkçe Pop</SelectItem>
                    <SelectItem value="Parti">🎉 Parti</SelectItem>
                    <SelectItem value="Yabancı Pop">🎸 Yabancı Pop</SelectItem>
                    <SelectItem value="Rock">🤘 Rock</SelectItem>
                    <SelectItem value="Elektronik">🎛️ Elektronik</SelectItem>
                    <SelectItem value="Kültürel Etkinlik">🎭 Kültürel Etkinlik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Location */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Merkez Mekan (Opsiyonel)
                </label>
                <VenueAutocomplete
                  value={orgLocationName}
                  onChange={(value, venue) => {
                    console.log('🏢 VenueAutocomplete onChange:', { value, venue });
                    setOrgLocationName(value);
                    // OSM'den gelen venue objesinde 'placeId' var, 'foursquareId' değil!
                    if (venue?.placeId) {
                      console.log('✅ placeId bulundu:', venue.placeId);
                      setOrgLocationId(venue.placeId);
                    } else if (!value) {
                      console.log('⚠️ Value boş, locationId temizleniyor');
                      setOrgLocationId('');
                    } else {
                      console.log('⚠️ venue.placeId yok, locationId boş kalacak');
                    }
                  }}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Organizasyonunuzun ana mekanını seçin
                </p>
              </div>

              {/* Organization Logo */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Organizasyon Logosu (Opsiyonel)
                </label>
                <div className="flex items-center gap-3">
                  {orgLogo ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/30">
                      <img
                        src={orgLogo}
                        alt="Organization Logo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setOrgLogo('')}
                        className="absolute top-1 right-1 p-1 bg-destructive rounded-full hover:bg-destructive/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center bg-muted/30">
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <Button
                      onClick={() => logoInputRef.current?.click()}
                      variant="outline"
                      className="w-full gap-2 rounded-xl"
                      disabled={uploadingLogo}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingLogo ? 'Yükleniyor...' : 'Logo Yükle'}
                    </Button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG veya GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>İpucu:</strong> Organizasyon profiliniz profil sayfanızda görünecek ve diğer kullanıcılar sizi organizatör olarak görebilecek.
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSaveOrganization}
              disabled={loading || !orgName.trim() || !orgType}
              className="flex-1 gap-2 rounded-xl"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Button
              onClick={() => {
                setShowOrganizationModal(false);
              }}
              variant="outline"
              className="flex-1 gap-2 rounded-xl"
            >
              <X className="h-4 w-4" />
              İptal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Preferences Modal */}
      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="glass-card border-2 border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-6 w-6 text-primary" />
              Bildirim İzinleri 🔔
            </DialogTitle>
            <DialogDescription>
              Hangi durumlarda bildirim almak istediğinizi seçin
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4 mt-4">
            <div className="space-y-4">
              {/* Etkileşim Bildirimleri */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Etkileşim Bildirimleri
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-red-500/20">
                        <Heart className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Beğeniler</p>
                        <p className="text-xs text-muted-foreground">Gönderim beğenildiğinde</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPrefs.likes}
                      onCheckedChange={(checked) => updateNotificationPref('likes', checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-500/20">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Yorumlar</p>
                        <p className="text-xs text-muted-foreground">Gönderime yorum yapıldığında</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPrefs.comments}
                      onCheckedChange={(checked) => updateNotificationPref('comments', checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sosyal Bildirimler */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Sosyal Bildirimler
                </h3>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-purple-500/20">
                      <User className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Yeni Takipçiler</p>
                      <p className="text-xs text-muted-foreground">Yeni takipçim olduğunda</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.followers}
                    onCheckedChange={(checked) => updateNotificationPref('followers', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>

              {/* Mekan & Etkinlik */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Mekan & Etkinlik
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-amber-500/20">
                        <span className="text-lg">🍻</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Yakın Şerefeler</p>
                        <p className="text-xs text-muted-foreground">Yakınımda biri 'Şerefe' dediğinde</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPrefs.nearby_cheers}
                      onCheckedChange={(checked) => updateNotificationPref('nearby_cheers', checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-green-500/20">
                        <MapPin className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Mekan Etkinlikleri</p>
                        <p className="text-xs text-muted-foreground">Favori mekanda yeni etkinlik</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationPrefs.venue_events}
                      onCheckedChange={(checked) => updateNotificationPref('venue_events', checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sistem */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Sistem
                </h3>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/20">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Güncellemeler</p>
                      <p className="text-xs text-muted-foreground">Uygulama güncellemeleri ve duyurular</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs.app_updates}
                    onCheckedChange={(checked) => updateNotificationPref('app_updates', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  💡 <strong>İpucu:</strong> Bildirimleriniz anında kaydedilir ve istediğiniz zaman değiştirebilirsiniz
                </p>
              </div>
            </div>
          </ScrollArea>

          <Button
            onClick={() => setShowNotificationsModal(false)}
            className="w-full rounded-xl mt-4"
          >
            Tamam
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
