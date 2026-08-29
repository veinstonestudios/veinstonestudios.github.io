// THE FACILITY 61 -- 14 PERSONNEL ROSTER
//
// 14 Fixed Characters:
// 7 Human, 5 Corrupted, 2 Random (50% Human / 50% Corrupted at new game)
//
// Henry's Interview Unlock Schedule:
// Day 1: Ted Karinsky (5), M. Cole Morgan (8), Alicia Winston (12), Bob (1)   [4 Total]
// Day 2: Evie Hill (2), Dakota Ahmadii (3)                                    [2 Total]
// Day 3: Hasan Kahveci (4), Katarina Jovanovic (6)                            [2 Total]
// Day 4: Shane Smith (7), Milena Markic (9)                                   [2 Total]
// Day 5: Paul H. Simmons (10), Sergio Galvez II. (11)                         [2 Total]
// Day 6: PERSONEL-13 (13), PERSONEL-14 (14)                                   [2 Total]
// Day 7: No new characters unlocked                                           [0 Total]

const TOTAL_DAYS = 7;
const ROSTER_SIZE = 14;      // Exactly 14 Facility 61 personnel

// ---- Electric chair -----------------------------------------------------
const EXECUTION_START_DAY = 3;
const EXECUTIONS_PER_DAY = 1;

// ---- Anomaly riot -------------------------------------------------------
const RIOT_START_DAY = 3;

// ---- Government oversight -----------------------------------------------
const MAX_MISSION_FAILURES = 3;

// ---- Per-day allowances -------------------------------------------------
const MEETS_PER_DAY = 3;

function testsForDay(day) {
    return day === 1 ? 1 : 2;
}

function dispatchSizeForDay(day) {
    if (day === 1) return 1;
    if (day <= 3) return 2;
    return 3;
}

// ---- Stage machine ------------------------------------------------------
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

// ---- FACILITY 61: 14 Fixed Characters -----------------------------------
// Secret identities:
// Green: Human (7) | Red: Corrupted (5) | Yellow: Random (2)
const FACILITY_61_ROSTER = [
    { id: 1,  name: "Bob",                 secretIdentity: "Human",     gender: "Erkek", role: "Tesis Teknisyeni",          avatar: "👨‍🔧", reading: 16, dialogue: "Tesisin boruları geceleri garip sesler çıkarıyor, ama bu sadece genleşme." },
    { id: 2,  name: "Evie Hill",            secretIdentity: "Corrupted", gender: "Kız",   role: "İdari Koordinatör",         avatar: "👩‍💼", reading: 86, dialogue: "Her şey kontrol altında. Endişelenecek hiçbir şey yok, kesinlikle hiçbir şey." },
    { id: 3,  name: "Dakota Ahmadii",       secretIdentity: "Random",    gender: "Erkek", role: "Ağ Güvenlik Uzmanı",        avatar: "🧑‍💻", reading: null, dialogue: "Sistem loglarında açıklayamadığım veri anomalileri var." },
    { id: 4,  name: "Hasan Kahveci",        secretIdentity: "Human",     gender: "Erkek", role: "Lojistik & İaşe Sorumlusu", avatar: "👨‍🍳", reading: 19, dialogue: "Bugün sıcak çorba çıkardım. İnsan olmanın kıymetini bilmek lazım." },
    { id: 5,  name: "Ted Karinsky",         secretIdentity: "Corrupted", gender: "Erkek", role: "Güvenlik Amiri",             avatar: "👮‍♂️", reading: 92, dialogue: "Kapılar kapalı kaldığı sürece hepimiz güvendeyiz. İçeridekiler dahil." },
    { id: 6,  name: "Katarina Jovanovic",   secretIdentity: "Human",     gender: "Kız",   role: "Baş Biyolog",               avatar: "👩‍🔬", reading: 28, dialogue: "Hücre örneklerinde hücresel bozulma belirtileri arıyorum." },
    { id: 7,  name: "Shane Smith",          secretIdentity: "Corrupted", gender: "Erkek", role: "Ağır Muhafız",              avatar: "💂‍♂️", reading: 78, dialogue: "Bana verilen emirleri sorgulamam. Sadece uygularım." },
    { id: 8,  name: "M. Cole Morgan",       secretIdentity: "Human",     gender: "Erkek", role: "Arşiv Sorumlusu",           avatar: "👨‍🏫", reading: 32, dialogue: "Eski kayıtlara göre bu tesis ilk inşa edildiğinde çok daha farklıydı." },
    { id: 9,  name: "Milena Markic",        secretIdentity: "Human",     gender: "Kız",   role: "Tesis Hekimi",              avatar: "👩‍⚕️", reading: 8,  dialogue: "Nabızları dinlerken bazen normal ritmin dışında bir şeyler duyuyorum." },
    { id: 10, name: "Paul H. Simmons",      secretIdentity: "Corrupted", gender: "Erkek", role: "Sistem Denetçisi",          avatar: "🧑‍💼", reading: 88, dialogue: "Tesisin verimliliği her şeyden önce gelir. Duygular sadece gecikmeye yol açar." },
    { id: 11, name: "Sergio Galvez II.",    secretIdentity: "Human",     gender: "Erkek", role: "Reaktör Operatörü",         avatar: "👨‍🔧", reading: 42, dialogue: "Çekirdekteki basınç dengede, vardiyamı sağ salim bitirmek istiyorum." },
    { id: 12, name: "Alicia Winston",       secretIdentity: "Random",    gender: "Kız",   role: "İletişim Subayı",           avatar: "👩‍💻", reading: null, dialogue: "Dış dünyadan gelen frekanslar giderek zayıflıyor." },
    { id: 13, name: "PERSONEL-13",          secretIdentity: "Human",     gender: "Erkek", role: "Gözlemci Birim",            avatar: "🧑‍💼", reading: 12, dialogue: "Kayıtlar güncellendi. Gözlerim üzerinizde." },
    { id: 14, name: "PERSONEL-14",          secretIdentity: "Corrupted", gender: "Kız",   role: "Reaktif Birim",             avatar: "👤", reading: 96, dialogue: "..." }
];

