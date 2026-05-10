const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startScreen = document.querySelector("#startScreen");
const startButton = document.querySelector("#startButton");
const nicknameInput = document.querySelector("#nicknameInput");
const coords = document.querySelector("#coords");
const dashStatus = document.querySelector("#dashStatus");
const healthStatus = document.querySelector("#healthStatus");
const healthBarFill = document.querySelector("#healthBarFill");
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
  width: 3600,
  height: 3600,
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
  hurtTimer: 0,
  vx: 0,
  vy: 0,
  shotTimer: 0,
  swingTimer: 0,
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
    bulletSpeed: 1320,
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
let crateRegenTimer = 10;
let audioContext = null;
let draggedSlot = null;
let gameStarted = false;
let socket = null;
let localClientId = null;
let lastNetworkSend = 0;
let sharedWorldActive = false;

const remotePlayers = new Map();
const remoteBullets = [];

function spawnCrate() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const size = 46 + Math.random() * 18;
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
      rotation: Math.random() * Math.PI * 2,
      hp: 150,
      maxHp: 150,
    });
    return true;
  }

  return false;
}

function createCrates() {
  crates.length = 0;

  while (crates.length < 10) {
    spawnCrate();
  }
}

function resetGameState() {
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.vx = 0;
  player.vy = 0;
  player.health = player.maxHealth;
  player.shield = 0;
  player.hurtTimer = 0;
  player.shotTimer = 0;
  player.swingTimer = 0;
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

  crateRegenTimer = 10;
  if (!sharedWorldActive) {
    createCrates();
  }
  updateInventory();
}

