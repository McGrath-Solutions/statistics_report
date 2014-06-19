module.exports = function(grunt) {
  grunt.loadNpmTasks("grunt-bower-task");
  grunt.loadNpmTasks("grunt-wiredep");
  grunt.initConfig({
    wiredep: {
      target: {
        src: [
          "views/*.jade"
        ],
        ignorePath: '../public'
      }
    }
  });

}