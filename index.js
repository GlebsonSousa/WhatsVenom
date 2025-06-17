const express = require('express');
const venom = require('venom-bot');

const app = express();
const port = process.env.PORT || 3000;

let client = null;
let latestQr = null;

app.get('/', (req, res) => {
  res.send('API Venom está rodando');
});

app.get('/conecta', (req, res) => {
  if (client) {
    return res.send('Sessão já conectada');
  }

  venom
    .create(
      'session-name',
      (base64Qr) => {
        console.log('QR code atualizado');
        latestQr = base64Qr;
      },
      undefined,
      { headless: true }
    )
    .then((c) => {
      client = c;
      console.log('Cliente conectado!');
      res.redirect('/qr');
    })
    .catch((erro) => {
      console.error('Erro ao criar sessão:', erro);
      if (!res.headersSent) res.status(500).send('Erro ao criar sessão');
    });
});

app.get('/qr', (req, res) => {
  if (!latestQr) {
    return res.send('QR code ainda não gerado. Acesse /conecta para iniciar a sessão.');
  }

  res.send(`
    <h3>Escaneie o QR code para conectar o WhatsApp</h3>
    <img src="data:image/png;base64,${latestQr}" />
    <script>
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    </script>
  `);
});

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
