const path = require('path');
const fs = require("fs");

exports.getFile = (req, res) => {
    const filePath = path.resolve(`src/fileUploads/${req.params.fileName}`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send({message: "El recurso solicitado no fue encontrado"});
    }
};

exports.getEmisionAudio = (req, res) => {
    const filePath = path.resolve(`src/radioEmisions/${req.params.fileName}`);
    if (fs.existsSync(filePath)) {
        const range = req.headers.range;
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const audioSize = fs.statSync(filePath).size;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, audioSize - 1);
        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${audioSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "audio/mp3",
        };
        res.writeHead(206, headers);
        const videoStream = fs.createReadStream(filePath, { start, end });
        videoStream.pipe(res);
    } else {
        res.status(404).send({message: "El recurso solicitado no fue encontrado"});
    }
};