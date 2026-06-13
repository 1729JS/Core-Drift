const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const startButton = document.querySelector("#startButton");
const restartScreen = document.querySelector("#restartScreen");
const restartButton = document.querySelector("#restartButton");
const restartXp = document.querySelector("#restartXp");
const restartCoins = document.querySelector("#restartCoins");
const nicknameInput = document.querySelector("#nicknameInput");
const characterSelect = document.querySelector("#characterSelect");
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
  z: document.querySelector("#skillSlotZ"),
  x: document.querySelector("#skillSlotX"),
};
const skillSlotKeys = ["f", "q", "g", "e", "z", "x"];
const skillSlotUnlockLevels = {
  f: 25,
  g: 50,
  q: 75,
  e: 100,
  z: Infinity,
  x: Infinity,
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
const infoTooltip = document.querySelector("#infoTooltip");
const gameConfig = window.CORE_DRIFT_CONFIG;
const assetConfig = window.CORE_DRIFT_ASSETS;
const weaponConfig = window.CORE_DRIFT_WEAPONS;
const skillConfig = window.CORE_DRIFT_SKILLS;

const crateSprites = {
  basic: createSprite(assetConfig.crates.basic),
  bronze: createSprite(assetConfig.crates.bronze),
  metal: createSprite(assetConfig.crates.metal),
  gold: createSprite(assetConfig.crates.gold),
  royal: createSprite(assetConfig.crates.royal),
};
const playerCharacterSprite = createSprite(assetConfig.legacyCharacters.player);
const playerLeftMoveSprite = createSprite(assetConfig.legacyCharacters.moveLeft);
const playerRightMoveSprite = createSprite(assetConfig.legacyCharacters.moveRight);
const defaultCharacterId = gameConfig.defaultCharacterId;
const selectedCharacterStorageKey = gameConfig.storageKeys.selectedCharacter;
const unlockedCharactersStorageKey = gameConfig.storageKeys.unlockedCharacters;

function createCharacterSpriteSet(basePath) {
  return {
    idle: createSprite(`${basePath}/Idle.png`),
    run: createSprite(`${basePath}/Run.png`),
    attack1: createSprite(`${basePath}/Attack1.png`),
    attack2: createSprite(`${basePath}/Attack2.png`),
    attack3: createSprite(`${basePath}/Attack3.png`),
    attack4: createSprite(`${basePath}/Attack4.png`),
    die: createSprite(`${basePath}/Die.png`),
    taunt: createSprite(`${basePath}/Taunt.png`),
  };
}

function createWeaponCharacterSpriteSet(basePath) {
  return {
    ...createCharacterSpriteSet(basePath),
    runAttack: createSprite(`${basePath}/RunAttack.png`),
    runBackwardsAttack: createSprite(`${basePath}/RunBackwardsAttack.png`),
    strafeLeftAttack: createSprite(`${basePath}/StrafeLeftAttack.png`),
    strafeRightAttack: createSprite(`${basePath}/StrafeRightAttack.png`),
  };
}

const characterDefinitions = Object.fromEntries(
  Object.entries(gameConfig.characters).map(([id, definition]) => [
    id,
    {
      ...definition,
      sprites: createCharacterSpriteSet(definition.basePath),
    },
  ]),
);

const weaponCharacterSprites = {
  knife: createCharacterSpriteSet(gameConfig.weaponCharacterPaths.knife),
  glock: createWeaponCharacterSpriteSet(gameConfig.weaponCharacterPaths.glock),
  awm: createWeaponCharacterSpriteSet(gameConfig.weaponCharacterPaths.awm),
  magicStaff: createCharacterSpriteSet(gameConfig.weaponCharacterPaths.magicStaff),
};
const magicStaffPickupLabel = "Magic Staff";

function getUnlockedCharacterIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(unlockedCharactersStorageKey) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveUnlockedCharacterIds(unlockedIds) {
  localStorage.setItem(unlockedCharactersStorageKey, JSON.stringify([...unlockedIds]));
}

function isCharacterSelectable(characterId) {
  return characterDefinitions[characterId]?.selectable !== false;
}

function isCharacterUnlocked(characterId) {
  if (!isCharacterSelectable(characterId)) {
    return false;
  }
  return characterId === defaultCharacterId || getUnlockedCharacterIds().has(characterId);
}

function getAvailableCharacterId(characterId) {
  return isCharacterUnlocked(characterId) ? characterId : defaultCharacterId;
}

function unlockCharacter(characterId) {
  if (!isCharacterSelectable(characterId)) {
    return false;
  }
  const unlockedIds = getUnlockedCharacterIds();
  const wasLocked = !isCharacterUnlocked(characterId);
  unlockedIds.add(characterId);
  saveUnlockedCharacterIds(unlockedIds);
  initCharacterSelect();
  updateCharacterSelectUi();
  return wasLocked;
}

let selectedCharacterId = getAvailableCharacterId(localStorage.getItem(selectedCharacterStorageKey));

function getCharacterDefinition(characterId = selectedCharacterId) {
  return characterDefinitions[characterId] || characterDefinitions[defaultCharacterId];
}

function setSelectedCharacter(characterId, { persist = true } = {}) {
  selectedCharacterId = getAvailableCharacterId(characterId);
  player.characterId = selectedCharacterId;
  if (persist) {
    localStorage.setItem(selectedCharacterStorageKey, selectedCharacterId);
  }
}
const glockMuzzleFlashSprite = createSprite(assetConfig.vfx.glockMuzzleFlash);
const dashDustSprite = createSprite(assetConfig.vfx.dashDust);
const walkingDustSprite = createSprite(assetConfig.vfx.walkingDust);
const bloodDropsSprite = createSprite(assetConfig.vfx.bloodDrops);
const bazookaExplosionFire02Sprite = createSprite(assetConfig.vfx.bazookaExplosionFire02);
const magicStaffPickupSprite = createSprite(assetConfig.items.magicStaffPickup);
const poisonProjectileUnityCaptureSheetSprite = createSprite(assetConfig.vfx.poisonProjectileUnityCaptureSheet);
const poisonProjectileUnityCaptureSheet = {
  columns: 10,
  frameCount: 91,
  frameWidth: 744,
  frameHeight: 240,
  fps: 30,
};
const poisonProjectileUnityCaptureSprite = createSprite(assetConfig.vfx.poisonProjectileUnityCapture);
const poisonProjectileSprite = createSprite(assetConfig.vfx.poisonProjectile);
const poisonProjectileSplash04Sprite = createSprite(assetConfig.vfx.poisonProjectileSplash04);
const poisonProjectileSplash07Sprite = createSprite(assetConfig.vfx.poisonProjectileSplash07);
const poisonProjectileSplash02BlurSprite = createSprite(assetConfig.vfx.poisonProjectileSplash02Blur);
const tintedSpriteCache = new Map();
const usePurchasedBazookaExplosionVfx = true;
const usePurchasedStaticCollapseVfx = true;
const skillVfxSprites = {
  teleport: createSprite(assetConfig.skillVfx.teleport),
  vanish: createSprite(assetConfig.skillVfx.vanish),
  bloodCloud: createSprite(assetConfig.skillVfx.bloodCloud),
  staticCollapseCharge: createSprite(assetConfig.skillVfx.staticCollapseCharge),
  staticCollapseBurst: createSprite(assetConfig.skillVfx.staticCollapseBurst),
  lightningThrustAura: createSprite(assetConfig.skillVfx.lightningThrustAura),
  lightningThrustScatter06: createSprite(assetConfig.skillVfx.lightningThrustScatter06),
  lightningThrustScatter08: createSprite(assetConfig.skillVfx.lightningThrustScatter08),
  toxicOrb: createSprite(assetConfig.skillVfx.toxicOrb),
  // Lightning Thrust rollback reference:
  // lightningThrustTrail: createSprite("assets/vfx/skills/lightning-thrust-03.png"),
  // lightningThrustScatter07: createSprite("assets/vfx/skills/static-collapse-lightning-07.png"),
  lightning: createSprite(assetConfig.skillVfx.lightning),
  magicImpact: createSprite(assetConfig.skillVfx.magicImpact),
  lightningImpact: createSprite(assetConfig.skillVfx.lightningImpact),
  burstImpact: createSprite(assetConfig.skillVfx.burstImpact),
  swordSlash: createSprite(assetConfig.skillVfx.swordSlash),
  poisonSlash: createSprite(assetConfig.skillVfx.poisonSlash),
  impactSparks: createSprite(assetConfig.skillVfx.impactSparks),
  wizardBossSpawnPoisonExplosion02: createSprite(assetConfig.skillVfx.wizardBossSpawnPoisonExplosion02),
  // Previous wizard spawn VFX kept for rollback:
  // wizardBossSpawnFireBurstSmokeBig01: createSprite("assets/vfx/wizard-boss-spawn-smoke.png?v=20260605-2"),
};

const world = gameConfig.world;

const crateTiers = gameConfig.crateTiers;
const crateTierOrder = gameConfig.crateTierOrder;
const crateSpriteRatios = gameConfig.crateSpriteRatios;
const crateRespawnSeconds = 5;
const corpseLifetime = 500;
const pickupLifetimeMs = 5 * 60 * 1000;
const knifeSwapCooldownSeconds = skillConfig.knifeRecall.cooldown;
const lightningThrustCooldownSeconds = skillConfig.lightningThrust.cooldown;
const lightningThrustRange = skillConfig.lightningThrust.range;
const lightningThrustDamage = skillConfig.lightningThrust.damage;
const lightningThrustHitRadius = skillConfig.lightningThrust.hitRadius;
const railburstCooldownSeconds = skillConfig.railburst.cooldown;
const railburstChargeSeconds = skillConfig.railburst.chargeSeconds;
const railburstRange = skillConfig.railburst.range;
const railburstWidth = skillConfig.railburst.width;
const railburstDamage = skillConfig.railburst.damage;
const staticCollapseCooldownSeconds = skillConfig.staticCollapse.cooldown;
const staticCollapseDelay = skillConfig.staticCollapse.delay;
const staticCollapseRadius = skillConfig.staticCollapse.radius;
const staticCollapseDamage = skillConfig.staticCollapse.damage;
const staticCollapseProjectileSpeed = skillConfig.staticCollapse.projectileSpeed;
const staticCollapseContactDamage = skillConfig.staticCollapse.contactDamage;
const staticCollapseChargeMax = skillConfig.staticCollapse.chargeMax;
const staticCollapseMinRange = skillConfig.staticCollapse.minRange;
const staticCollapseMaxRange = skillConfig.staticCollapse.maxRange;
const arcPrisonCooldownSeconds = skillConfig.arcPrison.cooldown;
const arcPrisonRadius = skillConfig.arcPrison.radius;
const arcPrisonDamage = skillConfig.arcPrison.damage;
const arcPrisonEdgeWidth = skillConfig.arcPrison.edgeWidth;
const arcPrisonSlowSeconds = skillConfig.arcPrison.slowSeconds;
const stormRecallCooldownSeconds = skillConfig.stormRecall.cooldown;
const stormRecallRadius = skillConfig.stormRecall.radius;
const stormRecallDamage = skillConfig.stormRecall.damage;
const bazookaExplosionRadius = 156;
const bazookaMoveMultiplier = 0.72;
const grenadeExplosionRadius = 132;
const grenadeBounceRetention = 0.5;
const grenadeRollDrag = 2.15;
const grenadeFuseSeconds = 4;
const grenadeChargeMax = 1.2;
const grenadeGravity = 920;
const grenadeFirstGroundBounceRetention = 0.5;
const grenadeGroundBounceRetention = 0.32;
const chatMessageLifetime = 6500;
const maxChatMessages = 40;
const accountStorageKey = gameConfig.storageKeys.account;
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
const groundDecorations = {
  trails: [
    {
      width: 20,
      points: [
        { x: 5180, y: 5660 },
        { x: 5460, y: 5740 },
        { x: 5720, y: 5660 },
        { x: 6000, y: 5710 },
      ],
    },
    {
      width: 16,
      points: [
        { x: 6410, y: 6260 },
        { x: 6560, y: 6120 },
        { x: 6730, y: 6030 },
      ],
    },
  ],
  logs: [
    { x: 6560, y: 5820, length: 184, width: 48, angle: -0.16 },
    { x: 5420, y: 6010, length: 132, width: 38, angle: 0.58 },
  ],
};
const magnetBaseRange = 105;
const magnetRangePerLevel = 24;
const magnetBaseSpeed = 190;
const magnetSpeedPerLevel = 36;
const shopPrices = gameConfig.shopPrices;
const shopUpgradePrices = gameConfig.shopUpgradePrices;
const shopAbilityPrices = gameConfig.shopAbilityPrices;
const skillShopPrices = gameConfig.skillShopPrices;
const titleShopPrices = gameConfig.titleShopPrices;

function createSprite(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function getTintedSprite(sprite, color) {
  if (!sprite.complete || !sprite.naturalWidth) {
    return null;
  }

  const key = `${sprite.src}|${color}`;
  const cached = tintedSpriteCache.get(key);
  if (cached && cached.width === sprite.naturalWidth && cached.height === sprite.naturalHeight) {
    return cached;
  }

  const canvasElement = document.createElement("canvas");
  canvasElement.width = sprite.naturalWidth;
  canvasElement.height = sprite.naturalHeight;
  const canvasContext = canvasElement.getContext("2d");
  canvasContext.drawImage(sprite, 0, 0);
  canvasContext.globalCompositeOperation = "source-in";
  canvasContext.fillStyle = color;
  canvasContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
  tintedSpriteCache.set(key, canvasElement);
  return canvasElement;
}
const skillDefinitions = Object.fromEntries(
  Object.entries(skillConfig).map(([id, skill]) => [
    id,
    {
      label: skill.label,
      cooldown: skill.cooldown,
      icon: skill.icon,
      requiresKnife: Boolean(skill.requiresKnife),
    },
  ]),
);
const testModeWeaponOrder = ["knife", "glock", "awm", "bazooka", "grenade", "magicStaff"];

const baseStats = gameConfig.baseStats;

const xpDropValue = 38;
const metalCrateXpValue = 125;
const goldCrateXpValue = 350;
const novaXpValue = 1000;
const astralXpValue = 2500;
const coinValues = gameConfig.coinValues;
const upgradeSteps = gameConfig.upgradeSteps;
const baseReloadTimes = gameConfig.baseReloadTimes;
const dashRollVisualDuration = 0.65;
const knifeAttackVisualDuration = 1;
const knifeAttackStartFrame = 5;
const knifeAttackImpactDelay = 0.28;
const magicStaffSlashDuration = 0.56;
const magicStaffSlashImpactDelay = 0.28;
const glockShotVisualDuration = 0.3;
const firearmSheetFlashDuration = glockShotVisualDuration;
const firearmSheetFlashFrames = [1, 2, 3];

const player = {
  x: world.width / 2,
  y: world.height / 2,
  name: "Player",
  characterId: selectedCharacterId,
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
  dashVisualTimer: 0,
  walkDustStep: -1,
  spriteDirection: "down",
  spriteMotionDirection: null,
  spriteMotionStartedAt: 0,
  spriteWasMoving: false,
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
  knockbackMomentumTimer: 0,
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
    z: null,
    x: null,
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
  pendingKnifeAttack: null,
  glockShotVisualTimer: 0,
  magicStaffCastTimer: 0,
  magicStaffCastDuration: 0.42,
  punchTimer: 0,
  knifeCharge: 0,
  knifeChargeMax: 1.25,
  knifeCharging: false,
  grenadeCharge: 0,
  grenadeCharging: false,
  grenadePinned: false,
  grenadeFuseTimer: 0,
  hasMagicStaff: false,
  dizzyCameraOwned: false,
  dizzyCameraEnabled: false,
  testMode: false,
};

function cloneConfig(value) {
  return JSON.parse(JSON.stringify(value));
}

const weapons = cloneConfig(weaponConfig);

function resetWeaponsToBase() {
  const baseWeapons = cloneConfig(weaponConfig);
  for (const key of Object.keys(weapons)) {
    delete weapons[key];
  }
  Object.assign(weapons, baseWeapons);
}

const camera = {
  x: player.x,
  y: player.y,
  smoothing: 0.12,
  zoom: 1 / 1.32,
  rotation: 0,
};
const baseCameraZoom = 1 / 1.32;
const fixedViewWorldHeight = 950;
const awmAimZoomMultiplier = 0.64;
const awmAimMoveMultiplier = 0.24;
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
  glockShot: new Audio(assetConfig.audio.glockShot),
  glockReload: new Audio(assetConfig.audio.glockReload),
  awmShot: new Audio(assetConfig.audio.awmShot),
  awmReload: new Audio(assetConfig.audio.awmReload),
  knifeSwing: new Audio(assetConfig.audio.knifeSwing),
  knifeThrow: new Audio(assetConfig.audio.knifeThrow),
  lightningThrust: new Audio(assetConfig.audio.lightningThrust),
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
let bossStatus = null;

const remotePlayers = new Map();
const remoteBullets = [];
const muzzleFlashEffects = [];
const dashDustEffects = [];
const walkingDustEffects = [];
const bloodDropEffects = [];
const skillVfxOverlays = [];
const wizardPoisonSlashEffects = [];
const corpses = [];
const teleportEffects = [];
const lightningEffects = [];
const railburstEffects = [];
const staticCollapseEffects = [];
const staticCollapseRangeEffects = [];
const staticCollapseProjectiles = [];
const arcPrisonEffects = [];
const stormRecallEffects = [];
const bazookaExplosionEffects = [];
const bazookaSmokeEffects = [];
const grenadeExplosionEffects = [];
const grenadePinEffects = [];
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

function getRandomPlayerSpawnPosition() {
  const margin = 360;
  const minimumShopDistance = 520;
  const minimumCrateDistance = 130;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = margin + Math.random() * Math.max(1, world.width - margin * 2);
    const y = margin + Math.random() * Math.max(1, world.height - margin * 2);

    if (Math.hypot(x - shopNpc.x, y - shopNpc.y) < minimumShopDistance) {
      continue;
    }

    const overlapsCrate = crates.some((crate) => {
      const crateRadius = getCrateHitboxSize(crate) / 2;
      return Math.hypot(x - crate.x, y - crate.y) < minimumCrateDistance + crateRadius;
    });
    if (overlapsCrate) {
      continue;
    }

    return { x, y };
  }

  return {
    x: margin + Math.random() * Math.max(1, world.width - margin * 2),
    y: margin + Math.random() * Math.max(1, world.height - margin * 2),
  };
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
  const spawnPosition = getRandomPlayerSpawnPosition();
  player.x = spawnPosition.x;
  player.y = spawnPosition.y;
  player.characterId = selectedCharacterId;
  player.vx = 0;
  player.vy = 0;
  player.dashVisualTimer = 0;
  player.walkDustStep = -1;
  player.spriteDirection = "down";
  player.spriteMotionDirection = null;
  player.spriteMotionStartedAt = 0;
  player.spriteWasMoving = false;
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
  player.knockbackMomentumTimer = 0;
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
    z: null,
    x: null,
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
  player.pendingKnifeAttack = null;
  player.glockShotVisualTimer = 0;
  player.magicStaffCastTimer = 0;
  player.magicStaffCastDuration = weapons.magicStaff.castDuration;
  player.punchTimer = 0;
  player.knifeCharge = 0;
  player.knifeCharging = false;
  player.grenadeCharge = 0;
  player.grenadeCharging = false;
  player.grenadePinned = false;
  player.grenadeFuseTimer = 0;
  player.hasMagicStaff = false;
  player.dashVisualTimer = 0;
  player.dizzyCameraOwned = false;
  player.dizzyCameraEnabled = false;
  player.testMode = false;
  document.body.classList.remove("test-mode");

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
  muzzleFlashEffects.length = 0;
  dashDustEffects.length = 0;
  walkingDustEffects.length = 0;
  bloodDropEffects.length = 0;
  skillVfxOverlays.length = 0;
  wizardPoisonSlashEffects.length = 0;
  lightningEffects.length = 0;
  railburstEffects.length = 0;
  staticCollapseEffects.length = 0;
  staticCollapseRangeEffects.length = 0;
  arcPrisonEffects.length = 0;
  stormRecallEffects.length = 0;
  bazookaExplosionEffects.length = 0;
  bazookaSmokeEffects.length = 0;
  grenadeExplosionEffects.length = 0;
  grenadePinEffects.length = 0;
  previewPickups.length = 0;
  previewCrates.length = 0;
  if (!sharedWorldActive) {
    pickups.length = 0;
  }
  keys.clear();
  mouse.down = false;
  mouse.rightDown = false;

  resetWeaponsToBase();

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
  camera.zoom = getDefaultCameraZoom();

  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getDefaultCameraZoom() {
  return Math.max(baseCameraZoom, height / fixedViewWorldHeight);
}

function isAwmAiming() {
  return gameStarted && mouse.rightDown && weapons.slots[weapons.selectedSlot] === "awm";
}

function updateCameraZoom(delta) {
  const targetZoom = getDefaultCameraZoom() * (isAwmAiming() ? awmAimZoomMultiplier : 1);
  camera.zoom += (targetZoom - camera.zoom) * Math.min(1, delta * 10);
}

function getWorldRenderScale() {
  return camera.zoom / getDefaultCameraZoom();
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

function addTeleportEffect(x, y, color = "#8df4df", { includePurchasedOverlay = true } = {}) {
  teleportEffects.push({
    x,
    y,
    color,
    startedAt: performance.now(),
    duration: 420,
  });
  // Purchased VFX overlay V1 rollback reference:
  // addSkillVfxOverlay("teleport", x, y, { duration: 320, size: 156 });
  if (includePurchasedOverlay) {
    addSkillVfxOverlay("teleport", x, y, {
      duration: 360,
      startSize: 104,
      endSize: 132,
      alpha: 0.86,
    });
  }
}

function addKnifeSwapBloodCloudEffect(x, y) {
  addSkillVfxOverlay("bloodCloud", x, y, {
    duration: 720,
    startSize: 180,
    endSize: 220,
    alpha: 0.9,
    blend: "source-over",
  });
}

function addLightningThrustEffect(startX, startY, endX, endY, color = "#7cd7ff") {
  playAudioAsset(audioAssets.lightningThrust, 0.12);
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

  /*
   * V3 rollback reference: previous Lightning Thrust side branches.
   * for (let bolt = 0; bolt < 7; bolt += 1) {
   *   const t = 0.16 + Math.random() * 0.72;
   *   const side = Math.random() < 0.5 ? -1 : 1;
   *   const span = 24 + Math.random() * 48;
   *   const x = startX + Math.cos(angle) * length * t;
   *   const y = startY + Math.sin(angle) * length * t;
   *   bolts.push({
   *     x1: x,
   *     y1: y,
   *     x2: x + normalX * side * span + Math.cos(angle) * (Math.random() - 0.5) * 40,
   *     y2: y + normalY * side * span + Math.sin(angle) * (Math.random() - 0.5) * 40,
   *   });
   * }
   */

  lightningEffects.push({
    points,
    bolts,
    color,
    startedAt: performance.now(),
    duration: 360,
  });
  // Purchased VFX overlay V1 rollback reference:
  // addSkillVfxOverlay("lightning", startX, startY, { duration: 220, size: 112, angle });
  // addSkillVfxOverlay("lightningImpact", endX, endY, { duration: 250, size: 142, angle });
  // V2 rollback reference: previous slash and impact overlays.
  // addSkillVfxOverlay("swordSlash", endX, endY, { duration: 240, startSize: 120, endSize: 156, angle: angle + Math.PI / 2, alpha: 0.9 });
  // addSkillVfxOverlay("lightningImpact", endX, endY, { delay: 42, duration: 300, startSize: 126, endSize: 170, alpha: 0.94 });
  // V4 rollback reference: previous regular start aura.
  // addSkillVfxOverlay("lightningThrustAura", startX, startY, { duration: 860, startSize: 116, endSize: 148, alpha: 0.72 });
  // V5 rollback reference: VFX_Lightning_07 used to appear once at the start.
  // addSkillVfxOverlay("lightningThrustScatter07", startX, startY, {
  addSkillVfxOverlay("lightningThrustScatter08", startX, startY, {
    duration: 1000,
    startSize: 92,
    endSize: 136,
    angle: angle + (Math.random() - 0.5) * 0.7,
    alpha: 0.7,
  });
  addSkillVfxOverlay("lightningThrustAura", startX, startY, {
    delay: 18,
    duration: 1000,
    startSize: 98,
    endSize: 142,
    alpha: 0.62,
  });
  if (Math.random() < 0.46) {
    addSkillVfxOverlay("lightningThrustScatter06", startX + normalX * 10, startY + normalY * 10, {
      delay: 34 + Math.random() * 42,
      duration: 1000,
      startSize: 74,
      endSize: 112,
      angle: angle + (Math.random() - 0.5) * 0.9,
      alpha: 0.54,
    });
  }
  addSkillVfxOverlay("lightningThrustAura", endX, endY, {
    delay: 24,
    duration: 1000,
    startSize: 132,
    endSize: 172,
    alpha: 0.86,
  });
  // V5 rollback reference: VFX_Lightning_03 used to appear once along the trail.
  // const trailT = 0.36 + Math.random() * 0.28;
  // addSkillVfxOverlay("lightningThrustTrail", startX + (endX - startX) * trailT, startY + (endY - startY) * trailT, {
  //   delay: 30 + Math.random() * 34,
  //   duration: 1000,
  //   startSize: 68,
  //   endSize: 98,
  //   angle: angle + (Math.random() - 0.5) * 0.36,
  //   alpha: 0.52,
  // });
  const scatterKinds = [
    "lightningThrustScatter06",
    "lightningThrustScatter08",
  ];
  for (const [index, kind] of scatterKinds.entries()) {
    const t = 0.18 + Math.random() * 0.58;
    const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 20);
    addSkillVfxOverlay(kind, startX + (endX - startX) * t + normalX * sideOffset, startY + (endY - startY) * t + normalY * sideOffset, {
      delay: 44 + index * 36 + Math.random() * 48,
      duration: 1000,
      startSize: 62 + Math.random() * 18,
      endSize: 92 + Math.random() * 24,
      angle: angle + (Math.random() - 0.5) * 1.2,
      alpha: 0.46 + Math.random() * 0.14,
    });
  }
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
  // Purchased VFX overlay V1 rollback reference:
  // addSkillVfxOverlay("lightning", startX, startY, { duration: 230, size: 148, angle });
  // addSkillVfxOverlay("burstImpact", endX, endY, { duration: 280, size: 232, angle });
  addSkillVfxOverlay("impactSparks", endX, endY, {
    duration: 280,
    startSize: 176,
    endSize: 224,
    angle,
    alpha: 0.88,
  });
  addSkillVfxOverlay("lightningImpact", endX, endY, {
    delay: 32,
    duration: 340,
    startSize: 182,
    endSize: 244,
    alpha: 0.9,
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
  weapons.bazooka.reloadTime = Number((baseReloadTimes.bazooka * multiplier).toFixed(2));
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
    const unitLabel = item === "knife" || item === "grenade" ? "1" : `${unit} ammo`;
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

  const dizzyCameraRow = shopPanel?.querySelector("[data-title-item='dizzyCamera']");
  const dizzyCameraButton = dizzyCameraRow?.querySelector("button[data-action='title']");
  if (dizzyCameraRow && dizzyCameraButton) {
    dizzyCameraRow.classList.toggle("owned", player.dizzyCameraOwned);
    dizzyCameraRow.classList.toggle("equipped", player.dizzyCameraEnabled);
    dizzyCameraButton.textContent = player.dizzyCameraOwned
      ? player.dizzyCameraEnabled
        ? "Disable"
        : "Use"
      : `Buy ${titleShopPrices.dizzyCamera}`;
  }
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
  player.ownedSkills = Object.keys(skillDefinitions);
  player.skillSlots = {
    f: "knifeRecall",
    q: "staticCollapse",
    g: "arcPrison",
    e: "stormRecall",
    z: "lightningThrust",
    x: "railburst",
  };
  for (const skill of Object.keys(player.skillCooldowns)) {
    player.skillCooldowns[skill] = 0;
  }

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
  weapons.bazooka.magAmmo = weapons.bazooka.magazineSize;
  weapons.bazooka.ammo = 1000;
  weapons.bazooka.reloadTimer = 0;
  weapons.grenade.count = 1000;
  weapons.grenade.magAmmo = 0;
  weapons.grenade.ammo = 0;
  weapons.grenade.reloadTimer = 0;
  weapons.magicStaff.count = 1;

  document.body.classList.add("test-mode");
  updateCoinHud();
  updateXpHud();
  updateInventory();
  updateUpgradePanel();
  updateLeaderboard();
  addChatMessage({ name: "System", text: "Test mode: weapons 1-6, skills F Q G E Z X.", local: true });
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

function drawCharacterSelectPreview(canvas, characterId) {
  const character = getCharacterDefinition(characterId);
  const sprite = character.sprites.idle;
  const previewCtx = canvas.getContext("2d");
  previewCtx.clearRect(0, 0, canvas.width, canvas.height);

  if (!sprite.complete || !sprite.naturalWidth) {
    return;
  }

  previewCtx.imageSmoothingEnabled = false;
  previewCtx.drawImage(
    sprite,
    0,
    2 * 128,
    128,
    128,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}

function updateCharacterSelectUi() {
  if (!characterSelect) {
    return;
  }

  for (const button of characterSelect.querySelectorAll(".character-card")) {
    const characterId = button.dataset.character;
    const locked = !isCharacterUnlocked(characterId);
    button.disabled = locked;
    button.classList.toggle("locked", locked);
    button.classList.toggle("selected", characterId === selectedCharacterId && !locked);
    button.setAttribute("aria-pressed", String(characterId === selectedCharacterId && !locked));
    button.setAttribute("aria-disabled", String(locked));
  }
}

function initCharacterSelect() {
  if (!characterSelect) {
    return;
  }

  characterSelect.innerHTML = "";
  for (const character of Object.values(characterDefinitions).filter((definition) => definition.selectable !== false)) {
    const locked = !isCharacterUnlocked(character.id);
    const button = document.createElement("button");
    button.className = `character-card${locked ? " locked" : ""}`;
    button.type = "button";
    button.dataset.character = character.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-disabled", String(locked));
    button.disabled = locked;
    if (locked && character.unlockHint) {
      button.title = character.unlockHint;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    drawCharacterSelectPreview(canvas, character.id);
    character.sprites.idle.addEventListener("load", () => drawCharacterSelectPreview(canvas, character.id), { once: true });

    const label = document.createElement("span");
    label.textContent = character.label;
    const status = document.createElement("small");
    status.textContent = locked ? character.unlockHint || "잠김" : "";

    button.append(canvas, label, status);
    button.addEventListener("click", () => {
      if (!isCharacterUnlocked(character.id)) {
        return;
      }
      setSelectedCharacter(character.id);
      updateCharacterSelectUi();
    });
    characterSelect.append(button);
  }

  updateCharacterSelectUi();
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
    characterId: player.characterId || selectedCharacterId,
    unlockedCharacters: [...getUnlockedCharacterIds()],
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
    dizzyCameraOwned: player.dizzyCameraOwned,
    dizzyCameraEnabled: player.dizzyCameraEnabled,
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
      bazooka: {
        damage: weapons.bazooka.damage,
        bulletSpeed: weapons.bazooka.bulletSpeed,
        bulletLife: weapons.bazooka.bulletLife,
        magazineSize: weapons.bazooka.magazineSize,
        ammo: weapons.bazooka.ammo,
        magAmmo: weapons.bazooka.magAmmo,
        upgrades: { ...weapons.bazooka.upgrades },
      },
      grenade: {
        damage: weapons.grenade.damage,
        bulletSpeed: weapons.grenade.bulletSpeed,
        bulletLife: weapons.grenade.bulletLife,
        count: weapons.grenade.count,
        upgrades: { ...weapons.grenade.upgrades },
      },
      magicStaff: {
        count: weapons.magicStaff.count,
        upgrades: { ...weapons.magicStaff.upgrades },
      },
    },
  };
}

function applyCharacterProfile(profile) {
  if (!profile) {
    return;
  }

  player.name = profile.name || player.name;
  if (Array.isArray(profile.unlockedCharacters)) {
    const unlockedIds = getUnlockedCharacterIds();
    for (const characterId of profile.unlockedCharacters) {
      if (isCharacterSelectable(characterId)) {
        unlockedIds.add(characterId);
      }
    }
    saveUnlockedCharacterIds(unlockedIds);
  }
  if (characterDefinitions[profile.characterId]) {
    selectedCharacterId = getAvailableCharacterId(profile.characterId);
    player.characterId = selectedCharacterId;
    localStorage.setItem(selectedCharacterStorageKey, selectedCharacterId);
    initCharacterSelect();
    updateCharacterSelectUi();
  }
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
  player.dizzyCameraOwned = Boolean(profile.dizzyCameraOwned);
  player.dizzyCameraEnabled = Boolean(profile.dizzyCameraOwned && profile.dizzyCameraEnabled);
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

  for (const weaponName of ["knife", "glock", "awm", "bazooka", "grenade", "magicStaff"]) {
    if (profile.weapons?.[weaponName]) {
      Object.assign(weapons[weaponName], profile.weapons[weaponName]);
      weapons[weaponName].reloadTimer = 0;
    }
  }
  player.hasMagicStaff = Boolean([1, 2, 3].find((slot) => weapons.slots[slot] === "magicStaff") || weapons.magicStaff.count > 0);
  if (profile.weapons?.grenade) {
    weapons.grenade.count = Math.max(
      0,
      Number(profile.weapons.grenade.count ?? 0) +
        (Number.isFinite(profile.weapons.grenade.count)
          ? 0
          : Number(profile.weapons.grenade.ammo || 0) + Number(profile.weapons.grenade.magAmmo || 0)),
    );
    weapons.grenade.ammo = 0;
    weapons.grenade.magAmmo = 0;
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
  player.grenadeCharge = 0;
  player.grenadeCharging = false;
  player.grenadePinned = false;
  player.grenadeFuseTimer = 0;
  player.hasMagicStaff = false;
  player.dashVisualTimer = 0;
  player.spriteDirection = "down";
  player.spriteMotionDirection = null;
  player.spriteMotionStartedAt = 0;
  player.spriteWasMoving = false;

  resetWeaponsToBase();
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
  if (item !== "glock" && item !== "awm" && item !== "bazooka" && item !== "grenade") {
    return 0;
  }

  if (item === "grenade") {
    return weapons.grenade.count;
  }

  return weapons[item].ammo + weapons[item].magAmmo;
}

function removeAmmoForSale(item, amount) {
  if (getWeaponAmmoTotal(item) < amount) {
    return false;
  }

  if (item === "grenade") {
    weapons.grenade.count -= amount;
  }

  const reserveUsed = item === "grenade" ? 0 : Math.min(weapons[item].ammo, amount);
  weapons[item].ammo -= reserveUsed;

  const fromMagazine = amount - reserveUsed;
  if (item !== "grenade" && fromMagazine > 0) {
    weapons[item].magAmmo = Math.max(0, weapons[item].magAmmo - fromMagazine);
  }

  if (getWeaponAmmoTotal(item) <= 0) {
    const slot = [1, 2, 3].find((candidate) => weapons.slots[candidate] === item);
    if (slot) {
      weapons.slots[slot] = null;
    }
    if (item === "grenade") {
      weapons.grenade.count = 0;
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
      : item === "grenade"
      ? { type: "grenade", count: unit }
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
    weapons[item].damage += item === "bazooka" ? 22 : item === "awm" ? 15 : item === "glock" ? 8 : 5;
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
  return player.testMode || player.level >= (skillSlotUnlockLevels[slotKey] || Infinity);
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

function handleTitlePurchase(titleItem) {
  if (titleItem !== "dizzyCamera") {
    return;
  }

  if (!player.dizzyCameraOwned) {
    const price = titleShopPrices.dizzyCamera;
    if (player.coins < price) {
      setShopMessage("Not enough coins.");
      return;
    }
    player.coins -= price;
    player.dizzyCameraOwned = true;
    player.dizzyCameraEnabled = true;
    setShopMessage("어지러움을 견뎌라 purchased and activated.");
  } else {
    player.dizzyCameraEnabled = !player.dizzyCameraEnabled;
    if (!player.dizzyCameraEnabled) {
      camera.rotation = 0;
    }
    setShopMessage(player.dizzyCameraEnabled ? "어지러움을 견뎌라 activated." : "어지러움을 견뎌라 disabled.");
  }

  updateCoinHud();
  updateShopHud();
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
  const types = ["knife", "glock", "awm", "grenade", "armor", "medkit"];
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
    embedded: Boolean(data.embedded),
    angle: Number.isFinite(data.angle) ? data.angle : undefined,
    dropId: data.dropId,
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
  addBloodDropEffect(player.x, player.y);

  if (player.health <= 0) {
    handleLocalDeath();
  }
}

function addCorpse({ x, y, name, characterId = selectedCharacterId, color = "#58a6ff", stroke = "#1b496f" }) {
  corpses.push({
    x,
    y,
    name,
    characterId,
    color,
    stroke,
    startedAt: performance.now(),
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
  player.grenadeCharge = 0;
  player.grenadeCharging = false;
  player.grenadePinned = false;
  player.grenadeFuseTimer = 0;
  addCorpse({ x: player.x, y: player.y, name: player.name, characterId: player.characterId });
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

function getPickupGrenadeCount(item) {
  if (!item || typeof item !== "object") {
    return 1;
  }

  if (Number.isFinite(item.count)) {
    return Math.max(1, Number(item.count));
  }

  return Math.max(1, Number(item.ammo || 0) + Number(item.magAmmo || 0));
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

  if (type === "magicStaff") {
    return Boolean([1, 2, 3].find((slot) => weapons.slots[slot] === "magicStaff") || [1, 2, 3].find((slot) => !weapons.slots[slot]));
  }

  if (type === "knife" || type === "glock" || type === "awm" || type === "bazooka" || type === "grenade") {
    return Boolean([1, 2, 3].find((slot) => weapons.slots[slot] === type) || [1, 2, 3].find((slot) => !weapons.slots[slot]));
  }

  return false;
}

function canMagnetPickup(item) {
  const type = getPickupType(item);
  return type === "armor" || type === "medkit" || canCollectPickup(item);
}

function addMagicStaffToInventory() {
  const existingSlot = [1, 2, 3].find((slot) => weapons.slots[slot] === "magicStaff");

  if (existingSlot) {
    weapons.magicStaff.count = Math.max(1, weapons.magicStaff.count || 0);
    weapons.selectedSlot = existingSlot;
    player.hasMagicStaff = true;
    return true;
  }

  const emptySlot = [1, 2, 3].find((slot) => !weapons.slots[slot]);
  if (!emptySlot) {
    return false;
  }

  weapons.slots[emptySlot] = "magicStaff";
  weapons.magicStaff.count = 1;
  weapons.selectedSlot = emptySlot;
  player.hasMagicStaff = true;
  return true;
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

  if (weaponName === "grenade") {
    const count = getPickupGrenadeCount(item);
    const existingSlot = [1, 2, 3].find((slot) => weapons.slots[slot] === "grenade");

    if (existingSlot) {
      weapons.grenade.count += count;
      return true;
    }

    const emptySlot = [1, 2, 3].find((slot) => !weapons.slots[slot]);
    if (!emptySlot) {
      return false;
    }

    weapons.slots[emptySlot] = "grenade";
    weapons.grenade.count = Math.max(0, weapons.grenade.count) + count;
    weapons.grenade.ammo = 0;
    weapons.grenade.magAmmo = 0;
    weapons.grenade.reloadTimer = 0;
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

  const preferredSlot = weaponName === "glock" || weaponName === "bazooka" || weaponName === "grenade" ? 2 : 3;
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

  if (pickup.type === "knife" || pickup.type === "glock" || pickup.type === "bazooka" || pickup.type === "grenade") {
    collected = addWeaponToInventory(pickup);
  } else if (pickup.type === "awm") {
    collected = addWeaponToInventory(pickup);
  } else if (pickup.type === "magicStaff") {
    collected = addMagicStaffToInventory();
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

  if (type === "knife" || type === "glock" || type === "bazooka" || type === "grenade") {
    collected = addWeaponToInventory(item);
  } else if (type === "awm") {
    collected = addWeaponToInventory(item);
  } else if (type === "magicStaff") {
    collected = addMagicStaffToInventory();
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

function playMagicStaffSlashSound() {
  playNoise({ duration: 0.08, gain: 0.045, filterFrequency: 760 });
  playTone({ frequency: 260, duration: 0.08, type: "sawtooth", gain: 0.022, when: 0.02 });
}

function playMagicStaffProjectileSound() {
  playTone({ frequency: 390, duration: 0.12, type: "triangle", gain: 0.024 });
  playTone({ frequency: 620, duration: 0.16, type: "sine", gain: 0.018, when: 0.08 });
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
    addBloodDropEffect(effect.x, effect.y);
  } else if (effect.type === "teleport") {
    if (effect.phase) {
      // V1 rollback reference: the previous departure-only vanish overlay.
      // if (effect.phase === "depart") addSkillVfxOverlay("vanish", effect.x, effect.y, { duration: 250, startSize: 88, endSize: 108, alpha: 0.78 });
      addKnifeSwapBloodCloudEffect(effect.x, effect.y);
      // V2 rollback reference: Knife Teleport used to render a procedural ring at both ends.
      // addTeleportEffect(effect.x, effect.y, effect.color || "#8df4df", { includePurchasedOverlay: false });
    } else {
      addTeleportEffect(effect.x, effect.y, effect.color || "#8df4df");
    }
    playTone({ frequency: 620, duration: 0.08, type: "triangle", gain: 0.045 });
    playTone({ frequency: 920, duration: 0.12, type: "sine", gain: 0.035, when: 0.04 });
  } else if (effect.type === "wizardPoisonSlash") {
    triggerWizardBossAttackMotion(effect, 0.56);
    addPoisonSlashVfx(effect);
    playMagicStaffSlashSound();
  } else if (effect.type === "wizardToxicOrbRing") {
    triggerWizardBossAttackMotion(effect, Math.max(0.72, (effect.duration || 850) / 1000));
    const count = effect.count || 10;
    const radius = effect.radius || 132;
    const startAngle = effect.startAngle || 0;
    for (let orbIndex = 0; orbIndex < count; orbIndex += 1) {
      const angle = startAngle + (Math.PI * 2 * orbIndex) / count;
      addSkillVfxOverlay("toxicOrb", effect.x + Math.cos(angle) * radius, effect.y + Math.sin(angle) * radius, {
        delay: orbIndex * 28,
        duration: effect.duration || 1050,
        startSize: effect.startSize || 54,
        endSize: effect.endSize || 74,
        widthScale: 0.82,
        heightScale: 1,
        angle: 0,
        alpha: 0.95,
        blend: "lighter",
        loop: true,
        frameRate: 30,
      });
    }
    playTone({ frequency: 360, duration: 0.16, type: "triangle", gain: 0.024 });
    playTone({ frequency: 540, duration: 0.18, type: "sine", gain: 0.018, when: 0.1 });
  } else if (effect.type === "wizardToxicOrbCharge") {
    addSkillVfxOverlay("toxicOrb", effect.x, effect.y, {
      duration: effect.duration || 360,
      startSize: effect.startSize || 72,
      endSize: effect.endSize || 108,
      widthScale: 0.82,
      heightScale: 1,
      angle: effect.angle || 0,
      alpha: 0.92,
      blend: "lighter",
      loop: true,
      frameRate: 28,
    });
    playTone({ frequency: 390, duration: 0.12, type: "triangle", gain: 0.024 });
    playTone({ frequency: 620, duration: 0.16, type: "sine", gain: 0.018, when: 0.08 });
  } else if (effect.type === "bazookaExplosion") {
    addBazookaExplosionEffect(effect.x, effect.y, effect.radius || bazookaExplosionRadius);
    for (const list of [bullets, remoteBullets]) {
      const index = list.findIndex((bullet) => bullet.id === effect.bulletId && (!effect.ownerId || bullet.ownerId === effect.ownerId));
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  } else if (effect.type === "grenadeExplosion") {
    addGrenadeExplosionEffect(effect.x, effect.y, effect.radius || grenadeExplosionRadius);
    for (const list of [bullets, remoteBullets]) {
      const index = list.findIndex((bullet) => bullet.id === effect.bulletId && (!effect.ownerId || bullet.ownerId === effect.ownerId));
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  }
}

function addPoisonSlashVfx(effect) {
  const size = effect.size || 280;
  // Previous procedural green range arc kept for rollback reference.
  // addWizardPoisonSlashEffect(effect);
  addSkillVfxOverlay("poisonSlash", effect.x, effect.y, {
    duration: 520,
    startSize: size,
    endSize: size * 1.16,
    angle: effect.angle || 0,
    alpha: 1,
    blend: "lighter",
    frameRate: 26,
  });
  addSkillVfxOverlay("poisonSlash", effect.x, effect.y, {
    delay: 70,
    duration: 430,
    startSize: size * 0.78,
    endSize: size * 1.04,
    angle: (effect.angle || 0) + Math.PI * 0.08,
    alpha: 0.72,
    blend: "lighter",
    frameRate: 28,
  });
}

function triggerWizardBossAttackMotion(effect, duration = 0.56) {
  const bossRemote =
    remotePlayers.get(effect.ownerId) ||
    [...remotePlayers.values()]
      .filter((remote) => remote.isBoss)
      .sort((a, b) => (
        Math.hypot((a.x ?? 0) - (effect.x ?? 0), (a.y ?? 0) - (effect.y ?? 0)) -
        Math.hypot((b.x ?? 0) - (effect.x ?? 0), (b.y ?? 0) - (effect.y ?? 0))
      ))[0];

  if (!bossRemote) {
    return;
  }

  bossRemote.punchTimer = duration;
  bossRemote.punchDuration = duration;
  bossRemote.swingTimer = duration;
  bossRemote.swingDuration = duration;
  bossRemote.bossAttackVisualTimer = duration;
  bossRemote.aimAngle = effect.angle ?? bossRemote.aimAngle ?? 0;
  bossRemote.renderAimAngle = effect.angle ?? bossRemote.renderAimAngle ?? 0;
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
  } else if (button.dataset.action === "title") {
    handleTitlePurchase(button.dataset.titleItem);
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
      const remote = remotePlayers.get(message.id);
      if (remote && (message.bullet.weapon === "glock" || message.bullet.weapon === "awm")) {
        remote.glockShotVisualTimer = glockShotVisualDuration;
      } else if (remote && (message.bullet.weapon === "magicStaff" || message.bullet.weapon === "wizardPoisonBolt")) {
        remote.magicStaffCastTimer = weapons.magicStaff.castDuration;
        remote.magicStaffCastDuration = weapons.magicStaff.castDuration;
      }
    } else if (message.type === "bulletImpact") {
      syncBulletImpact(message);
    } else if (message.type === "magicStaffAim") {
      const remoteBullet = remoteBullets.find((bullet) => bullet.id === message.bulletId && bullet.ownerId === message.id);
      if (remoteBullet?.weapon === "magicStaff") {
        remoteBullet.targetX = Number(message.targetX);
        remoteBullet.targetY = Number(message.targetY);
      }
    } else if (message.type === "melee") {
      message.attack.ownerId = message.id;
      const remote = remotePlayers.get(message.id);
      if (remote) {
        if (message.attack.weapon === "fist") {
          remote.punchTimer = message.attack.swingDuration || weapons.fist.swingDuration;
          remote.punchDuration = message.attack.swingDuration || weapons.fist.swingDuration;
        } else {
          remote.swingTimer = message.attack.swingDuration || knifeAttackVisualDuration;
          remote.swingDuration = message.attack.swingDuration || knifeAttackVisualDuration;
        }
      }
      if (message.attack.weapon === "magicStaff") {
        addPoisonSlashVfx({
          x: message.attack.x + Math.cos(message.attack.angle || 0) * 104,
          y: message.attack.y + Math.sin(message.attack.angle || 0) * 104,
          angle: message.attack.angle || 0,
          size: message.attack.size || weapons.magicStaff.slashSize,
        });
        playMagicStaffSlashSound();
      }
      handleRemoteMelee(message.attack);
    } else if (message.type === "world") {
      sharedWorldActive = true;
      crates.splice(0, crates.length, ...message.world.crates);
      syncWorldPickups(message.world.pickups);
    } else if (message.type === "characterUnlock") {
      if (unlockCharacter(message.characterId)) {
        addChatMessage({ name: "System", text: "Wizard character unlocked.", local: true });
        saveCharacterProfile();
      }
    } else if (message.type === "bossStatus") {
      bossStatus = message.status || null;
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
      // V1 rollback reference: the server effect broadcast now renders these once for every client.
      // addTeleportEffect(player.x, player.y);
      // addTeleportEffect(message.x, message.y);
      player.x = message.x;
      player.y = message.y;
      player.knifeSwapTimer = knifeSwapCooldownSeconds;
      player.skillCooldowns.knifeRecall = knifeSwapCooldownSeconds;
    } else if (message.type === "knifeSwap") {
      const remoteBullet = remoteBullets.find((bullet) => bullet.id === message.bulletId && bullet.ownerId === message.id);
      const remote = remotePlayers.get(message.id);
      // V1 rollback reference: broadcast effects below the server swap path avoid duplicated overlays.
      // addTeleportEffect(message.playerX, message.playerY, "#ff9cb5");
      // addTeleportEffect(message.bulletX, message.bulletY, "#ff9cb5");
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
        addLightningThrustEffect(attack.startX, attack.startY, attack.endX, attack.endY, "#7cd7ff");
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
        player.knockbackTimer = Math.max(player.knockbackTimer || 0, message.knockback.duration || 0.58);
        if (message.knockback.preserveMomentum) {
          player.knockbackMomentumTimer = Math.max(player.knockbackMomentumTimer || 0, message.knockback.duration || 0.58);
        }
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
          characterId: remote.characterId,
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

  if (state.isBoss && !previous && Number.isFinite(state.x) && Number.isFinite(state.y)) {
    addSkillVfxOverlay("wizardBossSpawnPoisonExplosion02", state.x, state.y, {
      duration: 760,
      startSize: 520,
      endSize: 680,
      alpha: 0.9,
      blend: "lighter",
      frameRate: 24,
    });
  }

  remotePlayers.set(id, {
    id,
    isAi: String(id).startsWith("test-ai-"),
    ...state,
    renderX: previous?.renderX ?? state.x,
    renderY: previous?.renderY ?? state.y,
    renderAimAngle: previous?.renderAimAngle ?? state.aimAngle ?? 0,
    spriteDirection: previous?.spriteDirection ?? "down",
    spriteMotionDirection: previous?.spriteMotionDirection ?? null,
    spriteMotionStartedAt: previous?.spriteMotionStartedAt ?? 0,
    spriteWasMoving: previous?.spriteWasMoving ?? false,
    glockShotVisualTimer: previous?.glockShotVisualTimer ?? 0,
    magicStaffCastTimer: Math.max(Number(state.magicStaffCastTimer || 0), previous?.magicStaffCastTimer ?? 0),
    magicStaffCastDuration: Number(state.magicStaffCastDuration || previous?.magicStaffCastDuration || weapons.magicStaff.castDuration),
    walkDustStep: previous?.walkDustStep ?? -1,
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
  if (!sharedWorldActive) {
    // V1 rollback reference: the previous departure-only vanish overlay.
    // addSkillVfxOverlay("vanish", previousPlayerX, previousPlayerY, { duration: 250, startSize: 88, endSize: 108, alpha: 0.78 });
    addKnifeSwapBloodCloudEffect(previousPlayerX, previousPlayerY);
    addKnifeSwapBloodCloudEffect(player.x, player.y);
    // V2 rollback reference: Knife Teleport used to render procedural rings at both ends.
    // addTeleportEffect(previousPlayerX, previousPlayerY, "#8df4df", { includePurchasedOverlay: false });
    // addTeleportEffect(player.x, player.y, "#8df4df", { includePurchasedOverlay: false });
  }
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
  // V1 rollback reference: Lightning Thrust used to layer generated tones and noise over the purchased SFX.
  // playTone({ frequency: 360, duration: 0.05, type: "sawtooth", gain: 0.055 });
  // playTone({ frequency: 1040, duration: 0.12, type: "triangle", gain: 0.052, when: 0.03 });
  // playNoise({ duration: 0.12, gain: 0.1, filterFrequency: 1200 });

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
  if (usePurchasedStaticCollapseVfx) {
    addStaticCollapseChargeOrbEffect(x, y, radius);
    addStaticCollapseDamageRangeEffect(x, y, radius);
    addSkillVfxOverlay("staticCollapseCharge", x, y, {
      duration: staticCollapseDelay * 1000,
      startSize: radius * 0.56,
      endSize: radius * 0.7,
      alpha: 0.9,
      loop: true,
      frameRate: 16,
    });
    addSkillVfxOverlay("staticCollapseBurst", x, y, {
      delay: staticCollapseDelay * 1000,
      duration: 560,
      startSize: radius * 1.92,
      endSize: radius * 2.08,
      alpha: 1,
    });
    return;
  }

  // V1 rollback reference: original procedural Static Collapse charge particles.
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
  if (usePurchasedStaticCollapseVfx) {
    addStaticCollapseChargeOrbEffect(x, y, radius);
    addStaticCollapseDamageRangeEffect(x, y, radius);
    addSkillVfxOverlay("staticCollapseCharge", x, y, {
      duration: staticCollapseDelay * 1000,
      startSize: radius * 0.56,
      endSize: radius * 0.7,
      alpha: 0.9,
      loop: true,
      frameRate: 16,
    });
    addSkillVfxOverlay("staticCollapseBurst", x, y, {
      delay: staticCollapseDelay * 1000,
      duration: 560,
      startSize: radius * 1.92,
      endSize: radius * 2.08,
      alpha: 1,
    });
    return;
  }

  // V1 rollback reference: original procedural Static Collapse burst.
  staticCollapseEffects.push({
    x,
    y,
    radius,
    particles: [],
    startedAt: performance.now(),
    duration: 620,
    burstOnly: true,
  });
  // Purchased VFX overlay V1 rollback reference:
  // addSkillVfxOverlay("magicImpact", x, y, { duration: 420, size: radius * 2.15 });
  // The server applies damage after the collapse delay, so the bright ring arrives close to the hit.
  addSkillVfxOverlay("magicImpact", x, y, {
    delay: Math.max(0, staticCollapseDelay * 1000 - 120),
    duration: 520,
    startSize: radius * 1.65,
    endSize: radius * 2.2,
    alpha: 0.9,
  });
}

function addStaticCollapseChargeOrbEffect(x, y, radius = staticCollapseRadius) {
  staticCollapseEffects.push({
    x,
    y,
    radius,
    particles: [],
    startedAt: performance.now(),
    duration: staticCollapseDelay * 1000,
    orbOnly: true,
  });
}

function addStaticCollapseDamageRangeEffect(x, y, radius = staticCollapseRadius) {
  staticCollapseRangeEffects.push({
    x,
    y,
    radius,
    startedAt: performance.now() + staticCollapseDelay * 1000,
    duration: 560,
  });
}

function addArcPrisonEffect(x, y, radius = arcPrisonRadius) {
  const sparks = Array.from({ length: 18 }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 1.6,
    length: 14 + Math.random() * 26,
  }));

  arcPrisonEffects.push({ x, y, radius, sparks, startedAt: performance.now(), duration: 1900 });
  // Purchased VFX overlay V1 rollback reference:
  // addSkillVfxOverlay("lightningImpact", x, y, { duration: 340, size: radius * 1.18 });
  addSkillVfxOverlay("lightningImpact", x, y, {
    duration: 300,
    startSize: 120,
    endSize: 165,
    alpha: 0.72,
  });
}

function addStormRecallEffect(x, y, radius = stormRecallRadius) {
  const sparks = Array.from({ length: 14 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.16 + Math.random() * 0.42),
    size: 2 + Math.random() * 2.5,
  }));

  stormRecallEffects.push({ x, y, radius, sparks, startedAt: performance.now(), duration: 240 });
  // Purchased VFX overlay V1 rollback reference:
  // addSkillVfxOverlay("lightning", x, y, { duration: 260, size: radius * 1.72 });
  // addSkillVfxOverlay("lightningImpact", x, y, { duration: 320, size: radius * 1.42 });
  // V3 rollback reference: Storm Recall used to render a lightning flipbook at its center.
  // addSkillVfxOverlay("lightning", x, y, {
  //   duration: 300,
  //   startSize: radius * 0.72,
  //   endSize: radius * 0.9,
  //   alpha: 0.96,
  // });
  // V2 rollback reference: Storm Recall used to render a flame-like impact ring at its center.
  // addSkillVfxOverlay("lightningImpact", x, y, {
  //   delay: 55,
  //   duration: 340,
  //   startSize: radius * 0.88,
  //   endSize: radius * 1.34,
  //   alpha: 0.96,
  // });
}

function getBazookaBlastDamage(baseDamage, distance, radius = bazookaExplosionRadius) {
  const ratio = clamp(distance / Math.max(1, radius), 0, 1);
  return Math.max(1, Math.round(baseDamage * (0.28 + 0.72 * (1 - ratio))));
}

function addBazookaSmoke(x, y) {
  bazookaSmokeEffects.push({
    x,
    y,
    radius: 7 + Math.random() * 5,
    driftX: (Math.random() - 0.5) * 16,
    driftY: (Math.random() - 0.5) * 16,
    startedAt: performance.now(),
    duration: 430 + Math.random() * 180,
  });
}

function addBazookaExplosionEffect(x, y, radius = bazookaExplosionRadius) {
  const particles = Array.from({ length: 18 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.28 + Math.random() * 0.62),
    size: 3 + Math.random() * 5,
  }));
  const fireballs = Array.from({ length: 9 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.08 + Math.random() * 0.24),
    size: radius * (0.12 + Math.random() * 0.12),
  }));
  const debris = Array.from({ length: 12 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.42 + Math.random() * 0.7),
    length: 7 + Math.random() * 12,
    rotation: Math.random() * Math.PI * 2,
  }));
  bazookaExplosionEffects.push({
    x,
    y,
    radius,
    particles,
    fireballs,
    debris,
    startedAt: performance.now(),
    duration: usePurchasedBazookaExplosionVfx ? 1000 : 620,
  });
  playNoise({ duration: 0.2, gain: 0.15, filterFrequency: 420 });
  playTone({ frequency: 72, duration: 0.18, type: "sawtooth", gain: 0.1 });
}

function addGrenadeExplosionEffect(x, y, radius = grenadeExplosionRadius) {
  const particles = Array.from({ length: 14 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.2 + Math.random() * 0.58),
    size: 2 + Math.random() * 4,
  }));
  const shards = Array.from({ length: 10 }, () => ({
    angle: Math.random() * Math.PI * 2,
    distance: radius * (0.42 + Math.random() * 0.72),
    length: 5 + Math.random() * 9,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 12,
  }));
  grenadeExplosionEffects.push({ x, y, radius, particles, shards, startedAt: performance.now(), duration: 510 });
  playNoise({ duration: 0.16, gain: 0.13, filterFrequency: 510 });
  playTone({ frequency: 92, duration: 0.13, type: "sawtooth", gain: 0.085 });
}

function addGrenadePinEffect() {
  const angle = getAimAngle();
  const sideX = -Math.sin(angle);
  const sideY = Math.cos(angle);
  grenadePinEffects.push({
    x: player.x + Math.cos(angle) * (player.radius + 13) + sideX * 9,
    y: player.y + Math.sin(angle) * (player.radius + 13) + sideY * 9,
    vx: sideX * 54 + Math.cos(angle) * 18,
    vy: sideY * 54 + Math.sin(angle) * 18,
    rotation: angle,
    startedAt: performance.now(),
    duration: 1050,
  });
}

function resolveGrenadeMotion(grenade, previousX, previousY, delta) {
  let bounced = false;
  grenade.z = Math.max(0, Number(grenade.z || 0) + Number(grenade.vz || 0) * delta);
  grenade.vz = Number(grenade.vz || 0) - grenadeGravity * delta;

  if (grenade.z <= 0 && grenade.vz < 0) {
    grenade.z = 0;
    if (Math.abs(grenade.vz) > 68) {
      const firstGroundBounce = (grenade.groundBounces || 0) === 0;
      const bounceRetention = firstGroundBounce ? grenadeFirstGroundBounceRetention : grenadeGroundBounceRetention;
      const horizontalRetention = firstGroundBounce ? 0.9 : 0.78;
      grenade.vz *= -bounceRetention;
      grenade.vx *= horizontalRetention;
      grenade.vy *= horizontalRetention;
      grenade.groundBounces = (grenade.groundBounces || 0) + 1;
      bounced = true;
    } else {
      grenade.vz = 0;
    }
  }

  const minX = grenade.radius;
  const maxX = world.width - grenade.radius;
  const minY = grenade.radius;
  const maxY = world.height - grenade.radius;

  if (grenade.x < minX || grenade.x > maxX) {
    grenade.x = clamp(grenade.x, minX, maxX);
    grenade.vx *= -grenadeBounceRetention;
    bounced = true;
  }
  if (grenade.y < minY || grenade.y > maxY) {
    grenade.y = clamp(grenade.y, minY, maxY);
    grenade.vy *= -grenadeBounceRetention;
    bounced = true;
  }

  for (const crate of crates) {
    if (grenade.z > 28) {
      break;
    }
    if (!circleHitsBox(grenade, crate) && !segmentHitsBox(previousX, previousY, grenade.x, grenade.y, crate, grenade.radius)) {
      continue;
    }
    grenade.x = previousX;
    grenade.y = previousY;
    if (Math.abs(grenade.vx) >= Math.abs(grenade.vy)) {
      grenade.vx *= -grenadeBounceRetention;
      grenade.vy *= 0.8;
    } else {
      grenade.vx *= 0.8;
      grenade.vy *= -grenadeBounceRetention;
    }
    bounced = true;
    break;
  }

  const drag = Math.exp(-(grenade.z <= 0 ? grenadeRollDrag : 0.24) * delta);
  grenade.vx *= drag;
  grenade.vy *= drag;
  if (Math.hypot(grenade.vx, grenade.vy) < 14) {
    grenade.vx = 0;
    grenade.vy = 0;
  }
  grenade.rotation = (grenade.rotation || 0) + (grenade.vx + grenade.vy) * delta * 0.045;
  if (bounced) {
    grenade.rotation += 0.55;
  }
}

function detonateLocalBazooka(bullet) {
  const radius = bullet.explosionRadius || bazookaExplosionRadius;
  addBazookaExplosionEffect(bullet.x, bullet.y, radius);

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.max(0, Math.hypot(crate.x - bullet.x, crate.y - bullet.y) - getCrateHitboxSize(crate) / 2);
    if (distance <= radius) {
      damageCrate(index, getBazookaBlastDamage(bullet.damage, distance, radius));
    }
  }

  const playerDistance = Math.max(0, Math.hypot(player.x - bullet.x, player.y - bullet.y) - player.radius);
  if (playerDistance <= radius) {
    const damage = getBazookaBlastDamage(bullet.damage, playerDistance, radius);
    let knockbackX = player.x - bullet.x;
    let knockbackY = player.y - bullet.y;
    if (Math.hypot(knockbackX, knockbackY) <= 0) {
      knockbackX = -bullet.vx;
      knockbackY = -bullet.vy;
    }
    applyDamage(damage, localClientId, { vx: knockbackX, vy: knockbackY });
  }
}

function detonateLocalGrenade(grenade) {
  const radius = grenade.explosionRadius || grenadeExplosionRadius;
  addGrenadeExplosionEffect(grenade.x, grenade.y, radius);

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.max(0, Math.hypot(crate.x - grenade.x, crate.y - grenade.y) - getCrateHitboxSize(crate) / 2);
    if (distance <= radius) {
      damageCrate(index, getBazookaBlastDamage(grenade.damage, distance, radius));
    }
  }

  const distance = Math.max(0, Math.hypot(player.x - grenade.x, player.y - grenade.y) - player.radius);
  if (distance <= radius) {
    let directionX = player.x - grenade.x;
    let directionY = player.y - grenade.y;
    if (Math.hypot(directionX, directionY) <= 0) {
      directionX = 1;
      directionY = 0;
    }
    applyDamage(getBazookaBlastDamage(grenade.damage, distance, radius), localClientId, { vx: directionX, vy: directionY });
  }
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
    characterId: player.characterId || selectedCharacterId,
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
      bazooka: { ammo: weapons.bazooka.ammo, magAmmo: weapons.bazooka.magAmmo },
      grenade: { count: weapons.grenade.count },
      magicStaff: { count: weapons.magicStaff.count },
    },
    selectedWeapon: weapons.slots[weapons.selectedSlot],
    reloadTimer: Math.max(
      0,
      weapons.glock.reloadTimer || 0,
      weapons.awm.reloadTimer || 0,
      weapons.bazooka.reloadTimer || 0,
    ),
    aimAngle: getAimAngle(),
    swingTimer: player.swingTimer,
    swingDuration: weapons.slots[weapons.selectedSlot] === "magicStaff" ? 0.56 : weapons.knife.swingDuration,
    magicStaffCastTimer: player.magicStaffCastTimer,
    magicStaffCastDuration: player.magicStaffCastDuration,
    punchTimer: player.punchTimer,
    punchDuration: weapons.fist.swingDuration,
    dashActiveTimer: player.dashActiveTimer,
    dashVisualTimer: player.dashVisualTimer,
    knifeCharging: player.knifeCharging,
    knifeCharge: player.knifeCharge,
    grenadePinned: player.grenadePinned,
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

function screenToWorldX(x, y) {
  const offsetX = (x - width / 2) / camera.zoom;
  const offsetY = (y - height / 2) / camera.zoom;
  const rotation = -camera.rotation;
  return offsetX * Math.cos(rotation) - offsetY * Math.sin(rotation) + camera.x;
}

function screenToWorldY(x, y) {
  const offsetX = (x - width / 2) / camera.zoom;
  const offsetY = (y - height / 2) / camera.zoom;
  const rotation = -camera.rotation;
  return offsetX * Math.sin(rotation) + offsetY * Math.cos(rotation) + camera.y;
}

function getScreenAimAngle() {
  return Math.atan2(mouse.y - height / 2, mouse.x - width / 2);
}

function getAimAngle() {
  return getScreenAimAngle() - camera.rotation;
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
    const rotation = -camera.rotation;
    const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation);
    const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation);
    x = rotatedX;
    y = rotatedY;
  }

  return { x, y, active: length > 0 };
}

function getMouseWorld() {
  return {
    x: clamp(screenToWorldX(mouse.x, mouse.y), player.radius, world.width - player.radius),
    y: clamp(screenToWorldY(mouse.x, mouse.y), player.radius, world.height - player.radius),
  };
}

function startReload(weaponName = weapons.slots[weapons.selectedSlot]) {
  if (weaponName !== "glock" && weaponName !== "awm" && weaponName !== "bazooka") {
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

function getCurrentReloadTimer() {
  const selectedWeapon = weapons.slots[weapons.selectedSlot];
  return selectedWeapon && weapons[selectedWeapon]?.reloadTimer ? weapons[selectedWeapon].reloadTimer : 0;
}

function armGrenade() {
  const grenade = weapons.grenade;
  if (weapons.slots[weapons.selectedSlot] !== "grenade" || player.grenadePinned || grenade.count <= 0) {
    return false;
  }

  player.grenadePinned = true;
  player.grenadeFuseTimer = grenadeFuseSeconds;
  addGrenadePinEffect();
  playTone({ frequency: 880, duration: 0.04, type: "square", gain: 0.035 });
  playTone({ frequency: 520, duration: 0.07, type: "triangle", gain: 0.03, when: 0.04 });
  updateInventory();
  return true;
}

function throwGrenade({ dropAtFeet = false } = {}) {
  if (weapons.slots[weapons.selectedSlot] !== "grenade" || !player.grenadePinned) {
    player.grenadeCharging = false;
    player.grenadeCharge = 0;
    return false;
  }

  const grenade = weapons.grenade;
  const chargeRatio = dropAtFeet ? 0 : clamp(player.grenadeCharge / grenadeChargeMax, 0.08, 1);
  const angle = getAimAngle();
  const speed = dropAtFeet ? 0 : 100 + chargeRatio * grenade.bulletSpeed;
  const bullet = {
    id: `${localClientId || "local"}-${nextLocalBulletId++}`,
    ownerId: localClientId,
    x: player.x + Math.cos(angle) * (player.radius + 12),
    y: player.y + Math.sin(angle) * (player.radius + 12),
    vx: Math.cos(angle) * speed + player.vx * 0.15,
    vy: Math.sin(angle) * speed + player.vy * 0.15,
    z: dropAtFeet ? 0 : 12,
    vz: dropAtFeet ? 0 : 90 + chargeRatio * 190,
    radius: grenade.bulletRadius,
    life: Math.max(0, player.grenadeFuseTimer),
    damage: getScaledDamage(grenade.damage),
    weapon: "grenade",
    explosionRadius: grenade.explosionRadius,
    rotation: angle,
    groundBounces: 0,
    hitIds: [],
    hitCrateIds: [],
  };

  bullets.push(bullet);
  sendNetwork("shot", { bullet });
  grenade.count -= 1;
  if (grenade.count <= 0) {
    grenade.count = 0;
    const slot = [1, 2, 3].find((candidate) => weapons.slots[candidate] === "grenade");
    if (slot) {
      weapons.slots[slot] = null;
    }
  }
  player.grenadePinned = false;
  player.grenadeFuseTimer = 0;
  player.grenadeCharging = false;
  player.grenadeCharge = 0;
  player.shotTimer = grenade.fireRate;
  playNoise({ duration: 0.05, gain: 0.035, filterFrequency: 820 });
  updateInventory();
  return true;
}

function fireBullet() {
  const selectedWeapon = weapons.slots[weapons.selectedSlot];

  if (selectedWeapon !== "glock" && selectedWeapon !== "awm" && selectedWeapon !== "bazooka") {
    return false;
  }

  const isGlock = selectedWeapon === "glock";
  const isBazooka = selectedWeapon === "bazooka";
  const weapon = weapons[selectedWeapon];

  if (weapon.reloadTimer > 0) {
    return false;
  }

  if (weapon.magAmmo <= 0) {
    startReload(selectedWeapon);
    return false;
  }

  const angle = getAimAngle();
  const barrelLength = isBazooka ? player.radius + 44 : player.radius + 48;
  const glockMuzzle = isGlock ? getGlockMuzzleWorldPosition(player.x, player.y, angle) : null;
  const sniperMuzzle = selectedWeapon === "awm" ? getSniperMuzzleWorldPosition(player.x, player.y, angle) : null;
  const muzzle = glockMuzzle || sniperMuzzle;

  const bullet = {
    id: `${localClientId || "local"}-${nextLocalBulletId++}`,
    ownerId: localClientId,
    x: muzzle?.x ?? player.x + Math.cos(angle) * barrelLength,
    y: muzzle?.y ?? player.y + Math.sin(angle) * barrelLength,
    vx: Math.cos(angle) * weapon.bulletSpeed + player.vx * 0.18,
    vy: Math.sin(angle) * weapon.bulletSpeed + player.vy * 0.18,
    radius: weapon.bulletRadius,
    life: weapon.bulletLife,
    damage: getScaledDamage(weapon.damage),
    weapon: selectedWeapon,
    explosionRadius: isBazooka ? weapon.explosionRadius : undefined,
    hitIds: [],
    hitCrateIds: [],
  };

  bullets.push(bullet);
  sendNetwork("shot", { bullet });

  weapon.magAmmo -= 1;

  if (weapon.magAmmo <= 0 && weapon.ammo > 0) {
    startReload(selectedWeapon);
  }

  playGunSound(selectedWeapon);
  if (selectedWeapon === "glock" || selectedWeapon === "awm") {
    player.glockShotVisualTimer = glockShotVisualDuration;
  }
  return true;
}

function getGlockMuzzleWorldPosition(x, y, angle) {
  return getDirectionalFirearmMuzzleWorldPosition(x, y, angle, {
    right: { x: 36.5, y: -9 },
    downRight: { x: 21.1, y: 8.4 },
    down: { x: -1.5, y: 13 },
    downLeft: { x: -27.5, y: 2.6 },
    left: { x: -35.1, y: -15.9 },
    upLeft: { x: -21.4, y: -32.7 },
    up: { x: 5.3, y: -37.1 },
    upRight: { x: 29.4, y: -27.8 },
  });
}

function getSniperMuzzleWorldPosition(x, y, angle) {
  return getDirectionalFirearmMuzzleWorldPosition(x, y, angle, {
    right: { x: 36, y: -8 },
    downRight: { x: 23, y: 8 },
    down: { x: -3, y: 13 },
    downLeft: { x: -27, y: 3 },
    left: { x: -34, y: -14 },
    upLeft: { x: -21, y: -32 },
    up: { x: 5, y: -37 },
    upRight: { x: 29, y: -28 },
  });
}

function getDirectionalFirearmMuzzleWorldPosition(x, y, angle, offsets) {
  const direction = getModernCharacterDirection(Math.cos(angle), Math.sin(angle));
  const frameScale = 208 / 128;
  const offset = offsets[direction] || offsets.right;
  return {
    x: x + offset.x * frameScale,
    y: y + offset.y * frameScale - 13,
  };
}

function addMuzzleFlashEffect(x, y, angle) {
  muzzleFlashEffects.push({
    x,
    y,
    angle,
    startedAt: performance.now(),
    duration: 115,
  });
}

function drawFlipbookEffect({ sprite, columns, rows, frame, width, height }) {
  const sourceWidth = sprite.naturalWidth || sprite.width;
  const sourceHeight = sprite.naturalHeight || sprite.height;
  if ((sprite.complete === false) || !sourceWidth || !sourceHeight) {
    return;
  }

  const frameWidth = sourceWidth / columns;
  const frameHeight = sourceHeight / rows;
  const column = frame % columns;
  const row = Math.floor(frame / columns);
  ctx.drawImage(
    sprite,
    column * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight,
    -width / 2,
    -height / 2,
    width,
    height,
  );
}

function drawLoopingWorldFlipbookEffect({
  sprite,
  columns,
  rows,
  x,
  y,
  size,
  now = performance.now(),
  frameRate = 16,
  alpha = 1,
  blend = "lighter",
}) {
  const frameCount = columns * rows;
  ctx.save();
  ctx.translate(worldToScreenX(x), worldToScreenY(y));
  ctx.scale(getWorldRenderScale(), getWorldRenderScale());
  ctx.globalCompositeOperation = blend;
  ctx.globalAlpha = alpha;
  drawFlipbookEffect({
    sprite,
    columns,
    rows,
    frame: Math.floor(now / 1000 * frameRate) % frameCount,
    width: size,
    height: size,
  });
  ctx.restore();
}

// Purchased VFX overlay V1 rollback reference. These sheet sizes were the first pass.
// They are kept here so the previous look can be restored without reconstructing it.
const skillVfxOverlayDefinitionsV1 = {
  teleport: { sprite: skillVfxSprites.teleport, columns: 2, rows: 1 },
  lightning: { sprite: skillVfxSprites.lightning, columns: 2, rows: 1 },
  magicImpact: { sprite: skillVfxSprites.magicImpact, columns: 4, rows: 1 },
  lightningImpact: { sprite: skillVfxSprites.lightningImpact, columns: 2, rows: 1 },
  burstImpact: { sprite: skillVfxSprites.burstImpact, columns: 2, rows: 1 },
};

const skillVfxOverlayDefinitions = {
  teleport: { sprite: skillVfxSprites.teleport, columns: 4, rows: 2 },
  vanish: { sprite: skillVfxSprites.vanish, columns: 8, rows: 1 },
  bloodCloud: { sprite: skillVfxSprites.bloodCloud, columns: 3, rows: 4 },
  staticCollapseCharge: { sprite: skillVfxSprites.staticCollapseCharge, columns: 3, rows: 4 },
  staticCollapseBurst: { sprite: skillVfxSprites.staticCollapseBurst, columns: 3, rows: 3 },
  lightningThrustAura: { sprite: skillVfxSprites.lightningThrustAura, columns: 3, rows: 4 },
  lightningThrustScatter06: { sprite: skillVfxSprites.lightningThrustScatter06, columns: 3, rows: 4 },
  lightningThrustScatter08: { sprite: skillVfxSprites.lightningThrustScatter08, columns: 3, rows: 3 },
  toxicOrb: { sprite: skillVfxSprites.toxicOrb, columns: 10, rows: 10, frameCount: 91 },
  // Lightning Thrust rollback reference:
  // lightningThrustTrail: { sprite: skillVfxSprites.lightningThrustTrail, columns: 3, rows: 3 },
  // lightningThrustScatter07: { sprite: skillVfxSprites.lightningThrustScatter07, columns: 3, rows: 4 },
  lightning: { sprite: skillVfxSprites.lightning, columns: 4, rows: 2 },
  magicImpact: { sprite: skillVfxSprites.magicImpact, columns: 8, rows: 2 },
  lightningImpact: { sprite: skillVfxSprites.lightningImpact, columns: 4, rows: 2 },
  burstImpact: { sprite: skillVfxSprites.burstImpact, columns: 4, rows: 2 },
  swordSlash: { sprite: skillVfxSprites.swordSlash, columns: 4, rows: 2 },
  poisonSlash: { sprite: skillVfxSprites.poisonSlash, columns: 3, rows: 4 },
  impactSparks: { sprite: skillVfxSprites.impactSparks, columns: 4, rows: 2 },
  wizardBossSpawnPoisonExplosion02: { sprite: skillVfxSprites.wizardBossSpawnPoisonExplosion02, columns: 4, rows: 4 },
  // Previous wizard spawn VFX kept for rollback:
  // wizardBossSpawnFireBurstSmokeBig01: { sprite: skillVfxSprites.wizardBossSpawnFireBurstSmokeBig01, columns: 4, rows: 5 },
};

function addSkillVfxOverlay(kind, x, y, {
  duration = 320,
  delay = 0,
  size = 160,
  startSize = size,
  endSize = size,
  widthScale = 1,
  heightScale = 1,
  angle = 0,
  alpha = 1,
  blend = "lighter",
  tint = null,
  loop = false,
  frameRate = 18,
} = {}) {
  if (!skillVfxOverlayDefinitions[kind]) {
    return;
  }

  skillVfxOverlays.push({
    kind,
    x,
    y,
    angle,
    startSize,
    endSize,
    widthScale,
    heightScale,
    alpha,
    blend,
    tint,
    loop,
    frameRate,
    startedAt: performance.now() + delay,
    duration,
  });
}

function drawSkillVfxOverlays() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let index = skillVfxOverlays.length - 1; index >= 0; index -= 1) {
    const effect = skillVfxOverlays[index];
    const definition = skillVfxOverlayDefinitions[effect.kind];
    const progress = (now - effect.startedAt) / effect.duration;
    if (!definition || progress >= 1) {
      skillVfxOverlays.splice(index, 1);
      continue;
    }
    if (progress < 0) {
      continue;
    }

    const frameCount = definition.frameCount || definition.columns * definition.rows;
    const easedProgress = 1 - (1 - progress) ** 3;
    const size = effect.startSize + (effect.endSize - effect.startSize) * easedProgress;
    ctx.save();
    ctx.translate(worldToScreenX(effect.x), worldToScreenY(effect.y));
    ctx.rotate(effect.angle);
    ctx.scale(renderScale, renderScale);
    ctx.globalCompositeOperation = effect.blend;
    ctx.globalAlpha = effect.alpha * Math.min(1, (1 - progress) * 2.2);

    const sprite = effect.tint
      ? getTintedSprite(definition.sprite, effect.tint) || definition.sprite
      : definition.sprite;
    drawFlipbookEffect({
      sprite,
      columns: definition.columns,
      rows: definition.rows,
      frame: effect.loop
        ? Math.floor((now - effect.startedAt) / 1000 * effect.frameRate) % frameCount
        : Math.min(frameCount - 1, Math.floor(progress * frameCount)),
      width: size * (effect.widthScale || 1),
      height: size * (effect.heightScale || 1),
    });
    ctx.restore();
  }
}

function addWizardPoisonSlashEffect(effect) {
  wizardPoisonSlashEffects.push({
    x: effect.x,
    y: effect.y,
    angle: effect.angle || 0,
    size: effect.size || 320,
    startedAt: performance.now(),
    duration: 620,
    droplets: Array.from({ length: 9 }, (_, index) => ({
      angle: -0.95 + index * 0.24 + (Math.random() - 0.5) * 0.16,
      distance: 28 + Math.random() * 94,
      size: 4 + Math.random() * 7,
      side: (Math.random() - 0.5) * 34,
    })),
  });
}

function drawWizardPoisonSlashEffects() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let index = wizardPoisonSlashEffects.length - 1; index >= 0; index -= 1) {
    const effect = wizardPoisonSlashEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    if (progress >= 1) {
      wizardPoisonSlashEffects.splice(index, 1);
      continue;
    }

    const eased = 1 - (1 - progress) ** 3;
    const fade = 1 - progress;
    const size = effect.size * (0.86 + eased * 0.18);

    ctx.save();
    ctx.translate(worldToScreenX(effect.x), worldToScreenY(effect.y));
    ctx.rotate(effect.angle);
    ctx.scale(renderScale, renderScale);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    ctx.strokeStyle = `rgba(47, 137, 22, ${0.42 * fade})`;
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.arc(16, 0, size * 0.42, -1.04, 1.04);
    ctx.stroke();

    ctx.strokeStyle = `rgba(130, 255, 38, ${0.86 * fade})`;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(20, 0, size * 0.39, -0.96, 0.96);
    ctx.stroke();

    ctx.strokeStyle = `rgba(236, 255, 118, ${0.92 * fade})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(24, 0, size * 0.34, -0.82, 0.82);
    ctx.stroke();

    ctx.fillStyle = `rgba(125, 255, 42, ${0.72 * fade})`;
    for (const droplet of effect.droplets) {
      const distance = droplet.distance * (0.42 + eased * 0.86);
      const dx = Math.cos(droplet.angle) * distance;
      const dy = Math.sin(droplet.angle) * distance + droplet.side;
      ctx.beginPath();
      ctx.arc(size * 0.22 + dx, dy, droplet.size * fade, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawMuzzleFlashEffects() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let index = muzzleFlashEffects.length - 1; index >= 0; index -= 1) {
    const effect = muzzleFlashEffects[index];
    const progress = (now - effect.startedAt) / effect.duration;
    if (progress >= 1) {
      muzzleFlashEffects.splice(index, 1);
      continue;
    }

    ctx.save();
    ctx.translate(worldToScreenX(effect.x), worldToScreenY(effect.y));
    ctx.rotate(effect.angle + Math.PI / 2);
    ctx.scale(renderScale, renderScale);
    ctx.globalAlpha = Math.min(1, (1 - progress) * 1.8);
    drawFlipbookEffect({
      sprite: glockMuzzleFlashSprite,
      columns: 3,
      rows: 3,
      frame: Math.min(8, Math.floor(progress * 9)),
      width: 72,
      height: 72,
    });
    ctx.restore();
  }
}

function addDashDustEffect(x, y, angle) {
  dashDustEffects.push({
    x: x - Math.cos(angle) * 28,
    y: y - Math.sin(angle) * 28,
    angle,
    startedAt: performance.now(),
    duration: 360,
  });
}

function drawDashDustEffects() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let index = dashDustEffects.length - 1; index >= 0; index -= 1) {
    const effect = dashDustEffects[index];
    const progress = (now - effect.startedAt) / effect.duration;
    if (progress >= 1) {
      dashDustEffects.splice(index, 1);
      continue;
    }

    ctx.save();
    ctx.translate(worldToScreenX(effect.x), worldToScreenY(effect.y));
    ctx.rotate(effect.angle + Math.PI);
    ctx.scale(renderScale, renderScale);
    ctx.globalAlpha = Math.min(0.86, (1 - progress) * 1.35);
    drawFlipbookEffect({
      sprite: dashDustSprite,
      columns: 4,
      rows: 4,
      frame: Math.min(15, Math.floor(progress * 16)),
      width: 116,
      height: 116,
    });
    ctx.restore();
  }
}

function addWalkingDustEffect(x, y, angle, footSide = 0) {
  walkingDustEffects.push({
    x: x - Math.cos(angle) * 8 + Math.cos(angle + Math.PI / 2) * footSide,
    y: y - Math.sin(angle) * 4 + 30 + Math.sin(angle + Math.PI / 2) * footSide,
    angle,
    startedAt: performance.now(),
    duration: 330,
  });
}

function addWalkingDustOnFootfall(character, x, y, angle, speed, {
  dashing = false,
  thrusting = false,
} = {}) {
  if (speed <= 80 || dashing || thrusting) {
    return;
  }

  const runFrameDuration = 92;
  const runFrameCount = 15;
  const now = performance.now();
  const runFrame = Math.floor(now / runFrameDuration) % runFrameCount;
  if (runFrame !== 1 && runFrame !== 8) {
    return;
  }

  const footfall = Math.floor(now / (runFrameDuration * runFrameCount)) * runFrameCount + runFrame;
  if (character.walkDustStep === footfall) {
    return;
  }

  character.walkDustStep = footfall;
  addWalkingDustEffect(x, y, angle, runFrame === 1 ? -4 : 4);
}

function drawWalkingDustEffects() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let index = walkingDustEffects.length - 1; index >= 0; index -= 1) {
    const effect = walkingDustEffects[index];
    const progress = (now - effect.startedAt) / effect.duration;
    if (progress >= 1) {
      walkingDustEffects.splice(index, 1);
      continue;
    }

    ctx.save();
    ctx.translate(worldToScreenX(effect.x), worldToScreenY(effect.y));
    ctx.rotate(effect.angle + Math.PI);
    ctx.scale(renderScale, renderScale);
    ctx.globalAlpha = Math.min(0.5, (1 - progress) * 1.1);
    drawFlipbookEffect({
      sprite: walkingDustSprite,
      columns: 4,
      rows: 5,
      frame: Math.min(19, Math.floor(progress * 20)),
      width: 36,
      height: 36,
    });
    ctx.restore();
  }
}

function addBloodDropEffect(x, y) {
  const particles = Array.from({ length: 18 + Math.floor(Math.random() * 7) }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 54 + Math.random() * 126;
    return {
      angle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 42 - Math.random() * 52,
      size: 13 + Math.random() * 14,
      duration: 420 + Math.random() * 300,
      frameOffset: Math.floor(Math.random() * 4),
    };
  });

  bloodDropEffects.push({
    x,
    y: y - 4,
    particles,
    startedAt: performance.now(),
    duration: 740,
  });
}

function drawBloodDropEffects() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let effectIndex = bloodDropEffects.length - 1; effectIndex >= 0; effectIndex -= 1) {
    const effect = bloodDropEffects[effectIndex];
    const elapsed = (now - effect.startedAt) / 1000;
    if (now - effect.startedAt >= effect.duration) {
      bloodDropEffects.splice(effectIndex, 1);
      continue;
    }

    for (const particle of effect.particles) {
      const progress = elapsed / (particle.duration / 1000);
      if (progress >= 1) {
        continue;
      }

      const x = effect.x + particle.vx * elapsed;
      const y = effect.y + particle.vy * elapsed + 250 * elapsed * elapsed;
      const frame = (particle.frameOffset + Math.floor(progress * 4)) % 4;
      ctx.save();
      ctx.translate(worldToScreenX(x), worldToScreenY(y));
      ctx.rotate(particle.angle + progress * 1.4);
      ctx.scale(renderScale, renderScale);
      ctx.globalAlpha = Math.min(0.92, (1 - progress) * 1.8);
      drawFlipbookEffect({
        sprite: bloodDropsSprite,
        columns: 2,
        rows: 2,
        frame,
        width: particle.size,
        height: particle.size,
      });
      ctx.restore();
    }
  }
}

function swingKnife() {
  if (weapons.slots[weapons.selectedSlot] !== "knife") {
    return false;
  }

  const knife = weapons.knife;
  const angle = getAimAngle();
  player.swingTimer = knifeAttackVisualDuration;
  player.pendingKnifeAttack = {
    delay: knifeAttackImpactDelay,
    x: player.x,
    y: player.y,
    angle,
    range: knife.range,
    arc: knife.arc,
    damage: getScaledDamage(knife.damage),
    swingDuration: knife.swingDuration,
  };
  return true;
}

function resolvePendingKnifeAttack() {
  const attack = player.pendingKnifeAttack;
  if (!attack) {
    return;
  }

  player.pendingKnifeAttack = null;
  sendNetwork("melee", { attack });

  if (attack.weapon === "magicStaff") {
    addPoisonSlashVfx({
      x: attack.x + Math.cos(attack.angle || 0) * 104,
      y: attack.y + Math.sin(attack.angle || 0) * 104,
      angle: attack.angle || 0,
      size: attack.size || weapons.magicStaff.slashSize,
    });
    playMagicStaffSlashSound();
  }

  if (!sharedWorldActive) {
    for (let index = crates.length - 1; index >= 0; index -= 1) {
      const crate = crates[index];
      const distance = Math.hypot(crate.x - attack.x, crate.y - attack.y);

      if (distance > attack.range + getCrateHitboxSize(crate) / 2) {
        continue;
      }

      const targetAngle = Math.atan2(crate.y - attack.y, crate.x - attack.x);
      const angleDiff = Math.atan2(Math.sin(targetAngle - attack.angle), Math.cos(targetAngle - attack.angle));

      if (Math.abs(angleDiff) <= attack.arc / 2) {
        damageCrate(index, attack.damage);
      }
    }
  }

  if (attack.weapon === "magicStaff") {
    return;
  }

  playSwordSwing();
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

function swingMagicStaff() {
  if (weapons.slots[weapons.selectedSlot] !== "magicStaff") {
    return false;
  }

  const staff = weapons.magicStaff;
  const angle = getAimAngle();
  const attack = {
    x: player.x,
    y: player.y,
    angle,
    range: staff.slashRange,
    arc: staff.slashArc,
    damage: getScaledDamage(staff.slashDamage),
    swingDuration: magicStaffSlashDuration,
    weapon: "magicStaff",
    size: staff.slashSize,
  };

  player.swingTimer = attack.swingDuration;
  player.swingDuration = attack.swingDuration;
  player.pendingKnifeAttack = {
    ...attack,
    delay: magicStaffSlashImpactDelay,
  };
  return true;
}

function fireMagicStaffProjectile() {
  if (weapons.slots[weapons.selectedSlot] !== "magicStaff" || player.shotTimer > 0) {
    return false;
  }

  const staff = weapons.magicStaff;
  const angle = getAimAngle();
  const spawnDistance = player.radius + 34;
  const target = getMagicStaffMouseTarget();
  const bullet = {
    id: `${localClientId || "local"}-${nextLocalBulletId++}`,
    ownerId: localClientId,
    x: player.x + Math.cos(angle) * spawnDistance,
    y: player.y + Math.sin(angle) * spawnDistance,
    vx: Math.cos(angle) * staff.projectileSpeed + player.vx * 0.12,
    vy: Math.sin(angle) * staff.projectileSpeed + player.vy * 0.12,
    radius: staff.projectileRadius,
    life: staff.projectileLife,
    damage: getScaledDamage(staff.projectileDamage),
    angle,
    weapon: "magicStaff",
    followMouse: true,
    speed: staff.projectileSpeed,
    turnRate: staff.projectileTurnRate,
    targetX: target.x,
    targetY: target.y,
    hitIds: [],
    hitCrateIds: [],
  };

  bullets.push(bullet);
  sendNetwork("shot", { bullet });
  playMagicStaffProjectileSound();
  player.swingTimer = 0;
  player.magicStaffCastTimer = staff.castDuration;
  player.magicStaffCastDuration = staff.castDuration;
  player.shotTimer = staff.fireRate;
  sendNetwork("state", { state: getPlayerSnapshot() });
  return true;
}

function getMagicStaffMouseTarget() {
  return {
    x: clamp(screenToWorldX(mouse.x, mouse.y), player.radius, world.width - player.radius),
    y: clamp(screenToWorldY(mouse.x, mouse.y), player.radius, world.height - player.radius),
  };
}

function pushMagicStaffTrailPoint(bullet, x, y) {
  bullet.trail = bullet.trail || [];
  const last = bullet.trail[bullet.trail.length - 1];
  if (!last || Math.hypot(last.x - x, last.y - y) > 5) {
    bullet.trail.push({ x, y, age: 0 });
  }
  for (const point of bullet.trail) {
    point.age += 1;
  }
  while (bullet.trail.length > 16) {
    bullet.trail.shift();
  }
}

function steerMagicStaffProjectile(bullet, delta, { localFollow = false } = {}) {
  if (bullet.weapon !== "magicStaff" || !bullet.followMouse) {
    return;
  }

  if (localFollow) {
    const target = getMagicStaffMouseTarget();
    bullet.targetX = target.x;
    bullet.targetY = target.y;

    const now = performance.now();
    if (sharedWorldActive && (!bullet.nextAimSyncAt || now >= bullet.nextAimSyncAt)) {
      sendNetwork("magicStaffAim", {
        bulletId: bullet.id,
        targetX: bullet.targetX,
        targetY: bullet.targetY,
      });
      bullet.nextAimSyncAt = now + 55;
    }
  }

  const targetX = Number(bullet.targetX);
  const targetY = Number(bullet.targetY);
  if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
    return;
  }

  const desiredAngle = Math.atan2(targetY - bullet.y, targetX - bullet.x);
  const currentAngle = Math.atan2(bullet.vy || 0, bullet.vx || 0);
  const turnRate = Number(bullet.turnRate || weapons.magicStaff.projectileTurnRate);
  const angleDiff = Math.atan2(Math.sin(desiredAngle - currentAngle), Math.cos(desiredAngle - currentAngle));
  const nextAngle = currentAngle + clamp(angleDiff, -turnRate * delta, turnRate * delta);
  const speed = Number(bullet.speed || Math.hypot(bullet.vx || 0, bullet.vy || 0) || weapons.magicStaff.projectileSpeed);

  bullet.vx = Math.cos(nextAngle) * speed;
  bullet.vy = Math.sin(nextAngle) * speed;
  bullet.angle = nextAngle;
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

function getThrownKnifePickup(bullet) {
  return {
    ...(bullet.pickup || { type: "knife", count: 1 }),
    embedded: true,
    angle: bullet.angle ?? Math.atan2(bullet.vy, bullet.vx),
  };
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

  addDashDustEffect(player.x, player.y, Math.atan2(dashY, dashX));
  player.vx = dashX * player.dashSpeed;
  player.vy = dashY * player.dashSpeed;
  player.dashActiveTimer = player.dashDuration;
  player.dashVisualTimer = dashRollVisualDuration;
  player.dashTimer = player.testMode ? 0 : player.dashCooldown;
}

function update(delta) {
  if (deathPending) {
    camera.x += (player.x - camera.x) * camera.smoothing;
    camera.y += (player.y - camera.y) * camera.smoothing;
    camera.rotation = player.dizzyCameraEnabled ? -getScreenAimAngle() : 0;
    updateCameraZoom(delta);
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
  player.dashVisualTimer = Math.max(0, player.dashVisualTimer - delta);
  player.lightningThrustActiveTimer = Math.max(0, player.lightningThrustActiveTimer - delta);
  player.knockbackTimer = Math.max(0, (player.knockbackTimer || 0) - delta);
  player.knockbackMomentumTimer = Math.max(0, (player.knockbackMomentumTimer || 0) - delta);
  player.arcSlowTimer = Math.max(0, (player.arcSlowTimer || 0) - delta);
  if (player.arcSlowTimer <= 0) {
    player.arcSlowStrength = 1;
  }
  shopToastTimer = Math.max(0, shopToastTimer - delta);

  if (player.dashActiveTimer <= 0 && player.lightningThrustActiveTimer <= 0 && player.knockbackMomentumTimer <= 0) {
    const drag = Math.exp(-player.friction * delta);
    player.vx *= drag;
    player.vy *= drag;
  }

  const nextSpeed = Math.hypot(player.vx, player.vy);
  const slowMultiplier = player.arcSlowTimer > 0 ? player.arcSlowStrength || 0.34 : 1;
  const aimMultiplier = isAwmAiming() ? awmAimMoveMultiplier : 1;
  const weaponMultiplier = weapons.slots[weapons.selectedSlot] === "bazooka" ? bazookaMoveMultiplier : 1;
  const effectiveMaxSpeed = player.maxSpeed * Math.min(slowMultiplier, aimMultiplier, weaponMultiplier);
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

  const walkingSpeed = Math.hypot(player.vx, player.vy);
  addWalkingDustOnFootfall(player, player.x, player.y, Math.atan2(player.vy, player.vx), walkingSpeed, {
    dashing: player.dashActiveTimer > 0,
    thrusting: player.lightningThrustActiveTimer > 0,
  });

  player.shotTimer -= delta;
  player.glockShotVisualTimer = Math.max(0, player.glockShotVisualTimer - delta);
  player.magicStaffCastTimer = Math.max(0, player.magicStaffCastTimer - delta);
  player.swingTimer = Math.max(0, player.swingTimer - delta);
  if (player.pendingKnifeAttack) {
    player.pendingKnifeAttack.delay -= delta;
    if (player.pendingKnifeAttack.delay <= 0) {
      resolvePendingKnifeAttack();
    }
  }
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
    weapons.knife.count = Math.max(weapons.knife.count, 1000);
    for (const weaponName of ["glock", "awm", "bazooka"]) {
      weapons[weaponName].ammo = 1000;
      weapons[weaponName].magAmmo = weapons[weaponName].magazineSize;
      weapons[weaponName].reloadTimer = 0;
    }
    weapons.grenade.count = 1000;
    weapons.grenade.ammo = 0;
    weapons.grenade.magAmmo = 0;
    weapons.grenade.reloadTimer = 0;
    weapons.magicStaff.count = Math.max(weapons.magicStaff.count, 1);
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
      if (!sharedWorldActive || projectile.ownerId === localClientId) {
        addStaticCollapseBurstEffect(projectile.endX, projectile.endY);
      }
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
  if (player.grenadePinned) {
    player.grenadeFuseTimer = Math.max(0, player.grenadeFuseTimer - delta);
    if (player.grenadeFuseTimer <= 0) {
      throwGrenade({ dropAtFeet: true });
    }
  }
  if (player.grenadeCharging && weapons.slots[weapons.selectedSlot] === "grenade") {
    player.grenadeCharge = Math.min(grenadeChargeMax, player.grenadeCharge + delta);
  }
  player.dashTimer = Math.max(0, player.dashTimer - delta);

  for (const weaponName of ["glock", "awm", "bazooka"]) {
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
    } else if (weapons.slots[weapons.selectedSlot] === "magicStaff" && swingMagicStaff()) {
      player.shotTimer = weapons.magicStaff.fireRate;
    } else if (!weapons.slots[weapons.selectedSlot] && punch()) {
      player.shotTimer = weapons.fist.fireRate;
    } else if (fireBullet()) {
      player.shotTimer = weapons[weapons.slots[weapons.selectedSlot]].fireRate;
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
    steerMagicStaffProjectile(bullet, delta, { localFollow: bullet.weapon === "magicStaff" });
    if (bullet.weapon === "magicStaff") {
      pushMagicStaffTrailPoint(bullet, previousX, previousY);
    }
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    if (bullet.weapon === "bazooka") {
      bullet.smokeTimer = (bullet.smokeTimer || 0) - delta;
      if (bullet.smokeTimer <= 0) {
        addBazookaSmoke(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018);
        bullet.smokeTimer = 0.045;
      }

      const hitCrate = crates.some((crate) => (
        circleHitsBox(bullet, crate) || segmentHitsBox(previousX, previousY, bullet.x, bullet.y, crate, bullet.radius)
      ));
      const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

      if (!sharedWorldActive && (hitCrate || expired)) {
        detonateLocalBazooka(bullet);
        bullets.splice(index, 1);
      } else if (sharedWorldActive && expired) {
        bullets.splice(index, 1);
      }
      continue;
    }

    if (bullet.weapon === "grenade") {
      resolveGrenadeMotion(bullet, previousX, previousY, delta);
      if (bullet.life <= 0) {
        if (!sharedWorldActive) {
          detonateLocalGrenade(bullet);
        }
        bullets.splice(index, 1);
      }
      continue;
    }

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
      dropPickupAt(knifeDropPoint?.x ?? bullet.x, knifeDropPoint?.y ?? bullet.y, getThrownKnifePickup(bullet));
    }

    if (bullet.weapon === "knife" && bulletSpent && knifeDropPoint && sharedWorldActive) {
      spawnPickup(knifeDropPoint.x, knifeDropPoint.y, "knife", {
        count: 1,
        embedded: true,
        angle: bullet.angle ?? Math.atan2(bullet.vy, bullet.vx),
        predicted: true,
        expiresAt: Date.now() + 900,
      });
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
    steerMagicStaffProjectile(bullet, delta);
    if (bullet.weapon === "magicStaff") {
      pushMagicStaffTrailPoint(bullet, previousX, previousY);
    }
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    if (bullet.weapon === "bazooka") {
      bullet.smokeTimer = (bullet.smokeTimer || 0) - delta;
      if (bullet.smokeTimer <= 0) {
        addBazookaSmoke(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018);
        bullet.smokeTimer = 0.045;
      }
      const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;
      if (expired) {
        remoteBullets.splice(index, 1);
      }
      continue;
    }

    if (bullet.weapon === "grenade") {
      resolveGrenadeMotion(bullet, previousX, previousY, delta);
      if (bullet.life <= 0) {
        remoteBullets.splice(index, 1);
      }
      continue;
    }

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
            dropPickupAt(bullet.x, bullet.y, getThrownKnifePickup(bullet));
          }
          bulletSpent = true;
        }
      } else if (bullet.damage <= 0 || absorbed <= 0) {
        bulletSpent = true;
      }
    }

    if (expired && bullet.weapon === "knife" && !sharedWorldActive) {
          dropPickupAt(bullet.x, bullet.y, getThrownKnifePickup(bullet));
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
  camera.rotation = player.dizzyCameraEnabled ? -getScreenAimAngle() : 0;
  updateCameraZoom(delta);

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
  if (player.grenadePinned && weapons.slots[weapons.selectedSlot] === "grenade" && slot !== weapons.selectedSlot) {
    return;
  }

  weapons.selectedSlot = slot;
  player.knifeCharging = false;
  player.knifeCharge = 0;
  player.grenadeCharging = false;
  player.grenadeCharge = 0;
  updateInventory();
}

function selectTestModeWeapon(index) {
  const weaponName = testModeWeaponOrder[index - 1];
  if (!player.testMode || !weaponName) {
    return false;
  }

  const slot = index <= 3 ? index : 3;
  weapons.slots[slot] = weaponName;
  weapons.selectedSlot = slot;
  player.knifeCharging = false;
  player.knifeCharge = 0;
  player.grenadeCharging = false;
  player.grenadeCharge = 0;
  updateInventory();
  return true;
}

function getWeaponDisplay(weaponName) {
  if (weaponName === "knife") {
    return {
      label: "Knife",
      icon: `<canvas class="weapon-icon knife-icon" data-knife-icon width="82" height="48" aria-hidden="true"></canvas>`,
      meta: `x${weapons.knife.count}`,
    };
  }

  if (weaponName === "glock") {
    const meta =
      weapons.glock.reloadTimer > 0
        ? `Reload ${weapons.glock.reloadTimer.toFixed(1)}s`
        : `${weapons.glock.magAmmo} / ${weapons.glock.ammo}`;

    return {
      label: "pistol",
      icon: `<canvas class="weapon-icon glock-icon" data-glock-icon width="76" height="52" aria-hidden="true"></canvas>`,
      meta,
    };
  }

  if (weaponName === "awm") {
    const meta =
      weapons.awm.reloadTimer > 0
        ? `Reload ${weapons.awm.reloadTimer.toFixed(1)}s`
        : `${weapons.awm.magAmmo} / ${weapons.awm.ammo}`;

    return {
      label: "sniper",
      icon: `<span class="weapon-icon awm-icon">
        <span class="awm-scope"></span>
        <span class="awm-barrel"></span>
        <span class="awm-body"></span>
        <span class="awm-stock"></span>
      </span>`,
      meta,
    };
  }

  if (weaponName === "bazooka") {
    const meta =
      weapons.bazooka.reloadTimer > 0
        ? `Reload ${weapons.bazooka.reloadTimer.toFixed(1)}s`
        : `${weapons.bazooka.magAmmo} / ${weapons.bazooka.ammo}`;

    return {
      label: "Bazooka",
      icon: `<canvas class="weapon-icon bazooka-icon" data-bazooka-icon width="94" height="50" aria-hidden="true"></canvas>`,
      meta,
    };
  }

  if (weaponName === "grenade") {
    const meta =
      player.grenadePinned
        ? `Fuse ${player.grenadeFuseTimer.toFixed(1)}s`
        : `x${weapons.grenade.count}`;

    return {
      label: "Grenade",
      icon: `<span class="weapon-icon grenade-icon">
        <span class="grenade-body"></span>
        <span class="grenade-pin"></span>
      </span>`,
      meta,
    };
  }

  if (weaponName === "magicStaff") {
    return {
      label: magicStaffPickupLabel,
      icon: `<span class="weapon-icon magic-staff-icon"><img src="${assetConfig.items.magicStaffPickup}" alt="" /></span>`,
      meta: `CD ${formatNumber(weapons.magicStaff.fireRate, 2)}s`,
    };
  }

  return {
    label: "Empty",
    icon: `<span class="empty-mark"></span>`,
    meta: "",
  };
}

function formatNumber(value, digits = 0) {
  return Number.isFinite(value) ? Number(value).toFixed(digits).replace(/\.0+$/, "") : "-";
}

function getWeaponTooltipData(weaponName) {
  if (weaponName === "magicStaff") {
    return {
      title: magicStaffPickupLabel,
      description: "좌클릭으로 보스와 같은 독 근접 베기를 사용하고, 우클릭으로 마우스를 따라가는 마법 탄환을 발사합니다.",
      stats: {
        "근접 데미지": getScaledDamage(weapons.magicStaff.slashDamage),
        "근접 사거리": `${formatNumber(weapons.magicStaff.slashRange)}px`,
        "원거리 데미지": getScaledDamage(weapons.magicStaff.projectileDamage),
        "원거리 사거리": `${formatNumber(weapons.magicStaff.projectileSpeed * weapons.magicStaff.projectileLife)}px`,
        "쿨타임": `${formatNumber(weapons.magicStaff.fireRate, 2)}초`,
      },
    };
  }

  if (!weaponName) {
    return {
      title: "Empty Slot",
      description: "무기를 주우거나 상점에서 구매하면 이 슬롯에 장착됩니다.",
      stats: { 사용법: "1/2/3으로 슬롯 선택" },
    };
  }

  if (weaponName === "knife") {
    return {
      title: "Knife",
      description: "왼쪽 클릭으로 베고, 오른쪽 클릭을 길게 눌러 차지 후 던집니다. F 스킬은 던진 칼과 위치를 바꿉니다.",
      stats: {
        데미지: getScaledDamage(weapons.knife.damage),
        사거리: `${formatNumber(weapons.knife.range)} melee`,
        공격속도: `${formatNumber(weapons.knife.fireRate, 2)}초`,
        보유수: `x${weapons.knife.count}`,
      },
    };
  }

  if (weaponName === "glock") {
    return {
      title: "pistol",
      description: "왼쪽 클릭으로 발사합니다. 탄창이 비면 R로 장전합니다.",
      stats: {
        데미지: getScaledDamage(weapons.glock.damage),
        사거리: `${formatNumber(weapons.glock.bulletSpeed * weapons.glock.bulletLife)}px`,
        발사속도: `${formatNumber(weapons.glock.fireRate, 2)}초`,
        장전시간: `${formatNumber(weapons.glock.reloadTime, 1)}초`,
        탄약: `${weapons.glock.magAmmo}/${weapons.glock.ammo}`,
      },
    };
  }

  if (weaponName === "awm") {
    return {
      title: "sniper",
      description: "오른쪽 클릭으로 조준하고 왼쪽 클릭으로 강한 탄을 발사합니다. R로 장전합니다.",
      stats: {
        데미지: getScaledDamage(weapons.awm.damage),
        사거리: `${formatNumber(weapons.awm.bulletSpeed * weapons.awm.bulletLife)}px`,
        발사속도: `${formatNumber(weapons.awm.fireRate, 2)}초`,
        장전시간: `${formatNumber(weapons.awm.reloadTime, 1)}초`,
        탄약: `${weapons.awm.magAmmo}/${weapons.awm.ammo}`,
      },
    };
  }

  if (weaponName === "bazooka") {
    return {
      title: "Bazooka",
      description: "왼쪽 클릭으로 로켓을 발사합니다. 폭발 범위 안에 광역 피해가 들어가고 R로 장전합니다.",
      stats: {
        직격데미지: getScaledDamage(weapons.bazooka.damage),
        폭발범위: `${formatNumber(weapons.bazooka.explosionRadius)}px`,
        사거리: `${formatNumber(weapons.bazooka.bulletSpeed * weapons.bazooka.bulletLife)}px`,
        발사속도: `${formatNumber(weapons.bazooka.fireRate, 2)}초`,
        장전시간: `${formatNumber(weapons.bazooka.reloadTime, 1)}초`,
      },
    };
  }

  if (weaponName === "grenade") {
    return {
      title: "Grenade",
      description: "오른쪽 클릭으로 안전핀을 뽑고, 왼쪽 클릭을 길게 눌러 던집니다. 짧게 누르면 가까이 떨어뜨립니다.",
      stats: {
        폭발데미지: getScaledDamage(weapons.grenade.damage),
        폭발범위: `${formatNumber(grenadeExplosionRadius)}px`,
        신관시간: `${formatNumber(grenadeFuseSeconds, 1)}초`,
        투척속도: formatNumber(weapons.grenade.bulletSpeed),
        보유수: `x${weapons.grenade.count}`,
      },
    };
  }

  if (weaponName === "magicStaff") {
    return {
      title: magicStaffPickupLabel,
      description: "마법사 보스가 떨어뜨리는 지팡이입니다. 지금은 장착 표시만 구현되어 있고, 공격 기능은 다음 단계에서 추가됩니다.",
      stats: {
        "사용법": "줍는 즉시 슬롯에 장착",
        "상태": "기능 구현 예정",
      },
    };
  }

  return {
    title: weaponName,
    description: "무기 정보가 아직 등록되지 않았습니다.",
    stats: {},
  };
}

function getSkillTooltipData(skill, slotKey = "") {
  if (!skill) {
    const unlockLevel = skillSlotUnlockLevels[slotKey];
    return {
      title: `${slotKey.toUpperCase()} Skill Slot`,
      description: Number.isFinite(unlockLevel) && !isSkillSlotUnlocked(slotKey)
        ? `레벨 ${unlockLevel}에 해금됩니다.`
        : "상점에서 스킬을 구매하면 이 슬롯에 장착할 수 있습니다.",
      stats: { 사용법: `${slotKey.toUpperCase()} 키` },
    };
  }

  const skillStats = {
    knifeRecall: {
      description: "던져진 칼이 있을 때 F로 칼 위치와 즉시 바꿉니다.",
      stats: {
        사용법: "칼 투척 후 스킬 키",
        쿨타임: `${knifeSwapCooldownSeconds}초`,
        필요조건: "칼 보유",
      },
    },
    staticCollapse: {
      description: "에너지를 모아 전기 구를 던지고, 도착 지점에서 범위 폭발을 일으킵니다.",
      stats: {
        사용법: "스킬 키로 장착 후 조준",
        폭발데미지: getScaledDamage(staticCollapseDamage),
        접촉데미지: getScaledDamage(staticCollapseContactDamage),
        폭발범위: `${staticCollapseRadius}px`,
        사거리: `${staticCollapseMinRange}-${staticCollapseMaxRange}px`,
        쿨타임: `${staticCollapseCooldownSeconds}초`,
      },
    },
    arcPrison: {
      description: "원형 전기장을 펼쳐 범위 안 적에게 피해와 둔화를 줍니다.",
      stats: {
        사용법: "스킬 키",
        데미지: getScaledDamage(arcPrisonDamage),
        범위: `${arcPrisonRadius}px`,
        둔화시간: `${arcPrisonSlowSeconds}초`,
        쿨타임: `${arcPrisonCooldownSeconds}초`,
      },
    },
    stormRecall: {
      description: "주변 적을 장풍처럼 밀쳐내며 광역 피해를 줍니다.",
      stats: {
        사용법: "스킬 키",
        데미지: getScaledDamage(stormRecallDamage),
        범위: `${stormRecallRadius}px`,
        쿨타임: `${stormRecallCooldownSeconds}초`,
      },
    },
    lightningThrust: {
      description: "칼을 들고 있을 때 조준 방향으로 번개처럼 돌진하며 경로의 적을 공격합니다.",
      stats: {
        사용법: "칼 장착 후 스킬 키",
        데미지: getScaledDamage(lightningThrustDamage + weapons.knife.damage * 0.55),
        사거리: `${formatNumber(lightningThrustRange + Math.min(140, weapons.knife.throwSpeedBonus * 0.7))}px`,
        히트폭: `${lightningThrustHitRadius}px`,
        쿨타임: `${lightningThrustCooldownSeconds}초`,
      },
    },
    railburst: {
      description: "짧게 충전한 뒤 넓은 번개 광선을 발사합니다.",
      stats: {
        사용법: "스킬 키",
        데미지: getScaledDamage(railburstDamage),
        사거리: `${railburstRange}px`,
        폭: `${railburstWidth}px`,
        충전시간: `${railburstChargeSeconds}초`,
        쿨타임: `${railburstCooldownSeconds}초`,
      },
    },
  };
  const definition = skillDefinitions[skill];
  const details = skillStats[skill] || { description: "스킬 정보가 아직 등록되지 않았습니다.", stats: {} };
  return {
    title: definition?.label || skill,
    description: details.description,
    stats: details.stats,
  };
}

function renderTooltipContent({ title, description, stats }) {
  const rows = Object.entries(stats || {})
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd>`)
    .join("");
  return `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p>${rows ? `<dl>${rows}</dl>` : ""}`;
}

