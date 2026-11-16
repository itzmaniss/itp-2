//My code starts here
/**
 * @fileoverview Waffle chart module.
 * @param {number} x - X position of the chart
 * @param {number} y - Y position of the chart
 * @param {number} width - Total width of the chart
 * @param {number} height - Total height of the chart
 * @param {number} boexesAcross - Number of boxes horizontally
 * @param {number} boxesDown - Number of boxes vertically
 * @param {p5.table} data - Data table containing the columns to visualize
 * @param {string} columnHeading - Name of the column in the visualization
 * @param {Array} categories - Array of possible category names
 */

function Waffle(x, y, width, height, boxesAcross, boxesDown, data, columnHeading, categories) {
    // private properties
    var x = x;
    var y = y;
    var width = width;
    var height = height;
    var boxesAcross = boxesAcross;
    var boxesDown = boxesDown;

    //calculate box dimensions 
    var boxWidth = width / boxesAcross;
    var boxHeight = height / boxesDown;

    //2D array to hold boxes
    var boxes = [];

    //Array to store category information
    var categoryInfo = [];

    //extract the specific column we want to visualize
    var column = data.getColumn(columnHeading);

    //store possible values
    var categories = categories;

    //array of colors for categories
    var colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

    //public property for title
    this.title = columnHeading;

    //private methods

    //initialise categories
    var addCategories = function () {
        // create a category info object for each category
        for (var i = 0; i < categories.length; i++) {
            categoryInfo.push({
                name: categories[i],
                color: color(colors[i % colors.length]), // cycle through colors if more categories than colors
                count: 0
            });
        }

        //count how many times each category appears in the column
        for (var i = 0; i < column.length; i++) {
            var value = column[i];
            for (var j = 0; j < categoryInfo.length; j++) {
                if (value === categoryInfo[j].name) {
                    categoryInfo[j].count++;
                    break;
                }
            }
        }

        //calculate proportions (0 to 1)
        var totalResponses = column.length;
        for (var i = 0; i < categoryInfo.length; i++) {
            categoryInfo[i].proportion = categoryInfo[i].count / totalResponses;
        }
    };

    //populate the boxes array with Box objects
    var createBoxes = function() {
        var totalBoxes = boxesAcross * boxesDown;
        var boxIndex = 0; // track which box we're filling

        //initialize 2D array structure
        for (var i = 0; i < boxesAcross; i++) {
            boxes[i] = []; // create inner array for each column
        }

        //fill boxes based on category proportions
        for (var i = 0; i < categoryInfo.length; i++) {
            //calculate how many boxes this category should fill
            var numBoxes = Math.round(categoryInfo[i].proportion * totalBoxes);

            //assign boxes to this category
            for (var j = 0; j < numBoxes; j++) {
                //convert linear index to 2D coordinates
                var col = Math.floor(boxIndex / boxesDown);
                var row = boxIndex % boxesDown;

                //safety check: don't exceed grid boundaries
                if (col < boxesAcross) {
                    //calculate box position
                    var boxX = col * boxWidth;
                    var boxY = row * boxHeight;

                    //create new Box object
                    boxes[col][row] = new Box(
                        boxX,
                        boxY,
                        boxWidth,
                        boxHeight,
                        categoryInfo[i]
                    );

                    boxIndex++;
                }
            }
        }

        //fill any remaining boxes (due to rounding) with last category
        while (boxIndex < totalBoxes) {
            var col = Math.floor(boxIndex / boxesDown);
            var row = boxIndex % boxesDown;

            if (col < boxesAcross) {
                var boxX = col * boxWidth;
                var boxY = row * boxHeight;

                boxes[col][row] = new Box(
                    boxX,
                    boxY,
                    boxWidth,
                    boxHeight,
                    categoryInfo[categoryInfo.length - 1] // last category
                );
            }

            boxIndex++;
        }
    };

    //public methods

    //initialize the waffle chart
    this.setup = function() {
        addCategories();
        createBoxes();
    };

    //draw the waffle chart to the canvas
    this.draw = function() {
        push(); // save current drawing state
        translate(x, y); // move origin to waffle position

        //draw all boxes using nested loops
        for (var i = 0; i < boxesAcross; i++) {
            for (var j = 0; j < boxesDown; j++) {
                //safety check: make sure box exists
                if (boxes[i] && boxes[i][j] && boxes[i][j].category !== undefined) {
                    boxes[i][j].draw();
                }
            }
        }

        //draw title above the waffle
        fill(0);
        noStroke();
        textAlign(CENTER);
        textSize(14);
        text(this.title, width / 2, -10);

        pop(); // restore previous drawing state
    };

    //check if mouse is over any box and display tooltip
    //optimised: calculate target box directly instead of iterating all boxes
    this.checkMouse = function() {
        //adjust mouse coordinates relative to waffle position
        var mx = mouseX - x;
        var my = mouseY - y;

        //early exit if mouse is outside the waffle area
        if (mx < 0 || mx >= width || my < 0 || my >= height) {
            return;
        }

        //calculate which box the mouse is over directly (O(1) lookup)
        var col = Math.floor(mx / boxWidth);
        var row = Math.floor(my / boxHeight);

        //bounds check and draw tooltip for the hovered box
        if (col >= 0 && col < boxesAcross && row >= 0 && row < boxesDown) {
            if (boxes[col] && boxes[col][row]) {
                var category = boxes[col][row].category;

                if (category) {
                    //draw tooltip background
                    push();
                    fill(255, 255, 255, 230);
                    stroke(0);
                    strokeWeight(1);

                    //tooltip dimensions
                    var tooltipWidth = 150;
                    var tooltipHeight = 40;
                    var tooltipX = mouseX + 10;
                    var tooltipY = mouseY - 25;

                    //keep tooltip on screen
                    if (tooltipX + tooltipWidth > width) {
                        tooltipX = mouseX - tooltipWidth - 10;
                    }

                    rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);

                    //draw tooltip text
                    fill(0);
                    noStroke();
                    textAlign(LEFT, TOP);
                    textSize(12);
                    text(category.name, tooltipX + 5, tooltipY + 5);

                    //show percentage
                    var percentage = (category.proportion * 100).toFixed(1);
                    textSize(10);
                    fill(100);
                    text(percentage + "% (" + category.count + " responses)",
                         tooltipX + 5, tooltipY + 22);

                    pop();
                }
            }
        }
    };

    //get the legend data for this waffle
    this.getLegend = function() {
        return categoryInfo;
    };

    //automatically set up the waffle when created
    this.setup();

}


//My code ends here