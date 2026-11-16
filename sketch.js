// Global variable to store the gallery object. The gallery object is
// a container for all the visualisations.
var gallery;

function setup() {
  // Create a canvas to fill the content div from index.html.
  canvasContainer = select("#app");
  var c = createCanvas(1024, 576);
  c.parent("app");

  // Create a new gallery object.
  gallery = new Gallery();

  // Add the visualisation objects here.
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());
  //my code starts here
  gallery.addVisual(new Histogram());
  gallery.addVisual(new BoxPlot());
  gallery.addVisual(new TransportMode());

  // Export canvas as image button — persistent across all visualizations
  const exportBtn = createButton("Export as PNG");
  exportBtn.parent("app");
  exportBtn.style("margin-top", "10px");
  exportBtn.style("padding", "8px 16px");
  exportBtn.style("font-size", "13px");
  exportBtn.style("cursor", "pointer");
  exportBtn.mousePressed(() => {
    const visName = gallery.selectedVisual
      ? gallery.selectedVisual.id
      : "canvas";
    saveCanvas(visName + ".png");
  });
  //my code ends here
}

function draw() {
  background(255);
  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
}
