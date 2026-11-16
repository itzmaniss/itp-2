//my code starts here
/**
 * @fileoverview Histogram visualization for the gallery
 * Displays frequency distribution of numerical data with multi-dataset
 * support, dynamic binning controls, and comparison overlay mode
 */

function Histogram() {
  // Name for the visualisation to appear in the menu bar.
  this.name = "Histogram";

  // Each visualisation must have a unique ID with no special characters.
  this.id = "histogram";

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Data and visualization properties
  this.numericData = [];
  this.histogramData = null;
  this.stats = null;

  // Comparison data
  this.comparisonNumericData = null;
  this.comparisonHistogramData = null;
  this.comparisonStats = null;
  this.comparison = null;

  // Track current state
  this.currentDataset = "Temperature Anomalies";
  this.comparisonDataset = null;
  this.lastBinCount = 15;

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
  };

  // Colors for bars
  this.barColor = color(100, 150, 200);
  this.barColorCompare = color(200, 100, 100);
  this.hoverColor = color(255, 150, 100);

  // Preload all datasets
  this.preload = function () {
    const self = this;
    const datasetNames = Object.keys(this.datasets);

    datasetNames.forEach((name) => {
      const ds = self.datasets[name];
      ds.table = loadTable(ds.path, "csv", "header", () => {
        ds.loaded = true;
        // Set overall loaded flag when all datasets are loaded
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

    // Create main control panel (dataset + bins)
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
    this.binSlider = this.controlPanel.addSlider("Bins", 5, 50, 15, 1);

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
    this.lastBinCount = 15;
    this.updateData();

    textSize(12);
  };

  // Extract data and compute histogram + stats for current selection
  this.updateData = function () {
    const ds = this.datasets[this.currentDataset];
    this.numericData = ds.table
      .getColumn(ds.column)
      .map(Number)
      .filter((n) => !isNaN(n));

    const binCount = this.binSlider ? this.binSlider.getValue() : 15;

    // Check if comparison is active
    if (this.comparisonDataset && this.comparisonDataset !== this.currentDataset) {
      const cds = this.datasets[this.comparisonDataset];
      this.comparisonNumericData = cds.table
        .getColumn(cds.column)
        .map(Number)
        .filter((n) => !isNaN(n));

      // Compute shared range so both histograms align on the x-axis
      const sharedMin = Math.min(
        Statistics.min(this.numericData),
        Statistics.min(this.comparisonNumericData)
      );
      const sharedMax = Math.max(
        Statistics.max(this.numericData),
        Statistics.max(this.comparisonNumericData)
      );

      this.histogramData = Statistics.histogram(this.numericData, binCount, sharedMin, sharedMax);
      this.comparisonHistogramData = Statistics.histogram(
        this.comparisonNumericData,
        binCount,
        sharedMin,
        sharedMax
      );
      this.comparisonStats = Statistics.summary(this.comparisonNumericData);
      this.comparison = Statistics.compare(this.numericData, this.comparisonNumericData);
    } else {
      this.histogramData = Statistics.histogram(this.numericData, binCount);
      this.comparisonNumericData = null;
      this.comparisonHistogramData = null;
      this.comparisonStats = null;
      this.comparison = null;
    }

    this.stats = Statistics.summary(this.numericData);
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

  // Draw the histogram
  this.draw = function () {
    if (!this.loaded) {
      console.log("Data not yet loaded");
      return;
    }

    // Check if bin count has changed via slider
    const currentBins = this.binSlider.getValue();
    if (this.lastBinCount !== currentBins) {
      this.lastBinCount = currentBins;
      this.updateData();
    }

    // Draw control panel labels
    this.controlPanel.draw();
    this.comparisonPanel.draw();

    // Draw title
    this.drawTitle();

    // Draw axis labels
    this.drawAxisLabels();

    // Draw histogram bars
    this.drawBars();

    // Draw axes
    this.drawAxes();

    // Draw statistics panel
    this.drawStatsPanel();
  };

  // Draw the title
  this.drawTitle = function () {
    fill(0);
    noStroke();
    textAlign("center", "center");
    textSize(16);

    let title = `${this.currentDataset} Distribution`;
    if (this.comparisonDataset) {
      title += ` vs ${this.comparisonDataset}`;
    }
    text(title, width / 2, this.layout.topMargin - 15);
  };

  // Draw axis labels
  this.drawAxisLabels = function () {
    fill(0);
    noStroke();
    textSize(14);

    // X-axis label — use current dataset's label
    const xLabel = this.datasets[this.currentDataset].label;
    textAlign("center", "center");
    text(
      xLabel,
      this.layout.leftMargin + this.layout.plotWidth() / 2,
      this.layout.bottomMargin + this.layout.marginSize * 1.5
    );

    // Y-axis label
    push();
    translate(
      this.layout.marginSize / 2,
      this.layout.topMargin + this.layout.plotHeight() / 2
    );
    rotate(-PI / 2);
    text("Frequency", 0, 0);
    pop();
  };

  // Get the max frequency across primary and comparison datasets
  this.getMaxFrequency = function () {
    let maxFreq = Math.max(...this.histogramData.frequencies);
    if (this.comparisonHistogramData) {
      const compMax = Math.max(...this.comparisonHistogramData.frequencies);
      maxFreq = Math.max(maxFreq, compMax);
    }
    return maxFreq;
  };

  // Draw the histogram bars (primary + optional comparison overlay)
  this.drawBars = function () {
    let hoveredBar = null;

    // Draw primary dataset bars
    hoveredBar = this.drawDatasetBars(this.histogramData, this.barColor, true);

    // Draw comparison dataset bars with transparency
    if (this.comparisonHistogramData) {
      this.drawDatasetBars(this.comparisonHistogramData, this.barColorCompare, false);
    }

    // Draw tooltip on top of all bars
    if (hoveredBar) {
      this.drawTooltip(hoveredBar.x, hoveredBar.y, hoveredBar.index, hoveredBar.freq);
    }
  };

  // Draw bars for a single dataset
  this.drawDatasetBars = function (histData, barCol, isPrimary) {
    const numBins = histData.frequencies.length;
    const maxFreq = this.getMaxFrequency();
    const barWidth = this.layout.plotWidth() / numBins;
    let hoveredBar = null;

    for (let i = 0; i < numBins; i++) {
      const freq = histData.frequencies[i];
      const barHeight = map(freq, 0, maxFreq, 0, this.layout.plotHeight());
      const x = this.layout.leftMargin + i * barWidth;
      const y = this.layout.bottomMargin - barHeight;

      // Check hover only on primary dataset
      if (isPrimary) {
        const isHovered =
          mouseX >= x &&
          mouseX <= x + barWidth &&
          mouseY >= y &&
          mouseY <= this.layout.bottomMargin;

        if (isHovered) {
          fill(this.hoverColor);
          hoveredBar = { x, y, index: i, freq };
        } else {
          fill(red(barCol), green(barCol), blue(barCol), 160);
        }
      } else {
        fill(red(barCol), green(barCol), blue(barCol), 120);
      }

      stroke(255);
      strokeWeight(1);
      rect(x, y, barWidth - 2, barHeight);
    }

    return hoveredBar;
  };

  // Draw tooltip for a bar
  this.drawTooltip = function (x, y, binIndex, freq) {
    const binStart = this.histogramData.bins[binIndex];
    const binEnd = this.histogramData.bins[binIndex + 1];
    const tooltipText = `Range: ${binStart.toFixed(2)} to ${binEnd.toFixed(2)}`;
    const tooltipText2 = `Count: ${freq}`;

    push();
    fill(255, 255, 255, 230);
    stroke(0);
    strokeWeight(1);

    const tooltipWidth = 160;
    const tooltipHeight = 45;
    const padding = 10;

    // Position tooltip near mouse cursor
    let tooltipX = mouseX + padding;
    let tooltipY = mouseY - tooltipHeight / 2;

    // Keep tooltip on screen
    if (tooltipX + tooltipWidth > width) {
      tooltipX = mouseX - tooltipWidth - padding;
    }
    if (tooltipY < this.layout.topMargin) {
      tooltipY = this.layout.topMargin + padding;
    }
    if (tooltipY + tooltipHeight > height) {
      tooltipY = height - tooltipHeight - padding;
    }

    rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);

    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(11);
    text(tooltipText, tooltipX + 5, tooltipY + 5);
    text(tooltipText2, tooltipX + 5, tooltipY + 23);
    pop();
  };

  // Draw axes
  this.drawAxes = function () {
    stroke(0);
    strokeWeight(1);

    // X-axis
    line(
      this.layout.leftMargin,
      this.layout.bottomMargin,
      this.layout.rightMargin,
      this.layout.bottomMargin
    );

    // Y-axis
    line(
      this.layout.leftMargin,
      this.layout.topMargin,
      this.layout.leftMargin,
      this.layout.bottomMargin
    );

    // Draw tick labels
    this.drawXTickLabels();
    this.drawYTickLabels();
  };

  // Draw X-axis tick labels
  this.drawXTickLabels = function () {
    const numTicks = 5;
    const minVal = this.histogramData.bins[0];
    const maxVal = this.histogramData.bins[this.histogramData.bins.length - 1];

    fill(0);
    noStroke();
    textAlign("center", "top");
    textSize(10);

    for (let i = 0; i <= numTicks; i++) {
      const value = map(i, 0, numTicks, minVal, maxVal);
      const x = map(
        i,
        0,
        numTicks,
        this.layout.leftMargin,
        this.layout.rightMargin
      );

      text(value.toFixed(2), x, this.layout.bottomMargin + 5);

      // Draw tick mark
      stroke(0);
      strokeWeight(1);
      line(x, this.layout.bottomMargin, x, this.layout.bottomMargin + 5);
    }
  };

  // Draw Y-axis tick labels
  this.drawYTickLabels = function () {
    const numTicks = 5;
    const maxFreq = this.getMaxFrequency();

    fill(0);
    noStroke();
    textAlign("right", "center");
    textSize(10);

    for (let i = 0; i <= numTicks; i++) {
      const value = Math.round(map(i, 0, numTicks, 0, maxFreq));
      const y = map(
        i,
        0,
        numTicks,
        this.layout.bottomMargin,
        this.layout.topMargin
      );

      text(value, this.layout.leftMargin - 10, y);

      // Draw tick mark
      stroke(0);
      strokeWeight(1);
      line(this.layout.leftMargin - 5, y, this.layout.leftMargin, y);
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
    const panelX = this.layout.rightMargin - 150;
    const panelY = this.layout.topMargin;
    const panelWidth = 140;
    const panelHeight = 140;

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
    text(`Mean: ${this.stats.mean.toFixed(3)}`, textX, textY + lineHeight * 2.5);
    text(`Median: ${this.stats.median.toFixed(3)}`, textX, textY + lineHeight * 3.5);
    text(`Mode: ${this.stats.mode.toFixed(3)}`, textX, textY + lineHeight * 4.5);
    text(`Std Dev: ${this.stats.stdDev.toFixed(3)}`, textX, textY + lineHeight * 5.5);
    text(`Min: ${this.stats.min.toFixed(3)}`, textX, textY + lineHeight * 6.5);
    text(`Max: ${this.stats.max.toFixed(3)}`, textX, textY + lineHeight * 7.5);
    text(`Range: ${this.stats.range.toFixed(3)}`, textX, textY + lineHeight * 8.5);
  };

  // Draw stats panel for comparison mode — shows both datasets + differences
  this.drawComparisonStatsPanel = function () {
    const panelX = this.layout.rightMargin - 280;
    const panelY = this.layout.topMargin;
    const panelWidth = 270;
    const panelHeight = 160;

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
    fill(red(this.barColor), green(this.barColor), blue(this.barColor));
    text("Primary", col2X, textY);
    fill(red(this.barColorCompare), green(this.barColorCompare), blue(this.barColorCompare));
    text("Compare", col3X, textY);

    fill(0);
    textSize(9);

    const rows = [
      ["Count", this.stats.count, this.comparisonStats.count],
      ["Mean", this.stats.mean.toFixed(3), this.comparisonStats.mean.toFixed(3)],
      ["Median", this.stats.median.toFixed(3), this.comparisonStats.median.toFixed(3)],
      ["Std Dev", this.stats.stdDev.toFixed(3), this.comparisonStats.stdDev.toFixed(3)],
      ["Min", this.stats.min.toFixed(3), this.comparisonStats.min.toFixed(3)],
      ["Max", this.stats.max.toFixed(3), this.comparisonStats.max.toFixed(3)],
      ["Range", this.stats.range.toFixed(3), this.comparisonStats.range.toFixed(3)],
    ];

    for (let i = 0; i < rows.length; i++) {
      const rowY = textY + lineHeight * (i + 1.5);
      fill(0);
      text(rows[i][0] + ":", textX, rowY);
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
}
//my code ends here
