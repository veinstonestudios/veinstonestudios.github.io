// THE FACILITY -- V4 (STAGED DAY / ARRIVING ROSTER)
//
// V4 replaces the free-form day with three gated stages, grows the roster from
// 4 people to 21 across the campaign, and deals every indicator reading from a
// fixed pool at campaign start instead of sampling it at scan time.

const TOTAL_DAYS = 7;
const FATIGUE_DAYS = 2;      // two days of rest after a mission
const ROSTER_SIZE = 21;      // 12 humans + 9 anomalies, all arriving on schedule

// ---- Electric chair -----------------------------------------------------
// Unlocks on day 3. Day 2 is a bad home for it: the roster is only 6 people,
// exactly half of them anomalies, and the player has had at most 3 tests.
const EXECUTION_START_DAY = 3;
const EXECUTIONS_PER_DAY = 1;

// ---- Anomaly riot -------------------------------------------------------
// The anomalies rise the moment they outnumber the humans.
//
// This CANNOT be checked before day 3. The scripted arrivals put the facility
// at exactly 3 humans / 3 anomalies on day 2 in every single run, and one
// day-1 mission casualty (40% likely when you correctly send a human) makes it
// 2H/3A. Checking earlier would instant-lose a blameless run.
const RIOT_START_DAY = 3;

// ---- Government oversight -----------------------------------------------
const MAX_MISSION_FAILURES = 3;

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
    INTRO:     "intro",
    ARRIVAL:   "arrival",
    MEETING:   "meeting",
    TESTING:   "testing",
    EXECUTION: "execution",
    DISPATCH:  "dispatch",
    REPORT:    "report"
};

