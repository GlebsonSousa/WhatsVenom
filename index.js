const { default: criarConexaoSocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const porta = process.env.PORT || 3000;

let conexaoWhatsapp;
let qrCodeAtual = null;

// Função para conectar no WhatsApp
async function conectarWhatsapp() {
  const { state: estadoAutenticacao, saveCreds: salvarCredenciais } = await useMultiFileAuthState('dados_autenticacao');

  conexaoWhatsapp = criarConexaoSocket({
    auth: estadoAutenticacao,
    printQRInTerminal: false
  });

  conexaoWhatsapp.ev.on('connection.update', (atualizacao) => {
    const { connection: statusConexao, lastDisconnect: ultimaDesconexao, qr: novoQr } = atualizacao;

    if (novoQr) {
      qrCodeAtual = novoQr;
      console.log('🔑 Novo QR code gerado!');
    }

    if (statusConexao === 'close') {
      const deveReconectar = ultimaDesconexao?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexão fechada por', ultimaDesconexao.error, ', reconectando...', deveReconectar);
      if (deveReconectar) conectarWhatsapp();
    } else if (statusConexao === 'open') {
      console.log('🟢 Conectado com sucesso 🔥');
      qrCodeAtual = null;
    }
  });

  conexaoWhatsapp.ev.on('creds.update', salvarCredenciais);
}

// Inicia a conexão ao iniciar o servidor
conectarWhatsapp();

// Rota principal só pra testar se está online
app.get('/', (req, res) => {
  res.send('✅ API WhatsApp Baileys está rodando!');
});

// Rota que gera e exibe o QR code
app.get('/qr', async (req, res) => {
  if (!qrCodeAtual) {
    return res.send('✅ Sessão já conectada ou QR não gerado.');
  }
  const qrImagem = await qrcode.toDataURL(qrCodeAtual);
  res.send(`
    <h2>🔗 Escaneie o QR code para conectar seu WhatsApp</h2>
    <img src="${qrImagem}" />
    <script>
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    </script>
  `);
});

// Inicia o servidor na porta definida
app.listen(porta, () => {
  console.log(`🚀 Servidor rodando na porta ${porta}`);
});
