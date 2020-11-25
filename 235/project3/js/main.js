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
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load(doneLoading);

window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

// aliases
let stage;

// game variables
let startScene;
let gameScene,human,scoreLabel,lifeLabel,shootSound,hitSound,fireballSound;
let gameOverScene,gameOverScoreLabel;

let paused = true;
let playerSheet = {};
let zombieSheet = {};
let spellSheet = {};
let zombies = [];
let keys = {};
let player;
let speed = 2;
let spells = [];
let direction = "east";
let life = 100;
let wave = 1;
let score = 0;
let activeSpell = "heatwave";

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
    createZombie();
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
    spellSheet["forcePushEast"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w, h * 2, w, h))
    ];
    spellSheet["forcePushSouth"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(w * 2, h * 2, w, h))
    ];
    spellSheet["forcePushWest"] = [
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

function createZombie()
{
    let zombie = new PIXI.AnimatedSprite(zombieSheet.standNorth);
    zombie.anchor.set(0.5);
    zombie.animationSpeed = 0.1;
    zombie.loop = false;
    zombie.x = 100;
    zombie.y = 100;
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
    paused = false;
    life = 100;
    wave = 1;
    score = 0;
}

function restartGame()
{
    startScene.visible = true;
    gameOverScene.visible = false;
    gameScene.visible = false;
}

function gameLoop()
{
    if (paused) return;
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
        console.log("Shooting: " + direction);
        
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
                z.y -= 1;
            }
        }

        // Move and Face South
        if(player.y > z.y)
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standSouth;
                z.play();
                z.y += 1;
            }
        }

        // Move and Face East
        if(player.x > z.x)
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standEast;
                z.play();
                z.x += 1;
            }
        }

        // Move and Face West
        if(player.x < z.x)
        {
            if(!z.playing)
            {
                z.textures = zombieSheet.standWest;
                z.play();
                z.x -= 1;
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
                z.health -= 1;
                if(z.health <= 0)
                {
                    gameScene.removeChild(z);
                    z.isAlive = false;
                }
                gameScene.removeChild(s);
                s.isAlive = false;
                increaseScoreBy(1);
            }

            if(s.y < -10) s.isAlive = false;
        }

        // #5B - circles and ship
        if(z.isAlive && rectsIntersect(z, player))
        {
            decreaseLifeBy(1);
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
}

function activateSpell(x, y)
{
    if(paused) return;
    let s = createSpell(x, y);
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

    // #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);
	
    // #4 - Create labels for all 3 scenes
    createLabelsAndButtons();

    // #5 - Create human
    //human = new Human();
    //gameScene.addChild(human);
    
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
        stroke: 0xFF0000,
        strokeThickness: 4
    });

    // 2A - make score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // 2B - make life label
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);
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
}

function increaseScoreBy(value)
{
    score += value;
    scoreLabel.text = `Score ${score}`;
}

function decreaseLifeBy(value)
{
    life -= value;
    life = parseInt(life);
    lifeLabel.text = `Life   ${life}%`;
}
