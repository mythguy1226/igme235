// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application({
    width: 600,
    height: 600
});
document.body.appendChild(app.view);
app.view.style.border = "5px solid #8affa3";

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
app.loader.add("human", "media/playerSpriteSheet.png");
app.loader.add("zombie", "media/zombieSpriteSheet.png");
app.loader.add("spells", "media/spellSpriteSheet.png");
app.loader.add("barrier", "media/barrier.png");
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load(doneLoading);

window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

// aliases
let stage;

// game variables
let startScene;
let gameScene,human,scoreLabel,lifeLabel,waveLabel,abilityLabel,zombieCountLabel;
let gameOverScene,gameOverScoreLabel,gameOverWaveLabel;
let pauseMenu,bioElectricBlastUpgrade,heatWaveUpgrade,heatWaveBuy,forcePushUpgrade,forcePushBuy,fireBallUpgrade,fireBallBuy,freezeUpgrade,freezeBuy,acidShotUpgrade,acidShotBuy;
let instructionScene,instructions,controlsMovement,controlsButtons,controlsPause,controlsSpell;
let cashLabel;
let bioElectricBlastSound,heatWaveSound,forcePushSound,fireBallSound,freezeSound,acidShotSound;
let zombieMoan1Sound,zombieMoan2Sound,zombieMoan3Sound,zombieHurtSound,playerDeathSound;
let screenButtonSound,shopButtonSound;

let paused = true;
let playerSheet = {};
let zombieSheet = {};
let spellSheet = {};
let zombies = [];
let keys = {};
let barriers = [];
let player;
let speed = 2;
let spells = [];
let direction = "east";
let life = 100;
let wave = 1;
let score = 0;
let unlockedSpells = ["bioelectricblast"];
let activeSpell = "bioelectricblast";
let cooldownTimer = 0;
let moanTimer = 0;
let zombieSpeed = 4;

let zombieCount = 1;
let healthFactor = 10;

// Initial Spell effects
let knockBack = 50;
let burnTime = 2;
let acidTime = 5;
let freezeTime = 2;

// Initial Spell Damages
let bioElectricBlastDamage = 20;
let heatWaveDamage = 10;
let forcePushDamage = 20;
let fireBallDamage = 80;
let freezeDamage = 40;
let acidShotDamage = 35;

// Upgrade Cost Multipliers
let bioElectricBlastCost = 500;
let heatWaveCost = 500;
let forcePushCost = 500;
let fireBallCost = 500;
let freezeCost = 500;
let acidShotCost = 500;

// Keep track of upgrades (max 10)
let bioElectricBlastLevel = 1;
let heatWaveLevel = 1;
let forcePushLevel = 1;
let fireBallLevel = 1;
let freezeLevel = 1;
let acidShotLevel = 1;

function keysDown(e)
{
    keys[e.keyCode] = true;
}

function keysUp(e)
{
    keys[e.keyCode] = false;
}

function doneLoading(e)
{
    createPlayerSheet();
    createPlayer();
    createZombieSheet();
    createSpellSheet();

    app.ticker.add(gameLoop);
}

function createPlayerSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["human"].url);
    let w = 80;
    let h = 64;
    
    playerSheet["standEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
    playerSheet["standSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 1, w, h))
    ];
    playerSheet["standWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 2, w, h))
    ];
    playerSheet["standNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 3, w, h))
    ];

    playerSheet["walkEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0 * w, 0, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(1 * w, 0, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(2 * w, 0, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(3 * w, 0, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(4 * w, 0, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(5 * w, 0, w, h))
    ];

    playerSheet["walkSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(1 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(2 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(3 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(4 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(5 * w, h, w, h))
    ];

    playerSheet["walkWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0 * w, h * 2, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(1 * w, h * 2, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(2 * w, h * 2, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(3 * w, h * 2, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(4 * w, h * 2, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(5 * w, h * 2, w, h))
    ];

    playerSheet["walkNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0 * w, h * 3, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(1 * w, h * 3, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(2 * w, h * 3, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(3 * w, h * 3, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(4 * w, h * 3, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(5 * w, h * 3, w, h))
    ];
}
function createZombieSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["zombie"].url);
    let w = 85;
    let h = 80;
    
    zombieSheet["standNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
    zombieSheet["standEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, 0, w, h))
    ];
    zombieSheet["standSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, 0, w, h))
    ];
    zombieSheet["standWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, 0, w, h))
    ];
}
function createSpellSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["spells"].url);
    let w = 32;
    let h = 32;
    
    // Bio-Electric Blast Frames
    spellSheet["bioElectricNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
    spellSheet["bioElectricEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, 0, w, h))
    ];
    spellSheet["bioElectricSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, 0, w, h))
    ];
    spellSheet["bioElectricWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, 0, w, h))
    ];

    // Heat Wave Frames
    spellSheet["heatWaveNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h, w, h))
    ];
    spellSheet["heatWaveEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, h, w, h))
    ];
    spellSheet["heatWaveSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, h, w, h))
    ];
    spellSheet["heatWaveWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, h, w, h))
    ];

    // Force Push Frames
    spellSheet["forcePushNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 2, w, h))
    ];
    spellSheet["forcePushWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, h * 2, w, h))
    ];
    spellSheet["forcePushSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, h * 2, w, h))
    ];
    spellSheet["forcePushEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, h * 2, w, h))
    ];

    // Fire Ball Frames
    spellSheet["fireBallNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 3, w, h))
    ];
    spellSheet["fireBallEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, h * 3, w, h))
    ];
    spellSheet["fireBallSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, h * 3, w, h))
    ];
    spellSheet["fireBallWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, h * 3, w, h))
    ];

    // Freeze Frames
    spellSheet["freezeNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 4, w, h))
    ];
    spellSheet["freezeEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, h * 4, w, h))
    ];
    spellSheet["freezeSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, h * 4, w, h))
    ];
    spellSheet["freezeWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, h * 4, w, h))
    ];

    // Acid Shot Frames
    spellSheet["acidShotNorth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, h * 5, w, h))
    ];
    spellSheet["acidShotEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, h * 5, w, h))
    ];
    spellSheet["acidShotSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, h * 5, w, h))
    ];
    spellSheet["acidShotWest"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 3, h * 5, w, h))
    ];
}