// Henry's Interview Schedule per Day (All 14 are in facility from start)
const DAILY_INTERVIEW_SCHEDULE = {
    1: [5, 8, 12, 1],   // Ted Karinsky, M. Cole Morgan, Alicia Winston, Bob
    2: [2, 3],          // Evie Hill, Dakota Ahmadii
    3: [4, 6],          // Hasan Kahveci, Katarina Jovanovic
    4: [7, 9],          // Shane Smith, Milena Markic
    5: [10, 11],        // Paul H. Simmons, Sergio Galvez II.
    6: [13, 14],        // PERSONEL-13, PERSONEL-14
    7: []               // No new characters
};

function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function drawRandomAnomalyReading() {
    return Math.floor(Math.random() * 49) + 51;
}

function drawRandomHumanReading() {
    return Math.floor(Math.random() * 49) + 1;
}

function getReadingColor(reading) {
    if (reading >= 70) return "var(--accent-red)";
    if (reading >= 50) return "var(--accent-orange)";
    if (reading >= 30) return "#8bc34a";
    return "var(--accent-green)";
}

// Generate Manifest for a New Campaign
function generateManifest() {
    return FACILITY_61_ROSTER.map(base => {
        const p = { ...base };

        if (p.secretIdentity === "Random") {
            // Independent 50/50 roll for Dakota Ahmadii and Alicia Winston
            const isCorrupted = Math.random() < 0.5;
            p.isAnomaly = isCorrupted;
            p.actualIdentity = isCorrupted ? "Corrupted" : "Human";

            if (p.id === 3) { // Dakota Ahmadii
                p.reading = isCorrupted ? (Math.floor(Math.random() * 15) + 72) : (Math.floor(Math.random() * 15) + 18);
            } else if (p.id === 12) { // Alicia Winston
                p.reading = isCorrupted ? (Math.floor(Math.random() * 15) + 65) : (Math.floor(Math.random() * 15) + 28);
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
            isMet: false,
            isTested: false,
            isDead: false,
            isExecuted: false,
            isMissing: false,
            isEscaped: false,
            status: "AKTİF",
            diedOnDay: null
        };
    });
}

// ==========================================
// STATE MANAGEMENT & PERSISTENCE
// ==========================================
const SAVE_KEY = "facility61_saved_state";

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
    missionStats: { success: 0, fail: 0, total: 0, deaths: 0, executions: 0, anomaliesPurged: 0, humansExecuted: 0 },
    lastArrivals: [],
    newlyInterred: [],
    revealPersonId: null,
    debugMode: false
};

