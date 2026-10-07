# MealLoop

React + Express + PostgreSQL ile yemek paketi ve rezervasyon uygulaması. Mevcut `server.js`, API rotaları, tablolar ve kayıtlar korunarak geliştirilmiştir.

## Çalıştırma (Windows / PowerShell)

Node.js 22.12+ veya 24 gerekir. PowerShell, `npm.ps1` çalıştırmayı engelliyorsa aşağıdaki gibi `npm.cmd` kullanın.

```powershell
npm.cmd install
```

`.env` henüz yoksa oluşturun; varsa mevcut bağlantı bilginizi koruyun:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Mevcut bir PostgreSQL kullanıyorsanız `.env` içindeki `DATABASE_URL` değerini ayarlayın. Yerel PostgreSQL için bir terminalde:

```powershell
npm.cmd run db:start
```

Bu komut PostgreSQL'i `127.0.0.1:54329` üzerinde başlatır. Veriler `.local-postgres` içinde kalıcıdır. Yeniden çalıştırma verileri sıfırlamaz. Terminali açık bırakın; Ctrl+C servisi durdurur. Portta zaten bu servis çalışıyorsa tekrar başlatmayın.

İkinci terminalde:

```powershell
npm.cmd run db:seed
npm.cmd run dev
```

- Arayüz: http://127.0.0.1:5173
- API sağlık kontrolü: http://127.0.0.1:3000/api/health
- `db:seed` eksik demo hesapları ve paketleri ekler; mevcut kayıtları güncellemez veya silmez. Demo paketler süreli olduğundan süresi biten ilanları işletme panelinden güncelleyebilirsiniz.
- Mevcut veritabanında demo veri istemiyorsanız `db:seed` adımını atlayın.

Derlenmiş arayüzü Express üzerinden çalıştırmak için:

```powershell
npm.cmd run build
npm.cmd start
```

Arayüz bu durumda http://127.0.0.1:3000 üzerinde sunulur. Aynı anda başka bir `dev` API süreci çalıştırmayın.

## Yapı

- `server.js`: sunucu başlangıcı; `src/app.js`: mevcut Express API ve işlemler.
- `db/schema.sql`, `src/database.js`: PostgreSQL tabloları ve veri silmeyen kurulum.
- `client/main.jsx`, `client/App.jsx`: React girişi, oturum ve hash tabanlı sayfa geçişleri. Tarayıcının geri/ileri düğmeleri ve doğrudan bölüm bağlantıları desteklenir.
- `client/components/`: Sidebar, Navbar, PackageCard, PackageImage, LanguageSelector, ThemeToggle, Modal ve ortak arayüz parçaları.
- `client/pages/`: Home, Packages, Reservations, PackageForm ve Settings.
- `client/styles.css`: bütün arayüz stilleri ve ekran boyutlarına göre düzenler.
- `client/i18n.js`, `client/preferences.jsx`: Özbekçe (varsayılan), Rusça, İngilizce; tarih/para biçimleri ve tercihler.
- `shared/errors.json`, `src/errors.js`: API hata kodları ve üç dilde karşılıkları. API `Accept-Language` başlığını kullanır.
- `shared/demo-offers.json`: mevcut demo içeriklerinin üç dilde karşılıkları ve iki fotoğraflı ekmek/salata örneği.
- `client/format.js`: bütün fiyatlar UZS / so‘m; tarih ve teslim formları `Asia/Tashkent` (UTC+5).
- `client/useAnimations.js`: React yaşam döngüsünde AOS; filtre, dil ve içerik değişikliklerinde yenileme. Hafif animasyonlar içeriği gizlemez; hareket azaltma tercihinde kapatılır.

Yalnızca React'in `index.html` giriş dosyası vardır. Görünen arayüz tamamen `.jsx` dosyalarındadır. Dil (`mealloop.language`), tema (`mealloop.theme`) ve masaüstü sidebar durumu (`mealloop.sidebar`) localStorage'da saklanır. Kayıtlı tema yoksa cihazın tercihi kullanılır. localStorage kapalıysa uygulama mevcut oturumda çalışmaya devam eder.

