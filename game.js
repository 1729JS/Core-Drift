const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const startButton = document.querySelector("#startButton");
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
const leaderboard = document.querySelector("#leaderboard");
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

const world = {
  width: 8800,
  height: 8800,
};

const maxCrates = 40;
const maxMetalCrates = 20;
const maxGoldCrates = 10;
const crateRespawnSeconds = 5;
const corpseLifetime = 500;
const pickupLifetimeMs = 5 * 60 * 1000;
const knifeSwapCooldownSeconds = 5;
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
const magnetRange = 230;
const magnetSpeed = 780;
const shopPrices = {
  knife: { buy: 50, sell: 25 },
  glock: { buy: 250, sell: 100 },
  awm: { buy: 700, sell: 300 },
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
const basicCrateHealth = 150;
const metalCrateHealth = 500;
const goldCrateHealth = 1000;
const coinValues = {
  bronze: 5,
  silver: 10,
  gold: 100,
};
const upgradeSteps = {
  speed: { maxSpeed: 35, acceleration: 90 },
  dash: { dashSpeed: 90 },
  health: { maxHealth: 25 },
  heal: { healAmount: 15 },
  damage: { damageMultiplier: 0.1 },
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
    damage: 0,
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
    arc: Math.PI * 0.72,
    swingDuration: 0.18,
    count: 1,
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
  },
};

const camera = {
  x: player.x,
  y: player.y,
  smoothing: 0.12,
};

const keys = new Set();
const bullets = [];
const crates = [];
const pickups = [];
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
let draggedSlot = null;
let gameStarted = false;
let deathPending = false;
let localDeathTimeout = null;
let socket = null;
let localClientId = null;
let lastNetworkSend = 0;
let sharedWorldActive = false;
let nextLocalBulletId = 1;
let shopToastTimer = 0;

const remotePlayers = new Map();
const remoteBullets = [];
const corpses = [];
const teleportEffects = [];

function getCrateCount(kind) {
  return crates.filter((crate) => (crate.kind || "basic") === kind).length;
}

function spawnCrate(kind = "basic") {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const isMetal = kind === "metal";
    const isGold = kind === "gold";
    const size = isMetal || isGold ? 58 + Math.random() * 18 : 46 + Math.random() * 18;
    const x = size + Math.random() * (world.width - size * 2);
    const y = size + Math.random() * (world.height - size * 2);
    const distanceFromPlayer = Math.hypot(x - player.x, y - player.y);

    if (distanceFromPlayer < 280) {
      continue;
    }

    crates.push({
      x,
      y,
      size,
      kind,
      rotation: Math.random() * Math.PI * 2,
      hp: isGold ? goldCrateHealth : isMetal ? metalCrateHealth : basicCrateHealth,
      maxHp: isGold ? goldCrateHealth : isMetal ? metalCrateHealth : basicCrateHealth,
    });
    return true;
  }

  return false;
}

function createCrates() {
  crates.length = 0;

  while (getCrateCount("basic") < maxCrates) {
    spawnCrate("basic");
  }

  while (getCrateCount("metal") < maxMetalCrates) {
    spawnCrate("metal");
  }

  while (getCrateCount("gold") < maxGoldCrates) {
    spawnCrate("gold");
  }
}

function resetGameState() {
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
    damage: 0,
  };
  player.hurtTimer = 0;
  player.shotTimer = 0;
  player.swingTimer = 0;
  player.punchTimer = 0;
  player.knifeCharge = 0;
  player.knifeCharging = false;

  camera.x = player.x;
  camera.y = player.y;
  bullets.length = 0;
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
  weapons.glock.ammo = 0;
  weapons.glock.magAmmo = 0;
  weapons.glock.reloadTimer = 0;
  weapons.awm.ammo = 0;
  weapons.awm.magAmmo = 0;
  weapons.awm.reloadTimer = 0;

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
  updateSkillHud();
  updateUpgradePanel();
}

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;

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
  const half = box.size / 2;
  const closestX = clamp(circle.x, box.x - half, box.x + half);
  const closestY = clamp(circle.y, box.y - half, box.y + half);
  return Math.hypot(circle.x - closestX, circle.y - closestY) <= circle.radius;
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
  const half = box.size / 2 + radius;
  const minX = box.x - half;
  const maxX = box.x + half;
  const minY = box.y - half;
  const maxY = box.y + half;
  const dx = x2 - x1;
  const dy = y2 - y1;
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

  return clip(x1, dx, minX, maxX) && clip(y1, dy, minY, maxY);
}

