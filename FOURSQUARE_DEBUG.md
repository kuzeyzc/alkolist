# 🔍 Foursquare API Debug Rehberi

## ⚠️ SORUN: GPS ve Arama Çalışmıyor

### 🔧 Adım 1: .env Dosyasını Kontrol Edin

`.env` dosyanızı açın ve şunu kontrol edin:

```env
VITE_FOURSQUARE_API_KEY=fsq3xxxxxxxxxxxxxxxxxxxxxx
```

**KONTROLLER:**
- [ ] Dosya adı tam olarak `.env` mi? (`.env.local` değil!)
- [ ] Key `VITE_FOURSQUARE_API_KEY` ile mi başlıyor? (`VITE_` ÖNEMLİ!)
- [ ] Key değeri `fsq3` ile mi başlıyor?
- [ ] Key'de boşluk veya tırnak işareti yok mu?

**DOĞRU:**
```env
VITE_FOURSQUARE_API_KEY=fsq3ABC123XYZ789...
```

**YANLIŞ:**
```env
FOURSQUARE_API_KEY=fsq3...  ❌ (VITE_ eksik!)
VITE_FOURSQUARE_API_KEY="fsq3..."  ❌ (Tırnak işareti var!)
VITE_FOURSQUARE_API_KEY = fsq3...  ❌ (Boşluk var!)
```

---

### 🔧 Adım 2: Dev Server'ı Yeniden Başlatın

`.env` dosyasını değiştirdiyseniz **mutlaka** restart edin:

```bash
# Terminal'de
Ctrl + C  (dev server'ı durdur)
npm run dev  (yeniden başlat)
```

**ÖNEMLİ:** Vite `.env` değişikliklerini otomatik algılamaz!

---

### 🔧 Adım 3: Browser Console'u Açın

1. Uygulamayı açın
2. `F12` basın (veya sağ tık → Inspect)
3. **Console** sekmesini açın
4. Mekan aramayı test edin

---

### 🧪 Test 1: API Key Kontrolü

Console'da şunu görmelisiniz:

**✅ BAŞARILI:**
```
🔍 Foursquare arama: {query: "la", userLat: 41.0082, userLon: 28.9784}
📍 Konum eklendi: 41.0082,28.9784
🌐 API URL: https://api.foursquare.com/v3/places/search?query=la&limit=10&ll=41.0082,28.9784&radius=5000
📡 API Response Status: 200
✅ Foursquare data: {results: Array(10), ...}
📊 10 mekan bulundu
🏢 İlk mekan: {name: "La Bebe", foursquareId: "...", ...}
```

**❌ HATA - API Key Yok:**
```
❌ FOURSQUARE API KEY BULUNAMADI!
👉 .env dosyasına VITE_FOURSQUARE_API_KEY ekleyin
```

**Çözüm:** `.env` dosyasını kontrol edin, `VITE_` ile başladığından emin olun.

---

**❌ HATA - 401 Unauthorized:**
```
❌ Foursquare API error: 401 Unauthorized
```

**Çözüm:** API key yanlış veya geçersiz. Yeni key alın:
1. https://foursquare.com/developers/
2. Login → Projects → API Keys
3. Yeni key kopyalayın
4. `.env` dosyasına yapıştırın
5. Dev server restart

---

**❌ HATA - 403 Forbidden:**
```
❌ Foursquare API error: 403 Quota exceeded
```

**Çözüm:** Aylık 50,000 istek kotası dolmuş. Yeni ay bekleyin veya ücretli plan alın.

---

### 🧪 Test 2: GPS Butonu

GPS butonuna tıkladığınızda console'da:

**✅ BAŞARILI:**
```
🎯 GPS butonu tıklandı
📍 Konum izni isteniyor...
✅ Konum alındı: {lat: 41.0082, lon: 28.9784}
🔍 Yakındaki mekanlar aranıyor...
🔍 Foursquare arama: {query: "bar cafe restaurant pub lounge", ...}
📡 API Response Status: 200
✅ 8 mekan bulundu
```

