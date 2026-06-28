// --- DATABASE ---
const WEAPONS = [
    { id: 0, name: 'Bare Hands 👊', reqLvl: 1, cost: 0, power: 1 },
    { id: 1, name: 'Wooden Twig 🌿', reqLvl: 1, cost: 50, power: 2 },
    { id: 2, name: 'Sharpened Reed 🎋', reqLvl: 3, cost: 300, power: 8 },
    { id: 3, name: 'Wooden Club 🪵', reqLvl: 7, cost: 1500, power: 25 },
    { id: 4, name: 'Bamboo Bow 🏹', reqLvl: 12, cost: 7000, power: 80 },
    { id: 5, name: 'Stone Boomerang 🪃', reqLvl: 20, cost: 25000, power: 250 },
    { id: 6, name: 'Bone Dagger 🗡️', reqLvl: 35, cost: 100000, power: 900 },
    { id: 7, name: 'Poison Dart 💉', reqLvl: 50, cost: 400000, power: 3500 },
    { id: 8, name: 'Jungle Machete ⚔️', reqLvl: 75, cost: 2000000, power: 12000 },
    { id: 9, name: 'Tribal Spear 🔱', reqLvl: 100, cost: 10000000, power: 50000 },
    { id: 10, name: 'God of the Canopy Staff ⚕️', reqLvl: 150, cost: 50000000, power: 250000 }
];

const EGG_TIERS = [
    { id: 1, name: 'Tier 1 (Insects)', cost: 500, cpsBase: 3, pets: ['🐜', '🪲', '🐞', '🦗', '🦋'], ability: 'Swarm Strike' },
    { id: 2, name: 'Tier 2 (Amphibian/Reptile)', cost: 5000, cpsBase: 25, pets: ['🐸', '🐢', '🦎', '🐍', '🐊'], ability: 'Venom Bite' },
    { id: 3, name: 'Tier 3 (Mammals)', cost: 50000, cpsBase: 250, pets: ['🐒', '🐿️', '🦥', '🦨', '🦍'], ability: 'Primal Roar' },
    { id: 4, name: 'Tier 4 (Aviary)', cost: 500000, cpsBase: 2500, pets: ['🐦', '🦜', '🦤', '🦉', '🦅'], ability: 'Sky Dive' },
    { id: 5, name: 'Tier 5 (Mythical)', cost: 5000000, cpsBase: 25000, pets: ['🐯', '🦁', '🐘', '🐲'], ability: 'Prime Cataclysm' }
];

// --- GAME STATE ---
let gameState = {
    clicks: 0,
    level: 1,
    exp: 0,
    stage: 1,
    weaponsOwned: [0], 
    equippedWeapon: 0,
    petsOwned: [], 
    equippedPets: [], 
    enemyMaxHP: 150,
    enemyCurrentHP: 150,
};

// --- INITIALIZATION & SAVE SYSTEM ---
function loadGame() {
    const saved = localStorage.getItem('jungleSave');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
    recalculateEnemyHP(false); 
    updateUI();
    renderArmory();
    renderGacha();
    renderInventory();
}

function saveGame() {
    localStorage.setItem('jungleSave', JSON.stringify(gameState));
}
setInterval(saveGame, 2000);

// --- DYNAMIC HP ENGINE ---
function getWeaponPowerFactor(power) {
    return Math.max(1, 1 + Math.log10(power)); 
}

function recalculateEnemyHP(isWeaponSwitch = false) {
    const power = WEAPONS[gameState.equippedWeapon].power;
    const factor = getWeaponPowerFactor(power);
    const newMaxHP = Math.floor((gameState.stage * 150) / factor);
    
    if (isWeaponSwitch) {
        const hpRatio = gameState.enemyCurrentHP / gameState.enemyMaxHP;
        gameState.enemyMaxHP = Math.max(1, newMaxHP);
        gameState.enemyCurrentHP = Math.max(1, Math.floor(gameState.enemyMaxHP * hpRatio));
    } else {
        gameState.enemyMaxHP = Math.max(1, newMaxHP);
        if(gameState.enemyCurrentHP > gameState.enemyMaxHP) {
            gameState.enemyCurrentHP = gameState.enemyMaxHP;
        }
    }
}

// --- CORE BATTLE MECHANICS ---
const enemySprite = document.getElementById('enemy-sprite');

enemySprite.addEventListener('mousedown', (e) => handleAttack(e));
enemySprite.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    handleAttack(e.touches[0]);
});

