// THE FACILITY SIMULATION LOGIC -- V2 (ALTERNATE RULESET)
// Differences from the original: no verdict labels on scans (raw % only),
// and missions can kill the personnel you send.

const TOTAL_DAYS = 7;
const MAX_ENERGY = 20; // 20 Total Daily Energy
const START_HOUR = 9; // 09:00
const END_HOUR = 17;  // 17:00
const FATIGUE_DAYS = 1; // 1 day of fatigue -- deaths already thin the roster
const MEET_ENERGY = 4;  // Meeting costs 4 energy (+2 hours)
const SCAN_ENERGY = 2;  // Each indicator costs 2 energy (+1 hour)

// 14 Characters: 7 Male, 7 Female
const INITIAL_PERSONNEL = [
    // Men (7)
    { id: 1, name: "Dr. Kaya", gender: "Erkek", role: "Baş Araştırmacı", avatar: "👨‍🔬" },
    { id: 2, name: "Murat Çelik", gender: "Erkek", role: "Güvenlik Şefi", avatar: "👮‍♂️" },
    { id: 3, name: "Can Yılmaz", gender: "Erkek", role: "Sistem Mühendisi", avatar: "👨‍💻" },
    { id: 4, name: "Dr. Arda", gender: "Erkek", role: "Tıbbi Sorumlu", avatar: "👨‍⚕️" },
    { id: 5, name: "Burak Demir", gender: "Erkek", role: "Tesis Teknisyeni", avatar: "👷‍♂️" },
    { id: 6, name: "Mert Kurt", gender: "Erkek", role: "Stajyer Biyolog", avatar: "🧑‍🔬" },
    { id: 7, name: "Kerem Aksoy", gender: "Erkek", role: "Muhafız", avatar: "💂‍♂️" },

    // Women (7)
    { id: 8, name: "Asistan Elif", gender: "Kız", role: "Laboratuvar Asistanı", avatar: "👩‍🔬" },
    { id: 9, name: "Dr. Zeynep", gender: "Kız", role: "Genetik Uzmanı", avatar: "👩‍⚕️" },
    { id: 10, name: "Selin Şen", gender: "Kız", role: "Reaktör Teknisyeni", avatar: "👩‍🔧" },
    { id: 11, name: "Psikolog Merve", gender: "Kız", role: "Personel Danışmanı", avatar: "👩‍💼" },
    { id: 12, name: "Derya Aydın", gender: "Kız", role: "Telsiz Operatörü", avatar: "👩‍💻" },
    { id: 13, name: "Kimyager Sinem", gender: "Kız", role: "Toksikolog", avatar: "🧑‍🔬" },
    { id: 14, name: "Aylin Koç", gender: "Kız", role: "Veri Analisti", avatar: "👩‍💼" }
];


// ==========================================
// DUAL ANOMALY INDICATOR PROBABILITY ENGINE
// ==========================================

// Calculates percentage for an indicator (either highly decisive or ambiguous/noisy)
function calculateIndicatorProbability(isAnomaly, indicatorIndex) {
    // 75% decisive reading (very high or very low certainty), 25% ambiguous/noisy
    const isDecisive = Math.random() < 0.75;
    let percentage = 50;
    let certaintyType = isDecisive ? "Yüksek Kesinlik" : "Düşük Kesinlik / Parazit";

    if (isAnomaly) {
        if (isDecisive) {
            // Anomaly decisive: 88% - 99%
            percentage = Math.floor(Math.random() * 12) + 88;
        } else {
            // Anomaly ambiguous: 52% - 66%
            percentage = Math.floor(Math.random() * 15) + 52;
        }
    } else {
        // Human
        if (isDecisive) {
            // Human decisive: 1% - 13%
            percentage = Math.floor(Math.random() * 13) + 1;
        } else {
            // Human ambiguous: 36% - 49%
            percentage = Math.floor(Math.random() * 14) + 36;
        }
    }

    return {
        prob: percentage,
        isDecisive,
        certaintyType
    };
}

function getRiskColor(prob) {
    if (prob <= 35) return "var(--accent-green)";
    if (prob <= 65) return "var(--accent-orange)";
    return "var(--accent-red)";
}

function getRiskGradient(prob) {
    if (prob <= 35) {
        return "linear-gradient(90deg, #238636, #2ea043)";
    } else if (prob <= 65) {
        return "linear-gradient(90deg, #2ea043, #d29922)";
    } else {
        return "linear-gradient(90deg, #d29922, #da3633)";
    }
}

function getPersonCombinedRisk(person) {
    if (!person.scan1 && !person.scan2) return null;
    let combinedProb = 0;
    let count = 0;
    if (person.scan1) { combinedProb += person.scan1.prob; count++; }
    if (person.scan2) { combinedProb += person.scan2.prob; count++; }
    const avgProb = Math.round(combinedProb / count);
    return {
        prob: avgProb,
        scansCount: count
    };
}

// PERSONNEL GENERATION (2 Fixed Humans, 2 Fixed Anomalies per gender, Remaining Random)
function generatePersonnelState() {
    return INITIAL_PERSONNEL.map(p => {
        let isAnomaly;
        // Erkekler: 2 Kesin İnsan (Dr. Kaya: 1, Can Yılmaz: 3)
        //          2 Kesin Anomali (Murat Çelik: 2, Burak Demir: 5)
        //          Kalanlar Rastgele (Dr. Arda: 4, Mert Kurt: 6, Kerem: 7)
        if (p.id === 1 || p.id === 3) {
            isAnomaly = false;
        } else if (p.id === 2 || p.id === 5) {
            isAnomaly = true;
        }
        // Kızlar: 2 Kesin İnsan (Asistan Elif: 8, Psikolog Merve: 11)
        //         2 Kesin Anomali (Dr. Zeynep: 9, Derya Aydın: 12)
        //         Kalanlar Rastgele (Selin: 10, Sinem: 13, Aylin: 14)
        else if (p.id === 8 || p.id === 11) {
            isAnomaly = false;
        } else if (p.id === 9 || p.id === 12) {
            isAnomaly = true;
        }
        // Kalanlar rastgele %50
        else {
            isAnomaly = Math.random() < 0.5;
        }

        return {
            ...p,
            isMet: false,
            isDead: false,
            scan1: null,
            scan2: null,
            isAnomaly: isAnomaly
        };
    });
}
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

function getPersonDailyDialogue(person, day) {
    const dayIndex = Math.max(0, Math.min(6, day - 1));
    const personDialogues = DAILY_DIALOGUES[person.id];
    if (!personDialogues) {
        return person.isAnomaly
            ? "Tesisin derinliklerinden gelen sesler bugün çok daha belirgin..."
            : "Bugünkü işlerimi tamamlayıp biraz dinlenmek istiyorum.";
    }
    const pool = person.isAnomaly ? personDialogues.anomaly : personDialogues.human;
    return pool[dayIndex] || pool[0];
}

