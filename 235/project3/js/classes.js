class Barrier extends PIXI.Sprite 
{
    constructor(x = 0, y = 0)
    {
        // Take the texture from resources
        super(app.loader.resources["barrier"].texture);

        // Fields
        this.x = x;
        this.y = y;
    }
}