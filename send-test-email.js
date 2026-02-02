const nodemailer = require('/var/www/bereifung24/node_modules/nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.your-server.de',
  port: 587,
  secure: false,
  auth: {
    user: 'info@bereifung24.de',
    pass: 'Zdenek83!'
  }
});

transporter.sendMail({
  from: 'Bereifung24 <info@bereifung24.de>',
  to: 'test-yeziw3ji4@srv1.mail-tester.com',
  subject: 'E-Mail Zustellbarkeitstest - Bereifung24',
  text: 'Dies ist eine Test-E-Mail zur Ueberpruefung der E-Mail-Konfiguration.',
  html: '<h1>Test erfolgreich!</h1><p>Dies ist eine Test-E-Mail von Bereifung24.de zur Ueberpruefung der E-Mail-Konfiguration.</p><p><strong>Konfiguration:</strong></p><ul><li>SPF: v=spf1 ip4:167.235.24.110 a mx ~all</li><li>DMARC: v=DMARC1; p=none</li><li>Reverse DNS: mail.bereifung24.de</li></ul><p>Viele Gruesse,<br>Bereifung24 Team</p>'
}).then(info => {
  console.log('✅ E-Mail erfolgreich gesendet!');
  console.log('📧 Message ID:', info.messageId);
  console.log('');
  console.log('Gehe jetzt zu: https://www.mail-tester.com');
  console.log('und klicke auf "Then check your score"');
}).catch(err => {
  console.error('❌ Fehler beim Versenden:', err.message);
  console.error(err);
});
