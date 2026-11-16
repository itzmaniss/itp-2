function ClimateChange() {
  // Name for the visualisation to appear in the menu bar.
  this.name = "Climate Change";

  // Each visualisation must have a unique ID with no special
  // characters.
  this.id = "climate-change";

  // Names for each axis.
  this.xAxisLabel = "year";
  this.yAxisLabel = "℃";

  var marginSize = 35;

  // Layout object to store all common plot layout parameters and
  // methods.
  this.layout = {
    marginSize: marginSize,

    // Locations of margin positions. Left and bottom have double margin
    // size due to axis and tick labels.
    leftMargin: marginSize * 2,
    rightMargin: width - marginSize,
    topMargin: marginSize * 3.5,
    bottomMargin: height - marginSize * 2,
    pad: 5,

    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },

    plotHeight: function () {
      return this.bottomMargin - this.topMargin;
    },

    // Boolean to enable/disable background grid.
    grid: false,

    // Number of axis tick labels to draw so that they are not drawn on
    // top of one another.
    numXTickLabels: 8,
    numYTickLabels: 8,
  };

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Preload the data. This function is called automatically by the
  // gallery when a visualisation is added.
  this.preload = function () {
    var self = this;
    this.data = loadTable(
      "./data/surface-temperature/surface-temperature.csv",
      "csv",
      "header",
      // Callback function to set the value
      // this.loaded to true.
      function (table) {
        self.loaded = true;
      },
    );
  };

  this.setup = function () {
    // Font defaults.
    textSize(16);
    textAlign("center", "center");

    // Set min and max years: assumes data is sorted by year.
    this.minYear = this.data.getNum(0, "year");
    this.maxYear = this.data.getNum(this.data.getRowCount() - 1, "year");

    // Find min and max temperature for mapping to canvas height.
    this.minTemperature = min(this.data.getColumn("temperature"));
    this.maxTemperature = max(this.data.getColumn("temperature"));

    // Find mean temperature to plot average marker.
    this.meanTemperature = mean(this.data.getColumn("temperature"));

    // Count the number of frames drawn since the visualisation
    // started so that we can animate the plot.
    this.frameCount = 0;

    //my code starts here
    // Custom range slider properties
    this.slider = {
      x: this.layout.leftMargin + 20,
      y: 20,
      width: 250,
      trackY: 0,
      trackHeight: 4,
      handleRadius: 12,
      minValue: this.minYear,
      maxValue: this.maxYear,
      startValue: this.minYear,
      endValue: this.maxYear,
      draggingStart: false,
      draggingEnd: false,
      color: color(66, 135, 245),
      trackColor: color(220, 220, 220),
      handleColor: color(255, 255, 255),
    };

    this.slider.trackY = this.slider.y + 55;

    // Create text input boxes for manual year entry
    // Get canvas position to offset the inputs correctly
    const canvasX = select("canvas").position().x;
    const canvasY = select("canvas").position().y;

    this.startYearInput = createInput(this.minYear.toString());
    this.startYearInput.position(
      canvasX + this.slider.x,
      canvasY + this.slider.y + 20,
    );
    this.startYearInput.size(60, 25);
    this.startYearInput.style("text-align", "center");
    this.startYearInput.style("font-size", "14px");

    this.endYearInput = createInput(this.maxYear.toString());
    this.endYearInput.position(
      canvasX + this.slider.x + this.slider.width - 60,
      canvasY + this.slider.y + 20,
    );
    this.endYearInput.size(60, 25);
    this.endYearInput.style("text-align", "center");
    this.endYearInput.style("font-size", "14px");

    // Create Go button
    this.goButton = createButton("Go");
    this.goButton.position(
      canvasX + this.slider.x + this.slider.width / 2 - 20,
      canvasY + this.slider.y + 20,
    );
    this.goButton.size(40, 25);
    this.goButton.style("font-size", "14px");

    // Store reference for event handlers
    const self = this;

    // Apply values when Go button is clicked
    this.goButton.mousePressed(function () {
      const startValue = parseInt(self.startYearInput.value());
      const endValue = parseInt(self.endYearInput.value());

      if (!isNaN(startValue) && !isNaN(endValue)) {
        if (
          startValue >= self.minYear &&
          startValue < endValue &&
          endValue <= self.maxYear
        ) {
          self.slider.startValue = startValue;
          self.slider.endValue = endValue;
        } else {
          alert(
            "Invalid year range. Start must be less than end, and both must be between " +
              self.minYear +
              " and " +
              self.maxYear,
          );
        }
      }
    });
  };

  this.destroy = function () {
    this.startYearInput.remove();
    this.endYearInput.remove();
    this.goButton.remove();
  };

  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Handle slider interaction
    this.handleSliderInteraction();

    // Get current year range from slider
    this.startYear = Math.round(this.slider.startValue);
    this.endYear = Math.round(this.slider.endValue);

    // Only update text inputs when slider is being dragged
    // (otherwise the user can't type in the input boxes)
    if (this.slider.draggingStart || this.slider.draggingEnd) {
      this.startYearInput.value(this.startYear.toString());
      this.endYearInput.value(this.endYear.toString());
    }

    // Draw the custom range slider
    this.drawRangeSlider();

    // Draw all y-axis tick labels.
    drawYAxisTickLabels(
      this.minTemperature,
      this.maxTemperature,
      this.layout,
      this.mapTemperatureToHeight.bind(this),
      1,
    );

    // Draw x and y axis.
    drawAxis(this.layout);

    // Draw x and y axis labels.
    drawAxisLabels(this.xAxisLabel, this.yAxisLabel, this.layout);

    // Plot average line.
    stroke(200);
    strokeWeight(1);
    line(
      this.layout.leftMargin,
      this.mapTemperatureToHeight(this.meanTemperature),
      this.layout.rightMargin,
      this.mapTemperatureToHeight(this.meanTemperature),
    );

    // Plot all temperatures between startYear and endYear using the
    // width of the canvas minus margins.
    var previous;
    var numYears = this.endYear - this.startYear;
    var segmentWidth = this.layout.plotWidth() / numYears;

    // Count the number of years plotted each frame to create
    // animation effect.
    var yearCount = 0;

    // Loop over all rows but only plot those in range.
    for (var i = 0; i < this.data.getRowCount(); i++) {
      // Create an object to store data for the current year.
      var current = {
        // Convert strings to numbers.
        year: this.data.getNum(i, "year"),
        temperature: this.data.getNum(i, "temperature"),
      };

      if (
        previous != null &&
        current.year > this.startYear &&
        current.year <= this.endYear
      ) {
        // Draw background gradient to represent colour temperature of
        // the current year.
        noStroke();
        fill(this.mapTemperatureToColour(current.temperature));
        rect(
          this.mapYearToWidth(previous.year),
          this.layout.topMargin,
          segmentWidth,
          this.layout.plotHeight(),
        );

        // Draw line segment connecting previous year to current
        // year temperature.
        stroke(0);
        line(
          this.mapYearToWidth(previous.year),
          this.mapTemperatureToHeight(previous.temperature),
          this.mapYearToWidth(current.year),
          this.mapTemperatureToHeight(current.temperature),
        );

        // The number of x-axis labels to skip so that only
        // numXTickLabels are drawn.
        var xLabelSkip = ceil(numYears / this.layout.numXTickLabels);

        // Draw the tick label marking the start of the previous year.
        if (yearCount % xLabelSkip == 0) {
          drawXAxisTickLabel(
            previous.year,
            this.layout,
            this.mapYearToWidth.bind(this),
          );
        }

        // When six or fewer years are displayed also draw the final
        // year x tick label.
        if (numYears <= 6 && yearCount == numYears - 1) {
          drawXAxisTickLabel(
            current.year,
            this.layout,
            this.mapYearToWidth.bind(this),
          );
        }

        yearCount++;
      }

      // Stop drawing this frame when the number of years drawn is
      // equal to the frame count. This creates the animated effect
      // over successive frames.
      if (yearCount >= this.frameCount) {
        break;
      }

      // Assign current year to previous year so that it is available
      // during the next iteration of this loop to give us the start
      // position of the next line segment.
      previous = current;
    }

    // Count the number of frames since this visualisation
    // started. This is used in creating the animation effect and to
    // stop the main p5 draw loop when all years have been drawn.
    this.frameCount++;

    // Stop animation when all years have been drawn.
    if (this.frameCount >= numYears) {
      //noLoop();
    }

    // Draw trend line using linear regression on visible data range
    const trendYears = [];
    const trendTemps = [];
    for (let i = 0; i < this.data.getRowCount(); i++) {
      const yr = this.data.getNum(i, "year");
      const temp = this.data.getNum(i, "temperature");
      if (yr >= this.startYear && yr <= this.endYear) {
        trendYears.push(yr);
        trendTemps.push(temp);
      }
    }

    if (trendYears.length >= 2) {
      const regression = Statistics.linearRegression(trendYears, trendTemps);

      // Draw the regression line across the full visible range
      stroke(255, 140, 0);
      strokeWeight(2);
      const startTemp = regression.predict(this.startYear);
      const endTemp = regression.predict(this.endYear);
      line(
        this.mapYearToWidth(this.startYear),
        this.mapTemperatureToHeight(startTemp),
        this.mapYearToWidth(this.endYear),
        this.mapTemperatureToHeight(endTemp),
      );

      // Show trend info label
      fill(255, 140, 0);
      noStroke();
      textAlign(RIGHT, TOP);
      textSize(11);
      text(
        `Trend: ${regression.slope > 0 ? "+" : ""}${regression.slope.toFixed(4)}\u00B0C/year  R\u00B2=${regression.rSquared.toFixed(3)}`,
        this.layout.rightMargin,
        this.layout.topMargin + 5,
      );
      // R² explanation annotation
      fill(150);
      textSize(9);
      text(
        "(R\u00B2 closer to 1 = stronger linear trend)",
        this.layout.rightMargin,
        this.layout.topMargin + 19,
      );
    }
  };

  this.mapYearToWidth = function (value) {
    return map(
      value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin, // Draw left-to-right from margin.
      this.layout.rightMargin,
    );
  };

  this.mapTemperatureToHeight = function (value) {
    return map(
      value,
      this.minTemperature,
      this.maxTemperature,
      this.layout.bottomMargin, // Lower temperature at bottom.
      this.layout.topMargin,
    ); // Higher temperature at top.
  };

  this.mapTemperatureToColour = function (value) {
    var red = map(value, this.minTemperature, this.maxTemperature, 0, 255);
    var blue = 255 - red;
    return color(red, 0, blue, 100);
  };

  // Draw custom range slider
  this.drawRangeSlider = function () {
    const s = this.slider;

    // Calculate handle positions
    const startX = map(
      s.startValue,
      s.minValue,
      s.maxValue,
      s.x,
      s.x + s.width,
    );
    const endX = map(s.endValue, s.minValue, s.maxValue, s.x, s.x + s.width);

    push();

    // Draw label text
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    text("Year Range", s.x, s.y);

    // Draw track background (full width)
    fill(s.trackColor);
    noStroke();
    rect(s.x, s.trackY, s.width, s.trackHeight, s.trackHeight / 2);

    // Draw active range (blue bar between handles)
    fill(s.color);
    rect(startX, s.trackY, endX - startX, s.trackHeight, s.trackHeight / 2);

    // Draw start handle
    fill(s.handleColor);
    stroke(s.color);
    strokeWeight(3);
    ellipse(
      startX,
      s.trackY + s.trackHeight / 2,
      s.handleRadius * 2,
      s.handleRadius * 2,
    );

    // Draw end handle
    ellipse(
      endX,
      s.trackY + s.trackHeight / 2,
      s.handleRadius * 2,
      s.handleRadius * 2,
    );

    pop();
  };

  // Handle slider mouse interaction
  this.handleSliderInteraction = function () {
    const s = this.slider;
    const startX = map(
      s.startValue,
      s.minValue,
      s.maxValue,
      s.x,
      s.x + s.width,
    );
    const endX = map(s.endValue, s.minValue, s.maxValue, s.x, s.x + s.width);
    const handleY = s.trackY + s.trackHeight / 2;

    // Check if mouse is pressed
    if (mouseIsPressed) {
      // Check if clicking on start handle
      if (
        !s.draggingEnd &&
        dist(mouseX, mouseY, startX, handleY) < s.handleRadius
      ) {
        s.draggingStart = true;
      }
      // Check if clicking on end handle
      if (
        !s.draggingStart &&
        dist(mouseX, mouseY, endX, handleY) < s.handleRadius
      ) {
        s.draggingEnd = true;
      }

      // Drag start handle
      if (s.draggingStart) {
        const newValue = constrain(
          map(mouseX, s.x, s.x + s.width, s.minValue, s.maxValue),
          s.minValue,
          s.endValue - 1,
        );
        s.startValue = newValue;
      }

      // Drag end handle
      if (s.draggingEnd) {
        const newValue = constrain(
          map(mouseX, s.x, s.x + s.width, s.minValue, s.maxValue),
          s.startValue + 1,
          s.maxValue,
        );
        s.endValue = newValue;
      }
    } else {
      // Release handles when mouse is released
      s.draggingStart = false;
      s.draggingEnd = false;
    }
  };
  //my code ends here
}
