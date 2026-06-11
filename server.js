const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const sessionSecret = process.env.SESSION_SECRET || "core-drift-dev-session-secret";
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const clients = new Map();
const world = { width: 12000, height: 12000 };
const testAiCount = 2;
const testAiRespawnMs = 2500;
const testAiNames = ["Bolt", "Echo", "Nova", "Rift", "Vex", "Juno", "Kite", "Flux", "Aero", "Nyx"];
const wizardBossId = "wizard-boss";
const wizardBossSpawnIntervalMs = 10 * 60 * 1000;
const wizardBossWarningMs = 10 * 1000;
const wizardBossDespawnMs = 4 * 60 * 1000;
const wizardBossPoisonSlashRange = 260;
const wizardBossPoisonSlashCooldown = 1.35;
const wizardBossToxicOrbWindupSeconds = 0.85;
const wizardBossToxicOrbCooldown = 4.8;
const wizardBossToxicOrbCount = 10;
const serverStartedAt = Date.now();
const aiWeaponProfiles = {
  glock: { damage: 50, bulletSpeed: 880, fireRate: 0.9, bulletRadius: 7, bulletLife: 1.2, idealRange: 410, maxRange: 780 },
  awm: { damage: 100, bulletSpeed: 1500, fireRate: 1.05, bulletRadius: 5, bulletLife: 4, idealRange: 690, maxRange: 1300 },
  bazooka: { damage: 170, bulletSpeed: 540, fireRate: 1.15, bulletRadius: 11, bulletLife: 3.2, idealRange: 520, maxRange: 920, explosionRadius: 156 },
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
const crateHitboxScale = 0.78;
const crateRespawnMs = 5000;
const railburstRange = 1500;
const railburstMaxDamage = 260;
const staticCollapseDelayMs = 800;
const staticCollapseMaxRadius = 320;
const staticCollapseProjectileSpeed = 760;
const arcPrisonEdgeWidth = 7;
const arcPrisonSlowMs = 1600;
const areaSkillMaxDamage = 180;
const bazookaExplosionRadius = 156;
const grenadeExplosionRadius = 132;
const grenadeBounceRetention = 0.5;
const grenadeRollDrag = 2.15;
const grenadeFuseSeconds = 4;
const grenadeGravity = 920;
const grenadeFirstGroundBounceRetention = 0.5;
const grenadeGroundBounceRetention = 0.32;
const xpDropValue = 38;
const metalCrateXpValue = 125;
const goldCrateXpValue = 350;
const novaXpValue = 1000;
const astralXpValue = 2500;
const pickupLifetimeMs = 5 * 60 * 1000;
const defaultPlayerHealth = 200;
const coinValues = {
  bronze: 5,
  silver: 10,
  gold: 100,
  bill: 1000,
  bigBill: 10000,
};
const crates = [];
const pickups = [];
const bullets = [];
const staticCollapseProjectiles = [];
const handledDropIds = new Set();
let nextEntityId = 1;
let lastTick = Date.now();
let aiBroadcastTimer = 0;
let testAiEnabled = true;
let nextWizardBossSpawnAt = Date.now();
let wizardBossWarningSent = false;
let wizardBossBroadcastTimer = 0;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const hasDatabase = Boolean(supabaseUrl && supabaseServiceKey);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerpAngle(current, target, amount) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * amount;
}

function sanitizeMagicStaffTarget(value, max) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, max) : null;
}

function steerMagicStaffBullet(bullet, delta) {
  if (bullet.weapon !== "magicStaff" || !bullet.followMouse) {
    return;
  }

  const targetX = sanitizeMagicStaffTarget(bullet.targetX, world.width);
  const targetY = sanitizeMagicStaffTarget(bullet.targetY, world.height);
  if (targetX === null || targetY === null) {
    return;
  }

  const desiredAngle = Math.atan2(targetY - bullet.y, targetX - bullet.x);
  const currentAngle = Math.atan2(bullet.vy || 0, bullet.vx || 0);
  const turnRate = clamp(Number(bullet.turnRate || 7.8), 0.5, 14);
  const angleDiff = Math.atan2(Math.sin(desiredAngle - currentAngle), Math.cos(desiredAngle - currentAngle));
  const nextAngle = currentAngle + clamp(angleDiff, -turnRate * delta, turnRate * delta);
  const speed = clamp(Number(bullet.speed || Math.hypot(bullet.vx || 0, bullet.vy || 0) || 660), 120, 920);

  bullet.vx = Math.cos(nextAngle) * speed;
  bullet.vy = Math.sin(nextAngle) * speed;
  bullet.angle = nextAngle;
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

    crates.push({
      id: nextEntityId++,
      x,
      y,
      size,
      hitboxSize: tier.hitboxSize,
      kind,
      rotation: Math.random() * Math.PI * 2,
      hp: tier.health,
      maxHp: tier.health,
    });
    return;
  }
}

function createAiState(index) {
  const angle = (Math.PI * 2 * index) / testAiCount;
  const distance = 1450 + (index % 5) * 260;
  const x = clamp(world.width / 2 + Math.cos(angle) * distance, 80, world.width - 80);
  const y = clamp(world.height / 2 + Math.sin(angle) * distance, 80, world.height - 80);

  return {
    x,
    y,
    name: `AI ${testAiNames[index % testAiNames.length]}`,
    health: defaultPlayerHealth,
    maxHealth: defaultPlayerHealth,
    shield: 0,
    maxShield: 125,
    healAmount: 60,
    level: 1,
    xp: 0,
    xpToNext: 100,
    coins: 0,
    totalXp: 100 + index * 25,
    upgradePoints: 0,
    damageMultiplier: 1,
    upgrades: {},
    inventory: { slots: { 1: "knife", 2: "glock", 3: null }, knife: { count: 1 }, glock: { ammo: 51, magAmmo: 17 }, awm: { ammo: 0, magAmmo: 0 }, bazooka: { ammo: 0, magAmmo: 0 }, grenade: { count: 0 } },
    selectedWeapon: "glock",
    aimAngle: angle + Math.PI,
    swingTimer: 0,
    swingDuration: 0.18,
    punchTimer: 0,
    punchDuration: 0.16,
    knifeCharging: false,
    knifeCharge: 0,
  };
}

function ensureTestAiBots() {
  for (let index = 0; index < testAiCount; index += 1) {
    const id = `test-ai-${index + 1}`;

    if (clients.has(id)) {
      continue;
    }

    clients.set(id, {
      socket: null,
      isBot: true,
      state: createAiState(index),
      ai: {
        index,
        angle: Math.random() * Math.PI * 2,
        turnTimer: 0.4 + Math.random() * 1.3,
        strafeDirection: Math.random() < 0.5 ? -1 : 1,
        fireTimer: 0.35 + Math.random() * 0.4,
        meleeTimer: 0,
        reloadTimer: 0,
        respawnAt: 0,
      },
    });
  }
}

function removeTestAiBots() {
  for (const [id, client] of clients) {
    if (!client.isBot) {
      continue;
    }

    clients.delete(id);
    broadcast({ type: "leave", id });
  }
}

function setTestAiEnabled(enabled) {
  testAiEnabled = Boolean(enabled);

  if (!testAiEnabled) {
    removeTestAiBots();
    return;
  }

  ensureTestAiBots();
  for (const [id, client] of clients) {
    if (client.isBot && client.state && client.state.health > 0) {
      broadcast({ type: "state", id, state: client.state }, id);
    }
  }
}

function getNearestHumanClient(state) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const [id, client] of clients) {
    if (client.isBot || !client.state || client.state.health <= 0) {
      continue;
    }

    const distance = Math.hypot(client.state.x - state.x, client.state.y - state.y);

    if (distance < nearestDistance) {
      nearest = { id, client, distance };
      nearestDistance = distance;
    }
  }

  return nearest;
}

function getNearestAiCrate(state, maxDistance = Infinity) {
  let nearest = null;
  let nearestDistance = maxDistance;

  for (const crate of crates) {
    const distance = Math.hypot(crate.x - state.x, crate.y - state.y);

    if (distance < nearestDistance) {
      nearest = crate;
      nearestDistance = distance;
    }
  }

  return nearest ? { crate: nearest, distance: nearestDistance } : null;
}

function getAiPickupPriority(client, pickup) {
  const state = client.state;
  const needsHealing = state.health < state.maxHealth * 0.7;
  const needsShield = state.shield < state.maxShield * 0.55;

  if (pickup.type === "medkit") return needsHealing ? 0 : 6;
  if (pickup.type === "armor") return needsShield ? 1 : 6;
  if (pickup.type === "bazooka" || pickup.type === "awm") return 2;
  if (pickup.type === "glock") return state.inventory.glock.ammo < 30 ? 3 : 7;
  if (pickup.type === "knife") return state.inventory.knife.count < 1 ? 4 : 8;
  if (pickup.type === "xp" || pickup.type === "coin") return 5;
  return 9;
}

function getNearestUsefulAiPickup(client, maxDistance = 520) {
  let nearest = null;
  let bestScore = Infinity;

  for (const pickup of pickups) {
    const distance = Math.hypot(pickup.x - client.state.x, pickup.y - client.state.y);
    if (distance > maxDistance) {
      continue;
    }

    const score = getAiPickupPriority(client, pickup) * 160 + distance;
    if (score < bestScore) {
      nearest = { pickup, distance };
      bestScore = score;
    }
  }

  return nearest;
}

