# MealLoop

## Deploying to Vercel

The frontend and API must both be deployed. A successful Vite build alone does not start `server.js`: without an API function, `/api/session` and `/api/packages` return 404 and the page displays the generic error below the navbar.

This repository includes `api/index.js` and `vercel.json`. Vercel serves the Vite build from `dist` and routes `/api/*` to the existing Express API. Each function instance reuses a PostgreSQL pool and runs the existing schema migration before handling requests. Failed initialization returns a JSON error and can retry on the next request. Local development still uses `server.js`.

1. Create a hosted **PostgreSQL** database, for example using the [Neon integration in Vercel Marketplace](https://vercel.com/marketplace/neon). Connect it to the MealLoop project.
2. In Vercel project **Settings / Environment Variables**, ensure `DATABASE_URL` contains the provider's PostgreSQL connection string for **Production** (and a separate database for Preview if needed). Preserve the provider's SSL parameters. Prefer the provider's pooled connection URL. Do not use the local `.env.example` URL: `127.0.0.1:54329` only works on your computer. Never name this variable `VITE_DATABASE_URL`, which would expose it to the browser.
3. Use Framework Preset **Vite**, Build Command `npm run build`, Output Directory `dist`, and Node.js **24.x**. The Root Directory must be the folder containing `package.json`, `vercel.json`, and `api/`. The checked-in config supplies the framework, build command, and output directory.
4. Commit and push the deployment files, then redeploy after setting the environment variable. Do not upload `.env`, `.env.*`, `.local-postgres`, or `node_modules`.
5. Open `https://YOUR-DOMAIN/api/health`. Success is `{"status":"ok","database":"postgresql"}`. `/api/session` should return `null` for a signed-out visitor, and `/api/packages` should return a JSON array.

The first API request creates the tables but does not copy your laptop's records or insert demo data. To populate a **demo database**, create a local `.env.vercel.local` file with the hosted `DATABASE_URL` (this file is ignored by Git), then run:

```powershell
node --env-file=.env.vercel.local scripts/seed.js
```

The explicit env file selects the hosted database instead of the local `.env`. This command adds missing demo records without replacing existing records. Demo offers expire after 25 hours; rerunning seed does not refresh existing offers.

Production intentionally disables the passwordless demo account picker. Browsing packages works, but real authentication is needed for public sign-in and reservations. Do not set `NODE_ENV=development` to bypass this protection.

Troubleshooting:

- **404 from `/api/health`:** the API is not deployed/routed. Confirm the latest commit contains `api/index.js`, `src/serverless.js`, and `vercel.json`, and check the Vercel Root Directory.
- **503 from `/api/health`:** open Vercel runtime logs. Check that `DATABASE_URL` is present in the deployed environment and that the hosted database is reachable. The database role needs permission to create/update the application's tables.
- **200 from health, `[]` from packages:** the API works, but there are no unexpired offers in that database.
- **403 with `demo_disabled` on sign-in:** expected in production until real authentication is implemented.

See [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js) and [Vercel database integrations](https://vercel.com/docs/marketplace-storage).

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