function createPlayer()
{
    player = new PIXI.AnimatedSprite(playerSheet.standSouth);
    player.anchor.set(0.5);
    player.animationSpeed = 0.1;
    player.loop = false;
    player.x = app.view.width / 2;
    player.y = app.view.height / 2;
    gameScene.addChild(player);
    player.play();
}

function createZombie(x, y)
{
    let zombie = new PIXI.AnimatedSprite(zombieSheet.standNorth);
    zombie.anchor.set(0.5);
    zombie.animationSpeed = 0.1;
    zombie.loop = false;
    zombie.x = x;
    zombie.y = y;
    zombie.isAlive = true;
    zombie["health"] = 100;
    zombies.push(zombie);
    gameScene.addChild(zombie);
    zombie.play();
}
function createSpell(x, y)
{
    let spell = new PIXI.AnimatedSprite(spellSheet.bioElectricNorth);
    spell.anchor.set(0.5);
    spell.animationSpeed = 0.1;
    spell.loop = false;
    spell.x = x;
    spell.y = y;
    switch(activeSpell)
    {
        case "bioelectricblast":
            if(direction == "north")
            {
                spell.fwd = {x:0, y:-1};
                spell.textures = spellSheet.bioElectricNorth;
            }
            if(direction == "east")
            {
                spell.fwd = {x: 1, y: 0};
                spell.textures = spellSheet.bioElectricEast;
            }
            if(direction == "south")
            {
                spell.fwd = {x: 0, y: 1};
                spell.textures = spellSheet.bioElectricSouth;
            }
            if(direction == "west")
            {
                spell.fwd = {x: -1, y: 0};
                spell.textures = spellSheet.bioElectricWest;
            }
            bioElectricBlastSound.play();
            break;
        case "heatwave":
            if(direction == "north")
            {
                spell.fwd = {x:0, y:-1};
                spell.textures = spellSheet.heatWaveNorth;
            }
            if(direction == "east")
            {
                spell.fwd = {x: 1, y: 0};
                spell.textures = spellSheet.heatWaveEast;
            }
            if(direction == "south")
            {
                spell.fwd = {x: 0, y: 1};
                spell.textures = spellSheet.heatWaveSouth;
            }
            if(direction == "west")
            {
                spell.fwd = {x: -1, y: 0};
                spell.textures = spellSheet.heatWaveWest;
            }
            heatWaveSound.play();
            break;
        case "forcepush":
            if(direction == "north")
            {
                spell.fwd = {x:0, y:-1};
                spell.textures = spellSheet.forcePushNorth;
            }
            if(direction == "east")
            {
                spell.fwd = {x: 1, y: 0};
                spell.textures = spellSheet.forcePushEast;
            }
            if(direction == "south")
            {
                spell.fwd = {x: 0, y: 1};
                spell.textures = spellSheet.forcePushSouth;
            }
            if(direction == "west")
            {
                spell.fwd = {x: -1, y: 0};
                spell.textures = spellSheet.forcePushWest;
            }
            forcePushSound.play();
            break;
        case "fireball":
            if(direction == "north")
            {
                spell.fwd = {x:0, y:-1};
                spell.textures = spellSheet.fireBallNorth;
            }
            if(direction == "east")
            {
                spell.fwd = {x: 1, y: 0};
                spell.textures = spellSheet.fireBallEast;
            }
            if(direction == "south")
            {
                spell.fwd = {x: 0, y: 1};
                spell.textures = spellSheet.fireBallSouth;
            }
            if(direction == "west")
            {
                spell.fwd = {x: -1, y: 0};
                spell.textures = spellSheet.fireBallWest;
            }
            fireBallSound.play();
            break;
        case "freeze":
            if(direction == "north")
            {
                spell.fwd = {x:0, y:-1};
                spell.textures = spellSheet.freezeNorth;
            }
            if(direction == "east")
            {
                spell.fwd = {x: 1, y: 0};
                spell.textures = spellSheet.freezeEast;
            }
            if(direction == "south")
            {
                spell.fwd = {x: 0, y: 1};
                spell.textures = spellSheet.freezeSouth;
            }
            if(direction == "west")
            {
                spell.fwd = {x: -1, y: 0};
                spell.textures = spellSheet.freezeWest;
            }
            freezeSound.play();
            break;
        case "acidshot":
            if(direction == "north")
            {
                spell.fwd = {x:0, y:-1};
                spell.textures = spellSheet.acidShotNorth;
            }
            if(direction == "east")
            {
                spell.fwd = {x: 1, y: 0};
                spell.textures = spellSheet.acidShotEast;
            }
            if(direction == "south")
            {
                spell.fwd = {x: 0, y: 1};
                spell.textures = spellSheet.acidShotSouth;
            }
            if(direction == "west")
            {
                spell.fwd = {x: -1, y: 0};
                spell.textures = spellSheet.acidShotWest;
            }
            acidShotSound.play();
            break;
    }
    spell.speed = 400;
    spell.isAlive = true;
    spells.push(spell);
    gameScene.addChild(spell);
    spell.play();
}

