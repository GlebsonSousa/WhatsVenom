// 📦 Importação dos pacotes necessários
const { default: criarConexaoWhatsapp, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');

// 🚀 Inicializa o servidor Express
const app = express();
const porta = process.env.PORT || 3000;

// 🔗 Variáveis globais
let conexaoWhatsapp;         // Armazena a conexão ativa do WhatsApp
let qrCodeAtual = null;      // Armazena o QR Code temporário para conexão

// 🔥 Função principal — Inicia a conexão com o WhatsApp
async function iniciarConexaoWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('dados_autenticacao');

  conexaoWhatsapp = criarConexaoWhatsapp({
    auth: state,
    printQRInTerminal: false // Não exibe no terminal, pois vamos exibir via web
  });

  // 🚦 Gerenciamento da conexão
  conexaoWhatsapp.ev.on('connection.update', (atualizacao) => {
    const { connection, lastDisconnect, qr } = atualizacao;

    if (qr) {
      qrCodeAtual = qr; // Salva QR para exibir via navegador
      console.log('🟨 QR Code gerado — Acesse /qr para escanear');
    }

    if (connection === 'close') {
      const deveReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🟥 Conexão fechada. Reconectar?', deveReconectar);
      if (deveReconectar) iniciarConexaoWhatsapp();
    } else if (connection === 'open') {
      console.log('🟩 Conectado ao WhatsApp!');
      qrCodeAtual = null; // Limpa QR pois já está conectado
    }
  });

  // 📥 Recebe mensagens e responde automaticamente se for "ola" ou "olá"
  conexaoWhatsapp.ev.on('messages.upsert', async (mensagem) => {
    const infoMensagem = mensagem.messages[0];
    if (!infoMensagem.message || infoMensagem.key.fromMe) return;

    const numeroRemetente = infoMensagem.key.remoteJid;
    const conteudoMensagem = infoMensagem.message.conversation || infoMensagem.message.extendedTextMessage?.text;

    console.log(`📩 Mensagem recebida de ${numeroRemetente}: ${conteudoMensagem}`);

    if (conteudoMensagem?.toLowerCase() === 'ola' || conteudoMensagem?.toLowerCase() === 'olá') {
      await enviarMensagem(numeroRemetente, 'Olá, eu sou um bot do Glebson!');
      console.log(`✅ Respondi automaticamente para ${numeroRemetente}`);
    }
  });

  // 🔐 Atualiza as credenciais salvas
  conexaoWhatsapp.ev.on('creds.update', saveCreds);
}

// ✉️ Função para enviar mensagem
async function enviarMensagem(numero, mensagem) {
  if (!conexaoWhatsapp) throw new Error('❌ WhatsApp não está conectado.');
  await conexaoWhatsapp.sendMessage(numero, { text: mensagem });
}

// 📷 Função que gera QR Code em base64
async function gerarQRCode() {
  if (!qrCodeAtual) return null;
  return await qrcode.toDataURL(qrCodeAtual);
}

// 🚦 Verifica status da conexão
function obterStatusConexao() {
  return conexaoWhatsapp ? '🟢 Conectado ao WhatsApp!' : '🔴 Não conectado!';
}

// 🌐 ROTAS DA API

// 🏠 Endpoint raiz
app.get('/', (req, res) => {
  res.send('✅ API WhatsApp rodando!');
});

// 🔌 Endpoint para iniciar a conexão manualmente (opcional)
app.get('/iniciar', async (req, res) => {
  try {
    await iniciarConexaoWhatsapp();
    res.send('🔌 Conexão com WhatsApp iniciada!');
  } catch (erro) {
    res.status(500).send(`❌ Erro ao iniciar: ${erro.message}`);
  }
});

// 🔗 Endpoint que gera e exibe o QR Code no navegador
app.get('/qr', async (req, res) => {
  const qr = await gerarQRCode();
  if (!qr) {
    return res.send('✅ Sessão já conectada ou QR não disponível.');
  }

  res.send(`
    <h2>🔗 Escaneie o QR Code para conectar ao WhatsApp</h2>
    <img src="${qr}" />
    <script>
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    </script>
  `);
});

// 📤 Endpoint que envia mensagem manual
app.get('/enviar', async (req, res) => {
  const numero = req.query.numero;
  const mensagem = req.query.mensagem;

  if (!numero || !mensagem) {
    return res.send('⚠️ Informe os parâmetros numero= e mensagem=');
  }

  try {
    await enviarMensagem(`${numero}@s.whatsapp.net`, mensagem);
    res.send('✅ Mensagem enviada com sucesso!');
  } catch (erro) {
    res.status(500).send(`❌ Erro ao enviar: ${erro.message}`);
  }
});

// 🚦 Endpoint para checar status da conexão
app.get('/status', (req, res) => {
  res.send(obterStatusConexao());
});

// 🚀 Inicia o servidor automaticamente
app.listen(porta, () => {
  console.log(`🚀 Servidor rodando na porta ${porta}`);
  iniciarConexaoWhatsapp();
});