function givePickupToAi(client, pickup) {
  const state = client.state;
  const inventory = state.inventory;

  if (pickup.type === "medkit") {
    state.health = Math.min(state.maxHealth, state.health + (state.healAmount || 60));
  } else if (pickup.type === "armor") {
    state.shield = Math.min(state.maxShield, state.shield + 25);
  } else if (pickup.type === "xp") {
    state.totalXp += pickup.value || xpDropValue;
  } else if (pickup.type === "coin") {
    state.coins += pickup.value || coinValues[pickup.coinKind] || coinValues.bronze;
  } else if (pickup.type === "knife") {
    inventory.slots[1] = "knife";
    inventory.knife.count = Math.max(1, inventory.knife.count || 0) + Math.max(1, Number(pickup.count || 1));
  } else if (aiWeaponProfiles[pickup.type]) {
    inventory.slots[2] = pickup.type;
    inventory[pickup.type].ammo = Math.max(12, Number(pickup.ammo || 0));
    inventory[pickup.type].magAmmo = Math.max(1, Number(pickup.magAmmo || (pickup.type === "bazooka" ? 1 : pickup.type === "awm" ? 6 : 17)));
    state.selectedWeapon = pickup.type;
  }
}

function collectAiPickup(client) {
  const target = getNearestUsefulAiPickup(client, 54);
  if (!target) {
    return false;
  }

  givePickupToAi(client, target.pickup);
  pickups.splice(pickups.indexOf(target.pickup), 1);
  broadcastWorld();
  return true;
}

function getHumanClients() {
  return [...clients.values()].filter((client) => !client.isBot && client.state && client.state.health > 0);
}

function getAverageHumanLevel() {
  const humans = getHumanClients();
  if (!humans.length) {
    return 1;
  }

  return humans.reduce((sum, client) => sum + Math.max(1, Number(client.state.level || 1)), 0) / humans.length;
}

function getWizardBossClient() {
  const client = clients.get(wizardBossId);
  return client?.isBoss ? client : null;
}

function getWizardBossStatus() {
  const boss = getWizardBossClient();
  if (boss?.state?.health > 0) {
    return {
      phase: "active",
      id: wizardBossId,
      despawnAt: boss.boss.despawnAt,
      health: boss.state.health,
      maxHealth: boss.state.maxHealth,
    };
  }

  const now = Date.now();
  if (nextWizardBossSpawnAt - now <= wizardBossWarningMs) {
    return { phase: "warning", spawnAt: nextWizardBossSpawnAt };
  }

  return { phase: "waiting", spawnAt: nextWizardBossSpawnAt };
}

function broadcastBossStatus(status = getWizardBossStatus()) {
  broadcastToAll({ type: "bossStatus", status });
}

function createWizardBossState() {
  const averageLevel = getAverageHumanLevel();
  const elapsedMinutes = (Date.now() - serverStartedAt) / 60000;
  const maxHealth = Math.round(1450 + averageLevel * 260 + elapsedMinutes * 45);
  const x = world.width / 2;
  const y = world.height / 2;

  return {
    x,
    y,
    name: "Wizard Boss",
    characterId: "wizardBoss",
    isAi: true,
    isBoss: true,
    scale: 2,
    health: maxHealth,
    maxHealth,
    shield: 0,
    maxShield: 0,
    healAmount: 0,
    level: Math.max(1, Math.round(averageLevel)),
    xp: 0,
    xpToNext: 100,
    coins: 0,
    totalXp: maxHealth,
    upgradePoints: 0,
    damageMultiplier: 1,
    upgrades: {},
    vx: 0,
    vy: 0,
    inventory: { slots: { 1: "magicStaff", 2: null, 3: null }, magicStaff: { count: 1 } },
    selectedWeapon: "magicStaff",
    aimAngle: Math.random() * Math.PI * 2,
    swingTimer: 0,
    swingDuration: 0.18,
    magicStaffCastTimer: 0,
    magicStaffCastDuration: 0.42,
    punchTimer: 0,
    punchDuration: 0.16,
  };
}

function spawnWizardBoss() {
  const state = createWizardBossState();
  clients.set(wizardBossId, {
    socket: null,
    isBot: true,
    isBoss: true,
    state,
    boss: {
      spawnedAt: Date.now(),
      despawnAt: Date.now() + wizardBossDespawnMs,
      fireTimer: 1.2,
      slashTimer: 0.75,
      toxicOrbTimer: 0.65,
      pendingToxicOrbSkill: null,
      teleportTimer: 8,
      strafeDirection: Math.random() < 0.5 ? -1 : 1,
      strafeTimer: 1.8 + Math.random() * 1.2,
    },
  });
  wizardBossWarningSent = false;
  wizardBossBroadcastTimer = 0;
  broadcast({ type: "state", id: wizardBossId, state });
  broadcastBossStatus();
}

function despawnWizardBoss(reason = "despawned") {
  if (!clients.has(wizardBossId)) {
    return;
  }

  clients.delete(wizardBossId);
  nextWizardBossSpawnAt = Date.now() + wizardBossSpawnIntervalMs;
  wizardBossWarningSent = false;
  broadcast({ type: "leave", id: wizardBossId });
  broadcastBossStatus({ phase: reason, spawnAt: nextWizardBossSpawnAt });
}

function dropWizardBossLoot(state) {
  spawnPickup(state.x, state.y, "magicStaff", { value: 1 });
  spawnXpDrops(state.x + 44, state.y - 36, Math.max(1000, Math.round((state.maxHealth || 1500) * 0.85)));
  spawnCoinDrops(state.x - 36, state.y + 44, Math.max(500, Math.round((state.maxHealth || 1500) * 0.45)));
  broadcastWorld();
}

function fireWizardBossBolt(boss, target) {
  const state = boss.state;
  const angle = Math.atan2(target.state.y - state.y, target.state.x - state.x);
  state.aimAngle = angle;
  state.magicStaffCastTimer = 0.42;
  state.magicStaffCastDuration = 0.42;
  const damage = Math.round(34 + Math.max(1, state.level || 1) * 4);
  const bullet = {
    id: `${wizardBossId}-${nextEntityId++}`,
    ownerId: wizardBossId,
    x: state.x + Math.cos(angle) * 78,
    y: state.y + Math.sin(angle) * 78,
    vx: Math.cos(angle) * 620,
    vy: Math.sin(angle) * 620,
    radius: 13,
    life: 2.6,
    damage,
    weapon: "wizardPoisonBolt",
    hitIds: new Set(),
  };
  bullets.push(bullet);
  broadcast({ type: "shot", id: wizardBossId, bullet: { ...bullet, hitIds: undefined } }, wizardBossId);
  broadcast({ type: "state", id: wizardBossId, state }, wizardBossId);
  boss.boss.fireTimer = 1.1 + Math.random() * 0.55;
}

function castWizardBossToxicOrbSkill(boss, target) {
  const state = boss.state;
  if (boss.boss.pendingToxicOrbSkill) {
    return;
  }

  const startAngle = Math.random() * Math.PI * 2;
  const ringRadius = 138;
  const orbs = Array.from({ length: wizardBossToxicOrbCount }, (_, index) => {
    const angle = startAngle + (Math.PI * 2 * index) / wizardBossToxicOrbCount;
    return {
      x: state.x + Math.cos(angle) * ringRadius,
      y: state.y + Math.sin(angle) * ringRadius,
      angle,
    };
  });

  boss.boss.pendingToxicOrbSkill = {
    timer: wizardBossToxicOrbWindupSeconds,
    orbs,
  };
  boss.boss.toxicOrbTimer = wizardBossToxicOrbCooldown + Math.random() * 1.2;
  boss.boss.fireTimer = Math.max(boss.boss.fireTimer || 0, 0.75);
  state.swingTimer = wizardBossToxicOrbWindupSeconds + 0.18;
  state.swingDuration = wizardBossToxicOrbWindupSeconds + 0.18;
  state.punchTimer = wizardBossToxicOrbWindupSeconds + 0.18;
  state.punchDuration = wizardBossToxicOrbWindupSeconds + 0.18;
  broadcastEffect({
    type: "wizardToxicOrbRing",
    ownerId: wizardBossId,
    x: state.x,
    y: state.y,
    count: wizardBossToxicOrbCount,
    radius: ringRadius,
    startAngle,
    duration: Math.round(wizardBossToxicOrbWindupSeconds * 1000),
    startSize: 64,
    endSize: 76,
  });
  broadcast({ type: "state", id: wizardBossId, state }, wizardBossId);
}

function launchWizardBossToxicOrbSkill(boss, skill) {
  const state = boss.state;
  const damage = Math.round(42 + Math.max(1, state.level || 1) * 3.5);
  const speed = 560;

  for (const orb of skill.orbs || []) {
    const angle = orb.angle || 0;
    const bullet = {
      id: `${wizardBossId}-${nextEntityId++}`,
      ownerId: wizardBossId,
      x: orb.x,
      y: orb.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 17,
      life: 3,
      damage,
      weapon: "toxicOrb",
      hitIds: new Set(),
    };
    bullets.push(bullet);
    broadcast({ type: "shot", id: wizardBossId, bullet: { ...bullet, hitIds: undefined } }, wizardBossId);
  }
}

function slashWizardBossPoison(boss, target) {
  const state = boss.state;
  const targetState = target.client.state;
  const angle = Math.atan2(targetState.y - state.y, targetState.x - state.x);
  const damage = Math.round(46 + Math.max(1, state.level || 1) * 5);
  const slashX = state.x + Math.cos(angle) * 104;
  const slashY = state.y + Math.sin(angle) * 104;
  const knockback = getKnockback(damage, targetState.x - state.x, targetState.y - state.y, 0.72);

  state.aimAngle = angle;
  state.swingTimer = 0.56;
  state.swingDuration = 0.56;
  state.punchTimer = 0.56;
  state.punchDuration = 0.56;
  damageClient(target.id, damage, wizardBossId, knockback);
  broadcastEffect({
    type: "wizardPoisonSlash",
    ownerId: wizardBossId,
    x: slashX,
    y: slashY,
    angle,
    size: 260,
  });
  broadcast({ type: "state", id: wizardBossId, state }, wizardBossId);
  boss.boss.slashTimer = wizardBossPoisonSlashCooldown + Math.random() * 0.2;
  boss.boss.fireTimer = Math.max(boss.boss.fireTimer || 0, 0.35);
}