function showStartScreen() {
  gameStarted = false;
  document.body.classList.add("game-pending");
  startScreen.classList.remove("hidden");
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

function circleHitsBox(circle, box) {
  const half = box.size / 2;
  const closestX = clamp(circle.x, box.x - half, box.x + half);
  const closestY = clamp(circle.y, box.y - half, box.y + half);
  return Math.hypot(circle.x - closestX, circle.y - closestY) <= circle.radius;
}

function damageCrate(index, damage) {
  const crate = crates[index];

  if (sharedWorldActive && crate?.id) {
    sendNetwork("crateDamage", { id: crate.id, damage });
    return true;
  }

  crate.hp -= damage;

  if (crate.hp <= 0) {
    spawnPickup(crate.x, crate.y);
    crates.splice(index, 1);
    return true;
  }

  return false;
}

function spawnPickup(x, y, forcedType = null) {
  const types = ["knife", "glock", "awm", "armor", "medkit"];
  const type = forcedType || types[Math.floor(Math.random() * types.length)];

  pickups.push({
    x,
    y,
    type,
    radius: 18,
    bob: Math.random() * Math.PI * 2,
  });
}

function applyDamage(amount) {
  if (sharedWorldActive) {
    sendNetwork("damageMe", { damage: amount });
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

  if (player.health <= 0) {
    sendNetwork("dead", {});
    showStartScreen();
    resetGameState();
  }
}

function addWeaponToInventory(weaponName) {
  if (weaponName === "knife") {
    const existingSlot = [1, 2, 3].find((slot) => weapons.slots[slot] === "knife");

    if (existingSlot) {
      weapons.knife.count += 1;
      return true;
    }

    const emptySlot = [1, 2, 3].find((slot) => !weapons.slots[slot]);

    if (!emptySlot) {
      return false;
    }

    weapons.slots[emptySlot] = "knife";
    weapons.knife.count = Math.max(1, weapons.knife.count + 1);
    return true;
  }

  const existingSlot = [1, 2, 3].find((slot) => weapons.slots[slot] === weaponName);

  if (existingSlot) {
    weapons[weaponName].ammo += weapons[weaponName].magazineSize;
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
  weapons[weaponName].ammo += weapons[weaponName].magazineSize;
  if (weapons[weaponName].magAmmo <= 0) {
    const loaded = Math.min(weapons[weaponName].magazineSize, weapons[weaponName].ammo);
    weapons[weaponName].magAmmo = loaded;
    weapons[weaponName].ammo -= loaded;
  }
  weapons[weaponName].reloadTimer = 0;
  return true;
}

function collectPickup(index) {
  const pickup = pickups[index];

  if (sharedWorldActive && pickup?.id) {
    sendNetwork("pickupRequest", { id: pickup.id });
    return;
  }

  let collected = false;

  if (pickup.type === "knife" || pickup.type === "glock") {
    collected = addWeaponToInventory(pickup.type);
  } else if (pickup.type === "awm") {
    collected = addWeaponToInventory("awm");
  } else if (pickup.type === "armor") {
    player.shield = player.maxShield;
    collected = true;
  } else if (pickup.type === "medkit") {
    player.health = Math.min(player.maxHealth, player.health + 60);
    collected = true;
  }

  if (!collected) {
    return;
  }

  pickups.splice(index, 1);
  playPickupSound(pickup.type);
  updateInventory();
}

function applyPickupItem(type) {
  let collected = false;

  if (type === "knife" || type === "glock") {
    collected = addWeaponToInventory(type);
  } else if (type === "awm") {
    collected = addWeaponToInventory("awm");
  } else if (type === "armor") {
    player.shield = player.maxShield;
    collected = true;
  } else if (type === "medkit") {
    player.health = Math.min(player.maxHealth, player.health + 60);
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
  playTone({ frequency: base, duration: 0.08, type: "triangle", gain: 0.07 });
  playTone({ frequency: base * 1.5, duration: 0.12, type: "triangle", gain: 0.05, when: 0.06 });
}

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
      remotePlayers.set(message.id, message.state);
    } else if (message.type === "shot") {
      remoteBullets.push({
        ...message.bullet,
        ownerId: message.id,
      });
    } else if (message.type === "melee") {
      handleRemoteMelee(message.attack);
    } else if (message.type === "world") {
      sharedWorldActive = true;
      crates.splice(0, crates.length, ...message.world.crates);
      pickups.splice(0, pickups.length, ...message.world.pickups);
    } else if (message.type === "pickupGranted") {
      applyPickupItem(message.item);
    } else if (message.type === "health") {
      player.health = message.health;
      player.shield = message.shield;

      if (player.health <= 0) {
        showStartScreen();
        resetGameState();
      }
    } else if (message.type === "leave" || message.type === "dead") {
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

function sendNetwork(type, payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, ...payload }));
  }
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
    selectedWeapon: weapons.slots[weapons.selectedSlot],
    aimAngle: getAimAngle(),
    knifeCharging: player.knifeCharging,
    knifeCharge: player.knifeCharge,
  };
}

