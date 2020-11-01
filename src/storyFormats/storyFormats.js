const fs = require('fs')
const path = require('path')

const getSource = (srcPath) => {
    let data = JSON.parse(fs.readFileSync(path.resolve(__dirname, srcPath), 'utf8').replace(/window\.storyFormat\((.*)\);?/s, '$1'))
    return data.source
}

let formats = [
    {name: "chapbook-1.2.0", path: './chapbook-1.2.0/format.js'},
    {name: "harlowe-1.2.4", path: './harlowe-1.2.4/format.js'},
    {name: "harlowe-2.1.0", path: './harlowe-2.1.0/format.js'},
    {name: "harlowe-3.1.0", path: './harlowe-3.1.0/format.js'},
    {name: "paperthin-1.0.0", path: './paperthin-1.0.0/format.js'},
    {name: "snowman-1.4.0", path: './snowman-1.4.0/format.js'},
    {name: "snowman-2.0.2", path: './snowman-2.0.2/format.js'},
    {name: "sugarcube-1.0.35", path: './sugarcube-1.0.35/format.js'},
    {name: "sugarcube-2.31.1", path: './sugarcube-2.31.1/format.js'},
].map(ele => {
    ele.src = () => getSource(ele.path)
    return ele
})

module.exports = formats
