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