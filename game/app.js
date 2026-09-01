// ============================================================================
// THE FACILITY 61 -- ULTIMATE 14 INMATE SIMULATION
// ============================================================================
//
// 14 Inmates: 7 Human, 5 Corrupted, 2 Random
// Daily Energy: 8 points (Each finished interview/introduction consumes 2 energy)
// Rule: Max 1 interview per character per day.
//
// CALENDAR-DAY DIALOGUE PROGRESSION:
// TANIŞ -> G1 (Day introduced)
// NEXT CALENDAR DAY -> G2
// NEXT CALENDAR DAY -> G3
// NEXT CALENDAR DAY -> G4
// NEXT CALENDAR DAY -> G5
//
// Formula: dialogueIndex = Math.min(Math.max(currentDay - character.introducedDay, 0), character.dialogues.length - 1)
//
// DAY 1 FLOW (NO TESTING STAGE ON DAY 1):
// Day 1: Tanışma -> Görev Sevki -> Rapor (No test stage, no guide button)
// Day 2+: Tanışma -> Test -> Görev Sevki -> Rapor (Day 3+: İnfaz included)
// Day 2 Auto-Guide: Opens brain test guide on first entry to testing stage if not seen.
// Permanent Guide Button: Visible on all stages from Day 2+.
//
// BRAIN SCAN VISUAL TESTING:
// 0–19:   brain-human.png
// 20–44:  brain-doubt-30.png
// 45–69:  brain-doubt-60.png
// 70–89:  brain-corrupted-80.png
// 90–100: brain-corrupted-100.png
// (Visual scan ONLY, no numbers/percentages/diagnoses on screen).
//

const TOTAL_DAYS = 7;
const ROSTER_SIZE = 14;
const MAX_DAILY_ENERGY = 8;

// Energy Action Costs
const ENERGY_COST = {
    INTERVIEW: 2,
    TEST: 1,
    RETURN_CHECK: 1,
    DISPATCH: 0
};

// Dispatch Requirements per Day
const DAILY_DISPATCH_QUOTA = {
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 3,
    6: 3,
    7: 3
};

// Electric Chair & Riot Days
const EXECUTION_START_DAY = 3;
const EXECUTIONS_PER_DAY = 1;
const RIOT_START_DAY = 3;
const MAX_MISSION_FAILURES = 3;

// Stage Definitions
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
    arrival:   { label: "GÖRÜŞME PROGRAMI", clock: "08:00", next: "TANIŞMA AŞAMASINA GEÇ" },
    meeting:   { label: "TANIŞMA",          clock: "09:00", next: "TEST AŞAMASINA GEÇ" },
    testing:   { label: "TEST",             clock: "13:00", next: "GÖREV AŞAMASINA GEÇ" },
    execution: { label: "İNFAZ",            clock: "15:00", next: "GÖREV AŞAMASINA GEÇ" },
    dispatch:  { label: "GÖREV SEVKİ",      clock: "16:00", next: null },
    report:    { label: "GÜN RAPORU",       clock: "18:00", next: null }
};

// ---- 14 FIXED INMATES DATA (CANONICAL ASSETS) ----------------
const FACILITY_61_ROSTER = [
    {
        id: "bob",
        name: "Bob",
        secretIdentity: "Human",
        gender: "Erkek",
        role: "İşsiz",
        image: "characters/bob.png",
        reading: 16,
        dialogues: [
            "Heyoooo! Naber?",
            "Arkadaşım buranın dışında çöküş olduğunu söylüyor. Ama onu şu an dinleyemem, puzzle’ı tamamlamam lazım.",
            "Bugün konuşmak istemiyorum çünkü çok sinirliyim!",
            "Tarağımın teli kırıldı. Fanlarımdan tarak teli göndermelerini isticem.",
            "Bak Warden, patatesten ne yaptım! Bunu yemekhaneden ödünç aldım."
        ]
    },
    {
        id: "ted-karinsky",
        name: "Ted Karinsky",
        secretIdentity: "Corrupted",
        gender: "Erkek",
        role: "Eski Akademisyen",
        image: "characters/ted-karinsky.png",
        reading: 92,
        dialogues: [
            "Gerçekleri örtbas ederek makalemi yayımlamamı engellediler. Ben ise yayımladım.",
            "Gerçekler, siyasetin veya kamu düzeninin ihtiyaçlarına göre değiştirilemez.",
            "Siyasi meselelerle işim yok. Fakat gidişat beni suç işlemeye mecbur bıraktı.",
            "Teknoloji yasağı tam bir saçmalık! Her şeyin üstünü kapatmaya çalışıyorlar!",
            "Dün yazdığım notların bazılarını bugün ilk kez okuyormuşum gibi hissettim. Yine de düşüncelerin bana ait olduğundan eminim."
        ]
    },
    {
        id: "m-cole-morgan",
        name: "M. Cole Morgan",
        secretIdentity: "Human",
        gender: "Erkek",
        role: "Otomobil Tamircisi",
        image: "characters/m-cole-morgan.png",
        reading: 32,
        dialogues: [
            "Karımı ve kızımı dışarıdaki tehlikeden korumak istiyorum. Buradan ne kadar erken çıkarsam o kadar iyi.",
            "Hâlâ kendi tamirhanemi açma hayalim var. Buradaki görevler bu hayalimi kamçılıyor.",
            "Bugün karımdan bir mektup aldım. Uzun süre sonra aklına geldiğim için seviniyorum.",
            "Bugün kulaklarım çok çınlıyor. Kendimi pek iyi hissetmiyorum.",
            "Her gün bu kameralardan izlenmekten bıktım. Kendimi korkunç hissediyorum."
        ]
    },
    {
        id: "alicia-winston",
        name: "Alicia Winston",
        secretIdentity: "Random",
        gender: "Kız",
        role: "Edebiyat Mezunu",
        image: "characters/alicia-winston.png",
        reading: null,
        dialogues: [
            "Zamanında birilerine çok güvendim. Artık kimseye o kadar güvenemiyorum.",
            "Buranın kütüphanesindeki kitaplar çok sıkıcı. Aradığım hiçbir kitabı bulamıyorum.",
            "*Hıçkırır* Özür dilerim, sizi fark etmedim. *Gözyaşlarını siler*",
            "Burada herkes delirmiş. Kimseyle düzgün anlaşamıyorum. Aileme mektup yazacağım.",
            "Bugün uykumu iyi aldım. Ortak alanda televizyon izlemek bana iyi geliyor."
        ]
    },
    {
        id: "evie-hill",
        name: "Evie Hill",
        secretIdentity: "Corrupted",
        gender: "Kız",
        role: "Garson",
        image: "characters/evie-hill.png?v=3",
        reading: 86,
        dialogues: [
            "Birileri odama girip eşyalarımı karıştırıyor. Onu yakalarsam fena yapacağım.",
            "Bu tesis gereğinden fazla mı soğuk, yoksa bir tek benim hücrem mi böyle?",
            "Kansızlığım var. Çok kan kaybetmemem gerekiyor. Kaybedersem yerine gelmesi birkaç saat sürüyor.",
            "Sanırım odama giren kişiyi buldum.",
            "Nişanlım dışarıda bir yerde beni bekliyor. Beni buradan çıkaracak."
        ]
    },
    {
        id: "dakota-ahmadii",
        name: "Dakota Ahmadii",
        secretIdentity: "Random",
        gender: "Erkek",
        role: "Obezite Hastası",
        image: "characters/dakota-ahmadii.png?v=3",
        reading: null,
        dialogues: [
            "Yemekhanede çıkardığım kavga için özür dilerim ama o gün yemekte ıspanak olması sinirlerimi feci gerdi.",
            "Sesten ötürü üzgünüm, Warden. Ispanak bende gaz yapıyor.",
            "İçinde bir yerlerde derin bir pişmanlık var. Bakışlarından anlayabiliyorum.",
            "Dün akşam tesis o kadar gürültülüydü ki uyuyamadım.",
            "Saçlarımın bir anda beyazlamasının nedeni, çıkan beyaz saç tellerimi ardı ardına kopartmam. Biri ölünce mezarına beş tel geliyor."
        ]
    },
    {
        id: "hasan-kahveci",
        name: "Hasan Kahveci",
        secretIdentity: "Human",
        gender: "Erkek",
        role: "Egzotik Hayvan Tüccarı",
        image: "characters/hasan-kahveci.png",
        reading: 19,
        dialogues: [
            "Gittiğimiz görevlerden para kazanıyor muyuz? Buradan cebim dolu çıkmak istiyorum.",
            "Hayır, o kısa kollu kıyafetlerden giymeyeceğim. Böyle iyiyim.",
            "Bir zamanlar Zeki isimli bir jako papağanım vardı. Ona ‘zeki’ demeyi öğretmiştim.",
            "Zeki, zeki, zeki, zekiiiiii! ZE— ZEK— ZEKİİİ! CİK CİK CİK!",
            "Görevlerden beş kuruş kazanmadım. Param nerede, Warden?"
        ]
    },
    {
        id: "katarina-jovanovic",
        name: "Katarina Jovanovic",
        secretIdentity: "Human",
        gender: "Kız",
        role: "Psikoloji Eğitimli Ev Hanımı",
        image: "characters/katarina-jovanovic.png",
        reading: 28,
        dialogues: [
            "Ne bakıyorsun? Gıcık mı oldun?",
            "İplerimle arama girilmesinden hoşlanmam.",
            "Ördüğüm bebeği hanımlardan birine vermeye çalıştım ama bir suratıma tükürmediği kaldı. Buradakiler çok kaba.",
            "Sekiz yüzüncü örgümde kocam beni almaya gelecek.",
            "Bu öğlen yemekhanede meyveli turta yediğimi zannettim ama bana onun çemenli pastırma olduğunu söylediler?"
        ]
    },
    {
        id: "milena-marvic",
        name: "Milena Marvic",
        secretIdentity: "Human",
        gender: "Kız",
        role: "Eski Ünlü Müzisyen",
        image: "characters/milena-marvic.png",
        reading: 8,
        dialogues: [
            "Bugün çok kötü görünüyorum. Fanlarım beni böyle görmediği için mutluyum.",
            "Şu mektuplara bir bakın! Herkes benim bir an önce sahnelere geri dönmemi istiyor gibi.",
            "Bu ruj markası bende alerji yapıyor. Dudaklarım o yüzden bu kadar şişkin.",
            "Bu ruj markası bende alerji yapıyor. Dudaklarım o yüzden bu kadar şişkin.",
            "PO— PO— MA! YAPTIM BEN DE BİR Hİ— PO— TEZ! MA— MA— MA— MA!"
        ]
    },
    {
        id: "shane-smith",
        name: "Shane Smith",
        secretIdentity: "Corrupted",
        gender: "Erkek",
        role: "Market Çalışanı",
        image: "characters/shane-smith.png",
        reading: 78,
        dialogues: [
            "Ne bakıyovsun lan? Komik biv şev mi vav?",
            "Kimseyle konuşmak istemiyovum. Rahat bıvak beni.",
            "Bu— buvası ço— çok daha güvenli. Dışavısı ovospu çocuvu dolu.",
            "Gaviba senden hoşvandım, Wavden Bey. Bana diverlerinden daha iyi davvanıyovsun.",
            "Kimseye söyvemeyin ama buvada hoşvandığım çok hoş biv hanımefendi vav."
        ]
    },
    {
        id: "paul-h-simmons",
        name: "Paul H. Simmons",
        secretIdentity: "Corrupted",
        gender: "Erkek",
        role: "Sokak Performansçısı",
        image: "characters/paul-h-simmons.png",
        reading: 88,
        dialogues: [
            "Vay Henry Başkan. Seni görmeyeli uzun zaman olmuştu.",
            "Tesiste beğendiğim bir fıstık var. Onun da beni beğendiğini biliyorum.",
            "Burası sokaktaki yaşamımdan daha güvenli hissettirmiyor.",
            "Uzun süredir elmalı tütüne hasretim. Şimdi bir tane yakmak vardı.",
            "Üstümdeki kokunun sebebi, suların uzun süredir kesik olmasından kaynaklı."
        ]
    },
    {
        id: "sergio-galvez",
        name: "Sergio Galvez II.",
        secretIdentity: "Human",
        gender: "Erkek",
        role: "Huzurevi Çalışanı",
        image: "characters/sergio-galvez.png",
        reading: 42,
        dialogues: [
            "Herkesle anlaşabilmek gibi garip bir huya sahibim. Sanırım bende şeytan tüyü var, hehehe.",
            "Gelenekselliğe ayak uyduramayanları anlamıyorum. Zaten teknolojilerle aram yok.",
            "Huzurevinde çalışırken isimleri karıştırdığım olurdu. İnsan her gün aynı saatte aynı ilaçları dağıtınca yüzler birbirine benziyor.",
            "Dün gece biri beni eski sakinlerden birinin adıyla çağırdı. Ses tanıdık geliyordu ama cevap vermedim.",
            "Bu sabah yatağımın altında bir çift terlik buldum. Benim değildi ama ayaklarıma tam oldu."
        ]
    },
    {
        id: "father-gregory",
        name: "Father Gregory",
        secretIdentity: "Corrupted",
        gender: "Erkek",
        role: "Din Adamı",
        image: "characters/father-gregory.png",
        reading: 84,
        dialogues: [
            "Affedersin, Warden. İncil okumaya daldım, sizi fark edemedim.",
            "Tanrı bizi gözetliyor. Burada veya dışarıda yaşanan hiçbir şey gizli kalmaz.",
            "Babamız bize bu çöküşe yol açan her etkeni ortadan kaldıracağına söz veriyor. Tanrı’ya kulak verin.",
            "Yaşım gereği tuvalete giderken zorlanıyorum. Ama bu da her canlının sınavı.",
            "Bu tesise ilk geldiğimde şükürsüz biriydim. Artık canlı olduğum her güne teşekkür ediyorum."
        ]
    },
    {
        id: "nina-grace",
        name: "Nina Grace",
        secretIdentity: "Human",
        gender: "Kız",
        role: "Çizer",
        image: "characters/nina-grace.png?v=3",
        reading: 14,
        dialogues: [
            "Bugün hava çok güzel. İçeride yağlı boya tabloma mı devam etsem yoksa müzik mi dinlesem?",
            "Birkaç sene önce ailemle hayatımın en güzel kışını geçirmiştim. O zamanlar kar yağarken içtiğim sıcak çikolatayı ve evimin manzarasını resmettim.",
            "Neden geceleri deli gibi bağırıyorlar? Dün gece yatağımdan sıçrayarak uyandım!",
            "Ortak alanda kadın mahkûmlarla konuşmak bana daha güvenli hissettiriyor. Özellikle yaşı büyük erkeklerden korkuyorum.",
            "Kolumdaki yaraları kaşıdığım için sürekli kabuk bağlıyor ve kanıyor."
        ]
    }
];