function updateWizardBoss(delta) {
  const now = Date.now();
  const boss = getWizardBossClient();
  wizardBossBroadcastTimer -= delta;

  if (!boss) {
    if (!wizardBossWarningSent && nextWizardBossSpawnAt - now <= wizardBossWarningMs) {
      wizardBossWarningSent = true;
      broadcastBossStatus({ phase: "warning", spawnAt: nextWizardBossSpawnAt });
    }
    if (now >= nextWizardBossSpawnAt) {
      spawnWizardBoss();
    }
    return;
  }

  if (!boss.state || boss.state.health <= 0) {
    return;
  }

  if (now >= boss.boss.despawnAt) {
    despawnWizardBoss("despawned");
    return;
  }

  if (boss.boss.pendingToxicOrbSkill) {
    boss.boss.pendingToxicOrbSkill.timer -= delta;
    if (boss.boss.pendingToxicOrbSkill.timer <= 0) {
      launchWizardBossToxicOrbSkill(boss, boss.boss.pendingToxicOrbSkill);
      boss.boss.pendingToxicOrbSkill = null;
    }
  }

  const nearest = getNearestHumanClient(boss.state);
  if (!nearest) {
    if (wizardBossBroadcastTimer <= 0) {
      broadcastBossStatus();
      wizardBossBroadcastTimer = 0.2;
    }
    return;
  }

  boss.boss.fireTimer = Math.max(0, boss.boss.fireTimer - delta);
  boss.boss.slashTimer = Math.max(0, (boss.boss.slashTimer || 0) - delta);
  boss.boss.toxicOrbTimer = Math.max(0, (boss.boss.toxicOrbTimer || 0) - delta);
  boss.boss.strafeTimer = Math.max(0, (boss.boss.strafeTimer || 0) - delta);
  if (boss.boss.strafeTimer <= 0) {
    boss.boss.strafeDirection *= -1;
    boss.boss.strafeTimer = 1.8 + Math.random() * 1.4;
  }

  const angle = Math.atan2(nearest.client.state.y - boss.state.y, nearest.client.state.x - boss.state.x);
  const distance = nearest.distance;
  boss.state.aimAngle = lerpAngle(boss.state.aimAngle || angle, angle, Math.min(1, delta * 5));
  boss.state.swingTimer = Math.max(0, (boss.state.swingTimer || 0) - delta);
  boss.state.magicStaffCastTimer = Math.max(0, (boss.state.magicStaffCastTimer || 0) - delta);
  boss.state.punchTimer = Math.max(0, (boss.state.punchTimer || 0) - delta);

  const desiredDistance = 520;
  const distanceError = clamp((distance - desiredDistance) / 360, -1, 1);
  const forwardSpeed = distanceError * 88;
  const strafeSpeed = (distance < 980 ? 42 : 18) * (boss.boss.strafeDirection || 1);
  const targetVx = Math.cos(angle) * forwardSpeed + Math.cos(angle + Math.PI / 2) * strafeSpeed;
  const targetVy = Math.sin(angle) * forwardSpeed + Math.sin(angle + Math.PI / 2) * strafeSpeed;
  const acceleration = Math.min(1, delta * 2.8);
  boss.state.vx = (boss.state.vx || 0) + (targetVx - (boss.state.vx || 0)) * acceleration;
  boss.state.vy = (boss.state.vy || 0) + (targetVy - (boss.state.vy || 0)) * acceleration;
  boss.state.x = clamp(boss.state.x + boss.state.vx * delta, 60, world.width - 60);
  boss.state.y = clamp(boss.state.y + boss.state.vy * delta, 60, world.height - 60);

  if (!boss.boss.pendingToxicOrbSkill && boss.boss.toxicOrbTimer <= 0) {
    castWizardBossToxicOrbSkill(boss, nearest.client);
  } else if (!boss.boss.pendingToxicOrbSkill && boss.boss.slashTimer <= 0 && distance <= wizardBossPoisonSlashRange + getClientRadius(nearest.client)) {
    slashWizardBossPoison(boss, nearest);
  } else if (!boss.boss.pendingToxicOrbSkill && boss.boss.fireTimer <= 0 && distance < 1150) {
    fireWizardBossBolt(boss, nearest.client);
  }

  if (wizardBossBroadcastTimer <= 0) {
    broadcast({ type: "state", id: wizardBossId, state: boss.state }, wizardBossId);
    broadcastBossStatus();
    wizardBossBroadcastTimer = 0.08;
  }
}

function reloadAiWeapon(client) {
  const weaponName = client.state.selectedWeapon;
  const profile = aiWeaponProfiles[weaponName];
  const weapon = client.state.inventory[weaponName];

  if (!profile || !weapon || weapon.magAmmo > 0 || weapon.ammo <= 0) {
    return;
  }

  const magazineSize = weaponName === "bazooka" ? 1 : weaponName === "awm" ? 6 : 17;
  const loaded = Math.min(magazineSize, weapon.ammo);
  weapon.magAmmo = loaded;
  weapon.ammo -= loaded;
}

