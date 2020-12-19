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
app.loader.onComplete.add(setup);
app.loader.load(doneLoading);

window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

// aliases
let stage;

// Game variables
let startScene;
let gameScene,human,scoreLabel,lifeLabel,waveLabel,abilityLabel,zombieCountLabel;
let gameOverScene,gameOverScoreLabel,gameOverWaveLabel;
let pauseMenu,bioElectricBlastUpgrade,heatWaveUpgrade,heatWaveBuy,forcePushUpgrade,forcePushBuy,fireBallUpgrade,fireBallBuy,freezeUpgrade,freezeBuy,acidShotUpgrade,acidShotBuy;
let instructionScene,instructions,controlsMovement,controlsButtons,controlsPause,controlsSpell;
let cashLabel;

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
let score = 0;

// Function that stores keydown inputs
function keysDown(e)
{
    keys[e.keyCode] = true;
}

// Function that stores keyup inputs
function keysUp(e)
{
    keys[e.keyCode] = false;
}

// Function ran when loading is done
function doneLoading(e)
{
    // Create all sprite sheets and player
    createPlayerSheet();
    createPlayer();

    // Start the game loop
    app.ticker.add(gameLoop);
}

// Function that creates the different animations for player
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

// Creates the player
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


// Reset required fields and begin the game
function startGame()
{
    startScene.visible = false;
    gameOverScene.visible = false;
    instructionScene.visible = false;
    gameScene.visible = true;
    pauseMenu.visible = false;
    paused = false;
    player.x = app.view.width / 2;
    player.y = app.view.height / 2;
    decreaseLifeBy(0);
    increaseScoreBy(0);

}

// Go back to start screen
function restartGame()
{
    startScene.visible = true;
    gameOverScene.visible = false;
    gameScene.visible = false;
    pauseMenu.visible = false;
}

// Update function
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
        }
        direction = "north";
        player.y -= speed;
    }

    // A
    if(keys["65"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkWest;
            player.play();
        }
        direction = "west";
        player.x -= speed;
    }

    // S
    if(keys["83"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkSouth;
            player.play();
        }
        direction = "south";
        player.y += speed;
    }

    // D
    if(keys["68"])
    {
        if(!player.playing)
        {
            player.textures = playerSheet.walkEast;
            player.play();
        }
        direction = "east";
        player.x += speed;
    }

    // Pause
    if(keys["81"])
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
}

// Initial game setup
function setup() {
	stage = app.stage;
	// Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);


    // Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);


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

    
	// Load Sounds

}

// Function for when the game ends
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

// Create GUI labels and buttons
function createLabelsAndButtons()
{
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 48,
        fontFamily: "Zombie",
        stroke: 0x00aa00,
        strokeThickness: 6
    });

    // 1 - set up 'startScene'
    // 1A - make the top start label
    let startLabel1 = new PIXI.Text("Mutation Genesis");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 60,
        fontFamily: 'Zombie',
        stroke: 0x00aa00,
        strokeThickness: 6
    });
    startLabel1.x = 30;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    // 1B - make the middle start label
    let startLabel2 = new PIXI.Text("Can you Survive\nthe Apocalypse?");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 40,
        fontFamily: 'Zombie',
        fontStyle: 'italic',
        stroke: 0x00aa00,
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

    // set up 'gameScene'
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

    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over");
    textStyle = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 64,
        fontFamily: "Futura",
        stroke: 0x00aa00,
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
    playAgainButton.on("pointerup",restartGame); 
    playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);

    // make game over score label
    gameOverScoreLabel = new PIXI.Text();
    gameOverScoreLabel.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 40,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 6
    });
    gameOverScoreLabel.x = 100;
    gameOverScoreLabel.y = sceneHeight/2 + 20;
    gameOverScene.addChild(gameOverScoreLabel);

    gameOverWaveLabel = new PIXI.Text();
    gameOverWaveLabel.style = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 40,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 6
    });
    gameOverWaveLabel.x = 100;
    gameOverWaveLabel.y = sceneHeight/2 + 60;
    gameOverScene.addChild(gameOverWaveLabel);

    // Set up the Instructions Scene
    let instructionsStyle = new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: "Futura",
        stroke: 0x00aa00,
        strokeThickness: 3
    });
    instructions = new PIXI.Text("Objective: The point of the game is to\n"
                               + "survive as long as possible in the zombie\n"
                               + "apocalypse. Buy and Upgrade Abilities to aid\n"
                               + "in facing endless waves of the undead");
    instructions.style = instructionsStyle;
    instructions.x = 100;
    instructions.y = 40;
    instructionScene.addChild(instructions);

    // *** Labels for Controls ***
    controlsMovement = new PIXI.Text("Movement Controls: WASD");
    controlsMovement.style = instructionsStyle;
    controlsMovement.x = 100;
    controlsMovement.y = 220;
    instructionScene.addChild(controlsMovement);

    controlsButtons= new PIXI.Text("Switch Ability: E (Or Use Button)");
    controlsButtons.style = instructionsStyle;
    controlsButtons.x = 100;
    controlsButtons.y = 280;
    instructionScene.addChild(controlsButtons);

    controlsPause = new PIXI.Text("Pause/Shop Menu: Q");
    controlsPause.style = instructionsStyle;
    controlsPause.x = 100;
    controlsPause.y = 340;
    instructionScene.addChild(controlsPause);

    controlsSpell= new PIXI.Text("Activate Ability: Space");
    controlsSpell.style = instructionsStyle;
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
    resumeButton.on("pointerup", resumeGame);
    resumeButton.on("pointerover", e=>e.target.aplha = 0.7); // consice arrow function with no brackets
    resumeButton.on("pointerout", e=>e.currentTarget.aplha = 1.0); // ditto
    pauseMenu.addChild(resumeButton);

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

// Function for giving instructions before game
function giveInstructions()
{
    startScene.visible = false;
    instructionScene.visible = true;
    gameScene.visible = false;
    pauseMenu.visible = false;
    gameOverScene.visible = false;
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
