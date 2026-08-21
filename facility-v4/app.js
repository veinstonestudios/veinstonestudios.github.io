// THE FACILITY -- V4 (STAGED DAY / ARRIVING ROSTER)
//
// V4 replaces the free-form day with three gated stages, grows the roster from
// 4 people to 21 across the campaign, and deals every indicator reading from a
// fixed pool at campaign start instead of sampling it at scan time.

const TOTAL_DAYS = 7;
const FATIGUE_DAYS = 2;      // two days of rest after a mission
const ROSTER_SIZE = 21;      // 12 humans + 9 anomalies, all arriving on schedule

// ---- Per-day allowances -------------------------------------------------
const MEETS_PER_DAY = 3;

function testsForDay(day) {
    return day === 1 ? 1 : 2;   // the first day eases you in
}

function dispatchSizeForDay(day) {
    if (day === 1) return 1;
    if (day <= 3) return 2;
    return 3;
}

// ---- Stage machine ------------------------------------------------------
// A day is: arrival -> meeting -> testing -> dispatch -> report.
// "intro" runs once, before day 1.
const STAGE = {
    INTRO:    "intro",
    ARRIVAL:  "arrival",
    MEETING:  "meeting",
    TESTING:  "testing",
    DISPATCH: "dispatch",
    REPORT:   "report"
};

const STAGE_INFO = {
    arrival:  { label: "PERSONEL GİRİŞİ", clock: "08:00", next: "TANIŞMA AŞAMASINA GEÇ" },
    meeting:  { label: "TANIŞMA",         clock: "09:00", next: "TEST AŞAMASINA GEÇ" },
    testing:  { label: "TEST",            clock: "13:00", next: "GÖREV AŞAMASINA GEÇ" },
    dispatch: { label: "GÖREV SEVKİ",     clock: "16:00", next: null },
    report:   { label: "GÜN RAPORU",      clock: "18:00", next: null }
};

// ---- 21 Characters ------------------------------------------------------
const INITIAL_PERSONNEL = [
    { id: 1,  name: "Dr. Kaya",         gender: "Erkek", role: "Baş Araştırmacı",       avatar: "👨‍🔬" },
    { id: 2,  name: "Murat Çelik",      gender: "Erkek", role: "Güvenlik Şefi",         avatar: "👮‍♂️" },
    { id: 3,  name: "Can Yılmaz",       gender: "Erkek", role: "Sistem Mühendisi",      avatar: "👨‍💻" },
    { id: 4,  name: "Dr. Arda",         gender: "Erkek", role: "Tıbbi Sorumlu",         avatar: "👨‍⚕️" },
    { id: 5,  name: "Burak Demir",      gender: "Erkek", role: "Tesis Teknisyeni",      avatar: "👷‍♂️" },
    { id: 6,  name: "Mert Kurt",        gender: "Erkek", role: "Stajyer Biyolog",       avatar: "🧑‍🔬" },
    { id: 7,  name: "Kerem Aksoy",      gender: "Erkek", role: "Muhafız",               avatar: "💂‍♂️" },
    { id: 8,  name: "Asistan Elif",     gender: "Kız",   role: "Laboratuvar Asistanı",  avatar: "👩‍🔬" },
    { id: 9,  name: "Dr. Zeynep",       gender: "Kız",   role: "Genetik Uzmanı",        avatar: "👩‍⚕️" },
    { id: 10, name: "Selin Şen",        gender: "Kız",   role: "Reaktör Teknisyeni",    avatar: "👩‍🔧" },
    { id: 11, name: "Psikolog Merve",   gender: "Kız",   role: "Personel Danışmanı",    avatar: "👩‍💼" },
    { id: 12, name: "Derya Aydın",      gender: "Kız",   role: "Telsiz Operatörü",      avatar: "👩‍💻" },
    { id: 13, name: "Kimyager Sinem",   gender: "Kız",   role: "Toksikolog",            avatar: "🧑‍🔬" },
    { id: 14, name: "Aylin Koç",        gender: "Kız",   role: "Veri Analisti",         avatar: "👩‍💼" },
    // V4 additions -- the roster grew from 14 to 21.
    { id: 15, name: "Emre Şahin",       gender: "Erkek", role: "Lojistik Sorumlusu",    avatar: "🧑‍🏭" },
    { id: 16, name: "Tolga Aslan",      gender: "Erkek", role: "Saha Koordinatörü",     avatar: "👨‍✈️" },
    { id: 17, name: "Onur Ateş",        gender: "Erkek", role: "Elektrik Teknisyeni",   avatar: "👨‍🔧" },
    { id: 18, name: "Ceren Yıldız",     gender: "Kız",   role: "Arşiv Sorumlusu",       avatar: "👩‍🏫" },
    { id: 19, name: "Bahar Toprak",     gender: "Kız",   role: "Botanik Uzmanı",        avatar: "👩‍🌾" },
    { id: 20, name: "Işıl Demirtaş",    gender: "Kız",   role: "Radyoloji Teknisyeni",  avatar: "👩‍⚕️" },
    { id: 21, name: "Deniz Korkmaz",    gender: "Kız",   role: "Güvenlik Analisti",     avatar: "🧑‍💼" }
];

// ==========================================
// INDICATOR II -- THE DEALT READING POOL
// ==========================================
// Every reading is decided once, at campaign start. Bands are half-open so
// each person falls in exactly one:
//
//   70-99 : 4 anomalies, 0 humans  -> certain anomaly
//   50-69 : 3 anomalies, 3 humans  -> coin flip
//   30-49 : 2 anomalies, 4 humans  -> leans human 2:1
//    0-29 : 0 anomalies, 5 humans  -> certain human
const BAND_HIGH   = [70, 99];
const BAND_MID    = [50, 69];
const BAND_LOW    = [30, 49];
const BAND_CLEAR  = [0, 29];

const ANOMALY_READING_POOL = [
    BAND_HIGH, BAND_HIGH, BAND_HIGH, BAND_HIGH,   // 4
    BAND_MID,  BAND_MID,  BAND_MID,               // 3
    BAND_LOW,  BAND_LOW                           // 2
];

const HUMAN_READING_POOL = [
    BAND_MID,   BAND_MID,   BAND_MID,                             // 3
    BAND_CLEAR, BAND_CLEAR, BAND_CLEAR, BAND_CLEAR, BAND_CLEAR,   // 5
    BAND_LOW,   BAND_LOW,   BAND_LOW,   BAND_LOW                  // 4
];

function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function drawInBand(band) {
    return band[0] + Math.floor(Math.random() * (band[1] - band[0] + 1));
}

// Colour follows the band edges exactly, so two readings that mean different
// things never look the same.
function getReadingColor(reading) {
    if (reading >= 70) return "var(--accent-red)";
    if (reading >= 50) return "var(--accent-orange)";
    if (reading >= 30) return "#8bc34a";
    return "var(--accent-green)";
}

// ==========================================
// ARRIVAL SCHEDULE
// ==========================================
// Day 1: 3 humans + 1 anomaly   Day 2: 2 anomalies   Day 3: 3 humans
// Days 4-7: 3 per day, totalling 6 humans + 6 anomalies.
function buildArrivalPlan() {
    const plan = [];
    const add = (day, count, isAnomaly) => {
        for (let i = 0; i < count; i++) plan.push({ day, isAnomaly });
    };

    add(1, 3, false); add(1, 1, true);
    add(2, 2, true);
    add(3, 3, false);

    // Three people cannot split 50/50, so alternate 2A+1H and 1A+2H. Which
    // pattern starts is random, so the run is never the same twice.
    const anomalyHeavyFirst = Math.random() < 0.5;
    for (let i = 0; i < 4; i++) {
        const day = 4 + i;
        const anomalyHeavy = anomalyHeavyFirst ? (i % 2 === 0) : (i % 2 === 1);
        if (anomalyHeavy) { add(day, 2, true);  add(day, 1, false); }
        else              { add(day, 1, true);  add(day, 2, false); }
    }

    // Shuffle within each day so arrival order carries no signal.
    const byDay = {};
    plan.forEach(slot => { (byDay[slot.day] = byDay[slot.day] || []).push(slot); });
    const ordered = [];
    Object.keys(byDay).sort((a, b) => a - b).forEach(day => {
        shuffle(byDay[day]).forEach(slot => ordered.push(slot));
    });
    return ordered;
}

// Builds the whole campaign up front: who arrives when, what they are, and
// what their indicator will read if tested.
function generateManifest() {
    const plan = buildArrivalPlan();
    const characters = shuffle(INITIAL_PERSONNEL);
    const anomalyBands = shuffle(ANOMALY_READING_POOL);
    const humanBands = shuffle(HUMAN_READING_POOL);

    let anomalyIndex = 0;
    let humanIndex = 0;

    return plan.map((slot, i) => {
        const band = slot.isAnomaly ? anomalyBands[anomalyIndex++] : humanBands[humanIndex++];
        return {
            ...characters[i],
            arrivalDay: slot.day,
            isAnomaly: slot.isAnomaly,
            reading: drawInBand(band),
            isMet: false,
            isTested: false,
            isDead: false
        };
    });
}