function handleRemoteMelee(attack) {
  const distance = Math.hypot(player.x - attack.x, player.y - attack.y);

  if (distance > attack.range + player.radius) {
    return;
  }

  const targetAngle = Math.atan2(player.y - attack.y, player.x - attack.x);
  const angleDiff = Math.atan2(Math.sin(targetAngle - attack.angle), Math.cos(targetAngle - attack.angle));

  if (Math.abs(angleDiff) <= attack.arc / 2) {
    applyDamage(attack.damage);
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
    if (weapon.ammo > 0) {
      weapon.reloadTimer = weapon.reloadTime;
    }

    return false;
  }

  const angle = getAimAngle();
  const barrelLength = isGlock ? player.radius + 22 : player.radius + 48;

  const bullet = {
    x: player.x + Math.cos(angle) * barrelLength,
    y: player.y + Math.sin(angle) * barrelLength,
    vx: Math.cos(angle) * weapon.bulletSpeed + player.vx * 0.18,
    vy: Math.sin(angle) * weapon.bulletSpeed + player.vy * 0.18,
    radius: weapon.bulletRadius,
    life: weapon.bulletLife,
    damage: weapon.damage,
    weapon: isGlock ? "glock" : "awm",
  };

  bullets.push(bullet);
  sendNetwork("shot", { bullet });

  weapon.magAmmo -= 1;

  if (weapon.magAmmo <= 0 && weapon.ammo > 0) {
    weapon.reloadTimer = weapon.reloadTime;
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
      damage: knife.damage,
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
      damageCrate(index, knife.damage);
      hitSomething = true;
    }
  }

  player.swingTimer = knife.swingDuration;
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
  const speed = 430 + chargeRatio * 760;
  const damage = Math.round(weapons.knife.damage + (200 - weapons.knife.damage) * chargeRatio);

  const bullet = {
    x: player.x + Math.cos(angle) * (player.radius + 18),
    y: player.y + Math.sin(angle) * (player.radius + 18),
    vx: Math.cos(angle) * speed + player.vx * 0.12,
    vy: Math.sin(angle) * speed + player.vy * 0.12,
    radius: 10,
    life: 0.28 + chargeRatio * 0.46,
    damage,
    angle,
    weapon: "knife",
  };

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

  player.x = clamp(nextX, player.radius, world.width - player.radius);
  player.y = clamp(nextY, player.radius, world.height - player.radius);

  if (player.x !== nextX) {
    player.vx = 0;
  }

  if (player.y !== nextY) {
    player.vy = 0;
  }

  player.shotTimer -= delta;
  player.swingTimer = Math.max(0, player.swingTimer - delta);
  if (player.knifeCharging && weapons.slots[weapons.selectedSlot] === "knife") {
    player.knifeCharge = Math.min(player.knifeChargeMax, player.knifeCharge + delta);
  }
  player.dashTimer = Math.max(0, player.dashTimer - delta);

  for (const weaponName of ["glock", "awm"]) {
    const weapon = weapons[weaponName];

    if (weapon.reloadTimer > 0) {
      weapon.reloadTimer = Math.max(0, weapon.reloadTimer - delta);

      if (weapon.reloadTimer === 0) {
        const loaded = Math.min(weapon.magazineSize, weapon.ammo);
        weapon.magAmmo = loaded;
        weapon.ammo -= loaded;
      }
    }
  }

  player.hurtTimer = Math.max(0, player.hurtTimer - delta);

  if (mouse.down && player.shotTimer <= 0) {
    if (weapons.slots[weapons.selectedSlot] === "knife" && swingKnife()) {
      player.shotTimer = weapons.knife.fireRate;
    } else if (fireBullet()) {
      player.shotTimer = weapons.slots[weapons.selectedSlot] === "awm" ? weapons.awm.fireRate : weapons.glock.fireRate;
    } else {
      player.shotTimer = 0.05;
    }
  }

  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    const bullet = bullets[index];
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    let hitCrate = false;

    for (let crateIndex = crates.length - 1; crateIndex >= 0; crateIndex -= 1) {
      if (circleHitsBox(bullet, crates[crateIndex])) {
        damageCrate(crateIndex, bullet.damage);
        hitCrate = true;
        break;
      }
    }

    const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

    if (bullet.weapon === "knife" && (hitCrate || expired)) {
      spawnPickup(clamp(bullet.x, player.radius, world.width - player.radius), clamp(bullet.y, player.radius, world.height - player.radius), "knife");
    }

    if (hitCrate || expired) {
      bullets.splice(index, 1);
    }
  }

  for (let index = remoteBullets.length - 1; index >= 0; index -= 1) {
    const bullet = remoteBullets[index];
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;

    const hitPlayer = Math.hypot(bullet.x - player.x, bullet.y - player.y) <= bullet.radius + player.radius;
    const expired = bullet.life <= 0 || bullet.x < -80 || bullet.x > world.width + 80 || bullet.y < -80 || bullet.y > world.height + 80;

    if (hitPlayer) {
      applyDamage(bullet.damage);
    }

    if (hitPlayer || expired) {
      remoteBullets.splice(index, 1);
    }
  }

  for (let index = pickups.length - 1; index >= 0; index -= 1) {
    const pickup = pickups[index];

    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) <= pickup.radius + player.radius) {
      collectPickup(index);
    }
  }

  crateRegenTimer -= delta;

  if (!sharedWorldActive && crateRegenTimer <= 0) {
    if (crates.length < 10) {
      spawnCrate();
    }

    crateRegenTimer = 10;
  }

  camera.x += (player.x - camera.x) * camera.smoothing;
  camera.y += (player.y - camera.y) * camera.smoothing;

  lastNetworkSend -= delta;

  if (lastNetworkSend <= 0) {
    sendNetwork("state", { state: getPlayerSnapshot() });
    lastNetworkSend = 0.05;
  }

  coords.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
  healthStatus.textContent = `HP ${Math.ceil(player.health)} / ${player.maxHealth} | SH ${Math.ceil(player.shield)}`;
  healthBarFill.style.width = `${clamp(player.health / player.maxHealth, 0, 1) * 100}%`;
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

  if (!weapons.slots[slot]) {
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
  spawnPickup(player.x + Math.cos(angle) * 64, player.y + Math.sin(angle) * 64, selectedWeapon);

  if (selectedWeapon === "knife") {
    weapons.knife.count -= 1;

    if (weapons.knife.count <= 0) {
      weapons.slots[weapons.selectedSlot] = null;
    }
  } else {
    weapons.slots[weapons.selectedSlot] = null;
  }

  player.knifeCharging = false;
  player.knifeCharge = 0;

  const nextSlot = [1, 2, 3].find((slot) => weapons.slots[slot]);
  weapons.selectedSlot = nextSlot || weapons.selectedSlot;
  updateInventory();
}

