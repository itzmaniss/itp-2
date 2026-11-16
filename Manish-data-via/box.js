//My code starts here
/**
 * @fileoverview Box Constructor - Represents a single cell in the waffle chart grid
 * @param {number} x - X position of the box
 * @param {number} y - Y position of the box
 * @param {number} width - Width of the box
 * @param {number} height - Height of the box
 * @param {number} category - category the box represents
 */


function Box(x, y, width, height, category) {

    //private properties
    var x = x;
    var y = y;
    var width = width;
    var height = height;

    //public property need to access category from outside
    this.category = category;

    //public methods
    this.draw = function() {
        if (this.category && this.category.color) {
            fill(this.category.color);
        } else {
            fill(200); // fill with gray if no category or color defined
        }

        stroke(255); // white border for better visibility
        strokeWeight(1);

        //draw the box
        rect(x, y, width, height);
    };

    //check if mouse is over this box
    this.mouseOver = function(mx, my) {
        return mx >= x && mx <= x + width && my >= y && my <= y + height;
    };
}



//My code ends here