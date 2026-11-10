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
Her karakter, hikâye, evren ve oyun bilgisi sayfasının en altında bir **yorum alanı** bulunur. GitHub hesabı gerekmez; yorumlar doğrudan wiki üzerinden yazılır.

1. İlk kez yorum yazarken proje sorumlusunun verdiği **ekip kodunu** gir. Kod bu tarayıcıda hatırlanır.
2. **Adını** yaz, yorumun **türünü** seç: Yorum, Öneri, Soru veya Tartışma.
3. Metni yazıp **Gönder**'e bas. Yorum kalıcı olarak kaydedilir ve diğer ekip üyeleri sayfayı açtığında görünür.
4. Her yorumun altındaki **Cevapla** ile yanıt verebilirsin.
5. Yorum alanının üstündeki düğmelerle yorumları türe göre süzebilirsin.

### Kesinleştirilmiş bilgilere yorum
{{kesin}} olarak işaretlenmiş her bölümün ve kutunun altında **"Bu bilgiye yorum yap"** bağlantısı vardır. Bu yorumlar yalnızca o bilgiyle ilişkilendirilir.

:::warning Yorumlar kanon değildir
Yorumlar ve öneriler wikideki bilgileri **hiçbir zaman otomatik değiştirmez**. Bir öneri, ancak proje sorumlusu ilgili sayfayı güncelleyip bilgiyi {{kesin}} olarak işaretlediğinde kanonlaşır.
:::

### Öneri durumları
Öneri türündeki yorumlar bir durum etiketi taşır: **Değerlendirilecek** (varsayılan), **Kabul edildi**, **Reddedildi** veya **Beklemede**. Durumu yalnızca proje sorumlusu değiştirir.

:::note Gizlilik
Yorumlar herkese açık değildir: okumak ve yazmak için ekip kodu gerekir. Kodu yalnızca ekip üyeleriyle paylaş.
:::

## Kurulum (proje sorumlusu için)
Yorumlar ücretsiz bir **Supabase** veritabanında saklanır. Kurulum bir kez yapılır:

1. [supabase.com](https://supabase.com) adresinde ücretsiz bir hesap ve yeni bir proje oluştur.
2. Projede **SQL Editor → New query** aç. Depodaki `wiki/supabase/yorumlar.sql` dosyasının tamamını yapıştır, en alttaki `BURAYA-EKIP-KODUNU-YAZ` metnini kendi ekip kodunla değiştir ve **Run** de.
3. **Project Settings → API** sayfasından **Project URL** ve **anon public** anahtarını kopyala.
4. Bu iki değeri `wiki/content/config.js` dosyasındaki `comments` bölümüne yapıştır ve siteyi yayınla.
5. Ekip kodunu ekip üyeleriyle paylaş.

### Yönetim
- **Yorum silme veya düzenleme:** Supabase → Table Editor → `wiki_comments` tablosu.
- **Öneri durumu:** aynı tabloda `status` sütununu `degerlendirilecek`, `kabul`, `red` veya `beklemede` yap.
- **Ekip kodunu değiştirme:** SQL dosyasının son satırını yeni kodla tekrar çalıştır. Eski kodu kullananlardan yeni kodu girmeleri istenir.
- Kötüye kullanıma karşı wiki genelinde dakikada en fazla 30 yorum kabul edilir.

## Son yorumlar
Tüm sayfalarda yazılan en yeni yorumlar:

{{oneriler:tum}}
