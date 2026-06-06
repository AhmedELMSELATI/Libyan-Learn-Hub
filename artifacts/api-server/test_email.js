import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'ad09e8001@smtp-brevo.com',
    pass: 'xsmtpsib-e28019ef35e2ca4cc814497b7c79ef5e7c57686d48d595e1478c6a7240ccaca6-QGEKahALSbUUImp7',
  },
  connectionTimeout: 5000,
});

transporter.sendMail({
  from: '"Libyan Learn Hub" <contact@eduonline.net.ly>',
  to: 'a95almeslati@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email.',
}).then(info => {
  console.log('Success:', info.messageId);
}).catch(err => {
  console.error('Error:', err);
});
