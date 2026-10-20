import './style.css';
import * as THREE from 'three';
import {
  ensureAudio,
  applyAudioSettings,
  getAudioSettings,
  playSuccessTone,
  playMissTone,
  playWrongTone,
  playLevelWinTone,
  playStreetVendorCall,
  resumeAudio,
  stopAllAudio,
} from './audio.js';

const STORAGE_KEY = 'chaat-chawk-save';
const CUSTOMER_PATIENCE_SECONDS = 20;
const ANGRY_LEAVE_SECONDS = 3;
const SERVED_BOARD_DISPLAY_MS = 3500;
const baseSave = {
  coins: 0,
  score: 0,
  highScore: 0,
  unlockedLevels: 1,
  currentLevel: 1,
  recipeBookUnlocked: ['pani-puri', 'bhel-puri', 'papdi-chaat'],
};

const levels = [
  {
    id: 1,
    name: 'First Pani Puri',
    timeLimit: 30,
    targetOrders: 2,
    reward: 200,
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Learn the chaat recipes and serve a mixed first rush.'
  },
  {
    id: 2,
    name: 'Chaat Rush',
    timeLimit: 45,
    targetOrders: 4,
    reward: 400,
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Handle a quick rush of snacks.'
  },
  {
    id: 3,
    name: 'Spicy Street Challenge',
    timeLimit: 60,
    targetOrders: 5,
    reward: 600,
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Extra-spicy orders demand precision.'
  },
  {
    id: 4,
    name: 'Festival Crowd',
    timeLimit: 75,
    targetOrders: 7,
    reward: 800,
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Serve a mix of dishes before time runs out.'
  },
  {
    id: 5,
    name: 'Ultimate Chaat Master',
    timeLimit: 90,
    targetOrders: 10,
    reward: 1000,
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Finish the final challenge with accuracy.'
  },
  {
    id: 6,
    name: 'Double Rush',
    timeLimit: 105,
    targetOrders: 12,
    reward: 1200,
    patience: 68,
    bonusSteps: 1,
    maxCustomers: 3,
    spawnChance: 0.04,
    challenge: 'Signature garnish on every dish',
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Every order needs its extra signature garnish.'
  },
  {
    id: 7,
    name: 'Festival Chef’s Trial',
    timeLimit: 120,
    targetOrders: 14,
    reward: 1400,
    patience: 58,
    bonusSteps: 2,
    maxCustomers: 4,
    spawnChance: 0.06,
    challenge: 'Two finishing touches • four customers at once',
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'Two special finishing touches and a packed queue.'
  },
  {
    id: 8,
    name: 'Grand Night Bazaar',
    timeLimit: 135,
    targetOrders: 16,
    reward: 1600,
    patience: 50,
    bonusSteps: 3,
    maxCustomers: 4,
    spawnChance: 0.08,
    challenge: 'Three finishing touches • shortest patience',
    recipes: ['pani-puri', 'bhel-puri', 'masala-puri', 'papdi-chaat'],
    intro: 'The toughest shift: three extra toppings on every plate.'
  },
];

const recipeCatalog = {
  'pani-puri': {
    name: 'Pani Puri',
    icon: '🥣',
    art: 'pani',
    tag: 'crispy • spicy • tangy',
    description: 'Crisp puris filled with potato, chickpeas and bright mint pani.',
    steps: [
      { key: 'puri', label: 'Add 3 crispy puris to the plate' },
      { key: 'crack', label: 'Crack open the puris' },
      { key: 'potato', label: 'Add potato filling' },
      { key: 'chickpeas', label: 'Add chickpeas' },
      { key: 'pani', label: 'Pour the customer’s requested pani' },
      { key: 'sev', label: 'Sprinkle golden sev' },
      { key: 'coriander', label: 'Finish with fresh coriander' },
    ],
    ingredients: ['puri', 'crack', 'potato', 'chickpeas', 'mint-pani', 'tamarind', 'sev', 'coriander', 'onion'],
  },
  'bhel-puri': {
    name: 'Bhel Puri',
    icon: '🥗',
    art: 'bhel',
    tag: 'crunchy • sweet • spicy',
    description: 'A lively mix of puffed rice, tomato, onion and chutney, topped with sev.',
    steps: [
      { key: 'puffed-rice', label: 'Add puffed rice' },
      { key: 'onion', label: 'Add chopped onion' },
      { key: 'tomato', label: 'Add juicy tomato' },
      { key: 'coriander', label: 'Add fresh coriander' },
      { key: 'tamarind', label: 'Pour tamarind chutney' },
      { key: 'mix', label: 'Mix everything in the bowl' },
      { key: 'sev', label: 'Sprinkle sev' },
    ],
    ingredients: ['puffed-rice', 'onion', 'tomato', 'coriander', 'tamarind', 'mix', 'sev', 'mint-chutney', 'potato'],
  },
  'masala-puri': {
    name: 'Masala Puri',
    icon: '🌶️',
    art: 'masala',
    tag: 'warm • hearty • fiery',
    description: 'Crisp puri layered with spiced potato, tangy sauce and fresh crunch.',
    steps: [
      { key: 'puri', label: 'Add 3 crisp puris to the plate' },
      { key: 'potato', label: 'Spoon on masala potato' },
      { key: 'chickpeas', label: 'Add chickpeas' },
      { key: 'masala', label: 'Pour warm masala gravy' },
      { key: 'tamarind', label: 'Drizzle tamarind chutney' },
      { key: 'onion', label: 'Add chopped onion' },
      { key: 'sev', label: 'Finish with sev' },
    ],
    ingredients: ['puri', 'potato', 'chickpeas', 'masala', 'tamarind', 'onion', 'sev', 'coriander', 'yogurt', 'tomato'],
  },
  'papdi-chaat': {
    name: 'Papdi Chaat',
    icon: '🍽️',
    art: 'papdi',
    tag: 'yogurt • chutneys • crunchy',
    description: 'Crisp papdi topped with potato, cool curd and sweet-tangy chutneys.',
    steps: [
      { key: 'papdi', label: 'Arrange crisp papdi on the plate' },
      { key: 'potato', label: 'Add spiced potato' },
      { key: 'yogurt', label: 'Pour yogurt' },
      { key: 'mint-chutney', label: 'Drizzle mint chutney' },
      { key: 'tamarind', label: 'Drizzle tamarind chutney' },
      { key: 'sev', label: 'Sprinkle sev' },
      { key: 'coriander', label: 'Add coriander' },
    ],
    ingredients: ['papdi', 'potato', 'yogurt', 'mint-chutney', 'tamarind', 'sev', 'coriander', 'onion', 'chickpeas'],
  },
};

const ingredientButtons = [
  { id: 'puri', label: 'Puri', emoji: '🥟' },
  { id: 'crack', label: 'Crack Puri', emoji: '✋' },
  { id: 'potato', label: 'Potato', emoji: '🥔' },
  { id: 'chickpeas', label: 'Chickpeas', emoji: '🫘' },
  { id: 'mint-pani', label: 'Mint Pani', emoji: '🥤' },
  { id: 'sev', label: 'Sev', emoji: '✨' },
  { id: 'chutney', label: 'Chutney', emoji: '🫙' },
  { id: 'puffed-rice', label: 'Puffed Rice', emoji: '🌾' },
  { id: 'onion', label: 'Onion', emoji: '🧅' },
  { id: 'tomato', label: 'Tomato', emoji: '🍅' },
  { id: 'coriander', label: 'Coriander', emoji: '🌿' },
  { id: 'papdi', label: 'Papdi', emoji: '🥯' },
  { id: 'yogurt', label: 'Yogurt', emoji: '🥣' },
  { id: 'mint-chutney', label: 'Mint Chutney', emoji: '🟢' },
  { id: 'tamarind', label: 'Tamarind', emoji: '🟤' },
  { id: 'masala', label: 'Masala Gravy', emoji: '🍛' },
  { id: 'mix', label: 'Mix Bowl', emoji: '🥣' },
  { id: 'serve', label: 'Serve Order', emoji: '🍽️' },
];

const advancedRecipeSteps = {
  'pani-puri': [
    { key: 'onion', label: 'Add the customer’s chopped onion garnish' },
    { key: 'coriander', label: 'Finish with an extra coriander sprinkle' },
    { key: 'chickpeas', label: 'Add the final chickpea topping' },
  ],
  'bhel-puri': [
    { key: 'mint-chutney', label: 'Drizzle the signature mint chutney' },
    { key: 'potato', label: 'Add the customer’s extra potato topping' },
    { key: 'onion', label: 'Finish with extra chopped onion' },
  ],
  'masala-puri': [
    { key: 'coriander', label: 'Add a fresh coriander finish' },
    { key: 'yogurt', label: 'Add a cooling yogurt swirl' },
    { key: 'tomato', label: 'Finish with extra diced tomato' },
  ],
  'papdi-chaat': [
    { key: 'onion', label: 'Add the customer’s chopped onion garnish' },
    { key: 'chickpeas', label: 'Add an extra chickpea topping' },
    { key: 'coriander', label: 'Finish with another coriander sprinkle' },
  ],
};

const state = {
  save: loadSave(),
  currentScreen: 'menu',
  levelIndex: 0,
  selectedRecipe: 'pani-puri',
  selectedStepIndex: 0,
  repeatedStepCount: 0,
  levelActive: false,
  lastLevelWon: false,
  levelTimeRemaining: 0,
  score: 0,
  coins: 0,
  combo: 0,
  totalOrders: 0,
  completedOrders: 0,
  missedOrders: 0,
  correctOrders: 0,
  accuracy: 100,
  levelStartTime: 0,
  levelTimerId: null,
  customers: [],
  activeOrderId: null,
  currentRecipe: null,
  currentDish: null,
  eventTimer: 0,
  gamePaused: false,
  lastTimestamp: 0,
  audioReady: false,
  menuButtons: [],
  orderQueue: [],
};
state.coins = state.save.coins;

const app = document.querySelector('#app');
let platedFoodGroup = null;
let cookingScene = null;
let vendorArmRig = null;
let vendorReachAnimation = null;
let syncSceneCustomers = () => {};
let animateCustomerCoinReward = () => {};
const sceneCustomerPickTargets = [];
let platedPuris = [];
const popInFood = [];
const tableIngredientTargets = [];
const tablePickupAnimations = [];
let marketCallTimerId = null;
let marketCallIndex = 0;
const marketCallRecipes = ['pani-puri', 'bhel-puri', 'masala-puri'];

function createCutoutTexture(image, imageDescription) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    console.error(`Unable to prepare ${imageDescription}.`);
    return null;
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const queue = new Int32Array(width * height);
  let queueStart = 0;
  let queueEnd = 0;
  const addBackgroundPixel = (pixelIndex) => {
    const colorIndex = pixelIndex * 4;
    const red = data[colorIndex];
    const green = data[colorIndex + 1];
    const blue = data[colorIndex + 2];
    const isBackground = Math.min(red, green, blue) > 222
      && Math.max(red, green, blue) - Math.min(red, green, blue) < 28;
    if (data[colorIndex + 3] === 0 || !isBackground) return;
    data[colorIndex + 3] = 0;
    queue[queueEnd] = pixelIndex;
    queueEnd += 1;
  };

  for (let x = 0; x < width; x += 1) {
    addBackgroundPixel(x);
    addBackgroundPixel((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    addBackgroundPixel(y * width);
    addBackgroundPixel(y * width + width - 1);
  }
  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart];
    queueStart += 1;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    if (x > 0) addBackgroundPixel(pixelIndex - 1);
    if (x < width - 1) addBackgroundPixel(pixelIndex + 1);
    if (y > 0) addBackgroundPixel(pixelIndex - width);
    if (y < height - 1) addBackgroundPixel(pixelIndex + width);
  }

  context.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