// Game State
let gameState = {
    day: 1,
    energy: MAX_ENERGY,
    timeHour: START_HOUR,
    dailyRequiredCount: 1, // Randomly 1, 2, or 3
    personnel: [],
    selectedTeam: [],
    tiredMap: {},       // { personId: remainingDays } -> 1 day fatigue
    missionStats: {
        success: 0,
        fail: 0,
        total: 0,
        deaths: 0
    },
    activeModalPersonId: null
};
// DAILY MISSION QUOTA RULES:
// Day 1: Exactly 1 person (Kesin 1 kişi)
// Day 2 & 3: 1, 2, or 3 people (1-3 kişi)
// Day 4, 5, 6, 7 (Son 4 gün): 2 or 3 people (1 kişilik görev olamaz)
function getDailyQuotaForDay(day) {
    if (day === 1) {
        return 1; // İlk gün kesin 1 kişi
    } else if (day >= 4) {
        return Math.random() < 0.5 ? 2 : 3; // Son 4 gün sadece 2 veya 3 kişi
    } else {
        return Math.floor(Math.random() * 3) + 1; // Gün 2 ve 3: 1, 2 veya 3 kişi
    }
}

// ==========================================
// V2 MISSION RESOLUTION & CASUALTY ENGINE
// ==========================================
// Odds keyed by [team size][anomalies in team].
// successChance and deathChance are rolled INDEPENDENTLY: a mission can
// succeed and still cost you someone.
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

// Deaths permanently shrink the roster, so a 3-person quota can become
// impossible to field. Clamp it to whoever is alive and rested.
function clampQuotaToRoster(quota, personnel, tiredMap) {
    const available = personnel.filter(p => !p.isDead && !(tiredMap[p.id] > 0)).length;
    return Math.max(1, Math.min(quota, available));
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

// INITIALIZE
function initGame() {
    const personnel = generatePersonnelState();
    const firstDayQuota = clampQuotaToRoster(getDailyQuotaForDay(1), personnel, {});

    gameState = {
        day: 1,
        energy: MAX_ENERGY,
        timeHour: START_HOUR,
        dailyRequiredCount: firstDayQuota,
        personnel: personnel,
        selectedTeam: [],
        tiredMap: {},
        missionStats: { success: 0, fail: 0, total: 0, deaths: 0 },
        activeModalPersonId: null
    };

    renderAll();
    logEvent(`Tesis görevi başladı. İlk gün göreve ${gameState.dailyRequiredCount} kişi göndermelisin!`, "system");
}

// LOGGING HELPER
function logEvent(message, type = "system") {
    const logsContainer = document.getElementById("simulation-logs");
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    const timeStr = formatTime(gameState.timeHour);
    entry.innerHTML = `<small>[GÜN ${gameState.day} - ${timeStr}]</small> ${message}`;
    logsContainer.prepend(entry);
}

function formatTime(hour) {
    const hh = String(hour).padStart(2, "0");
    return `${hh}:00`;
}

// RENDER STATUS BAR
function renderStatus() {
    document.getElementById("current-day").textContent = `${gameState.day} / ${TOTAL_DAYS}`;
    document.getElementById("current-time").textContent = formatTime(gameState.timeHour);
    document.getElementById("current-energy").textContent = `${gameState.energy} / ${MAX_ENERGY}`;
    document.getElementById("mission-score").textContent = `${gameState.missionStats.success} Başarılı / ${gameState.missionStats.total}`;

    // Update Daily Quota Badge
    const quotaElem = document.getElementById("daily-quota-badge");
    if (quotaElem) {
        quotaElem.textContent = `${gameState.dailyRequiredCount} Kişi`;
    }

    // Energy pips (20 Pips)
    const pipsContainer = document.getElementById("energy-pips");
    pipsContainer.innerHTML = "";
    for (let i = 0; i < MAX_ENERGY; i++) {
        const pip = document.createElement("div");
        pip.className = `energy-pip ${i < gameState.energy ? "active" : ""}`;
        pipsContainer.appendChild(pip);
    }

    // Met count badge (living roster only)
    const living = gameState.personnel.filter(p => !p.isDead);
    const metCount = living.filter(p => p.isMet).length;
    document.getElementById("met-count").textContent = `Tanışılan: ${metCount}/${living.length}`;

    // Casualty badge
    const lostCount = gameState.personnel.length - living.length;
    const lostBadge = document.getElementById("lost-count");
    if (lostBadge) {
        lostBadge.textContent = `☠️ Kayıp: ${lostCount}`;
        lostBadge.classList.toggle("has-losses", lostCount > 0);
    }
}

// RENDER PERSONNEL GRID
function renderPersonnel() {
    const grid = document.getElementById("personnel-grid");
    grid.innerHTML = "";

    gameState.personnel.forEach(person => {
        const isDead = !!person.isDead;
        const tiredDaysLeft = isDead ? 0 : (gameState.tiredMap[person.id] || 0);
        const isTired = tiredDaysLeft > 0;
        const isSelected = gameState.selectedTeam.includes(person.id);
        const combinedRisk = getPersonCombinedRisk(person);

        const card = document.createElement("div");
        card.className = `person-card ${person.isMet ? "is-met" : ""} ${isTired ? "is-tired" : ""} ${isSelected ? "selected-team" : ""} ${isDead ? "is-dead" : ""}`;
        card.dataset.id = person.id;

        const genderClass = person.gender === "Erkek" ? "male" : "female";
        const avatarDisplay = isDead ? "☠️" : (person.isMet ? person.avatar : "❓");

        let tagsHtml = "";
        if (isDead) {
            tagsHtml += `<span class="tag tag-dead">☠️ Kayıp</span>`;
        } else if (!person.isMet) {
            tagsHtml += `<span class="tag tag-not-met">Bilinmiyor</span>`;
        } else {
            tagsHtml += `<span class="tag tag-met">Tanışıldı</span>`;
        }

        if (isTired) {
            tagsHtml += `<span class="tag tag-tired">💤 Yorgun (${tiredDaysLeft} gün)</span>`;
        }
        if (isSelected) {
            tagsHtml += `<span class="tag tag-team">✅ Görevde</span>`;
        }

        // Badge colored by risk
        let probBadgeHtml = "";
        if (combinedRisk && !isDead) {
            const badgeColor = getRiskColor(combinedRisk.prob);
            probBadgeHtml = `
                <div class="prob-card-badge" style="color: ${badgeColor};">
                    %${combinedRisk.prob}
                </div>
            `;
        }

        let hintText;
        if (isDead) {
            hintText = "Görevden Dönmedi";
        } else if (person.isMet) {
            hintText = "Çift Tık: Göreve Seç/Çıkar";
        } else {
            hintText = "Çift Tık: Tanış (-4)";
        }

        card.innerHTML = `
            ${probBadgeHtml}
            <div class="double-click-hint">${hintText}</div>
            <div class="avatar-circle ${genderClass}">
                ${avatarDisplay}
            </div>
            <div class="person-name">${person.name}</div>
            <div class="person-role">${person.isMet ? person.role : "???"} (${person.gender})</div>
            <div class="card-status-tags">
                ${tagsHtml}
            </div>
        `;

        let clickTimeout = null;

        // Click to view modal
        card.addEventListener("click", () => {
            if (clickTimeout) clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                openPersonModal(person.id);
            }, 220);
        });

        // Double click: Meet if not met (-4), otherwise toggle into team
        card.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            if (!person.isMet) {
                meetPerson(person.id);
            } else {
                toggleTeamMember(person.id);
            }
        });

        grid.appendChild(card);
    });
}

