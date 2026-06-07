const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"CityFixer" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: 'Código de verificación — CityFixer',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Completá tu registro en CityFixer</h2>
        <p>Ingresá el siguiente código en <strong>CityFixer.com</strong> para completar tu registro. Expira en <strong>10 minutos</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px 0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 12px;">Si no solicitaste este código, ignorá este mensaje.</p>
      </div>
    `
  });
};

const sendExternalOtpEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"CityFixer" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: 'Código de acceso a datos externos — CityFixer',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Solicitud de acceso a datos externos</h2>
        <p>Se realizó una solicitud de datos desde Power BI. Para autorizar el acceso, ingresá el siguiente código en el header <strong>x-otp-code</strong> de Power BI. Expira en <strong>5 minutos</strong> y es de un solo uso.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px 0;">
          ${code}
        </div>
        <p style="color: #e53e3e; font-size: 13px;"><strong>Si no realizaste esta solicitud, ignorá este mensaje y revisá el acceso a tu cuenta de inmediato.</strong></p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail, sendExternalOtpEmail };