function playMarketVendorCall(recipeId = state.currentRecipe) {
  const callRecipe = marketCallRecipes.includes(recipeId)
    ? recipeId
    : marketCallRecipes[marketCallIndex % marketCallRecipes.length];
  playStreetVendorCall(callRecipe);
  marketCallIndex = (marketCallIndex + 1) % marketCallRecipes.length;
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...baseSave };
    const parsed = JSON.parse(raw);
    return { ...baseSave, ...parsed, recipeBookUnlocked: Array.isArray(parsed.recipeBookUnlocked) ? parsed.recipeBookUnlocked : baseSave.recipeBookUnlocked };
  } catch {
    return { ...baseSave };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
}

function updateSaveFromRuntime() {
  state.save.coins = state.coins;
  state.save.score = state.score;
  state.save.highScore = Math.max(state.save.highScore, state.score);
  state.save.currentLevel = Math.max(state.save.currentLevel, state.levelIndex + 1);
  saveProgress();
}

function clearPlatedFood() {
  if (platedFoodGroup) {
    while (platedFoodGroup.children.length) {
      const piece = platedFoodGroup.children[platedFoodGroup.children.length - 1];
      platedFoodGroup.remove(piece);
      piece.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
    }
  }
  platedPuris = [];
  popInFood.length = 0;
}

function addFoodPiece(geometry, material, x, y, z, scale = [1, 1, 1]) {
  if (!platedFoodGroup) return null;
  const piece = new THREE.Mesh(geometry, material);
  piece.position.set(x, y, z);
  piece.scale.set(0.08, 0.08, 0.08);
  piece.userData.targetScale = scale;
  piece.userData.popStart = performance.now();
  piece.castShadow = true;
  platedFoodGroup.add(piece);
  popInFood.push(piece);
  return piece;
}

function addIngredientToScene(ingredientId) {
  if (!platedFoodGroup) return;
  const positionIndex = state.currentDish?.steps.filter((step) => ['puri', 'papdi'].includes(step)).length || 0;
  const x = [-0.48, 0, 0.48, -0.28, 0.28][positionIndex % 5];
  const z = [0.02, -0.22, 0.03, 0.23, 0.24][positionIndex % 5];
  const solid = (color, roughness = 0.86) => new THREE.MeshStandardMaterial({ color, roughness });
  const smallSphere = (color, px, pz, radius = 0.13) => {
    addFoodPiece(new THREE.SphereGeometry(radius, 16, 12), solid(color), px, 0.13, pz, [1, 0.76, 1]);
  };
  const addPaniPuriTopping = (color, count, radius, scale = [1, 0.82, 1]) => {
    const shells = [[-0.6, 0.02], [0, -0.32], [0.6, 0.03]];
    for (let i = 0; i < count; i += 1) {
      const [shellX, shellZ] = shells[i % shells.length];
      const angle = i * 2.4;
      const spread = radius * (0.5 + (i % 3) * 0.45);
      addFoodPiece(
        new THREE.SphereGeometry(radius, 12, 8),
        solid(color),
        shellX + Math.cos(angle) * spread,
        0.493 + radius,
        shellZ + Math.sin(angle) * spread,
        scale
      );
    }
  };

  if (ingredientId === 'puri') {
    const shellPositions = [[-0.6, 0.02], [0, -0.32], [0.6, 0.03]];
    shellPositions.forEach(([shellX, shellZ]) => {
      const shell = addFoodPiece(
        new THREE.SphereGeometry(0.38, 22, 16),
        solid('#d89a42'),
        shellX,
        0.2,
        shellZ,
        [1, 0.76, 0.94]
      );
      if (shell) platedPuris.push(shell);
    });
  } else if (ingredientId === 'crack') {
    platedPuris.forEach((puri) => {
      const opening = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 14, 10),
        solid('#5a2c18', 0.98)
      );
      opening.scale.set(0.08, 0.08, 0.08);
      opening.userData.targetScale = [1, 0.12, 0.85];
      opening.userData.popStart = performance.now();
      opening.position.set(puri.position.x, 0.5, puri.position.z - 0.03);
      platedFoodGroup.add(opening);
      popInFood.push(opening);
    });
  } else if (state.currentRecipe === 'pani-puri' && ingredientId === 'potato') {
    addPaniPuriTopping('#f4c447', 9, 0.13);
  } else if (state.currentRecipe === 'pani-puri' && ingredientId === 'chickpeas') {
    addPaniPuriTopping('#8f4b26', 9, 0.1);
  } else if (state.currentRecipe === 'pani-puri' && ['coriander', 'onion', 'tomato', 'sev'].includes(ingredientId)) {
    const colors = { coriander: '#438b4e', onion: '#a14b72', tomato: '#cc4933', sev: '#e8a833' };
    const isCoriander = ingredientId === 'coriander';
    addPaniPuriTopping(
      colors[ingredientId],
      ingredientId === 'sev' ? 18 : 15,
      ingredientId === 'sev' ? 0.055 : isCoriander ? 0.09 : 0.08,
      isCoriander ? [1.7, 0.3, 0.85] : [1, 0.82, 1]
    );
  } else if (ingredientId === 'potato' || ingredientId === 'masala') {
    for (let i = 0; i < 5; i += 1) smallSphere(ingredientId === 'masala' ? '#a84726' : '#e9b446', x + (Math.random() - 0.5) * 0.45, z + (Math.random() - 0.5) * 0.34, 0.12);
  } else if (ingredientId === 'chickpeas') {
    for (let i = 0; i < 9; i += 1) smallSphere('#c98235', (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 0.78, 0.09);
  } else if (['mint-pani', 'mint-chutney', 'tamarind', 'yogurt'].includes(ingredientId)) {
    const colors = { 'mint-pani': '#62bd87', 'mint-chutney': '#438b4e', tamarind: '#9c4b2e', yogurt: '#fff5df' };
    addFoodPiece(
      new THREE.CylinderGeometry(0.8, 0.8, 0.06, 36),
      new THREE.MeshStandardMaterial({ color: colors[ingredientId], roughness: 0.48, transparent: true, opacity: 0.78 }),
      0,
      0.055,
      0,
      [1, 1, 1]
    );
  } else if (ingredientId === 'sev') {
    for (let i = 0; i < 16; i += 1) {
      const strand = addFoodPiece(new THREE.CylinderGeometry(0.022, 0.03, 0.32, 6), solid('#e8a833'), (Math.random() - 0.5) * 1.2, 0.23, (Math.random() - 0.5) * 0.9, [1, 1, 1]);
      if (strand) strand.rotation.z = Math.random() * 1.5;
    }
  } else if (ingredientId === 'coriander' || ingredientId === 'onion' || ingredientId === 'tomato' || ingredientId === 'puffed-rice') {
    const colors = { coriander: '#438b4e', onion: '#a14b72', tomato: '#cc4933', 'puffed-rice': '#f5e3b8' };
    for (let i = 0; i < 12; i += 1) smallSphere(colors[ingredientId], (Math.random() - 0.5) * 1.25, (Math.random() - 0.5) * 0.95, 0.075);
  } else if (ingredientId === 'papdi') {
    const papdi = addFoodPiece(
      new THREE.CylinderGeometry(0.24, 0.24, 0.045, 18),
      solid('#d7a457'),
      x,
      0.09,
      z,
      [1, 1, 1]
    );
    if (papdi) platedPuris.push(papdi);
  } else if (ingredientId === 'mix') {
    platedFoodGroup.rotation.y += Math.PI * 2;
  }
}

function getCurrentLevel() {
  return levels[Math.min(state.levelIndex, levels.length - 1)];
}

function getRecipeSteps(recipeId) {
  const recipe = recipeCatalog[recipeId];
  if (!recipe) return [];
  const bonusSteps = advancedRecipeSteps[recipeId] || [];
  return [...recipe.steps, ...bonusSteps.slice(0, getCurrentLevel().bonusSteps || 0)];
}

function createCustomerOrder(recipeId) {
  const recipe = recipeCatalog[recipeId];
  const isExtraSpicy = Math.random() < 0.25 && state.levelIndex >= 2;
  const isVIP = Math.random() < 0.12;
  const patience = CUSTOMER_PATIENCE_SECONDS;
  const bonusCount = Math.min(getCurrentLevel().bonusSteps || 0, advancedRecipeSteps[recipeId]?.length || 0);
  return {
    id: crypto.randomUUID(),
    recipeId: recipeId,
    recipe: recipe.name,
    patienceTotal: patience,
    patienceLeft: patience,
    extraSpicy: isExtraSpicy,
    extraTasks: (advancedRecipeSteps[recipeId] || []).slice(0, bonusCount).map((step) => step.label),
    liquidId: Math.random() < 0.5 ? 'mint-pani' : 'tamarind',
    vip: isVIP,
    tip: isVIP ? 20 : 8,
    mood: 'happy',
    angerTimeLeft: 0,
    served: false,
    missed: false,
    plate: null,
  };
}

function renderMenuButtons() {
  const playButton = document.querySelector('[data-action="play"]');
  const continueButton = document.querySelector('[data-action="continue"]');

  if (state.save.currentLevel > 1) {
    continueButton.hidden = false;
    continueButton.textContent = `Continue Level ${state.save.currentLevel}`;
  } else {
    continueButton.hidden = true;
  }

  if (playButton) {
    playButton.textContent = state.save.currentLevel > 1 ? 'Start Fresh' : 'Play';
  }
}