// RENDER TEAM SELECTION PANEL
function renderTeamSelection() {
    const container = document.getElementById("selected-team-list");
    container.innerHTML = "";

    if (gameState.selectedTeam.length === 0) {
        container.innerHTML = `<span class="empty-text">Henüz kimse seçilmedi. Personel kartından veya profilinden ekle.</span>`;
        return;
    }

    gameState.selectedTeam.forEach(id => {
        const person = gameState.personnel.find(p => p.id === id);
        if (!person) return;

        const pill = document.createElement("div");
        pill.className = "team-member-pill";
        pill.innerHTML = `
            <span>${person.avatar} ${person.name}</span>
            <span class="btn-remove-pill" title="Çıkar">&times;</span>
        `;

        pill.querySelector(".btn-remove-pill").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleTeamMember(person.id);
        });

        container.appendChild(pill);
    });
}

function renderAll() {
    renderStatus();
    renderPersonnel();
    renderTeamSelection();
}

// ACTION: MEET PERSON (-4 Energy, +2 Hours)
function meetPerson(personId) {
    const person = gameState.personnel.find(p => p.id === personId);
    if (!person) return;

    if (person.isDead) {
        openPersonModal(personId);
        return;
    }

    if (person.isMet) {
        openPersonModal(personId);
        return;
    }

    if (gameState.energy < MEET_ENERGY) {
        alert(`Yeterli enerjin kalmadı! Tanışmak ${MEET_ENERGY} enerji gerektirir. Günlük görevi başlatabilirsin.`);
        return;
    }

    // Spend energy & advance time
    gameState.energy -= MEET_ENERGY;
    gameState.timeHour += 2;
    person.isMet = true;

    logEvent(`${person.name} ile tanışıldı. Rol: ${person.role}. (-${MEET_ENERGY} Enerji, Saat ${formatTime(gameState.timeHour)})`, "action");

    renderAll();
    openPersonModal(personId);
}

// ACTION: RUN ANOMALY INDICATOR SCAN (-2 Energy, +1 Hour)
function runIndicatorScan(personId, indicatorIndex) {
    const person = gameState.personnel.find(p => p.id === personId);
    if (!person) return;

    if (person.isDead) {
        alert(`${person.name} görevden geri dönmedi. Üzerinde test yapılamaz.`);
        return;
    }

    if (!person.isMet) {
        alert("Belirteç taraması yapabilmek için önce bu kişiyle tanışmalısın!");
        return;
    }

    const tiredDaysLeft = gameState.tiredMap[personId] || 0;
    if (tiredDaysLeft > 0) {
        alert(`${person.name} dinlendiği için şu an test yapılamaz!`);
        return;
    }

    const scanProp = "scan" + indicatorIndex;
    if (person[scanProp]) {
        openPersonModal(personId);
        return;
    }

    if (gameState.energy < SCAN_ENERGY) {
        alert(`Yeterli enerjin kalmadı! Belirteç taraması ${SCAN_ENERGY} enerji gerektirir.`);
        return;
    }

    // Spend energy & advance time
    gameState.energy -= SCAN_ENERGY;
    gameState.timeHour += 1;
    person[scanProp] = calculateIndicatorProbability(person.isAnomaly, indicatorIndex);

    const testName = indicatorIndex === 1 ? "1. Biyometrik Rezonans" : "2. Nöro-Hücresel DNA";
    logEvent(`[TEST] ${person.name} üzerinde ${testName} testi yapıldı (-${SCAN_ENERGY} Enerji, Saat ${formatTime(gameState.timeHour)}) -> Ölçüm: %${person[scanProp].prob} (${person[scanProp].certaintyType})`, "action");

    renderAll();
    openPersonModal(personId);
}

// TOGGLE TEAM MEMBER (ONLY MET PERSONNEL CAN BE ADDED)
function toggleTeamMember(personId) {
    const person = gameState.personnel.find(p => p.id === personId);
    if (!person) return;

    if (person.isDead) {
        alert(`${person.name} görevden geri dönmedi ve ekibe eklenemez.`);
        return;
    }

    if (!person.isMet) {
        alert(`${person.name} ile henüz tanışmadın! Sadece tanıştığın personelleri göreve gönderebilirsin. Önce bu kişiyle tanışmalısın (-${MEET_ENERGY} Enerji).`);
        return;
    }

    const tiredDaysLeft = gameState.tiredMap[personId] || 0;
    if (tiredDaysLeft > 0) {
        alert(`${person.name} görevden yeni döndü ve ${tiredDaysLeft} gün daha YORGUN! Göreve gidemez.`);
        return;
    }

    const index = gameState.selectedTeam.indexOf(personId);
    if (index > -1) {
        gameState.selectedTeam.splice(index, 1);
        logEvent(`${person.name} görev ekibinden çıkarıldı.`, "system");
    } else {
        if (gameState.selectedTeam.length >= gameState.dailyRequiredCount) {
            alert(`Bugünkü görev için tam olarak ${gameState.dailyRequiredCount} kişi seçmelisin! Fazla kişi ekleyemezsin.`);
            return;
        }
        gameState.selectedTeam.push(personId);
        logEvent(`${person.name} görev ekibine eklendi. (${gameState.selectedTeam.length}/${gameState.dailyRequiredCount})`, "system");
    }

    renderAll();
    updateModalButtons();
}