// Daily Interview Unlock Schedule
const DAILY_INTERVIEW_SCHEDULE = {
    1: ["bob", "ted-karinsky", "m-cole-morgan", "alicia-winston"],
    2: ["evie-hill", "dakota-ahmadii"],
    3: ["hasan-kahveci", "katarina-jovanovic"],
    4: ["milena-marvic", "shane-smith"],
    5: ["paul-h-simmons", "sergio-galvez"],
    6: ["father-gregory", "nina-grace"],
    7: []
};

// Brain Scan Image Mapping
function getBrainScanImage(reading) {
    if (reading <= 19) return "brain-tests/brain-human.png";
    if (reading <= 44) return "brain-tests/brain-doubt-30.png";
    if (reading <= 69) return "brain-tests/brain-doubt-60.png";
    if (reading <= 89) return "brain-tests/brain-corrupted-80.png";
    return "brain-tests/brain-corrupted-100.png";
}

function drawRandomAnomalyReading() {
    return Math.floor(Math.random() * 45) + 55;
}

function drawRandomHumanReading() {
    return Math.floor(Math.random() * 45) + 5;
}

// Compute dialogue index strictly based on calendar day difference since introduction
function getCharacterDialogueIndex(person) {
    if (!person.introduced || person.introducedDay === null) {
        return 0; // G1
    }
    const offset = gameState.day - person.introducedDay;
    return Math.min(Math.max(0, offset), person.dialogues.length - 1);
}

// Generate Manifest for a New Campaign
function generateManifest() {
    return FACILITY_61_ROSTER.map(base => {
        const p = { ...base };

        if (p.secretIdentity === "Random") {
            const isCorrupted = Math.random() < 0.5;
            p.isAnomaly = isCorrupted;
            p.actualIdentity = isCorrupted ? "Corrupted" : "Human";

            if (p.id === "alicia-winston") {
                p.reading = isCorrupted ? (Math.floor(Math.random() * 15) + 65) : (Math.floor(Math.random() * 15) + 25);
            } else if (p.id === "dakota-ahmadii") {
                p.reading = isCorrupted ? (Math.floor(Math.random() * 15) + 72) : (Math.floor(Math.random() * 15) + 18);
            } else {
                p.reading = isCorrupted ? drawRandomAnomalyReading() : drawRandomHumanReading();
            }
        } else {
            p.isAnomaly = p.secretIdentity === "Corrupted";
            p.actualIdentity = p.secretIdentity;
        }

        return {
            ...p,
            arrivalDay: null,
            introduced: false,
            introducedDay: null,
            lastSpokenDay: null,
            isMet: false,
            isTested: false,
            isDead: false,
            isExecuted: false,
            isMissing: false,
            isEscaped: false,
            status: "Görüşülmedi",
            diedOnDay: null,
            pendingReturnCheck: false
        };
    });
}

// ==========================================
// STATE MANAGEMENT & HYDRATION PERSISTENCE
// ==========================================
const SAVE_KEY = "facility61_inmate_state_v2";

let gameState = {
    day: 1,
    energy: MAX_DAILY_ENERGY,
    stage: STAGE.INTRO,
    manifest: [],
    executionsUsed: 0,
    endReason: null,
    day3BriefingShown: false,
    brainTestGuideSeen: false,
    selectedTeam: [],
    tiredMap: {},
    missionStats: { success: 0, fail: 0, total: 0, deaths: 0, executions: 0, anomaliesPurged: 0, humansExecuted: 0, humansMissing: 0, anomaliesMissing: 0 },
    lastArrivals: [],
    newlyInterred: [],
    revealPersonId: null,
    activeConversationId: null,
    debugMode: false
};

function saveGameState() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.warn("Could not save gameState to localStorage", e);
    }
}

