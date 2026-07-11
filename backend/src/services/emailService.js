const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Jobber <onboarding@resend.dev>';

async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping password reset email. Reset URL:', resetUrl);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Réinitialisez votre mot de passe Jobber',
    html: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe Jobber.</p>
      <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
