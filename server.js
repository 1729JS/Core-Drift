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
const world = { width: 8800, height: 8800 };
const maxCrates = 40;
const maxMetalCrates = 20;
const maxGoldCrates = 10;
const crateRespawnMs = 5000;
const basicCrateHealth = 150;
const metalCrateHealth = 500;
const goldCrateHealth = 1000;
const xpDropValue = 38;
const metalCrateXpValue = 125;
const goldCrateXpValue = 350;
const pickupLifetimeMs = 5 * 60 * 1000;
const defaultPlayerHealth = 200;
const coinValues = {
  bronze: 5,
  silver: 10,
  gold: 100,
};
const crates = [];
const pickups = [];
const bullets = [];
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

    crates.push({
      id: nextEntityId++,
      x,
      y,
      size,
      kind,
      rotation: Math.random() * Math.PI * 2,
      hp: isGold ? goldCrateHealth : isMetal ? metalCrateHealth : basicCrateHealth,
      maxHp: isGold ? goldCrateHealth : isMetal ? metalCrateHealth : basicCrateHealth,
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

function getKnockback(damage, vx, vy) {
  const length = Math.hypot(vx, vy);

  if (length <= 0) {
    return null;
  }

  const force = clamp(110 + damage * 3.2, 150, 620);
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

  const xpValue = Math.max(25, Math.round((state.level || 1) * 28 + (state.xp || 0) * 0.35));
  spawnPickup(clamp(state.x + 18, 24, world.width - 24), clamp(state.y - 42, 24, world.height - 24), "xp", { value: xpValue });
}

function damageClient(targetId, amount, sourceId = null, knockback = null) {
  const client = clients.get(targetId);

  if (!client?.state || amount <= 0) {
    return false;
  }

  const previousHealth = client.state.health || 0;
  const previousShield = client.state.shield || 0;
  client.state = applyDamageToState(client.state, amount);
  send(client.socket, { type: "health", health: client.state.health, shield: client.state.shield || 0, knockback });
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
    crates.splice(crates.indexOf(crate), 1);
  }

  broadcastEffect({ type: destroyed ? "crateBreak" : "crateHit", x: crate.x, y: crate.y });
  broadcastWorld();
}

function handleMelee(ownerId, attack) {
  const owner = clients.get(ownerId);

  if (!owner?.state) {
    return;
  }

  for (const [targetId, client] of clients) {
    if (targetId === ownerId || !client.state || client.state.health <= 0) {
      continue;
    }

    const distance = Math.hypot(client.state.x - attack.x, client.state.y - attack.y);

    if (distance > attack.range + 24) {
      continue;
    }

    const targetAngle = Math.atan2(client.state.y - attack.y, client.state.x - attack.x);
    const angleDiff = Math.atan2(Math.sin(targetAngle - attack.angle), Math.cos(targetAngle - attack.angle));

    if (Math.abs(angleDiff) <= attack.arc / 2) {
      damageClient(targetId, attack.damage, ownerId);
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

    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(data);
  });
});

function encodeFrame(data) {
  const payload = Buffer.from(JSON.stringify(data));
  const header = payload.length < 126 ? Buffer.alloc(2) : Buffer.alloc(4);

  header[0] = 0x81;

  if (payload.length < 126) {
    header[1] = payload.length;
  } else {
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
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
      } else if (message.type === "crateDamage") {
        const crate = crates.find((candidate) => candidate.id === message.id);
        if (crate) {
          damageCrate(crate, Math.max(0, Number(message.damage || 0)));
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
  if (getCrateCount("basic") < maxCrates) {
    spawnCrate("basic");
    broadcastWorld();
  }

  if (getCrateCount("metal") < maxMetalCrates) {
    spawnCrate("metal");
    broadcastWorld();
  }

  if (getCrateCount("gold") < maxGoldCrates) {
    spawnCrate("gold");
    broadcastWorld();
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
}, 1000 / 60);