// Hydrates ONLY dynamic fields onto fresh canonical roster entries to prevent old save data from corrupting image/name/role assets
function loadSavedGameState() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed && Array.isArray(parsed.manifest) && parsed.manifest.length === ROSTER_SIZE) {
                const savedMap = {};
                parsed.manifest.forEach((p, idx) => {
                    const key = p.id || p.name || FACILITY_61_ROSTER[idx].id;
                    savedMap[key] = p;
                });

                parsed.manifest = FACILITY_61_ROSTER.map((canonical, idx) => {
                    const saved = savedMap[canonical.id] || savedMap[canonical.name] || parsed.manifest[idx] || {};

                    const introduced = typeof saved.introduced === "boolean" ? saved.introduced : Boolean(saved.isMet);
                    const introducedDay = (saved.introducedDay !== undefined && saved.introducedDay !== null)
                        ? saved.introducedDay
                        : (introduced ? (saved.arrivalDay || 1) : null);
                    const lastSpokenDay = (saved.lastSpokenDay !== undefined && saved.lastSpokenDay !== null)
                        ? saved.lastSpokenDay
                        : (introduced ? introducedDay : null);

                    return {
                        // Canonical static data (NEVER overwritten by old save!)
                        id: canonical.id,
                        name: canonical.name,
                        role: canonical.role,
                        gender: canonical.gender,
                        image: canonical.image,
                        dialogues: canonical.dialogues,
                        secretIdentity: canonical.secretIdentity,

                        // Dynamic state data
                        arrivalDay: saved.arrivalDay !== undefined ? saved.arrivalDay : (DAILY_INTERVIEW_SCHEDULE[1].includes(canonical.id) ? 1 : null),
                        introduced: introduced,
                        introducedDay: introducedDay,
                        lastSpokenDay: lastSpokenDay,
                        isMet: introduced,
                        isTested: Boolean(saved.isTested),
                        isDead: Boolean(saved.isDead),
                        isExecuted: Boolean(saved.isExecuted),
                        isMissing: Boolean(saved.isMissing),
                        isEscaped: Boolean(saved.isEscaped),
                        status: saved.status || (introduced ? "Tesiste ve müsait" : "Görüşülmedi"),
                        diedOnDay: saved.diedOnDay ?? null,
                        pendingReturnCheck: Boolean(saved.pendingReturnCheck),
                        isAnomaly: saved.isAnomaly !== undefined ? saved.isAnomaly : (canonical.secretIdentity === "Corrupted"),
                        actualIdentity: saved.actualIdentity || canonical.secretIdentity,
                        reading: (saved.reading !== undefined && saved.reading !== null) ? saved.reading : canonical.reading
                    };
                });

                parsed.brainTestGuideSeen = Boolean(parsed.brainTestGuideSeen);
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Error loading save state", e);
    }
    return null;
}

function clearSavedGameState() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {
        console.warn("Could not clear save state", e);
    }
}

// ==========================================
// IMAGE FALLBACK & ERROR HANDLER
// ==========================================
function handleImageError(imgEl, name, path) {
    console.warn(`Profil görseli yüklenemedi: ${name} — ${path}`);
    imgEl.style.display = "none";
    const fallback = imgEl.nextElementSibling;
    if (fallback) {
        fallback.style.display = "flex";
    }
}

// ==========================================
// QUERIES & HELPERS
// ==========================================
function presentPersonnel() {
    return gameState.manifest.filter(p => p.arrivalDay !== null && p.arrivalDay <= gameState.day);
}

function findPerson(personId) {
    return gameState.manifest.find(p => p.id === personId || String(p.id) === String(personId) || p.name === personId);
}

function restDaysLeft(personId) {
    return gameState.tiredMap[personId] || 0;
}

function isResting(personId) {
    return (gameState.tiredMap[personId] || 0) > 0;
}

function getCharacterCurrentStatus(person) {
    if (person.isExecuted) return "İnfaz edildi";
    if (person.isEscaped) return "Kaçtı";
    if (person.isMissing) return "Kayıp";
    if (person.isDead) return "Öldü";
    if (person.pendingReturnCheck) return "Dönüş kontrolü bekliyor";
    if (isResting(person.id)) return "Dinleniyor";
    if (gameState.selectedTeam.includes(person.id)) return "Görevde";
    if (!person.introduced) return "Tanışılmadı";
    if (person.lastSpokenDay === gameState.day) return "Bugün görüşüldü";
    return "Tesiste ve müsait";
}

function isDeployable(person) {
    if (!person.introduced || person.isDead || isResting(person.id) || person.pendingReturnCheck) {
        return false;
    }
    return true;
}

function executionsLeft() {
    return Math.max(0, EXECUTIONS_PER_DAY - gameState.executionsUsed);
}

function canExecuteToday() {
    return gameState.day >= EXECUTION_START_DAY;
}

function livingCounts() {
    const living = presentPersonnel().filter(p => !p.isDead);
    const anomalies = living.filter(p => p.isAnomaly).length;
    return { humans: living.length - anomalies, anomalies, total: living.length };
}

function isRiotCondition() {
    if (gameState.day < RIOT_START_DAY) return false;
    const c = livingCounts();
    return c.anomalies > c.humans;
}

function threatLevel() {
    const c = livingCounts();
    const gap = c.humans - c.anomalies;
    if (gameState.day < RIOT_START_DAY) return { label: "İZLENİYOR", color: "var(--text-muted)", key: "watch" };
    if (gap <= 1) return { label: "KRİTİK", color: "var(--accent-red)", key: "critical" };
    if (gap <= 3) return { label: "GERGİN", color: "var(--accent-orange)", key: "tense" };
    return { label: "STABİL", color: "var(--accent-green)", key: "stable" };
}

function checkCatastrophe() {
    if (gameState.endReason) return true;

    if (isRiotCondition()) {
        gameState.endReason = "riot";
        logEvent("⚡ ANOMALİ AYAKLANMASI! Anomaliler insanları sayıca geçti ve Facility 61'i ele geçirdi.", "fail");
        showGameOver("riot");
        saveGameState();
        return true;
    }

    if (gameState.missionStats.fail >= MAX_MISSION_FAILURES) {
        gameState.endReason = "fired";
        logEvent("🏛️ DEVLET MÜDAHALESİ! 3 başarısız görev sonrası Henry görevden alındı.", "fail");
        showGameOver("fired");
        saveGameState();
        return true;
    }

    return false;
}

function deployablePersonnel() {
    return presentPersonnel().filter(isDeployable);
}

function isUnderStrength() {
    return deployablePersonnel().length < requiredTeamSize();
}

function requiredTeamSize() {
    const quota = DAILY_DISPATCH_QUOTA[gameState.day] || 2;
    const deployable = presentPersonnel().filter(isDeployable).length;
    return Math.max(1, Math.min(quota, Math.max(1, deployable)));
}

// ==========================================
// MISSION RESOLUTION
// ==========================================
function resolveMission(team) {
    const size = team.length;
    const anomalyCount = team.filter(p => p.isAnomaly).length;
    const humanCount = size - anomalyCount;

    const missingPeople = [];

    let baseSuccess = 0.50 + (humanCount * 0.25) - (anomalyCount * 0.15);
    baseSuccess = Math.max(0.15, Math.min(0.95, baseSuccess));

    const humanLossChance = 0.15 + (anomalyCount * 0.10);
    const humans = team.filter(p => !p.isAnomaly);
    if (humans.length > 0 && Math.random() < humanLossChance) {
        const lostHuman = humans[Math.floor(Math.random() * humans.length)];
        missingPeople.push(lostHuman);
    }

    const anomalies = team.filter(p => p.isAnomaly);
    anomalies.forEach(anomaly => {
        if (Math.random() < 0.45) {
            missingPeople.push(anomaly);
        }
    });

    const isSuccess = (missingPeople.length < team.length) && (Math.random() < baseSuccess);

    return { isSuccess, missingPeople };
}

const SUCCESS_REPORTS = [
    "Saha hedeflerine ulaşıldı ve operasyon raporu teslim edildi.",
    "Bölge taraması tamamlandı, kritik numuneler tesise aktarıldı.",
    "Görev başarıyla sonuçlandı ve dış hatlar güvenceye alındı."
];

const FAILURE_REPORTS = [
    "Saha şartları beklenmedik şekilde ağırlaştı, operasyon yarıda kaldı.",
    "Görev sırasında koordinasyon bozuldu ve hedefler kaybedildi.",
    "Saha operasyonu başarısız oldu, ekip hedefe ulaşamadı."
];

