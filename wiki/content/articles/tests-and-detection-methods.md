---
title: Testler ve Tespit Yöntemleri
type: game
categories: Oyun Bilgileri
aliases: Tests & Detection Methods, Tests and Detection Methods, Testler, Tespit, Tespit yöntemleri, Sorgu, Sorgular, Günlük, Teyp, Hücre incelemesi
summary: Gardiyanın bir mahkûmun insan mı yoksa Corrupted mı olduğunu belirlemek için kullandığı yöntemler — sorgu, belge kontrolü, ifadelerin karşılaştırılması ve görsel bozulmaların aranması.
image: assets/img/screens/tape-recorder.jpg
caption: Kaydedilmiş bir sorgunun dinlenmesi (geliştirme sürümü ekran görüntüsü)
created: 2026-11-09
updated: 2026-11-09
infobox:
  [Genel bakış]
  Amacı: İnsanları [[Corrupted|Corrupted'lardan]] ayırt etmek
  Uygulayan: Gardiyan ([[Henry Edaven]])
  Aşama: Sorgu
  [Bilinen yöntemler]
  Yöntemler: Sorgu; Belge incelemesi; İfadelerin karşılaştırılması; Ses testleri; Görsel gözlem
  Görüşme süresi: 2 saat
---
**Testler ve tespit yöntemleri**, [[Facility 61]]'in Gardiyanının bir mahkûmun sıradan bir insan mı yoksa [[Corrupted]] mı olduğunu belirlemeye çalıştığı yollardır. Gerçek bir insanı Corrupted bir bireyden ayırt etmek her zaman kolay değildir.

:::dev
*The Facility* hâlâ geliştirme aşamasındadır. Aşağıdaki yöntemler resmî materyallerde anlatılanlardır. Başka testler ileride belgelenebilir.
:::

## Genel bakış {{kesin}}
Gardiyanın görevi mahkûmları sorgulamak ve insanlıklarını değerlendirmektir. Resmî basın kitine göre bu; mahkûm dosyalarını incelemeyi, anlattıklarını karşılaştırmayı ve görsel bozulmaları aramayı kapsar.

## Bilinen yöntemler {{kesin}}
### Sorgu
Gardiyan mahkûmları yüz yüze sorgular ve tuhaf görünen her şeye dikkat eder.

### Belge incelemesi
Mahkûmların belgeleri tutarsızlıklar açısından incelenir.

### İfadelerin karşılaştırılması
Mahkûmların anlattıkları birbiriyle karşılaştırılır. Gardiyanın **günlüğü** ifadeleri karşılaştırmak için kullanılır; **teyp** ise kaydedilmiş sorguların yeniden dinlenmesini sağlar.

### Ses testleri
[[Vera Collins|Teğmen Vera Collins]]'in eğitim diyaloğuna göre:
- İlk günün ses testleri önceden yapılmıştır.
- Ses kayıtları günlükteki (Journal) mahkûm dosyalarında bulunur.
- İkinci günden itibaren [[Henry Edaven|Henry]] ses testlerini **kasetçalar** kullanarak kendisi yapar.

### Görüşmeler ve sorgu başlıkları
Mahkûmlarla yapılan her görüşme **2 saat** sürer ve Gardiyanın çalışma saatlerinden harcar. Sorgular başlıklar üzerinden ilerler; örneğin [[Alicia Winston]]'ın sorgusundaki başlıklardan biri **Current Situation** (Mevcut Durum) olarak belirlenmiştir.

### Görsel gözlem
Gardiyan, bir anomaliye işaret edebilecek görsel bozulmaları arar. **Hücre incelemesi** sırasında mahkûmlar hücrelerinin kapağından gözlemlenebilir.

## Diğer testler {{kararyok}}
{{kararyok}}

## Ses ve beyin testi {{gelistiriliyor}}
:::source Ekip sunumu
Bu bölüm ekibin Canva sunumundaki notlara dayanır. Proje sorumlusu kesinleştirene kadar **Geliştiriliyor** olarak işaretlidir.
:::

- Ses ve beyin testi **mahkûmla konuşurken** yapılır. Bu yüzden ilk kez yapıldığında günlüğü açmak gerekmez.
- Beyin testinde ekranda görsel bir pencere (beyin tarama raporu) açılır.
- Test sonuçları, mahkûmun karşısında oyuncuya kontrol verilmeden o an çıkar. Bunun nedeni karakterin sonuca **itiraz edebilme** hakkının olmasıdır.
- Testler günlüğe kaydedildiği için sonradan da incelenebilir.

### Günlükteki mahkûm profilleri
- 14 mahkûm profili günlükte 3 sayfaya sığar. Bu düzen hem ileride yeni karakter eklemeyi kolaylaştırır hem de oyuncunun yalnızca isme bakarak istediği mahkûma ulaşmasını sağlar.
- Bir mahkûmun profili tek yerine iki sayfa olursa yapılan testlere de buradan ulaşılabilir.
- İkiden fazla test eklenirse testler için ayrı bir ayraç eklenebilir; şimdilik iki test (ses ve beyin) planlanmaktadır.

:::gallery
assets/img/concept/test-menu.jpg | Mahkûmla konuşurken test seçenekleri (geliştirme sürümü)
assets/img/concept/brain-scan-report.jpg | Beyin tarama raporu penceresi (geliştirme sürümü)
assets/img/concept/test-result-dialogue.jpg | Test sırasında mahkûmun tepkisi (geliştirme sürümü)
assets/img/concept/journal-profiles.jpg | Günlükteki mahkûm profilleri listesi (geliştirme sürümü)
assets/img/concept/journal-profile-page.jpg | Bir mahkûmun profil sayfası, ses kaydı ve beyin taraması (geliştirme sürümü)
:::

:::kararyok Arayüz görsellerindeki yer tutucu bilgiler
Arayüz görsellerindeki kimlik numaraları, doğum ve test tarihleri ile suç kayıtları (ör. 2058–2059 yılları) yer tutucu gibi görünmektedir ve kanon olarak alınmamıştır. Profil listesinde ayrıca wikide olmayan **"Cole M. Graves"** adı geçmektedir.
:::

## İnfaz {{kararyok}}
Sunumda açık bir soru olarak yer alır: **infaz nasıl yapılmalı — üst katta mı, yüz yüze mi?** Henüz karar verilmemiştir.

:::gallery
assets/img/concept/execution-room.jpg | İnfaz odası konsepti (ekip sunumu)
assets/img/concept/execution-room-ui.jpg | İnfaz onayı arayüz konsepti (ekip sunumu)
:::

## Henüz karar verilmeyen konular
{{kararyok}}

## Galeri
:::gallery
assets/img/screens/cell-inspection.jpg | Hücre incelemesi
assets/img/screens/journal.jpg | İfadeleri karşılaştırmak için kullanılan günlük
assets/img/screens/journal-2.jpg | Günlük
assets/img/screens/tape-recorder.jpg | Kaydedilmiş bir sorgunun dinlenmesi
:::

## Ayrıca bakınız
- [[Corrupted]]
- [[CORE Programı]]
- [[Oynanış]]

## Ekip önerileri ve tartışma
{{oneriler}}
