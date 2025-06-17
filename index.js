const venom = require('venom-bot');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

venom
  .create({
    session: 'session-name',
    multidevice: true,
    headless: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-dev-tools'
    ]
  })
  .then((client) => {
    console.log('🟢 BOT ONLINE');
    startBot(client);
  })
  .catch((error) => {
    console.log('❌ Erro ao iniciar', error);
  });

function startBot(client) {
  client.onMessage((message) => {
    if (message.body.toLowerCase() === 'ola') {
      client.sendText(message.from, 'Olá! Sou o bot do Glebson, como posso ajudar? 🤖');
    }
  });
}

// Endpoint básico para testar se o Render está rodando
app.get('/', (req, res) => {
  res.send('🟢 Bot do Glebson rodando no Render!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
