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
app.loader.add("human", "media/playerSpriteSheet.png")
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
let keys = {};
let player;
let speed = 2;
let direction = "east";
let life = 100;
let wave = 1;
let score = 0;

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

function startGame()
{
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
}

function gameLoop()
{
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
    playAgainButton.on("pointerup",startGame); // startGame is a function reference
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