function getModernCharacterDirection(x, y, fallback = "down") {
  if (Math.hypot(x, y) < 0.001) {
    return fallback;
  }

  const angle = Math.atan2(y, x);
  const eighth = Math.PI / 8;
  if (angle >= -eighth && angle < eighth) return "right";
  if (angle >= eighth && angle < eighth * 3) return "downRight";
  if (angle >= eighth * 3 && angle < eighth * 5) return "down";
  if (angle >= eighth * 5 && angle < eighth * 7) return "downLeft";
  if (angle >= eighth * 7 || angle < -eighth * 7) return "left";
  if (angle >= -eighth * 7 && angle < -eighth * 5) return "upLeft";
  if (angle >= -eighth * 5 && angle < -eighth * 3) return "up";
  if (angle >= -eighth * 3 && angle < -eighth) return "upRight";
  return fallback;
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

function getAiFirearmMuzzleWorldPosition(x, y, angle, weaponName) {
  if (weaponName === "glock") {
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

  if (weaponName === "awm") {
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

  return null;
}

function fireAiBullet(id, client, angle) {
  const state = client.state;
  const weaponName = state.selectedWeapon;
  const profile = aiWeaponProfiles[weaponName];
  const weapon = state.inventory[weaponName];

  if (!profile || !weapon || client.ai.fireTimer > 0 || client.ai.reloadTimer > 0) {
    return false;
  }

  if (weapon.magAmmo <= 0) {
    if (weapon.ammo > 0) {
      client.ai.reloadTimer = weaponName === "bazooka" ? 4 : weaponName === "awm" ? 5 : 3;
    } else {
      state.selectedWeapon = "knife";
    }
    return false;
  }

  const aimAngle = angle + (Math.random() - 0.5) * 0.08;
  const barrelLength = weaponName === "glock" ? 62 : weaponName === "bazooka" ? 68 : 72;
  const muzzle = getAiFirearmMuzzleWorldPosition(state.x, state.y, aimAngle, weaponName);
  const bullet = {
    id: `${id}-${nextEntityId++}`,
    ownerId: id,
    x: muzzle?.x ?? state.x + Math.cos(aimAngle) * barrelLength,
    y: muzzle?.y ?? state.y + Math.sin(aimAngle) * barrelLength,
    vx: Math.cos(aimAngle) * profile.bulletSpeed,
    vy: Math.sin(aimAngle) * profile.bulletSpeed,
    radius: profile.bulletRadius,
    life: profile.bulletLife,
    damage: profile.damage,
    weapon: weaponName,
    explosionRadius: profile.explosionRadius,
    hitIds: new Set(),
  };

  bullets.push(bullet);
  broadcast({ type: "shot", id, bullet: { ...bullet, hitIds: undefined } }, id);
  weapon.magAmmo -= 1;
  client.ai.fireTimer = profile.fireRate + Math.random() * profile.fireRate * 0.45;
  return true;
}

function swingAiKnife(id, client, angle) {
  if (client.ai.meleeTimer > 0) {
    return;
  }

  const attack = {
    x: client.state.x,
    y: client.state.y,
    angle,
    range: 82,
    arc: Math.PI * 0.72,
    damage: 25,
    swingDuration: 0.18,
    weapon: "knife",
  };

  handleMelee(id, attack);
  broadcast({ type: "melee", id, attack }, id);
  client.ai.meleeTimer = 0.48 + Math.random() * 0.16;
}

function updateTestAiBots(delta) {
  if (!testAiEnabled) {
    return;
  }

  let changed = false;
  const now = Date.now();
  aiBroadcastTimer -= delta;

  for (const [id, client] of clients) {
    if (!client.isBot || client.isBoss || !client.state || !client.ai) {
      continue;
    }

    if (client.state.health <= 0) {
      if (!client.ai.respawnAt) {
        client.ai.respawnAt = now + testAiRespawnMs;
      }

      if (now < client.ai.respawnAt) {
        continue;
      }

      client.state = createAiState(client.ai.index);
      client.ai.respawnAt = 0;
      client.ai.fireTimer = 0.45 + Math.random() * 0.35;
      client.ai.meleeTimer = 0;
      client.ai.reloadTimer = 0;
      changed = true;
      broadcast({ type: "state", id, state: client.state }, id);
      continue;
    }

    client.ai.turnTimer -= delta;
    client.ai.fireTimer = Math.max(0, client.ai.fireTimer - delta);
    client.ai.meleeTimer = Math.max(0, client.ai.meleeTimer - delta);
    if (client.ai.reloadTimer > 0) {
      client.ai.reloadTimer = Math.max(0, client.ai.reloadTimer - delta);
      if (client.ai.reloadTimer <= 0) {
        reloadAiWeapon(client);
      }
    }
    collectAiPickup(client);

    const nearest = getNearestHumanClient(client.state);
    const seekingPickup = getNearestUsefulAiPickup(client, nearest && nearest.distance < 460 ? 100 : 520);
    const crateTarget = nearest && nearest.distance < 1250 ? null : getNearestAiCrate(client.state, 860);
    let target = nearest && nearest.distance < 1500
      ? { x: nearest.client.state.x, y: nearest.client.state.y, distance: nearest.distance, player: true }
      : crateTarget ? { x: crateTarget.crate.x, y: crateTarget.crate.y, distance: crateTarget.distance, player: false } : null;

    if (seekingPickup && (!target || !target.player || client.state.health < client.state.maxHealth * 0.56)) {
      target = { x: seekingPickup.pickup.x, y: seekingPickup.pickup.y, distance: seekingPickup.distance, pickup: true };
    }

    if (target) {
      const targetAngle = Math.atan2(target.y - client.state.y, target.x - client.state.x);
      client.state.aimAngle = targetAngle;

      if (!target.pickup) {
        const rangedSlot = client.state.inventory.slots[2];
        const rangedProfile = aiWeaponProfiles[rangedSlot];
        if (target.distance <= 90 && client.state.inventory.knife.count > 0) {
          client.state.selectedWeapon = "knife";
          swingAiKnife(id, client, targetAngle);
        } else if (rangedProfile) {
          client.state.selectedWeapon = rangedSlot;
          if (target.distance <= rangedProfile.maxRange) {
            fireAiBullet(id, client, targetAngle);
          }
        }
      }

      const profile = aiWeaponProfiles[client.state.selectedWeapon] || aiWeaponProfiles[client.state.inventory.slots[2]];
      const desiredDistance = target.pickup ? 0 : profile?.idealRange || 64;
      let moveAngle = targetAngle;
      let speed = target.pickup ? 168 : 148;

      if (!target.pickup && target.distance < desiredDistance - 90) {
        moveAngle += Math.PI;
      } else if (!target.pickup && target.distance <= desiredDistance + 90 && profile) {
        if (client.ai.turnTimer <= 0) {
          client.ai.strafeDirection *= -1;
          client.ai.turnTimer = 0.65 + Math.random() * 1.2;
        }
        moveAngle += client.ai.strafeDirection * Math.PI / 2;
        speed = 120;
      }

      client.state.x = clamp(client.state.x + Math.cos(moveAngle) * speed * delta, 36, world.width - 36);
      client.state.y = clamp(client.state.y + Math.sin(moveAngle) * speed * delta, 36, world.height - 36);
    } else {
      if (client.ai.turnTimer <= 0) {
        client.ai.angle += (Math.random() - 0.5) * 1.8;
        client.ai.turnTimer = 0.5 + Math.random() * 1.4;
      }
      client.state.aimAngle = client.ai.angle;
      client.state.x = clamp(client.state.x + Math.cos(client.ai.angle) * 95 * delta, 36, world.width - 36);
      client.state.y = clamp(client.state.y + Math.sin(client.ai.angle) * 95 * delta, 36, world.height - 36);
    }
    changed = true;
  }

  if (changed && aiBroadcastTimer <= 0) {
    for (const [id, client] of clients) {
      if (client.isBot && client.state && client.state.health > 0) {
        broadcast({ type: "state", id, state: client.state }, id);
      }
    }
    aiBroadcastTimer = 0.05;
  }
}

function spawnPickup(x, y, forcedType = null, data = {}) {
  const types = ["knife", "glock", "awm", "grenade", "armor", "medkit"];
  const type = forcedType || data.type || types[Math.floor(Math.random() * types.length)];

  pickups.push({
    id: nextEntityId++,
    x,
    y,
    type,
    count: data.count,
    ammo: data.ammo,
    magAmmo: data.magAmmo,
    value: data.value,
    coinKind: data.coinKind,
    embedded: Boolean(data.embedded),
    angle: Number.isFinite(data.angle) ? data.angle : undefined,
    dropId: data.dropId,
    expiresAt: Date.now() + pickupLifetimeMs,
    radius: 18,
    bob: Math.random() * Math.PI * 2,
  });
}

function getXpDropValues(totalValue) {
  let remaining = Math.max(0, Math.round(totalValue));
  const values = [];

  if (remaining > 0) {
    values.push(remaining);
  }

  return values;
}

function spawnXpDrops(x, y, totalValue) {
  const values = getXpDropValues(totalValue);

  values.forEach((value, index) => {
    const angle = index * 2.399963;
    const distance = 18 + Math.sqrt(index) * 13;
    spawnPickup(
      clamp(x + Math.cos(angle) * distance, 24, world.width - 24),
      clamp(y + Math.sin(angle) * distance, 24, world.height - 24),
      "xp",
      { value },
    );
  });
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

function spawnCoinDrops(x, y, totalValue) {
  getCoinDropEntries(totalValue).forEach((entry, index) => {
    const angle = index * 2.399963 + Math.PI / 5;
    const distance = 18 + Math.sqrt(index) * 13;
    spawnPickup(
      clamp(x + Math.cos(angle) * distance, 24, world.width - 24),
      clamp(y + Math.sin(angle) * distance, 24, world.height - 24),
      "coin",
      entry,
    );
  });
}

function cleanupExpiredPickups() {
  const now = Date.now();
  let changed = false;

  for (let index = pickups.length - 1; index >= 0; index -= 1) {
    if (pickups[index].expiresAt && pickups[index].expiresAt <= now) {
      pickups.splice(index, 1);
      changed = true;
    }
  }

  return changed;
}

function createCrates() {
  crates.length = 0;
  pickups.length = 0;

  for (const kind of crateTierOrder) {
    const tier = crateTiers[kind];
    while (getCrateCount(kind) < tier.count) {
      spawnCrate(kind, getCrateCount(kind), tier.count);
    }
  }
}

function getWorldState() {
  return { crates, pickups };
}

function broadcastWorld() {
  broadcast({ type: "world", world: getWorldState() });
}

function broadcastEffect(effect) {
  broadcast({ type: "effect", effect });
}

function getDamageCapacity(state) {
  return Math.max(0, state?.health || 0) + Math.max(0, state?.shield || 0);
}

function getClientRadius(client) {
  return client?.isBoss ? 48 : 24;
}

function getKnockback(damage, vx, vy, forceScale = 1) {
  const length = Math.hypot(vx, vy);

  if (length <= 0) {
    return null;
  }

  const force = clamp((110 + damage * 3.2) * forceScale, 150, 3600);
  return { vx: (vx / length) * force, vy: (vy / length) * force };
}

function applyDamageToState(state, amount) {
  if (!state) return state;

  let remaining = amount;
  const next = { ...state };

  if (next.shield > 0) {
    const absorbed = Math.min(next.shield, remaining);
    next.shield -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    next.health = Math.max(0, next.health - remaining);
  }

  return next;
}

function dropPlayerLoot(state) {
  if (!state) return;

  const inventory = state.inventory || {};
  const slots = inventory.slots || {};
  const droppedTypes = new Set();
  let dropIndex = 0;
  const angles = [0, Math.PI * 0.66, Math.PI * 1.33, Math.PI, Math.PI * 1.66];

  for (const slot of ["1", "2", "3"]) {
    const weaponName = slots[slot];

    if (!weaponName || droppedTypes.has(weaponName)) {
      continue;
    }

    droppedTypes.add(weaponName);
    const angle = angles[dropIndex % angles.length];
    const x = clamp(state.x + Math.cos(angle) * (44 + dropIndex * 8), 24, world.width - 24);
    const y = clamp(state.y + Math.sin(angle) * (44 + dropIndex * 8), 24, world.height - 24);

    if (weaponName === "knife") {
      spawnPickup(x, y, "knife", { count: Math.max(1, Number(inventory.knife?.count || 1)) });
    } else if (weaponName === "grenade") {
      spawnPickup(x, y, "grenade", {
        count: Math.max(
          1,
          Number(inventory.grenade?.count || 0) +
            Number(inventory.grenade?.ammo || 0) +
            Number(inventory.grenade?.magAmmo || 0),
        ),
      });
    } else if (weaponName === "magicStaff") {
      spawnPickup(x, y, "magicStaff", { count: 1 });
    } else if (weaponName === "glock" || weaponName === "awm" || weaponName === "bazooka") {
      spawnPickup(x, y, weaponName, {
        ammo: Math.max(0, Number(inventory[weaponName]?.ammo || 0)),
        magAmmo: Math.max(0, Number(inventory[weaponName]?.magAmmo || 0)),
      });
    }

    dropIndex += 1;
  }

  const xpValue = Math.max(25, Math.round((state.totalXp || 0) * 0.7));
  spawnXpDrops(state.x + 18, state.y - 42, xpValue);
  const coinValue = Math.max(0, Math.round((state.coins || 0) * 0.7));
  spawnCoinDrops(state.x - 18, state.y + 42, coinValue);
}

function damageClient(targetId, amount, sourceId = null, knockback = null) {
  const client = clients.get(targetId);

  if (!client?.state || amount <= 0) {
    return false;
  }

  const previousHealth = client.state.health || 0;
  const previousShield = client.state.shield || 0;
  client.state = applyDamageToState(client.state, amount);
  send(client.socket, {
    type: "health",
    health: client.state.health,
    shield: client.state.shield || 0,
    x: client.state.x,
    y: client.state.y,
    knockback,
  });
  broadcast({ type: "state", id: targetId, state: client.state }, targetId);

  if ((client.state.health || 0) < previousHealth || (client.state.shield || 0) < previousShield) {
    const source = clients.get(sourceId);
    const effect = { type: "playerHit", x: client.state.x, y: client.state.y };
    send(client.socket, { type: "effect", effect });
    if (source && source !== client) {
      send(source.socket, { type: "effect", effect });
    }
  }

  if (previousHealth > 0 && client.state.health <= 0) {
    if (client.isBoss) {
      dropWizardBossLoot(client.state);
      const source = clients.get(sourceId);
      if (source && !source.isBoss) {
        send(source.socket, { type: "characterUnlock", characterId: "wizardBoss" });
      }
      clients.delete(targetId);
      nextWizardBossSpawnAt = Date.now() + wizardBossSpawnIntervalMs;
      wizardBossWarningSent = false;
      broadcast({ type: "dead", id: targetId }, targetId);
      broadcast({ type: "leave", id: targetId });
      broadcastBossStatus({ phase: "defeated", spawnAt: nextWizardBossSpawnAt });
    } else {
      dropPlayerLoot(client.state);
      broadcastWorld();
      broadcast({ type: "dead", id: targetId }, targetId);
    }
  }

  return true;
}

function damageCrate(crate, amount) {
  const destroyed = crate.hp - amount <= 0;
  crate.hp -= amount;

  if (crate.hp <= 0) {
    const tier = crateTiers[crate.kind || "basic"] || crateTiers.basic;
    spawnPickup(crate.x, crate.y);
    spawnPickup(crate.x + 28, crate.y - 20, "xp", { value: tier.xp });
    spawnPickup(crate.x - 28, crate.y + 20, "coin", { coinKind: tier.coinKind, value: tier.coinValue });
    crates.splice(crates.indexOf(crate), 1);
  }

  broadcastEffect({ type: destroyed ? "crateBreak" : "crateHit", x: crate.x, y: crate.y });
  broadcastWorld();
}

function handleMelee(ownerId, attack) {
  const owner = clients.get(ownerId);

  if (!owner?.state || !attack) {
    return;
  }

  const attackX = clamp(Number(attack.x), 0, world.width);
  const attackY = clamp(Number(attack.y), 0, world.height);
  const angle = Number(attack.angle || 0);
  const range = clamp(Number(attack.range || 0), 0, 140);
  const arc = clamp(Number(attack.arc || 0), 0, Math.PI * 1.4);
  const damage = clamp(Number(attack.damage || 0), 0, 260);

  if (Math.hypot(owner.state.x - attackX, owner.state.y - attackY) > 120 || range <= 0 || arc <= 0 || damage <= 0) {
    return;
  }

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.hypot(crate.x - attackX, crate.y - attackY);

    if (distance > range + getCrateHitboxSize(crate) / 2) {
      continue;
    }

    const targetAngle = Math.atan2(crate.y - attackY, crate.x - attackX);
    const angleDiff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));

    if (Math.abs(angleDiff) <= arc / 2) {
      damageCrate(crate, damage);
    }
  }

  for (const [targetId, client] of clients) {
    if (targetId === ownerId || !client.state || client.state.health <= 0) {
      continue;
    }

    const distance = Math.hypot(client.state.x - attackX, client.state.y - attackY);

    if (distance > range + getClientRadius(client)) {
      continue;
    }

    const targetAngle = Math.atan2(client.state.y - attackY, client.state.x - attackX);
    const angleDiff = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));

    if (Math.abs(angleDiff) <= arc / 2) {
      damageClient(targetId, damage, ownerId);
    }
  }
}

