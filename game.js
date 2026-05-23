const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const startButton = document.querySelector("#startButton");
const restartScreen = document.querySelector("#restartScreen");
const restartButton = document.querySelector("#restartButton");
const restartXp = document.querySelector("#restartXp");
const restartCoins = document.querySelector("#restartCoins");
const nicknameInput = document.querySelector("#nicknameInput");
const coords = document.querySelector("#coords");
const dashStatus = document.querySelector("#dashStatus");
const healthStatus = document.querySelector("#healthStatus");
const healthBarFill = document.querySelector("#healthBarFill");
const xpStatus = document.querySelector("#xpStatus");
const xpBarFill = document.querySelector("#xpBarFill");
const coinStatus = document.querySelector("#coinStatus");
const upgradePanel = document.querySelector("#upgradePanel");
const upgradePointsLabel = document.querySelector("#upgradePointsLabel");
const upgradeButtons = document.querySelectorAll(".upgrade-choice");
const knifeSwapSkill = document.querySelector("#knifeSwapSkill");
const knifeSwapCooldown = document.querySelector("#knifeSwapCooldown");
const skillSlotElements = {
  f: document.querySelector("#knifeSwapSkill"),
  q: document.querySelector("#skillSlotQ"),
  g: document.querySelector("#skillSlotG"),
  e: document.querySelector("#skillSlotE"),
};
const skillSlotKeys = ["f", "q", "g", "e"];
const skillSlotUnlockLevels = {
  f: 25,
  g: 50,
  q: 75,
  e: 100,
};
const leaderboard = document.querySelector("#leaderboard");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const googleSignIn = document.querySelector("#googleSignIn");
const accountStatus = document.querySelector("#accountStatus");
const accountSignOut = document.querySelector("#accountSignOut");
const shopPanel = document.querySelector("#shopPanel");
const shopClose = document.querySelector("#shopClose");
const shopCoins = document.querySelector("#shopCoins");
const shopMessage = document.querySelector("#shopMessage");
const ammoStatus = document.querySelector("#ammoStatus");
const awmAmmoStatus = document.querySelector("#awmAmmoStatus");
const inventorySlots = document.querySelectorAll(".slot");
const slot2Icon = document.querySelector("#slot2Icon");
const slot2Empty = document.querySelector("#slot2Empty");
const slot2Name = document.querySelector("#slot2Name");
const slot3Icon = document.querySelector("#slot3Icon");
const slot3Empty = document.querySelector("#slot3Empty");
const slot3Name = document.querySelector("#slot3Name");

const crateSprites = {
  basic: createSprite("assets/crates/crate-basic.png"),
  bronze: createSprite("assets/crates/crate-bronze.png"),
  metal: createSprite("assets/crates/crate-metal.png"),
  gold: createSprite("assets/crates/crate-gold.png"),
  royal: createSprite("assets/crates/crate-royal.png"),
};

const world = {
  width: 12000,
  height: 12000,
};

const crateTiers = {
  basic: { count: 100, size: 54, hitboxSize: 72, health: 150, xp: 38, coinKind: "bronze", coinValue: 5 },
  bronze: { count: 60, size: 58, hitboxSize: 100, health: 300, xp: 125, coinKind: "silver", coinValue: 10 },
  metal: { count: 40, size: 62, hitboxSize: 96, health: 600, xp: 350, coinKind: "gold", coinValue: 100 },
  gold: { count: 20, size: 74, hitboxSize: 118, health: 900, xp: 1000, coinKind: "gold", coinValue: 150 },
  royal: { count: 5, size: 84, hitboxSize: 134, health: 1500, xp: 2500, coinKind: "gold", coinValue: 300 },
};
const crateTierOrder = ["basic", "bronze", "metal", "gold", "royal"];
const crateSpriteRatios = {
  basic: 1,
  bronze: 1,
  metal: 1,
  gold: 1,
  royal: 1,
};
const crateRespawnSeconds = 5;
const corpseLifetime = 500;
const pickupLifetimeMs = 5 * 60 * 1000;
const knifeSwapCooldownSeconds = 5;
const lightningThrustCooldownSeconds = 8;
const lightningThrustRange = 360;
const lightningThrustDamage = 85;
const lightningThrustHitRadius = 42;
const railburstCooldownSeconds = 10;
const railburstChargeSeconds = 0.45;
const railburstRange = 1500;
const railburstWidth = 160;
const railburstDamage = 150;
const staticCollapseCooldownSeconds = 12;
const staticCollapseDelay = 0.8;
const staticCollapseRadius = 260;
const staticCollapseDamage = 90;
const staticCollapseProjectileSpeed = 760;
const staticCollapseContactDamage = 36;
const staticCollapseChargeMax = 1.4;
const staticCollapseMinRange = 280;
const staticCollapseMaxRange = 1240;
const arcPrisonCooldownSeconds = 16;
const arcPrisonRadius = 240;
const arcPrisonDamage = 45;
const arcPrisonEdgeWidth = 7;
const arcPrisonSlowSeconds = 1.6;
const stormRecallCooldownSeconds = 18;
const stormRecallRadius = 200;
const stormRecallDamage = 40;
const chatMessageLifetime = 6500;
const maxChatMessages = 40;
const accountStorageKey = "core-drift-account";
const shopDepth = 920;
const doorHeight = 500;
const shopDoor = {
  x: 0,
  y: world.height / 2,
  width: 38,
  height: doorHeight,
};
const shopNpc = {
  x: -560,
  y: world.height / 2,
  radius: 30,
};
const magnetBaseRange = 105;
const magnetRangePerLevel = 24;
const magnetBaseSpeed = 190;
const magnetSpeedPerLevel = 36;
const shopPrices = {
  knife: { buy: 50, sell: 25 },
  glock: { buy: 170, sell: 85 },
  awm: { buy: 360, sell: 180 },
};
const shopUpgradePrices = {
  knife: { range: 120, damage: 140, speed: 160 },
  glock: { range: 180, damage: 240, mag: 220, speed: 260 },
  awm: { range: 280, damage: 360, mag: 320, speed: 420 },
};
const shopAbilityPrices = {
  heal: 180,
  magnet: 260,
};
const skillShopPrices = {
  knifeRecall: 250,
  staticCollapse: 520,
  arcPrison: 620,
  stormRecall: 560,
  lightningThrust: 650,
  railburst: 900,
};

function createSprite(src) {
  const image = new Image();
  image.src = src;
  return image;
}
const skillDefinitions = {
  knifeRecall: { label: "Knife Teleport", cooldown: knifeSwapCooldownSeconds, icon: "skill-icon-knife-recall", requiresKnife: true },
  staticCollapse: { label: "Static Collapse", cooldown: staticCollapseCooldownSeconds, icon: "skill-icon-static-collapse" },
  arcPrison: { label: "Arc Prison", cooldown: arcPrisonCooldownSeconds, icon: "skill-icon-arc-prison" },
  stormRecall: { label: "Storm Recall", cooldown: stormRecallCooldownSeconds, icon: "skill-icon-storm-recall" },
  lightningThrust: { label: "Lightning Thrust", cooldown: lightningThrustCooldownSeconds, icon: "skill-icon-lightning-thrust", requiresKnife: true },
  railburst: { label: "Railburst", cooldown: railburstCooldownSeconds, icon: "skill-icon-railburst" },
};

const baseStats = {
  maxSpeed: 480,
  acceleration: 1620,
  dashSpeed: 980,
  maxHealth: 200,
  healAmount: 60,
  damageMultiplier: 1,
};

const xpDropValue = 38;
const metalCrateXpValue = 125;
const goldCrateXpValue = 350;
const novaXpValue = 1000;
const astralXpValue = 2500;
const coinValues = {
  bronze: 5,
  silver: 10,
  gold: 100,
  bill: 1000,
  bigBill: 10000,
};
const upgradeSteps = {
  speed: { maxSpeed: 35, acceleration: 90 },
  dash: { dashSpeed: 90 },
  health: { maxHealth: 25 },
  damage: { damageMultiplier: 0.1 },
  reload: { reloadReduction: 0.06 },
};
const baseReloadTimes = {
  glock: 3,
  awm: 5,
};

const player = {
  x: world.width / 2,
  y: world.height / 2,
  name: "Player",
  radius: 24,
  maxSpeed: 480,
  acceleration: 1620,
  friction: 4.4,
  turnDrag: 1.8,
  dashSpeed: 980,
  dashDuration: 0.12,
  dashCooldown: 3,
  dashTimer: 0,
  dashActiveTimer: 0,
  health: 200,
  maxHealth: 200,
  shield: 0,
  maxShield: 125,
  healAmount: baseStats.healAmount,
  coins: 0,
  knifeSwapTimer: 0,
  lightningThrustTimer: 0,
  lightningThrustActiveTimer: 0,
  knockbackTimer: 0,
  railburstTimer: 0,
  railburstChargeTimer: 0,
  railburstCharge: null,
  arcSlowTimer: 0,
  arcSlowStrength: 1,
  skillSlots: {
    f: null,
    q: null,
    g: null,
    e: null,
  },
  ownedSkills: [],
  skillCooldowns: {
    knifeRecall: 0,
    staticCollapse: 0,
    arcPrison: 0,
    stormRecall: 0,
    lightningThrust: 0,
    railburst: 0,
  },
  pendingStaticCollapse: [],
  staticCollapseHeld: false,
  staticCollapseCharging: false,
  staticCollapseCharge: 0,
  level: 1,
  xp: 0,
  totalXp: 0,
  xpToNext: 100,
  upgradePoints: 0,
  damageMultiplier: baseStats.damageMultiplier,
  upgrades: {
    speed: 0,
    dash: 0,
    health: 0,
    heal: 0,
    magnet: 0,
    damage: 0,
    reload: 0,
  },
  hurtTimer: 0,
  vx: 0,
  vy: 0,
  shotTimer: 0,
  swingTimer: 0,
  punchTimer: 0,
  knifeCharge: 0,
  knifeChargeMax: 1.25,
  knifeCharging: false,
  testMode: false,
};

const weapons = {
  selectedSlot: 1,
  slots: {
    1: "knife",
    2: null,
    3: null,
  },
  knife: {
    damage: 25,
    fireRate: 0.42,
    range: 82,
    throwLifeBonus: 0,
    throwSpeedBonus: 0,
    arc: Math.PI * 0.72,
    swingDuration: 0.18,
    count: 1,
    upgrades: { range: 0, damage: 0, mag: 0, speed: 0 },
  },
  fist: {
    damage: 10,
    fireRate: 0.36,
    range: 52,
    arc: Math.PI * 0.62,
    swingDuration: 0.16,
  },
  glock: {
    damage: 50,
    bulletSpeed: 880,
    fireRate: 0.13,
    bulletRadius: 7,
    bulletLife: 1.2,
    ammo: 0,
    magAmmo: 0,
    magazineSize: 17,
    reloadTime: 3,
    reloadTimer: 0,
    upgrades: { range: 0, damage: 0, mag: 0, speed: 0 },
  },
  awm: {
    damage: 100,
    bulletSpeed: 1500,
    fireRate: 0.85,
    bulletRadius: 5,
    bulletLife: 4,
    ammo: 0,
    magAmmo: 0,
    magazineSize: 6,
    reloadTime: 5,
    reloadTimer: 0,
    upgrades: { range: 0, damage: 0, mag: 0, speed: 0 },
  },
};

const camera = {
  x: player.x,
  y: player.y,
  smoothing: 0.12,
  zoom: 1 / 1.32,
};
const baseCameraZoom = 1 / 1.32;
const fixedViewWorldHeight = 950;
const networkStateInterval = 1 / 20;
const crateHitboxScale = 0.78;

const keys = new Set();
const bullets = [];
const crates = [];
const pickups = [];
const previewPickups = [];
const previewCrates = [];
const mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  down: false,
  rightDown: false,
};
let width = 0;
let height = 0;
let lastTime = performance.now();
let crateRegenTimer = crateRespawnSeconds;
let audioContext = null;
const audioAssets = {
  glockShot: new Audio("assets/sounds/glock-shot.mp3"),
  glockReload: new Audio("assets/sounds/glock-reload.mp3"),
  awmShot: new Audio("assets/sounds/awm-shot.mp3"),
  awmReload: new Audio("assets/sounds/awm-reload.mp3"),
  knifeSwing: new Audio("assets/sounds/knife-swing.mp3"),
  knifeThrow: new Audio("assets/sounds/knife-throw.mp3"),
};
let draggedSlot = null;
let draggedSkillSlot = null;
let weaponPointerDrag = null;
let weaponDragPreview = null;
let upgradePanelDrag = null;
let suppressSlotClick = false;
let gameStarted = false;
let deathPending = false;
let localDeathTimeout = null;
let socket = null;
let localClientId = null;
let lastNetworkSend = 0;
let sharedWorldActive = false;
let nextLocalBulletId = 1;
let shopToastTimer = 0;
let activeAccount = null;
let saveTimer = 0;
let hitboxDebug = false;

const remotePlayers = new Map();
const remoteBullets = [];
const corpses = [];
const teleportEffects = [];
const lightningEffects = [];
const railburstEffects = [];
const staticCollapseEffects = [];
const staticCollapseProjectiles = [];
const arcPrisonEffects = [];
const stormRecallEffects = [];
const chatMessages = [];

function getCrateCount(kind) {
  return crates.filter((crate) => (crate.kind || "basic") === kind).length;
}

function getDistributedSpawnPoint(index, total, size) {
  const columns = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const cellWidth = world.width / columns;
  const cellHeight = world.height / rows;

  return {
    x: clamp((column + 0.18 + Math.random() * 0.64) * cellWidth, size, world.width - size),
    y: clamp((row + 0.18 + Math.random() * 0.64) * cellHeight, size, world.height - size),
  };
}

function spawnCrate(kind = "basic", distributedIndex = null, distributedTotal = 0) {
  const tier = crateTiers[kind] || crateTiers.basic;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const size = tier.size;
    const point = Number.isInteger(distributedIndex)
      ? getDistributedSpawnPoint(distributedIndex, distributedTotal, size)
      : { x: size + Math.random() * (world.width - size * 2), y: size + Math.random() * (world.height - size * 2) };
    const { x, y } = point;
    const distanceFromPlayer = Math.hypot(x - player.x, y - player.y);

    if (distanceFromPlayer < 280) {
      continue;
    }

    crates.push({
      x,
      y,
      size,
      hitboxSize: tier.hitboxSize,
      kind,
      rotation: Math.random() * Math.PI * 2,
      hp: tier.health,
      maxHp: tier.health,
    });
    return true;
  }

  return false;
}

function createCrates() {
  crates.length = 0;

  for (const kind of crateTierOrder) {
    const tier = crateTiers[kind];
    while (getCrateCount(kind) < tier.count) {
      spawnCrate(kind, getCrateCount(kind), tier.count);
    }
  }
}

function resetGameState({ preserveProgress = false } = {}) {
  const carriedProgress = preserveProgress ? {
    level: player.level,
    xp: player.xp,
    xpToNext: player.xpToNext,
    totalXp: player.totalXp,
    upgradePoints: player.upgradePoints,
    coins: player.coins,
  } : null;
  if (localDeathTimeout) {
    clearTimeout(localDeathTimeout);
    localDeathTimeout = null;
  }
  deathPending = false;
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.vx = 0;
  player.vy = 0;
  player.maxSpeed = baseStats.maxSpeed;
  player.acceleration = baseStats.acceleration;
  player.dashSpeed = baseStats.dashSpeed;
  player.maxHealth = baseStats.maxHealth;
  player.health = player.maxHealth;
  player.shield = 0;
  player.healAmount = baseStats.healAmount;
  player.coins = 0;
  player.knifeSwapTimer = 0;
  player.lightningThrustTimer = 0;
  player.lightningThrustActiveTimer = 0;
  player.knockbackTimer = 0;
  player.railburstTimer = 0;
  player.railburstChargeTimer = 0;
  player.railburstCharge = null;
  player.arcSlowTimer = 0;
  player.arcSlowStrength = 1;
  player.skillSlots = {
    f: null,
    q: null,
    g: null,
    e: null,
  };
  player.ownedSkills = [];
  player.skillCooldowns = {
    knifeRecall: 0,
    staticCollapse: 0,
    arcPrison: 0,
    stormRecall: 0,
    lightningThrust: 0,
    railburst: 0,
  };
  player.pendingStaticCollapse = [];
  player.staticCollapseHeld = false;
  player.staticCollapseCharging = false;
  player.staticCollapseCharge = 0;
  player.level = 1;
  player.xp = 0;
  player.totalXp = 0;
  player.xpToNext = 100;
  player.upgradePoints = 0;
  player.damageMultiplier = baseStats.damageMultiplier;
  player.upgrades = {
    speed: 0,
    dash: 0,
    health: 0,
    heal: 0,
    magnet: 0,
    damage: 0,
    reload: 0,
  };
  player.hurtTimer = 0;
  player.shotTimer = 0;
  player.swingTimer = 0;
  player.punchTimer = 0;
  player.knifeCharge = 0;
  player.knifeCharging = false;
  player.testMode = false;

  if (carriedProgress) {
    player.level = carriedProgress.level;
    player.xp = carriedProgress.xp;
    player.xpToNext = carriedProgress.xpToNext;
    player.totalXp = carriedProgress.totalXp;
    player.upgradePoints = carriedProgress.upgradePoints;
    player.coins = carriedProgress.coins;
  }

  camera.x = player.x;
  camera.y = player.y;
  bullets.length = 0;
  lightningEffects.length = 0;
  railburstEffects.length = 0;
  staticCollapseEffects.length = 0;
  arcPrisonEffects.length = 0;
  stormRecallEffects.length = 0;
  previewPickups.length = 0;
  previewCrates.length = 0;
  if (!sharedWorldActive) {
    pickups.length = 0;
  }
  keys.clear();
  mouse.down = false;
  mouse.rightDown = false;

  weapons.selectedSlot = 1;
  weapons.slots[1] = "knife";
  weapons.slots[2] = null;
  weapons.slots[3] = null;
  weapons.knife.count = 1;
  weapons.knife.damage = 25;
  weapons.knife.range = 82;
  weapons.knife.throwLifeBonus = 0;
  weapons.knife.throwSpeedBonus = 0;
  weapons.knife.upgrades = { range: 0, damage: 0, mag: 0, speed: 0 };
  weapons.glock.damage = 50;
  weapons.glock.bulletSpeed = 880;
  weapons.glock.bulletLife = 1.2;
  weapons.glock.magazineSize = 17;
  weapons.glock.ammo = 0;
  weapons.glock.magAmmo = 0;
  weapons.glock.reloadTimer = 0;
  weapons.glock.reloadTime = baseReloadTimes.glock;
  weapons.glock.upgrades = { range: 0, damage: 0, mag: 0, speed: 0 };
  weapons.awm.damage = 100;
  weapons.awm.bulletSpeed = 1500;
  weapons.awm.bulletLife = 4;
  weapons.awm.magazineSize = 6;
  weapons.awm.ammo = 0;
  weapons.awm.magAmmo = 0;
  weapons.awm.reloadTimer = 0;
  weapons.awm.reloadTime = baseReloadTimes.awm;
  weapons.awm.upgrades = { range: 0, damage: 0, mag: 0, speed: 0 };

  crateRegenTimer = crateRespawnSeconds;
  if (!sharedWorldActive) {
    createCrates();
  }
  updateInventory();
  updateXpHud();
  updateCoinHud();
  updateShopHud();
  updateSkillHud();
  updateLeaderboard();
  updateUpgradePanel();
}

function showStartScreen() {
  gameStarted = false;
  document.body.classList.add("game-pending");
  startScreen.classList.remove("hidden");
  restartScreen?.classList.add("hidden");
  updateSkillHud();
  updateUpgradePanel();
}

function showRestartScreen() {
  gameStarted = false;
  document.body.classList.add("game-pending");
  startScreen.classList.add("hidden");
  restartScreen?.classList.remove("hidden");
  if (restartXp) {
    restartXp.textContent = `XP kept ${Math.floor(player.totalXp)}`;
  }
  if (restartCoins) {
    restartCoins.textContent = `Coins kept ${Math.floor(player.coins)}`;
  }
  updateSkillHud();
  updateUpgradePanel();
}

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  camera.zoom = Math.max(baseCameraZoom, height / fixedViewWorldHeight);

  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerpAngle(current, target, amount) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * amount;
}

function circleHitsBox(circle, box) {
  const local = worldToCrateLocal(circle.x, circle.y, box);
  const dimensions = getCrateHitboxDimensions(box);
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;
  const closestX = clamp(local.x, -halfWidth, halfWidth);
  const closestY = clamp(local.y, -halfHeight, halfHeight);
  return Math.hypot(local.x - closestX, local.y - closestY) <= circle.radius;
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq <= 0) {
    return Math.hypot(x1 - cx, y1 - cy) <= radius;
  }

  const t = clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSq, 0, 1);
  const closestX = x1 + dx * t;
  const closestY = y1 + dy * t;
  return Math.hypot(closestX - cx, closestY - cy) <= radius;
}

function segmentHitsBox(x1, y1, x2, y2, box, radius = 0) {
  const start = worldToCrateLocal(x1, y1, box);
  const end = worldToCrateLocal(x2, y2, box);
  const dimensions = getCrateHitboxDimensions(box);
  const halfWidth = dimensions.width / 2 + radius;
  const halfHeight = dimensions.height / 2 + radius;
  const minX = -halfWidth;
  const maxX = halfWidth;
  const minY = -halfHeight;
  const maxY = halfHeight;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let tMin = 0;
  let tMax = 1;

  const clip = (start, delta, min, max) => {
    if (Math.abs(delta) < 0.00001) {
      return start >= min && start <= max;
    }

    const t1 = (min - start) / delta;
    const t2 = (max - start) / delta;
    const near = Math.min(t1, t2);
    const far = Math.max(t1, t2);
    tMin = Math.max(tMin, near);
    tMax = Math.min(tMax, far);
    return tMin <= tMax;
  };

  return clip(start.x, dx, minX, maxX) && clip(start.y, dy, minY, maxY);
}

function getBoxHitPoint(circle, box) {
  const local = worldToCrateLocal(circle.x, circle.y, box);
  const dimensions = getCrateHitboxDimensions(box);
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  return crateLocalToWorld(clamp(local.x, -halfWidth, halfWidth), clamp(local.y, -halfHeight, halfHeight), box);
}

function getCrateHitboxSize(crate) {
  const dimensions = getCrateHitboxDimensions(crate);
  return Math.max(dimensions.width, dimensions.height);
}

function getCrateSpriteScale(kind) {
  if (kind === "basic") return 1.65;
  if (kind === "metal") return 1.72;
  return 1.8;
}

function getCrateHitboxDimensions(crate) {
  const kind = crate.kind || "basic";
  const width = crate.size * getCrateSpriteScale(kind) * crateHitboxScale;
  const height = width * (crateSpriteRatios[kind] || 1);

  return { width, height };
}

function worldToCrateLocal(x, y, crate) {
  const angle = -(crate.rotation || 0);
  const dx = x - crate.x;
  const dy = y - crate.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

function crateLocalToWorld(x, y, crate) {
  const angle = crate.rotation || 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: crate.x + x * cos - y * sin,
    y: crate.y + x * sin + y * cos,
  };
}

function distanceToArcPrisonEdge(px, py, cx, cy, radius) {
  let minDistance = Infinity;

  for (let point = 0; point < 6; point += 1) {
    const angleA = -Math.PI / 2 + point * Math.PI / 3;
    const angleB = -Math.PI / 2 + (point + 1) * Math.PI / 3;
    const ax = cx + Math.cos(angleA) * radius;
    const ay = cy + Math.sin(angleA) * radius;
    const bx = cx + Math.cos(angleB) * radius;
    const by = cy + Math.sin(angleB) * radius;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1) : 0;
    const closestX = ax + dx * t;
    const closestY = ay + dy * t;
    minDistance = Math.min(minDistance, Math.hypot(px - closestX, py - closestY));
  }

  return minDistance;
}

function getPlayerDamageCapacity() {
  return Math.max(0, player.health) + Math.max(0, player.shield);
}

function getRemoteDamageCapacity(remote) {
  return Math.max(0, remote.health || 0) + Math.max(0, remote.shield || 0);
}