function worldToScreenX(x) {
  return x - camera.x + width / 2;
}

function worldToScreenY(y) {
  return y - camera.y + height / 2;
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

  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(255, 95, 95, 0.72)";
  ctx.strokeRect(x, y, world.width, world.height);
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

function drawRemotePlayers(time) {
  for (const remote of remotePlayers.values()) {
    const x = worldToScreenX(remote.x);
    const y = worldToScreenY(remote.y);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(remote.aimAngle || 0);

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
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#5f6645";
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(player.radius + 52, 0);
      ctx.stroke();
    } else if (remote.selectedWeapon === "knife") {
      ctx.fillStyle = "#d9e0e3";
      ctx.strokeStyle = "#55666f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.radius - 1, -7);
      ctx.lineTo(player.radius + 32, -2);
      ctx.lineTo(player.radius + 10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.rotate(-(remote.aimAngle || 0));
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
      const shieldRatio = remote.shield / remote.maxShield;
      const shieldPulse = Math.sin(time * 0.007) * 2;
      ctx.strokeStyle = `rgba(141, 244, 223, ${0.24 + shieldRatio * 0.38})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 13 + shieldPulse, 0, Math.PI * 2);
      ctx.stroke();
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
    if (player.swingTimer > 0) {
      const swingProgress = 1 - player.swingTimer / weapons.knife.swingDuration;
      ctx.strokeStyle = "rgba(246, 242, 233, 0.66)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(16, 0, weapons.knife.range * 0.72, -0.8 + swingProgress * 0.4, 0.8 + swingProgress * 0.4);
      ctx.stroke();
    }

    ctx.fillStyle = "#d9e0e3";
    ctx.strokeStyle = "#55666f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.radius - 1, -7);
    ctx.lineTo(player.radius + 36, -2);
    ctx.lineTo(player.radius + 10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
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
    const shieldRatio = player.shield / player.maxShield;
    const shieldPulse = Math.sin(time * 0.007) * 2;
    ctx.strokeStyle = `rgba(141, 244, 223, ${0.28 + shieldRatio * 0.42})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 13 + shieldPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(88, 166, 255, ${0.12 + shieldRatio * 0.2})`;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 20 + shieldPulse, -0.7, Math.PI * 1.45);
    ctx.stroke();
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

  drawGrid();
  drawWorldBounds();
  drawCrates();
  drawPickups(time);
  drawBullets();
  drawRemoteBullets();
  drawRemotePlayers(time);
  drawPlayer(time);
  drawVignette();
  drawMinimap();
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

  if (event.key.toLowerCase() === "f") {
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

resize();
document.body.classList.add("game-pending");
createCrates();
updateInventory();
requestAnimationFrame(tick);
