module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    peg: {
      gherkin: {
        src: 'src/parser.pegjs',
        dest: 'dist/parser.js'
      }
    },

    ts: {
      default: {
        tsconfig: { passThrough: true }
      }
    },

    clean: ['dist']
  });

  grunt.registerTask('default', ['peg', 'ts']);
};