// MODAL HANDLING
function openPersonModal(personId) {
    const person = gameState.personnel.find(p => p.id === personId);
    if (!person) return;

    gameState.activeModalPersonId = personId;

    const tiredDaysLeft = gameState.tiredMap[person.id] || 0;

    document.getElementById("modal-name").textContent = person.name;
    document.getElementById("modal-role").textContent = person.isMet ? person.role : "Rol Bilinmiyor";
    document.getElementById("modal-gender").textContent = person.gender;
    if (person.isDead) {
        document.getElementById("modal-status").textContent = "☠️ Kayıp (Görevden Dönmedi)";
    } else {
        document.getElementById("modal-status").textContent = tiredDaysLeft > 0 ? `💤 Yorgun (${tiredDaysLeft} gün)` : "Aktif";
    }
    document.getElementById("modal-avatar").textContent = person.isDead ? "☠️" : (person.isMet ? person.avatar : "❓");

    const notMetView = document.getElementById("modal-not-met-view");
    const metView = document.getElementById("modal-met-view");
    const scanBox = document.getElementById("scan-result-box");

    if (!person.isMet) {
        notMetView.classList.remove("hidden");
        metView.classList.add("hidden");
        scanBox.classList.add("hidden");
    } else {
        notMetView.classList.add("hidden");
        metView.classList.remove("hidden");

        // Update daily dialogue
        const dailyDialogueElem = document.getElementById("modal-dialogue");
        if (dailyDialogueElem) {
            const dialogueText = getPersonDailyDialogue(person, gameState.day);
            dailyDialogueElem.textContent = `"${dialogueText}"`;
        }

        // Render Anomaly Indicator Diagnostic Results
        const combinedRisk = getPersonCombinedRisk(person);
        if (combinedRisk) {
            let scanItemsHtml = "";

            if (person.scan1) {
                const s1Color = getRiskColor(person.scan1.prob);
                const s1Grad = getRiskGradient(person.scan1.prob);
                scanItemsHtml += `
                    <div class="indicator-result-item">
                        <div class="indicator-header">
                            <span>🔬 1. Biyometrik Rezonans:</span>
                            <span class="indicator-val" style="color: ${s1Color};">%${person.scan1.prob}</span>
                        </div>
                        <div class="prob-meter-track">
                            <div class="prob-meter-fill" style="width: ${person.scan1.prob}%; background: ${s1Grad};"></div>
                        </div>
                        <small style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; display: block;">Mod: ${person.scan1.certaintyType}</small>
                    </div>
                `;
            }

            if (person.scan2) {
                const s2Color = getRiskColor(person.scan2.prob);
                const s2Grad = getRiskGradient(person.scan2.prob);
                scanItemsHtml += `
                    <div class="indicator-result-item">
                        <div class="indicator-header">
                            <span>🧬 2. Nöro-Hücresel DNA:</span>
                            <span class="indicator-val" style="color: ${s2Color};">%${person.scan2.prob}</span>
                        </div>
                        <div class="prob-meter-track">
                            <div class="prob-meter-fill" style="width: ${person.scan2.prob}%; background: ${s2Grad};"></div>
                        </div>
                        <small style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; display: block;">Mod: ${person.scan2.certaintyType}</small>
                    </div>
                `;
            }

            const overallColor = getRiskColor(combinedRisk.prob);
            scanBox.innerHTML = `
                ${scanItemsHtml}
                <div class="overall-risk-summary">
                    <div class="overall-risk-title">Bileşik Ölçüm Ortalaması (${combinedRisk.scansCount} Belirteç)</div>
                    <div class="overall-risk-percentage" style="color: ${overallColor};">%${combinedRisk.prob}</div>
                    <div class="overall-risk-note">Yorum tamamen sana ait.</div>
                </div>
            `;
            scanBox.classList.remove("hidden");
        } else {
            scanBox.classList.add("hidden");
        }
    }

    updateModalButtons();
    document.getElementById("interrogate-modal").classList.remove("hidden");
}

function updateModalButtons() {
    if (!gameState.activeModalPersonId) return;
    const personId = gameState.activeModalPersonId;
    const person = gameState.personnel.find(p => p.id === personId);
    if (!person) return;

    const isSelected = gameState.selectedTeam.includes(personId);
    const tiredDaysLeft = gameState.tiredMap[personId] || 0;

    // Team Toggle buttons
    const toggleBtnMet = document.getElementById("btn-toggle-team");
    const toggleBtnNotMet = document.getElementById("btn-modal-toggle-not-met");
    const teamButtons = [toggleBtnMet, toggleBtnNotMet].filter(Boolean);

    teamButtons.forEach(btn => {
        if (person.isDead) {
            btn.textContent = "☠️ Kayıp (Göreve Gönderilemez)";
            btn.disabled = true;
        } else if (tiredDaysLeft > 0) {
            btn.textContent = `💤 Yorgun (${tiredDaysLeft} Gün Dinleniyor)`;
            btn.disabled = true;
        } else if (isSelected) {
            btn.textContent = "❌ Görev Ekibinden Çıkar";
            btn.disabled = false;
        } else {
            btn.textContent = "➕ Görev Ekibine Ekle";
            btn.disabled = false;
        }
    });

    // Indicator Scan Buttons (1 and 2)
    const scan1Btn = document.getElementById("btn-scan-1");
    if (scan1Btn) {
        if (person.isDead) {
            scan1Btn.textContent = "☠️ Kayıp (Test Yapılamaz)";
            scan1Btn.disabled = true;
        } else if (tiredDaysLeft > 0) {
            scan1Btn.textContent = "💤 Dinleniyor (Test Yapılamaz)";
            scan1Btn.disabled = true;
        } else if (person.scan1) {
            scan1Btn.textContent = `✅ 1. Belirteç: %${person.scan1.prob} Risk (${person.scan1.certaintyType})`;
            scan1Btn.disabled = true;
        } else {
            scan1Btn.textContent = `🔬 1. Belirteç: Biyometrik Rezonans (-${SCAN_ENERGY} Enerji)`;
            scan1Btn.disabled = false;
        }
    }

    const scan2Btn = document.getElementById("btn-scan-2");
    if (scan2Btn) {
        if (person.isDead) {
            scan2Btn.textContent = "☠️ Kayıp (Test Yapılamaz)";
            scan2Btn.disabled = true;
        } else if (tiredDaysLeft > 0) {
            scan2Btn.textContent = "💤 Dinleniyor (Test Yapılamaz)";
            scan2Btn.disabled = true;
        } else if (person.scan2) {
            scan2Btn.textContent = `✅ 2. Belirteç: %${person.scan2.prob} Risk (${person.scan2.certaintyType})`;
            scan2Btn.disabled = true;
        } else {
            scan2Btn.textContent = `🧬 2. Belirteç: Nöro-Hücresel DNA (-${SCAN_ENERGY} Enerji)`;
            scan2Btn.disabled = false;
        }
    }
}

