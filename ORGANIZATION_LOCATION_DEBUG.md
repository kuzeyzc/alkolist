# Organizasyon Konum Özelliği - Debug ve Test Rehberi

## 🔍 Konum Bilgisinin Görünmemesi Sorunu

Organizasyon kartında konum bilgisi görünmüyorsa, şu adımları kontrol edin:

### 1. Browser Console Kontrolü

Tarayıcı console'unda şu log'u göreceksiniz:

```javascript
OrganizationCard - Location Data: {
  locationId: "xxxx",
  locationName: "Mekan Adı",
  hasLocation: true/false
}
```

**Kontroller:**
- ✅ `hasLocation: true` → Konum bilgisi var, kart göstermeli
- ❌ `hasLocation: false` → Konum bilgisi yok

### 2. Database Kontrolü

Supabase Dashboard'da kontrol edin:

```sql
SELECT 
  username,
  organization_name,
  organization_location_id,
  organization_location_name
FROM profiles
WHERE is_organizer = true;
```

**Beklenen:**
- `organization_location_id`: Foursquare venue ID (örn: "4bf58dd8d48988d116941735")
- `organization_location_name`: Mekan adı (örn: "Klein Garten")

### 3. Konum Ekleme Adımları

#### Ayarlar'dan Konum Eklemek:

1. **Ayarlar** > **Organizasyon** > **Organizasyon Profilini Düzenle**
2. **"Merkez Mekan"** alanını bulun
3. Mekan adı yazmaya başlayın (örn: "klein")
4. Açılır listeden mekanı seçin
5. **Kaydet** butonuna basın

**Önemli:** Mekanı sadece yazmak yeterli değil, **açılır listeden seçmeniz** gerekiyor!

### 4. Konum Kartı Görünümü

Konum bilgisi varsa kartın alt kısmında görünür:

```
┌─────────────────────────────────────┐
│  🎧 Techno          [📷 Logo]       │
│                                     │
│  Saha Organizasyon                  │
│  ═══════════                        │
│  ▪ ▫ ▪ ▫ ▪ ▫ ▪ ▫ ▪ ▫               │
│                                     │
│  [⚡ Organizatör] [📍 Mekan Adı]    │
│                    └─hover altı─┘   │
└─────────────────────────────────────┘
```

**Özellikler:**
- 📍 Pikselli pin ikonu (SVG)
- Koyu gri mekan adı (font-mono, bold)
- Hover'da alt çizgi animasyonu
- Tıklanabilir → `/venue/:id` sayfasına gider

### 5. Konum Yoksa

Eğer organizasyonun konumu yoksa:
- ✅ Konum kartı **tamamen gizli** kalır
- ✅ Sadece "Organizatör" etiketi görünür
- ✅ Kartın dengesi bozulmaz

## 🎨 Konum Kartı Tasarım Detayları

### Pikselli Pin İkonu (SVG)

```tsx
<svg viewBox="0 0 16 16">
  <rect x="6" y="2" width="4" height="2" />
  <rect x="5" y="4" width="6" height="2" />
  <rect x="4" y="6" width="8" height="2" />
  <rect x="6" y="8" width="4" height="4" />
  <rect x="5" y="12" width="6" height="2" />
</svg>
```

### CSS Stilleri

```tsx
style={{
  imageRendering: 'pixelated',
  transform: 'rotate(-1deg)',
  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)',
  textShadow: '0.5px 0.5px 0px rgba(0, 0, 0, 0.1)',
}}
```

### Hover Animasyonu

```tsx
// Hover'da alt çizgi
<motion.div
  initial={{ scaleX: 0 }}
  whileHover={{ scaleX: 1 }}
  className="h-0.5 bg-gray-700"
  style={{
    clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)',
  }}
/>
```

## 🧪 Test Senaryoları

