var path = require('path');
const express = require('express')

const app = express()
app.use(express.static(path.join(__dirname, 'public')));
const fs = require('fs');
const http = require('http');
const https = require('https');
const httpServer = http.createServer(app);
const httpsServer = https.createServer({
    // key: fs.readFileSync('./src/cert/privatekey.pem', 'utf8'),
    // cert: fs.readFileSync('./src/cert/certificate.crt', 'utf8')
		key: fs.readFileSync('./src/cert/test/server.pem', 'utf8'),
    cert: fs.readFileSync('./src/cert/test/server.crt', 'utf8')
}, app);
const PORT = 80;
const SSLPORT = 443;

app.use('/public', express.static('public'))
httpServer.listen(PORT, function() {
	console.log('HTTP Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen(SSLPORT, function() {
	console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});

const wsInstance = require('express-ws')(app, httpsServer);

app.ws('/', ws => {
	ws.on('message', data => {
		// 未做业务处理，收到消息后直接广播
		wsInstance.getWss().clients.forEach(server => {
			if (server !== ws) {
				server.send(data);
			}
		});
	});
});

app.get('/', (req, res) => {
	res.sendFile('./client/index.html', { root: __dirname });
});

app.get('/p2p', (req, res) => {
	res.sendFile('./client/p2p.html', { root: __dirname });
});

app.get('/tel', (req, res) => {
	res.sendFile('./client/tel.html', { root: __dirname });
});

app.get('/video', (req, res) => {
	res.sendFile('./client/video.html', { root: __dirname });
});

app.get('/audio', (req, res) => {
	res.sendFile('./client/audio.html', { root: __dirname });
});

app.get('/jssip', (req, res) => {
	res.sendFile('./jssip/index.html', { root: __dirname });
});


// app.listen(3000)