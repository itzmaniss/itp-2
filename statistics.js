//my code starts here

/**
 * @fileoverview Statistics Module - Basic statistical functions for data analysis
 * Provides essential statistical calculations for visualizations
 */

var Statistics = (function () {
  /**
   * Calculate the mean (average) of an array of numbers
   * @param {number[]} data - Array of numerical values
   * @returns {number} Mean value
   */
  function mean(data) {
    if (!data || data.length === 0) return 0;
    var sum = data.reduce(function (acc, val) {
      return acc + val;
    }, 0);
    return sum / data.length;
  }

  /**
   * Calculate the median (middle value) of an array of numbers
   * @param {number[]} data - Array of numerical values
   * @returns {number} Median value
   */
  function median(data) {
    if (!data || data.length === 0) return 0;

    var sorted = data.slice().sort(function (a, b) {
      return a - b;
    });

    var mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Calculate the mode (most frequent value) of an array of numbers
   * @param {number[]} data - Array of numerical values
   * @returns {number} Mode value (returns first mode if multiple exist)
   */
  function mode(data) {
    if (!data || data.length === 0) return 0;

    var frequency = {};
    var maxFreq = 0;
    var modeValue = data[0];

    for (var i = 0; i < data.length; i++) {
      var value = data[i];
      frequency[value] = (frequency[value] || 0) + 1;

      if (frequency[value] > maxFreq) {
        maxFreq = frequency[value];
        modeValue = value;
      }
    }

    return modeValue;
  }

  /**
   * Calculate the minimum value in an array
   * @param {number[]} data - Array of numerical values
   * @returns {number} Minimum value
   */
  function min(data) {
    if (!data || data.length === 0) return 0;
    return Math.min.apply(null, data);
  }

  /**
   * Calculate the maximum value in an array
   * @param {number[]} data - Array of numerical values
   * @returns {number} Maximum value
   */
  function max(data) {
    if (!data || data.length === 0) return 0;
    return Math.max.apply(null, data);
  }

  /**
   * Calculate the range (max - min) of an array
   * @param {number[]} data - Array of numerical values
   * @returns {number} Range value
   */
  function range(data) {
    if (!data || data.length === 0) return 0;
    return max(data) - min(data);
  }

  /**
   * Calculate a specific percentile of the data
   * @param {number[]} data - Array of numerical values
   * @param {number} p - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  function percentile(data, p) {
    if (!data || data.length === 0) return 0;
    if (p < 0 || p > 100) return 0;

    var sorted = data.slice().sort(function (a, b) {
      return a - b;
    });

    var index = (p / 100) * (sorted.length - 1);
    var lower = Math.floor(index);
    var upper = Math.ceil(index);
    var weight = index % 1;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate the first quartile (Q1 - 25th percentile)
   * @param {number[]} data - Array of numerical values
   * @returns {number} Q1 value
   */
  function quartile1(data) {
    return percentile(data, 25);
  }

  /**
   * Calculate the third quartile (Q3 - 75th percentile)
   * @param {number[]} data - Array of numerical values
   * @returns {number} Q3 value
   */
  function quartile3(data) {
    return percentile(data, 75);
  }

  /**
   * Calculate the interquartile range (IQR = Q3 - Q1)
   * @param {number[]} data - Array of numerical values
   * @returns {number} IQR value
   */
  function iqr(data) {
    return quartile3(data) - quartile1(data);
  }

  /**
   * Calculate the variance of an array of numbers
   * @param {number[]} data - Array of numerical values
   * @returns {number} Variance value
   */
  function variance(data) {
    if (!data || data.length === 0) return 0;

    var avg = mean(data);
    var squareDiffs = data.map(function (value) {
      var diff = value - avg;
      return diff * diff;
    });

    return mean(squareDiffs);
  }

  /**
   * Calculate the standard deviation of an array of numbers
   * @param {number[]} data - Array of numerical values
   * @returns {number} Standard deviation value
   */
  function standardDeviation(data) {
    return Math.sqrt(variance(data));
  }

  /**
   * Calculate summary statistics for a dataset
   * @param {number[]} data - Array of numerical values
   * @returns {Object} Object containing multiple statistical measures
   */
  function summary(data) {
    return {
      count: data.length,
      min: min(data),
      q1: quartile1(data),
      median: median(data),
      q3: quartile3(data),
      max: max(data),
      mean: mean(data),
      mode: mode(data),
      range: range(data),
      iqr: iqr(data),
      variance: variance(data),
      stdDev: standardDeviation(data),
    };
  }

  /**
   * Identify outliers using the IQR method
   * @param {number[]} data - Array of numerical values
   * @returns {number[]} Array of outlier values
   */
  function outliers(data) {
    if (!data || data.length === 0) return [];

    var q1 = quartile1(data);
    var q3 = quartile3(data);
    var iqrValue = iqr(data);

    var lowerBound = q1 - 1.5 * iqrValue;
    var upperBound = q3 + 1.5 * iqrValue;

    return data.filter(function (value) {
      return value < lowerBound || value > upperBound;
    });
  }

  /**
   * Create frequency distribution for histogram
   * @param {number[]} data - Array of numerical values
   * @param {number} bins - Number of bins (default: auto-calculate)
   * @param {number} [rangeMin] - Optional minimum value for bin range (for aligning multiple histograms)
   * @param {number} [rangeMax] - Optional maximum value for bin range (for aligning multiple histograms)
   * @returns {Object} Object containing bin edges and frequencies
   */
  function histogram(data, bins, rangeMin, rangeMax) {
    if (!data || data.length === 0) {
      return { bins: [], frequencies: [], binWidth: 0 };
    }

    // Auto-calculate bins using Sturges' formula if not provided
    if (!bins) {
      bins = Math.ceil(Math.log2(data.length) + 1);
    }

    // Use provided range or compute from data
    const minVal = rangeMin !== undefined ? rangeMin : min(data);
    const maxVal = rangeMax !== undefined ? rangeMax : max(data);
    const binWidth = (maxVal - minVal) / bins;

    // Handle edge case where all values are the same
    if (binWidth === 0) {
      return {
        bins: [minVal],
        frequencies: [data.length],
        binWidth: 0,
      };
    }

    const frequencies = new Array(bins).fill(0);
    const binEdges = [];

    // Create bin edges
    for (let i = 0; i <= bins; i++) {
      binEdges.push(minVal + i * binWidth);
    }

    // Count frequencies (only count values within the range)
    for (let j = 0; j < data.length; j++) {
      const value = data[j];
      if (value < minVal || value > maxVal) continue;

      let binIndex = Math.floor((value - minVal) / binWidth);

      // Handle max value edge case
      if (binIndex >= bins) {
        binIndex = bins - 1;
      }

      frequencies[binIndex]++;
    }

    return {
      bins: binEdges,
      frequencies: frequencies,
      binWidth: binWidth,
    };
  }

  /**
   * Compare two datasets and return a comparison object
   * @param {number[]} data1 - First dataset
   * @param {number[]} data2 - Second dataset
   * @returns {Object} Object containing comparison metrics between the two datasets
   */
  function compare(data1, data2) {
    const summary1 = summary(data1);
    const summary2 = summary(data2);

    const safePct = (a, b) => b !== 0 ? ((a - b) / Math.abs(b)) * 100 : 0;

    return {
      dataset1: summary1,
      dataset2: summary2,
      meanDiff: summary1.mean - summary2.mean,
      meanDiffPct: safePct(summary1.mean, summary2.mean),
      medianDiff: summary1.median - summary2.median,
      medianDiffPct: safePct(summary1.median, summary2.median),
      stdDevDiff: summary1.stdDev - summary2.stdDev,
      rangeDiff: summary1.range - summary2.range,
      countDiff: summary1.count - summary2.count,
    };
  }

  /**
   * Perform simple linear regression on paired x,y data
   * Uses least-squares method to fit y = slope * x + intercept
   * @param {number[]} xData - Array of x values
   * @param {number[]} yData - Array of y values
   * @returns {Object} Object containing slope, intercept, rSquared, and predict function
   */
  function linearRegression(xData, yData) {
    if (!xData || !yData || xData.length === 0 || xData.length !== yData.length) {
      return { slope: 0, intercept: 0, rSquared: 0, predict: () => 0 };
    }

    const n = xData.length;
    const xMean = mean(xData);
    const yMean = mean(yData);

    // Calculate sums for least-squares formula
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = xData[i] - xMean;
      numerator += xDiff * (yData[i] - yMean);
      denominator += xDiff * xDiff;
    }

    // Handle zero-variance in x (vertical data)
    if (denominator === 0) {
      return { slope: 0, intercept: yMean, rSquared: 0, predict: () => yMean };
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared (coefficient of determination)
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * xData[i] + intercept;
      ssRes += (yData[i] - predicted) * (yData[i] - predicted);
      ssTot += (yData[i] - yMean) * (yData[i] - yMean);
    }

    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return {
      slope: slope,
      intercept: intercept,
      rSquared: rSquared,
      predict: (x) => slope * x + intercept,
    };
  }

  // Public API
  return {
    mean: mean,
    median: median,
    mode: mode,
    min: min,
    max: max,
    range: range,
    percentile: percentile,
    quartile1: quartile1,
    quartile3: quartile3,
    iqr: iqr,
    variance: variance,
    standardDeviation: standardDeviation,
    summary: summary,
    outliers: outliers,
    histogram: histogram,
    compare: compare,
    linearRegression: linearRegression,
  };
})();

// my code ends here
