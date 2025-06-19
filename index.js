const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let sock;
let qrCodeString = null;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeString = qr;
      console.log('Novo QR code gerado!');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão fechada por', lastDisconnect.error, ', reconectando...', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      console.log('Conectado com sucesso 🔥');
      qrCodeString = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();

app.get('/', (req, res) => {
  res.send('✅ API WhatsApp Baileys está rodando!');
});

app.get('/qr', async (req, res) => {
  if (!qrCodeString) {
    return res.send('✅ Sessão já conectada ou QR não gerado.');
  }
  const qrImg = await qrcode.toDataURL(qrCodeString);
  res.send(`
    <h2>Escaneie o QR code para conectar seu WhatsApp</h2>
    <img src="${qrImg}" />
    <script>
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    </script>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