function applyBulletKnockback(damage, vx, vy) {
  const length = Math.hypot(vx, vy);

  if (length <= 0) {
    return;
  }

  const force = clamp(110 + damage * 3.2, 150, 620);
  player.vx += (vx / length) * force;
  player.vy += (vy / length) * force;
}

function addTeleportEffect(x, y, color = "#8df4df") {
  teleportEffects.push({
    x,
    y,
    color,
    startedAt: performance.now(),
    duration: 420,
  });
}

function addLightningThrustEffect(startX, startY, endX, endY, color = "#7cd7ff") {
  const angle = Math.atan2(endY - startY, endX - startX);
  const length = Math.hypot(endX - startX, endY - startY);
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);
  const points = [];
  const bolts = [];

  for (let index = 0; index <= 8; index += 1) {
    const t = index / 8;
    const jitter = (Math.random() - 0.5) * 38 * Math.sin(Math.PI * t);
    points.push({
      x: startX + Math.cos(angle) * length * t + normalX * jitter,
      y: startY + Math.sin(angle) * length * t + normalY * jitter,
    });
  }

  for (let bolt = 0; bolt < 7; bolt += 1) {
    const t = 0.16 + Math.random() * 0.72;
    const side = Math.random() < 0.5 ? -1 : 1;
    const span = 24 + Math.random() * 48;
    const x = startX + Math.cos(angle) * length * t;
    const y = startY + Math.sin(angle) * length * t;
    bolts.push({
      x1: x,
      y1: y,
      x2: x + normalX * side * span + Math.cos(angle) * (Math.random() - 0.5) * 40,
      y2: y + normalY * side * span + Math.sin(angle) * (Math.random() - 0.5) * 40,
    });
  }

  lightningEffects.push({
    points,
    bolts,
    color,
    startedAt: performance.now(),
    duration: 360,
  });
}

function addRailburstEffect(startX, startY, endX, endY, color = "#ffdf86") {
  const angle = Math.atan2(endY - startY, endX - startX);
  const length = Math.hypot(endX - startX, endY - startY);
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);
  const arcs = [];
  const streaks = [];

  for (let arc = 0; arc < 32; arc += 1) {
    const t = Math.random();
    const side = Math.random() < 0.5 ? -1 : 1;
    const spread = 34 + Math.random() * railburstWidth * 0.85;
    const x = startX + Math.cos(angle) * length * t;
    const y = startY + Math.sin(angle) * length * t;
    arcs.push({
      x1: x,
      y1: y,
      x2: x + normalX * side * spread + Math.cos(angle) * (Math.random() - 0.5) * 92,
      y2: y + normalY * side * spread + Math.sin(angle) * (Math.random() - 0.5) * 92,
    });
  }

  for (let streak = 0; streak < 22; streak += 1) {
    const t = Math.random() * 0.92;
    const sideOffset = (Math.random() - 0.5) * railburstWidth * 0.72;
    const streakLength = 120 + Math.random() * 280;
    const x = startX + Math.cos(angle) * length * t + normalX * sideOffset;
    const y = startY + Math.sin(angle) * length * t + normalY * sideOffset;
    streaks.push({
      x1: x,
      y1: y,
      x2: x + Math.cos(angle) * streakLength,
      y2: y + Math.sin(angle) * streakLength,
      width: 2 + Math.random() * 5,
    });
  }

  railburstEffects.push({
    startX,
    startY,
    endX,
    endY,
    arcs,
    streaks,
    color,
    startedAt: performance.now(),
    duration: 560,
  });
}

function getScaledDamage(baseDamage) {
  return Math.max(1, Math.round(baseDamage * player.damageMultiplier));
}

function getDeathXpDrop() {
  return Math.max(25, Math.round(player.totalXp * 0.7));
}

function getDeathCoinDrop() {
  return Math.max(0, Math.round(player.coins * 0.7));
}

function setProgressFromTotalXp(totalXp) {
  let remaining = Math.max(0, Math.round(totalXp));
  let level = 1;
  let xpToNext = 100;

  while (remaining >= xpToNext) {
    remaining -= xpToNext;
    level += 1;
    xpToNext = Math.round(100 + (level - 1) * 55);
  }

  player.level = level;
  player.xp = remaining;
  player.xpToNext = xpToNext;
  player.totalXp = Math.max(0, Math.round(totalXp));
  player.upgradePoints = Math.max(0, level - 1);
}

function getXpDropValues(totalValue) {
  let remaining = Math.max(0, Math.round(totalValue));
  const values = [];

  if (remaining > 0) {
    values.push(remaining);
  }

  return values;
}

function getCoinDropEntries(totalValue) {
  let remaining = Math.max(0, Math.round(totalValue));
  const entries = [];

  for (const [coinKind, value] of [["bigBill", coinValues.bigBill], ["bill", coinValues.bill], ["gold", coinValues.gold], ["silver", coinValues.silver], ["bronze", coinValues.bronze]]) {
    while (remaining >= value) {
      entries.push({ coinKind, value });
      remaining -= value;
    }
  }

  if (remaining > 0) {
    entries.push({ coinKind: "bronze", value: remaining });
  }

  return entries;
}

function spawnXpTierPreviews() {
  previewPickups.length = 0;
  [xpDropValue, metalCrateXpValue, goldCrateXpValue, novaXpValue, astralXpValue].forEach((value, index) => {
    previewPickups.push({
      x: player.x - 144 + index * 72,
      y: player.y - 92,
      type: "xp",
      value,
      radius: 18,
      bob: Math.random() * Math.PI * 2,
      preview: true,
    });
  });
}

function spawnCrateTierPreviews() {
  previewCrates.length = 0;
  crateTierOrder.forEach((kind, index) => {
    previewCrates.push({
      x: player.x - 176 + index * 88,
      y: player.y + 112,
      size: crateTiers[kind].size,
      kind,
      rotation: kind === "basic" ? -0.2 : -0.16,
      hp: 1,
      maxHp: 1,
      preview: true,
    });
  });
}

function gainXp(amount) {
  const gained = Math.max(0, Math.round(amount));
  player.xp += gained;
  player.totalXp += gained;

  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.upgradePoints += 1;
    player.xpToNext = Math.round(100 + (player.level - 1) * 55);
  }

  updateXpHud();
  updateLeaderboard();
  updateSkillHud();
  updateShopHud();
  sendNetwork("state", { state: getPlayerSnapshot() });
  updateUpgradePanel();
}

function applyUpgrade(type) {
  if (player.upgradePoints <= 0 || !upgradeSteps[type]) {
    return;
  }

  const step = upgradeSteps[type];
  player.upgradePoints -= 1;
  player.upgrades[type] += 1;

  if (step.maxSpeed) {
    player.maxSpeed += step.maxSpeed;
  }

  if (step.acceleration) {
    player.acceleration += step.acceleration;
  }

  if (step.dashSpeed) {
    player.dashSpeed += step.dashSpeed;
  }

  if (step.maxHealth) {
    player.maxHealth += step.maxHealth;
    player.health = Math.min(player.maxHealth, player.health + step.maxHealth);
  }

  if (step.damageMultiplier) {
    player.damageMultiplier = Number((player.damageMultiplier + step.damageMultiplier).toFixed(2));
  }

  if (step.reloadReduction) {
    updateReloadTimes();
  }

  updateXpHud();
  updateUpgradePanel();
}

function updateReloadTimes() {
  const reloadLevel = player.upgrades.reload || 0;
  const multiplier = Math.max(0.5, 1 - reloadLevel * upgradeSteps.reload.reloadReduction);
  weapons.glock.reloadTime = Number((baseReloadTimes.glock * multiplier).toFixed(2));
  weapons.awm.reloadTime = Number((baseReloadTimes.awm * multiplier).toFixed(2));
}

function updateXpHud() {
  if (!xpStatus || !xpBarFill) {
    return;
  }

  xpStatus.textContent = `Lv ${player.level} | XP ${Math.floor(player.xp)} / ${player.xpToNext}`;
  xpBarFill.style.width = `${clamp(player.xp / player.xpToNext, 0, 1) * 100}%`;
}

function updateCoinHud() {
  if (!coinStatus) {
    return;
  }

  coinStatus.textContent = `Coins ${player.coins}`;
}

function updateShopHud() {
  if (shopCoins) {
    shopCoins.textContent = `Coins ${player.coins}`;
  }

  shopPanel?.querySelectorAll("button[data-action='buy'], button[data-action='sell']").forEach((button) => {
    const item = button.dataset.item;
    const action = button.dataset.action;
    const unit = getTradeUnit(item);
    const price = shopPrices[item]?.[action] || 0;
    const unitLabel = item === "knife" ? "1" : `${unit} ammo`;
    button.textContent = `${action === "buy" ? "Buy" : "Sell"} ${unitLabel} | ${price}`;
  });

  shopPanel?.querySelectorAll("button[data-action='upgrade']").forEach((button) => {
    const item = button.dataset.item;
    const stat = button.dataset.stat;
    const level = weapons[item]?.upgrades?.[stat] || 0;
    const price = getUpgradePrice(item, stat);
    const row = button.closest(".shop-upgrade-row");
    renderUpgradeBar(row, level);
    const levelLabel = row?.querySelector(".shop-upgrade-level");

    if (levelLabel) {
      levelLabel.textContent = `Lv ${level}`;
    }

    button.textContent = `Buy ${price}`;
  });

  shopPanel?.querySelectorAll("button[data-action='ability']").forEach((button) => {
    const ability = button.dataset.ability;
    const level = player.upgrades[ability] || 0;
    const price = getAbilityPrice(ability);
    button.textContent = `Lv ${level} | Buy ${price}`;
  });

  shopPanel?.querySelectorAll(".shop-skill-row").forEach((row) => {
    const skill = row.dataset.shopSkill;
    const owned = player.ownedSkills.includes(skill);
    const equipped = Object.values(player.skillSlots).includes(skill);
    const skillsUnlocked = hasAnyUnlockedSkillSlot();

    row.classList.toggle("owned", owned);
    row.classList.toggle("equipped", equipped);
    row.classList.toggle("locked", !skillsUnlocked);
    row.setAttribute(
      "title",
      !skillsUnlocked
        ? "Unlock your first skill slot at Lv 25"
        : owned
        ? equipped
          ? "Already equipped"
          : "Click to equip this skill to an empty slot"
        : "Buy this skill first"
    );
  });

  shopPanel?.querySelectorAll("button[data-action='skill']").forEach((button) => {
    const skill = button.dataset.skill;
    const owned = player.ownedSkills.includes(skill);
    const skillsUnlocked = hasAnyUnlockedSkillSlot();
    button.textContent = owned ? "Owned" : skillsUnlocked ? `Buy ${skillShopPrices[skill] || 9999}` : "Lv 25";
    button.disabled = owned || !skillsUnlocked;
  });
}

