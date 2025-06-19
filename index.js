const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let sock;
let qrCodeString = null;

// 🔥 Função que conecta ao WhatsApp
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  // 🚀 Evento de atualização de conexão
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeString = qr;
      console.log('🟨 Novo QR gerado');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🟥 Conexão fechada, reconectar?', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      console.log('🟩 Conectado com sucesso!');
      qrCodeString = null;
    }
  });

  // ✅ Evento que recebe mensagens
  sock.ev.on('messages.upsert', async (msg) => {
    const info = msg.messages[0];
    if (!info.message || info.key.fromMe) return;

    const senderNumber = info.key.remoteJid;
    const messageContent = info.message.conversation || info.message.extendedTextMessage?.text;

    console.log(`📩 Mensagem recebida de ${senderNumber}: ${messageContent}`);

    // Se recebeu "Olá", responde automaticamente
    if (messageContent?.toLowerCase() === 'ola' || messageContent?.toLowerCase() === 'olá') {
      await sock.sendMessage(senderNumber, { text: 'Olá, eu sou um bot do Glebson.' });
      console.log(`✅ Respondi para ${senderNumber}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();

// 🌐 Endpoint raiz
app.get('/', (req, res) => {
  res.send('✅ API WhatsApp Baileys está rodando!');
});

// 🌐 Gera o QR Code
app.get('/qr', async (req, res) => {
  if (!qrCodeString) {
    return res.send('✅ Sessão já conectada ou QR não gerado.');
  }
  const qrImg = await qrcode.toDataURL(qrCodeString);
  res.send(`
    <h2>🔗 Escaneie o QR code para conectar seu WhatsApp</h2>
    <img src="${qrImg}" />
    <script>
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    </script>
  `);
});

// 🌐 Envia mensagem manualmente
app.get('/send', async (req, res) => {
  const number = req.query.number;
  const message = req.query.message;

  if (!sock) {
    return res.send('❌ WhatsApp não conectado.');
  }

  if (!number || !message) {
    return res.send('⚠️ Informe number= e message=');
  }

  try {
    await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
    res.send('✅ Mensagem enviada!');
  } catch (e) {
    console.error(e);
    res.send('❌ Erro ao enviar mensagem');
  }
});

// 🌐 Checa status da conexão
app.get('/status', (req, res) => {
  if (sock) {
    res.send('🟢 Conectado!');
  } else {
    res.send('🔴 Não conectado!');
  }
});

app.listen(port, () => {
  console.log(`🚀 API rodando na porta ${port}`);
});
