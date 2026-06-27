// --- CONFIG DATA ASSETS ---
const WEAPONS = [
    { id: 'w1', name: 'Wooden Sword', icon: '🪵', req: 1, cost: 50, power: 2, mult: '×2.2' },
    { id: 'w2', name: 'Iron Dagger', icon: '🗡️', req: 3, cost: 500, power: 10, mult: '×7' },
    { id: 'w3', name: 'Laser Pistol', icon: '🔫', req: 7, cost: 4000, power: 50, mult: '×30' },
    { id: 'w4', name: 'Plasma Rifle', icon: '🌀', req: 12, cost: 25000, power: 250, mult: '×135' },
    { id: 'w5', name: 'Mythic Katana', icon: '🔮', req: 20, cost: 150000, power: 1500, mult: '×700' },
    { id: 'w6', name: 'Holy Relic', icon: '🔱', req: 35, cost: 1000000, power: 10000, mult: '×4000' }
];

const EGGS = [
    {
        id: 'e1', name: 'Common Egg', icon: '🥚', cost: 1000,
        pool: [
            { name: 'Dog', icon: '🐶', type: 'Common', rate: 0.45, cps: 10 },
            { name: 'Cat', icon: '🐱', type: 'Common', rate: 0.45, cps: 10 },
            { name: 'Shiba Inu', icon: '🐕', type: 'Legendary', rate: 0.10, cps: 50, skill: 'Bark Shockwave 🔊' }
        ]
    },
    {
        id: 'e2', name: 'Water Egg', icon: '💧', cost: 5000,
        pool: [
            { name: 'Fish', icon: '🐟', type: 'Common', rate: 0.50, cps: 50 },
            { name: 'Octopus', icon: '🐙', type: 'Rare', rate: 0.35, cps: 100 },
            { name: 'Shark', icon: '🦈', type: 'Legendary', rate: 0.15, cps: 300, skill: 'Tsunami Crash 🌊' }
        ]
    },
    {
        id: 'e3', name: 'Jungle Egg', icon: '🌲', cost: 25000,
        pool: [
            { name: 'Monkey', icon: '🐒', type: 'Common', rate: 0.45, cps: 250 },
            { name: 'Snake', icon: '🐍', type: 'Rare', rate: 0.35, cps: 600 },
            { name: 'Tiger', icon: '🐅', type: 'Legendary', rate: 0.15, cps: 1800, skill: 'Jungle Roar 🐯' },
            { name: 'Owl', icon: '🦉', type: 'Mythical', rate: 0.05, cps: 5000, skill: 'Night Vision 👁️' }
        ]
    },
    {
        id: 'e4', name: 'Primal Egg', icon: '🦴', cost: 100000,
        pool: [
            { name: 'Brachiosaurus', icon: '🦕', type: 'Rare', rate: 0.60, cps: 8000 },
            { name: 'T-Rex', icon: '🦖', type: 'Legendary', rate: 0.30, cps: 22000, skill: 'Primal Crash 🦖' },
            { name: 'Mighty Dragon', icon: '🐉', type: 'Mythical', rate: 0.10, cps: 75000, skill: 'Prehistoric Roar 🐲' }
        ]
    }
];

const ENEMIES = [
    { name: 'Wild Monkey', icon: '🐒' }, { name: 'Boar Prime', icon: '🐗' },
    { name: 'Viper Cobra', icon: '🐍' }, { name: 'Spider Node', icon: '🕷️' },
    { name: 'Mech Golem', icon: '🤖' }, { name: 'Primal Gorilla', icon: '🦍' }
];

// --- APP STATE ENGINE ---
let userState = {
    clicks: 0, level: 1, xp: 0, stage: 1,
    equippedWeapon: null, unlockedWeapons: [],
    ownedPets: [], 
    equippedPets: [] 
};

let currentEnemyHP = 150;
let maxEnemyHP = 150;

// --- INIT APP CORE ---
window.addEventListener('DOMContentLoaded', () => {
    loadGame();
    setupEnemies();
    renderArmory();
    renderEggs();
    renderInventory();
    updateUI();

    document.getElementById('attack-btn').addEventListener('click', function(e) {
        let power = getClickPower();
        userState.clicks += power;
        addXP(power);
        damageEnemy(power);

        let sprite = document.getElementById('enemy-sprite');
        if (sprite) {
            sprite.style.transform = 'scale(0.85)';
            setTimeout(() => sprite.style.transform = 'scale(1)', 80);
        }
        createFloatingText(`+${power} ⚡`, e.clientX || window.innerWidth/2, (e.clientY || window.innerHeight/2) - 30);
        updateUI();
        saveGame();
    });

    setInterval(() => {
        let cps = getTotalCPS();
        if (cps > 0) { userState.clicks += cps; updateUI(); }
    }, 1000);
});

