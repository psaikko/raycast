var raycast = raycast || {};

raycast.texture = (function () {
  function load(id) {
    var canvas = document.createElement('canvas');
    var image = document.getElementById(id);   
    canvas.width = image.width;
    canvas.height = image.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    var imagedata = ctx.getImageData(0, 0, image.width, image.height);
    var rgbArray = new Array(image.width * image.height);
    for( var i = 0; i < image.width * image.height; i++) {
      rgbArray[i] = [imagedata.data[4*i], imagedata.data[4*i+1], imagedata.data[4*i+2]];
    }
    image.width = 0;
    image.height = 0;
    return rgbArray;
  }
  
  var images = [];
  
  function initiateLoad(textures, onSuccess) {
    var n = textures.length;
    var counter = 0;
    
    var callback = function() {
      counter++;
      console.log(counter+" of "+n+" textures received")
      if (counter == n) onSuccess();
    }
  
    for (var i = 0; i < n; i++) {    
      var image = new Image()
      image.onload = callback;
      image.src = textures[i];
      images.push(image);
    }
  }
  
  function getTextures() {
    var n = images.length;
    var textures = [];
    for (var i = 0; i < n; i++) {
      var canvas = document.createElement('canvas');
      var image = images[i];
      canvas.width = image.width;
      canvas.height = image.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      var imagedata = ctx.getImageData(0, 0, image.width, image.height);
      var rgbArray = new Array(image.width * image.height);
      for(var j = 0; j < image.width * image.height; j++) {
        rgbArray[j] = [imagedata.data[4*j], imagedata.data[4*j+1], imagedata.data[4*j+2]];
      }
      textures.push(rgbArray);
    }
    
    return textures;
  }
  
  return {load: load, initiateLoad: initiateLoad, getTextures: getTextures};
}());