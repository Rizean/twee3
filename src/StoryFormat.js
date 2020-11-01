const PACKAGE = require('../package.json')
const fs = require('fs')
//const cheerio = require('cheerio')
const jsdom = require("jsdom");
const { JSDOM } = jsdom

const storyFormats = require('./storyFormats/storyFormats')
const {v4: uuidv4} = require('uuid')

module.exports = class StoryFormat {
    constructor(formatName) {
        // todo handle loading custom format

        this.format = storyFormats.find(format => format.name === formatName)
        if (!this.format) throw new Error('StoryFormatNotFound')
        this.storyName = 'An unnamed story'
        // @story_ifid, @story_ifid_specified = SecureRandom.uuid, false
        this._storyIFID = uuidv4()
        this.storyIFIDSpecified = false
        this.passages = {}
        this.storyFiles = new Set()
        this.storyCSS = ''
        this.storyScripts = ''
        this.storyStartPid = null
        this.startPassage = 'Start'
        this.inStoryIncludes = false

        this.options = {
            haml_remove_whitespace: true,
            coffeescript_bare: true
        }

        this.source = []

        this.processStoryFile.bind(this)

    }

    processStoryFile(input, output) {
        let current_passage = undefined
        // Load file into memory to begin with
        let file = fs.readFileSync(input, 'utf8')
        let lines = file.split(/\r?\n/)
        // First pass - go through and perform 'includes'
        let i = 0
        this.inStoryIncludes = false

        while (i < lines.length) {
            let line = lines[i]
            // console.log(`Processing Line: ${i} inStoryIncludes: ${this.inStoryIncludes} - ${line}`)
            let matchStoreIncludes = /^::\s*StoryIncludes\s*/.test(line)
            if (matchStoreIncludes) {
                this.inStoryIncludes = true
                // console.log(`Processing ::StoryIncludes - inStoryIncludes: ${this.inStoryIncludes}`)
            } else if (/^::(?!@)/.test(line)) {
                // console.log(`Processing :: - ${line}`)
                this.inStoryIncludes = false
            } else if (this.inStoryIncludes && line.trim() !== '') {
                // include a file here because we're in the StoryIncludes section
                lines = this.handleStoryInclude(lines, line)
            } else if (/^( *)::@include (.*)$/.test(line)) {
                // include a file here because an @include directive was spotted
                let result = this.handleInclude(lines, line, i)
                lines = result.lines
                i = result.i
            }
            // console.log(`Phase 1 Line: ${i} done, inStoryIncludes: ${this.inStoryIncludes}`)
            i++
        }
        // Second pass - parse the file
        let regex = /^:: *([^\[]*?) *(\[(.*?)\])? *(<(.*?)>)? *$/
        lines.forEach(line => {
            let matches = regex.exec(line)
            if (matches) {
                let [match, passage = '', two, tags = '', four, position] = matches
                // console.log(`Processing Passage - ${passage}`)
                current_passage = passage
                if (this.passages[current_passage]) {
                    if (current_passage !== 'StoryJS' && current_passage !== 'StoryIncludes') console.warn(`SKIPPING! Passage ${current_passage} already exist!!!`)
                } else {
                    this.passages[current_passage] = {tags: tags.split(' '), position, content: '', exclude_from_output: false, pid: null}
                }

            } else if (current_passage) {
                this.passages[current_passage].content += `${line}\n`
            }
        })
        return this.processPassages(output)
    }



    processPassages(output) {
        let pid = 1
        Object.keys(this.passages).forEach(key => {
            let passage = this.passages[key]
            passage.content = passage.content.trim()
            // Run each passage through a preprocessor, if required
            this.preprocessors(passage)

            if (key === 'StoryTitle') {
                this.storyName = passage.content
                passage.exclude_from_output = true
            } else if (key === 'StoryIncludes') {
                // includes should already have been handled above
                passage.exclude_from_output = true
            } else if (passage.tags.includes('stylesheet')) {
                this.storyCSS += `${passage.content}\n`
                passage.exclude_from_output = true
            } else if (passage.tags.includes('script')) {
                this.storyScripts += `${passage.content}\n`
                passage.exclude_from_output = true
            } else if (passage.tags.includes('twee2')) {
                let regex = /Twee2::build_config.story_ifid\s*=\s*'(.*)'/
                let content = passage.content
                let matches = regex.exec(content)
                if (matches) {
                    let [match, ifid] = matches
                    this.storyIFID = ifid
                    content = content.replace(regex, '').trim()
                }
                regex = /@story_start_name = '(.*)'/
                matches = regex.exec(content)
                if (matches) {
                    let [match, start] = matches
                    this.startPassage = start
                    content = content.replace(regex, '').trim()
                }
                if (content > '') {
                    console.warn('twee2 tag detected!!!')
                    console.warn(`Only these directive are supported`)
                    console.warn(`Twee2::build_config.story_ifid = '...'`)
                    console.warn(`@story_start_name = '...'`)
                    console.warn(`Cannot support the following:`)
                    console.warn(content)
                }
                passage.exclude_from_output = true
            } else if (passage.tags.includes('twee3')) {
                let content = passage.content
                console.warn('twee3 tag detected!!! This feature has not been implemented yet.')
                passage.exclude_from_output = true
            } else {
                passage.pid = pid++
            }
        })
        this.storyStartPid = this.passages[this.startPassage].pid
        // Generate HTML in Twine 2 format
        const dom = new JSDOM(this.format.src())
        let html = dom.serialize()
        let storyData = this.generateStoryData()
        // this is to prevent replace from inserting the match into $&
        storyData = storyData.replace(/\$/g, '%24')
        html = html.replace('{{STORY_DATA}}', storyData)
        html = html.replace(/%24/g, '$')
        html = html.replace('{{STORY_NAME}}', this.storyName)
        if (output) fs.writeFileSync(output, html)
        return html
    }

    generateStoryData() {
        return [
            `<tw-storydata name="${this.storyName}" startnode="${this.storyStartPid}" creator="Twee3" creator-version="${PACKAGE.version}" ifid="${this.storyIFID}" format="${this.format.path}" options="">`,
            `<style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css">`,
            this.storyCSS,
            `</style>`,
            `<script role="script" id="twine-user-script" type="text/twine-javascript">`,
            this.storyScripts,
            `</script>`,
            this.passagesToHTML(),
            `</tw-storydata>`
        ].join('\n')
    }

    passagesToHTML() {
        let html = ''
        Object.keys(this.passages).forEach(key => {
            let passage = this.passages[key]
            let encoder = (val) => val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            let content = encoder(passage.content)
            let name = encoder(key).replace(/"/g, '&quot;')
            if (!passage.exclude_from_output) {
                html += `<tw-passagedata pid="${passage.pid}" name="${name}" tags="${passage.tags.join(' ')}" position="${passage.position}">${content}</tw-passagedata>`
            }
        })
        return html
    }

    preprocessors(passage) {
        // HAML
        let hamlIndex = passage.tags.indexOf('haml')
        if (hamlIndex > -1) {
            // passage.content = // Haml::Engine.new(@passages[k][:content], HAML_OPTIONS).render
            passage.tags = passage.tags.splice(hamlIndex, 1)
        }
        // Coffeescript
        let coffeeIndex = passage.tags.indexOf('coffee')
        if (coffeeIndex > -1) {
            // passage.content = // CoffeeScript.compile(@passages[k][:content], COFFEESCRIPT_OPTIONS)
            passage.tags = passage.tags.splice(coffeeIndex, 1)
        }
        // SASS
        let sassIndex = passage.tags.indexOf('sass')
        if (sassIndex > -1) {
            // passage.content = // Sass::Engine.new(@passages[k][:content], :syntax => :sass).render
            passage.tags = passage.tags.splice(sassIndex, 1)
        }
        // SCSS
        let scssIndex = passage.tags.indexOf('scss')
        if (scssIndex > -1) {
            // passage.content = // Sass::Engine.new(@passages[k][:content], :syntax => :scss).render
            passage.tags = passage.tags.splice(scssIndex, 1)
        }
    }

    handleScript(script) {
        this.storyScripts += `${script}\n`
    }

    handleStoryInclude(lines, line) {
        let child_file = line.trim()
        console.log(`handleStoryInclude file: ${child_file}`)
        // include a file here because we're in the StoryIncludes section
        if (fs.existsSync(child_file)) {
            if (this.storyFiles.has(child_file)) {
                console.warn(`Skipping ${child_file}, it was include multiple times!`)
            } else {
                let content = fs.readFileSync(child_file, 'utf8')
                if (child_file.endsWith('.js')) {
                    let script = `// @require('${child_file}')\n${content}\n// #require`
                    this.handleScript(script)
                } else {
                    lines = lines.concat(content.split(/\r?\n/)) // add it on to the end
                    this.storyFiles.add(child_file)
                }
            }
        } else {
            console.error(`WARNING: tried to include file '${child_file}' via StoryIncludes but file was not found.`)
        }
        return lines
    }

    handleInclude(lines, line, i) {
        let [, prefix, filename] = /^( *)::@include (.*)$/.match(line)
        console.log(`Processing @include file: ${filename}`)
        if (fs.existsSync(filename)) {
            let includeLines = fs.readFileSync(filename, 'utf8').split(/\r?\n/).map(line => `${prefix}${line}`)
            // insert in-place, with prefix of appropriate amount of whitespace
            lines = lines.splice(i, 0, ...includeLines)
            // process this line again, in case of ::@include nesting
            i--
        } else {
            console.error(`WARNING: tried to ::@include file '${filename}' but file was not found.`)
        }
        return {lines, i}
    }

    compile(input, output, options = {}) {
        if (!this.storyIFIDSpecified) {
            console.log(`NOTICE: You haven't specified your IFID. Consider adding to your code -`)
        }
    }

    get storyIFID() {
        return this._storyIFID
    }

    set storyIFID(uuid) {
        this.storyIFIDSpecified = true
        this._storyIFID = uuid
    }
}
