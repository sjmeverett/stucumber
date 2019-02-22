const peg = require('pegjs');

module.exports.process = function process(src) {
  const out = peg.generate(src, {
    output: 'source'
  });

  return 'module.exports = ' + out;
};
