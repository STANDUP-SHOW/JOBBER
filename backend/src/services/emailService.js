const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Jobber <onboarding@resend.dev>';

async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping password reset email. Reset URL:', resetUrl);
    return;
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Réinitialisez votre mot de passe Jobber',
    html: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe Jobber.</p>
      <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });

  if (error) {
    console.error('Resend failed to send password reset email:', JSON.stringify(error));
  } else {
    console.log('Password reset email sent via Resend, id:', data?.id);
  }
}

async function sendAgenceProposalEmail(to, { clientFirstName, missionTitle, total, date, url }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping agence proposal email. Total:', total, 'URL:', url);
    return;
  }

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre devis pour "${missionTitle}" est prêt`,
    html: `
      <p>Bonjour ${clientFirstName || ''},</p>
      <p>Nous avons préparé une proposition pour votre demande <strong>"${missionTitle}"</strong>, prévue le ${formattedDate}.</p>
      <p><strong>Montant total : ${total} €</strong></p>
      <p><a href="${url}">Consultez le devis complet et confirmez sur votre compte</a></p>
    `,
  });

  if (error) {
    console.error('Resend failed to send agence proposal email:', JSON.stringify(error));
  } else {
    console.log('Agence proposal email sent via Resend, id:', data?.id);
  }
}

module.exports = { sendPasswordResetEmail, sendAgenceProposalEmail };