function pickReport(isSuccess) {
    const pool = isSuccess ? SUCCESS_REPORTS : FAILURE_REPORTS;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ==========================================
// LIFECYCLE & INITIALIZATION
// ==========================================
function initGame() {
    clearSavedGameState();
    const manifest = generateManifest();

    const day1Ids = DAILY_INTERVIEW_SCHEDULE[1];
    day1Ids.forEach(id => {
        const p = manifest.find(x => x.id === id);
        if (p) p.arrivalDay = 1;
    });

    const isDebug = new URLSearchParams(window.location.search).has("debug") || window.DEBUG_FACILITY === true;

    gameState = {
        day: 1,
        energy: MAX_DAILY_ENERGY,
        stage: STAGE.INTRO,
        manifest: manifest,
        executionsUsed: 0,
        endReason: null,
        day3BriefingShown: false,
        brainTestGuideSeen: false,
        selectedTeam: [],
        tiredMap: {},
        missionStats: { success: 0, fail: 0, total: 0, deaths: 0, executions: 0, anomaliesPurged: 0, humansExecuted: 0, humansMissing: 0, anomaliesMissing: 0 },
        lastArrivals: day1Ids,
        newlyInterred: [],
        revealPersonId: null,
        activeConversationId: null,
        debugMode: isDebug
    };

    saveGameState();

    const logs = document.getElementById("simulation-logs");
    if (logs) logs.innerHTML = "";

    document.getElementById("intro-overlay").classList.remove("hidden");
    renderAll();
}

function beginCampaign() {
    document.getElementById("intro-overlay").classList.add("hidden");
    gameState.stage = STAGE.ARRIVAL;
    gameState.lastArrivals = DAILY_INTERVIEW_SCHEDULE[1] || [];
    logEvent(`Facility 61 protokolü başladı. İlk 4 mahkûmun görüşme programı açıldı.`, "system");
    saveGameState();
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
// BRAIN TEST GUIDE (MODAL CONTROLS)
// ==========================================
function openBrainTestGuide() {
    const guideModal = document.getElementById("brain-guide-modal");
    if (guideModal) guideModal.classList.remove("hidden");
}

function closeBrainTestGuide() {
    const guideModal = document.getElementById("brain-guide-modal");
    if (guideModal) guideModal.classList.add("hidden");
    if (!gameState.brainTestGuideSeen) {
        gameState.brainTestGuideSeen = true;
        saveGameState();
    }
}

// ==========================================
// STAGE FLOW
// ==========================================
function advanceStage() {
    gameState.activeConversationId = null;

    switch (gameState.stage) {
        case STAGE.ARRIVAL:
            gameState.newlyInterred = [];
            gameState.stage = STAGE.MEETING;
            logEvent(`Tanışma/Görüşme aşaması açıldı. Kalan Enerji: ⚡${gameState.energy}`, "system");
            break;

        case STAGE.MEETING:
            if (gameState.day === 1) {
                // Day 1 has NO testing stage: Tanışma -> Görev Sevki
                gameState.stage = STAGE.DISPATCH;
                logEvent(`Görev sevki açıldı. Bugün ${requiredTeamSize()} kişi göndermelisin. (Test sistemi 2. gün açılır)`, "system");
            } else {
                gameState.stage = STAGE.TESTING;
                logEvent(`Test aşaması açıldı. Test maliyeti: ⚡1 enerji.`, "system");
                if (gameState.day >= 2 && !gameState.brainTestGuideSeen) {
                    openBrainTestGuide();
                }
            }
            break;

        case STAGE.TESTING:
            if (canExecuteToday()) {
                gameState.stage = STAGE.EXECUTION;
                logEvent("İnfaz aşaması açıldı. Elektrikli sandalye hazır.", "system");
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
    saveGameState();
    renderAll();
}

function nextDay() {
    gameState.activeConversationId = null;

    // Rest fatigue for mission participants
    gameState.selectedTeam.forEach(id => {
        const member = findPerson(id);
        if (member && member.isDead) return;
        gameState.tiredMap[id] = Math.random() < 0.50 ? 2 : 1;
        if (member) member.pendingReturnCheck = false;
    });

    Object.keys(gameState.tiredMap).forEach(id => {
        if (!gameState.selectedTeam.includes(id)) {
            gameState.tiredMap[id] -= 1;
            if (gameState.tiredMap[id] <= 0) delete gameState.tiredMap[id];
        }
    });

    gameState.manifest.forEach(p => { p.pendingReturnCheck = false; });
    gameState.selectedTeam = [];

    if (gameState.day >= TOTAL_DAYS) {
        showGameOver("complete");
        saveGameState();
        return;
    }

    gameState.day += 1;
    gameState.energy = MAX_DAILY_ENERGY;
    gameState.executionsUsed = 0;
    gameState.stage = STAGE.ARRIVAL;

    // Daily unlock schedule
    const scheduledIds = DAILY_INTERVIEW_SCHEDULE[gameState.day] || [];
    scheduledIds.forEach(id => {
        const p = findPerson(id);
        if (p && p.arrivalDay === null) {
            p.arrivalDay = gameState.day;
        }
    });
    gameState.lastArrivals = scheduledIds;

    gameState.newlyInterred = gameState.manifest
        .filter(p => p.isDead && p.diedOnDay === gameState.day - 1)
        .map(p => p.id);

    if (scheduledIds.length > 0) {
        logEvent(`--- GÜN ${gameState.day} --- ${scheduledIds.length} mahkûmun görüşme programı açıldı. Enerji yenilendi (⚡8).`, "system");
    } else {
        logEvent(`--- GÜN ${gameState.day} --- Yeni mahkûm açılmadı. Enerji yenilendi (⚡8).`, "system");
    }

    saveGameState();
    renderAll();

    if (checkCatastrophe()) return;

    if (gameState.day === EXECUTION_START_DAY && !gameState.day3BriefingShown) {
        gameState.day3BriefingShown = true;
        const briefingModal = document.getElementById("day3-briefing-modal");
        if (briefingModal) briefingModal.classList.remove("hidden");
    }
}

// ==========================================
// INTERVIEW & INTRODUCTION ACTIONS (SINGLE STEP)
// ==========================================

function introducePerson(personId) {
    if (gameState.stage !== STAGE.MEETING) {
        flashNotice("Tanışma işlemi yalnızca Tanışma aşamasında yapılabilir.");
        return;
    }
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) {
        flashNotice("Bu mahkûmun görüşme programı henüz açılmadı.");
        return;
    }
    if (person.isDead) {
        flashNotice("Bu mahkûm artık tesiste değil.");
        return;
    }
    if (person.introduced) {
        flashNotice("Bu mahkûm ile zaten tanışıldı.");
        return;
    }
    if (gameState.energy < ENERGY_COST.INTERVIEW) {
        flashNotice(`Yetersiz Enerji! Tanışmak için ⚡${ENERGY_COST.INTERVIEW} enerji gerekli (Mevcut: ⚡${gameState.energy}).`);
        return;
    }

    gameState.energy -= ENERGY_COST.INTERVIEW;

    person.introduced = true;
    person.introducedDay = gameState.day;
    person.lastSpokenDay = gameState.day;
    person.isMet = true;

    gameState.activeConversationId = person.id;

    const g1Text = person.dialogues[0];
    logEvent(`🤝 ${person.name} (${person.role}) ile TANIŞILDI [G1]: "${g1Text}"`, "action");

    saveGameState();
    renderAll();
}

function speakToPerson(personId) {
    if (gameState.stage !== STAGE.MEETING) {
        flashNotice("Görüşmeler yalnızca Tanışma aşamasında yapılabilir.");
        return;
    }
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) {
        flashNotice("Bu mahkûmun görüşme programı henüz açılmadı.");
        return;
    }
    if (person.isDead || isResting(person.id) || person.pendingReturnCheck) {
        flashNotice(`${person.name} şu an görüşmeye müsait değil (${getCharacterCurrentStatus(person)}).`);
        return;
    }
    if (!person.introduced) {
        introducePerson(personId);
        return;
    }
    if (person.lastSpokenDay === gameState.day) {
        flashNotice(`${person.name} ile bugün zaten görüşüldü. Sonraki gün tekrar konuşabilirsin.`);
        return;
    }
    if (gameState.energy < ENERGY_COST.INTERVIEW) {
        flashNotice(`Yetersiz Enerji! Görüşme için ⚡${ENERGY_COST.INTERVIEW} enerji gerekli (Mevcut: ⚡${gameState.energy}).`);
        return;
    }

    gameState.energy -= ENERGY_COST.INTERVIEW;

    person.lastSpokenDay = gameState.day;

    const dIndex = getCharacterDialogueIndex(person);
    const text = person.dialogues[dIndex] || person.dialogues[person.dialogues.length - 1];

    gameState.activeConversationId = person.id;

    logEvent(`💬 ${person.name} (${person.role}) ile görüşüldü [G${dIndex + 1}]: "${text}"`, "action");

    saveGameState();
    renderAll();
}

function closeDialogue(personId) {
    if (gameState.activeConversationId === personId || !personId) {
        gameState.activeConversationId = null;
    }
    renderPersonnel();
}

function cancelInterview() {
    gameState.activeConversationId = null;
    renderPersonnel();
}

// ==========================================
// PLAYER ACTIONS (TESTING, EXECUTION, DISPATCH)
// ==========================================
function handleCardClick(personId) {
    const person = findPerson(personId);
    if (!person) return;

    switch (gameState.stage) {
        case STAGE.MEETING:
            if (person.arrivalDay === null || person.arrivalDay > gameState.day) {
                flashNotice("Bu mahkûmun görüşme programı henüz açılmadı.");
                return;
            }
            if (person.isDead) {
                flashNotice(`${person.introduced ? person.name : "Mahkûm"} artık tesiste değil.`);
                return;
            }
            if (!person.introduced) {
                introducePerson(person.id);
            } else if (person.lastSpokenDay === gameState.day) {
                if (gameState.activeConversationId === person.id) {
                    gameState.activeConversationId = null;
                } else {
                    gameState.activeConversationId = person.id;
                }
                renderPersonnel();
            } else {
                speakToPerson(person.id);
            }
            break;
        case STAGE.TESTING:
            testPerson(person.id);
            break;
        case STAGE.EXECUTION:
            executePerson(person.id);
            break;
        case STAGE.DISPATCH:
            toggleTeamMember(person.id);
            break;
        default:
            break;
    }
}

function testPerson(personId) {
    if (gameState.day === 1) {
        flashNotice("Test sistemi 2. günden itibaren aktif olacaktır.");
        return;
    }
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) return;
    if (gameState.stage !== STAGE.TESTING) return;

    if (person.isDead) {
        flashNotice(`${person.introduced ? person.name : "Mahkûm"} artık tesiste değil.`);
        return;
    }
    if (!person.introduced) {
        flashNotice("Bu mahkûm ile henüz tanışmadın. Tanışmadığın mahkûma test uygulanamaz.");
        return;
    }
    if (isResting(person.id)) {
        flashNotice(`${person.name} dinleniyor (${restDaysLeft(person.id)} gün). Dinlenen mahkûma test yapılamaz.`);
        return;
    }
    if (person.isTested) {
        showTestReveal(person);
        return;
    }

    if (gameState.energy < ENERGY_COST.TEST) {
        flashNotice(`Yetersiz Enerji! Test uygulamak için ⚡${ENERGY_COST.TEST} enerji gerekli.`);
        return;
    }

    gameState.energy -= ENERGY_COST.TEST;
    person.isTested = true;

    logEvent(`🧠 ${person.name} üzerinde beyin testi uygulandı.`, "action");
    saveGameState();
    showTestReveal(person);
    renderAll();
}

function executePerson(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) return;
    if (gameState.stage !== STAGE.EXECUTION) return;

    if (person.isDead) {
        flashNotice(`${person.introduced ? person.name : "Mahkûm"} zaten kadrodan düştü.`);
        return;
    }
    if (!person.introduced) {
        flashNotice("Bu mahkûm ile tanışmadın. Kimliği doğrulanmamış mahkûm infaz edilemez.");
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
    } else {
        gameState.missionStats.humansExecuted = (gameState.missionStats.humansExecuted || 0) + 1;
    }

    logEvent(`⚡ İNFAZ: ${person.name} elektrikli sandalyede infaz edildi. Hücresi boşaltıldı.`, "action");

    const idx = gameState.selectedTeam.indexOf(person.id);
    if (idx > -1) gameState.selectedTeam.splice(idx, 1);

    saveGameState();
    showExecutionReveal(person);
    renderAll();
    checkCatastrophe();
}

