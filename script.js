// --- GAME DATA CONFIGURATIONS (JUNGLE THEME - INTERNATIONAL VERSION) ---
const WEAPONS = [
    { id: 'w1', name: 'Wooden Club 🪵', req: 1, cost: 50, power: 2 },
    { id: 'w2', name: 'Rusty Machete 🗡️', req: 3, cost: 500, power: 10 },
    { id: 'w3', name: 'Poison Dart Blowgun 🏹', req: 7, cost: 4000, power: 50 },
    { id: 'w4', name: 'Hunter\'s Double Barrel 槍', req: 12, cost: 25000, power: 250 },
    { id: 'w5', name: 'Mythic Ranger Blade ⚔️', req: 20, cost: 150000, power: 1500 },
    { id: 'w6', name: 'Relic of the Jungle Queen 🔱', req: 35, cost: 1000000, power: 10000 }
];

const EGGS = [
    {
        id: 'e1', name: 'Shrub Egg 🌿', cost: 20000,
        pool: [
            { name: 'Tree Frog 🐸', type: 'Common', rate: 0.45, cps: 10 },
            { name: 'Forest Parrot 🦜', type: 'Common', rate: 0.45, cps: 10 },
            { name: 'Cunning Fox 🦊', type: 'Legendary', rate: 0.10, cps: 50, skill: 'Bark Shockwave 🔊' }
        ]
    },
    {
        id: 'e2', name: 'Swamp Egg 🐊', cost: 75000,
        pool: [
            { name: 'Marsh Fish 🐟', type: 'Common', rate: 0.50, cps: 50 },
            { name: 'River Piranha 🐠', type: 'Rare', rate: 0.35, cps: 100 },
            { name: 'Wild Alligator 🐊', type: 'Legendary', rate: 0.15, cps: 300, skill: 'Tsunami Crash 🌊' }
        ]
    },
    {
        id: 'e3', name: 'Outback Egg 🐗', cost: 150000,
        pool: [
            { name: 'Leaping Squirrel 🐿️', type: 'Common', rate: 0.50, cps: 150 },
            { name: 'Spotted Deer 🦌', type: 'Rare', rate: 0.35, cps: 300 },
            { name: 'Silverback Gorilla 🦍', type: 'Legendary', rate: 0.15, cps: 800, skill: 'Earthquake 🌋' }
        ]
    },
    {
        id: 'e4', name: 'Canopy Egg 🦅', cost: 300000,
        pool: [
            { name: 'Cave Bat 🦇', type: 'Common', rate: 0.50, cps: 400 },
            { name: 'Wisdom Owl 🦉', type: 'Rare', rate: 0.35, cps: 800 },
            { name: 'Apex Eagle 🦅', type: 'Legendary', rate: 0.15, cps: 2000, skill: 'Inferno Blast 🔥' }
        ]
    },
    {
        id: 'e5', name: 'Primal Jungle Egg 🦖', cost: 1000000,
        pool: [
            { name: 'Ancient Tortoise 🐢', type: 'Common', rate: 0.60, cps: 2500 },
            { name: 'Shadow Leopard 🐆', type: 'Rare', rate: 0.30, cps: 5000 },
            { name: 'Primal Jungle Dragon 🐉', type: 'Mythical', rate: 0.10, cps: 15000, skill: 'Cataclysm ☄️' }
        ]
    }
];

const ENEMIES = ['🐒', '🐗', '🐍', '🕷️', '🐆', '🐯', '🦁', '🦍'];

// --- GAME STATE ---
let userState = {
    clicks: 0,
    level: 1,
    xp: 0,
    stage: 1,
    equippedWeapon: null, 
    unlockedWeapons: [],   
    ownedPets: [],         
    equippedPets: []       
};

let currentEnemyHP = 150;
let maxEnemyHP = 150;

// --- INITIALIZATION ---
window.onload = function() {
    loadGame();
    setupEnemies();
    renderArmory();
    renderEggs();
    renderInventory();
    updateUI();
    
    setInterval(gameTick, 1000);
    setInterval(triggerPetSkills, 5000);
};

// --- CORE MECHANICS ---
function getClickPower() {
    let basePower = 1;
    if (userState.equippedWeapon) {
        const weapon = WEAPONS.find(w => w.id === userState.equippedWeapon);
        if (weapon) basePower = weapon.power;
    }
    return basePower;
}

function getTotalCPS() {
    let total = 0;
    userState.equippedPets.forEach(uid => {
        const pet = userState.ownedPets.find(p => p.uid === uid);
        if (pet) total += pet.cps;
    });
    return total;
}

function addXP(amount) {
    userState.xp += amount;
    let xpNeeded = userState.level * 100;
    if (userState.xp >= xpNeeded) {
        userState.xp -= xpNeeded;
        userState.level++;
        createFloatingText(`LEVEL UP! Lvl ${userState.level} 🎉`, window.innerWidth/2, window.innerHeight/2);
        renderArmory(); 
    }
}

