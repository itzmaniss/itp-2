function TechDiversityRace() {

  // Name for the visualisation to appear in the menu bar.
  this.name = 'Tech Diversity: Race';

  // Each visualisation must have a unique ID with no special
  // characters.
  this.id = 'tech-diversity-race';

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Preload the data. This function is called automatically by the
  // gallery when a visualisation is added.
  this.preload = function() {
    var self = this;
    this.data = loadTable(
      './data/tech-diversity/race-2018.csv', 'csv', 'header',
      // Callback function to set the value
      // this.loaded to true.
      function(table) {
        self.loaded = true;
      });
  };

  this.setup = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    // Create a select DOM element.
    this.select = createSelect();
    this.select.position(350, 40);

    // Fill the options with all company names.
    var companies = this.data.columns;
    // First entry is empty.
    for (let i = 1; i < companies.length; i++) {
      this.select.option(companies[i]);
    }

    //my code starts here
    // Animation properties — smooth reveal on render and company switch
    this.animationProgress = 0;
    this.animationSpeed = 0.04;
    this.lastCompany = this.select.value();
    //my code ends here
  };

  this.destroy = function() {
    this.select.remove();
  };

  // Create a new pie chart object.
  this.pie = new PieChart(width / 2, height / 2, width * 0.4);

  this.draw = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    // Get the value of the company we're interested in from the
    // select item.
    var companyName = this.select.value();

    //my code starts here
    // Reset animation when company changes
    if (companyName !== this.lastCompany) {
      this.animationProgress = 0;
      this.lastCompany = companyName;
    }

    // Ease animation progress towards 1 (decelerating curve)
    if (this.animationProgress < 1) {
      this.animationProgress += this.animationSpeed * (1 - this.animationProgress + 0.05);
      this.animationProgress = Math.min(this.animationProgress, 1);
    }
    //my code ends here

    // Get the column of raw data for companyName.
    var col = this.data.getColumn(companyName);

    // Convert all data strings to numbers.
    col = stringsToNumbers(col);

    // Copy the row labels from the table (the first item of each row).
    var labels = this.data.getColumn(0);

    // Colour to use for each category.
    var colours = ['blue', 'red', 'green', 'pink', 'purple', 'yellow'];

    // Make a title.
    var title = 'Employee diversity at ' + companyName;

    //my code starts here
    // Draw the pie chart with animated sweep angle
    this.pie.draw(col, labels, colours, title, this.animationProgress);
    //my code ends here
  };
}