// Reset required fields and begin the game
function startGame()
{
    startScene.visible = false;
    gameOverScene.visible = false;
    instructionScene.visible = false;
    gameScene.visible = true;
    pauseMenu.visible = false;
    paused = false;
    life = 100;
    wave = 1;
    score = 0;
    zombieCount = 1;
    createZombie(100, 100);
    player.x = app.view.width / 2;
    player.y = app.view.height / 2;

    waveLabel.text = "Wave: 1";
    zombieCountLabel.text = "Zombie Count: 1";
    decreaseLifeBy(0);
    increaseScoreBy(0);
    activeSpell = "bioelectricblast";
    unlockedSpells = ["bioelectricblast"];
    abilityLabel.text = "Bio-Electric Blast";
    abilityLabel.style.stroke = 0x00aaaa;

    screenButtonSound.play();

    // Reset Ability variables
    bioElectricBlastLevel = 1;
    heatWaveLevel = 1;
    forcePushLevel = 1;
    fireBallLevel = 1;
    freezeLevel = 1;
    acidShotLevel = 1;
    bioElectricBlastDamage = 20;
    heatWaveDamage = 10;
    forcePushDamage = 20;
    fireBallDamage = 50;
    freezeDamage = 40;
    acidShotDamage = 35;
    knockBack = 50;

    // Reset Upgrade labels
    bioElectricBlastUpgrade.text = "Bio-Electric Blast $500";
    heatWaveUpgrade.text = "Heat Wave $500";
    forcePushUpgrade.text = "Force Push $500";
    fireBallUpgrade.text = "Fireball $500";
    freezeUpgrade.text = "Freeze $500";
    acidShotUpgrade.text = "Acid Shot $500";
    heatWaveUpgrade.style.stroke = 0xaaaaaa;
    forcePushUpgrade.style.stroke = 0xaaaaaa;
    fireBallUpgrade.style.stroke = 0xaaaaaa;
    freezeUpgrade.style.stroke = 0xaaaaaa;
    acidShotUpgrade.style.stroke = 0xaaaaaa;
    acidShotUpgrade.style.stroke = 0xaaaaaa;
}

// Go back to start screen
function restartGame()
{
    startScene.visible = true;
    gameOverScene.visible = false;
    gameScene.visible = false;
    pauseMenu.visible = false;
    screenButtonSound.play();
}

// Update function
function gameLoop()
{
    if (paused) return;

    // Make cooldown time go down
    if(cooldownTimer > 0)
    {
        cooldownTimer -= (1/app.ticker.FPS);
    }

    // Logic for playing ambient zombie sounds
    if(moanTimer > 0)
    {
        moanTimer -= (1/app.ticker.FPS);
    }
    else
    {
        moanTimer = 8;
        switch(getRandom(0, 2))
        {
            case 0:
                zombieMoan1Sound.play();
                break;
            case 1:
                zombieMoan2Sound.play();
                break;
            default:
                zombieMoan1Sound.play();
                break;
        }
    }

    // *** User Input *** 
    // W
    if(keys["87"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkNorth;
            player.play();
            direction = "north";
        }
        player.y -= speed;
    }

    // A
    if(keys["65"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkWest;
            player.play();
            direction = "west";
        }
        player.x -= speed;
    }

    // S
    if(keys["83"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkSouth;
            player.play();
            direction = "south";
        }
        player.y += speed;
    }

    // D
    if(keys["68"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkEast;
            player.play();
            direction = "east";
        }
        player.x += speed;
    }

    // Space
    if(keys["32"])
    {
        // If cooldown timer is still running cancel spell activation
        if(cooldownTimer <= 0)
        {
            // Draw spells based on the active Spell
            if(activeSpell == "bioelectricblast")
            {
                activateSpell(player.x, player.y);
            }
            if(activeSpell == "heatwave")
            {
                switch(direction)
                {
                    case "north":
                        activateSpell(player.x, player.y);
                        activateSpell(player.x + 32, player.y);
                        activateSpell(player.x - 32, player.y);
                        break;
                    case "east":
                        activateSpell(player.x, player.y);
                        activateSpell(player.x, player.y + 32);
                        activateSpell(player.x, player.y - 32);
                        break;
                    case "south":
                        activateSpell(player.x, player.y);
                        activateSpell(player.x + 32, player.y);
                        activateSpell(player.x - 32, player.y);
                        break;
                    case "west":
                        activateSpell(player.x, player.y);
                        activateSpell(player.x, player.y + 32);
                        activateSpell(player.x, player.y - 32);
                        break;
                }
            }
            if(activeSpell == "forcepush")
            {
                activateSpell(player.x, player.y);
            }
            if(activeSpell == "fireball")
            {
                activateSpell(player.x, player.y);
            }
            if(activeSpell == "freeze")
            {
                activateSpell(player.x, player.y);
            }
            if(activeSpell == "acidshot")
            {
                activateSpell(player.x, player.y);
            }
        }
    }

    // Pause
    if(keys["80"])
    {
        startScene.visible = false;
        gameScene.visible = false;
        pauseMenu.visible = true;
        gameOverScene.visible = false;
        paused = true;
        cashLabel.text = `Available Cash: ${score}`;
    }

    // *** Idle Animations ***
    // North
    if(!keys["87"] && direction == "north")
    {
        if(!player.playing)
        {
            player.textures = playerSheet.standNorth;
            player.play();
        }
    }
    // West
    if(!keys["65"] && direction == "west")
    {
        if(!player.playing)
        {
            player.textures = playerSheet.standWest;
            player.play();
        }
    }

    // South
    if(!keys["83"] && direction == "south")
    {
        if(!player.playing)
        {
            player.textures = playerSheet.standSouth;
            player.play();
        }
    }

    // East
    if(!keys["68"] && direction == "east")
    {
        if(!player.playing)
        {
            player.textures = playerSheet.standEast;
            player.play();
        }
    }

    // *** Player Clamp to Borders ***
    let w2 = player.width/2;
    let h2 = player.height/2;
    player.x = clamp(player.x, 0 + w2, sceneWidth - w2);
    player.y = clamp(player.y, 0+ h2, sceneHeight - h2);

    // *** Spell Movement ***
    for (let s of spells){
		s.x += s.fwd.x * s.speed * (1/60);
        s.y += s.fwd.y * s.speed * (1/60);
    }
    
    // *** Changing Directions and Movement for Zombie ***
    for(let z of zombies)
    {
        // Move and Face North
        if(player.y < z.y)
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standNorth;
                z.play();
                z.y -= zombieSpeed;
                if(player.x < z.x)
                {
                    z.x -= zombieSpeed;
                }
                if(player.x > z.x)
                {
                    z.x += zombieSpeed;
                }
            }
        }

        // Move and Face South
        if(player.y > z.y)
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standSouth;
                z.play();
                z.y += zombieSpeed;
                if(player.x > z.x)
                {
                    z.x += zombieSpeed;
                }
                if(player.x < z.x)
                {
                    z.x -= zombieSpeed;
                }
            }
        }

        // Move and Face East
        if(player.x > z.x && (player.y + 30 > z.y && player.y - 30 < z.y))
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standEast;
                z.play();
                z.x += zombieSpeed;
            }
        }

        // Move and Face West
        if(player.x < z.x && (player.y + 30 > z.y && player.y - 30 < z.y))
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standWest;
                z.play();
                z.x -= zombieSpeed;
            }
        }
    }

    // *** Check for Collisions ***
    for(let z of zombies)
    {
        // #5A - zombies and spells
        for(let s of spells)
        {
            if(circlesIntersect(z, s))
            {
                // Make different effects on zombies based on the active spell
                switch(activeSpell)
                {
                    // Normal Damage
                    case "bioelectricblast":
                        z.health -= bioElectricBlastDamage;
                        break;
                    // Low Damage with Short Burn Effect
                    case "heatwave":
                        z.health -= heatWaveDamage;
                        z.onFire = true;
                        z.burnTimer = burnTime;
                        break;
                    // Medium Damage with Knockback
                    case "forcepush":
                        z.health -= forcePushDamage;
                        if(direction == "north")
                        {
                            z.y -= knockBack;
                        }
                        if(direction == "south")
                        {
                            z.y += knockBack;
                        }
                        if(direction == "east")
                        {
                            z.x += knockBack;
                        }
                        if(direction == "west")
                        {
                            z.x -= knockBack;
                        }
                        break;
                    // High Damage with Short Burn Effect
                    case "fireball":
                        z.health -= fireBallDamage;
                        z.onFire = true;
                        z.burnTimer = burnTime;
                        break;
                    // Medium Damage with Freeze Effect
                    case "freeze":
                        z.health -= freezeDamage;
                        z.onIce = true;
                        z.freezeTimer = freezeTime;
                        break;
                    // Medium Damage with Long Burn Effect
                    case "acidshot":
                        z.health -= acidShotDamage;
                        z.onAcid = true;
                        z.acidTimer = acidTime;
                        break;
                }
                zombieHurtSound.play();
                
                // Kill zombie and add points
                if(z.health <= 0)
                {
                    gameScene.removeChild(z);
                    zombieMoan3Sound.play();
                    z.isAlive = false;
                    increaseScoreBy(100);
                    zombieCountLabel.text = `Zombie Count: ${zombies.length}`;
                }
                gameScene.removeChild(s);
                s.isAlive = false;
            }

            if(s.y < -30) s.isAlive = false;
            if(s.y > sceneHeight + 30) s.isAlive = false;
        }

        // Zombies and player
        if(z.isAlive && circlesIntersect(z, player))
        {
            decreaseLifeBy(0.5);
        }
    }

    // Check for special effects against zombies
    for(let z of zombies)
    {
        // If the zombie is on fire then burn them for a bit until the fire goes out
        if(z.onFire)
        {
            if(z.burnTimer > 0)
            {
                z.burnTimer -= (1/app.ticker.FPS);
                z.health -= 0.2;
                z.tint = 0xFF6600;
            }
            else
            {
                z.onFire = false;
                z.tint = 0xFFFFFF;
            }
        }
        // If the zombie is frozen then slow their movement temporarily
        if(z.onIce)
        {
            if(z.freezeTimer > 0)
            {
                z.freezeTimer -= (1/app.ticker.FPS);
                zombieSpeed = 1;
                z.tint = 0x00FFFF;
            }
            else
            {
                z.onIce = false;
                zombieSpeed = 4;
                z.tint = 0xFFFFFF;
            }
        }

        // If the zombie is on acid melt them until the acid wears off
        if(z.onAcid)
        {
            if(z.acidTimer > 0)
            {
                z.acidTimer -= (1/app.ticker.FPS);
                z.health -= 0.5;
                z.tint = 0x00FF00;
            }
            else
            {
                z.onAcid = false;
                z.tint = 0xFFFFFF;
            }
        }
    }
    

    // *** Clean up Dead Sprites ***
    // get rid of dead spells
    spells = spells.filter(s => s.isAlive);

    // get rid of dead zombies
    zombies = zombies.filter(z => z.isAlive);
	
	// *** Is game over? ***
	if (life <= 0){
        end();
        playerDeathSound.play();
        return;
    }

    // *** Next Wave ***
    if(zombies.length == 0)
    {
        nextWave();
    }
}