// Attack Button Event
document.getElementById('attack-btn').addEventListener('click', function(e) {
    let power = getClickPower();
    userState.clicks += power;
    addXP(power);
    
    damageEnemy(power);

    const sprite = document.getElementById('enemy-sprite');
    sprite.style.transform = 'scale(0.85)';
    setTimeout(() => sprite.style.transform = 'scale(1)', 50);

    createFloatingText(`+${power} ⚡`, e.clientX || window.innerWidth/2, (e.clientY || window.innerHeight/2) - 40);
    
    updateUI();
    saveGame();
});

function damageEnemy(amount) {
    currentEnemyHP -= amount;
    if (currentEnemyHP <= 0) {
        let bonus = userState.stage * 150;
        userState.clicks += bonus;
        createFloatingText(`STAGE CLEAR! +${bonus} ⚡`, window.innerWidth/2, window.innerHeight/2);
        
        userState.stage++;
        setupEnemies();
    }
    updateUI();
}

function setupEnemies() {
    maxEnemyHP = userState.stage * 150;
    currentEnemyHP = maxEnemyHP;
    
    const randomEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    document.getElementById('enemy-sprite').innerText = randomEnemy;
}

// --- PET SKILL SYSTEM (Every 5s) ---
function triggerPetSkills() {
    userState.equippedPets.forEach(uid => {
        const pet = userState.ownedPets.find(p => p.uid === uid);
        if (pet && pet.skill) {
            let clickPower = getClickPower();
            
            if (pet.skill.includes('Bark Shockwave')) {
                let dmg = clickPower * 5;
                damageEnemy(dmg);
                createFloatingSkillText(`💥 Bark Shockwave: ${dmg} Dmg!`);
            } 
            else if (pet.skill.includes('Tsunami Crash')) {
                let dmg = Math.floor(maxEnemyHP * 0.15);
                damageEnemy(dmg);
                createFloatingSkillText(`🌊 Tsunami Crash: ${dmg} Dmg!`);
            } 
            else if (pet.skill.includes('Earthquake')) {
                let dmg = clickPower * 10;
                damageEnemy(dmg);
                createFloatingSkillText(`🌋 Earthquake: ${dmg} Dmg!`);
            } 
            else if (pet.skill.includes('Inferno Blast')) {
                let dmg = clickPower * 4;
                damageEnemy(dmg * 3);
                createFloatingSkillText(`🔥 Inferno Burn x3: ${dmg * 3} Dmg!`);
            } 
            else if (pet.skill.includes('Cataclysm')) {
                if (userState.stage % 10 === 0) {
                    let dmg = clickPower * 50;
                    damageEnemy(dmg);
                    createFloatingSkillText(`☄️ Cataclysm Boss: ${dmg} Dmg!`);
                } else {
                    damageEnemy(currentEnemyHP); 
                    createFloatingSkillText(`☄️ Cataclysm: Instakill!`);
                }
            }
        }
    });
    saveGame();
}

// --- PASSIVE CPS TICK ---
function gameTick() {
    let cps = getTotalCPS();
    if (cps > 0) {
        userState.clicks += cps;
        updateUI();
    }
}

