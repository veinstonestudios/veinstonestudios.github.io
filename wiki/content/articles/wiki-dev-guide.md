---
title: The Facility Wiki:Geliştirme Rehberi
type: project
aliases: Geliştirme Rehberi, Gelistirme Rehberi, Bilgi durumları, Öneri sistemi, Development guide
summary: Wiki'nin ekip içi kullanımı — dört bilgi durumu, sayfa yapısı ve wiki üzerinden yazılan ekip yorumları.
created: 2026-11-10
updated: 2026-11-10
---
Bu wiki yalnızca oyunun ansiklopedisi değildir; aynı zamanda ekibin **ortak geliştirme referansıdır**. Ekip üyeleri mevcut kararları okuyabilir, henüz karar verilmemiş konuları görebilir ve öneri sunabilir.

## Bilgi durumları
Wiki'deki her önemli bilgi dört durumdan biriyle işaretlenir. Etiketler bölüm başlıklarının yanında, kutularda, bilgi kutularında ve zaman çizelgelerinde görünür.

| Etiket | Anlamı | Kim değiştirebilir? |
|---|---|---|
| {{kesin}} | Projede alınmış ve kabul edilmiş karar; mevcut kanon. Önerilerle kendiliğinden değişmez. | Yalnızca proje sorumlusu, yeni bir kararla. |
| {{gelistiriliyor}} | Temel karar verildi, ayrıntılar tamamlanmadı (ör. sonlar planlandı ama final sahneleri yazılmadı). | Proje sorumlusu; ekip öneri sunabilir. |
| {{kararyok}} | Henüz kesin bir karar yok. Bu konu hakkında henüz kesin bir karar alınmamıştır. Ekip üyelerinin önerilerine açıktır. | Ekip öneri sunar, proje sorumlusu karar verir. |
| {{gizli}} | Hikâyede **bilinçli olarak** gizli tutulan veya oyuncuya henüz açıklanmayan bilgi. | Proje sorumlusu. |