function handleLightningThrust(ownerId, attack) {
  const owner = clients.get(ownerId);

  if (!owner?.state || !attack) {
    return;
  }

  const startX = clamp(Number(attack.startX), 0, world.width);
  const startY = clamp(Number(attack.startY), 0, world.height);
  const endX = clamp(Number(attack.endX), 0, world.width);
  const endY = clamp(Number(attack.endY), 0, world.height);
  const damage = clamp(Number(attack.damage || 0), 0, 260);
  const radius = clamp(Number(attack.radius || 42), 18, 70);
  let worldChanged = false;

  if (Math.hypot(startX - owner.state.x, startY - owner.state.y) > 140) {
    return;
  }

  if (Math.hypot(endX - startX, endY - startY) > 540 || damage <= 0) {
    return;
  }

  owner.state = { ...owner.state, x: endX, y: endY };

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    if (segmentHitsBox(startX, startY, endX, endY, crate, radius)) {
      damageCrate(crate, damage);
      worldChanged = true;
    }
  }

  for (const [targetId, client] of clients) {
    if (targetId === ownerId || !client.state || client.state.health <= 0) {
      continue;
    }

    if (segmentHitsCircle(startX, startY, endX, endY, client.state.x, client.state.y, radius + getClientRadius(client))) {
      const knockback = getKnockback(damage, endX - startX, endY - startY);
      damageClient(targetId, damage, ownerId, knockback);
    }
  }

  if (worldChanged) {
    broadcastWorld();
  }

  broadcast({ type: "state", id: ownerId, state: owner.state }, ownerId);
  broadcast({
    type: "lightningThrust",
    id: ownerId,
    attack: { startX, startY, endX, endY, radius, damage },
  }, ownerId);
}

function handleRailburst(ownerId, attack) {
  const owner = clients.get(ownerId);

  if (!owner?.state || !attack) {
    return;
  }

  const startX = clamp(Number(attack.startX), 0, world.width);
  const startY = clamp(Number(attack.startY), 0, world.height);
  const endX = clamp(Number(attack.endX), 0, world.width);
  const endY = clamp(Number(attack.endY), 0, world.height);
  const damage = clamp(Number(attack.damage || 0), 0, railburstMaxDamage);
  const width = clamp(Number(attack.width || 160), 24, 190);
  let worldChanged = false;

  if (Math.hypot(startX - owner.state.x, startY - owner.state.y) > 620) {
    return;
  }

  if (Math.hypot(endX - startX, endY - startY) > railburstRange + 80 || damage <= 0) {
    return;
  }

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    if (segmentHitsBox(startX, startY, endX, endY, crate, width / 2)) {
      damageCrate(crate, damage);
      worldChanged = true;
    }
  }

  for (const [targetId, client] of clients) {
    if (targetId === ownerId || !client.state || client.state.health <= 0) {
      continue;
    }

    if (segmentHitsCircle(startX, startY, endX, endY, client.state.x, client.state.y, width / 2 + getClientRadius(client))) {
      damageClient(targetId, damage, ownerId, getKnockback(damage, endX - startX, endY - startY));
    }
  }

  if (worldChanged) {
    broadcastWorld();
  }

  broadcast({
    type: "railburstFire",
    id: ownerId,
    attack: { startX, startY, endX, endY, width, damage },
  }, ownerId);
}

function damageArea(ownerId, x, y, radius, damage, knockbackScale = 1, displacement = 0, falloffKnockback = false, knockbackDuration = 0.58, preserveMomentum = false) {
  let worldChanged = false;

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    if (Math.hypot(crate.x - x, crate.y - y) <= radius + getCrateHitboxSize(crate) / 2) {
      damageCrate(crate, damage);
      worldChanged = true;
    }
  }

  for (const [targetId, client] of clients) {
    if (targetId === ownerId || !client.state || client.state.health <= 0) {
      continue;
    }

    const distance = Math.hypot(client.state.x - x, client.state.y - y);
    if (distance <= radius + getClientRadius(client)) {
      const distanceRatio = clamp(distance / Math.max(1, radius), 0, 1);
      const knockbackRatio = falloffKnockback ? 1.35 - distanceRatio * 0.85 : 1;
      const scaledDisplacement = displacement * knockbackRatio;
      if (displacement > 0) {
        const angle = distance > 0 ? Math.atan2(client.state.y - y, client.state.x - x) : Math.random() * Math.PI * 2;
        client.state = {
          ...client.state,
          x: clamp(client.state.x + Math.cos(angle) * scaledDisplacement, 24, world.width - 24),
          y: clamp(client.state.y + Math.sin(angle) * scaledDisplacement, 24, world.height - 24),
        };
      }
      const knockback = getKnockback(damage, client.state.x - x, client.state.y - y, knockbackScale * knockbackRatio);
      damageClient(targetId, damage, ownerId, knockback ? { ...knockback, duration: knockbackDuration, preserveMomentum } : null);
    }
  }

  if (worldChanged) {
    broadcastWorld();
  }
}

function getBazookaBlastDamage(baseDamage, distance, radius) {
  const ratio = clamp(distance / Math.max(1, radius), 0, 1);
  return Math.max(1, Math.round(baseDamage * (0.28 + 0.72 * (1 - ratio))));
}

function explodeBazooka(bullet) {
  const x = clamp(Number(bullet.x), 0, world.width);
  const y = clamp(Number(bullet.y), 0, world.height);
  const radius = clamp(Number(bullet.explosionRadius || bazookaExplosionRadius), 80, bazookaExplosionRadius);
  const baseDamage = clamp(Number(bullet.damage || 0), 0, 260);

  broadcastEffect({ type: "bazookaExplosion", x, y, radius, bulletId: bullet.id, ownerId: bullet.ownerId });

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.max(0, Math.hypot(crate.x - x, crate.y - y) - getCrateHitboxSize(crate) / 2);
    if (distance <= radius) {
      damageCrate(crate, getBazookaBlastDamage(baseDamage, distance, radius));
    }
  }

  for (const [targetId, client] of clients) {
    if (!client.state || client.state.health <= 0) {
      continue;
    }

    const distance = Math.max(0, Math.hypot(client.state.x - x, client.state.y - y) - getClientRadius(client));
    if (distance > radius) {
      continue;
    }

    const damage = getBazookaBlastDamage(baseDamage, distance, radius);
    let directionX = client.state.x - x;
    let directionY = client.state.y - y;
    if (Math.hypot(directionX, directionY) <= 0) {
      directionX = -bullet.vx;
      directionY = -bullet.vy;
    }
    if (Math.hypot(directionX, directionY) <= 0) {
      const fallbackAngle = Math.random() * Math.PI * 2;
      directionX = Math.cos(fallbackAngle);
      directionY = Math.sin(fallbackAngle);
    }
    damageClient(targetId, damage, bullet.ownerId, getKnockback(damage, directionX, directionY, 1.25));
  }
}

