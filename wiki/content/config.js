/* ============================================================================
   THE FACILITY WIKI — SİTE AYARLARI

   Bu dosya şunları belirler:
     1. Hangi madde dosyalarının var olduğu   (articles)
     2. Soldaki gezinme çubuğu                (sidebar)
     3. Ana Sayfada nelerin görüneceği        (mainPage)

   Maddelerin metni wiki/content/articles/*.md dosyalarındadır.
   Ayrıntılı düzenleme rehberi için wiki/README.md dosyasına bakın.
   ========================================================================== */

window.WIKI_CONFIG = {

  siteName:  'The Facility Wiki',
  gameTitle: 'The Facility',

  /* Maddeleri düzenledikten sonra bu sayıyı değiştirin ki tarayıcılar yeni dosyaları indirsin. */
  version: '2026-11-10.12-sonlar',

  /* Üst bilgi ve alt bilgide gösterilen dış bağlantılar. */
  links: {
    studio:   '../',
    presskit: '../presskit.html',
    steam:    'https://store.steampowered.com/app/3796790/The_Facility/'
  },

  /* --------------------------------------------------------------------------
     MADDELER
     content/articles/ içindeki her dosya için bir satır (".md" olmadan).
     Buraya eklenmeyen bir madde sitede hiçbir yerde görünmez.
     ------------------------------------------------------------------------ */
  articles: [
    // Ana
    'the-facility',
    'the-world',
    'timeline',

    // Karakterler
    'henry-edaven',
    'arthur-edaven',
    'viktor-hale',
    'vera-collins',
    'ted-karinsky',
    'm-cole-morgan',
    'alicia-winston',
    'bob',
    'evangelyn-hilton',
    'dakota-ahmadii',
    'hasan-kahveci',
    'katarina-jovanovic',
    'shane-smith',
    'janitor',
    'b-block-officer',
    'emma-bell',
    'gina-bell',
    'henrys-wife',
    'henrys-daughter',
    'milena-marvic',
    'paul-h-simmons',
    'sergio-galvez',
    'father-gregory',
    'nina-grace',

    // Mekânlar
    'facility-61',
    'facility-60',

    // Evren bilgisi
    'the-analog-era',
    'the-technology-purge',
    'the-corrupted',
    'core-program',
    'remnants',

    // Oyun bilgileri
    'gameplay',
    'assignments',
    'tests-and-detection-methods',
    'night-events',
    'endings',

    // Kategori sayfaları (her kategorinin başında gösterilen giriş metni)
    'category-characters',
    'category-facility-staff',
    'category-a-block-staff',
    'category-inmates',
    'category-other-characters',
    'category-locations',
    'category-other-locations',
    'category-lore',
    'category-game-information',
    'category-the-world',

    // Wiki proje sayfaları
    'wiki-about'
  ],

  /* --------------------------------------------------------------------------
     KENAR ÇUBUĞU
     [ 'Görünen metin', 'Bağlandığı sayfa başlığı' ]
     ------------------------------------------------------------------------ */
  sidebar: [
    { heading: 'Ana', links: [
      ['Ana Sayfa',         'Ana Sayfa'],
      ['The Facility',      'The Facility'],
      ['Dünya',             'Dünya'],
      ['Zaman Çizelgesi',   'Zaman Çizelgesi']
    ]},
    { heading: 'Karakterler', links: [
      ['Tüm Karakterler',    'Kategori:Karakterler'],
      ['Tesis Personeli',    'Kategori:Tesis Personeli'],
      ['Mahkûmlar',          'Kategori:Mahkûmlar'],
      ['Diğer Karakterler',  'Kategori:Diğer Karakterler']
    ]},
    { heading: 'Mekânlar', links: [
      ['Facility 61',        'Facility 61'],
      ['Facility 60',        'Facility 60'],
      ['Diğer Mekânlar',  'Kategori:Diğer Mekânlar']
    ]},
    { heading: 'Evren Bilgisi', links: [
      ['Analog Era',            'Analog Era'],
      ['Technology Purge',   'Technology Purge'],
      ['Corrupted',           'Corrupted'],
      ['CORE Programı',         'CORE Programı'],
      ['Remnants',            'Remnants']
    ]},
    { heading: 'Oyun Bilgileri', links: [
      ['Oynanış',                        'Oynanış'],
      ['Görevlendirmeler',               'Görevlendirmeler'],
      ['Testler ve Tespit Yöntemleri',   'Testler ve Tespit Yöntemleri'],
      ['Gece Olayları',                  'Gece Olayları'],
      ['Sonlar',                         'Sonlar']
    ]},
    { heading: 'Wiki Araçları', links: [
      ['Rastgele sayfa',     'Özel:Rastgele'],
      ['Tüm sayfalar',       'Özel:TümSayfalar'],
      ['Son değişiklikler',  'Özel:SonDeğişiklikler'],
      ['Tüm kategoriler',    'Özel:Kategoriler'],
      ['Bu wiki hakkında',   'The Facility Wiki:Hakkında']
    ]}
  ],

  /* --------------------------------------------------------------------------
     ANA SAYFA
     ------------------------------------------------------------------------ */
  mainPage: {
    heroImage: 'assets/img/key-art.jpg',   // Ana Sayfanın en üstündeki büyük görsel
    heroLink: 'The Facility',
    intro: [
      '**[[The Facility]]**, Veinstone Studios tarafından geliştirilen ve 2055 yılında geçen bir psikolojik korku oyunudur. ' +
      'Oyuncu, [[Corrupted]] olduğundan şüphelenilen kişilerin tutulduğu bir hapishane ve rehabilitasyon merkezi olan ' +
      '[[Facility 61]]\'in Gardiyanı [[Henry Edaven]]\'ı canlandırır.',
      'Bu wiki; oyunun karakterlerini, mekânlarını ve evrenini belgeleyen bir topluluk ansiklopedisidir. ' +
      'Doğrulanmamış bilgiler açıkça bilinmiyor olarak işaretlenir.'
    ],
    featuredArticle: 'Facility 61',
    featuredCharacters: ['Henry Edaven', 'Arthur Edaven', 'Vera Collins', 'Alicia Winston', 'Ted Karinsky', 'Bob', "Henry'nin Kızı", 'Katarina Jovanovic'],
    importantLocations: ['Facility 61', 'Facility 60'],
    lore: ['Analog Era', 'Technology Purge', 'Corrupted', 'CORE Programı', 'Dünya', 'Zaman Çizelgesi'],
    gameInfo: ['Oynanış', 'Görevlendirmeler', 'Testler ve Tespit Yöntemleri', 'Gece Olayları', 'Sonlar'],
    shortcuts: [
      ['Karakterler',      'Kategori:Karakterler'],
      ['Mekânlar',         'Kategori:Mekânlar'],
      ['Evren Bilgisi',    'Kategori:Evren Bilgisi'],
      ['Oyun Bilgileri',   'Kategori:Oyun Bilgileri'],
      ['Zaman Çizelgesi',  'Zaman Çizelgesi'],
      ['Dünya',            'Dünya']
    ]
  }
};
