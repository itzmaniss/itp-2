//my code starts here
/**
 * @fileoverview Transport Mode visualization using Waffle charts
 * Displays transport mode distribution data using waffle chart representation
 */

function TransportMode() {
  // Name for the visualisation to appear in the menu bar.
  this.name = "Transport Mode";

  // Each visualisation must have a unique ID with no special characters.
  this.id = "transport-mode";

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Preload the data
  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/transport-mode/2015.csv",
      "csv",
      "header",
      function (table) {
        self.loaded = true;
      }
    );
  };

  this.setup = function () {
    // Define transport mode categories (excluding Total and No Transport Required)
    this.categories = [
      "Public Bus Only",
      "MRT Only",
      "MRT & Public Bus Only",
      "Other Combinations Of MRT Or Public Bus",
      "Taxi Only",
      "Car Only",
      "Private Chartered Bus/Van Only",
      "Lorry/Pickup Only",
      "Motorcycle/Scooter Only",
      "Others"
    ];

    // Create waffle chart for Total population
    this.waffle = new Waffle(
      100,
      150,
      800,
      300,
      20, // boxes across
      15, // boxes down
      this.data,
      "Thousands", // column heading - we'll process the categories
      this.categories
    );

    // Prepare processed data for the waffle
    // The Waffle expects a column with category values repeated based on counts
    this.processedData = [];

    // Get total for all transport modes (excluding Total row and No Transport Required)
    var total = 0;
    for (var i = 0; i < this.data.getRowCount(); i++) {
      var mode = this.data.getString(i, "Thousands");
      if (this.categories.indexOf(mode) !== -1) {
        total += this.data.getNum(i, "Total_Total");
      }
    }

    // Create a new table with repeated category values
    this.processedTable = new p5.Table();
    this.processedTable.addColumn("mode");

    for (var i = 0; i < this.data.getRowCount(); i++) {
      var mode = this.data.getString(i, "Thousands");
      if (this.categories.indexOf(mode) !== -1) {
        var count = this.data.getNum(i, "Total_Total");
        var proportion = count / total;

        // Add rows proportional to the count (scale to 300 total boxes)
        var numBoxes = Math.round(proportion * 300);
        for (var j = 0; j < numBoxes; j++) {
          var newRow = this.processedTable.addRow();
          newRow.setString("mode", mode);
        }
      }
    }

    // Create waffle with processed data
    this.waffle = new Waffle(
      100,
      150,
      800,
      300,
      20, // boxes across
      15, // boxes down
      this.processedTable,
      "mode",
      this.categories
    );
  };

  this.destroy = function () {
    // No UI elements to remove
  };

  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Draw title
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Transport Mode to Work in Singapore (2015)", width / 2, 50);

    textSize(14);
    fill(100);
    text("Each box represents approximately 7,000 people", width / 2, 80);

    // Draw the waffle chart
    this.waffle.draw();

    // Check for mouse hover to show tooltips
    this.waffle.checkMouse();

    // Draw legend
    this.drawLegend();
  };

  this.drawLegend = function () {
    var legendData = this.waffle.getLegend();
    var legendX = 100;
    var legendY = 480;
    var legendItemHeight = 20;
    var columns = 2;
    var columnWidth = 400;

    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    text("Legend:", legendX, legendY - 30);

    textSize(11);
    for (var i = 0; i < legendData.length; i++) {
      var col = Math.floor(i / 5); // 5 items per column
      var row = i % 5;

      var x = legendX + col * columnWidth;
      var y = legendY + row * legendItemHeight;

      // Draw color box
      fill(legendData[i].color);
      stroke(0);
      strokeWeight(1);
      rect(x, y, 15, 15);

      // Draw text
      fill(0);
      noStroke();
      var percentage = (legendData[i].proportion * 100).toFixed(1);
      text(
        legendData[i].name + " (" + percentage + "%)",
        x + 20,
        y + 2
      );
    }
  };
}
//my code ends here