**❌ HATA - Konum İzni Reddedildi:**
```
❌ Konum alınamadı: GeolocationPositionError
```

**Çözüm:** 
1. Tarayıcının adres çubuğunda kilit ikonuna tıklayın
2. Konum izinlerini "İzin ver" yapın
3. Sayfayı yenileyin (F5)
4. GPS butonuna tekrar tıklayın

---

### 🧪 Test 3: Mekan Arama ("la" yazma)

Input'a "la" yazdığınızda console'da:

**✅ BAŞARILI:**
```
⌨️ Kullanıcı yazdı: la
🔍 Foursquare'de aranıyor: la
📍 Konum eklendi: 41.0082,28.9784
🌐 API URL: https://api.foursquare.com/v3/places/search?query=la&...
📡 API Response Status: 200
✅ Foursquare data: {results: [La Bebe, Lades, ...]}
📊 5 mekan bulundu
🏢 İlk mekan: {name: "La Bebe", foursquareId: "...", address: "Kadıköy, İstanbul"}
```

**❌ HATA - API Key Yok:**
```
⌨️ Kullanıcı yazdı: la
❌ FOURSQUARE API KEY YOK - Local database kullanılacak
```

**Çözüm:** `.env` dosyasını kontrol edin ve restart edin.

---

## 🔑 Foursquare API Key Nasıl Alınır?

### Adım 1: Hesap Oluştur
1. https://foursquare.com/developers/ → Giriş yapın
2. Hesabınız yoksa "Sign Up" ile kayıt olun

### Adım 2: Proje Oluştur
1. Dashboard → "Create a New Project"
2. Proje adı: "Alkolist" (istediğiniz ismi verin)
3. Create

### Adım 3: API Key Kopyala
1. Proje sayfasında → "API Keys" sekmesi
2. "Create API Key" tıklayın
3. Key'i kopyalayın (fsq3... ile başlar)

### Adım 4: .env Dosyasına Ekle
```env
VITE_FOURSQUARE_API_KEY=fsq3_BURAYA_KEYİNİZİ_YAPIŞTIRIN
```

### Adım 5: Restart
```bash
Ctrl + C
npm run dev
```

---

## 📊 Hızlı Kontrol Listesi

1. **API Key Var mı?**
   - [ ] `.env` dosyası mevcut
   - [ ] `VITE_FOURSQUARE_API_KEY=fsq3...` satırı var
   - [ ] Key `fsq3` ile başlıyor
   - [ ] Tırnak işareti yok

2. **Dev Server Restart Yapıldı mı?**
   - [ ] `Ctrl + C` ile durduruldu
   - [ ] `npm run dev` ile yeniden başlatıldı
   - [ ] Console'da hata yok

3. **Console'da Ne Görünüyor?**
   - [ ] `🔍 Foursquare arama` mesajları var
   - [ ] `✅ Foursquare data` görünüyor
   - [ ] `📊 X mekan bulundu` yazıyor
   - [ ] Hata mesajı YOK

4. **Konum İzni Verildi mi?**
   - [ ] Tarayıcı konum izni istedi
   - [ ] "İzin ver" tıklandı
   - [ ] Console'da koordinatlar görünüyor

---

## 🆘 Hala Çalışmıyorsa

### Console'daki HATAYI buraya yazın:

```
[Buraya console'daki hata mesajını kopyalayın]
```

### .env Dosyanızın İlk Satırı (key'i gizleyin):

```
VITE_FOURSQUARE_API_KEY=fsq3***[son 4 hane]
```

### Tarayıcı Bilgisi:

- Chrome / Firefox / Safari / Edge?
- Versiyon?
- Mobil / Desktop?

---

## 🎯 Hızlı Test Komutu

Console'a yapıştırın:

```javascript
console.log('API Key:', import.meta.env.VITE_FOURSQUARE_API_KEY ? '✅ VAR' : '❌ YOK');
```

**Sonuç:**
- `✅ VAR` → API key doğru yüklendi
- `❌ YOK` → `.env` dosyasını kontrol edin ve restart yapın
