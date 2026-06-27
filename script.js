// --- GAME DATA CONFIGURATIONS (JUNGLE THEME - NEW ICONS & SKILLS) ---
const WEAPONS = [
    { id: 'w1', name: 'Wooden Club 🪵', icon: '🪵', req: 1, cost: 50, power: 2 },
    { id: 'w2', name: 'Rusty Machete 🗡️', icon: '🗡️', req: 3, cost: 500, power: 10 },
    { id: 'w3', name: 'Poison Blowgun 🏹', icon: '🏹', req: 7, cost: 4000, power: 50 },
    { id: 'w4', name: 'Hunter\'s Shotgun 🔫', icon: '🔫', req: 12, cost: 25000, power: 250 },
    { id: 'w5', name: 'Ranger Blade ⚔️', icon: '⚔️', req: 20, cost: 150000, power: 1500 },
    { id: 'w6', name: 'Jungle Relic 🔱', icon: '🔱', req: 35, cost: 1000000, power: 10000 }
];

const EGGS = [
    {
        id: 'e1', name: 'Shrub Capsule 🌿', icon: '🌱', cost: 20000,
        pool: [
            { name: 'Tree Frog 🐸', type: 'Common', rate: 0.45, cps: 10 },
            { name: 'Forest Parrot 🦜', type: 'Common', rate: 0.45, cps: 10 },
            { name: 'Cunning Fox 🦊', type: 'Legendary', rate: 0.10, cps: 50, skill: 'Bark Shockwave 🔊' }
        ]
    },
    {
        id: 'e2', name: 'Swamp Relic 💧', icon: '💧', cost: 75000,
        pool: [
            { name: 'Marsh Fish 🐟', type: 'Common', rate: 0.50, cps: 50 },
            { name: 'Scared Pufferfish 🐡', type: 'Rare', rate: 0.35, cps: 100 },
            { name: 'Wild Alligator 🐊', type: 'Legendary', rate: 0.15, cps: 300, skill: 'Tsunami Crash 🌊' }
        ]
    },
    {
        id: 'e3', name: 'Outback Totem 🗿', icon: '🗿', cost: 150000,
        pool: [
            { name: 'Leaping Squirrel 🐿️', type: 'Common', rate: 0.50, cps: 150 },
            { name: 'Spotted Deer 🦌', type: 'Rare', rate: 0.35, cps: 300 },
            { name: 'Silverback Gorilla 🦍', type: 'Legendary', rate: 0.15, cps: 800, skill: 'Lava Smash 🌋' }
        ]
    },
    {
        id: 'e4', name: 'Canopy Feather 🪶', icon: '🪶', cost: 300000,
        pool: [
            { name: 'Cave Bat 🦇', type: 'Common', rate: 0.50, cps: 400 },
            { name: 'Wisdom Owl 🦉', type: 'Rare', rate: 0.35, cps: 800 },
            { name: 'Apex Eagle 🦅', type: 'Legendary', rate: 0.15, cps: 2000, skill: 'Wind Hurricane 🌪️' }
        ]
    },
    {
        id: 'e5', name: 'Primal Core 🦴', icon: '🦴', cost: 1000000,
        pool: [
            { name: 'Ancient Tortoise 🐢', type: 'Common', rate: 0.60, cps: 2500 },
            { name: 'Shadow Leopard 🐆', type: 'Rare', rate: 0.30, cps: 5000 },
            { name: 'Primal Dragon 🐉', type: 'Mythical', rate: 0.10, cps: 15000, skill: 'Cataclysm ☄️' }
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
window.addEventListener('DOMContentLoaded', () => {
    loadGame();
    setupEnemies();
    renderArmory();
    renderEggs();
    renderInventory();
    updateUI();
    
    const attackBtn = document.getElementById('attack-btn');
    if (attackBtn) {
        attackBtn.addEventListener('click', function(e) {
            let power = getClickPower();
            userState.clicks += power;
            addXP(power);
            
            damageEnemy(power);

            const enemyBox = document.getElementById('enemy-box');
            if (enemyBox) {
                enemyBox.classList.remove('hit-shake');
                void enemyBox.offsetWidth; 
                enemyBox.classList.add('hit-shake');
                setTimeout(() => enemyBox.classList.remove('hit-shake'), 150);
            }

            createFloatingText(`+${power} ⚡`, e.clientX || window.innerWidth/2, (e.clientY || window.innerHeight/2) - 40);
            
            updateUI();
            saveGame();
        });
    }

    setInterval(gameTick, 1000);
    setInterval(triggerPetSkills, 5000);
});

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

// BALANCED SCALING SYSTEM: Senjata makin kuat = HP Musuh naik, tapi jumlah klik (TTK) makin sedikit
function setupEnemies() {
    let baseHP = userState.stage * 150;
    let weaponBonusHP = 0;
    
    if (userState.equippedWeapon) {
        const weapon = WEAPONS.find(w => w.id === userState.equippedWeapon);
        if (weapon) {
            let power = weapon.power;
            let scalingFactor = 0;

            // Logika Multiplier Menurun biar rasionya seimbang
            if (power <= 2) {
                scalingFactor = 1.1;  
            } else if (power <= 10) {
                scalingFactor = 3.5;  
            } else if (power <= 50) {
                scalingFactor = 12.0; 
            } else if (power <= 250) {
                scalingFactor = 45.0;
            } else if (power <= 1500) {
                scalingFactor = 220.0;
            } else {
                scalingFactor = 1100.0; 
            }

            weaponBonusHP = Math.floor(power * scalingFactor);
        }
    }
    
    maxEnemyHP = baseHP + weaponBonusHP;
    currentEnemyHP = maxEnemyHP;
    
    const randomEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    const sprite = document.getElementById('enemy-sprite');
    if (sprite) sprite.innerText = randomEnemy;
}

// --- PET SKILL SYSTEM ---
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
            else if (pet.skill.includes('Lava Smash')) {
                let dmg = clickPower * 12; 
                damageEnemy(dmg);
                createFloatingSkillText(`🌋 Lava Smash: ${dmg} Dmg!`);
            } 
            else if (pet.skill.includes('Wind Hurricane')) {
                let dmg = clickPower * 3;
                damageEnemy(dmg * 4); 
                createFloatingSkillText(`🌪️ Wind Slash x4: ${dmg * 4} Dmg!`);
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
    updateUI();
    saveGame();
}

function gameTick() {
    let cps = getTotalCPS();
    if (cps > 0) {
        userState.clicks += cps;
        updateUI();
    }
}

// --- TABS & RENDERING ---
function switchTab(tabId) {
    document.querySelectorAll('.game-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    
    const btnIdx = ['tab-battle', 'tab-armory', 'tab-eggs', 'tab-inventory'].indexOf(tabId);
    if (btnIdx > -1) {
        document.querySelectorAll('.nav-btn')[btnIdx].classList.add('active');
    }
}

function renderArmory() {
    const list = document.getElementById('weapon-list');
    if (!list) return;
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
                    <div class="card-icon">${w.icon}</div>
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
        setupEnemies(); 
        renderArmory();
        updateUI();
        saveGame();
    }
}

function equipWeapon(id) {
    if (userState.unlockedWeapons.includes(id)) {
        userState.equippedWeapon = id;
        setupEnemies(); 
        renderArmory();
        updateUI();
        saveGame();
    }
}

function renderEggs() {
    const list = document.getElementById('egg-list');
    if (!list) return;
    list.innerHTML = '';
    
    EGGS.forEach((egg, idx) => {
        let canBuy = userState.clicks >= egg.cost;
        list.innerHTML += `
            <div class="shop-card">
                <div class="card-info">
                    <div class="card-icon">${egg.icon}</div>
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
    if (!grid) return;
    grid.innerHTML = '';
    
    const countEl = document.getElementById('equipped-pets-count');
    if (countEl) countEl.innerText = userState.equippedPets.length;
    
    if (userState.ownedPets.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:gray; padding:20px;">No pets owned yet. Let\'s hatch some eggs!</p>';
        return;
    }
    
    userState.ownedPets.forEach(pet => {
        let equipCount = userState.equippedPets.filter(uid => uid === pet.uid).length;
        let isEquipped = equipCount > 0;
        let badgeClass = pet.type.toLowerCase();
        
        grid.innerHTML += `
            <div class="pet-card ${isEquipped ? 'active-pet' : ''}">
                <span class="pet-badge ${badgeClass}">${pet.type}</span>
                <div class="pet-card-icon">🐾</div>
                <h4>${pet.name}</h4>
                <p>+${pet.cps} ⚡/s</p>
                ${pet.skill ? `<p style="color:#ff5722; font-size:0.65rem;">✨ ${pet.skill.includes('Wind Hurricane') ? 'Wind Slash' : pet.skill}</p>` : ''}
                
                ${equipCount > 1 ? `<div style="color:#ffcc00; font-size:0.75rem; font-weight:bold; margin-bottom:5px;">Equipped x${equipCount}</div>` : ''}

                <div style="display:flex; gap:5px; width:100%;">
                    <button class="shop-btn eq-btn" style="padding:6px; font-size:0.75rem; flex:1;" onclick="addPetSlot('${pet.uid}')">Equip</button>
                    ${isEquipped ? `<button class="shop-btn" style="background:linear-gradient(135deg, #ff3333, #b30000); box-shadow:0 3px 0 #800000; padding:6px; font-size:0.75rem; color:white; flex:1;" onclick="removePetSlot('${pet.uid}')">Unequip</button>` : ''}
                </div>
            </div>
        `;
    });
}

function addPetSlot(uid) {
    if (userState.equippedPets.length >= 3) {
        alert("You can only equip up to 3 pets max!");
        return;
    }
    userState.equippedPets.push(uid);
    renderInventory();
    updateUI();
    saveGame();
}

function removePetSlot(uid) {
    let idx = userState.equippedPets.indexOf(uid);
    if (idx > -1) {
        userState.equippedPets.splice(idx, 1);
    }
    renderInventory();
    updateUI();
    saveGame();
}

// --- UI REFRESH ---
function updateUI() {
    const clickDisp = document.getElementById('click-display');
    if (clickDisp) clickDisp.innerText = `${Math.floor(userState.clicks)} ⚡`;
    
    const lvlDisp = document.getElementById('player-level');
    if (lvlDisp) lvlDisp.innerText = userState.level;
    
    const cpsDisp = document.getElementById('cps-display');
    if (cpsDisp) cpsDisp.innerText = `${getTotalCPS()} ⚡/s`;
    
    const stageDisp = document.getElementById('stage-number');
    if (stageDisp) stageDisp.innerText = userState.stage;
    
    let xpNeeded = userState.level * 100;
    let pctXp = (userState.xp / xpNeeded) * 100;
    const xpBar = document.getElementById('player-xp-bar');
    if (xpBar) xpBar.style.width = `${pctXp}%`;
    
    const xpText = document.getElementById('player-xp-text');
    if (xpText) xpText.innerText = `${userState.xp} / ${xpNeeded} EXP`;
    
    let pctHp = Math.max(0, (currentEnemyHP / maxEnemyHP) * 100);
    const hpBar = document.getElementById('enemy-hp-bar');
    if (hpBar) hpBar.style.width = `${pctHp}%`;
    
    const hpText = document.getElementById('enemy-hp-text');
    if (hpText) hpText.innerText = `${Math.max(0, currentEnemyHP)} / ${maxEnemyHP} HP`;
    
    document.querySelectorAll('#egg-list .shop-btn').forEach((btn, i) => {
        if(EGGS[i]) btn.disabled = userState.clicks < EGGS[i].cost;
    });
}

// --- VISUAL FLOATING TEXT ---
function createFloatingText(text, x, y) {
    const container = document.getElementById('floating-text-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = `${Math.min(window.innerWidth - 60, Math.max(20, x))}px`;
    el.style.top = `${y}px`;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

// --- SKILL FLOATING TEXT ---
function createFloatingSkillText(text) {
    const container = document.getElementById('floating-text-container');
    if (!container) return;
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
            console.error("Failed to load save data.");
        }
    }
                                   }
          