function getTooltipDataFromElement(element) {
  const target = element?.closest?.(".slot, .active-skill-slot, .shop-row[data-item], .shop-row[data-shop-skill]");

  if (!target) {
    return null;
  }

  if (target.classList.contains("slot")) {
    return getWeaponTooltipData(weapons.slots[Number(target.dataset.slot)]);
  }

  if (target.classList.contains("active-skill-slot")) {
    const slotKey = target.dataset.skillSlot;
    return getSkillTooltipData(player.skillSlots[slotKey], slotKey);
  }

  if (target.dataset.item) {
    return getWeaponTooltipData(target.dataset.item);
  }

  if (target.dataset.shopSkill) {
    return getSkillTooltipData(target.dataset.shopSkill);
  }

  return null;
}

function positionTooltip(event) {
  if (!infoTooltip || infoTooltip.classList.contains("hidden")) {
    return;
  }

  const offset = 16;
  const tooltipWidth = infoTooltip.offsetWidth || 260;
  const tooltipHeight = infoTooltip.offsetHeight || 140;
  const left = Math.min(window.innerWidth - tooltipWidth - 12, event.clientX + offset);
  const top = Math.min(window.innerHeight - tooltipHeight - 12, event.clientY + offset);
  infoTooltip.style.left = `${Math.max(12, left)}px`;
  infoTooltip.style.top = `${Math.max(12, top)}px`;
}

