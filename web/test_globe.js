const d3 = require('d3-geo');

function test(lat, lon) {
  const projection = d3.geoOrthographic()
    .rotate([-lon, -lat, 0])
    .scale(298)
    .translate([300, 300])
    .clipAngle(90);
  const path = d3.geoPath(projection);
  const outline = { type: 'Sphere' };
  const graticule = d3.geoGraticule()();
  console.log(`lat=${lat} lon=${lon}`);
  console.log('outline:', path(outline));
  console.log('graticule:', path(graticule));
  console.log('---');
}

test(-34.6037, -58.3816); // Buenos Aires
test(48.8566, 2.3522);    // Paris
test(55.7558, 37.6173);   // Moscow
test(35.6762, 139.6503);  // Tokyo