function resolveGrenadeMotion(grenade, previousX, previousY, delta) {
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
  }
  if (grenade.y < minY || grenade.y > maxY) {
    grenade.y = clamp(grenade.y, minY, maxY);
    grenade.vy *= -grenadeBounceRetention;
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
}

function explodeGrenade(grenade) {
  const x = clamp(Number(grenade.x), 0, world.width);
  const y = clamp(Number(grenade.y), 0, world.height);
  const radius = clamp(Number(grenade.explosionRadius || grenadeExplosionRadius), 70, grenadeExplosionRadius);
  const baseDamage = clamp(Number(grenade.damage || 0), 0, 220);

  broadcastEffect({ type: "grenadeExplosion", x, y, radius, bulletId: grenade.id, ownerId: grenade.ownerId });

  for (let index = crates.length - 1; index >= 0; index -= 1) {
    const crate = crates[index];
    const distance = Math.max(0, Math.hypot(crate.x - x, crate.y - y) - getCrateHitboxSize(crate) / 2);
    if (distance <= radius) {
      damageCrate(crate, getBazookaBlastDamage(baseDamage, distance, radius));
    }
  }

  for (const [targetId, client] of clients) {
    if (!client.state || client.state.health <= 0) {
      continue;
    }
    const distance = Math.max(0, Math.hypot(client.state.x - x, client.state.y - y) - getClientRadius(client));
    if (distance > radius) {
      continue;
    }
    let directionX = client.state.x - x;
    let directionY = client.state.y - y;
    if (Math.hypot(directionX, directionY) <= 0) {
      directionX = 1;
      directionY = 0;
    }
    const damage = getBazookaBlastDamage(baseDamage, distance, radius);
    damageClient(targetId, damage, grenade.ownerId, getKnockback(damage, directionX, directionY, 1.05));
  }
}

function handleArcPrison(ownerId, x, y, radius, damage) {
  let worldChanged = false;

  for (const crate of crates) {
    const distance = distanceToArcPrisonEdge(crate.x, crate.y, x, y, radius);
    if (distance <= arcPrisonEdgeWidth + getCrateHitboxSize(crate) / 2) {
      damageCrate(crate, damage);
      worldChanged = true;
    }
  }

  for (const [targetId, client] of clients) {
    if (targetId === ownerId || !client.state || client.state.health <= 0) {
      continue;
    }

    const edgeDistance = distanceToArcPrisonEdge(client.state.x, client.state.y, x, y, radius);
    if (edgeDistance <= arcPrisonEdgeWidth + getClientRadius(client)) {
      send(client.socket, { type: "status", status: "arcSlow", duration: arcPrisonSlowMs / 1000, strength: 0.34 });
      damageClient(targetId, damage, ownerId, getKnockback(damage * 0.65, client.state.x - x, client.state.y - y));
    }
  }

  if (worldChanged) {
    broadcastWorld();
  }
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

function handleSkill(ownerId, message) {
  const owner = clients.get(ownerId);

  if (!owner?.state) {
    return;
  }

  const skill = message.skill;
  const x = clamp(Number(message.x), 0, world.width);
  const y = clamp(Number(message.y), 0, world.height);
  const radius = clamp(Number(message.radius || 0), 40, staticCollapseMaxRadius);
  const damage = clamp(Number(message.damage || 0), 0, areaSkillMaxDamage);

  if (Math.hypot(owner.state.x - x, owner.state.y - y) > 1400 && skill !== "stormRecall") {
    return;
  }

  if (skill === "staticCollapse") {
    const startX = clamp(Number(message.startX), 0, world.width);
    const startY = clamp(Number(message.startY), 0, world.height);
    const angle = Math.atan2(y - startY, x - startX);
    const chargeRatio = clamp(Number(message.chargeRatio || 0.18), 0.18, 1);
    const contactDamage = clamp(Number(message.contactDamage || 0), 0, areaSkillMaxDamage);
    if (Math.hypot(owner.state.x - startX, owner.state.y - startY) > 120) {
      return;
    }
    const projectile = {
      ownerId,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * staticCollapseProjectileSpeed,
      vy: Math.sin(angle) * staticCollapseProjectileSpeed,
      endX: x,
      endY: y,
      radius: 16 + chargeRatio * 8,
      explosionRadius: radius,
      damage,
      contactDamage,
      chargeRatio,
      hitCrateIds: new Set(),
      hitIds: new Set(),
    };
    staticCollapseProjectiles.push(projectile);
    broadcast({ type: "staticCollapseLaunch", id: ownerId, projectile }, ownerId);
  } else if (skill === "arcPrison") {
    broadcast({ type: "skillEffect", skill, id: ownerId, x, y, radius }, ownerId);
    handleArcPrison(ownerId, x, y, radius, damage);
  } else if (skill === "stormRecall") {
    broadcast({ type: "skillEffect", skill, id: ownerId, x: owner.state.x, y: owner.state.y, radius }, ownerId);
    // V1 rollback reference: Storm Recall previously used knockback scale 2.8 and displacement 100.
    // V2 rollback reference: Storm Recall briefly used knockback scale 5.2 and displacement 220 without preserved momentum.
    damageArea(ownerId, owner.state.x, owner.state.y, radius, damage, 7.2, 360, true, 0.82, true);
  }
}

function updateStaticCollapseProjectiles(delta) {
  for (let index = staticCollapseProjectiles.length - 1; index >= 0; index -= 1) {
    const projectile = staticCollapseProjectiles[index];
    const previousX = projectile.x;
    const previousY = projectile.y;
    const remaining = Math.hypot(projectile.endX - projectile.x, projectile.endY - projectile.y);
    const travel = Math.hypot(projectile.vx, projectile.vy) * delta;

    if (travel >= remaining) {
      projectile.x = projectile.endX;
      projectile.y = projectile.endY;
    } else {
      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
    }

    for (const crate of crates) {
      if (projectile.hitCrateIds.has(crate.id)) continue;
      if (segmentHitsBox(previousX, previousY, projectile.x, projectile.y, crate, projectile.radius)) {
        projectile.hitCrateIds.add(crate.id);
        damageCrate(crate, projectile.contactDamage);
      }
    }

    for (const [targetId, client] of clients) {
      if (targetId === projectile.ownerId || projectile.hitIds.has(targetId) || !client.state || client.state.health <= 0) continue;
      if (segmentHitsCircle(previousX, previousY, projectile.x, projectile.y, client.state.x, client.state.y, projectile.radius + getClientRadius(client))) {
        projectile.hitIds.add(targetId);
        damageClient(targetId, projectile.contactDamage, projectile.ownerId, getKnockback(projectile.contactDamage, projectile.vx, projectile.vy));
      }
    }

    if (travel >= remaining) {
      broadcast({ type: "skillEffect", skill: "staticCollapseBurst", id: projectile.ownerId, x: projectile.endX, y: projectile.endY, radius: projectile.explosionRadius }, projectile.ownerId);
      setTimeout(() => damageArea(projectile.ownerId, projectile.endX, projectile.endY, projectile.explosionRadius, projectile.damage), staticCollapseDelayMs);
      staticCollapseProjectiles.splice(index, 1);
    }
  }
}

function updateBullets(delta) {
  let worldChanged = false;

  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    const bullet = bullets[index];
    const previousX = bullet.x;
    const previousY = bullet.y;
    steerMagicStaffBullet(bullet, delta);
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    if (bullet.weapon === "bazooka") {
      const hitCrate = crates.some((crate) => (
        circleHitsBox(bullet, crate) || segmentHitsBox(previousX, previousY, bullet.x, bullet.y, crate, bullet.radius)
      ));
      const hitPlayer = [...clients].some(([targetId, client]) => (
        targetId !== bullet.ownerId &&
        client.state &&
        client.state.health > 0 &&
        segmentHitsCircle(previousX, previousY, bullet.x, bullet.y, client.state.x, client.state.y, bullet.radius + getClientRadius(client))
      ));
      const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

      if (hitCrate || hitPlayer || expired) {
        explodeBazooka(bullet);
        bullets.splice(index, 1);
      }
      continue;
    }

    if (bullet.weapon === "grenade") {
      resolveGrenadeMotion(bullet, previousX, previousY, delta);
      if (bullet.life <= 0) {
        explodeGrenade(bullet);
        bullets.splice(index, 1);
      }
      continue;
    }

    let spent = false;

    for (let crateIndex = crates.length - 1; crateIndex >= 0; crateIndex -= 1) {
      const crate = crates[crateIndex];

      if (!circleHitsBox(bullet, crate) && !segmentHitsBox(previousX, previousY, bullet.x, bullet.y, crate, bullet.radius)) {
        continue;
      }

      if (bullet.weapon === "knife") {
        const hitPoint = getBoxHitPoint(bullet, crate);
        const absorbed = Math.min(bullet.damage, Math.max(0, crate.hp));
        damageCrate(crate, absorbed);
        bullet.damage -= absorbed;
        worldChanged = true;
        broadcastToAll({
          type: "bulletImpact",
          bulletId: bullet.id,
          ownerId: bullet.ownerId,
          x: hitPoint.x,
          y: hitPoint.y,
          damage: bullet.damage,
          spent: bullet.damage <= 0 || absorbed <= 0,
        });

        if (bullet.damage <= 0 || absorbed <= 0) {
          const dropId = bullet.pickup?.dropId || bullet.id;
          if (!handledDropIds.has(dropId)) {
            handledDropIds.add(dropId);
            spawnPickup(hitPoint.x, hitPoint.y, "knife", {
              count: 1,
              embedded: true,
              angle: bullet.angle ?? Math.atan2(bullet.vy, bullet.vx),
            });
            worldChanged = true;
          }
          spent = true;
          break;
        }

        continue;
      }

      const absorbed = Math.min(bullet.damage, Math.max(0, crate.hp));
      damageCrate(crate, absorbed);
      bullet.damage -= absorbed;
      worldChanged = true;
      broadcastToAll({
        type: "bulletImpact",
        bulletId: bullet.id,
        ownerId: bullet.ownerId,
        x: bullet.x,
        y: bullet.y,
        damage: bullet.damage,
        spent: bullet.damage <= 0 || absorbed <= 0,
      });

      if (bullet.damage <= 0 || absorbed <= 0) {
        spent = true;
      }

      break;
    }

    if (!spent) {
      for (const [targetId, client] of clients) {
        if (targetId === bullet.ownerId || !client.state || client.state.health <= 0 || bullet.hitIds.has(targetId)) {
          continue;
        }

        if (!segmentHitsCircle(previousX, previousY, bullet.x, bullet.y, client.state.x, client.state.y, bullet.radius + getClientRadius(client))) {
          continue;
        }

        bullet.hitIds.add(targetId);

        if (bullet.weapon === "knife") {
          const absorbed = Math.min(bullet.damage, getDamageCapacity(client.state));
          if (absorbed > 0) {
            damageClient(targetId, absorbed, bullet.ownerId, getKnockback(absorbed, bullet.vx, bullet.vy));
            bullet.damage -= absorbed;
          }

          if (bullet.damage <= 0 || absorbed <= 0) {
            const dropId = bullet.pickup?.dropId || bullet.id;
            if (!handledDropIds.has(dropId)) {
              handledDropIds.add(dropId);
              spawnPickup(bullet.x, bullet.y, "knife", {
                count: 1,
                embedded: true,
                angle: bullet.angle ?? Math.atan2(bullet.vy, bullet.vx),
              });
              worldChanged = true;
            }
            spent = true;
            break;
          }

          continue;
        }

        const absorbed = Math.min(bullet.damage, getDamageCapacity(client.state));
        if (absorbed > 0) {
          damageClient(targetId, absorbed, bullet.ownerId, getKnockback(absorbed, bullet.vx, bullet.vy));
          bullet.damage -= absorbed;
        }

        if (bullet.damage <= 0 || absorbed <= 0) {
          spent = true;
        }

        break;
      }
    }

    const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

    if (expired && bullet.weapon === "knife") {
      const dropId = bullet.pickup?.dropId || bullet.id;
      if (!handledDropIds.has(dropId)) {
        handledDropIds.add(dropId);
        spawnPickup(clamp(bullet.x, 24, world.width - 24), clamp(bullet.y, 24, world.height - 24), "knife", {
          count: 1,
          embedded: true,
          angle: bullet.angle ?? Math.atan2(bullet.vy, bullet.vx),
        });
        worldChanged = true;
      }
    }

    if (spent || expired) {
      bullets.splice(index, 1);
    }
  }

  if (worldChanged) {
    broadcastWorld();
  }
}