// Spawns the next wave
function nextWave()
{
    zombieCount += 5;
    increaseWaveBy(1);

    // Spawn the new zombies
    for(let i = 0; i < zombieCount; i++)
    {
        // Select a random barrier then make the zombie spawn there
        let barrierChoice = Math.floor(Math.random() * (barriers.length - 0 + 1)) + 0;
        let zombieX = 0
        let zombieY = 0;
        let zombieScatter = Math.floor(Math.random() * (128 - 0 + 1)) + 0;
        switch(barrierChoice)
        {
            case 0:
                zombieX = barriers[0].x + zombieScatter;
                zombieY = barriers[0].y + 64;
                createZombie(zombieX, zombieY);
                break;
            case 1:
                zombieX = barriers[1].x + zombieScatter;
                zombieY = barriers[1].y + 100;
                createZombie(zombieX, zombieY);
                break;
            case 2:
                zombieX = barriers[2].x + zombieScatter;
                zombieY = barriers[2].y + 64;
                createZombie(zombieX, zombieY);
                break;
            default:
                createZombie(100, 100);
                break;
        }
    }

    // Set new zombie health dependant on wave number
    for(let z of zombies)
    {
        z.health += (healthFactor * wave);
    }

    zombieCountLabel.text = `Zombie Count: ${zombieCount}`;
}