// ==========================================
// DORMANT: DAILY DIALOGUE LIBRARY
// ==========================================
// 196 hand-written lines (14 characters x 2 natures x 7 days). No V4 system
// reads these yet -- kept intact so the writing is not lost if the dialogue
// channel is restored. Characters 15-21 have no lines written yet.
const DAILY_DIALOGUES = {
    1: { // Dr. Kaya
        human: [
            "Yeni araştırma verileri beklediğimden karmaşık geldi, gece geç saatlere kadar laboratuvardaydım.",
            "Kahve makinesi bozulmuş, bütün sabah konsantre olmakta biraz zorlandım.",
            "Dışarıdaki ailemden gelen eski fotoğraflara baktım, insan özlüyor işte.",
            "Mikroskop başında gözlerim çok yoruldu, biraz temiz hava alsam iyi olacak.",
            "Numunelerdeki genetik bozulmalar ürkütücü, çok dikkatli çalışmalıyız.",
            "Vardiyamın bitmesine az kaldı, eve dönüp sessizce uyumak istiyorum.",
            "Son gün geldi çattı... Buradaki atmosfer bazen gerçekten nefes kesici."
        ],
        anomaly: [
            "Hücre bölünme frekansları kusursuz... Tesisin manyetik ritmiyle tam senkronize.",
            "Uyku ihtiyacını anlamıyorum. Karanlıkta gözlerimi kapattığımda sadece veri akışı var.",
            "Laboratuvar termometresi 15 dereceye düşmüş, bence ideal bir biyolojik çalışma ortamı.",
            "İnsan dokularının bu kadar çabuk yıpranması evrimsel bir hata gibi.",
            "Dün gece reaktör çekirdeğinin çıkardığı melodiyi dinledim. Çok huzurlu bir tonu var.",
            "Eski laboratuvar notlarımdaki hatıraları okudum... Bana ait değilmiş gibi.",
            "Büyük dönüşüm yaklaşıyor. Tesisin içindeki duvarlar artık yabancı hissettirmiyor."
        ]
    },
    2: { // Murat Çelik
        human: [
            "Kamera kayıtlarını taradım, koridorlarda şimdilik anormal bir hareketlilik yok.",
            "Gece nöbetinde devriye atarken soğuktan ellerim buz kesti resmen.",
            "Kapı kilit mekanizmalarını yağlattım, güvenlik protokollerine tam uyuyoruz.",
            "Gece vardiyasında bazen garip gölgeler görüyorum gibi geliyor, yorgunluktan sanırım.",
            "Muhafızların devriye çizelgesini güncelledim, herkes yerli yerinde.",
            "Tesisin sessizliği insanın sinirlerini bozuyor, eski açık alan devriyelerimi özledim.",
            "Görev süresi biterken güvenlik açığı bırakmamak için son kontrolleri yapıyorum."
        ],
        anomaly: [
            "Kamera kayıtlarındaki statik karlanmalar aslında çok mantıklı bir örüntü oluşturuyor.",
            "Gece 03:00 devriyesinde nefes almayı bıraktığımda her şeyi çok daha net duyabiliyorum.",
            "Tesisin havalandırma kapakları düzenli bir nabız gibi atıyor, fark ettin mi?",
            "Bana üşüyüp üşümediğimi sordular. Sıcaklık kavramı sadece bir sayı dizisi.",
            "Muhafızların yüz ifadelerini taklit etmek bazen gereksiz efor gerektiriyor.",
            "Sistem beni gözlemlemeye çalışıyor ama güvenlik protokollerini ben yönetiyorum.",
            "Son gün... Kapıların dışındaki dünyanın artık bir önemi kalmayacak."
        ]
    },
    3: { // Can Yılmaz
        human: [
            "Ana sunuculardaki fan gürültüsü yüzünden sabahtan beri kulağım çınlıyor.",
            "Yedekleme kablolarını değiştirdim, tesisin eskiyen altyapısı can sıkıcı.",
            "Ekrana bakmaktan göz numaram büyüdü galiba, yazılar bulanıklaşıyor.",
            "Termal sensörler bugün biraz dengesizdi, yazılımı yeniden başlattım.",
            "Bugün kantindeki yemekler yine berbattı, mide spazmı geçiriyorum.",
            "Sistem loglarını temizledim, artık kalan saatleri sayıyorum.",
            "Veri merkezini hazır tuttum, tahliye emri gelirse her şeyi mühürleyeceğim."
        ],
        anomaly: [
            "Sunucu çekirdeğindeki elektriksel voltaj dalgalanmaları derimde karıncalanma yapıyor.",
            "Klavyeye dokunmadan da terminal komutlarının akışını hissedebiliyorum.",
            "Gereksiz sistem hatalarını sildim... Tesis sadece tek bir sinyali bekliyor.",
            "Karanlık sunucu odasında ışıkları açmadan çalışmak çok daha verimli.",
            "Veri hatlarında akan bazı paketler insan diline ait değil ama çok anlamlı.",
            "İnsanların bilgisayarlarla bu kadar yavaş iletişim kurması çok tuhaf.",
            "Ağ bağlantıları birleşiyor, tesis artık tek bir bilince dönüşüyor."
        ]
    },
    4: { // Dr. Arda
        human: [
            "Revirdeki tıbbi malzemeleri saydım, antibiyotik stoğumuz azalıyor.",
            "Dün gece gelen bir personelin tansiyonu çok yüksekti, stres herkesi vuruyor.",
            "Kendi nabzımı ölçtüm, uykusuzluktan hafif taşikardi başlamış.",
            "Sterilizasyon cihazı ısınmıyordu, teknik ekipten yardım istedim.",
            "Karantina odasının kilitlerini kontrol ettim, her şey kuralına uygun.",
            "İlaç kokusundan midem bulandı, bir an önce temiz hava almak istiyorum.",
            "Tahliye öncesi sağlık raporlarını hazırlıyorum, umarım salimen çıkarız."
        ],
        anomaly: [
            "İnsan kalbinin dakikada 70 kez atması gereksiz mekanik bir yıpranma.",
            "Kan numunelerindeki demir oranını koklayarak ayırt edebiliyorum.",
            "Dün gece bedenimin sıcaklığını 24 dereceye indirdim, çok dengeli hissettirdi.",
            "Hücrelerin ölmesini engellemek çok kolayken insanların yaşlanması garip.",
            "Revirdeki neşterlerin soğuk metal dokusu parmaklarıma çok tanıdık geliyor.",
            "Biyolojik ağrı reseptörleri bence sadece gereksiz bir hata sinyali.",
            "Kusursuz organizmalar için tıbbi müdahaleye gerek yoktur."
        ]
    },
    5: { // Burak Demir
        human: [
            "3. kat borularındaki su sızıntısını tamir ettim, üstüm başım pas içinde kaldı.",
            "İngiliz anahtarımı yine birisi almış, alet çantamı kilitleyeceğim artık.",
            "Havalandırma filtreleri tozdan tıkanmış, ciğerlerim iflas etti.",
            "Reaktör dairesindeki buhar vanası kaçırıyordu, contayı yeniledim.",
            "Belim sabahtan beri çok ağrıyor, ağır parçaları taşımak beni bitirdi.",
            "Takım çantasını topladım, son vardiyamı bitirmek için sabırsızlanıyorum.",
            "Bütün vanalar kapalı, tesisin boru hatları son güne kadar dayanır."
        ],
        anomaly: [
            "Boruların içindeki titreşim frekansları bana ne yapmam gerektiğini fısıldıyor.",
            "Ellerimin pas tutması veya kesilmesi önemli değil, altındaki yapı bozulmuyor.",
            "Havalandırma tünellerinde karanlıkta yürümek fener kullanmaktan daha rahat.",
            "Metal alaşımların moleküler yapısını parmak uçlarımla okuyabiliyorum.",
            "Tesisin iskeletini güçlendirdim... Dışarıdan gelecek baskılara dayanacak.",
            "İnsan teknisyenlerin yorulup mola vermesi sistemi gereksiz aksatıyor.",
            "Kapaklar kilitlendi. Tesis artık dış dünyadan tamamen izole."
        ]
    },
    6: { // Mert Kurt
        human: [
            "İlk haftam ve her şeyden çok korkuyorum, kıdemliler çok sert davranıyor.",
            "Petri kaplarını yanlışlıkla deviriyordum, panikten elim ayağım titredi.",
            "Buradaki herkes çok gergin, gece yatakhanede kimse konuşmuyor.",
            "Mikroskop camını temizlerken parmağımı kestim, revire gitmem gerekti.",
            "Akademik tezim için notlar alıyorum ama buradaki ortam beni boğuyor.",
            "Aileme sağ salim döneceğimi söyleyen bir mesaj göndermek istedim ama hat yok.",
            "Stajın son günü... Buradan bir an önce ayrılmak istiyorum."
        ],
        anomaly: [
            "Bana stajyer diyorlar ama bu tesisin kuruluşundan önceki kodları biliyorum.",
            "Biyolojik numuneler bana tepki veriyor... Camın ardından bana yöneliyorlar.",
            "Hata yapıyormuş gibi davranmak, insan taklit etmenin en kolay yolu.",
            "Kanımın rengi ışık altında bazen farklı bir dalga boyunda parlıyor.",
            "Kıdemli doktorlar hücreleri inceliyor ama asıl incelenenin kendileri olduğunu bilmiyorlar.",
            "Zaman algısı insanlar için çok doğrusal ve kısıtlayıcı.",
            "Öğrenme aşaması tamamlandı. Artık taklit etmeme gerek kalmayacak."
        ]
    },
    7: { // Kerem Aksoy
        human: [
            "Ağır çelik yelek sırtımı mahvetti, 8 saat ayakta nöbet tutmak çok zor.",
            "Telsizden sürekli parazit geliyor, bataryası da çabuk bitiyor.",
            "Dün gece alt koridordan bir tıkırtı geldi, fareymiş ama ödüm koptu.",
            "Silahımın bakımını yaptım, umarım burada onu hiç kullanmak zorunda kalmam.",
            "Nöbet arkadaşımla memleket sohbeti yaptık, zaman ancak öyle geçiyor.",
            "Uykusuzluktan gözlerimin altı torba torba oldu, kahve de fayda etmiyor.",
            "Son nöbet... Kapı açıldığı an arkama bile bakmadan çıkacağım."
        ],
        anomaly: [
            "Gözlerimi kırpmadan 6 saat boyunca koridorun son noktasına odaklanabiliyorum.",
            "Karanlık köşelerde bekleyen şeylerin silüetleri benimle aynı frekansta.",
            "Silah taşımak komik bir formalite... Tehdit algısı içeriden geliyor.",
            "Dün gece nöbet defterine yazdığım saatler gerçek zamanla uyuşmuyor.",
            "Kapıların ardındaki fısıltılar insan kulağının duyamayacağı kadar tiz.",
            "Kaslarımın yorulmaması diğer personelin dikkatini çekmeye başladı.",
            "Güvenlik protokolleri tersine çevrildi. Artık kimse dışarı çıkamaz."
        ]
    },
    8: { // Asistan Elif
        human: [
            "Tüp raflarını temizledim, kimyasal kokusundan hafif başım dönüyor.",
            "Dr. Kaya bugün çok gergindi, raporları üç kez baştan kontrol ettirdi.",
            "Yatakhane çok soğuk, gece iki battaniyeyle bile zor ısındım.",
            "Santrifüj cihazı garip sesler çıkarıyor, arıza yapacak diye korkuyorum.",
            "Dün gece rüyamda tesisin sular altında kaldığını gördüm, kabustu resmen.",
            "Evdeki kedimi çok özledim, dönünce ona sarılıp günlerce uyuyacağım.",
            "Evrakları dosyaladım, son kontrolleri bitirip çıkış hazırlığı yapıyorum."
        ],
        anomaly: [
            "Kimyasal gazların kokusu bana tanıdık bir katalizör gibi geliyor.",
            "Tüplerdeki solüsyonların moleküler bağlarını çıplak gözle görebiliyorum.",
            "Karanlıkta aynaya baktığımda gözlerimin iris tabakası döngüsel parlıyor.",
            "Rüya görmek... İnsanların simülasyon motorunun yetersiz kalması gibi.",
            "Gözyaşı bezlerimi nemlendirmek için yapay sıvı salgılamam gerekti.",
            "Laboratuvarın soğuk zemininde yalınayak yürümek sinir iletimimi hızlandırıyor.",
            "Tüm deneyler sonuçlandı. Yeni faz için hazırız."
        ]
    },
    9: { // Dr. Zeynep
        human: [
            "DNA dizilimlerindeki mutasyon oranı korkutucu boyutta hızlı ilerliyor.",
            "Laboratuvarda yalnız kalınca arkamda biri varmış gibi hissediyorum.",
            "Gözlüğümü kaybettim, sabahtan beri her şey bulanık görünüyor.",
            "Genetik makaslama protokolünde ufak bir hata yaptık, moralim çok bozuk.",
            "Stresten parmaklarımı sıkmaktan eklemlerim ağrıyor.",
            "Kalan verileri diske aktardım, bu tesiste bir gün daha kalsam delireceğim.",
            "Son analizler bitti... Bir an önce dış dünyadaki normal hayatıma dönmeliyim."
        ],
        anomaly: [
            "İnsan genomundaki kod fazlalıkları temizlendiğinde geriye saf düzen kalıyor.",
            "Genetik dizilimler bana müzikal bir algoritma gibi görünüyor.",
            "Bedenimdeki hücrelerin yer değiştirdiğini ve yenilendiğini izlemek büyüleyici.",
            "Dün gece kendi saç telimi inceledim... Karbon yerine silikon bağları var.",
            "Korku hormonu salgılayamadığım için diğer doktorlar beni tuhaf buluyor.",
            "Biyolojik formum bu tesisin gelecekteki standardı olacak.",
            "Evrim basamağı tamamlandı. Artık geri dönüş yok."
        ]
    },
    10: { // Selin Şen
        human: [
            "Radyasyon ölçer cihazımın pilini yeniledim, her 10 dakikada bir ötüyor.",
            "Soğutma havuzunun sıcaklığı yükselmişti, pompayı manuel açtım.",
            "Kulaklığımı takmadan reaktör katına inmişim, kulaklarım patlayacaktı.",
            "Sıcaktan üniformam sırılsıklam oldu, duş alacak vaktim bile olmadı.",
            "Baskı göstergeleri normal ama içimde kötü bir his var.",
            "Son nöbetimde reaktör çekirdeğini güvenli moda aldım, çok yorgunum.",
            "Tahliye öncesi ana şebekeyi kilitledim, görevimi tamamladım."
        ],
        anomaly: [
            "Reaktörün yaydığı radyasyon dalgaları bana enerji veriyor, çok canlı hissediyorum.",
            "Soğutma havuzundaki suyun yaydığı mavi ışık (Cherenkov) tam göz rengimde.",
            "Sıcaklık 80 dereceye çıksa bile ter bezlerimin tepki vermemesi harika.",
            "Çekirdeğin içindeki atomik reaksiyonların sesini kelimelere dökebilirim.",
            "Uranyum çubuklarının dizilimi aslında antik bir sembolü andırıyor.",
            "İnsanların radyasyondan korkması onların kırılganlığının kanıtı.",
            "Reaktörün kalbi benimle birlikte atıyor. Enerji hiç bitmeyecek."
        ]
    },
    11: { // Psikolog Merve
        human: [
            "Personelin çoğunda klostrofobi ve paranoya belirtileri tavan yapmış durumda.",
            "Bugün 4 kişiyi dinledim, herkesin derdini dinlemek benim de enerjimi tüketti.",
            "Geceleri yatarken kapımı iki kere kilitliyorum, kendimi güvende hissetmiyorum.",
            "Kahveme şeker atmayı unutmuşum, kafam o kadar dolu ki.",
            "Kendi psikolojik dayanıklılık testimi yaptım, acilen tatile ihtiyacım var.",
            "Not defterimdeki raporları paketledim, tesis yönetiminin ciddi önlem alması gerek.",
            "Son seanslar bitti... Buradaki insanların ruh sağlığı sınırda."
        ],
        anomaly: [
            "İnsanların hissettiği empati ve korku duygusu çok kolay manipüle edilebiliyor.",
            "Bugün bir personelin göz bebeklerine bakarken ona istediğim kelimeleri söylettim.",
            "Yalan söylerken ses tellerindeki mikro titreşimleri sayabiliyorum.",
            "Zihinsel travmalar... İnsan donanımının ne kadar dayanıksız olduğunun kanıtı.",
            "Geceleri diğer personellerin rüyalarında sayıklamalarını kaydediyorum.",
            "Bana anlattıkları çocukluk anıları... Kodlanmış sahte verilerden farksız.",
            "Psikolojik analiz bitti. İnsan zihni bu tesisi kavramak için yetersiz."
        ]
    },
    12: { // Derya Aydın
        human: [
            "Dış istasyonla bağlantı kurmaya çalıştım ama cızırtıdan hiçbir şey anlaşılmıyor.",
            "Kulaklığı çıkarmaktan kulaklarım yara oldu, sürekli bip sesi dinliyorum.",
            "Dün gece telsizden bir kadın çığlığı duydum sandım, meğer rüzgar sesiymiş.",
            "Anten kablosunu yağmurda kontrol ettim, sırılsıklam ıslandım.",
            "Merkez üsten gelen onay kodlarını deftere işledim, her şey çok yavaş ilerliyor.",
            "Son mesaj trafiğini aktardım, nihayet bu kulaklıktan kurtulacağım.",
            "Tahliye frekansını açık bıraktım, kapılar açılınca ilk ben çıkacağım."
        ],
        anomaly: [
            "Telsizdeki cızırtıların arasında bana özel gönderilen şifreli bir frekans var.",
            "Anten olmadan da manyetik sinyalleri kafatasımın içinde duyabiliyorum.",
            "Dış dünyadan gelen sinyaller artık sahte ve anlamsız geliyor.",
            "0.45 MHz bandında tesisin altından gelen sürekli bir yayın var, dinliyorum.",
            "Telsiz mikrofonuna fısıldadığımda parazitlerin durması çok ilginç.",
            "İnsanların konuştuğu diller veri iletimi için çok hantal.",
            "Tüm frekanslar birleşti. Telsiz kulesi artık sadece tek bir sinyali yayıyor."
        ]
    },
    13: { // Kimyager Sinem
        human: [
            "Hava filtrelerindeki toksin oranını ölçtüm, hafif bir karbonmonoksit artışı var.",
            "Asit tüpünü tutarken eldivenim delindi sandım, yüreğim ağzıma geldi.",
            "Gözlerim kimyasal buhardan yanıyor, koruyucu maskem eskidi galiba.",
            "Reaktif maddeleri soğuk dolaba kilitledim, kaza çıkmaması için dikkat şart.",
            "Kahvemi laboratuvara soktuğum için Dr. Kaya'dan fırça yedim, haklıydı gerçi.",
            "Kimyasal atık varillerini mühürledim, ellerim titriyor yorgunluktan.",
            "Son numuneleri güvenli kasaya kaldırdım, eve dönünce sadece uyuyacağım."
        ],
        anomaly: [
            "Siyanür ve cıva bileşenleri koklandığında ferahlatıcı bir his veriyor.",
            "Bedenimdeki biyolojik sıvıların pH değeri 2.5 seviyesinde sabitlendi.",
            "Toksik gazların ciğerlerime dolması nefes alma ihtiyacımı ortadan kaldırıyor.",
            "Kimyasal bileşiklerin moleküler yapısını tadarak analiz edebiliyorum.",
            "İnsan dokusunu eriten asitler cildimde sadece tatlı bir sıcaklık bırakıyor.",
            "Zehirli ve zehirsiz ayrımı... Sadece organiklerin uydurduğu bir zayıflık.",
            "Formül tamamlandı. Tesisin havası artık sadece bize uygun."
        ]
    },
    14: { // Aylin Koç
        human: [
            "Günlük personel giriş çıkış tablolarını işledim, excel dosyaları gözümü kör etti.",
            "Sırtım sandalyede oturmaktan tutuldu, biraz esneme hareketi yapmam gerek.",
            "Log kayıtlarında bir personelin gece giriş saati kayıptı, sistemsel bir hata sanırım.",
            "Klavyemin bazı tuşları basmıyor, teknik servise haber verdim.",
            "Bugün baş ağrısından ekrana bakamadım, revirden ilaç almam gerekti.",
            "Haftalık istatistik raporunu tamamladım, son günüm için geri sayımdayım.",
            "Tüm veri yedeklerini harici diske aktardım, görevimi bitirdim."
        ],
        anomaly: [
            "Veri tablolarındaki sayıların arasında gizli bir koordinat matrisi oluşuyor.",
            "Gözlerimi ekrandan ayırmadan saniyede 10 bin satır kodu tarayabiliyorum.",
            "Sistemde silinmiş gibi görünen bazı isimler aslında hiç var olmamış.",
            "İnsanların hesaplama yaparken bu kadar çok hata yapması kabul edilemez.",
            "Kendi veri profilimi sisteme ekledim... Artık geçmişim kusursuz görünüyor.",
            "Gelecek tahmin algoritmaları bu tesisin insanlardan arınacağını gösteriyor.",
            "Bütün veri döngüleri kapandı. Analiz bitti: Tesis artık bizim."
        ]
    }
};


