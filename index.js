const venom = require('venom-bot');
const express = require('express');
const app = express();
app.use(express.json());

let client;

// Cria sessão do WhatsApp
venom
  .create({
    session: 'session-name',
    multidevice: true
  })
  .then((cl) => {
    client = cl;
    console.log('✅ WhatsApp conectado!');
    startBot(client); // Inicia o bot após conectar
  })
  .catch((error) => console.log('❌ Erro na conexão', error));

// Função que escuta e responde mensagens
function startBot(client) {
  client.onMessage(async (message) => {
    const texto = message.body.toLowerCase();
    const numero = message.from;

    if (texto === 'ola' || texto === 'olá') {
      await client.sendText(
        numero,
        'Olá, sou um bot do Glebson! 🚀'
      );
      console.log(`✅ Respondi 'Olá' para ${numero}`);
    }

    // Você pode criar mais respostas aqui
    if (texto === 'menu') {
      await client.sendText(
        numero,
        '📋 Menu:\n1️⃣ Info\n2️⃣ Suporte\n3️⃣ IA'
      );
    }
  });
}

// Rota raiz
app.get('/', (req, res) => {
  res.send('🚀 API WhatsApp Rodando!');
});

// Envio manual via API HTTP
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).send({ error: 'Parâmetros faltando' });
  }

  try {
    await client.sendText(`${phone}@c.us`, message);
    res.send({ status: 'Mensagem enviada' });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao enviar mensagem', details: error });
  }
});

// Porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