### Senaryo 1: Konum Var
```
Input: 
  - organization_location_id: "4bf58dd8d48988d116941735"
  - organization_location_name: "Klein Garten"

Expected:
  - ✅ Konum kartı görünür
  - ✅ "📍 Klein Garten" yazısı
  - ✅ Hover'da alt çizgi
  - ✅ Tıklanabilir

Result:
  - Click → Navigate to /venue/4bf58dd8d48988d116941735
```

### Senaryo 2: Konum Yok
```
Input:
  - organization_location_id: null
  - organization_location_name: null

Expected:
  - ✅ Konum kartı gizli
  - ✅ Sadece "Organizatör" etiketi
  - ✅ Kart dengesi korunmuş

Result:
  - No location element rendered
```

### Senaryo 3: Kısmi Veri (Sadece Name)
```
Input:
  - organization_location_id: null
  - organization_location_name: "Klein Garten"

Expected:
  - ❌ Konum kartı görünmez
  - Reason: locationId yoksa tıklanamaz

Result:
  - Condition: {locationName && locationId}
  - Renders: false
```

## 🔧 Sorun Giderme

### Problem: Konum ekledim ama görünmüyor

**Çözüm 1:** Database'de veri var mı kontrol edin
```sql
SELECT organization_location_id, organization_location_name 
FROM profiles 
WHERE user_id = 'YOUR_USER_ID';
```

**Çözüm 2:** Browser cache temizleyin
- Hard refresh: `Ctrl + Shift + R` (Windows)
- Veya DevTools'da "Disable cache" aktif edin

**Çözüm 3:** Organizasyonu yeniden kaydedin
- Settings → Organizasyon → Düzenle
- Mekanı seç → Kaydet

### Problem: Console'da locationId undefined

**Sebep:** Database migration uygulanmamış olabilir

**Çözüm:**
```bash
cd c:\Users\user\Desktop\alkolist-main
npx supabase db reset
```

### Problem: VenueAutocomplete çalışmıyor

**Kontrol:**
1. OpenStreetMap API yanıt veriyor mu?
2. Network tab'de API istekleri var mı?
3. Console'da hata var mı?

**Debug:**
```tsx
// VenueAutocomplete component'inde
console.log('Selected venue:', venue);
console.log('Venue ID:', venue?.foursquareId);
```

## 📊 Animasyon Timeline

```
0.0s: Kart giriş
0.3s: Logo damgalanır
0.4s: Tür rozeti vurulur
0.5s: Organizasyon adı yazılır
0.8s: Alt çizgi çekilir
0.9s: Pixel çizgi belirmeye başlar
1.1s: Organizatör etiketi gelir
1.2s: 📍 Konum kartı beliriyor (YENİ!)
Hover: Alt çizgi animasyonu (0.2s)
```

## ✅ Checklist

Konum özelliğinin çalıştığını doğrulamak için:

- [ ] Migration uygulandı mı? (`npx supabase db reset`)
- [ ] VenueAutocomplete Settings'de görünüyor mu?
- [ ] Mekan seçildiğinde locationId set ediliyor mu?
- [ ] Kaydet butonuna basıldı mı?
- [ ] Database'de location verileri var mı?
- [ ] Console'da location data görünüyor mu?
- [ ] Profil sayfasında konum kartı render oluyor mu?
- [ ] Konum kartına tıklandığında venue detail açılıyor mu?
- [ ] Hover'da alt çizgi animasyonu çalışıyor mu?

## 🎯 Özet

Konum özelliği şu şekilde çalışıyor:

1. **Settings:** VenueAutocomplete ile mekan seç
2. **Database:** location_id ve location_name kaydedilir
3. **Profile:** OrganizationCard'a props geçilir
4. **Card:** Konum varsa, pikselli kart gösterilir
5. **Click:** `/venue/:id` sayfasına yönlendirilir

**Sorun devam ediyorsa:**
- Console log'ları kontrol edin
- Database verilerini kontrol edin
- Migration uygulandığından emin olun

---

**Oluşturulma:** 21 Ocak 2026
**Versiyon:** 1.0
