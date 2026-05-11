const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const clients = new Map();
const world = { width: 3600, height: 3600 };
const crates = [];
const pickups = [];
let nextEntityId = 1;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function spawnCrate() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const size = 46 + Math.random() * 18;
    const x = size + Math.random() * (world.width - size * 2);
    const y = size + Math.random() * (world.height - size * 2);

    crates.push({
      id: nextEntityId++,
      x,
      y,
      size,
      rotation: Math.random() * Math.PI * 2,
      hp: 150,
      maxHp: 150,
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
    radius: 18,
    bob: Math.random() * Math.PI * 2,
  });
}

function createCrates() {
  crates.length = 0;
  pickups.length = 0;

  while (crates.length < 10) {
    spawnCrate();
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

createCrates();

const server = http.createServer((request, response) => {
  const requestedPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
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
          client.state = {
            ...message.state,
            health: previous.health ?? message.state.health ?? 200,
            maxHealth: previous.maxHealth ?? message.state.maxHealth ?? 200,
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
            health: message.state?.maxHealth || 200,
            maxHealth: message.state?.maxHealth || 200,
            shield: 0,
            maxShield: message.state?.maxShield || 125,
          };
          send(socket, { type: "health", health: client.state.health, shield: client.state.shield });
          broadcast({ type: "state", id, state: client.state }, id);
        }
      } else if (message.type === "shot") {
        broadcast({ type: "shot", id, bullet: message.bullet }, id);
      } else if (message.type === "melee") {
        broadcast({ type: "melee", id, attack: message.attack }, id);
      } else if (message.type === "dropPickup") {
        const client = clients.get(id);
        const pickup = message.pickup || {};
        const allowedTypes = new Set(["knife", "glock", "awm", "armor", "medkit"]);

        if (client?.state && allowedTypes.has(pickup.type)) {
          const x = clamp(Number(pickup.x), 24, world.width - 24);
          const y = clamp(Number(pickup.y), 24, world.height - 24);

          if (Math.hypot(client.state.x - x, client.state.y - y) <= 1400) {
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
          const destroyed = crate.hp - message.damage <= 0;
          crate.hp -= message.damage;
          if (crate.hp <= 0) {
            spawnPickup(crate.x, crate.y);
            crates.splice(crates.indexOf(crate), 1);
          }
          broadcastEffect({ type: destroyed ? "crateBreak" : "crateHit", x: crate.x, y: crate.y });
          broadcastWorld();
        }
      } else if (message.type === "pickupRequest") {
        const client = clients.get(id);
        const pickup = pickups.find((candidate) => candidate.id === message.id);
        if (client?.state && pickup && Math.hypot(client.state.x - pickup.x, client.state.y - pickup.y) <= 72) {
          pickups.splice(pickups.indexOf(pickup), 1);

          if (pickup.type === "armor") {
            client.state = { ...client.state, shield: 125, maxShield: 125 };
            send(socket, { type: "health", health: client.state.health, shield: client.state.shield });
          } else if (pickup.type === "medkit") {
            client.state = { ...client.state, health: Math.min(client.state.maxHealth || 200, (client.state.health || 200) + 60) };
            send(socket, { type: "health", health: client.state.health, shield: client.state.shield || 0 });
          } else {
            send(socket, { type: "pickupGranted", item: pickup });
          }

          broadcastWorld();
        }
      } else if (message.type === "damageMe") {
        const client = clients.get(id);
        if (client?.state) {
          const previousHealth = client.state.health || 0;
          const previousShield = client.state.shield || 0;
          client.state = applyDamageToState(client.state, message.damage);
          send(socket, { type: "health", health: client.state.health, shield: client.state.shield || 0 });
          broadcast({ type: "state", id, state: client.state }, id);

          if ((client.state.health || 0) < previousHealth || (client.state.shield || 0) < previousShield) {
            const source = clients.get(message.sourceId);
            const effect = { type: "playerHit", x: client.state.x, y: client.state.y };
            send(socket, { type: "effect", effect });
            if (source && source !== client) {
              send(source.socket, { type: "effect", effect });
            }
          }

          if (client.state.health <= 0) {
            broadcast({ type: "dead", id }, id);
          }
        }
      } else if (message.type === "dead") {
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
  if (crates.length < 10) {
    spawnCrate();
    broadcastWorld();
  }
}, 10000);