Menüler, butonlar, formlar, doğrulama/API hataları, onay pencereleri ve rezervasyon durumları çevrilir. Bilinen, değiştirilmemiş demo metinleri Taşkent bağlamında gösterilir. İşletmelerin girdiği başlık, açıklama, adres ve isimler korunur. Dil değişimi fiyatı veya para birimini değiştirmez; sayısal fiyatlar ve eski rezervasyonların fiyatları veritabanında aynen kalır. Otomatik kur dönüşümü yoktur. Eski `/api/exchange-rates` uç noktası uyumluluk için korunur, arayüz bu servise bağlı değildir.

Kullanıcının sağladığı fotoğraflar `public/images/` içindedir; JFIF dosyalarının JPEG içeriği değiştirilmeden `.jpg` adıyla kopyalanmıştır. Eşleştirmeler: `somsa-patir.jpg` → Nonvoyxonadan syurpriz to'plam, `salad-bowl.jpg` → Kunning baraka kosasi, `sweets.jpg` → Shirin yakun, `fruit-vegetables.jpg` → Mavsumiy meva-sabzavot paketi. Önceki ekmek ve salata paketleri `bread.jpg` ve `salad.jpg` kullanır. Dosya yolları ve boyutları `shared/package-images.json` içinde tanımlıdır. İşletme formunda uygun fotoğraf seçilebilir. Fotoğrafsız veya yüklenemeyen görsellerde çevrilmiş yer tutucu gösterilir. Kartlar aynı en-boy oranında `object-fit: cover` kullanır.

Veritabanı kurulumu yalnızca isteğe bağlı `image_key` sütununu ekler. Seed mevcut satırları değiştirmez veya silmez. `concurrently` altındaki `shell-quote`, [güvenlik düzeltmesi](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) içeren 1.11.0 sürümüne sabitlenmiştir.

## Kullanım

“Kirish / Войти / Sign in” ile demo hesap seçin:

- Jasur Rahimov / Dilnoza Umarova: paketleri keşfetme, bir paket ayırtma, kod görüntüleme ve rezervasyonu iptal etme.
- Toshkent Nonvoyxonasi / Yashil Oshxona: kendi ilanlarını ekleme, düzenleme, silme ve müşteri paketini teslim edildi olarak işaretleme. Demo işletme adları seçilen dilde gösterilir.

Ödeme işletmede yapılır. Son paketin aynı anda iki kişiye ayrılması PostgreSQL satır kilidi ve transaction ile engellenir. Tekrarlanan rezervasyon isteği ve iptal stoğu ikinci kez değiştirmez. İlanın eski sürümüyle düzenleme yapılırsa 409 hatası döner. Aktif rezervasyonu olan ilan silinemez; rezervasyon anındaki fiyat ve teslim bilgileri geçmişte saklanır.

Giriş, mevcut projenin **yerel demo hesabı seçimi** akışıdır; gerçek şifreli kayıt/giriş değildir. `NODE_ENV=production` demo girişini kapatır. Dışarıya yayınlamadan önce gerçek hesap doğrulaması eklenmelidir. Sunucu varsayılan olarak yalnızca yerel arayüzde dinler.

## Kontroller

PostgreSQL çalışırken:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:ui
```

API ve tarayıcı testleri aynı PostgreSQL içinde kendilerine ait, adı benzersiz test şemaları kullanır; uygulama kayıtlarına dokunmaz. API testleri eşzamanlı son stok rezervasyonunu, tekrarları, yetki kontrolünü, CRUD işlemlerini, teslimi, üç dilde hataları ve tekrar kurulumda kayıtların korunmasını doğrular. Playwright testleri Chrome kullanır; Chrome'un kurulu olması gerekir. Dil/tema kalıcılığını, sayfa geçişlerini, mobil sidebar'ı, rezervasyon/iptal, fotoğrafları, hareket azaltmayı, bağlantı hatalarını ve farklı cihaz saat diliminde teslim saatlerini gerçek API üzerinden kontrol eder. Görsel çıktılar `test-results/` klasörüne yazılır. Projede tanımlı bir lint komutu yoktur.