function createAppShell() {
  app.innerHTML = `
    <div class="game-shell">
      <div id="scene-container"></div>
      <div class="ui-layer">
        <header class="top-bar">
          <div class="brand-box">
            <div class="brand-mark">🌶️</div>
            <div>
              <div class="brand-title">CHAAT CHAWK</div>
              <div class="brand-subtitle">Spicy • Tangy • Crunchy • Yummy!</div>
            </div>
          </div>
          <div class="hud-pill-group">
            <div class="hud-pill"><span>Score</span><strong id="score-value">0</strong></div>
            <div class="hud-pill"><span>Coins</span><strong id="coin-value">0</strong></div>
            <div class="hud-pill"><span>Combo</span><strong id="combo-value">x1</strong></div>
          </div>
        </header>

        <aside class="sidebar left-panel" id="inventory-panel">
          <div class="panel-title">Your chaat plate</div>
          <div class="cooking-task">
            <span class="cooking-task-label">UP NEXT</span>
            <strong id="current-step">Choose a recipe to begin</strong>
            <span id="recipe-progress">0 / 0 steps</span>
          </div>
          <div id="ingredient-grid" class="ingredient-grid hidden" aria-hidden="true"></div>
        </aside>

        <aside class="sidebar right-panel hidden" id="customer-panel" aria-hidden="true">
          <div id="customer-list"></div>
        </aside>

        <section class="center-panel" id="main-menu-screen">
          <div class="menu-card welcome-card">
            <div class="logo-block">
              <div class="logo-badge">🌶️</div>
              <h1>CHAAT CHAWK</h1>
              <p>Spicy • Tangy • Crunchy • Yummy!</p>
            </div>
            <div class="menu-actions">
              <button data-action="play" class="primary">Play</button>
              <button data-action="continue" class="secondary">Continue</button>
              <button data-action="recipe-book" class="secondary">Recipe Book</button>
              <button data-action="levels" class="secondary">Level Selection</button>
              <button data-action="settings" class="secondary">Settings</button>
            </div>
          </div>
        </section>

        <section class="center-panel hidden" id="level-screen">
          <div class="menu-card">
            <div class="screen-header">
              <h2>Level Selection</h2>
            </div>
            <div id="level-list" class="level-list"></div>
          </div>
        </section>

        <section class="center-panel hidden" id="recipe-screen">
          <div class="menu-card recipe-card recipe-select-card">
            <div class="recipe-select-heading">
              <span class="eyebrow">WELCOME TO THE CHOWK</span>
              <h2>What are we cooking?</h2>
              <p>Pick a street-food favourite to get your stall sizzling.</p>
            </div>
            <div id="recipe-list" class="recipe-list"></div>
            <div class="recipe-select-footer">
              <span>Every dish is ready to cook</span>
            </div>
          </div>
        </section>

        <section class="center-panel hidden" id="settings-screen">
          <div class="menu-card settings-card">
            <div class="screen-header">
              <h2>Audio Settings</h2>
            </div>
            <div class="settings-grid">
              <label>Master <input data-audio="master" type="range" min="0" max="1" step="0.05" value="0.8" /></label>
              <label>Ambience <input data-audio="ambience" type="range" min="0" max="1" step="0.05" value="0.5" /></label>
              <label>Voice <input data-audio="voice" type="range" min="0" max="1" step="0.05" value="0.75" /></label>
              <label>SFX <input data-audio="sfx" type="range" min="0" max="1" step="0.05" value="0.8" /></label>
              <label>Music <input data-audio="music" type="range" min="0" max="1" step="0.05" value="0.5" /></label>
              <label class="toggle"><input data-audio="muted" type="checkbox" /> Mute All</label>
            </div>
            <button data-action="close-settings" class="primary">Back</button>
          </div>
        </section>

        <div id="toast" class="toast hidden"></div>

        <div id="hud" class="game-hud hidden">
          <div class="hud-line">
            <div class="level-pill">Level <span id="level-number">1</span></div>
            <div class="timer-pill"><span id="timer-value">90</span>s</div>
            <div class="objective-pill"><span id="objective-value">Serve 2 correct pani puri orders</span></div>
          </div>
          <div class="action-row">
            <button id="change-recipe-button" class="tiny-btn">Recipes</button>
            <button id="pause-button" class="tiny-btn">Pause</button>
            <button id="mute-button" class="tiny-btn">🔊</button>
          </div>
        </div>

        <div id="results-screen" class="results-screen hidden">
          <div class="results-card">
            <h2 id="result-title">Level Results</h2>
            <p id="result-message" class="result-message"></p>
            <div class="result-grid">
              <div><span>Completed</span><strong id="result-complete">0</strong></div>
              <div><span>Missed</span><strong id="result-missed">0</strong></div>
              <div><span>Accuracy</span><strong id="result-accuracy">100%</strong></div>
              <div><span>Time Left</span><strong id="result-time">0s</strong></div>
              <div><span>Score</span><strong id="result-score">0</strong></div>
              <div><span>Coins</span><strong id="result-coins">0</strong></div>
            </div>
            <div class="menu-actions compact">
              <button data-action="restart-level" class="primary">Restart</button>
              <button data-action="next-level" class="secondary">Next Level</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindUiActions();
  renderIngredientGrid();
  renderLevelButtons();
  renderRecipeBook();
  renderMenuButtons();
  syncSettingsControls();
}

function bindUiActions() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      handleAction(action);
    });
  });

  document.querySelector('#pause-button')?.addEventListener('click', () => {
    togglePause();
  });

  document.querySelector('#change-recipe-button')?.addEventListener('click', () => {
    if (state.levelActive) {
      state.gamePaused = true;
      stopAllAudio();
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) pauseButton.textContent = 'Resume';
    }
    renderRecipeBook();
    openScreen('recipe-screen');
  });

  document.querySelector('#mute-button')?.addEventListener('click', () => {
    const settings = getAudioSettings();
    applyAudioSettings({ ...settings, muted: !settings.muted });
    syncSettingsControls();
    document.querySelector('#mute-button').textContent = settings.muted ? '🔊' : '🔇';
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !state.levelActive || state.gamePaused) return;
    state.gamePaused = true;
    stopAllAudio();
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton) pauseButton.textContent = 'Resume';
    toast('Paused while away — tap Resume when ready.');
  });

  document.querySelectorAll('[data-audio]').forEach((control) => {
    const key = control.dataset.audio;
    control.addEventListener('input', () => {
      const settings = getAudioSettings();
      if (key === 'muted') {
        applyAudioSettings({ ...settings, muted: control.checked });
      } else {
        const value = Number(control.value);
        applyAudioSettings({ ...settings, [key]: value });
      }
      syncSettingsControls();
    });
  });
}

function syncSettingsControls() {
  const settings = getAudioSettings();
  document.querySelectorAll('[data-audio]').forEach((control) => {
    const key = control.dataset.audio;
    if (key === 'muted') {
      control.checked = Boolean(settings.muted);
    } else {
      control.value = settings[key];
    }
  });

  const muteButton = document.querySelector('#mute-button');
  if (muteButton) {
    muteButton.textContent = settings.muted ? '🔇' : '🔊';
  }
}

function openScreen(screenId) {
  document.querySelectorAll('.center-panel').forEach((panel) => {
    const isTarget = screenId && panel.id === screenId;
    panel.classList.toggle('hidden', !isTarget);
  });
  if (screenId) {
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
    }
  }
}

function handleAction(action) {
  switch (action) {
    case 'play':
      renderRecipeBook();
      openScreen('recipe-screen');
      break;
    case 'continue':
      renderRecipeBook();
      openScreen('recipe-screen');
      break;
    case 'levels':
      openScreen('level-screen');
      break;
    case 'recipe-book':
      if (state.levelActive) {
        state.gamePaused = true;
        stopAllAudio();
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) pauseButton.textContent = 'Resume';
      }
      renderRecipeBook();
      openScreen('recipe-screen');
      break;
    case 'settings':
      state.screenBeforeSettings = state.levelActive ? null : 'recipe-screen';
      if (state.levelActive) {
        state.gamePaused = true;
        stopAllAudio();
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) pauseButton.textContent = 'Resume';
      }
      openScreen('settings-screen');
      break;
    case 'close-settings':
      if (state.levelActive && !state.screenBeforeSettings) {
        state.gamePaused = false;
        resumeAudio();
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) pauseButton.textContent = 'Pause';
      }
      openScreen(state.screenBeforeSettings || 'main-menu-screen');
      break;
    case 'restart-level':
      beginLevel(state.levelIndex + 1);
      break;
    case 'next-level':
      if (state.levelActive) {
        beginLevel(Math.min(state.levelIndex + 2, levels.length));
      } else if (state.lastLevelWon) {
        beginLevel(Math.min(state.levelIndex + 2, levels.length));
      } else {
        state.gamePaused = false;
        document.getElementById('results-screen').classList.add('hidden');
        openScreen('recipe-screen');
      }
      break;
    default:
      break;
  }
}

function renderLevelButtons() {
  const container = document.getElementById('level-list');
  if (!container) return;

  container.innerHTML = levels.map((level, index) => {
    const locked = level.id !== state.save.currentLevel;
    return `
      <button class="level-card ${locked ? 'locked' : ''}" data-level="${level.id}" ${locked ? 'disabled' : ''}>
        <span class="level-name">${level.name}</span>
        <span class="level-meta">${level.targetOrders} orders • ${level.timeLimit}s</span>
        ${level.challenge ? `<span class="level-challenge">${level.challenge}</span>` : ''}
      </button>
    `;
  }).join('');

  container.querySelectorAll('[data-level]').forEach((button) => {
    button.addEventListener('click', () => {
      const levelId = Number(button.dataset.level);
      if (levelId !== state.save.currentLevel) return;
      beginLevel(levelId);
    });
  });
}

function renderRecipeBook() {
  const container = document.getElementById('recipe-list');
  if (!container) return;

  container.innerHTML = Object.entries(recipeCatalog).map(([id, recipe]) => {
    return `
      <article class="recipe-item recipe-choice ${state.selectedRecipe === id ? 'selected' : ''}" data-recipe-card="${id}">
        <div class="dish-art dish-art-${recipe.art}" aria-hidden="true">
          <span class="dish-emoji">${recipe.icon}</span>
          <i class="food-piece food-piece-one"></i>
          <i class="food-piece food-piece-two"></i>
          <i class="food-piece food-piece-three"></i>
          <i class="food-herb"></i>
        </div>
        <div class="recipe-copy">
          <div class="recipe-name-row"><h3>${recipe.name}</h3><span class="recipe-stamp">${recipe.icon}</span></div>
          <p>${recipe.description}</p>
          <span class="recipe-tag">${recipe.tag}</span>
          <button class="cook-now" type="button" data-recipe="${id}">COOK NOW <span aria-hidden="true">→</span></button>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('[data-recipe]').forEach((button) => {
    button.addEventListener('click', () => chooseRecipe(button.dataset.recipe));
  });
}

function renderIngredientGrid() {
  const container = document.getElementById('ingredient-grid');
  container?.replaceChildren();
  updateCookingProgress();
}

function toast(message) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  clearTimeout(toastEl._timeoutId);
  toastEl._timeoutId = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 1400);
}

