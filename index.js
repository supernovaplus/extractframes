const fs = require("fs");
const path = require("path");
const spawn = require('child_process').spawn;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const {videosPath, screenshotPath} = require("./options.json");
const express = require('express');
const { dir } = require("console");
const app = express();
const port = 3000;

function getAllFiles (_path, _localpath = "/") {
    const files = [];
    fs.readdirSync(_path, { withFileTypes: true }).forEach(file=>{
        if(file.isDirectory()) {
            files.push(...getAllFiles(path.join(_path, file.name), _localpath + file.name + "/"))
        }else{
            files.push({subfolder: _localpath, name: file.name})
        }
    })
    return files;
}

const fileList = getAllFiles(videosPath).filter(v=>v.name.endsWith("mp4"))

app.use('/videos', express.static(videosPath))
app.use('/screenshots', express.static(screenshotPath))
app.use('/', express.static(path.join(__dirname, "public")));

app.get('/items.json', (req, res) => {
    let limit = +req.query.limit;
    let currentPage = +req.query.page;

    limit = !limit || limit < 1 || limit > 200 ? 25 : limit;
    maxPage = Math.ceil(fileList.length / limit);
    currentPage = !currentPage || currentPage > maxPage || currentPage < 1 ? 1 : currentPage;

    res.json({
        "status": 200,
        "fileCount": fileList.length,
        pages: {
            currentPage,
            nextPage: currentPage < maxPage ? currentPage + 1 : null,
            maxPage,
            limit
        },
        files: fileList.slice((currentPage - 1) * limit,  currentPage * limit) 
    })
  })

app.listen(port, () => console.log(`Express server @ http://localhost:${port}`))
// makeScreenshots2();
// async function makeScreenshots2(){
//     // for (let i = 0; i < 100; i++) {
//     for (let i = 0; i < fileList.length; i++) {
//         const file = fileList[i];
//         if(!fs.existsSync(`${screenshotPath}${file.name}.jpg`)){
//             await new Promise(resolve => {
//                 const ffmpeg = spawn(ffmpegPath, [
//                     "-ss", "00:00:10",
//                     "-i", `${videosPath + (file.dir ? file.dir + "\\" : "") + file.name}`,
//                     "-frames", "1",
//                     "-vf", `select='not(mod(n,1500))',scale=480:270,tile=8x1`,
//                     // "-vf", `select='gt(scene,0.4)',scale=160:120,tile`,
//                     "\"" + screenshotPath + file.name + ".jpg" + "\""
//                 ], {shell: true});
//                 ffmpeg.stderr.on('data', (data) => {
//                     console.log(`X ${data}`);
//                 });
//                 ffmpeg.on('close', (code) => {
//                     console.log("done")
//                     resolve();
//                 });
//             });
//         }
//     }

//     console.log("screenshotting finished")
// }