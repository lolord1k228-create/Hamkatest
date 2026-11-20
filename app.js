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
try { tg?.expand(); tg?.ready(); } catch(e) {}

let AdController = null;
const BOT_LINK = "https://t.me/hamka_game_bot";

const gameDataEl = document.getElementById('game-data');
const GAME_DATA = gameDataEl ? JSON.parse(gameDataEl.textContent) : {};

const translations = {
  en: {
    loading: "Loading...",
    auth_subtitle: "Crypto clicker with upgrades",
    login: "Login",
    register: "Register",
    auth_hint: "🔒 Choose login method",
    btn_login: "👉 Login",
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
    titles_title: "Titles",
    avatars_title: "Avatars",
    skins_title: "Skins",
    top_title: "🏆 Leaderboard",
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
    promo_title: "🎟 Referral Promo Code",
    promo_desc: "Share your code! Friend gets 1 Basic Case, you get 1 Legendary Case (x10 loot)!",
    promo_enter_placeholder: "Enter friend's promo code",
    promo_activate: "Activate",
    promo_share: "Share",
    promo_already_used: "✅ You have already activated a referral promo code",
    invite_friend: "👥 Invite friend",
    invite_copied: "Приглашение скопировано"
  },
  uk: {
    loading: "Завантаження...",
    auth_subtitle: "Крипто-клікер з апгрейдами",
    login: "Вхід",
    register: "Реєстрація",
    auth_hint: "🔒 Виберіть спосіб входу",
    btn_login: "👉 Увійти",
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
    titles_title: "Титули",
    avatars_title: "Аватарки",
    skins_title: "Скіни",
    top_title: "🏆 Топ гравців",
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
    promo_title: "🎟 Реферальний промокод",
    promo_desc: "Ділися кодом! Друг отримає 1 Базовий кейс, а ти — 1 Легендарний кейс (лут x10)!",
    promo_enter_placeholder: "Введіть промокод друга",
    promo_activate: "Активувати",
    promo_share: "Поділитися",
    promo_already_used: "✅ Ви вже активували реферальний промокод",
    invite_friend: "👥 Запросити друга",
    invite_copied: "Приглашение скопировано"
  },
  ru: {
    loading: "Загрузка...",
    auth_subtitle: "Крипто-кликер с апгрейдами",
    login: "Вход",
    register: "Регистрация",
    auth_hint: "🔒 Выберите способ входа",
    btn_login: "👉 Войти",
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
    titles_title: "Титулы",
    avatars_title: "Аватарки",
    skins_title: "Скины",
    top_title: "🏆 Топ игроков",
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
    promo_title: "🎟 Реферальный промокод",
    promo_desc: "Делись кодом! Друг получит 1 Базовый кейс, а ты — 1 Легендарный кейс (лут x10)!",
    promo_enter_placeholder: "Введите промокод друга",
    promo_activate: "Активировать",
    promo_share: "Поделиться",
    promo_already_used: "✅ Вы уже активировали реферальный промокод",
    invite_friend: "👥 Пригласить друга",
    invite_copied: "Приглашение скопировано"
  }
};

let currentLang = localStorage.getItem('hamka_lang') || 'en';