function beginLevel(levelId, recipeId = state.selectedRecipe) {
  const levelNumber = Math.max(1, Math.min(levelId, levels.length));
  state.selectedRecipe = recipeCatalog[recipeId] ? recipeId : 'pani-puri';
  state.levelIndex = levelNumber - 1;
  const level = getCurrentLevel();
  state.levelActive = true;
  state.lastLevelWon = false;
  state.gamePaused = false;
  state.levelTimeRemaining = level.timeLimit;
  state.score = 0;
  state.completedOrders = 0;
  state.missedOrders = 0;
  state.correctOrders = 0;
  state.totalOrders = 0;
  state.combo = 0;
  state.currentDish = { recipeId: state.selectedRecipe, customerId: null, steps: [], completedStepIndexes: [] };
  state.currentRecipe = state.selectedRecipe;
  state.selectedStepIndex = 0;
  state.repeatedStepCount = 0;
  clearPlatedFood();
  state.currentScreen = 'game';
  state.customers = [];
  state.orderQueue = [];
  state.activeOrderId = null;
  updateObjectiveText();
  updateHudValues();
  showGameHud(true);
  openScreen(null);
  document.getElementById('results-screen').classList.add('hidden');
  renderCustomers();
  createCustomerOrderForQueue(state.selectedRecipe);
  state.currentDish.customerId = state.activeOrderId;
  const alternateRecipe = level.recipes.find((recipe) => recipe !== state.selectedRecipe);
  createCustomerOrderForQueue(alternateRecipe);
  renderIngredientGrid();
  updateCookingProgress();
  ensureAudio();
  resumeAudio();
  playMarketVendorCall(state.selectedRecipe);
  clearInterval(marketCallTimerId);
  marketCallTimerId = setInterval(() => {
    if (!state.levelActive || state.gamePaused) return;
    playMarketVendorCall();
  }, 26000);

  state.save.currentLevel = levelNumber;
  saveProgress();

  state.levelStartTime = Date.now();
  clearInterval(state.levelTimerId);
  state.levelTimerId = setInterval(() => {
    if (state.gamePaused || !state.levelActive) return;
    state.levelTimeRemaining = Math.max(0, state.levelTimeRemaining - 1);
    updateHudValues();

    if (state.levelTimeRemaining <= 0) {
      endLevel(false);
      return;
    }

    const levelRules = getCurrentLevel();
    if (state.customers.length < (levelRules.maxCustomers || 3) && Math.random() < (levelRules.spawnChance || 0.025)) {
      createCustomerOrderForQueue();
    }

    let missedOrder = false;
    state.customers.forEach((customer) => {
      if (customer.served) return;
      if (customer.missed) {
        customer.angerTimeLeft = Math.max(0, customer.angerTimeLeft - 1);
        if (customer.angerTimeLeft === 0) missedOrder = true;
        return;
      }
      customer.patienceLeft = Math.max(0, customer.patienceLeft - 1);
      if (customer.patienceLeft === 0 && !customer.served) {
        customer.missed = true;
        customer.angerTimeLeft = ANGRY_LEAVE_SECONDS;
        missedOrder = true;
        state.missedOrders += 1;
        state.combo = 0;
        state.score = Math.max(0, state.score - 25);
        toast('A customer got angry and is leaving!');
        playMissTone();
        customer.mood = 'angry';
      }
    });
    if (missedOrder) {
      const activeOrderExpired = state.customers.some((customer) => customer.id === state.activeOrderId && customer.missed);
      state.customers = state.customers.filter((customer) => !customer.missed || customer.angerTimeLeft > 0);
      if (state.activeOrderId && !state.customers.some((customer) => customer.id === state.activeOrderId && !customer.missed)) {
        state.activeOrderId = null;
      }
      if (state.levelActive && !state.customers.some((customer) => !customer.missed && !customer.served)) {
        createCustomerOrderForQueue(state.selectedRecipe);
      }
      if (!state.activeOrderId) {
        const nextOrder = state.customers.find((customer) => !customer.served && !customer.missed);
        if (nextOrder) {
          state.activeOrderId = nextOrder.id;
          state.currentRecipe = nextOrder.recipeId;
          state.selectedRecipe = nextOrder.recipeId;
          state.currentDish = { recipeId: nextOrder.recipeId, customerId: nextOrder.id, steps: [], completedStepIndexes: [] };
          state.selectedStepIndex = 0;
        }
      }
      const activeOrder = state.customers.find((customer) => (
        customer.id === state.activeOrderId && !customer.missed && !customer.served
      ));
      if (activeOrder && (activeOrderExpired || state.currentDish?.customerId !== activeOrder.id)) {
        state.currentRecipe = activeOrder.recipeId;
        state.selectedRecipe = activeOrder.recipeId;
        state.currentDish = { recipeId: activeOrder.recipeId, customerId: activeOrder.id, steps: [], completedStepIndexes: [] };
        state.selectedStepIndex = 0;
        clearPlatedFood();
      }
      renderCustomers();
      renderIngredientGrid();
      updateCookingProgress();
      updateHudValues();
    } else {
      renderCustomers();
    }
  }, 1000);
}

function createCustomerOrderForQueue(preferredRecipe) {
  const recipes = getCurrentLevel().recipes;
  const available = recipes.length ? recipes : ['pani-puri'];
  const recipeId = preferredRecipe || available[Math.floor(Math.random() * available.length)];
  if (!recipeCatalog[recipeId]) return null;
  const order = createCustomerOrder(recipeId);
  state.customers.push(order);
  state.totalOrders += 1;
  if (!state.activeOrderId) state.activeOrderId = order.id;
  renderCustomers();
  return order;
}

function renderCustomers() {
  const container = document.getElementById('customer-list');
  if (container) container.replaceChildren();
  syncSceneCustomers(state.customers);
}

function updateHudValues() {
  const level = getCurrentLevel();
  const timerEl = document.getElementById('timer-value');
  const scoreEl = document.getElementById('score-value');
  const coinEl = document.getElementById('coin-value');
  const comboEl = document.getElementById('combo-value');
  const levelEl = document.getElementById('level-number');
  if (timerEl) timerEl.textContent = `${state.levelTimeRemaining}`;
  if (scoreEl) scoreEl.textContent = `${state.score}`;
  if (coinEl) coinEl.textContent = `${state.coins}`;
  if (comboEl) comboEl.textContent = `x${state.combo || 1}`;
  if (levelEl) levelEl.textContent = `${level.id}`;
  updateObjectiveText();
}

function updateObjectiveText() {
  const objective = document.getElementById('objective-value');
  const level = getCurrentLevel();
  if (!objective) return;

  if (state.levelActive) {
    objective.textContent = `Serve ${level.targetOrders} orders • ${Math.max(0, level.targetOrders - state.completedOrders)} left`;
  } else {
    objective.textContent = 'Ready to serve';
  }
}

function showGameHud(show) {
  const hud = document.getElementById('hud');
  if (hud) hud.classList.toggle('hidden', !show);
  ['inventory-panel'].forEach((id) => {
    document.getElementById(id)?.classList.toggle('hidden', !show);
  });
  document.getElementById('customer-panel')?.classList.add('hidden');
  document.querySelector('.hud-pill-group')?.classList.toggle('hidden', !show);
}

function handleIngredientAction(id) {
  if (!state.levelActive) {
    toast('Start a level to cook!');
    return false;
  }

  if (state.gamePaused) {
    toast('Game is paused');
    return false;
  }

  if (!state.currentRecipe || !state.activeOrderId) {
    toast('Choose a waiting customer order first.');
    return false;
  }

  const steps = getRecipeSteps(state.currentRecipe);
  const completedStepIndexes = new Set(state.currentDish?.completedStepIndexes || []);
  const stepIndex = steps.findIndex((step, index) => (
    !completedStepIndexes.has(index) && getExpectedIngredient(step) === id
  ));
  if (stepIndex < 0) {
    playWrongTone();
    const ingredientLabel = ingredientButtons.find((ingredient) => ingredient.id === id)?.label || id;
    const belongsToRecipe = steps.some((step) => getExpectedIngredient(step) === id);
    toast(belongsToRecipe ? `${ingredientLabel} is already added` : `${ingredientLabel} is not needed for this recipe`);
    return false;
  }

  state.currentDish = state.currentDish || {
    recipeId: state.currentRecipe,
    customerId: state.activeOrderId,
    steps: [],
    completedStepIndexes: [],
  };
  state.currentDish.completedStepIndexes ||= [];
  state.currentDish.steps.push(id);
  state.currentDish.completedStepIndexes.push(stepIndex);
  state.selectedStepIndex = state.currentDish.completedStepIndexes.length;
  addIngredientToScene(id);
  toast(`${ingredientButtons.find((ingredient) => ingredient.id === id)?.label || id} added!`);
  playSuccessTone();
  if (state.currentDish.completedStepIndexes.length >= steps.length) {
    serveCurrentDish();
    return true;
  }
  updateCookingProgress();
  renderIngredientGrid();
  return true;
}

function handleTableIngredient(target) {
  const ingredientId = target.ingredientIds[0];
  animateVendorReach(target.position);
  if (handleIngredientAction(ingredientId)) {
    animateTablePickup(ingredientId, target.position);
    return true;
  }
  return false;
}

function animateVendorReach(targetPosition) {
  if (!vendorArmRig) return;
  vendorReachAnimation = {
    start: performance.now(),
    duration: 1450,
    ingredient: targetPosition.clone(),
    plate: new THREE.Vector3(0, 2.2, -0.25),
  };
}

function animateTablePickup(ingredientId, startPosition) {
  const colors = {
    puri: '#d89a42',
    crack: '#5a2c18',
    potato: '#e9b446',
    chickpeas: '#c98235',
    'mint-pani': '#62bd87',
    'mint-chutney': '#438b4e',
    tamarind: '#9c4b2e',
    yogurt: '#fff5df',
    sev: '#e8a833',
    coriander: '#438b4e',
    onion: '#a14b72',
    tomato: '#cc4933',
    'puffed-rice': '#f5e3b8',
    papdi: '#d7a457',
    masala: '#a84726',
  };
  const pickup = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 10),
    new THREE.MeshStandardMaterial({ color: colors[ingredientId] || '#e9b446', roughness: 0.76 })
  );
  pickup.position.copy(startPosition);
  pickup.position.y += 0.16;
  pickup.castShadow = true;
  if (!cookingScene) return;
  cookingScene.add(pickup);
  tablePickupAnimations.push({
    mesh: pickup,
    start: pickup.position.clone(),
    startTime: performance.now(),
    duration: 180,
    target: new THREE.Vector3((Math.random() - 0.5) * 0.6, 2.06, -0.25 + (Math.random() - 0.5) * 0.48),
  });
}

function getExpectedIngredient(step) {
  if (!step) return 'serve';
  if (step.key === 'pani') {
    const order = state.customers.find((customer) => customer.id === state.activeOrderId);
    return order?.liquidId || 'mint-pani';
  }
  return step.key;
}

function updateCookingProgress() {
  const steps = getRecipeSteps(state.currentRecipe);
  const stepEl = document.getElementById('current-step');
  const progressEl = document.getElementById('recipe-progress');
  const completedStepIndexes = new Set(state.currentDish?.completedStepIndexes || []);
  const nextStep = steps.find((step, index) => !completedStepIndexes.has(index));
  const visibleRecipeId = state.currentRecipe || state.selectedRecipe;
  const visibleRecipe = recipeCatalog[visibleRecipeId];
  const remainingIngredients = steps
    .filter((step, index) => !completedStepIndexes.has(index))
    .map((step) => getExpectedIngredient(step));
  const requiredIngredients = new Set(steps.map((step) => getExpectedIngredient(step)));
  const activeTableTargets = tableIngredientTargets
    .filter((target) => requiredIngredients.has(target.ingredientIds[0]))
    .sort((first, second) => {
      const firstId = first.ingredientIds[0];
      const secondId = second.ingredientIds[0];
      const firstOrder = visibleRecipe?.steps.findIndex((step) => step.key === firstId) ?? -1;
      const secondOrder = visibleRecipe?.steps.findIndex((step) => step.key === secondId) ?? -1;
      return (firstOrder < 0 ? Number.MAX_SAFE_INTEGER : firstOrder) - (secondOrder < 0 ? Number.MAX_SAFE_INTEGER : secondOrder);
    });
  const spacing = Math.min(1.18, 10 / Math.max(1, activeTableTargets.length));
  activeTableTargets.forEach((target, index) => {
    const targetX = (index - (activeTableTargets.length - 1) / 2) * spacing;
    const targetZ = 2.35;
    const deltaX = targetX - target.position.x;
    const deltaZ = targetZ - target.position.z;
    target.position.set(targetX, 1.82, targetZ);
    target.mesh.position.set(targetX, 1.83, targetZ);
    target.bowl.position.set(targetX, 1.57, targetZ);
    target.label.position.set(targetX, 2.04, targetZ + 0.46);
    target.food.forEach((piece) => {
      piece.position.x += deltaX;
      piece.position.z += deltaZ;
    });
  });
  tableIngredientTargets.forEach((target) => {
    const isVisible = requiredIngredients.has(target.ingredientIds[0]);
    target.mesh.visible = isVisible;
    target.bowl.visible = isVisible;
    target.label.visible = isVisible;
    target.food.forEach((piece) => {
      piece.visible = isVisible;
    });
  });
  if (stepEl) stepEl.textContent = nextStep ? nextStep.label : 'Dish ready!';
  if (progressEl) progressEl.textContent = `${completedStepIndexes.size} / ${steps.length} steps`;
  tableIngredientTargets.forEach((target) => {
    const ingredientExpected = target.ingredientIds.some((ingredientId) => remainingIngredients.includes(ingredientId));
    target.bowl.material.emissive.set(ingredientExpected ? '#3d2910' : '#000000');
    target.bowl.material.emissiveIntensity = ingredientExpected ? 0.5 : 0;
  });
}