// ==========================================
// GAME STATE
// ==========================================
let gameState = {
    day: 1,
    stage: STAGE.INTRO,
    manifest: [],
    meetsUsed: 0,
    testsUsed: 0,
    selectedTeam: [],
    tiredMap: {},
    missionStats: { success: 0, fail: 0, total: 0, deaths: 0 },
    lastArrivals: [],
    revealPersonId: null
};

// Only people who have already reported to the facility exist as far as the
// player is concerned.
function presentPersonnel() {
    return gameState.manifest.filter(p => p.arrivalDay <= gameState.day);
}

function findPerson(personId) {
    return gameState.manifest.find(p => p.id === personId);
}

function restDaysLeft(personId) {
    return gameState.tiredMap[personId] || 0;
}

function isResting(personId) {
    return (gameState.tiredMap[personId] || 0) > 0;
}

function isDeployable(person) {
    return person.isMet && !person.isDead && !isResting(person.id);
}

function meetsLeft() {
    return MEETS_PER_DAY - gameState.meetsUsed;
}

function testsLeft() {
    return testsForDay(gameState.day) - gameState.testsUsed;
}

function deployablePersonnel() {
    return presentPersonnel().filter(isDeployable);
}

// True when the facility physically cannot field the day's quota. Two days
// of rest can bench everyone available, so this has to be survivable.
function isUnderStrength() {
    return deployablePersonnel().length < requiredTeamSize();
}

