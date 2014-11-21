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
        release: {
            options: {
                npm: false,
                bump: false,
                commitMessage: 'Release <%= version %>'
            }
        },
        bump: {
            options: {
                updateConfigs: ['pkg'],
                commit: false,
                createTag: false,
                push: false
            }
        },
        clean: {
            options: {
                clean: ["dist"]
            }
        },
        gitadd: {
            task: {
                files: {
                    src: ['dist/*']
                }
            }
        },
        gitcommit: {
            task: {
                options: {
                    message: 'Build for  <%= version %>',
                    noVerify: true,
                    noStatus: false
                },
                files: {
                    src: ['dist/*']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-sync-pkg');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-git');

    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('publish', ['publish:patch']);
    grunt.registerTask('publish:patch', ['clean', 'default', 'gitadd', 'bump:patch', 'sync', 'release']);
    grunt.registerTask('publish:minor', ['clean', 'default', 'gitadd' 'bump:minor', 'sync', 'release']);
    grunt.registerTask('publish:major', ['clean', 'default', 'gitadd' 'bump:major', 'sync', 'release']);

};