function toggleTeamMember(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) return;
    if (gameState.stage !== STAGE.DISPATCH) return;

    if (person.isDead) {
        flashNotice(`${person.introduced ? person.name : "Mahkûm"} aktif kadroda değil (${getCharacterCurrentStatus(person)}).`);
        return;
    }
    if (!person.introduced) {
        flashNotice("Bu mahkûm ile tanışmadın. Tanışmadığın mahkûm göreve gönderilemez.");
        return;
    }
    if (isResting(person.id)) {
        flashNotice(`${person.name} ${restDaysLeft(person.id)} gün daha dinlenecek, göreve gidemez.`);
        return;
    }
    if (person.pendingReturnCheck) {
        flashNotice(`${person.name} dönüş kontrolü bekliyor, yeni göreve gönderilemez.`);
        return;
    }

    const index = gameState.selectedTeam.indexOf(person.id);
    if (index > -1) {
        gameState.selectedTeam.splice(index, 1);
    } else {
        if (gameState.selectedTeam.length >= requiredTeamSize()) {
            flashNotice(`Bugün tam olarak ${requiredTeamSize()} kişi seçmelisin.`);
            return;
        }
        gameState.selectedTeam.push(person.id);
    }
    saveGameState();
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
    let missingPeople = [];
    let explanation;

    if (understrength) {
        isSuccess = false;
        explanation = "Sahaya sürecek yeterli mahkûm kalmadı. Görev daha başlamadan başarısız sayıldı.";
    } else {
        const outcome = resolveMission(team);
        isSuccess = outcome.isSuccess;
        missingPeople = outcome.missingPeople || [];
        explanation = pickReport(isSuccess);

        missingPeople.forEach(person => {
            person.isDead = true;
            person.diedOnDay = gameState.day;
            if (person.isAnomaly) {
                person.isEscaped = true;
                explanation += ` 🚪 ${person.name} operasyon sırasında kaçarak kayıplara karıştı.`;
            } else {
                person.isMissing = true;
                explanation += ` 🌫️ ${person.name} operasyon sırasında kayboldu.`;
            }
        });

        team.forEach(person => {
            if (!person.isDead) {
                person.pendingReturnCheck = true;
            }
        });
    }

    gameState.missionStats.total += 1;
    if (isSuccess) {
        gameState.missionStats.success += 1;
        logEvent(`GÜN ${gameState.day} GÖREVİ BAŞARILI! ${explanation}`, "success");
    } else {
        gameState.missionStats.fail += 1;
        logEvent(`GÜN ${gameState.day} GÖREVİ BAŞARISIZ! ${explanation}`, "fail");
    }

    missingPeople.forEach(person => {
        if (person.isAnomaly) {
            gameState.missionStats.anomaliesMissing = (gameState.missionStats.anomaliesMissing || 0) + 1;
            logEvent(`🚪 KAÇTI: ${person.name} tesisten firar etti. Hücresi boşaltıldı.`, "fail");
        } else {
            gameState.missionStats.humansMissing = (gameState.missionStats.humansMissing || 0) + 1;
            logEvent(`🌫️ KAYIP: ${person.name} adlı mahkûmdan haber alınamadı. Hücresi boşaltıldı.`, "fail");
        }
    });

    gameState.lastOutcome = { isSuccess, explanation, team, missingPeople };
    gameState.stage = STAGE.REPORT;
    saveGameState();
    renderAll();

    if (checkCatastrophe()) return;

    showMissionResultModal(isSuccess, explanation, team, missingPeople);
}

function flashNotice(message) {
    const el = document.getElementById("stage-notice");
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("visible"), 2600);
}

// ==========================================
// RENDERERS
// ==========================================
function renderStatus() {
    document.getElementById("current-day").textContent = `${gameState.day} / ${TOTAL_DAYS}`;

    const info = STAGE_INFO[gameState.stage] || { label: "—", clock: "—" };
    document.getElementById("current-stage").textContent = info.label;
    document.getElementById("current-time").textContent = info.clock;

    // Brain Test Guide button visibility (visible from Day 2+)
    const btnGuide = document.getElementById("btn-open-guide-modal");
    if (btnGuide) {
        if (gameState.day >= 2) {
            btnGuide.classList.remove("hidden");
        } else {
            btnGuide.classList.add("hidden");
        }
    }

    // Energy display
    const energyVal = document.getElementById("energy-value");
    if (energyVal) {
        energyVal.textContent = `⚡ ${gameState.energy} / ${MAX_DAILY_ENERGY}`;
    }
    const energyPips = document.getElementById("energy-pips");
    if (energyPips) {
        energyPips.innerHTML = "";
        for (let i = 0; i < MAX_DAILY_ENERGY; i++) {
            const pip = document.createElement("span");
            pip.className = `allowance-pip ${i < gameState.energy ? "active" : ""}`;
            energyPips.appendChild(pip);
        }
    }

    const rate = gameState.missionStats.total > 0
        ? Math.round((gameState.missionStats.success / gameState.missionStats.total) * 100)
        : 0;
    document.getElementById("mission-score").textContent =
        `${gameState.missionStats.success} Başarılı (%${rate})`;
    document.getElementById("failure-count").textContent =
        `${gameState.missionStats.fail} / ${MAX_MISSION_FAILURES}`;

    const threat = threatLevel();
    const threatBox = document.getElementById("threat-box");
    const threatValue = document.getElementById("threat-level");
    if (threatBox && threatValue) {
        threatBox.classList.remove("hidden");
        threatValue.textContent = threat.label;
        threatValue.style.color = threat.color;
    }

    const allowLabel = document.getElementById("allowance-label");
    const allowVal = document.getElementById("allowance-value");
    const allowPips = document.getElementById("allowance-pips");
    if (allowLabel && allowVal && allowPips) {
        let count = 0;
        let maxCount = 0;
        let label = "AŞAMA";

        switch (gameState.stage) {
            case STAGE.MEETING:
                label = "ENERJİ DURUMU";
                count = gameState.energy;
                maxCount = MAX_DAILY_ENERGY;
                break;
            case STAGE.TESTING:
                label = "ENERJİ DURUMU";
                count = gameState.energy;
                maxCount = MAX_DAILY_ENERGY;
                break;
            case STAGE.EXECUTION:
                label = "İNFAZ HAKKI";
                count = executionsLeft();
                maxCount = EXECUTIONS_PER_DAY;
                break;
            case STAGE.DISPATCH:
                label = "GEREKLİ EKİP";
                count = gameState.selectedTeam.length;
                maxCount = requiredTeamSize();
                break;
            default:
                label = info.label;
                count = 0;
                maxCount = 0;
                break;
        }

        allowLabel.textContent = label;
        allowVal.textContent = maxCount > 0 ? `${count} / ${maxCount}` : "—";
        allowPips.innerHTML = "";
        for (let i = 0; i < maxCount; i++) {
            const pip = document.createElement("span");
            pip.className = `allowance-pip ${i < count ? "active" : ""}`;
            allowPips.appendChild(pip);
        }
    }

    const present = presentPersonnel();
    const living = present.filter(p => !p.isDead);
    document.getElementById("met-count").textContent =
        `Tanışılan: ${living.filter(p => p.introduced).length}/${living.length}`;

    if (gameState.day === 1) {
        document.getElementById("tested-count").textContent = "Testler 2. Gün Açılır";
    } else {
        document.getElementById("tested-count").textContent =
            `Test Edilen: ${living.filter(p => p.isTested).length}/${living.length}`;
    }

    const lostCount = present.length - living.length;
    const lostBadge = document.getElementById("lost-count");
    lostBadge.textContent = `☠️ Kadro Dışı: ${lostCount}`;
    lostBadge.classList.toggle("has-losses", lostCount > 0);

    document.getElementById("roster-heading").textContent =
        `Facility 61 Mahkûmları (${present.length} / ${ROSTER_SIZE})`;
}

function isInterred(person) {
    return person.isDead && person.diedOnDay !== undefined && person.diedOnDay < gameState.day;
}

