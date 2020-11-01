const fs = require('fs')
const cheerio = require('cheerio')

// Fixes common problems with decompiled passage content
const tidyUpPassageData = (data) => {
    // remove excess spacing within links: not suitable for Twee-style source
    // added g to ensure we fix all links if there is somehow more than one
    const removeSpacesFromLink = (data) => data.replace(/\[\[ *(.*?) *\]\]/g, '[[$1]]')
    const removeSpacesFromBackLink = (data) => data.replace(/\[\[ *(.*?) *<- *(.*?) *\]\]/g, '[[$1<-$2]]')
    const removeSpacesFromForwardLink = (data) => data.replace(/\[\[ *(.*?) *-> *(.*?) *\]\]/g, '[[$1->$2]]')
    const removeSpacesFromOrLink = (data) => data.replace(/\[\[ *(.*?) *\| *(.*?) *\]\]/g, '[[$1|$2]]')

    let out = data
    out = removeSpacesFromLink(out)
    out = removeSpacesFromBackLink(out)
    out = removeSpacesFromForwardLink(out)
    out = removeSpacesFromOrLink(out)
    return out
}


module.exports = (filePath, outputPath) => {
    let result = ''
    // Load the compiled HTML and sanity-check it
    let $ = cheerio.load(fs.readFileSync(filePath, 'utf8'))
    let storyData = $('tw-storyData')
    if (!storyData) throw new Error(`tw-storydata not found in ${filePath}`)

    // Extract the tw-storydata#name (StoryTitle) and #startnode
    result += `::StoryTitle\n${storyData.attr('name')}\n\n`
    let startnode_pid = storyData.attr('startnode')
    let startnode_name = undefined

    // Extract the custom CSS and Javascript, if applicable
    let css = $('#twine-user-stylesheet')
    if (css && css.html().trim() > '') result += `::StoryCSS [stylesheet]\n${css.html().trim()}\n\n`
    let storyScripts = $('#twine-user-script')
    if (storyScripts && storyScripts.html().trim() > '') result += `::StoryJS [script]\n${storyScripts.html()}\n\n`

    // Extract each passage
    let passages = $('tw-passagedata')
    passages.each((i, passage) => {
        let pid = passage.attribs.pid
        let name = passage.attribs.name
        let tags = passage.attribs.tags
        let position = passage.attribs.position
        let data = ''
        if (passage.firstChild) data = passage.firstChild.data
        // Check if this is the start passage and record this accordingly
        if (pid === startnode_pid) startnode_name = name.trim()
        // Write the passage out
        result += `::${name}`
        if (tags && tags > '') result += ` [${tags}]`
        if (position && position > '') result += ` <${position}>`
        result += `\n${tidyUpPassageData(data)}\n\n`
    })

    // Write the Twee2 settings out (compatibility layer)
    result += `::Twee2Settings [twee2]\n`
    if (startnode_name) result += `@story_start_name = '${startnode_name}'\n`
    result += '\n'

    // write the result out
    if (outputPath) {
        fs.writeFileSync(outputPath, result)
    }

    // Return the result
    return result
}
