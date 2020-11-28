// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application({
    width: 600,
    height: 600
});
document.body.appendChild(app.view);

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
let gameScene,human,scoreLabel,lifeLabel,waveLabel,abilityLabel,zombieCountLabel,shootSound,hitSound,fireballSound;
let gameOverScene,gameOverScoreLabel;
let pauseMenu;

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
let unlockedSpells = ["bioelectricblast", "heatwave", "forcepush", "fireball", "freeze", "acidshot"];
let activeSpell = "bioelectricblast";
let cooldownTimer = 0;
let zombieSpeed = 4;

let zombieCount = 1;
let healthFactor = 10;

// Initial Spell Damages
let bioElectricBlastDamage = 10;
let heatWaveDamage = 3;
let forcePushDamage = 10;
let fireBallDamage = 50;
let freezeDamage = 25;
let acidShotDamage = 20;

function keysDown(e)
{
    keys[e.keyCode] = true;
    console.log(e.keyCode);
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
            break;
    }
    spell.speed = 400;
    spell.isAlive = true;
    spells.push(spell);
    gameScene.addChild(spell);
    spell.play();
}

function startGame()
{
    startScene.visible = false;
    gameOverScene.visible = false;
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
}

function restartGame()
{
    startScene.visible = true;
    gameOverScene.visible = false;
    gameScene.visible = false;
    pauseMenu.visible = false;
}

function gameLoop()
{
    if (paused) return;

    // Make cooldown time go down
    if(cooldownTimer > 0)
    {
        cooldownTimer -= (1/app.ticker.FPS);
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
        if(player.x > z.x && (player.y + 5 > z.y && player.y - 5 < z.y))
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standEast;
                z.play();
                z.x += zombieSpeed;
            }
        }

        // Move and Face West
        if(player.x < z.x && (player.y + 5 > z.y && player.y - 5 < z.y))
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
            if(rectsIntersect(z, s))
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
                        z.burnTimer = 2;
                        break;
                    // Medium Damage with Knockback
                    case "forcepush":
                        z.health -= forcePushDamage;
                        if(direction == "north")
                        {
                            z.y -= 50;
                        }
                        if(direction == "south")
                        {
                            z.y += 50;
                        }
                        if(direction == "east")
                        {
                            z.x += 50;
                        }
                        if(direction == "west")
                        {
                            z.x -= 50;
                        }
                        break;
                    // High Damage with Short Burn Effect
                    case "fireball":
                        z.health -= fireBallDamage;
                        z.onFire = true;
                        z.burnTimer = 2;
                        break;
                    // Medium Damage with Freeze Effect
                    case "freeze":
                        z.health -= freezeDamage;
                        z.onIce = true;
                        z.freezeTimer = 2;
                        break;
                    // Medium Damage with Long Burn Effect
                    case "acidshot":
                        z.health -= acidShotDamage;
                        z.onFire = true;
                        z.burnTimer = 5;
                        break;
                }
                
                // Kill zombie and add points
                if(z.health <= 0)
                {
                    gameScene.removeChild(z);
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

        // #5B - circles and ship
        if(z.isAlive && rectsIntersect(z, player))
        {
            decreaseLifeBy(1);
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
            }
            else
            {
                z.onFire = false;
            }
        }
        // If the zombie is frozen then slow their movement temporarily
        if(z.onIce)
        {
            if(z.freezeTimer > 0)
            {
                z.freezeTimer -= (1/app.ticker.FPS);
                zombieSpeed = 1;
            }
            else
            {
                z.onIce = false;
                zombieSpeed = 4;
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
	// #1 - Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);

    // Add background image to start screen
    let backgroundTexture = PIXI.BaseTexture.from("media/mutationGenesisStart.png");
    let backgroundTexture2 = new PIXI.Texture(backgroundTexture, new PIXI.Rectangle(100, 0, 600, 600));
    let background = new PIXI.Sprite(backgroundTexture2);
    startScene.addChild(background);

    // #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // Add background image to game screen
    let floorTexture = PIXI.BaseTexture.from("media/stoneBrickFloor.png");
    let floorTexture2 = new PIXI.Texture(floorTexture, new PIXI.Rectangle(0, 0, 600, 600));
    let gameBackground = new PIXI.Sprite(floorTexture2);
    gameScene.addChild(gameBackground);

    // #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    // Create Pause Menu
    pauseMenu = new PIXI.Container();
    pauseMenu.visible = false;
    stage.addChild(pauseMenu);
	
    // #4 - Create labels for all scenes
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
    /*
	// #6 - Load Sounds
    shootSound = new Howl({
        src: ['sounds/shoot.wav']
    });

    hitSound = new Howl({
        src: ['sounds/hit.mp3']
    });

    fireballSound = new Howl({
        src: ['sounds/fireball.mp3']
    });
	*/
	// #7 - Load sprite sheet
    	
    // #8 - Start update loop
	
	// #9 - Start listening for click events on the canvas
    
	// Now our `startScene` is visible
	// Clicking the button calls startGame()
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
}

function createLabelsAndButtons()
{
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xaaFFaa,
        fontSize: 48,
        fontFamily: "Futura",
        stroke: 0x00FF00,
        strokeThickness: 6
    });

    // 1 - set up 'startScene'
    // 1A - make the top start label
    let startLabel1 = new PIXI.Text("Mutation Genesis");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xaaFFaa,
        fontSize: 72,
        fontFamily: 'Futura',
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
        fontFamily: 'Futura',
        fontStyle: 'italic',
        stroke: 0x00FF00,
        strokeThickness: 6
    });
    startLabel2.x = 165;
    startLabel2.y = 300;
    startScene.addChild(startLabel2);

    // 1C - make the start game button
    let startButton = new PIXI.Text("Begin the Carnage");
    startButton.style = buttonStyle;
    startButton.x = 100;
    startButton.y = sceneHeight - 120;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame); // startGame is a function reference
    startButton.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    startButton.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    startScene.addChild(startButton);

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
    let gameOverText = new PIXI.Text("Game Over!\n        :-O");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: "Futura",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 100;
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

    // 3C - make game over score label
    gameOverScoreLabel = new PIXI.Text();
    gameOverScoreLabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 40,
        fontFamily: "Futura",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    gameOverScoreLabel.x = 120;
    gameOverScoreLabel.y = sceneHeight/2 + 40;
    gameOverScene.addChild(gameOverScoreLabel);

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
}

// Function for resuming the game
function resumeGame()
{
    startScene.visible = false;
    gameScene.visible = true;
    pauseMenu.visible = false;
    gameOverScene.visible = false;
    paused = false;
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