function updateInfoTooltip(event) {
  if (!infoTooltip) {
    return;
  }

  const data = getTooltipDataFromElement(event.target);
  if (!data) {
    infoTooltip.classList.add("hidden");
    return;
  }

  infoTooltip.innerHTML = renderTooltipContent(data);
  infoTooltip.classList.remove("hidden");
  positionTooltip(event);
}

function hideInfoTooltip() {
  infoTooltip?.classList.add("hidden");
}

function weaponUsesRightClick(weaponName) {
  return weaponName === "knife" || weaponName === "awm" || weaponName === "grenade";
}

function getRightClickHint(weaponName) {
  if (!weaponUsesRightClick(weaponName)) {
    return "";
  }

  return `<span class="right-click-hint" aria-hidden="true"><span class="mouse-right-button"></span></span>`;
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
    slot.innerHTML = `<span class="slot-key">${slotNumber}</span>${getRightClickHint(weaponName)}${display.icon}<span class="slot-name">${display.label}</span><span class="slot-meta">${display.meta}</span>`;
  }

  renderKnifeIconCanvases();
  renderGlockIconCanvases();
  renderBazookaIconCanvases();
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
  if (selectedWeapon === "grenade" && player.grenadePinned) {
    throwGrenade({ dropAtFeet: true });
    return;
  }

  const angle = getAimAngle();
  const dropX = player.x + Math.cos(angle) * 112;
  const dropY = player.y + Math.sin(angle) * 112;

  if (selectedWeapon === "magicStaff") {
    dropPickupAt(dropX, dropY, { type: "magicStaff", count: 1 });
    weapons.magicStaff.count = 0;
    weapons.slots[weapons.selectedSlot] = null;
    player.hasMagicStaff = Boolean([1, 2, 3].find((slot) => weapons.slots[slot] === "magicStaff"));
  } else if (selectedWeapon === "knife" || selectedWeapon === "grenade") {
    dropPickupAt(dropX, dropY, {
      type: selectedWeapon,
      count: Math.max(1, selectedWeapon === "knife" ? weapons.knife.count : weapons.grenade.count),
    });
    weapons[selectedWeapon].count = 0;
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

    if (weaponName === "magicStaff") {
      dropPickupAt(dropX, dropY, { type: "magicStaff", count: 1 });
    } else if (weaponName === "knife" || weaponName === "grenade") {
      dropPickupAt(dropX, dropY, {
        type: weaponName,
        count: Math.max(1, weaponName === "knife" ? weapons.knife.count : weapons.grenade.count),
      });
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

const grassFlowerClusters = [
  { x: 206, y: 238, petals: "#fff3a2", layout: 0, lush: true },
  { x: 1184, y: 214, petals: "#f7d9ff", layout: 2, double: true },
  { x: 570, y: 748, petals: "#fff3a2", layout: 1 },
  { x: 1580, y: 822, petals: "#fff3a2", layout: 3, double: true, lush: true },
  { x: 248, y: 1336, petals: "#f7d9ff", layout: 2, lush: true },
  { x: 1044, y: 1188, petals: "#fff3a2", layout: 0, double: true },
  { x: 1636, y: 1634, petals: "#fff3a2", layout: 1 },
];

const grassPatchLayouts = [
  [
    [-18, 10, -1], [-13, -5, 1], [-9, 15, 0], [-3, 12, -1],
    [6, 13, 1], [11, 8, 0], [16, 18, -1], [22, -4, 1],
  ],
  [
    [-23, 5, 1], [-18, 17, -1], [-10, 9, 0], [-5, 19, 1],
    [8, 17, -1], [14, -2, 0], [19, 9, 1], [25, 15, -1],
  ],
  [
    [-25, 13, -1], [-16, -8, 0], [-12, 20, 1], [-5, 8, -1],
    [9, 18, 0], [15, 4, 1], [21, 13, -1], [27, -3, 0],
  ],
  [
    [-27, 8, 0], [-20, 20, 1], [-12, -3, -1], [-8, 13, 0],
    [11, 22, -1], [19, 11, 1], [25, 2, 0], [29, 17, -1],
  ],
];

function drawGrassSprig(x, y, pixel, bend) {
  ctx.fillStyle = "#9bdd44";
  ctx.fillRect(x, y + pixel * 2, pixel, pixel * 2);
  ctx.fillRect(x + bend * pixel, y + pixel, pixel, pixel * 2);
  ctx.fillRect(x - bend * pixel, y + pixel * 2, pixel, pixel);
  ctx.fillStyle = "#62b932";
  ctx.fillRect(x, y + pixel * 4, pixel, pixel);
}

function drawPixelFlower(x, y, petals, pixel) {
  ctx.fillStyle = "#359d29";
  ctx.fillRect(x, y + pixel * 3, pixel, pixel * 5);
  ctx.fillStyle = petals;
  ctx.fillRect(x - pixel * 2, y, pixel * 2, pixel * 2);
  ctx.fillRect(x + pixel, y, pixel * 2, pixel * 2);
  ctx.fillRect(x - pixel * 2, y + pixel * 3, pixel * 2, pixel * 2);
  ctx.fillRect(x + pixel, y + pixel * 3, pixel * 2, pixel * 2);
  ctx.fillStyle = "#f0b82d";
  ctx.fillRect(x, y + pixel * 2, pixel, pixel);
}

function drawGrassFlowerCluster(x, y, cluster) {
  const pixel = camera.zoom > 1.18 ? 3 : 2;
  const screenX = Math.round(worldToScreenX(x));
  const screenY = Math.round(worldToScreenY(y));
  const grassLayout = grassPatchLayouts[cluster.layout] || grassPatchLayouts[0];

  for (const [offsetX, offsetY, bend] of grassLayout) {
    drawGrassSprig(screenX + offsetX * pixel, screenY + offsetY * pixel, pixel, bend);
  }

  if (cluster.lush) {
    ctx.fillStyle = "#8ed640";
    ctx.fillRect(screenX - pixel * 7, screenY + pixel * 9, pixel * 4, pixel * 2);
    ctx.fillRect(screenX - pixel * 3, screenY + pixel * 8, pixel * 7, pixel * 3);
    ctx.fillRect(screenX + pixel * 4, screenY + pixel * 10, pixel * 5, pixel * 2);
    ctx.fillStyle = "#66bb35";
    ctx.fillRect(screenX - pixel * 5, screenY + pixel * 11, pixel * 10, pixel);
    ctx.fillRect(screenX + pixel * 6, screenY + pixel * 12, pixel * 3, pixel);
  }

  drawPixelFlower(screenX, screenY, cluster.petals, pixel);
  if (cluster.double) {
    drawPixelFlower(screenX + pixel * 9, screenY + pixel * 6, "#fff3a2", pixel);
  }
}

function drawGrassField() {
  ctx.fillStyle = "#32d426";
  ctx.fillRect(-width, -height, width * 3, height * 3);

  const tileWorldSize = 1900;
  const viewHalfWidth = width / 2 / camera.zoom + tileWorldSize * 1.5;
  const viewHalfHeight = height / 2 / camera.zoom + tileWorldSize * 1.5;
  const startX = Math.floor((camera.x - viewHalfWidth) / tileWorldSize) * tileWorldSize;
  const endX = camera.x + viewHalfWidth + tileWorldSize;
  const startY = Math.floor((camera.y - viewHalfHeight) / tileWorldSize) * tileWorldSize;
  const endY = camera.y + viewHalfHeight + tileWorldSize;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let x = startX; x <= endX; x += tileWorldSize) {
    for (let y = startY; y <= endY; y += tileWorldSize) {
      const flipX = Math.abs(Math.round(x / tileWorldSize)) % 2 === 1;
      const flipY = Math.abs(Math.round(y / tileWorldSize)) % 2 === 1;
      for (const cluster of grassFlowerClusters) {
        const clusterX = x + (flipX ? tileWorldSize - cluster.x : cluster.x);
        const clusterY = y + (flipY ? tileWorldSize - cluster.y : cluster.y);
        drawGrassFlowerCluster(clusterX, clusterY, cluster);
      }
    }
  }
  ctx.restore();
}

function drawDirtTrail(trail) {
  const points = trail.points;
  if (!points.length) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(127, 94, 41, 0.11)";
  ctx.lineWidth = trail.width * camera.zoom;
  ctx.beginPath();
  ctx.moveTo(worldToScreenX(points[0].x), worldToScreenY(points[0].y));
  for (let index = 1; index < points.length - 1; index += 1) {
    const midpointX = (points[index].x + points[index + 1].x) / 2;
    const midpointY = (points[index].y + points[index + 1].y) / 2;
    ctx.quadraticCurveTo(
      worldToScreenX(points[index].x),
      worldToScreenY(points[index].y),
      worldToScreenX(midpointX),
      worldToScreenY(midpointY),
    );
  }
  const last = points[points.length - 1];
  ctx.lineTo(worldToScreenX(last.x), worldToScreenY(last.y));
  ctx.stroke();

  ctx.strokeStyle = "rgba(184, 142, 67, 0.08)";
  ctx.lineWidth = trail.width * camera.zoom * 0.3;
  ctx.stroke();
  ctx.restore();
}

function drawFallenLog(log) {
  ctx.save();
  ctx.translate(worldToScreenX(log.x), worldToScreenY(log.y));
  ctx.scale(camera.zoom, camera.zoom);
  ctx.rotate(log.angle);

  ctx.fillStyle = "rgba(12, 34, 14, 0.22)";
  ctx.beginPath();
  ctx.ellipse(6, log.width * 0.42, log.length * 0.48, log.width * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const wood = ctx.createLinearGradient(0, -log.width / 2, 0, log.width / 2);
  wood.addColorStop(0, "#9a6029");
  wood.addColorStop(0.48, "#7d481f");
  wood.addColorStop(1, "#5d321a");
  ctx.fillStyle = wood;
  ctx.strokeStyle = "#4c2918";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-log.length / 2, -log.width / 2, log.length, log.width, 11);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(213, 151, 64, 0.62)";
  ctx.lineWidth = 3;
  for (const y of [-10, 1, 12]) {
    if (Math.abs(y) < log.width / 2 - 4) {
      ctx.beginPath();
      ctx.moveTo(-log.length / 2 + 24, y);
      ctx.lineTo(log.length / 2 - 14, y - 3);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#b87833";
  ctx.strokeStyle = "#4c2918";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(-log.length / 2 + 4, 0, log.width * 0.42, log.width * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(91, 48, 23, 0.76)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-log.length / 2 + 4, 0, log.width * 0.25, log.width * 0.33, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#5f8f2f";
  ctx.beginPath();
  ctx.roundRect(-20, -log.width / 2 - 4, 42, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawGroundDecorations() {
  for (const trail of groundDecorations.trails) {
    drawDirtTrail(trail);
  }
  for (const log of groundDecorations.logs) {
    drawFallenLog(log);
  }
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
  const renderScale = getWorldRenderScale();

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
    ctx.scale(renderScale, renderScale);
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
  const renderScale = getWorldRenderScale();

  for (const pickup of [...pickups, ...previewPickups]) {
    const x = worldToScreenX(pickup.x);
    const embeddedKnife = pickup.type === "knife" && pickup.embedded;
    const y = worldToScreenY(pickup.y) + (embeddedKnife ? 0 : Math.sin(time * 0.005 + pickup.bob) * 4);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(renderScale, renderScale);
    if (!embeddedKnife) {
      ctx.fillStyle = "rgba(16, 18, 20, 0.72)";
      ctx.strokeStyle = "rgba(246, 242, 233, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-20, -20, 40, 40, 8);
      ctx.fill();
      ctx.stroke();
    }

    if (pickup.type === "knife") {
      ctx.rotate(embeddedKnife ? pickup.angle || 0 : -0.5);
      ctx.scale(embeddedKnife ? 0.6 : 0.52, embeddedKnife ? 0.6 : 0.52);
      drawKnifeModel(0, 0);
    } else if (pickup.type === "glock") {
      ctx.save();
      ctx.translate(17, -11);
      ctx.scale(-0.52, 0.52);
      drawGlockModel();
      ctx.restore();
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
    } else if (pickup.type === "bazooka") {
      ctx.save();
      ctx.translate(-14, 0);
      ctx.scale(0.42, 0.36);
      drawBazookaModel(0, 0);
      ctx.restore();
    } else if (pickup.type === "grenade") {
      drawGrenadeModel(0, 3, 12);
    } else if (pickup.type === "magicStaff") {
      drawMagicStaffPickupModel(0, 0);
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

function drawPoisonProjectileBullet(bullet, x, y, renderScale) {
  const angle = Math.atan2(bullet.vy || 0, bullet.vx || 0);
  const now = performance.now();
  if (bullet.visualSeed === undefined) {
    bullet.visualSeed = ((bullet.x || 0) * 0.017 + (bullet.y || 0) * 0.013) % (Math.PI * 2);
  }
  const corePulse = 1 + Math.sin(now * 0.012 + (bullet.visualSeed || 0)) * 0.04;
  const blurBright = getTintedSprite(poisonProjectileSprite, "#f6ff83");
  const blurBody = getTintedSprite(poisonProjectileSprite, "#a6ff35");
  const blurDark = getTintedSprite(poisonProjectileSprite, "#244a18");
  const splash04 = getTintedSprite(poisonProjectileSplash04Sprite, "#73e824");
  const splash07 = getTintedSprite(poisonProjectileSplash07Sprite, "#b7ff3f");
  const splashBlur = getTintedSprite(poisonProjectileSplash02BlurSprite, "#4dc41e");

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(renderScale, renderScale);

  if (poisonProjectileUnityCaptureSheetSprite.complete && poisonProjectileUnityCaptureSheetSprite.naturalWidth) {
    if (!bullet.visualStartedAt) {
      bullet.visualStartedAt = now;
    }

    const elapsedSeconds = (now - bullet.visualStartedAt) / 1000;
    const frame =
      Math.floor(elapsedSeconds * poisonProjectileUnityCaptureSheet.fps) %
      poisonProjectileUnityCaptureSheet.frameCount;
    const sx =
      (frame % poisonProjectileUnityCaptureSheet.columns) *
      poisonProjectileUnityCaptureSheet.frameWidth;
    const sy =
      Math.floor(frame / poisonProjectileUnityCaptureSheet.columns) *
      poisonProjectileUnityCaptureSheet.frameHeight;
    const width = 236;
    const height =
      width *
      (poisonProjectileUnityCaptureSheet.frameHeight / poisonProjectileUnityCaptureSheet.frameWidth);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.98;
    ctx.drawImage(
      poisonProjectileUnityCaptureSheetSprite,
      sx,
      sy,
      poisonProjectileUnityCaptureSheet.frameWidth,
      poisonProjectileUnityCaptureSheet.frameHeight,
      -156,
      -height / 2,
      width,
      height,
    );
    ctx.restore();
    return;
  }

  if (poisonProjectileUnityCaptureSprite.complete && poisonProjectileUnityCaptureSprite.naturalWidth) {
    const width = 210;
    const height = 38;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.98;
    ctx.drawImage(poisonProjectileUnityCaptureSprite, -138, -height / 2, width, height);
    ctx.restore();
    return;
  }

  ctx.globalCompositeOperation = "lighter";

  if (blurBright && blurBody && blurDark && splash04 && splash07 && splashBlur) {
    const frame20 = Math.floor((now * 0.018 + bullet.visualSeed) % 20);
    const frame16 = Math.floor((now * 0.013 + bullet.visualSeed) % 16);
    const frame12 = Math.floor((now * 0.014 + bullet.visualSeed) % 12);
    const shimmer = Math.sin(now * 0.006 + bullet.visualSeed) * 0.08;
    const layers = [
      { name: "darktrail", sprite: blurDark, x: -74, y: 2, width: 178, height: 15, alpha: 0.34 },
      { name: "trail", sprite: blurBody, x: -56, y: 0, width: 156, height: 20, alpha: 0.5 },
      { name: "tailMist", sprite: splashBlur, columns: 4, rows: 5, frame: frame20, x: -30, y: -1, width: 108, height: 28, alpha: 0.24 },
      { name: "projectileBody", sprite: blurBody, x: 8, y: 0, width: 112, height: 24, alpha: 0.78 },
      { name: "forceField", sprite: blurBright, x: 24, y: 0, width: 96, height: 23, alpha: 0.3, rotate: shimmer },
      { name: "strokes", sprite: splash07, columns: 3, rows: 4, frame: frame12, x: 30, y: 0, width: 78, height: 36, alpha: 0.48 },
      { name: "splatterRing", sprite: splash04, columns: 4, rows: 4, frame: frame16, x: 34, y: 0, width: 84, height: 38, alpha: 0.42 },
      { name: "frontSplash", sprite: splashBlur, columns: 4, rows: 5, frame: (frame20 + 3) % 20, x: 43, y: 0, width: 74, height: 32, alpha: 0.38 },
      { name: "core", sprite: blurBright, x: 42, y: 0, width: 54 * corePulse, height: 22 * corePulse, alpha: 0.96 },
      { name: "upperGlob", sprite: blurBody, x: 22, y: -16, width: 22, height: 14, alpha: 0.72 },
      { name: "rearGlob", sprite: blurBody, x: -4, y: -8, width: 20, height: 13, alpha: 0.6 },
      { name: "lowerGlob", sprite: blurBody, x: 6, y: 14, width: 18, height: 12, alpha: 0.56 },
      { name: "smallDropA", sprite: blurBright, x: -22, y: -10, width: 10, height: 7, alpha: 0.48 },
      { name: "smallDropB", sprite: blurBody, x: -38, y: 8, width: 9, height: 6, alpha: 0.36 },
    ];

    for (const layer of layers) {
      ctx.save();
      ctx.translate(layer.x, layer.y);
      if (layer.rotate) {
        ctx.rotate(layer.rotate);
      }
      ctx.globalAlpha = layer.alpha;
      if (layer.columns && layer.rows) {
        drawFlipbookEffect({
          sprite: layer.sprite,
          columns: layer.columns,
          rows: layer.rows,
          frame: layer.frame,
          width: layer.width,
          height: layer.height,
        });
      } else {
        ctx.drawImage(layer.sprite, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
      }
      ctx.restore();
    }
  } else {
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 24 * corePulse);
    gradient.addColorStop(0, "rgba(238, 255, 177, 0.95)");
    gradient.addColorStop(0.42, "rgba(149, 255, 77, 0.72)");
    gradient.addColorStop(1, "rgba(47, 143, 40, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 24 * corePulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawToxicOrbProjectileBullet(bullet, x, y, renderScale) {
  const now = performance.now();
  if (bullet.visualSeed === undefined) {
    bullet.visualSeed = ((bullet.x || 0) * 0.019 + (bullet.y || 0) * 0.011) % (Math.PI * 2);
  }
  if (bullet.visualStartedAt === undefined) {
    bullet.visualStartedAt = now;
  }

  if (!skillVfxSprites.toxicOrb.complete || !skillVfxSprites.toxicOrb.naturalWidth) {
    drawPoisonProjectileBullet(bullet, x, y, renderScale);
    return;
  }

  const angle = Math.atan2(bullet.vy || 0, bullet.vx || 0);
  const elapsedSeconds = (now - bullet.visualStartedAt) / 1000;
  const pulse = 1 + Math.sin(now * 0.014 + bullet.visualSeed) * 0.035;
  const definition = skillVfxOverlayDefinitions.toxicOrb;
  const frameCount = definition.frameCount || definition.columns * definition.rows;
  const orbFrame = Math.floor(elapsedSeconds * 30 + bullet.visualSeed) % frameCount;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle - Math.PI / 2);
  ctx.scale(renderScale, renderScale);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.96;
  drawFlipbookEffect({
    sprite: definition.sprite,
    columns: definition.columns,
    rows: definition.rows,
    frame: orbFrame,
    width: 74 * pulse,
    height: 90 * pulse,
  });
  ctx.restore();
}

function drawMagicStaffProjectileBullet(bullet, x, y, renderScale) {
  const now = performance.now();
  if (bullet.visualSeed === undefined) {
    bullet.visualSeed = ((bullet.x || 0) * 0.017 + (bullet.y || 0) * 0.023 + Math.random() * 2) % (Math.PI * 2);
  }
  if (bullet.visualStartedAt === undefined) {
    bullet.visualStartedAt = now;
  }

  const ageSeconds = (now - bullet.visualStartedAt) / 1000;
  const angle = Math.atan2(bullet.vy || 0, bullet.vx || 0);
  const pulse = 1 + Math.sin(now * 0.018 + bullet.visualSeed) * 0.08;
  const trail = bullet.trail || [];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let index = trail.length - 1; index >= 0; index -= 1) {
    const point = trail[index];
    const progress = index / Math.max(1, trail.length - 1);
    const fade = clamp(1 - point.age / 28, 0, 1);
    const alpha = Math.pow(progress, 0.8) * fade * 0.28;
    const baseX = worldToScreenX(point.x);
    const baseY = worldToScreenY(point.y);

    for (let particle = 0; particle < 2; particle += 1) {
      const particleSeed = bullet.visualSeed + index * 1.73 + particle * 2.31;
      const drift = (1 - progress) * 18 + point.age * 0.42;
      const offsetAngle = particleSeed + ageSeconds * (1.1 + particle * 0.16);
      const offsetX = Math.cos(offsetAngle) * drift * renderScale;
      const offsetY = Math.sin(offsetAngle * 1.37) * drift * 0.62 * renderScale;
      const shrink = 0.35 + fade * 0.65;
      const size = (0.65 + progress * 2.2 + particle * 0.24) * shrink * renderScale;

      ctx.fillStyle = `rgba(220, 225, 231, ${alpha * (0.65 + particle * 0.08)})`;
      ctx.beginPath();
      ctx.arc(baseX + offsetX, baseY + offsetY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.translate(x, y);
  ctx.scale(renderScale, renderScale);
  ctx.rotate(angle);

  const halo = 15 * pulse;
  const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, halo);
  gradient.addColorStop(0, "rgba(248, 250, 252, 0.72)");
  gradient.addColorStop(0.3, "rgba(225, 230, 236, 0.5)");
  gradient.addColorStop(0.68, "rgba(164, 174, 185, 0.2)");
  gradient.addColorStop(1, "rgba(185, 194, 204, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, halo, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(245, 247, 250, 0.56)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6.4 * pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(248, 250, 252, 0.76)";
  ctx.beginPath();
  ctx.arc(0, 0, 3.6 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(216, 222, 229, 0.42)";
  ctx.lineWidth = 1.4;
  for (const offset of [0, Math.PI * 0.66, Math.PI * 1.32]) {
    const orbit = ageSeconds * 5.8 + bullet.visualSeed + offset;
    const ox = Math.cos(orbit) * 10;
    const oy = Math.sin(orbit) * 4;
    ctx.beginPath();
    ctx.arc(ox, oy, 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(210, 216, 224, 0.34)";
  for (let spark = 0; spark < 3; spark += 1) {
    const sparkAngle = bullet.visualSeed + ageSeconds * (3.2 + spark * 0.2) + spark * 1.43;
    const distance = 11 + (spark % 3) * 4 + Math.sin(ageSeconds * 7 + spark) * 3;
    ctx.beginPath();
    ctx.arc(-Math.cos(sparkAngle) * distance, Math.sin(sparkAngle) * distance * 0.55, 0.9 + (spark % 2) * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBullets() {
  const renderScale = getWorldRenderScale();

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
      ctx.scale(renderScale, renderScale);
      ctx.rotate(bullet.angle);
      ctx.scale(0.6, 0.6);
      drawKnifeModel(0, 0);
      ctx.restore();
      continue;
    }

    if (bullet.weapon === "bazooka") {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(renderScale, renderScale);
      ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
      ctx.fillStyle = "#8cac4d";
      ctx.strokeStyle = "#213023";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(3, -7);
      ctx.lineTo(3, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#385735";
      ctx.strokeStyle = "#15191b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-13, -6, 18, 12, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (bullet.weapon === "grenade") {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#050708";
      ctx.beginPath();
      ctx.ellipse(0, 4, bullet.radius * (1 - Math.min(0.42, (bullet.z || 0) / 420)), bullet.radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.translate(0, -(bullet.z || 0) * camera.zoom);
      ctx.scale(renderScale, renderScale);
      ctx.rotate(bullet.rotation || 0);
      drawGrenadeModel(0, 0, bullet.radius, { pinRemoved: true });
      ctx.restore();
      continue;
    }

    if (bullet.weapon === "magicStaff") {
      drawMagicStaffProjectileBullet(bullet, x, y, renderScale);
      continue;
    }

    if (bullet.weapon === "wizardPoisonBolt") {
      drawPoisonProjectileBullet(bullet, x, y, renderScale);
      continue;
    }

    if (bullet.weapon === "toxicOrb") {
      drawToxicOrbProjectileBullet(bullet, x, y, renderScale);
      continue;
    }

    ctx.fillStyle = bullet.weapon === "awm" ? "#f6f2e9" : "#ffeb7a";
    ctx.strokeStyle = bullet.weapon === "awm" ? "#52616a" : "#7f551b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, bullet.radius * renderScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawRemoteBullets() {
  const renderScale = getWorldRenderScale();

  for (const bullet of remoteBullets) {
    const x = worldToScreenX(bullet.x);
    const y = worldToScreenY(bullet.y);

    if (bullet.weapon === "knife") {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(renderScale, renderScale);
      ctx.rotate(bullet.angle || Math.atan2(bullet.vy, bullet.vx));
      ctx.scale(0.6, 0.6);
      drawKnifeModel(0, 0, ctx, "#ef6f8f");
      ctx.restore();
      continue;
    }

    if (bullet.weapon === "bazooka") {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(renderScale, renderScale);
      ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
      ctx.fillStyle = "#96bb57";
      ctx.strokeStyle = "#ef6f8f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(3, -7);
      ctx.lineTo(3, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#405b37";
      ctx.strokeStyle = "#ef6f8f";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-13, -6, 18, 12, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (bullet.weapon === "grenade") {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#050708";
      ctx.beginPath();
      ctx.ellipse(0, 4, bullet.radius * (1 - Math.min(0.42, (bullet.z || 0) / 420)), bullet.radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.translate(0, -(bullet.z || 0) * camera.zoom);
      ctx.scale(renderScale, renderScale);
      ctx.rotate(bullet.rotation || 0);
      drawGrenadeModel(0, 0, bullet.radius, { pinRemoved: true, outline: "#ef6f8f", fill: "#557044" });
      ctx.restore();
      continue;
    }

    if (bullet.weapon === "magicStaff") {
      drawMagicStaffProjectileBullet(bullet, x, y, renderScale);
      continue;
    }

    if (bullet.weapon === "wizardPoisonBolt") {
      drawPoisonProjectileBullet(bullet, x, y, renderScale);
      continue;
    }

    if (bullet.weapon === "toxicOrb") {
      drawToxicOrbProjectileBullet(bullet, x, y, renderScale);
      continue;
    }

    ctx.fillStyle = bullet.weapon === "awm" ? "#f6f2e9" : "#ffeb7a";
    ctx.strokeStyle = "#ef6f8f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, bullet.radius * renderScale, 0, Math.PI * 2);
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
  const renderScale = getWorldRenderScale();

  for (let index = corpses.length - 1; index >= 0; index -= 1) {
    const corpse = corpses[index];
    const remaining = corpse.expiresAt - now;

    if (remaining <= 0) {
      corpses.splice(index, 1);
      continue;
    }

    const fade = clamp(remaining / corpseLifetime, 0, 1);
    const deathProgress = clamp((now - (corpse.startedAt || now)) / Math.min(800, corpseLifetime), 0, 1);
    const x = worldToScreenX(corpse.x);
    const y = worldToScreenY(corpse.y);

    ctx.save();
    ctx.globalAlpha = 0.25 + fade * 0.75;
    ctx.translate(x, y);
    ctx.scale(renderScale, renderScale);
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, player.radius + 8, player.radius * 0.96, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // V1 rollback reference: previous corpses were flattened circles.
    // ctx.rotate(Math.sin(time * 0.002 + corpse.x) * 0.18);
    // ctx.scale(1.18, 0.72);
    // ctx.fillStyle = corpse.color;
    // ctx.strokeStyle = corpse.stroke;
    // ctx.lineWidth = 5;
    // ctx.beginPath();
    // ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    // ctx.fill();
    // ctx.stroke();
    drawModernCharacterSprite({
      time,
      characterId: corpse.characterId,
      direction: "down",
      deathProgress,
    });
    ctx.restore();
  }
}

function drawRemotePlayers(time) {
  const renderScale = getWorldRenderScale();

  for (const remote of remotePlayers.values()) {
    const entityScale = Number(remote.scale || 1);
    const positionSmoothing = remote.isBoss ? 0.12 : 0.22;
    const aimSmoothing = remote.isBoss ? 0.14 : 0.24;
    remote.renderX += (remote.x - remote.renderX) * positionSmoothing;
    remote.renderY += (remote.y - remote.renderY) * positionSmoothing;
    remote.renderAimAngle = lerpAngle(remote.renderAimAngle, remote.aimAngle || 0, aimSmoothing);
    remote.swingTimer = Math.max(0, (remote.swingTimer || 0) - 1 / 60);
    remote.punchTimer = Math.max(0, (remote.punchTimer || 0) - 1 / 60);
    remote.dashVisualTimer = Math.max(0, (remote.dashVisualTimer || 0) - 1 / 60);
    remote.glockShotVisualTimer = Math.max(0, (remote.glockShotVisualTimer || 0) - 1 / 60);
    remote.magicStaffCastTimer = Math.max(0, (remote.magicStaffCastTimer || 0) - 1 / 60);
    remote.bossAttackVisualTimer = Math.max(0, (remote.bossAttackVisualTimer || 0) - 1 / 60);

    const x = worldToScreenX(remote.renderX);
    const y = worldToScreenY(remote.renderY);
    const aimAngle = remote.renderAimAngle;
    const motionX = remote.isBoss ? remote.vx || 0 : remote.x - remote.renderX;
    const motionY = remote.isBoss ? remote.vy || 0 : remote.y - remote.renderY;
    const motionSpeed = remote.isBoss ? Math.hypot(motionX, motionY) : Math.hypot(motionX, motionY) * 18;
    updatePiskelMotionState(remote, time, motionX, motionY, motionSpeed);
    addWalkingDustOnFootfall(remote, remote.renderX, remote.renderY, Math.atan2(motionY, motionX), motionSpeed, {
      dashing: remote.dashVisualTimer > 0,
    });

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(renderScale, renderScale);

    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, player.radius * entityScale + 8, player.radius * 0.92 * entityScale, 8 * entityScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.scale(entityScale, entityScale);
    applyDashRollTransform(getDashRollProgress(remote.dashVisualTimer), remote.spriteDirection);
    /*
     * Previous circular remote avatar, retained for rollback:
     * ctx.lineWidth = 5;
     * ctx.fillStyle = "#ef6f8f";
     * ctx.strokeStyle = "#7a2738";
     * ctx.beginPath();
     * ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
     * ctx.fill();
     * ctx.stroke();
     */
    /*
     * Previous generated tactical avatar, retained for rollback:
     * drawTacticalRunnerCharacter({
     *   time,
     *   aimAngle,
     *   speed: motionSpeed,
     *   dashing: remote.dashVisualTimer > 0,
     *   accent: "#df5b62",
     *   visor: "#f4a771",
     * });
     */
    /*
     * Previous hand-cut Piskel sprites, retained for rollback:
     * drawPiskelCharacterSprite({
     *   time,
     *   speed: motionSpeed,
     *   movementX: motionX,
     *   movementY: motionY,
     *   dashing: remote.dashVisualTimer > 0,
     *   direction: remote.spriteDirection,
     *   motionStartedAt: remote.spriteMotionStartedAt,
     * });
     */
    drawModernCharacterSprite({
      time,
      speed: motionSpeed,
      movementX: motionX,
      movementY: motionY,
      dashing: remote.dashVisualTimer > 0,
      direction: remote.spriteDirection,
      characterId: remote.characterId,
      selectedWeapon: remote.selectedWeapon,
      aimAngle,
      swingTimer: remote.isBoss
        ? Math.max(remote.bossAttackVisualTimer || 0, remote.swingTimer || 0, remote.punchTimer || 0)
        : remote.selectedWeapon ? remote.swingTimer || 0 : remote.punchTimer || 0,
      swingDuration: remote.isBoss
        ? Math.max(remote.swingDuration || 0, remote.punchDuration || 0, 0.56)
        : remote.selectedWeapon ? remote.swingDuration || weapons.knife.swingDuration : remote.punchDuration || weapons.fist.swingDuration,
      glockShotVisualTimer: remote.glockShotVisualTimer || 0,
      magicStaffCastTimer: remote.magicStaffCastTimer || 0,
      magicStaffCastDuration: remote.magicStaffCastDuration || weapons.magicStaff.castDuration,
      reloadTimer: remote.reloadTimer || 0,
    });
    drawEquippedWeaponLayer(remote.selectedWeapon, aimAngle, {
      swingTimer: remote.swingTimer || 0,
      swingDuration: remote.swingDuration || weapons.knife.swingDuration,
      grenadePinned: Boolean(remote.grenadePinned),
    });
    ctx.restore();

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

    /*
     * Previous circular avatar face, retained for rollback:
     * drawPlayerFace(aimAngle);
     */

    ctx.save();
    ctx.rotate(-camera.rotation);
    ctx.fillStyle = "rgba(16, 18, 20, 0.7)";
    ctx.strokeStyle = "rgba(246, 242, 233, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const labelWidth = remote.isBoss ? 112 : 68;
    const labelY = -player.radius * entityScale - 33;
    ctx.roundRect(-labelWidth / 2, labelY, labelWidth, 18, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6f2e9";
    ctx.font = "800 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(remote.name || "Player", 0, labelY + 9);

    if (remote.chatBubble && performance.now() - remote.chatBubble.createdAt <= chatMessageLifetime) {
      drawChatBubble(remote.chatBubble.text, labelY - 9);
    }

    const hpRatio = Math.max(0, remote.health / remote.maxHealth);
    ctx.fillStyle = "rgba(16, 18, 20, 0.72)";
    const hpWidth = remote.isBoss ? 92 : 44;
    const hpY = player.radius * entityScale + 15;
    ctx.fillRect(-hpWidth / 2, hpY, hpWidth, remote.isBoss ? 7 : 5);
    ctx.fillStyle = remote.isBoss ? "#ff5f7f" : hpRatio > 0.4 ? "#8df4df" : "#ff9cb5";
    ctx.fillRect(-hpWidth / 2, hpY, hpWidth * hpRatio, remote.isBoss ? 7 : 5);
    ctx.restore();
    ctx.restore();

    if (hitboxDebug) {
      drawPlayerDebugOverlay(
        remote.renderX,
        remote.renderY,
        player.radius * entityScale,
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
  drawKnifeModel(reach + 14, 0);
  ctx.restore();
}

function drawKnifeModel(x, y, drawingContext = ctx, outline = "#55666f") {
  drawingContext.save();
  drawingContext.translate(x, y);
  drawingContext.lineJoin = "round";

  drawingContext.fillStyle = "#d9e0e3";
  drawingContext.strokeStyle = outline;
  drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  drawingContext.moveTo(-25, -5);
  drawingContext.lineTo(24, -1);
  drawingContext.lineTo(-17, 11);
  drawingContext.closePath();
  drawingContext.fill();
  drawingContext.stroke();

  drawingContext.fillStyle = "#20272b";
  drawingContext.strokeStyle = "#0d1114";
  drawingContext.lineWidth = 2;
  drawingContext.beginPath();
  drawingContext.roundRect(-43, -5, 22, 10, 3);
  drawingContext.fill();
  drawingContext.stroke();
  drawingContext.restore();
}

function renderKnifeIconCanvases() {
  for (const icon of document.querySelectorAll("canvas[data-knife-icon]")) {
    const iconContext = icon.getContext("2d");
    if (!iconContext) {
      continue;
    }
    iconContext.clearRect(0, 0, icon.width, icon.height);
    iconContext.save();
    iconContext.translate(42, 23);
    drawKnifeModel(0, 0, iconContext);
    iconContext.restore();
  }
}

function drawGlockWeapon() {
  ctx.save();
  ctx.translate(72, -16);
  ctx.scale(-1, 1);
  drawGlockModel();
  ctx.restore();
}

function drawGlockModel(drawingContext = ctx) {
  const slideGradient = drawingContext.createLinearGradient(5, 8, 5, 21);
  slideGradient.addColorStop(0, "#c6d5dc");
  slideGradient.addColorStop(1, "#617987");
  drawingContext.fillStyle = slideGradient;
  drawingContext.beginPath();
  drawingContext.roundRect(5, 8, 52, 13, 4);
  drawingContext.fill();

  // 총구의 반원 음영
  drawingContext.fillStyle = "#4a606e";
  drawingContext.beginPath();
  drawingContext.arc(9, 14.5, 6.5, Math.PI / 2, Math.PI * 1.5);
  drawingContext.fill();

  // 총구의 반원 음영
  drawingContext.beginPath();
  drawingContext.arc(13, 14.5, 6.5, Math.PI / 2, Math.PI * 1.5);
  drawingContext.fill();

  drawingContext.fillStyle = "#17232b";
  drawingContext.beginPath();
  drawingContext.ellipse(7, 14, 2.5, 4.5, 0, 0, Math.PI * 2);
  drawingContext.fill();

  drawingContext.save();
  drawingContext.translate(34, 18);
  drawingContext.transform(1, 0, 0.2, 1, 0, 0);
  const gripGradient = drawingContext.createLinearGradient(0, 0, 17, 0);
  gripGradient.addColorStop(0, "#748a96");
  gripGradient.addColorStop(1, "#293842");
  drawingContext.fillStyle = gripGradient;
  drawingContext.beginPath();
  drawingContext.roundRect(0, 0, 17, 24, 4);
  drawingContext.fill();
  drawingContext.restore();

  drawingContext.strokeStyle = "#344853";
  drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  drawingContext.arc(32, 23, 7, 1, Math.PI + 0.3);
  drawingContext.stroke();
}

function renderGlockIconCanvases() {
  for (const icon of document.querySelectorAll("canvas[data-glock-icon]")) {
    const iconContext = icon.getContext("2d");
    if (!iconContext) {
      continue;
    }
    iconContext.clearRect(0, 0, icon.width, icon.height);
    iconContext.save();
    iconContext.translate(62, 2);
    iconContext.scale(-0.82, 0.82);
    drawGlockModel(iconContext);
    iconContext.restore();
  }
}

function drawBazookaModel(x, y, drawingContext = ctx) {
  drawingContext.save();
  drawingContext.translate(x, y);
  drawingContext.lineJoin = "round";

  drawingContext.fillStyle = "#335331";
  drawingContext.strokeStyle = "#142117";
  drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  drawingContext.moveTo(0, -8);
  drawingContext.lineTo(-11, -12);
  drawingContext.lineTo(-11, 12);
  drawingContext.lineTo(0, 8);
  drawingContext.closePath();
  drawingContext.fill();
  drawingContext.stroke();

  drawingContext.fillStyle = "#52763c";
  drawingContext.beginPath();
  drawingContext.roundRect(-1, -9, 59, 18, 5);
  drawingContext.fill();
  drawingContext.stroke();
  drawingContext.fillStyle = "#75984d";
  drawingContext.fillRect(5, -5, 45, 3);

  drawingContext.fillStyle = "#294a2d";
  for (const ringX of [0, 45, 56]) {
    drawingContext.beginPath();
    drawingContext.roundRect(ringX, -11, 6, 22, 2);
    drawingContext.fill();
  }

  drawingContext.fillStyle = "#93b854";
  drawingContext.strokeStyle = "#294329";
  drawingContext.beginPath();
  drawingContext.moveTo(76, 0);
  drawingContext.quadraticCurveTo(68, -9, 58, -9);
  drawingContext.lineTo(58, 9);
  drawingContext.quadraticCurveTo(68, 9, 76, 0);
  drawingContext.closePath();
  drawingContext.fill();
  drawingContext.stroke();
  drawingContext.fillStyle = "rgba(232, 244, 162, 0.45)";
  drawingContext.beginPath();
  drawingContext.ellipse(65, -4, 4, 2, 0, 0, Math.PI * 2);
  drawingContext.fill();

  drawingContext.strokeStyle = "#182417";
  drawingContext.lineWidth = 3;
  drawingContext.beginPath();
  drawingContext.moveTo(16, -14);
  drawingContext.lineTo(40, -14);
  drawingContext.moveTo(18, -14);
  drawingContext.lineTo(18, -10);
  drawingContext.moveTo(38, -14);
  drawingContext.lineTo(38, -10);
  drawingContext.stroke();

  drawingContext.fillStyle = "#273c26";
  drawingContext.beginPath();
  drawingContext.moveTo(20, 8);
  drawingContext.lineTo(31, 8);
  drawingContext.lineTo(28, 27);
  drawingContext.lineTo(19, 27);
  drawingContext.closePath();
  drawingContext.fill();
  drawingContext.stroke();
  drawingContext.restore();
}

function renderBazookaIconCanvases() {
  for (const icon of document.querySelectorAll("canvas[data-bazooka-icon]")) {
    const iconContext = icon.getContext("2d");
    if (!iconContext) {
      continue;
    }
    iconContext.clearRect(0, 0, icon.width, icon.height);
    iconContext.save();
    iconContext.translate(13, 20);
    iconContext.scale(0.98, 0.98);
    drawBazookaModel(0, 0, iconContext);
    iconContext.restore();
  }
}

function drawMagicStaffModel(x, y, drawingContext = ctx) {
  drawingContext.save();
  drawingContext.translate(x, y);
  drawingContext.rotate(-0.72);
  drawingContext.lineCap = "round";
  drawingContext.strokeStyle = "#5b3b83";
  drawingContext.lineWidth = 5;
  drawingContext.beginPath();
  drawingContext.moveTo(-30, 0);
  drawingContext.lineTo(27, 0);
  drawingContext.stroke();
  drawingContext.strokeStyle = "#d5b6ff";
  drawingContext.lineWidth = 2;
  drawingContext.beginPath();
  drawingContext.moveTo(-25, -2);
  drawingContext.lineTo(19, -2);
  drawingContext.stroke();
  drawingContext.fillStyle = "#7cd7ff";
  drawingContext.strokeStyle = "#f6f2e9";
  drawingContext.lineWidth = 2;
  drawingContext.beginPath();
  drawingContext.arc(33, 0, 9, 0, Math.PI * 2);
  drawingContext.fill();
  drawingContext.stroke();
  drawingContext.fillStyle = "rgba(141, 244, 223, 0.45)";
  drawingContext.beginPath();
  drawingContext.arc(33, 0, 15, 0, Math.PI * 2);
  drawingContext.fill();
  drawingContext.restore();
}

function drawMagicStaffPickupModel(x, y, drawingContext = ctx) {
  if (!magicStaffPickupSprite.complete || !magicStaffPickupSprite.naturalWidth) {
    drawMagicStaffModel(x, y, drawingContext);
    return;
  }

  drawingContext.save();
  drawingContext.translate(x, y);
  const previousSmoothing = drawingContext.imageSmoothingEnabled;
  drawingContext.imageSmoothingEnabled = false;
  drawingContext.drawImage(magicStaffPickupSprite, -21, -25, 42, 49);
  drawingContext.imageSmoothingEnabled = previousSmoothing;
  drawingContext.restore();
}

function drawMagicStaffWeapon() {
  if (!magicStaffPickupSprite.complete || !magicStaffPickupSprite.naturalWidth) {
    drawMagicStaffModel(player.radius + 18, 0);
    return;
  }

  ctx.save();
  ctx.translate(player.radius + 18, -8);
  ctx.rotate(-0.18);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(magicStaffPickupSprite, -18, -26, 36, 42);
  ctx.restore();
}

function drawBazookaWeapon() {
  ctx.save();
  ctx.translate(-36, 7);
  ctx.scale(1.34, 1.14);
  drawBazookaModel(0, 0);
  ctx.restore();
}

function drawBazookaSupportHand(fill, stroke) {
  ctx.save();
  ctx.translate(-5, 8);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-10, -10, 27, 25, 9);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(16, 28, 24, 0.28)";
  ctx.lineWidth = 2.5;
  for (const fingerX of [-3, 4, 11]) {
    ctx.beginPath();
    ctx.moveTo(fingerX, -6);
    ctx.lineTo(fingerX, 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHeldBazookaPose(fill, stroke) {
  drawBazookaWeapon();
  drawBazookaSupportHand(fill, stroke);
}

function drawPlayerFace(aimAngle) {
  ctx.save();
  ctx.rotate(aimAngle);
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
  ctx.restore();
}

function drawTacticalRunnerCharacter({ time, aimAngle, speed = 0, dashing = false, accent = "#13b2bf", visor = "#ffc26a" }) {
  const running = speed > 28;
  const runAmount = running ? Math.min(1, speed / player.maxSpeed) : 0;
  const phase = time * (dashing ? 0.042 : running ? 0.016 + runAmount * 0.012 : 0.004);
  const stride = Math.sin(phase) * (dashing ? 7 : runAmount * 5);
  const bounce = running ? Math.abs(Math.cos(phase)) * 1.4 : Math.sin(phase) * 0.45;
  const scarfWave = Math.sin(phase * 0.8) * (running ? 3 : 1.2);
  const facing = Math.cos(aimAngle) < 0 ? -1 : 1;

  ctx.save();
  ctx.translate(0, bounce - 8);
  ctx.scale(facing, 1);
  if (dashing) {
    ctx.rotate(-0.08);
  }
  ctx.lineJoin = "miter";

  if (dashing) {
    ctx.globalAlpha = 0.48;
    ctx.fillStyle = "#25ced5";
    ctx.beginPath();
    ctx.moveTo(-66, -16);
    ctx.lineTo(-18, -10);
    ctx.lineTo(-28, -5);
    ctx.lineTo(-78, -7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-72, 4);
    ctx.lineTo(-18, 9);
    ctx.lineTo(-36, 15);
    ctx.lineTo(-84, 13);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Scarf tails sit behind the body and make motion legible at gameplay scale.
  ctx.fillStyle = accent;
  ctx.strokeStyle = "#0e323a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-7, -19);
  ctx.lineTo(-30, -22 + scarfWave);
  ctx.lineTo(-47, -15 + scarfWave);
  ctx.lineTo(-28, -12 + scarfWave);
  ctx.lineTo(-44, -5 + scarfWave);
  ctx.lineTo(-17, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rear and forward legs: a compact 3/4 running pose rather than a rotated top view.
  ctx.strokeStyle = "#10171b";
  ctx.lineWidth = 4;
  ctx.fillStyle = "#172126";
  ctx.beginPath();
  ctx.moveTo(-11, 10);
  ctx.lineTo(-2, 11);
  ctx.lineTo(-5 - stride * 0.34, 30);
  ctx.lineTo(-15 - stride * 0.58, 31);
  ctx.lineTo(-16, 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#212e34";
  ctx.beginPath();
  ctx.moveTo(1, 10);
  ctx.lineTo(12, 11);
  ctx.lineTo(14 + stride * 0.42, 29);
  ctx.lineTo(6 + stride * 0.7, 32);
  ctx.lineTo(0, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#947044";
  ctx.beginPath();
  ctx.roundRect(-18 - stride * 0.58, 28, 14, 7, 3);
  ctx.roundRect(5 + stride * 0.7, 29, 15, 7, 3);
  ctx.fill();
  ctx.stroke();

  // Jacket and belt.
  ctx.fillStyle = "#27343a";
  ctx.strokeStyle = "#10171b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, -14);
  ctx.lineTo(12, -15);
  ctx.lineTo(19, -7);
  ctx.lineTo(15, 13);
  ctx.lineTo(8, 17);
  ctx.lineTo(-12, 15);
  ctx.lineTo(-18, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#38464b";
  ctx.beginPath();
  ctx.moveTo(-7, -10);
  ctx.lineTo(10, -10);
  ctx.lineTo(12, 8);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#111a1e";
  ctx.fillRect(-12, 10, 25, 5);
  ctx.fillStyle = "#d89127";
  ctx.fillRect(0, 10, 5, 5);
  ctx.strokeStyle = "#c98725";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, -3);
  ctx.lineTo(5, 3);
  ctx.lineTo(10, -4);
  ctx.closePath();
  ctx.stroke();

  // Arms and gloves frame the weapon pose drawn by the weapon renderer.
  ctx.strokeStyle = "#10171b";
  ctx.fillStyle = "#25343b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-22, -8 + stride * 0.16, 9, 19, 4);
  ctx.roundRect(12, -9 - stride * 0.16, 15, 9, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e59629";
  ctx.fillRect(-22, 7 + stride * 0.16, 7, 5);
  ctx.fillRect(23, -8 - stride * 0.16, 5, 7);

  // Head, hair and visor.
  ctx.fillStyle = "#f0ad65";
  ctx.strokeStyle = "#0d1b21";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-10, -32, 28, 22, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#174752";
  ctx.strokeStyle = "#0d1b21";
  ctx.beginPath();
  ctx.moveTo(-14, -32);
  ctx.lineTo(-6, -43);
  ctx.lineTo(3, -40);
  ctx.lineTo(8, -47);
  ctx.lineTo(13, -39);
  ctx.lineTo(23, -42);
  ctx.lineTo(21, -33);
  ctx.lineTo(26, -27);
  ctx.lineTo(17, -20);
  ctx.lineTo(-8, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#226879";
  ctx.fillRect(-4, -37, 7, 5);
  ctx.fillRect(6, -41, 5, 6);
  ctx.fillRect(13, -34, 7, 5);
  ctx.fillStyle = accent;
  ctx.strokeStyle = "#0e323a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -26);
  ctx.lineTo(20, -29);
  ctx.lineTo(22, -22);
  ctx.lineTo(-10, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7ee8ea";
  ctx.fillRect(8, -26, 9, 2);
  ctx.fillStyle = visor;
  ctx.fillRect(18, -18, 3, 3);
  ctx.restore();
}

function getPiskelSpriteDirection(movementX, movementY, fallback = "down") {
  if (Math.max(Math.abs(movementX), Math.abs(movementY)) <= 0.2) {
    return fallback;
  }

  if (Math.abs(movementX) > Math.abs(movementY)) {
    return movementX > 0 ? "right" : "left";
  }

  return movementY > 0 ? "down" : "up";
}

function getModernCharacterDirection(movementX, movementY, fallback = "down") {
  if (Math.max(Math.abs(movementX), Math.abs(movementY)) <= 0.2) {
    return fallback;
  }

  const directionIndex = Math.round(Math.atan2(movementY, movementX) / (Math.PI / 4));
  const directions = [
    "right",
    "downRight",
    "down",
    "downLeft",
    "left",
    "upLeft",
    "up",
    "upRight",
  ];
  return directions[(directionIndex + directions.length) % directions.length];
}

function updatePiskelMotionState(character, time, movementX, movementY, speed) {
  const moving = speed > 28;
  if (!moving) {
    character.spriteWasMoving = false;
    return;
  }

  const direction = getModernCharacterDirection(movementX, movementY, character.spriteDirection);
  if (!character.spriteWasMoving || character.spriteMotionDirection !== direction) {
    character.spriteMotionDirection = direction;
    character.spriteMotionStartedAt = time;
  }
  character.spriteDirection = direction;
  character.spriteWasMoving = true;
}

function getDashRollProgress(dashVisualTimer = 0) {
  if (dashVisualTimer <= 0) {
    return 0;
  }
  return clamp(1 - dashVisualTimer / dashRollVisualDuration, 0, 1);
}

function applyDashRollTransform(progress, direction = "right") {
  if (progress <= 0) {
    return;
  }

  const rollSign = direction.includes("left") || direction === "up" ? -1 : 1;
  const eased = 1 - Math.pow(1 - progress, 2);
  const tuck = Math.sin(progress * Math.PI);

  ctx.translate(0, -12 - tuck * 4);
  ctx.rotate(rollSign * eased * Math.PI * 2);
  ctx.scale(1 + tuck * 0.08, 1 - tuck * 0.12);
  ctx.translate(0, 12);
}

function drawPiskelCharacterSprite({
  time,
  speed = 0,
  movementX = 0,
  movementY = 0,
  dashing = false,
  direction = "down",
  motionStartedAt = time,
}) {
  if (!playerCharacterSprite.complete || !playerCharacterSprite.naturalWidth) {
    return;
  }

  const frameSize = 32;
  const moving = speed > 28 || dashing;
  const resolvedDirection = getPiskelSpriteDirection(movementX, movementY, direction);
  const idleFrame = 7;
  let sprite = playerCharacterSprite;
  let frame = idleFrame;

  if (moving && (resolvedDirection === "left" || resolvedDirection === "right")) {
    const movingLeft = resolvedDirection === "left";
    sprite = movingLeft ? playerLeftMoveSprite : playerRightMoveSprite;
    const introFrames = movingLeft ? [6, 5, 4, 3] : [0, 1, 2, 3];
    const loopFrames = movingLeft ? [1, 0] : [5, 6];
    const elapsed = Math.max(0, time - motionStartedAt);
    const introDuration = 100;
    const introTotal = introFrames.length * introDuration;
    frame = elapsed < introTotal
      ? introFrames[Math.min(introFrames.length - 1, Math.floor(elapsed / introDuration))]
      : loopFrames[Math.floor((elapsed - introTotal) / (dashing ? 72 : 110)) % loopFrames.length];
  } else if (moving) {
    const verticalFrames = resolvedDirection === "up" ? [8, 9, 10, 11] : [4, 5, 6, 7];
    frame = verticalFrames[Math.floor(time / (dashing ? 72 : 118)) % verticalFrames.length];
  }
  if (!sprite.complete || !sprite.naturalWidth) {
    sprite = playerCharacterSprite;
    frame = idleFrame;
  }
  const isBaseSheet = sprite === playerCharacterSprite;
  const sourceX = (isBaseSheet ? frame % 4 : frame) * frameSize;
  const sourceY = isBaseSheet ? Math.floor(frame / 4) * frameSize : 0;
  const drawSize = 82;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sprite,
    sourceX,
    sourceY,
    frameSize,
    frameSize,
    -drawSize / 2,
    -drawSize / 2 - 12,
    drawSize,
    drawSize,
  );
  ctx.restore();
}

function drawModernCharacterSprite({
  time,
  characterId = selectedCharacterId,
  speed = 0,
  movementX = 0,
  movementY = 0,
  dashing = false,
  direction = "down",
  selectedWeapon = null,
  aimAngle = 0,
  swingTimer = 0,
  swingDuration = weapons.knife.swingDuration,
  glockShotVisualTimer = 0,
  magicStaffCastTimer = 0,
  magicStaffCastDuration = weapons.magicStaff.castDuration,
  reloadTimer = 0,
  deathProgress = null,
}) {
  const character = getCharacterDefinition(characterId);
  const baseSprites = character.sprites;
  const overlaySprites = deathProgress === null && weaponCharacterSprites[selectedWeapon]
    ? weaponCharacterSprites[selectedWeapon]
    : null;
  const sprites = baseSprites;
  const moving = speed > 28 || dashing;
  const meleeAttacking =
    ((selectedWeapon === "knife" || selectedWeapon === "magicStaff") && swingTimer > 0) ||
    (!selectedWeapon && swingTimer > 0);
  const staffCasting = selectedWeapon === "magicStaff" && magicStaffCastTimer > 0;
  const reloading = reloadTimer > 0;
  const glockEquipped = selectedWeapon === "glock";
  const firearmEquipped = selectedWeapon === "glock" || selectedWeapon === "awm";
  const firearmFiring = firearmEquipped && glockShotVisualTimer > 0;
  const glockFiring = firearmFiring;
  const firearmSheetFlashActive = glockFiring && glockShotVisualTimer > glockShotVisualDuration - firearmSheetFlashDuration;
  const magicStaffMeleeAttacking = selectedWeapon === "magicStaff" && swingTimer > 0;
  const sprite = deathProgress !== null
    ? baseSprites.die
    : reloading
      ? sprites.taunt
    : magicStaffMeleeAttacking
      ? sprites.attack4
    : meleeAttacking
      ? sprites.attack2
    : staffCasting
      ? sprites.attack3
    : firearmFiring && !moving
      ? sprites.attack1
      : moving
        ? sprites.run
        : sprites.idle;
  if (!sprite.complete || !sprite.naturalWidth) {
    return;
  }

  const frameSize = 128;
  const directionRows = {
    right: 0,
    downRight: 1,
    down: 2,
    downLeft: 3,
    left: 4,
    upLeft: 5,
    up: 6,
    upRight: 7,
  };
  const resolvedDirection = deathProgress !== null
    ? direction
    : meleeAttacking
    ? getModernCharacterDirection(Math.cos(aimAngle), Math.sin(aimAngle), direction)
    : staffCasting
      ? getModernCharacterDirection(Math.cos(aimAngle), Math.sin(aimAngle), direction)
    : firearmFiring
      ? getModernCharacterDirection(Math.cos(aimAngle), Math.sin(aimAngle), direction)
    : firearmEquipped || reloading
      ? getModernCharacterDirection(Math.cos(aimAngle), Math.sin(aimAngle), direction)
    : moving
      ? getModernCharacterDirection(movementX, movementY, direction)
      : "down";
  const row = directionRows[resolvedDirection] ?? directionRows.down;
  const attackProgress = meleeAttacking ? clamp(1 - swingTimer / swingDuration, 0, 1) : 0;
  const staffCastProgress = staffCasting ? clamp(1 - magicStaffCastTimer / Math.max(0.001, magicStaffCastDuration), 0, 1) : 0;
  const reloadProgress = reloading ? 1 - clamp(reloadTimer / Math.max(0.001, weapons[selectedWeapon]?.reloadTime || 1), 0, 1) : 0;
  const frame = deathProgress !== null
    ? Math.min(14, Math.floor(clamp(deathProgress, 0, 1) * 15))
    : magicStaffMeleeAttacking
      ? Math.min(14, Math.floor(attackProgress * 15))
    : meleeAttacking
    ? Math.min(14, knifeAttackStartFrame + Math.floor(attackProgress * (15 - knifeAttackStartFrame)))
    : staffCasting
      ? Math.min(14, Math.floor(staffCastProgress * 15))
    : firearmFiring && !moving
      ? firearmSheetFlashFrames[Math.min(
        firearmSheetFlashFrames.length - 1,
        Math.floor(
          ((glockShotVisualDuration - glockShotVisualTimer) / glockShotVisualDuration) *
          firearmSheetFlashFrames.length,
        ),
      )]
    : reloading
      ? Math.min(14, Math.floor(reloadProgress * 15))
    : moving
      ? Math.floor(time / (dashing ? 68 : 92)) % 15
      : 0;
  const drawSize = 208;
  const overlaySprite = overlaySprites
    ? reloading
      ? overlaySprites.taunt
      : magicStaffMeleeAttacking
        ? overlaySprites.attack4
      : meleeAttacking
        ? overlaySprites.attack2
      : staffCasting
          ? overlaySprites.attack3
        : firearmSheetFlashActive
          ? moving
            ? (overlaySprites.runAttack?.complete && overlaySprites.runAttack.naturalWidth ? overlaySprites.runAttack : overlaySprites.run)
            : overlaySprites.attack1
          : moving
            ? overlaySprites.run
            : overlaySprites.idle
    : null;
  const overlayFrame = overlaySprite && firearmSheetFlashActive
    ? firearmSheetFlashFrames[Math.min(
      firearmSheetFlashFrames.length - 1,
      Math.floor(
        ((glockShotVisualDuration - glockShotVisualTimer) / firearmSheetFlashDuration) *
        firearmSheetFlashFrames.length,
      ),
    )]
    : frame;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sprite,
    frame * frameSize,
    row * frameSize,
    frameSize,
    frameSize,
    -drawSize / 2,
    -drawSize / 2 - 13,
    drawSize,
    drawSize,
  );
  if (overlaySprite?.complete && overlaySprite.naturalWidth) {
    ctx.drawImage(
      overlaySprite,
      overlayFrame * frameSize,
      row * frameSize,
      frameSize,
      frameSize,
      -drawSize / 2,
      -drawSize / 2 - 13,
      drawSize,
      drawSize,
    );
  }
  ctx.restore();
}

function drawGrenadeModel(x, y, radius, { pinRemoved = false, outline = "#101517", fill = "#4d6542" } = {}) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#252e24";
  ctx.beginPath();
  ctx.roundRect(x - radius * 0.36, y - radius - 5, radius * 0.72, 6, 2);
  ctx.fill();
  if (!pinRemoved) {
    ctx.strokeStyle = "#e2c77c";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x + radius * 0.82, y - radius + 1, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + radius * 0.32, y - radius - 1);
    ctx.lineTo(x - radius * 0.04, y - radius - 4);
    ctx.stroke();
  }
}

function drawGrenadeWeapon(pinRemoved = false) {
  drawGrenadeModel(player.radius + 13, 1, 11, { pinRemoved });
}

function drawEquippedWeaponLayer(selectedWeapon, aimAngle, {
  swingTimer = 0,
  swingDuration = weapons.knife.swingDuration,
  grenadePinned = false,
} = {}) {
  ctx.save();
  ctx.rotate(aimAngle);

  if (selectedWeapon === "bazooka") {
    drawBazookaWeapon();
  } else if (selectedWeapon === "grenade") {
    drawGrenadeWeapon(grenadePinned);
  } else if (selectedWeapon === "magicStaff" && !weaponCharacterSprites.magicStaff?.idle?.complete) {
    drawMagicStaffWeapon();
  }

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

  if (player.staticCollapseHeld && usePurchasedStaticCollapseVfx) {
    const ratio = player.staticCollapseCharging ? clamp(player.staticCollapseCharge / staticCollapseChargeMax, 0, 1) : 0.08;
    const angle = getAimAngle();
    const orbX = player.x + Math.cos(angle) * (player.radius + 90);
    const orbY = player.y + Math.sin(angle) * (player.radius + 90) - 14;
    drawLoopingWorldFlipbookEffect({
      sprite: skillVfxSprites.staticCollapseCharge,
      columns: 3,
      rows: 4,
      x: orbX,
      y: orbY,
      size: 104 + ratio * 52,
      now,
      alpha: 0.78 + ratio * 0.2,
    });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawStaticCollapseOrb(worldToScreenX(orbX), worldToScreenY(orbY), 16 + ratio * 8, ratio);
    ctx.restore();
  }

  // V1 rollback reference: set usePurchasedStaticCollapseVfx to false
  // to render the original procedural charge effect below.
  if (player.staticCollapseHeld && !usePurchasedStaticCollapseVfx) {
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
    if (usePurchasedStaticCollapseVfx) {
      drawLoopingWorldFlipbookEffect({
        sprite: skillVfxSprites.staticCollapseCharge,
        columns: 3,
        rows: 4,
        x: projectile.x,
        y: projectile.y,
        size: projectile.radius * 4.8,
        now,
        alpha: 0.9,
      });
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawStaticCollapseOrb(x, y, projectile.radius, ratio);
      ctx.restore();
      continue;
    }

    // V1 rollback reference: original procedural projectile orb.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawStaticCollapseOrb(x, y, projectile.radius, ratio);
    ctx.restore();
  }

  for (let index = staticCollapseRangeEffects.length - 1; index >= 0; index -= 1) {
    const effect = staticCollapseRangeEffects[index];
    const progress = (now - effect.startedAt) / effect.duration;
    if (progress < 0) {
      continue;
    }
    if (progress >= 1) {
      staticCollapseRangeEffects.splice(index, 1);
      continue;
    }

    const burst = 1 - (1 - progress) ** 3;
    const fade = 1 - progress;
    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const width of [20, 9, 3]) {
      ctx.strokeStyle =
        width === 20 ? `rgba(124, 215, 255, ${fade * 0.42})` :
        width === 9 ? `rgba(245, 253, 255, ${fade * 0.88})` :
        `rgba(141, 244, 223, ${fade})`;
      ctx.lineWidth = width * (1 - burst * 0.35);
      ctx.beginPath();
      ctx.arc(x, y, effect.radius * (0.18 + burst * 0.82), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (let index = staticCollapseEffects.length - 1; index >= 0; index -= 1) {
    const effect = staticCollapseEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    const elapsed = now - effect.startedAt;
    const charge = effect.burstOnly ? 1 : clamp(elapsed / (staticCollapseDelay * 1000), 0, 1);
    const burst = effect.orbOnly
      ? 0
      : effect.burstOnly
        ? clamp(elapsed / 420, 0, 1)
        : clamp((elapsed - staticCollapseDelay * 1000) / 420, 0, 1);
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
        ctx.arc(x, y, effect.radius * (0.18 + burst * 0.82), 0, Math.PI * 2);
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

function drawBazookaEffects() {
  const now = performance.now();
  const renderScale = getWorldRenderScale();

  for (let index = grenadePinEffects.length - 1; index >= 0; index -= 1) {
    const pin = grenadePinEffects[index];
    const progress = clamp((now - pin.startedAt) / pin.duration, 0, 1);
    if (progress >= 1) {
      grenadePinEffects.splice(index, 1);
      continue;
    }
    const travelSeconds = Math.min((now - pin.startedAt) / 1000, 0.34);
    const settle = clamp((progress - 0.44) / 0.2, 0, 1);
    const hop = Math.sin(Math.min(progress * 2.25, 1) * Math.PI) * 16 * (1 - settle);
    const pinX = worldToScreenX(pin.x + pin.vx * travelSeconds);
    const pinY = worldToScreenY(pin.y + pin.vy * travelSeconds) - hop * camera.zoom;
    const fade = clamp((1 - progress) / 0.28, 0, 1);
    ctx.save();
    ctx.translate(pinX, pinY);
    ctx.rotate(pin.rotation + progress * Math.PI * 4.5);
    ctx.scale(renderScale, renderScale * (0.55 + 0.45 * (1 - settle)));
    ctx.strokeStyle = `rgba(216, 191, 124, ${0.92 * fade})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, 1);
    ctx.lineTo(-9, 4);
    ctx.stroke();
    ctx.restore();
  }

  for (let index = bazookaSmokeEffects.length - 1; index >= 0; index -= 1) {
    const smoke = bazookaSmokeEffects[index];
    const progress = clamp((now - smoke.startedAt) / smoke.duration, 0, 1);
    if (progress >= 1) {
      bazookaSmokeEffects.splice(index, 1);
      continue;
    }

    const x = worldToScreenX(smoke.x + smoke.driftX * progress);
    const y = worldToScreenY(smoke.y + smoke.driftY * progress);
    const radius = smoke.radius * (0.8 + progress * 1.45) * renderScale;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.4;
    ctx.fillStyle = "#b9b8ae";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let index = bazookaExplosionEffects.length - 1; index >= 0; index -= 1) {
    const effect = bazookaExplosionEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    if (progress >= 1) {
      bazookaExplosionEffects.splice(index, 1);
      continue;
    }

    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    const burst = 1 - Math.pow(1 - progress, 3);
    const fade = 1 - progress;
    const radius = effect.radius * camera.zoom;

    if (usePurchasedBazookaExplosionVfx) {
      const frameCount = 16;
      const pop = 1 - (1 - progress) ** 3;
      const size = effect.radius * camera.zoom * 2.55 * (0.86 + pop * 0.14);
      ctx.save();
      ctx.translate(x, y);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, fade * 2.4);
      drawFlipbookEffect({
        sprite: bazookaExplosionFire02Sprite,
        columns: 4,
        rows: 4,
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        width: size,
        height: size,
      });
      for (const width of [20, 8, 3]) {
        ctx.strokeStyle =
          width === 20 ? `rgba(68, 48, 34, ${0.42 * fade})` :
          width === 8 ? `rgba(255, 95, 33, ${0.76 * fade})` :
          `rgba(255, 229, 153, ${0.94 * fade})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.arc(0, 0, radius * (0.08 + burst * 0.92), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }

    // V1 rollback reference: set usePurchasedBazookaExplosionVfx to false
    // to render the original procedural bazooka explosion below.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 236, 183, ${0.9 * fade * (1 - Math.min(1, progress * 3))})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.12 + burst * 0.3), 0, Math.PI * 2);
    ctx.fill();

    for (const fireball of effect.fireballs || []) {
      const distance = fireball.distance * burst * camera.zoom;
      const ballX = x + Math.cos(fireball.angle) * distance;
      const ballY = y + Math.sin(fireball.angle) * distance;
      const size = fireball.size * camera.zoom * (0.5 + burst * 0.72);
      ctx.fillStyle = `rgba(255, 88, 26, ${0.52 * fade})`;
      ctx.beginPath();
      ctx.arc(ballX, ballY, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 185, 55, ${0.64 * fade})`;
      ctx.beginPath();
      ctx.arc(ballX - size * 0.14, ballY - size * 0.12, size * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const width of [20, 8, 3]) {
      ctx.strokeStyle =
        width === 20 ? `rgba(68, 48, 34, ${0.42 * fade})` :
        width === 8 ? `rgba(255, 95, 33, ${0.76 * fade})` :
        `rgba(255, 229, 153, ${0.94 * fade})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x, y, radius * (0.08 + burst * 0.92), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const particle of effect.particles) {
      const distance = particle.distance * burst * camera.zoom;
      const px = x + Math.cos(particle.angle) * distance;
      const py = y + Math.sin(particle.angle) * distance;
      ctx.fillStyle = `rgba(255, 139, 44, ${0.72 * fade})`;
      ctx.beginPath();
      ctx.arc(px, py, particle.size * fade, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    for (const chunk of effect.debris || []) {
      const distance = chunk.distance * burst * camera.zoom;
      const chunkX = x + Math.cos(chunk.angle) * distance;
      const chunkY = y + Math.sin(chunk.angle) * distance;
      const length = chunk.length * camera.zoom;
      ctx.save();
      ctx.translate(chunkX, chunkY);
      ctx.rotate(chunk.rotation + progress * 7);
      ctx.fillStyle = `rgba(39, 49, 43, ${0.86 * fade})`;
      ctx.beginPath();
      ctx.moveTo(length * 0.55, 0);
      ctx.lineTo(0, -length * 0.25);
      ctx.lineTo(-length * 0.55, 0);
      ctx.lineTo(0, length * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  for (let index = grenadeExplosionEffects.length - 1; index >= 0; index -= 1) {
    const effect = grenadeExplosionEffects[index];
    const progress = clamp((now - effect.startedAt) / effect.duration, 0, 1);
    if (progress >= 1) {
      grenadeExplosionEffects.splice(index, 1);
      continue;
    }
    const x = worldToScreenX(effect.x);
    const y = worldToScreenY(effect.y);
    const burst = 1 - Math.pow(1 - progress, 3);
    const fade = 1 - progress;
    const radius = effect.radius * camera.zoom;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 206, 97, ${0.34 * fade})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.14 + burst * 0.34), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 139, 48, ${0.86 * fade})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.1 + burst * 0.9), 0, Math.PI * 2);
    ctx.stroke();
    for (const particle of effect.particles) {
      const distance = particle.distance * burst * camera.zoom;
      ctx.fillStyle = `rgba(234, 198, 98, ${0.75 * fade})`;
      ctx.beginPath();
      ctx.arc(x + Math.cos(particle.angle) * distance, y + Math.sin(particle.angle) * distance, particle.size * fade, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    for (const shard of effect.shards || []) {
      const distance = shard.distance * burst * camera.zoom;
      const shardX = x + Math.cos(shard.angle) * distance;
      const shardY = y + Math.sin(shard.angle) * distance;
      const shardLength = shard.length * camera.zoom * (0.92 + fade * 0.16);
      const shardWidth = Math.max(3, shardLength * 0.42);
      ctx.save();
      ctx.translate(shardX, shardY);
      ctx.rotate(shard.rotation + shard.spin * progress);
      ctx.fillStyle = `rgba(77, 87, 84, ${0.94 * fade})`;
      ctx.beginPath();
      ctx.moveTo(shardLength * 0.56, 0);
      ctx.lineTo(0, -shardWidth);
      ctx.lineTo(-shardLength * 0.56, 0);
      ctx.lineTo(0, shardWidth);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(211, 216, 205, ${0.56 * fade})`;
      ctx.lineWidth = Math.max(1, camera.zoom);
      ctx.beginPath();
      ctx.moveTo(-shardLength * 0.2, 0);
      ctx.lineTo(shardLength * 0.34, -shardWidth * 0.24);
      ctx.stroke();
      ctx.restore();
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
  const renderScale = getWorldRenderScale();
  updatePiskelMotionState(player, time, player.vx, player.vy, Math.hypot(player.vx, player.vy));

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(renderScale, renderScale);

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, player.radius + 8, player.radius * 0.92, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  applyDashRollTransform(getDashRollProgress(player.dashVisualTimer), player.spriteDirection);
  /*
   * Previous circular player avatar, retained for rollback:
   * ctx.lineWidth = 5;
   * ctx.fillStyle = "#58a6ff";
   * ctx.strokeStyle = "#1b496f";
   * ctx.beginPath();
   * ctx.arc(0, 0, player.radius + pulse, 0, Math.PI * 2);
   * ctx.fill();
   * ctx.stroke();
   */
  /*
   * Previous generated tactical avatar, retained for rollback:
   * drawTacticalRunnerCharacter({
   *   time,
   *   aimAngle,
   *   speed: Math.hypot(player.vx, player.vy),
   *   dashing: player.dashVisualTimer > 0,
   * });
   */
  /*
   * Previous hand-cut Piskel sprites, retained for rollback:
   * drawPiskelCharacterSprite({
   *   time,
   *   speed: Math.hypot(player.vx, player.vy),
   *   movementX: player.vx,
   *   movementY: player.vy,
   *   dashing: player.dashVisualTimer > 0,
   *   direction: player.spriteDirection,
   *   motionStartedAt: player.spriteMotionStartedAt,
   * });
   */
  drawModernCharacterSprite({
    time,
    speed: Math.hypot(player.vx, player.vy),
    movementX: player.vx,
    movementY: player.vy,
    dashing: player.dashVisualTimer > 0,
    direction: player.spriteDirection,
    characterId: player.characterId,
    selectedWeapon,
    aimAngle,
    swingTimer: selectedWeapon ? player.swingTimer : player.punchTimer,
    swingDuration: selectedWeapon ? player.swingDuration || knifeAttackVisualDuration : weapons.fist.swingDuration,
    glockShotVisualTimer: player.glockShotVisualTimer,
    magicStaffCastTimer: player.magicStaffCastTimer,
    magicStaffCastDuration: player.magicStaffCastDuration,
    reloadTimer: getCurrentReloadTimer(),
  });
  drawEquippedWeaponLayer(selectedWeapon, aimAngle, {
    swingTimer: player.swingTimer,
    swingDuration: weapons.knife.swingDuration,
    grenadePinned: player.grenadePinned,
  });
  ctx.restore();

  if (player.knifeCharging && selectedWeapon === "knife") {
    const chargeRatio = clamp(player.knifeCharge / player.knifeChargeMax, 0, 1);
    ctx.strokeStyle = "rgba(255, 207, 95, 0.86)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio);
    ctx.stroke();
  }

  if (selectedWeapon === "grenade" && player.grenadePinned) {
    const fuseRatio = clamp(player.grenadeFuseTimer / grenadeFuseSeconds, 0, 1);
    ctx.strokeStyle = "rgba(255, 112, 73, 0.92)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fuseRatio);
    ctx.stroke();
  }

  if (selectedWeapon === "grenade" && player.grenadeCharging) {
    const chargeRatio = clamp(player.grenadeCharge / grenadeChargeMax, 0, 1);
    ctx.strokeStyle = "rgba(255, 207, 95, 0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio);
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

  /*
   * Previous circular avatar face, retained for rollback:
   * drawPlayerFace(aimAngle);
   */

  ctx.save();
  ctx.rotate(-camera.rotation);
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

  for (const remote of remotePlayers.values()) {
    if (remote.health <= 0) {
      continue;
    }

    const remoteX = Number.isFinite(remote.renderX) ? remote.renderX : remote.x;
    const remoteY = Number.isFinite(remote.renderY) ? remote.renderY : remote.y;
    if (!Number.isFinite(remoteX) || !Number.isFinite(remoteY)) {
      continue;
    }

    ctx.fillStyle = remote.isBoss ? "#ff2f4f" : "#ff5f7f";
    ctx.strokeStyle = remote.isBoss ? "#ffe1e7" : "#101214";
    ctx.lineWidth = remote.isBoss ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(
      x + clamp(remoteX, 0, world.width) * scale,
      y + clamp(remoteY, 0, world.height) * scale,
      remote.isBoss ? 8 : 4,
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

function drawBossBanner() {
  if (!bossStatus || !gameStarted) {
    return;
  }

  const now = Date.now();
  const bossRemote = [...remotePlayers.values()].find((remote) => remote.isBoss && remote.health > 0);
  const active = bossStatus.phase === "active" || bossRemote;
  const warning = bossStatus.phase === "warning" && !active;
  if (!active && !warning) {
    return;
  }

  const remainingMs = Math.max(0, Number((active ? bossStatus.despawnAt : bossStatus.spawnAt) || 0) - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const title = warning ? "Boss incoming" : "Wizard Boss";
  const subtitle = warning
    ? `Arrives in ${remainingSeconds}s`
    : `Despawn in ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const hpRatio = bossRemote ? clamp((bossRemote.health || 0) / Math.max(1, bossRemote.maxHealth || 1), 0, 1) : 0;

  ctx.save();
  ctx.fillStyle = "rgba(16, 18, 20, 0.82)";
  ctx.strokeStyle = warning ? "rgba(255, 207, 95, 0.72)" : "rgba(255, 95, 127, 0.74)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 180, 24, 360, active ? 62 : 44, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = warning ? "#ffdf86" : "#ff5f7f";
  ctx.font = "900 16px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, width / 2, 40);
  ctx.fillStyle = "#f6f2e9";
  ctx.font = "800 12px Inter, system-ui, sans-serif";
  ctx.fillText(subtitle, width / 2, 58);
  if (active) {
    ctx.fillStyle = "rgba(246, 242, 233, 0.16)";
    ctx.fillRect(width / 2 - 132, 73, 264, 7);
    ctx.fillStyle = "#ff5f7f";
    ctx.fillRect(width / 2 - 132, 73, 264 * hpRatio, 7);
  }
  ctx.restore();
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#182026";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(camera.rotation);
  ctx.translate(-width / 2, -height / 2);
  drawShopArea();
  drawGrid();
  drawWorldBounds();
  drawCrates();
  drawPickups(time);
  drawBullets();
  drawRemoteBullets();
  drawCorpses(time);
  drawDashDustEffects();
  drawWalkingDustEffects();
  drawRemotePlayers(time);
  drawTeleportEffects();
  drawLightningEffects();
  drawRailburstEffects();
  drawAreaSkillEffects();
  drawSkillVfxOverlays();
  drawWizardPoisonSlashEffects();
  drawBazookaEffects();
  if (!deathPending) {
    drawPlayer(time);
  }
  drawBloodDropEffects();
  // Previous standalone muzzle flash VFX kept for rollback; gun sheets now provide the flash frame.
  // drawMuzzleFlashEffects();
  ctx.restore();
  drawVignette();
  drawMinimap();
  drawBossBanner();

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

  const startCharacterId = selectedCharacterId;
  resetGameState();
  player.name = nicknameInput.value.trim() || "Player";
  await loadCharacterProfile();
  setSelectedCharacter(startCharacterId);
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
  setSelectedCharacter(selectedCharacterId);
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

  if (player.testMode && ["1", "2", "3", "4", "5", "6"].includes(event.key)) {
    selectTestModeWeapon(Number(event.key));
    return;
  }

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

  if (event.key.toLowerCase() === "z") {
    useEquippedSkill("z");
    return;
  }

  if (event.key.toLowerCase() === "x") {
    useEquippedSkill("x");
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
    } else if (weapons.slots[weapons.selectedSlot] === "awm") {
      mouse.rightDown = true;
    } else if (weapons.slots[weapons.selectedSlot] === "magicStaff") {
      fireMagicStaffProjectile();
    } else if (weapons.slots[weapons.selectedSlot] === "grenade") {
      armGrenade();
    }

    return;
  }

  if (event.button === 0) {
    if (player.staticCollapseHeld) {
      startStaticCollapseCharge();
      return;
    }
    if (weapons.slots[weapons.selectedSlot] === "grenade") {
      const grenade = weapons.grenade;
      if (grenade.count > 0) {
        player.grenadeCharging = true;
        player.grenadeCharge = 0;
      }
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
    if (weapons.slots[weapons.selectedSlot] === "knife") {
      throwKnife();
    }
    return;
  }

  if (event.button === 0) {
    if (player.staticCollapseHeld && player.staticCollapseCharging) {
      releaseStaticCollapse();
      return;
    }
    if (player.grenadeCharging) {
      if (!player.grenadePinned && !armGrenade()) {
        player.grenadeCharging = false;
        player.grenadeCharge = 0;
        return;
      }
      throwGrenade();
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
  player.grenadeCharging = false;
  player.grenadeCharge = 0;
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
document.addEventListener("pointermove", updateInfoTooltip);
document.addEventListener("pointerleave", hideInfoTooltip);
document.addEventListener("pointerdown", hideInfoTooltip);
document.addEventListener("scroll", hideInfoTooltip, true);

initAccountSystem();
initCharacterSelect();
resize();
document.body.classList.add("game-pending");
createCrates();
updateInventory();
updateXpHud();
updateCoinHud();
updateSkillHud();
updateUpgradePanel();
requestAnimationFrame(tick);