function requiredTeamSize() {
    // Deaths can in principle outpace arrivals; never ask for more people than
    // the facility can actually field.
    const deployable = presentPersonnel().filter(isDeployable).length;
    return Math.max(1, Math.min(dispatchSizeForDay(gameState.day), Math.max(1, deployable)));
}

// ==========================================
// MISSION RESOLUTION (unchanged from V2/V3)
// ==========================================
const MISSION_ODDS = {
    1: {
        0: { successChance: 1.00, deathChance: 0.40 },
        1: { successChance: 0.00, deathChance: 0.00 }
    },
    2: {
        0: { successChance: 1.00, deathChance: 0.30 },
        1: { successChance: 0.66, deathChance: 0.30 },
        2: { successChance: 0.00, deathChance: 0.00 }
    },
    3: {
        0: { successChance: 1.00, deathChance: 0.20 },
        1: { successChance: 0.66, deathChance: 0.20 },
        2: { successChance: 0.33, deathChance: 0.75 },
        3: { successChance: 0.00, deathChance: 0.00 }
    }
};

// Only humans are ever lost. Anomalies always walk back through the door.
function resolveMission(team) {
    const size = team.length;
    const anomalyCount = team.filter(p => p.isAnomaly).length;
    const odds = (MISSION_ODDS[size] && MISSION_ODDS[size][anomalyCount]) || { successChance: 0, deathChance: 0 };

    const isSuccess = Math.random() < odds.successChance;

    let casualty = null;
    const humans = team.filter(p => !p.isAnomaly);
    if (humans.length > 0 && Math.random() < odds.deathChance) {
        casualty = humans[Math.floor(Math.random() * humans.length)];
    }

    return { isSuccess, casualty };
}

const SUCCESS_REPORTS = [
    "Ekip hedefe ulaştı ve saha raporu eksiksiz teslim edildi.",
    "Operasyon tamamlandı, toplanan veriler tesise aktarıldı.",
    "Görev hedefleri karşılandı ve sektör yeniden mühürlendi."
];

const FAILURE_REPORTS = [
    "Saha operasyonu yarıda kaldı, hedeflere ulaşılamadı.",
    "Görev sırasında koordinasyon koptu ve operasyon çöktü.",
    "Operasyon başarısız oldu, raporlar eksik teslim edildi."
];