createCrates();
ensureTestAiBots();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/") && (await handleApi(request, response, url.pathname))) {
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
});

function encodeFrame(data) {
  const payload = Buffer.from(JSON.stringify(data));
  const header = payload.length < 126 ? Buffer.alloc(2) : payload.length <= 0xffff ? Buffer.alloc(4) : Buffer.alloc(10);

  header[0] = 0x81;

  if (payload.length < 126) {
    header[1] = payload.length;
  } else if (payload.length <= 0xffff) {
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }

  return Buffer.concat([header, payload]);
}

function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const opcode = buffer[offset] & 0x0f;
    const masked = (buffer[offset + 1] & 0x80) !== 0;
    let length = buffer[offset + 1] & 0x7f;
    let headerLength = 2;

    if (length === 126) {
      if (offset + 4 > buffer.length) break;
      length = buffer.readUInt16BE(offset + 2);
      headerLength = 4;
    }

    if (!masked) break;
    if (offset + headerLength + 4 + length > buffer.length) break;

    const mask = buffer.subarray(offset + headerLength, offset + headerLength + 4);
    const payload = buffer.subarray(offset + headerLength + 4, offset + headerLength + 4 + length);
    const unmasked = Buffer.alloc(length);

    for (let index = 0; index < length; index += 1) {
      unmasked[index] = payload[index] ^ mask[index % 4];
    }

    if (opcode === 0x8) {
      messages.push({ type: "close" });
    } else if (opcode === 0x1) {
      messages.push({ type: "message", text: unmasked.toString("utf8") });
    }

    offset += headerLength + 4 + length;
  }

  return messages;
}

function send(socket, data) {
  if (socket && !socket.destroyed) {
    socket.write(encodeFrame(data));
  }
}

function broadcast(data, exceptId = null) {
  for (const [id, client] of clients) {
    if (id !== exceptId) {
      send(client.socket, data);
    }
  }
}

function broadcastToAll(data) {
  for (const client of clients.values()) {
    send(client.socket, data);
  }
}

function sanitizeChatText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signSession(account) {
  const payload = {
    sub: account.id,
    name: account.name || "Player",
    email: account.email || "",
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  };
  const encoded = base64UrlEncode(payload);
  const signature = crypto.createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = crypto.createHmac("sha256", sessionSecret).update(encoded).digest("base64url");

  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.sub || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getBearerAccount(request) {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  return verifySessionToken(token);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 128) {
        request.destroy();
        reject(new Error("Body too large"));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

async function verifyGoogleCredential(credential) {
  if (!googleClientId) {
    return { error: "GOOGLE_CLIENT_ID is not configured." };
  }

  const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential || "")}`;
  const result = await fetch(verifyUrl);

  if (!result.ok) {
    return { error: "Google token verification failed." };
  }

  const payload = await result.json();

  if (payload.aud !== googleClientId || !payload.sub) {
    return { error: "Google token audience mismatch." };
  }

  return {
    account: {
      id: `google:${payload.sub}`,
      name: payload.name || payload.email || "Google Player",
      email: payload.email || "",
    },
  };
}

async function getStoredProfile(userId) {
  if (!hasDatabase) {
    return null;
  }

  const query = `${supabaseUrl}/rest/v1/player_profiles?user_id=eq.${encodeURIComponent(userId)}&select=profile`;
  const result = await fetch(query, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  });

  if (!result.ok) {
    throw new Error(`Profile fetch failed: ${result.status}`);
  }

  const rows = await result.json();
  return rows[0]?.profile || null;
}

async function saveStoredProfile(userId, profile) {
  if (!hasDatabase) {
    return false;
  }

  const result = await fetch(`${supabaseUrl}/rest/v1/player_profiles?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      profile,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!result.ok) {
    throw new Error(`Profile save failed: ${result.status}`);
  }

  return true;
}

async function handleApi(request, response, pathname) {
  try {
    if (pathname === "/api/config" && request.method === "GET") {
      sendJson(response, 200, {
        googleClientId,
        serverStorage: hasDatabase,
      });
      return true;
    }

    if (pathname === "/api/auth/google" && request.method === "POST") {
      const body = await readJsonBody(request);
      const verified = await verifyGoogleCredential(body.credential);

      if (verified.error) {
        sendJson(response, 400, { error: verified.error });
        return true;
      }

      const profile = await getStoredProfile(verified.account.id);
      sendJson(response, 200, {
        account: verified.account,
        token: signSession(verified.account),
        profile,
        serverStorage: hasDatabase,
      });
      return true;
    }

    if (pathname === "/api/profile" && request.method === "GET") {
      const account = getBearerAccount(request);
      if (!account) {
        sendJson(response, 401, { error: "Unauthorized" });
        return true;
      }

      sendJson(response, 200, {
        profile: await getStoredProfile(account.sub),
        serverStorage: hasDatabase,
      });
      return true;
    }

    if (pathname === "/api/profile" && request.method === "POST") {
      const account = getBearerAccount(request);
      if (!account) {
        sendJson(response, 401, { error: "Unauthorized" });
        return true;
      }

      const body = await readJsonBody(request);
      await saveStoredProfile(account.sub, body.profile || {});
      sendJson(response, 200, { ok: true, serverStorage: hasDatabase });
      return true;
    }
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
    return true;
  }

  return false;
}