// Build Character Card
function buildRosterCard(person, stage) {
    const isDead = person.isDead;
    const isUnlocked = person.arrivalDay !== null && person.arrivalDay <= gameState.day;
    const card = document.createElement("div");

    // =========================================================================
    // 1. UNINTRODUCED CHARACTER CARD (STRICT ANONYMITY)
    // =========================================================================
    if (!person.introduced) {
        let buttonOrTagHtml = "";
        if (isDead) {
            buttonOrTagHtml = `<span class="tag tag-dead">💀 TESİSTE DEĞİL</span>`;
        } else if (!isUnlocked) {
            buttonOrTagHtml = `<span class="tag tag-locked">🔒 GÖRÜŞME PROGRAMINDA DEĞİL</span>`;
        } else {
            if (stage === STAGE.MEETING) {
                buttonOrTagHtml = `<button class="btn btn-action-card btn-tag-introduce" onclick="event.stopPropagation(); introducePerson('${person.id}');">TANIŞ ⚡2</button>`;
            } else {
                buttonOrTagHtml = `<span class="tag tag-not-met">Tanışılmadı</span>`;
            }
        }

        const isActionable = stage === STAGE.MEETING && isUnlocked && !isDead && gameState.energy >= ENERGY_COST.INTERVIEW;

        card.className = [
            "person-card",
            "is-unintroduced",
            isDead ? "is-dead" : "",
            isActionable ? "is-actionable" : "",
            isUnlocked && stage === STAGE.ARRIVAL && gameState.lastArrivals.includes(person.id) ? "is-arriving" : ""
        ].filter(Boolean).join(" ");
        card.dataset.id = person.id;

        card.innerHTML = `
            <div class="arrival-chip">G${person.arrivalDay || "—"}</div>
            <div class="character-avatar avatar-circle unknown-avatar">
                <span class="avatar-fallback" style="display:flex; font-size:1.8rem; font-weight:900; color:var(--text-muted);">?</span>
            </div>
            <div class="person-name unknown-name">BİLİNMEYEN MAHKÛM</div>
            <div class="person-role unknown-role">—</div>
            <div class="card-status-tags">${buttonOrTagHtml}</div>
        `;

        card.addEventListener("click", () => handleCardClick(person.id));
        return card;
    }

    // =========================================================================
    // 2. INTRODUCED CHARACTER CARD
    // =========================================================================
    const resting = !isDead && isResting(person.id);
    const isSelected = gameState.selectedTeam.includes(person.id);
    const spokenToday = person.lastSpokenDay === gameState.day;
    const isConversing = gameState.activeConversationId === person.id;

    let actionable = false;
    if (!isDead && isUnlocked) {
        if (stage === STAGE.MEETING) actionable = !spokenToday && !resting && gameState.energy >= ENERGY_COST.INTERVIEW;
        else if (stage === STAGE.TESTING) actionable = (gameState.day > 1) && !person.isTested && !resting && gameState.energy >= ENERGY_COST.TEST;
        else if (stage === STAGE.EXECUTION) actionable = executionsLeft() > 0;
        else if (stage === STAGE.DISPATCH) actionable = !resting && !person.pendingReturnCheck;
    }

    card.className = [
        "person-card",
        "is-met",
        spokenToday ? "is-spoken-today" : "",
        resting ? "is-tired" : "",
        isSelected ? "selected-team" : "",
        isDead ? "is-dead" : "",
        person.isExecuted ? "is-executed" : "",
        isConversing ? "is-conversing active-dialogue-card" : "",
        actionable ? (stage === STAGE.EXECUTION ? "is-executable" : "is-actionable") : ""
    ].filter(Boolean).join(" ");
    card.dataset.id = person.id;

    const genderClass = person.gender === "Erkek" ? "male" : "female";

    let debugHtml = "";
    if (gameState.debugMode) {
        if (person.secretIdentity === "Human") {
            debugHtml = `<span class="debug-badge badge-human">Human</span>`;
        } else if (person.secretIdentity === "Corrupted") {
            debugHtml = `<span class="debug-badge badge-corrupted">Corrupted</span>`;
        } else if (person.secretIdentity === "Random") {
            debugHtml = `<span class="debug-badge badge-random">Random (${person.actualIdentity})</span>`;
        }
    }

    const avatarHtml = `
        <div class="character-avatar avatar-circle ${genderClass}">
            <img src="${person.image}" alt="${person.name}" onerror="handleImageError(this, '${person.name.replace(/'/g, "\\'")}', '${person.image}')" />
            <span class="avatar-fallback" style="display:none;">${person.name.charAt(0)}</span>
        </div>
    `;

    // Tested Brain Scan Badge (Neutral, no numbers, no color grading)
    let readingHtml = "";
    if (person.isTested && !isDead) {
        readingHtml = `<div class="reading-badge tested-brain-badge" title="Beyin Taramasını İncele" style="cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.72rem; color:#d2a8ff; font-weight:700; background:rgba(137,87,229,0.18); border:1px solid rgba(137,87,229,0.4); border-radius:4px; padding:2px 6px;">🧠 TARAMA</div>`;
    } else if (!isDead) {
        readingHtml = `<div class="reading-badge untested" title="Test Edilmedi">—</div>`;
    }

    const dIndex = getCharacterDialogueIndex(person);
    const currentSpeech = person.dialogues[dIndex] || person.dialogues[person.dialogues.length - 1];

    let inlineDialogueHtml = "";
    if (isConversing && !isDead) {
        inlineDialogueHtml = `
            <div class="inline-dialogue-active-container">
                <div class="inline-dialogue-speech">
                    <span class="dialogue-stage-chip" style="background:var(--accent-blue); color:#fff;">G${dIndex + 1}</span>
                    💬 "${currentSpeech}"
                </div>
                <div class="inline-dialogue-actions">
                    <button class="btn btn-close-dialogue" onclick="event.stopPropagation(); closeDialogue('${person.id}');">
                        Kapat ✕
                    </button>
                </div>
            </div>
        `;
    }

    // Status Tag or Action Button
    let buttonOrTagHtml = "";
    if (isDead) {
        buttonOrTagHtml = `<span class="tag tag-cell-empty">Hücre: BOŞ</span>`;
        if (person.isExecuted) buttonOrTagHtml += `<span class="tag tag-executed">⚡ İNFAZ EDİLDİ</span>`;
        else if (person.isEscaped) buttonOrTagHtml += `<span class="tag tag-escaped">🚪 KAÇTI</span>`;
        else if (person.isMissing) buttonOrTagHtml += `<span class="tag tag-missing">🌫️ KAYIP</span>`;
        else buttonOrTagHtml += `<span class="tag tag-dead">💀 ÖLDÜ</span>`;
    } else if (resting) {
        buttonOrTagHtml = `<span class="tag tag-tired">💤 Dinleniyor (${restDaysLeft(person.id)} gün)</span>`;
    } else if (person.pendingReturnCheck) {
        buttonOrTagHtml = `<span class="tag tag-check" style="background:rgba(210,153,34,0.2); color:#d29922;">🔍 Kontrol Bekliyor</span>`;
    } else if (stage === STAGE.TESTING) {
        if (person.isTested) {
            buttonOrTagHtml = `<span class="tag tag-tested-neutral" onclick="event.stopPropagation(); showTestReveal(findPerson('${person.id}'));">🧠 TEST UYGULANDI</span>`;
        } else {
            buttonOrTagHtml = `<button class="btn btn-action-card btn-tag-test" onclick="event.stopPropagation(); testPerson('${person.id}');">TEST ET ⚡1</button>`;
        }
    } else if (spokenToday) {
        buttonOrTagHtml = `<span class="tag tag-spoken-today">✓ BUGÜN GÖRÜŞÜLDÜ</span>`;
    } else {
        if (stage === STAGE.MEETING) {
            buttonOrTagHtml = `<button class="btn btn-action-card btn-tag-speak" onclick="event.stopPropagation(); speakToPerson('${person.id}');">KONUŞ ⚡2</button>`;
        } else {
            buttonOrTagHtml = `<span class="tag tag-met">Görüşülebilir (G${dIndex + 1})</span>`;
        }
    }

    if (isSelected && !isDead) {
        buttonOrTagHtml += `<span class="tag tag-team">✅ Görevde</span>`;
    }

    card.innerHTML = `
        ${readingHtml}
        <div class="arrival-chip">G${person.arrivalDay || "—"}</div>
        ${avatarHtml}
        <div class="person-name">${person.name}${debugHtml}</div>
        <div class="person-role">${person.role}</div>
        ${inlineDialogueHtml}
        <div class="card-status-tags">${buttonOrTagHtml}</div>
    `;

    const gaugeEl = card.querySelector(".tested-brain-badge");
    if (gaugeEl) {
        gaugeEl.addEventListener("click", (e) => {
            e.stopPropagation();
            showTestReveal(person);
        });
    }

    card.addEventListener("click", () => handleCardClick(person.id));
    return card;
}

