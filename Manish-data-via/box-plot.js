//my code starts here
/**
 * @fileoverview Box Plot visualization for the gallery
 * Displays statistical distribution using five-number summary with
 * multi-dataset support and side-by-side comparison mode
 */

function BoxPlot() {
  // Name for the visualisation to appear in the menu bar.
  this.name = "Box Plot";

  // Each visualisation must have a unique ID with no special characters.
  this.id = "box-plot";

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Data and visualization properties
  this.numericData = [];
  this.stats = null;
  this.outliersList = [];

  // Comparison data
  this.comparisonNumericData = null;
  this.comparisonStats = null;
  this.comparisonOutliersList = [];
  this.comparison = null;

  // Track current state
  this.currentDataset = "Temperature Anomalies";
  this.comparisonDataset = null;

  // Dataset configurations for multi-dataset support
  this.datasets = {
    "Temperature Anomalies": {
      path: "./data/surface-temperature/surface-temperature.csv",
      column: "temperature",
      label: "Temperature (\u00B0C)",
      table: null,
      loaded: false,
    },
    "Pay Gap (%)": {
      path: "./data/pay-gap/all-employees-hourly-pay-by-gender-1997-2017.csv",
      column: "pay_gap",
      label: "Pay Gap (%)",
      table: null,
      loaded: false,
    },
    "Tech Gender: Female %": {
      path: "./data/tech-diversity/gender-2018.csv",
      column: "female",
      label: "Female (%)",
      table: null,
      loaded: false,
    },
    "Occupation Pay Gap": {
      path: "./data/pay-gap/occupation-hourly-pay-by-gender-2017.csv",
      column: "pay_gap",
      label: "Pay Gap (%)",
      table: null,
      loaded: false,
    },
  };

  // Layout properties
  const marginSize = 35;
  this.layout = {
    marginSize: marginSize,
    leftMargin: marginSize * 3,
    rightMargin: width - marginSize * 3,
    topMargin: marginSize * 3.5,
    bottomMargin: height - marginSize * 2,
    pad: 5,

    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },

    plotHeight: function () {
      return this.bottomMargin - this.topMargin;
    },
  };

  // Box plot dimensions
  this.boxWidth = 80;
  this.comparisonBoxWidth = 60;

  // Colors
  this.boxColor = color(150, 200, 150);
  this.boxColorCompare = color(200, 150, 150);
  this.medianColor = color(200, 50, 50);
  this.outlierColor = color(255, 100, 100);
  this.whiskerColor = color(0);

  // Preload all datasets
  this.preload = function () {
    const self = this;
    const datasetNames = Object.keys(this.datasets);

    datasetNames.forEach((name) => {
      const ds = self.datasets[name];
      ds.table = loadTable(ds.path, "csv", "header", () => {
        ds.loaded = true;
        const allLoaded = datasetNames.every((n) => self.datasets[n].loaded);
        if (allLoaded) {
          self.loaded = true;
        }
      });
    });
  };

  // Setup function called when visualization is selected
  this.setup = function () {
    // Get canvas position for absolute DOM positioning
    const canvasPos = select("canvas").position();

    // Create main control panel
    this.controlPanel = new ControlPanel(
      canvasPos.x + this.layout.leftMargin,
      canvasPos.y + 5,
      350
    );

    const datasetNames = Object.keys(this.datasets);
    this.datasetDropdown = this.controlPanel.addDropdown(
      "Dataset",
      datasetNames,
      this.currentDataset
    );

    // Create comparison control panel
    this.comparisonPanel = new ControlPanel(
      canvasPos.x + this.layout.leftMargin + 380,
      canvasPos.y + 5,
      300
    );
    this.compareDropdown = this.comparisonPanel.addDropdown(
      "Compare With",
      ["None", ...datasetNames],
      "None"
    );

    // Wire up dataset change events
    const self = this;
    this.datasetDropdown.onChange(() => {
      self.currentDataset = self.datasetDropdown.getValue();
      self.updateData();
    });

    this.compareDropdown.onChange(() => {
      const val = self.compareDropdown.getValue();
      self.comparisonDataset = val === "None" ? null : val;
      self.updateData();
    });

    // Initial data extraction
    this.updateData();

    textSize(12);
  };

  // Extract data and compute stats for current selection
  this.updateData = function () {
    const ds = this.datasets[this.currentDataset];
    this.numericData = ds.table
      .getColumn(ds.column)
      .map(Number)
      .filter((n) => !isNaN(n));

    this.stats = Statistics.summary(this.numericData);
    this.outliersList = Statistics.outliers(this.numericData);

    // Check if comparison is active
    if (this.comparisonDataset && this.comparisonDataset !== this.currentDataset) {
      const cds = this.datasets[this.comparisonDataset];
      this.comparisonNumericData = cds.table
        .getColumn(cds.column)
        .map(Number)
        .filter((n) => !isNaN(n));

      this.comparisonStats = Statistics.summary(this.comparisonNumericData);
      this.comparisonOutliersList = Statistics.outliers(this.comparisonNumericData);
      this.comparison = Statistics.compare(this.numericData, this.comparisonNumericData);
    } else {
      this.comparisonNumericData = null;
      this.comparisonStats = null;
      this.comparisonOutliersList = [];
      this.comparison = null;
    }

    // Compute display range that encompasses both datasets
    const allMin = this.comparisonStats
      ? Math.min(this.stats.min, this.comparisonStats.min)
      : this.stats.min;
    const allMax = this.comparisonStats
      ? Math.max(this.stats.max, this.comparisonStats.max)
      : this.stats.max;
    const dataRange = allMax - allMin;
    const padding = dataRange * 0.15;
    this.displayMin = allMin - padding;
    this.displayMax = allMax + padding;
  };

  // Destroy function to clean up when switching visualizations
  this.destroy = function () {
    if (this.controlPanel) {
      this.controlPanel.destroy();
    }
    if (this.comparisonPanel) {
      this.comparisonPanel.destroy();
    }
  };

  // Draw the box plot
  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Draw control panel labels
    this.controlPanel.draw();
    this.comparisonPanel.draw();

    // Draw title
    this.drawTitle();

    // Draw axis
    this.drawAxis();

    // Draw box plot(s)
    this.drawBoxPlot();

    // Draw statistics panel
    this.drawStatsPanel();

    // Draw component guide annotation
    this.drawGuide();
  };

  // Draw the title
  this.drawTitle = function () {
    fill(0);
    noStroke();
    textAlign("center", "center");
    textSize(16);

    let title = `${this.currentDataset} Distribution (Box Plot)`;
    if (this.comparisonDataset) {
      title = `${this.currentDataset} vs ${this.comparisonDataset}`;
    }
    text(title, width / 2, this.layout.topMargin - 15);
  };

  // Draw axis
  this.drawAxis = function () {
    stroke(0);
    strokeWeight(1);

    // Y-axis
    line(
      this.layout.leftMargin,
      this.layout.topMargin,
      this.layout.leftMargin,
      this.layout.bottomMargin
    );

    // Draw y-axis tick labels
    this.drawYTickLabels();

    // Y-axis label — use current dataset's label
    const yLabel = this.comparisonStats
      ? "Value"
      : this.datasets[this.currentDataset].label;

    fill(0);
    noStroke();
    textSize(14);
    push();
    translate(
      this.layout.marginSize / 2,
      this.layout.topMargin + this.layout.plotHeight() / 2
    );
    rotate(-PI / 2);
    textAlign("center", "center");
    text(yLabel, 0, 0);
    pop();
  };

  // Draw Y-axis tick labels
  this.drawYTickLabels = function () {
    const numTicks = 8;

    fill(0);
    noStroke();
    textAlign("right", "center");
    textSize(10);

    for (let i = 0; i <= numTicks; i++) {
      const value = map(i, 0, numTicks, this.displayMin, this.displayMax);
      const y = map(
        i,
        0,
        numTicks,
        this.layout.bottomMargin,
        this.layout.topMargin
      );

      text(value.toFixed(2), this.layout.leftMargin - 10, y);

      // Draw tick mark
      stroke(0);
      strokeWeight(1);
      line(this.layout.leftMargin - 5, y, this.layout.leftMargin, y);
    }
  };

  // Map data value to y coordinate
  this.mapValueToY = function (value) {
    return map(
      value,
      this.displayMin,
      this.displayMax,
      this.layout.bottomMargin,
      this.layout.topMargin
    );
  };

  // Draw box plot(s) — single or side-by-side comparison
  this.drawBoxPlot = function () {
    if (this.comparisonStats) {
      // Side-by-side: divide plot into thirds
      const third = this.layout.plotWidth() / 3;
      const centerX1 = this.layout.leftMargin + third;
      const centerX2 = this.layout.leftMargin + third * 2;

      this.drawSingleBoxPlot(
        centerX1,
        this.stats,
        this.numericData,
        this.outliersList,
        this.boxColor,
        this.currentDataset
      );
      this.drawSingleBoxPlot(
        centerX2,
        this.comparisonStats,
        this.comparisonNumericData,
        this.comparisonOutliersList,
        this.boxColorCompare,
        this.comparisonDataset
      );
    } else {
      // Single centered box plot
      const centerX = this.layout.leftMargin + this.layout.plotWidth() / 2;
      this.drawSingleBoxPlot(
        centerX,
        this.stats,
        this.numericData,
        this.outliersList,
        this.boxColor,
        this.currentDataset
      );
    }
  };

  // Draw a single box plot at the given center position
  this.drawSingleBoxPlot = function (centerX, stats, numericData, outliersList, boxCol, datasetName) {
    const bw = this.comparisonStats ? this.comparisonBoxWidth : this.boxWidth;

    // Calculate y positions for box plot components
    const q1Y = this.mapValueToY(stats.q1);
    const medianY = this.mapValueToY(stats.median);
    const q3Y = this.mapValueToY(stats.q3);

    // Calculate whisker bounds (excluding outliers)
    const lowerWhiskerBound = stats.q1 - 1.5 * stats.iqr;
    const upperWhiskerBound = stats.q3 + 1.5 * stats.iqr;

    // Find actual whisker endpoints (closest data points within bounds)
    let lowerWhiskerValue = stats.min;
    let upperWhiskerValue = stats.max;

    for (let i = 0; i < numericData.length; i++) {
      const value = numericData[i];
      if (value >= lowerWhiskerBound && value < stats.q1) {
        lowerWhiskerValue = Math.max(lowerWhiskerValue, value);
      }
      if (value <= upperWhiskerBound && value > stats.q3) {
        upperWhiskerValue = Math.min(upperWhiskerValue, value);
      }
    }

    const lowerWhiskerY = this.mapValueToY(lowerWhiskerValue);
    const upperWhiskerY = this.mapValueToY(upperWhiskerValue);

    // Draw lower whisker
    stroke(this.whiskerColor);
    strokeWeight(1);
    line(centerX, lowerWhiskerY, centerX, q1Y);
    line(centerX - bw / 4, lowerWhiskerY, centerX + bw / 4, lowerWhiskerY);

    // Draw upper whisker
    line(centerX, q3Y, centerX, upperWhiskerY);
    line(centerX - bw / 4, upperWhiskerY, centerX + bw / 4, upperWhiskerY);

    // Draw box (Q1 to Q3)
    fill(boxCol);
    stroke(0);
    strokeWeight(2);
    const boxHeight = q1Y - q3Y;
    rect(centerX - bw / 2, q3Y, bw, boxHeight);

    // Draw median line
    stroke(this.medianColor);
    strokeWeight(3);
    line(centerX - bw / 2, medianY, centerX + bw / 2, medianY);

    // Draw mean marker (small circle)
    const meanY = this.mapValueToY(stats.mean);
    fill(50, 50, 200);
    noStroke();
    ellipse(centerX, meanY, 8, 8);

    // Draw outliers
    fill(this.outlierColor);
    noStroke();
    for (let i = 0; i < outliersList.length; i++) {
      const outlierY = this.mapValueToY(outliersList[i]);
      ellipse(centerX, outlierY, 6, 6);
    }

    // Draw labels on the box plot
    this.drawBoxPlotLabels(
      centerX,
      stats,
      bw,
      q1Y,
      medianY,
      q3Y,
      meanY,
      lowerWhiskerY,
      upperWhiskerY,
      lowerWhiskerValue,
      upperWhiskerValue
    );

    // Draw dataset name below the box
    fill(0);
    noStroke();
    textAlign("center", "top");
    textSize(10);
    text(datasetName, centerX, this.layout.bottomMargin + 10);
  };

  // Draw labels on a box plot
  this.drawBoxPlotLabels = function (
    centerX,
    stats,
    bw,
    q1Y,
    medianY,
    q3Y,
    meanY,
    lowerWhiskerY,
    upperWhiskerY,
    lowerWhiskerVal,
    upperWhiskerVal
  ) {
    const labelOffset = bw / 2 + 10;
    const minSpacing = 15;

    // Collect all label positions and data
    const labels = [
      { y: upperWhiskerY, text: `Upper: ${upperWhiskerVal.toFixed(3)}`, color: [100, 100, 100] },
      { y: q3Y, text: `Q3: ${stats.q3.toFixed(3)}`, color: [0, 0, 0] },
      { y: meanY, text: `Mean: ${stats.mean.toFixed(3)}`, color: [50, 50, 200] },
      { y: medianY, text: `Median: ${stats.median.toFixed(3)}`, color: [200, 50, 50] },
      { y: q1Y, text: `Q1: ${stats.q1.toFixed(3)}`, color: [0, 0, 0] },
      { y: lowerWhiskerY, text: `Lower: ${lowerWhiskerVal.toFixed(3)}`, color: [100, 100, 100] },
    ];

    // Adjust overlapping labels
    for (let i = 0; i < labels.length - 1; i++) {
      if (Math.abs(labels[i].y - labels[i + 1].y) < minSpacing) {
        const midpoint = (labels[i].y + labels[i + 1].y) / 2;
        labels[i].y = midpoint - minSpacing / 2;
        labels[i + 1].y = midpoint + minSpacing / 2;
      }
    }

    // Draw labels
    noStroke();
    textAlign("left", "center");
    textSize(9);

    for (let i = 0; i < labels.length; i++) {
      fill(labels[i].color[0], labels[i].color[1], labels[i].color[2]);
      text(labels[i].text, centerX + labelOffset, labels[i].y);
    }
  };

  // Draw statistics panel — delegates to single or comparison mode
  this.drawStatsPanel = function () {
    if (this.comparison) {
      this.drawComparisonStatsPanel();
    } else {
      this.drawSingleStatsPanel();
    }
  };

  // Draw stats panel for a single dataset
  this.drawSingleStatsPanel = function () {
    const panelX = this.layout.leftMargin + 20;
    const panelY = this.layout.topMargin;
    const panelWidth = 140;
    const panelHeight = 160;

    // Background
    fill(255, 255, 255, 230);
    stroke(0);
    strokeWeight(1);
    rect(panelX, panelY, panelWidth, panelHeight, 5);

    // Title
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);
    const textX = panelX + 10;
    const textY = panelY + 10;

    text("Statistics:", textX, textY);

    textSize(10);
    const lineHeight = 14;

    text(`Count: ${this.stats.count}`, textX, textY + lineHeight * 1.5);
    text(`Min: ${this.stats.min.toFixed(3)}`, textX, textY + lineHeight * 2.5);
    text(`Q1: ${this.stats.q1.toFixed(3)}`, textX, textY + lineHeight * 3.5);
    text(`Median: ${this.stats.median.toFixed(3)}`, textX, textY + lineHeight * 4.5);
    text(`Q3: ${this.stats.q3.toFixed(3)}`, textX, textY + lineHeight * 5.5);
    text(`Max: ${this.stats.max.toFixed(3)}`, textX, textY + lineHeight * 6.5);
    text(`Mean: ${this.stats.mean.toFixed(3)}`, textX, textY + lineHeight * 7.5);
    text(`IQR: ${this.stats.iqr.toFixed(3)}`, textX, textY + lineHeight * 8.5);
    text(`Std Dev: ${this.stats.stdDev.toFixed(3)}`, textX, textY + lineHeight * 9.5);
    text(`Outliers: ${this.outliersList.length}`, textX, textY + lineHeight * 10.5);
  };

  // Draw stats panel for comparison mode
  this.drawComparisonStatsPanel = function () {
    const panelX = this.layout.leftMargin + 10;
    const panelY = this.layout.topMargin;
    const panelWidth = 270;
    const panelHeight = 180;

    // Background
    fill(255, 255, 255, 230);
    stroke(0);
    strokeWeight(1);
    rect(panelX, panelY, panelWidth, panelHeight, 5);

    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    const textX = panelX + 10;
    const textY = panelY + 10;
    const lineHeight = 13;
    const col2X = textX + 90;
    const col3X = textX + 170;

    // Column headers
    textSize(10);
    fill(red(this.boxColor), green(this.boxColor), blue(this.boxColor));
    text("Primary", col2X, textY);
    fill(red(this.boxColorCompare), green(this.boxColorCompare), blue(this.boxColorCompare));
    text("Compare", col3X, textY);

    fill(0);
    textSize(9);

    const rows = [
      ["Count", this.stats.count, this.comparisonStats.count],
      ["Mean", this.stats.mean.toFixed(3), this.comparisonStats.mean.toFixed(3)],
      ["Median", this.stats.median.toFixed(3), this.comparisonStats.median.toFixed(3)],
      ["Q1", this.stats.q1.toFixed(3), this.comparisonStats.q1.toFixed(3)],
      ["Q3", this.stats.q3.toFixed(3), this.comparisonStats.q3.toFixed(3)],
      ["IQR", this.stats.iqr.toFixed(3), this.comparisonStats.iqr.toFixed(3)],
      ["Std Dev", this.stats.stdDev.toFixed(3), this.comparisonStats.stdDev.toFixed(3)],
      ["Min", this.stats.min.toFixed(3), this.comparisonStats.min.toFixed(3)],
      ["Max", this.stats.max.toFixed(3), this.comparisonStats.max.toFixed(3)],
    ];

    for (let i = 0; i < rows.length; i++) {
      const rowY = textY + lineHeight * (i + 1.5);
      fill(0);
      text(`${rows[i][0]}:`, textX, rowY);
      text(rows[i][1], col2X, rowY);
      text(rows[i][2], col3X, rowY);
    }

    // Difference summary at bottom
    const diffY = textY + lineHeight * (rows.length + 2);
    fill(80);
    textSize(9);
    text(
      `Mean diff: ${this.comparison.meanDiff.toFixed(3)} (${this.comparison.meanDiffPct.toFixed(1)}%)`,
      textX,
      diffY
    );
    text(
      `Median diff: ${this.comparison.medianDiff.toFixed(3)} (${this.comparison.medianDiffPct.toFixed(1)}%)`,
      textX,
      diffY + lineHeight
    );
  };
  // Draw a guide explaining box plot components
  this.drawGuide = function () {
    const guideX = this.layout.rightMargin - 250;
    const guideY = this.layout.bottomMargin + 25;

    fill(80);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(9);

    text("Guide:", guideX, guideY);
    text("Box = IQR (Q1\u2013Q3)  |  Red line = Median  |  Blue dot = Mean", guideX, guideY + 12);
    text("Whiskers = \u00B11.5\u00D7IQR from box edges  |  Red circles = Outliers", guideX, guideY + 24);
  };
}
//my code ends here