function handleAttack(event) {
    enemySprite.classList.remove('bounce');
    void enemySprite.offsetWidth; 
    enemySprite.classList.add('bounce');

    let damage = WEAPONS[gameState.equippedWeapon].power;
    let isCrit = false;
    let procText = "";

    // Pet Ability Calculations
    gameState.equippedPets.forEach(petId => {
        if(Math.random() < 0.10) {
            const pet = gameState.petsOwned.find(p => p.id === petId);
            const tierInfo = EGG_TIERS.find(t => t.id === pet.tier);
            isCrit = true;
            
            switch(tierInfo.ability) {
                case 'Swarm Strike': damage *= 5; procText = "SWARM!"; break;
                case 'Venom Bite': gameState.enemyCurrentHP -= Math.floor(gameState.enemyMaxHP * 0.15); procText = "VENOM!"; break;
                case 'Primal Roar': damage *= 10; procText = "ROAR!"; break;
                case 'Sky Dive': damage += (damage * 20); procText = "SKY DIVE!"; break;
                case 'Prime Cataclysm': gameState.enemyCurrentHP = 0; procText = "CATACLYSM!"; break;
            }
        }
    });

    gameState.enemyCurrentHP -= damage;
    gameState.clicks += damage; 
    
    spawnFloatingText(event.clientX, event.clientY, damage, isCrit, procText);
    
    checkEnemyDeath();
    updateUI();
}

function checkEnemyDeath() {
    if (gameState.enemyCurrentHP <= 0) {
        const expGain = gameState.stage * 10;
        gameState.exp += expGain;
        gameState.stage++;
        
        const expNeeded = gameState.level * 50;
        if (gameState.exp >= expNeeded) {
            gameState.exp -= expNeeded;
            gameState.level++;
            spawnSystemText("LEVEL UP!");
        }
        
        recalculateEnemyHP(false);
        gameState.enemyCurrentHP = gameState.enemyMaxHP;
        changeEnemySprite();
        renderArmory(); 
    }
}

// FIX: Sync Name and Sprite perfectly
function changeEnemySprite() {
    const enemies = [
        { name: 'Jungle Slime', emoji: '🦠' },
        { name: 'Venomous Spider', emoji: '🕷️' },
        { name: 'Desert Scorpion', emoji: '🦂' },
        { name: 'Cave Bat', emoji: '🦇' },
        { name: 'Wild Boar', emoji: '🐗' },
        { name: 'Anaconda', emoji: '🐍' },
        { name: 'Jungle Leopard', emoji: '🐆' },
        { name: 'Swamp Crocodile', emoji: '🐊' },
        { name: 'Silverback Gorilla', emoji: '🦍' },
        { name: 'Apex T-Rex', emoji: '🦖' }
    ];
    
    // Loops back to the start if stage exceeds 10, but scales HP
    const idx = (gameState.stage - 1) % enemies.length;
    const currentEnemy = enemies[idx];
    
    enemySprite.textContent = currentEnemy.emoji;
    document.getElementById('enemy-name').textContent = currentEnemy.name;
}

// --- VISUALS ---
function spawnFloatingText(x, y, damage, isCrit, procText) {
    const container = document.getElementById('floating-text-container');
    const el = document.createElement('div');
    el.className = `floating-text ${isCrit ? 'crit-text' : ''}`;
    el.textContent = procText ? `${procText} -${formatNumber(damage)}` : `-${formatNumber(damage)}`;
    
    const offsetX = (Math.random() - 0.5) * 60;
    el.style.left = `${x + offsetX}px`;
    el.style.top = `${y - 30}px`;
    
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, 800);
}

function spawnSystemText(text) {
    const el = document.createElement('div');
    el.className = 'floating-text crit-text';
    el.textContent = text;
    el.style.left = '50%';
    el.style.top = '20%';
    el.style.transform = 'translateX(-50%)';
    document.getElementById('floating-text-container').appendChild(el);
    setTimeout(() => { el.remove(); }, 1500);
}

// --- PASSIVE INCOME ---
setInterval(() => {
    let cps = getTotalCPS();
    if (cps > 0) {
        gameState.clicks += cps;
        gameState.enemyCurrentHP -= Math.floor(cps / 2);
        checkEnemyDeath();
        updateUI();
    }
}, 1000);

function getTotalCPS() {
    return gameState.equippedPets.reduce((total, petId) => {
        const pet = gameState.petsOwned.find(p => p.id === petId);
        const tierInfo = EGG_TIERS.find(t => t.id === pet.tier);
        return total + tierInfo.cpsBase;
    }, 0);
}

// --- UI UPDATES ---
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num);
}

