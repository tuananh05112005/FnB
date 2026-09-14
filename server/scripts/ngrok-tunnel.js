require('dotenv').config();
const { execSync, spawn } = require('child_process');

try { execSync('taskkill /F /IM ngrok.exe', { stdio: 'ignore' }); } catch (_) {}

const token = process.env.NGROK_AUTHTOKEN;
if (token) {
  try {
    execSync('npx -y ngrok config add-authtoken ' + token, { stdio: 'ignore' });
    console.log('Da xac thuc NGROK_AUTHTOKEN tu .env thanh cong!');
  } catch (err) {
    console.warn('Khong the them authtoken:', err.message);
  }
}

const targetPort = process.env.PORT || 5000;
console.log('Dang khoi dong Ngrok tunnel tro toi port ' + targetPort + '...');

const ngrokProcess = spawn('cmd.exe', ['/c', 'npx', '-y', 'ngrok', 'http', String(targetPort), '--log=stdout'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let tunnelFound = false;
ngrokProcess.stdout.on('data', (data) => {
  const output = data.toString();
  const match = output.match(/url=(https:\/\/[^\s]+)/i) || output.match(/(https:\/\/[a-zA-Z0-9-]+\.(?:ngrok-free\.app|ngrok\.io|ngrok\.app))/i);
  if (match && !tunnelFound) {
    tunnelFound = true;
    const publicUrl = match[1];
    console.log('\n===============================================================');
    console.log('NGROK TUNNEL DA KHOI TAO THANH CONG!');
    console.log('Public URL   : ' + publicUrl);
    console.log('SePay Webhook: ' + publicUrl + '/api/payments/sepay-webhook');
    console.log('===============================================================\n');
    console.log('Hay copy link SePay Webhook o tren dan vao My SePay');
    console.log('Giu terminal nay chay de duy tri ket noi SePay Webhook.\n');
  }
  if (output.includes('ERR_NGROK_') || output.includes('ERROR:')) {
    process.stderr.write(output);
  }
});

ngrokProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

ngrokProcess.on('close', (code) => {
  if (!tunnelFound) {
    console.error('Ngrok thoat voi ma loi:', code);
  }
});

process.on('SIGINT', () => {
  try { execSync('taskkill /F /IM ngrok.exe', { stdio: 'ignore' }); } catch (_) {}
  process.exit();
});