function closeModals() {
    document.getElementById("interrogate-modal").classList.add("hidden");
    document.getElementById("mission-result-modal").classList.add("hidden");
    document.getElementById("game-over-modal").classList.add("hidden");
    gameState.activeModalPersonId = null;
}

// DISPATCH MISSION RESOLUTION (V2)
function dispatchMission() {
    if (gameState.selectedTeam.length !== gameState.dailyRequiredCount) {
        // If the roster still holds someone who could fill the slot, make the
        // player use them. If it doesn't, let them dispatch under strength
        // rather than dead-locking the run -- it just counts as a failure.
        const canStillFill = gameState.personnel.some(p =>
            p.isMet && !p.isDead &&
            !(gameState.tiredMap[p.id] > 0) &&
            !gameState.selectedTeam.includes(p.id)
        );

        if (canStillFill || gameState.selectedTeam.length > gameState.dailyRequiredCount) {
            alert(`Bugünkü görev için tam olarak ${gameState.dailyRequiredCount} kişi seçmelisin! (Şu an seçilen: ${gameState.selectedTeam.length})`);
            return;
        }

        const proceed = confirm(
            `Görev ${gameState.dailyRequiredCount} kişi istiyor fakat sahaya sürebileceğin başka kimse kalmadı.

` +
            `Eksik ekiple gönderirsen görev otomatik olarak BAŞARISIZ sayılacak. Devam edilsin mi?`
        );
        if (!proceed) return;
    }

    const team = gameState.selectedTeam.map(id => gameState.personnel.find(p => p.id === id));

    // Check if any member is not met
    const unmetMembers = team.filter(p => !p.isMet);
    if (unmetMembers.length > 0) {
        alert("Tanışmadığın personelleri göreve gönderemezsin! Lütfen önce tanış veya ekibi düzenle.");
        return;
    }

    const isUnderStrength = team.length !== gameState.dailyRequiredCount;
    const outcome = isUnderStrength
        ? { isSuccess: false, casualty: null }
        : resolveMission(team);

    const isSuccess = outcome.isSuccess;
    const casualty = outcome.casualty;

    let explanation = isUnderStrength
        ? "Ekip eksik kadroyla sahaya indi ve operasyon daha başlamadan çöktü."
        : pickReport(isSuccess);

    // Apply the casualty before the day rolls over, so the dead are never
    // scheduled for rest.
    if (casualty) {
        casualty.isDead = true;
        explanation += ` ${casualty.name} sahadan geri dönmedi.`;
    }

    // Update stats
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
        logEvent(`☠️ KAYIP: ${casualty.name} tesise geri dönmedi. Kadrodan kalıcı olarak düşüldü.`, "fail");
    }

    // Show result modal without revealing true anomaly/human status!
    showMissionResultModal(isSuccess, explanation, team, casualty);
}

// SHOW RESULT MODAL (DOES NOT SPOIL TRUE NATURE)
function showMissionResultModal(isSuccess, explanation, team, casualty) {
    const resultModal = document.getElementById("mission-result-modal");
    const resultTitle = document.getElementById("result-title");
    const resultBadge = document.getElementById("result-badge");
    const resultDesc = document.getElementById("result-desc");
    const breakdownList = document.getElementById("result-team-breakdown");

    resultTitle.textContent = `GÜN ${gameState.day} GÖREV RAPORU`;
    resultBadge.textContent = isSuccess ? "GÖREV BAŞARILI ✅" : "GÖREV BAŞARISIZ ❌";
    resultBadge.className = `mission-outcome-badge ${isSuccess ? "success" : "fail"}`;
    resultDesc.textContent = explanation;

    breakdownList.innerHTML = "";
    team.forEach(person => {
        const isCasualty = casualty && casualty.id === person.id;
        const row = document.createElement("div");
        row.className = `team-result-row ${isCasualty ? "is-casualty" : ""}`;
        // Do not reveal if they are anomaly or human!
        const statusBadge = isCasualty
            ? `<span class="badge badge-casualty">☠️ Geri Dönmedi</span>`
            : `<span class="badge" style="color: var(--text-secondary); background: rgba(255,255,255,0.05);">🚀 Göreve Katıldı</span>`;
        row.innerHTML = `
            <span>${isCasualty ? "☠️" : person.avatar} <strong>${person.name}</strong> (${person.role})</span>
            ${statusBadge}
        `;
        breakdownList.appendChild(row);
    });

    resultModal.classList.remove("hidden");
}

// PROCEED TO NEXT DAY
function nextDay() {
    closeModals();

    // Mark surviving sent team as tired for 1 day (the dead need no rest)
    gameState.selectedTeam.forEach(id => {
        const member = gameState.personnel.find(p => p.id === id);
        if (member && member.isDead) return;
        gameState.tiredMap[id] = FATIGUE_DAYS;
    });

    // Advance fatigue countdown for everyone
    Object.keys(gameState.tiredMap).forEach(id => {
        // If they were NOT in today's sent team, decrease their fatigue by 1 day
        if (!gameState.selectedTeam.includes(Number(id))) {
            gameState.tiredMap[id] -= 1;
            if (gameState.tiredMap[id] <= 0) {
                delete gameState.tiredMap[id];
            }
        }
    });

    gameState.selectedTeam = [];

    // Advance day
    if (gameState.day >= TOTAL_DAYS) {
        showGameOver();
        return;
    }

    gameState.day += 1;
    gameState.energy = MAX_ENERGY;
    gameState.timeHour = START_HOUR;
    // Set daily requirement based on day (Day 1: 1, Days 2-3: 1-3, Days 4-7: 2-3)
    gameState.dailyRequiredCount = clampQuotaToRoster(getDailyQuotaForDay(gameState.day), gameState.personnel, gameState.tiredMap);

    logEvent(`--- GÜN ${gameState.day} BAŞLADI --- Enerji ve saat sıfırlandı (09:00). Bugün ${gameState.dailyRequiredCount} kişi gönderilmeli!`, "system");
    renderAll();
}

// GAME OVER / VICTORY
function showGameOver() {
    const modal = document.getElementById("game-over-modal");
    const statsElem = document.getElementById("game-over-stats");
    const verdictElem = document.getElementById("game-over-verdict");

    const total = gameState.missionStats.total;
    const success = gameState.missionStats.success;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;

    const lost = gameState.personnel.filter(p => p.isDead).length;
    const survivors = gameState.personnel.length - lost;

    statsElem.innerHTML = `
        Tamamlanan Gün: 7/7<br>
        Başarılı Görev: ${success} / ${total}<br>
        Başarı Oranı: %${rate}<br>
        Kaybedilen Personel: ${lost}<br>
        Hayatta Kalan Kadro: ${survivors} / ${gameState.personnel.length}
    `;

    if (success >= 5) {
        verdictElem.innerHTML = `<strong>Tesis Güvende!</strong> Doğru seçimlerle tesisi kurtardın.`;
    } else if (success >= 3) {
        verdictElem.innerHTML = `<strong>Kritik Hayatta Kalma!</strong> Tesis ağır hasar aldı fakat ayakta kaldı.`;
    } else {
        verdictElem.innerHTML = `<strong>Tesis Düştü!</strong> Operasyonlar başarısız oldu.`;
    }

    modal.classList.remove("hidden");
}

