const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Inicializa o WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code no terminal e via API
let qrCodeTemp = null;

client.on('qr', qr => {
    qrCodeTemp = qr;
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR acima para conectar');
});

client.on('ready', () => {
    console.log('✅ Bot conectado com sucesso!');
    qrCodeTemp = null;
});

// API para visualizar QR
app.get('/qr', (req, res) => {
    if (qrCodeTemp) {
        res.send(`
            <h1>Escaneie o QR Code</h1>
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeTemp)}&size=300x300">
        `);
    } else {
        res.send('✅ Já está conectado ou QR não gerado.');
    }
});

// Endpoint para enviar mensagem
app.post('/send', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: false, message: 'Número e mensagem são obrigatórios' });
    }

    const numberWithCountryCode = number.includes('@c.us') ? number : `${number}@c.us`;

    client.sendMessage(numberWithCountryCode, message)
        .then(response => {
            res.json({ status: true, response });
        })
        .catch(err => {
            res.status(500).json({ status: false, error: err.message });
        });
});

// Status da conexão
app.get('/', (req, res) => {
    res.send('✅ API WhatsApp está rodando...');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`🚀 API rodando em http://localhost:${port}`);
});

// Inicia o cliente do WhatsApp
client.initialize();
