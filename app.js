import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, update, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1-UDrqRzfUw_32nOzqT2mAozzab5DJZk",
  authDomain: "hamka-game.firebaseapp.com",
  databaseURL: "https://hamka-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hamka-game",
  storageBucket: "hamka-game.firebasestorage.app",
  messagingSenderId: "975050013138",
  appId: "1:975050013138:web:19f42c1c5f2b2d35d6300b",
  measurementId: "G-W4G3ZZ5R68"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const tg = window.Telegram?.WebApp;
try {
  tg?.expand();
  tg?.ready();
  if (tg?.viewportHeight) {
    document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
  }
  tg?.onEvent?.('viewportChanged', () => {
    if (tg?.viewportHeight) {
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
    }
  });
} catch (e) {}

let AdController = null;
const BOT_LINK = "https://t.me/hamka_game_bot";

const OFFLINE_MAX_SECONDS = 3 * 3600;
const OFFLINE_EARN_MULTIPLIER = 0.1;

const REFERRAL_MILESTONES = [
  { target: 3, id: 'ref_3', rewardLabel: 'Скін AIHamster + 1 Basic Case' },
  { target: 10, id: 'ref_10', rewardLabel: 'Банер Gradient Yellow + 1 Epic Case' },
  { target: 25, id: 'ref_25', rewardLabel: '1 Legendary Case + титул «Амбасадор Хомів»' }
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeGradientOrColor(val) {
  const str = String(val ?? '').trim();
  const safePattern = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\)|linear-gradient\([0-9a-zA-Zdeg,\s.#%()-]+\))$/;
  return safePattern.test(str) ? str : 'linear-gradient(90deg, #8a2be2, #da70d6)';
}

function isValidNickname(nick) {
  if (typeof nick !== 'string') return false;
  const trimmed = nick.trim();
  if (trimmed.length < 3 || trimmed.length > 16) return false;
  return /^[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ0-9_.\- ]{3,16}$/.test(trimmed);
}

function encodeNickToSlug(nick) {
  const bytes = new TextEncoder().encode(nick.trim().toLowerCase());
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return 'u_' + hex;
}

function getRegisterEmail(nick) {
  return `${encodeNickToSlug(nick)}@hamka.game`;
}

function getLegacyEmailCandidates(nick) {
  const candidates = [];
  const trimmed = nick.trim();
  if (trimmed.includes('@')) candidates.push(trimmed);
  const cleanNick = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanNick.length >= 3) candidates.push(cleanNick + '@hamka.game');
  return candidates;
}

const translations = {
  en: {
    loading: "Loading...",
    auth_subtitle: "Crypto clicker with upgrades",
    login: "Login",
    register: "Register",
    auth_hint: "🔒 Choose login method",
    btn_login: "👉 Login",
    btn_register: "📝 Register",
    or: "or",
    btn_tg: "📱 Login via Telegram",
    season: "🏆 Season 1",
    menu_tap: "Tap",
    menu_shop: "Shop",
    menu_games: "Games",
    menu_profile: "Profile",
    menu_inventory: "Inventory",
    menu_top: "Top",
    menu_settings: "Settings",
    shop_auto: "Auto",
    shop_upgrade: "Upgrades",
    shop_cases: "Cases",
    shop_cosmetics: "Cosmetics",
    roulette: "🎰 Roulette",
    roulette_title: "Roulette for Ad",
    roulette_desc: "Spin and get coins, XP, Homs or exclusive items!",
    spin_btn: "🎬 Spin for Ad",
    coins: "Coins",
    homs: "Homs",
    prestige: "Prestige",
    prestige_title: "🌟 Prestige",
    cases_title: "📦 Cases",
    banners_title: "🖼️ Banners",
    titles_title: "Titles",
    avatars_title: "Avatars",
    skins_title: "Skins",
    top_title: "🏆 Leaderboard",
    month_rewards_btn: "🏅 End-of-month rewards",
    month_rewards_title: "🏅 End-of-month rewards",
    settings_title: "⚙️ Settings",
    lang_label: "Language / Мова / Язык",
    hide_top_label: "Hide me from Leaderboard",
    logout_btn: "🚪 Log out",
    all: "All",
    cancel: "Cancel",
    close: "Close",
    player_profile: "Player Profile",
    change_nickname: "Change Nickname",
    save: "Save",
    take: "Take",
    energy: "Energy",
    buy: "Buy",
    sell: "Sell",
    owned: "Owned",
    max: "MAX",
    open_case: "Open Case",
    no_energy: "❌ No energy!",
    promo_title: "🎟 Referral Invite Link",
    promo_desc: "Friend gets 1 Basic Case immediately on entry! Reach milestones for skins, banners and Legendary Cases.",
    promo_share: "Share",
    invite_copied: "Invitation copied",
    my_invites_title: "👥 My Invites & Milestones",
    streak_title: "🔥 Daily Streak",
    claim_streak_btn: "🎁 Claim Reward",
    avatar_label: "Avatar",
    skin_prefix: "Skin",
    banner_prefix: "Banner",
    default_item: "Default",
    ad_case_title: "Case for Ad",
    ad_case_watch: "Watch",
    ad_case_claim: "Claim"
  },
  uk: {
    loading: "Завантаження...",
    auth_subtitle: "Крипто-клікер з апгрейдами",
    login: "Вхід",
    register: "Реєстрація",
    auth_hint: "🔒 Виберіть спосіб входу",
    btn_login: "👉 Увійти",
    btn_register: "📝 Зареєструватися",
    or: "або",
    btn_tg: "📱 Увійти через Telegram",
    season: "🏆 Сезон 1",
    menu_tap: "Гра",
    menu_shop: "Магазин",
    menu_games: "Ігри",
    menu_profile: "Профіль",
    menu_inventory: "Інвентар",
    menu_top: "Топ",
    menu_settings: "Налаштування",
    shop_auto: "Авто",
    shop_upgrade: "Прокачка",
    shop_cases: "Кейси",
    shop_cosmetics: "Косметика",
    roulette: "🎰 Рулетка",
    roulette_title: "Рулетка за рекламу",
    roulette_desc: "Крути та отримуй монети, XP, Хоми або ексклюзиви!",
    spin_btn: "🎬 Крутити за рекламу",
    coins: "Монети",
    homs: "Хоми",
    prestige: "Престиж",
    prestige_title: "🌟 Престиж",
    cases_title: "📦 Кейси",
    banners_title: "🖼️ Банери",
    titles_title: "Титули",
    avatars_title: "Аватарки",
    skins_title: "Скіни",
    top_title: "🏆 Топ гравців",
    month_rewards_btn: "🏅 Нагороди в кінці місяця",
    month_rewards_title: "🏅 Нагороди в кінці місяця",
    settings_title: "⚙️ Налаштування",
    lang_label: "Мова / Language / Язык",
    hide_top_label: "Не показувати мене в топі",
    logout_btn: "🚪 Вийти з акаунта",
    all: "Всі",
    cancel: "Скасувати",
    close: "Закрити",
    player_profile: "Профіль гравця",
    change_nickname: "Змінити нікнейм",
    save: "Зберегти",
    take: "Забрати",
    energy: "Енергія",
    buy: "Купити",
    sell: "Продати",
    owned: "Куплено",
    max: "МАКС",
    open_case: "Відкрити кейс",
    no_energy: "❌ Недостатньо енергії!",
    promo_title: "🎟 Реферальне посилання",
    promo_desc: "Друг отримує 1 Базовий кейс одразу при вході! За пороги запрошень — скіни, банери, кейси та титул.",
    promo_share: "Поділитися",
    invite_copied: "Запрошення скопійовано",
    my_invites_title: "👥 Мої запрошення та пороги",
    streak_title: "🔥 Денна серія",
    claim_streak_btn: "🎁 Забрати нагороду",
    avatar_label: "Аватарка",
    skin_prefix: "Скін",
    banner_prefix: "Банер",
    default_item: "Стандарт",
    ad_case_title: "Кейс за рекламу",
    ad_case_watch: "Дивитись",
    ad_case_claim: "Забрати"
  },
  ru: {
    loading: "Загрузка...",
    auth_subtitle: "Крипто-кликер с апгрейдами",
    login: "Вход",
    register: "Регистрация",
    auth_hint: "🔒 Выберите способ входа",
    btn_login: "👉 Войти",
    btn_register: "📝 Зарегистрироваться",
    or: "или",
    btn_tg: "📱 Войти через Telegram",
    season: "🏆 Сезон 1",
    menu_tap: "Игра",
    menu_shop: "Магазин",
    menu_games: "Игры",
    menu_profile: "Профиль",
    menu_inventory: "Инвентарь",
    menu_top: "Топ",
    menu_settings: "Настройки",
    shop_auto: "Авто",
    shop_upgrade: "Прокачка",
    shop_cases: "Кейсы",
    shop_cosmetics: "Косметика",
    roulette: "🎰 Рулетка",
    roulette_title: "Рулетка за рекламу",
    roulette_desc: "Крути и получай монеты, XP, Хомы или эксклюзивы!",
    spin_btn: "🎬 Крутить за рекламу",
    coins: "Монеты",
    homs: "Хомы",
    prestige: "Престиж",
    prestige_title: "🌟 Престиж",
    cases_title: "📦 Кейсы",
    banners_title: "🖼️ Баннеры",
    titles_title: "Титулы",
    avatars_title: "Аватарки",
    skins_title: "Скины",
    top_title: "🏆 Топ игроков",
    month_rewards_btn: "🏅 Награды в конце месяца",
    month_rewards_title: "🏅 Награды в конце месяца",
    settings_title: "⚙️ Настройки",
    lang_label: "Язык / Language / Мова",
    hide_top_label: "Не показывать меня в топе",
    logout_btn: "🚪 Выйти из аккаунта",
    all: "Все",
    cancel: "Отмена",
    close: "Закрыть",
    player_profile: "Профиль игрока",
    change_nickname: "Изменить никнейм",
    save: "Сохранить",
    take: "Забрать",
    energy: "Энергия",
    buy: "Купить",
    sell: "Продать",
    owned: "Куплено",
    max: "МАКС",
    open_case: "Открыть кейс",
    no_energy: "❌ Недостаточно энергии!",
    promo_title: "🎟 Реферальная ссылка",
    promo_desc: "Друг получает 1 Базовый кейс сразу при входе! За пороги приглашений — скины, баннеры, кейсы и титул.",
    promo_share: "Поделиться",
    invite_copied: "Приглашение скопировано",
    my_invites_title: "👥 Мои приглашения и пороги",
    streak_title: "🔥 Дневная серия",
    claim_streak_btn: "🎁 Забрать награду",
    avatar_label: "Аватарка",
    skin_prefix: "Скин",
    banner_prefix: "Баннер",
    default_item: "Стандарт",
    ad_case_title: "Кейс за рекламу",
    ad_case_watch: "Смотреть",
    ad_case_claim: "Забрать"
  }
};

let currentLang = localStorage.getItem('hamka_lang') || 'uk';
let isLoginMode = true;
let state = {
  coins: 0, homs: 0, energy: 200, maxEnergy: 200, xp: 0, prestige: 0,
  title: 'Новобранець', avatar: '🐭', nickname: '', publicId: '',
  activeSkin: 'default', activeBanner: 'default', holdings: {},
  purchasedTitles: [], purchasedAvatars: [], purchasedSkins: [], purchasedBanners: [],
  cases: {}, legendaryCases: 0, adWatches: 0,
  usedReferralCode: false, referredBy: '', invited: 0, claimedReferralMilestones: [], hideFromTop: false,
  streakCount: 0, lastStreakDay: '', claimedStreakDay: '', lostStreakCount: 0,
  tap3BoostGranted: false, coinBoostMult: 1, coinBoostExpiresAt: 0,
  lastRewardMonth: '', lastSeenAt: 0, tgChatId: null,
  upgrades: {
    tapLevel: 0, tapPower: 1, xpPerTap: 1,
    autoTapRate: 0, autoXpRate: 0, energyRate: 1
  }
};
let pendingTap = false;
let lastTapTime = 0;
let unsubscribeUserData = null;
let unsubscribeCrypto = null;
let gameLoop = null;
let cryptoInterval = null;
let renderDebounceTimer = null;
let currentUid = null;
let currentShopTab = 'auto';
let isAdmin = false;
let selectedCaseTypeToOpen = null;
let userDataReady = false;
let pendingStartParam = null;
let referralProcessing = false;
let dailyCheckDone = false;
let prestigeInProgress = false;
let cryptoState = {};

const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const gameScreen = document.getElementById('game-screen');
const authForm = document.getElementById('auth-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authNickname = document.getElementById('auth-nickname');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const authSubmit = document.getElementById('auth-submit');
const tgLoginBtn = document.getElementById('tg-login-btn');
const adminBtnBadge = document.getElementById('admin-btn-badge');

const tapCoinDisplay = document.getElementById('tap-coin-display');
const topCoins = document.getElementById('top-coins');
const topHoms = document.getElementById('top-homs');
const activeBoostBadge = document.getElementById('active-boost-badge');
const activeBoostText = document.getElementById('active-boost-text');
const bottomCoins = document.getElementById('bottom-coins');
const energyDisplay = document.getElementById('energy-label-text');
const energyDisplayBottom = document.getElementById('energy-label-bottom');
const autoEnergyLabel = document.getElementById('auto-energy-label');
const energyBar = document.getElementById('energy-bar');
const hamster = document.getElementById('hamster');
const tapArea = document.getElementById('tap-area');
const statusEl = document.getElementById('status');
const cryptoListEl = document.getElementById('crypto-list');
const shopListEl = document.getElementById('shop-list');
const leaderboardList = document.getElementById('leaderboard-list');
const btnMonthRewards = document.getElementById('btn-month-rewards');

const xpDisplay = document.getElementById('xp-display');
const xpNext = document.getElementById('xp-next');
const xpBar = document.getElementById('xp-bar');
const levelName = document.getElementById('level-name');
const autoTapLabel = document.getElementById('auto-tap-label');

const profBanner = document.getElementById('prof-banner');
const profAvatar = document.getElementById('prof-avatar');
const profNickname = document.getElementById('prof-nickname');
const profPublicId = document.getElementById('prof-public-id');
const profTitle = document.getElementById('prof-title');
const profTitleBadge = document.getElementById('prof-title-badge');
const profCoins = document.getElementById('prof-coins');
const profHoms = document.getElementById('prof-homs');
const profXp = document.getElementById('prof-xp');
const profPrestige = document.getElementById('prof-prestige');
const prestigeInfo = document.getElementById('prestige-info');

const streakDaysBadge = document.getElementById('streak-days-badge');
const streakDesc = document.getElementById('streak-desc');
const btnClaimStreak = document.getElementById('btn-claim-streak');
const btnRestoreStreak = document.getElementById('btn-restore-streak');

const invCases = document.getElementById('inv-cases');
const invBanners = document.getElementById('inv-banners');
const invTitles = document.getElementById('inv-titles');
const invAvatars = document.getElementById('inv-avatars');
const invSkins = document.getElementById('inv-skins');
const casesSection = document.getElementById('cases-section');

const modalViewProfile = document.getElementById('modal-view-profile');
const viewProfBanner = document.getElementById('view-prof-banner');
const viewProfAvatar = document.getElementById('view-prof-avatar');
const viewProfNick = document.getElementById('view-prof-nick');
const viewProfId = document.getElementById('view-prof-id');
const viewProfTitle = document.getElementById('view-prof-title');
const viewProfXp = document.getElementById('view-prof-xp');
const viewProfPrestige = document.getElementById('view-prof-prestige');

const modalNickname = document.getElementById('modal-nickname');
const newNicknameInput = document.getElementById('new-nickname-input');
const btnSaveNickname = document.getElementById('btn-save-nickname');
const btnChangeNickname = document.getElementById('btn-change-nickname');

const prestigeOverlay = document.getElementById('prestige-overlay');
const prestigeText = document.getElementById('prestige-text');

const caseOpenOverlay = document.getElementById('case-open-overlay');
const caseOpeningBox = document.getElementById('case-opening-box');
const caseRewardText = document.getElementById('case-reward-text');
const btnCloseCase = document.getElementById('btn-close-case');

const btnSpinRoulette = document.getElementById('btn-spin-roulette');
const rouletteStrip = document.getElementById('roulette-strip');

const languageSelect = document.getElementById('language-select');
const hideTopToggle = document.getElementById('hide-top-toggle');
const btnLogout = document.getElementById('btn-logout');

const minitabCrypto = document.getElementById('minitab-crypto');
const minitabRoulette = document.getElementById('minitab-roulette');
const miniContentCrypto = document.getElementById('mini-content-crypto');
const miniContentRoulette = document.getElementById('mini-content-roulette');

function showAuthFallback() {
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (authScreen && !currentUid) authScreen.classList.remove('hidden');
}

setTimeout(() => {
  if (loadingScreen && loadingScreen.style.display !== 'none' && !currentUid) {
    showAuthFallback();
  }
}, 4000);

function setLanguage(lang) {
  if (!translations[lang]) lang = 'uk';
  currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('hamka_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.innerText = translations[lang][key];
  });
  if (languageSelect) languageSelect.value = lang;
  setAuthMode(isLoginMode);
}

function setAuthMode(loginMode) {
  isLoginMode = loginMode;
  const t = translations[currentLang] || translations.uk;
  if (loginMode) {
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    if (authSubmit) authSubmit.innerHTML = t.btn_login;
  } else {
    tabRegister?.classList.add('active');
    tabLogin?.classList.remove('active');
    if (authSubmit) authSubmit.innerHTML = t.btn_register;
  }
  if (authError) authError.innerText = '';
}

function extractReferralCode(rawValue) {
  if (typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';
  const startappMatch = trimmed.match(/[?&]startapp=([^&#]+)/i);
  if (startappMatch && startappMatch[1]) {
    try { return decodeURIComponent(startappMatch[1]).trim(); } catch (e) { return startappMatch[1].trim(); }
  }
  return trimmed;
}

try {
  const sp = tg?.initDataUnsafe?.start_param;
  const parsed = extractReferralCode(sp);
  if (parsed.length > 0) pendingStartParam = parsed;
} catch (e) {}

const GITHUB_BASE = "https://raw.githubusercontent.com/lolord1k228-create/hamka-game/main/";
const GITHUB_RAW = GITHUB_BASE + "skins/";
const GITHUB_BANNERS = GITHUB_BASE + "Banners/";

const SKINS = [
  { id: 'skin_ai', name: 'AIHamster', file: 'ai_hamster.png', price: 50000 },
  { id: 'skin_neon', name: 'Neon Hamster', file: 'hamster.png', price: 5000000 },
  { id: 'skin_hom', name: 'HomHamster', file: 'homhamster.png', price: 1500, currency: 'homs' }
];

const BANNERS = [
  { id: 'banner_gradient_blue', name: 'Gradient Blue', file: 'gradientblue.png', legendaryOnly: true },
  { id: 'banner_gradient_yellow', name: 'Gradient Yellow', file: 'gradientyellow.png', price: 75000, currency: 'homs' },
  { id: 'banner_prestige_1', name: 'Prestige 1 Banner', file: 'gradientprestige1.png', reqPrestige: 1 },
  { id: 'banner_prestige_3', name: 'Prestige 3 Banner', file: 'gradientprestige3.png', reqPrestige: 3 },
  { id: 'banner_prestige_5', name: 'Prestige 5 Banner', file: 'gradientprestige5.png', reqPrestige: 5 }
];

let TITLES = [];
let AVATARS = [];

const CASE_TITLES = [
  { name: 'Новобранець', color: 'linear-gradient(90deg, #43cea2, #185a9d)' },
  { name: 'Амбасадор Хомів', color: 'linear-gradient(90deg, #f7971e, #ffd200)' },
  { name: 'Case Legend', color: 'linear-gradient(90deg, #ff0000, #ff8c00)' },
  { name: 'Lootbox King', color: 'linear-gradient(90deg, #00ff00, #00bfff)' },
  { name: 'Chosen', color: 'linear-gradient(90deg, #ffffff, #ffd700)' },
  { name: 'Shadow', color: 'linear-gradient(90deg, #2f4f4f, #000000)' }
];

const TOP_TITLES = [
  { name: '🥇 Top 1', color: 'linear-gradient(90deg, #ffd700, #ff8c00)' },
  { name: '🥈 Top 2', color: 'linear-gradient(90deg, #c0c0c0, #808080)' },
  { name: '🥉 Top 3', color: 'linear-gradient(90deg, #cd7f32, #8b4513)' }
];

const LEVELS = [
  { name: '0 beginner', xp: 0 },
  { name: '1 beginner', xp: 50 },
  { name: '2 beginner', xp: 200 },
  { name: '3 beginner', xp: 500 },
  { name: '4 beginner', xp: 1500 },
  { name: 'bronze 1', xp: 5000 },
  { name: 'bronze 2', xp: 10000 },
  { name: 'bronze 3', xp: 15000 },
  { name: 'silver 1', xp: 50000 },
  { name: 'silver 2', xp: 100000 },
  { name: 'silver 3', xp: 150000 },
  { name: 'gold 1', xp: 300000 },
  { name: 'gold 2', xp: 600000 },
  { name: 'gold 3', xp: 900000 }
];

const COINS = ['OLDHAM', 'NEWHAM', 'HAM', 'BHAM', 'PLAYERHOM'];
const INITIAL_PRICES = { OLDHAM: 100, NEWHAM: 250, HAM: 500, BHAM: 1000, PLAYERHOM: 50 };

const SHOP_ITEMS = {
  auto: [
    { id: 'autoTap', title: 'Auto Tap', desc: '+1 coin/sec', basePrice: 200, multiplier: 2, maxLevel: 999 },
    { id: 'autoXp', title: 'Auto XP', desc: '+1 XP/sec', basePrice: 1500, multiplier: 2, maxLevel: 999 },
    { id: 'energyRate', title: '+Energy Regen', desc: '+1 energy/sec', basePrice: 1000, multiplier: 10, maxLevel: 999 },
  ],
  upgrade: [
    { id: 'tap', title: 'Tap Power', desc: '+1 coin per tap', basePrice: 50, multiplier: 10, maxLevel: 9, prices: [50, 200, 2000, 5000, 20000, 50000, 150000, 500000, 2000000] },
    { id: 'xpTap', title: 'XP Tap', desc: '+1 XP per tap', basePrice: 50000, multiplier: 10, maxLevel: 5, prices: [50000, 500000, 5000000, 50000000, 500000000] },
    { id: 'maxEnergy', title: 'Max Energy', desc: '+50 max energy', basePrice: 50000, multiplier: 10, maxLevel: 5, prices: [50000, 500000, 5000000, 50000000, 500000000] },
  ]
};

function getShopPrice(itemId, level) {
  const allItems = [...SHOP_ITEMS.auto, ...SHOP_ITEMS.upgrade];
  const item = allItems.find(i => i.id === itemId);
  if (!item) return 0;
  if (item.prices && level < item.prices.length) return item.prices[level];
  if (item.prices && level >= item.prices.length) return Infinity;
  return Math.floor(item.basePrice * Math.pow(item.multiplier, level));
}

function getActiveCoinMultiplier(now = Date.now()) {
  if (state.coinBoostExpiresAt && now < state.coinBoostExpiresAt) {
    return state.coinBoostMult || 1;
  }
  return 1;
}

function formatDurationLeft(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}г ${m}хв`;
  if (m > 0) return `${m}хв ${s}с`;
  return `${s}с`;
}

function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayKey(date = new Date()) {
  const yDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return getTodayKey(yDate);
}

function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getPreviousMonthKey(date = new Date()) {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthKey(prev);
}

function getStreakRestoreCost(streakNum) {
  return Math.max(1, (streakNum * 10) - 1);
}

function canClaimStreakReward(todayKey = getTodayKey()) {
  return state.streakCount > 0 && state.claimedStreakDay !== todayKey;
}

function getQty(symbol) {
  const v = localStorage.getItem('qty_' + symbol);
  return v ? Math.max(1, parseInt(v, 10) || 1) : 1;
}
function setQty(symbol, val) { localStorage.setItem('qty_' + symbol, val); }

function showStatus(text) {
  if (!statusEl) return;
  statusEl.innerText = text;
  statusEl.classList.add('show');
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(() => statusEl.classList.remove('show'), 2600);
}

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
}

function formatPrice(p) {
  if (p >= 1e6) return (p / 1e6).toFixed(2) + 'M';
  if (p >= 1e3) return (p / 1e3).toFixed(2) + 'K';
  return p.toFixed(2);
}

function touchLastSeen() {
  if (!currentUid) return;
  update(ref(db, 'users/' + currentUid), { lastSeenAt: Date.now() }).catch(() => {});
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) touchLastSeen();
});
window.addEventListener('pagehide', touchLastSeen);

function initModalsAndCases() {
  document.querySelectorAll('#modal-case-qty .modal-btn.confirm').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.qty || btn.innerText.trim().toLowerCase();
      if (typeof window.openCasesBatch === 'function') {
        window.openCasesBatch(q);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.closest('.modal-btn.cancel')) {
        ov.classList.remove('show');
      }
    });
  });

  if (adminBtnBadge) {
    adminBtnBadge.addEventListener('click', () => {
      if (!isAdmin) return;
      document.getElementById('modal-admin')?.classList.add('show');
    });
  }
}

initModalsAndCases();

function renderCryptoListPreservingFocus() {
  const activeEl = document.activeElement;
  const activeSymbol = activeEl?.classList?.contains('crypto-input') ? activeEl.dataset.symbol : null;
  const selStart = activeSymbol ? activeEl.selectionStart : null;
  const selEnd = activeSymbol ? activeEl.selectionEnd : null;

  renderCryptoList();

  if (activeSymbol) {
    const nextInput = document.getElementById('qty-' + activeSymbol);
    if (nextInput) {
      nextInput.focus({ preventScroll: true });
      if (typeof selStart === 'number' && typeof selEnd === 'number') {
        try { nextInput.setSelectionRange(selStart, selEnd); } catch (_) {}
      }
    }
  }
}

function scheduleUiRefresh({ shop = false, profile = false, inventory = false, crypto = false } = {}) {
  renderUI();
  checkAutoPrestige();
  updateHamsterSkin();

  clearTimeout(renderDebounceTimer);
  renderDebounceTimer = setTimeout(() => {
    if (shop && document.getElementById('page-shop')?.classList.contains('active')) {
      renderShop();
    }
    if (profile && document.getElementById('page-profile')?.classList.contains('active')) {
      renderProfile();
    }
    if (inventory && document.getElementById('page-inventory')?.classList.contains('active')) {
      renderInventory();
    }
    if (crypto && document.getElementById('page-minigames')?.classList.contains('active')) {
      renderCryptoListPreservingFocus();
    }
  }, 180);
}

if (btnMonthRewards) {
  btnMonthRewards.addEventListener('click', () => {
    document.getElementById('modal-month-rewards')?.classList.add('show');
  });
}

languageSelect?.addEventListener('change', (e) => {
  setLanguage(e.target.value);
  if (currentUid) {
    update(ref(db, 'users/' + currentUid), { language: e.target.value }).catch(() => {});
  }
  scheduleUiRefresh({ shop: true, profile: true, inventory: true, crypto: true });
});

hideTopToggle?.addEventListener('change', async (e) => {
  const val = e.target.checked;
  state.hideFromTop = val;
  if (currentUid) {
    try {
      await update(ref(db, 'users/' + currentUid), { hideFromTop: val });
      showStatus('✅ Оновлено');
    } catch (err) {}
  }
});

btnLogout?.addEventListener('click', async () => {
  try {
    touchLastSeen();
    await signOut(auth);
    showStatus('Вийшли з акаунта');
  } catch (e) {}
});

setLanguage(currentLang);
tabLogin?.addEventListener('click', () => setAuthMode(true));
tabRegister?.addEventListener('click', () => setAuthMode(false));

async function autoLoginTelegram() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!tgUser) {
    showAuthFallback();
    return;
  }
  const email = `tg_${tgUser.id}@hamka.test`;
  const password = `Tg_${tgUser.id}_SecurePass_2026!`;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (createErr) {
      showAuthFallback();
    }
  }
}

async function handleAuthSubmit(e) {
  if (e) e.preventDefault();
  const nick = authNickname?.value.trim() || '';
  const password = authPassword?.value || '';
  if (!isValidNickname(nick)) {
    if (authError) authError.innerText = 'Нікнейм: 3–16 символів (літери, цифри, _, ., -)';
    return;
  }
  if (password.length < 6) {
    if (authError) authError.innerText = 'Пароль мінімум 6 символів';
    return;
  }

  if (authSubmit) authSubmit.disabled = true;
  if (authError) authError.innerText = '';
  try {
    if (isLoginMode) {
      try {
        await signInWithEmailAndPassword(auth, getRegisterEmail(nick), password);
      } catch (primaryErr) {
        const legacyCandidates = getLegacyEmailCandidates(nick);
        let loggedIn = false;
        for (const legacyEmail of legacyCandidates) {
          try {
            await signInWithEmailAndPassword(auth, legacyEmail, password);
            loggedIn = true;
            break;
          } catch (_) {}
        }
        if (!loggedIn) throw primaryErr;
      }
    } else {
      await createUserWithEmailAndPassword(auth, getRegisterEmail(nick), password);
    }
  } catch (err) {
    if (authError) authError.innerText = err.message;
  } finally {
    if (authSubmit) authSubmit.disabled = false;
  }
}

authForm?.addEventListener('submit', handleAuthSubmit);

tgLoginBtn?.addEventListener('click', async () => {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!tgUser) { if (authError) authError.innerText = 'Відкрийте через бота Telegram'; return; }
  try {
    await signInWithEmailAndPassword(auth, `tg_${tgUser.id}@hamka.test`, `Tg_${tgUser.id}_SecurePass_2026!`);
  } catch (e) {
    try {
      await createUserWithEmailAndPassword(auth, `tg_${tgUser.id}@hamka.test`, `Tg_${tgUser.id}_SecurePass_2026!`);
    } catch (err) {
      if (authError) authError.innerText = err.message;
    }
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUid = user.uid;
    userDataReady = false;
    dailyCheckDone = false;
    prestigeInProgress = false;
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (authScreen) authScreen.classList.add('hidden');
    if (gameScreen) gameScreen.classList.add('visible');

    if (typeof window.Adsgram !== 'undefined') {
      try { AdController = window.Adsgram.init({ blockId: "59759" }); } catch (e) {}
    }

    try { await loadGameData(); } catch (e) {}
    try { initGame(user.uid); } catch (e) {}
    try { initCryptoSystem(); } catch (e) {}
    try { checkAdminStatus(user.uid); } catch (e) {}
    try { initRoulette(); } catch (e) {}
  } else {
    currentUid = null;
    isAdmin = false;
    if (adminBtnBadge) adminBtnBadge.style.display = 'none';
    userDataReady = false;
    dailyCheckDone = false;
    prestigeInProgress = false;
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (authScreen) authScreen.classList.remove('hidden');
    if (gameScreen) gameScreen.classList.remove('visible');
    if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }
    if (unsubscribeCrypto) { unsubscribeCrypto(); unsubscribeCrypto = null; }
    if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
    if (cryptoInterval) { clearInterval(cryptoInterval); cryptoInterval = null; }
  }
});

autoLoginTelegram();

document.querySelectorAll('.menu-item[data-page]').forEach(item => {
  const activatePage = () => {
    document.querySelectorAll('.menu-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('page-' + item.dataset.page)?.classList.add('active');
    if (item.dataset.page === 'shop') renderShop();
    if (item.dataset.page === 'profile') renderProfile();
    if (item.dataset.page === 'inventory') renderInventory();
    if (item.dataset.page === 'top') loadLeaderboard();
    if (item.dataset.page === 'minigames') {
      minitabCrypto?.classList.add('active');
      minitabRoulette?.classList.remove('active');
      if (miniContentCrypto) miniContentCrypto.style.display = 'block';
      if (miniContentRoulette) miniContentRoulette.style.display = 'none';
    }
  };
  item.addEventListener('click', activatePage);
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activatePage();
    }
  });
});

minitabCrypto?.addEventListener('click', () => {
  minitabCrypto.classList.add('active');
  minitabRoulette?.classList.remove('active');
  if (miniContentCrypto) miniContentCrypto.style.display = 'block';
  if (miniContentRoulette) miniContentRoulette.style.display = 'none';
});

minitabRoulette?.addEventListener('click', () => {
  minitabCrypto?.classList.remove('active');
  minitabRoulette.classList.add('active');
  if (miniContentCrypto) miniContentCrypto.style.display = 'none';
  if (miniContentRoulette) miniContentRoulette.style.display = 'block';
});

document.querySelectorAll('.shop-tab[data-shop-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab[data-shop-tab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentShopTab = tab.dataset.shopTab;
    renderShop();
  });
});

async function loadGameData() {
  try {
    const titlesSnap = await get(ref(db, 'game_data/titles'));
    if (titlesSnap.exists()) {
      TITLES = Object.keys(titlesSnap.val()).map(id => ({ id, ...titlesSnap.val()[id] }));
    } else {
      TITLES = [
        { id: 'novobranets', name: 'Новобранець', price: 0, color: 'linear-gradient(90deg, #43cea2, #185a9d)', reqPrestige: 0 },
        { id: 'brnz', name: 'Bronze Hamster', price: 0, color: 'linear-gradient(90deg, #cd7f32, #8b4513)', reqPrestige: 1 },
        { id: 'slvr', name: 'Silver Hamster', price: 0, color: 'linear-gradient(90deg, #c0c0c0, #808080)', reqPrestige: 2 },
        { id: 'gld', name: 'Gold Hamster', price: 0, color: 'linear-gradient(90deg, #ffd700, #b8860b)', reqPrestige: 3 },
        { id: 'crypto_baron', name: 'Crypto Baron', price: 10000, color: 'linear-gradient(90deg, #ff9800, #ff5722)', reqPrestige: 0 },
        { id: 'tap_god', name: 'Tap God', price: 50000, color: 'linear-gradient(90deg, #00bcd4, #2196f3)', reqPrestige: 0 },
        { id: 'h_mag', name: "Хом'яковий Магнат", price: 100, currency: 'homs', color: 'linear-gradient(90deg, #2ecc71, #27ae60)', reqPrestige: 0 },
        { id: 'h_lord', name: 'Володар Хомів', price: 500, currency: 'homs', color: 'linear-gradient(90deg, #9b59b6, #8e44ad)', reqPrestige: 0 },
        { id: 'h_leg', name: "Легендарний Хом'як", price: 2000, currency: 'homs', color: 'linear-gradient(90deg, #f1c40f, #e67e22)', reqPrestige: 0 }
      ];
    }

    const avatarsSnap = await get(ref(db, 'game_data/avatars'));
    if (avatarsSnap.exists()) {
      AVATARS = Object.keys(avatarsSnap.val()).map(id => ({ id, ...avatarsSnap.val()[id] }));
    } else {
      AVATARS = [
        { id: 'dog', name: '🐶', price: 5000 },
        { id: 'cat', name: '🐱', price: 5000 },
        { id: 'lion', name: '🦁', price: 15000 },
        { id: 'panda', name: '🐼', price: 20000 },
        { id: 'unicorn', name: '🦄', price: 30000 }
      ];
    }
  } catch (err) {}
}

function applyBannerStyle(element, bannerId) {
  if (!element) return;
  if (!bannerId || bannerId === 'default') {
    element.style.backgroundImage = 'none';
    return;
  }
  const bObj = BANNERS.find(b => b.id === bannerId);
  if (bObj && bObj.file) {
    element.style.backgroundImage = `url('${GITHUB_BANNERS}${bObj.file}')`;
  } else {
    element.style.backgroundImage = 'none';
  }
}

async function syncPrestigeBanners(uid, prestigeLvl) {
  const unlockedIds = BANNERS
    .filter(b => b.reqPrestige && prestigeLvl >= b.reqPrestige)
    .map(b => b.id);

  const missing = unlockedIds.filter(id => !state.purchasedBanners.includes(id));
  if (missing.length > 0 && uid) {
    const nextBanners = Array.from(new Set([...state.purchasedBanners, ...missing]));
    state.purchasedBanners = nextBanners;
    await update(ref(db, 'users/' + uid), { purchasedBanners: nextBanners });
    showStatus(`🖼️ Відкрито банер за престиж ${prestigeLvl}!`);
  }
}

async function loadLeaderboard() {
  if (!leaderboardList) return;
  leaderboardList.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Завантаження...</div>';
  try {
    const snap = await get(ref(db, 'users'));
    const users = snap.val() || {};
    const arr = [];
    for (const uid in users) {
      const u = users[uid];
      if (u.hideFromTop) continue;
      arr.push({
        uid, nickname: u.nickname || 'Player', avatar: u.avatar || '🐭',
        title: u.title || 'Новобранець', activeSkin: u.activeSkin || 'default',
        activeBanner: u.activeBanner || 'default',
        publicId: u.publicId || '000000', xp: u.xp || 0, prestige: u.prestige || 0
      });
    }
    arr.sort((a, b) => b.prestige - a.prestige || b.xp - a.xp);
    const top10 = arr.slice(0, 10);

    leaderboardList.innerHTML = '';
    top10.forEach((u, i) => {
      const el = document.createElement('div');
      el.className = 'leaderboard-item';

      if (i < 3 && u.uid === currentUid) {
        const topTitle = TOP_TITLES[i].name;
        if (!state.purchasedTitles.includes(topTitle)) {
          update(ref(db, 'users/' + currentUid), { purchasedTitles: [...state.purchasedTitles, topTitle] }).catch(() => {});
        }
      }

      const titleObj = TITLES.find(t => t.name === u.title) || CASE_TITLES.find(t => t.name === u.title) || TOP_TITLES.find(t => t.name === u.title);
      const titleColor = sanitizeGradientOrColor(titleObj ? titleObj.color : 'linear-gradient(90deg, #8a2be2, #da70d6)');

      const safeNick = escapeHtml(u.nickname);
      const safeTitle = escapeHtml(u.title);
      const safeAvatar = escapeHtml(u.avatar);
      const safeId = escapeHtml(u.publicId);

      let avatarHtml = `<div class="lb-avatar">${safeAvatar}</div>`;
      if (u.activeSkin !== 'default') {
        const skinObj = SKINS.find(s => s.id === u.activeSkin);
        if (skinObj && skinObj.file) avatarHtml = `<div class="lb-avatar" style="background-image: url('${GITHUB_RAW}${escapeHtml(skinObj.file)}');"></div>`;
      }

      if (u.activeBanner && u.activeBanner !== 'default') {
        const bObj = BANNERS.find(b => b.id === u.activeBanner);
        if (bObj && bObj.file) {
          const bgDiv = document.createElement('div');
          bgDiv.className = 'profile-banner-bg';
          bgDiv.style.backgroundImage = `url('${GITHUB_BANNERS}${escapeHtml(bObj.file)}')`;
          el.appendChild(bgDiv);
        }
      }

      const inner = document.createElement('div');
      inner.style.display = 'flex';
      inner.style.alignItems = 'center';
      inner.style.gap = '10px';
      inner.style.width = '100%';
      inner.style.position = 'relative';
      inner.style.zIndex = '1';
      inner.innerHTML = `
        <div style="font-size:16px; font-weight:800; color:#f5a623; width:25px;">#${i + 1}</div>
        ${avatarHtml}
        <div class="lb-info">
          <div class="lb-name">${safeNick}</div>
          <div class="lb-title" style="background:${titleColor};">${safeTitle}</div>
        </div>
        <div class="lb-stats">
          <div class="lb-xp">${formatNumber(u.xp)} XP</div>
          <div class="lb-prestige">🌟 ${u.prestige}</div>
        </div>
      `;
      el.appendChild(inner);

      el.addEventListener('click', () => {
        if (viewProfNick) viewProfNick.innerText = u.nickname;
        if (viewProfId) viewProfId.innerText = 'ID: ' + safeId;
        if (viewProfTitle) {
          viewProfTitle.innerText = u.title;
          viewProfTitle.style.background = titleColor;
        }
        if (viewProfXp) viewProfXp.innerText = formatNumber(u.xp);
        if (viewProfPrestige) viewProfPrestige.innerText = u.prestige;
        applyBannerStyle(viewProfBanner, u.activeBanner);
        modalViewProfile?.classList.add('show');
      });
      leaderboardList.appendChild(el);
    });
  } catch (err) {}
}

async function processMonthlyTopAndStreak(uid, data) {
  if (dailyCheckDone) return;
  dailyCheckDone = true;

  const nowDate = new Date();
  const nowMs = Date.now();
  const todayKey = getTodayKey(nowDate);
  const yesterdayKey = getYesterdayKey(nowDate);
  const curMonth = getMonthKey(nowDate);
  const prevMonth = getPreviousMonthKey(nowDate);

  let monthlyRewardApplied = false;
  let boostMult = data.coinBoostMult || 1;
  let boostExpires = data.coinBoostExpiresAt || 0;
  if (nowMs >= boostExpires) {
    boostMult = 1;
    boostExpires = 0;
  }

  let rewardStatusMsg = '';

  if (data.lastRewardMonth && data.lastRewardMonth !== curMonth) {
    try {
      const snapSnap = await get(ref(db, 'monthly_top_snapshots/' + prevMonth));
      let rank = 0;
      if (snapSnap.exists()) {
        const list = snapSnap.val() || [];
        const found = list.find(item => item && item.uid === uid);
        if (found) rank = Number(found.rank) || 0;
      }

      if (rank === 1) {
        boostMult = 3;
        boostExpires = nowMs + 5 * 3600 * 1000;
        monthlyRewardApplied = true;
        rewardStatusMsg = '🏆 #1 за минулий місяць! Буст монет x3 на 5 год!';
      } else if (rank === 2) {
        boostMult = 3;
        boostExpires = nowMs + 2 * 3600 * 1000;
        monthlyRewardApplied = true;
        rewardStatusMsg = '🥈 #2 за минулий місяць! Буст монет x3 на 2 год!';
      } else if (rank === 3) {
        boostMult = 2;
        boostExpires = nowMs + 1 * 3600 * 1000;
        monthlyRewardApplied = true;
        rewardStatusMsg = '🥉 #3 за минулий місяць! Буст монет x2 на 1 год!';
      }
    } catch (e) {}
  }

  let newStreak = data.streakCount || 0;
  let lostStreak = data.lostStreakCount || 0;
  let streakChanged = false;

  if (data.lastStreakDay !== todayKey) {
    if (!data.lastStreakDay || data.lastStreakDay === yesterdayKey) {
      newStreak = (data.streakCount || 0) + 1;
      lostStreak = 0;
      streakChanged = true;
    } else if ((data.streakCount || 0) > 0) {
      lostStreak = data.streakCount || 0;
      newStreak = 0;
      streakChanged = true;
    } else {
      newStreak = 1;
      lostStreak = 0;
      streakChanged = true;
    }

    if (newStreak > 0 && !rewardStatusMsg) {
      rewardStatusMsg = `🔥 День ${newStreak}! Зайди у Профіль та натисни «Забрати нагороду»`;
    } else if (lostStreak > 0 && !rewardStatusMsg) {
      rewardStatusMsg = `⚠️ Серію збито! Можна відновити за ${getStreakRestoreCost(lostStreak)} 🐹`;
    }
  }

  let offlineCoins = 0;
  let offlineXp = 0;
  const prevSeen = data.lastSeenAt || 0;
  if (prevSeen > 0 && nowMs > prevSeen + 2000) {
    const elapsedSec = Math.min(OFFLINE_MAX_SECONDS, Math.floor((nowMs - prevSeen) / 1000));
    const autoTap = data.autoTapRate || 0;
    const autoXp = data.autoXpRate || 0;
    if (autoTap > 0) {
      let boostedSec = 0;
      if (boostExpires > prevSeen && boostMult > 1) {
        const endBoost = Math.min(nowMs, boostExpires);
        boostedSec = Math.max(0, Math.min(elapsedSec, Math.floor((endBoost - prevSeen) / 1000)));
      }
      const normalSec = Math.max(0, elapsedSec - boostedSec);
      offlineCoins = (normalSec * autoTap + boostedSec * autoTap * boostMult) * OFFLINE_EARN_MULTIPLIER;
    }
    if (autoXp > 0) {
      offlineXp = elapsedSec * autoXp * OFFLINE_EARN_MULTIPLIER;
    }
  }

  if (monthlyRewardApplied || streakChanged || offlineCoins > 0 || offlineXp > 0 || data.lastRewardMonth !== curMonth) {
    await runTransaction(ref(db, 'users/' + uid), (d) => {
      if (!d) return d;
      d.lastRewardMonth = curMonth;
      d.lastSeenAt = nowMs;

      if (monthlyRewardApplied) {
        d.coinBoostMult = boostMult;
        d.coinBoostExpiresAt = boostExpires;
      }
      if (streakChanged) {
        d.lastStreakDay = todayKey;
        d.streakCount = newStreak;
        d.lostStreakCount = lostStreak;
      }
      if (offlineCoins > 0) d.coins = (d.coins || 0) + offlineCoins;
      if (offlineXp > 0) d.xp = (d.xp || 0) + offlineXp;
      return d;
    });

    if (rewardStatusMsg) showStatus(rewardStatusMsg);
  } else {
    await update(ref(db, 'users/' + uid), { lastSeenAt: nowMs }).catch(() => {});
  }
}

btnClaimStreak?.addEventListener('click', async () => {
  if (!currentUid) return;
  const todayKey = getTodayKey();
  if (!canClaimStreakReward(todayKey)) {
    showStatus('✅ Нагороду за сьогодні вже забрано');
    return;
  }

  let rewardSummary = '';
  const res = await runTransaction(ref(db, 'users/' + currentUid), (d) => {
    if (!d) return d;
    const curStreak = d.streakCount || 0;
    if (curStreak <= 0 || d.claimedStreakDay === todayKey) return;

    let bonusCoins = 0;
    let bonusHoms = 0;
    const pickHoms = Math.random() < 0.5 && (d.homs || 0) > 0;
    if (pickHoms) {
      bonusHoms = Math.max(1, (d.homs || 0) * 0.01);
      d.homs = (d.homs || 0) + bonusHoms;
    } else if ((d.coins || 0) > 0) {
      bonusCoins = Math.max(1, (d.coins || 0) * 0.01);
      d.coins = (d.coins || 0) + bonusCoins;
    } else if ((d.homs || 0) > 0) {
      bonusHoms = Math.max(1, (d.homs || 0) * 0.01);
      d.homs = (d.homs || 0) + bonusHoms;
    } else {
      bonusCoins = 10;
      d.coins = (d.coins || 0) + bonusCoins;
    }

    let jubileeText = '';
    if (curStreak % 7 === 0) {
      if (!d.cases) d.cases = {};
      if (Math.random() < 0.5) {
        d.cases.basic = (d.cases.basic || 0) + 1;
        jubileeText = ' + 1 Звичайний кейс (x1)';
      } else {
        d.cases.epic = (d.cases.epic || 0) + 1;
        jubileeText = ' + 1 Епічний кейс (x5)';
      }
    }

    d.claimedStreakDay = todayKey;
    const currText = bonusHoms > 0 ? `+${formatNumber(bonusHoms)} 🐹` : `+${formatNumber(bonusCoins)} 🪙`;
    rewardSummary = `🎁 Забрано: ${currText}${jubileeText}`;
    return d;
  });

  if (res.committed && rewardSummary) {
    showStatus(rewardSummary);
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
  }
});

btnRestoreStreak?.addEventListener('click', async () => {
  if (!currentUid || !state.lostStreakCount) return;
  const cost = getStreakRestoreCost(state.lostStreakCount);
  if ((state.homs || 0) < cost) {
    showStatus('❌ Недостатньо Хомів');
    return;
  }
  const todayKey = getTodayKey();
  const restoredNum = state.lostStreakCount;

  const res = await runTransaction(ref(db, 'users/' + currentUid), (d) => {
    if (!d) return d;
    const lost = d.lostStreakCount || 0;
    if (lost <= 0) return;
    const reqHoms = getStreakRestoreCost(lost);
    if ((d.homs || 0) < reqHoms) return;
    d.homs -= reqHoms;
    d.streakCount = lost;
    d.lostStreakCount = 0;
    d.lastStreakDay = todayKey;
    return d;
  });

  if (res.committed) {
    showStatus(`✅ Серію ${restoredNum} дн. відновлено! Натисни «Забрати нагороду»`);
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
  }
});

btnChangeNickname?.addEventListener('click', () => {
  if (newNicknameInput) newNicknameInput.value = state.nickname;
  modalNickname?.classList.add('show');
});

btnSaveNickname?.addEventListener('click', async () => {
  const newNick = newNicknameInput?.value.trim() || '';
  if (!isValidNickname(newNick)) {
    showStatus('❌ 3–16 символів (літери, цифри, _, ., -)');
    return;
  }
  await update(ref(db, 'users/' + currentUid), { nickname: newNick });
  modalNickname?.classList.remove('show');
  showStatus('✅ Збережено!');
});

async function checkAdminStatus(uid) {
  try {
    const snap = await get(ref(db, 'admins/' + uid));
    if (snap.exists() && snap.val() === true) {
      isAdmin = true;
      if (adminBtnBadge) adminBtnBadge.style.display = 'flex';
    }
  } catch (e) {}
}

window.adminAddCoins = async () => {
  if (!isAdmin || !currentUid) return;
  const amount = parseInt(document.getElementById('admin-coins-input')?.value, 10) || 0;
  await runTransaction(ref(db, 'users/' + currentUid), d => { if (d) d.coins = (d.coins || 0) + amount; return d; });
  showStatus('✅ Монети додано');
};
window.adminAddHoms = async () => {
  if (!isAdmin || !currentUid) return;
  const amount = parseInt(document.getElementById('admin-homs-input')?.value, 10) || 0;
  await runTransaction(ref(db, 'users/' + currentUid), d => { if (d) d.homs = (d.homs || 0) + amount; return d; });
  showStatus('✅ Хоми додано');
};
window.adminAddXp = async () => {
  if (!isAdmin || !currentUid) return;
  const amount = parseInt(document.getElementById('admin-xp-input')?.value, 10) || 0;
  await runTransaction(ref(db, 'users/' + currentUid), d => { if (d) d.xp = (d.xp || 0) + amount; return d; });
  showStatus('✅ XP додано');
};
window.adminAddCase = async () => {
  if (!isAdmin || !currentUid) return;
  await runTransaction(ref(db, 'users/' + currentUid), d => {
    if (!d) return d;
    if (!d.cases) d.cases = {};
    d.cases.basic = (d.cases.basic || 0) + 1;
    return d;
  });
  showStatus('✅ Кейс додано');
};

function applyReferralMilestones(target, unlockedNotes) {
  const invitedCount = Number(target.invited) || 0;
  if (!Array.isArray(target.claimedReferralMilestones)) target.claimedReferralMilestones = [];
  if (!Array.isArray(target.purchasedSkins)) target.purchasedSkins = [];
  if (!Array.isArray(target.purchasedBanners)) target.purchasedBanners = [];
  if (!Array.isArray(target.purchasedTitles)) target.purchasedTitles = [];
  if (!target.cases || typeof target.cases !== 'object') target.cases = {};

  if (invitedCount >= 3 && !target.claimedReferralMilestones.includes('ref_3')) {
    target.claimedReferralMilestones.push('ref_3');
    if (!target.purchasedSkins.includes('skin_ai')) target.purchasedSkins.push('skin_ai');
    target.cases.basic = (target.cases.basic || 0) + 1;
    unlockedNotes.push('Скін AIHamster + 1 Basic Case');
  }

  if (invitedCount >= 10 && !target.claimedReferralMilestones.includes('ref_10')) {
    target.claimedReferralMilestones.push('ref_10');
    if (!target.purchasedBanners.includes('banner_gradient_yellow')) target.purchasedBanners.push('banner_gradient_yellow');
    target.cases.epic = (target.cases.epic || 0) + 1;
    unlockedNotes.push('Банер Gradient Yellow + 1 Epic Case');
  }

  if (invitedCount >= 25 && !target.claimedReferralMilestones.includes('ref_25')) {
    target.claimedReferralMilestones.push('ref_25');
    target.legendaryCases = (target.legendaryCases || 0) + 1;
    if (!target.purchasedTitles.includes('Амбасадор Хомів')) target.purchasedTitles.push('Амбасадор Хомів');
    unlockedNotes.push('1 Legendary Case + титул «Амбасадор Хомів»');
  }
}

async function applyReferralCode(rawCode) {
  if (!currentUid || !userDataReady) {
    const parsed = extractReferralCode(rawCode);
    if (parsed.length > 0) pendingStartParam = parsed;
    return false;
  }
  const code = extractReferralCode(rawCode);
  if (!code || code.length < 3 || code.length > 24) return false;
  if (code === state.publicId || code === currentUid) return false;
  if (state.usedReferralCode || referralProcessing) return false;

  referralProcessing = true;
  try {
    const usersSnap = await get(ref(db, 'users'));
    if (!usersSnap.exists()) { referralProcessing = false; return false; }

    const users = usersSnap.val();
    let referrerUid = null;
    let referrerNick = 'Player';

    for (const uId in users) {
      if (uId === currentUid) continue;
      const uData = users[uId];
      if (String(uData.publicId || '') === code || uId === code) {
        referrerUid = uId;
        referrerNick = uData.nickname || 'Player';
        break;
      }
    }

    if (!referrerUid) { referralProcessing = false; return false; }

    const res1 = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
      if (!data) return data;
      if (data.usedReferralCode) return data;
      data.usedReferralCode = true;
      data.referredBy = referrerUid;
      if (!data.cases) data.cases = {};
      data.cases.basic = (data.cases.basic || 0) + 1;
      return data;
    });

    if (!res1.committed || !res1.snapshot?.val()?.usedReferralCode) {
      referralProcessing = false;
      return false;
    }

    const unlockedNotes = [];
    const res2 = await runTransaction(ref(db, 'users/' + referrerUid), (data) => {
      const target = data && typeof data === 'object' ? { ...data } : {};
      target.invited = (Number(target.invited) || 0) + 1;
      unlockedNotes.length = 0;
      applyReferralMilestones(target, unlockedNotes);
      return target;
    });

    if (!res2.committed) {
      referralProcessing = false;
      return false;
    }

    pendingStartParam = null;
    const bonusText = unlockedNotes.length ? ` (відкрито поріг: ${unlockedNotes.join(', ')})` : '';
    showStatus(`🎁 Запросив ${referrerNick}! Отримано +1 Basic Case${bonusText}`);
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
    referralProcessing = false;
    return true;
  } catch (err) {
    referralProcessing = false;
    return false;
  }
}

async function syncTelegramChatId(uid) {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!uid || !tgUser?.id) return;
  try {
    await update(ref(db, 'users/' + uid), {
      tgChatId: Number(tgUser.id),
      tgUsername: tgUser.username || ''
    });
  } catch (e) {}
}

async function copyTextWithFallback(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function getReferralInviteLink() {
  const refCode = state.publicId || currentUid || '';
  return `${BOT_LINK}?startapp=${encodeURIComponent(refCode)}`;
}

window.shareReferralLink = function () {
  const inviteLink = getReferralInviteLink();
  const shareText = `🐭 Грай у Hamka та забирай бонусний кейс + буст x2!`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

  if (tg && typeof tg.openTelegramLink === 'function') {
    try { tg.openTelegramLink(shareUrl); return; } catch (e) {}
  }
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
};

function initGame(uid) {
  if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }
  const userRef = ref(db, 'users/' + uid);
  const nowStart = Date.now();

  syncTelegramChatId(uid);

  const tgUser = tg?.initDataUnsafe?.user;
  const generatedId = tgUser ? 'tg_' + tgUser.id : uid.slice(0, 8);
  const rawNick = tgUser ? (tgUser.username || tgUser.first_name) : 'Player_' + generatedId;
  const defaultNick = isValidNickname(rawNick) ? rawNick.trim() : ('Player_' + generatedId).slice(0, 16);

  runTransaction(userRef, (existing) => {
    if (existing && typeof existing === 'object') return existing;
    return {
      coins: 0, homs: 0, energy: 200, maxEnergy: 200, xp: 0, prestige: 0,
      title: 'Новобранець', avatar: '🐭', holdings: {},
      nickname: defaultNick, publicId: generatedId, activeSkin: 'default', activeBanner: 'default',
      tapLevel: 0, tapPower: 1, xpPerTap: 1, autoTapRate: 0, autoXpRate: 0, energyRate: 1,
      purchasedTitles: ['Новобранець'], purchasedAvatars: [], purchasedSkins: [], purchasedBanners: [],
      cases: { basic: 3 }, legendaryCases: 0, adWatches: 0,
      usedReferralCode: false, referredBy: '', invited: 0, claimedReferralMilestones: [], hideFromTop: false,
      language: currentLang,
      streakCount: 0, lastStreakDay: '', claimedStreakDay: '', lostStreakCount: 0,
      tap3BoostGranted: false, coinBoostMult: 2, coinBoostExpiresAt: nowStart + 10 * 60 * 1000,
      lastRewardMonth: getMonthKey(), lastSeenAt: nowStart,
      tgChatId: tgUser?.id ? Number(tgUser.id) : null,
      tgUsername: tgUser?.username || '',
      createdAt: nowStart
    };
  }).catch(() => {});

  unsubscribeUserData = onValue(userRef, async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    state.coins = data.coins || 0;
    state.homs = data.homs || 0;
    if (!pendingTap) {
      state.energy = data.energy ?? 200;
      state.xp = data.xp || 0;
    }
    state.maxEnergy = data.maxEnergy ?? 200;
    state.prestige = data.prestige || 0;
    state.title = data.title || 'Новобранець';
    state.avatar = data.avatar || '🐭';
    state.nickname = data.nickname || 'Player';
    state.publicId = data.publicId || '000000';
    state.holdings = data.holdings || {};
    state.purchasedTitles = data.purchasedTitles || [];
    state.purchasedAvatars = data.purchasedAvatars || [];
    state.purchasedSkins = data.purchasedSkins || [];
    state.purchasedBanners = data.purchasedBanners || [];
    state.cases = data.cases || {};
    state.legendaryCases = data.legendaryCases || 0;
    state.activeSkin = data.activeSkin || 'default';
    state.activeBanner = data.activeBanner || 'default';
    state.adWatches = data.adWatches || 0;
    state.usedReferralCode = data.usedReferralCode || false;
    state.referredBy = data.referredBy || '';
    state.invited = data.invited || 0;
    state.claimedReferralMilestones = data.claimedReferralMilestones || [];
    state.hideFromTop = data.hideFromTop || false;
    state.streakCount = data.streakCount || 0;
    state.lastStreakDay = data.lastStreakDay || '';
    state.claimedStreakDay = data.claimedStreakDay || '';
    state.lostStreakCount = data.lostStreakCount || 0;
    state.tap3BoostGranted = data.tap3BoostGranted || false;
    state.coinBoostMult = data.coinBoostMult || 1;
    state.coinBoostExpiresAt = data.coinBoostExpiresAt || 0;
    state.lastRewardMonth = data.lastRewardMonth || '';
    state.lastSeenAt = data.lastSeenAt || 0;
    state.tgChatId = data.tgChatId || null;

    if (data.language && data.language !== currentLang) {
      setLanguage(data.language);
    }

    state.upgrades.tapLevel = data.tapLevel || 0;
    state.upgrades.tapPower = data.tapPower || 1;
    state.upgrades.xpPerTap = data.xpPerTap || 1;
    state.upgrades.autoTapRate = data.autoTapRate || 0;
    state.upgrades.autoXpRate = data.autoXpRate || 0;
    state.upgrades.energyRate = data.energyRate || 1;

    if (hideTopToggle) hideTopToggle.checked = state.hideFromTop;
    userDataReady = true;

    if (!dailyCheckDone) {
      try { await processMonthlyTopAndStreak(uid, data); } catch (e) {}
    }

    try { await syncPrestigeBanners(uid, state.prestige); } catch (e) {}

    scheduleUiRefresh({ shop: true, profile: true, inventory: true, crypto: true });

    if (pendingStartParam && !state.usedReferralCode && !referralProcessing) {
      const sp = pendingStartParam;
      pendingStartParam = null;
      applyReferralCode(sp);
    }
  });

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(async () => {
    const now = Date.now();
    const mult = getActiveCoinMultiplier(now);
    const earn = state.upgrades.autoTapRate * mult;
    const earnXp = state.upgrades.autoXpRate;
    const earnEnergy = state.upgrades.energyRate;

    if (earn > 0 || earnXp > 0 || (state.energy < state.maxEnergy && earnEnergy > 0)) {
      try {
        await runTransaction(userRef, (data) => {
          if (!data) return data;
          let changed = false;
          const curMult = (data.coinBoostExpiresAt && now < data.coinBoostExpiresAt) ? (data.coinBoostMult || 1) : 1;
          const tickCoins = (data.autoTapRate || 0) * curMult;
          if (tickCoins > 0) { data.coins = (data.coins || 0) + tickCoins; changed = true; }
          if (earnXp > 0) { data.xp = (data.xp || 0) + earnXp; changed = true; }
          if (earnEnergy > 0 && (data.energy ?? 0) < (data.maxEnergy ?? 200)) {
            data.energy = Math.min(data.maxEnergy ?? 200, (data.energy || 0) + earnEnergy);
            changed = true;
          }
          return changed ? data : undefined;
        });
      } catch (e) {}
    }

    renderBoostBadge();
    if (document.getElementById('page-profile')?.classList.contains('active')) {
      renderProfile();
    }
  }, 1000);

  if (hamster) {
    hamster.onclick = async (e) => {
      const now = Date.now();
      if (now - lastTapTime < 60) return;
      lastTapTime = now;

      if (state.energy < 1) {
        showStatus(translations[currentLang]?.no_energy || "❌ Недостатньо енергії!");
        return;
      }
      const mult = getActiveCoinMultiplier(now);
      const tapPower = state.upgrades.tapPower * mult;
      const xpPerTap = state.upgrades.xpPerTap;

      state.energy = Math.max(0, state.energy - 1);
      state.coins += tapPower;
      state.xp += xpPerTap;
      renderUI();

      if (tapArea) {
        const rect = tapArea.getBoundingClientRect();
        const effect = document.createElement('div');
        effect.className = 'tap-effect';
        effect.innerText = `+${formatNumber(tapPower)}`;
        const clientX = e.clientX || (rect.left + rect.width / 2);
        const clientY = e.clientY || (rect.top + rect.height / 2);
        effect.style.left = (clientX - rect.left - 10) + 'px';
        effect.style.top = (clientY - rect.top - 10) + 'px';
        tapArea.appendChild(effect);
        setTimeout(() => effect.remove(), 800);
      }

      try { tg?.HapticFeedback?.impactOccurred('light'); } catch (err) {}

      pendingTap = true;
      try {
        await runTransaction(userRef, (data) => {
          if (!data) data = {};
          const curEnergy = data.energy ?? 200;
          if (curEnergy < 1) return;
          const txMult = (data.coinBoostExpiresAt && now < data.coinBoostExpiresAt) ? (data.coinBoostMult || 1) : 1;
          const txCoins = (data.tapPower || 1) * txMult;
          data.energy = curEnergy - 1;
          data.coins = (data.coins || 0) + txCoins;
          data.xp = (data.xp || 0) + (data.xpPerTap || 1);
          return data;
        });
      } catch (err) {} finally { pendingTap = false; }
    };
  }
}

function updateHamsterSkin() {
  if (!hamster) return;
  if (state.activeSkin === 'default') {
    hamster.style.backgroundImage = 'none';
    hamster.innerText = '🐭';
  } else {
    const skinObj = SKINS.find(s => s.id === state.activeSkin);
    if (skinObj && skinObj.file) {
      hamster.innerText = '';
      hamster.style.backgroundImage = `url('${GITHUB_RAW}${skinObj.file}')`;
    } else {
      hamster.style.backgroundImage = 'none';
      hamster.innerText = '🐭';
    }
  }
}

function getPrestigeReq(prestigeLvl) {
  return prestigeLvl === 0 ? 1000000 : 1000000 * Math.pow(2, prestigeLvl);
}

async function checkAutoPrestige() {
  if (prestigeInProgress) return;
  const req = getPrestigeReq(state.prestige);
  if (state.xp >= req && currentUid) {
    prestigeInProgress = true;
    try {
      const userRef = ref(db, 'users/' + currentUid);
      let nextPrestigeNum = state.prestige;

      await runTransaction(userRef, (data) => {
        if (!data) return data;
        const curReq = getPrestigeReq(data.prestige || 0);
        if ((data.xp || 0) >= curReq) {
          data.xp = (data.xp || 0) - curReq;
          const p = (data.prestige || 0) + 1;
          nextPrestigeNum = p;
          data.prestige = p;

          const banners = Array.isArray(data.purchasedBanners) ? [...data.purchasedBanners] : [];
          for (const b of BANNERS) {
            if (b.reqPrestige && p >= b.reqPrestige && !banners.includes(b.id)) {
              banners.push(b.id);
            }
          }
          data.purchasedBanners = banners;
        }
        return data;
      });

      if (nextPrestigeNum > state.prestige) {
        if (prestigeText) prestigeText.innerText = `PRESTIGE ${nextPrestigeNum}`;
        prestigeOverlay?.classList.add('show');
        setTimeout(() => prestigeOverlay?.classList.remove('show'), 2200);
        try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
      }
    } finally {
      setTimeout(() => { prestigeInProgress = false; }, 600);
    }
  }
}

function getLevelInfo(xp) {
  let currentLvl = LEVELS[0];
  let nextLvl = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      currentLvl = LEVELS[i];
      nextLvl = LEVELS[i + 1] || LEVELS[i];
    }
  }
  return { currentLvl, nextLvl };
}

function renderBoostBadge() {
  const now = Date.now();
  const mult = getActiveCoinMultiplier(now);
  if (mult > 1 && state.coinBoostExpiresAt > now) {
    activeBoostBadge?.classList.add('active');
    if (activeBoostText) activeBoostText.innerText = `x${mult} (${formatDurationLeft(state.coinBoostExpiresAt - now)})`;
  } else {
    activeBoostBadge?.classList.remove('active');
  }
}

function renderUI() {
  const coinsStr = formatNumber(state.coins);
  const homsStr = formatNumber(state.homs);
  const mult = getActiveCoinMultiplier();

  if (tapCoinDisplay) tapCoinDisplay.innerText = coinsStr;
  if (topCoins) topCoins.innerText = coinsStr;
  if (topHoms) topHoms.innerText = homsStr;
  if (bottomCoins) bottomCoins.innerText = coinsStr;
  if (autoTapLabel) autoTapLabel.innerText = formatNumber(state.upgrades.autoTapRate * mult);
  if (autoEnergyLabel) autoEnergyLabel.innerText = formatNumber(state.upgrades.energyRate);
  renderBoostBadge();

  const energyPct = (state.energy / state.maxEnergy) * 100;
  if (energyBar) energyBar.style.width = energyPct + '%';
  if (energyDisplay) energyDisplay.innerText = Math.floor(state.energy) + '/' + state.maxEnergy;
  if (energyDisplayBottom) energyDisplayBottom.innerText = Math.floor(state.energy) + '/' + state.maxEnergy;

  const { currentLvl, nextLvl } = getLevelInfo(state.xp);
  if (levelName) levelName.innerText = currentLvl.name;
  if (xpDisplay) xpDisplay.innerText = formatNumber(state.xp);
  if (xpNext) xpNext.innerText = nextLvl.xp === currentLvl.xp ? 'MAX' : formatNumber(nextLvl.xp);

  const lvlProgress = nextLvl.xp === currentLvl.xp ? 100 : ((state.xp - currentLvl.xp) / (nextLvl.xp - currentLvl.xp)) * 100;
  if (xpBar) xpBar.style.width = Math.min(100, Math.max(0, lvlProgress)) + '%';
}

function renderShop() {
  if (!shopListEl) return;
  shopListEl.innerHTML = '';
  const t = translations[currentLang];

  if (currentShopTab === 'cosmetics') {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    TITLES.forEach(item => {
      if (item.price <= 0) return;
      const isOwned = state.purchasedTitles.includes(item.name);
      const isHoms = item.currency === 'homs';
      const canAfford = isHoms ? state.homs >= item.price : state.coins >= item.price;
      const safeBg = sanitizeGradientOrColor(item.color);

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="grid-preview" style="font-size:24px; background:${safeBg};">🏆</div>
        <div class="shop-card-info">
          <div class="shop-card-title" style="background:${safeBg}; -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${escapeHtml(item.name)}</div>
          <div class="shop-card-price">${formatNumber(item.price)} ${isHoms ? '🐹' : '🪙'}</div>
        </div>
        <button class="shop-card-btn" data-title-name="${escapeHtml(item.name)}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? t.owned : t.buy}</button>
      `;
      grid.appendChild(card);
    });

    AVATARS.forEach(item => {
      const isOwned = state.purchasedAvatars.includes(item.name);
      const canAfford = state.coins >= item.price;
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="grid-preview">${escapeHtml(item.name)}</div>
        <div class="shop-card-info">
          <div class="shop-card-title">${escapeHtml(t.avatar_label)}</div>
          <div class="shop-card-price">${formatNumber(item.price)} 🪙</div>
        </div>
        <button class="shop-card-btn" data-avatar-name="${escapeHtml(item.name)}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? t.owned : t.buy}</button>
      `;
      grid.appendChild(card);
    });

    SKINS.forEach(item => {
      if (!item.file) return;
      const isOwned = state.purchasedSkins.includes(item.id);
      const isHoms = item.currency === 'homs';
      const canAfford = isHoms ? state.homs >= item.price : state.coins >= item.price;

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="grid-preview" style="background-image: url('${GITHUB_RAW}${escapeHtml(item.file)}');"></div>
        <div class="shop-card-info">
          <div class="shop-card-title">${escapeHtml(t.skin_prefix)}: ${escapeHtml(item.name)}</div>
          <div class="shop-card-price">${formatNumber(item.price)} ${isHoms ? '🐹' : '🪙'}</div>
        </div>
        <button class="shop-card-btn" data-skin-id="${escapeHtml(item.id)}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? t.owned : t.buy}</button>
      `;
      grid.appendChild(card);
    });

    BANNERS.forEach(item => {
      if (!item.file || !item.price || item.price <= 0) return;
      const isOwned = state.purchasedBanners.includes(item.id);
      const isHoms = item.currency === 'homs';
      const canAfford = isHoms ? state.homs >= item.price : state.coins >= item.price;

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="grid-preview" style="background-image: url('${GITHUB_BANNERS}${escapeHtml(item.file)}');"></div>
        <div class="shop-card-info">
          <div class="shop-card-title">${escapeHtml(t.banner_prefix)}: ${escapeHtml(item.name)}</div>
          <div class="shop-card-price">${formatNumber(item.price)} ${isHoms ? '🐹' : '🪙'}</div>
        </div>
        <button class="shop-card-btn" data-banner-id="${escapeHtml(item.id)}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? t.owned : t.buy}</button>
      `;
      grid.appendChild(card);
    });

    shopListEl.appendChild(grid);

    shopListEl.querySelectorAll('.shop-card-btn').forEach(btn => {
      if (btn.dataset.titleName) {
        const item = TITLES.find(tItem => tItem.name === btn.dataset.titleName);
        btn.addEventListener('click', () => buyCosmetic({ name: item.name, price: item.price, type: 'title', currency: item.currency || 'coins' }));
      } else if (btn.dataset.avatarName) {
        const item = AVATARS.find(a => a.name === btn.dataset.avatarName);
        btn.addEventListener('click', () => buyCosmetic({ name: item.name, price: item.price, type: 'avatar', currency: 'coins' }));
      } else if (btn.dataset.skinId) {
        btn.addEventListener('click', () => buySkin(SKINS.find(s => s.id === btn.dataset.skinId)));
      } else if (btn.dataset.bannerId) {
        btn.addEventListener('click', () => buyBanner(BANNERS.find(b => b.id === btn.dataset.bannerId)));
      }
    });
    return;
  }

  if (currentShopTab === 'cases') {
    const inviteLink = getReferralInviteLink();
    const invitedCount = Number(state.invited) || 0;
    const maxTarget = 25;
    const progressPct = Math.min(100, Math.round((invitedCount / maxTarget) * 100));

    const promoBox = document.createElement('div');
    promoBox.className = 'promo-box';

    const milestonesHtml = REFERRAL_MILESTONES.map(m => {
      const done = invitedCount >= m.target || state.claimedReferralMilestones.includes(m.id);
      return `
        <div class="ref-milestone-row ${done ? 'done' : ''}">
          <span><b>${invitedCount}/${m.target}</b> — ${escapeHtml(m.rewardLabel)}</span>
          <span>${done ? '✅' : '⏳'}</span>
        </div>
      `;
    }).join('');

    promoBox.innerHTML = `
      <div class="shop-card-title" style="color:#2ecc71;">${escapeHtml(t.promo_title)}</div>
      <div class="shop-card-desc">${escapeHtml(t.promo_desc)}</div>
      <div class="promo-code-display">
        <span class="promo-code-text" id="my-promo-code">${escapeHtml(inviteLink)}</span>
        <div style="display:flex; gap:6px; flex-shrink:0; margin-left:8px;">
          <button class="shop-card-btn" id="btn-copy-promo" style="padding:6px 10px;">📋</button>
          <button class="shop-card-btn" id="btn-share-promo" style="padding:6px 10px; background:#2aabee; color:#fff;">${escapeHtml(t.promo_share)}</button>
        </div>
      </div>

      <div style="margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="shop-card-title" style="font-size:13px; margin-bottom:0; color:#ffd700;">${escapeHtml(t.my_invites_title)}</div>
          <span class="season-badge" style="padding:2px 8px; font-size:10px;">${invitedCount} / ${maxTarget}</span>
        </div>
        <div class="ref-progress-bar">
          <div class="ref-progress-fill" style="width:${progressPct}%;"></div>
        </div>
        <div class="ref-milestone-list">${milestonesHtml}</div>
      </div>
    `;
    shopListEl.appendChild(promoBox);

    document.getElementById('btn-copy-promo')?.addEventListener('click', async () => {
      await copyTextWithFallback(getReferralInviteLink());
      showStatus(t.invite_copied);
    });
    document.getElementById('btn-share-promo')?.addEventListener('click', () => window.shareReferralLink());

    const adCaseCard = document.createElement('div');
    adCaseCard.className = 'shop-card';
    adCaseCard.innerHTML = `
      <div class="grid-preview" style="font-size:40px; width:64px; height:64px; margin:0 10px 0 0;">🎬</div>
      <div class="shop-card-info">
        <div class="shop-card-title">${escapeHtml(t.ad_case_title)}</div>
        <div class="shop-card-price">${state.adWatches} / 5</div>
      </div>
      <button class="shop-card-btn" id="btn-buy-case-ad">${escapeHtml(state.adWatches >= 5 ? t.ad_case_claim : t.ad_case_watch)}</button>
    `;
    shopListEl.appendChild(adCaseCard);

    document.getElementById('btn-buy-case-ad')?.addEventListener('click', async () => {
      if (state.adWatches >= 5) {
        await runTransaction(ref(db, 'users/' + currentUid), (data) => {
          if (!data || (data.adWatches || 0) < 5) return;
          data.adWatches -= 5;
          if (!data.cases) data.cases = {};
          data.cases.basic = (data.cases.basic || 0) + 1;
          return data;
        });
        showStatus('✅ Кейс отримано!');
      } else {
        if (!AdController) { showStatus('❌ Реклама недоступна'); return; }
        try {
          const result = await AdController.show();
          if (result && result.done) {
            let updatedWatches = state.adWatches;
            await runTransaction(ref(db, 'users/' + currentUid), (data) => {
              if (!data) return data;
              updatedWatches = (data.adWatches || 0) + 1;
              data.adWatches = updatedWatches;
              return data;
            });
            showStatus(`✅ Перегляд зараховано! (${updatedWatches}/5)`);
          }
        } catch (e) { showStatus('❌ Рекламу не додивлено'); }
      }
    });
    return;
  }

  const items = SHOP_ITEMS[currentShopTab] || [];
  items.forEach(item => {
    let currentLevel = 0;
    if (item.id === 'autoTap') currentLevel = state.upgrades.autoTapRate;
    else if (item.id === 'autoXp') currentLevel = state.upgrades.autoXpRate;
    else if (item.id === 'energyRate') currentLevel = state.upgrades.energyRate - 1;
    else if (item.id === 'tap') currentLevel = state.upgrades.tapLevel;
    else if (item.id === 'xpTap') currentLevel = state.upgrades.xpPerTap - 1;
    else if (item.id === 'maxEnergy') currentLevel = (state.maxEnergy - 200) / 50;

    const price = getShopPrice(item.id, currentLevel);
    const isMaxed = currentLevel >= item.maxLevel || price === Infinity;
    const canAfford = state.coins >= price;

    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-card-info">
        <div class="shop-card-title">${escapeHtml(item.title)} <span style="font-size:10px; color:#888;">(Lvl ${currentLevel})</span></div>
        <div class="shop-card-desc">${escapeHtml(item.desc)}</div>
        ${!isMaxed ? `<div class="shop-card-price">${formatNumber(price)} 🪙</div>` : `<div class="shop-card-price" style="color:#2ecc71;">${t.max}</div>`}
      </div>
      <button class="shop-card-btn" data-id="${escapeHtml(item.id)}" ${isMaxed || !canAfford ? 'disabled' : ''}>${isMaxed ? t.max : t.buy}</button>
    `;
    shopListEl.appendChild(card);
  });

  shopListEl.querySelectorAll('.shop-card-btn').forEach(btn => {
    btn.addEventListener('click', () => buyUpgrade(btn.dataset.id));
  });
}

async function buyUpgrade(itemId) {
  if (!currentUid) return;
  const allItems = [...SHOP_ITEMS.auto, ...SHOP_ITEMS.upgrade];
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  let currentLevel = 0;
  if (itemId === 'autoTap') currentLevel = state.upgrades.autoTapRate;
  else if (itemId === 'autoXp') currentLevel = state.upgrades.autoXpRate;
  else if (itemId === 'energyRate') currentLevel = state.upgrades.energyRate - 1;
  else if (itemId === 'tap') currentLevel = state.upgrades.tapLevel;
  else if (itemId === 'xpTap') currentLevel = state.upgrades.xpPerTap - 1;
  else if (itemId === 'maxEnergy') currentLevel = (state.maxEnergy - 200) / 50;

  if (currentLevel >= item.maxLevel) return;
  const price = getShopPrice(itemId, currentLevel);
  if (!Number.isFinite(price)) return;
  let unlockedTap3Boost = false;

  const res = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data || (data.coins || 0) < price) return;
    data.coins -= price;
    if (itemId === 'autoTap') data.autoTapRate = (data.autoTapRate || 0) + 1;
    else if (itemId === 'autoXp') data.autoXpRate = (data.autoXpRate || 0) + 1;
    else if (itemId === 'energyRate') data.energyRate = (data.energyRate || 1) + 1;
    else if (itemId === 'tap') {
      data.tapLevel = (data.tapLevel || 0) + 1;
      data.tapPower = (data.tapPower || 1) + 1;
      if (data.tapLevel >= 3 && !data.tap3BoostGranted) {
        data.tap3BoostGranted = true;
        data.coinBoostMult = Math.max(data.coinBoostMult || 1, 2);
        data.coinBoostExpiresAt = Math.max(data.coinBoostExpiresAt || 0, Date.now() + 10 * 60 * 1000);
        unlockedTap3Boost = true;
      }
    }
    else if (itemId === 'xpTap') data.xpPerTap = (data.xpPerTap || 1) + 1;
    else if (itemId === 'maxEnergy') data.maxEnergy = (data.maxEnergy || 200) + 50;
    return data;
  });

  if (!res.committed) {
    showStatus('❌ Недостатньо монет або помилка покупки');
    return;
  }

  if (unlockedTap3Boost) {
    showStatus('⚡ 3 рівень тапу! Активовано x2 монет на 10 хв!');
  } else {
    showStatus('✅ Покращення куплено!');
  }
}

