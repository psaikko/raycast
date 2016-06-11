// http://lodev.org/cgtutor/raycasting.html
var raycast = raycast || {};

raycast.engine = (function () {
  var canvas = document.getElementById("viewport");
  var g = canvas.getContext("2d");
  var filtering = false;
  var mapWidth = 24,
      mapHeight = 24,
      texHeight = 64,
      texWidth = 64;
  
  var texture;
  function initTexture() {
    texture = raycast.texture.getTextures();
    console.log(texture);
    texture.push([]);
    for(var x = 0; x < texWidth; x++) {
      for(var y = 0; y < texHeight; y++) {
        var xorcolor = (x * 256 / texWidth) ^ (y * 256 / texHeight);
        var d = Math.sqrt((texWidth/2 - x)*(texWidth/2 - x) + (texHeight/2 - y)*(texHeight/2 - y));
        var sincolor = 256 * (1 + Math.sin(d/2)) / 2;
        texture[3][texWidth * y + x] = [xorcolor, 0, sincolor]; // blue sine pattern
      }
    }
  }
  /*
  texture[0] = raycast.texture.load("ground");
  texture[1] = raycast.texture.load("brick");
  texture[2] = raycast.texture.load("sky");
  */
  
  var worldMap = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
  ];

  var posX = 2, posY = 2,
      dirX = -1, dirY = 0,
      planeX = 0, planeY = 0.66,
      time = Date.now(), oldTime = Date.now();

  var moveSpeed, rotSpeed;
      
  var w = canvas.width,
      h = canvas.height;
      
  function verLine(arr, x, yStart, yEnd, color){
    //console.log(x, yStart, yEnd);
    for (var y = yStart | 0; y < yEnd | 0; y++) {
      var i = 4 * (w * y) + 4 * x;
      arr[i + 0] = color[0];
      arr[i + 1] = color[1];
      arr[i + 2] = color[2];
      arr[i + 3] = 255;
    }
  };
   
  imagedata = g.getImageData(0,0,w,h);
  var buffer = imagedata.data;
   
  var keys = raycast.keyhandler;
  
  function input() {
    if (keys.isKeydown("up")) {
      if(worldMap[(posX + dirX * moveSpeed) | 0][posY | 0] == 0) posX += dirX * moveSpeed;
      if(worldMap[posX | 0][(posY + dirY * moveSpeed) | 0] == 0) posY += dirY * moveSpeed;
    }
    //move backwards if no wall behind you
    if (keys.isKeydown("down")) {
      if(worldMap[(posX - dirX * moveSpeed) | 0][posY | 0] == 0) posX -= dirX * moveSpeed;
      if(worldMap[posX | 0][(posY - dirY * moveSpeed) | 0] == 0) posY -= dirY * moveSpeed;
    } 
    if (keys.isKeydown("right")) {
      //both camera direction and camera plane must be rotated
      var oldDirX = dirX;
      dirX = dirX * Math.cos(-rotSpeed) - dirY * Math.sin(-rotSpeed);
      dirY = oldDirX * Math.sin(-rotSpeed) + dirY * Math.cos(-rotSpeed);
      var oldPlaneX = planeX;
      planeX = planeX * Math.cos(-rotSpeed) - planeY * Math.sin(-rotSpeed);
      planeY = oldPlaneX * Math.sin(-rotSpeed) + planeY * Math.cos(-rotSpeed);
    }
    if (keys.isKeydown("left")) {
      //both camera direction and camera plane must be rotated
      var oldDirX = dirX;
      dirX = dirX * Math.cos(rotSpeed) - dirY * Math.sin(rotSpeed);
      dirY = oldDirX * Math.sin(rotSpeed) + dirY * Math.cos(rotSpeed);
      var oldPlaneX = planeX;
      planeX = planeX * Math.cos(rotSpeed) - planeY * Math.sin(rotSpeed);
      planeY = oldPlaneX * Math.sin(rotSpeed) + planeY * Math.cos(rotSpeed);
    }
    if (keys.isKeypress("d"))
      filtering = !filtering;
  }

  function draw() {    
    for(var x = 0; x < w; x++) {
      var cameraX = 2 * x / w - 1,
          rayPosX = posX,
          rayPosY = posY,
          rayDirX = dirX + planeX * cameraX,
          rayDirY = dirY + planeY * cameraX;
          
      var mapX = rayPosX | 0,
          mapY = rayPosY | 0;
                  
      var deltaDistX = Math.sqrt(1 + (rayDirY * rayDirY) / (rayDirX * rayDirX)),
          deltaDistY = Math.sqrt(1 + (rayDirX * rayDirX) / (rayDirY * rayDirY));
      
      var stepX, 
          stepY, 
          sideDistX, 
          sideDistY;
      
      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (rayPosX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - rayPosX) * deltaDistX;
      } 
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (rayPosY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - rayPosY) * deltaDistY;
      }
      
      var side, hit = 0;
      
      // DDA
      while (hit == 0) {
        side = sideDistX > sideDistY;
        if (side == 0) {
          sideDistX += deltaDistX;
          mapX += stepX;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
        }
        if (worldMap[mapX][mapY] > 0) {
          hit = 1;
        }
      }
      
      var perpWallDist;
      if (side == 0)
        perpWallDist = Math.abs((mapX - rayPosX + (1 - stepX) / 2) / rayDirX);
      else
        perpWallDist = Math.abs((mapY - rayPosY + (1 - stepY) / 2) / rayDirY);
        
      //Calculate height of line to draw on screen
      var lineHeight = Math.abs((h / perpWallDist) | 0);
       
      //calculate lowest and highest pixel to fill in current stripe
      var drawStart = ((h - lineHeight) / 2) | 0;
      if(drawStart < 0) 
        drawStart = 0;
      var drawEnd = ((h + lineHeight) / 2) | 0;
      if(drawEnd >= h) 
        drawEnd = h - 1;
         
      var wallX; // the exact value where the wall was hit
      if (side == 1) 
        wallX = rayPosX + ((mapY - rayPosY + (1 - stepY) / 2) / rayDirY) * rayDirX;
      else
        wallX = rayPosY + ((mapX - rayPosX + (1 - stepX) / 2) / rayDirX) * rayDirY;
      wallX -= wallX | 0;

      var texX = (wallX * texWidth)/* | 0*/;
      if(side == 0 && rayDirX > 0) 
        texX = texWidth - texX - 1;
      if(side == 1 && rayDirY < 0) 
        texX = texWidth - texX - 1;
    
      var shade = (side == 1 ? 0.6: 1);
      
      var wallTex = texture[worldMap[mapX][mapY] - 1];
      
      for (var y = drawStart; y < drawEnd; y++) {
        var d = (y * 256 - h * 128 + lineHeight * 128) | 0;
        var texY = ((d * texHeight) / (lineHeight * 256))/* | 0*/;
        if (texY < 0) texY = 0;
        
        var color;
        if (filtering) {
          var ty1 = texY | 0;
          var ty2 = (ty1 + 1) % texHeight;
          var tx1 = texX | 0;
          var tx2 = (tx1 + 1) % texWidth;
          var xf = texX - (texX | 0);
          var yf = texY - (texY | 0);
          
          color = [0,0,0];
          var c1 = wallTex[texWidth * ty1 + tx1];
          var c2 = wallTex[texWidth * ty1 + tx2];
          var c3 = wallTex[texWidth * ty2 + tx1];
          var c4 = wallTex[texWidth * ty2 + tx2];
          
          color[0] = (c1[0]*(1-xf)*(1-yf) + c2[0]*xf*(1-yf) + c3[0]*(1-xf)*yf + c4[0]*xf*yf) | 0;
          color[1] = (c1[1]*(1-xf)*(1-yf) + c2[1]*xf*(1-yf) + c3[1]*(1-xf)*yf + c4[1]*xf*yf) | 0;
          color[2] = (c1[2]*(1-xf)*(1-yf) + c2[2]*xf*(1-yf) + c3[2]*(1-xf)*yf + c4[2]*xf*yf) | 0;
        } else {
          texX |= 0;
          texY |= 0;
          color = wallTex[texHeight * texY + texX];
        }
        var i = 4 * (w * y) + 4 * x;
        
        buffer[i + 0] = color[0] * shade;
        buffer[i + 1] = color[1] * shade;
        buffer[i + 2] = color[2] * shade;
        buffer[i + 3] = 255;
      }
      
      var floorXWall, floorYWall; //x, y position of the floor texel at the bottom of the wall
      //4 different wall directions possible
      if (side == 0 && rayDirX > 0) {
        floorXWall = mapX;
        floorYWall = mapY + wallX;
      } else if (side == 0 && rayDirX < 0) {
        floorXWall = mapX + 1.0;
        floorYWall = mapY + wallX;
      } else if (side == 1 && rayDirY > 0) {
        floorXWall = mapX + wallX;
        floorYWall = mapY;
      } else /*  side == 1 && rayDirY > 0*/{
        floorXWall = mapX + wallX;
        floorYWall = mapY + 1.0;
      } 
      
      var currentDist;  
      var distWall = perpWallDist;
      var distPlayer = 0.0;

      if (drawEnd < 0) drawEnd = h; //becomes < 0 when the integer overflows
      
      var ceilTex = texture[2];
      var floorTex = texture[1];
      
      //draw the floor from drawEnd to the bottom of the screen
      for(var y = drawEnd; y < h; y++)
      {
        currentDist = h / (2.0 * y - h); //you could make a small lookup table for this instead

        var weight = (currentDist - distPlayer) / (distWall - distPlayer);
        var nextWeight = (h / (2.0 * (y+1) - h)) / distWall;
        
        var currentFloorX = weight * floorXWall + (1.0 - weight) * posX;
        var currentFloorY = weight * floorYWall + (1.0 - weight) * posY;
        
        var floorTexX = (currentFloorX * texWidth) % texWidth;
        var floorTexY = (currentFloorY * texHeight) % texHeight;        
        
        if (floorTexX < 0) floorTexX = 0;
        if (floorTexY < 0) floorTexY = 0;
        
        var color;
        if (filtering) {
          ty1 = floorTexY | 0;
          ty2 = (ty1 + 1) % texHeight;
          tx1 = floorTexX | 0;
          tx2 = (tx1 + 1) % texWidth;
          xf = floorTexX - (floorTexX | 0);
          yf = floorTexY - (floorTexY | 0);
          
          color = [0,0,0];
          c1 = floorTex[texWidth * ty1 + tx1];
          c2 = floorTex[texWidth * ty1 + tx2];
          c3 = floorTex[texWidth * ty2 + tx1];
          c4 = floorTex[texWidth * ty2 + tx2];
          
          color[0] = (c1[0]*(1-xf)*(1-yf) + c2[0]*xf*(1-yf) + c3[0]*(1-xf)*yf + c4[0]*xf*yf) | 0;
          color[1] = (c1[1]*(1-xf)*(1-yf) + c2[1]*xf*(1-yf) + c3[1]*(1-xf)*yf + c4[1]*xf*yf) | 0;
          color[2] = (c1[2]*(1-xf)*(1-yf) + c2[2]*xf*(1-yf) + c3[2]*(1-xf)*yf + c4[2]*xf*yf) | 0;
        } else {
          color = floorTex[texWidth * (floorTexY|0) + (floorTexX|0)];
        }
             
        //floor
        i = 4 * (w * y) + 4 * x;
    
        buffer[i+0] = (color[0])/2;
        buffer[i+1] = (color[1])/2;
        buffer[i+2] = (color[2])/2;
        buffer[i+3] = 255;
        
        if (filtering) {
          color = [0,0,0];
          c1 = ceilTex[texWidth * ty1 + tx1];
          c2 = ceilTex[texWidth * ty1 + tx2];
          c3 = ceilTex[texWidth * ty2 + tx1];
          c4 = ceilTex[texWidth * ty2 + tx2];
          
          color[0] = (c1[0]*(1-xf)*(1-yf) + c2[0]*xf*(1-yf) + c3[0]*(1-xf)*yf + c4[0]*xf*yf) | 0;
          color[1] = (c1[1]*(1-xf)*(1-yf) + c2[1]*xf*(1-yf) + c3[1]*(1-xf)*yf + c4[1]*xf*yf) | 0;
          color[2] = (c1[2]*(1-xf)*(1-yf) + c2[2]*xf*(1-yf) + c3[2]*(1-xf)*yf + c4[2]*xf*yf) | 0;
        } else {
          color = ceilTex[texWidth * (floorTexY|0) + (floorTexX|0)];
        }
        
        //ceiling (symmetrical!)
        i = 4 * (w * (h - y - 1)) + 4 * x;
        
        buffer[i+0] = color[0]/2;
        buffer[i+1] = color[1]/2;
        buffer[i+2] = color[2]/2;
        buffer[i+3] = 255;
      }
    }
    
    oldTime = time;
    time = Date.now()
    var frameTime = (time - oldTime) / 1000.0; //frameTime is the time this frame has taken, in seconds

    //speed modifiers
    moveSpeed = frameTime * 5.0; //the constant value is in squares/second
    rotSpeed = frameTime * 3.0; //the constant value is in radians/second
    
    g.putImageData(imagedata, 0, 0);
    g.font = "bold 30pt Monospace";
    g.fillText(""+((1000 / (time - oldTime))|0), 0, 30);
  };

  function tick() {
    draw();
    input();
    keys.tick();

    window.requestAnimFrame(tick);
    //window.setTimeout(tick, 1);
  };

  function start() {
    initTexture();
    tick();
  }
  
  return {start: start}
}());