function getBoxHitPoint(circle, box) {
  const half = box.size / 2;

  return {
    x: clamp(circle.x, box.x - half, box.x + half),
    y: clamp(circle.y, box.y - half, box.y + half),
  };
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

function getScaledDamage(baseDamage) {
  return Math.max(1, Math.round(baseDamage * player.damageMultiplier));
}

function getDeathXpDrop() {
  return Math.max(25, Math.round(player.level * 28 + player.xp * 0.35));
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

  if (step.healAmount) {
    player.healAmount += step.healAmount;
  }

  if (step.damageMultiplier) {
    player.damageMultiplier = Number((player.damageMultiplier + step.damageMultiplier).toFixed(2));
  }

  updateXpHud();
  updateUpgradePanel();
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
    .slice(0, 5);

  leaderboard.innerHTML = `<div class="leaderboard-title">XP Ranking</div>${rows
    .map((row, index) => `<div class="leaderboard-row"><span>${index + 1}. ${escapeHtml(row.name)}</span><b>${Math.floor(row.score)}</b></div>`)
    .join("")}`;
}

function updateSkillHud() {
  if (!knifeSwapSkill || !knifeSwapCooldown) {
    return;
  }

  const ready = player.knifeSwapTimer <= 0;
  knifeSwapSkill.classList.toggle("ready", ready);
  knifeSwapCooldown.textContent = ready ? "" : Math.ceil(player.knifeSwapTimer);
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
  updateShopHud();
  setShopMessage("사고 팔 아이템을 선택하세요.");
}

function closeShop() {
  shopPanel?.classList.add("hidden");
}

function isShopOpen() {
  return Boolean(shopPanel && !shopPanel.classList.contains("hidden"));
}

function setShopMessage(text) {
  if (shopMessage) {
    shopMessage.textContent = text;
  }
}

function buyShopItem(item) {
  const price = shopPrices[item]?.buy;

  if (!price || player.coins < price) {
    setShopMessage("코인이 부족합니다.");
    return;
  }

  const pickup =
    item === "knife"
      ? { type: "knife", count: 1 }
      : { type: item, ammo: weapons[item].magazineSize, magAmmo: 0 };

  if (!addWeaponToInventory(pickup)) {
    setShopMessage("아이템 창이 가득 찼습니다.");
    return;
  }

  player.coins -= price;
  updateInventory();
  updateCoinHud();
  updateShopHud();
  setShopMessage(`${getWeaponDisplay(item).label} 구매 완료`);
}

function sellShopItem(item) {
  const price = shopPrices[item]?.sell;

  if (!price || ![1, 2, 3].find((slot) => weapons.slots[slot] === item)) {
    setShopMessage("판매할 아이템이 없습니다.");
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
    const slot = [1, 2, 3].find((candidate) => weapons.slots[candidate] === item);
    if (slot) weapons.slots[slot] = null;
    weapons[item].ammo = 0;
    weapons[item].magAmmo = 0;
    weapons[item].reloadTimer = 0;
  }

  if (!weapons.slots[weapons.selectedSlot]) {
    weapons.selectedSlot = [1, 2, 3].find((slot) => weapons.slots[slot]) || weapons.selectedSlot;
  }

  player.coins += price;
  updateInventory();
  updateCoinHud();
  updateShopHud();
  setShopMessage(`${getWeaponDisplay(item).label} 판매 완료`);
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

function damageCrate(index, damage) {
  const crate = crates[index];
  const destroyed = crate && crate.hp - damage <= 0;

  if (sharedWorldActive && crate?.id) {
    sendNetwork("crateDamage", { id: crate.id, damage });
    crate.hp -= damage;

    if (crate.hp <= 0) {
      crates.splice(index, 1);
    }

    return true;
  }

  crate.hp -= damage;

  if (crate.hp <= 0) {
    if ((crate.kind || "basic") === "metal") {
      spawnPickup(crate.x, crate.y);
      spawnPickup(crate.x + 28, crate.y - 20, "xp", { value: metalCrateXpValue });
      spawnPickup(crate.x - 28, crate.y + 20, "coin", { coinKind: "silver", value: coinValues.silver });
    } else if ((crate.kind || "basic") === "gold") {
      spawnPickup(crate.x, crate.y);
      spawnPickup(crate.x + 30, crate.y - 22, "xp", { value: goldCrateXpValue });
      spawnPickup(crate.x - 30, crate.y + 22, "coin", { coinKind: "gold", value: coinValues.gold });
    } else {
      spawnPickup(crate.x, crate.y);
      spawnPickup(crate.x + 26, crate.y - 18, "xp", { value: xpDropValue });
      spawnPickup(crate.x - 26, crate.y + 18, "coin", { coinKind: "bronze", value: coinValues.bronze });
    }
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
  dropAllLoot(player.x, player.y);
  sendNetwork("dead", {});

  localDeathTimeout = setTimeout(() => {
    localDeathTimeout = null;
    showStartScreen();
    resetGameState();
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
    sendNetwork("pickupRequest", { id: pickup.id });
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

function playGunSound(weaponName) {
  if (weaponName === "awm") {
    playNoise({ duration: 0.18, gain: 0.16, filterFrequency: 420 });
    playTone({ frequency: 85, duration: 0.2, type: "sawtooth", gain: 0.12 });
    playTone({ frequency: 48, duration: 0.22, type: "sine", gain: 0.1, when: 0.03 });
  } else {
    playNoise({ duration: 0.08, gain: 0.11, filterFrequency: 1050 });
    playTone({ frequency: 155, duration: 0.08, type: "square", gain: 0.055 });
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
  } else {
    sellShopItem(button.dataset.item);
  }
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
        pickups.splice(0, pickups.length, ...message.world.pickups);
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
      pickups.splice(0, pickups.length, ...message.world.pickups);
    } else if (message.type === "effect") {
      playEffect(message.effect);
    } else if (message.type === "teleport") {
      addTeleportEffect(player.x, player.y);
      addTeleportEffect(message.x, message.y);
      player.x = message.x;
      player.y = message.y;
      player.knifeSwapTimer = knifeSwapCooldownSeconds;
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
      player.health = message.health;
      player.shield = message.shield;
      if (message.knockback) {
        player.vx += message.knockback.vx;
        player.vy += message.knockback.vy;
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

function setRemotePlayerState(id, state) {
  const previous = remotePlayers.get(id);

  remotePlayers.set(id, {
    ...state,
    renderX: previous?.renderX ?? state.x,
    renderY: previous?.renderY ?? state.y,
    renderAimAngle: previous?.renderAimAngle ?? state.aimAngle ?? 0,
  });
}

function sendNetwork(type, payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, ...payload }));
  }
}

function swapWithThrownKnife() {
  if (player.knifeSwapTimer > 0) {
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
  player.knifeSwapTimer = knifeSwapCooldownSeconds;
  addTeleportEffect(previousPlayerX, previousPlayerY);
  addTeleportEffect(player.x, player.y);
  sendNetwork("knifeSwap", { bulletId: knife.id });
  sendNetwork("state", { state: getPlayerSnapshot() });
  return true;
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
  return x + camera.x - width / 2;
}

function screenToWorldY(y) {
  return y + camera.y - height / 2;
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

function startReload(weaponName = weapons.slots[weapons.selectedSlot]) {
  if (weaponName !== "glock" && weaponName !== "awm") {
    return false;
  }

  const weapon = weapons[weaponName];

  if (weapon.reloadTimer > 0 || weapon.ammo <= 0 || weapon.magAmmo >= weapon.magazineSize) {
    return false;
  }

  weapon.reloadTimer = weapon.reloadTime;
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

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.hypot(crate.x - player.x, crate.y - player.y);

    if (distance > knife.range + crate.size / 2) {
      continue;
    }

    const targetAngle = Math.atan2(crate.y - player.y, crate.x - player.x);
    const angleDiff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));

    if (Math.abs(angleDiff) <= knife.arc / 2) {
      damageCrate(index, getScaledDamage(knife.damage));
      hitSomething = true;
    }
  }

  player.swingTimer = knife.swingDuration;
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

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.hypot(crate.x - player.x, crate.y - player.y);

    if (distance > fist.range + crate.size / 2) {
      continue;
    }

    const targetAngle = Math.atan2(crate.y - player.y, crate.x - player.x);
    const angleDiff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));

    if (Math.abs(angleDiff) <= fist.arc / 2) {
      damageCrate(index, getScaledDamage(fist.damage));
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
  const speed = 360 + chargeRatio * 620;
  const damage = getScaledDamage(Math.round(weapons.knife.damage + (200 - weapons.knife.damage) * chargeRatio));

  const bullet = {
    id: `${localClientId || "local"}-${nextLocalBulletId++}`,
    x: player.x + Math.cos(angle) * (player.radius + 18),
    y: player.y + Math.sin(angle) * (player.radius + 18),
    vx: Math.cos(angle) * speed + player.vx * 0.12,
    vy: Math.sin(angle) * speed + player.vy * 0.12,
    radius: 10,
    life: 0.28 + chargeRatio * 0.46,
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
  player.dashTimer = player.dashCooldown;
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
  shopToastTimer = Math.max(0, shopToastTimer - delta);

  if (player.dashActiveTimer <= 0) {
    const drag = Math.exp(-player.friction * delta);
    player.vx *= drag;
    player.vy *= drag;
  }

  const nextSpeed = Math.hypot(player.vx, player.vy);
  if (player.dashActiveTimer <= 0 && nextSpeed > player.maxSpeed) {
    player.vx = (player.vx / nextSpeed) * player.maxSpeed;
    player.vy = (player.vy / nextSpeed) * player.maxSpeed;
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
        } else {
          crate.hp -= absorbed;
          if (crate.hp <= 0) {
            crates.splice(crateIndex, 1);
          }
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

    if (bulletSpent || expired) {
      bullets.splice(index, 1);
    }
  }

  for (let index = remoteBullets.length - 1; index >= 0; index -= 1) {
    const bullet = remoteBullets[index];
    const previousX = bullet.x;
    const previousY = bullet.y;
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

    if (distanceToPickup <= magnetRange && distanceToPickup > pickup.radius + player.radius && canMagnetPickup(pickup)) {
      const pull = Math.min(distanceToPickup, magnetSpeed * delta);
      pickup.x += ((player.x - pickup.x) / distanceToPickup) * pull;
      pickup.y += ((player.y - pickup.y) / distanceToPickup) * pull;
    }

    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) <= pickup.radius + player.radius) {
      collectPickup(index);
    }
  }

  crateRegenTimer -= delta;

  if (!sharedWorldActive && crateRegenTimer <= 0) {
    if (getCrateCount("basic") < maxCrates) {
      spawnCrate("basic");
    }

    if (getCrateCount("metal") < maxMetalCrates) {
      spawnCrate("metal");
    }

    if (getCrateCount("gold") < maxGoldCrates) {
      spawnCrate("gold");
    }

    crateRegenTimer = crateRespawnSeconds;
  }

  camera.x += (player.x - camera.x) * camera.smoothing;
  camera.y += (player.y - camera.y) * camera.smoothing;

  lastNetworkSend -= delta;

  if (lastNetworkSend <= 0) {
    sendNetwork("state", { state: getPlayerSnapshot() });
    lastNetworkSend = 0.033;
  }

  coords.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
  healthStatus.textContent = `HP ${Math.ceil(player.health)} / ${player.maxHealth} | SH ${Math.ceil(player.shield)}`;
  healthBarFill.style.width = `${clamp(player.health / player.maxHealth, 0, 1) * 100}%`;
  updateXpHud();
  updateCoinHud();
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
    slot.draggable = Boolean(weaponName);
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

function dropSelectedWeapon() {
  const selectedWeapon = weapons.slots[weapons.selectedSlot];

  if (!selectedWeapon) {
    return;
  }

  const angle = getAimAngle();
  const dropX = player.x + Math.cos(angle) * 64;
  const dropY = player.y + Math.sin(angle) * 64;

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

  dropPickupAt(x + 18, y - 42, { type: "xp", value: getDeathXpDrop() });
}

function worldToScreenX(x) {
  return x - camera.x + width / 2;
}

function worldToScreenY(y) {
  return y - camera.y + height / 2;
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
  const startX = Math.floor((camera.x - width / 2) / gridSize) * gridSize;
  const endX = camera.x + width / 2 + gridSize;
  const startY = Math.floor((camera.y - height / 2) / gridSize) * gridSize;
  const endY = camera.y + height / 2 + gridSize;

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
  const x = worldToScreenX(0);
  const y = worldToScreenY(0);
  const doorTop = worldToScreenY(shopDoor.y - shopDoor.height / 2);
  const doorBottom = worldToScreenY(shopDoor.y + shopDoor.height / 2);

  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(255, 95, 95, 0.72)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + world.width, y);
  ctx.lineTo(x + world.width, y + world.height);
  ctx.lineTo(x, y + world.height);
  ctx.lineTo(x, doorBottom);
  ctx.moveTo(x, doorTop);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 95, 95, 0.18)";
  ctx.strokeStyle = "#ffcf5f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x - 16, doorTop, 32, doorBottom - doorTop, 8);
  ctx.fill();
  ctx.stroke();

  if (isNearShopDoor()) {
    drawWorldPrompt(shopDoor.x + (player.x < 0 ? -90 : 90), shopDoor.y - shopDoor.height / 2 - 42, "K: 이동");
  }
}