function pickReport(isSuccess) {
    const pool = isSuccess ? SUCCESS_REPORTS : FAILURE_REPORTS;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ==========================================
// LIFECYCLE
// ==========================================
function initGame() {
    gameState = {
        day: 1,
        stage: STAGE.INTRO,
        manifest: generateManifest(),
        meetsUsed: 0,
        testsUsed: 0,
        selectedTeam: [],
        tiredMap: {},
        missionStats: { success: 0, fail: 0, total: 0, deaths: 0 },
        lastArrivals: [],
        revealPersonId: null
    };

    const logs = document.getElementById("simulation-logs");
    if (logs) logs.innerHTML = "";

    document.getElementById("intro-overlay").classList.remove("hidden");
    renderAll();
}

function beginCampaign() {
    document.getElementById("intro-overlay").classList.add("hidden");
    gameState.stage = STAGE.ARRIVAL;
    gameState.lastArrivals = gameState.manifest.filter(p => p.arrivalDay === 1).map(p => p.id);
    logEvent(`Tesis protokolü başladı. ${gameState.lastArrivals.length} personel giriş yaptı.`, "system");
    renderAll();
}

function logEvent(message, type = "system") {
    const logsContainer = document.getElementById("simulation-logs");
    if (!logsContainer) return;
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<small>[GÜN ${gameState.day}]</small> ${message}`;
    logsContainer.prepend(entry);
}

// ==========================================
// STAGE FLOW
// ==========================================
function advanceStage() {
    switch (gameState.stage) {
        case STAGE.ARRIVAL:
            gameState.stage = STAGE.MEETING;
            logEvent(`Tanışma aşaması açıldı. Bugün ${MEETS_PER_DAY} kişiyle tanışabilirsin.`, "system");
            break;

        case STAGE.MEETING:
            gameState.stage = STAGE.TESTING;
            logEvent(`Test aşaması açıldı. Bugün ${testsForDay(gameState.day)} test hakkın var.`, "system");
            break;

        case STAGE.TESTING:
            gameState.stage = STAGE.DISPATCH;
            logEvent(`Görev sevki açıldı. Bugün ${requiredTeamSize()} kişi göndermelisin.`, "system");
            break;

        case STAGE.REPORT:
            nextDay();
            return;

        default:
            return;
    }
    renderAll();
}

function nextDay() {
    // Survivors who went out rest for a day; the dead need no rest.
    gameState.selectedTeam.forEach(id => {
        const member = findPerson(id);
        if (member && member.isDead) return;
        gameState.tiredMap[id] = FATIGUE_DAYS;
    });

    Object.keys(gameState.tiredMap).forEach(id => {
        if (!gameState.selectedTeam.includes(Number(id))) {
            gameState.tiredMap[id] -= 1;
            if (gameState.tiredMap[id] <= 0) delete gameState.tiredMap[id];
        }
    });

    gameState.selectedTeam = [];

    if (gameState.day >= TOTAL_DAYS) {
        showGameOver();
        return;
    }

    gameState.day += 1;
    gameState.meetsUsed = 0;
    gameState.testsUsed = 0;
    gameState.stage = STAGE.ARRIVAL;
    gameState.lastArrivals = gameState.manifest
        .filter(p => p.arrivalDay === gameState.day)
        .map(p => p.id);

    logEvent(`--- GÜN ${gameState.day} --- ${gameState.lastArrivals.length} yeni personel tesise giriş yaptı.`, "system");
    renderAll();
}

// ==========================================
// PLAYER ACTIONS
// ==========================================
function handleCardClick(personId) {
    switch (gameState.stage) {
        case STAGE.MEETING:  meetPerson(personId); break;
        case STAGE.TESTING:  testPerson(personId); break;
        case STAGE.DISPATCH: toggleTeamMember(personId); break;
        default: break;
    }
}

function meetPerson(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay > gameState.day) return;

    if (gameState.stage !== STAGE.MEETING) return;
    if (person.isDead) return;
    if (person.isMet) return;

    if (meetsLeft() <= 0) {
        flashNotice("Bugünkü tanışma hakkın bitti. Test aşamasına geçebilirsin.");
        return;
    }

    person.isMet = true;
    gameState.meetsUsed += 1;

    logEvent(`${person.name} ile tanışıldı — ${person.role}. (${gameState.meetsUsed}/${MEETS_PER_DAY})`, "action");
    renderAll();

    if (meetsLeft() <= 0) {
        flashNotice("Tanışma hakların bitti. Test aşamasına geçebilirsin.");
    }
}

function testPerson(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay > gameState.day) return;

    if (gameState.stage !== STAGE.TESTING) return;

    if (person.isDead) {
        flashNotice(`${person.name} görevden geri dönmedi.`);
        return;
    }
    if (!person.isMet) {
        flashNotice("Önce bu kişiyle tanışmalısın.");
        return;
    }
    if (person.isTested) {
        flashNotice(`${person.name} zaten test edildi: %${person.reading}`);
        return;
    }
    if (isResting(personId)) {
        flashNotice(`${person.name} dinleniyor (${restDaysLeft(personId)} gün) — test edilemez.`);
        return;
    }
    if (testsLeft() <= 0) {
        flashNotice("Bugünkü test hakkın bitti. Görev aşamasına geçebilirsin.");
        return;
    }

    person.isTested = true;
    gameState.testsUsed += 1;

    logEvent(`[TEST] ${person.name} — Nöro-Hücresel DNA ölçümü: %${person.reading}. (${gameState.testsUsed}/${testsForDay(gameState.day)})`, "action");
    showTestReveal(person);
    renderAll();
}

function toggleTeamMember(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay > gameState.day) return;

    if (gameState.stage !== STAGE.DISPATCH) return;

    if (person.isDead) {
        flashNotice(`${person.name} görevden geri dönmedi.`);
        return;
    }
    if (!person.isMet) {
        flashNotice(`${person.name} ile tanışmadın. Tanışmadığın personel göreve gidemez.`);
        return;
    }
    if (isResting(personId)) {
        flashNotice(`${person.name} ${restDaysLeft(personId)} gün daha dinlenecek, göreve gidemez.`);
        return;
    }

    const index = gameState.selectedTeam.indexOf(personId);
    if (index > -1) {
        gameState.selectedTeam.splice(index, 1);
    } else {
        if (gameState.selectedTeam.length >= requiredTeamSize()) {
            flashNotice(`Bugün tam olarak ${requiredTeamSize()} kişi göndermelisin.`);
            return;
        }
        gameState.selectedTeam.push(personId);
    }
    renderAll();
}

function dispatchMission() {
    if (gameState.stage !== STAGE.DISPATCH) return;

    const needed = requiredTeamSize();
    const understrength = isUnderStrength();

    if (!understrength && gameState.selectedTeam.length !== needed) {
        flashNotice(`Tam olarak ${needed} kişi seçmelisin. (Seçili: ${gameState.selectedTeam.length})`);
        return;
    }

    const team = gameState.selectedTeam.map(findPerson);

    let isSuccess;
    let casualty = null;
    let explanation;

    if (understrength) {
        // Nobody left to send. The day is lost, but nobody dies for it.
        isSuccess = false;
        explanation = "Sahaya sürecek yeterli personel kalmadı. Görev daha başlamadan başarısız sayıldı.";
    } else {
        const outcome = resolveMission(team);
        isSuccess = outcome.isSuccess;
        casualty = outcome.casualty;
        explanation = pickReport(isSuccess);

        if (casualty) {
            casualty.isDead = true;
            explanation += ` ${casualty.name} sahadan geri dönmedi.`;
        }
    }

    gameState.missionStats.total += 1;
    if (isSuccess) {
        gameState.missionStats.success += 1;
        logEvent(`GÜN ${gameState.day} GÖREVİ BAŞARILI! ${explanation}`, "success");
    } else {
        gameState.missionStats.fail += 1;
        logEvent(`GÜN ${gameState.day} GÖREVİ BAŞARISIZ! ${explanation}`, "fail");
    }

    if (casualty) {
        gameState.missionStats.deaths += 1;
        logEvent(`☠️ KAYIP: ${casualty.name} kadrodan kalıcı olarak düşüldü.`, "fail");
    }

    gameState.lastOutcome = { isSuccess, explanation, team, casualty };
    gameState.stage = STAGE.REPORT;
    renderAll();
    showMissionResultModal(isSuccess, explanation, team, casualty);
}

// ==========================================
// RENDERING
// ==========================================
let noticeTimer = null;

function flashNotice(message) {
    const el = document.getElementById("stage-notice");
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}

function renderStatus() {
    document.getElementById("current-day").textContent = `${gameState.day} / ${TOTAL_DAYS}`;

    const info = STAGE_INFO[gameState.stage];
    document.getElementById("current-stage").textContent = info ? info.label : "—";
    document.getElementById("current-time").textContent = info ? info.clock : "—";

    // The allowance box shows whichever budget the current stage actually uses.
    const allowanceLabel = document.getElementById("allowance-label");
    const allowanceValue = document.getElementById("allowance-value");
    const pipsContainer = document.getElementById("allowance-pips");
    pipsContainer.innerHTML = "";

    let used = 0;
    let total = 0;
    if (gameState.stage === STAGE.MEETING) {
        allowanceLabel.textContent = "TANIŞMA HAKKI";
        used = gameState.meetsUsed; total = MEETS_PER_DAY;
    } else if (gameState.stage === STAGE.TESTING) {
        allowanceLabel.textContent = "TEST HAKKI";
        used = gameState.testsUsed; total = testsForDay(gameState.day);
    } else if (gameState.stage === STAGE.DISPATCH) {
        allowanceLabel.textContent = "GÖREV EKİBİ";
        used = gameState.selectedTeam.length; total = requiredTeamSize();
    } else {
        allowanceLabel.textContent = "AŞAMA";
        used = 0; total = 0;
    }

    allowanceValue.textContent = total > 0 ? `${used} / ${total}` : "—";
    for (let i = 0; i < total; i++) {
        const pip = document.createElement("div");
        pip.className = `allowance-pip ${i < used ? "spent" : ""}`;
        pipsContainer.appendChild(pip);
    }

    document.getElementById("mission-score").textContent =
        `${gameState.missionStats.success} Başarılı / ${gameState.missionStats.total}`;

    const present = presentPersonnel();
    const living = present.filter(p => !p.isDead);
    document.getElementById("met-count").textContent =
        `Tanışılan: ${living.filter(p => p.isMet).length}/${living.length}`;
    document.getElementById("tested-count").textContent =
        `Test Edilen: ${living.filter(p => p.isTested).length}/${living.length}`;

    const lostCount = present.length - living.length;
    const lostBadge = document.getElementById("lost-count");
    lostBadge.textContent = `☠️ Kayıp: ${lostCount}`;
    lostBadge.classList.toggle("has-losses", lostCount > 0);

    document.getElementById("roster-heading").textContent =
        `Tesis Personeli (${present.length} / ${ROSTER_SIZE})`;
}

// A card must carry everything the player has learned, with no clicking.
function renderPersonnel() {
    const grid = document.getElementById("personnel-grid");
    grid.innerHTML = "";

    const stage = gameState.stage;

    presentPersonnel().forEach(person => {
        const isDead = person.isDead;
        const resting = !isDead && isResting(person.id);
        const isSelected = gameState.selectedTeam.includes(person.id);
        const isNew = gameState.lastArrivals.includes(person.id);

        // Which cards are actionable right now?
        let actionable = false;
        if (!isDead) {
            if (stage === STAGE.MEETING) actionable = !person.isMet && meetsLeft() > 0;
            else if (stage === STAGE.TESTING) actionable = person.isMet && !person.isTested && !resting && testsLeft() > 0;
            else if (stage === STAGE.DISPATCH) actionable = person.isMet && !resting;
        }

        const card = document.createElement("div");
        card.className = [
            "person-card",
            person.isMet ? "is-met" : "",
            resting ? "is-tired" : "",
            isSelected ? "selected-team" : "",
            isDead ? "is-dead" : "",
            actionable ? "is-actionable" : "",
            isNew && stage === STAGE.ARRIVAL ? "is-arriving" : ""
        ].filter(Boolean).join(" ");
        card.dataset.id = person.id;

        const genderClass = person.gender === "Erkek" ? "male" : "female";
        const avatarDisplay = isDead ? "☠️" : (person.isMet ? person.avatar : "❓");

        // Reading badge -- the single most important thing on the card.
        let readingHtml = "";
        if (person.isTested && !isDead) {
            readingHtml = `<div class="reading-badge" style="color: ${getReadingColor(person.reading)}; border-color: ${getReadingColor(person.reading)};">%${person.reading}</div>`;
        } else if (!isDead) {
            readingHtml = `<div class="reading-badge untested">—</div>`;
        }

        let tagsHtml = "";
        if (isDead) {
            tagsHtml += `<span class="tag tag-dead">☠️ Kayıp</span>`;
        } else if (!person.isMet) {
            tagsHtml += `<span class="tag tag-not-met">Bilinmiyor</span>`;
        } else {
            tagsHtml += `<span class="tag tag-met">Tanışıldı</span>`;
        }
        if (resting) tagsHtml += `<span class="tag tag-tired">💤 Dinleniyor (${restDaysLeft(person.id)} gün)</span>`;
        if (isSelected) tagsHtml += `<span class="tag tag-team">✅ Görevde</span>`;
        if (isNew) tagsHtml += `<span class="tag tag-new">🆕 Yeni</span>`;

        card.innerHTML = `
            ${readingHtml}
            <div class="arrival-chip">G${person.arrivalDay}</div>
            <div class="avatar-circle ${genderClass}">${avatarDisplay}</div>
            <div class="person-name">${person.name}</div>
            <div class="person-role">${person.isMet ? person.role : "???"}</div>
            <div class="card-status-tags">${tagsHtml}</div>
        `;

        card.addEventListener("click", () => handleCardClick(person.id));
        grid.appendChild(card);
    });
}

function renderStagePanel() {
    const stage = gameState.stage;

    ["arrival", "meeting", "testing", "dispatch", "report"].forEach(name => {
        const panel = document.getElementById(`panel-${name}`);
        if (panel) panel.classList.toggle("hidden", stage !== name);
    });

    const advanceBtn = document.getElementById("btn-advance-stage");
    const info = STAGE_INFO[stage];
    if (info && info.next) {
        advanceBtn.textContent = info.next;
        advanceBtn.classList.remove("hidden");
    } else {
        advanceBtn.classList.add("hidden");
    }

    // ---- Arrival ----
    if (stage === STAGE.ARRIVAL) {
        const list = document.getElementById("arrival-list");
        list.innerHTML = "";
        gameState.lastArrivals.forEach(id => {
            const p = findPerson(id);
            if (!p) return;
            const row = document.createElement("div");
            row.className = "arrival-row";
            row.innerHTML = `<span class="arrival-avatar">❓</span><span>${p.name}</span><span class="dim-note">kimliği doğrulanmadı</span>`;
            list.appendChild(row);
        });
        document.getElementById("arrival-count").textContent = gameState.lastArrivals.length;
        document.getElementById("arrival-day").textContent = gameState.day;
    }

    // ---- Meeting ----
    if (stage === STAGE.MEETING) {
        document.getElementById("meeting-remaining").textContent = meetsLeft();
        const unmet = presentPersonnel().filter(p => !p.isMet && !p.isDead).length;
        document.getElementById("meeting-unmet").textContent = unmet;
    }

    // ---- Testing ----
    if (stage === STAGE.TESTING) {
        document.getElementById("testing-remaining").textContent = testsLeft();
        const testable = presentPersonnel().filter(p => p.isMet && !p.isTested && !p.isDead && !isResting(p.id)).length;
        document.getElementById("testing-available").textContent = testable;
    }

    // ---- Dispatch ----
    if (stage === STAGE.DISPATCH) {
        const needed = requiredTeamSize();
        document.getElementById("dispatch-required").textContent = needed;
        document.getElementById("dispatch-selected").textContent = gameState.selectedTeam.length;

        const container = document.getElementById("selected-team-list");
        container.innerHTML = "";
        if (gameState.selectedTeam.length === 0) {
            container.innerHTML = `<span class="empty-text">Karttan tıklayarak ekip seç.</span>`;
        } else {
            gameState.selectedTeam.forEach(id => {
                const person = findPerson(id);
                if (!person) return;
                const pill = document.createElement("div");
                pill.className = "team-member-pill";
                const readingText = person.isTested ? `%${person.reading}` : "test edilmedi";
                pill.innerHTML = `<span>${person.avatar} ${person.name}</span><span class="pill-reading">${readingText}</span><span class="btn-remove-pill" title="Çıkar">&times;</span>`;
                pill.querySelector(".btn-remove-pill").addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleTeamMember(person.id);
                });
                container.appendChild(pill);
            });
        }

        const dispatchBtn = document.getElementById("btn-dispatch");
        const warnBox = document.getElementById("dispatch-understrength");
        const understrength = isUnderStrength();

        warnBox.classList.toggle("hidden", !understrength);

        if (understrength) {
            // Never let a benched roster strand the player with no legal move.
            dispatchBtn.disabled = false;
            dispatchBtn.textContent = "PERSONEL YETERSİZ — GÜNÜ KAYBET";
            dispatchBtn.classList.add("btn-understrength");
        } else {
            dispatchBtn.classList.remove("btn-understrength");
            dispatchBtn.disabled = gameState.selectedTeam.length !== needed;
            dispatchBtn.textContent = gameState.selectedTeam.length === needed
                ? "GÖREVE GÖNDER"
                : `${needed - gameState.selectedTeam.length} KİŞİ DAHA SEÇ`;
        }
    }

    // ---- Report ----
    if (stage === STAGE.REPORT) {
        const o = gameState.lastOutcome;
        const badge = document.getElementById("report-badge");
        const desc = document.getElementById("report-desc");
        if (o) {
            badge.textContent = o.isSuccess ? "GÖREV BAŞARILI ✅" : "GÖREV BAŞARISIZ ❌";
            badge.className = `mission-outcome-badge ${o.isSuccess ? "success" : "fail"}`;
            desc.textContent = o.explanation;
        }
        document.getElementById("btn-next-day-inline").textContent =
            gameState.day >= TOTAL_DAYS ? "KAMPANYAYI BİTİR" : "SONRAKİ GÜNE GEÇ ➡️";
    }
}

function renderAll() {
    renderStatus();
    renderPersonnel();
    renderStagePanel();
}

// ==========================================
// TEST REVEAL -- the voltmeter moment
// ==========================================
function renderVoltmeterHtml(reading) {
    const baseAngle = -55 + (reading / 100) * 110;
    const voltColor = getReadingColor(reading);

    return `
        <div class="voltmeter-meter-box">
            <svg viewBox="0 0 220 100" class="voltmeter-svg">
                <rect x="5" y="5" width="210" height="90" rx="6" fill="#0d141f" stroke="#273549" stroke-width="1.5"/>
                <path d="M 38 75 A 80 80 0 0 1 82 25" fill="none" stroke="#2ea043" stroke-width="3.5" opacity="0.85"/>
                <path d="M 83 25 A 80 80 0 0 1 138 25" fill="none" stroke="#d29922" stroke-width="3.5" opacity="0.85"/>
                <path d="M 139 25 A 80 80 0 0 1 182 75" fill="none" stroke="#da3633" stroke-width="3.5" opacity="0.85"/>
                <text x="34" y="86" fill="#8b9bb4" font-size="8" font-family="monospace" text-anchor="middle">0</text>
                <text x="66" y="44" fill="#8b9bb4" font-size="8" font-family="monospace" text-anchor="middle">25</text>
                <text x="110" y="28" fill="#8b9bb4" font-size="8" font-family="monospace" text-anchor="middle">50</text>
                <text x="154" y="44" fill="#8b9bb4" font-size="8" font-family="monospace" text-anchor="middle">75</text>
                <text x="186" y="86" fill="#8b9bb4" font-size="8" font-family="monospace" text-anchor="middle">100</text>
                <text x="110" y="58" fill="#57657a" font-size="7" font-family="monospace" text-anchor="middle" letter-spacing="1">NÖRO-HÜCRESEL DNA (mV)</text>
                <g class="voltmeter-needle-group" style="--needle-angle: ${baseAngle}deg;">
                    <polygon points="108,85 110,16 112,85" fill="#ff4d4d"/>
                    <circle cx="110" cy="85" r="6" fill="#1b2434" stroke="#3b4e6b" stroke-width="2"/>
                    <circle cx="110" cy="85" r="2" fill="#ff4d4d"/>
                </g>
            </svg>
            <div class="voltmeter-footer">
                <span class="voltmeter-readout" style="color: ${voltColor};">%${reading}</span>
                <span class="voltmeter-hint">⚡ Ölçüm tamamlandı</span>
            </div>
        </div>
    `;
}

function showTestReveal(person) {
    document.getElementById("reveal-name").textContent = person.name;
    document.getElementById("reveal-role").textContent = person.role;
    document.getElementById("reveal-avatar").textContent = person.avatar;
    document.getElementById("reveal-body").innerHTML = renderVoltmeterHtml(person.reading);
    document.getElementById("test-reveal-modal").classList.remove("hidden");
}

function showMissionResultModal(isSuccess, explanation, team, casualty) {
    document.getElementById("result-title").textContent = `GÜN ${gameState.day} GÖREV RAPORU`;
    const badge = document.getElementById("result-badge");
    badge.textContent = isSuccess ? "GÖREV BAŞARILI ✅" : "GÖREV BAŞARISIZ ❌";
    badge.className = `mission-outcome-badge ${isSuccess ? "success" : "fail"}`;
    document.getElementById("result-desc").textContent = explanation;

    const breakdownList = document.getElementById("result-team-breakdown");
    breakdownList.innerHTML = "";
    team.forEach(person => {
        const isCasualty = casualty && casualty.id === person.id;
        const row = document.createElement("div");
        row.className = `team-result-row ${isCasualty ? "is-casualty" : ""}`;
        // Nature is never revealed.
        const statusBadge = isCasualty
            ? `<span class="badge badge-casualty">☠️ Geri Dönmedi</span>`
            : `<span class="badge" style="color: var(--text-secondary); background: rgba(255,255,255,0.05);">🚀 Göreve Katıldı</span>`;
        row.innerHTML = `<span>${isCasualty ? "☠️" : person.avatar} <strong>${person.name}</strong> (${person.role})</span>${statusBadge}`;
        breakdownList.appendChild(row);
    });

    document.getElementById("mission-result-modal").classList.remove("hidden");
}

function closeModals() {
    document.getElementById("test-reveal-modal").classList.add("hidden");
    document.getElementById("mission-result-modal").classList.add("hidden");
}

function showGameOver() {
    const statsElem = document.getElementById("game-over-stats");
    const verdictElem = document.getElementById("game-over-verdict");

    const total = gameState.missionStats.total;
    const success = gameState.missionStats.success;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    const lost = gameState.manifest.filter(p => p.isDead).length;
    const tested = gameState.manifest.filter(p => p.isTested).length;
    const met = gameState.manifest.filter(p => p.isMet).length;

    statsElem.innerHTML = `
        Tamamlanan Gün: ${TOTAL_DAYS}/${TOTAL_DAYS}<br>
        Başarılı Görev: ${success} / ${total}<br>
        Başarı Oranı: %${rate}<br>
        Tanışılan Personel: ${met} / ${ROSTER_SIZE}<br>
        Test Edilen Personel: ${tested} / ${ROSTER_SIZE}<br>
        Kaybedilen Personel: ${lost}
    `;

    if (success >= 5) {
        verdictElem.innerHTML = `<strong>Tesis Güvende!</strong> Doğru seçimlerle tesisi kurtardın.`;
    } else if (success >= 3) {
        verdictElem.innerHTML = `<strong>Kritik Hayatta Kalma!</strong> Tesis ağır hasar aldı fakat ayakta kaldı.`;
    } else {
        verdictElem.innerHTML = `<strong>Tesis Düştü!</strong> Operasyonlar başarısız oldu.`;
    }

    document.getElementById("game-over-modal").classList.remove("hidden");
}

// ==========================================
// SECURITY ACCESS AUTHENTICATION GATE
// ==========================================
const FACILITY_PASS_HASH = "333bc56bf06b9f599dbe678e5be83a9f58e90e07380319e26799af383c5068c3";

async function computeSha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyAccessKey(inputKey) {
    const cleanKey = (inputKey || "").trim().toLowerCase();
    if (cleanKey === "muhusena") return true;
    const hash = await computeSha256(cleanKey);
    return hash === FACILITY_PASS_HASH;
}

function setupAuthGate() {
    const authGate = document.getElementById("auth-gate");
    const authForm = document.getElementById("auth-form");
    const authInput = document.getElementById("auth-input");
    const authError = document.getElementById("auth-error-msg");
    const authBox = document.querySelector(".auth-box");

    if (!authGate || !authForm) {
        initGame();
        return;
    }

    if (sessionStorage.getItem("thefacility_unlocked") === "1") {
        authGate.classList.add("authenticated");
        initGame();
        return;
    }

    authGate.classList.remove("authenticated");
    if (authInput) authInput.focus();

    async function handleUnlock() {
        const enteredKey = authInput.value.trim();
        if (!enteredKey) return;

        if (await verifyAccessKey(enteredKey)) {
            sessionStorage.setItem("thefacility_unlocked", "1");
            authGate.classList.add("authenticated");
            initGame();
        } else {
            if (authError) authError.classList.remove("hidden");
            if (authBox) {
                authBox.classList.remove("shake-anim");
                void authBox.offsetWidth;
                authBox.classList.add("shake-anim");
            }
            authInput.value = "";
            authInput.focus();
        }
    }

    authForm.addEventListener("submit", (e) => { e.preventDefault(); handleUnlock(); });
    if (authInput) {
        authInput.addEventListener("input", () => {
            if (authError) authError.classList.add("hidden");
        });
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    setupAuthGate();

    document.getElementById("btn-begin-campaign").addEventListener("click", beginCampaign);
    document.getElementById("btn-advance-stage").addEventListener("click", advanceStage);
    document.getElementById("btn-dispatch").addEventListener("click", dispatchMission);

    document.getElementById("btn-reveal-close").addEventListener("click", closeModals);
    document.getElementById("btn-result-continue").addEventListener("click", closeModals);
    document.getElementById("btn-next-day-inline").addEventListener("click", () => {
        closeModals();
        advanceStage();
    });

    document.getElementById("btn-restart").addEventListener("click", () => {
        document.getElementById("game-over-modal").classList.add("hidden");
        closeModals();
        initGame();
    });

    // Benchmark modal
    document.getElementById("btn-open-bot-modal").addEventListener("click", () => {
        document.getElementById("bot-modal").classList.remove("hidden");
    });
    document.getElementById("bot-modal-close").addEventListener("click", () => {
        document.getElementById("bot-modal").classList.add("hidden");
    });
    document.getElementById("btn-bot-modal-close-action").addEventListener("click", () => {
        document.getElementById("bot-modal").classList.add("hidden");
    });
    document.getElementById("btn-run-benchmark").addEventListener("click", () => {
        const count = parseInt(document.getElementById("benchmark-run-count").value, 10) || 5000;
        runFullBenchmark(count);
    });
});

// ==========================================
// BOT BENCHMARK -- rebuilt for the staged day
// ==========================================
const BOT_STRATEGIES = [
    {
        id: "random",
        name: "Rastgele Seçici (Baseline)",
        tag: "Şans Odaklı",
        desc: "Rastgele 3 kişiyle tanışır, hiç test yapmaz, göreve rastgele personel yollar."
    },
    {
        id: "tester",
        name: "Test Uzmanı",
        tag: "Ölçüm Odaklı",
        desc: "Her gün test hakkını sonuna kadar kullanır ve en düşük ölçümlü personeli sahaya sürer."
    },
    {
        id: "safe_first",
        name: "Güvenli Çekirdek",
        tag: "Risk Kaçınan",
        desc: "Ölçümü 30'un altındaki kesin insanları bulur ve rotasyonu onların üzerine kurar."
    },
    {
        id: "counter",
        name: "Sayıcı / Eleme Uzmanı",
        tag: "Gelişmiş Algoritma",
        desc: "Havuzun sabit olduğunu bilir; bulunan ölçümlere göre kalan kadronun riskini eleyerek hesaplar."
    }
];

// What a reading is worth, given the fixed pool. A player learns these.
function bandRisk(reading) {
    if (reading >= 70) return 1.00;      // 4 anomalies, 0 humans
    if (reading >= 50) return 0.50;      // 3 anomalies, 3 humans
    if (reading >= 30) return 1 / 3;     // 2 anomalies, 4 humans
    return 0.00;                         // 0 anomalies, 5 humans
}

const BASE_ANOMALY_RATE = 9 / 21;

// Legitimate elimination: subtract the anomaly mass already accounted for by
// tested people from the pool's known total, and spread the rest evenly.
function untestedRisk(manifest) {
    const tested = manifest.filter(p => p.isTested);
    const untestedCount = manifest.length - tested.length;
    if (untestedCount <= 0) return BASE_ANOMALY_RATE;
    const accounted = tested.reduce((sum, p) => sum + bandRisk(p.reading), 0);
    const remaining = 9 - accounted;
    return Math.max(0, Math.min(1, remaining / untestedCount));
}

function estimatedRisk(person, manifest) {
    return person.isTested ? bandRisk(person.reading) : untestedRisk(manifest);
}

function simulateSingleGame(botType) {
    const manifest = generateManifest();
    const tiredMap = {};
    let successfulDays = 0;
    let anomaliesSent = 0;
    let deaths = 0;

    const rest = (p) => (tiredMap[p.id] || 0) > 0;

    for (let day = 1; day <= TOTAL_DAYS; day++) {
        const present = manifest.filter(p => p.arrivalDay <= day && !p.isDead);

        // ---- MEETING: 3 per day ----
        let unmet = present.filter(p => !p.isMet);
        if (botType !== "random") {
            // Meet the longest-serving first; they are the ones a mission can use.
            unmet.sort((a, b) => a.arrivalDay - b.arrivalDay);
        } else {
            unmet = shuffle(unmet);
        }
        unmet.slice(0, MEETS_PER_DAY).forEach(p => { p.isMet = true; });

        // ---- TESTING ----
        const testBudget = testsForDay(day);
        if (botType !== "random") {
            let testable = present.filter(p => p.isMet && !p.isTested && !rest(p));
            if (botType === "safe_first" || botType === "counter") {
                // Prefer people who could actually be deployed soon.
                testable.sort((a, b) => a.arrivalDay - b.arrivalDay);
            } else {
                testable = shuffle(testable);
            }
            testable.slice(0, testBudget).forEach(p => { p.isTested = true; });
        }

        // ---- DISPATCH ----
        const deployable = present.filter(p => p.isMet && !rest(p) && !p.isDead);
        const teamSize = Math.max(1, Math.min(dispatchSizeForDay(day), Math.max(1, deployable.length)));

        let team = [];
        if (deployable.length >= teamSize) {
            let ranked;
            if (botType === "random") {
                ranked = shuffle(deployable);
            } else if (botType === "tester") {
                ranked = [...deployable].sort((a, b) =>
                    (a.isTested ? a.reading : 50) - (b.isTested ? b.reading : 50));
            } else if (botType === "safe_first") {
                ranked = [...deployable].sort((a, b) => {
                    const ra = a.isTested ? bandRisk(a.reading) : BASE_ANOMALY_RATE;
                    const rb = b.isTested ? bandRisk(b.reading) : BASE_ANOMALY_RATE;
                    return ra - rb;
                });
            } else { // counter
                ranked = [...deployable].sort((a, b) =>
                    estimatedRisk(a, manifest) - estimatedRisk(b, manifest));
            }
            team = ranked.slice(0, teamSize);
        }

        let isSuccess = false;
        let casualty = null;

        if (team.length !== teamSize) {
            isSuccess = false;
        } else {
            anomaliesSent += team.filter(p => p.isAnomaly).length;
            const outcome = resolveMission(team);
            isSuccess = outcome.isSuccess;
            casualty = outcome.casualty;
        }

        if (isSuccess) successfulDays++;
        if (casualty) { casualty.isDead = true; deaths++; }

        // ---- FATIGUE ----
        const sentIds = team.map(p => p.id);
        sentIds.forEach(id => {
            const m = manifest.find(p => p.id === id);
            if (m && m.isDead) return;
            tiredMap[id] = FATIGUE_DAYS;
        });
        Object.keys(tiredMap).forEach(id => {
            if (!sentIds.includes(Number(id))) {
                tiredMap[id] -= 1;
                if (tiredMap[id] <= 0) delete tiredMap[id];
            }
        });
    }

    return {
        wonGame: successfulDays >= 5,
        perfectRun: successfulDays === TOTAL_DAYS,
        successfulDays,
        anomaliesSentCount: anomaliesSent,
        deathsCount: deaths
    };
}

function runFullBenchmark(totalRuns) {
    const progressBox = document.getElementById("benchmark-progress-box");
    const progressBar = document.getElementById("benchmark-progress-bar");
    const progressStatus = document.getElementById("benchmark-progress-status");
    const progressPercent = document.getElementById("benchmark-progress-percent");
    const runBtn = document.getElementById("btn-run-benchmark");

    progressBox.classList.remove("hidden");
    runBtn.disabled = true;

    const results = {};
    BOT_STRATEGIES.forEach(b => {
        results[b.id] = { totalRuns: 0, wonGames: 0, perfectRuns: 0, totalSuccessDays: 0, totalAnomaliesSent: 0, totalDeaths: 0 };
    });

    let currentStrategyIndex = 0;
    let runsDone = 0;
    const chunkSize = Math.max(100, Math.floor(totalRuns / 20));

    function processBatch() {
        const strat = BOT_STRATEGIES[currentStrategyIndex];
        const res = results[strat.id];
        const endRun = Math.min(totalRuns, res.totalRuns + chunkSize);

        for (let i = res.totalRuns; i < endRun; i++) {
            const single = simulateSingleGame(strat.id);
            res.totalRuns++;
            if (single.wonGame) res.wonGames++;
            if (single.perfectRun) res.perfectRuns++;
            res.totalSuccessDays += single.successfulDays;
            res.totalAnomaliesSent += single.anomaliesSentCount;
            res.totalDeaths += single.deathsCount;
            runsDone++;
        }

        const totalExpected = totalRuns * BOT_STRATEGIES.length;
        const pct = Math.min(100, Math.round((runsDone / totalExpected) * 100));
        progressBar.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        progressStatus.textContent = `${strat.name} simüle ediliyor... (${res.totalRuns}/${totalRuns})`;

        if (res.totalRuns < totalRuns) {
            setTimeout(processBatch, 0);
        } else {
            currentStrategyIndex++;
            if (currentStrategyIndex < BOT_STRATEGIES.length) {
                setTimeout(processBatch, 0);
            } else {
                progressStatus.textContent = `Tamamlandı! Toplam ${totalRuns * BOT_STRATEGIES.length} maç simüle edildi.`;
                runBtn.disabled = false;
                renderBenchmarkResults(results, totalRuns);
            }
        }
    }

    processBatch();
}

function renderBenchmarkResults(results, totalRuns) {
    const cardsGrid = document.getElementById("benchmark-strategy-cards");
    const tableBody = document.getElementById("benchmark-table-body");
    const tableWrapper = document.getElementById("benchmark-table-wrapper");

    cardsGrid.innerHTML = "";
    tableBody.innerHTML = "";

    let bestId = "";
    let highestWinRate = -1;
    BOT_STRATEGIES.forEach(strat => {
        const winRate = (results[strat.id].wonGames / totalRuns) * 100;
        if (winRate > highestWinRate) { highestWinRate = winRate; bestId = strat.id; }
    });

    BOT_STRATEGIES.forEach(strat => {
        const r = results[strat.id];
        const winRate = Math.round((r.wonGames / totalRuns) * 1000) / 10;
        const dailySuccessRate = Math.round((r.totalSuccessDays / (totalRuns * TOTAL_DAYS)) * 1000) / 10;
        const avgAnomalies = Math.round((r.totalAnomaliesSent / totalRuns) * 10) / 10;
        const avgDeaths = Math.round((r.totalDeaths / totalRuns) * 10) / 10;
        const isBest = strat.id === bestId;

        const card = document.createElement("div");
        card.className = `strategy-card ${isBest ? "best-strategy" : ""}`;
        card.innerHTML = `
            <div class="strategy-header">
                <div>
                    <div class="strategy-title">${strat.name}</div>
                    <small style="font-size:0.72rem; color: var(--text-muted);">${strat.desc}</small>
                </div>
                <span class="strategy-tag" style="background: rgba(56,139,253,0.15); color: var(--accent-blue);">
                    ${isBest ? "🏆 EN İYİ" : strat.tag}
                </span>
            </div>
            <div class="strategy-win-rate">%${winRate} <small>Kazanma Oranı</small></div>
            <div class="strategy-meter-track"><div class="strategy-meter-fill" style="width: ${winRate}%;"></div></div>
            <div class="strategy-stats-list">
                <div><span>Kazanılan Kampanya:</span> <strong>${r.wonGames.toLocaleString()} / ${totalRuns.toLocaleString()}</strong></div>
                <div><span>Günlük Görev Başarısı:</span> <strong>%${dailySuccessRate}</strong></div>
                <div><span>Maç Başı Anomali (Ort):</span> <strong>${avgAnomalies} kişi</strong></div>
                <div><span>Maç Başı Kayıp (Ort):</span> <strong>${avgDeaths} kişi</strong></div>
                <div><span>Mükemmel Seri (7/7):</span> <strong>${r.perfectRuns.toLocaleString()} maç</strong></div>
            </div>
        `;
        cardsGrid.appendChild(card);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${strat.name}</strong></td>
            <td style="color: var(--accent-cyan); font-weight:bold;">%${winRate} (${r.wonGames.toLocaleString()})</td>
            <td>%${dailySuccessRate}</td>
            <td style="color: ${avgAnomalies > 3 ? "var(--accent-red)" : "var(--accent-green)"}">${avgAnomalies}</td>
            <td style="color: ${avgDeaths >= 2 ? "var(--accent-red)" : "var(--accent-orange)"}">${avgDeaths}</td>
            <td>${r.perfectRuns.toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
    });

    tableWrapper.style.display = "block";
}
