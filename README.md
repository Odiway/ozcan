# Özcan Filtre - Teklif & Stok Yönetim Sistemi

Diyarova - Özcan filtre dağıtım teklif sistemi. Excel makro dosyasındaki tüm işlevselliği replika eden modern web uygulaması.

## Özellikler

- **Müşteri Yönetimi**: Cari iskonto, ödeme planı, iletişim bilgileri
- **Ürün Kataloğu**: 3 tedarikçi (Donaldson, MAHLE, Baveria-Woodson) ~10.000 ürün
- **Otomatik Fiyat Hesaplama**: İskonto, KDV (%20), kur çevirme, markup oranları
- **Teklif Oluşturma**: Otomatik fiyat arama, PDF çıktı, durum takibi
- **Stok Yönetimi**: Filtre kodu normalizasyonu, stok takibi
- **Kargo Hesaplama**: Desi bazlı YURTİÇİ kargo fiyat hesabı
- **Kullanıcı Yetkilendirme**: Admin, Müdür, Satış Temsilcisi rolleri
- **Denetim Günlüğü**: Tüm işlemler loglanır

## Teknolojiler

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend**: Next.js Server Actions, NextAuth.js v5
- **Veritabanı**: PostgreSQL (Neon DB), Prisma ORM v6
- **Deployment**: Vercel

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Neon DB oluşturun

1. [neon.tech](https://neon.tech) adresine gidin
2. Yeni proje oluşturun
3. Connection string'i kopyalayın

### 3. Ortam değişkenlerini ayarlayın

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require"
AUTH_SECRET="openssl-rand-base64-32-ile-olusturun"
NEXTAUTH_URL="http://localhost:3000"
```

`AUTH_SECRET` oluşturmak için:
```bash
openssl rand -base64 32
```

### 4. Veritabanı migration

```bash
npx prisma migrate dev --name init
```

### 5. Başlangıç verilerini yükleyin

```bash
# Temel kullanıcılar ve kur bilgileri
npm run db:seed

# Excel dosyasından ürün ve müşteri verileri
npm run db:import
```

### 6. Geliştirme sunucusu

```bash
npm run dev
```

http://localhost:3000 adresinde açın.

## Varsayılan Giriş Bilgileri

| Email | Şifre | Rol |
|-------|-------|-----|
| admin@ozcanfiltre.com | admin123 | Admin |
| satis@ozcanfiltre.com | manager123 | Satış Temsilcisi |

> ⚠️ İlk girişten sonra şifreleri değiştirmeyi unutmayın!

## Vercel'e Deploy

### 1. GitHub'a push edin

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/ozcan-filter-app.git
git push -u origin main
```

### 2. Vercel'de import edin

1. [vercel.com](https://vercel.com) adresine gidin
2. "Import Project" → GitHub repo seçin
3. Environment Variables ekleyin:
   - `DATABASE_URL` → Neon connection string
   - `AUTH_SECRET` → Rastgele secret
   - `NEXTAUTH_URL` → `https://your-app.vercel.app`

### 3. Veritabanı migration (production)

```bash
npx prisma migrate deploy
```

## Proje Yapısı

```
src/
├── actions/         # Server Actions (CRUD işlemleri)
│   ├── admin.ts     # Kullanıcı yönetimi, audit logları
│   ├── customers.ts # Müşteri CRUD
│   ├── products.ts  # Ürün arama, fiyat hesaplama
│   ├── quotes.ts    # Teklif oluşturma/yönetme
│   ├── shipping.ts  # Kargo hesaplama
│   └── stock.ts     # Stok yönetimi
├── app/
│   ├── api/auth/    # NextAuth API route
│   ├── dashboard/   # Tüm dashboard sayfaları
│   └── login/       # Giriş sayfası
├── components/      # Paylaşılan bileşenler
├── lib/             # Prisma, Auth, Audit yardımcıları
└── types/           # TypeScript tip tanımları

prisma/
├── schema.prisma    # Veritabanı şeması
├── seed.ts          # Başlangıç verileri
└── import-excel.ts  # Excel veri aktarımı
```

## İş Kuralları (Excel'den)

- **KDV Oranı**: %20
- **Baveria Markup**: %40 (Excel $M$1)
- **MAHLE Markup**: %15 (Excel $O$1)
- **Fiyat Arama Sırası**: Donaldson → MAHLE → Baveria (fallback)
- **Kur**: EUR ve USD güncel kurları ile TL'ye çevirme
- **Ödeme Planları**: NAKİT, VADELİ, EURO
- **Filtre Kodu Normalizasyonu**: -, /, virgül, boşluk, nokta kaldırılır (VBA ÇOKLU_FİLTRE_DÜZENLEME_111 makrosu)
