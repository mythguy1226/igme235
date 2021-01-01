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
app.loader.add("tiles", "media/platform.png");
app.loader.add("wave", "media/radioactiveWave.png");
app.loader.add("door", "media/finishDoor.png");
app.loader.add("background", "media/backgroundLab.png");
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
let tileSheet = {};
let zombies = [];
let waveSheet = {};
let wave;
let backgroundSheet = {};
let backgrounds = [];
let doorSheet = {};
let door;
let keys = {};
let barriers = [];
let player;
let canJump = false;
let falling = true;
let jumping = false;
let jumpSpeed = 13;
let fallSpeed = 1;
let gravity = 0.5;
let tiles = [];
let speed = 3;
let spells = [];
let direction = "east";
let life = 100;
let score = 0;
let totalDistance = 0;

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
    // Create all sprite sheets
    createPlayerSheet();
    createBackgroundSheet()
    createTileSheet();
    createWaveSheet();
    createDoorSheet();

    // Place the background
    for(let i = 0; i < 8; i++)
    {
        createBackground(i * 600, 0);
    }

    // Place door and player
    createDoor(50 * 80, app.view.height - 160);
    createPlayer();
    
    // Place the tiles
    for(let i = 0; i < 55; i++)
    {
        createTile(i * 80, app.view.height - 80);
    }

    // Obstacle 1
    createTile(6 * 80, app.view.height - 160);
    createTile(8 * 80, app.view.height - 160);
    createTile(8 * 80, app.view.height - 240);
    createTile(10 * 80, app.view.height - 160);
    createTile(10 * 80, app.view.height - 240);

    // Obstacle 2
    createTile(17 * 80, app.view.height - 160);
    createTile(19 * 80, app.view.height - 160);
    createTile(19 * 80, app.view.height - 240);
    createTile(21 * 80, app.view.height - 160);
    createTile(21 * 80, app.view.height - 240);
    createTile(21 * 80, app.view.height - 320);
    createTile(23 * 80, app.view.height - 160);
    createTile(23 * 80, app.view.height - 240);
    createTile(25 * 80, app.view.height - 160);

    // Obstacle 3
    createTile(30 * 80, app.view.height - 160);
    createTile(32 * 80, app.view.height - 160);
    createTile(32 * 80, app.view.height - 240);
    createTile(34 * 80, app.view.height - 160);
    createTile(34 * 80, app.view.height - 240);
    createTile(34 * 80, app.view.height - 320);
    createTile(36 * 80, app.view.height - 160);
    createTile(36 * 80, app.view.height - 240);
    createTile(38 * 80, app.view.height - 160);
    createTile(40 * 80, app.view.height - 160);
    createTile(40 * 80, app.view.height - 240);

    // Place the wave
    createWave();

    // Start the game loop
    app.ticker.add(gameLoop);
    
}

// Function that creates the different animations for player
function createPlayerSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["human"].url);
    let w = 80;
    let h = 80;
    
    playerSheet["stand"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];

    playerSheet["walk"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(1 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(2 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(3 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(4 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(5 * w, h, w, h)),
        new PIXI.Texture(sheet, new PIXI.Rectangle(6 * w, h, w, h))
    ];
    playerSheet["jump"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(1 * w, h, w, h)),
    ];
}

// Function that creates the different tiles
function createTileSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["tiles"].url);
    let w = 80;
    let h = 80;
    
    tileSheet["platform"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
}

// Function that creates the wave sheet
function createWaveSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["wave"].url);
    let w = 160;
    let h = 600;
    
    waveSheet["wave"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
}

// Function that creates the nackground sheet
function createBackgroundSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["background"].url);
    let w = 600;
    let h = 600;
    
    backgroundSheet["background"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
}

// Function that creates the door sheet
function createDoorSheet()
{
    let sheet = new PIXI.BaseTexture.from(app.loader.resources["door"].url);
    let w = 80;
    let h = 80;
    
    doorSheet["door"] = [
        new PIXI.Texture(sheet, new PIXI.Rectangle(0, 0, w, h))
    ];
}

// Creates the player
function createPlayer()
{
    player = new PIXI.AnimatedSprite(playerSheet.stand);
    player.anchor.set(0.5);
    player.animationSpeed = 0.1;
    player.loop = false;
    player.x = app.view.width / 2;
    player.y = app.view.height / 2;
    gameScene.addChild(player);
    player.play();
}
// Creates a tile
function createTile(x, y)
{
    let tile = new PIXI.AnimatedSprite(tileSheet.platform);
    tile.anchor.set(0);
    tile.animationSpeed = 0.1;
    tile.loop = false;
    tile.x = x;
    tile.y = y;
    gameScene.addChild(tile);
    tile.play();
    tiles.push(tile);
}
// Creates the wave
function createWave()
{
    wave = new PIXI.AnimatedSprite(waveSheet.wave);
    wave.anchor.set(0);
    wave.animationSpeed = 0.1;
    wave.loop = false;
    wave.x = 0;
    wave.y = 0;
    gameScene.addChild(wave);
    wave.play();
}

// Creates the door finish
function createDoor(x, y)
{
    door = new PIXI.AnimatedSprite(doorSheet.door);
    door.anchor.set(0);
    door.animationSpeed = 0.1;
    door.loop = false;
    door.x = x;
    door.y = y;
    gameScene.addChild(door);
    door.play();
}

