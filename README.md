# Twee3
Twee3 is a complete refactor of [Twee2](https://github.com/Dan-Q/twee2) build in Javascript for Nodejs. 

Command-line tool to compile Twee-style (.tw, .twine) interactive fiction source files to [Twine 2](http://twinery.org/)-style output. Use your favourite text editor to write Twine 2 interactive fiction.

Designed for those who preferred the Twee approach to source management, because the command-line is awesome, but who want to take advantage of the new features in Twine 2. With a little work, this tool may also function as a partial Twine 1 to Twine 2 converters.

## Current State
* All core functionality is complete
* Preprocessors do not work ie at this time there is no support for HAML, Coffeescript, SASS, or SCSS
* Watch does not work
* For the most part any bugs in Twee2 have been fixed / not carried over
* Decompiler works on windows without issue ;)
* Basically what is left
   1. Finish the preprocessors
   2. Finish Watcher
   3. Publish and npm packages / binaries / docker image
   4. Document new functionality

## Philosophy

(Why does this exist? Where is it going?)

Two things you need to know. I'm new to Twine, and my day job is coding. The Twine editor is a great tool for its target audience. For a profession programmer its junk. Next we got Twee2. It's a nice tool, but the project is dead, 
it has bugs, and it's a total pain to install/get working. Why not just fork it and fix the bugs? Well I know zero ruby, and it was seriously quicker for me to just rewrite it in a lanuage I know well.

## Installation

For now just git clone the project. Will setup an npm package and binaries soon.

## Basic Usage

To compile a Twee file into a HTML file using the format (SugarCube2):

    node ./twee3/src/index.js build ./twine-test/src/index.tw2 twine-test.html sugarcube-2.31.1

For additional features (e.g. listing known formats, watch-for-changes mode), run twee3 without any parameters.

```text
/mnt/d/twine/twee3# node src/index.js
index.js <command>

Commands:
  index.js build <input> <output> [format]  Compiles the specified twee-like
                                            file into an output file. optionally
                                            specify the format (Harlowe,
                                            Paperthin, Snowman, SugarCube,
                                            etc.).
  index.js watch <input> <output> [format]  Syntax is the same as build, but
                                            twee3 will automatically watch for
                                            changes to your input file and
                                            recompile dynamically.
  index.js formats                          Lists the output formats that are
                                            understood.
  index.js decompile <input> <output>       Decompiles a Twine 2 HTML output
                                            file at a specified URL into a twee3
                                            source file.
  index.js version                          Reports what version of twee3 you're
                                            using, and checks what the
                                            latest-available version is.

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```

## Special features - Not working yet

Aside from the obvious benefits of a "use your own editor" solution, Twee2 provides the following enhancements over Twine 2:

* Multi-file inclusion - spread your work over multiple files to improve organisation, facilitate better source control, collaborate with others, or make re-usable modules.
* [HAML](http://haml.info/) support - for those who prefer HAML to Markdown, and for advanced embedding of scripting into passages.
* [Coffeescript](http://coffeescript.org/) transpiler - optionally write your Javascript in Coffeescript for a smarter, lighter syntax.
* [SASS/SCSS](http://sass-lang.com/) stylesheets - optionally enhance your CSS with syntactic awesome.
* Ruby-powered dynamic generation - automate parts of your build chain (e.g. how about a procedurally-built maze of twisty little passages... or even something actually *good*) with Ruby scripting
* Twine 2 decompilation - reverse-engineer Twine 2 stories into Twee2 source code to convert your projects or to understand other people's.

## License

This code is released under "The Unlicense". It includes code (in the storyFormats directory) by other authors, including Leon Arnott: please read their licenses before redistributing.