:::warning "Henüz karar verilmedi" ile "Gizli" aynı şey değildir
**Henüz karar verilmedi**, ekibin bir konuyu henüz belirlemediği anlamına gelir; öneriye açıktır. **Gizli / Açıklanmadı** ise kararı verilmiş ya da bilinçli olarak belirsiz bırakılmış bir bilgidir (ör. Arthur Edaven'ın gerçekten Corrupted olup olmadığı hiçbir zaman kesinleşmez). Gizli bilgiler genellikle tıklayınca açılan siyah metin olarak gösterilir.
:::

## Sayfa yapısı
### Karakter sayfaları
Her karakter sayfası şu bölümlerden oluşur: Genel bakış, Temel bilgiler, Fiziksel görünüm, Kişilik ve davranışlar, Biyografi, Geçmişi, Motivasyonları, Diğer karakterlerle ilişkileri, Hikâyedeki rolü, Bilinenler ve gizemler, Henüz karar verilmeyen özellikler, Ekip önerileri ve tartışma.

**Temel bilgiler** bölümü bilgi kutusundaki maddeleri durum etiketleriyle birlikte otomatik gösterir.

Karakter çiziminden yapılan görünüş tarifleri {{gelistiriliyor}} olarak işaretlidir: çizim resmîdir, ancak yazılı fiziksel özellikler proje tarafından ayrıca kesinleştirilmediyse kanon sayılmaz.

### Plot, evren ve mekanik sayfaları
[[Ana Hikâye]], [[Dünya]], [[Facility Merkezleri]], [[Corrupted]], [[Technology Purge]], [[The Collapse]], [[CORE Programı]], [[Sonlar]], [[Oynanış]], [[Gece Olayları]] ve [[Zaman Çizelgesi]] gibi sayfalarda da bölüm başlıklarında durum etiketleri, sayfa sonunda **Henüz karar verilmeyen konular** ve **Ekip önerileri ve tartışma** bölümleri bulunur.

## Ekip yorumları nasıl çalışır?
Wikideki **her başlığın altında** o başlığa ait ayrı bir yorum paneli vardır (ör. *Genel bakış → Yorumlar*, *Sorgu → Yorumlar*). Bir başlığa yazılan yorum yalnızca o başlığın panelinde görünür. Sayfanın en altında ayrıca sayfanın geneli için bir panel bulunur. GitHub hesabı gerekmez; her şey doğrudan wiki üzerinden yapılır.

1. Başlığın altındaki **"▸ Yorumlar"** bağlantısına bas; panel açılır. Parantez içindeki sayı o başlıktaki yorum sayısıdır.
2. İlk kez kullanırken proje sorumlusunun verdiği **ekip kodunu** gir. Kod bu tarayıcıda hatırlanır.
3. **Adını** yaz, türünü seç (Yorum, Öneri, Soru, Tartışma), metni yaz ve **Gönder**'e bas. Yorum veritabanına kaydedilir ve diğer ekip üyeleri sayfayı açtığında görünür.
4. Her yorumun altındaki **Cevapla** ile yanıt verebilirsin.
5. **Kendi yorumlarını** düzenleyebilir veya silebilirsin. Bu yetki yalnızca yorumu gönderdiğin tarayıcıda geçerlidir; başkalarının yorumlarında bu düğmeler görünmez.

:::warning Yorumlar kanon değildir
Yorumlar ve öneriler wikideki bilgileri **hiçbir zaman otomatik değiştirmez**; {{kesin}} bilgiler yalnızca proje sorumlusunun sayfayı düzenlemesiyle değişir. Bir öneri, ancak proje sorumlusu ilgili sayfayı güncelleyip bilgiyi {{kesin}} olarak işaretlediğinde kanonlaşır.
:::

### Öneri durumları
Öneri türündeki yorumlar bir durum etiketi taşır: **Değerlendirilecek** (varsayılan), **Kabul edildi**, **Reddedildi** veya **Beklemede**. Durumu yalnızca yönetici değiştirebilir.

### Güvenlik
- Yorumları okumak ve yazmak için **ekip kodu** gerekir; kod olmadan dışarıdan biri yorumları göremez.
- Her yorum gönderildiğinde yazarın tarayıcısına gizli bir **düzenleme anahtarı** verilir. Kimse başkasının yorumunu izinsiz düzenleyemez veya silemez.
- **Yönetici kodu** ayrıdır ve yalnızca proje sorumlusundadır.
- Silinen bir yorumun yerinde "Bu yorum silindi." yazar; başkalarının ona yazdığı cevaplar korunur.
- Spam önlemleri: wiki genelinde dakikada en fazla 30, aynı isimle dakikada en fazla 6 yorum; aynı metin 10 dakika içinde aynı başlığa tekrar gönderilemez; görünmez bir bot tuzağı alanı vardır.
- Yorum metinleri her zaman düz metin olarak gösterilir; HTML veya script çalıştırılamaz.

## Kurulum (proje sorumlusu için)
Yorumlar ücretsiz bir **Supabase** veritabanında saklanır. Kurulum bir kez yapılır:

1. [supabase.com](https://supabase.com) adresinde ücretsiz bir hesap ve yeni bir proje oluştur.
2. Projede **SQL Editor → New query** aç. Depodaki `wiki/supabase/yorumlar.sql` dosyasının tamamını yapıştır. En alttaki iki satırda `BURAYA-EKIP-KODUNU-YAZ` ve `BURAYA-YONETICI-KODUNU-YAZ` metinlerini kendi kodlarınla değiştir ve **Run** de. İki kod farklı, uzun ve tahmin edilmesi zor olmalıdır.
3. **Project Settings → API** sayfasından **Project URL** ve **anon public** anahtarını kopyala.
4. Bu iki değeri `wiki/content/config.js` dosyasındaki `comments` bölümüne yapıştır ve siteyi yayınla.
5. Ekip kodunu ekiple paylaş; yönetici kodunu kimseyle paylaşma.

### Yönetim
- **Yönetici modu:** Herhangi bir sayfanın en altındaki yorum alanında **"Yönetici girişi"**ne bas ve yönetici kodunu gir. Bu tarayıcıda her yorumda **Düzenle**, **Sil** ve öneriler için **Durum** seçicisi görünür. İşin bitince **"Yönetici modundan çık"**.
- **Supabase paneli:** Table Editor → `wiki_comments` tablosunda tüm yorumları görebilir, dışa aktarabilir veya kalıcı olarak silebilirsin.
- **Kodları değiştirme:** SQL dosyasının son iki satırını yeni kodlarla tekrar çalıştır. Eski kodu kullananlardan yeni kodu girmeleri istenir.
- **Şema güncellemeleri:** SQL dosyası tekrar çalıştırılabilir; mevcut yorumlar silinmez.

## Son yorumlar
Tüm sayfalarda yazılan en yeni yorumlar:

{{oneriler:tum}}