server.on("upgrade", (request, socket) => {
  const key = request.headers["sec-websocket-key"];

  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );

  const id = crypto.randomUUID();
  clients.set(id, { socket, state: null });
  send(socket, { type: "welcome", id, world: getWorldState() });
  if (!getWizardBossClient()) {
    nextWizardBossSpawnAt = Date.now();
    wizardBossWarningSent = false;
    spawnWizardBoss();
  }
  send(socket, { type: "bossStatus", status: getWizardBossStatus() });
  const activeBoss = getWizardBossClient();
  if (activeBoss?.state?.health > 0) {
    send(socket, { type: "state", id: wizardBossId, state: activeBoss.state });
  }

  socket.on("data", (buffer) => {
    for (const frame of decodeFrames(buffer)) {
      if (frame.type === "close") {
        socket.end();
        return;
      }

      let message;
      try {
        message = JSON.parse(frame.text);
      } catch {
        continue;
      }

      if (message.type === "state") {
        const client = clients.get(id);
        if (client) {
          const previous = client.state || {};
          const nextMaxHealth = message.state?.maxHealth ?? previous.maxHealth ?? defaultPlayerHealth;
          const previousMaxHealth = previous.maxHealth ?? nextMaxHealth;
          let nextHealth = previous.health ?? message.state?.health ?? nextMaxHealth;

          if (nextMaxHealth > previousMaxHealth) {
            nextHealth = Math.min(nextMaxHealth, nextHealth + (nextMaxHealth - previousMaxHealth));
          }

          client.state = {
            ...message.state,
            health: nextHealth,
            maxHealth: nextMaxHealth,
            shield: previous.shield ?? message.state.shield ?? 0,
            maxShield: previous.maxShield ?? message.state.maxShield ?? 125,
          };
        }
        broadcast({ type: "state", id, state: clients.get(id)?.state || message.state }, id);
      } else if (message.type === "respawn") {
        const client = clients.get(id);
        if (client) {
          client.state = {
            ...message.state,
            health: message.state?.maxHealth || defaultPlayerHealth,
            maxHealth: message.state?.maxHealth || defaultPlayerHealth,
            shield: 0,
            maxShield: message.state?.maxShield || 125,
          };
          send(socket, { type: "health", health: client.state.health, shield: client.state.shield });
          broadcast({ type: "state", id, state: client.state }, id);
        }
      } else if (message.type === "shot") {
        const nextBullet = {
          ...message.bullet,
          ownerId: id,
          id: message.bullet?.id || `${id}-${nextEntityId++}`,
          hitIds: new Set(),
        };
        if (nextBullet.weapon === "grenade") {
          nextBullet.life = clamp(Number(nextBullet.life || 0), 0, grenadeFuseSeconds);
          nextBullet.z = clamp(Number(nextBullet.z || 0), 0, 40);
          nextBullet.vz = clamp(Number(nextBullet.vz || 0), 0, 560);
          nextBullet.groundBounces = 0;
        } else if (nextBullet.weapon === "magicStaff") {
          nextBullet.followMouse = Boolean(nextBullet.followMouse);
          nextBullet.speed = clamp(Number(nextBullet.speed || Math.hypot(nextBullet.vx || 0, nextBullet.vy || 0) || 660), 120, 920);
          nextBullet.turnRate = clamp(Number(nextBullet.turnRate || 7.8), 0.5, 14);
          nextBullet.targetX = sanitizeMagicStaffTarget(nextBullet.targetX, world.width) ?? nextBullet.x;
          nextBullet.targetY = sanitizeMagicStaffTarget(nextBullet.targetY, world.height) ?? nextBullet.y;
        }
        bullets.push(nextBullet);
        broadcast({ type: "shot", id, bullet: { ...nextBullet, hitIds: undefined } }, id);
      } else if (message.type === "magicStaffAim") {
        const bullet = bullets.find((candidate) => (
          candidate.ownerId === id &&
          candidate.id === message.bulletId &&
          candidate.weapon === "magicStaff" &&
          candidate.followMouse
        ));
        const targetX = sanitizeMagicStaffTarget(message.targetX, world.width);
        const targetY = sanitizeMagicStaffTarget(message.targetY, world.height);
        if (bullet && targetX !== null && targetY !== null) {
          bullet.targetX = targetX;
          bullet.targetY = targetY;
          broadcast({ type: "magicStaffAim", id, bulletId: bullet.id, targetX, targetY }, id);
        }
      } else if (message.type === "knifeSwap") {
        const client = clients.get(id);
        const bullet = bullets.find((candidate) => candidate.id === message.bulletId && candidate.ownerId === id && candidate.weapon === "knife");

        if (client?.state && bullet) {
          const previousPlayerX = client.state.x;
          const previousPlayerY = client.state.y;
          const nextPlayerX = clamp(bullet.x, 24, world.width - 24);
          const nextPlayerY = clamp(bullet.y, 24, world.height - 24);

          bullets.splice(bullets.indexOf(bullet), 1);
          spawnPickup(previousPlayerX, previousPlayerY, "knife", { count: 1 });
          broadcastWorld();
          client.state = { ...client.state, x: nextPlayerX, y: nextPlayerY };

          send(socket, {
            type: "teleport",
            x: nextPlayerX,
            y: nextPlayerY,
            bulletId: bullet.id,
          });
          broadcast({ type: "state", id, state: client.state }, id);
          broadcast(
            {
              type: "knifeSwap",
              id,
              bulletId: bullet.id,
              playerX: nextPlayerX,
              playerY: nextPlayerY,
              bulletX: previousPlayerX,
              bulletY: previousPlayerY,
            },
            id,
          );
          broadcastEffect({ type: "teleport", x: nextPlayerX, y: nextPlayerY, phase: "arrive" });
          broadcastEffect({ type: "teleport", x: previousPlayerX, y: previousPlayerY, phase: "depart" });
        }
      } else if (message.type === "melee") {
        handleMelee(id, message.attack);
        broadcast({ type: "melee", id, attack: message.attack }, id);
      } else if (message.type === "lightningThrust") {
        handleLightningThrust(id, message.attack);
      } else if (message.type === "railburstCharge") {
        const client = clients.get(id);
        if (client?.state && message.charge) {
          broadcast({
            type: "railburstCharge",
            id,
            charge: {
              startX: clamp(Number(message.charge.startX), 0, world.width),
              startY: clamp(Number(message.charge.startY), 0, world.height),
              angle: Number(message.charge.angle || 0),
            },
          }, id);
        }
      } else if (message.type === "railburstFire") {
        handleRailburst(id, message.attack);
      } else if (message.type === "skill") {
        handleSkill(id, message);
      } else if (message.type === "dropPickup") {
        const client = clients.get(id);
        const pickup = message.pickup || {};
        const allowedTypes = new Set(["knife", "glock", "awm", "bazooka", "grenade", "magicStaff", "armor", "medkit"]);

        if (client?.state && allowedTypes.has(pickup.type)) {
          if (pickup.dropId && handledDropIds.has(pickup.dropId)) {
            continue;
          }

          const x = clamp(Number(pickup.x), 24, world.width - 24);
          const y = clamp(Number(pickup.y), 24, world.height - 24);

          if (Math.hypot(client.state.x - x, client.state.y - y) <= 1400) {
            if (pickup.dropId) {
              handledDropIds.add(pickup.dropId);
            }
            spawnPickup(x, y, pickup.type, {
              count: Math.max(1, Number(pickup.count || 1)),
              ammo: Math.max(0, Number(pickup.ammo || 0)),
              magAmmo: Math.max(0, Number(pickup.magAmmo || 0)),
              embedded: pickup.type === "knife" && Boolean(pickup.embedded),
              angle: Number.isFinite(Number(pickup.angle)) ? Number(pickup.angle) : undefined,
              dropId: pickup.dropId,
            });
            broadcastWorld();
          }
        }
      } else if (message.type === "pickupRequest") {
        const client = clients.get(id);
        const pickup = pickups.find((candidate) => candidate.id === message.id);
        const requestX = Number.isFinite(Number(message.x)) ? Number(message.x) : pickup?.x;
        const requestY = Number.isFinite(Number(message.y)) ? Number(message.y) : pickup?.y;
        if (client?.state && pickup && Math.hypot(client.state.x - requestX, client.state.y - requestY) <= 72) {
          if (pickup.expiresAt && pickup.expiresAt <= Date.now()) {
            pickups.splice(pickups.indexOf(pickup), 1);
            broadcastWorld();
            continue;
          }

          pickups.splice(pickups.indexOf(pickup), 1);

          if (pickup.type === "armor") {
            const maxShield = client.state.maxShield || 125;
            client.state = { ...client.state, shield: Math.min(maxShield, (client.state.shield || 0) + 25), maxShield };
            send(socket, { type: "health", health: client.state.health, shield: client.state.shield });
          } else if (pickup.type === "medkit") {
            client.state = {
              ...client.state,
              health: Math.min(
                client.state.maxHealth || defaultPlayerHealth,
                (client.state.health || defaultPlayerHealth) + (client.state.healAmount || 60),
              ),
            };
            send(socket, { type: "health", health: client.state.health, shield: client.state.shield || 0 });
          } else if (pickup.type === "xp") {
            send(socket, { type: "xpGranted", value: pickup.value || xpDropValue });
          } else if (pickup.type === "coin") {
            send(socket, {
              type: "coinGranted",
              value: pickup.value || coinValues[pickup.coinKind] || coinValues.bronze,
              coinKind: pickup.coinKind || "bronze",
            });
          } else {
            send(socket, { type: "pickupGranted", item: pickup });
          }

          broadcastWorld();
        }
      } else if (message.type === "damageMe") {
        const client = clients.get(id);
        if (client?.state) {
          damageClient(id, message.damage, message.sourceId);
        }
      } else if (message.type === "chat") {
        const client = clients.get(id);
        const text = sanitizeChatText(message.text);

        if (client?.state && text) {
          broadcast({
            type: "chat",
            id,
            name: String(client.state.name || message.name || "Player").slice(0, 18),
            text,
          }, id);
        }
      } else if (message.type === "dead") {
        const client = clients.get(id);
        if (client?.state && (client.state.health || 0) > 0) {
          client.state = { ...client.state, health: 0 };
          dropPlayerLoot(client.state);
          broadcastWorld();
        }
        broadcast({ type: "dead", id }, id);
      } else if (message.type === "toggleAi") {
        setTestAiEnabled(Boolean(message.enabled));
      }
    }
  });

  socket.on("close", () => {
    clients.delete(id);
    broadcast({ type: "leave", id });
  });

  socket.on("error", () => {
    clients.delete(id);
    broadcast({ type: "leave", id });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Core Drift multiplayer server running at http://localhost:${port}`);
});

setInterval(() => {
  for (const kind of crateTierOrder) {
    if (getCrateCount(kind) < crateTiers[kind].count) {
      spawnCrate(kind);
      broadcastWorld();
    }
  }
}, crateRespawnMs);

setInterval(() => {
  if (cleanupExpiredPickups()) {
    broadcastWorld();
  }
}, 1000);

setInterval(() => {
  const now = Date.now();
  const delta = Math.min((now - lastTick) / 1000, 0.05);
  lastTick = now;
  updateBullets(delta);
  updateStaticCollapseProjectiles(delta);
  updateTestAiBots(delta);
  updateWizardBoss(delta);
}, 1000 / 60);
