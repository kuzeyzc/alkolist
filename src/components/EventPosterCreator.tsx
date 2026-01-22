import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VenueAutocomplete } from '@/components/VenueAutocomplete';
import { EventPosterPreview } from '@/components/EventPosterPreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventPosterCreatorProps {
  organizationName?: string;
  organizationLogo?: string;
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  existingEvent?: {
    id: string;
    event_name: string;
    event_type: string;
    date: string;
    time: string;
    description?: string;
    location_name: string;
    location_id?: string;
    ticket_url?: string;
  };
}

const eventTypes = [
  'Techno',
  'Stand-up',
  'Jazz',
  'Türkçe Pop',
  'Parti',
  'Yabancı Pop',
  'Rock',
  'Elektronik',
  'Kültürel Etkinlik',
];

export const EventPosterCreator = ({
  organizationName,
  organizationLogo,
  onClose,
  onSuccess,
  editMode = false,
  existingEvent,
}: EventPosterCreatorProps) => {
  const [eventName, setEventName] = useState(existingEvent?.event_name || '');
  const [eventType, setEventType] = useState(existingEvent?.event_type || '');
  const [date, setDate] = useState(existingEvent?.date || '');
  const [time, setTime] = useState(existingEvent?.time || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [locationName, setLocationName] = useState(existingEvent?.location_name || '');
  const [locationId, setLocationId] = useState(existingEvent?.location_id || '');
  const [ticketUrl, setTicketUrl] = useState(existingEvent?.ticket_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!eventName.trim()) {
      toast.error('Lütfen etkinlik adını girin');
      return;
    }
    if (!eventType) {
      toast.error('Lütfen etkinlik türünü seçin');
      return;
    }
    if (!date) {
      toast.error('Lütfen tarih seçin');
      return;
    }
    
    // Date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      toast.error('⚠️ Geçersiz tarih formatı. Lütfen geçerli bir tarih seçin.');
      return;
    }
    
    // Check if date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error('⚠️ Geçmiş bir tarih seçemezsiniz. Lütfen gelecek bir tarih seçin.');
      return;
    }
    
    if (!time) {
      toast.error('Lütfen saat seçin');
      return;
    }
    
    // Time format validation (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      toast.error('⚠️ Geçersiz saat formatı. Lütfen geçerli bir saat seçin (00:00 - 23:59).');
      return;
    }
    
    if (!locationName.trim()) {
      toast.error('Lütfen mekan seçin');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.error('❌ Auth error:', userError);
        toast.error('Giriş yapmanız gerekiyor');
        return;
      }

      console.log('✅ User authenticated:', userData.user.id);

      // 2. Check if user has a profile and is_organizer
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_organizer, organization_name, organization_status')
        .eq('user_id', userData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Profile error:', profileError);
        toast.error('⚠️ Profil bulunamadı. Lütfen önce profil sayfanızı ziyaret edin.');
        return;
      }

      if (!profileData.is_organizer) {
        console.error('❌ User is not an organizer');
        toast.error('⚠️ Sadece organizatörler etkinlik oluşturabilir. Lütfen önce organizasyon profilinizi oluşturun.');
        return;
      }

      // 3. Check organization approval status
      if (profileData.organization_status !== 'approved') {
        console.error('❌ Organization not approved:', profileData.organization_status);
        
        if (profileData.organization_status === 'pending') {
          toast.error('📝 Profiliniz inceleniyor. Onaylandıktan sonra etkinlik paylaşabileceksiniz.');
        } else if (profileData.organization_status === 'rejected') {
          toast.error('⛔ Organizasyon profiliniz reddedilmiştir. Lütfen bizimle iletişime geçin.');
        } else {
          toast.error('⚠️ Organizasyon profiliniz henüz onaylanmamış.');
        }
        return;
      }

      console.log('✅ Profile verified:', {
        profileId: profileData.id,
        isOrganizer: profileData.is_organizer,
        orgName: profileData.organization_name,
        status: profileData.organization_status,
      });

      if (editMode && existingEvent) {
        // Update existing event
        console.log('📝 Updating event:', {
          id: existingEvent.id,
          organizerId: profileData.id,
          date: date, // Format: YYYY-MM-DD (PostgreSQL DATE)
          time: time, // Format: HH:MM (PostgreSQL TIME)
        });

        const { data, error } = await supabase
          .from('organization_events')
          .update({
            event_name: eventName,
            event_type: eventType,
            date: date, // Already in YYYY-MM-DD format
            time: time, // Already in HH:MM format
            description: description || null,
            location_name: locationName,
            location_id: locationId || null,
            ticket_url: ticketUrl || null,
          })
          .eq('id', existingEvent.id)
          .eq('organizer_id', profileData.id) // Security: Only update own events
          .select()
          .single();

        if (error) {
          console.error('❌ Event update error:', error);
          toast.error(`Etkinlik güncellenemedi: ${error.message || 'Bilinmeyen hata'}`);
          return;
        }

        console.log('✅ Event updated:', data);
        toast.success('✅ Etkinlik başarıyla güncellendi!');
        
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // Create new event
      console.log('📅 Creating event:', {
        organizer_id: profileData.id, // Use profile.id, not user_id!
        event_name: eventName,
        event_type: eventType,
        date: date, // Format: YYYY-MM-DD (PostgreSQL DATE)
        time: time, // Format: HH:MM (PostgreSQL TIME)
        location_name: locationName,
        location_id: locationId || null,
      });

      const { data, error } = await supabase
        .from('organization_events')
        .insert({
          organizer_id: profileData.id, // Use profile.id (profiles table primary key)
          event_name: eventName,
          event_type: eventType,
          date: date, // Already in YYYY-MM-DD format (PostgreSQL DATE)
          time: time, // Already in HH:MM format (PostgreSQL TIME)
          description: description || null,
          location_name: locationName,
          location_id: locationId || null,
          ticket_url: ticketUrl || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Event creation error:', error);
        
        // Detailed error messages
        if (error.code === 'PGRST116') {
          toast.error('⚠️ Organizatör profili bulunamadı. Lütfen önce organizasyon profilinizi oluşturun.');
        } else if (error.message?.includes('is_organizer')) {
          toast.error('⚠️ Sadece organizatörler etkinlik oluşturabilir.');
        } else if (error.message?.includes('foreign key')) {
          toast.error('⚠️ Kullanıcı profili bulunamadı. Lütfen tekrar giriş yapın.');
        } else {
          toast.error(`Etkinlik oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
        }
        return;
      }

      console.log('✅ Event created:', data);
      toast.success('🎉 Etkinlik başarıyla oluşturuldu!');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast.error(`Beklenmeyen bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        className="relative bg-[#F5E6D3] w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          imageRendering: 'pixelated',
          clipPath: 'polygon(1% 0%, 99% 0%, 100% 2%, 100% 98%, 99% 100%, 1% 100%, 0% 98%, 0% 2%)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 bg-[#E8D4B8] border-b-4 border-gray-400 px-6 py-4 flex items-center justify-between"
          style={{ imageRendering: 'pixelated' }}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#8B6F47]" />
            <h2 className="text-2xl font-mono font-bold text-[#3E2723]">
              {editMode ? 'Etkinlik Düzenle' : 'Afiş Oluşturucu'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#D4B896] transition-colors"
            style={{ imageRendering: 'pixelated' }}
          >
            <X className="h-6 w-6 text-[#3E2723]" />
          </button>
        </div>

        {/* Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Left: Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                  Etkinlik Adı *
                </label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Örn: Cumartesi Gecesi Techno"
                  maxLength={80}
                  className="bg-white border-2 border-[#D4B896] rounded-none text-[#3E2723] font-mono focus:border-[#8B6F47] focus:ring-0"
                />
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  {eventName.length}/80 karakter
                </p>
              </div>

              {/* Event Type */}
              <div>
                <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                  Etkinlik Türü *
                </label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-white border-2 border-[#D4B896] rounded-none text-[#3E2723] font-mono focus:border-[#8B6F47] focus:ring-0">
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F5E6D3] border-2 border-[#D4B896] rounded-none">
                    {eventTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="font-mono text-[#3E2723] focus:bg-[#E8D4B8]"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time - Türkçe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                    Tarih * <span className="text-xs text-gray-600">(Gün/Ay/Yıl)</span>
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    lang="tr"
                    className="bg-white border-2 border-[#D4B896] rounded-none text-[#3E2723] font-mono focus:border-[#8B6F47] focus:ring-0"
                  />
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    📅 Gelecek bir tarih seçin
                  </p>
                </div>
                <div>
                  <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                    Saat * <span className="text-xs text-gray-600">(24 saat)</span>
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    lang="tr"
                    className="bg-white border-2 border-[#D4B896] rounded-none text-[#3E2723] font-mono focus:border-[#8B6F47] focus:ring-0"
                  />
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    🕐 Örn: 22:00
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                  Mekan *
                </label>
                <VenueAutocomplete
                  value={locationName}
                  onChange={(value, venue) => {
                    setLocationName(value);
                    if (venue?.placeId) {
                      setLocationId(venue.placeId);
                    } else if (!value) {
                      setLocationId('');
                    }
                  }}
                  className="rounded-none"
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                  Açıklama (Opsiyonel)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Etkinlik hakkında ek bilgiler..."
                  maxLength={500}
                  rows={3}
                  className="bg-white border-2 border-[#D4B896] rounded-none text-[#3E2723] font-mono focus:border-[#8B6F47] focus:ring-0 resize-none"
                />
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  {description.length}/500 karakter
                </p>
              </div>

              {/* Ticket URL (Optional) */}
              <div>
                <label className="text-sm font-mono font-bold mb-2 block text-[#3E2723]">
                  Bilet Linki (Opsiyonel)
                </label>
                <Input
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  placeholder="https://biletix.com/..."
                  className="bg-white border-2 border-[#D4B896] rounded-none text-[#3E2723] font-mono focus:border-[#8B6F47] focus:ring-0"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#8B6F47] hover:bg-[#6D5637] text-white font-mono font-bold py-6 border-4 border-[#6D5637] shadow-lg disabled:opacity-50"
                style={{ imageRendering: 'pixelated' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {editMode ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {editMode ? 'Değişiklikleri Kaydet' : 'Etkinliği Yayınla'}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right: Live Preview */}
          <div>
            <div className="sticky top-24">
              <h3 className="text-lg font-mono font-bold text-[#3E2723] mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#8B6F47]" />
                Önizleme
              </h3>
              <EventPosterPreview
                eventName={eventName}
                eventType={eventType}
                date={date}
                time={time}
                locationName={locationName}
                organizationName={organizationName}
                organizationLogo={organizationLogo}
                ticketUrl={ticketUrl}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
