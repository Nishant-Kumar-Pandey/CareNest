const nodemailer = require('nodemailer');

let transporter;

const initializeTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // 1. Use real credentials if provided in .env
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✉️ Initialized SMTP Transporter (Production-ready)');
  } else {
    // 2. Generate Ethereal Email (fake inbox) for local development automatically
    console.log('⚠️ No SMTP credentials found in .env. Generating Ethereal Test Account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✉️ Ethereal Email Account generated. All emails will be caught by this test inbox.');
  }
};

// Initialize it once
initializeTransporter().catch(console.error);

/**
 * Sends an email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async (options) => {
  try {
    if (!transporter) {
      console.error('Email transporter not ready yet.');
      return;
    }

    const message = {
      from: `${process.env.FROM_NAME || 'CareNest Support'} <${process.env.FROM_EMAIL || 'noreply@carenest.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''), // fallback plaintext
    };

    const info = await transporter.sendMail(message);

    // If using Ethereal, log the URL so devs can click and read it!
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      console.log(`\n📧 Email sent to ${options.to}`);
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
    }

    return info;
  } catch (err) {
    console.error(`Error sending email to ${options.to}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;