async function buySkin(item) {
  if (!item) return;
  const isHoms = item.currency === 'homs';
  const res = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data) return data;
    const bal = isHoms ? (data.homs || 0) : (data.coins || 0);
    if (bal < item.price) return;
    if (isHoms) data.homs -= item.price; else data.coins -= item.price;
    if (!data.purchasedSkins) data.purchasedSkins = [];
    if (!data.purchasedSkins.includes(item.id)) data.purchasedSkins.push(item.id);
    return data;
  });
  if (res.committed) { showStatus('✅ Скін куплено!'); renderShop(); }
}

async function buyBanner(item) {
  if (!item) return;
  const isHoms = item.currency === 'homs';
  const res = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data) return data;
    const bal = isHoms ? (data.homs || 0) : (data.coins || 0);
    if (bal < item.price) return;
    if (isHoms) data.homs -= item.price; else data.coins -= item.price;
    if (!data.purchasedBanners) data.purchasedBanners = [];
    if (!data.purchasedBanners.includes(item.id)) data.purchasedBanners.push(item.id);
    return data;
  });
  if (res.committed) { showStatus('✅ Банер куплено!'); renderShop(); }
}

async function buyCosmetic(item) {
  if (!item) return;
  const isHoms = item.currency === 'homs';
  const res = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data) return data;
    const bal = isHoms ? (data.homs || 0) : (data.coins || 0);
    if (bal < item.price) return;
    if (isHoms) data.homs -= item.price; else data.coins -= item.price;
    if (item.type === 'title') {
      if (!data.purchasedTitles) data.purchasedTitles = [];
      if (!data.purchasedTitles.includes(item.name)) data.purchasedTitles.push(item.name);
    } else if (item.type === 'avatar') {
      if (!data.purchasedAvatars) data.purchasedAvatars = [];
      if (!data.purchasedAvatars.includes(item.name)) data.purchasedAvatars.push(item.name);
    }
    return data;
  });
  if (res.committed) { showStatus('✅ Куплено!'); renderShop(); }
}

