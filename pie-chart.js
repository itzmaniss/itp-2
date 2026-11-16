function PieChart(x, y, diameter) {

  this.x = x;
  this.y = y;
  this.diameter = diameter;
  this.labelSpace = 30;

  this.get_radians = function(data) {
    var total = sum(data);
    var radians = [];

    for (let i = 0; i < data.length; i++) {
      radians.push((data[i] / total) * TWO_PI);
    }

    return radians;
  };

  //my code starts here
  // Added optional animProgress parameter for smooth sweep animation
  this.draw = function(data, labels, colours, title, animProgress) {
  //my code ends here

    // Test that data is not empty and that each input array is the
    // same length.
    if (data.length == 0) {
      alert('Data has length zero!');
    } else if (![labels, colours].every((array) => {
      return array.length == data.length;
    })) {
      alert(`Data (length: ${data.length})
Labels (length: ${labels.length})
Colours (length: ${colours.length})
Arrays must be the same length!`);
    }

    // https://p5js.org/examples/form-pie-chart.html

    var angles = this.get_radians(data);
    var lastAngle = 0;
    var colour;

    //my code starts here
    // Calculate the max sweep angle based on animation progress
    // Default to full circle if no animation progress provided
    var maxSweep = (animProgress !== undefined ? animProgress : 1) * TWO_PI;
    //my code ends here

    for (var i = 0; i < data.length; i++) {
      if (colours) {
        colour = colours[i];
      } else {
        colour = map(i, 0, data.length, 0, 255);
      }

      //my code starts here
      // Stop drawing slices once we exceed the animated sweep angle
      if (lastAngle >= maxSweep) break;

      // Clamp the current slice so it doesn't exceed the sweep limit
      var sliceAngle = Math.min(angles[i], maxSweep - lastAngle);
      //my code ends here

      fill(colour);
      stroke(0);
      strokeWeight(1);

      //my code starts here
      arc(this.x, this.y,
          this.diameter, this.diameter,
          lastAngle, lastAngle + sliceAngle + 0.001); // Hack for 0!
      //my code ends here

      if (labels) {
        this.makeLegendItem(labels[i], i, colour);
      }

      lastAngle += angles[i];
    }

    if (title) {
      noStroke();
      textAlign('center', 'center');
      textSize(24);
      text(title, this.x, this.y - this.diameter * 0.6);
    }
  };

  this.makeLegendItem = function(label, i, colour) {
    var x = this.x + 50 + this.diameter / 2;
    var y = this.y + (this.labelSpace * i) - this.diameter / 3;
    var boxWidth = this.labelSpace / 2;
    var boxHeight = this.labelSpace / 2;

    fill(colour);
    rect(x, y, boxWidth, boxHeight);

    fill('black');
    noStroke();
    textAlign('left', 'center');
    textSize(12);
    text(label, x + boxWidth + 10, y + boxWidth / 2);
  };
}