function activateSpell(x, y)
{
    if(paused) return;
    createSpell(x, y);

    // Cooldown timers per spell
    switch(activeSpell)
    {
        case "bioelectricblast":
            // Set the cooldown timer
            cooldownTimer = 0.25;
            break;
        case "heatwave":
            // Set the cooldown timer
            cooldownTimer = 0.5;
            break;
        case "forcepush":
            // Set the cooldown timer
            cooldownTimer = 1;
            break;
        case "fireball":
            // Set the cooldown timer
            cooldownTimer = 3;
            break;
        case "freeze":
            // Set the cooldown timer
            cooldownTimer = 1;
            break;
        case "acidshot":
            // Set the cooldown timer
            cooldownTimer = 3;
            break;
    }
}

function setup() {
	stage = app.stage;
	// Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);

    // Add background image to start screen
    let backgroundTexture = PIXI.BaseTexture.from("media/mutationGenesisStart.png");
    let backgroundTexture2 = new PIXI.Texture(backgroundTexture, new PIXI.Rectangle(100, 0, 600, 600));
    let background = new PIXI.Sprite(backgroundTexture2);
    startScene.addChild(background);

    // Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // Add background image to game screen
    let floorTexture = PIXI.BaseTexture.from("media/stoneBrickFloor.png");
    let floorTexture2 = new PIXI.Texture(floorTexture, new PIXI.Rectangle(0, 0, 600, 600));
    let gameBackground = new PIXI.Sprite(floorTexture2);
    gameScene.addChild(gameBackground);

    // Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    // Create Pause Menu
    pauseMenu = new PIXI.Container();
    pauseMenu.visible = false;
    stage.addChild(pauseMenu);

    // Create Instructions Scene
    instructionScene = new PIXI.Container();
    instructionScene.visible = false;
    stage.addChild(instructionScene);

    // Create labels for all scenes
    createLabelsAndButtons();

    // Set the barriers
    let barrier1 = new Barrier(100, sceneHeight - 128);
    barriers.push(barrier1);
    gameScene.addChild(barrier1);

    let barrier2 = new Barrier(150, -66);
    barriers.push(barrier2);
    gameScene.addChild(barrier2);

    let barrier3 = new Barrier(400, sceneHeight - 128);
    barriers.push(barrier3);
    gameScene.addChild(barrier3);
    
	// Load Sounds
    bioElectricBlastSound = new Howl({
        src: ['sounds/bioelectricblast.mp3']
    });

    heatWaveSound = new Howl({
        src: ['sounds/heatwave.mp3']
    });

    forcePushSound = new Howl({
        src: ['sounds/forcepush.mp3']
    });

    fireBallSound = new Howl({
        src: ['sounds/fireball.mp3']
    });
    
    freezeSound = new Howl({
        src: ['sounds/freeze.mp3']
    });

    acidShotSound = new Howl({
        src: ['sounds/acidshot.mp3']
    });

    zombieHurtSound = new Howl({
        src: ['sounds/zombieHurt.mp3']
    });

    zombieMoan1Sound = new Howl({
        src: ['sounds/zombieMoan1.mp3']
    });

    zombieMoan2Sound = new Howl({
        src: ['sounds/zombieMoan2.mp3']
    });

    zombieMoan3Sound = new Howl({
        src: ['sounds/zombieMoan3.mp3']
    });

    playerDeathSound = new Howl({
        src: ['sounds/playerDeath.mp3']
    });

    screenButtonSound = new Howl({
        src: ['sounds/screenButton.mp3']
    });

    shopButtonSound = new Howl({
        src: ['sounds/shopButton.mp3']
    });
}

function end()
{
    paused = true;

    // clear out level
    zombies.forEach(z=>gameScene.removeChild(z)); // concise arrow function with no brackets and no return
    zombies = [];

    spells.forEach(s=>gameScene.removeChild(s)); // ditto
    spells = [];

    gameOverScene.visible = true;
    gameScene.visible = false;

    gameOverScoreLabel.text = `Your final score: ${score}`;
    gameOverWaveLabel.text = `You survived to wave: ${wave}`;
}

