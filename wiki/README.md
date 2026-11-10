# The Facility Wiki — düzenleme rehberi

Wiki bu `wiki/` klasöründe yer alır ve **https://veinstonestudios.github.io/wiki/**
adresinde yayımlanır. Tamamen statik dosyalardan oluşur: derleme adımı ya da sunucu
tarafı yoktur. Değişiklikleri commit'leyip pushlayınca GitHub Pages yayımlar.

```
wiki/
├── index.html              Uygulama iskeleti (üst bilgi, kenar çubuğu, alt bilgi). Nadiren düzenlenir.
├── content/
│   ├── config.js           Madde listesi, kenar çubuğu, Ana Sayfa ayarları
│   └── articles/*.md       Her madde için bir Markdown dosyası  ← düzenlediğiniz yer
└── assets/
    ├── css/wiki.css        Stiller
    ├── js/wiki.js          Motor (görüntüleme, arama, kategoriler)
    ├── fonts/              Logo yazı tipi
    └── img/                Optimize edilmiş görseller (characters/, screens/)
```

## Yeni madde ekleme

1. Aynı türden mevcut bir maddeyi (örneğin bir mahkûm için `articles/bob.md`) yeni bir
   dosyaya kopyalayın, örneğin `articles/yeni-karakter.md`.
2. Ön bilgiyi (`---` satırlarının arası) ve metni düzenleyin.
3. Dosya adını `.md` olmadan `content/config.js` içindeki `articles` listesine ekleyin.
4. İsteğe bağlı: aynı dosyada `sidebar` veya `mainPage` listelerine ekleyin.
5. Ziyaretçilerin tarayıcıları yeni dosyaları indirsin diye `content/config.js` içindeki
   `version` değerini değiştirin.

Maddenin adresi başlığından oluşturulur: `?page=Yeni_Karakter`.
`/wiki/Yeni_Karakter` gibi kısa adresler de çalışır (`/404.html` tarafından yönlendirilir).

## Ön bilgi alanları

```yaml
---
title: Ted Karinsky                 # sayfa başlığı (benzersiz olmalı)
type: character                     # character | location | lore | game | world | timeline | category | project
role: Mahkûm                        # kartlarda görünen kısa etiket (isteğe bağlı)
categories: Mahkûmlar               # virgülle ayrılır; ilki konum çubuğunu (breadcrumb) belirler
aliases: Ted, Karinsky              # bu sayfaya yönlendiren ve aramaya yardım eden diğer adlar
summary: Tek cümlelik açıklama.     # Ana Sayfada, aramada ve kartlarda kullanılır
image: assets/img/characters/ted-karinsky.jpg   # yer tutucu için boş bırakın
caption: Karakter çizimi
spoilers: true                      # spoiler uyarısını gösterir
spoiler-note: Uyarı için isteğe bağlı ek metin.
stub: true                          # "taslak" uyarısını gösterir
created: 2026-11-09                 # "Son eklenenler" için
updated: 2026-11-09                 # "Son değişiklikler" ve sayfa altı için
infobox:
  [Bölüm başlığı]
  Etiket: Değer
  Birden çok değer: Birinci; İkinci   # noktalı virgüller satır sonuna dönüşür
  Yaşı: Bilinmiyor                    # "Bilinmiyor" etiketi olarak görünür
  Boyu: Belgelenmedi                  # "Henüz belgelenmedi" etiketi olarak görünür
---
```

## Yazım kuralları

| Yazdığınız | Görünen |
|---|---|
| `## Başlık` / `### Alt başlık` | Bölümler (3 veya daha fazla olunca içindekiler tablosunda listelenir) |
| `[[Facility 61]]` | Bir maddeye bağlantı |
| `[[Facility 61\|tesis]]` | Farklı metinli bağlantı |
| `[[Henry Edaven#Ailesi]]` | Bir bölüme bağlantı |
| `[[Kategori:Mahkûmlar]]` | Bir kategoriye bağlantı |
| `[metin](https://…)` | Dış bağlantı |
| `**kalın**`, `*italik*` | Kalın, italik |
| `{{bilinmiyor}}` `{{dogrulanmadi}}` `{{dogrulandi}}` `{{belgelenmedi}}` | Durum etiketleri (İngilizceleri de çalışır: `{{unknown}}` `{{confirmed}}` `{{tba}}`) |
| Tek başına bir satırda `{{eksik}}` | "Henüz belgelenmedi" kutusu |
| `\|\|gizli metin\|\|` | Tıklayınca açılan satır içi spoiler |
| `[SANSÜRLÜ]` | Siyah sansür çubuğu |
| `- madde` / `1. madde` | Listeler |
| `\| a \| b \|` satırları | Tablolar (ilk satır başlıktır) |

Kutular `:::tür İsteğe bağlı başlık` … `:::` ile yazılır. Türler: `bilinmiyor`,
`dogrulandi`, `not`, `surprizbozan`, `uyari`, `kaynak`, `gelistirme`, `alinti`, `galeri`
(İngilizce adları da çalışır: `unknown`, `confirmed`, `note`, `spoiler`, `warning`,
`source`, `dev`, `quote`, `gallery`).

```
:::alinti
Onları gördüm.
— Ted, bir geliştirme sürümü ekran görüntüsünde
:::

:::galeri
assets/img/screens/hall.jpg | Tesisin içindeki bir salon
yer tutucu | Görsel yakında
:::
```

## Kategoriler

`categories:` içindeki her değer otomatik olarak bir kategori sayfası olur. Bir
kategoriye giriş metni veya üst kategori vermek için `title: Kategori:Ad`,
`type: category` ve isteğe bağlı olarak `parent: Karakterler` içeren bir
`articles/category-ad.md` dosyası oluşturup `config.js`'e ekleyin. `Taslaklar` ve
`Spoiler içeren maddeler` kategorileri `stub` ve `spoilers` alanlarından
otomatik olarak doldurulur.

## Görseller

Web boyutundaki görselleri `assets/img/` içine koyun (ekran görüntüleri için yaklaşık
1280 px, portreler için yaklaşık 520 px genişlikte JPG). Deponun başka yerlerindeki
birkaç MB'lık orijinal PNG'ler wikide kullanılmaz. ffmpeg ile:

```
ffmpeg -i girdi.png -vf "scale='min(1280,iw)':-2" -q:v 5 wiki/assets/img/screens/ad.jpg
```

## İçerik kuralları

- Yalnızca doğrulanmış bilgiler gerçek olarak yazılır. Geri kalan her şey bilinmiyor olarak işaretlenir.
- Teoriler asla gerçeğe dönüştürülmez; hikâyenin bilinçli gizemleri çözülmez.
- Karakter, mekân, yaş, ilişki veya geçmiş uydurulmaz.
- *The Facility* oyunun adıdır; **Facility 61** oyunun içindeki bir mekândır.
- Oyuna özgü, Türkçeye birebir çevrilemeyen terimler İngilizce kalır: Facility 61, Facility 60,
  Corrupted, Corruption, Analog Era, Technology Purge, Remnants, The Collapse, A Block, B Block,
  spoiler. Genel kelimeler Türkçe yazılır: tesis, mahkûm, Gardiyan (Warden), Kaptan, Teğmen.
  Terimlerin Türkçe karşılıklarını (Tesis 61, Bozulmuşlar vb.) `aliases:` alanında tutun.

## Yerelde test etme

Tarayıcılar madde dosyalarını `file://` üzerinden yüklemez. Depo kök klasöründen
herhangi bir statik sunucu çalıştırıp `http://localhost:PORT/wiki/` adresini açın, örneğin:

```
python -m http.server 8000
```