function renderProfile() {
  if (profCoins) profCoins.innerText = formatNumber(state.coins);
  if (profHoms) profHoms.innerText = formatNumber(state.homs);
  if (profXp) profXp.innerText = formatNumber(state.xp);
  if (profPrestige) profPrestige.innerText = state.prestige;
  if (profNickname) profNickname.innerText = state.nickname;
  if (profPublicId) profPublicId.innerText = 'ID: ' + state.publicId;
  applyBannerStyle(profBanner, state.activeBanner);

  if (profAvatar) {
    if (state.activeSkin !== 'default') {
      const skinObj = SKINS.find(s => s.id === state.activeSkin);
      if (skinObj && skinObj.file) {
        profAvatar.style.backgroundImage = `url('${GITHUB_RAW}${skinObj.file}')`;
        profAvatar.innerText = '';
      }
    } else {
      profAvatar.style.backgroundImage = 'none';
      profAvatar.innerText = state.avatar;
    }
  }

  const titleObj = TITLES.find(t => t.name === state.title) || CASE_TITLES.find(t => t.name === state.title) || TOP_TITLES.find(t => t.name === state.title);
  if (profTitle) profTitle.innerText = state.title;
  if (profTitleBadge) {
    profTitleBadge.style.background = sanitizeGradientOrColor(titleObj ? titleObj.color : 'linear-gradient(90deg, #8a2be2, #da70d6)');
  }

  const req = getPrestigeReq(state.prestige);
  if (prestigeInfo) prestigeInfo.innerText = state.xp >= req ? 'Готово!' : `Потрібно ${formatNumber(req)} XP`;

  if (streakDaysBadge) streakDaysBadge.innerText = `${state.streakCount} дн.`;
  if (btnClaimStreak) {
    btnClaimStreak.innerText = translations[currentLang]?.claim_streak_btn || '🎁 Забрати нагороду';
    btnClaimStreak.style.display = canClaimStreakReward() ? 'block' : 'none';
  }

  if (streakDesc && btnRestoreStreak) {
    if (state.lostStreakCount > 0) {
      const restoreCost = getStreakRestoreCost(state.lostStreakCount);
      streakDesc.innerText = `Збито ${state.lostStreakCount} дн. Відновити: ${restoreCost} 🐹.`;
      btnRestoreStreak.style.display = 'block';
      btnRestoreStreak.innerText = `🔁 ${restoreCost} 🐹`;
      btnRestoreStreak.disabled = (state.homs || 0) < restoreCost;
    } else {
      btnRestoreStreak.style.display = 'none';
      const toJubilee = 7 - (state.streakCount % 7 || 7);
      const claimHint = canClaimStreakReward() ? 'Нагорода готова!' : 'Забрано сьогодні.';
      streakDesc.innerText = `${claimHint} До кейсу: ${toJubilee} дн.`;
    }
  }
}

