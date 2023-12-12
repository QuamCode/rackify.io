// A simple isometric tile renderer
var serverInfoDict = {};
var currentID = 0;
var Isometric = {

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
  infoBoxOpen: false,
  canvasClickEnabled: true,
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
    IsometricMap.rackIds = new Array(this.userDefinedXtiles); // Initialize rackIds
    for (var i = 0; i < this.userDefinedXtiles; i++) {
      IsometricMap.map[i] = new Array(this.userDefinedYtiles).fill(1);
      IsometricMap.rackIds[i] = new Array(this.userDefinedYtiles).fill(null); // Initialize rackIds with null
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
     // console.log(tileX, tileY);
      self.redrawTiles();
    });

    this.canvas.on('contextmenu', function(e) {
      e.preventDefault(); // Prevent the context menu from showing up
    
      var canvasOffset = self.canvas.offset();
      var mouseX = e.clientX - canvasOffset.left;
      var mouseY = e.clientY - canvasOffset.top;
    
      // Calculate the clicked tile coordinates
      var tileX = Math.round((mouseX - self.tileColumnOffset / 2 - self.originX) / self.tileColumnOffset - (mouseY - self.tileRowOffset / 2 - self.originY) / self.tileRowOffset);
      var tileY = Math.round((mouseX - self.tileColumnOffset / 2 - self.originX) / self.tileColumnOffset + (mouseY - self.tileRowOffset / 2 - self.originY) / self.tileRowOffset);
    
      // Check if the clicked tile is within bounds
      if (tileX >= 0 && tileX < self.Xtiles && tileY >= 0 && tileY < self.Ytiles) {
        // Remove the tile
        IsometricMap.map[tileX][tileY] = 1; // Set it back to the default tile
        IsometricMap.rackIds[tileX][tileY] = null;
        IsometricMap.tileTypes[tileX][tileY] = tileTypes[0]; // Set it as 'Default'
        self.redrawTiles();
      }
    });
    

    this.canvas.on('click', function(event) {
      if (self.canvasClickEnabled) {
        // Handle canvas click logic here
        var canvasOffset = self.canvas.offset();
        var mouseX = event.clientX - canvasOffset.left;
        var mouseY = event.clientY - canvasOffset.top;

        // Check if the info box is open
        if (self.infoBoxOpen) {
          var infoBoxElement = $('#server-info-overlay');

          // Check if the click was inside the info box
          if (!infoBoxElement.is(event.target) && infoBoxElement.has(event.target).length === 0) {
            // Click was outside the info box, so close it and allow interaction with tiles
            self.closeInfoBox();
          }
          return;
        }

        // Calculate the clicked tile coordinates
        var tileX = Math.round((mouseX - self.tileColumnOffset / 2 - self.originX) / self.tileColumnOffset - (mouseY - self.tileRowOffset / 2 - self.originY) / self.tileRowOffset);
        var tileY = Math.round((mouseX - self.tileColumnOffset / 2 - self.originX) / self.tileColumnOffset + (mouseY - self.tileRowOffset / 2 - self.originY) / self.tileRowOffset);

        // Check if the clicked tile is within bounds
        if (tileX >= 0 && tileX < self.Xtiles && tileY >= 0 && tileY < self.Ytiles) {
          var currentTileValue = IsometricMap.map[tileX][tileY];
          if (currentTileValue === 0) {
            // Tile is already a server rack, display info box
            currentID = IsometricMap.rackIds[tileX][tileY];
            console.log(currentID);
            self.displayInfoBox(tileX, tileY, currentID);
          } else {
            // Change the tile in the map index to 0 and assign a random 'rack-id'
            IsometricMap.map[tileX][tileY] = 0;
            var rackId = self.generateRandomRackId();
            IsometricMap.rackIds[tileX][tileY] = rackId;
            serverInfoDict[rackId] = {
              name: "Server Name",
              ru: "3U",
              power: "200" // Default values
            };
            console.log(serverInfoDict);
            self.redrawTiles();
          }
        }

        // Toggle the showCoordinates property
        self.showCoordinates = !self.showCoordinates;
      }
    });
    

    this.updateCanvasSize();
    this.redrawTiles();
  },
  

  displayInfoBox: function(tileX, tileY, rackId) {
    if (rackId !== null) {
      var serverInfo = serverInfoDict[rackId];
      if (serverInfo) {
        console.log(serverInfo);
        console.log(serverInfo.name)
        // Populate server details with actual data
        var serverDetailsContainer = $('#server-info-container');
        serverDetailsContainer.empty();
        serverDetailsContainer.append('<h2>Server Details</h2>');
        serverDetailsContainer.append('<p><strong>ID:</strong> ' + rackId + '</p>');
        serverDetailsContainer.append('<p><strong>Name:</strong> <span id="server-name">' + serverInfo.name + '</span></p>');
        serverDetailsContainer.append('<p><strong>RU:</strong> <span id="server-ru">' + serverInfo.ru + '</span></p>');
        serverDetailsContainer.append('<p><strong>Power:</strong> <span id="server-power">' + serverInfo.power + ' watts</span></p>');
        serverDetailsContainer.append('<button id="close-server-info">Close</button>');
        serverDetailsContainer.append('<button id="modify-server-details">Modify</button>');
  
        // Show the overlay
        $('#server-info-overlay').show();
  
        // Set the infoBoxOpen flag to true
        this.infoBoxOpen = true;
      }
    }
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
  generateRandomRackId: function() {
    return Math.floor(Math.random() * 1000); // You can adjust the range as needed
  },

  drawTile: function(Xi, Yi) {
    var offX = Xi * this.tileColumnOffset / 2 + Yi * this.tileColumnOffset / 2 + this.originX;
    var offY = Yi * this.tileRowOffset / 2 - Xi * this.tileRowOffset / 2 + this.originY;

    var imageIndex = IsometricMap.map[Xi][Yi];
    var verticalOffset = 0;
    if (imageIndex === 0) {
      // Tile 0 is twice the height of other tiles (adjust as needed)
      verticalOffset = this.tileRowOffset * 1.32;
    }
    this.context.drawImage(this.tileImages[imageIndex], offX, offY - verticalOffset);

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

  closeInfoBox: function() {
    // Hide the overlay
    $('#server-info-overlay').hide();
    // Set the infoBoxOpen flag to false
    this.infoBoxOpen = false;
    // Re-enable canvas click events
    this.canvasClickEnabled = true;
  },
};

$(document).on('click', '#close-server-info', function() {
  Isometric.closeInfoBox(); // Call the closeInfoBox method
});

$('#server-info-overlay').on('click', '#modify-server-details', function() {
  var rackId = currentID;
  showEditServerDetails(rackId);
});

function showEditServerDetails(rackId) {
  var serverDetailsContainer = $('#server-info-container');
  var serverInfo = serverInfoDict[rackId];
  if (!serverInfo) {
    console.error("Server info not found for rack ID:", rackId);
    // Handle the error appropriately, maybe alert the user
    return;
  }

  // Replace server details with input fields for editing
  serverDetailsContainer.empty();
  serverDetailsContainer.append('<h2>Edit Server Details</h2>');
  serverDetailsContainer.append('<p><strong>ID:</strong> ' + rackId + '</p>');
  serverDetailsContainer.append('<label for="server-name">Name:</label>');
  serverDetailsContainer.append('<input type="text" id="server-name" value="' + serverInfo.name + '"><br>');
  serverDetailsContainer.append('<label for="server-ru">RU:</label>');
  serverDetailsContainer.append('<input type="text" id="server-ru" value="' + serverInfo.ru + '"><br>');
  serverDetailsContainer.append('<label for="server-power">Power (watts):</label>');
  serverDetailsContainer.append('<input type="text" id="server-power" value="' + serverInfo.power + '"><br>');
  serverDetailsContainer.append('<button id="save-server-details">Save</button>');

  // Add click handler for the Save button

}

// Function to display updated server details after saving
function displayUpdatedServerDetails(rackId) {
  var serverInfo = serverInfoDict[rackId];
  $('#server-name').text(serverInfo.name);
  $('#server-ru').text(serverInfo.ru);
  $('#server-power').text(serverInfo.power + ' watts');
}

// Add click handler for the Modify button in the displayed info box
$(document).on('click', '#modify-server-details', function() {
  var rackId = currentID;
  showEditServerDetails(rackId);
});

$(document).on('click', '#save-server-details', function () {
  var rackId = currentID;
  var editedName = $('#server-name').val();
  var editedRU = $('#server-ru').val();
  var editedPower = $('#server-power').val();

  // Update the server details in memory (serverInfoDict)
  serverInfoDict[rackId] = {
    name: editedName,
    ru: editedRU,
    power: editedPower
  };

  // Display the updated server details
  //displayUpdatedServerDetails(rackId);
  var serverDetailsContainer = $('#server-info-container');
  // Re-enable the Modify button
  serverDetailsContainer.empty();
  serverDetailsContainer.append('<h2>Server Details</h2>');
  serverDetailsContainer.append('<p><strong>ID:</strong> ' + rackId + '</p>');
  serverDetailsContainer.append('<p><strong>Name:</strong> <span id="server-name">' + editedName + '</span></p>');
  serverDetailsContainer.append('<p><strong>RU:</strong> <span id="server-ru">' + editedRU + '</span></p>');
  serverDetailsContainer.append('<p><strong>Power:</strong> <span id="server-power">' + editedPower + ' watts</span></p>');
  serverDetailsContainer.append('<button id="close-server-info">Close</button>');
  serverDetailsContainer.append('<button id="modify-server-details">Modify</button>');
});