function createLabelsAndButtons()
{
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xaaFFaa,
        fontSize: 48,
        fontFamily: "Zombie",
        stroke: 0x00FF00,
        strokeThickness: 6
    });

    // 1 - set up 'startScene'
    // 1A - make the top start label
    let startLabel1 = new PIXI.Text("Mutation Genesis");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xaaFFaa,
        fontSize: 60,
        fontFamily: 'Zombie',
        stroke: 0x00FF00,
        strokeThickness: 6
    });
    startLabel1.x = 30;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    // 1B - make the middle start label
    let startLabel2 = new PIXI.Text("Can you Survive\nthe Apocalypse?");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xaaFFaa,
        fontSize: 40,
        fontFamily: 'Zombie',
        fontStyle: 'italic',
        stroke: 0x00FF00,
        strokeThickness: 6
    });
    startLabel2.x = 135;
    startLabel2.y = 280;
    startScene.addChild(startLabel2);

    // 1C - make the start game button
    let instructionButton = new PIXI.Text("Begin the Carnage");
    instructionButton.style = buttonStyle;
    instructionButton.x = 80;
    instructionButton.y = sceneHeight - 120;
    instructionButton.interactive = true;
    instructionButton.buttonMode = true;
    instructionButton.on("pointerup", giveInstructions);
    instructionButton.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    instructionButton.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    startScene.addChild(instructionButton);

    // 2 - set up 'gameScene'
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: 'Futura',
        stroke: 0x00aa00,
        strokeThickness: 4
    });

    // Make score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // Make life label
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);

    // Make Wave Label
    waveLabel = new PIXI.Text();
    waveLabel.style = textStyle;
    waveLabel.x = 5;
    waveLabel.y = 47;
    gameScene.addChild(waveLabel);
    increaseWaveBy(0);

    // Make Zombie Count Label
    zombieCountLabel = new PIXI.Text("Zombie Count : 1");
    zombieCountLabel.style = textStyle;
    zombieCountLabel.x = 5;
    zombieCountLabel.y = 68;
    gameScene.addChild(zombieCountLabel);

    // Make Ability Label
    abilityLabel = new PIXI.Text("Bio-Electric Blast");
    abilityLabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: 'Futura',
        stroke: 0x00aaaa,
        strokeThickness: 4
    });
    abilityLabel.x = sceneWidth - 180;
    abilityLabel.y = 55;
    gameScene.addChild(abilityLabel);

    // make the change ability button
    let abilityButton = new PIXI.Text("Switch Ability");
    abilityButton.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 30,
        fontFamily: 'Futura',
        fontStyle: 'italic',
        stroke: 0x00aa00,
        strokeThickness: 6
    });
    abilityButton.x = sceneWidth - 200;
    abilityButton.y = 20;
    abilityButton.interactive = true;
    abilityButton.buttonMode = true;
    abilityButton.on("pointerup", changeAbility); // startGame is a function reference
    abilityButton.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    abilityButton.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    gameScene.addChild(abilityButton);

    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over");
    textStyle = new PIXI.TextStyle({
        fill: 0xaaffaa,
        fontSize: 64,
        fontFamily: "Futura",
        stroke: 0x00ff00,
        strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 150;
    gameOverText.y = sceneHeight/2 - 160;
    gameOverScene.addChild(gameOverText);

    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Play Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 150;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup",restartGame); // startGame is a function reference
    playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);

    // make game over score label
    gameOverScoreLabel = new PIXI.Text();
    gameOverScoreLabel.style = new PIXI.TextStyle({
        fill: 0xaaffaa,
        fontSize: 40,
        fontFamily: "Futura",
        stroke: 0x00ff00,
        strokeThickness: 6
    });
    gameOverScoreLabel.x = 100;
    gameOverScoreLabel.y = sceneHeight/2 + 20;
    gameOverScene.addChild(gameOverScoreLabel);

    gameOverWaveLabel = new PIXI.Text();
    gameOverWaveLabel.style = new PIXI.TextStyle({
        fill: 0xaaffaa,
        fontSize: 40,
        fontFamily: "Futura",
        stroke: 0x00ff00,
        strokeThickness: 6
    });
    gameOverWaveLabel.x = 100;
    gameOverWaveLabel.y = sceneHeight/2 + 60;
    gameOverScene.addChild(gameOverWaveLabel);

    // Set up the Instructions Scene
    instructions = new PIXI.Text("Objective: The point of the game is to\n"
                               + "survive as long as possible in the zombie\n"
                               + "apocalypse. Buy and Upgrade Abilities to aid\n"
                               + "in facing endless waves of the undead");
    instructions.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 3
    });
    instructions.x = 100;
    instructions.y = 40;
    instructionScene.addChild(instructions);

    controlsMovement = new PIXI.Text("Movement Controls: WASD");
    controlsMovement.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 3
    });
    controlsMovement.x = 100;
    controlsMovement.y = 220;
    instructionScene.addChild(controlsMovement);

    controlsButtons= new PIXI.Text("Button Controls: Mouse");
    controlsButtons.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 3
    });
    controlsButtons.x = 100;
    controlsButtons.y = 280;
    instructionScene.addChild(controlsButtons);

    controlsPause = new PIXI.Text("Controls to Pause: P");
    controlsPause.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 3
    });
    controlsPause.x = 100;
    controlsPause.y = 340;
    instructionScene.addChild(controlsPause);

    controlsSpell= new PIXI.Text("Activate Spell: Space");
    controlsSpell.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 3
    });
    controlsSpell.x = 100;
    controlsSpell.y = 400;
    instructionScene.addChild(controlsSpell);

    // 1C - make the start game button
    let startButton = new PIXI.Text("Start Game");
    startButton.style = buttonStyle;
    startButton.x = 180;
    startButton.y = sceneHeight - 120;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame); // startGame is a function reference
    startButton.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    startButton.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    instructionScene.addChild(startButton);

    // Set up the Pause menu
    // Resume Button
    let resumeButton = new PIXI.Text("Resume Game");
    resumeButton.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 30,
        fontFamily: 'Futura',
        fontStyle: 'italic',
        stroke: 0x00aa00,
        strokeThickness: 6
    });
    resumeButton.x = sceneWidth - 200;
    resumeButton.y = 20;
    resumeButton.interactive = true;
    resumeButton.buttonMode = true;
    resumeButton.on("pointerup", resumeGame); // startGame is a function reference
    resumeButton.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    resumeButton.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(resumeButton);

    // Upgrade Abilities Label
    let upgradeLabel = new PIXI.Text("Upgrades:");
    upgradeLabel.style = new PIXI.TextStyle({
        fill: 0xaaaaff,
        fontSize: 30,
        fontFamily: 'Futura',
        stroke: 0x0000ff,
        strokeThickness: 6
    });
    upgradeLabel.x = 50;
    upgradeLabel.y = 100;
    pauseMenu.addChild(upgradeLabel);

    // Buy Abilities Label
    let buyLabel = new PIXI.Text("Buy Abilities:");
    buyLabel.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 30,
        fontFamily: 'Futura',
        stroke: 0xaa00aa,
        strokeThickness: 6
    });
    buyLabel.x = 350;
    buyLabel.y = 100;
    pauseMenu.addChild(buyLabel);

    // Cash Tracker
    cashLabel = new PIXI.Text(`Available Cash: ${score}`);
    cashLabel.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 30,
        fontFamily: 'Futura',
        stroke: 0x00aa00,
        strokeThickness: 6
    });
    cashLabel.x = 20;
    cashLabel.y = 20;
    pauseMenu.addChild(cashLabel);

    // ***Buttons for Upgrading Abilities***
    // Bio-Electric Blast Upgrade
    bioElectricBlastUpgrade = new PIXI.Text("Bio-Electric Blast $500");
    bioElectricBlastUpgrade.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0x00aaaa,
        strokeThickness: 6
    });
    bioElectricBlastUpgrade.x = 50;
    bioElectricBlastUpgrade.y = 140;
    bioElectricBlastUpgrade.interactive = true;
    bioElectricBlastUpgrade.buttonMode = true;
    bioElectricBlastUpgrade.on("pointerup", e => upgradeAbility("bioelectricblast"));
    bioElectricBlastUpgrade.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    bioElectricBlastUpgrade.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(bioElectricBlastUpgrade);

    // Heat Wave Upgrade
    heatWaveUpgrade = new PIXI.Text("Heat Wave $500");
    heatWaveUpgrade.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xaaaaaa,
        strokeThickness: 6
    });
    heatWaveUpgrade.x = 50;
    heatWaveUpgrade.y = 170;
    heatWaveUpgrade.interactive = true;
    heatWaveUpgrade.buttonMode = true;
    heatWaveUpgrade.on("pointerup", e => upgradeAbility("heatwave"));
    heatWaveUpgrade.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    heatWaveUpgrade.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(heatWaveUpgrade);

    // Force Push Upgrade
    forcePushUpgrade = new PIXI.Text("Force Push $500");
    forcePushUpgrade.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xaaaaaa,
        strokeThickness: 6
    });
    forcePushUpgrade.x = 50;
    forcePushUpgrade.y = 200;
    forcePushUpgrade.interactive = true;
    forcePushUpgrade.buttonMode = true;
    forcePushUpgrade.on("pointerup", e => upgradeAbility("forcepush"));
    forcePushUpgrade.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    forcePushUpgrade.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(forcePushUpgrade);

    // Fireball Upgrade
    fireBallUpgrade = new PIXI.Text("Fireball $500");
    fireBallUpgrade.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xaaaaaa,
        strokeThickness: 6
    });
    fireBallUpgrade.x = 50;
    fireBallUpgrade.y = 230;
    fireBallUpgrade.interactive = true;
    fireBallUpgrade.buttonMode = true;
    fireBallUpgrade.on("pointerup", e => upgradeAbility("fireball"));
    fireBallUpgrade.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    fireBallUpgrade.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(fireBallUpgrade);

    // Freeze Upgrade
    freezeUpgrade = new PIXI.Text("Freeze $500");
    freezeUpgrade.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xaaaaaa,
        strokeThickness: 6
    });
    freezeUpgrade.x = 50;
    freezeUpgrade.y = 260;
    freezeUpgrade.interactive = true;
    freezeUpgrade.buttonMode = true;
    freezeUpgrade.on("pointerup", e => upgradeAbility("freeze"));
    freezeUpgrade.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    freezeUpgrade.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(freezeUpgrade);

    // Acid Shot Upgrade
    acidShotUpgrade = new PIXI.Text("Acid Shot $500");
    acidShotUpgrade.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xaaaaaa,
        strokeThickness: 6
    });
    acidShotUpgrade.x = 50;
    acidShotUpgrade.y = 290;
    acidShotUpgrade.interactive = true;
    acidShotUpgrade.buttonMode = true;
    acidShotUpgrade.on("pointerup", e => upgradeAbility("acidshot"));
    acidShotUpgrade.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    acidShotUpgrade.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(acidShotUpgrade);

    // ***Buttons for Buying Abilities***
    // Heat Wave Buy
    heatWaveBuy = new PIXI.Text("Heat Wave $1000");
    heatWaveBuy.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xff6600,
        strokeThickness: 6
    });
    heatWaveBuy.x = 350;
    heatWaveBuy.y = 140;
    heatWaveBuy.interactive = true;
    heatWaveBuy.buttonMode = true;
    heatWaveBuy.on("pointerup", e => buyAbility("heatwave"));
    heatWaveBuy.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    heatWaveBuy.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(heatWaveBuy);

    // Force Push Buy
    forcePushBuy = new PIXI.Text("Force Push $1500");
    forcePushBuy.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0x555555,
        strokeThickness: 6
    });
    forcePushBuy.x = 350;
    forcePushBuy.y = 170;
    forcePushBuy.interactive = true;
    forcePushBuy.buttonMode = true;
    forcePushBuy.on("pointerup", e => buyAbility("forcepush"));
    forcePushBuy.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    forcePushBuy.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(forcePushBuy);

    // Fireball Buy
    fireBallBuy = new PIXI.Text("Fireball $3500");
    fireBallBuy.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0xff3300,
        strokeThickness: 6
    });
    fireBallBuy.x = 350;
    fireBallBuy.y = 200;
    fireBallBuy.interactive = true;
    fireBallBuy.buttonMode = true;
    fireBallBuy.on("pointerup", e => buyAbility("fireball"));
    fireBallBuy.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    fireBallBuy.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(fireBallBuy);

    // Freeze Buy
    freezeBuy = new PIXI.Text("Freeze $2500");
    freezeBuy.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0x00ffff,
        strokeThickness: 6
    });
    freezeBuy.x = 350;
    freezeBuy.y = 230;
    freezeBuy.interactive = true;
    freezeBuy.buttonMode = true;
    freezeBuy.on("pointerup", e => buyAbility("freeze"));
    freezeBuy.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    freezeBuy.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(freezeBuy);

    // Acid Shot Buy
    acidShotBuy = new PIXI.Text("Acid Shot $3000");
    acidShotBuy.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'Futura',
        stroke: 0x00ff00,
        strokeThickness: 6
    });
    acidShotBuy.x = 350;
    acidShotBuy.y = 260;
    acidShotBuy.interactive = true;
    acidShotBuy.buttonMode = true;
    acidShotBuy.on("pointerup", e => buyAbility("acidshot"));
    acidShotBuy.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    acidShotBuy.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(acidShotBuy);
}

