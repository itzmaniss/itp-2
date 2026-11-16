//my code starts here
/**
 * @fileoverview Control Panel - Reusable UI controls for visualizations
 * Provides labels, sliders, dropdowns, and other interactive elements
 */

/**
 * ControlPanel - Container for UI controls
 * @param {number} x - X position of the control panel
 * @param {number} y - Y position of the control panel
 * @param {number} width - Width of the control panel
 */
function ControlPanel(x, y, width) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.controls = [];
  this.currentY = y;
  this.padding = 10;
  this.controlSpacing = 50;

  // Add a label to the panel
  this.addLabel = function (text, size) {
    const label = new Label(this.x + this.padding, this.currentY, text, size);
    this.controls.push(label);
    this.currentY += size || 16;
    return label;
  };

  // Add a slider to the panel
  this.addSlider = function (label, min, max, defaultValue, step) {
    const slider = new SliderControl(
      this.x + this.padding,
      this.currentY,
      this.width - this.padding * 2,
      label,
      min,
      max,
      defaultValue,
      step,
    );
    this.controls.push(slider);
    this.currentY += this.controlSpacing;
    return slider;
  };

  // Add a dropdown to the panel
  this.addDropdown = function (label, options, defaultValue) {
    const dropdown = new DropdownControl(
      this.x + this.padding,
      this.currentY,
      this.width - this.padding * 2,
      label,
      options,
      defaultValue,
    );
    this.controls.push(dropdown);
    this.currentY += this.controlSpacing;
    return dropdown;
  };

  // Add a button to the panel
  this.addButton = function (label, callback) {
    const button = new ButtonControl(
      this.x + this.padding,
      this.currentY,
      this.width - this.padding * 2,
      30,
      label,
      callback,
    );
    this.controls.push(button);
    this.currentY += this.controlSpacing;
    return button;
  };

  // Add a checkbox to the panel
  this.addCheckbox = function (label, defaultValue) {
    const checkbox = new CheckboxControl(
      this.x + this.padding,
      this.currentY,
      label,
      defaultValue,
    );
    this.controls.push(checkbox);
    this.currentY += this.controlSpacing;
    return checkbox;
  };

  // Draw all controls
  this.draw = function () {
    for (let i = 0; i < this.controls.length; i++) {
      this.controls[i].draw();
    }
  };

  // Clean up all controls
  this.destroy = function () {
    for (let i = 0; i < this.controls.length; i++) {
      if (this.controls[i].destroy) {
        this.controls[i].destroy();
      }
    }
    this.controls = [];
  };
}

/**
 * Label - Simple text label
 */
function Label(x, y, text, size) {
  this.x = x;
  this.y = y;
  this.text = text;
  this.size = size || 14;

  this.draw = function () {
    push();
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(this.size);
    text(this.text, this.x, this.y);
    pop();
  };

  this.setText = function (newText) {
    this.text = newText;
  };
}

/**
 * SliderControl - Slider with label and value display
 */
function SliderControl(x, y, width, label, min, max, defaultValue, step) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.label = label;
  this.min = min;
  this.max = max;
  this.step = step || 1;

  // Create p5 slider
  this.slider = createSlider(min, max, defaultValue, this.step);
  this.slider.position(x, y + 20);
  this.slider.style("width", width + "px");

  this.draw = function () {
    push();
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);

    // Draw label and current value
    const currentValue = this.getValue();
    text(this.label + ": " + currentValue, this.x, this.y);
    pop();
  };

  this.getValue = function () {
    return this.slider.value();
  };

  this.setValue = function (value) {
    this.slider.value(value);
  };

  this.destroy = function () {
    this.slider.remove();
  };
}

/**
 * DropdownControl - Dropdown menu with label
 */
function DropdownControl(x, y, width, label, options, defaultValue) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.label = label;
  this.options = options;

  // Create p5 dropdown
  this.dropdown = createSelect();
  this.dropdown.position(x, y + 20);
  this.dropdown.style("width", width + "px");

  // Add options
  for (let i = 0; i < options.length; i++) {
    this.dropdown.option(options[i]);
  }

  // Set default value if provided
  if (defaultValue !== undefined) {
    this.dropdown.value(defaultValue);
  }

  this.draw = function () {
    push();
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);
    text(this.label + ":", this.x, this.y);
    pop();
  };

  this.getValue = function () {
    return this.dropdown.value();
  };

  this.setValue = function (value) {
    this.dropdown.value(value);
  };

  this.onChange = function (callback) {
    this.dropdown.changed(callback);
  };

  this.destroy = function () {
    this.dropdown.remove();
  };
}

/**
 * ButtonControl - Clickable button
 */
function ButtonControl(x, y, width, height, label, callback) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.label = label;
  this.callback = callback;

  // Create p5 button
  this.button = createButton(label);
  this.button.position(x, y);
  this.button.size(width, height);
  this.button.mousePressed(callback);

  this.draw = function () {
    // Button draws itself via DOM
  };

  this.destroy = function () {
    this.button.remove();
  };
}

/**
 * CheckboxControl - Checkbox with label
 */
function CheckboxControl(x, y, label, defaultValue) {
  this.x = x;
  this.y = y;
  this.label = label;

  // Create p5 checkbox
  this.checkbox = createCheckbox(label, defaultValue || false);
  this.checkbox.position(x, y);

  this.draw = function () {
    // Checkbox draws itself via DOM
  };

  this.getValue = function () {
    return this.checkbox.checked();
  };

  this.setValue = function (value) {
    this.checkbox.checked(value);
  };

  this.onChange = function (callback) {
    this.checkbox.changed(callback);
  };

  this.destroy = function () {
    this.checkbox.remove();
  };
}

/**
 * RangeSlider - Dual slider for selecting a range
 */
function RangeSlider(
  x,
  y,
  width,
  label,
  min,
  max,
  defaultMin,
  defaultMax,
  step,
) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.label = label;
  this.min = min;
  this.max = max;
  this.step = step || 1;

  // Create two p5 sliders
  this.minSlider = createSlider(min, max - step, defaultMin, this.step);
  this.minSlider.position(x, y + 20);
  this.minSlider.style("width", width + "px");

  this.maxSlider = createSlider(min + step, max, defaultMax, this.step);
  this.maxSlider.position(x, y + 45);
  this.maxSlider.style("width", width + "px");

  this.draw = function () {
    push();
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);

    // Draw label and current range
    const minValue = this.getMin();
    const maxValue = this.getMax();
    text(this.label + ": " + minValue + " - " + maxValue, this.x, this.y);
    pop();

    // Ensure min doesn't exceed max
    if (minValue >= maxValue) {
      this.minSlider.value(maxValue - this.step);
    }
    if (maxValue <= minValue) {
      this.maxSlider.value(minValue + this.step);
    }
  };

  this.getMin = function () {
    return this.minSlider.value();
  };

  this.getMax = function () {
    return this.maxSlider.value();
  };

  this.setMin = function (value) {
    this.minSlider.value(value);
  };

  this.setMax = function (value) {
    this.maxSlider.value(value);
  };

  this.getRange = function () {
    return {
      min: this.getMin(),
      max: this.getMax(),
    };
  };

  this.destroy = function () {
    this.minSlider.remove();
    this.maxSlider.remove();
  };
}
//my code ends here
