import fs from 'fs';
import path from 'path';

const basePath = '/home/streams';
const baseUrl = 'https://remotv.pro:8443/hls';
const outputFile = '/home/streams/lista_canales.txt';

function obtenerM3U8s(dir) {
  const resultados = [];

  function explorar(rutaActual) {
    const archivos = fs.readdirSync(rutaActual, { withFileTypes: true });

    archivos.forEach(archivo => {
      const rutaCompleta = path.join(rutaActual, archivo.name);

      if (archivo.isDirectory()) {
        explorar(rutaCompleta);
      } else if (archivo.name.endsWith('.m3u8')) {
        const nombreCarpeta = path.basename(path.dirname(rutaCompleta));
        const nombreArchivo = path.basename(rutaCompleta);
        resultados.push(`${nombreCarpeta}: ${baseUrl}/${nombreCarpeta}/${nombreArchivo}`);
      }
    });
  }

  explorar(dir);
  return resultados;
}

const urls = obtenerM3U8s(basePath);

// Escribir en archivo
fs.writeFileSync(outputFile, urls.join('\\n'));
console.log(`✅ Lista generada con ${urls.length} canales: ${outputFile}`);