function renderInventory() {
  const t = translations[currentLang];
  const cases = state.cases || {};
  const legendaryCount = state.legendaryCases || 0;
  const hasCases = Object.keys(cases).some(k => cases[k] > 0) || legendaryCount > 0;

  if (casesSection && invCases) {
    if (hasCases) {
      casesSection.style.display = 'block';
      invCases.innerHTML = '';
      for (const type in cases) {
        const count = cases[type];
        if (count <= 0) continue;
        const isEpic = type === 'epic';
        const el = document.createElement('div');
        el.className = `case-item ${isEpic ? 'epic' : ''}`;
        el.innerHTML = `
          <div class="case-count-badge">${count}</div>
          <div class="case-icon">${isEpic ? '💠' : '📦'}</div>
          <div class="case-name">${isEpic ? 'Epic Case (x5)' : 'Basic Case'}</div>
        `;
        el.addEventListener('click', () => openCaseModal(type, count));
        invCases.appendChild(el);
      }

      if (legendaryCount > 0) {
        const el = document.createElement('div');
        el.className = 'case-item legendary';
        el.innerHTML = `
          <div class="case-count-badge">${legendaryCount}</div>
          <div class="case-icon">🌟</div>
          <div class="case-name">Legendary Case</div>
        `;
        el.addEventListener('click', () => openCaseModal('legendary', legendaryCount));
        invCases.appendChild(el);
      }
    } else {
      casesSection.style.display = 'none';
    }
  }

  if (invBanners) {
    invBanners.innerHTML = '';
    const noBannerEl = document.createElement('div');
    noBannerEl.className = `banner-item ${state.activeBanner === 'default' ? 'active' : ''}`;
    noBannerEl.innerHTML = `<div class="banner-preview"></div><div class="inventory-item-name">${escapeHtml(t.default_item)}</div>`;
    noBannerEl.addEventListener('click', async () => {
      await update(ref(db, 'users/' + currentUid), { activeBanner: 'default' });
      showStatus('✅ Банер скинуто!');
    });
    invBanners.appendChild(noBannerEl);

    const visibleBanners = BANNERS.filter(b =>
      state.purchasedBanners.includes(b.id) || (b.reqPrestige && state.prestige >= b.reqPrestige)
    );

    visibleBanners.forEach(bObj => {
      if (!bObj || !bObj.file) return;
      const el = document.createElement('div');
      el.className = `banner-item ${state.activeBanner === bObj.id ? 'active' : ''}`;
      el.innerHTML = `
        <div class="banner-preview" style="background-image: url('${GITHUB_BANNERS}${escapeHtml(bObj.file)}');"></div>
        <div class="inventory-item-name">${escapeHtml(bObj.name)}</div>
      `;
      el.addEventListener('click', async () => {
        await update(ref(db, 'users/' + currentUid), { activeBanner: bObj.id });
        showStatus('✅ Банер встановлено!');
      });
      invBanners.appendChild(el);
    });
  }

  if (invTitles) {
    const availableTitles = [
      ...TITLES.filter(tItem => (tItem.price === 0 && (tItem.reqPrestige === 0 || state.prestige >= tItem.reqPrestige)) || state.purchasedTitles.includes(tItem.name)),
      ...CASE_TITLES.filter(tItem => state.purchasedTitles.includes(tItem.name)),
      ...TOP_TITLES.filter(tItem => state.purchasedTitles.includes(tItem.name))
    ];
    invTitles.innerHTML = '';
    availableTitles.forEach(tItem => {
      const safeBg = sanitizeGradientOrColor(tItem.color);
      const el = document.createElement('div');
      el.className = `inventory-item ${state.title === tItem.name ? 'active' : ''}`;
      el.innerHTML = `<div class="inventory-item-icon">🏆</div><div class="inventory-item-name" style="background:${safeBg}; -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${escapeHtml(tItem.name)}</div>`;
      el.addEventListener('click', async () => {
        await update(ref(db, 'users/' + currentUid), { title: tItem.name });
        showStatus('✅ Титул встановлено!');
      });
      invTitles.appendChild(el);
    });
  }

  if (invAvatars) {
    const availableAvatars = ['🐭', ...state.purchasedAvatars];
    invAvatars.innerHTML = '';
    availableAvatars.forEach(avName => {
      const el = document.createElement('div');
      el.className = `inventory-item ${state.avatar === avName ? 'active' : ''}`;
      el.innerHTML = `<div class="inventory-item-icon">${escapeHtml(avName)}</div>`;
      el.addEventListener('click', async () => {
        await update(ref(db, 'users/' + currentUid), { avatar: avName });
        showStatus('✅ Аватарку змінено!');
      });
      invAvatars.appendChild(el);
    });
  }

  if (invSkins) {
    invSkins.innerHTML = '';
    const defaultEl = document.createElement('div');
    defaultEl.className = `inventory-item ${state.activeSkin === 'default' ? 'active' : ''}`;
    defaultEl.innerHTML = `<div class="inventory-item-icon">🐭</div><div class="inventory-item-name">${escapeHtml(t.default_item)}</div>`;
    defaultEl.addEventListener('click', async () => {
      await update(ref(db, 'users/' + currentUid), { activeSkin: 'default' });
      showStatus('✅ Скін змінено!');
    });
    invSkins.appendChild(defaultEl);

    state.purchasedSkins.forEach(skinId => {
      const skinObj = SKINS.find(s => s.id === skinId);
      if (!skinObj || !skinObj.file) return;
      const el = document.createElement('div');
      el.className = `inventory-item ${state.activeSkin === skinId ? 'active' : ''}`;
      el.innerHTML = `<div class="inventory-item-icon" style="background-image: url('${GITHUB_RAW}${skinObj.file}'); background-size: cover; border-radius:4px;"></div><div class="inventory-item-name">${escapeHtml(skinObj.name)}</div>`;
      el.addEventListener('click', async () => {
        await update(ref(db, 'users/' + currentUid), { activeSkin: skinId });
        showStatus('✅ Скін змінено!');
      });
      invSkins.appendChild(el);
    });
  }
}

