	// http://paulbourke.net/miscellaneous/interpolation/
	
	// we use this to interpolate the ship towards the mouse position
	function lerp(start, end, amt){
        return start * (1-amt) + amt * end;
  }
  
  // we didn't use this one
  function cosineInterpolate(y1, y2, amt){
        let amt2 = (1 - Math.cos(amt * Math.PI)) / 2;
        return (y1 * (1 - amt2)) + (y2 * amt2);
  }
  
  // we use this to keep the ship on the screen
  function clamp(val, min, max){
      return val < min ? min : (val > max ? max : val);
  }
  
  // bounding box collision detection - it compares PIXI.Rectangles
  function rectsIntersect(a,b){
      var ab = a.getBounds();
      var bb = b.getBounds();
      return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
  }

  // bounding circle collision
  function circlesIntersect(a,b)
  {
      let objectA = a.getBounds();
      let objectB = b.getBounds();
      let radiusa = objectA.width/3; // Radius seems to be a bit large for accurate collisions
      let radiusb = objectB.width/3; // to fix this I will just decrease radius
      let distance = Math.sqrt(Math.pow(objectB.x-objectA.x,2) + Math.pow(objectB.y-objectA.y,2));
      if(distance < radiusa + radiusb)
      {
        return true;
      }
      return false;
  }
  
  // these 2 helpers are used by classes.js
  function getRandomUnitVector(){
      let x = getRandom(-1,1);
      let y = getRandom(-1,1);
      let length = Math.sqrt(x*x + y*y);
      if(length == 0){ // very unlikely
          x=1; // point right
          y=0;
          length = 1;
      } else{
          x /= length;
          y /= length;
      }
  
      return {x:x, y:y};
  }

  function getRandom(min, max) {
      return Math.random() * (max - min) + min;
  }