const PACKAGE = require('../package.json')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')

const storyFormats = require('./storyFormats/storyFormats')
const decompiler = require('./decompiler')
const StoryFormat = require('./StoryFormat')

const DEFAULT_FORMAT = 'Harlowe'

yargs(hideBin(process.argv))
    .command('build <input> <output> [format]', 'Compiles the specified twee-like file into an output file. optionally specify the format (Harlowe, Paperthin, Snowman, SugarCube, etc.).', (yargs) => {
        yargs
            .positional('input', {describe: 'source file', type: 'string'})
            .positional('output', {describe: 'output file', type: 'string'})
            .option('format', {description: 'Story Format', type: 'string', default: DEFAULT_FORMAT})
    }, ({input, output, format}) => {
        // Read and parse format file, unless already set (by a Twee2::build_config.story_format call in the story file, for example)
        let story = new StoryFormat(format)
        story.processStoryFile(input, output)
    })
    .command('watch <input> <output> [format]', 'Syntax is the same as build, but twee3 will automatically watch for changes to your input file and recompile dynamically.', (yargs) => {
        yargs
            .positional('input', {describe: 'source file', type: 'string'})
            .positional('output', {describe: 'output file', type: 'string'})
            .option('format', {description: 'Story Format', type: 'string', default: DEFAULT_FORMAT})
    }, ({input, output, format}) => {
        console.log('todo: watch', input, output, format)
    })
    .command('formats', 'Lists the output formats that are understood.', () => {
        console.log(`I understand the following output formats:`)
        storyFormats.forEach(({name}) => console.log(name))
    })
    .command('decompile <input> <output>', 'Decompiles a Twine 2 HTML output file at a specified URL into a twee3 source file.', (yargs) => {
        yargs.positional('input', {
            describe: 'Twine 2 HTML output file',
            type: 'string',
        }).positional('output', {
            describe: 'twee3 source file',
            type: 'string',
        })
    }, ({input, output}) => {
        decompiler(input, output)
    })
    .command('version', `Reports what version of twee3 you're using, and checks what the latest-available version is.`, (argv) => console.log(`version ${PACKAGE.version}`))
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .argv