// ==========================================
// SECURITY ACCESS AUTHENTICATION GATE
// ==========================================
// SHA-256 hash representation of access key ('muhusena')
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

        const isValid = await verifyAccessKey(enteredKey);
        if (isValid) {
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

    authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleUnlock();
    });

    if (authInput) {
        authInput.addEventListener("input", () => {
            if (authError) authError.classList.add("hidden");
        });
    }
}

// EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
    // Setup security authentication gate
    setupAuthGate();

    // Close modals
    document.getElementById("modal-close").addEventListener("click", closeModals);

    // Modal meet button (-4 energy)
    document.getElementById("btn-modal-meet").addEventListener("click", () => {
        if (gameState.activeModalPersonId) {
            meetPerson(gameState.activeModalPersonId);
        }
    });

    // Indicator 1 Scan button (-2 energy)
    const scan1Btn = document.getElementById("btn-scan-1");
    if (scan1Btn) {
        scan1Btn.addEventListener("click", () => {
            if (gameState.activeModalPersonId) {
                runIndicatorScan(gameState.activeModalPersonId, 1);
            }
        });
    }

    // Indicator 2 Scan button (-2 energy)
    const scan2Btn = document.getElementById("btn-scan-2");
    if (scan2Btn) {
        scan2Btn.addEventListener("click", () => {
            if (gameState.activeModalPersonId) {
                runIndicatorScan(gameState.activeModalPersonId, 2);
            }
        });
    }

    // Modal toggle team buttons
    const toggleBtnMet = document.getElementById("btn-toggle-team");
    if (toggleBtnMet) {
        toggleBtnMet.addEventListener("click", () => {
            if (gameState.activeModalPersonId) {
                toggleTeamMember(gameState.activeModalPersonId);
            }
        });
    }

    const toggleBtnNotMet = document.getElementById("btn-modal-toggle-not-met");
    if (toggleBtnNotMet) {
        toggleBtnNotMet.addEventListener("click", () => {
            if (gameState.activeModalPersonId) {
                toggleTeamMember(gameState.activeModalPersonId);
            }
        });
    }

    // Dispatch button
    document.getElementById("btn-dispatch").addEventListener("click", () => {
        dispatchMission();
    });

    // Next day button
    document.getElementById("btn-next-day").addEventListener("click", () => {
        nextDay();
    });

    // Restart button
    document.getElementById("btn-restart").addEventListener("click", () => {
        closeModals();
        initGame();
    });

    // BOT BENCHMARK MODAL CONTROLS
    const btnOpenBotModal = document.getElementById("btn-open-bot-modal");
    if (btnOpenBotModal) {
        btnOpenBotModal.addEventListener("click", () => {
            document.getElementById("bot-modal").classList.remove("hidden");
        });
    }

    const btnBotModalClose = document.getElementById("bot-modal-close");
    if (btnBotModalClose) {
        btnBotModalClose.addEventListener("click", () => {
            document.getElementById("bot-modal").classList.add("hidden");
        });
    }

    const btnBotModalCloseAction = document.getElementById("btn-bot-modal-close-action");
    if (btnBotModalCloseAction) {
        btnBotModalCloseAction.addEventListener("click", () => {
            document.getElementById("bot-modal").classList.add("hidden");
        });
    }

    const btnRunBenchmark = document.getElementById("btn-run-benchmark");
    if (btnRunBenchmark) {
        btnRunBenchmark.addEventListener("click", () => {
            const count = parseInt(document.getElementById("benchmark-run-count").value, 10) || 5000;
            runFullBenchmark(count);
        });
    }

    const btnLiveDemo = document.getElementById("btn-live-bot-demo");
    if (btnLiveDemo) {
        btnLiveDemo.addEventListener("click", () => {
            document.getElementById("bot-modal").classList.add("hidden");
            runLiveAutoPlay("optimal_rotator");
        });
    }
});

// ==========================================
// REAL 5,000-RUN BOT BENCHMARK ENGINE
// ==========================================

const SUSPICIOUS_KEYWORDS = [
    "frekans", "uyku", "silikon", "radyasyon", "algoritma", "manyetik",
    "nabız", "moleküler", "ter bez", "sahte", "simülasyon", "kusursuz",
    "organik", "karbon", "döngü", "fısıltı", "sayı dizisi", "dönüşüm", "kodlar"
];

const BOT_STRATEGIES = [
    {
        id: "random",
        name: "Rastgele Seçici (Baseline)",
        tag: "Şans Odaklı",
        desc: "Gerektiğinde tanışır (-4), test yapmadan rastgele personelleri yollar."
    },
    {
        id: "detective",
        name: "Dedektif Bot (Çift Belirteç Taraması)",
        tag: "Derin Teşhis",
        desc: "Personelleri tanışıp 1. ve 2. belirteç testlerine sokar (-2'şer enerji), en düşük anomali risklileri seçer."
    },
    {
        id: "dialogue_scout",
        name: "Diyalog Ajanı (NLP İpucu)",
        tag: "İpucu Analizi",
        desc: "Tüm 20 enerjisini tanışmaya harcar (günde 5 kişi), sözlerdeki şüpheli kelimeleri eler."
    },
    {
        id: "optimal_rotator",
        name: "Hibrit / Optimal Risk Yöneticisi",
        tag: "Gelişmiş Algoritma",
        desc: "Çift belirteçle düşük riskli insan havuzu kurar, 1 günlük yorgunluğu ve risk yüzdelerini matematiksel optimize eder."
    }
];

