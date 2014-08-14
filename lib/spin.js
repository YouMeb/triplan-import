'usr strict';

// ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏

module.exports = function *(spin) {
  var len = spin.length; 
  var index = 0;

  while (1) {
    yield spin[index++];
    if (index >= len) {
      index = 0;
    }
  }
};