function setLanguage(lang) {
  if (!translations[lang]) lang = 'en';
  currentLang = lang;
  localStorage.setItem('hamka_lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });

  const langSelect = document.getElementById('language-select');
  if (langSelect) langSelect.value = lang;
}

const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const gameScreen = document.getElementById('game-screen');
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
const bottomCoins = document.getElementById('bottom-coins');
const energyDisplay = document.getElementById('energy-label-text');
const energyDisplayBottom = document.getElementById('energy-label-bottom');
const energyBar = document.getElementById('energy-bar');
const hamster = document.getElementById('hamster');
const tapArea = document.getElementById('tap-area');
const statusEl = document.getElementById('status');
const cryptoListEl = document.getElementById('crypto-list');
const shopListEl = document.getElementById('shop-list');
const leaderboardList = document.getElementById('leaderboard-list');

const xpDisplay = document.getElementById('xp-display');
const xpNext = document.getElementById('xp-next');
const xpBar = document.getElementById('xp-bar');
const levelName = document.getElementById('level-name');
const autoTapLabel = document.getElementById('auto-tap-label');

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

const invTitles = document.getElementById('inv-titles');
const invAvatars = document.getElementById('inv-avatars');
const invSkins = document.getElementById('inv-skins');
const invCases = document.getElementById('inv-cases');
const casesSection = document.getElementById('cases-section');

const modalViewProfile = document.getElementById('modal-view-profile');
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

let isLoginMode = true;
let state = {
  coins: 0, homs: 0, energy: 200, maxEnergy: 200, xp: 0, prestige: 0,
  title: 'Beginner', avatar: '🐭', nickname: '', publicId: '',
  activeSkin: 'default', holdings: {},
  purchasedTitles: [], purchasedAvatars: [], purchasedSkins: [],
  cases: {}, legendaryCases: 0,
  adWatches: 0,
  usedReferralCode: false,
  referredBy: '',
  invited: 0,
  hideFromTop: false,
  upgrades: {
    tapLevel: 0, tapPower: 1, xpPerTap: 1,
    autoTapRate: 0, autoXpRate: 0, energyRate: 1, caseChance: 0
  }
};
let pendingTap = false;
let lastTapTime = 0;
let unsubscribeUserData = null;
let gameLoop = null;
let cryptoInterval = null;
let currentUid = null;
let currentShopTab = 'auto';
let isAdmin = false;
let selectedCaseTypeToOpen = null;
let userDataReady = false;
let pendingStartParam = null;
let referralProcessing = false;

try {
  const sp = tg?.initDataUnsafe?.start_param;
  if (typeof sp === 'string' && sp.trim().length > 0) {
    pendingStartParam = sp.trim();
  }
} catch(e) {}

const GITHUB_RAW = "https://raw.githubusercontent.com/lolord1k228-create/hamka-game/main/skins/";
const SKINS = GAME_DATA.SKINS || [
  { id: 'skin_ai', name: 'AIHamster', file: 'ai_hamster.png', price: 50000 },
  { id: 'skin_neon', name: 'Neon Hamster', file: 'hamster.png', price: 5000000 },
  { id: 'skin_hom', name: 'HomHamster', file: 'homhamster.png', price: 1500, currency: 'homs' }
];

let TITLES = [];
let AVATARS = [];

const CASE_TITLES = [
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

const LEVELS = GAME_DATA.LEVELS || [
  { name: '0 beginner', xp: 0 },
  { name: '1 beginner', xp: 50 },
  { name: '2 beginner', xp: 200 },
  { name: '3 beginner', xp: 500 },
  { name: '4 beginner', xp: 1500 },
  { name: 'bronze 1', xp: 5000 },
  { name: 'bronze 2', xp: 10000 },
  { name: 'bronze 3', xp: 15000 },
  { name: 'silver 1', xp: 50000 },
  { name: 'silver 2', xp: 1000000 },
  { name: 'silver 3', xp: 150000 },
  { name: 'gold 1', xp: 300000 },
  { name: 'gold 2', xp: 600000 },
  { name: 'gold 3', xp: 900000 }
];

const COINS = GAME_DATA.COINS || ['OLDHAM', 'NEWHAM', 'HAM', 'BHAM', 'PLAYERHOM'];
const INITIAL_PRICES = GAME_DATA.INITIAL_PRICES || { OLDHAM: 100, NEWHAM: 250, HAM: 500, BHAM: 1000, PLAYERHOM: 50 };

const SHOP_ITEMS = GAME_DATA.SHOP_ITEMS || {
  auto: [
    { id: 'autoTap', title: 'Auto Tap', desc: '+1 coin/sec', basePrice: 200, multiplier: 2, maxLevel: 999 },
    { id: 'autoXp', title: 'Auto XP', desc: '+1 XP/sec', basePrice: 1500, multiplier: 2, maxLevel: 999 },
    { id: 'energyRate', title: '+Energy Regen', desc: '+1 energy/sec', basePrice: 1000, multiplier: 10, maxLevel: 999 },
  ],
  upgrade: [
    { id: 'tap', title: 'Tap Power', desc: '+1 coin per tap', basePrice: 50, multiplier: 10, maxLevel: 9, prices: [50, 200, 2000, 5000, 20000, 50000, 150000, 500000, 2000000] },
    { id: 'xpTap', title: 'XP Tap', desc: '+1 XP per tap', basePrice: 50000, multiplier: 10, maxLevel: 999, prices: [50000, 500000, 5000000, 50000000, 500000000] },
    { id: 'maxEnergy', title: 'Max Energy', desc: '+50 max energy', basePrice: 50000, multiplier: 10, maxLevel: 999, prices: [50000, 500000, 5000000, 50000000, 500000000] },
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

function getQty(symbol) {
  const v = localStorage.getItem('qty_' + symbol);
  return v ? Math.max(1, parseInt(v) || 1) : 1;
}
function setQty(symbol, val) { localStorage.setItem('qty_' + symbol, val); }

function showStatus(text) {
  statusEl.innerText = text;
  statusEl.classList.add('show');
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(() => statusEl.classList.remove('show'), 2500);
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

languageSelect.addEventListener('change', (e) => {
  setLanguage(e.target.value);
  if (currentUid) {
    update(ref(db, 'users/' + currentUid), { language: e.target.value });
  }
});

hideTopToggle.addEventListener('change', async (e) => {
  const val = e.target.checked;
  state.hideFromTop = val;
  if (currentUid) {
    await update(ref(db, 'users/' + currentUid), { hideFromTop: val });
    showStatus('✅ Updated settings');
  }
});

btnLogout.addEventListener('click', async () => {
  try {
    await signOut(auth);
    showStatus('Logged out');
  } catch(e) {}
});

setAuthMode(true);
function setAuthMode(loginMode) {
  isLoginMode = loginMode;
  if (loginMode) {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    authSubmit.innerHTML = '👉 Login';
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmit.innerHTML = '📝 Register';
  }
  authError.innerText = '';
}
tabLogin.addEventListener('click', () => setAuthMode(true));
tabRegister.addEventListener('click', () => setAuthMode(false));

function nickToEmail(nick) {
  if (nick.includes('@')) return nick.trim();
  const cleanNick = nick.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanNick.length < 3) return null;
  return cleanNick + '@hamka.game';
}

async function autoLoginTelegram() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!tgUser) {
    loadingScreen.style.display = 'none';
    authScreen.classList.remove('hidden');
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
      loadingScreen.style.display = 'none';
      authScreen.classList.remove('hidden');
    }
  }
}

autoLoginTelegram();

authSubmit.addEventListener('click', async () => {
  const nick = authNickname.value.trim();
  const password = authPassword.value;
  if (!nick) { authError.innerText = 'Enter nickname'; return; }
  if (password.length < 6) { authError.innerText = 'Password min 6 chars'; return; }
  const email = nickToEmail(nick);
  if (!email) { authError.innerText = 'Invalid nickname'; return; }

  authSubmit.disabled = true;
  try {
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    authError.innerText = err.message;
  } finally {
    authSubmit.disabled = false;
  }
});

tgLoginBtn.addEventListener('click', async () => {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!tgUser) { authError.innerText = 'Open via Telegram bot'; return; }
  try {
    await signInWithEmailAndPassword(auth, `tg_${tgUser.id}@hamka.test`, `Tg_${tgUser.id}_SecurePass_2026!`);
  } catch (e) {
    try {
      await createUserWithEmailAndPassword(auth, `tg_${tgUser.id}@hamka.test`, `Tg_${tgUser.id}_SecurePass_2026!`);
    } catch (err) {}
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUid = user.uid;
    userDataReady = false;
    loadingScreen.style.display = 'none';
    authScreen.classList.add('hidden');
    gameScreen.classList.add('visible');

    if (typeof window.Adsgram !== 'undefined') {
      try { AdController = window.Adsgram.init({ blockId: "59759" }); } catch (e) {}
    }

    loadGameData().then(() => {
      initGame(user.uid);
      initCryptoSystem();
      checkAdminStatus(user.uid);
      initRoulette();
    });
  } else {
    currentUid = null;
    userDataReady = false;
    loadingScreen.style.display = 'none';
    authScreen.classList.remove('hidden');
    gameScreen.classList.remove('visible');
    if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }
    if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
    if (cryptoInterval) { clearInterval(cryptoInterval); cryptoInterval = null; }
  }
});

