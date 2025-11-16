/**
 * Monitor logów Minecraft i wysyłanie płatności do kasyna online
 * Plug-and-play – działa od razu na Windowsie z domyślnym .minecraft/logs/latest.log
 */

const fs = require('fs');
const chokidar = require('chokidar');
const https = require('https');
const path = require('path');

// ------------------------ KONFIGURACJA ------------------------
// Wpisz tutaj swój klucz API do kasyna:
const API_KEY = 'TU_WSTAW_SWÓJ_API_KEY';

// Domyślna ścieżka logów Minecraft na Windowsie
const logPath = path.join(process.env.APPDATA, '.minecraft', 'logs', 'latest.log');

// ------------------------ FUNKCJE ------------------------

// Wysyła płatność do kasyna
function sendPaymentToCasino(username, amount) {
  const data = JSON.stringify({ username, amount });

  const options = {
    hostname: 'kasyno-online.vercel.app',
    path: '/api/payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': data.length
    }
  };

  const req = https.request(options, res => {
    console.log(`[Kasyno] ${username} -> ${amount} wysłano, status: ${res.statusCode}`);
  });

  req.on('error', error => {
    console.error(`[Kasyno] Błąd wysyłki dla ${username}:`, error.message);
  });

  req.write(data);
  req.end();
}

// ------------------------ MONITOROWANIE PLIKU ------------------------

let lastSize = fs.existsSync(logPath) ? fs.statSync(logPath).size : 0;

const watcher = chokidar.watch(logPath, { persistent: true });

watcher.on('change', () => {
  const newSize = fs.statSync(logPath).size;
  if (newSize < lastSize) lastSize = 0; // plik został zresetowany

  const stream = fs.createReadStream(logPath, { start: lastSize, end: newSize });
  let buffer = '';

  stream.on('data', chunk => { buffer += chunk.toString(); });

  stream.on('end', () => {
    const lines = buffer.split(/\r?\n/);
    for (const line of lines) {
      if (line.includes('Player paid')) { // dopasuj do wpisu w logu MC
        const match = line.match(/Player paid (\w+) (\d+)/);
        if (match) {
          const username = match[1];
          const amount = parseInt(match[2], 10);
          console.log(`[Minecraft] Wykryto płatność: ${username} -> ${amount}`);
          sendPaymentToCasino(username, amount);
        }
      }
    }
    lastSize = newSize;
  });
});

console.log(`[Monitor] Uruchomiono monitor logów Minecraft: ${logPath}`);
