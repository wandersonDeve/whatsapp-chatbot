import axios from 'axios';
import { createCanvas, loadImage, registerFont } from 'canvas';
const path = require('path');
const fs = require('fs');

const bibleAPI = 'https://www.abibliadigital.com.br/api';

async function getCitacaoBiblica() {
  try {
    const response = await axios.get(`${bibleAPI}/verses/acf/random`);
    const citacao = response.data;
    const bookAndChapter = `${citacao.book.name} ${citacao.chapter}:${citacao.number}`;
    const text = citacao.text;
    return { text, bookAndChapter };
  } catch (error) {
    console.error('Erro ao obter a citação bíblica:', error.response);
    return null;
  }
}

async function downloadImagem(url, nomeArquivo) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });

    const caminhoArquivo = `${nomeArquivo}`;

    await response.data.pipe(fs.createWriteStream(caminhoArquivo));

    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        resolve(caminhoArquivo);
      });

      response.data.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Erro ao fazer o download da imagem:', error);
    return null;
  }
}

// Função para obter uma imagem aleatória
async function getImagemAleatoria() {
  try {
    const response = await axios.get(
      'https://source.unsplash.com/720x1280/?nature',
    );
    const imageUrl = response.request.res.responseUrl;
    if (!imageUrl) return;
    const nomeArquivo = `${Date.now()}_aleatoria.jpg`;

    const caminhoArquivo = await downloadImagem(imageUrl, nomeArquivo);
    if (caminhoArquivo) {
      console.log(`Imagem salva em: ${caminhoArquivo}`);
    }

    return caminhoArquivo;
  } catch (error) {
    console.error('Erro ao obter a imagem:', error);
    return null;
  }
}

async function adicionarTextoImagem(citacao, autor, caminhoArquivo) {
  try {
    const canvas = createCanvas(720, 1280);
    const context = canvas.getContext('2d');

    // Carregar a imagem
    const image = await loadImage(caminhoArquivo);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Escurecer a imagem
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Configurar a fonte do texto
    registerFont('./ARIAL.TTF', { family: 'Arial' });
    context.font = 'bold 40px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';

    // Adicionar a citação à imagem
    const maxLineWidth = 700; // Largura máxima para o texto
    const lineHeight = 50; // Altura de cada linha do texto
    const words = citacao.split(' ');
    let line = '';
    let y = 300; // Posição vertical inicial para o texto
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxLineWidth) {
        context.fillText(line, canvas.width / 2, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, canvas.width / 2, y);

    // Adicionar o autor abaixo da citação
    const autorY = y + lineHeight + 20;
    context.font = 'italic 30px Arial';
    context.fillText(autor, canvas.width / 2, autorY);

    // Adicionar a logo
    const logoImage = await loadImage('./logo.png');
    const logoWidth = 238;
    const logoHeight = 336;
    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = canvas.height - logoHeight - 150;
    context.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

    // Salvar a imagem
    const fileName = `imagem_${Date.now()}.png`;

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(fileName, buffer, 'base64');
    fs.promises.unlink(caminhoArquivo);

    return fileName;
  } catch (error) {
    console.error('Erro ao adicionar texto à imagem:', error);
    return null;
  }
}

// Função principal para criar um post com citação bíblica e imagem
export async function criarPost() {
  try {
    // Obter citação bíblica
    const { text, bookAndChapter } = await getCitacaoBiblica();
    if (!text || !bookAndChapter) return;

    // Obter imagem aleatória
    const caminhoArquivo = await getImagemAleatoria();
    if (!caminhoArquivo) return;

    // Adicionar citação e logo à imagem
    const outputImage = await adicionarTextoImagem(
      text,
      bookAndChapter,
      caminhoArquivo,
    );
    if (!outputImage) return;

    return outputImage;
  } catch (error) {
    console.error('Erro ao criar o post:', error);
    return undefined;
  }
}