function openCaseModal(type, count) {
  selectedCaseTypeToOpen = type;
  const titleText = type === 'legendary' ? 'Відкрити Legendary Case' : (type === 'epic' ? 'Відкрити Epic Case (x5)' : 'Відкрити кейс');
  const titleEl = document.getElementById('case-modal-title');
  const countEl = document.getElementById('case-modal-count');
  if (titleEl) titleEl.innerText = titleText;
  if (countEl) countEl.innerText = `Доступно: ${count}`;
  document.getElementById('modal-case-qty')?.classList.add('show');
}

window.openCasesBatch = async function (qty) {
  document.getElementById('modal-case-qty')?.classList.remove('show');
  if (!currentUid || !selectedCaseTypeToOpen) return;

  const isLegendary = selectedCaseTypeToOpen === 'legendary';
  const isEpic = selectedCaseTypeToOpen === 'epic';
  const currentCount = isLegendary ? (state.legendaryCases || 0) : (state.cases[selectedCaseTypeToOpen] || 0);
  let openNum = qty === 'all' ? currentCount : parseInt(qty, 10);
  if (openNum > currentCount) openNum = currentCount;
  if (openNum <= 0) return;

  caseOpenOverlay?.classList.add('show');
  if (caseOpeningBox) {
    caseOpeningBox.style.display = 'block';
    caseOpeningBox.innerText = isLegendary ? '🌟' : (isEpic ? '💠' : '📦');
  }
  if (caseRewardText) caseRewardText.innerText = '';
  if (btnCloseCase) btnCloseCase.style.display = 'none';

  setTimeout(async () => {
    if (caseOpeningBox) caseOpeningBox.style.display = 'none';
    const summaryRewards = [];
    const multiplier = isLegendary ? 10 : (isEpic ? 5 : 1);

    const res = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
      if (!data) return data;
      if (isLegendary) {
        if ((data.legendaryCases || 0) < openNum) return;
        data.legendaryCases -= openNum;
      } else {
        if (!data.cases || (data.cases[selectedCaseTypeToOpen] || 0) < openNum) return;
        data.cases[selectedCaseTypeToOpen] -= openNum;
        if (data.cases[selectedCaseTypeToOpen] <= 0) delete data.cases[selectedCaseTypeToOpen];
      }

      if (!data.purchasedTitles) data.purchasedTitles = [];
      if (!data.purchasedAvatars) data.purchasedAvatars = [];
      if (!data.purchasedSkins) data.purchasedSkins = [];
      if (!data.purchasedBanners) data.purchasedBanners = [];

      summaryRewards.length = 0;

      for (let i = 0; i < openNum; i++) {
        if (isLegendary && Math.random() < 0.25) {
          const legBanner = BANNERS.find(b => b.id === 'banner_gradient_blue') || BANNERS[0];
          if (legBanner) {
            if (!data.purchasedBanners.includes(legBanner.id)) {
              data.purchasedBanners.push(legBanner.id);
              summaryRewards.push(`Banner: ${legBanner.name}`);
            } else {
              const homsBonus = 25 * multiplier;
              data.homs = (data.homs || 0) + homsBonus;
              summaryRewards.push(`+${homsBonus} Homs (Banner Duplicate)`);
            }
            continue;
          }
        }

        const rand = Math.random() * 100;
        if (rand < 20) {
          const randomSkin = SKINS[Math.floor(Math.random() * SKINS.length)];
          if (data.purchasedSkins.includes(randomSkin.id)) {
            const homsBonus = 10 * multiplier;
            data.homs = (data.homs || 0) + homsBonus;
            summaryRewards.push(`+${homsBonus} Homs (Skin Duplicate)`);
          } else {
            data.purchasedSkins.push(randomSkin.id);
            summaryRewards.push(`Skin: ${randomSkin.name}`);
          }
        } else if (rand < 45) {
          const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
          if (data.purchasedAvatars.includes(randomAvatar.name)) {
            const homsBonus = 10 * multiplier;
            data.homs = (data.homs || 0) + homsBonus;
            summaryRewards.push(`+${homsBonus} Homs (Avatar Duplicate)`);
          } else {
            data.purchasedAvatars.push(randomAvatar.name);
            summaryRewards.push(`Avatar: ${randomAvatar.name}`);
          }
        } else if (rand < 70) {
          const poolTitles = CASE_TITLES.filter(t => t.name !== 'Новобранець' && t.name !== 'Амбасадор Хомів');
          const randomTitle = poolTitles[Math.floor(Math.random() * poolTitles.length)];
          if (data.purchasedTitles.includes(randomTitle.name)) {
            const homsBonus = 10 * multiplier;
            data.homs = (data.homs || 0) + homsBonus;
            summaryRewards.push(`+${homsBonus} Homs (Title Duplicate)`);
          } else {
            data.purchasedTitles.push(randomTitle.name);
            summaryRewards.push(`Title: ${randomTitle.name}`);
          }
        } else {
          const xpReward = (Math.floor(Math.random() * 49000) + 1000) * multiplier;
          data.xp = (data.xp || 0) + xpReward;
          summaryRewards.push(`+${formatNumber(xpReward)} XP`);
        }
      }
      return data;
    });

    if (!res.committed) {
      if (caseRewardText) caseRewardText.innerText = '❌ Не вдалося відкрити кейс (онови дані та спробуй ще раз)';
      if (btnCloseCase) btnCloseCase.style.display = 'block';
      return;
    }

    if (caseRewardText) caseRewardText.innerText = summaryRewards.join('\n');
    if (btnCloseCase) btnCloseCase.style.display = 'block';
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
  }, 1500);
};