function simulateSingleGame(botType) {
    // 1. Generate personnel with exact fixed and random anomaly assignments
    const personnel = generatePersonnelState();

    let tiredMap = {};
    let successfulDays = 0;
    let anomaliesSentCount = 0;
    let totalMissionsSent = 0;
    let deathsCount = 0;

    // A candidate must be alive AND rested to be usable at all.
    const isAvailable = (p) => !p.isDead && !(tiredMap[p.id] > 0);

    for (let day = 1; day <= TOTAL_DAYS; day++) {
        let energy = MAX_ENERGY; // 20 Energy
        const dailyQuota = clampQuotaToRoster(getDailyQuotaForDay(day), personnel, tiredMap);

        let selectedTeamIds = [];

        // 1. RANDOM BOT
        if (botType === "random") {
            let metRested = personnel.filter(p => p.isMet && isAvailable(p));
            while (metRested.length < dailyQuota && energy >= MEET_ENERGY) {
                const unmet = personnel.find(p => !p.isMet && isAvailable(p));
                if (unmet) {
                    unmet.isMet = true;
                    energy -= MEET_ENERGY;
                    metRested = personnel.filter(p => p.isMet && isAvailable(p));
                } else {
                    break;
                }
            }

            if (metRested.length >= dailyQuota) {
                const shuffled = [...metRested].sort(() => Math.random() - 0.5);
                selectedTeamIds = shuffled.slice(0, dailyQuota).map(p => p.id);
            }
        }
        // 2. DETECTIVE BOT (Meet -4, Scan 1 & Scan 2 -2 each)
        else if (botType === "detective") {
            // First ensure we have at least dailyQuota met & rested people
            let metRested = personnel.filter(p => p.isMet && isAvailable(p));
            while (metRested.length < dailyQuota + 1 && energy >= MEET_ENERGY) {
                const unmet = personnel.find(p => !p.isMet && isAvailable(p));
                if (unmet) {
                    unmet.isMet = true;
                    energy -= MEET_ENERGY;
                    metRested = personnel.filter(p => p.isMet && isAvailable(p));
                } else {
                    break;
                }
            }

            // Run Indicator 1 & Indicator 2 scans with remaining energy (-2 each)
            while (energy >= SCAN_ENERGY) {
                const unscanned1 = personnel.find(p => p.isMet && !p.scan1 && isAvailable(p));
                if (unscanned1) {
                    unscanned1.scan1 = calculateIndicatorProbability(unscanned1.isAnomaly, 1);
                    energy -= SCAN_ENERGY;
                    continue;
                }
                const unscanned2 = personnel.find(p => p.isMet && !p.scan2 && isAvailable(p));
                if (unscanned2) {
                    unscanned2.scan2 = calculateIndicatorProbability(unscanned2.isAnomaly, 2);
                    energy -= SCAN_ENERGY;
                    continue;
                }
                break;
            }

            // Sort met rested candidates by lowest anomaly probability
            const candidates = personnel.filter(p => p.isMet && isAvailable(p));
            candidates.forEach(p => {
                const risk = getPersonCombinedRisk(p);
                p._sortRisk = risk ? risk.prob : 50; // unscanned gets default 50%
            });

            candidates.sort((a, b) => a._sortRisk - b._sortRisk);
            if (candidates.length >= dailyQuota) {
                selectedTeamIds = candidates.slice(0, dailyQuota).map(p => p.id);
            }
        }
        // 3. DIALOGUE SCOUT BOT (Spends up to 20 energy on meeting 5 people)
        else if (botType === "dialogue_scout") {
            while (energy >= MEET_ENERGY) {
                const unmet = personnel.find(p => !p.isMet && isAvailable(p));
                if (unmet) {
                    unmet.isMet = true;
                    energy -= MEET_ENERGY;
                } else {
                    break;
                }
            }

            // Score ONLY met and rested personnel
            const metAvailable = personnel.filter(p => p.isMet && isAvailable(p));
            metAvailable.forEach(p => {
                const line = getPersonDailyDialogue(p, day).toLowerCase();
                let matchCount = 0;
                SUSPICIOUS_KEYWORDS.forEach(kw => {
                    if (line.includes(kw)) matchCount++;
                });
                p._suspicion = matchCount;
            });

            metAvailable.sort((a, b) => a._suspicion - b._suspicion);
            if (metAvailable.length >= dailyQuota) {
                selectedTeamIds = metAvailable.slice(0, dailyQuota).map(p => p.id);
            }
        }
        // 4. OPTIMAL ROTATOR BOT (Deep Risk & Fatigue Optimizer)
        else if (botType === "optimal_rotator") {
            let metRested = personnel.filter(p => p.isMet && isAvailable(p));
            while (metRested.length < dailyQuota + 2 && energy >= MEET_ENERGY) {
                const unmet = personnel.find(p => !p.isMet && isAvailable(p));
                if (unmet) {
                    unmet.isMet = true;
                    energy -= MEET_ENERGY;
                    metRested = personnel.filter(p => p.isMet && isAvailable(p));
                } else {
                    break;
                }
            }

            // Perform dual scans on met candidates
            while (energy >= SCAN_ENERGY) {
                const target1 = personnel.find(p => p.isMet && !p.scan1 && isAvailable(p));
                if (target1) {
                    target1.scan1 = calculateIndicatorProbability(target1.isAnomaly, 1);
                    energy -= SCAN_ENERGY;
                    continue;
                }
                const target2 = personnel.find(p => p.isMet && !p.scan2 && isAvailable(p));
                if (target2) {
                    target2.scan2 = calculateIndicatorProbability(target2.isAnomaly, 2);
                    energy -= SCAN_ENERGY;
                    continue;
                }
                break;
            }

            // Rank candidates by combining scan percentages & dialogue hints
            const available = personnel.filter(p => p.isMet && isAvailable(p));
            available.forEach(p => {
                const risk = getPersonCombinedRisk(p);
                const baseProb = risk ? risk.prob : 50;

                const line = getPersonDailyDialogue(p, day).toLowerCase();
                let kwMatches = 0;
                SUSPICIOUS_KEYWORDS.forEach(kw => {
                    if (line.includes(kw)) kwMatches++;
                });

                p._totalRisk = baseProb + (kwMatches * 8);
            });

            available.sort((a, b) => a._totalRisk - b._totalRisk);
            if (available.length >= dailyQuota) {
                selectedTeamIds = available.slice(0, dailyQuota).map(p => p.id);
            }
        }

        // Mission Outcome calculation
        const teamPersonnel = selectedTeamIds.map(id => personnel.find(p => p.id === id)).filter(Boolean);

        let isSuccess = false;
        let casualty = null;

        // If bot couldn't fulfill the quota with MET personnel, mission automatically fails
        if (teamPersonnel.length !== dailyQuota) {
            isSuccess = false;
        } else {
            anomaliesSentCount += teamPersonnel.filter(p => p.isAnomaly).length;
            totalMissionsSent += teamPersonnel.length;

            const outcome = resolveMission(teamPersonnel);
            isSuccess = outcome.isSuccess;
            casualty = outcome.casualty;
        }

        if (isSuccess) successfulDays++;

        if (casualty) {
            casualty.isDead = true;
            deathsCount++;
        }

        // Mark 1-day fatigue (skipping anyone who did not come back)
        selectedTeamIds.forEach(id => {
            const member = personnel.find(p => p.id === id);
            if (member && member.isDead) return;
            tiredMap[id] = FATIGUE_DAYS;
        });

        // Decay fatigue for others
        Object.keys(tiredMap).forEach(id => {
            if (!selectedTeamIds.includes(Number(id))) {
                tiredMap[id] -= 1;
                if (tiredMap[id] <= 0) delete tiredMap[id];
            }
        });
    }

    return {
        wonGame: (successfulDays >= 5),
        perfectRun: (successfulDays === 7),
        successfulDays,
        anomaliesSentCount,
        deathsCount
    };
}