// Creates the background
function createBackground(x, y)
{
    let background = new PIXI.AnimatedSprite(backgroundSheet.background);
    background.anchor.set(0);
    background.animationSpeed = 0.1;
    background.loop = false;
    background.x = x;
    background.y = y;
    gameScene.addChild(background);
    background.play();
    backgrounds.push(background);
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
    life = 100;
    for(let i = 0; i < tiles.length; i++)
    {
        tiles[i].x += totalDistance;
    }
    for(let i = 0; i < backgrounds.length; i++)
    {
        backgrounds[i].x += totalDistance;
    }
    door.x += totalDistance;
    totalDistance = 0;
    canJump = false;
    falling = true;
    jumping = false;
    jumpSpeed = 13;
    fallSpeed = 1;
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

    // A
    if(keys["65"])
    {
        if(!player.playing && canJump)
        {
            player.textures = playerSheet.walk;
            player.play();
        }
        direction = "west";
        if(player.scale.x > 0)
        {
            player.scale.x *= -1;
        }
        player.x -= speed;
    }


    // D
    if(keys["68"])
    {
        if(!player.playing && canJump)
        {
            player.textures = playerSheet.walk;
            player.play();
        }
        if(player.scale.x < 0)
        {
            player.scale.x *= -1;
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
    // West
    if(!keys["65"] && direction == "west")
    {
        if(!player.playing && canJump)
        {
            player.textures = playerSheet.stand;
            player.play();
        }
    }


    // East
    if(!keys["68"] && direction == "east")
    {
        if(!player.playing && canJump)
        {
            player.textures = playerSheet.stand;
            player.play();
        }
    }

    // Jump
    if(keys["32"] && canJump)
    {
        jumping = true;
        canJump = false;
        player.textures = playerSheet.jump;
        player.play();
    }
    // *** User Gravity and Jumping ***
    if(!jumping && !canJump)
    {   
        falling = true;
        fallSpeed += gravity;
        player.y += fallSpeed;
    }
    if(jumping)
    {
        canJump = false;
        jumpSpeed -= gravity;
        player.y -= jumpSpeed;
    }
    if(jumpSpeed <= 0)
    {
        jumping = false;
        jumpSpeed = 13;
    }

    // *** Collisions ***
    for(let i = 0; i < tiles.length; i++)
    {
        if(tiles[i] != null)
        {
            if(rectsIntersect(tiles[i], player))
            {
                // Top of Tile
                if(player.x + 40 > tiles[i].x
                    && player.x < tiles[i].x + 80
                    && player.y + 40 > tiles[i].y - 10
                    && player.y < tiles[i].y)
                {
                    canJump = true;
                    falling = false;
                    fallSpeed = 1;
                }
                else
                {
                    canJump = false;
                }

                // Right of Tile
                if(player.x + 40 > tiles[i].x
                    && player.x < tiles[i].x + 80
                    && player.y > tiles[i].y
                    && player.y < tiles[i].y + 80)
                {   
                    player.x = tiles[i].x - 30;
                    if(!canJump)
                    {
                        canJump = true;
                    }
                }
                
                // Left of Tile
                if(player.x > tiles[i].x
                    && player.x + 40 > tiles[i].x + 80
                    && player.y > tiles[i].y
                    && player.y < tiles[i].y + 80)
                {
                    player.x = tiles[i].x + 110;
                    if(!canJump)
                    {
                        canJump = true;
                    }
                }
                
            }
        }
    }
    // *** Wave hits player ***
    if(rectsIntersect(wave, player))
    {
        decreaseLifeBy(1);
    }

    // *** Player Reaches end ***
    if(rectsIntersect(door, player))
    {
        end();
    }

    // Tile Movement
    for(let i = 0; i < tiles.length; i++)
    {
        if(tiles[i] != null)
        {
            tiles[i].x -= 2;
        }
    }
    for(let i = 0; i < backgrounds.length; i++)
    {
        if(backgrounds[i] != null)
        {
            backgrounds[i].x -= 2;
        }
    }

    if(life <= 0)
    {
        end();
    }
    door.x -= 2;
    totalDistance += 2;
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
    /*
    zombies.forEach(z=>gameScene.removeChild(z)); // concise arrow function with no brackets and no return
    zombies = [];

    spells.forEach(s=>gameScene.removeChild(s)); // ditto
    spells = [];
    */
    gameOverScene.visible = true;
    gameScene.visible = false;

    gameOverScoreLabel.text = `Your final score: ${score}`;
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
    let startLabel1 = new PIXI.Text("Radioactive Run");
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
    let startLabel2 = new PIXI.Text("Can you outrun\nthe Wave?");
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
    let instructionButton = new PIXI.Text("Begin the Run");
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
    scoreLabel.x = 500;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // Make life label
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 500;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);


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
                               + "get to the end of the level while\n"
                               + "avoiding obstacles. You will face constant action\n"
                               + "as you try to escape the wave of radiation.");
    instructions.style = instructionsStyle;
    instructions.x = 100;
    instructions.y = 40;
    instructionScene.addChild(instructions);

    // *** Labels for Controls ***
    controlsMovement = new PIXI.Text("Movement Controls: A and D\n"
                                    +"Jump Controls: Space");
    controlsMovement.style = instructionsStyle;
    controlsMovement.x = 100;
    controlsMovement.y = 220;
    instructionScene.addChild(controlsMovement);

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
