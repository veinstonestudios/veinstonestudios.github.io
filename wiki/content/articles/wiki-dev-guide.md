---
title: The Facility Wiki:Geliştirme Rehberi
type: project
aliases: Geliştirme Rehberi, Gelistirme Rehberi, Bilgi durumları, Öneri sistemi, Development guide
summary: Wiki'nin ekip içi kullanımı — dört bilgi durumu, sayfa yapısı ve ekip önerilerinin nasıl gönderilip değerlendirildiği.
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

## Ekip önerileri nasıl çalışır?
Wiki GitHub Pages üzerinde çalışan statik bir sitedir; **kendi başına veri kaydedemez**. Bu yüzden öneriler, deponun GitHub sayfasındaki **Issues** bölümüne kaydedilir ve wiki onları otomatik olarak okuyup ilgili sayfada listeler.

1. Bir sayfanın sonundaki **"+ Öneri gönder (GitHub)"** düğmesine bas. Konusu önceden doldurulmuş bir öneri formu açılır.
2. Formu doldur: öneri başlığı, ilgili karakter/konu, öneri türü (A: mevcut bir özelliği geliştirme · B: henüz karar verilmemiş bir konuya öneri), açıklama ve adın.
3. Gönderdiğin öneri birkaç dakika içinde ilgili wiki sayfasının **Ekip önerileri** bölümünde kart olarak görünür. Tartışma GitHub'daki yorumlarda devam eder.
4. Proje sorumlusu öneriye bir durum etiketi ekler: `durum: kabul edildi`, `durum: reddedildi` veya `durum: beklemede`. Etiket yoksa öneri **Değerlendirilecek** olarak görünür.
5. **Kabul edilen bir öneri, wikide kendiliğinden kanon olmaz.** Proje sorumlusu ilgili sayfayı güncelleyip bilgiyi {{kesin}} olarak işaretlediğinde kanonlaşır.

:::note GitHub hesabı olmayanlar için
Her öneri bölümünde **kopyalanabilir bir öneri şablonu** vardır. Şablonu doldurup proje sorumlusuna iletebilirsin; sorumlu öneriyi GitHub'a ekler.
:::

:::warning Gizlilik
Depo herkese açık olduğu için GitHub'a gönderilen öneriler ve yorumlar **herkes tarafından görülebilir**. Yayınlanmasını istemediğin hikâye fikirlerini GitHub yerine doğrudan ekiple paylaş.
:::

### Proje sorumlusu için
- Durum etiketlerini depoda bir kez oluşturman yeterli: GitHub → Issues → Labels → `durum: kabul edildi`, `durum: reddedildi`, `durum: beklemede`.
- Öneri formu deponun `.github/ISSUE_TEMPLATE/oneri.yml` dosyasındadır.
- Wiki önerileri yaklaşık 10 dakikalık önbellekle gösterir; GitHub'ın anonim istek sınırı aşılırsa wiki önerilerin GitHub'da görüntülenmesi için bağlantı verir.

## Tüm öneriler
{{oneriler:tum}}
