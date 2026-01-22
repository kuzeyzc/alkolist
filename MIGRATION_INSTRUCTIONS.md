# 🔧 Migration Talimatları

## ⚠️ ÖNEMLİ: venue_id Hatasını Çözmek İçin

Bu migration'ı çalıştırmanız **zorunludur**. Aksi takdirde "null value in column venue_id" hatası devam eder.

---

## 📋 Adım Adım Kurulum

### 1. Supabase Dashboard'a Giriş Yapın

🔗 [Supabase Dashboard](https://app.supabase.com/)

### 2. Projenizi Seçin

- Sol menüden projenizi bulun
- Tıklayarak açın

### 3. SQL Editor'ü Açın

- Sol menüde **"SQL Editor"** butonunu bulun
- Tıklayın

### 4. Migration Dosyasını Kopyalayın

**Dosya Yolu:**
```
supabase/migrations/20260121000000_add_venue_details.sql
```

**Dosya İçeriği:**
```sql
-- Add venue details to drink_logs table
-- Bu migration venue_id hatasını kalıcı olarak çözecek

-- 1. Foursquare venue ID'si için kolon
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS venue_foursquare_id TEXT;

-- 2. Venue koordinatları (gelecekte mesafe hesaplama için)
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS venue_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS venue_longitude DECIMAL(11, 8);

-- 3. Venue adresi (detaylı bilgi için)
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Indexler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_drink_logs_venue_foursquare_id 
  ON public.drink_logs(venue_foursquare_id);

CREATE INDEX IF NOT EXISTS idx_drink_logs_location 
  ON public.drink_logs(location) 
  WHERE location IS NOT NULL;

-- Yorumlar ekle
COMMENT ON COLUMN public.drink_logs.venue_foursquare_id IS 'Foursquare venue ID (fsq_id)';
COMMENT ON COLUMN public.drink_logs.venue_latitude IS 'Venue latitude coordinate';
COMMENT ON COLUMN public.drink_logs.venue_longitude IS 'Venue longitude coordinate';
COMMENT ON COLUMN public.drink_logs.venue_address IS 'Venue formatted address';
```

### 5. SQL'i Çalıştırın

1. SQL Editor'de **"New Query"** tıklayın
2. Yukarıdaki SQL kodunu yapıştırın
3. **"Run"** (Çalıştır) butonuna basın
4. ✅ Başarılı mesajını bekleyin

### 6. Doğrulama

Migration'ın başarılı olduğunu kontrol edin:

```sql
-- Yeni kolonların eklendiğini kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'drink_logs' 
  AND column_name LIKE 'venue%';
```

**Beklenen Çıktı:**
```
column_name              | data_type
------------------------+----------
venue_foursquare_id     | text
venue_latitude          | numeric
venue_longitude         | numeric
venue_address           | text
```

---

## ✅ Test Etme

### 1. Uygulamayı Başlatın
```bash
npm run dev
```

### 2. Mekan Seçimi Yapın

1. Modal'ı açın ("Ne içiyorsun?" butonu)
2. "Mekan Seç" alanına tıklayın
3. "Persona" arayın
4. Bir mekan seçin
5. Kaydet butonuna basın

### 3. Veritabanını Kontrol Edin

```sql
-- En son kaydı kontrol et
SELECT 
  location,
  venue_foursquare_id,
  venue_latitude,
  venue_longitude,
  venue_address
FROM drink_logs
ORDER BY created_at DESC
LIMIT 1;
```

**Beklenen Sonuç:**
```
location: "Persona Bar"
venue_foursquare_id: "4bf58dd8d48988d116941735"
venue_latitude: 41.0082
venue_longitude: 28.9784
venue_address: "Kadıköy, İstanbul, Türkiye"
```

---

## 🐛 Sorun Giderme

### Hata: "column already exists"

**Çözüm:** Migration zaten çalıştırılmış, sorun yok!

### Hata: "permission denied"

**Çözüm:** 
1. Supabase Dashboard'da yönetici olduğunuzdan emin olun
2. Projenin doğru olduğunu kontrol edin

### Hata: "syntax error"

**Çözüm:**
1. SQL kodunu tekrar kopyalayın (tümünü)
2. Ekstra karakterler olmadığından emin olun
3. Tekrar çalıştırın

### venue_id Hatası Devam Ediyor

**Kontrol Listesi:**
```
□ Migration çalıştırıldı mı? (Adım 5)
□ Yeni kolonlar var mı? (Adım 6)
□ TypeScript types güncel mi? (otomatik)
□ Browser cache temizlendi mi? (Ctrl + Shift + R)
□ Dev server yeniden başlatıldı mı? (Ctrl + C → npm run dev)
```

---

## 🔄 Alternatif: CLI ile Migration

Eğer Supabase CLI kuruluysa:

```bash
# 1. Supabase projesine bağlan
supabase link --project-ref YOUR_PROJECT_REF

# 2. Migration'ı çalıştır
supabase db push

# 3. Doğrula
supabase db diff
```

---

## 📊 Önce/Sonra Karşılaştırması

### ❌ ÖNCE (Hatalı)

```typescript
// drink_logs INSERT
{
  location: "Persona Bar"
  // venue bilgileri yok → HATA!
}
```

**Hata Mesajı:**
```
Error: null value in column "venue_id" violates not-null constraint
```

### ✅ SONRA (Çözüldü)

```typescript
// drink_logs INSERT
{
  location: "Persona Bar",
  venue_foursquare_id: "4bf58dd8...",  ✅
  venue_latitude: 41.0082,              ✅
  venue_longitude: 28.9784,             ✅
  venue_address: "Kadıköy, İstanbul"    ✅
}
```

**Sonuç:**
```
✅ Kayıt başarılı!
✅ Foursquare ID kaydedildi
✅ Koordinatlar kaydedildi
✅ Hata yok
```

---

## 🎯 Özet

**Yapılması Gerekenler:**

1. ✅ SQL Editor'ü aç
2. ✅ Migration SQL'ini yapıştır
3. ✅ Run (Çalıştır)
4. ✅ Doğrulama yap
5. ✅ Test et

**Süre:** ~5 dakika

**Zorluk:** ⭐ Kolay

**Maliyet:** ₺0

---

**Yardıma mı ihtiyacınız var?**

1. Migration dosyasını kontrol edin: `supabase/migrations/20260121000000_add_venue_details.sql`
2. Detaylı doküman: `FOURSQUARE_INTEGRATION.md`
3. SQL Editor: [Supabase Dashboard](https://app.supabase.com/)

✅ Migration tamamlandıktan sonra venue_id hatası **kalıcı olarak** çözülecek!