btnCloseCase?.addEventListener('click', () => {
  caseOpenOverlay?.classList.remove('show');
});

async function initCryptoSystem() {
  if (unsubscribeCrypto) { unsubscribeCrypto(); unsubscribeCrypto = null; }
  if (cryptoInterval) { clearInterval(cryptoInterval); cryptoInterval = null; }

  for (const symbol of COINS) {
    try {
      const cRef = ref(db, 'crypto/' + symbol);
      const snap = await get(cRef);
      if (!snap.exists()) {
        const price = INITIAL_PRICES[symbol];
        await set(cRef, { price: price, history: [{ t: Date.now(), p: price }] });
      }
    } catch (e) {}
  }

  unsubscribeCrypto = onValue(ref(db, 'crypto'), (snap) => {
    const data = snap.val();
    if (!data) return;
    cryptoState = data;
    renderCryptoListPreservingFocus();
  });

  cryptoInterval = setInterval(async () => {
    for (const symbol of COINS) {
      if (symbol === 'PLAYERHOM') continue;
      updateCryptoPrice(symbol);
    }
  }, 30000);
}

async function updateCryptoPrice(symbol) {
  if (symbol === 'PLAYERHOM') return;
  const cRef = ref(db, 'crypto/' + symbol);
  const basePrice = INITIAL_PRICES[symbol] || 100;
  try {
    await runTransaction(cRef, (data) => {
      if (!data) return data;
      const currentPrice = data.price || basePrice;
      // Нейтральний дрейф (50/50) з м'яким тяжінням до базової ціни, щоб ринок не падав у нуль
      let growthProb = 0.5;
      if (currentPrice < basePrice * 0.4) growthProb = 0.62;
      else if (currentPrice > basePrice * 2.5) growthProb = 0.38;

      const isGrowth = Math.random() < growthProb;
      const percent = (Math.random() * 0.025) + 0.005;
      let newPrice = isGrowth ? currentPrice * (1 + percent) : currentPrice * (1 - percent);
      newPrice = Math.max(1, newPrice);

      const history = data.history || [];
      history.push({ t: Date.now(), p: newPrice });
      if (history.length > 30) history.shift();
      return { price: newPrice, history: history };
    });
  } catch (err) {}
}