function buildRecordCard(person, arrivingIndex) {
    const card = document.createElement("div");
    const isArriving = arrivingIndex >= 0;

    card.className = [
        "record-card",
        person.isExecuted ? "record-executed" : (person.isMissing ? "record-missing" : "record-lost"),
        isArriving ? "record-arriving" : ""
    ].filter(Boolean).join(" ");
    card.dataset.id = person.id;

    if (isArriving) {
        card.style.animationDelay = `${arrivingIndex * 260}ms`;
    }

    const verdict = `<span class="record-verdict verdict-hidden">GİZLİ</span>`;
    let cause = `<span class="record-cause">💀 ${getCharacterCurrentStatus(person)}</span>`;
    if (person.isExecuted) cause = `<span class="record-cause">⚡ İnfaz Edildi</span>`;
    else if (person.isEscaped) cause = `<span class="record-cause">🚪 Kaçtı</span>`;
    else if (person.isMissing) cause = `<span class="record-cause">🌫️ Kayıp</span>`;

    const displayName = person.introduced ? person.name : "Bilinmeyen Mahkûm";
    const avatarContent = person.introduced
        ? `<img src="${person.image}" alt="${person.name}" onerror="handleImageError(this, '${person.name.replace(/'/g, "\\'")}', '${person.image}')" /><span class="avatar-fallback" style="display:none; font-size:0.9rem;">💀</span>`
        : `<span class="avatar-fallback" style="display:flex; font-size:0.9rem; color:var(--text-muted);">?</span>`;

    card.innerHTML = `
        <div class="record-avatar character-avatar ${person.introduced ? "" : "unknown-avatar"}" style="width:32px; height:32px;">
            ${avatarContent}
        </div>
        <div class="record-body">
            <div class="record-name">${displayName}</div>
            <div class="record-meta">${cause}<span class="record-day">G${person.diedOnDay || "—"}</span></div>
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

        const ordered = [...interred].sort((a, b) => (b.diedOnDay || 0) - (a.diedOnDay || 0));
        let arrivingSeen = 0;
        ordered.forEach(person => {
            const isArriving = gameState.newlyInterred.includes(person.id);
            const arrivingIndex = isArriving ? arrivingSeen++ : -1;
            records.appendChild(buildRecordCard(person, arrivingIndex));
        });

        const summary = document.getElementById("records-summary");
        const executedCount = interred.filter(p => p.isExecuted).length;
        const missingCount = interred.length - executedCount;
        summary.innerHTML = `
            <span class="records-stat">⚡ ${executedCount} İnfaz</span>
            <span class="records-stat">🌫️ ${missingCount} Kayıp/Kaçak</span>
        `;
    }
}

function renderStagePanel() {
    const stage = gameState.stage;

    const pArrival = document.getElementById("panel-arrival");
    if (pArrival) pArrival.classList.toggle("hidden", stage !== STAGE.ARRIVAL);
    const pMeeting = document.getElementById("panel-meeting");
    if (pMeeting) pMeeting.classList.toggle("hidden", stage !== STAGE.MEETING);
    const pTesting = document.getElementById("panel-testing");
    if (pTesting) pTesting.classList.toggle("hidden", stage !== STAGE.TESTING);
    const pExecution = document.getElementById("panel-execution");
    if (pExecution) pExecution.classList.toggle("hidden", stage !== STAGE.EXECUTION);
    const pDispatch = document.getElementById("panel-dispatch");
    if (pDispatch) pDispatch.classList.toggle("hidden", stage !== STAGE.DISPATCH);
    const pReport = document.getElementById("panel-report");
    if (pReport) pReport.classList.toggle("hidden", stage !== STAGE.REPORT);

    const advanceBtn = document.getElementById("btn-advance-stage");
    let nextText = null;
    if (stage === STAGE.MEETING) {
        nextText = (gameState.day === 1) ? "GÖREV AŞAMASINA GEÇ" : "TEST AŞAMASINA GEÇ";
    } else if (stage === STAGE.TESTING) {
        nextText = canExecuteToday() ? "İNFAZ AŞAMASINA GEÇ" : "GÖREV AŞAMASINA GEÇ";
    } else {
        const nextInfo = STAGE_INFO[stage];
        nextText = nextInfo ? nextInfo.next : null;
    }

    if (nextText) {
        advanceBtn.classList.remove("hidden");
        advanceBtn.textContent = nextText;
    } else {
        advanceBtn.classList.add("hidden");
    }

    // ---- Arrival ----
    if (stage === STAGE.ARRIVAL) {
        const arrivals = gameState.manifest.filter(p => p.arrivalDay === gameState.day);
        document.getElementById("arrival-day").textContent = gameState.day;
        document.getElementById("arrival-count").textContent = arrivals.length;

        const list = document.getElementById("arrival-list");
        list.innerHTML = "";
        arrivals.forEach(person => {
            const row = document.createElement("div");
            row.className = "arrival-row";
            if (person.introduced) {
                row.innerHTML = `
                    <div class="character-avatar" style="width:28px; height:28px;">
                        <img src="${person.image}" alt="${person.name}" onerror="handleImageError(this, '${person.name.replace(/'/g, "\\'")}', '${person.image}')" />
                        <span class="avatar-fallback" style="display:none; font-size:0.8rem;">👤</span>
                    </div>
                    <span><strong>${person.name}</strong> (${person.role}) — Görüşme programı açıldı</span>
                `;
            } else {
                row.innerHTML = `
                    <div class="character-avatar unknown-avatar" style="width:28px; height:28px;">
                        <span class="avatar-fallback" style="display:flex; font-size:1rem; color:var(--text-muted);">?</span>
                    </div>
                    <span><strong>Bilinmeyen Mahkûm</strong> — Görüşme programı açıldı</span>
                `;
            }
            list.appendChild(row);
        });
    }

    // ---- Meeting ----
    if (stage === STAGE.MEETING) {
        const meetingRem = document.getElementById("meeting-remaining");
        if (meetingRem) meetingRem.textContent = `⚡${gameState.energy}`;
        const unmet = presentPersonnel().filter(p => !p.introduced && !p.isDead).length;
        const meetingUnmet = document.getElementById("meeting-unmet");
        if (meetingUnmet) meetingUnmet.textContent = unmet;
    }

    // ---- Testing (Day 2+) ----
    if (stage === STAGE.TESTING) {
        const testRem = document.getElementById("testing-remaining");
        if (testRem) testRem.textContent = `⚡${gameState.energy}`;
        const testable = presentPersonnel().filter(p => p.introduced && !p.isTested && !p.isDead && !isResting(p.id)).length;
        const testAvail = document.getElementById("testing-available");
        if (testAvail) testAvail.textContent = testable;
    }

    // ---- Execution (Day 3+) ----
    if (stage === STAGE.EXECUTION) {
        const execRem = document.getElementById("execution-remaining");
        if (execRem) execRem.textContent = executionsLeft();
        const eligible = presentPersonnel().filter(p => p.introduced && !p.isDead).length;
        const execElig = document.getElementById("execution-eligible");
        if (execElig) execElig.textContent = eligible;

        const threat = threatLevel();
        const box = document.getElementById("execution-threat");
        if (box) {
            box.textContent = `TESİS DURUMU: ${threat.label}`;
            box.style.color = threat.color;
            box.style.borderColor = threat.color;
        }
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
                const displayName = person.introduced ? person.name : "Bilinmeyen Mahkûm";
                const displayRole = person.introduced ? person.role : "—";
                const readingText = person.isTested ? "Test Edildi ⚡" : "Test Edilmedi";
                pill.innerHTML = `<span><strong>${displayName}</strong> (${displayRole})</span><span class="pill-reading">${readingText}</span><span class="btn-remove-pill" title="Çıkar">&times;</span>`;
                const removeBtn = pill.querySelector(".btn-remove-pill");
                if (removeBtn) {
                    removeBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        toggleTeamMember(person.id);
                    });
                }
                container.appendChild(pill);
            });
        }

        const dispatchBtn = document.getElementById("btn-dispatch");
        const warnBox = document.getElementById("dispatch-understrength");
        const understrength = isUnderStrength();

        warnBox.classList.toggle("hidden", !understrength);

        if (understrength) {
            dispatchBtn.disabled = false;
            dispatchBtn.textContent = "MAHKÛM YETERSİZ — GÜNÜ KAYBET";
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
// TEST REVEAL & EXECUTION MODALS (BRAIN SCAN)
// ==========================================
function showTestReveal(person) {
    const scanImg = getBrainScanImage(person.reading);
    const revealName = document.getElementById("reveal-name");
    if (revealName) {
        revealName.textContent = person.introduced ? `${person.name} — BEYİN TARAMASI` : "BEYİN TARAMASI";
    }

    const revealBody = document.getElementById("reveal-body");
    if (revealBody) {
        revealBody.innerHTML = `
            <div class="brain-scan-container">
                <img src="${scanImg}" alt="Beyin Taraması" class="brain-scan-img" onerror="handleImageError(this, 'Beyin Taraması', '${scanImg}')" />
            </div>
        `;
    }

    const modal = document.getElementById("test-reveal-modal");
    if (modal) modal.classList.remove("hidden");
}

function showExecutionReveal(person) {
    const modal = document.getElementById("execution-reveal-modal");
    const verdict = document.getElementById("execution-verdict");
    const body = document.getElementById("execution-reveal-body");

    document.getElementById("execution-reveal-name").textContent = person.introduced ? person.name : "BİLİNMEYEN MAHKÛM";
    document.getElementById("execution-reveal-role").textContent = person.introduced ? person.role : "—";

    verdict.textContent = "⚡ İNFAZ EDİLDİ";
    verdict.className = "execution-verdict verdict-executed";
    body.innerHTML = `
        <p>Mahkûmun protokolü sonlandırıldı ve hücresi boşaltıldı.</p>
        <p class="execution-consequence" style="color: var(--text-muted);">
            ❓ Kimlik Gizli: Anomali mi yoksa insan mı olduğu açıklanmadı.
        </p>
    `;

    modal.classList.remove("hidden");
}

function showMissionResultModal(isSuccess, explanation, team, missingPeople = []) {
    document.getElementById("result-title").textContent = `GÜN ${gameState.day} GÖREV RAPORU`;
    const badge = document.getElementById("result-badge");
    badge.textContent = isSuccess ? "GÖREV BAŞARILI ✅" : "GÖREV BAŞARISIZ ❌";
    badge.className = `mission-outcome-badge ${isSuccess ? "success" : "fail"}`;
    document.getElementById("result-desc").textContent = explanation;

    const breakdownList = document.getElementById("result-team-breakdown");
    breakdownList.innerHTML = "";
    team.forEach(person => {
        const isMissing = missingPeople && missingPeople.some(m => m.id === person.id);
        const row = document.createElement("div");
        row.className = `team-result-row ${isMissing ? "is-missing" : ""}`;
        const displayName = person.introduced ? person.name : "Bilinmeyen Mahkûm";
        const displayRole = person.introduced ? person.role : "—";
        const statusBadge = isMissing
            ? (person.isAnomaly
                ? `<span class="badge badge-missing" style="color: var(--accent-orange);">🚪 Kaçtı / Firar</span>`
                : `<span class="badge badge-missing">🌫️ Haber Alınamadı</span>`)
            : `<span class="badge" style="color: var(--text-secondary); background: rgba(255,255,255,0.05);">🚀 Görevden Döndü (Kontrol Bekliyor)</span>`;
        row.innerHTML = `<span><strong>${displayName}</strong> (${displayRole})</span>${statusBadge}`;
        breakdownList.appendChild(row);
    });

    document.getElementById("mission-result-modal").classList.remove("hidden");
}

function closeModals() {
    const testModal = document.getElementById("test-reveal-modal");
    if (testModal) testModal.classList.add("hidden");
    const resultModal = document.getElementById("mission-result-modal");
    if (resultModal) resultModal.classList.add("hidden");
    const execModal = document.getElementById("execution-reveal-modal");
    if (execModal) execModal.classList.add("hidden");
    const guideModal = document.getElementById("brain-guide-modal");
    if (guideModal) closeBrainTestGuide();
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
    const humansMissing = gameState.missionStats.humansMissing || 0;
    const anomaliesMissing = gameState.missionStats.anomaliesMissing || 0;

    statsElem.innerHTML = `
        Ulaşılan Gün: ${gameState.day} / ${TOTAL_DAYS}<br>
        Başarılı Görev: ${success} / ${total} (%${rate})<br>
        Başarısız Görev: ${gameState.missionStats.fail} / ${MAX_MISSION_FAILURES}<br>
        Kayıp İnsan: ${humansMissing}<br>
        Firar Eden Anomali: ${anomaliesMissing}<br>
        İnfaz Edilen Anomali: ${purged}<br>
        İnfaz Edilen İnsan: ${wrongful}<br>
        Hayatta Kalan: ${counts.humans} insan / ${counts.anomalies} anomali
    `;

    card.classList.remove("ending-riot", "ending-fired", "ending-win", "ending-loss");

    if (reason === "riot") {
        titleElem.textContent = "⚡ ANOMALİ AYAKLANMASI";
        card.classList.add("ending-riot");
        verdictElem.innerHTML = `<strong>Facility 61 düştü.</strong> Anomaliler insanları sayıca geçti ve
            direnecek kimse kalmadı. Kapılar içeriden mühürlendi.`;
    } else if (reason === "fired") {
        titleElem.textContent = "🏛️ GÖREVDEN ALINDIN";
        card.classList.add("ending-fired");
        verdictElem.innerHTML = `<strong>${MAX_MISSION_FAILURES} başarısız görev.</strong> Devlet denetimi
            tesise el koydu ve yetkin iptal edildi. Yerine başkası atandı.`;
    } else if (success >= 5 && counts.humans >= 4 && wrongful <= 1) {
        titleElem.textContent = "MÜKEMMEL TESİS ZAFERİ 🏆";
        card.classList.add("ending-win");
        verdictElem.innerHTML = `<strong>Facility 61 Başarıyla Kurtarıldı!</strong> 5'ten fazla görev tamamlandı ve insanlar korundu.`;
    } else if (success >= 5) {
        titleElem.textContent = "TESİS GÜVENDE";
        card.classList.add("ending-win");
        verdictElem.innerHTML = `<strong>Facility 61 Güvende!</strong> Ağır kayıplara rağmen asgari gereksinimler karşılandı.`;
    } else if (success >= 3) {
        titleElem.textContent = "KRİTİK HAYATTA KALMA";
        card.classList.add("ending-loss");
        verdictElem.innerHTML = `<strong>Kritik Hayatta Kalma!</strong> Tesis ağır hasar aldı fakat ayakta kaldı.`;
    } else {
        titleElem.textContent = "TESİS DÜŞTÜ";
        card.classList.add("ending-loss");
        verdictElem.innerHTML = `<strong>Tesis Düştü!</strong> Operasyonlar yetersiz kaldı.`;
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

    function startOrResume() {
        const saved = loadSavedGameState();
        if (saved) {
            gameState = saved;
            if (new URLSearchParams(window.location.search).has("debug")) {
                gameState.debugMode = true;
            }
            if (gameState.stage === STAGE.INTRO) {
                document.getElementById("intro-overlay").classList.remove("hidden");
            } else {
                document.getElementById("intro-overlay").classList.add("hidden");
            }
            renderAll();
        } else {
            initGame();
        }
    }

    if (!authGate || !authForm) {
        startOrResume();
        return;
    }

    if (sessionStorage.getItem("thefacility_unlocked") === "1") {
        authGate.classList.add("authenticated");
        startOrResume();
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
            startOrResume();
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

    const btnOpenGuide = document.getElementById("btn-open-guide-modal");
    if (btnOpenGuide) btnOpenGuide.addEventListener("click", openBrainTestGuide);
    const btnCloseGuide = document.getElementById("btn-close-guide-modal");
    if (btnCloseGuide) btnCloseGuide.addEventListener("click", closeBrainTestGuide);
    const btnCloseGuideX = document.getElementById("btn-close-guide-modal-x");
    if (btnCloseGuideX) btnCloseGuideX.addEventListener("click", closeBrainTestGuide);

    const btnRevealClose = document.getElementById("btn-reveal-close");
    if (btnRevealClose) btnRevealClose.addEventListener("click", closeModals);
    const btnRevealCloseX = document.getElementById("btn-reveal-close-x");
    if (btnRevealCloseX) btnRevealCloseX.addEventListener("click", closeModals);

    const btnExecClose = document.getElementById("btn-execution-close");
    if (btnExecClose) btnExecClose.addEventListener("click", closeModals);
    const btnDay3Close = document.getElementById("day3-briefing-modal");
    if (btnDay3Close) {
        btnDay3Close.addEventListener("click", () => {
            btnDay3Close.classList.add("hidden");
        });
    }
    const btnResultContinue = document.getElementById("btn-result-continue");
    if (btnResultContinue) btnResultContinue.addEventListener("click", closeModals);
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
// BOT BENCHMARK
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

function bandRisk(reading) {
    if (reading >= 70) return 1.00;
    if (reading >= 50) return 0.50;
    if (reading >= 30) return 1 / 3;
    return 0.00;
}

const BASE_ANOMALY_RATE = 6 / 14;

function untestedRisk(manifest) {
    const tested = manifest.filter(p => p.isTested);
    const untestedCount = manifest.length - tested.length;
    if (untestedCount <= 0) return BASE_ANOMALY_RATE;
    const totalAnomalies = manifest.filter(p => p.isAnomaly).length;
    const accounted = tested.reduce((sum, p) => sum + bandRisk(p.reading), 0);
    const remaining = totalAnomalies - accounted;
    return Math.max(0, Math.min(1, remaining / untestedCount));
}

function estimatedRisk(person, manifest) {
    return person.isTested ? bandRisk(person.reading) : untestedRisk(manifest);
}

function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
    const livingOn = (day) => manifest.filter(p => p.arrivalDay && p.arrivalDay <= day && !p.isDead);

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

    DAILY_INTERVIEW_SCHEDULE[1].forEach(id => {
        const p = manifest.find(x => x.id === id);
        if (p) p.arrivalDay = 1;
    });

    for (let day = 1; day <= TOTAL_DAYS; day++) {
        daysReached = day;

        if (day > 1) {
            const scheduled = DAILY_INTERVIEW_SCHEDULE[day] || [];
            scheduled.forEach(id => {
                const p = manifest.find(x => x.id === id);
                if (p && p.arrivalDay === null) p.arrivalDay = day;
            });
        }

        if (riotOn(day)) { endReason = "riot"; break; }

        const present = manifest.filter(p => p.arrivalDay && p.arrivalDay <= day && !p.isDead);

        // ---- MEETING ----
        let energy = MAX_DAILY_ENERGY;
        let unmet = present.filter(p => !p.introduced);
        unmet.slice(0, 3).forEach(p => {
            if (energy >= 2) {
                p.introduced = true;
                p.introducedDay = day;
                p.lastSpokenDay = day;
                p.isMet = true;
                energy -= 2;
            }
        });

        // ---- TESTING (Day 2+) ----
        if (day > 1 && botType !== "random") {
            let testable = present.filter(p => p.introduced && !p.isTested && !rest(p));
            testable.slice(0, 2).forEach(p => {
                if (energy >= 1) {
                    p.isTested = true;
                    energy -= 1;
                }
            });
        }

        // ---- EXECUTION (Day 3+) ----
        if (day >= EXECUTION_START_DAY && botType !== "random") {
            const candidates = manifest.filter(p => p.arrivalDay !== null && p.arrivalDay <= day && !p.isDead && p.introduced && p.isTested);
            let target = null;
            const proven = candidates.filter(p => p.reading >= 70).sort((a, b) => b.reading - a.reading);
            if (proven.length) {
                target = proven[0];
            } else if (botType === "counter" && gapOn(day) <= 2) {
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
        const deployable = manifest.filter(p => p.arrivalDay !== null && p.arrivalDay <= day && !p.isDead && p.introduced && !rest(p));
        const teamSize = Math.max(1, Math.min(DAILY_DISPATCH_QUOTA[day] || 2, Math.max(1, deployable.length)));

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
        let missingPeople = [];

        if (team.length !== teamSize) {
            isSuccess = false;
        } else {
            anomaliesSent += team.filter(p => p.isAnomaly).length;
            const outcome = resolveMission(team);
            isSuccess = outcome.isSuccess;
            missingPeople = outcome.missingPeople || [];
            missingPeople.forEach(p => {
                p.isDead = true;
                p.isMissing = true;
                if (!p.isAnomaly) deaths++;
            });
        }

        if (isSuccess) successfulDays++; else failures++;

        if (riotOn(day)) { endReason = "riot"; break; }
        if (failures >= MAX_MISSION_FAILURES) { endReason = "fired"; break; }

        // ---- FATIGUE ----
        const sentIds = team.map(p => p.id);
        sentIds.forEach(id => {
            const m = manifest.find(p => p.id === id);
            if (m && m.isDead) return;
            tiredMap[id] = Math.random() < 0.50 ? 2 : 1;
        });
        Object.keys(tiredMap).forEach(id => {
            if (!sentIds.includes(id)) {
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