document.querySelectorAll('.menu-item[data-page]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('page-' + item.dataset.page).classList.add('active');
    if (item.dataset.page === 'shop') renderShop();
    if (item.dataset.page === 'profile') renderProfile();
    if (item.dataset.page === 'inventory') renderInventory();
    if (item.dataset.page === 'top') loadLeaderboard();
    if (item.dataset.page === 'minigames') {
      minitabCrypto.classList.add('active');
      minitabRoulette.classList.remove('active');
      miniContentCrypto.style.display = 'block';
      miniContentRoulette.style.display = 'none';
    }
  });
});

minitabCrypto.addEventListener('click', () => {
  minitabCrypto.classList.add('active');
  minitabRoulette.classList.remove('active');
  miniContentCrypto.style.display = 'block';
  miniContentRoulette.style.display = 'none';
});

minitabRoulette.addEventListener('click', () => {
  minitabCrypto.classList.remove('active');
  minitabRoulette.classList.add('active');
  miniContentCrypto.style.display = 'none';
  miniContentRoulette.style.display = 'block';
});

document.querySelectorAll('.shop-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
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
    } else if (Array.isArray(GAME_DATA.TITLES) && GAME_DATA.TITLES.length > 0) {
      TITLES = GAME_DATA.TITLES;
    } else {
      TITLES = [
        { id: 'beg', name: 'Beginner', price: 0, color: 'linear-gradient(90deg, #555, #777)', reqPrestige: 0 },
        { id: 'brnz', name: 'Bronze Hamster', price: 0, color: 'linear-gradient(90deg, #cd7f32, #8b4513)', reqPrestige: 1 },
        { id: 'slvr', name: 'Silver Hamster', price: 0, color: 'linear-gradient(90deg, #c0c0c0, #808080)', reqPrestige: 2 },
        { id: 'gld', name: 'Gold Hamster', price: 0, color: 'linear-gradient(90deg, #ffd700, #b8860b)', reqPrestige: 3 },
        { id: 'crypto_baron', name: 'Crypto Baron', price: 10000, color: 'linear-gradient(90deg, #ff9800, #ff5722)', reqPrestige: 0 },
        { id: 'tap_god', name: 'Tap God', price: 50000, color: 'linear-gradient(90deg, #00bcd4, #2196f3)', reqPrestige: 0 },
        { id: 'h_mag', name: 'Хом\'яковий Магнат', price: 100, currency: 'homs', color: 'linear-gradient(90deg, #2ecc71, #27ae60)', reqPrestige: 0 },
        { id: 'h_lord', name: 'Володар Хомів', price: 500, currency: 'homs', color: 'linear-gradient(90deg, #9b59b6, #8e44ad)', reqPrestige: 0 },
        { id: 'h_leg', name: 'Легендарний Хом\'як', price: 2000, currency: 'homs', color: 'linear-gradient(90deg, #f1c40f, #e67e22)', reqPrestige: 0 }
      ];
    }

    const avatarsSnap = await get(ref(db, 'game_data/avatars'));
    if (avatarsSnap.exists()) {
      AVATARS = Object.keys(avatarsSnap.val()).map(id => ({ id, ...avatarsSnap.val()[id] }));
    } else if (Array.isArray(GAME_DATA.AVATARS) && GAME_DATA.AVATARS.length > 0) {
      AVATARS = GAME_DATA.AVATARS;
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

async function loadLeaderboard() {
  leaderboardList.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Loading...</div>';
  try {
    const snap = await get(ref(db, 'users'));
    const users = snap.val() || {};
    const arr = [];
    for (const uid in users) {
      const u = users[uid];
      if (u.hideFromTop) continue;
      arr.push({
        uid, nickname: u.nickname || 'Player', avatar: u.avatar || '🐭',
        title: u.title || 'Beginner', activeSkin: u.activeSkin || 'default',
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
          update(ref(db, 'users/' + currentUid), { purchasedTitles: [...state.purchasedTitles, topTitle] });
        }
      }

      const titleObj = TITLES.find(t => t.name === u.title) || CASE_TITLES.find(t => t.name === u.title) || TOP_TITLES.find(t => t.name === u.title);
      const titleColor = titleObj ? titleObj.color : 'linear-gradient(90deg, #8a2be2, #da70d6)';

      let avatarHtml = `<div class="lb-avatar">${u.avatar}</div>`;
      if (u.activeSkin !== 'default') {
        const skinObj = SKINS.find(s => s.id === u.activeSkin);
        if (skinObj && skinObj.file) avatarHtml = `<div class="lb-avatar" style="background-image: url('${GITHUB_RAW}${skinObj.file}');"></div>`;
      }

      el.innerHTML = `
        <div style="font-size:16px; font-weight:800; color:#f5a623; width:25px;">#${i + 1}</div>
        ${avatarHtml}
        <div class="lb-info">
          <div class="lb-name">${u.nickname}</div>
          <div class="lb-title" style="background:${titleColor};">${u.title}</div>
        </div>
        <div class="lb-stats">
          <div class="lb-xp">${formatNumber(u.xp)} XP</div>
          <div class="lb-prestige">🌟 ${u.prestige}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        viewProfNick.innerText = u.nickname;
        viewProfId.innerText = 'ID: ' + u.publicId;
        viewProfTitle.innerText = u.title;
        viewProfTitle.style.background = titleColor;
        viewProfXp.innerText = formatNumber(u.xp);
        viewProfPrestige.innerText = u.prestige;
        modalViewProfile.classList.add('show');
      });
      leaderboardList.appendChild(el);
    });
  } catch (err) {}
}

btnChangeNickname.addEventListener('click', () => {
  newNicknameInput.value = state.nickname;
  modalNickname.classList.add('show');
});

btnSaveNickname.addEventListener('click', async () => {
  const newNick = newNicknameInput.value.trim();
  if (newNick.length < 3) { showStatus('❌ Too short'); return; }
  await update(ref(db, 'users/' + currentUid), { nickname: newNick });
  modalNickname.classList.remove('show');
  showStatus('✅ Saved!');
});

async function checkAdminStatus(uid) {
  try {
    const snap = await get(ref(db, 'admins/' + uid));
    if (snap.exists() && snap.val() === true) {
      isAdmin = true;
      adminBtnBadge.style.display = 'flex';
    }
  } catch (e) {}
}

window.adminAddCoins = async () => {
  if (!isAdmin || !currentUid) return;
  const amount = parseInt(document.getElementById('admin-coins-input').value) || 0;
  await runTransaction(ref(db, 'users/' + currentUid), d => { if (d) d.coins = (d.coins || 0) + amount; return d; });
  showStatus('✅ Added coins');
};
window.adminAddHoms = async () => {
  if (!isAdmin || !currentUid) return;
  const amount = parseInt(document.getElementById('admin-homs-input').value) || 0;
  await runTransaction(ref(db, 'users/' + currentUid), d => { if (d) d.homs = (d.homs || 0) + amount; return d; });
  showStatus('✅ Added Homs');
};
window.adminAddXp = async () => {
  if (!isAdmin || !currentUid) return;
  const amount = parseInt(document.getElementById('admin-xp-input').value) || 0;
  await runTransaction(ref(db, 'users/' + currentUid), d => { if (d) d.xp = (d.xp || 0) + amount; return d; });
  showStatus('✅ Added XP');
};
window.adminAddCase = async () => {
  if (!isAdmin || !currentUid) return;
  await runTransaction(ref(db, 'users/' + currentUid), d => {
    if (!d) return d;
    if (!d.cases) d.cases = {};
    d.cases.basic = (d.cases.basic || 0) + 1;
    return d;
  });
  showStatus('✅ Case added');
};

async function applyReferralCode(rawCode, fromManualInput = false) {
  if (!currentUid || !userDataReady) {
    if (typeof rawCode === 'string' && rawCode.trim().length > 0) {
      pendingStartParam = rawCode.trim();
    }
    return false;
  }

  const code = String(rawCode || '').trim();
  if (!code) {
    if (fromManualInput) showStatus('❌ [ERR_1] Enter code');
    return false;
  }
  if (code.length < 3 || code.length > 12) {
    if (fromManualInput) showStatus('❌ Invalid code length');
    return false;
  }
  if (code === state.publicId || code === currentUid) {
    if (fromManualInput) showStatus('❌ [ERR_3] Own code');
    return false;
  }
  if (state.usedReferralCode) {
    if (fromManualInput) showStatus('❌ [ERR_4] Already activated');
    return false;
  }
  if (referralProcessing) return false;

  referralProcessing = true;
  if (fromManualInput) showStatus('⏳ Searching...');

  try {
    const usersSnap = await get(ref(db, 'users'));
    if (!usersSnap.exists()) {
      if (fromManualInput) showStatus('❌ [ERR_5] Database empty');
      referralProcessing = false;
      return false;
    }

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

    if (!referrerUid) {
      if (fromManualInput) showStatus('❌ [ERR_6] Code not found');
      referralProcessing = false;
      return false;
    }

    const res1 = await runTransaction(ref(db, 'users/' + currentUid), (data) => {
      if (!data) return data;
      if (data.usedReferralCode) return;
      data.usedReferralCode = true;
      data.referredBy = referrerUid;
      if (!data.cases) data.cases = {};
      data.cases.basic = (data.cases.basic || 0) + 1;
      return data;
    });

    if (!res1.committed) {
      if (fromManualInput) showStatus('❌ [ERR_7] User tx failed (Rules)');
      referralProcessing = false;
      return false;
    }

    const res2 = await runTransaction(ref(db, 'users/' + referrerUid), (data) => {
      if (!data) return data;
      data.legendaryCases = (data.legendaryCases || 0) + 1;
      data.invited = (data.invited || 0) + 1;
      return data;
    });

    if (!res2.committed) {
      if (fromManualInput) showStatus('❌ [ERR_8] Referrer tx failed (Rules)');
      referralProcessing = false;
      return false;
    }

    pendingStartParam = null;
    showStatus(`Тебя пригласил ${referrerNick}`);
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch(e) {}
    referralProcessing = false;
    return true;
  } catch (err) {
    if (fromManualInput) {
      alert(`Firebase Error:\n${err.code || ''}\n${err.message}`);
      showStatus('❌ [ERR_SYS] ' + (err.code || err.message));
    }
    referralProcessing = false;
    return false;
  }
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

window.inviteFriend = async function() {
  const refCode = state.publicId || currentUid || '';
  const inviteLink = `${BOT_LINK}?startapp=${encodeURIComponent(refCode)}`;
  const shareText = `🐭 Грай у Hamka Game та забирай бонусний кейс!`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

  await copyTextWithFallback(inviteLink);
  showStatus('Приглашение скопировано');

  if (tg && typeof tg.openTelegramLink === 'function') {
    try {
      tg.openTelegramLink(shareUrl);
      return;
    } catch (e) {}
  }
  window.open(shareUrl, '_blank');
};

function initGame(uid) {
  const userRef = ref(db, 'users/' + uid);
  const initialData = {
    coins: 0, homs: 0, energy: 200, maxEnergy: 200, xp: 0, prestige: 0,
    title: 'Beginner', avatar: '🐭', holdings: {},
    nickname: '', publicId: '', activeSkin: 'default',
    tapLevel: 0, tapPower: 1, xpPerTap: 1, autoTapRate: 0, autoXpRate: 0, energyRate: 1,
    purchasedTitles: [], purchasedAvatars: [], purchasedSkins: [],
    cases: { basic: 1 }, legendaryCases: 0, adWatches: 0,
    usedReferralCode: false, referredBy: '', invited: 0, hideFromTop: false, language: 'en',
    createdAt: Date.now()
  };

  get(userRef).then(async (snap) => {
    if (!snap.exists()) {
      const tgUser = tg?.initDataUnsafe?.user;
      const generatedId = tgUser ? 'tg_' + tgUser.id : Math.floor(100000 + Math.random() * 900000).toString();
      const defaultNick = tgUser ? (tgUser.username || tgUser.first_name) : 'Player_' + generatedId;

      await set(userRef, {
        ...initialData,
        nickname: defaultNick,
        publicId: generatedId
      });
    }
  }).catch(err => {});

  unsubscribeUserData = onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    if (pendingTap) return;

    state.coins = data.coins || 0;
    state.homs = data.homs || 0;
    state.energy = data.energy ?? 200;
    state.maxEnergy = data.maxEnergy ?? 200;
    state.xp = data.xp || 0;
    state.prestige = data.prestige || 0;
    state.title = data.title || 'Beginner';
    state.avatar = data.avatar || '🐭';
    state.nickname = data.nickname || 'Player';
    state.publicId = data.publicId || '000000';
    state.holdings = data.holdings || {};
    state.purchasedTitles = data.purchasedTitles || [];
    state.purchasedAvatars = data.purchasedAvatars || [];
    state.purchasedSkins = data.purchasedSkins || [];
    state.cases = data.cases || {};
    state.legendaryCases = data.legendaryCases || 0;
    state.activeSkin = data.activeSkin || 'default';
    state.adWatches = data.adWatches || 0;
    state.usedReferralCode = data.usedReferralCode || false;
    state.referredBy = data.referredBy || '';
    state.invited = data.invited || 0;
    state.hideFromTop = data.hideFromTop || false;

    if (data.language && data.language !== currentLang) {
      setLanguage(data.language);
    } else {
      setLanguage(currentLang);
    }

    state.upgrades.tapLevel = data.tapLevel || 0;
    state.upgrades.tapPower = data.tapPower || 1;
    state.upgrades.xpPerTap = data.xpPerTap || 1;
    state.upgrades.autoTapRate = data.autoTapRate || 0;
    state.upgrades.autoXpRate = data.autoXpRate || 0;
    state.upgrades.energyRate = data.energyRate || 1;

    hideTopToggle.checked = state.hideFromTop;
    userDataReady = true;

    renderUI();
    checkAutoPrestige();
    updateHamsterSkin();

    if (document.getElementById('page-shop').classList.contains('active')) renderShop();
    if (document.getElementById('page-profile').classList.contains('active')) renderProfile();
    if (document.getElementById('page-inventory').classList.contains('active')) renderInventory();
    renderCryptoList();

    if (pendingStartParam && !state.usedReferralCode && !referralProcessing) {
      applyReferralCode(pendingStartParam, false);
    }
  });

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(async () => {
    const earn = state.upgrades.autoTapRate;
    const earnXp = state.upgrades.autoXpRate;
    const earnEnergy = state.upgrades.energyRate;

    if (earn > 0 || earnXp > 0 || (state.energy < state.maxEnergy && earnEnergy > 0)) {
      await runTransaction(userRef, (data) => {
        if (!data) return data;
        let changed = false;
        if (earn > 0) { data.coins = (data.coins || 0) + earn; changed = true; }
        if (earnXp > 0) { data.xp = (data.xp || 0) + earnXp; changed = true; }
        if (earnEnergy > 0 && (data.energy ?? 0) < (data.maxEnergy ?? 200)) {
          data.energy = Math.min(data.maxEnergy ?? 200, (data.energy || 0) + earnEnergy);
          changed = true;
        }
        return changed ? data : undefined;
      });
    }
  }, 1000);

  hamster.onclick = async (e) => {
    const now = Date.now();
    if (now - lastTapTime < 60) return;
    lastTapTime = now;

    if (state.energy < 1) { showStatus("❌ No energy!"); return; }
    const tapPower = state.upgrades.tapPower;
    const xpPerTap = state.upgrades.xpPerTap;

    state.energy = Math.max(0, state.energy - 1);
    state.coins += tapPower;
    state.xp += xpPerTap;
    renderUI();

    const rect = tapArea.getBoundingClientRect();
    const effect = document.createElement('div');
    effect.className = 'tap-effect';
    effect.innerText = `+${tapPower}`;
    effect.style.left = (e.clientX - rect.left - 10) + 'px';
    effect.style.top = (e.clientY - rect.top - 10) + 'px';
    tapArea.appendChild(effect);
    setTimeout(() => effect.remove(), 800);

    try { tg?.HapticFeedback?.impactOccurred('light'); } catch(e) {}

    pendingTap = true;
    try {
      await runTransaction(userRef, (data) => {
        if (!data) data = {};
        const curEnergy = data.energy ?? 200;
        if (curEnergy < 1) return;
        data.energy = curEnergy - 1;
        data.coins = (data.coins || 0) + tapPower;
        data.xp = (data.xp || 0) + xpPerTap;
        return data;
      });
    } catch (err) {} finally { pendingTap = false; }
  };
}

function updateHamsterSkin() {
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
  const req = getPrestigeReq(state.prestige);
  if (state.xp >= req && currentUid) {
    const userRef = ref(db, 'users/' + currentUid);
    let newPrestige = state.prestige + 1;

    prestigeText.innerText = `PRESTIGE ${newPrestige}`;
    prestigeOverlay.classList.add('show');
    setTimeout(() => prestigeOverlay.classList.remove('show'), 2500);

    await runTransaction(userRef, (data) => {
      if (!data) return data;
      if ((data.xp || 0) >= req) {
        data.xp = (data.xp || 0) - req;
        data.prestige = (data.prestige || 0) + 1;
      }
      return data;
    });
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch(e) {}
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

function renderUI() {
  const coinsStr = formatNumber(state.coins);
  const homsStr = formatNumber(state.homs);

  tapCoinDisplay.innerText = coinsStr;
  topCoins.innerText = coinsStr;
  topHoms.innerText = homsStr;
  bottomCoins.innerText = coinsStr;
  autoTapLabel.innerText = formatNumber(state.upgrades.autoTapRate);

  const energyPct = (state.energy / state.maxEnergy) * 100;
  energyBar.style.width = energyPct + '%';
  energyDisplay.innerText = Math.floor(state.energy) + '/' + state.maxEnergy;
  energyDisplayBottom.innerText = Math.floor(state.energy) + '/' + state.maxEnergy;

  const { currentLvl, nextLvl } = getLevelInfo(state.xp);
  levelName.innerText = currentLvl.name;
  xpDisplay.innerText = formatNumber(state.xp);
  xpNext.innerText = nextLvl.xp === currentLvl.xp ? 'MAX' : formatNumber(nextLvl.xp);

  const lvlProgress = nextLvl.xp === currentLvl.xp ? 100 : ((state.xp - currentLvl.xp) / (nextLvl.xp - currentLvl.xp)) * 100;
  xpBar.style.width = Math.min(100, Math.max(0, lvlProgress)) + '%';
}

function renderShop() {
  if (!shopListEl) return;
  shopListEl.innerHTML = '';

  if (currentShopTab === 'cosmetics') {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    TITLES.forEach(item => {
      if (item.price <= 0) return;
      const isOwned = state.purchasedTitles.includes(item.name);
      const isHoms = item.currency === 'homs';
      const canAfford = isHoms ? state.homs >= item.price : state.coins >= item.price;

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="grid-preview" style="font-size:24px; background:${item.color};">🏆</div>
        <div class="shop-card-info">
          <div class="shop-card-title" style="background:${item.color}; -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${item.name}</div>
          <div class="shop-card-price">${formatNumber(item.price)} ${isHoms ? '🐹' : '🪙'}</div>
        </div>
        <button class="shop-card-btn" data-title-name="${item.name}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? (translations[currentLang].owned || 'Owned') : (translations[currentLang].buy || 'Buy')}</button>
      `;
      grid.appendChild(card);
    });

    AVATARS.forEach(item => {
      const isOwned = state.purchasedAvatars.includes(item.name);
      const canAfford = state.coins >= item.price;
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="grid-preview">${item.name}</div>
        <div class="shop-card-info">
          <div class="shop-card-title">Avatar</div>
          <div class="shop-card-price">${formatNumber(item.price)} 🪙</div>
        </div>
        <button class="shop-card-btn" data-avatar-name="${item.name}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? (translations[currentLang].owned || 'Owned') : (translations[currentLang].buy || 'Buy')}</button>
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
        <div class="grid-preview" style="background-image: url('${GITHUB_RAW}${item.file}');"></div>
        <div class="shop-card-info">
          <div class="shop-card-title">Skin: ${item.name}</div>
          <div class="shop-card-price">${formatNumber(item.price)} ${isHoms ? '🐹' : '🪙'}</div>
        </div>
        <button class="shop-card-btn" data-skin-id="${item.id}" ${isOwned || !canAfford ? 'disabled' : ''}>${isOwned ? (translations[currentLang].owned || 'Owned') : (translations[currentLang].buy || 'Buy')}</button>
      `;
      grid.appendChild(card);
    });

    shopListEl.appendChild(grid);

    shopListEl.querySelectorAll('.shop-card-btn').forEach(btn => {
      if (btn.dataset.titleName) {
        const item = TITLES.find(t => t.name === btn.dataset.titleName);
        btn.addEventListener('click', () => buyCosmetic({ name: item.name, price: item.price, type: 'title', currency: item.currency || 'coins' }));
      } else if (btn.dataset.avatarName) {
        const item = AVATARS.find(a => a.name === btn.dataset.avatarName);
        btn.addEventListener('click', () => buyCosmetic({ name: item.name, price: item.price, type: 'avatar', currency: 'coins' }));
      } else if (btn.dataset.skinId) {
        btn.addEventListener('click', () => buySkin(SKINS.find(s => s.id === btn.dataset.skinId)));
      }
    });
    return;
  }

  if (currentShopTab === 'cases') {
    const t = translations[currentLang];
    const promoBox = document.createElement('div');
    promoBox.className = 'promo-box';

    const enterHtml = state.usedReferralCode
      ? `<div style="font-size:12px; color:#2ecc71; margin-top:10px; font-weight:600;">${t.promo_already_used}</div>`
      : `<div class="promo-input-row">
           <input type="text" class="promo-input" id="ref-promo-input" placeholder="${t.promo_enter_placeholder}">
           <button class="shop-card-btn" id="btn-activate-promo">${t.promo_activate}</button>
         </div>`;

    promoBox.innerHTML = `
      <div class="shop-card-title" style="color:#2ecc71;">${t.promo_title}</div>
      <div class="shop-card-desc">${t.promo_desc}</div>
      <div class="promo-code-display">
        <span class="promo-code-text" id="my-promo-code">${state.publicId}</span>
        <div style="display:flex; gap:6px;">
          <button class="shop-card-btn" id="btn-copy-promo" style="padding:6px 10px;">📋</button>
          <button class="shop-card-btn" id="btn-share-promo" style="padding:6px 10px; background:#2aabee; color:#fff;">${t.promo_share}</button>
        </div>
      </div>
      ${enterHtml}
    `;
    shopListEl.appendChild(promoBox);

    document.getElementById('btn-copy-promo').addEventListener('click', async () => {
      const inviteLink = `${BOT_LINK}?startapp=${encodeURIComponent(state.publicId)}`;
      const shareText = `🐭 Грай у Hamka Game та забирай бонусний кейс!\n🤖 Бот: ${inviteLink}\n🎟 Мій промокод: ${state.publicId}`;
      await copyTextWithFallback(shareText);
      showStatus('✅ Copied with bot link!');
    });

    document.getElementById('btn-share-promo').addEventListener('click', () => {
      window.inviteFriend();
    });

    const btnActivate = document.getElementById('btn-activate-promo');
    if (btnActivate) {
      btnActivate.addEventListener('click', async () => {
        const code = document.getElementById('ref-promo-input').value.trim();
        btnActivate.disabled = true;
        const ok = await applyReferralCode(code, true);
        if (!ok) btnActivate.disabled = false;
      });
    }

    const adCaseCard = document.createElement('div');
    adCaseCard.className = 'shop-card';
    adCaseCard.innerHTML = `
      <div class="grid-preview" style="font-size:40px;">🎬</div>
      <div class="shop-card-info">
        <div class="shop-card-title">Case for Ad</div>
        <div class="shop-card-price">Progress: ${state.adWatches} / 5</div>
      </div>
      <button class="shop-card-btn" id="btn-buy-case-ad">${state.adWatches >= 5 ? 'Claim' : 'Watch'}</button>
    `;
    shopListEl.appendChild(adCaseCard);

    document.getElementById('btn-buy-case-ad').addEventListener('click', async () => {
      if (state.adWatches >= 5) {
        await update(ref(db, 'users/' + currentUid), {
          adWatches: 0,
          cases: { ...state.cases, basic: (state.cases.basic || 0) + 1 }
        });
        showStatus('✅ Case received!');
      } else {
        if (!AdController) { showStatus('❌ Ad not available'); return; }
        try {
          const result = await AdController.show();
          if (result && result.done) {
            await runTransaction(ref(db, 'users/' + currentUid), (data) => {
              if (!data) return data;
              data.adWatches = (data.adWatches || 0) + 1;
              return data;
            });
            showStatus(`✅ Ad credited! (${state.adWatches + 1}/5)`);
          }
        } catch(e) { showStatus('❌ Ad not completed'); }
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
        <div class="shop-card-title">${item.title} <span style="font-size:10px; color:#888;">(Lvl ${currentLevel})</span></div>
        <div class="shop-card-desc">${item.desc}</div>
        ${!isMaxed ? `<div class="shop-card-price">${formatNumber(price)} 🪙</div>` : `<div class="shop-card-price" style="color:#2ecc71;">${translations[currentLang].max || 'MAX'}</div>`}
      </div>
      <button class="shop-card-btn" data-id="${item.id}" ${isMaxed || !canAfford ? 'disabled' : ''}>${isMaxed ? (translations[currentLang].max || 'Max') : (translations[currentLang].buy || 'Buy')}</button>
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

  const price = getShopPrice(itemId, currentLevel);
  await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data || (data.coins || 0) < price) return;
    data.coins -= price;
    if (itemId === 'autoTap') data.autoTapRate = (data.autoTapRate || 0) + 1;
    else if (itemId === 'autoXp') data.autoXpRate = (data.autoXpRate || 0) + 1;
    else if (itemId === 'energyRate') data.energyRate = (data.energyRate || 1) + 1;
    else if (itemId === 'tap') { data.tapLevel = (data.tapLevel || 0) + 1; data.tapPower = (data.tapPower || 1) + 1; }
    else if (itemId === 'xpTap') data.xpPerTap = (data.xpPerTap || 1) + 1;
    else if (itemId === 'maxEnergy') data.maxEnergy = (data.maxEnergy || 200) + 50;
    return data;
  });
  showStatus('✅ Upgrade purchased!');
}

async function buySkin(item) {
  const isHoms = item.currency === 'homs';
  await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data) return data;
    const bal = isHoms ? (data.homs || 0) : (data.coins || 0);
    if (bal < item.price) return;
    if (isHoms) data.homs -= item.price; else data.coins -= item.price;
    if (!data.purchasedSkins) data.purchasedSkins = [];
    if (!data.purchasedSkins.includes(item.id)) data.purchasedSkins.push(item.id);
    return data;
  });
  showStatus('✅ Skin bought!');
  renderShop();
}

async function buyCosmetic(item) {
  const isHoms = item.currency === 'homs';
  await runTransaction(ref(db, 'users/' + currentUid), (data) => {
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
  showStatus('✅ Purchased!');
  renderShop();
}

function renderProfile() {
  profCoins.innerText = formatNumber(state.coins);
  profHoms.innerText = formatNumber(state.homs);
  profXp.innerText = formatNumber(state.xp);
  profPrestige.innerText = state.prestige;
  profNickname.innerText = state.nickname;
  profPublicId.innerText = 'ID: ' + state.publicId;

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

  const titleObj = TITLES.find(t => t.name === state.title) || CASE_TITLES.find(t => t.name === state.title) || TOP_TITLES.find(t => t.name === state.title);
  if (titleObj) {
    profTitle.innerText = titleObj.name;
    profTitleBadge.style.background = titleObj.color;
  } else {
    profTitle.innerText = state.title;
    profTitleBadge.style.background = 'linear-gradient(90deg, #8a2be2, #da70d6)';
  }

  const req = getPrestigeReq(state.prestige);
  prestigeInfo.innerText = state.xp >= req ? 'Ready!' : `Required ${formatNumber(req)} XP`;
}

function renderInventory() {
  const cases = state.cases || {};
  const legendaryCount = state.legendaryCases || 0;
  const hasCases = Object.keys(cases).some(k => cases[k] > 0) || legendaryCount > 0;

  if (hasCases) {
    casesSection.style.display = 'block';
    invCases.innerHTML = '';
    for (const type in cases) {
      const count = cases[type];
      if (count <= 0) continue;
      const el = document.createElement('div');
      el.className = 'case-item';
      el.innerHTML = `
        <div class="case-count-badge">${count}</div>
        <div class="case-icon">📦</div>
        <div class="case-name">Basic Case</div>
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

  const availableTitles = [
    ...TITLES.filter(t => (t.price === 0 && (t.reqPrestige === 0 || state.prestige >= t.reqPrestige)) || state.purchasedTitles.includes(t.name)),
    ...CASE_TITLES.filter(t => state.purchasedTitles.includes(t.name)),
    ...TOP_TITLES.filter(t => state.purchasedTitles.includes(t.name))
  ];
  invTitles.innerHTML = '';
  availableTitles.forEach(tItem => {
    const el = document.createElement('div');
    el.className = `inventory-item ${state.title === tItem.name ? 'active' : ''}`;
    el.innerHTML = `<div class="inventory-item-icon">🏆</div><div class="inventory-item-name" style="background:${tItem.color}; -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${tItem.name}</div>`;
    el.addEventListener('click', async () => {
      await update(ref(db, 'users/' + currentUid), { title: tItem.name });
      showStatus('✅ Title equipped!');
    });
    invTitles.appendChild(el);
  });

  const availableAvatars = ['🐭', ...state.purchasedAvatars];
  invAvatars.innerHTML = '';
  availableAvatars.forEach(avName => {
    const el = document.createElement('div');
    el.className = `inventory-item ${state.avatar === avName ? 'active' : ''}`;
    el.innerHTML = `<div class="inventory-item-icon">${avName}</div>`;
    el.addEventListener('click', async () => {
      await update(ref(db, 'users/' + currentUid), { avatar: avName });
      showStatus('✅ Avatar changed!');
    });
    invAvatars.appendChild(el);
  });

  invSkins.innerHTML = '';
  const defaultEl = document.createElement('div');
  defaultEl.className = `inventory-item ${state.activeSkin === 'default' ? 'active' : ''}`;
  defaultEl.innerHTML = `<div class="inventory-item-icon">🐭</div><div class="inventory-item-name">Default</div>`;
  defaultEl.addEventListener('click', async () => {
    await update(ref(db, 'users/' + currentUid), { activeSkin: 'default' });
    showStatus('✅ Skin changed!');
  });
  invSkins.appendChild(defaultEl);

  state.purchasedSkins.forEach(skinId => {
    const skinObj = SKINS.find(s => s.id === skinId);
    if (!skinObj || !skinObj.file) return;
    const el = document.createElement('div');
    el.className = `inventory-item ${state.activeSkin === skinId ? 'active' : ''}`;
    el.innerHTML = `<div class="inventory-item-icon" style="background-image: url('${GITHUB_RAW}${skinObj.file}'); background-size: cover; border-radius:4px;"></div><div class="inventory-item-name">${skinObj.name}</div>`;
    el.addEventListener('click', async () => {
      await update(ref(db, 'users/' + currentUid), { activeSkin: skinId });
      showStatus('✅ Skin changed!');
    });
    invSkins.appendChild(el);
  });
}

function openCaseModal(type, count) {
  selectedCaseTypeToOpen = type;
  const titleText = type === 'legendary' ? 'Open Legendary Case' : 'Open Case';
  document.getElementById('case-modal-title').innerText = titleText;
  document.getElementById('case-modal-count').innerText = `Available: ${count}`;
  document.getElementById('modal-case-qty').classList.add('show');
}

window.openCasesBatch = async function(qty) {
  document.getElementById('modal-case-qty').classList.remove('show');
  if (!currentUid || !selectedCaseTypeToOpen) return;

  const isLegendary = selectedCaseTypeToOpen === 'legendary';
  const currentCount = isLegendary ? (state.legendaryCases || 0) : (state.cases[selectedCaseTypeToOpen] || 0);
  let openNum = qty === 'all' ? currentCount : parseInt(qty);
  if (openNum > currentCount) openNum = currentCount;
  if (openNum <= 0) return;

  caseOpenOverlay.classList.add('show');
  caseOpeningBox.style.display = 'block';
  caseOpeningBox.innerText = isLegendary ? '🌟' : '📦';
  caseRewardText.innerText = '';
  btnCloseCase.style.display = 'none';

  setTimeout(async () => {
    caseOpeningBox.style.display = 'none';
    let summaryRewards = [];
    const multiplier = isLegendary ? 10 : 1;

    await runTransaction(ref(db, 'users/' + currentUid), (data) => {
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

      for (let i = 0; i < openNum; i++) {
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
          const randomTitle = CASE_TITLES[Math.floor(Math.random() * CASE_TITLES.length)];
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

    caseRewardText.innerText = summaryRewards.join('\n');
    btnCloseCase.style.display = 'block';
    try { tg?.HapticFeedback?.notificationOccurred('success'); } catch(e) {}
  }, 1500);
};

btnCloseCase.addEventListener('click', () => {
  caseOpenOverlay.classList.remove('show');
});

let cryptoState = {};
async function initCryptoSystem() {
  for (const symbol of COINS) {
    const cRef = ref(db, 'crypto/' + symbol);
    const snap = await get(cRef);
    if (!snap.exists()) {
      const price = INITIAL_PRICES[symbol];
      await set(cRef, { price: price, history: [{ t: Date.now(), p: price }] });
    }
  }

  onValue(ref(db, 'crypto'), (snap) => {
    const data = snap.val();
    if (!data) return;
    cryptoState = data;
    renderCryptoList();
  });

  if (cryptoInterval) clearInterval(cryptoInterval);
  cryptoInterval = setInterval(async () => {
    for (const symbol of COINS) {
      updateCryptoPrice(symbol);
    }
  }, 10000);
}

async function updateCryptoPrice(symbol) {
  const cRef = ref(db, 'crypto/' + symbol);
  try {
    await runTransaction(cRef, (data) => {
      if (!data) return data;
      const currentPrice = data.price || INITIAL_PRICES[symbol];
      const isGrowth = Math.random() < 0.4;
      const percent = (Math.random() * 0.03) + 0.005;
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
    const firstPrice = history[0]?.p || price;
    const isUp = price >= firstPrice;
    const holding = state.holdings?.[symbol] || 0;
    const qty = getQty(symbol);

    const card = document.createElement('div');
    card.className = 'crypto-card';
    card.innerHTML = `
      <div class="crypto-header">
        <div class="crypto-symbol">${symbol}</div>
        <div class="crypto-price ${isUp ? 'up' : 'down'}">${formatPrice(price)} 🪙</div>
      </div>
      <canvas class="crypto-chart" id="chart-${symbol}" width="300" height="60"></canvas>
      <div class="crypto-actions">
        <input type="number" min="1" value="${qty}" class="crypto-input" id="qty-${symbol}" data-symbol="${symbol}">
        <button class="crypto-btn buy" data-symbol="${symbol}" data-action="buy">${translations[currentLang].buy || 'Buy'}</button>
        <button class="crypto-btn sell" data-symbol="${symbol}" data-action="sell">${translations[currentLang].sell || 'Sell'}</button>
      </div>
      <div class="crypto-holdings">You have: <span>${holding}</span> ${symbol}</div>
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
      const qty = parseInt(document.getElementById('qty-' + symbol).value) || 1;
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
  if (!currentUid) return;
  const info = cryptoState[symbol];
  if (!info) return;

  const price = info.price;
  const total = price * qty;

  await runTransaction(ref(db, 'users/' + currentUid), (data) => {
    if (!data) return data;
    if (!data.holdings) data.holdings = {};

    if (action === 'buy') {
      if ((data.coins || 0) < total) return;
      data.coins -= total;
      data.holdings[symbol] = (data.holdings[symbol] || 0) + qty;
    } else {
      const owned = data.holdings[symbol] || 0;
      if (owned < qty) return;
      data.coins = (data.coins || 0) + total;
      data.holdings[symbol] = owned - qty;
    }
    return data;
  });
  showStatus('✅ Trade successful!');
}

function initRoulette() {
  if (!rouletteStrip) return;
  rouletteStrip.innerHTML = '';
  const items = ['🪙', '⭐', '📦', '🐹', '🪙', '⭐', '🪙', '🐹'];
  for (let i = 0; i < 40; i++) {
    const div = document.createElement('div');
    div.className = 'roulette-item';
    div.innerText = items[i % items.length];
    rouletteStrip.appendChild(div);
  }
}

btnSpinRoulette.addEventListener('click', async () => {
  if (!AdController) { showStatus('❌ Ad not available'); return; }
  try {
    const result = await AdController.show();
    if (result && result.done) {
      const randomOffset = Math.floor(Math.random() * 15) * 60 + 900;
      rouletteStrip.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.2, 1)';
      rouletteStrip.style.transform = `translateX(-${randomOffset}px)`;

      setTimeout(async () => {
        rouletteStrip.style.transition = 'none';
        rouletteStrip.style.transform = 'translateX(0)';

        const rewards = [
          { type: 'coins', val: 1000, text: '+1,000 Coins' },
          { type: 'xp', val: 500, text: '+500 XP' },
          { type: 'homs', val: 10, text: '+10 Homs' },
          { type: 'case', val: 1, text: '+1 Basic Case' },
          { type: 'leg_case', val: 1, text: '+1 Legendary Case' }
        ];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];

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

        showStatus(`🎁 Reward: ${reward.text}`);
        try { tg?.HapticFeedback?.notificationOccurred('success'); } catch(e) {}
      }, 3100);
    }
  } catch(e) { showStatus('❌ Ad not completed'); }
});
