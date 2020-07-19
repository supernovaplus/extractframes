const fs = require("fs");
const path = require("path");
const spawn = require('child_process').spawn;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const {videosPath, screenshotPath} = require("./options.json");
const express = require('express');
const { query } = require("express");
const app = express();
const port = 3000;

let isScanningActive = false;
let scanProgress = 0;

function getAllFiles (_path, subfolder = "/") {
    const files = [];
    fs.readdirSync(_path, { withFileTypes: true }).forEach(file=>{
        if(file.isDirectory()) {
            files.push(...getAllFiles(path.join(_path, file.name), subfolder + file.name + "/"))
        }else{
            files.push({subfolder, name: file.name})
        }
    })
    return files;
}

//scan folders and subfolders and filter leaving mp4 only
const fileList = getAllFiles(videosPath).filter(v=>v.name.endsWith("mp4"))

app.use('/videos', express.static(videosPath))
app.use('/screenshots', express.static(screenshotPath))
app.use('/', express.static(path.join(__dirname, "public")));

app.get('/videos.json', (req, res) => {
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

app.get('/scanning.json', (req, res) => {
    if(req.query.start !== undefined && !isScanningActive){
        res.json({
            "scanstatus": 0,
            "message": "scan started"
        })
        makeScreenshots2();
    }else if(isScanningActive){
        res.json({
            "scanstatus": 1,
            "message": "scan in progress",
            "progress": scanProgress + "/" + fileList.length
        })
    }else{
        res.json({
            "scanstatus": 2,
            "message": "scan finished"
        })
    }
})

async function makeScreenshots2(){
    isScanningActive = true;
    scanProgress = 0;

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const input = videosPath + (file.subfolder ? file.subfolder.replace(/\//g,"\\") : "") + file.name
        if(!fs.existsSync(`${screenshotPath}${file.name}.jpg`)){
            await new Promise(resolve => {
                const ffmpeg = spawn(ffmpegPath, [
                    "-ss", "00:00:02",
                    "-i", input,
                    "-frames", "1",
                    "-vf", `select='not(mod(n,1500))',scale=480:270,tile=8x1`,
                    // "-vf", `select='gt(scene,0.4)',scale=160:120,tile`,
                    "\"" + screenshotPath + file.name + ".jpg" + "\""
                ], {shell: true});
                ffmpeg.stderr.on('data', (data) => {
                    console.log(`X ${data}`);
                });
                ffmpeg.on('close', (code) => {
                    console.log("done")
                    scanProgress++;
                    resolve();
                });
            });
        }else{
            scanProgress++;
        }
    }

    isScanningActive = false;
}


app.listen(port, () => console.log(`Express server @ http://localhost:${port}`));