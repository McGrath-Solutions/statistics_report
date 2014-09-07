module.exports = function(grunt) {
  grunt.loadNpmTasks("grunt-bower-task");
  grunt.loadNpmTasks("grunt-wiredep");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.initConfig({
    wiredep: {
      target: {
        src: [
          "views/*.jade"
        ],
        ignorePath: '../public'
      }
    },
    uglify: {
      publicJs: {
        options: {
          compress: {
            drop_console: true
          },
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'public/js/export.min.js': ['jssrc/export.js']
        }
      }
    }
  });

}
