// A simple isometric tile renderer
var Isometric = {
  tileColumnOffset: 100, // pixels
  tileRowOffset: 50, // pixels

  originX: 0, // offset from left
  originY: 0, // offset from top

  Xtiles: 0, // Number of tiles in X-dimension
  Ytiles: 0, // Number of tiles in Y-dimension

  selectedTileX: -1,
  selectedTileY: -1,

  context: undefined,
  canvas: undefined,

  tileImages: undefined,

  showCoordinates: false,
  tileColumnOffset: 100, // pixels
  tileRowOffset: 50, // pixels
  // ...

  // New properties for dynamic map sizing
  userDefinedXtiles: 0,
  userDefinedYtiles: 0,

  isDragging: false,
  lastMouseX: null,
  lastMouseY: null,

  initialize: function() {
    var xTilesInput = parseInt(document.getElementById('xtiles').value, 10);
    var yTilesInput = parseInt(document.getElementById('ytiles').value, 10);

    if (isNaN(xTilesInput) || isNaN(yTilesInput) || xTilesInput <= 0 || yTilesInput <= 0) {
      alert("Please enter valid tile numbers!");
      return;
    }

    this.userDefinedXtiles = xTilesInput;
    this.userDefinedYtiles = yTilesInput;

    this.generateBlankMap();
    this.load();
  },

  // New method to generate a blank map
  generateBlankMap: function() {
    IsometricMap.map = new Array(this.userDefinedXtiles);
    for (var i = 0; i < this.userDefinedXtiles; i++) {
      IsometricMap.map[i] = new Array(this.userDefinedYtiles).fill(0); // Fill with default tile index
    }
  },

  load: function() {
    this.tileImages = new Array();
    var loadedImages = 0;
    var totalImages = IsometricMap.tiles.length;

    // Load all the images before we run the app
    var self = this;
    for(var i = 0; i < IsometricMap.tiles.length; i++) {
      this.tileImages[i] = new Image();
      this.tileImages[i].onload = function() {
        if(++loadedImages >= totalImages) {
          self.run();
        }
      };
      this.tileImages[i].src = IsometricMap.tiles[i];
    }
  },

  run: function() {
    this.canvas = $('#isocanvas');
    this.context = this.canvas[0].getContext("2d");

    this.Xtiles = IsometricMap.map.length;
    this.Ytiles = IsometricMap.map[0].length;

    var self = this;
    $(window).on('resize', function(){
      self.updateCanvasSize();
      self.redrawTiles();
    });
    this.canvas.on('mousedown', function(e) {
      var canvasOffset = self.canvas.offset();
      self.isDragging = true;
      self.lastMouseX = e.clientX - canvasOffset.left;
      self.lastMouseY = e.clientY - canvasOffset.top;
    });

    $(window).on('mouseup', function() {
      self.isDragging = false;
    });

    this.canvas.on('mousemove', function(e) {
      var canvasOffset = self.canvas.offset();
      var mouseX = e.clientX - canvasOffset.left;
      var mouseY = e.clientY - canvasOffset.top;
  
      if (self.isDragging) {
        var deltaX = mouseX - self.lastMouseX;
        var deltaY = mouseY - self.lastMouseY;
        self.originX += deltaX;
        self.originY += deltaY;;
        self.redrawTiles();
      }
  
      self.lastMouseX = mouseX;
      self.lastMouseY = mouseY;
  
      // Tile selection logic
      var tileX = Math.round((mouseX - self.tileColumnOffset / 2 - self.originX) / self.tileColumnOffset - (mouseY - self.tileRowOffset / 2 - self.originY) / self.tileRowOffset);
      var tileY = Math.round((mouseX - self.tileColumnOffset / 2 - self.originX) / self.tileColumnOffset + (mouseY - self.tileRowOffset / 2 - self.originY) / self.tileRowOffset);
  
      self.selectedTileX = tileX;
      self.selectedTileY = tileY;
      self.redrawTiles();
    });

    $(window).on('click', function() {
      self.showCoordinates = !self.showCoordinates;
      self.redrawTiles();
    });

    

    this.updateCanvasSize();
    this.redrawTiles();
  },



  updateCanvasSize: function() {
    var width = $(window).width();
    var height = $(window).height();

    this.context.canvas.width  = width;
    this.context.canvas.height = height;

    this.originX = width / 2 - this.Xtiles * this.tileColumnOffset / 2;
    this.originY = height / 2;
  },

  redrawTiles: function() {
    this.context.canvas.width = this.context.canvas.width;

    for(var Xi = (this.Xtiles - 1); Xi >= 0; Xi--) {
      for(var Yi = 0; Yi < this.Ytiles; Yi++) {
        this.drawTile(Xi, Yi);
      }
    }

    this.drawDiamond(this.selectedTileX, this.selectedTileY, 'yellow');
    if(this.showCoordinates && this.isCursorOnMap()) {
      this.context.fillStyle = 'yellow';
      var idx = IsometricMap.map[this.selectedTileX][this.selectedTileY];
      this.context.font = '14pt Arial';
      this.context.fillText(IsometricMap.tiles[idx].replace("/assets/tiles/",""), 20, 30);
    }
  },

  isCursorOnMap: function() {
    return (this.selectedTileX >= 0 && this.selectedTileX < this.Xtiles &&
            this.selectedTileY >= 0 && this.selectedTileY < this.Ytiles);
  },

  drawTile: function(Xi, Yi) {
    var offX = Xi * this.tileColumnOffset / 2 + Yi * this.tileColumnOffset / 2 + this.originX;
    var offY = Yi * this.tileRowOffset / 2 - Xi * this.tileRowOffset / 2 + this.originY;

    var imageIndex = IsometricMap.map[Xi][Yi];
    this.context.drawImage(this.tileImages[imageIndex], offX, offY);

    if(this.showCoordinates) {
      this.context.fillStyle = 'orange';
      this.context.fillText(Xi + ", " + Yi, offX + this.tileColumnOffset/2 - 9, offY + this.tileRowOffset/2 + 3);
    }
  },

  drawDiamond: function(Xi, Yi, color) {
    var offX = Xi * this.tileColumnOffset / 2 + Yi * this.tileColumnOffset / 2 + this.originX;
    var offY = Yi * this.tileRowOffset / 2 - Xi * this.tileRowOffset / 2 + this.originY;

    this.drawLine(offX, offY + this.tileRowOffset / 2, offX + this.tileColumnOffset / 2, offY, color);
    this.drawLine(offX + this.tileColumnOffset / 2, offY, offX + this.tileColumnOffset, offY + this.tileRowOffset / 2, color);
    this.drawLine(offX + this.tileColumnOffset, offY + this.tileRowOffset / 2, offX + this.tileColumnOffset / 2, offY + this.tileRowOffset, color);
    this.drawLine(offX + this.tileColumnOffset / 2, offY + this.tileRowOffset, offX, offY + this.tileRowOffset / 2, color);
  },

  drawLine: function(x1, y1, x2, y2, color) {
    color = typeof color !== 'undefined' ? color : 'white';
    this.context.strokeStyle = color;
    this.context.beginPath();
    this.context.lineWidth = 1;
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  },
};