function renderCryptoList() {
  if (!cryptoListEl) return;
  cryptoListEl.innerHTML = '';
  for (const symbol of COINS) {
    const info = cryptoState[symbol];
    if (!info) continue;

    const price = info.price || INITIAL_PRICES[symbol];
    const history = info.history || [];
    const prevPrice = history.length > 1 ? history[history.length - 2].p : (history[0]?.p || price);
    const isUp = price >= prevPrice;
    const holding = state.holdings?.[symbol] || 0;
    const qty = getQty(symbol);

    const card = document.createElement('div');
    card.className = 'crypto-card';
    card.innerHTML = `
      <div class="crypto-header">
        <div class="crypto-symbol">${escapeHtml(symbol)}</div>
        <div class="crypto-price ${isUp ? 'up' : 'down'}">${formatPrice(price)} 🪙</div>
      </div>
      <canvas class="crypto-chart" id="chart-${escapeHtml(symbol)}" width="300" height="60"></canvas>
      <div class="crypto-actions">
        <input type="number" min="1" value="${qty}" class="crypto-input" id="qty-${escapeHtml(symbol)}" data-symbol="${escapeHtml(symbol)}">
        <button class="crypto-btn buy" data-symbol="${escapeHtml(symbol)}" data-action="buy">${translations[currentLang].buy || 'Купити'}</button>
        <button class="crypto-btn sell" data-symbol="${escapeHtml(symbol)}" data-action="sell">${translations[currentLang].sell || 'Продати'}</button>
      </div>
      <div class="crypto-holdings">Баланс: <span>${holding}</span> ${escapeHtml(symbol)}</div>
    `;
    cryptoListEl.appendChild(card);
    drawChart(document.getElementById('chart-' + symbol), history, isUp);
  }

  cryptoListEl.querySelectorAll('.crypto-input').forEach(inp => {
    inp.addEventListener('input', () => setQty(inp.dataset.symbol, inp.value));
  });

  cryptoListEl.querySelectorAll('.crypto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const symbol = btn.dataset.symbol;
      const action = btn.dataset.action;
      const qty = parseInt(document.getElementById('qty-' + symbol)?.value, 10) || 1;
      tradeCrypto(symbol, action, qty);
    });
  });
}