function renderUpgradeBar(row, level) {
  const bar = row?.querySelector(".shop-upgrade-bar");
  if (!bar) {
    return;
  }

  if (bar.children.length !== 10) {
    bar.innerHTML = Array.from({ length: 10 }, () => "<span></span>").join("");
  }

  [...bar.children].forEach((pip, index) => {
    pip.classList.toggle("filled", index < Math.min(level, 10));
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function sanitizeChatText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function addChatMessage({ name = "Player", text = "", id = null, local = false }) {
  const cleanText = sanitizeChatText(text);

  if (!cleanText) {
    return;
  }

  const message = {
    id,
    name: String(name || "Player").slice(0, 18),
    text: cleanText,
    local,
    createdAt: performance.now(),
  };

  chatMessages.push(message);
  while (chatMessages.length > maxChatMessages) {
    chatMessages.shift();
  }

  if (id === localClientId || local) {
    player.chatBubble = { text: cleanText, createdAt: message.createdAt };
  } else if (id && remotePlayers.has(id)) {
    remotePlayers.get(id).chatBubble = { text: cleanText, createdAt: message.createdAt };
  }

  updateChatLog();
}

function updateChatLog() {
  if (!chatLog) {
    return;
  }

  const now = performance.now();
  const visible = chatMessages.filter((message) => now - message.createdAt <= chatMessageLifetime);
  chatLog.innerHTML = visible
    .slice(-8)
    .map((message) => `<div class="chat-line"><b>${escapeHtml(message.name)}</b>: ${escapeHtml(message.text)}</div>`)
    .join("");
}

function submitChat() {
  const text = sanitizeChatText(chatInput?.value);

  if (!text || !gameStarted) {
    return;
  }

  if (chatInput) {
    chatInput.value = "";
    chatInput.blur();
  }

  if (text === "!@#") {
    activateTestMode();
    return;
  }

  const payload = { name: player.name || "Player", text };
  addChatMessage({ ...payload, id: localClientId, local: true });
  sendNetwork("chat", payload);
}

function activateTestMode() {
  // TODO: Remove this test shortcut before public launch.
  player.testMode = true;
  player.coins = 100000;
  player.level = 100;
  player.xp = 0;
  player.xpToNext = Math.round(100 + (player.level - 1) * 55);
  player.totalXp = Math.max(player.totalXp, 100000);
  player.upgradePoints = Math.max(player.upgradePoints, 99);

  weapons.selectedSlot = 1;
  weapons.slots[1] = "knife";
  weapons.slots[2] = "glock";
  weapons.slots[3] = "awm";
  weapons.knife.count = 1000;
  weapons.glock.magAmmo = weapons.glock.magazineSize;
  weapons.glock.ammo = 1000;
  weapons.glock.reloadTimer = 0;
  weapons.awm.magAmmo = weapons.awm.magazineSize;
  weapons.awm.ammo = 1000;
  weapons.awm.reloadTimer = 0;

  updateCoinHud();
  updateXpHud();
  updateInventory();
  updateUpgradePanel();
  updateLeaderboard();
  addChatMessage({ name: "System", text: "Test mode activated.", local: true });
  sendNetwork("state", { state: getPlayerSnapshot() });
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function updateAccountUi() {
  if (!accountStatus) {
    return;
  }

  const clientId = window.CORE_DRIFT_GOOGLE_CLIENT_ID || "";

  if (activeAccount?.id !== "guest") {
    const storageLabel = activeAccount.serverStorage ? "server saved" : "local saved";
    accountStatus.textContent = `Signed in: ${activeAccount.name || activeAccount.email} | ${storageLabel}`;
    accountSignOut?.classList.remove("hidden");
  } else {
    accountStatus.textContent = clientId ? "Guest profile" : "Google sign-in needs a client ID.";
    accountSignOut?.classList.add("hidden");
  }
}

function setActiveAccount(account) {
  activeAccount = account || { id: "guest", name: "Guest" };
  localStorage.setItem(accountStorageKey, JSON.stringify(activeAccount));
  updateAccountUi();
}

async function postJson(url, body, token = "") {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function authenticateGoogle(credential) {
  const result = await postJson("/api/auth/google", { credential });
  setActiveAccount({
    ...result.account,
    token: result.token,
    serverStorage: Boolean(result.serverStorage),
  });

  if (result.profile) {
    applyCharacterProfile(result.profile);
  }

  return result;
}

function captureCharacterProfile() {
  return {
    name: player.name,
    level: player.level,
    xp: player.xp,
    xpToNext: player.xpToNext,
    totalXp: player.totalXp,
    coins: player.coins,
    upgradePoints: player.upgradePoints,
    maxSpeed: player.maxSpeed,
    acceleration: player.acceleration,
    dashSpeed: player.dashSpeed,
    maxHealth: player.maxHealth,
    health: Math.max(1, player.health),
    shield: player.shield,
    skillSlots: { ...player.skillSlots },
    ownedSkills: [...player.ownedSkills],
    healAmount: player.healAmount,
    damageMultiplier: player.damageMultiplier,
    upgrades: { ...player.upgrades },
    selectedSlot: weapons.selectedSlot,
    slots: { ...weapons.slots },
    weapons: {
      knife: {
        count: weapons.knife.count,
        damage: weapons.knife.damage,
        range: weapons.knife.range,
        throwLifeBonus: weapons.knife.throwLifeBonus,
        throwSpeedBonus: weapons.knife.throwSpeedBonus,
        upgrades: { ...weapons.knife.upgrades },
      },
      glock: {
        damage: weapons.glock.damage,
        bulletSpeed: weapons.glock.bulletSpeed,
        bulletLife: weapons.glock.bulletLife,
        magazineSize: weapons.glock.magazineSize,
        ammo: weapons.glock.ammo,
        magAmmo: weapons.glock.magAmmo,
        upgrades: { ...weapons.glock.upgrades },
      },
      awm: {
        damage: weapons.awm.damage,
        bulletSpeed: weapons.awm.bulletSpeed,
        bulletLife: weapons.awm.bulletLife,
        magazineSize: weapons.awm.magazineSize,
        ammo: weapons.awm.ammo,
        magAmmo: weapons.awm.magAmmo,
        upgrades: { ...weapons.awm.upgrades },
      },
    },
  };
}

function applyCharacterProfile(profile) {
  if (!profile) {
    return;
  }

  player.name = profile.name || player.name;
  player.level = profile.level || 1;
  player.xp = profile.xp || 0;
  player.xpToNext = profile.xpToNext || 100;
  player.totalXp = profile.totalXp || 0;
  player.coins = profile.coins || 0;
  player.upgradePoints = profile.upgradePoints || 0;
  player.maxSpeed = profile.maxSpeed || baseStats.maxSpeed;
  player.acceleration = profile.acceleration || baseStats.acceleration;
  player.dashSpeed = profile.dashSpeed || baseStats.dashSpeed;
  player.maxHealth = profile.maxHealth || baseStats.maxHealth;
  player.health = Math.min(profile.health || player.maxHealth, player.maxHealth);
  player.shield = Math.min(profile.shield || 0, player.maxShield);
  player.skillSlots = { ...player.skillSlots, ...(profile.skillSlots || {}) };
  player.ownedSkills = profile.ownedSkills || player.ownedSkills;
  for (const slotKey of skillSlotKeys) {
    if (!isSkillSlotUnlocked(slotKey)) {
      player.skillSlots[slotKey] = null;
    }
  }
  player.healAmount = profile.healAmount || baseStats.healAmount;
  player.damageMultiplier = profile.damageMultiplier || baseStats.damageMultiplier;
  player.upgrades = { ...player.upgrades, ...(profile.upgrades || {}) };
  updateReloadTimes();

  weapons.selectedSlot = profile.selectedSlot || 1;
  weapons.slots = { ...weapons.slots, ...(profile.slots || {}) };

  for (const weaponName of ["knife", "glock", "awm"]) {
    if (profile.weapons?.[weaponName]) {
      Object.assign(weapons[weaponName], profile.weapons[weaponName]);
      weapons[weaponName].reloadTimer = 0;
    }
  }

  if (nicknameInput) {
    nicknameInput.value = player.name;
  }
  updateInventory();
  updateXpHud();
  updateCoinHud();
  updateShopHud();
  updateUpgradePanel();
}

async function loadCharacterProfile() {
  if (!activeAccount?.token) {
    return;
  }

  try {
    const response = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${activeAccount.token}` },
    });

    if (response.ok) {
      const data = await response.json();
      activeAccount.serverStorage = Boolean(data.serverStorage);
      localStorage.setItem(accountStorageKey, JSON.stringify(activeAccount));
      updateAccountUi();
      if (data.profile) {
        applyCharacterProfile(data.profile);
      }
    }
  } catch {
    activeAccount.serverStorage = false;
    updateAccountUi();
  }
}

async function saveCharacterProfile() {
  if (!gameStarted || deathPending) {
    return;
  }

  const profile = captureCharacterProfile();

  if (activeAccount?.token) {
    try {
      const result = await postJson("/api/profile", { profile }, activeAccount.token);
      activeAccount.serverStorage = Boolean(result.serverStorage);
      localStorage.setItem(accountStorageKey, JSON.stringify(activeAccount));
      updateAccountUi();
    } catch {
      activeAccount.serverStorage = false;
      updateAccountUi();
    }
  }
}

function saveRespawnProfileAfterDeath() {
  resetDeathProgressState();
  const profile = captureCharacterProfile();
  if (activeAccount?.token) {
    postJson("/api/profile", { profile }, activeAccount.token).catch(() => {});
  }
}

function resetDeathProgressState() {
  const keptCoins = Math.max(0, player.coins - getDeathCoinDrop());
  const keptTotalXp = Math.max(0, Math.round(player.totalXp * 0.3));
  player.coins = keptCoins;
  setProgressFromTotalXp(keptTotalXp);
  player.maxSpeed = baseStats.maxSpeed;
  player.acceleration = baseStats.acceleration;
  player.dashSpeed = baseStats.dashSpeed;
  player.maxHealth = baseStats.maxHealth;
  player.health = player.maxHealth;
  player.shield = 0;
  player.healAmount = baseStats.healAmount;
  player.damageMultiplier = baseStats.damageMultiplier;
  player.upgrades = {
    speed: 0,
    dash: 0,
    health: 0,
    heal: 0,
    magnet: 0,
    damage: 0,
    reload: 0,
  };

  weapons.selectedSlot = 1;
  weapons.slots[1] = "knife";
  weapons.slots[2] = null;
  weapons.slots[3] = null;
  weapons.knife.count = 1;
  weapons.knife.damage = 25;
  weapons.knife.range = 82;
  weapons.knife.throwLifeBonus = 0;
  weapons.knife.throwSpeedBonus = 0;
  weapons.knife.upgrades = { range: 0, damage: 0, mag: 0, speed: 0 };
  weapons.glock.damage = 50;
  weapons.glock.bulletSpeed = 880;
  weapons.glock.bulletLife = 1.2;
  weapons.glock.magazineSize = 17;
  weapons.glock.ammo = 0;
  weapons.glock.magAmmo = 0;
  weapons.glock.reloadTimer = 0;
  weapons.glock.reloadTime = baseReloadTimes.glock;
  weapons.glock.upgrades = { range: 0, damage: 0, mag: 0, speed: 0 };
  weapons.awm.damage = 100;
  weapons.awm.bulletSpeed = 1500;
  weapons.awm.bulletLife = 4;
  weapons.awm.magazineSize = 6;
  weapons.awm.ammo = 0;
  weapons.awm.magAmmo = 0;
  weapons.awm.reloadTimer = 0;
  weapons.awm.reloadTime = baseReloadTimes.awm;
  weapons.awm.upgrades = { range: 0, damage: 0, mag: 0, speed: 0 };
  updateInventory();
  updateXpHud();
  updateUpgradePanel();
}

async function initAccountSystem() {
  try {
    activeAccount = JSON.parse(localStorage.getItem(accountStorageKey) || "null") || { id: "guest", name: "Guest" };
  } catch {
    activeAccount = { id: "guest", name: "Guest" };
  }

  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const config = await response.json();
      if (config.googleClientId) {
        window.CORE_DRIFT_GOOGLE_CLIENT_ID = config.googleClientId;
      }
    }
  } catch {
    // File mode or offline local testing keeps the inline fallback.
  }

  updateAccountUi();

  const clientId = window.CORE_DRIFT_GOOGLE_CLIENT_ID || "";
  if (!clientId || !googleSignIn) {
    return;
  }

  const renderGoogleButton = () => {
    if (!window.google?.accounts?.id) {
      return false;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        const profile = decodeJwtPayload(response.credential);
        try {
          await authenticateGoogle(response.credential);
        } catch {
          if (profile?.sub) {
            setActiveAccount({
              id: `google:${profile.sub}`,
              name: profile.name || profile.email || "Google Player",
              email: profile.email || "",
              serverStorage: false,
            });
          }
        }

        if (!profile?.sub) {
          return;
        }

        if (nicknameInput && profile.name && (!nicknameInput.value || nicknameInput.value === "Player")) {
          nicknameInput.value = profile.name.slice(0, 14);
        }
        await loadCharacterProfile();
      },
    });
    window.google.accounts.id.renderButton(googleSignIn, {
      theme: "outline",
      size: "large",
      width: 260,
    });
    return true;
  };

  if (!renderGoogleButton()) {
    window.addEventListener("load", renderGoogleButton, { once: true });
  }
}

function drawChatBubble(text, yOffset) {
  const cleanText = sanitizeChatText(text);

  if (!cleanText) {
    return;
  }

  ctx.save();
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  const bubbleWidth = Math.min(230, Math.max(58, ctx.measureText(cleanText).width + 20));
  ctx.fillStyle = "rgba(16, 18, 20, 0.78)";
  ctx.strokeStyle = "rgba(141, 244, 223, 0.38)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-bubbleWidth / 2, yOffset - 22, bubbleWidth, 20, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6f2e9";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cleanText, 0, yOffset - 12, bubbleWidth - 14);
  ctx.restore();
}

function updateLeaderboard() {
  if (!leaderboard) {
    return;
  }

  const rows = [
    { name: player.name, score: player.totalXp || 0 },
    ...[...remotePlayers.values()].map((remote) => ({
      name: remote.name || "Player",
      score: remote.totalXp || 0,
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  leaderboard.innerHTML = `<div class="leaderboard-title">Ranking</div>${rows
    .map((row, index) => `<div class="leaderboard-row"><span>${index + 1}. ${escapeHtml(row.name)}</span><b>${Math.floor(row.score)}</b></div>`)
    .join("")}`;
}

function isKnifeSkillUsable(skill) {
  return !skillDefinitions[skill]?.requiresKnife || (weapons.slots[weapons.selectedSlot] === "knife" && weapons.knife.count > 0);
}

function updateSkillHud() {
  for (const slotKey of skillSlotKeys) {
    const element = skillSlotElements[slotKey];
    const skill = player.skillSlots[slotKey];
    const definition = skillDefinitions[skill];
    const unlocked = isSkillSlotUnlocked(slotKey);
    const unlockLevel = skillSlotUnlockLevels[slotKey];

    if (!element) {
      continue;
    }

    const icon = element.querySelector(".equipped-skill-icon");
    const name = element.querySelector(".skill-name");
    const cooldown = element.querySelector(".skill-cooldown");
    const clearButton = element.querySelector(".skill-clear");
    const cooldownValue = skill ? player.skillCooldowns[skill] || 0 : 0;
    const charging = (skill === "railburst" && player.railburstCharge) || (skill === "staticCollapse" && player.staticCollapseHeld);
    const knifeLocked = Boolean(skill && definition?.requiresKnife && !isKnifeSkillUsable(skill));

    element.classList.toggle("ready", Boolean(unlocked && skill && cooldownValue <= 0 && !charging && !knifeLocked));
    element.classList.toggle("empty", !skill);
    element.classList.toggle("level-locked", !unlocked);
    element.classList.toggle("knife-locked", knifeLocked);
    element.setAttribute("aria-label", `${slotKey.toUpperCase()} skill ${unlocked ? definition?.label || "Empty" : `Locked until level ${unlockLevel}`}`);
    element.draggable = Boolean(unlocked && skill);
    if (icon) {
      icon.className = `equipped-skill-icon ${definition?.icon || ""}`;
    }
    if (name) {
      name.textContent = unlocked ? definition?.label || "Empty" : `Lv ${unlockLevel}`;
    }
    if (cooldown) {
      cooldown.textContent = !unlocked || !skill ? "" : knifeLocked ? "Only Knife" : charging ? "..." : cooldownValue > 0 ? Math.ceil(cooldownValue) : "";
    }
    if (clearButton) {
      clearButton.classList.toggle("hidden", !unlocked || !skill);
    }
  }
}

function isNearShopDoor() {
  return Math.abs(player.x - shopDoor.x) <= 90 && Math.abs(player.y - shopDoor.y) <= shopDoor.height / 2 + 60;
}

function isNearShopNpc() {
  return Math.hypot(player.x - shopNpc.x, player.y - shopNpc.y) <= shopNpc.radius + player.radius + 34;
}

function interact() {
  if (isNearShopNpc()) {
    openShop();
    return;
  }

  if (!isNearShopDoor()) {
    return;
  }

  addTeleportEffect(player.x, player.y, "#ff6f8f");

  if (player.x >= 0) {
    player.x = -170;
  } else {
    player.x = 80;
  }

  player.y = shopDoor.y;
  player.vx = 0;
  player.vy = 0;
  addTeleportEffect(player.x, player.y, "#ff6f8f");
  sendNetwork("state", { state: getPlayerSnapshot() });
}

function openShop() {
  if (!shopPanel) {
    return;
  }

  shopPanel.classList.remove("hidden");
  document.body.classList.add("shop-open");
  updateShopHud();
  updateSkillHud();
  setShopMessage("Choose an item or upgrade.");
}

function closeShop() {
  shopPanel?.classList.add("hidden");
  document.body.classList.remove("shop-open");
  updateSkillHud();
}

function isShopOpen() {
  return Boolean(shopPanel && !shopPanel.classList.contains("hidden"));
}

function setShopMessage(text) {
  if (shopMessage) {
    shopMessage.textContent = text;
  }
}

function getUpgradePrice(item, stat) {
  const base = shopUpgradePrices[item]?.[stat] || 9999;
  const level = weapons[item]?.upgrades?.[stat] || 0;
  return Math.round(base * (1 + level * 0.65));
}

function getAbilityPrice(ability) {
  const base = shopAbilityPrices[ability] || 9999;
  const level = player.upgrades[ability] || 0;
  return Math.round(base * (1 + level * 0.7));
}

function getPassiveMagnetLevel() {
  return player.upgrades.magnet || 0;
}

function getPassiveMagnetRange() {
  const level = getPassiveMagnetLevel();
  return level > 0 ? magnetBaseRange + (level - 1) * magnetRangePerLevel : 0;
}

function getPassiveMagnetSpeed() {
  const level = getPassiveMagnetLevel();
  return level > 0 ? magnetBaseSpeed + (level - 1) * magnetSpeedPerLevel : 0;
}

function getTradeUnit(item) {
  if (item === "glock") {
    return 17;
  }

  if (item === "awm") {
    return 6;
  }

  return 1;
}

function getWeaponAmmoTotal(item) {
  if (item !== "glock" && item !== "awm") {
    return 0;
  }

  return weapons[item].ammo + weapons[item].magAmmo;
}

function removeAmmoForSale(item, amount) {
  if (getWeaponAmmoTotal(item) < amount) {
    return false;
  }

  const reserveUsed = Math.min(weapons[item].ammo, amount);
  weapons[item].ammo -= reserveUsed;

  const fromMagazine = amount - reserveUsed;
  if (fromMagazine > 0) {
    weapons[item].magAmmo = Math.max(0, weapons[item].magAmmo - fromMagazine);
  }

  if (getWeaponAmmoTotal(item) <= 0) {
    const slot = [1, 2, 3].find((candidate) => weapons.slots[candidate] === item);
    if (slot) {
      weapons.slots[slot] = null;
    }
    weapons[item].ammo = 0;
    weapons[item].magAmmo = 0;
    weapons[item].reloadTimer = 0;
  }

  return true;
}

function buyShopItem(item) {
  const price = shopPrices[item]?.buy;

  if (!price || player.coins < price) {
    setShopMessage("Not enough coins.");
    return;
  }

  const unit = getTradeUnit(item);
  const pickup =
    item === "knife"
      ? { type: "knife", count: 1 }
      : { type: item, ammo: unit, magAmmo: 0 };

  if (!addWeaponToInventory(pickup)) {
    setShopMessage("Inventory full.");
    return;
  }

  player.coins -= price;
  updateInventory();
  updateCoinHud();
  updateShopHud();
  setShopMessage(`${getWeaponDisplay(item).label} purchased.`);
}

function buyWeaponUpgrade(item, stat) {
  const price = getUpgradePrice(item, stat);

  if (!shopUpgradePrices[item]?.[stat] || !weapons[item]?.upgrades || player.coins < price) {
    setShopMessage("Not enough coins.");
    return;
  }

  player.coins -= price;
  weapons[item].upgrades[stat] += 1;

  if (stat === "range") {
    if (item === "knife") {
      weapons.knife.range += 8;
      weapons.knife.throwLifeBonus += 0.08;
    } else {
      weapons[item].bulletLife += item === "awm" ? 0.35 : 0.18;
    }
  } else if (stat === "damage") {
    weapons[item].damage += item === "awm" ? 15 : item === "glock" ? 8 : 5;
  } else if (stat === "speed") {
    if (item === "knife") {
      weapons.knife.throwSpeedBonus += 45;
    } else {
      weapons[item].bulletSpeed += item === "awm" ? 110 : 70;
    }
  } else if (stat === "mag") {
    const increase = item === "awm" ? 1 : 3;
    weapons[item].magazineSize += increase;
    weapons[item].ammo += increase;
  }

  updateInventory();
  updateCoinHud();
  updateShopHud();
  setShopMessage(`${getWeaponDisplay(item).label} ${stat} upgraded.`);
}

function buyAbilityUpgrade(ability) {
  const price = getAbilityPrice(ability);

  if (player.coins < price) {
    setShopMessage("Not enough coins.");
    return;
  }

  if (ability === "heal") {
    player.coins -= price;
    player.upgrades.heal += 1;
    player.healAmount += 15;
    updateCoinHud();
    updateShopHud();
    setShopMessage("Heal Power upgraded.");
  } else if (ability === "magnet") {
    player.coins -= price;
    player.upgrades.magnet += 1;
    updateCoinHud();
    updateShopHud();
    setShopMessage("Magnet upgraded.");
  }
}

function getSkillSlotForSkill(skill) {
  return skillSlotKeys.find((candidate) => player.skillSlots[candidate] === skill) || null;
}

function isSkillSlotUnlocked(slotKey) {
  return player.level >= (skillSlotUnlockLevels[slotKey] || Infinity);
}

function hasAnyUnlockedSkillSlot() {
  return skillSlotKeys.some((slotKey) => isSkillSlotUnlocked(slotKey));
}

function getEmptySkillSlot() {
  return skillSlotKeys.find((candidate) => isSkillSlotUnlocked(candidate) && !player.skillSlots[candidate]) || null;
}

function equipSkill(skill) {
  if (!hasAnyUnlockedSkillSlot()) {
    setShopMessage("Unlock your first skill slot at Lv 25.");
    return null;
  }

  if (!player.ownedSkills.includes(skill)) {
    setShopMessage("Buy this skill first.");
    return null;
  }

  const existingSlot = getSkillSlotForSkill(skill);
  if (existingSlot) {
    setShopMessage(`${skillDefinitions[skill].label} is already on ${existingSlot.toUpperCase()}.`);
    return existingSlot;
  }

  const slot = getEmptySkillSlot();
  if (!slot) {
    setShopMessage("Clear a skill slot first.");
    return null;
  }

  player.skillSlots[slot] = skill;
  updateSkillHud();
  updateShopHud();
  return slot;
}

function clearSkillSlot(slotKey) {
  if (!isSkillSlotUnlocked(slotKey)) {
    return;
  }

  if (!player.skillSlots[slotKey]) {
    return;
  }

  player.skillSlots[slotKey] = null;
  updateSkillHud();
  updateShopHud();
}

function swapSkillSlots(fromSlot, toSlot) {
  if (!isSkillSlotUnlocked(fromSlot) || !isSkillSlotUnlocked(toSlot)) {
    return;
  }

  if (!fromSlot || !toSlot || fromSlot === toSlot) {
    return;
  }

  const fromSkill = player.skillSlots[fromSlot];
  player.skillSlots[fromSlot] = player.skillSlots[toSlot];
  player.skillSlots[toSlot] = fromSkill;
  updateSkillHud();
  updateShopHud();
}

function handleShopSkillClick(skill) {
  if (!skillDefinitions[skill]) {
    return;
  }

  if (!hasAnyUnlockedSkillSlot()) {
    setShopMessage("Unlock your first skill slot at Lv 25.");
    return;
  }

  if (!player.ownedSkills.includes(skill)) {
    setShopMessage("Buy this skill first.");
    return;
  }

  const slot = equipSkill(skill);
  if (slot) {
    setShopMessage(`${skillDefinitions[skill].label} equipped to ${slot.toUpperCase()}.`);
  }
}

function buyShopSkill(skill) {
  const price = skillShopPrices[skill];

  if (!price || !skillDefinitions[skill]) {
    return;
  }

  if (!hasAnyUnlockedSkillSlot()) {
    setShopMessage("Unlock your first skill slot at Lv 25.");
    return;
  }

  if (player.ownedSkills.includes(skill)) {
    setShopMessage("Skill already owned.");
    return;
  }

  if (player.coins < price) {
    setShopMessage("Not enough coins.");
    return;
  }

  player.coins -= price;
  player.ownedSkills.push(skill);
  updateCoinHud();
  updateShopHud();
  setShopMessage(`${skillDefinitions[skill].label} purchased. Click its icon to equip.`);
}

function sellShopItem(item) {
  const price = shopPrices[item]?.sell;

  if (!price || ![1, 2, 3].find((slot) => weapons.slots[slot] === item)) {
    setShopMessage("Nothing to sell.");
    return;
  }

  if (item === "knife") {
    weapons.knife.count -= 1;
    if (weapons.knife.count <= 0) {
      const slot = [1, 2, 3].find((candidate) => weapons.slots[candidate] === "knife");
      if (slot) weapons.slots[slot] = null;
      weapons.knife.count = 0;
    }
  } else {
    const unit = getTradeUnit(item);
    if (!removeAmmoForSale(item, unit)) {
      setShopMessage(`Need ${unit} ammo to sell.`);
      return;
    }
  }

  if (!weapons.slots[weapons.selectedSlot]) {
    weapons.selectedSlot = [1, 2, 3].find((slot) => weapons.slots[slot]) || weapons.selectedSlot;
  }

  player.coins += price;
  updateInventory();
  updateCoinHud();
  updateShopHud();
  setShopMessage(`${getWeaponDisplay(item).label} sold.`);
}

function updateUpgradePanel() {
  if (!upgradePanel) {
    return;
  }

  if (upgradePointsLabel) {
    upgradePointsLabel.textContent = `Points ${player.upgradePoints}`;
  }

  for (const button of upgradeButtons) {
    const type = button.dataset.upgrade;
    const value = button.querySelector("b");

    if (value) {
      value.textContent = `${value.dataset.base} | Lv ${player.upgrades[type] || 0}`;
    }
  }

  upgradePanel.classList.toggle("hidden", !gameStarted || player.upgradePoints <= 0);
}

function placeUpgradePanel(left, top) {
  if (!upgradePanel) {
    return;
  }

  const width = upgradePanel.offsetWidth || 190;
  const height = upgradePanel.offsetHeight || 220;
  const nextLeft = clamp(left, 8, window.innerWidth - width - 8);
  const nextTop = clamp(top, 8, window.innerHeight - height - 8);

  upgradePanel.style.left = `${nextLeft}px`;
  upgradePanel.style.top = `${nextTop}px`;
  upgradePanel.style.right = "auto";
}

function damageCrate(index, damage) {
  const crate = crates[index];
  const destroyed = crate && crate.hp - damage <= 0;

  if (sharedWorldActive) {
    return Boolean(destroyed);
  }

  crate.hp -= damage;

  if (crate.hp <= 0) {
    const tier = crateTiers[crate.kind || "basic"] || crateTiers.basic;
    spawnPickup(crate.x, crate.y);
    spawnPickup(crate.x + 28, crate.y - 20, "xp", { value: tier.xp });
    spawnPickup(crate.x - 28, crate.y + 20, "coin", { coinKind: tier.coinKind, value: tier.coinValue });
    crates.splice(index, 1);
    playCrateBreakSound();
    return true;
  }

  if (!destroyed) {
    playCrateHitSound();
  }
  return false;
}

function spawnPickup(x, y, forcedType = null, data = {}) {
  const types = ["knife", "glock", "awm", "armor", "medkit"];
  const type = forcedType || data.type || types[Math.floor(Math.random() * types.length)];

  pickups.push({
    x,
    y,
    type,
    predicted: data.predicted || false,
    count: data.count,
    ammo: data.ammo,
    magAmmo: data.magAmmo,
    value: data.value,
    coinKind: data.coinKind,
    expiresAt: data.expiresAt || Date.now() + pickupLifetimeMs,
    radius: 18,
    bob: Math.random() * Math.PI * 2,
  });
}

function applyDamage(amount, sourceId = null, knockback = null) {
  if (knockback) {
    applyBulletKnockback(amount, knockback.vx, knockback.vy);
  }

  if (sharedWorldActive) {
    sendNetwork("damageMe", { damage: amount, sourceId });
    return;
  }

  let remaining = amount;

  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, remaining);
    player.shield -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    player.health = Math.max(0, player.health - remaining);
  }

  playPlayerHitSound();

  if (player.health <= 0) {
    handleLocalDeath();
  }
}

function addCorpse({ x, y, name, color = "#58a6ff", stroke = "#1b496f" }) {
  corpses.push({
    x,
    y,
    name,
    color,
    stroke,
    expiresAt: performance.now() + corpseLifetime,
  });
}

function handleLocalDeath() {
  if (deathPending) {
    return;
  }

  deathPending = true;
  mouse.down = false;
  mouse.rightDown = false;
  keys.clear();
  player.knifeCharging = false;
  player.knifeCharge = 0;
  addCorpse({ x: player.x, y: player.y, name: player.name });
  if (!sharedWorldActive) {
    dropAllLoot(player.x, player.y);
  }
  saveRespawnProfileAfterDeath();
  sendNetwork("dead", {});

  localDeathTimeout = setTimeout(() => {
    localDeathTimeout = null;
    showRestartScreen();
  }, corpseLifetime);
}

function getPickupType(item) {
  return typeof item === "string" ? item : item?.type;
}

function getPickupWeaponAmmo(item, weaponName) {
  const hasSavedAmmo = item && typeof item === "object" && (Number.isFinite(item.ammo) || Number.isFinite(item.magAmmo));

  if (hasSavedAmmo) {
    return {
      ammo: Math.max(0, Number(item.ammo || 0)),
      magAmmo: Math.max(0, Number(item.magAmmo || 0)),
      saved: true,
    };
  }

  return {
    ammo: weapons[weaponName].magazineSize,
    magAmmo: 0,
    saved: false,
  };
}

function canCollectPickup(item) {
  if (item?.predicted) {
    return false;
  }

  const type = getPickupType(item);

  if (type === "armor") {
    return true;
  }

  if (type === "medkit") {
    return true;
  }

  if (type === "xp") {
    return true;
  }

  if (type === "coin") {
    return true;
  }

  if (type === "knife" || type === "glock" || type === "awm") {
    return Boolean([1, 2, 3].find((slot) => weapons.slots[slot] === type) || [1, 2, 3].find((slot) => !weapons.slots[slot]));
  }

  return false;
}

function canMagnetPickup(item) {
  const type = getPickupType(item);
  return type === "armor" || type === "medkit" || canCollectPickup(item);
}

function addWeaponToInventory(item) {
  const weaponName = getPickupType(item);

  if (weaponName === "knife") {
    const count = Math.max(1, Number(typeof item === "object" ? item.count || 1 : 1));
    const existingSlot = [1, 2, 3].find((slot) => weapons.slots[slot] === "knife");

    if (existingSlot) {
      weapons.knife.count += count;
      return true;
    }

    const emptySlot = [1, 2, 3].find((slot) => !weapons.slots[slot]);

    if (!emptySlot) {
      return false;
    }

    weapons.slots[emptySlot] = "knife";
    weapons.knife.count = Math.max(0, weapons.knife.count) + count;
    return true;
  }

  const existingSlot = [1, 2, 3].find((slot) => weapons.slots[slot] === weaponName);
  const pickupAmmo = getPickupWeaponAmmo(item, weaponName);

  if (existingSlot) {
    weapons[weaponName].ammo += pickupAmmo.ammo + pickupAmmo.magAmmo;
    weapons[weaponName].reloadTimer = 0;
    return true;
  }

  const emptySlot = [1, 2, 3].find((slot) => !weapons.slots[slot]);

  if (!emptySlot) {
    return false;
  }

  const preferredSlot = weaponName === "glock" ? 2 : 3;
  const fallbackSlot = preferredSlot === 2 ? 3 : 2;
  const targetSlot = weapons.slots[preferredSlot] ? (weapons.slots[fallbackSlot] ? emptySlot : fallbackSlot) : preferredSlot;

  weapons.slots[targetSlot] = weaponName;
  weapons[weaponName].ammo = pickupAmmo.ammo;
  weapons[weaponName].magAmmo = pickupAmmo.saved ? pickupAmmo.magAmmo : 0;

  if (weapons[weaponName].magAmmo <= 0 && weapons[weaponName].ammo > 0) {
    const loaded = Math.min(weapons[weaponName].magazineSize, weapons[weaponName].ammo);
    weapons[weaponName].magAmmo = loaded;
    weapons[weaponName].ammo -= loaded;
  }
  weapons[weaponName].reloadTimer = 0;
  return true;
}

function collectPickup(index) {
  const pickup = pickups[index];

  if (pickup.expiresAt && pickup.expiresAt <= Date.now()) {
    pickups.splice(index, 1);
    return;
  }

  if (!canCollectPickup(pickup)) {
    return;
  }

  if (sharedWorldActive && pickup?.id) {
    sendNetwork("pickupRequest", { id: pickup.id, x: pickup.x, y: pickup.y });
    return;
  }

  let collected = false;

  if (pickup.type === "knife" || pickup.type === "glock") {
    collected = addWeaponToInventory(pickup);
  } else if (pickup.type === "awm") {
    collected = addWeaponToInventory(pickup);
  } else if (pickup.type === "armor") {
    player.shield = Math.min(player.maxShield, player.shield + 25);
    collected = true;
  } else if (pickup.type === "medkit") {
    player.health = Math.min(player.maxHealth, player.health + player.healAmount);
    collected = true;
  } else if (pickup.type === "xp") {
    gainXp(pickup.value || xpDropValue);
    collected = true;
  } else if (pickup.type === "coin") {
    player.coins += pickup.value || coinValues[pickup.coinKind] || coinValues.bronze;
    updateCoinHud();
    updateShopHud();
    collected = true;
  }

  if (!collected) {
    return;
  }

  pickups.splice(index, 1);
  playPickupSound(pickup.type);
  updateInventory();
}

function applyPickupItem(item) {
  const type = getPickupType(item);
  let collected = false;

  if (type === "knife" || type === "glock") {
    collected = addWeaponToInventory(item);
  } else if (type === "awm") {
    collected = addWeaponToInventory(item);
  } else if (type === "armor") {
    player.shield = Math.min(player.maxShield, player.shield + 25);
    collected = true;
  } else if (type === "medkit") {
    player.health = Math.min(player.maxHealth, player.health + player.healAmount);
    collected = true;
  } else if (type === "xp") {
    gainXp(item.value || xpDropValue);
    collected = true;
  } else if (type === "coin") {
    player.coins += item.value || coinValues[item.coinKind] || coinValues.bronze;
    updateCoinHud();
    updateShopHud();
    collected = true;
  }

  if (collected) {
    playPickupSound(type);
    updateInventory();
  }
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playAudioAsset(asset, volume = 0.75) {
  if (!asset) {
    return;
  }

  const sound = asset.cloneNode();
  sound.volume = volume;
  sound.play().catch(() => {});
}

function playTone({ frequency, duration, type = "sine", gain = 0.08, when = 0 }) {
  const audio = getAudioContext();
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();
  const start = audio.currentTime + when;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(volume);
  volume.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playNoise({ duration, gain = 0.08, when = 0, filterFrequency = 900 }) {
  const audio = getAudioContext();
  const sampleRate = audio.sampleRate;
  const buffer = audio.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const volume = audio.createGain();
  const start = audio.currentTime + when;

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFrequency, start);
  filter.Q.setValueAtTime(0.8, start);
  volume.gain.setValueAtTime(gain, start);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(volume);
  volume.connect(audio.destination);
  source.start(start);
  source.stop(start + duration);
}

function playSwordSwing() {
  playAudioAsset(audioAssets.knifeSwing, 0.12);
}

function playKnifeThrowSound() {
  playAudioAsset(audioAssets.knifeThrow, 0.12);
}

function playGunSound(weaponName) {
  if (weaponName === "awm") {
    playAudioAsset(audioAssets.awmShot, 0.03);
  } else if (weaponName === "glock") {
    playAudioAsset(audioAssets.glockShot, 0.06);
  } else {
    playNoise({ duration: 0.08, gain: 0.11, filterFrequency: 1050 });
    playTone({ frequency: 155, duration: 0.08, type: "square", gain: 0.055 });
  }
}

function playReloadSound(weaponName) {
  if (weaponName === "glock") {
    playAudioAsset(audioAssets.glockReload, 0.06);
  } else if (weaponName === "awm") {
    playAudioAsset(audioAssets.awmReload, 0.03);
  }
}

function playPickupSound(type) {
  const base = type === "armor" ? 260 : type === "medkit" ? 520 : 390;
  playTone({ frequency: type === "coin" ? 720 : base, duration: 0.08, type: "triangle", gain: 0.07 });
  playTone({ frequency: type === "coin" ? 1080 : base * 1.5, duration: 0.12, type: "triangle", gain: 0.05, when: 0.06 });
}

function playCrateHitSound() {
  playNoise({ duration: 0.07, gain: 0.08, filterFrequency: 520 });
  playTone({ frequency: 145, duration: 0.08, type: "square", gain: 0.04 });
}

function playCrateBreakSound() {
  playNoise({ duration: 0.18, gain: 0.13, filterFrequency: 360 });
  playTone({ frequency: 95, duration: 0.16, type: "sawtooth", gain: 0.075 });
  playTone({ frequency: 210, duration: 0.06, type: "triangle", gain: 0.045, when: 0.05 });
}

function playPlayerHitSound() {
  playNoise({ duration: 0.09, gain: 0.1, filterFrequency: 680 });
  playTone({ frequency: 240, duration: 0.07, type: "square", gain: 0.055 });
}

function playEffect(effect) {
  if (!effect) {
    return;
  }

  const distance = Math.hypot((effect.x ?? player.x) - player.x, (effect.y ?? player.y) - player.y);

  if (distance > 1500) {
    return;
  }

  if (effect.type === "crateHit") {
    playCrateHitSound();
  } else if (effect.type === "crateBreak") {
    playCrateBreakSound();
  } else if (effect.type === "playerHit") {
    playPlayerHitSound();
  } else if (effect.type === "teleport") {
    addTeleportEffect(effect.x, effect.y, effect.color || "#8df4df");
    playTone({ frequency: 620, duration: 0.08, type: "triangle", gain: 0.045 });
    playTone({ frequency: 920, duration: 0.12, type: "sine", gain: 0.035, when: 0.04 });
  }
}

shopClose?.addEventListener("click", closeShop);
shopPanel?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  if (button.dataset.action === "buy") {
    buyShopItem(button.dataset.item);
  } else if (button.dataset.action === "sell") {
    sellShopItem(button.dataset.item);
  } else if (button.dataset.action === "upgrade") {
    buyWeaponUpgrade(button.dataset.item, button.dataset.stat);
  } else if (button.dataset.action === "ability") {
    buyAbilityUpgrade(button.dataset.ability);
  } else if (button.dataset.action === "skill") {
    buyShopSkill(button.dataset.skill);
  }
});

shopPanel?.querySelectorAll(".shop-skill-row").forEach((row) => {
  row.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    handleShopSkillClick(row.dataset.shopSkill);
  });
});

function connectMultiplayer() {
  if (socket || location.protocol === "file:") {
    return;
  }

  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "welcome") {
      localClientId = message.id;
      if (message.world) {
        sharedWorldActive = true;
        crates.splice(0, crates.length, ...message.world.crates);
        syncWorldPickups(message.world.pickups);
      }
      if (gameStarted) {
        sendNetwork("respawn", { state: getPlayerSnapshot() });
      }
    } else if (message.type === "state") {
      setRemotePlayerState(message.id, message.state);
    } else if (message.type === "shot") {
      remoteBullets.push({
        ...message.bullet,
        ownerId: message.id,
      });
    } else if (message.type === "bulletImpact") {
      syncBulletImpact(message);
    } else if (message.type === "melee") {
      message.attack.ownerId = message.id;
      const remote = remotePlayers.get(message.id);
      if (remote) {
        if (message.attack.weapon === "fist") {
          remote.punchTimer = message.attack.swingDuration || weapons.fist.swingDuration;
          remote.punchDuration = message.attack.swingDuration || weapons.fist.swingDuration;
        } else {
          remote.swingTimer = message.attack.swingDuration || weapons.knife.swingDuration;
          remote.swingDuration = message.attack.swingDuration || weapons.knife.swingDuration;
        }
      }
      handleRemoteMelee(message.attack);
    } else if (message.type === "world") {
      sharedWorldActive = true;
      crates.splice(0, crates.length, ...message.world.crates);
      syncWorldPickups(message.world.pickups);
    } else if (message.type === "effect") {
      playEffect(message.effect);
    } else if (message.type === "chat") {
      addChatMessage({
        id: message.id,
        name: message.name,
        text: message.text,
        local: message.id === localClientId,
      });
    } else if (message.type === "teleport") {
      addTeleportEffect(player.x, player.y);
      addTeleportEffect(message.x, message.y);
      player.x = message.x;
      player.y = message.y;
      player.knifeSwapTimer = knifeSwapCooldownSeconds;
      player.skillCooldowns.knifeRecall = knifeSwapCooldownSeconds;
    } else if (message.type === "knifeSwap") {
      const remoteBullet = remoteBullets.find((bullet) => bullet.id === message.bulletId && bullet.ownerId === message.id);
      const remote = remotePlayers.get(message.id);
      addTeleportEffect(message.playerX, message.playerY, "#ff9cb5");
      addTeleportEffect(message.bulletX, message.bulletY, "#ff9cb5");
      if (remote) {
        remote.x = message.playerX;
        remote.y = message.playerY;
        remote.renderX = message.playerX;
        remote.renderY = message.playerY;
      }
      if (remoteBullet) {
        remoteBullets.splice(remoteBullets.indexOf(remoteBullet), 1);
      }
    } else if (message.type === "lightningThrust") {
      const remote = remotePlayers.get(message.id);
      const attack = message.attack;
      if (attack) {
        addLightningThrustEffect(attack.startX, attack.startY, attack.endX, attack.endY, "#ffdf86");
        if (remote) {
          remote.x = attack.endX;
          remote.y = attack.endY;
          remote.renderX = attack.endX;
          remote.renderY = attack.endY;
          remote.swingTimer = 0.22;
          remote.swingDuration = 0.22;
        }
      }
    } else if (message.type === "railburstCharge") {
      const remote = remotePlayers.get(message.id);
      if (remote && message.charge) {
        remote.railburstCharge = { ...message.charge, startedAt: performance.now() };
      }
    } else if (message.type === "railburstFire") {
      const remote = remotePlayers.get(message.id);
      if (remote) {
        remote.railburstCharge = null;
      }
      if (message.attack) {
        addRailburstEffect(message.attack.startX, message.attack.startY, message.attack.endX, message.attack.endY, "#ff9cb5");
      }
    } else if (message.type === "skillEffect") {
      if (message.skill === "staticCollapse") {
        addStaticCollapseEffect(message.x, message.y, message.radius);
      } else if (message.skill === "staticCollapseBurst") {
        addStaticCollapseBurstEffect(message.x, message.y, message.radius);
      } else if (message.skill === "arcPrison") {
        addArcPrisonEffect(message.x, message.y, message.radius);
      } else if (message.skill === "stormRecall") {
        addStormRecallEffect(message.x, message.y, message.radius);
      }
    } else if (message.type === "staticCollapseLaunch") {
      staticCollapseProjectiles.push({
        x: message.projectile.x,
        y: message.projectile.y,
        vx: message.projectile.vx,
        vy: message.projectile.vy,
        endX: message.projectile.endX,
        endY: message.projectile.endY,
        radius: message.projectile.radius,
        damage: message.projectile.damage,
        contactDamage: message.projectile.contactDamage,
        chargeRatio: message.projectile.chargeRatio,
        ownerId: message.id,
      });
    } else if (message.type === "status") {
      if (message.status === "arcSlow") {
        player.arcSlowTimer = Math.max(player.arcSlowTimer || 0, Number(message.duration || arcPrisonSlowSeconds));
        player.arcSlowStrength = Math.min(player.arcSlowStrength || 1, Number(message.strength || 0.34));
      }
    } else if (message.type === "pickupGranted") {
      applyPickupItem(message.item);
    } else if (message.type === "xpGranted") {
      gainXp(message.value || xpDropValue);
      playPickupSound("xp");
    } else if (message.type === "coinGranted") {
      player.coins += message.value || coinValues[message.coinKind] || coinValues.bronze;
      updateCoinHud();
      updateShopHud();
      playPickupSound("coin");
    } else if (message.type === "health") {
      if (Number.isFinite(message.x) && Number.isFinite(message.y)) {
        player.x = message.x;
        player.y = message.y;
      }
      player.health = message.health;
      player.shield = message.shield;
      if (message.knockback) {
        player.vx += message.knockback.vx;
        player.vy += message.knockback.vy;
        player.knockbackTimer = Math.max(player.knockbackTimer || 0, 0.58);
      }

      if (player.health <= 0) {
        handleLocalDeath();
      }
    } else if (message.type === "dead") {
      const remote = remotePlayers.get(message.id);
      if (remote) {
        addCorpse({
          x: remote.renderX ?? remote.x,
          y: remote.renderY ?? remote.y,
          name: remote.name,
          color: "#ef6f8f",
          stroke: "#7a2738",
        });
      }
      remotePlayers.delete(message.id);
    } else if (message.type === "leave") {
      remotePlayers.delete(message.id);
    }
  });

  socket.addEventListener("close", () => {
    socket = null;
    localClientId = null;
    sharedWorldActive = false;
    remotePlayers.clear();
    remoteBullets.length = 0;
  });
}

function syncBulletImpact(message) {
  for (const list of [bullets, remoteBullets]) {
    const bulletIndex = list.findIndex((candidate) => (
      candidate.id === message.bulletId &&
      (candidate.ownerId === message.ownerId || !candidate.ownerId)
    ));
    if (bulletIndex < 0) {
      continue;
    }

    const bullet = list[bulletIndex];
    const nextX = Number(message.x);
    const nextY = Number(message.y);

    bullet.damage = Math.max(0, Number(message.damage || 0));

    if (message.spent || bullet.damage <= 0) {
      if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
        bullet.x = nextX;
        bullet.y = nextY;
      }
      list.splice(bulletIndex, 1);
    }

    return;
  }
}

function setRemotePlayerState(id, state) {
  const previous = remotePlayers.get(id);

  remotePlayers.set(id, {
    id,
    isAi: String(id).startsWith("test-ai-"),
    ...state,
    renderX: previous?.renderX ?? state.x,
    renderY: previous?.renderY ?? state.y,
    renderAimAngle: previous?.renderAimAngle ?? state.aimAngle ?? 0,
    chatBubble: previous?.chatBubble,
  });
}

function sendNetwork(type, payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, ...payload }));
  }
}

function toggleDebugTools() {
  hitboxDebug = !hitboxDebug;
  sendNetwork("toggleAi", { enabled: hitboxDebug });
}

function syncWorldPickups(nextPickups) {
  const previous = new Map(pickups.filter((pickup) => pickup.id).map((pickup) => [pickup.id, pickup]));

  pickups.splice(
    0,
    pickups.length,
    ...nextPickups.map((pickup) => {
      const old = previous.get(pickup.id);

      if (old?.magnetized) {
        return { ...pickup, x: old.x, y: old.y, magnetized: true };
      }

      return pickup;
    }),
  );
}

function swapWithThrownKnife() {
  if (player.knifeSwapTimer > 0 || (player.skillCooldowns.knifeRecall || 0) > 0) {
    return false;
  }

  const knife = [...bullets].reverse().find((bullet) => bullet.weapon === "knife" && bullet.life > 0);

  if (!knife) {
    return false;
  }

  const previousPlayerX = player.x;
  const previousPlayerY = player.y;
  const previousKnifeX = knife.x;
  const previousKnifeY = knife.y;

  player.x = clamp(previousKnifeX, player.radius, world.width - player.radius);
  player.y = clamp(previousKnifeY, player.radius, world.height - player.radius);
  if (!sharedWorldActive) {
    dropPickupAt(previousPlayerX, previousPlayerY, knife.pickup || { type: "knife", count: 1 });
  }
  bullets.splice(bullets.indexOf(knife), 1);
  player.knifeSwapTimer = player.testMode ? 0 : knifeSwapCooldownSeconds;
  player.skillCooldowns.knifeRecall = player.testMode ? 0 : knifeSwapCooldownSeconds;
  addTeleportEffect(previousPlayerX, previousPlayerY);
  addTeleportEffect(player.x, player.y);
  sendNetwork("knifeSwap", { bulletId: knife.id });
  sendNetwork("state", { state: getPlayerSnapshot() });
  return true;
}

function useLightningThrust() {
  if (player.lightningThrustTimer > 0 || weapons.slots[weapons.selectedSlot] !== "knife" || weapons.knife.count <= 0) {
    return false;
  }

  const angle = getAimAngle();
  const startX = player.x;
  const startY = player.y;
  const distance = lightningThrustRange + Math.min(140, weapons.knife.throwSpeedBonus * 0.7);
  const endX = clamp(startX + Math.cos(angle) * distance, player.radius, world.width - player.radius);
  const endY = clamp(startY + Math.sin(angle) * distance, player.radius, world.height - player.radius);
  const damage = getScaledDamage(lightningThrustDamage + weapons.knife.damage * 0.55);

  player.x = endX;
  player.y = endY;
  player.vx = Math.cos(angle) * 220;
  player.vy = Math.sin(angle) * 220;
  player.lightningThrustTimer = player.testMode ? 0 : lightningThrustCooldownSeconds;
  player.skillCooldowns.lightningThrust = player.testMode ? 0 : lightningThrustCooldownSeconds;
  player.lightningThrustActiveTimer = 0.18;
  player.swingTimer = 0.22;
  player.knifeCharging = false;
  player.knifeCharge = 0;
  addLightningThrustEffect(startX, startY, endX, endY);
  playTone({ frequency: 360, duration: 0.05, type: "sawtooth", gain: 0.055 });
  playTone({ frequency: 1040, duration: 0.12, type: "triangle", gain: 0.052, when: 0.03 });
  playNoise({ duration: 0.12, gain: 0.1, filterFrequency: 1200 });

  if (sharedWorldActive) {
    sendNetwork("lightningThrust", {
      attack: {
        startX,
        startY,
        endX,
        endY,
        damage,
        radius: lightningThrustHitRadius,
      },
    });
    sendNetwork("state", { state: getPlayerSnapshot() });
    return true;
  }

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    if (segmentHitsBox(startX, startY, endX, endY, crate, lightningThrustHitRadius)) {
      damageCrate(index, damage);
    }
  }

  return true;
}

function startRailburst() {
  if (player.railburstTimer > 0 || player.railburstCharge || deathPending) {
    return false;
  }

  const angle = getAimAngle();
  player.railburstCharge = {
    startX: player.x,
    startY: player.y,
    angle,
  };
  player.railburstChargeTimer = railburstChargeSeconds;
  player.railburstTimer = player.testMode ? 0 : railburstCooldownSeconds;
  player.skillCooldowns.railburst = player.testMode ? 0 : railburstCooldownSeconds;
  playTone({ frequency: 180, duration: 0.12, type: "sawtooth", gain: 0.04 });
  playTone({ frequency: 420, duration: 0.18, type: "triangle", gain: 0.035, when: 0.08 });
  sendNetwork("state", { state: getPlayerSnapshot() });
  sendNetwork("railburstCharge", { charge: player.railburstCharge });
  updateSkillHud();
  return true;
}

function fireRailburst(charge = player.railburstCharge, fromNetwork = false) {
  if (!charge) {
    return false;
  }

  const startX = charge.startX;
  const startY = charge.startY;
  const angle = charge.angle;
  const endX = clamp(startX + Math.cos(angle) * railburstRange, 0, world.width);
  const endY = clamp(startY + Math.sin(angle) * railburstRange, 0, world.height);
  const damage = getScaledDamage(railburstDamage);

  addRailburstEffect(startX, startY, endX, endY, fromNetwork ? "#ff9cb5" : "#ffdf86");
  playTone({ frequency: 96, duration: 0.09, type: "sawtooth", gain: 0.07 });
  playTone({ frequency: 1280, duration: 0.11, type: "square", gain: 0.045, when: 0.02 });
  playNoise({ duration: 0.18, gain: 0.12, filterFrequency: 1700 });

  if (!fromNetwork && sharedWorldActive) {
    sendNetwork("state", { state: getPlayerSnapshot() });
    sendNetwork("railburstFire", {
      attack: {
        startX,
        startY,
        endX,
        endY,
        damage,
        width: railburstWidth,
      },
    });
  } else if (!fromNetwork) {
    for (let index = crates.length - 1; index >= 0; index -= 1) {
      const crate = crates[index];
      if (segmentHitsBox(startX, startY, endX, endY, crate, railburstWidth / 2)) {
        damageCrate(index, damage);
      }
    }
  }

  return true;
}

function createLightningPoints(x1, y1, x2, y2, steps = 4, jitter = 12) {
  const points = [{ x: x1, y: y1 }];
  const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;

  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    const offset = (Math.random() - 0.5) * jitter;
    points.push({
      x: x1 + (x2 - x1) * t + Math.cos(angle) * offset,
      y: y1 + (y2 - y1) * t + Math.sin(angle) * offset,
    });
  }

  points.push({ x: x2, y: y2 });
  return points;
}

function addStaticCollapseEffect(x, y, radius = staticCollapseRadius) {
  const particles = Array.from({ length: 34 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = radius * (0.35 + Math.random() * 0.72);

    return {
      angle,
      distance,
      size: 2 + Math.random() * 2.4,
      spin: (Math.random() - 0.5) * 1.2,
      delay: Math.random() * 0.22,
    };
  });

  staticCollapseEffects.push({ x, y, radius, particles, startedAt: performance.now(), duration: staticCollapseDelay * 1000 + 620 });
}

function addStaticCollapseBurstEffect(x, y, radius = staticCollapseRadius) {
  staticCollapseEffects.push({
    x,
    y,
    radius,
    particles: [],
    startedAt: performance.now(),
    duration: 620,
    burstOnly: true,
  });
}

function addArcPrisonEffect(x, y, radius = arcPrisonRadius) {
  const sparks = Array.from({ length: 18 }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 1.6,
    length: 14 + Math.random() * 26,
  }));

  arcPrisonEffects.push({ x, y, radius, sparks, startedAt: performance.now(), duration: 1900 });
}

function addStormRecallEffect(x, y, radius = stormRecallRadius) {
  const sparks = Array.from({ length: 14 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.16 + Math.random() * 0.42),
    size: 2 + Math.random() * 2.5,
  }));

  stormRecallEffects.push({ x, y, radius, sparks, startedAt: performance.now(), duration: 240 });
}

function equipStaticCollapse() {
  if (player.staticCollapseHeld) {
    player.staticCollapseHeld = false;
    player.staticCollapseCharging = false;
    player.staticCollapseCharge = 0;
    updateSkillHud();
    return true;
  }

  if ((player.skillCooldowns.staticCollapse || 0) > 0) {
    return false;
  }

  player.staticCollapseHeld = true;
  player.staticCollapseCharging = false;
  player.staticCollapseCharge = 0;
  updateSkillHud();
  return true;
}

function startStaticCollapseCharge() {
  if (!player.staticCollapseHeld || player.staticCollapseCharging) {
    return false;
  }

  player.staticCollapseCharging = true;
  player.staticCollapseCharge = 0;
  updateSkillHud();
  return true;
}

function releaseStaticCollapse() {
  if (!player.staticCollapseHeld || !player.staticCollapseCharging) {
    return false;
  }

  const chargeRatio = clamp(player.staticCollapseCharge / staticCollapseChargeMax, 0.08, 1);
  const angle = getAimAngle();
  const startDistance = player.radius + 90;
  const startX = player.x + Math.cos(angle) * startDistance;
  const startY = player.y + Math.sin(angle) * startDistance;
  const distance = staticCollapseMinRange + chargeRatio * (staticCollapseMaxRange - staticCollapseMinRange);
  const endX = clamp(startX + Math.cos(angle) * distance, 0, world.width);
  const endY = clamp(startY + Math.sin(angle) * distance, 0, world.height);
  const damage = getScaledDamage(45 + chargeRatio * 135);
  const contactDamage = getScaledDamage(18 + chargeRatio * 62);

  player.staticCollapseHeld = false;
  player.staticCollapseCharging = false;
  player.staticCollapseCharge = 0;
  player.skillCooldowns.staticCollapse = player.testMode ? 0 : staticCollapseCooldownSeconds;
  staticCollapseProjectiles.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * staticCollapseProjectileSpeed,
    vy: Math.sin(angle) * staticCollapseProjectileSpeed,
    endX,
    endY,
    radius: 16 + chargeRatio * 8,
    damage,
    contactDamage,
    chargeRatio,
    ownerId: localClientId,
    hitCrateIds: new Set(),
  });
  sendNetwork("skill", {
    skill: "staticCollapse",
    x: endX,
    y: endY,
    startX,
    startY,
    radius: staticCollapseRadius,
    damage,
    contactDamage,
    chargeRatio,
  });
  playTone({ frequency: 260, duration: 0.18, type: "triangle", gain: 0.045 });
  updateSkillHud();
  return true;
}

function useArcPrison() {
  if ((player.skillCooldowns.arcPrison || 0) > 0) {
    return false;
  }

  const target = getMouseWorld();
  player.skillCooldowns.arcPrison = player.testMode ? 0 : arcPrisonCooldownSeconds;
  addArcPrisonEffect(target.x, target.y);
  sendNetwork("skill", {
    skill: "arcPrison",
    x: target.x,
    y: target.y,
    radius: arcPrisonRadius,
    damage: getScaledDamage(arcPrisonDamage),
  });
  playTone({ frequency: 520, duration: 0.12, type: "sine", gain: 0.04 });
  playTone({ frequency: 820, duration: 0.18, type: "triangle", gain: 0.035, when: 0.08 });
  if (!sharedWorldActive) {
    for (let index = crates.length - 1; index >= 0; index -= 1) {
      const crate = crates[index];
      const distance = distanceToArcPrisonEdge(crate.x, crate.y, target.x, target.y, arcPrisonRadius);
      if (distance <= arcPrisonEdgeWidth + getCrateHitboxSize(crate) / 2) {
        damageCrate(index, getScaledDamage(arcPrisonDamage));
      }
    }
  }
  updateSkillHud();
  return true;
}

function useStormRecall() {
  if ((player.skillCooldowns.stormRecall || 0) > 0) {
    return false;
  }

  player.skillCooldowns.stormRecall = player.testMode ? 0 : stormRecallCooldownSeconds;
  addStormRecallEffect(player.x, player.y);
  sendNetwork("skill", {
    skill: "stormRecall",
    x: player.x,
    y: player.y,
    radius: stormRecallRadius,
    damage: getScaledDamage(stormRecallDamage),
  });
  playTone({ frequency: 180, duration: 0.12, type: "sawtooth", gain: 0.045 });
  playTone({ frequency: 740, duration: 0.2, type: "triangle", gain: 0.04, when: 0.05 });
  if (!sharedWorldActive) {
    for (let index = crates.length - 1; index >= 0; index -= 1) {
      const crate = crates[index];
      if (Math.hypot(crate.x - player.x, crate.y - player.y) <= stormRecallRadius + getCrateHitboxSize(crate) / 2) {
        damageCrate(index, getScaledDamage(stormRecallDamage));
      }
    }
  }
  updateSkillHud();
  return true;
}

function useEquippedSkill(slotKey) {
  if (!isSkillSlotUnlocked(slotKey)) {
    return false;
  }

  const skill = player.skillSlots[slotKey];

  if (skill === "knifeRecall") return swapWithThrownKnife();
  if (skill === "staticCollapse") return equipStaticCollapse();
  if (skill === "arcPrison") return useArcPrison();
  if (skill === "stormRecall") return useStormRecall();
  if (skill === "lightningThrust") return useLightningThrust();
  if (skill === "railburst") return startRailburst();

  return false;
}

function dropPickupAt(x, y, item) {
  const pickup = {
    ...item,
    x: clamp(x, player.radius, world.width - player.radius),
    y: clamp(y, player.radius, world.height - player.radius),
    expiresAt: Date.now() + pickupLifetimeMs,
  };

  if (sharedWorldActive && socket?.readyState === WebSocket.OPEN) {
    sendNetwork("dropPickup", { pickup });
    return;
  }

  spawnPickup(pickup.x, pickup.y, pickup.type, pickup);
}

function getPlayerSnapshot() {
  return {
    x: player.x,
    y: player.y,
    name: player.name,
    health: player.health,
    maxHealth: player.maxHealth,
    shield: player.shield,
    maxShield: player.maxShield,
    healAmount: player.healAmount,
    level: player.level,
    xp: player.xp,
    xpToNext: player.xpToNext,
    coins: player.coins,
    totalXp: player.totalXp,
    upgradePoints: player.upgradePoints,
    damageMultiplier: player.damageMultiplier,
    upgrades: player.upgrades,
    inventory: {
      slots: { ...weapons.slots },
      knife: { count: weapons.knife.count },
      glock: { ammo: weapons.glock.ammo, magAmmo: weapons.glock.magAmmo },
      awm: { ammo: weapons.awm.ammo, magAmmo: weapons.awm.magAmmo },
    },
    selectedWeapon: weapons.slots[weapons.selectedSlot],
    aimAngle: getAimAngle(),
    swingTimer: player.swingTimer,
    swingDuration: weapons.knife.swingDuration,
    punchTimer: player.punchTimer,
    punchDuration: weapons.fist.swingDuration,
    knifeCharging: player.knifeCharging,
    knifeCharge: player.knifeCharge,
  };
}

function handleRemoteMelee(attack) {
  if (sharedWorldActive) {
    return;
  }

  const distance = Math.hypot(player.x - attack.x, player.y - attack.y);

  if (distance > attack.range + player.radius) {
    return;
  }

  const targetAngle = Math.atan2(player.y - attack.y, player.x - attack.x);
  const angleDiff = Math.atan2(Math.sin(targetAngle - attack.angle), Math.cos(targetAngle - attack.angle));

  if (Math.abs(angleDiff) <= attack.arc / 2) {
    applyDamage(attack.damage, attack.ownerId);
  }
}

function screenToWorldX(x) {
  return (x - width / 2) / camera.zoom + camera.x;
}

function screenToWorldY(y) {
  return (y - height / 2) / camera.zoom + camera.y;
}

function getAimAngle() {
  const targetX = screenToWorldX(mouse.x);
  const targetY = screenToWorldY(mouse.y);
  return Math.atan2(targetY - player.y, targetX - player.x);
}

function getMoveAxis() {
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const up = keys.has("w") || keys.has("arrowup");
  const down = keys.has("s") || keys.has("arrowdown");

  let x = Number(right) - Number(left);
  let y = Number(down) - Number(up);
  const length = Math.hypot(x, y);

  if (length > 0) {
    x /= length;
    y /= length;
  }

  return { x, y, active: length > 0 };
}

function getMouseWorld() {
  return {
    x: clamp(screenToWorldX(mouse.x), player.radius, world.width - player.radius),
    y: clamp(screenToWorldY(mouse.y), player.radius, world.height - player.radius),
  };
}

function startReload(weaponName = weapons.slots[weapons.selectedSlot]) {
  if (weaponName !== "glock" && weaponName !== "awm") {
    return false;
  }

  const weapon = weapons[weaponName];

  if (weapon.reloadTimer > 0 || weapon.ammo <= 0 || weapon.magAmmo >= weapon.magazineSize) {
    return false;
  }

  weapon.reloadTimer = weapon.reloadTime;
  playReloadSound(weaponName);
  return true;
}

function fireBullet() {
  const selectedWeapon = weapons.slots[weapons.selectedSlot];

  if (selectedWeapon !== "glock" && selectedWeapon !== "awm") {
    return false;
  }

  const isGlock = selectedWeapon === "glock";
  const weapon = isGlock ? weapons.glock : weapons.awm;

  if (weapon.reloadTimer > 0) {
    return false;
  }

  if (weapon.magAmmo <= 0) {
    startReload(selectedWeapon);
    return false;
  }

  const angle = getAimAngle();
  const barrelLength = isGlock ? player.radius + 22 : player.radius + 48;

  const bullet = {
    id: `${localClientId || "local"}-${nextLocalBulletId++}`,
    ownerId: localClientId,
    x: player.x + Math.cos(angle) * barrelLength,
    y: player.y + Math.sin(angle) * barrelLength,
    vx: Math.cos(angle) * weapon.bulletSpeed + player.vx * 0.18,
    vy: Math.sin(angle) * weapon.bulletSpeed + player.vy * 0.18,
    radius: weapon.bulletRadius,
    life: weapon.bulletLife,
    damage: getScaledDamage(weapon.damage),
    weapon: isGlock ? "glock" : "awm",
    hitIds: [],
    hitCrateIds: [],
  };

  bullets.push(bullet);
  sendNetwork("shot", { bullet });

  weapon.magAmmo -= 1;

  if (weapon.magAmmo <= 0 && weapon.ammo > 0) {
    startReload(selectedWeapon);
  }

  playGunSound(isGlock ? "glock" : "awm");
  return true;
}

function swingKnife() {
  if (weapons.slots[weapons.selectedSlot] !== "knife") {
    return false;
  }

  const knife = weapons.knife;
  const angle = getAimAngle();
  let hitSomething = false;

  sendNetwork("melee", {
    attack: {
      x: player.x,
      y: player.y,
      angle,
      range: knife.range,
      arc: knife.arc,
      damage: getScaledDamage(knife.damage),
      swingDuration: knife.swingDuration,
    },
  });

  if (!sharedWorldActive) {
    for (let index = crates.length - 1; index >= 0; index -= 1) {
      const crate = crates[index];
      const distance = Math.hypot(crate.x - player.x, crate.y - player.y);

      if (distance > knife.range + getCrateHitboxSize(crate) / 2) {
        continue;
      }

      const targetAngle = Math.atan2(crate.y - player.y, crate.x - player.x);
      const angleDiff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));

      if (Math.abs(angleDiff) <= knife.arc / 2) {
        damageCrate(index, getScaledDamage(knife.damage));
        hitSomething = true;
      }
    }
  }

  player.swingTimer = knife.swingDuration;
  playSwordSwing();
  return true;
}

function punch() {
  if (weapons.slots[weapons.selectedSlot]) {
    return false;
  }

  const fist = weapons.fist;
  const angle = getAimAngle();

  sendNetwork("melee", {
    attack: {
      x: player.x,
      y: player.y,
      angle,
      range: fist.range,
      arc: fist.arc,
      damage: getScaledDamage(fist.damage),
      swingDuration: fist.swingDuration,
      weapon: "fist",
    },
  });

  if (!sharedWorldActive) {
    for (let index = crates.length - 1; index >= 0; index -= 1) {
      const crate = crates[index];
      const distance = Math.hypot(crate.x - player.x, crate.y - player.y);

      if (distance > fist.range + getCrateHitboxSize(crate) / 2) {
        continue;
      }

      const targetAngle = Math.atan2(crate.y - player.y, crate.x - player.x);
      const angleDiff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));

      if (Math.abs(angleDiff) <= fist.arc / 2) {
        damageCrate(index, getScaledDamage(fist.damage));
      }
    }
  }

  player.punchTimer = fist.swingDuration;
  return true;
}

function throwKnife() {
  const sourceSlot = weapons.selectedSlot;

  if (weapons.slots[sourceSlot] !== "knife" || weapons.knife.count <= 0 || player.knifeCharge <= 0.08) {
    player.knifeCharge = 0;
    player.knifeCharging = false;
    return false;
  }

  const chargeRatio = clamp(player.knifeCharge / player.knifeChargeMax, 0, 1);
  const angle = getAimAngle();
  const speed = 360 + chargeRatio * 620 + weapons.knife.throwSpeedBonus;
  const damage = getScaledDamage(Math.round(weapons.knife.damage + (200 - weapons.knife.damage) * chargeRatio));

  const bullet = {
    id: `${localClientId || "local"}-${nextLocalBulletId++}`,
    ownerId: localClientId,
    x: player.x + Math.cos(angle) * (player.radius + 18),
    y: player.y + Math.sin(angle) * (player.radius + 18),
    vx: Math.cos(angle) * speed + player.vx * 0.12,
    vy: Math.sin(angle) * speed + player.vy * 0.12,
    radius: 10,
    life: 0.28 + chargeRatio * 0.46 + weapons.knife.throwLifeBonus,
    damage,
    angle,
    weapon: "knife",
    pickup: { type: "knife", count: 1, dropId: null },
    hitIds: [],
    hitCrateIds: [],
  };

  bullet.pickup.dropId = bullet.id;

  bullets.push(bullet);
  sendNetwork("shot", { bullet });

  weapons.knife.count -= 1;

  if (weapons.knife.count <= 0) {
    weapons.slots[sourceSlot] = null;
  }

  const nextSlot = [1, 2, 3].find((slot) => weapons.slots[slot]);
  weapons.selectedSlot = nextSlot || sourceSlot;
  player.knifeCharge = 0;
  player.knifeCharging = false;
  updateInventory();
  playKnifeThrowSound();
  return true;
}

function dash() {
  if (player.dashTimer > 0) {
    return;
  }

  const axis = getMoveAxis();
  const currentSpeed = Math.hypot(player.vx, player.vy);
  let dashX = axis.x;
  let dashY = axis.y;

  if (!axis.active && currentSpeed > 30) {
    dashX = player.vx / currentSpeed;
    dashY = player.vy / currentSpeed;
  }

  if (dashX === 0 && dashY === 0) {
    return;
  }

  player.vx = dashX * player.dashSpeed;
  player.vy = dashY * player.dashSpeed;
  player.dashActiveTimer = player.dashDuration;
  player.dashTimer = player.testMode ? 0 : player.dashCooldown;
}

function update(delta) {
  if (deathPending) {
    camera.x += (player.x - camera.x) * camera.smoothing;
    camera.y += (player.y - camera.y) * camera.smoothing;
    return;
  }

  const axis = getMoveAxis();

  const speed = Math.hypot(player.vx, player.vy);

  if (axis.active) {
    player.vx += axis.x * player.acceleration * delta;
    player.vy += axis.y * player.acceleration * delta;

    if (speed > 0) {
      const dot = (player.vx / speed) * axis.x + (player.vy / speed) * axis.y;

      if (dot < 0.35) {
        const slide = Math.exp(-player.turnDrag * delta);
        player.vx *= slide;
        player.vy *= slide;
      }
    }
  }

  player.dashActiveTimer = Math.max(0, player.dashActiveTimer - delta);
  player.lightningThrustActiveTimer = Math.max(0, player.lightningThrustActiveTimer - delta);
  player.knockbackTimer = Math.max(0, (player.knockbackTimer || 0) - delta);
  player.arcSlowTimer = Math.max(0, (player.arcSlowTimer || 0) - delta);
  if (player.arcSlowTimer <= 0) {
    player.arcSlowStrength = 1;
  }
  shopToastTimer = Math.max(0, shopToastTimer - delta);

  if (player.dashActiveTimer <= 0 && player.lightningThrustActiveTimer <= 0) {
    const drag = Math.exp(-player.friction * delta);
    player.vx *= drag;
    player.vy *= drag;
  }

  const nextSpeed = Math.hypot(player.vx, player.vy);
  const effectiveMaxSpeed = player.arcSlowTimer > 0 ? player.maxSpeed * (player.arcSlowStrength || 0.34) : player.maxSpeed;
  if (player.dashActiveTimer <= 0 && player.lightningThrustActiveTimer <= 0 && player.knockbackTimer <= 0 && nextSpeed > effectiveMaxSpeed) {
    player.vx = (player.vx / nextSpeed) * effectiveMaxSpeed;
    player.vy = (player.vy / nextSpeed) * effectiveMaxSpeed;
  }

  const nextX = player.x + player.vx * delta;
  const nextY = player.y + player.vy * delta;
  const isInShop = player.x < 0;
  const minX = isInShop ? -shopDepth + player.radius : player.radius;
  const maxX = isInShop ? -player.radius : world.width - player.radius;
  const minY = isInShop ? shopDoor.y - 470 + player.radius : player.radius;
  const maxY = isInShop ? shopDoor.y + 470 - player.radius : world.height - player.radius;

  player.x = clamp(nextX, minX, maxX);
  player.y = clamp(nextY, minY, maxY);

  if (player.x !== nextX) {
    player.vx = 0;
  }

  if (player.y !== nextY) {
    player.vy = 0;
  }

  player.shotTimer -= delta;
  player.swingTimer = Math.max(0, player.swingTimer - delta);
  player.punchTimer = Math.max(0, player.punchTimer - delta);
  player.knifeSwapTimer = Math.max(0, player.knifeSwapTimer - delta);
  player.lightningThrustTimer = Math.max(0, player.lightningThrustTimer - delta);
  player.railburstTimer = Math.max(0, player.railburstTimer - delta);
  for (const skill of Object.keys(player.skillCooldowns)) {
    player.skillCooldowns[skill] = Math.max(0, (player.skillCooldowns[skill] || 0) - delta);
  }
  player.skillCooldowns.knifeRecall = Math.max(player.skillCooldowns.knifeRecall || 0, player.knifeSwapTimer);
  if (player.testMode) {
    player.dashTimer = 0;
    player.knifeSwapTimer = 0;
    player.lightningThrustTimer = 0;
    player.railburstTimer = 0;
    for (const skill of Object.keys(player.skillCooldowns)) {
      player.skillCooldowns[skill] = 0;
    }
  }
  if (player.staticCollapseCharging) {
    player.staticCollapseCharge = Math.min(staticCollapseChargeMax, player.staticCollapseCharge + delta);
  }
  if (player.railburstCharge) {
    player.railburstChargeTimer = Math.max(0, player.railburstChargeTimer - delta);
    if (player.railburstChargeTimer <= 0) {
      fireRailburst();
      player.railburstCharge = null;
    }
  }

  for (let index = player.pendingStaticCollapse.length - 1; index >= 0; index -= 1) {
    const collapse = player.pendingStaticCollapse[index];
    collapse.timer -= delta;

    if (collapse.timer > 0) {
      continue;
    }

    if (!sharedWorldActive) {
      for (let crateIndex = crates.length - 1; crateIndex >= 0; crateIndex -= 1) {
        const crate = crates[crateIndex];
        if (Math.hypot(crate.x - collapse.x, crate.y - collapse.y) <= collapse.radius + getCrateHitboxSize(crate) / 2) {
          damageCrate(crateIndex, collapse.damage);
        }
      }
    }

    player.pendingStaticCollapse.splice(index, 1);
  }
  for (let index = staticCollapseProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = staticCollapseProjectiles[index];
    const previousX = projectile.x;
    const previousY = projectile.y;
    const remaining = Math.hypot(projectile.endX - projectile.x, projectile.endY - projectile.y);
    const travel = Math.hypot(projectile.vx, projectile.vy) * delta;

    if (travel >= remaining) {
      projectile.x = projectile.endX;
      projectile.y = projectile.endY;
      player.pendingStaticCollapse.push({
        x: projectile.endX,
        y: projectile.endY,
        radius: staticCollapseRadius,
        damage: projectile.damage,
        timer: staticCollapseDelay,
      });
      addStaticCollapseBurstEffect(projectile.endX, projectile.endY);
      staticCollapseProjectiles.splice(index, 1);
      continue;
    }

    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;

    if (!sharedWorldActive) {
      for (let crateIndex = crates.length - 1; crateIndex >= 0; crateIndex -= 1) {
        const crate = crates[crateIndex];
        const crateKey = crate.id ?? `local-${crateIndex}`;
        if (projectile.hitCrateIds.has(crateKey)) continue;
        if (segmentHitsBox(previousX, previousY, projectile.x, projectile.y, crate, projectile.radius)) {
          projectile.hitCrateIds.add(crateKey);
          damageCrate(crateIndex, projectile.contactDamage);
        }
      }
    }
  }
  if (player.knifeCharging && weapons.slots[weapons.selectedSlot] === "knife") {
    player.knifeCharge = Math.min(player.knifeChargeMax, player.knifeCharge + delta);
  }
  player.dashTimer = Math.max(0, player.dashTimer - delta);

  for (const weaponName of ["glock", "awm"]) {
    const weapon = weapons[weaponName];

    if (weapon.reloadTimer > 0) {
      weapon.reloadTimer = Math.max(0, weapon.reloadTimer - delta);

      if (weapon.reloadTimer === 0) {
        const missing = Math.max(0, weapon.magazineSize - weapon.magAmmo);
        const loaded = Math.min(missing, weapon.ammo);
        weapon.magAmmo += loaded;
        weapon.ammo -= loaded;
      }
    }
  }

  player.hurtTimer = Math.max(0, player.hurtTimer - delta);

  if (mouse.down && player.shotTimer <= 0) {
    if (weapons.slots[weapons.selectedSlot] === "knife" && swingKnife()) {
      player.shotTimer = weapons.knife.fireRate;
    } else if (!weapons.slots[weapons.selectedSlot] && punch()) {
      player.shotTimer = weapons.fist.fireRate;
    } else if (fireBullet()) {
      player.shotTimer = weapons.slots[weapons.selectedSlot] === "awm" ? weapons.awm.fireRate : weapons.glock.fireRate;
    } else {
      player.shotTimer = 0.05;
    }
  }

  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    const bullet = bullets[index];

    const previousX = bullet.x;
    const previousY = bullet.y;
    bullet.previousX = previousX;
    bullet.previousY = previousY;
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    let hitCrate = false;
    let bulletSpent = false;
    let knifeDropPoint = null;

    for (let crateIndex = crates.length - 1; crateIndex >= 0; crateIndex -= 1) {
      const crate = crates[crateIndex];
      const crateKey = crate.id ?? `local-${crateIndex}`;

      if (bullet.hitCrateIds?.includes(crateKey)) {
        continue;
      }

      if (circleHitsBox(bullet, crate) || segmentHitsBox(previousX, previousY, bullet.x, bullet.y, crate, bullet.radius)) {
        const hitPoint = getBoxHitPoint(bullet, crate);
        const absorbed = Math.min(bullet.damage, crate.hp);
        hitCrate = true;
        bullet.hitCrateIds.push(crateKey);

        if (!sharedWorldActive) {
          damageCrate(crateIndex, absorbed);
        }

        if (bullet.weapon === "knife") {
          knifeDropPoint = hitPoint;
          bullet.damage -= absorbed;

          if (bullet.damage <= 0 || absorbed <= 0) {
            bulletSpent = true;
            break;
          }

          continue;
        }

        bullet.damage -= absorbed;

        if (bullet.damage <= 0) {
          bulletSpent = true;
          break;
        }
      }
    }

    if (!bulletSpent && sharedWorldActive) {
      for (const [remoteId, remote] of remotePlayers) {
        if (bullet.hitIds?.includes(remoteId)) {
          continue;
        }

        const remoteX = remote.renderX ?? remote.x;
        const remoteY = remote.renderY ?? remote.y;

        if (!segmentHitsCircle(previousX, previousY, bullet.x, bullet.y, remoteX, remoteY, bullet.radius + player.radius)) {
          continue;
        }

        if (bullet.weapon === "knife") {
          bullet.hitIds.push(remoteId);
          knifeDropPoint = { x: bullet.x, y: bullet.y };
          const absorbed = Math.min(bullet.damage, getRemoteDamageCapacity(remote));
          bullet.damage -= absorbed;
          bulletSpent = bullet.damage <= 0 || absorbed <= 0;
          if (bulletSpent) {
            break;
          }
          continue;
        }

        const absorbed = Math.min(bullet.damage, getRemoteDamageCapacity(remote));
        bullet.hitIds.push(remoteId);
        bullet.damage -= absorbed;

        if (bullet.damage <= 0 || absorbed <= 0) {
          bulletSpent = true;
          break;
        }

        break;
      }
    }

    const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

    if (bullet.weapon === "knife" && (expired || (bulletSpent && knifeDropPoint && !sharedWorldActive))) {
      dropPickupAt(knifeDropPoint?.x ?? bullet.x, knifeDropPoint?.y ?? bullet.y, bullet.pickup || { type: "knife", count: 1 });
    }

    if (bullet.weapon === "knife" && bulletSpent && knifeDropPoint && sharedWorldActive) {
      spawnPickup(knifeDropPoint.x, knifeDropPoint.y, "knife", { count: 1, predicted: true, expiresAt: Date.now() + 900 });
    }

    if (bulletSpent || expired) {
      bullets.splice(index, 1);
    }
  }

  for (let index = remoteBullets.length - 1; index >= 0; index -= 1) {
    const bullet = remoteBullets[index];

    const previousX = bullet.x;
    const previousY = bullet.y;
    bullet.previousX = previousX;
    bullet.previousY = previousY;
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    let bulletSpent = false;

    for (const crate of crates) {
      const crateKey = crate.id ?? `remote-${crates.indexOf(crate)}`;

      if (bullet.hitCrateIds?.includes(crateKey)) {
        continue;
      }

      if (!circleHitsBox(bullet, crate) && !segmentHitsBox(previousX, previousY, bullet.x, bullet.y, crate, bullet.radius)) {
        continue;
      }

      bullet.hitCrateIds = bullet.hitCrateIds || [];
      bullet.hitCrateIds.push(crateKey);

      const absorbed = Math.min(bullet.damage, Math.max(0, crate.hp));
      bullet.damage -= absorbed;

      if (bullet.damage <= 0 || absorbed <= 0) {
        bulletSpent = true;
      }

      break;
    }

    const hitPlayer =
      !bulletSpent && !bullet.hitLocal && segmentHitsCircle(previousX, previousY, bullet.x, bullet.y, player.x, player.y, bullet.radius + player.radius);
    const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

    if (hitPlayer) {
      const absorbed = Math.min(bullet.damage, getPlayerDamageCapacity());
      bullet.hitLocal = true;

      if (absorbed > 0 && !sharedWorldActive) {
        applyDamage(absorbed, bullet.ownerId, { vx: bullet.vx, vy: bullet.vy });
        bullet.damage -= absorbed;
      } else if (absorbed > 0) {
        bullet.damage -= absorbed;
      }

      if (bullet.weapon === "knife") {
        if (bullet.damage <= 0 || absorbed <= 0) {
          if (!sharedWorldActive) {
            dropPickupAt(bullet.x, bullet.y, bullet.pickup || { type: "knife", count: 1 });
          }
          bulletSpent = true;
        }
      } else if (bullet.damage <= 0 || absorbed <= 0) {
        bulletSpent = true;
      }
    }

    if (expired && bullet.weapon === "knife" && !sharedWorldActive) {
          dropPickupAt(bullet.x, bullet.y, bullet.pickup || { type: "knife", count: 1 });
    }

    if (bulletSpent || expired) {
      remoteBullets.splice(index, 1);
    }
  }

  for (let index = pickups.length - 1; index >= 0; index -= 1) {
    const pickup = pickups[index];

    if (pickup.expiresAt && pickup.expiresAt <= Date.now()) {
      pickups.splice(index, 1);
      continue;
    }

    const distanceToPickup = Math.hypot(pickup.x - player.x, pickup.y - player.y);

    const passiveMagnetRange = getPassiveMagnetRange();
    const passiveMagnetSpeed = getPassiveMagnetSpeed();

    if (passiveMagnetRange > 0 && distanceToPickup <= passiveMagnetRange && canMagnetPickup(pickup)) {
      pickup.magnetized = true;
    }

    if (pickup.magnetized && distanceToPickup > pickup.radius + player.radius) {
      const pullSpeed = passiveMagnetSpeed > 0 ? passiveMagnetSpeed : magnetBaseSpeed;
      const pull = Math.min(distanceToPickup, pullSpeed * delta);
      pickup.x += ((player.x - pickup.x) / distanceToPickup) * pull;
      pickup.y += ((player.y - pickup.y) / distanceToPickup) * pull;
    }

    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) <= pickup.radius + player.radius) {
      collectPickup(index);
    }
  }

  crateRegenTimer -= delta;

  if (!sharedWorldActive && crateRegenTimer <= 0) {
    for (const kind of crateTierOrder) {
      if (getCrateCount(kind) < crateTiers[kind].count) {
        spawnCrate(kind);
      }
    }

    crateRegenTimer = crateRespawnSeconds;
  }

  camera.x += (player.x - camera.x) * camera.smoothing;
  camera.y += (player.y - camera.y) * camera.smoothing;

  lastNetworkSend -= delta;
  saveTimer -= delta;

  if (lastNetworkSend <= 0) {
    sendNetwork("state", { state: getPlayerSnapshot() });
    lastNetworkSend = networkStateInterval;
  }

  if (saveTimer <= 0) {
    saveCharacterProfile();
    saveTimer = activeAccount?.token ? 8 : 1;
  }

  coords.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
  healthStatus.textContent = `HP ${Math.ceil(player.health)} / ${player.maxHealth} | SH ${Math.ceil(player.shield)}`;
  healthBarFill.style.width = `${clamp(player.health / player.maxHealth, 0, 1) * 100}%`;
  updateXpHud();
  updateCoinHud();
  updateChatLog();
  updateSkillHud();
  updateUpgradePanel();
  updateInventory();

  if (player.dashTimer > 0) {
    dashStatus.textContent = `Dash ${player.dashTimer.toFixed(1)}s`;
    dashStatus.classList.remove("ready");
    dashStatus.classList.add("cooldown");
  } else {
    dashStatus.textContent = "Dash ready";
    dashStatus.classList.remove("cooldown");
    dashStatus.classList.add("ready");
  }
}

function selectWeapon(slot) {
  if (slot < 1 || slot > 3) {
    return;
  }

  weapons.selectedSlot = slot;
  player.knifeCharging = false;
  player.knifeCharge = 0;
  updateInventory();
}

function getWeaponDisplay(weaponName) {
  if (weaponName === "knife") {
    return {
      label: "Knife",
      icon: `<span class="weapon-icon knife-icon">
        <span class="knife-blade"></span>
        <span class="knife-handle"></span>
      </span>`,
      meta: `x${weapons.knife.count}`,
    };
  }

  if (weaponName === "glock") {
    const meta =
      weapons.glock.reloadTimer > 0
        ? `Reload ${weapons.glock.reloadTimer.toFixed(1)}s`
        : `${weapons.glock.magAmmo} / ${weapons.glock.ammo}`;

    return {
      label: "Glock",
      icon: `<span class="weapon-icon glock-icon">
        <span class="glock-slide"></span>
        <span class="glock-grip"></span>
        <span class="glock-trigger"></span>
      </span>`,
      meta,
    };
  }

  if (weaponName === "awm") {
    const meta =
      weapons.awm.reloadTimer > 0
        ? `Reload ${weapons.awm.reloadTimer.toFixed(1)}s`
        : `${weapons.awm.magAmmo} / ${weapons.awm.ammo}`;

    return {
      label: "AWM",
      icon: `<span class="weapon-icon awm-icon">
        <span class="awm-scope"></span>
        <span class="awm-barrel"></span>
        <span class="awm-body"></span>
        <span class="awm-stock"></span>
      </span>`,
      meta,
    };
  }

  return {
    label: "Empty",
    icon: `<span class="empty-mark"></span>`,
    meta: "",
  };
}

function updateInventory() {
  for (const slot of inventorySlots) {
    const slotNumber = Number(slot.dataset.slot);
    const weaponName = weapons.slots[slotNumber];
    const display = getWeaponDisplay(weaponName);

    slot.classList.toggle("active", slotNumber === weapons.selectedSlot);
    slot.classList.toggle("empty", !weaponName);
    slot.draggable = false;
    slot.setAttribute("aria-label", `Slot ${slotNumber} ${display.label}`);
    slot.innerHTML = `<span class="slot-key">${slotNumber}</span>${display.icon}<span class="slot-name">${display.label}</span><span class="slot-meta">${display.meta}</span>`;
  }
}

function swapSlots(fromSlot, toSlot) {
  if (fromSlot === toSlot) {
    return;
  }

  const fromWeapon = weapons.slots[fromSlot];
  weapons.slots[fromSlot] = weapons.slots[toSlot];
  weapons.slots[toSlot] = fromWeapon;

  if (!weapons.slots[weapons.selectedSlot]) {
    weapons.selectedSlot = 1;
  }

  updateInventory();
}

function getInventorySlotFromPoint(x, y) {
  return document.elementFromPoint(x, y)?.closest(".slot") || null;
}

function clearWeaponDragTarget() {
  for (const inventorySlot of inventorySlots) {
    inventorySlot.classList.remove("dragging", "drop-target");
  }
}

function createWeaponDragPreview(slotElement) {
  if (weaponDragPreview || !slotElement) {
    return;
  }

  weaponDragPreview = document.createElement("div");
  weaponDragPreview.className = "weapon-drag-preview";
  weaponDragPreview.innerHTML = slotElement.innerHTML;
  document.body.appendChild(weaponDragPreview);
}

function updateWeaponDragPreview(x, y) {
  if (!weaponDragPreview) {
    return;
  }

  weaponDragPreview.style.transform = `translate(${x - 42}px, ${y - 46}px)`;
}

function removeWeaponDragPreview() {
  weaponDragPreview?.remove();
  weaponDragPreview = null;
}

function dropSelectedWeapon() {
  const selectedWeapon = weapons.slots[weapons.selectedSlot];

  if (!selectedWeapon) {
    return;
  }

  const angle = getAimAngle();
  const dropX = player.x + Math.cos(angle) * 112;
  const dropY = player.y + Math.sin(angle) * 112;

  if (selectedWeapon === "knife") {
    dropPickupAt(dropX, dropY, { type: "knife", count: Math.max(1, weapons.knife.count) });
    weapons.knife.count = 0;
    weapons.slots[weapons.selectedSlot] = null;
  } else {
    dropPickupAt(dropX, dropY, {
      type: selectedWeapon,
      ammo: weapons[selectedWeapon].ammo,
      magAmmo: weapons[selectedWeapon].magAmmo,
    });
    weapons[selectedWeapon].ammo = 0;
    weapons[selectedWeapon].magAmmo = 0;
    weapons[selectedWeapon].reloadTimer = 0;
    weapons.slots[weapons.selectedSlot] = null;
  }

  player.knifeCharging = false;
  player.knifeCharge = 0;

  const nextSlot = [1, 2, 3].find((slot) => weapons.slots[slot]);
  weapons.selectedSlot = nextSlot || weapons.selectedSlot;
  updateInventory();
  updateXpHud();
  updateUpgradePanel();
}

function dropAllLoot(x, y) {
  const angles = [0, Math.PI * 0.66, Math.PI * 1.33, Math.PI, Math.PI * 1.66];
  let dropIndex = 0;

  for (const slot of [1, 2, 3]) {
    const weaponName = weapons.slots[slot];

    if (!weaponName) {
      continue;
    }

    const angle = angles[dropIndex % angles.length];
    const dropX = x + Math.cos(angle) * (44 + dropIndex * 8);
    const dropY = y + Math.sin(angle) * (44 + dropIndex * 8);

    if (weaponName === "knife") {
      dropPickupAt(dropX, dropY, { type: "knife", count: Math.max(1, weapons.knife.count) });
    } else {
      dropPickupAt(dropX, dropY, {
        type: weaponName,
        ammo: weapons[weaponName].ammo,
        magAmmo: weapons[weaponName].magAmmo,
      });
    }

    dropIndex += 1;
  }

  getXpDropValues(getDeathXpDrop()).forEach((value, index) => {
    const angle = index * 2.399963;
    const distance = 18 + Math.sqrt(index) * 13;
    dropPickupAt(x + 18 + Math.cos(angle) * distance, y - 42 + Math.sin(angle) * distance, { type: "xp", value });
  });

  getCoinDropEntries(getDeathCoinDrop()).forEach((entry, index) => {
    const angle = index * 2.399963 + Math.PI / 5;
    const distance = 18 + Math.sqrt(index) * 13;
    dropPickupAt(x - 18 + Math.cos(angle) * distance, y + 42 + Math.sin(angle) * distance, { type: "coin", ...entry });
  });
}

function worldToScreenX(x) {
  return (x - camera.x) * camera.zoom + width / 2;
}

function worldToScreenY(y) {
  return (y - camera.y) * camera.zoom + height / 2;
}

function drawShopArea() {
  const left = worldToScreenX(-shopDepth);
  const right = worldToScreenX(0);
  const top = worldToScreenY(shopDoor.y - 470);
  const bottom = worldToScreenY(shopDoor.y + 470);

  ctx.save();
  ctx.fillStyle = "rgba(28, 24, 22, 0.92)";
  ctx.fillRect(left, top, right - left, bottom - top);

  ctx.strokeStyle = "rgba(255, 207, 95, 0.22)";
  ctx.lineWidth = 1;
  for (let x = Math.floor(left / 70) * 70; x < right; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  for (let y = Math.floor(top / 70) * 70; y < bottom; y += 70) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 207, 95, 0.12)";
  ctx.strokeStyle = "rgba(255, 207, 95, 0.55)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(left + 42, top + 44, right - left - 84, bottom - top - 88, 8);
  ctx.fill();
  ctx.stroke();

  const counterX = worldToScreenX(shopNpc.x + 110);
  const counterY = worldToScreenY(shopNpc.y + 52);
  ctx.fillStyle = "#5b3725";
  ctx.strokeStyle = "#ffcf5f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(counterX - 150, counterY - 26, 300, 52, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffcf5f";
  ctx.font = "900 18px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SHOP", counterX, counterY + 6);

  const npcX = worldToScreenX(shopNpc.x);
  const npcY = worldToScreenY(shopNpc.y);
  ctx.fillStyle = "#b77a3d";
  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(npcX, npcY, shopNpc.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6f2e9";
  ctx.beginPath();
  ctx.arc(npcX - 9, npcY - 5, 4, 0, Math.PI * 2);
  ctx.arc(npcX + 9, npcY - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(npcX - 10, npcY + 10);
  ctx.lineTo(npcX + 10, npcY + 10);
  ctx.stroke();

  if (isNearShopNpc()) {
    drawWorldPrompt(shopNpc.x, shopNpc.y - 60, "K: Shop 준비중");
  }

  ctx.restore();
}

function drawWorldPrompt(x, y, text) {
  const screenX = worldToScreenX(x);
  const screenY = worldToScreenY(y);

  ctx.save();
  ctx.fillStyle = "rgba(16, 18, 20, 0.78)";
  ctx.strokeStyle = "rgba(246, 242, 233, 0.24)";
  ctx.lineWidth = 1;
  ctx.font = "900 13px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const boxWidth = ctx.measureText(text).width + 24;
  ctx.beginPath();
  ctx.roundRect(screenX - boxWidth / 2, screenY - 15, boxWidth, 30, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6f2e9";
  ctx.fillText(text, screenX, screenY + 1);
  ctx.restore();
}

function drawGrid() {
  const gridSize = 80;
  const viewHalfWidth = width / 2 / camera.zoom;
  const viewHalfHeight = height / 2 / camera.zoom;
  const startX = Math.floor((camera.x - viewHalfWidth) / gridSize) * gridSize;
  const endX = camera.x + viewHalfWidth + gridSize;
  const startY = Math.floor((camera.y - viewHalfHeight) / gridSize) * gridSize;
  const endY = camera.y + viewHalfHeight + gridSize;

  ctx.lineWidth = 1;

  for (let x = startX; x <= endX; x += gridSize) {
    const screenX = worldToScreenX(x);
    ctx.strokeStyle = x % 400 === 0 ? "rgba(246, 242, 233, 0.16)" : "rgba(246, 242, 233, 0.07)";
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y += gridSize) {
    const screenY = worldToScreenY(y);
    ctx.strokeStyle = y % 400 === 0 ? "rgba(246, 242, 233, 0.16)" : "rgba(246, 242, 233, 0.07)";
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(width, screenY);
    ctx.stroke();
  }
}

function drawWorldBounds() {
  const left = worldToScreenX(0);
  const right = worldToScreenX(world.width);
  const top = worldToScreenY(0);
  const bottom = worldToScreenY(world.height);
  const doorTop = worldToScreenY(shopDoor.y - shopDoor.height / 2);
  const doorBottom = worldToScreenY(shopDoor.y + shopDoor.height / 2);

  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(255, 95, 95, 0.72)";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, doorBottom);
  ctx.moveTo(left, doorTop);
  ctx.lineTo(left, top);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 95, 95, 0.18)";
  ctx.strokeStyle = "#ffcf5f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(left - 16, doorTop, 32, doorBottom - doorTop, 8);
  ctx.fill();
  ctx.stroke();

  if (isNearShopDoor()) {
    drawWorldPrompt(shopDoor.x + (player.x < 0 ? -90 : 90), shopDoor.y - shopDoor.height / 2 - 42, "K: 이동");
  }
}

function drawChestCrate(half, kind) {
  const palette = {
    bronze: {
      body: ["#b37a35", "#8b5828", "#5c351b"],
      panel: "#855127",
      trim: "#69737b",
      trimHi: "#c2ccd3",
      trimLo: "#313940",
      lock: "#89949d",
      stroke: "#1a2025",
    },
    metal: {
      body: ["#5b646c", "#3a424a", "#20272d"],
      panel: "#343c43",
      trim: "#171e24",
      trimHi: "#7d8790",
      trimLo: "#0e1419",
      lock: "#424a52",
      stroke: "#10161b",
    },
    gold: {
      body: ["#ca4937", "#a32a20", "#751812"],
      panel: "#9b241b",
      trim: "#e7b642",
      trimHi: "#ffe89a",
      trimLo: "#8e5a12",
      lock: "#e0af39",
      stroke: "#5b240c",
    },
    royal: {
      body: ["#7131b2", "#561b8d", "#321052"],
      panel: "#4c167d",
      trim: "#e7b642",
      trimHi: "#ffe89a",
      trimLo: "#8e5a12",
      lock: "#437fe5",
      stroke: "#24103e",
    },
  }[kind] || {
    body: ["#5b646c", "#3a424a", "#20272d"],
    panel: "#343c43",
    trim: "#171e24",
    trimHi: "#7d8790",
    trimLo: "#0e1419",
    lock: "#424a52",
    stroke: "#10161b",
  };

  const bodyGradient = ctx.createLinearGradient(-half, -half, half, half);
  bodyGradient.addColorStop(0, palette.body[0]);
  bodyGradient.addColorStop(0.48, palette.body[1]);
  bodyGradient.addColorStop(1, palette.body[2]);

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(-half + 5, -half + 7, half * 2, half * 2, 7);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-half, -half, half * 2, half * 2, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.panel;
  ctx.beginPath();
  ctx.roundRect(-half + 7, -half + 7, half * 2 - 14, half * 2 - 14, 4);
  ctx.fill();

  const lidShine = ctx.createLinearGradient(-half, -half, half, half);
  lidShine.addColorStop(0, "rgba(255,255,255,0.22)");
  lidShine.addColorStop(0.4, "rgba(255,255,255,0)");
  lidShine.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = lidShine;
  ctx.beginPath();
  ctx.roundRect(-half + 7, -half + 7, half * 2 - 14, half * 2 - 14, 4);
  ctx.fill();

  ctx.strokeStyle = palette.trim;
  ctx.lineWidth = 8;
  for (const stripeX of [-half * 0.58, half * 0.58]) {
    ctx.beginPath();
    ctx.moveTo(stripeX, -half + 5);
    ctx.lineTo(stripeX, half - 5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-half + 5, 0);
  ctx.lineTo(half - 5, 0);
  ctx.stroke();

  ctx.strokeStyle = palette.trimHi;
  ctx.lineWidth = 2;
  for (const stripeX of [-half * 0.58 - 2, half * 0.58 - 2]) {
    ctx.beginPath();
    ctx.moveTo(stripeX, -half + 7);
    ctx.lineTo(stripeX, half - 7);
    ctx.stroke();
  }
  ctx.strokeStyle = palette.trimLo;
  for (const stripeX of [-half * 0.58 + 3, half * 0.58 + 3]) {
    ctx.beginPath();
    ctx.moveTo(stripeX, -half + 7);
    ctx.lineTo(stripeX, half - 7);
    ctx.stroke();
  }

  ctx.fillStyle = palette.trim;
  for (const cornerX of [-half + 8, half - 18]) {
    for (const cornerY of [-half + 8, half - 18]) {
      ctx.beginPath();
      ctx.roundRect(cornerX, cornerY, 10, 10, 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = palette.trimHi;
  for (const rivetX of [-half + 13, -half * 0.58, half * 0.58, half - 13]) {
    for (const rivetY of [-half + 13, half - 13]) {
      ctx.beginPath();
      ctx.arc(rivetX, rivetY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = palette.lock;
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-11, -10);
  ctx.lineTo(11, -10);
  ctx.lineTo(15, -4);
  ctx.lineTo(15, 7);
  ctx.lineTo(11, 11);
  ctx.lineTo(-11, 11);
  ctx.lineTo(-15, 7);
  ctx.lineTo(-15, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.stroke;
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-2, 2, 4, 7);
}

function drawBronzeCrate(half) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(-half + 5, -half + 7, half * 2, half * 2, 6);
  ctx.fill();
  ctx.restore();

  const wood = ctx.createLinearGradient(-half, -half, half, half);
  wood.addColorStop(0, "#b57a35");
  wood.addColorStop(0.45, "#8e5b28");
  wood.addColorStop(1, "#63391c");
  ctx.fillStyle = wood;
  ctx.strokeStyle = "#1a2025";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-half, -half, half * 2, half * 2, 5);
  ctx.fill();
  ctx.stroke();

  const inset = ctx.createLinearGradient(-half + 7, -half + 7, half - 7, half - 7);
  inset.addColorStop(0, "rgba(255, 214, 148, 0.18)");
  inset.addColorStop(0.52, "rgba(255, 255, 255, 0)");
  inset.addColorStop(1, "rgba(0, 0, 0, 0.24)");
  ctx.fillStyle = inset;
  ctx.beginPath();
  ctx.roundRect(-half + 7, -half + 7, half * 2 - 14, half * 2 - 14, 4);
  ctx.fill();

  ctx.strokeStyle = "rgba(86, 48, 22, 0.72)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-half + 14, -half + 14);
  ctx.lineTo(half - 14, half - 14);
  ctx.moveTo(half - 14, -half + 14);
  ctx.lineTo(-half + 14, half - 14);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 208, 132, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-half + 16, -half + 16);
  ctx.lineTo(half - 16, half - 16);
  ctx.moveTo(half - 16, -half + 16);
  ctx.lineTo(-half + 16, half - 16);
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.fillStyle = "#6b737b";
  ctx.strokeStyle = "#222a30";
  ctx.lineWidth = 2;
  for (const stripeX of [-half * 0.58, half * 0.58]) {
    ctx.beginPath();
    ctx.roundRect(stripeX - 5, -half + 4, 10, half * 2 - 8, 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(-half + 4, -5, half * 2 - 8, 10, 2);
  ctx.fill();
  ctx.stroke();

  const topBottomPlate = ctx.createLinearGradient(-half, 0, half, 0);
  topBottomPlate.addColorStop(0, "#69737b");
  topBottomPlate.addColorStop(0.5, "#aeb8bf");
  topBottomPlate.addColorStop(1, "#69737b");
  ctx.fillStyle = topBottomPlate;
  ctx.strokeStyle = "#222a30";
  for (const plateY of [-half + 8, half - 18]) {
    ctx.beginPath();
    ctx.roundRect(-10, plateY, 20, 10, 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(214, 224, 230, 0.72)";
  ctx.lineWidth = 2;
  for (const stripeX of [-half * 0.58 - 2, half * 0.58 - 2]) {
    ctx.beginPath();
    ctx.moveTo(stripeX, -half + 7);
    ctx.lineTo(stripeX, half - 7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-half + 7, -2);
  ctx.lineTo(half - 7, -2);
  ctx.stroke();

  ctx.fillStyle = "#707981";
  ctx.strokeStyle = "#222a30";
  ctx.lineWidth = 2;
  for (const cornerX of [-half + 5, half - 15]) {
    for (const cornerY of [-half + 5, half - 15]) {
      ctx.beginPath();
      ctx.roundRect(cornerX, cornerY, 10, 10, 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#d1d9df";
  for (const [rivetX, rivetY] of [
    [-half + 10, -half + 10],
    [half - 10, -half + 10],
    [-half + 10, half - 10],
    [half - 10, half - 10],
    [-half * 0.58, -half + 10],
    [half * 0.58, -half + 10],
    [-half * 0.58, half - 10],
    [half * 0.58, half - 10],
  ]) {
    ctx.beginPath();
    ctx.arc(rivetX, rivetY, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#353c43";
  for (const plateY of [-half + 13, half - 13]) {
    ctx.beginPath();
    ctx.arc(0, plateY, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const lockGradient = ctx.createLinearGradient(-14, -12, 14, 12);
  lockGradient.addColorStop(0, "#aeb8bf");
  lockGradient.addColorStop(1, "#6d757d");
  ctx.fillStyle = lockGradient;
  ctx.strokeStyle = "#222a30";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-11, -10);
  ctx.lineTo(11, -10);
  ctx.lineTo(15, -4);
  ctx.lineTo(15, 7);
  ctx.lineTo(11, 11);
  ctx.lineTo(-11, 11);
  ctx.lineTo(-15, 7);
  ctx.lineTo(-15, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#353c43";
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-2, 2, 4, 7);
}

function drawCrates() {
  for (const crate of [...crates, ...previewCrates]) {
    const x = worldToScreenX(crate.x);
    const y = worldToScreenY(crate.y);
    const half = crate.size / 2;
    const kind = crate.kind || "basic";
    const sprite = crateSprites[kind] || crateSprites.basic;

    if (x < -80 || x > width + 80 || y < -80 || y > height + 80) {
      continue;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(crate.rotation);

    if (kind === "royal") {
      ctx.fillStyle = "rgba(169, 93, 255, 0.18)";
      ctx.beginPath();
      ctx.arc(0, 0, half * 1.45, 0, Math.PI * 2);
      ctx.fill();
    }

    if (sprite.complete && sprite.naturalWidth > 0) {
      const spriteScale = getCrateSpriteScale(kind);
      const spriteWidth = crate.size * spriteScale;
      const spriteHeight = spriteWidth * (sprite.naturalHeight / sprite.naturalWidth);
      ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#000";
      ctx.fillRect(-half + 5, -half + 6, crate.size, crate.size);
      ctx.restore();
      const wood = ctx.createLinearGradient(-half, -half, half, half);
      wood.addColorStop(0, "#b87934");
      wood.addColorStop(0.55, "#91602d");
      wood.addColorStop(1, "#6a421f");
      ctx.fillStyle = wood;
      ctx.strokeStyle = "#50311d";
      ctx.lineWidth = 4;
      ctx.fillRect(-half, -half, crate.size, crate.size);
      ctx.strokeRect(-half, -half, crate.size, crate.size);

      ctx.strokeStyle = "rgba(255, 224, 166, 0.16)";
      ctx.lineWidth = 2;
      for (const offset of [-half * 0.52, 0, half * 0.52]) {
        ctx.beginPath();
        ctx.moveTo(-half + 6, offset);
        ctx.lineTo(half - 6, offset + 3);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(255, 215, 134, 0.58)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-half + 8, -half + 8);
      ctx.lineTo(half - 8, half - 8);
      ctx.moveTo(half - 8, -half + 8);
      ctx.lineTo(-half + 8, half - 8);
      ctx.stroke();
    }

    const hpRatio = clamp(crate.hp / crate.maxHp, 0, 1);
    ctx.rotate(-crate.rotation);
    ctx.fillStyle = "rgba(16, 18, 20, 0.72)";
    ctx.fillRect(-24, half + 8, 48, 6);
    ctx.fillStyle = hpRatio > 0.5 ? "#8df4df" : "#ff9cb5";
    ctx.fillRect(-24, half + 8, 48 * hpRatio, 6);

    ctx.restore();

    if (hitboxDebug) {
      drawCrateDebugOverlay(crate);
    }
  }
}

function drawCrateDebugOverlay(crate) {
  const x = worldToScreenX(crate.x);
  const y = worldToScreenY(crate.y);
  const dimensions = getCrateHitboxDimensions(crate);
  const boxWidth = dimensions.width * camera.zoom;
  const boxHeight = dimensions.height * camera.zoom;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(crate.rotation || 0);
  ctx.strokeStyle = (crate.kind || "basic") === "bronze" ? "rgba(255, 92, 128, 0.96)" : "rgba(141, 244, 223, 0.78)";
  ctx.fillStyle = (crate.kind || "basic") === "bronze" ? "rgba(255, 92, 128, 0.09)" : "rgba(141, 244, 223, 0.06)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
  ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
  ctx.setLineDash([]);
  ctx.rotate(-(crate.rotation || 0));
  ctx.fillStyle = "rgba(246, 242, 233, 0.92)";
  ctx.font = "800 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${crate.kind || "basic"} ${Math.round(crate.hp)}/${crate.maxHp}`, 0, -boxHeight / 2 - 10);
  ctx.restore();
}

function drawPickups(time) {
  for (const pickup of [...pickups, ...previewPickups]) {
    const x = worldToScreenX(pickup.x);
    const y = worldToScreenY(pickup.y) + Math.sin(time * 0.005 + pickup.bob) * 4;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(16, 18, 20, 0.72)";
    ctx.strokeStyle = "rgba(246, 242, 233, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-20, -20, 40, 40, 8);
    ctx.fill();
    ctx.stroke();

    if (pickup.type === "knife") {
      ctx.rotate(-0.5);
      ctx.fillStyle = "#d9e0e3";
      ctx.strokeStyle = "#55666f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.lineTo(16, -2);
      ctx.lineTo(-2, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#20272b";
      ctx.fillRect(-17, -4, 15, 7);
    } else if (pickup.type === "glock") {
      ctx.fillStyle = "#0c0f12";
      ctx.strokeStyle = "#58616a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-17, -9, 30, 9, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#161b20";
      ctx.fillRect(-15, -4, 20, 8);
      ctx.fillStyle = "#090b0d";
      ctx.save();
      ctx.translate(3, 0);
      ctx.transform(1, 0, 0.22, 1, 0, 0);
      ctx.fillRect(0, 0, 10, 18);
      ctx.restore();
      ctx.strokeStyle = "#080a0c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-1, 6, 6, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.fillStyle = "#111417";
    } else if (pickup.type === "awm") {
      ctx.strokeStyle = "#101417";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      ctx.fillStyle = "#6f7750";
      ctx.beginPath();
      ctx.roundRect(-17, -4, 18, 9, 5);
      ctx.fill();
      ctx.strokeStyle = "#0a0d0f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4, -9);
      ctx.lineTo(11, -9);
      ctx.stroke();
    } else if (pickup.type === "armor") {
      ctx.fillStyle = "#15191f";
      ctx.strokeStyle = "#303844";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -13);
      ctx.quadraticCurveTo(-8, -18, -2, -10);
      ctx.quadraticCurveTo(0, -7, 2, -10);
      ctx.quadraticCurveTo(8, -18, 14, -13);
      ctx.lineTo(16, 12);
      ctx.lineTo(9, 16);
      ctx.lineTo(-9, 16);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#262d36";
      ctx.fillRect(-10, -3, 20, 12);
      ctx.fillStyle = "#0d1015";
      for (let row = 0; row < 3; row += 1) {
        ctx.fillRect(-13, 5 + row * 5, 26, 2);
      }
      ctx.fillStyle = "#3a4350";
      ctx.fillRect(-11, -11, 7, 11);
      ctx.fillRect(4, -11, 7, 11);
    } else if (pickup.type === "medkit") {
      ctx.fillStyle = "#f6f2e9";
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = "#ef6f8f";
      ctx.fillRect(-4, -10, 8, 20);
      ctx.fillRect(-10, -4, 20, 8);
    } else if (pickup.type === "xp") {
      const value = pickup.value || xpDropValue;
      const pulse = 1 + Math.sin(time * 0.01 + pickup.bob) * 0.06;
      const isAstralXp = value >= astralXpValue;
      const isNovaXp = value >= novaXpValue && !isAstralXp;
      const isGoldXp = value >= goldCrateXpValue && !isNovaXp && !isAstralXp;
      const isMetalXp = value >= metalCrateXpValue && !isGoldXp && !isNovaXp && !isAstralXp;
      const orbRadius = isAstralXp ? 13 : isNovaXp ? 12.5 : isGoldXp ? 11.5 : isMetalXp ? 10.5 : 8.5;
      const outerGlow = isAstralXp
        ? "rgba(255, 126, 54, 0.34)"
        : isNovaXp
          ? "rgba(255, 122, 217, 0.34)"
          : isGoldXp
            ? "rgba(144, 72, 255, 0.34)"
            : isMetalXp
              ? "rgba(0, 219, 255, 0.34)"
              : "rgba(0, 126, 255, 0.32)";
      const rim = isAstralXp ? "#ff7b23" : isNovaXp ? "#ff8fe9" : isGoldXp ? "#c47aff" : isMetalXp ? "#6ff5ff" : "#2f8fff";
      const inner = isAstralXp ? "#f12618" : isNovaXp ? "#ef7fb5" : isGoldXp ? "#8d35ff" : isMetalXp ? "#12d9ff" : "#006cff";
      const core = isAstralXp ? "#ffd4cf" : isNovaXp ? "#ffd8ef" : isGoldXp ? "#efd6ff" : isMetalXp ? "#d9ffff" : "#98d8ff";
      ctx.scale(pulse, pulse);

      const glow = ctx.createRadialGradient(0, 0, orbRadius * 0.2, 0, 0, orbRadius * 2.3);
      glow.addColorStop(0, outerGlow);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, orbRadius * 2.3, 0, Math.PI * 2);
      ctx.fill();

      const orb = ctx.createRadialGradient(-4, -5, 1, 0, 0, orbRadius);
      orb.addColorStop(0, core);
      orb.addColorStop(0.28, inner);
      orb.addColorStop(1, isAstralXp ? "#a61d13" : isNovaXp ? "#9b3d73" : isGoldXp ? "#4a128c" : isMetalXp ? "#066b8f" : "#05336f");
      ctx.fillStyle = orb;
      ctx.strokeStyle = rim;
      ctx.lineWidth = isAstralXp || isNovaXp || isGoldXp ? 2.5 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = isAstralXp
        ? "rgba(255, 247, 235, 0.34)"
        : isNovaXp
          ? "rgba(255, 226, 168, 0.34)"
          : isGoldXp
            ? "rgba(239, 214, 255, 0.34)"
            : isMetalXp
              ? "rgba(217, 255, 255, 0.32)"
              : "rgba(152, 216, 255, 0.3)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, orbRadius * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
      ctx.beginPath();
      ctx.arc(-4, -5, isAstralXp ? 3.8 : isNovaXp || isGoldXp ? 3.4 : 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isAstralXp
        ? "rgba(182, 200, 255, 0.34)"
        : isNovaXp
          ? "rgba(255, 125, 181, 0.38)"
          : isGoldXp
            ? "rgba(224, 177, 255, 0.42)"
            : isMetalXp
              ? "rgba(111, 245, 255, 0.36)"
              : "rgba(47, 143, 255, 0.34)";
      ctx.beginPath();
      ctx.arc(4, 4, orbRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      if (isAstralXp) {
        ctx.fillStyle = "rgba(255, 247, 235, 0.78)";
        for (let spark = 0; spark < 7; spark += 1) {
          const angle = spark * (Math.PI * 2 / 7) - time * 0.0011;
          const distance = orbRadius + 8 + Math.sin(time * 0.004 + spark) * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, spark % 3 ? 1 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pickup.type === "coin") {
      const coinKind = pickup.coinKind || "bronze";
      if (coinKind === "bill" || coinKind === "bigBill") {
        const isBigBill = coinKind === "bigBill";
        ctx.save();
        ctx.rotate(-0.16);
        ctx.fillStyle = isBigBill ? "#f2ddb2" : "#bdebd6";
        ctx.strokeStyle = isBigBill ? "#8b5e14" : "#2d6f62";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-20, -11, 40, 22, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isBigBill ? "rgba(139, 94, 20, 0.16)" : "rgba(45, 111, 98, 0.16)";
        ctx.fillRect(-13, -7, 26, 14);
        ctx.strokeStyle = isBigBill ? "rgba(139, 94, 20, 0.42)" : "rgba(45, 111, 98, 0.42)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, isBigBill ? 5.6 : 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = isBigBill ? "#8b5e14" : "#2d6f62";
        ctx.font = "900 7px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isBigBill ? "10000" : "1000", 0, 0);
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.beginPath();
        ctx.arc(-13, -7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
        continue;
      }
      const fill = coinKind === "gold" ? "#ffcf5f" : coinKind === "silver" ? "#d7dde2" : "#b9783d";
      const stroke = coinKind === "gold" ? "#8b5e14" : coinKind === "silver" ? "#68727c" : "#5b3725";
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(16, 18, 20, 0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
      ctx.beginPath();
      ctx.arc(-4, -5, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawBullets() {
  for (const bullet of bullets) {
    const x = worldToScreenX(bullet.x);
    const y = worldToScreenY(bullet.y);
    const previousX = worldToScreenX(bullet.previousX ?? bullet.x);
    const previousY = worldToScreenY(bullet.previousY ?? bullet.y);

    if (hitboxDebug) {
      drawBulletDebugOverlay(previousX, previousY, x, y, bullet);
    }

    if (bullet.weapon === "knife") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(bullet.angle);
      ctx.fillStyle = "#d9e0e3";
      ctx.strokeStyle = "#55666f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -5);
      ctx.lineTo(18, 0);
      ctx.lineTo(-9, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#20272b";
      ctx.fillRect(-22, -4, 12, 8);
      ctx.restore();
      continue;
    }

    ctx.fillStyle = bullet.weapon === "awm" ? "#f6f2e9" : "#ffeb7a";
    ctx.strokeStyle = bullet.weapon === "awm" ? "#52616a" : "#7f551b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawRemoteBullets() {
  for (const bullet of remoteBullets) {
    const x = worldToScreenX(bullet.x);
    const y = worldToScreenY(bullet.y);

    if (bullet.weapon === "knife") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(bullet.angle || Math.atan2(bullet.vy, bullet.vx));
      ctx.fillStyle = "#d9e0e3";
      ctx.strokeStyle = "#ef6f8f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -5);
      ctx.lineTo(18, 0);
      ctx.lineTo(-9, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    ctx.fillStyle = bullet.weapon === "awm" ? "#f6f2e9" : "#ffeb7a";
    ctx.strokeStyle = "#ef6f8f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawBulletDebugOverlay(previousX, previousY, x, y, bullet) {
  ctx.save();
  ctx.strokeStyle = bullet.weapon === "knife" ? "rgba(255, 156, 181, 0.9)" : "rgba(255, 235, 122, 0.86)";
  ctx.fillStyle = "rgba(245, 253, 255, 0.52)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(previousX, previousY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, bullet.radius * camera.zoom), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayerDebugOverlay(worldX, worldY, radius, label, color = "rgba(255, 156, 181, 0.94)") {
  const x = worldToScreenX(worldX);
  const y = worldToScreenY(worldY);
  const screenRadius = radius * camera.zoom;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color.replace("0.94", "0.14").replace("0.9", "0.14");
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(x, y, screenRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, x, y - screenRadius - 5);
  ctx.restore();
}

function drawCorpses(time) {
  const now = performance.now();

  for (let index = corpses.length - 1; index >= 0; index -= 1) {
    const corpse = corpses[index];
    const remaining = corpse.expiresAt - now;

    if (remaining <= 0) {
      corpses.splice(index, 1);
      continue;
    }

    const fade = clamp(remaining / corpseLifetime, 0, 1);
    const x = worldToScreenX(corpse.x);
    const y = worldToScreenY(corpse.y);

    ctx.save();
    ctx.globalAlpha = 0.25 + fade * 0.75;
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 0.002 + corpse.x) * 0.18);
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, player.radius + 8, player.radius * 0.96, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(1.18, 0.72);
    ctx.fillStyle = corpse.color;
    ctx.strokeStyle = corpse.stroke;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawRemotePlayers(time) {
  for (const remote of remotePlayers.values()) {
    remote.renderX += (remote.x - remote.renderX) * 0.22;
    remote.renderY += (remote.y - remote.renderY) * 0.22;
    remote.renderAimAngle = lerpAngle(remote.renderAimAngle, remote.aimAngle || 0, 0.24);
    remote.swingTimer = Math.max(0, (remote.swingTimer || 0) - 1 / 60);
    remote.punchTimer = Math.max(0, (remote.punchTimer || 0) - 1 / 60);

    const x = worldToScreenX(remote.renderX);
    const y = worldToScreenY(remote.renderY);
    const aimAngle = remote.renderAimAngle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aimAngle);

    if (remote.selectedWeapon === "glock") {
      ctx.fillStyle = "#080d10";
      ctx.beginPath();
      ctx.roundRect(6, -9, 38, 13, 4);
      ctx.fill();
      ctx.fillStyle = "#06090b";
      ctx.beginPath();
      ctx.roundRect(31, 2, 13, 25, 4);
      ctx.fill();
    } else if (remote.selectedWeapon === "awm") {
      ctx.lineCap = "round";
      ctx.lineWidth = 9;
      ctx.strokeStyle = "#5f6645";
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(player.radius + 38, 0);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.strokeStyle = "#101417";
      ctx.beginPath();
      ctx.moveTo(player.radius + 18, 0);
      ctx.lineTo(player.radius + 66, 0);
      ctx.stroke();

      ctx.fillStyle = "#0a0d0f";
      ctx.beginPath();
      ctx.roundRect(5, -18, 32, 8, 4);
      ctx.fill();
    } else if (remote.selectedWeapon === "knife") {
      drawKnifeWeapon(remote.swingTimer || 0, remote.swingDuration || weapons.knife.swingDuration);
    } else {
      drawFistWeapon(remote.punchTimer || 0, remote.punchDuration || weapons.fist.swingDuration, {
        fill: "#ef6f8f",
        stroke: "#7a2738",
        darkStroke: "#5f1f2f",
        highlight: "#ffb0c2",
        trail: "rgba(239, 111, 143, 0.28)",
      });
    }

    ctx.rotate(-aimAngle);
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, player.radius + 8, player.radius * 0.92, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.fillStyle = "#ef6f8f";
    ctx.strokeStyle = "#7a2738";
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (remote.shield > 0) {
      const shieldRatio = clamp(remote.shield / remote.maxShield, 0, 1);
      const shieldPulse = Math.sin(time * 0.007) * 2;
      ctx.strokeStyle = `rgba(141, 244, 223, ${0.22 + shieldRatio * 0.46})`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 13 + shieldPulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    ctx.fillStyle = "rgba(16, 18, 20, 0.7)";
    ctx.strokeStyle = "rgba(246, 242, 233, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-34, -player.radius - 33, 68, 18, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6f2e9";
    ctx.font = "800 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(remote.name || "Player", 0, -player.radius - 24);

    if (remote.chatBubble && performance.now() - remote.chatBubble.createdAt <= chatMessageLifetime) {
      drawChatBubble(remote.chatBubble.text, -player.radius - 42);
    }

    const hpRatio = Math.max(0, remote.health / remote.maxHealth);
    ctx.fillStyle = "rgba(16, 18, 20, 0.72)";
    ctx.fillRect(-22, player.radius + 15, 44, 5);
    ctx.fillStyle = hpRatio > 0.4 ? "#8df4df" : "#ff9cb5";
    ctx.fillRect(-22, player.radius + 15, 44 * hpRatio, 5);
    ctx.restore();

    if (hitboxDebug) {
      drawPlayerDebugOverlay(
        remote.renderX,
        remote.renderY,
        player.radius,
        remote.isAi ? "AI hitbox" : "Player hitbox",
        remote.isAi ? "rgba(141, 244, 223, 0.94)" : "rgba(255, 156, 181, 0.94)",
      );
    }
  }
}

function drawKnifeWeapon(swingTimer, swingDuration) {
  const swinging = swingTimer > 0;
  const progress = swinging ? clamp(1 - swingTimer / swingDuration, 0, 1) : 1;
  const eased = 1 - Math.pow(1 - progress, 3);
  const knifeAngle = swinging ? -1.18 + eased * 2.22 : -0.12;
  const reach = player.radius + (swinging ? 28 : 22);

  if (swinging) {
    ctx.strokeStyle = "rgba(246, 242, 233, 0.58)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(player.radius + 8, 0, 38, -1.15, -1.15 + eased * 2.1);
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(knifeAngle);
  ctx.fillStyle = "#d9e0e3";
  ctx.strokeStyle = "#55666f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(reach - 6, -8);
  ctx.lineTo(reach + 36, -1);
  ctx.lineTo(reach + 7, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#20272b";
  ctx.strokeStyle = "#0d1114";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(player.radius - 8, -5, 22, 10, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFistWeapon(punchTimer, punchDuration, colors = {}) {
  const palette = {
    fill: colors.fill || "#58a6ff",
    stroke: colors.stroke || "#1b496f",
    darkStroke: colors.darkStroke || "#153d5f",
    highlight: colors.highlight || "#8fd0ff",
  };
  const punching = punchTimer > 0;
  const progress = punching ? clamp(1 - punchTimer / punchDuration, 0, 1) : 0;
  const windup = punching ? Math.max(0, 1 - progress * 3) : 0;
  const extension = punching ? Math.sin(progress * Math.PI) : 0;
  const snap = punching ? Math.min(1, progress * 1.7) : 0;
  const reach = player.radius + 10 - windup * 3 + extension * 10;
  const fistSquash = 1 + extension * 0.12;
  const swingAngle = -0.08 + snap * 0.16 - extension * 0.08;

  ctx.save();
  ctx.rotate(swingAngle);

  ctx.save();
  ctx.translate(reach + 6, 0);
  ctx.scale(fistSquash, 1 / fistSquash);
  ctx.fillStyle = palette.fill;
  ctx.strokeStyle = palette.darkStroke;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-8, -12, 20, 24, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.highlight;
  ctx.beginPath();
  ctx.roundRect(-4, -8, 5, 5, 2);
  ctx.roundRect(-4, -2, 5, 5, 2);
  ctx.roundRect(-4, 4, 5, 5, 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(246, 242, 233, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, -7);
  ctx.lineTo(8, -2);
  ctx.lineTo(5, 5);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawTeleportEffects() {
  const now = performance.now();

  for (let index = teleportEffects.length - 1; index >= 0; index -= 1) {
    const effect = teleportEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);

    if (progress >= 1) {
      teleportEffects.splice(index, 1);
      continue;
    }

    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    const radius = 12 + progress * 42;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = spoke * (Math.PI / 3) + progress * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8);
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawLightningEffects() {
  const now = performance.now();

  for (let index = lightningEffects.length - 1; index >= 0; index -= 1) {
    const effect = lightningEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);

    if (progress >= 1) {
      lightningEffects.splice(index, 1);
      continue;
    }

    const alpha = 1 - progress;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = alpha;

    for (const width of [18, 8, 3]) {
      ctx.strokeStyle = width === 3 ? "#f5fdff" : effect.color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha * (width === 18 ? 0.18 : width === 8 ? 0.42 : 0.95);
      ctx.beginPath();
      for (let pointIndex = 0; pointIndex < effect.points.length; pointIndex += 1) {
        const point = effect.points[pointIndex];
        const x = worldToScreenX(point.x);
        const y = worldToScreenY(point.y);
        if (pointIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "#c9f6ff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.72;
    for (const bolt of effect.bolts) {
      ctx.beginPath();
      ctx.moveTo(worldToScreenX(bolt.x1), worldToScreenY(bolt.y1));
      ctx.lineTo(worldToScreenX(bolt.x2), worldToScreenY(bolt.y2));
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawRailburstPreview(charge, color = "#ffdf86") {
  if (!charge) {
    return;
  }

  const elapsed = charge.startedAt ? (performance.now() - charge.startedAt) / 1000 : railburstChargeSeconds - player.railburstChargeTimer;
  const ratio = clamp(elapsed / railburstChargeSeconds, 0, 1);
  const startX = charge.startX;
  const startY = charge.startY;
  const endX = startX + Math.cos(charge.angle) * railburstRange;
  const endY = startY + Math.sin(charge.angle) * railburstRange;
  const pulse = 0.45 + ratio * 0.55;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.24 + ratio * 0.48;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = 22 + ratio * 34;
  ctx.setLineDash([38, 22]);
  ctx.lineDashOffset = -performance.now() * 0.14;
  ctx.beginPath();
  ctx.moveTo(worldToScreenX(startX), worldToScreenY(startY));
  ctx.lineTo(worldToScreenX(endX), worldToScreenY(endY));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(255, 223, 134, ${0.16 * pulse})`;
  ctx.beginPath();
  ctx.arc(worldToScreenX(startX), worldToScreenY(startY), 44 + ratio * 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRailburstEffects() {
  const now = performance.now();

  drawRailburstPreview(player.railburstCharge);
  for (const remote of remotePlayers.values()) {
    drawRailburstPreview(remote.railburstCharge, "#ff9cb5");
  }

  for (let index = railburstEffects.length - 1; index >= 0; index -= 1) {
    const effect = railburstEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);

    if (progress >= 1) {
      railburstEffects.splice(index, 1);
      continue;
    }

    const alpha = 1 - progress;
    const startX = worldToScreenX(effect.startX);
    const startY = worldToScreenY(effect.startY);
    const endX = worldToScreenX(effect.endX);
    const endY = worldToScreenY(effect.endY);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (const width of [210, 156, 108, 64, 22, 7]) {
      ctx.globalAlpha =
        alpha *
        (width === 210 ? 0.09 : width === 156 ? 0.22 : width === 108 ? 0.42 : width === 64 ? 0.78 : width === 22 ? 0.9 : 1);
      ctx.strokeStyle = width === 7 ? "#f5fdff" : width === 22 ? "#fff6b7" : effect.color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.globalAlpha = alpha * 0.82;
    for (const streak of effect.streaks || []) {
      ctx.lineWidth = streak.width;
      ctx.beginPath();
      ctx.moveTo(worldToScreenX(streak.x1), worldToScreenY(streak.y1));
      ctx.lineTo(worldToScreenX(streak.x2), worldToScreenY(streak.y2));
      ctx.stroke();
    }

    ctx.strokeStyle = "#7cd7ff";
    ctx.lineWidth = 4;
    ctx.globalAlpha = alpha * 0.86;
    for (const arc of effect.arcs) {
      ctx.beginPath();
      ctx.moveTo(worldToScreenX(arc.x1), worldToScreenY(arc.y1));
      ctx.lineTo(worldToScreenX(arc.x2), worldToScreenY(arc.y2));
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 238, 90, ${alpha * 0.28})`;
    ctx.beginPath();
    ctx.arc(endX, endY, 74 + progress * 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(124, 215, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(endX, endY, 86 + progress * 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

function drawAreaSkillEffects() {
  const now = performance.now();

  if (player.staticCollapseHeld) {
    const ratio = player.staticCollapseCharging ? clamp(player.staticCollapseCharge / staticCollapseChargeMax, 0, 1) : 0.08;
    const angle = getAimAngle();
    const orbX = player.x + Math.cos(angle) * (player.radius + 90);
    const orbY = player.y + Math.sin(angle) * (player.radius + 90) - 14;
    const x = worldToScreenX(orbX);
    const y = worldToScreenY(orbY);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (player.staticCollapseCharging) {
      const waves = [
        { start: 0, end: 0.34, count: 5 },
        { start: 0.28, end: 0.62, count: 7 },
        { start: 0.56, end: 0.94, count: 10 },
      ];

      for (const [waveIndex, wave] of waves.entries()) {
        if (ratio < wave.start) {
          continue;
        }

        const waveProgress = clamp((ratio - wave.start) / (wave.end - wave.start), 0, 1);
        for (let index = 0; index < wave.count; index += 1) {
          const particleAngle = index / wave.count * Math.PI * 2 + now * 0.0019 + waveIndex * 0.42 + (index % 4) * 0.18;
          const baseDistance = 116 - waveIndex * 10 + (index % 4) * 12;
          const t = Math.min(1, Math.pow(waveProgress, 0.68) * (0.9 + (index % 3) * 0.05));
          const distance = baseDistance * (1 - t);
          const px = x + Math.cos(particleAngle) * distance;
          const py = y + Math.sin(particleAngle) * distance;
          const alpha = (1 - waveProgress * 0.2) * (0.22 + ratio * 0.62);
          ctx.strokeStyle = `rgba(124, 215, 255, ${alpha})`;
          ctx.lineWidth = 1.6 + ratio * 0.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x + Math.cos(particleAngle) * distance * 0.72, y + Math.sin(particleAngle) * distance * 0.72);
          ctx.stroke();

          ctx.fillStyle = `rgba(245, 253, 255, ${0.16 + ratio * 0.78})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.2 + (index % 3) * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawStaticCollapseOrb(x, y, 16 + ratio * 8, ratio);
    ctx.restore();
  }

  for (const projectile of staticCollapseProjectiles) {
    const x = worldToScreenX(projectile.x);
    const y = worldToScreenY(projectile.y);
    const ratio = projectile.chargeRatio || 0;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawStaticCollapseOrb(x, y, projectile.radius, ratio);
    ctx.restore();
  }

  for (let index = staticCollapseEffects.length - 1; index >= 0; index -= 1) {
    const effect = staticCollapseEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    const elapsed = now - effect.startedAt;
    const charge = effect.burstOnly ? 1 : clamp(elapsed / (staticCollapseDelay * 1000), 0, 1);
    const burst = effect.burstOnly ? clamp(elapsed / 420, 0, 1) : clamp((elapsed - staticCollapseDelay * 1000) / 420, 0, 1);
    if (progress >= 1) {
      staticCollapseEffects.splice(index, 1);
      continue;
    }
    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const particle of effect.particles) {
      const t = clamp((charge - particle.delay) / 0.78, 0, 1);
      const swirl = particle.angle + particle.spin * (1 - t) + now * 0.002;
      const distance = particle.distance * (1 - t);
      const px = x + Math.cos(swirl) * distance;
      const py = y + Math.sin(swirl) * distance;
      const alpha = (1 - burst) * (0.18 + t * 0.78);
      ctx.strokeStyle = `rgba(124, 215, 255, ${alpha * 0.75})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x + Math.cos(swirl) * distance * 0.72, y + Math.sin(swirl) * distance * 0.72);
      ctx.stroke();
      ctx.fillStyle = `rgba(245, 253, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, particle.size * (0.7 + t * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    const orbRadius = 20 + Math.sin(now * 0.016) * 2 + charge * 14;
    ctx.fillStyle = `rgba(73, 172, 255, ${0.18 + charge * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, orbRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(124, 215, 255, ${0.58 + charge * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, orbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(245, 253, 255, ${0.72 * (1 - burst)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, orbRadius + 8, 0, Math.PI * 2);
    ctx.stroke();

    if (burst > 0) {
      for (const width of [20, 9, 3]) {
        ctx.strokeStyle =
          width === 20 ? `rgba(124, 215, 255, ${(1 - burst) * 0.42})` :
          width === 9 ? `rgba(245, 253, 255, ${(1 - burst) * 0.88})` :
          `rgba(141, 244, 223, ${1 - burst})`;
        ctx.lineWidth = width * (1 - burst * 0.35);
        ctx.beginPath();
        ctx.arc(x, y, effect.radius * (0.18 + burst * 0.98), 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let bolt = 0; bolt < 10; bolt += 1) {
        const angle = bolt * (Math.PI * 2 / 10) + now * 0.003;
        const inner = effect.radius * (0.32 + burst * 0.3);
        const outer = effect.radius * (0.62 + burst * 0.58);
        const points = createLightningPoints(
          x + Math.cos(angle) * inner,
          y + Math.sin(angle) * inner,
          x + Math.cos(angle + 0.08) * outer,
          y + Math.sin(angle + 0.08) * outer,
          3,
          18,
        );
        ctx.strokeStyle = `rgba(124, 215, 255, ${(1 - burst) * 0.95})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        points.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  for (let index = arcPrisonEffects.length - 1; index >= 0; index -= 1) {
    const effect = arcPrisonEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    const reveal = clamp(progress / 0.18, 0, 1);
    const fade = clamp((1 - progress) / 0.22, 0, 1);
    const alpha = Math.min(reveal, fade);
    if (progress >= 1) {
      arcPrisonEffects.splice(index, 1);
      continue;
    }
    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const vertices = Array.from({ length: 6 }, (_, point) => {
      const angle = -Math.PI / 2 + point * Math.PI / 3;
      return {
        x: x + Math.cos(angle) * effect.radius,
        y: y + Math.sin(angle) * effect.radius,
      };
    });

    ctx.fillStyle = `rgba(30, 116, 180, ${0.05 * alpha})`;
    ctx.beginPath();
    vertices.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
    ctx.fill();

    for (const width of [14, 6, 2]) {
      ctx.strokeStyle =
        width === 14 ? `rgba(124, 215, 255, ${0.28 * alpha})` :
        width === 6 ? `rgba(124, 215, 255, ${0.74 * alpha})` :
        `rgba(245, 253, 255, ${0.95 * alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      vertices.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.closePath();
      ctx.stroke();
    }

    for (let edge = 0; edge < vertices.length; edge += 1) {
      const a = vertices[edge];
      const b = vertices[(edge + 1) % vertices.length];
      const points = createLightningPoints(a.x, a.y, b.x, b.y, 5, 18 + Math.sin(now * 0.02 + edge) * 7);
      ctx.strokeStyle = `rgba(141, 244, 223, ${(0.48 + Math.sin(now * 0.018 + edge) * 0.32) * alpha})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      points.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(245, 253, 255, ${0.18 * alpha})`;
    ctx.lineWidth = 1.5;
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const vertex = vertices[spoke];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(vertex.x, vertex.y);
      ctx.stroke();
    }

    for (const spark of effect.sparks) {
      const angle = spark.angle + now * 0.003 * spark.speed;
      const sx = x + Math.cos(angle) * effect.radius;
      const sy = y + Math.sin(angle) * effect.radius;
      ctx.strokeStyle = `rgba(245, 253, 255, ${0.55 * alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle + Math.PI / 2) * spark.length, sy + Math.sin(angle + Math.PI / 2) * spark.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (let index = stormRecallEffects.length - 1; index >= 0; index -= 1) {
    const effect = stormRecallEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    const pop = 1 - Math.pow(1 - progress, 3);
    const fade = 1 - progress;
    if (progress >= 1) {
      stormRecallEffects.splice(index, 1);
      continue;
    }
    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.fillStyle = `rgba(245, 253, 255, ${0.42 * fade})`;
    ctx.beginPath();
    ctx.arc(x, y, effect.radius * (0.14 + pop * 0.12), 0, Math.PI * 2);
    ctx.fill();

    for (const spark of effect.sparks || []) {
      const sparkDistance = spark.distance * pop;
      const sx = x + Math.cos(spark.angle) * sparkDistance;
      const sy = y + Math.sin(spark.angle) * sparkDistance;
      ctx.fillStyle = `rgba(255, 223, 134, ${0.72 * fade})`;
      ctx.beginPath();
      ctx.arc(sx, sy, spark.size * fade, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const width of [16, 5, 2]) {
      ctx.strokeStyle =
        width === 16 ? `rgba(255, 223, 134, ${0.24 * fade})` :
        width === 5 ? `rgba(124, 215, 255, ${0.72 * fade})` :
        `rgba(245, 253, 255, ${0.92 * fade})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x, y, effect.radius * (0.18 + pop * 0.82), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawStaticCollapseOrb(x, y, radius, ratio) {
  ctx.fillStyle = `rgba(124, 215, 255, ${0.2 + ratio * 0.22})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1.85 + ratio * 0.34), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(214, 247, 255, ${0.38 + ratio * 0.44})`;
  ctx.lineWidth = 3 + ratio * 2;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1.06 + ratio * 0.18), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(${Math.round(74 + ratio * 108)}, ${Math.round(160 + ratio * 76)}, ${Math.round(241 + ratio * 14)}, ${0.38 + ratio * 0.38})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.96 + ratio * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(245, 253, 255, ${0.72 + ratio * 0.28})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.56 + ratio * 0.14), 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(time) {
  const x = worldToScreenX(player.x);
  const y = worldToScreenY(player.y);
  const pulse = Math.sin(time * 0.008) * 1.5;
  const aimAngle = getAimAngle();
  const selectedWeapon = weapons.slots[weapons.selectedSlot];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(aimAngle);

  if (selectedWeapon === "knife") {
    drawKnifeWeapon(player.swingTimer, weapons.knife.swingDuration);
  } else if (selectedWeapon === "glock") {
    ctx.fillStyle = "#080d10";
    ctx.beginPath();
    ctx.roundRect(6, -9, 38, 13, 4);
    ctx.fill();
    ctx.fillStyle = "#12191d";
    ctx.beginPath();
    ctx.roundRect(1, -4, 20, 9, 3);
    ctx.fill();
    ctx.fillStyle = "#06090b";
    ctx.beginPath();
    ctx.roundRect(31, 2, 13, 25, 4);
    ctx.fill();
    ctx.strokeStyle = "#050708";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(25, 10, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "#050708";
    ctx.fillRect(42, -5, 8, 6);
  } else if (selectedWeapon === "awm") {
    ctx.lineCap = "round";
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#5f6645";
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(player.radius + 38, 0);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#101417";
    ctx.beginPath();
    ctx.moveTo(player.radius + 18, 0);
    ctx.lineTo(player.radius + 66, 0);
    ctx.stroke();

    ctx.fillStyle = "#0a0d0f";
    ctx.beginPath();
    ctx.roundRect(5, -18, 32, 8, 4);
    ctx.fill();
  } else {
    drawFistWeapon(player.punchTimer, weapons.fist.swingDuration);
  }

  ctx.rotate(-aimAngle);

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, player.radius + 8, player.radius * 0.92, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.fillStyle = "#58a6ff";
  ctx.strokeStyle = "#1b496f";
  ctx.beginPath();
  ctx.arc(0, 0, player.radius + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (player.knifeCharging && selectedWeapon === "knife") {
    const chargeRatio = clamp(player.knifeCharge / player.knifeChargeMax, 0, 1);
    ctx.strokeStyle = "rgba(255, 207, 95, 0.86)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio);
    ctx.stroke();
  }

  if (player.shield > 0) {
    const shieldRatio = clamp(player.shield / player.maxShield, 0, 1);
    const shieldPulse = Math.sin(time * 0.007) * 2;
    ctx.strokeStyle = `rgba(141, 244, 223, ${0.28 + shieldRatio * 0.42})`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 13 + shieldPulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
    ctx.stroke();
    ctx.strokeStyle = `rgba(88, 166, 255, ${0.12 + shieldRatio * 0.2})`;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 20 + shieldPulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  ctx.fillStyle = "#f6f2e9";
  ctx.beginPath();
  ctx.arc(8, -7, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(2, 8);
  ctx.lineTo(14, 8);
  ctx.stroke();

  ctx.fillStyle = "rgba(16, 18, 20, 0.62)";
  ctx.strokeStyle = "rgba(246, 242, 233, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-34, -player.radius - 33, 68, 18, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6f2e9";
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(player.name, 0, -player.radius - 24);

  if (player.chatBubble && performance.now() - player.chatBubble.createdAt <= chatMessageLifetime) {
    drawChatBubble(player.chatBubble.text, -player.radius - 42);
  }

  ctx.restore();
}

function drawMinimap() {
  const mapSize = Math.min(180, Math.max(126, Math.floor(width * 0.18)));
  const padding = 18;
  const x = width - mapSize - padding;
  const y = height - mapSize - padding;
  const scale = mapSize / world.width;
  const viewWorldW = width / camera.zoom;
  const viewWorldH = height / camera.zoom;
  const viewW = viewWorldW * scale;
  const viewH = viewWorldH * scale;

  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(16, 18, 20, 0.64)";
  ctx.strokeStyle = "rgba(246, 242, 233, 0.26)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, mapSize, mapSize, 8);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, mapSize, mapSize, 8);
  ctx.clip();

  ctx.fillStyle = "rgba(255, 207, 95, 0.82)";
  for (const crate of crates) {
    ctx.fillRect(x + crate.x * scale - 2, y + crate.y * scale - 2, 4, 4);
  }

  ctx.fillStyle = "#f6f2e9";
  for (const pickup of pickups) {
    ctx.fillRect(x + pickup.x * scale - 1.5, y + pickup.y * scale - 1.5, 3, 3);
  }

  ctx.fillStyle = "#ffeb7a";
  for (const bullet of bullets) {
    ctx.beginPath();
    ctx.arc(x + bullet.x * scale, y + bullet.y * scale, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(246, 242, 233, 0.62)";
  ctx.strokeRect(x + (camera.x - viewWorldW / 2) * scale, y + (camera.y - viewWorldH / 2) * scale, viewW, viewH);

  ctx.fillStyle = "#ff5f7f";
  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 1.5;
  for (const remote of remotePlayers.values()) {
    if (remote.health <= 0) {
      continue;
    }

    const remoteX = Number.isFinite(remote.renderX) ? remote.renderX : remote.x;
    const remoteY = Number.isFinite(remote.renderY) ? remote.renderY : remote.y;
    if (!Number.isFinite(remoteX) || !Number.isFinite(remoteY)) {
      continue;
    }

    ctx.beginPath();
    ctx.arc(
      x + clamp(remoteX, 0, world.width) * scale,
      y + clamp(remoteY, 0, world.height) * scale,
      4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#58a6ff";
  ctx.strokeStyle = "#101214";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + player.x * scale, y + player.y * scale, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.78);
  gradient.addColorStop(0, "rgba(16, 18, 20, 0)");
  gradient.addColorStop(1, "rgba(16, 18, 20, 0.36)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#182026";
  ctx.fillRect(0, 0, width, height);

  drawShopArea();
  drawGrid();
  drawWorldBounds();
  drawCrates();
  drawPickups(time);
  drawBullets();
  drawRemoteBullets();
  drawCorpses(time);
  drawRemotePlayers(time);
  drawTeleportEffects();
  drawLightningEffects();
  drawRailburstEffects();
  drawAreaSkillEffects();
  if (!deathPending) {
    drawPlayer(time);
  }
  drawVignette();
  drawMinimap();

  if (shopToastTimer > 0) {
    ctx.save();
    ctx.fillStyle = "rgba(16, 18, 20, 0.78)";
    ctx.strokeStyle = "rgba(255, 207, 95, 0.44)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 145, 88, 290, 40, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffdf86";
    ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("상점 아이템은 다음 단계에서 추가할게요", width / 2, 109);
    ctx.restore();
  }
}

async function startGame() {
  if (gameStarted) {
    return;
  }

  resetGameState();
  player.name = nicknameInput.value.trim() || "Player";
  await loadCharacterProfile();
  player.name = nicknameInput.value.trim() || player.name || "Player";
  gameStarted = true;
  connectMultiplayer();
  sendNetwork("respawn", { state: getPlayerSnapshot() });
  lastTime = performance.now();
  document.body.classList.remove("game-pending");
  startScreen.classList.add("hidden");
  getAudioContext();
}

function restartGame() {
  if (gameStarted) {
    return;
  }

  resetGameState({ preserveProgress: true });
  gameStarted = true;
  sendNetwork("respawn", { state: getPlayerSnapshot() });
  lastTime = performance.now();
  document.body.classList.remove("game-pending");
  restartScreen?.classList.add("hidden");
  getAudioContext();
}

function tick(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;

  if (gameStarted) {
    update(delta);
  }

  draw(time);
  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  resize();
  if (upgradePanel?.style.left && upgradePanel?.style.top) {
    placeUpgradePanel(parseFloat(upgradePanel.style.left), parseFloat(upgradePanel.style.top));
  }
});
startButton.addEventListener("click", startGame);
restartButton?.addEventListener("click", restartGame);
chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitChat();
});
chatInput?.addEventListener("mousedown", (event) => event.stopPropagation());
chatInput?.addEventListener("keydown", (event) => {
  event.stopPropagation();

  if (event.key === "Escape") {
    chatInput.blur();
  }
});

upgradePanel?.querySelector(".upgrade-title")?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }

  const rect = upgradePanel.getBoundingClientRect();
  upgradePanelDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  upgradePanel.classList.add("dragging");
  upgradePanel.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
});

window.addEventListener("pointermove", (event) => {
  if (!upgradePanelDrag) {
    return;
  }

  placeUpgradePanel(event.clientX - upgradePanelDrag.offsetX, event.clientY - upgradePanelDrag.offsetY);
});

window.addEventListener("pointerup", (event) => {
  if (!upgradePanelDrag || event.pointerId !== upgradePanelDrag.pointerId) {
    return;
  }

  upgradePanelDrag = null;
  upgradePanel?.classList.remove("dragging");
});

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) {
    event.preventDefault();
    return;
  }

  if (event.target === chatInput) {
    return;
  }

  if (event.key === "`" || event.key.toLowerCase() === "h") {
    toggleDebugTools();
    return;
  }

  if (!gameStarted && event.key === "Enter") {
    event.preventDefault();
    startGame();
    return;
  }

  if (!gameStarted) {
    return;
  }

  if (isShopOpen()) {
    if (event.key === "Escape" || event.key.toLowerCase() === "k") {
      closeShop();
    }
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    chatInput?.focus();
    return;
  }

  getAudioContext();

  if (event.key === "1" || event.key === "2" || event.key === "3") {
    selectWeapon(Number(event.key));
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    dash();
    return;
  }

  if (event.key.toLowerCase() === "k") {
    interact();
    return;
  }

  if (event.key.toLowerCase() === "q") {
    useEquippedSkill("q");
    return;
  }

  if (event.key.toLowerCase() === "r") {
    startReload();
    return;
  }

  if (event.key.toLowerCase() === "f") {
    useEquippedSkill("f");
    return;
  }

  if (event.key.toLowerCase() === "g") {
    useEquippedSkill("g");
    return;
  }

  if (event.key.toLowerCase() === "e") {
    useEquippedSkill("e");
    return;
  }

  if (event.key.toLowerCase() === "t") {
    dropSelectedWeapon();
    return;
  }

  keys.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});
window.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});
window.addEventListener("mousedown", (event) => {
  if (!gameStarted) {
    return;
  }

  if (isShopOpen()) {
    return;
  }

  getAudioContext();

  if (event.button === 2) {
    event.preventDefault();

    if (weapons.slots[weapons.selectedSlot] === "knife") {
      player.knifeCharging = true;
      player.knifeCharge = 0;
      mouse.rightDown = true;
    }

    return;
  }

  if (event.button === 0) {
    if (player.staticCollapseHeld) {
      startStaticCollapseCharge();
      return;
    }
    mouse.down = true;
  }
});
window.addEventListener("mouseup", (event) => {
  if (!gameStarted) {
    return;
  }

  if (event.button === 2) {
    event.preventDefault();
    mouse.rightDown = false;
    throwKnife();
    return;
  }

  if (event.button === 0) {
    if (player.staticCollapseHeld && player.staticCollapseCharging) {
      releaseStaticCollapse();
      return;
    }
    mouse.down = false;
  }
});
window.addEventListener("blur", () => {
  mouse.down = false;
  mouse.rightDown = false;
  player.knifeCharging = false;
  player.knifeCharge = 0;
  player.staticCollapseHeld = false;
  player.staticCollapseCharging = false;
  player.staticCollapseCharge = 0;
  upgradePanelDrag = null;
  upgradePanel?.classList.remove("dragging");
  weaponPointerDrag = null;
  removeWeaponDragPreview();
  clearWeaponDragTarget();
  keys.clear();
});
window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
window.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  },
  { passive: false },
);
for (const slot of inventorySlots) {
  slot.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    weaponPointerDrag = {
      fromSlot: Number(slot.dataset.slot),
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      active: false,
    };
    slot.setPointerCapture?.(event.pointerId);
  });
  slot.addEventListener("mousedown", (event) => {
    event.stopPropagation();
  });
  slot.addEventListener("mouseup", (event) => {
    event.stopPropagation();
  });
  slot.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  slot.addEventListener("click", (event) => {
    if (suppressSlotClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    selectWeapon(Number(slot.dataset.slot));
  });
  slot.addEventListener("dragstart", (event) => {
    event.preventDefault();
    draggedSlot = Number(slot.dataset.slot);
    slot.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/core-drift-weapon-slot", String(draggedSlot));
    event.dataTransfer.setData("text/plain", `weapon:${draggedSlot}`);
  });
  slot.addEventListener("dragover", (event) => {
    event.preventDefault();
    slot.classList.add("drop-target");
    event.dataTransfer.dropEffect = "move";
  });
  slot.addEventListener("dragenter", (event) => {
    event.preventDefault();
    slot.classList.add("drop-target");
  });
  slot.addEventListener("dragleave", () => {
    slot.classList.remove("drop-target");
  });
  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    const transferSlot = event.dataTransfer.getData("application/core-drift-weapon-slot");
    const fallbackSlot = event.dataTransfer.getData("text/plain").replace("weapon:", "");
    const fromSlot = draggedSlot ?? Number(transferSlot || fallbackSlot);
    const toSlot = Number(slot.dataset.slot);
    if (Number.isFinite(fromSlot) && fromSlot >= 1 && fromSlot <= 3) {
      swapSlots(fromSlot, toSlot);
    }
    slot.classList.remove("drop-target");
  });
  slot.addEventListener("dragend", () => {
    draggedSlot = null;

    for (const inventorySlot of inventorySlots) {
      inventorySlot.classList.remove("dragging", "drop-target");
    }
  });
}

window.addEventListener("pointermove", (event) => {
  if (!weaponPointerDrag) {
    return;
  }

  const distance = Math.hypot(event.clientX - weaponPointerDrag.startX, event.clientY - weaponPointerDrag.startY);
  if (!weaponPointerDrag.active && distance < 6) {
    return;
  }

  weaponPointerDrag.active = true;
  suppressSlotClick = true;
  clearWeaponDragTarget();

  const fromElement = [...inventorySlots].find((candidate) => Number(candidate.dataset.slot) === weaponPointerDrag.fromSlot);
  fromElement?.classList.add("dragging");
  createWeaponDragPreview(fromElement);
  updateWeaponDragPreview(event.clientX, event.clientY);

  const target = getInventorySlotFromPoint(event.clientX, event.clientY);
  if (target) {
    target.classList.add("drop-target");
  }
});

window.addEventListener("pointerup", (event) => {
  if (!weaponPointerDrag) {
    return;
  }

  const { fromSlot, active } = weaponPointerDrag;
  const target = active ? getInventorySlotFromPoint(event.clientX, event.clientY) : null;
  const toSlot = target ? Number(target.dataset.slot) : null;

  if (active && Number.isFinite(toSlot) && toSlot >= 1 && toSlot <= 3) {
    swapSlots(fromSlot, toSlot);
  } else if (!active) {
    selectWeapon(fromSlot);
  }

  suppressSlotClick = true;
  weaponPointerDrag = null;
  clearWeaponDragTarget();
  removeWeaponDragPreview();
  window.setTimeout(() => {
    suppressSlotClick = false;
  }, 0);
});

for (const [slotKey, element] of Object.entries(skillSlotElements)) {
  if (!element) {
    continue;
  }

  element.draggable = true;
  element.addEventListener("mousedown", (event) => event.stopPropagation());
  element.addEventListener("mouseup", (event) => event.stopPropagation());
  element.addEventListener("click", (event) => {
    const clearButton = event.target.closest("[data-clear-skill]");
    if (clearButton) {
      clearSkillSlot(clearButton.dataset.clearSkill);
    }
  });
  element.addEventListener("dragstart", (event) => {
    if (!player.skillSlots[slotKey]) {
      event.preventDefault();
      return;
    }
    draggedSkillSlot = slotKey;
    element.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/core-drift-skill-slot", slotKey);
    event.dataTransfer.setData("text/plain", `skill:${slotKey}`);
  });
  element.addEventListener("dragover", (event) => {
    event.preventDefault();
    element.classList.add("drop-target");
    event.dataTransfer.dropEffect = "move";
  });
  element.addEventListener("dragenter", (event) => {
    event.preventDefault();
    element.classList.add("drop-target");
  });
  element.addEventListener("dragleave", () => {
    element.classList.remove("drop-target");
  });
  element.addEventListener("drop", (event) => {
    event.preventDefault();
    const transferSlot = event.dataTransfer.getData("application/core-drift-skill-slot");
    const fallbackSlot = event.dataTransfer.getData("text/plain").replace("skill:", "");
    const fromSlot = draggedSkillSlot || transferSlot || fallbackSlot;
    if (skillSlotKeys.includes(fromSlot)) {
      swapSkillSlots(fromSlot, slotKey);
    }
    element.classList.remove("drop-target");
  });
  element.addEventListener("dragend", () => {
    draggedSkillSlot = null;
    for (const slotElement of Object.values(skillSlotElements)) {
      slotElement?.classList.remove("dragging", "drop-target");
    }
  });
}

for (const button of upgradeButtons) {
  button.addEventListener("click", () => {
    applyUpgrade(button.dataset.upgrade);
  });
}

accountSignOut?.addEventListener("click", () => {
  saveCharacterProfile();
  window.google?.accounts?.id?.disableAutoSelect?.();
  setActiveAccount({ id: "guest", name: "Guest" });
  accountStatus.textContent = "Logged out. Guest profile";
});
window.addEventListener("beforeunload", saveCharacterProfile);

initAccountSystem();
resize();
document.body.classList.add("game-pending");
createCrates();
updateInventory();
updateXpHud();
updateCoinHud();
updateSkillHud();
updateUpgradePanel();
requestAnimationFrame(tick);