// Function for Upgrades
function upgradeAbility(ability)
{
    // Logic for upgrading certain abilities
    // All abilities max out at level 10
    switch(ability)
    {
        case "bioelectricblast":
            // Increases damage 
            if(score >= bioElectricBlastCost * bioElectricBlastLevel && bioElectricBlastLevel != 10)
            {
                score -= bioElectricBlastCost * bioElectricBlastLevel;
                bioElectricBlastLevel++;
                bioElectricBlastDamage += 15;
                bioElectricBlastUpgrade.text = `Bio-Electric Blast $${bioElectricBlastCost * bioElectricBlastLevel}`;
            }
            break;
        case "heatwave":
            // Increases Damage and burn timer
            if(unlockedSpells.includes("heatwave"))
            {
                if(score >= heatWaveCost * heatWaveLevel && heatWaveLevel != 10)
                {
                    score -= heatWaveCost * heatWaveLevel;
                    heatWaveLevel++;
                    heatWaveDamage += 5;
                    burnTime++;
                    heatWaveUpgrade.text = `Heat Wave $${heatWaveCost * heatWaveLevel}`;
                }
            }
            break;
        case "forcepush":
            // Increases Damage and Knockback Distance
            if(unlockedSpells.includes("forcepush"))
            {
                if(score >= forcePushCost * forcePushLevel && forcePushLevel != 10)
                {
                    score -= forcePushCost * forcePushLevel;
                    forcePushLevel++;
                    forcePushDamage += 10;
                    knockBack += 10;
                    forcePushUpgrade.text = `Force Push $${forcePushCost * forcePushLevel}`;
                }
            }
            break;
        case "fireball":
            // Increases Damage
            if(unlockedSpells.includes("fireball"))
            {
                if(score >= fireBallCost * fireBallLevel && fireBallLevel != 10)
                {
                    score -= fireBallCost * fireBallLevel;
                    fireBallLevel++;
                    fireBallDamage += 10;
                    fireBallUpgrade.text = `Fireball $${fireBallCost * fireBallLevel}`;
                }
            }
            break;
        case "freeze":
            // Increases Damage and Freeze Timer
            if(unlockedSpells.includes("freeze"))
            {
                if(score >= freezeCost * freezeLevel && freezeLevel != 10)
                {
                    score -= freezeCost * freezeLevel;
                    freezeLevel++;
                    freezeDamage += 10;
                    freezeTime++;
                    freezeUpgrade.text = `Freeze $${freezeCost * freezeLevel}`;
                }
            }
            break;
        case "acidshot":
            // Increases Damage and Acid Timer
            if(unlockedSpells.includes("acidshot"))
            {
                if(score >= acidShotCost * acidShotLevel && acidShotLevel != 10)
                {
                    score -= acidShotCost * acidShotLevel;
                    acidShotLevel++;
                    acidShotDamage += 10;
                    acidTime++;
                    acidShotUpgrade.text = `Acid Shot $${acidShotCost * acidShotLevel}`;
                }
            }
            break;
    }
    scoreLabel.text = `Score: ${score}`;
    cashLabel.text = `Available Cash: ${score}`;
    shopButtonSound.play();
}