function getClickPower() {
    if (userState.equippedWeapon) {
        const weapon = WEAPONS.find(w => w.id === userState.equippedWeapon);
        if (weapon) return weapon.power;
    }
    return 2; 
}

function getTotalCPS() {
    let total = 0;
    userState.equippedPets.forEach(petName => {
        const pet = userState.ownedPets.find(p => p.name === petName);
        if (pet) total += pet.cps;
    });
    return total;
}

function addXP(amount) {
    userState.xp += amount;
    let xpNeeded = userState.level * 100;
    while (userState.xp >= xpNeeded) {
        userState.xp -= xpNeeded;
        userState.level++;
        createFloatingText(`LEVEL UP! 🎉`, window.innerWidth/2, window.innerHeight/2);
        xpNeeded = userState.level * 100;
    }
}

function damageEnemy(amount) {
    currentEnemyHP -= amount;
    if (currentEnemyHP <= 0) {
        let reward = userState.stage * 150;
        userState.clicks += reward;
        userState.stage++;
        setupEnemies();
    }
}

function setupEnemies() {
    let scaleMult = 1.0;
    if (userState.equippedWeapon) {
        const weapon = WEAPONS.find(w => w.id === userState.equippedWeapon);
        if (weapon) scaleMult = parseFloat(weapon.mult.replace('×','')) || 1.0;
    }
    
    maxEnemyHP = Math.floor((userState.stage * 150) * scaleMult);
    currentEnemyHP = maxEnemyHP;

    const res = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    document.getElementById('enemy-sprite').innerText = res.icon;
    document.getElementById('enemy-name').innerText = res.name;
    document.getElementById('ui-hp-multiplier').innerText = `⚖️ Enemy HP ×${scaleMult}`;
}

// --- NAV NAVIGATION ---
function switchTab(tabId) {
    document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    const idx = ['tab-battle', 'tab-armory', 'tab-eggs', 'tab-inventory'].indexOf(tabId);
    if(idx > -1) document.querySelectorAll('.nav-btn')[idx].classList.add('active');
}

// --- RENDERING SHOP WEAPONS ---
function renderArmory() {
    const box = document.getElementById('weapon-list');
    if (!box) return; box.innerHTML = '';

    WEAPONS.forEach(w => {
        let isBought = userState.unlockedWeapons.includes(w.id);
        let isEquipped = userState.equippedWeapon === w.id;
        let canBuy = userState.level >= w.req && userState.clicks >= w.cost;
        let btnHtml = '';

        if (isEquipped) {
            btnHtml = `<button class="shop-btn" style="background:#4caf50;" disabled>Equipped</button>`;
        } else if (isBought) {
            btnHtml = `<button class="shop-btn" style="background:#2196f3;" onclick="equipWeapon('${w.id}')">Equip</button>`;
        } else {
            if (userState.level < w.req) {
                btnHtml = `<button class="shop-btn" disabled style="background:#421717; color:#ff8888;">🔒 Lvl ${w.req}</button>`;
            } else {
                btnHtml = `<button class="shop-btn" ${canBuy ? '' : 'disabled'} onclick="buyWeapon('${w.id}', ${w.cost})">${w.cost} ⚡</button>`;
            }
        }

        box.innerHTML += `
            <div class="shop-card">
                <div class="card-info">
                    <div class="card-icon">${w.icon}</div>
                    <div class="card-details">
                        <h3>${w.name}</h3>
                        <p>+${w.power} Clicks/tap (Lvl.${w.req})</p>
                        <div class="card-multiplier">⚖️ Enemy HP ${w.mult}</div>
                    </div>
                </div>
                ${btnHtml}
            </div>
        `;
    });
}

function buyWeapon(id, cost) {
    if (userState.clicks >= cost) {
        userState.clicks -= cost;
        userState.unlockedWeapons.push(id);
        userState.equippedWeapon = id;
        setupEnemies(); updateUI(); saveGame();
    }
}

function equipWeapon(id) {
    if (userState.unlockedWeapons.includes(id)) {
        userState.equippedWeapon = id;
        setupEnemies(); updateUI(); saveGame();
    }
}

