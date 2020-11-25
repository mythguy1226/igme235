class Spell extends PIXI.Sprite
{
    constructor(x=0, y=0)
    {
        super();
        this.x = x;
        this.y = y;
        // variables
        if(direction == "north")
        {
            this.fwd = {x:0, y:-1};
        }
        if(direction == "east")
        {
            this.fwd = {x: 1, y: 0};
        }
        if(direction == "south")
        {
            this.fwd = {x: 0, y: 1};
        }
        if(direction == "west")
        {
            this.fwd = {x: -1, y: 0};
        }
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this);
    }

    move(dt=1/60)
    {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}