function drawChart(canvas, history, isUp) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (history.length < 2) return;

  const prices = history.map(x => x.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  ctx.beginPath();
  ctx.strokeStyle = isUp ? '#2ecc71' : '#ff5252';
  ctx.lineWidth = 2;

  history.forEach((point, i) => {
    const x = (i / (history.length - 1)) * (w - 4) + 2;
    const y = h - ((point.p - min) / range) * (h - 8) - 4;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

async function tradeCrypto(symbol, action, qty) {
  if (!currentUid || qty <= 0) return;

  let executedPrice = null;
  let traded = false;

  const res = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data) return data;
    if (!data.holdings) data.holdings = {};
    const livePrice = cryptoState[symbol]?.price || INITIAL_PRICES[symbol];
    const total = livePrice * qty;

    if (action === 'buy') {
      if ((data.coins || 0) < total) return;
      data.coins -= total;
      data.holdings[symbol] = (data.holdings[symbol] || 0) + qty;
      executedPrice = livePrice;
      traded = true;
    } else {
      const owned = data.holdings[symbol] || 0;
      if (owned < qty) return;
      data.coins = (data.coins || 0) + total;
      data.holdings[symbol] = owned - qty;
      executedPrice = livePrice;
      traded = true;
    }
    return data;
  });

  if (!res.committed || !traded) {
    showStatus(action === 'buy' ? '❌ Недостатньо монет' : '❌ Недостатньо монет активу');
    return;
  }

  // Перевіряємо актуальну ціну в базі й коригуємо баланс за свіжою ціною, якщо вона змінилася
  const freshSnap = await get(ref(db, 'crypto/' + symbol));
  const freshPrice = freshSnap.exists() ? (freshSnap.val()?.price || executedPrice) : executedPrice;
  if (freshPrice && executedPrice && Math.abs(freshPrice - executedPrice) > 1e-6) {
    const diffTotal = (freshPrice - executedPrice) * qty;
    await runTransaction(ref(db, 'users/' + currentUid), (data) => {
      if (!data) return data;
      if (action === 'buy') {
        data.coins = Math.max(0, (data.coins || 0) - diffTotal);
      } else {
        data.coins = Math.max(0, (data.coins || 0) + diffTotal);
      }
      return data;
    });
  }

  if (symbol === 'PLAYERHOM') {
    const cRef = ref(db, 'crypto/PLAYERHOM');
    await runTransaction(cRef, (cData) => {
      const curPrice = cData?.price || INITIAL_PRICES.PLAYERHOM;
      const step = Math.min(0.25, Math.max(0.015, qty * 0.015));
      const nextPrice = action === 'buy'
        ? curPrice * (1 + step)
        : Math.max(1, curPrice * (1 - step));
      const history = Array.isArray(cData?.history) ? [...cData.history] : [];
      history.push({ t: Date.now(), p: nextPrice });
      if (history.length > 30) history.shift();
      return { price: nextPrice, history };
    });
  }

  showStatus('✅ Угоду виконано!');
}

const ROULETTE_REWARDS = [
  { type: 'coins', val: 1000, icon: '🪙', text: '+1,000 Coins' },
  { type: 'xp', val: 500, icon: '⭐', text: '+500 XP' },
  { type: 'homs', val: 10, icon: '🐹', text: '+10 Homs' },
  { type: 'case', val: 1, icon: '📦', text: '+1 Basic Case' },
  { type: 'leg_case', val: 1, icon: '🌟', text: '+1 Legendary Case' }
];
const ROULETTE_ITEM_WIDTH = 60;
const ROULETTE_TOTAL_SLOTS = 45;
const ROULETTE_TARGET_INDEX = 32;

function buildRouletteStrip(targetReward) {
  if (!rouletteStrip) return;
  rouletteStrip.innerHTML = '';
  for (let i = 0; i < ROULETTE_TOTAL_SLOTS; i++) {
    const itemObj = i === ROULETTE_TARGET_INDEX
      ? targetReward
      : ROULETTE_REWARDS[Math.floor(Math.random() * ROULETTE_REWARDS.length)];
    const div = document.createElement('div');
    div.className = 'roulette-item';
    div.innerText = itemObj.icon;
    rouletteStrip.appendChild(div);
  }
}

function initRoulette() {
  buildRouletteStrip(ROULETTE_REWARDS[0]);
}

btnSpinRoulette?.addEventListener('click', async () => {
  if (!AdController) { showStatus('❌ Реклама недоступна'); return; }
  try {
    const result = await AdController.show();
    if (result && result.done) {
      const reward = ROULETTE_REWARDS[Math.floor(Math.random() * ROULETTE_REWARDS.length)];
      buildRouletteStrip(reward);

      rouletteStrip.style.transition = 'none';
      rouletteStrip.style.transform = 'translateX(0px)';
      void rouletteStrip.offsetWidth;

      const containerWidth = rouletteStrip.parentElement?.clientWidth || 300;
      const centerOffset = (containerWidth / 2) - (ROULETTE_ITEM_WIDTH / 2);
      const jitter = Math.floor(Math.random() * 21) - 10;
      const targetTranslate = Math.max(0, (ROULETTE_TARGET_INDEX * ROULETTE_ITEM_WIDTH) - centerOffset + jitter);

      btnSpinRoulette.disabled = true;
      rouletteStrip.style.transition = 'transform 3s cubic-bezier(0.12, 0.85, 0.22, 1)';
      rouletteStrip.style.transform = `translateX(-${targetTranslate}px)`;

      setTimeout(async () => {
        await runTransaction(ref(db, 'users/' + currentUid), (data) => {
          if (!data) return data;
          if (reward.type === 'coins') data.coins = (data.coins || 0) + reward.val;
          if (reward.type === 'xp') data.xp = (data.xp || 0) + reward.val;
          if (reward.type === 'homs') data.homs = (data.homs || 0) + reward.val;
          if (reward.type === 'case') {
            if (!data.cases) data.cases = {};
            data.cases.basic = (data.cases.basic || 0) + 1;
          }
          if (reward.type === 'leg_case') {
            data.legendaryCases = (data.legendaryCases || 0) + 1;
          }
          return data;
        });

        btnSpinRoulette.disabled = false;
        showStatus(`🎁 Нагорода: ${reward.text}`);
        try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
      }, 3100);
    }
  } catch (e) {
    btnSpinRoulette.disabled = false;
    showStatus('❌ Рекламу не додивлено');
  }
});
