class Ship extends PIXI.Sprite 
{
    constructor(x = 0, y = 0)
    {
        super(app.loader.resources["images/Spaceship.png"].texture);
        this.anchor.set(.5, .5); // position, scaling, rotating etc are now from the center of sprite
        this.scale.set(0.1);
        this.x = x;
        this.y = y;
    }
}