// --- GACHA EGGS SYSTEM ---
function renderEggs() {
    const box = document.getElementById('egg-list');
    if (!box) return; box.innerHTML = '';

    EGGS.forEach((egg, idx) => {
        let poolItemsHtml = '';
        egg.pool.forEach(p => {
            poolItemsHtml += `
                <div class="egg-pool-item">
                    <span class="pool-pet-info">${p.icon} ${p.name} (+${p.cps} CPS)</span>
                    <span class="pool-pet-rate">${Math.floor(p.rate*100)}%</span>
                </div>
                ${p.skill ? `<span class="pool-skill-badge">✨ Passive: ${p.skill}</span>` : ''}
            `;
        });

        box.innerHTML += `
            <div class="egg-card-large">
                <div class="egg-header-row">
                    <div class="egg-big-icon">${egg.icon}</div>
                    <div class="egg-title-box">
                        <h3>${egg.name}</h3>
                        <p>⚡ ${egg.cost} Clicks</p>
                    </div>
                </div>
                <div class="egg-pool-container">${poolItemsHtml}</div>
                <button class="hatch-btn-wide" ${userState.clicks >= egg.cost ? '' : 'disabled'} onclick="hatchEgg(${idx})">🥚 Hatch! — ⚡ ${egg.cost}</button>
            </div>
        `;
    });
}

function hatchEgg(idx) {
    const egg = EGGS[idx];
    if (userState.clicks < egg.cost) return;
    userState.clicks -= egg.cost;

    let r = Math.random(), cumulative = 0, rolled = egg.pool[0];
    for (let p of egg.pool) {
        cumulative += p.rate;
        if (r <= cumulative) { rolled = p; break; }
    }

    let existing = userState.ownedPets.find(p => p.name === rolled.name);
    if (existing) {
        existing.count++;
    } else {
        userState.ownedPets.push({
            name: rolled.name, icon: rolled.icon, type: rolled.type, cps: rolled.cps, skill: rolled.skill || null, count: 1
        });
    }

    // --- POPUP ANIME MODAL ENGINE ---
    const overlay = document.getElementById('hatch-modal-overlay');
    const txtTier = document.getElementById('modal-pet-tier');
    const txtIcon = document.getElementById('modal-pet-icon');
    const txtName = document.getElementById('modal-pet-name');
    const txtCps = document.getElementById('modal-pet-cps');
    const skillBox = document.getElementById('modal-pet-skill-box');
    const skillText = document.getElementById('modal-pet-skill-text');

    const typeUpper = rolled.type.toUpperCase();
    if (typeUpper === 'COMMON') {
        txtTier.style.color = '#8fa4b4'; 
    } else if (typeUpper === 'RARE') {
        txtTier.style.color = '#00e5ff'; 
    } else if (typeUpper === 'LEGENDARY') {
        txtTier.style.color = '#ffea00'; 
    } else if (typeUpper === 'MYTHICAL') {
        txtTier.style.color = '#ff1744'; 
    }

    txtTier.innerText = rolled.type;
    txtIcon.innerText = rolled.icon;
    txtName.innerText = rolled.name;
    txtCps.innerText = `+${rolled.cps} CPS`;

    if (rolled.skill) {
        let skillDesc = "";
        if (rolled.name === "Shiba Inu") skillDesc = "🌟 Bark Shockwave 🔊: Deals 5x click damage instantly.";
        else if (rolled.name === "Shark") skillDesc = "🌊 Tsunami Crash 🦈: Removes 15% of enemy max HP.";
        else if (rolled.name === "Tiger") skillDesc = "🐯 Jungle Roar 💥: Buffs active pet CPS by 1.5x temporarily.";
        else if (rolled.name === "Owl") skillDesc = "👁️ Night Vision 🌌: Generates double critical click damage.";
        else if (rolled.name === "T-Rex") skillDesc = "⚡ Primal Crash 🦖: Instantly breaks 20% of current enemy shield/HP.";
        else if (rolled.name === "Mighty Dragon") skillDesc = "Prehistoric Roar 🐲: Multiplies all click power by 2x for 10 seconds.";
        else skillDesc = `✨ Passive: ${rolled.skill}`;

        skillText.innerText = skillDesc;
        skillBox.style.display = 'block'; 
    } else {
        skillBox.style.display = 'none'; 
    }

    overlay.style.display = 'flex';

    renderEggs(); 
    renderInventory(); 
    updateUI(); 
    saveGame();
}

function closeHatchModal() {
    document.getElementById('hatch-modal-overlay').style.display = 'none';
}