function saveGameState() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.warn("Could not save gameState to localStorage", e);
    }
}

function loadSavedGameState() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed && Array.isArray(parsed.manifest) && parsed.manifest.length === ROSTER_SIZE) {
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
// QUERIES & HELPERS
// ==========================================
function presentPersonnel() {
    return gameState.manifest.filter(p => p.arrivalDay !== null && p.arrivalDay <= gameState.day);
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
    return Math.max(0, MEETS_PER_DAY - gameState.meetsUsed);
}

function testsLeft() {
    return Math.max(0, testsForDay(gameState.day) - gameState.testsUsed);
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
        logEvent("⚡ ANOMALİ AYAKLANMASI! Anomaliler insanları sayıca geçti ve tesisi ele geçirdi.", "fail");
        showGameOver("riot");
        saveGameState();
        return true;
    }

    if (gameState.missionStats.fail >= MAX_MISSION_FAILURES) {
        gameState.endReason = "fired";
        logEvent("🏛️ DEVLET MÜDAHALESİ! Üç başarısız görev sonrası görevden alındın.", "fail");
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
    const deployable = presentPersonnel().filter(isDeployable).length;
    return Math.max(1, Math.min(dispatchSizeForDay(gameState.day), Math.max(1, deployable)));
}

// ==========================================
// MISSION RESOLUTION
// ==========================================
const MISSION_ODDS = {
    1: {
        0: { successChance: 1.00, lossChance: 0.40 },
        1: { successChance: 0.00, lossChance: 0.00 }
    },
    2: {
        0: { successChance: 1.00, lossChance: 0.30 },
        1: { successChance: 0.66, lossChance: 0.30 },
        2: { successChance: 0.00, lossChance: 0.00 }
    },
    3: {
        0: { successChance: 1.00, lossChance: 0.20 },
        1: { successChance: 0.66, lossChance: 0.20 },
        2: { successChance: 0.33, lossChance: 0.75 },
        3: { successChance: 0.00, lossChance: 0.00 }
    }
};

function resolveMission(team) {
    const size = team.length;
    const anomalyCount = team.filter(p => p.isAnomaly).length;
    const odds = (MISSION_ODDS[size] && MISSION_ODDS[size][anomalyCount]) || { successChance: 0, lossChance: 0 };

    const missingPeople = [];

    // 1. Calculate human loss risk
    const humans = team.filter(p => !p.isAnomaly);
    if (humans.length > 0 && Math.random() < odds.lossChance) {
        const lostHuman = humans[Math.floor(Math.random() * humans.length)];
        missingPeople.push(lostHuman);
    }

    // 2. Anomalies escaping (60% chance each)
    const anomalies = team.filter(p => p.isAnomaly);
    anomalies.forEach(anomaly => {
        if (Math.random() < 0.60) {
            missingPeople.push(anomaly);
        }
    });

    // 3. Determine success
    let isSuccess = false;
    if (size === 1 && humans.length === 1) {
        isSuccess = true;
    } else if (missingPeople.length === team.length) {
        isSuccess = false;
    } else {
        isSuccess = Math.random() < odds.successChance;
    }

    return { isSuccess, missingPeople };
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
// LIFECYCLE & INITIALIZATION
// ==========================================
function initGame() {
    clearSavedGameState();
    const manifest = generateManifest();

    // Day 1 Unlocks (4 characters: Ted Karinsky, M. Cole Morgan, Alicia Winston, Bob)
    const day1Ids = DAILY_INTERVIEW_SCHEDULE[1];
    day1Ids.forEach(id => {
        const p = manifest.find(x => x.id === id);
        if (p) p.arrivalDay = 1;
    });

    const isDebug = new URLSearchParams(window.location.search).has("debug") || window.DEBUG_FACILITY === true;

    gameState = {
        day: 1,
        stage: STAGE.INTRO,
        manifest: manifest,
        meetsUsed: 0,
        testsUsed: 0,
        executionsUsed: 0,
        endReason: null,
        day3BriefingShown: false,
        selectedTeam: [],
        tiredMap: {},
        missionStats: { success: 0, fail: 0, total: 0, deaths: 0, executions: 0, anomaliesPurged: 0, humansExecuted: 0 },
        lastArrivals: day1Ids,
        newlyInterred: [],
        revealPersonId: null,
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
    logEvent(`Facility 61 protokolü başladı. İlk 4 personelin görüşme programı açıldı.`, "system");
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
// STAGE FLOW
// ==========================================
function advanceStage() {
    switch (gameState.stage) {
        case STAGE.ARRIVAL:
            gameState.newlyInterred = [];
            gameState.stage = STAGE.MEETING;
            logEvent(`Tanışma aşaması açıldı. Bugün ${MEETS_PER_DAY} kişiyle görüşebilirsin.`, "system");
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
    saveGameState();
    renderAll();
}

function nextDay() {
    // Rest fatigue (1 or 2 days)
    gameState.selectedTeam.forEach(id => {
        const member = findPerson(id);
        if (member && member.isDead) return;
        gameState.tiredMap[id] = Math.random() < 0.50 ? 2 : 1;
    });

    Object.keys(gameState.tiredMap).forEach(id => {
        if (!gameState.selectedTeam.includes(Number(id))) {
            gameState.tiredMap[id] -= 1;
            if (gameState.tiredMap[id] <= 0) delete gameState.tiredMap[id];
        }
    });

    gameState.selectedTeam = [];

    if (gameState.day >= TOTAL_DAYS) {
        showGameOver("complete");
        saveGameState();
        return;
    }

    gameState.day += 1;
    gameState.meetsUsed = 0;
    gameState.testsUsed = 0;
    gameState.executionsUsed = 0;
    gameState.stage = STAGE.ARRIVAL;

    // Daily Unlocks according to Henry's interview schedule
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
        logEvent(`--- GÜN ${gameState.day} --- ${scheduledIds.length} personelin görüşme programı açıldı.`, "system");
    } else {
        logEvent(`--- GÜN ${gameState.day} --- Yeni görüşme kaydı yok. Mevcut kadro ile devam ediliyor.`, "system");
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
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) return;

    if (gameState.stage !== STAGE.MEETING) return;
    if (person.isDead) return;
    if (person.isMet) return;

    if (meetsLeft() <= 0) {
        flashNotice("Bugünkü tanışma hakkın bitti. Test aşamasına geçebilirsin.");
        return;
    }

    person.isMet = true;
    gameState.meetsUsed += 1;

    const dialogueText = person.dialogue ? ` — "${person.dialogue}"` : "";
    logEvent(`💬 ${person.name} ile görüşüldü (${person.role})${dialogueText}`, "action");
    saveGameState();
    renderAll();

    if (meetsLeft() <= 0) {
        flashNotice("Görüşme hakların bitti. Test aşamasına geçebilirsin.");
    }
}

function testPerson(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) return;

    if (gameState.stage !== STAGE.TESTING) return;

    if (person.isDead) {
        flashNotice(`${person.name} artık tesiste değil.`);
        return;
    }
    if (!person.isMet) {
        flashNotice(`${person.name} ile henüz görüşmedin. Tanışmadığın personele test yapılamaz.`);
        return;
    }
    if (isResting(personId)) {
        flashNotice(`${person.name} dinleniyor (${restDaysLeft(personId)} gün). Dinlenen personele test yapılamaz.`);
        return;
    }
    if (person.isTested) {
        showTestReveal(person);
        return;
    }
    if (testsLeft() <= 0) {
        flashNotice("Bugünkü test hakkın bitti. Görev aşamasına geçebilirsin.");
        return;
    }

    person.isTested = true;
    gameState.testsUsed += 1;

    logEvent(`🧬 ${person.name} test edildi (Ölçüm yapıldı).`, "action");
    saveGameState();
    showTestReveal(person);
    renderAll();

    if (testsLeft() <= 0) {
        flashNotice("Bugünkü test hakların bitti. Görev aşamasına geçebilirsin.");
    }
}

function executePerson(personId) {
    const person = findPerson(personId);
    if (!person || person.arrivalDay === null || person.arrivalDay > gameState.day) return;

    if (gameState.stage !== STAGE.EXECUTION) return;

    if (person.isDead) {
        flashNotice(`${person.name} zaten kadrodan düştü.`);
        return;
    }
    if (!person.isMet) {
        flashNotice(`${person.name} ile görüşmedin. Kimliği doğrulanmamış personel infaz edilemez.`);
        return;
    }
    if (executionsLeft() <= 0) {
        flashNotice("Bugünkü infaz hakkın bitti. Görev aşamasına geçebilirsin.");
        return;
    }

    person.isDead = true;
    person.isExecuted = true;
    person.status = "İNFAZ EDİLDİ";
    person.diedOnDay = gameState.day;
    gameState.executionsUsed += 1;
    gameState.missionStats.executions = (gameState.missionStats.executions || 0) + 1;

    if (person.isAnomaly) {
        gameState.missionStats.anomaliesPurged = (gameState.missionStats.anomaliesPurged || 0) + 1;
    } else {
        gameState.missionStats.humansExecuted = (gameState.missionStats.humansExecuted || 0) + 1;
    }

    logEvent(`⚡ İNFAZ: ${person.name} elektrikli sandalyede infaz edildi. Hücresi boşaltıldı.`, "action");

    const idx = gameState.selectedTeam.indexOf(personId);
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
        flashNotice(`${person.name} aktif kadroda değil (${person.status}).`);
        return;
    }
    if (!person.isMet) {
        flashNotice(`${person.name} ile görüşmedin. Tanışmadığın personel göreve gidemez.`);
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
        explanation = "Sahaya sürecek yeterli personel kalmadı. Görev daha başlamadan başarısız sayıldı.";
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
                person.status = "KAÇTI";
                explanation += ` 🚪 ${person.name} operasyon sırasında kaçarak kayıplara karıştı.`;
            } else {
                person.isMissing = true;
                person.status = "KAYIP";
                explanation += ` 🌫️ ${person.name} operasyon sırasında kayboldu.`;
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
            logEvent(`🌫️ KAYIP: ${person.name} adlı personelden haber alınamadı. Hücresi boşaltıldı.`, "fail");
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
    if (!allowLabel || !allowVal || !allowPips) return;

    let count = 0;
    let maxCount = 0;
    let label = "AŞAMA";

    switch (gameState.stage) {
        case STAGE.MEETING:
            label = "TANIŞMA HAKKI";
            count = meetsLeft();
            maxCount = MEETS_PER_DAY;
            break;
        case STAGE.TESTING:
            label = "TEST HAKKI";
            count = testsLeft();
            maxCount = testsForDay(gameState.day);
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

    const present = presentPersonnel();
    const living = present.filter(p => !p.isDead);
    document.getElementById("met-count").textContent =
        `Görüşülen: ${living.filter(p => p.isMet).length}/${living.length}`;
    document.getElementById("tested-count").textContent =
        `Test Edilen: ${living.filter(p => p.isTested).length}/${living.length}`;

    const lostCount = present.length - living.length;
    const lostBadge = document.getElementById("lost-count");
    lostBadge.textContent = `☠️ Kadro Dışı: ${lostCount}`;
    lostBadge.classList.toggle("has-losses", lostCount > 0);

    document.getElementById("roster-heading").textContent =
        `Facility 61 Personeli (${present.length} / ${ROSTER_SIZE})`;
}

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
    
    let avatarDisplay = "❓";
    if (person.isExecuted) avatarDisplay = "⚡";
    else if (person.isMissing) avatarDisplay = "🌫️";
    else if (person.isEscaped) avatarDisplay = "🚪";
    else if (isDead) avatarDisplay = "💀";
    else if (person.isMet) avatarDisplay = person.avatar;

    let readingHtml = "";
    if (person.isTested && !isDead) {
        const baseAngle = -55 + (person.reading / 100) * 110;
        readingHtml = `<div class="reading-badge tested-gauge" title="Ölçüm Kadranını Büyüt">
            <svg viewBox="0 0 38 22" class="mini-gauge-svg">
                <path d="M 5 18 A 14 14 0 0 1 33 18" fill="none" stroke="#233144" stroke-width="3"/>
                <path d="M 5 18 A 14 14 0 0 1 12 7" fill="none" stroke="#2ea043" stroke-width="3"/>
                <path d="M 12 7 A 14 14 0 0 1 24 7" fill="none" stroke="#d29922" stroke-width="3"/>
                <path d="M 24 7 A 14 14 0 0 1 33 18" fill="none" stroke="#da3633" stroke-width="3"/>
                <g style="transform-origin: 19px 18px; transform: rotate(${baseAngle}deg);">
                    <line x1="19" y1="18" x2="19" y2="4" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round"/>
                </g>
                <circle cx="19" cy="18" r="2.5" fill="#ff4d4d"/>
            </svg>
        </div>`;
    } else if (!isDead) {
        readingHtml = `<div class="reading-badge untested" title="Test Edilmedi">—</div>`;
    }

    let dialogueHtml = "";
    if (person.isMet && person.dialogue && !isDead) {
        dialogueHtml = `<div class="person-dialogue" title="${person.dialogue}">"${person.dialogue}"</div>`;
    }

    let tagsHtml = "";
    if (isDead) {
        tagsHtml += `<span class="tag tag-cell-empty">Hücre: BOŞ</span>`;
        if (person.isExecuted) {
            tagsHtml += `<span class="tag tag-executed">⚡ İNFAZ EDİLDİ</span>`;
        } else if (person.isEscaped) {
            tagsHtml += `<span class="tag tag-escaped">🚪 KAÇTI</span>`;
        } else if (person.isMissing) {
            tagsHtml += `<span class="tag tag-missing">🌫️ KAYIP</span>`;
        } else {
            tagsHtml += `<span class="tag tag-dead">💀 ÖLDÜ</span>`;
        }
    } else {
        if (!person.isMet) {
            tagsHtml += `<span class="tag tag-not-met">Görüşülmedi</span>`;
        } else {
            tagsHtml += `<span class="tag tag-met">Görüşüldü</span>`;
        }
        if (resting) tagsHtml += `<span class="tag tag-tired">💤 Dinleniyor (${restDaysLeft(person.id)} gün)</span>`;
        if (isSelected) tagsHtml += `<span class="tag tag-team">✅ Görevde</span>`;
        if (isNew) tagsHtml += `<span class="tag tag-new">🆕 Yeni Görüşme</span>`;
    }

    // Developer / Debug Mode indicator (Only visible when debug mode is ON)
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

    card.innerHTML = `
        ${readingHtml}
        <div class="arrival-chip">G${person.arrivalDay}</div>
        <div class="avatar-circle ${genderClass}">${avatarDisplay}</div>
        <div class="person-name">${person.name}${debugHtml}</div>
        <div class="person-role">${person.isMet ? person.role : "???"}</div>
        ${dialogueHtml}
        <div class="card-status-tags">${tagsHtml}</div>
    `;

    const gaugeEl = card.querySelector(".tested-gauge");
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
    let cause = `<span class="record-cause">💀 ${person.status || "Kayıp"}</span>`;
    if (person.isExecuted) cause = `<span class="record-cause">⚡ İnfaz Edildi</span>`;
    else if (person.isEscaped) cause = `<span class="record-cause">🚪 Kaçtı</span>`;
    else if (person.isMissing) cause = `<span class="record-cause">🌫️ Kayıp</span>`;

    const avatar = person.isExecuted ? "⚡" : (person.isEscaped ? "🚪" : (person.isMissing ? "🌫️" : "💀"));

    card.innerHTML = `
        <div class="record-avatar">${avatar}</div>
        <div class="record-body">
            <div class="record-name">${person.name}</div>
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
    if (stage === STAGE.TESTING) {
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
            row.innerHTML = `<span class="arrival-avatar">❓</span><span><strong>${person.name}</strong> — Görüşme programı açıldı</span>`;
            list.appendChild(row);
        });
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
                const readingText = person.isTested ? "Test Edildi ⚡" : "Test Edilmedi";
                pill.innerHTML = `<span>${person.avatar} ${person.name}</span><span class="pill-reading">${readingText}</span><span class="btn-remove-pill" title="Çıkar">&times;</span>`;
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
// TEST REVEAL
// ==========================================
function renderVoltmeterHtml(reading) {
    const baseAngle = -55 + (reading / 100) * 110;

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
                <span class="voltmeter-hint">⚡ Analog Kadran Ölçümü</span>
            </div>
        </div>
    `;
}

function showTestReveal(person) {
    document.getElementById("reveal-name").textContent = person.name;
    document.getElementById("reveal-role").textContent = person.role;
    document.getElementById("reveal-avatar").textContent = person.avatar;
    const dialogueHtml = (person.isMet && person.dialogue)
        ? `<div class="reveal-dialogue">💬 "${person.dialogue}"</div>`
        : "";
    document.getElementById("reveal-body").innerHTML = dialogueHtml + renderVoltmeterHtml(person.reading);
    document.getElementById("test-reveal-modal").classList.remove("hidden");
}

function showExecutionReveal(person) {
    const modal = document.getElementById("execution-reveal-modal");
    const verdict = document.getElementById("execution-verdict");
    const body = document.getElementById("execution-reveal-body");

    document.getElementById("execution-reveal-name").textContent = person.name;
    document.getElementById("execution-reveal-role").textContent = person.role;

    verdict.textContent = "⚡ İNFAZ EDİLDİ";
    verdict.className = "execution-verdict verdict-executed";
    body.innerHTML = `
        <p>Personelin protokolü sonlandırıldı ve hücresi boşaltıldı.</p>
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
        const statusBadge = isMissing
            ? (person.isAnomaly
                ? `<span class="badge badge-missing" style="color: var(--accent-orange);">🚪 Kaçtı / Firar</span>`
                : `<span class="badge badge-missing">🌫️ Haber Alınamadı</span>`)
            : `<span class="badge" style="color: var(--text-secondary); background: rgba(255,255,255,0.05);">🚀 Görevden Döndü</span>`;
        row.innerHTML = `<span>${isMissing ? (person.isAnomaly ? "🚪" : "🌫️") : person.avatar} <strong>${person.name}</strong> (${person.role})</span>${statusBadge}`;
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
    } else if (success >= 5) {
        titleElem.textContent = "FACILITY 61 GÜVENDE";
        card.classList.add("ending-win");
        verdictElem.innerHTML = `<strong>Facility 61 Güvende!</strong> Doğru kararlarla tesisi başarıyla korudun.`;
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

    const btnRevealClose = document.getElementById("btn-reveal-close");
    if (btnRevealClose) btnRevealClose.addEventListener("click", closeModals);
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

    // Day 1 unlocks
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
        let unmet = present.filter(p => !p.isMet);
        unmet = botType === "random" ? shuffle(unmet) : unmet.sort((a, b) => (a.arrivalDay || 1) - (b.arrivalDay || 1));
        unmet.slice(0, MEETS_PER_DAY).forEach(p => { p.isMet = true; });

        // ---- TESTING ----
        if (botType !== "random") {
            let testable = present.filter(p => p.isMet && !p.isTested && !rest(p));
            testable = (botType === "tester") ? shuffle(testable) : testable.sort((a, b) => (a.arrivalDay || 1) - (b.arrivalDay || 1));
            testable.slice(0, testsForDay(day)).forEach(p => { p.isTested = true; });
        }

        // ---- EXECUTION (Day 3+) ----
        if (day >= EXECUTION_START_DAY && botType !== "random") {
            const candidates = manifest.filter(p => p.arrivalDay !== null && p.arrivalDay <= day && !p.isDead && p.isMet && p.isTested);
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
        const deployable = manifest.filter(p => p.arrivalDay !== null && p.arrivalDay <= day && !p.isDead && p.isMet && !rest(p));
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
