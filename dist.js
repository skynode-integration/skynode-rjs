/*
 * This script will create the final r.js file used in node projects to use
 * RequireJS.
 *
 * This file uses Node to run:
 * node dist.js
 */

/*jslint strict: false */
/*global require: false, process: false, console: false */


var fs = require('fs'),
    child_process = require('child_process'),
    contents = fs.readFileSync('src/x.js', 'utf8'),
    loadRegExp = /\/\/INSERT ([\w\/\.]+)/g,
    moduleNameRegExp = /src\/([\w\/\-]+)\.js$/,
    defRegExp = /define\s*\(/,
    envs = ['browser', 'node', 'rhino', 'xpconnect'],
    //Update this list of files by running the optimizer against
    //src/opto.build.js,
    //but then remove any jslib/node entries and make sure there is
    //an env! entry for each one of them. Include
    //src/commonjs.js in the list, but remove build/build.js
    //since it is loaded separately.
    libFiles = [
        'src/env.js',
        'env!env/assert',
        'env!env/args',
        'env!env/load',
        'env!env/file',
        'env!env/quit',
        'env!env/print',
        'src/skylark-rjs-all.js',
        'src/requirePatch.js'
    ],
    optimizerStartFile = 'build/build.js',
    libText = '';

function readAndNameModule(fileName) {
    var contents = fs.readFileSync(fileName, 'utf8'),
        match = moduleNameRegExp.exec(fileName),
        moduleName = (match && match[1]) || fileName;

    //Insert the module name.
    if (moduleName.indexOf("skylark")==-1) {
        return contents.replace(defRegExp, function (match) {
            return match + "'" + moduleName + "', ";
        });        
    } else {
        return contents;
    }

}

//Load up all the optimizer files.
libFiles.forEach(function (fileName) {
    if (fileName.indexOf('env!') === 0) {
        envs.forEach(function (env) {
            libText += "\nif(env === '" + env + "') {\n" +
                        readAndNameModule(fileName.replace(/env!env\//, 'src/' + env + '/') + '.js') +
                        "\n}\n";
        });
    } else {
        libText += readAndNameModule(fileName, 'utf8');
    }
});

//Inline file contents
contents = contents.replace(loadRegExp, function (match, fileName) {
    if (fileName === 'LIB') {
        return libText;
    } else {
        var text = fs.readFileSync(fileName, 'utf8');
        if (fileName.indexOf('require.js') !== -1) {
            text = text.replace(/var requirejs, require\, define\;/, '');
        }
        return text;
    }
});

//Set the isOpto flag to true
fs.writeFileSync('r.js', contents, 'utf8');
