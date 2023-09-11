const fs = require('fs');
const { Readable } = require('stream');
class WSController {
    constructor() {
        this.socket = undefined;
    }
    _getuuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    sendAudioStreamToClients = () => {
        setTimeout(() => {
            let read = fs.readFileSync('./src/current_emision/curent_audio.mp3');
            this.socket.emit('radioAudio', {'file': read});
            this.sendAudioStreamToClients();
        }, 3000);
    }
    connection = (socket) => {
        this.socket = socket;
        this.socket.on('MicroAudio', this.onMicroAudio);
    }
    onMicroAudio = async (data) => {
        console.log('data.audioData', data.audioData);
        fs.writeFile('./src/current_emision/curent_audio.mp3', data.audioData, () => console.log('audio saved!') );
        //const stream = await blobObj.stream();
        //const outbound = JSON.stringify(data);
    }
    close = () => {
    }
}
module.exports = WSController;