function serveCurrentDish() {
  if (!state.currentRecipe) {
    toast('No active recipe.');
    return;
  }

  const order = state.customers.find((customer) => (
    customer.id === state.currentDish?.customerId
    && customer.id === state.activeOrderId
    && !customer.served
    && !customer.missed
  ));
  if (!order) {
    toast('The selected customer is no longer waiting. Select another order.');
    playWrongTone();
    return;
  }

  if (
    !state.currentDish
    || state.currentDish.recipeId !== state.currentRecipe
    || (state.currentDish.completedStepIndexes?.length || 0) < getRecipeSteps(state.currentRecipe).length
  ) {
    toast('Incomplete recipe cannot be served.');
    playWrongTone();
    return;
  }

  if (order.recipeId !== state.currentRecipe) {
    toast(`Select the ${order.recipe} customer before serving this dish.`);
    playWrongTone();
    return;
  }

  order.served = true;
  state.completedOrders += 1;
  state.correctOrders += 1;
  state.combo += 1;
  state.score += 50 + order.tip + state.combo * 15;
  const coinReward = 25 + (order.vip ? 15 : 0);
  state.coins += coinReward;
  const completedLevel = getCurrentLevel();
  const bonus = order.vip ? 'VIP bonus!' : 'Yummy!';
  toast(`SERVED! ${bonus} +${coinReward} coins`);
  animateCustomerCoinReward(order.id, coinReward);
  playSuccessTone();
  playMarketVendorCall(order.recipeId);

  state.activeOrderId = null;
  state.currentDish = null;
  state.selectedStepIndex = 0;
  clearPlatedFood();
  renderCustomers();
  setTimeout(() => {
    state.customers = state.customers.filter((customer) => customer.id !== order.id);
    renderCustomers();
  }, SERVED_BOARD_DISPLAY_MS);

  if (state.completedOrders >= completedLevel.targetOrders) {
    endLevel(true);
  } else {
    const nextOrder = state.customers.find((customer) => !customer.missed && !customer.served)
      || createCustomerOrderForQueue();
    state.activeOrderId = nextOrder?.id || null;
    state.currentRecipe = nextOrder?.recipeId || state.selectedRecipe;
    state.selectedRecipe = state.currentRecipe;
    state.currentDish = nextOrder
      ? { recipeId: nextOrder.recipeId, customerId: nextOrder.id, steps: [], completedStepIndexes: [] }
      : null;
  }

  updateSaveFromRuntime();
  updateHudValues();
  renderCustomers();
  renderIngredientGrid();
  updateCookingProgress();
}

function chooseRecipe(recipeId) {
  if (!recipeCatalog[recipeId]) return;
  state.selectedRecipe = recipeId;
  if (!state.levelActive) {
    beginLevel(state.save.currentLevel || 1, recipeId);
    return;
  }

  let order = state.customers.find((customer) => customer.recipeId === recipeId && !customer.served && !customer.missed);
  if (!order) {
    createCustomerOrderForQueue(recipeId);
    order = state.customers.find((customer) => customer.recipeId === recipeId && !customer.served && !customer.missed);
  }
  state.activeOrderId = order?.id || null;
  state.currentRecipe = recipeId;
  state.currentDish = { recipeId, customerId: order?.id || null, steps: [], completedStepIndexes: [] };
  state.selectedStepIndex = 0;
  clearPlatedFood();
  state.gamePaused = false;
  openScreen(null);
  renderCustomers();
  renderIngredientGrid();
  updateCookingProgress();
  const pauseButton = document.getElementById('pause-button');
  if (pauseButton) pauseButton.textContent = 'Pause';
  resumeAudio();
  playMarketVendorCall(recipeId);
  toast(`New order: ${recipeCatalog[recipeId].name}!`);
}

function selectCustomerOrder(customerId) {
  const order = state.customers.find((customer) => customer.id === customerId && !customer.missed && !customer.served);
  if (!order || !state.levelActive || state.gamePaused) return;
  state.activeOrderId = order.id;
  state.currentRecipe = order.recipeId;
  state.selectedRecipe = order.recipeId;
  state.currentDish = { recipeId: order.recipeId, customerId: order.id, steps: [], completedStepIndexes: [] };
  state.selectedStepIndex = 0;
  clearPlatedFood();
  renderCustomers();
  renderIngredientGrid();
  updateCookingProgress();
  toast(`Order selected: ${order.recipe}`);
}

function togglePause() {
  state.gamePaused = !state.gamePaused;
  if (state.gamePaused) stopAllAudio();
  else resumeAudio();
  const pauseButton = document.getElementById('pause-button');
  if (pauseButton) pauseButton.textContent = state.gamePaused ? 'Resume' : 'Pause';
  toast(state.gamePaused ? 'Paused' : 'Resumed');
}

function endLevel(win) {
  if (!state.levelActive) return;
  state.levelActive = false;
  state.lastLevelWon = win;
  clearInterval(state.levelTimerId);
  clearInterval(marketCallTimerId);
  marketCallTimerId = null;
  stopAllAudio();
  const resultsScreen = document.getElementById('results-screen');
  const level = getCurrentLevel();

  state.accuracy = state.totalOrders > 0 ? (state.correctOrders / state.totalOrders) * 100 : 100;
  state.save.coins = state.coins;
  state.save.highScore = Math.max(state.save.highScore, state.score);
  if (win) {
    state.coins += level.reward;
    const nextUnlocked = Math.min(levels.length, state.levelIndex + 2);
    state.save.unlockedLevels = Math.max(state.save.unlockedLevels, nextUnlocked);
    state.save.currentLevel = Math.min(level.id + 1, levels.length);
    toast('Level cleared!');
    resumeAudio();
    playLevelWinTone();
  } else {
    toast('Level failed. Try again!');
    resumeAudio();
    playMissTone();
  }

  document.getElementById('result-complete').textContent = `${state.completedOrders}`;
  document.getElementById('result-missed').textContent = `${state.missedOrders}`;
  document.getElementById('result-accuracy').textContent = `${Math.round(state.accuracy)}%`;
  document.getElementById('result-time').textContent = `${state.levelTimeRemaining}s`;
  document.getElementById('result-score').textContent = `${state.score}`;
  document.getElementById('result-coins').textContent = `${state.coins}`;
  document.getElementById('result-title').textContent = win ? 'Level Complete!' : 'Time’s Up!';
  document.getElementById('result-message').textContent = win
    ? `${level.name} cleared! Your ${level.reward}-coin stall reward is ready.`
    : `You served ${state.completedOrders} of ${level.targetOrders} orders. Restart or choose a different recipe.`;
  const nextButton = document.querySelector('[data-action="next-level"]');
  if (nextButton) {
    nextButton.textContent = win ? (level.id === levels.length ? 'Play Again' : 'Next Level') : 'Choose Recipe';
  }

  resultsScreen.classList.remove('hidden');
  showGameHud(false);
  updateHudValues();
  saveProgress();
  renderLevelButtons();
  renderMenuButtons();
}