function drawTreasureCrate(half, kind) {
  const isGold = kind === "gold";
  const bodyGradient = ctx.createLinearGradient(-half, -half * 0.15, half, half);
  bodyGradient.addColorStop(0, isGold ? "#b88c25" : "#6e7880");
  bodyGradient.addColorStop(0.45, isGold ? "#8b1d19" : "#444d55");
  bodyGradient.addColorStop(1, isGold ? "#41100d" : "#1d242a");
  const lidGradient = ctx.createLinearGradient(0, -half, 0, half * 0.1);
  lidGradient.addColorStop(0, isGold ? "#f4d05f" : "#bec6cc");
  lidGradient.addColorStop(0.34, isGold ? "#a62c24" : "#79838b");
  lidGradient.addColorStop(1, isGold ? "#58130f" : "#30383f");
  const trim = isGold ? "#f3ca54" : "#141c22";
  const trimLight = isGold ? "#fff0a8" : "#9aa4aa";
  const stroke = isGold ? "#4d2c06" : "#11171c";

  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-half, -half * 0.12, half * 2, half * 1.18, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = lidGradient;
  ctx.beginPath();
  ctx.moveTo(-half, -half * 0.12);
  ctx.quadraticCurveTo(-half * 0.72, -half * 0.92, 0, -half * 0.94);
  ctx.quadraticCurveTo(half * 0.72, -half * 0.92, half, -half * 0.12);
  ctx.lineTo(half, half * 0.1);
  ctx.lineTo(-half, half * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = trim;
  ctx.lineWidth = 7;
  for (const stripeX of [-half * 0.58, half * 0.58]) {
    ctx.beginPath();
    ctx.moveTo(stripeX, -half * 0.82);
    ctx.lineTo(stripeX, half * 1.02);
    ctx.stroke();
  }

  ctx.strokeStyle = trim;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-half, half * 0.12);
  ctx.lineTo(half, half * 0.12);
  ctx.stroke();

  ctx.fillStyle = trimLight;
  for (const rivetX of [-half + 10, -half * 0.58, 0, half * 0.58, half - 10]) {
    for (const rivetY of [-half * 0.52, half * 0.58]) {
      ctx.beginPath();
      ctx.arc(rivetX, rivetY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = isGold ? "#e5b43f" : "#5b6269";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-13, -2, 26, 31, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = isGold ? "#5e230c" : "#12181d";
  ctx.beginPath();
  ctx.arc(0, 11, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-2, 11, 4, 10);

  ctx.strokeStyle = isGold ? "rgba(255, 240, 168, 0.32)" : "rgba(238, 244, 246, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-half + 9, -half * 0.42);
  ctx.lineTo(half - 11, -half * 0.54);
  ctx.moveTo(-half + 10, half * 0.54);
  ctx.lineTo(half - 12, half * 0.43);
  ctx.stroke();
}

function drawCrates() {
  for (const crate of crates) {
    const x = worldToScreenX(crate.x);
    const y = worldToScreenY(crate.y);
    const half = crate.size / 2;

    if (x < -80 || x > width + 80 || y < -80 || y > height + 80) {
      continue;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(crate.rotation);

    if ((crate.kind || "basic") === "metal" || (crate.kind || "basic") === "gold") {
      drawTreasureCrate(half, crate.kind || "basic");
    } else {
      ctx.fillStyle = "#b77a3d";
      ctx.strokeStyle = "#5b3725";
      ctx.lineWidth = 4;
      ctx.fillRect(-half, -half, crate.size, crate.size);
      ctx.strokeRect(-half, -half, crate.size, crate.size);

      ctx.strokeStyle = "rgba(255, 223, 134, 0.76)";
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
  }
}

function drawPickups(time) {
  for (const pickup of pickups) {
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
      const pulse = 1 + Math.sin(time * 0.01 + pickup.bob) * 0.08;
      const isGoldXp = value >= goldCrateXpValue;
      const isMetalXp = value >= metalCrateXpValue && !isGoldXp;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = isGoldXp || isMetalXp ? "#ffcf5f" : "#1db9d8";
      ctx.strokeStyle = isGoldXp ? "#fff0a8" : "#8df4df";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, isGoldXp ? 13 : isMetalXp ? 10 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isGoldXp || isMetalXp ? "rgba(255, 255, 255, 0.76)" : "rgba(221, 255, 229, 0.78)";
      ctx.beginPath();
      ctx.arc(-4, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isGoldXp
        ? "rgba(255, 240, 168, 0.5)"
        : isMetalXp
          ? "rgba(141, 244, 223, 0.36)"
          : "rgba(141, 244, 223, 0.38)";
      ctx.beginPath();
      ctx.arc(4, 3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (pickup.type === "coin") {
      const coinKind = pickup.coinKind || "bronze";
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

    const hpRatio = Math.max(0, remote.health / remote.maxHealth);
    ctx.fillStyle = "rgba(16, 18, 20, 0.72)";
    ctx.fillRect(-22, player.radius + 15, 44, 5);
    ctx.fillStyle = hpRatio > 0.4 ? "#8df4df" : "#ff9cb5";
    ctx.fillRect(-22, player.radius + 15, 44 * hpRatio, 5);
    ctx.restore();
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

  ctx.restore();
}

function drawMinimap() {
  const mapSize = Math.min(180, Math.max(126, Math.floor(width * 0.18)));
  const padding = 18;
  const x = width - mapSize - padding;
  const y = height - mapSize - padding;
  const scale = mapSize / world.width;
  const viewW = width * scale;
  const viewH = height * scale;

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
  ctx.strokeRect(x + (camera.x - width / 2) * scale, y + (camera.y - height / 2) * scale, viewW, viewH);

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

function startGame() {
  if (gameStarted) {
    return;
  }

  resetGameState();
  gameStarted = true;
  player.name = nicknameInput.value.trim() || "Player";
  connectMultiplayer();
  sendNetwork("respawn", { state: getPlayerSnapshot() });
  lastTime = performance.now();
  document.body.classList.remove("game-pending");
  startScreen.classList.add("hidden");
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

window.addEventListener("resize", resize);
startButton.addEventListener("click", startGame);
window.addEventListener("keydown", (event) => {
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

  if (event.key.toLowerCase() === "r") {
    startReload();
    return;
  }

  if (event.key.toLowerCase() === "f") {
    swapWithThrownKnife();
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
    mouse.down = false;
  }
});
window.addEventListener("blur", () => {
  mouse.down = false;
  mouse.rightDown = false;
  player.knifeCharging = false;
  player.knifeCharge = 0;
  keys.clear();
});
window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
for (const slot of inventorySlots) {
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
  slot.addEventListener("click", () => {
    selectWeapon(Number(slot.dataset.slot));
  });
  slot.addEventListener("dragstart", (event) => {
    draggedSlot = Number(slot.dataset.slot);
    slot.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedSlot));
  });
  slot.addEventListener("dragover", (event) => {
    event.preventDefault();
    slot.classList.add("drop-target");
    event.dataTransfer.dropEffect = "move";
  });
  slot.addEventListener("dragleave", () => {
    slot.classList.remove("drop-target");
  });
  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    const fromSlot = draggedSlot || Number(event.dataTransfer.getData("text/plain"));
    const toSlot = Number(slot.dataset.slot);
    swapSlots(fromSlot, toSlot);
    slot.classList.remove("drop-target");
  });
  slot.addEventListener("dragend", () => {
    draggedSlot = null;

    for (const inventorySlot of inventorySlots) {
      inventorySlot.classList.remove("dragging", "drop-target");
    }
  });
}

for (const button of upgradeButtons) {
  button.addEventListener("click", () => {
    applyUpgrade(button.dataset.upgrade);
  });
}

resize();
document.body.classList.add("game-pending");
createCrates();
updateInventory();
updateXpHud();
updateCoinHud();
updateSkillHud();
updateUpgradePanel();
requestAnimationFrame(tick);
