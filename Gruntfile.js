module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n'
            },
            core: {
                src: [
                    'src/ssrtojson.js'
                ],
                dest: 'dist/ssrtojson.js'
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy HH:MM") %> */\n'
            },
            dist: {
                files: {
                    'dist/ssrtojson.min.js': ['<%= concat.core.dest %>']
                }
            }
        },
        build: {
            tasks: ['default'],
            gitAdd: 'package.json bower.json dist/*'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-bump-build-git');

    grunt.registerTask('default', ['concat', 'uglify']);
};