function updateUI() {
    document.getElementById('player-level').textContent = gameState.level;
    document.getElementById('current-stage').textContent = gameState.stage;
    document.getElementById('click-count').textContent = formatNumber(gameState.clicks);
    document.getElementById('cps-count').textContent = formatNumber(getTotalCPS());
    
    const expNeeded = gameState.level * 50;
    const expPercent = (gameState.exp / expNeeded) * 100;
    document.getElementById('exp-bar').style.width = `${expPercent}%`;

    const hpPercent = Math.max(0, (gameState.enemyCurrentHP / gameState.enemyMaxHP) * 100);
    document.getElementById('hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('hp-text').textContent = `${formatNumber(gameState.enemyCurrentHP)} / ${formatNumber(gameState.enemyMaxHP)}`;
    
    const activeWeapon = WEAPONS[gameState.equippedWeapon];
    document.getElementById('active-weapon-name').textContent = activeWeapon.name;
    document.getElementById('click-power').textContent = formatNumber(activeWeapon.power);

    document.querySelectorAll('.buy-weapon-btn').forEach(btn => {
        const cost = parseInt(btn.dataset.cost);
        if (gameState.clicks < cost && !btn.classList.contains('equip-btn')) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

function renderArmory() {
    const container = document.getElementById('armory-list');
    container.innerHTML = '';
    
    WEAPONS.forEach(weapon => {
        if (weapon.id === 0) return; 
        const isOwned = gameState.weaponsOwned.includes(weapon.id);
        const isEquipped = gameState.equippedWeapon === weapon.id;
        const lockedByLevel = gameState.level < weapon.reqLvl;
        
        let btnHTML = '';
        if (isEquipped) {
            btnHTML = `<button class="buy-btn equip-btn" disabled>Equipped</button>`;
        } else if (isOwned) {
            btnHTML = `<button class="buy-btn equip-btn" onclick="equipWeapon(${weapon.id})">Equip</button>`;
        } else {
            const canAfford = gameState.clicks >= weapon.cost;
            btnHTML = `<button class="buy-btn buy-weapon-btn" data-cost="${weapon.cost}" 
                ${(!canAfford || lockedByLevel) ? 'disabled' : ''} 
                onclick="buyWeapon(${weapon.id})">Buy (${formatNumber(weapon.cost)})</button>`;
        }

        container.innerHTML += `
            <div class="list-item">
                <div class="item-info">
                    <h4>${weapon.name}</h4>
                    <p>Power: +${formatNumber(weapon.power)} | Req Lvl: ${weapon.reqLvl} ${lockedByLevel ? '🔒' : ''}</p>
                </div>
                ${btnHTML}
            </div>
        `;
    });
}

function renderGacha() {
    const container = document.getElementById('gacha-list');
    container.innerHTML = '';
    
    EGG_TIERS.forEach(tier => {
        const canAfford = gameState.clicks >= tier.cost;
        container.innerHTML += `
            <div class="list-item">
                <div class="item-info">
                    <h4>${tier.name}</h4>
                    <p>Skill: [${tier.ability}] | CPS: +${tier.cpsBase}</p>
                </div>
                <button class="buy-btn" ${!canAfford ? 'disabled' : ''} 
                    onclick="rollGacha(${tier.id}, ${tier.cost})">Roll (${formatNumber(tier.cost)})</button>
            </div>
        `;
    });
}

function renderInventory() {
    const equipContainer = document.getElementById('equipped-pets');
    const invContainer = document.getElementById('pet-inventory');
    
    equipContainer.innerHTML = '';
    invContainer.innerHTML = '';
    
    gameState.equippedPets.forEach(petId => {
        const pet = gameState.petsOwned.find(p => p.id === petId);
        equipContainer.innerHTML += `
            <div class="pet-card" onclick="unequipPet(${pet.id})">
                ${pet.emoji}
                <div class="pet-lvl">T${pet.tier}</div>
            </div>`;
    });
    
    gameState.petsOwned.forEach(pet => {
        if (!gameState.equippedPets.includes(pet.id)) {
            invContainer.innerHTML += `
                <div class="pet-card" onclick="equipPet(${pet.id})">
                    ${pet.emoji}
                    <div class="pet-lvl">T${pet.tier}</div>
                </div>`;
        }
    });
}

// --- ACTIONS ---
window.buyWeapon = function(id) {
    const w = WEAPONS[id];
    if (gameState.clicks >= w.cost && gameState.level >= w.reqLvl) {
        gameState.clicks -= w.cost;
        gameState.weaponsOwned.push(id);
        equipWeapon(id);
    }
};

window.equipWeapon = function(id) {
    gameState.equippedWeapon = id;
    recalculateEnemyHP(true); 
    renderArmory();
    updateUI();
};

window.rollGacha = function(tierId, cost) {
    if (gameState.clicks >= cost) {
        gameState.clicks -= cost;
        const tier = EGG_TIERS.find(t => t.id === tierId);
        const randomPet = tier.pets[Math.floor(Math.random() * tier.pets.length)];
        
        const newPet = {
            id: Date.now() + Math.floor(Math.random()*1000),
            tier: tier.id,
            emoji: randomPet
        };
        gameState.petsOwned.push(newPet);
        
        spawnSystemText(`Hatched ${randomPet}!`);
        renderGacha();
        renderInventory();
        updateUI();
    }
};

window.equipPet = function(id) {
    if (gameState.equippedPets.length < 3) {
        gameState.equippedPets.push(id);
        renderInventory();
        updateUI();
    } else {
        alert("Max 3 pets equipped! Unequip one first.");
    }
};

window.unequipPet = function(id) {
    gameState.equippedPets = gameState.equippedPets.filter(petId => petId !== id);
    renderInventory();
    updateUI();
};

// --- NAVIGATION ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
        
        if (btn.dataset.target === 'tab-armory') renderArmory();
        if (btn.dataset.target === 'tab-gacha') renderGacha();
        if (btn.dataset.target === 'tab-inventory') renderInventory();
    });
});

// START
loadGame();
changeEnemySprite();
                                            