function setupScene() {
  const container = document.getElementById('scene-container');
  const scene = new THREE.Scene();
  scene.background = null;

  const marketBackground = document.createElement('img');
  marketBackground.className = 'market-photo-background';
  marketBackground.src = '/images/market-background.jpg';
  marketBackground.alt = '';
  marketBackground.setAttribute('aria-hidden', 'true');
  marketBackground.addEventListener('error', () => {
    marketBackground.remove();
  }, { once: true });
  container.appendChild(marketBackground);

  const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 3.8, 12.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight('#f7d7a5', 1.5);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight('#ffdca6', 2.2);
  keyLight.position.set(3, 7, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight('#ff7a59', 1.6, 100);
  fillLight.position.set(-6, 4, -3);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 10, 1.2, 40),
    new THREE.MeshStandardMaterial({ color: '#553827', roughness: 0.9 })
  );
  ground.position.y = -0.8;
  ground.receiveShadow = true;
  scene.add(ground);

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 1.2, 5.35),
    new THREE.MeshStandardMaterial({ color: '#7b4a2a', roughness: 0.75 })
  );
  counter.position.set(0, 0.7, 0);
  counter.castShadow = true;
  counter.receiveShadow = true;
  scene.add(counter);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 0.28, 5.8),
    new THREE.MeshStandardMaterial({ color: '#d7b38d', roughness: 0.7 })
  );
  counterTop.position.set(0, 1.42, 0);
  scene.add(counterTop);

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.3, 2.8),
    new THREE.MeshStandardMaterial({ color: '#c83b32', roughness: 0.82 })
  );
  canopy.position.set(0, 4.65, -2.4);
  canopy.castShadow = true;
  scene.add(canopy);

  const awningStripes = [];
  for (let i = 0; i < 12; i += 1) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.8, 0.22),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#f4d89a' : '#c83b32', roughness: 0.84 })
    );
    stripe.position.set(-4.95 + i * 0.9, 4.16, -1.05);
    stripe.castShadow = true;
    scene.add(stripe);
    awningStripes.push(stripe);
  }

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 1.25, 0.48),
    new THREE.MeshStandardMaterial({ color: '#632c25', roughness: 0.5, metalness: 0.12 })
  );
  signBoard.position.set(0, 5.55, -1.25);
  scene.add(signBoard);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1200;
  signCanvas.height = 240;
  const signContext = signCanvas.getContext('2d');
  if (signContext) {
    signContext.fillStyle = '#7b3127';
    signContext.fillRect(0, 0, signCanvas.width, signCanvas.height);
    signContext.strokeStyle = '#f6c95f';
    signContext.lineWidth = 12;
    signContext.strokeRect(14, 14, signCanvas.width - 28, signCanvas.height - 28);
    signContext.textAlign = 'center';
    signContext.textBaseline = 'middle';
    signContext.font = 'bold 112px Arial, sans-serif';
    signContext.fillStyle = '#ffe08a';
    signContext.shadowColor = '#ff9b36';
    signContext.shadowBlur = 20;
    signContext.fillText('CHAAT CHAWK', signCanvas.width / 2, 108);
    signContext.shadowBlur = 0;
    signContext.font = 'bold 28px Arial, sans-serif';
    signContext.fillStyle = '#fff3d4';
    signContext.fillText('SPICY  •  TANGY  •  CRUNCHY  •  YUMMY!', signCanvas.width / 2, 198);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(7.05, 1.08),
    new THREE.MeshBasicMaterial({ map: signTexture })
  );
  signFace.position.set(0, 5.55, -0.99);
  scene.add(signFace);

  const hangingMenu = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.42, 0.2),
    new THREE.MeshStandardMaterial({ color: '#744128', roughness: 0.78 })
  );
  hangingMenu.position.set(-4.05, 3.78, -0.5);
  hangingMenu.castShadow = true;
  hangingMenu.receiveShadow = true;
  scene.add(hangingMenu);

  const menuCanvas = document.createElement('canvas');
  menuCanvas.width = 720;
  menuCanvas.height = 400;
  const menuContext = menuCanvas.getContext('2d');
  if (menuContext) {
    menuContext.fillStyle = '#f4d9a4';
    menuContext.fillRect(0, 0, menuCanvas.width, menuCanvas.height);
    menuContext.strokeStyle = '#7b3127';
    menuContext.lineWidth = 18;
    menuContext.strokeRect(12, 12, menuCanvas.width - 24, menuCanvas.height - 24);
    menuContext.textAlign = 'center';
    menuContext.textBaseline = 'middle';
    menuContext.fillStyle = '#7b3127';
    menuContext.font = 'bold 44px Arial, sans-serif';
    menuContext.fillText('CHAAT MENU', menuCanvas.width / 2, 48);
    menuContext.strokeStyle = '#b77a3e';
    menuContext.lineWidth = 4;
    menuContext.beginPath();
    menuContext.moveTo(52, 82);
    menuContext.lineTo(menuCanvas.width - 52, 82);
    menuContext.stroke();

    menuContext.textAlign = 'left';
    menuContext.fillStyle = '#49301f';
    menuContext.font = 'bold 38px Arial, sans-serif';
    Object.values(recipeCatalog).forEach((recipe, index) => {
      const rowY = 125 + index * 54;
      menuContext.fillStyle = '#a64d2e';
      menuContext.beginPath();
      menuContext.arc(70, rowY, 18, 0, Math.PI * 2);
      menuContext.fill();
      menuContext.fillStyle = '#fff3d4';
      menuContext.textAlign = 'center';
      menuContext.font = 'bold 22px Arial, sans-serif';
      menuContext.fillText(String(index + 1), 70, rowY + 1);
      menuContext.textAlign = 'left';
      menuContext.fillStyle = '#49301f';
      menuContext.font = 'bold 32px Arial, sans-serif';
      menuContext.fillText(recipe.name, 108, rowY + 1, 550);
    });

    menuContext.textAlign = 'center';
    menuContext.fillStyle = '#7b3127';
    menuContext.font = 'bold 21px Arial, sans-serif';
    menuContext.fillText('FRESH  •  CRISPY  •  SPICY', menuCanvas.width / 2, 366);
  }
  const menuTexture = new THREE.CanvasTexture(menuCanvas);
  const menuFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.34, 1.3),
    new THREE.MeshBasicMaterial({ map: menuTexture })
  );
  menuFace.position.set(-4.05, 3.78, -0.385);
  scene.add(menuFace);

  const hangingMenuHardware = new THREE.MeshStandardMaterial({ color: '#d3aa63', metalness: 0.68, roughness: 0.32 });
  [-4.82, -3.28].forEach((x) => {
    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.4, 10),
      hangingMenuHardware
    );
    chain.position.set(x, 4.59, -0.5);
    scene.add(chain);
    const nail = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), hangingMenuHardware);
    nail.position.set(x, 4.48, -0.385);
    scene.add(nail);
  });

  const decorativeLights = [];
  for (let i = 0; i < 12; i += 1) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#ffe6a6' : '#ff9153', emissive: '#fcd34d', emissiveIntensity: 1.2 })
    );
    light.position.set(-4.6 + i * 0.8, 5.1, -1.7 + (i % 2) * 0.5);
    scene.add(light);
    decorativeLights.push(light);
  }

  const steel = new THREE.MeshStandardMaterial({ color: '#cbd3dc', metalness: 0.82, roughness: 0.3 });
  const ingredientColors = {
    puri: '#d89a42',
    crack: '#5a2c18',
    potato: '#e9b446',
    chickpeas: '#c98235',
    sev: '#e8a833',
    chutney: '#9c4b2e',
    'puffed-rice': '#f5e3b8',
    onion: '#a14b72',
    tomato: '#cc4933',
    coriander: '#438b4e',
    papdi: '#d7a457',
    yogurt: '#fff5df',
    'mint-chutney': '#438b4e',
    tamarind: '#9c4b2e',
    masala: '#a84726',
    mix: '#c98235',
    'mint-pani': '#62bd87',
  };
  const counterIngredients = ingredientButtons
    .filter((ingredient) => ingredient.id !== 'serve')
    .map((ingredient, index) => {
      const row = Math.floor(index / 9);
      const column = index % 9;
      const columnsInRow = row === 0 ? 9 : 8;
      const spacing = 1.12;
      return {
        id: ingredient.id,
        label: ingredient.label.toUpperCase(),
        emoji: ingredient.emoji,
        x: (column - (columnsInRow - 1) / 2) * spacing,
        z: row === 0 ? -2.12 : 2.12,
        row,
      };
    });
  const bowlProfile = [
    new THREE.Vector2(0, 0.035),
    new THREE.Vector2(0.25, 0.035),
    new THREE.Vector2(0.43, 0.11),
    new THREE.Vector2(0.5, 0.2),
    new THREE.Vector2(0.44, 0.2),
    new THREE.Vector2(0.34, 0.12),
    new THREE.Vector2(0.08, 0.06),
  ];
  const addBowlIngredient = (id, x, z) => {
    const color = ingredientColors[id] || '#e9b446';
    const bowlFood = [];
    const solidMaterial = (materialColor) => new THREE.MeshStandardMaterial({ color: materialColor, roughness: 0.78 });
    const addPiece = (geometry, materialColor, px, py, pz, rotation = 0) => {
      const piece = new THREE.Mesh(geometry, solidMaterial(materialColor));
      piece.position.set(px, py, pz);
      piece.rotation.z = rotation;
      scene.add(piece);
      bowlFood.push(piece);
    };

    if (['mint-pani', 'mint-chutney', 'tamarind', 'chutney', 'yogurt', 'masala'].includes(id)) {
      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.34, 0.11, 20),
        new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.12 })
      );
      liquid.position.set(x, 1.78, z);
      scene.add(liquid);
      bowlFood.push(liquid);
      return bowlFood;
    }

    if (id === 'puri' || id === 'crack') {
      for (let i = 0; i < (id === 'puri' ? 3 : 2); i += 1) {
        const px = x + (i - 1) * 0.2;
        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), solidMaterial('#d89a42'));
        shell.scale.y = 0.72;
        shell.position.set(px, 1.84 + (i % 2) * 0.035, z + (i % 2) * 0.1);
        scene.add(shell);
        bowlFood.push(shell);
        if (id === 'crack') addPiece(new THREE.SphereGeometry(0.06, 10, 8), '#5a2c18', px, 1.96, z + (i % 2) * 0.1);
      }
      return bowlFood;
    }

    if (id === 'papdi') {
      for (let i = 0; i < 4; i += 1) {
        addPiece(new THREE.CylinderGeometry(0.12, 0.12, 0.035, 14), color, x + (i % 2) * 0.16 - 0.08, 1.82 + Math.floor(i / 2) * 0.035, z + (Math.floor(i / 2) - 0.5) * 0.16);
      }
      return bowlFood;
    }

    if (id === 'sev') {
      for (let i = 0; i < 10; i += 1) {
        addPiece(new THREE.CylinderGeometry(0.014, 0.02, 0.22, 5), color, x + (Math.random() - 0.5) * 0.34, 1.84, z + (Math.random() - 0.5) * 0.34, Math.random() * 1.4);
      }
      return bowlFood;
    }

    const colors = id === 'mix'
      ? ['#c98235', '#f5e3b8', '#438b4e', '#e9b446']
      : [color];
    const count = id === 'mix' ? 8 : 6;
    for (let i = 0; i < count; i += 1) {
      addPiece(
        new THREE.SphereGeometry(id === 'chickpeas' ? 0.065 : 0.075, 10, 8),
        colors[i % colors.length],
        x + (Math.random() - 0.5) * 0.38,
        1.82 + Math.random() * 0.055,
        z + (Math.random() - 0.5) * 0.38
      );
    }
    return bowlFood;
  };
  counterIngredients.forEach(({ id, label, emoji, x, z, row }) => {
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 24), steel);
    bowl.material = steel.clone();
    bowl.position.set(x, 1.57, z);
    bowl.scale.setScalar(0.92);
    scene.add(bowl);
    const food = addBowlIngredient(id, x, z);
    const pickArea = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.46, 0.86),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    pickArea.position.set(x, 1.83, z);
    pickArea.userData.tableIngredientTarget = true;
    scene.add(pickArea);
    const target = {
      mesh: pickArea,
      bowl,
      ingredientIds: [id],
      position: new THREE.Vector3(x, 1.82, z),
      food,
      label: null,
      hovered: false,
    };
    tableIngredientTargets.push(target);
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 96;
    const labelContext = labelCanvas.getContext('2d');
    if (labelContext) {
      labelContext.fillStyle = '#63352b';
      labelContext.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
      labelContext.strokeStyle = '#f5d184';
      labelContext.lineWidth = 8;
      labelContext.strokeRect(4, 4, labelCanvas.width - 8, labelCanvas.height - 8);
      labelContext.fillStyle = '#fff0cc';
      labelContext.font = 'bold 40px Arial, sans-serif';
      labelContext.textAlign = 'center';
      labelContext.textBaseline = 'middle';
      labelContext.fillText(`${emoji} ${label}`, labelCanvas.width / 2, labelCanvas.height / 2, 480);
    }
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 0.24),
      new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })
    );
    labelMesh.position.set(x, 2.04, z + (row === 0 ? 0.44 : 0.47));
    scene.add(labelMesh);
    target.label = labelMesh;
  });

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.78, 0.2, 56),
    new THREE.MeshStandardMaterial({ color: '#f5efea', roughness: 0.46, metalness: 0.08 })
  );
  plate.position.set(0, 1.76, -0.25);
  plate.castShadow = true;
  plate.receiveShadow = true;
  scene.add(plate);

  const plateRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.78, 0.085, 10, 64),
    new THREE.MeshStandardMaterial({ color: '#d7a84d', metalness: 0.64, roughness: 0.32 })
  );
  plateRim.rotation.x = Math.PI / 2;
  plateRim.position.set(0, 1.87, -0.25);
  scene.add(plateRim);

  const plateCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.65, 0.025, 56),
    new THREE.MeshStandardMaterial({ color: '#fffaf2', roughness: 0.54 })
  );
  plateCenter.position.set(0, 1.87, -0.25);
  scene.add(plateCenter);

  platedFoodGroup = new THREE.Group();
  platedFoodGroup.position.set(0, 1.89, -0.25);
  scene.add(platedFoodGroup);

  const cookImage = new Image();
  cookImage.onload = () => {
    const cookTexture = createCutoutTexture(cookImage, 'the cook image');
    if (!cookTexture) return;
    const cookPortrait = new THREE.Mesh(
      new THREE.PlaneGeometry(2.85, 2.85),
      new THREE.MeshBasicMaterial({ map: cookTexture, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide })
    );
    cookPortrait.position.set(0, 2.9, -1.7);
    cookPortrait.renderOrder = 1;
    scene.add(cookPortrait);
  };
  cookImage.onerror = () => {
    console.error('Unable to load the cook image from /images/cook.jpg.');
  };
  cookImage.src = '/images/cook.jpg';

  const vendorShoulder = new THREE.Vector3(0.42, 2.7, -1.18);
  const armMaterial = new THREE.MeshStandardMaterial({ color: '#e7e2dc', roughness: 0.8 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#d89576', roughness: 0.84 });
  const makeArmSegment = (radius, material) => new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius, 1, 12),
    material
  );
  const upperArm = makeArmSegment(0.14, armMaterial);
  const forearm = makeArmSegment(0.11, skinMaterial);
  const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), armMaterial);
  const vendorHand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), skinMaterial);
  scene.add(upperArm, forearm, elbowJoint, vendorHand);
  vendorArmRig = {
    shoulder: vendorShoulder,
    restingHand: vendorShoulder.clone().add(new THREE.Vector3(0.65, -0.55, 0.18)),
    upperArm,
    forearm,
    elbowJoint,
    hand: vendorHand,
  };
  const setLimbBetween = (limb, start, end) => {
    const direction = end.clone().sub(start);
    limb.position.copy(start).add(end).multiplyScalar(0.5);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    limb.scale.y = direction.length();
  };
  const animateVendorArm = (now) => {
    let hand = vendorArmRig.restingHand.clone();
    if (vendorReachAnimation) {
      const progress = Math.min(1, (now - vendorReachAnimation.start) / vendorReachAnimation.duration);
      const ease = (value) => value * value * (3 - 2 * value);
      if (progress < 0.36) {
        hand.lerpVectors(vendorArmRig.restingHand, vendorReachAnimation.ingredient, ease(progress / 0.36));
      } else if (progress < 0.62) {
        hand.lerpVectors(vendorReachAnimation.ingredient, vendorReachAnimation.plate, ease((progress - 0.36) / 0.26));
      } else {
        hand.lerpVectors(vendorReachAnimation.plate, vendorArmRig.restingHand, ease((progress - 0.62) / 0.38));
      }
      if (progress >= 1) vendorReachAnimation = null;
    }
    const elbow = vendorArmRig.shoulder.clone().lerp(hand, 0.56);
    elbow.x += 0.12;
    elbow.y += 0.12;
    setLimbBetween(vendorArmRig.upperArm, vendorArmRig.shoulder, elbow);
    setLimbBetween(vendorArmRig.forearm, elbow, hand);
    vendorArmRig.elbowJoint.position.copy(elbow);
    vendorArmRig.hand.position.copy(hand);
  };

  cookingScene = scene;
  const tableRaycaster = new THREE.Raycaster();
  const tablePointer = new THREE.Vector2();
  const sceneCustomers = new Map();
  const customerPortraitMaterials = new Map();
  let nextCustomerGender = 0;
  const customerSlots = [
    { x: -4.5, z: 4.15 },
    { x: -1.5, z: 4.15 },
    { x: 1.5, z: 4.15 },
    { x: 4.5, z: 4.15 },
  ];
  const applyCustomerPortrait = (entry, material, image) => {
    const portraitHeight = 3.6;
    entry.portrait.geometry.dispose();
    entry.portrait.geometry = new THREE.PlaneGeometry(
      portraitHeight * image.naturalWidth / image.naturalHeight,
      portraitHeight
    );
    entry.portrait.material.dispose();
    entry.portrait.material = material.clone();
    entry.portrait.visible = true;
    entry.characterModel.visible = false;
  };
  const loadCustomerPortrait = (gender, imagePath) => {
    const image = new Image();
    image.onload = () => {
      const texture = createCutoutTexture(image, `the ${gender} customer image`);
      if (!texture) return;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.02,
        side: THREE.DoubleSide,
      });
      customerPortraitMaterials.set(gender, { material, image });
      sceneCustomers.forEach((entry) => {
        if (entry.gender === gender) applyCustomerPortrait(entry, material, image);
      });
    };
    image.onerror = () => {
      console.error(`Unable to load the ${gender} customer image from ${imagePath}.`);
    };
    image.src = imagePath;
  };
  loadCustomerPortrait('lady', '/images/lady-customer.jpg');
  loadCustomerPortrait('male', '/images/male-customer.jpg');
  const createCustomer = (customer, index) => {
    const appearance = [
      { skin: '#a85f3e', hair: '#302018', shirt: '#d84e35' },
      { skin: '#d18a5c', hair: '#241812', shirt: '#26865f' },
      { skin: '#8f513b', hair: '#171513', shirt: '#6452a0' },
      { skin: '#c9825b', hair: '#35251b', shirt: '#327ca0' },
    ][index % 4];
    const group = new THREE.Group();
    const gender = nextCustomerGender % 2 === 0 ? 'lady' : 'male';
    nextCustomerGender += 1;
    const characterModel = new THREE.Group();
    group.add(characterModel);
    const walkingLegsGroup = new THREE.Group();
    walkingLegsGroup.position.z = -0.24;
    group.add(walkingLegsGroup);
    const mesh = (geometry, color, x, y, z, scale = [1, 1, 1]) => {
      const part = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color, roughness: 0.82 })
      );
      part.position.set(x, y, z);
      part.scale.set(...scale);
      part.castShadow = true;
      characterModel.add(part);
      return part;
    };
    mesh(new THREE.CylinderGeometry(0.34, 0.48, 1.25, 18), appearance.shirt, 0, 1.38, 0, [1, 1, 0.7]);
    const walkingLegs = [];
    [-0.2, 0.2].forEach((legX) => {
      const leg = mesh(
        new THREE.CylinderGeometry(0.105, 0.12, 0.72, 12),
        gender === 'lady' ? '#416284' : '#e8b0b3',
        legX,
        0.43,
        0
      );
      const shoe = mesh(new THREE.SphereGeometry(0.14, 12, 8), '#30251f', legX, 0.085, 0.09, [1.25, 0.62, 1.7]);
      characterModel.remove(leg, shoe);
      walkingLegsGroup.add(leg, shoe);
      walkingLegs.push({ leg, shoe, offset: legX < 0 ? 0 : Math.PI });
    });
    mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.35, 12), appearance.skin, 0, 2.12, 0);
    mesh(new THREE.SphereGeometry(0.43, 20, 16), appearance.skin, 0, 2.66, 0);
    mesh(
      new THREE.SphereGeometry(0.445, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      appearance.hair,
      0,
      2.77,
      -0.015,
      [1, 0.62, 1]
    );
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#241912', roughness: 0.9 });
    [-0.14, 0.14].forEach((eyeX) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMaterial);
      eye.position.set(eyeX, 2.68, 0.39);
      characterModel.add(eye);
    });
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.018, 6, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#713629', roughness: 0.9 })
    );
    smile.position.set(0, 2.49, 0.382);
    smile.rotation.z = Math.PI;
    characterModel.add(smile);
    const portrait = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 3.6),
      new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, side: THREE.DoubleSide })
    );
    portrait.position.set(0, 1.82, 0.1);
    portrait.rotation.y = Math.PI;
    portrait.visible = false;
    group.add(portrait);

    const slot = customerSlots[index % customerSlots.length];
    const arrivalStart = new THREE.Vector3(slot.x, 0, slot.z + 4.8);
    group.position.copy(arrivalStart);
    group.scale.setScalar(0.68);
    group.rotation.y = Math.PI;
    scene.add(group);

    const pickArea = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 2.55, 0.8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false })
    );
    pickArea.position.set(slot.x, 1.55, slot.z + 0.08);
    pickArea.userData.customerId = customer.id;
    scene.add(pickArea);

    const orderBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 0.68, 0.72),
      new THREE.MeshStandardMaterial({ color: '#74452b', roughness: 0.78 })
    );
    orderBox.position.set(slot.x, 2.72, 2.82);
    orderBox.castShadow = true;
    orderBox.receiveShadow = true;
    orderBox.userData.customerId = customer.id;
    scene.add(orderBox);
    sceneCustomerPickTargets.push(orderBox);
    const orderBoxTrim = new THREE.Mesh(
      new THREE.BoxGeometry(2.49, 0.09, 0.76),
      new THREE.MeshStandardMaterial({ color: '#d7a34c', metalness: 0.18, roughness: 0.5 })
    );
    orderBoxTrim.position.set(slot.x, 3.07, 2.82);
    scene.add(orderBoxTrim);

    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 512;
    bubbleCanvas.height = 200;
    const context = bubbleCanvas.getContext('2d');
    const texture = new THREE.CanvasTexture(bubbleCanvas);
    const bubble = new THREE.Mesh(
      new THREE.PlaneGeometry(2.28, 0.78),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
    );
    bubble.position.set(slot.x, 2.78, 3.205);
    bubble.userData.customerId = customer.id;
    scene.add(bubble);
    sceneCustomerPickTargets.push(bubble);
    const entry = {
      group,
      pickArea,
      orderBox,
      orderBoxTrim,
      bubble,
      bubbleCanvas,
      texture,
      context,
      walkingLegs,
      gaitPhase: Math.random() * Math.PI * 2,
      gaitSpeed: 0.006 + Math.random() * 0.002,
      travelSway: (Math.random() - 0.5) * 0.5,
      characterModel,
      walkingLegsGroup,
      portrait,
      gender,
      slotIndex: index % customerSlots.length,
      travel: {
        from: arrivalStart,
        to: new THREE.Vector3(slot.x, 0, slot.z),
        startedAt: performance.now(),
        duration: 1500,
      },
      exitStart: null,
      exitStartedAt: null,
    };
    const portraitRecord = customerPortraitMaterials.get(gender);
    if (portraitRecord) {
      applyCustomerPortrait(entry, portraitRecord.material, portraitRecord.image);
    }
    return entry;
  };
  const paintCustomerOrder = (entry, customer) => {
    const { context, bubbleCanvas, texture } = entry;
    if (!context) return;
    const width = bubbleCanvas.width;
    const height = bubbleCanvas.height;
    const patienceRatio = Math.max(0, customer.patienceLeft / customer.patienceTotal);
    const active = customer.id === state.activeOrderId;
    context.clearRect(0, 0, width, height);
    context.fillStyle = customer.served
      ? '#328b4f'
      : customer.missed ? '#c62828' : 'rgba(255, 247, 224, .97)';
    context.beginPath();
    context.roundRect(10, 10, width - 20, height - 20, 18);
    context.fill();
    context.lineWidth = active ? 12 : 7;
    context.strokeStyle = customer.served ? '#d8f3d9' : customer.missed ? '#fff0f0' : active ? '#e4a72f' : '#9a6744';
    context.strokeRect(15, 15, width - 30, height - 30);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = customer.served || customer.missed ? '#ffffff' : '#9a4a31';
    context.font = 'bold 23px Arial, sans-serif';
    const heading = customer.served
      ? 'SERVED!'
      : customer.missed ? 'BAD SERVICE' : 'CUSTOMER ORDER';
    context.fillText(heading, width / 2, 40);
    context.fillStyle = customer.served || customer.missed ? '#ffffff' : '#45251c';
    context.font = 'bold 38px Arial, sans-serif';
    context.fillText(customer.recipe.toUpperCase(), width / 2, 86, width - 46);
    const detail = customer.recipeId === 'pani-puri'
      ? customer.liquidId === 'mint-pani' ? 'Mint pani' : 'Tamarind pani'
      : customer.extraTasks?.length ? 'Special toppings' : '';
    context.fillStyle = customer.served || customer.missed ? '#fff0f0' : '#694735';
    context.font = '24px Arial, sans-serif';
    const status = customer.served
      ? 'Order delivered!'
      : customer.missed
      ? `Leaving in ${customer.angerTimeLeft}s`
      : detail ? `${detail}  •  ${Math.ceil(customer.patienceLeft)}s` : `Patience  •  ${Math.ceil(customer.patienceLeft)}s`;
    context.fillText(status, width / 2, 125, width - 42);
    const barX = 55;
    const barY = 157;
    const barWidth = width - 110;
    context.fillStyle = '#e5d4b7';
    context.fillRect(barX, barY, barWidth, 14);
    context.fillStyle = customer.served ? '#48a86b' : customer.missed ? '#8f1717' : patienceRatio > 0.6 ? '#48a86b' : patienceRatio > 0.25 ? '#e0a73a' : '#d34c42';
    context.fillRect(barX, barY, barWidth * (customer.served ? 1 : patienceRatio), 14);
    texture.needsUpdate = true;
  };
  syncSceneCustomers = (customers) => {
    const activeIds = new Set(customers.map((customer) => customer.id));
    for (const [id, entry] of sceneCustomers) {
      if (activeIds.has(id)) continue;
      scene.remove(entry.group, entry.pickArea, entry.orderBox, entry.orderBoxTrim, entry.bubble);
      sceneCustomerPickTargets.splice(sceneCustomerPickTargets.indexOf(entry.pickArea), 1);
      sceneCustomerPickTargets.splice(sceneCustomerPickTargets.indexOf(entry.orderBox), 1);
      sceneCustomerPickTargets.splice(sceneCustomerPickTargets.indexOf(entry.bubble), 1);
      entry.group.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      entry.texture.dispose();
      entry.bubble.geometry.dispose();
      entry.bubble.material.dispose();
      entry.orderBox.geometry.dispose();
      entry.orderBox.material.dispose();
      entry.orderBoxTrim.geometry.dispose();
      entry.orderBoxTrim.material.dispose();
      entry.pickArea.geometry.dispose();
      entry.pickArea.material.dispose();
      sceneCustomers.delete(id);
    }
    customers.forEach((customer, index) => {
      let entry = sceneCustomers.get(customer.id);
      if (!entry) {
        entry = createCustomer(customer, index);
        sceneCustomers.set(customer.id, entry);
      }
      const slot = customerSlots[index % customerSlots.length];
      if (customer.missed) {
        if (entry.exitStartedAt === null) {
          entry.exitStart = entry.group.position.clone();
          entry.exitStartedAt = performance.now();
          entry.travel = null;
          entry.pickArea.visible = false;
          [entry.orderBox, entry.bubble].forEach((target) => {
            const targetIndex = sceneCustomerPickTargets.indexOf(target);
            if (targetIndex >= 0) sceneCustomerPickTargets.splice(targetIndex, 1);
          });
        }
        entry.orderBox.material.color.set('#b3261e');
        entry.orderBoxTrim.material.color.set('#f2aaa5');
      } else {
        const slotIndex = index % customerSlots.length;
        if (entry.slotIndex !== slotIndex && entry.exitStartedAt === null) {
          entry.slotIndex = slotIndex;
          entry.travel = {
            from: entry.group.position.clone(),
            to: new THREE.Vector3(slot.x, 0, slot.z),
            startedAt: performance.now(),
            duration: 900,
          };
        }
      }
      entry.group.scale.setScalar(0.68);
      entry.group.rotation.y = Math.PI;
      entry.pickArea.position.set(slot.x, 1.55, slot.z + 0.08);
      entry.orderBox.position.set(slot.x, 2.72, 2.82);
      entry.orderBoxTrim.position.set(slot.x, 3.07, 2.82);
      entry.bubble.position.set(slot.x, 2.78, 3.205);
      paintCustomerOrder(entry, customer);
    });
  };
  const getTableTarget = (event) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    tablePointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    tablePointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    tableRaycaster.setFromCamera(tablePointer, camera);
    const intersections = tableRaycaster.intersectObjects(
      tableIngredientTargets.filter((target) => target.mesh.visible).map((target) => target.mesh)
    );
    return intersections.length
      ? tableIngredientTargets.find((target) => target.mesh === intersections[0].object)
      : null;
  };
  const getCustomerTarget = (event) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    tablePointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    tablePointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    tableRaycaster.setFromCamera(tablePointer, camera);
    return tableRaycaster.intersectObjects(sceneCustomerPickTargets)[0]?.object || null;
  };
  renderer.domElement.addEventListener('pointermove', (event) => {
    const hoveredTarget = getTableTarget(event);
    const hoveredCustomer = getCustomerTarget(event);
    tableIngredientTargets.forEach((target) => {
      target.hovered = target === hoveredTarget;
      target.bowl.scale.setScalar(target.hovered ? 1.3 : 1.2);
    });
    renderer.domElement.style.cursor = hoveredTarget || hoveredCustomer ? 'pointer' : 'default';
  });
  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const target = getTableTarget(event);
    if (target) {
      handleTableIngredient(target);
      return;
    }
    const customerTarget = getCustomerTarget(event);
    if (customerTarget) {
      selectCustomerOrder(customerTarget.userData.customerId);
    }
  });

  const clock = new THREE.Clock();
  const coinRewardAnimations = [];
  animateCustomerCoinReward = (customerId, reward) => {
    const customerEntry = sceneCustomers.get(customerId);
    if (!customerEntry) return;

    const coinCount = Math.min(5, Math.max(2, Math.ceil(reward / 10)));
    for (let index = 0; index < coinCount; index += 1) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.055, 20),
        new THREE.MeshStandardMaterial({
          color: '#f7c948',
          metalness: 0.72,
          roughness: 0.24,
          emissive: '#8a5a08',
          emissiveIntensity: 0.16,
        })
      );
      coin.rotation.x = Math.PI / 2;
      coin.position.copy(customerEntry.group.localToWorld(
        new THREE.Vector3(-0.48 + (index - (coinCount - 1) / 2) * 0.08, 1.1, 0.2)
      ));
      scene.add(coin);
      coinRewardAnimations.push({
        mesh: coin,
        start: coin.position.clone(),
        startTime: performance.now() + index * 180,
        duration: 1250,
        target: vendorArmRig.restingHand.clone(),
      });
    }
  };

  function animate() {
    const elapsed = clock.getElapsedTime();
    const now = performance.now();
    animateVendorArm(now);
    sceneCustomers.forEach((entry) => {
      const isWalkingAway = entry.exitStartedAt !== null;
      const isWalking = isWalkingAway || entry.travel !== null;
      const stride = now * entry.gaitSpeed + entry.gaitPhase;
      const footfall = Math.abs(Math.sin(stride));
      entry.portrait.position.y = 1.82 + footfall * (isWalking ? 0.045 : 0.008);
      entry.portrait.rotation.z = Math.sin(stride) * (isWalking ? 0.025 : 0.006);
      entry.walkingLegsGroup.visible = isWalking && !entry.portrait.visible;
      entry.walkingLegs.forEach(({ leg, shoe, offset }) => {
        const step = Math.sin(stride + offset);
        leg.rotation.x = isWalking ? step * 0.62 : 0;
        shoe.rotation.x = isWalking ? step * 0.38 : 0;
      });
      entry.characterModel.rotation.z = isWalking ? Math.sin(stride) * 0.025 : Math.sin(elapsed * 1.2 + entry.gaitPhase) * 0.008;
      if (isWalkingAway) {
        const duration = ANGRY_LEAVE_SECONDS * 1000;
        const progress = Math.min(1, (now - entry.exitStartedAt) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        entry.group.position.set(
          entry.exitStart.x + Math.sin(progress * Math.PI) * entry.travelSway,
          footfall * 0.025,
          entry.exitStart.z + eased * 4.8
        );
        entry.group.rotation.y = Math.PI + Math.sin(progress * Math.PI * 6) * 0.08;
        return;
      }
      if (!entry.travel) return;
      const progress = Math.min(1, (now - entry.travel.startedAt) / entry.travel.duration);
      const eased = progress * progress * (3 - 2 * progress);
      entry.group.position.lerpVectors(entry.travel.from, entry.travel.to, eased);
      entry.group.position.x += Math.sin(progress * Math.PI) * entry.travelSway;
      entry.group.position.y = footfall * 0.025;
      if (progress >= 1) {
        entry.group.position.copy(entry.travel.to);
        entry.travel = null;
      }
    });
    for (let index = popInFood.length - 1; index >= 0; index -= 1) {
      const piece = popInFood[index];
      const progress = Math.min(1, (now - piece.userData.popStart) / 220);
      const eased = 1 - (1 - progress) ** 3;
      const [x, y, z] = piece.userData.targetScale;
      piece.scale.set(x * eased, y * eased, z * eased);
      if (progress >= 1) popInFood.splice(index, 1);
    }
    for (let index = tablePickupAnimations.length - 1; index >= 0; index -= 1) {
      const pickup = tablePickupAnimations[index];
      const progress = Math.min(1, (now - pickup.startTime) / pickup.duration);
      const eased = 1 - (1 - progress) ** 3;
      pickup.mesh.position.lerpVectors(pickup.start, pickup.target, eased);
      pickup.mesh.position.y += Math.sin(progress * Math.PI) * 0.65;
      pickup.mesh.scale.setScalar(1 - eased * 0.42);
      if (progress >= 1) {
        scene.remove(pickup.mesh);
        pickup.mesh.geometry.dispose();
        pickup.mesh.material.dispose();
        tablePickupAnimations.splice(index, 1);
      }
    }
    for (let index = coinRewardAnimations.length - 1; index >= 0; index -= 1) {
      const reward = coinRewardAnimations[index];
      if (now < reward.startTime) continue;
      const progress = Math.min(1, (now - reward.startTime) / reward.duration);
      const eased = 1 - (1 - progress) ** 3;
      reward.mesh.position.lerpVectors(reward.start, reward.target, eased);
      reward.mesh.position.y += Math.sin(progress * Math.PI) * 0.8;
      reward.mesh.rotation.y = progress * Math.PI * 8;
      if (progress >= 1) {
        scene.remove(reward.mesh);
        reward.mesh.geometry.dispose();
        reward.mesh.material.dispose();
        coinRewardAnimations.splice(index, 1);
      }
    }
    if (decorativeLights.length) {
      decorativeLights.forEach((light, index) => {
        light.scale.setScalar(1 + Math.sin(elapsed * 2 + index) * 0.06);
      });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  updateCookingProgress();
  animate();

  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

function initGame() {
  createAppShell();
  setupScene();
  renderMenuButtons();
  openScreen(null);
  showGameHud(true);
  syncSettingsControls();
  ensureAudio();
  applyAudioSettings(getAudioSettings());
  document.getElementById('results-screen').classList.add('hidden');
  state.currentRecipe = null;
  state.currentDish = null;
  state.customers = [];
  renderCustomers();
  beginLevel(state.save.currentLevel || 1, 'pani-puri');
}

initGame();