// --- TAB NAV & RENDER SHOP ---
function switchTab(tabId) {
    document.querySelectorAll('.game-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const btnIdx = ['tab-battle', 'tab-armory', 'tab-eggs', 'tab-inventory'].indexOf(tabId);
    document.querySelectorAll('.nav-btn')[btnIdx].classList.add('active');
}

function renderArmory() {
    const list = document.getElementById('weapon-list');
    list.innerHTML = '';
    
    WEAPONS.forEach(w => {
        let isBought = userState.unlockedWeapons.includes(w.id);
        let isEquipped = userState.equippedWeapon === w.id;
        let canBuy = userState.level >= w.req && userState.clicks >= w.cost;
        
        let btnHtml = '';
        if (isEquipped) {
            btnHtml = `<button class="shop-btn eq-btn" disabled>Equipped</button>`;
        } else if (isBought) {
            btnHtml = `<button class="shop-btn eq-btn" onclick="equipWeapon('${w.id}')">Equip</button>`;
        } else {
            btnHtml = `<button class="shop-btn" ${canBuy ? '' : 'disabled'} onclick="buyWeapon('${w.id}', ${w.cost})">${w.cost} ⚡</button>`;
        }

        list.innerHTML += `
            <div class="shop-card ${isEquipped ? 'equipped' : ''}">
                <div class="card-info">
                    <div class="card-icon">🗡️</div>
                    <div class="card-details">
                        <h3>${w.name}</h3>
                        <p>+${w.power} ⚡/Tap (Req: Lvl ${w.req})</p>
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
        renderArmory();
        updateUI();
        saveGame();
    }
}

// --- EQUIP WEAPON ---
function equipWeapon(id) {
    if (userState.unlockedWeapons.includes(id)) {
        userState.equippedWeapon = id;
        renderArmory();
        saveGame();
    }
}

function renderEggs() {
    const list = document.getElementById('egg-list');
    list.innerHTML = '';
    
    EGGS.forEach((egg, idx) => {
        let canBuy = userState.clicks >= egg.cost;
        list.innerHTML += `
            <div class="shop-card">
                <div class="card-info">
                    <div class="card-icon">🥚</div>
                    <div class="card-details">
                        <h3>${egg.name}</h3>
                        <p>Cost: ${egg.cost} ⚡</p>
                    </div>
                </div>
                <button class="shop-btn" ${canBuy ? '' : 'disabled'} onclick="gachaEgg(${idx})">Hatch</button>
            </div>
        `;
    });
}

function gachaEgg(idx) {
    const egg = EGGS[idx];
    if (userState.clicks < egg.cost) return;
    
    userState.clicks -= egg.cost;
    
    let rand = Math.random();
    let cumulative = 0;
    let selectedPet = egg.pool[0];
    
    for (let pet of egg.pool) {
        cumulative += pet.rate;
        if (rand <= cumulative) {
            selectedPet = pet;
            break;
        }
    }
    
    let uniqueId = 'pet_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    userState.ownedPets.push({
        uid: uniqueId,
        name: selectedPet.name,
        type: selectedPet.type,
        cps: selectedPet.cps,
        skill: selectedPet.skill || null
    });
    
    alert(`🎉 You hatched: [${selectedPet.type}] ${selectedPet.name}! Check your adventurer's pack.`);
    
    renderEggs();
    renderInventory();
    updateUI();
    saveGame();
}

function renderInventory() {
    const grid = document.getElementById('pet-inventory-list');
    grid.innerHTML = '';
    
    document.getElementById('equipped-pets-count').innerText = userState.equippedPets.length;
    
    if (userState.ownedPets.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:gray; padding:20px;">No pets owned yet. Let\'s hatch some eggs!</p>';
        return;
    }
    
    userState.ownedPets.forEach(pet => {
        let isEquipped = userState.equippedPets.includes(pet.uid);
        let badgeClass = pet.type.toLowerCase();
        
        grid.innerHTML += `
            <div class="pet-card ${isEquipped ? 'active-pet' : ''}">
                <span class="pet-badge ${badgeClass}">${pet.type}</span>
                <div class="pet-card-icon">🐾</div>
                <h4>${pet.name}</h4>
                <p>+${pet.cps} ⚡/s</p>
                ${pet.skill ? `<p style="color:#ff5722; font-size:0.65rem;">✨ ${pet.skill}</p>` : ''}
                <button class="shop-btn ${isEquipped ? '' : 'eq-btn'}" onclick="togglePet('${pet.uid}')">
                    ${isEquipped ? 'Unequip' : 'Equip'}
                </button>
            </div>
        `;
    });
}

function togglePet(uid) {
    let idx = userState.equippedPets.indexOf(uid);
    if (idx > -1) {
        userState.equippedPets.splice(idx, 1);
    } else {
        if (userState.equippedPets.length >= 3) {
            alert("You can only equip up to 3 pets max!");
            return;
        }
        userState.equippedPets.push(uid);
    }
    renderInventory();
    updateUI();
    saveGame();
}

// --- UI REFRESH ---
function updateUI() {
    document.getElementById('click-display').innerText = `${Math.floor(userState.clicks)} ⚡`;
    document.getElementById('player-level').innerText = userState.level;
    document.getElementById('cps-display').innerText = `${getTotalCPS()} ⚡/s`;
    document.getElementById('stage-number').innerText = userState.stage;
    
    let xpNeeded = userState.level * 100;
    let pctXp = (userState.xp / xpNeeded) * 100;
    document.getElementById('player-xp-bar').style.width = `${pctXp}%`;
    document.getElementById('player-xp-text').innerText = `${userState.xp} / ${xpNeeded} EXP`;
    
    let pctHp = Math.max(0, (currentEnemyHP / maxEnemyHP) * 100);
    document.getElementById('enemy-hp-bar').style.width = `${pctHp}%`;
    document.getElementById('enemy-hp-text').innerText = `${Math.max(0, currentEnemyHP)} / ${maxEnemyHP} HP`;
    
    document.querySelectorAll('#egg-list .shop-btn').forEach((btn, i) => {
        btn.disabled = userState.clicks < EGGS[i].cost;
    });
}

// --- VISUAL FLOATING TEXT ---
function createFloatingText(text, x, y) {
    const container = document.getElementById('floating-text-container');
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = `${Math.min(window.innerWidth - 60, Math.max(20, x))}px`;
    el.style.top = `${y}px`;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function createFloatingSkillText(text) {
    const container = document.getElementById('floating-text-container');
    const el = document.createElement('div');
    el.className = 'floating-text skill';
    el.innerText = text;
    el.style.left = `${window.innerWidth / 2 - 80}px`;
    el.style.top = `${window.innerHeight / 3}px`;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

// --- LOCAL STORAGE ---
function saveGame() {
    localStorage.setItem('jungle_clicker_save', JSON.stringify(userState));
}

function loadGame() {
    let saved = localStorage.getItem('jungle_clicker_save');
    if (saved) {
        try {
            userState = JSON.parse(saved);
            if(!userState.unlockedWeapons) userState.unlockedWeapons = [];
            if(!userState.ownedPets) userState.ownedPets = [];
            if(!userState.equippedPets) userState.equippedPets = [];
        } catch(e) {
            console.error("Failed to load save data, resetting.");
        }
    }
          }
      