// ASYNC BATCH BENCHMARK RUNNER (NON-BLOCKING WITH SMOOTH PROGRESS)
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
        results[b.id] = {
            totalRuns: 0,
            wonGames: 0,
            perfectRuns: 0,
            totalSuccessDays: 0,
            totalAnomaliesSent: 0,
            totalDeaths: 0
        };
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
                // Done!
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

    // Find best strategy by win rate
    let bestId = "";
    let highestWinRate = -1;

    BOT_STRATEGIES.forEach(strat => {
        const r = results[strat.id];
        const winRate = (r.wonGames / totalRuns) * 100;
        if (winRate > highestWinRate) {
            highestWinRate = winRate;
            bestId = strat.id;
        }
    });

    BOT_STRATEGIES.forEach(strat => {
        const r = results[strat.id];
        const winRate = Math.round((r.wonGames / totalRuns) * 1000) / 10;
        const dailySuccessRate = Math.round((r.totalSuccessDays / (totalRuns * 7)) * 1000) / 10;
        const avgAnomalies = Math.round((r.totalAnomaliesSent / totalRuns) * 10) / 10;
        const avgDeaths = Math.round((r.totalDeaths / totalRuns) * 10) / 10;
        const isBest = (strat.id === bestId);

        // Card
        const card = document.createElement("div");
        card.className = `strategy-card ${isBest ? 'best-strategy' : ''}`;
        card.innerHTML = `
            <div class="strategy-header">
                <div>
                    <div class="strategy-title">${strat.name}</div>
                    <small style="font-size:0.72rem; color: var(--text-muted);">${strat.desc}</small>
                </div>
                <span class="strategy-tag" style="background: rgba(56,139,253,0.15); color: var(--accent-blue);">
                    ${isBest ? '🏆 EN İYİ' : strat.tag}
                </span>
            </div>

            <div class="strategy-win-rate">
                %${winRate} <small>Kazanma Oranı</small>
            </div>

            <div class="strategy-meter-track">
                <div class="strategy-meter-fill" style="width: ${winRate}%;"></div>
            </div>

            <div class="strategy-stats-list">
                <div><span>Kazanılan Kampanya:</span> <strong>${r.wonGames.toLocaleString()} / ${totalRuns.toLocaleString()}</strong></div>
                <div><span>Günlük Görev Başarısı:</span> <strong>%${dailySuccessRate}</strong></div>
                <div><span>Maç Başı Anomali (Ort):</span> <strong>${avgAnomalies} kişi</strong></div>
                <div><span>Maç Başı Kayıp (Ort):</span> <strong>${avgDeaths} kişi</strong></div>
                <div><span>Mükemmel Seri (7/7):</span> <strong>${r.perfectRuns.toLocaleString()} maç</strong></div>
            </div>
        `;
        cardsGrid.appendChild(card);

        // Table Row
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${strat.name}</strong></td>
            <td style="color: var(--accent-cyan); font-weight:bold;">%${winRate} (${r.wonGames.toLocaleString()})</td>
            <td>%${dailySuccessRate}</td>
            <td style="color: ${avgAnomalies > 3 ? 'var(--accent-red)' : 'var(--accent-green)'}">${avgAnomalies}</td>
            <td style="color: ${avgDeaths >= 2 ? 'var(--accent-red)' : 'var(--accent-orange)'}">${avgDeaths}</td>
            <td>${r.perfectRuns.toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
    });

    tableWrapper.style.display = "block";
}

// LIVE VISUAL BOT DEMO
function runLiveAutoPlay(botType = "optimal_rotator") {
    initGame();
    logEvent(`[OTO-BOT] ${botType.toUpperCase()} canlı demo oyunu başlatıldı...`, "system");

    function playDayStep() {
        if (gameState.day > TOTAL_DAYS) {
            return;
        }

        // Check if we need to meet more people for daily quota
        let metRested = gameState.personnel.filter(p => p.isMet && !p.isDead && !(gameState.tiredMap[p.id] > 0));
        
        // If not enough met & rested people for today's quota, meet unmet ones (-4 energy)
        if (metRested.length < gameState.dailyRequiredCount && gameState.energy >= MEET_ENERGY) {
            const unmet = gameState.personnel.find(p => !p.isMet && !p.isDead && !(gameState.tiredMap[p.id] > 0));
            if (unmet) {
                meetPerson(unmet.id);
                setTimeout(playDayStep, 700);
                return;
            }
        }

        // If we have 2+ energy, do indicator scans
        if (gameState.energy >= SCAN_ENERGY) {
            const target1 = gameState.personnel.find(p => p.isMet && !p.scan1 && !p.isDead && !(gameState.tiredMap[p.id] > 0));
            if (target1) {
                runIndicatorScan(target1.id, 1);
                setTimeout(playDayStep, 700);
                return;
            }
            const target2 = gameState.personnel.find(p => p.isMet && !p.scan2 && !p.isDead && !(gameState.tiredMap[p.id] > 0));
            if (target2) {
                runIndicatorScan(target2.id, 2);
                setTimeout(playDayStep, 700);
                return;
            }
        }

        selectAndDispatch();
    }

    function selectAndDispatch() {
        // Auto select team ONLY from MET and RESTED personnel based on lowest anomaly risk
        gameState.selectedTeam = [];
        const metCandidates = gameState.personnel.filter(p => p.isMet && !p.isDead && !(gameState.tiredMap[p.id] > 0));

        metCandidates.forEach(p => {
            const risk = getPersonCombinedRisk(p);
            p._liveSortRisk = risk ? risk.prob : 50;
        });

        metCandidates.sort((a, b) => a._liveSortRisk - b._liveSortRisk);

        metCandidates.slice(0, gameState.dailyRequiredCount).forEach(p => {
            gameState.selectedTeam.push(p.id);
        });

        renderAll();

        setTimeout(() => {
            dispatchMission();
            setTimeout(() => {
                if (gameState.day < TOTAL_DAYS) {
                    nextDay();
                    setTimeout(playDayStep, 1000);
                } else {
                    nextDay(); // Triggers game over screen
                }
            }, 1500);
        }, 800);
    }

    setTimeout(playDayStep, 800);
}