const STAGE_INFO = {
    arrival:   { label: "PERSONEL GİRİŞİ", clock: "08:00", next: "TANIŞMA AŞAMASINA GEÇ" },
    meeting:   { label: "TANIŞMA",         clock: "09:00", next: "TEST AŞAMASINA GEÇ" },
    testing:   { label: "TEST",            clock: "13:00", next: null },
    execution: { label: "İNFAZ",           clock: "15:00", next: "GÖREV AŞAMASINA GEÇ" },
    dispatch:  { label: "GÖREV SEVKİ",     clock: "16:00", next: null },
    report:    { label: "GÜN RAPORU",      clock: "18:00", next: null }
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
    executionsUsed: 0,
    endReason: null,
    day3BriefingShown: false,
    selectedTeam: [],
    tiredMap: {},
    missionStats: { success: 0, fail: 0, total: 0, deaths: 0 },
    lastArrivals: [],
    newlyInterred: [],
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

// ---- Facility balance ---------------------------------------------------
function livingCounts() {
    const living = presentPersonnel().filter(p => !p.isDead);
    const anomalies = living.filter(p => p.isAnomaly).length;
    return { humans: living.length - anomalies, anomalies, total: living.length };
}

// The riot fires the instant anomalies outnumber humans among the living.
function isRiotCondition() {
    if (gameState.day < RIOT_START_DAY) return false;
    const c = livingCounts();
    return c.anomalies > c.humans;
}

// Coarse threat readout. Deliberately bucketed rather than showing exact
// counts -- the player must feel the pressure without being handed the roster.
function threatLevel() {
    const c = livingCounts();
    const gap = c.humans - c.anomalies;
    if (gameState.day < RIOT_START_DAY) return { label: "İZLENİYOR", color: "var(--text-muted)", key: "watch" };
    if (gap <= 1) return { label: "KRİTİK", color: "var(--accent-red)", key: "critical" };
    if (gap <= 3) return { label: "GERGİN", color: "var(--accent-orange)", key: "tense" };
    return { label: "STABİL", color: "var(--accent-green)", key: "stable" };
}

function executionsLeft() {
    return EXECUTIONS_PER_DAY - gameState.executionsUsed;
}

function canExecuteToday() {
    return gameState.day >= EXECUTION_START_DAY;
}

// Checked after anything that changes the living roster or the mission record.
// Returns true when the campaign has ended.
function checkCatastrophe() {
    if (gameState.endReason) return true;

    if (isRiotCondition()) {
        gameState.endReason = "riot";
        logEvent("⚡ ANOMALİ AYAKLANMASI! Anomaliler insanları sayıca geçti ve tesisi ele geçirdi.", "fail");
        showGameOver("riot");
        return true;
    }

    if (gameState.missionStats.fail >= MAX_MISSION_FAILURES) {
        gameState.endReason = "fired";
        logEvent("🏛️ DEVLET MÜDAHALESİ! Üç başarısız görev sonrası görevden alındın.", "fail");
        showGameOver("fired");
        return true;
    }

    return false;
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
        executionsUsed: 0,
        endReason: null,
        day3BriefingShown: false,
        selectedTeam: [],
        tiredMap: {},
        missionStats: { success: 0, fail: 0, total: 0, deaths: 0 },
        lastArrivals: [],
        newlyInterred: [],
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
            // The hand-off animation belongs to the arrival beat only; clearing
            // it here stops later re-renders from replaying it all day.
            gameState.newlyInterred = [];
            gameState.stage = STAGE.MEETING;
            logEvent(`Tanışma aşaması açıldı. Bugün ${MEETS_PER_DAY} kişiyle tanışabilirsin.`, "system");
            break;

        case STAGE.MEETING:
            gameState.stage = STAGE.TESTING;
            logEvent(`Test aşaması açıldı. Bugün ${testsForDay(gameState.day)} test hakkın var.`, "system");
            break;

        case STAGE.TESTING:
            if (canExecuteToday()) {
                gameState.stage = STAGE.EXECUTION;
                logEvent("İnfaz aşaması açıldı. Elektrikli sandalye kullanıma hazır.", "system");
            } else {
                gameState.stage = STAGE.DISPATCH;
                logEvent(`Görev sevki açıldı. Bugün ${requiredTeamSize()} kişi göndermelisin.`, "system");
            }
            break;

        case STAGE.EXECUTION:
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
    gameState.executionsUsed = 0;
    gameState.stage = STAGE.ARRIVAL;
    gameState.lastArrivals = gameState.manifest
        .filter(p => p.arrivalDay === gameState.day)
        .map(p => p.id);

    // Yesterday's losses are carried down to the records section this morning,
    // with an animation so the player sees exactly who left the roster.
    gameState.newlyInterred = gameState.manifest
        .filter(p => p.isDead && p.diedOnDay === gameState.day - 1)
        .map(p => p.id);

    logEvent(`--- GÜN ${gameState.day} --- ${gameState.lastArrivals.length} yeni personel tesise giriş yaptı.`, "system");
    renderAll();

    // New arrivals can themselves tip the balance into a riot.
    if (checkCatastrophe()) return;

    // Day 3 introduces two systems at once: the facility gauge appears in the
    // header and the chair unlocks later the same day. Explain both here.
    if (gameState.day === RIOT_START_DAY && !gameState.day3BriefingShown) {
        gameState.day3BriefingShown = true;
        document.getElementById("day3-briefing-modal").classList.remove("hidden");
    }
}

// ==========================================
// PLAYER ACTIONS
// ==========================================
function handleCardClick(personId) {
    switch (gameState.stage) {
        case STAGE.MEETING:   meetPerson(personId); break;
        case STAGE.TESTING:   testPerson(personId); break;
        case STAGE.EXECUTION: executePerson(personId); break;
        case STAGE.DISPATCH:  toggleTeamMember(personId); break;
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

// ---- ELECTRIC CHAIR ----------------------------------------------------
// Kills one person per day from day 3. Removing an anomaly relieves riot
// pressure; removing a human makes it worse and costs a mission asset.
function executePerson(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay > gameState.day) return;
    if (gameState.stage !== STAGE.EXECUTION) return;

    if (person.isDead) {
        flashNotice(`${person.name} zaten kadrodan düştü.`);
        return;
    }
    if (!person.isMet) {
        flashNotice(`${person.name} ile tanışmadın. Kimliği doğrulanmamış personel infaz edilemez.`);
        return;
    }
    if (executionsLeft() <= 0) {
        flashNotice("Bugünkü infaz hakkın bitti. Görev aşamasına geçebilirsin.");
        return;
    }

    person.isDead = true;
    person.isExecuted = true;
    person.diedOnDay = gameState.day;
    gameState.executionsUsed += 1;
    gameState.missionStats.executions = (gameState.missionStats.executions || 0) + 1;

    if (person.isAnomaly) {
        gameState.missionStats.anomaliesPurged = (gameState.missionStats.anomaliesPurged || 0) + 1;
        logEvent(`⚡ İNFAZ: ${person.name} elektrikli sandalyeye oturtuldu. Doku çözüldü — ANOMALİ doğrulandı.`, "success");
    } else {
        gameState.missionStats.humansExecuted = (gameState.missionStats.humansExecuted || 0) + 1;
        logEvent(`⚡ İNFAZ: ${person.name} elektrikli sandalyeye oturtuldu. Tamamen İNSANDI.`, "fail");
    }

    // Remove them from any pending selection.
    const idx = gameState.selectedTeam.indexOf(personId);
    if (idx > -1) gameState.selectedTeam.splice(idx, 1);

    showExecutionReveal(person);
    renderAll();
    checkCatastrophe();
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
            casualty.diedOnDay = gameState.day;
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

    // A lost human can tip the balance, and a third failure ends the contract.
    if (checkCatastrophe()) return;

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
    } else if (gameState.stage === STAGE.EXECUTION) {
        allowanceLabel.textContent = "İNFAZ HAKKI";
        used = gameState.executionsUsed; total = EXECUTIONS_PER_DAY;
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

    // Failure counter -- three ends the contract.
    const failEl = document.getElementById("failure-count");
    const fails = gameState.missionStats.fail;
    failEl.textContent = `${fails} / ${MAX_MISSION_FAILURES}`;
    failEl.className = "stat-value " + (fails >= MAX_MISSION_FAILURES - 1 ? "danger" : fails > 0 ? "warn" : "");

    // Riot pressure -- bucketed, never exact counts. Hidden entirely before
    // day 3, since riots cannot happen yet and an inert gauge only confuses.
    const threatBox = document.getElementById("threat-box");
    if (gameState.day < RIOT_START_DAY) {
        threatBox.classList.add("hidden");
    } else {
        threatBox.classList.remove("hidden");
        const threat = threatLevel();
        const threatEl = document.getElementById("threat-level");
        threatEl.textContent = threat.label;
        threatEl.style.color = threat.color;
        threatBox.className = "stat-box threat-box threat-" + threat.key;
    }

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
// A person stays on the active roster for the remainder of the day they die,
// so the loss reads in context. They are carried down to the records section
// the next morning.
function isInterred(person) {
    return person.isDead && person.diedOnDay !== undefined && person.diedOnDay < gameState.day;
}

function buildRosterCard(person, stage) {
    const isDead = person.isDead;
    const resting = !isDead && isResting(person.id);
    const isSelected = gameState.selectedTeam.includes(person.id);
    const isNew = gameState.lastArrivals.includes(person.id);

    let actionable = false;
    if (!isDead) {
        if (stage === STAGE.MEETING) actionable = !person.isMet && meetsLeft() > 0;
        else if (stage === STAGE.TESTING) actionable = person.isMet && !person.isTested && !resting && testsLeft() > 0;
        else if (stage === STAGE.EXECUTION) actionable = person.isMet && executionsLeft() > 0;
        else if (stage === STAGE.DISPATCH) actionable = person.isMet && !resting;
    }

    const card = document.createElement("div");
    card.className = [
        "person-card",
        person.isMet ? "is-met" : "",
        resting ? "is-tired" : "",
        isSelected ? "selected-team" : "",
        isDead ? "is-dead" : "",
        person.isExecuted ? "is-executed" : "",
        isDead ? "is-departing" : "",
        actionable ? (stage === STAGE.EXECUTION ? "is-executable" : "is-actionable") : "",
        isNew && stage === STAGE.ARRIVAL ? "is-arriving" : ""
    ].filter(Boolean).join(" ");
    card.dataset.id = person.id;

    const genderClass = person.gender === "Erkek" ? "male" : "female";
    const avatarDisplay = person.isExecuted ? "⚡" : (isDead ? "☠️" : (person.isMet ? person.avatar : "❓"));

    let readingHtml = "";
    if (person.isTested && !isDead) {
        readingHtml = `<div class="reading-badge" style="color: ${getReadingColor(person.reading)}; border-color: ${getReadingColor(person.reading)};">%${person.reading}</div>`;
    } else if (!isDead) {
        readingHtml = `<div class="reading-badge untested">—</div>`;
    }

    let tagsHtml = "";
    if (person.isExecuted) {
        tagsHtml += person.isAnomaly
            ? `<span class="tag tag-verified-anomaly">⚡ ANOMALİYDİ</span>`
            : `<span class="tag tag-verified-human">⚡ İNSANDI</span>`;
    } else if (isDead) {
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
    return card;
}

// Compact record card -- these are history, not choices.
function buildRecordCard(person, arrivingIndex) {
    const card = document.createElement("div");
    const isArriving = arrivingIndex >= 0;

    card.className = [
        "record-card",
        person.isExecuted ? "record-executed" : "record-lost",
        person.isAnomaly ? "record-anomaly" : "record-human",
        isArriving ? "record-arriving" : ""
    ].filter(Boolean).join(" ");
    card.dataset.id = person.id;

    if (isArriving) {
        // Stagger so multiple losses read one at a time.
        card.style.animationDelay = `${arrivingIndex * 260}ms`;
    }

    // Everything down here is confirmed: executions reveal the nature outright,
    // and only humans ever die on a mission.
    const verdict = person.isAnomaly
        ? `<span class="record-verdict verdict-was-anomaly">ANOMALİ</span>`
        : `<span class="record-verdict verdict-was-human">İNSAN</span>`;

    const cause = person.isExecuted
        ? `<span class="record-cause">⚡ İnfaz</span>`
        : `<span class="record-cause">☠️ Sahada</span>`;

    card.innerHTML = `
        <div class="record-avatar">${person.isExecuted ? "⚡" : "☠️"}</div>
        <div class="record-body">
            <div class="record-name">${person.name}</div>
            <div class="record-meta">${cause}<span class="record-day">G${person.diedOnDay}</span></div>
        </div>
        ${verdict}
    `;
    return card;
}

function renderPersonnel() {
    const grid = document.getElementById("personnel-grid");
    const records = document.getElementById("records-grid");
    const recordsSection = document.getElementById("records-section");
    grid.innerHTML = "";
    records.innerHTML = "";

    const stage = gameState.stage;
    const present = presentPersonnel();

    const active = present.filter(p => !isInterred(p));
    const interred = present.filter(isInterred);

    active.forEach(person => grid.appendChild(buildRosterCard(person, stage)));

    if (interred.length === 0) {
        recordsSection.classList.add("hidden");
    } else {
        recordsSection.classList.remove("hidden");

        // Newest losses first, so the fresh ones are easy to find.
        const ordered = [...interred].sort((a, b) => (b.diedOnDay || 0) - (a.diedOnDay || 0));
        let arrivingSeen = 0;
        ordered.forEach(person => {
            const isArriving = gameState.newlyInterred.includes(person.id);
            records.appendChild(buildRecordCard(person, isArriving ? arrivingSeen++ : -1));
        });

        const purged = interred.filter(p => p.isAnomaly).length;
        const lost = interred.length - purged;
        document.getElementById("records-summary").innerHTML =
            `<span class="records-stat anomaly">${purged} anomali imha edildi</span>` +
            `<span class="records-stat human">${lost} insan kaybedildi</span>`;
    }
}

function renderStagePanel() {
    const stage = gameState.stage;

    ["arrival", "meeting", "testing", "execution", "dispatch", "report"].forEach(name => {
        const panel = document.getElementById(`panel-${name}`);
        if (panel) panel.classList.toggle("hidden", stage !== name);
    });

    const advanceBtn = document.getElementById("btn-advance-stage");
    const info = STAGE_INFO[stage];
    if (stage === STAGE.TESTING) {
        advanceBtn.textContent = canExecuteToday() ? "İNFAZ AŞAMASINA GEÇ" : "GÖREV AŞAMASINA GEÇ";
        advanceBtn.classList.remove("hidden");
    } else if (info && info.next) {
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

    // ---- Execution ----
    if (stage === STAGE.EXECUTION) {
        document.getElementById("execution-remaining").textContent = executionsLeft();
        const eligible = presentPersonnel().filter(p => p.isMet && !p.isDead).length;
        document.getElementById("execution-eligible").textContent = eligible;

        const threat = threatLevel();
        const box = document.getElementById("execution-threat");
        box.textContent = `TESİS DURUMU: ${threat.label}`;
        box.style.color = threat.color;
        box.style.borderColor = threat.color;
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

function showExecutionReveal(person) {
    const modal = document.getElementById("execution-reveal-modal");
    const verdict = document.getElementById("execution-verdict");
    const body = document.getElementById("execution-reveal-body");

    document.getElementById("execution-reveal-name").textContent = person.name;
    document.getElementById("execution-reveal-role").textContent = person.role;

    if (person.isAnomaly) {
        verdict.textContent = "ANOMALİ DOĞRULANDI";
        verdict.className = "execution-verdict verdict-anomaly";
        body.innerHTML = `
            <p>Akım verildiği anda doku bütünlüğü bozuldu. Deri altındaki yapı insan biyolojisine ait değildi.</p>
            <p class="execution-consequence good">Tesisteki anomali sayısı bir azaldı.</p>
        `;
    } else {
        verdict.textContent = "İNSANDI";
        verdict.className = "execution-verdict verdict-human";
        body.innerHTML = `
            <p>Hiçbir anormallik yok. ${person.name} tamamen insandı ve tesise sadakatle hizmet ediyordu.</p>
            <p class="execution-consequence bad">Bir insan kaybettin. Anomali dengesi senin aleyhine kaydı.</p>
        `;
    }

    modal.classList.remove("hidden");
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
    document.getElementById("execution-reveal-modal").classList.add("hidden");
}

function showGameOver(reason = "complete") {
    gameState.endReason = reason;

    const titleElem = document.getElementById("game-over-title");
    const statsElem = document.getElementById("game-over-stats");
    const verdictElem = document.getElementById("game-over-verdict");
    const card = document.querySelector(".game-over-card");

    const total = gameState.missionStats.total;
    const success = gameState.missionStats.success;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    const counts = livingCounts();
    const purged = gameState.missionStats.anomaliesPurged || 0;
    const wrongful = gameState.missionStats.humansExecuted || 0;
    const lostOnMission = gameState.manifest.filter(p => p.isDead && !p.isExecuted).length;

    statsElem.innerHTML = `
        Ulaşılan Gün: ${gameState.day} / ${TOTAL_DAYS}<br>
        Başarılı Görev: ${success} / ${total} (%${rate})<br>
        Başarısız Görev: ${gameState.missionStats.fail} / ${MAX_MISSION_FAILURES}<br>
        Sahada Kaybedilen İnsan: ${lostOnMission}<br>
        İnfaz Edilen Anomali: ${purged}<br>
        İnfaz Edilen İnsan: ${wrongful}<br>
        Hayatta Kalan: ${counts.humans} insan / ${counts.anomalies} anomali
    `;

    card.classList.remove("ending-riot", "ending-fired", "ending-win", "ending-loss");

    if (reason === "riot") {
        titleElem.textContent = "⚡ ANOMALİ AYAKLANMASI";
        card.classList.add("ending-riot");
        verdictElem.innerHTML = `<strong>Tesis düştü.</strong> Anomaliler insanları sayıca geçti ve
            direnecek kimse kalmadı. Kapılar içeriden mühürlendi.`;
    } else if (reason === "fired") {
        titleElem.textContent = "🏛️ GÖREVDEN ALINDIN";
        card.classList.add("ending-fired");
        verdictElem.innerHTML = `<strong>${MAX_MISSION_FAILURES} başarısız görev.</strong> Devlet denetimi
            tesise el koydu ve yetkin iptal edildi. Yerine başkası atandı.`;
    } else if (success >= 5) {
        titleElem.textContent = "TESİS GÜVENDE";
        card.classList.add("ending-win");
        verdictElem.innerHTML = `<strong>Tesis Güvende!</strong> Doğru seçimlerle tesisi kurtardın.`;
    } else if (success >= 3) {
        titleElem.textContent = "KRİTİK HAYATTA KALMA";
        card.classList.add("ending-loss");
        verdictElem.innerHTML = `<strong>Kritik Hayatta Kalma!</strong> Tesis ağır hasar aldı fakat ayakta kaldı.`;
    } else {
        titleElem.textContent = "TESİS DÜŞTÜ";
        card.classList.add("ending-loss");
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
    document.getElementById("btn-execution-close").addEventListener("click", closeModals);
    document.getElementById("btn-day3-briefing-close").addEventListener("click", () => {
        document.getElementById("day3-briefing-modal").classList.add("hidden");
    });
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
        desc: "Rastgele tanışır, test yapmaz, sandalyeyi hiç kullanmaz, rastgele yollar."
    },
    {
        id: "tester",
        name: "Test Uzmanı",
        tag: "Ölçüm Odaklı",
        desc: "Test hakkını sonuna kadar kullanır, ölçümü 70+ olanları infaz eder, en düşüğü sahaya sürer."
    },
    {
        id: "safe_first",
        name: "Güvenli Çekirdek",
        tag: "Risk Kaçınan",
        desc: "Kesin insanları çekirdek yapar; sadece kanıtlanmış anomalileri (70+) infaz eder."
    },
    {
        id: "counter",
        name: "Sayıcı / Eleme Uzmanı",
        tag: "Gelişmiş Algoritma",
        desc: "Ayaklanma baskısını izler; baskı yükselince şüphelileri (50+) de infaz etmeyi göze alır."
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
    let failures = 0;
    let anomaliesSent = 0;
    let deaths = 0;
    let purged = 0;
    let wrongfulExecutions = 0;
    let endReason = "complete";
    let daysReached = 0;

    const rest = (p) => (tiredMap[p.id] || 0) > 0;
    const livingOn = (day) => manifest.filter(p => p.arrivalDay <= day && !p.isDead);

    const riotOn = (day) => {
        if (day < RIOT_START_DAY) return false;
        const living = livingOn(day);
        const a = living.filter(p => p.isAnomaly).length;
        return a > living.length - a;
    };

    const gapOn = (day) => {
        const living = livingOn(day);
        const a = living.filter(p => p.isAnomaly).length;
        return (living.length - a) - a;
    };

    for (let day = 1; day <= TOTAL_DAYS; day++) {
        daysReached = day;

        // Arrivals can themselves tip the balance.
        if (riotOn(day)) { endReason = "riot"; break; }

        const present = manifest.filter(p => p.arrivalDay <= day && !p.isDead);

        // ---- MEETING ----
        let unmet = present.filter(p => !p.isMet);
        unmet = botType === "random" ? shuffle(unmet) : unmet.sort((a, b) => a.arrivalDay - b.arrivalDay);
        unmet.slice(0, MEETS_PER_DAY).forEach(p => { p.isMet = true; });

        // ---- TESTING ----
        if (botType !== "random") {
            let testable = present.filter(p => p.isMet && !p.isTested && !rest(p));
            testable = (botType === "tester") ? shuffle(testable) : testable.sort((a, b) => a.arrivalDay - b.arrivalDay);
            testable.slice(0, testsForDay(day)).forEach(p => { p.isTested = true; });
        }

        // ---- EXECUTION (day 3+) ----
        if (day >= EXECUTION_START_DAY && botType !== "random") {
            const candidates = manifest.filter(p => p.arrivalDay <= day && !p.isDead && p.isMet && p.isTested);
            let target = null;

            // Everyone acts on a proven anomaly.
            const proven = candidates.filter(p => p.reading >= 70).sort((a, b) => b.reading - a.reading);
            if (proven.length) {
                target = proven[0];
            } else if (botType === "counter" && gapOn(day) <= 2) {
                // Under pressure, gamble on a coin-flip suspect.
                const suspects = candidates.filter(p => p.reading >= 50).sort((a, b) => b.reading - a.reading);
                if (suspects.length) target = suspects[0];
            }

            if (target) {
                target.isExecuted = true;
                target.isDead = true;
                if (target.isAnomaly) purged++; else wrongfulExecutions++;
                if (riotOn(day)) { endReason = "riot"; break; }
            }
        }

        // ---- DISPATCH ----
        const deployable = manifest.filter(p => p.arrivalDay <= day && !p.isDead && p.isMet && !rest(p));
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
            } else {
                ranked = [...deployable].sort((a, b) =>
                    estimatedRisk(a, manifest) - estimatedRisk(b, manifest));
            }
            team = ranked.slice(0, teamSize);
        }

        let isSuccess = false;
        let casualty = null;

        if (team.length !== teamSize) {
            isSuccess = false;   // under strength -- automatic loss, nobody dies
        } else {
            anomaliesSent += team.filter(p => p.isAnomaly).length;
            const outcome = resolveMission(team);
            isSuccess = outcome.isSuccess;
            casualty = outcome.casualty;
        }

        if (isSuccess) successfulDays++; else failures++;
        if (casualty) { casualty.isDead = true; deaths++; }

        // Losing a human can trigger the riot; three failures ends the contract.
        if (riotOn(day)) { endReason = "riot"; break; }
        if (failures >= MAX_MISSION_FAILURES) { endReason = "fired"; break; }

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
        wonGame: endReason === "complete" && successfulDays >= 5,
        perfectRun: endReason === "complete" && successfulDays === TOTAL_DAYS,
        successfulDays,
        failures,
        anomaliesSentCount: anomaliesSent,
        deathsCount: deaths,
        purged,
        wrongfulExecutions,
        endReason,
        daysReached
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
        results[b.id] = { totalRuns: 0, wonGames: 0, perfectRuns: 0, totalSuccessDays: 0,
                          totalAnomaliesSent: 0, totalDeaths: 0, riots: 0, fired: 0, totalPurged: 0 };
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
            res.totalPurged += single.purged;
            if (single.endReason === "riot") res.riots++;
            if (single.endReason === "fired") res.fired++;
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
        const riotRate = Math.round((r.riots / totalRuns) * 1000) / 10;
        const firedRate = Math.round((r.fired / totalRuns) * 1000) / 10;
        const avgPurged = Math.round((r.totalPurged / totalRuns) * 10) / 10;
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
                <div><span>İnfaz Edilen Anomali (Ort):</span> <strong>${avgPurged} kişi</strong></div>
                <div><span>Ayaklanma ile Biten:</span> <strong>%${riotRate}</strong></div>
                <div><span>Görevden Alınma:</span> <strong>%${firedRate}</strong></div>
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
            <td style="color: var(--accent-red);">%${riotRate}</td>
            <td style="color: var(--accent-orange);">%${firedRate}</td>
            <td>${r.perfectRuns.toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
    });

    tableWrapper.style.display = "block";
}