// --- DOUBLE PANEL SECTION INVENTORY ---
function renderInventory() {
    const slotContainer = document.getElementById('active-slots-container');
    if (slotContainer) {
        slotContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            let activePetName = userState.equippedPets[i];
            if (activePetName) {
                let petData = userState.ownedPets.find(p => p.name === activePetName);
                slotContainer.innerHTML += `
                    <div class="active-pet-box filled">
                        <div style="font-size:1.8rem;">${petData.icon}</div>
                        <div style="font-size:0.65rem; font-weight:bold;">${petData.name}</div>
                        <div style="font-size:0.55rem; color:#8ba88e;">+${petData.cps} CPS</div>
                        <button class="active-remove-btn" onclick="unequipPet(${i})">✕ Unequip</button>
                    </div>
                `;
            } else {
                slotContainer.innerHTML += `
                    <div class="active-pet-box">
                        <div style="color:#386f41; font-size:0.7rem;">Empty Slot</div>
                    </div>
                `;
            }
        }
    }

    const grid = document.getElementById('owned-inventory-grid');
    if (grid) {
        grid.innerHTML = '';
        if (userState.ownedPets.length === 0) {
            grid.innerHTML = `<p style="grid-column:span 2; text-align:center; color:gray; font-size:0.8rem;">No pets owned yet.</p>`;
            return;
        }

        userState.ownedPets.forEach(pet => {
            let equipCount = userState.equippedPets.filter(name => name === pet.name).length;
            let isFull = equipCount >= pet.count;

            grid.innerHTML += `
                <div class="inventory-card">
                    <span class="inv-stack-badge">x${pet.count}</span>
                    <span class="inv-type-badge ${pet.type.toLowerCase()}">${pet.type}</span>
                    <div class="inv-icon">${pet.icon}</div>
                    <div class="inv-name">${pet.name}</div>
                    <div class="inv-cps">+${pet.cps} CPS</div>
                    <div class="inv-action-lbl" onclick="${isFull ? '' : `equipPet('${pet.name}')`}">
                        ${isFull ? '🔴 Slots full' : '⚡ Tap to equip'}
                    </div>
                </div>
            `;
        });
    }
}

function equipPet(name) {
    if (userState.equippedPets.length >= 3) {
        alert("Active Slots full! Max 3 pets."); return;
    }
    userState.equippedPets.push(name);
    renderInventory(); updateUI(); saveGame();
}

function unequipPet(index) {
    userState.equippedPets.splice(index, 1);
    renderInventory(); updateUI(); saveGame();
}

// --- MASTER REALTIME TICK DATA SYNC ---
function updateUI() {
    renderArmory();

    document.getElementById('click-display').innerText = `${Math.floor(userState.clicks)} ⚡`;
    document.getElementById('player-level').innerText = userState.level;
    document.getElementById('cps-display').innerText = `${getTotalCPS()} ⚡/s`;
    document.getElementById('stage-number').innerText = userState.stage;

    let xpNeeded = userState.level * 100;
    document.getElementById('player-xp-bar').style.width = `${(userState.xp / xpNeeded) * 100}%`;
    document.getElementById('player-xp-text').innerText = `${userState.xp} / ${xpNeeded} EXP`;

    document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, (currentEnemyHP / maxEnemyHP) * 100)}%`;
    document.getElementById('enemy-hp-text').innerText = `${Math.max(0, currentEnemyHP)} / ${maxEnemyHP}`;

    let activeWep = WEAPONS.find(w => w.id === userState.equippedWeapon);
    document.getElementById('quick-weapon-lbl').innerText = activeWep ? `${activeWep.icon} ${activeWep.name}` : '👊 Fist';
    document.getElementById('quick-pets-lbl').innerText = userState.equippedPets.length > 0 ? userState.equippedPets.join(', ') : 'None';

    document.querySelectorAll('.hatch-btn-wide').forEach((btn, i) => {
        if(EGGS[i]) btn.disabled = userState.clicks < EGGS[i].cost;
    });
}

function createFloatingText(text, x, y) {
    const container = document.getElementById('floating-text-container');
    if (!container) return;
    const el = document.createElement('div'); el.className = 'floating-text'; el.innerText = text;
    el.style.left = `${Math.min(window.innerWidth - 60, Math.max(20, x))}px`; el.style.top = `${y}px`;
    container.appendChild(el); setTimeout(() => el.remove(), 700);
}

// --- SAVE STORAGE ENGINE ---
function saveGame() { localStorage.setItem('jungle_sim_save', JSON.stringify(userState)); }
function loadGame() {
    let saved = localStorage.getItem('jungle_sim_save');
    if (saved) {
        try {
            userState = JSON.parse(saved);
            if(!userState.unlockedWeapons) userState.unlockedWeapons = [];
            if(!userState.ownedPets) userState.ownedPets = [];
            if(!userState.equippedPets) userState.equippedPets = [];
        } catch(e) { console.error("Data save corrupt."); }
    }
                                                           }
  