// Function for Buying new Abilities
function buyAbility(ability)
{
    // Logic for buying certain abilities
    switch(ability)
    {
        case "heatwave":
            if(score >= 1000 && !unlockedSpells.includes("heatwave"))
            {
                score-= 1000;
                unlockedSpells.push("heatwave");
                heatWaveUpgrade.style.stroke = 0xFF6600;
            }
            break;
        case "forcepush":
            if(score >= 1500 && !unlockedSpells.includes("forcepush"))
            {
                score-= 1500;
                unlockedSpells.push("forcepush");
                forcePushUpgrade.style.stroke = 0x555555;
            }
            break;
        case "fireball":
            if(score >= 3500 && !unlockedSpells.includes("fireball"))
            {
                score-= 3500;
                unlockedSpells.push("fireball");
                fireBallUpgrade.style.stroke = 0xff3300;
            }
            break;
        case "freeze":
            if(score >= 2500 && !unlockedSpells.includes("freeze"))
            {
                score-= 2500;
                unlockedSpells.push("freeze");
                freezeUpgrade.style.stroke = 0x00ffff
            }
            break;
        case "acidshot":
            if(score >= 3000 && !unlockedSpells.includes("acidshot"))
            {
                score-= 3000;
                unlockedSpells.push("acidshot");
                acidShotUpgrade.style.stroke = 0x00ff00;
            }
            break;
    }
    scoreLabel.text = `Score: ${score}`;
    cashLabel.text = `Available Cash: ${score}`;
    shopButtonSound.play();
}

// Function for resuming the game
function resumeGame()
{
    startScene.visible = false;
    gameScene.visible = true;
    pauseMenu.visible = false;
    gameOverScene.visible = false;
    paused = false;
    screenButtonSound.play();
}

// Function for giving instructions before game
function giveInstructions()
{
    startScene.visible = false;
    instructionScene.visible = true;
    gameScene.visible = false;
    pauseMenu.visible = false;
    gameOverScene.visible = false;
    screenButtonSound.play();
}
// Function for increasing score
function increaseScoreBy(value)
{
    score += value;
    scoreLabel.text = `Score: ${score}`;
}

// Function for decreasing player life
function decreaseLifeBy(value)
{
    life -= value;
    life = parseInt(life);
    lifeLabel.text = `Life:   ${life}%`;
}

// Function for increasing waves
function increaseWaveBy(value)
{
    wave += value;
    waveLabel.text = `Wave: ${wave}`;
}

// Function used for cycling through abilities
function changeAbility()
{
    // If index goes out of bounds then go back to the first Ability
    if(unlockedSpells.indexOf(activeSpell) + 1 > unlockedSpells.length - 1)
    {
        activeSpell = unlockedSpells[0];
    }
    // Go to next Ability in your available Abilities
    else
    {
        let newIndex = unlockedSpells.indexOf(activeSpell) + 1;
        activeSpell = unlockedSpells[newIndex];
    }

    // Logic for proper Ability Labels
    switch(activeSpell)
    {
        case "bioelectricblast":
            abilityLabel.text = "Bio-Electric Blast";
            abilityLabel.style.stroke = 0x00aaaa;
            break;
        case "heatwave":
            abilityLabel.text = "Heat Wave";
            abilityLabel.style.stroke = 0xff6600;
            break;
        case "forcepush":
            abilityLabel.text = "Force Push";
            abilityLabel.style.stroke = 0x555555;
            break;
        case "fireball":
            abilityLabel.text = "Fireball";
            abilityLabel.style.stroke = 0xff3300;
            break;
        case "freeze":
            abilityLabel.text = "Freeze";
            abilityLabel.style.stroke = 0x00ffff;
            break;
        case "acidshot":
            abilityLabel.text = "Acid Shot";
            abilityLabel.style.stroke = 0x00ff00;
            break;
    }
}
