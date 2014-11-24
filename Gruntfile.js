module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n'
            },
            core: {
                src: [
                    'src/ssrjson.js'
                ],
                dest: 'dist/ssrjson.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy HH:MM") %> */\n'
            },
            dist: {
                files: {
                    'dist/ssrjson.min.js': ['<%= concat.core.dest %>']
                }
            }
        },
        build: {
            tasks: ['default'],
            gitAdd: '-all'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bump-build-git');

    grunt.registerTask('default', ['concat', 'uglify']);
};
