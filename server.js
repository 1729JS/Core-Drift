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
const crateRespawnMs = 5000;
const railburstRange = 1500;
const railburstMaxDamage = 260;
const staticCollapseDelayMs = 800;
const staticCollapseMaxRadius = 320;
const staticCollapseProjectileSpeed = 760;
const arcPrisonEdgeWidth = 7;
const arcPrisonSlowMs = 1600;
const areaSkillMaxDamage = 180;
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

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const hasDatabase = Boolean(supabaseUrl && supabaseServiceKey);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  const width = crate.size * getCrateSpriteScale(kind);
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

function spawnPickup(x, y, forcedType = null, data = {}) {
  const types = ["knife", "glock", "awm", "armor", "medkit"];
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
    } else if (weaponName === "glock" || weaponName === "awm") {
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
    dropPlayerLoot(client.state);
    broadcastWorld();
    broadcast({ type: "dead", id: targetId }, targetId);
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

    if (distance > range + 24) {
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

    if (segmentHitsCircle(startX, startY, endX, endY, client.state.x, client.state.y, radius + 24)) {
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

    if (segmentHitsCircle(startX, startY, endX, endY, client.state.x, client.state.y, width / 2 + 24)) {
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

function damageArea(ownerId, x, y, radius, damage, knockbackScale = 1, displacement = 0, falloffKnockback = false) {
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
    if (distance <= radius + 24) {
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
      damageClient(targetId, damage, ownerId, getKnockback(damage, client.state.x - x, client.state.y - y, knockbackScale * knockbackRatio));
    }
  }

  if (worldChanged) {
    broadcastWorld();
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
    if (edgeDistance <= arcPrisonEdgeWidth + 24) {
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
    damageArea(ownerId, owner.state.x, owner.state.y, radius, damage, 2.8, 100, true);
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
      if (segmentHitsCircle(previousX, previousY, projectile.x, projectile.y, client.state.x, client.state.y, projectile.radius + 24)) {
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
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

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
            spawnPickup(hitPoint.x, hitPoint.y, "knife", { count: 1 });
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

        if (!segmentHitsCircle(previousX, previousY, bullet.x, bullet.y, client.state.x, client.state.y, bullet.radius + 24)) {
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
              spawnPickup(bullet.x, bullet.y, "knife", { count: 1 });
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
        spawnPickup(clamp(bullet.x, 24, world.width - 24), clamp(bullet.y, 24, world.height - 24), "knife", { count: 1 });
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
  if (!socket.destroyed) {
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
        bullets.push({
          ...message.bullet,
          ownerId: id,
          id: message.bullet?.id || `${id}-${nextEntityId++}`,
          hitIds: new Set(),
        });
        broadcast({ type: "shot", id, bullet: message.bullet }, id);
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
          broadcastEffect({ type: "teleport", x: nextPlayerX, y: nextPlayerY });
          broadcastEffect({ type: "teleport", x: previousPlayerX, y: previousPlayerY });
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
        const allowedTypes = new Set(["knife", "glock", "awm", "armor", "medkit"]);

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
}, 1000 / 60);
