const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

const LEVEL_LABEL = { PROFESSIONNEL: 'professionnel', EXPERT: 'expert', PASSIONNE: 'passionné' };

// Generates a short first-person bio for one skill category — used by the
// "Générer avec l'IA" button so jobbers don't have to write it themselves.
async function generateCategoryBio({ categoryName, level, serviceNames }) {
  const anthropic = getClient();
  if (!anthropic) {
    const err = new Error('Génération IA indisponible pour le moment.');
    err.status = 503;
    err.expose = true;
    throw err;
  }

  const levelLabel = LEVEL_LABEL[level] || 'passionné';
  const servicesLine = serviceNames?.length ? ` Prestations proposées : ${serviceNames.join(', ')}.` : '';

  let message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Rédige une courte présentation professionnelle (3 à 4 phrases, en français) pour un particulier qui propose des services de "${categoryName}" sur une plateforme de mise en relation à domicile, avec un niveau déclaré "${levelLabel}".${servicesLine}

Consignes : ton chaleureux et rassurant, écriture à la première personne, reste général et n'invente ni diplôme, ni nombre précis d'années d'expérience, ni nom, ni entreprise. Réponds uniquement avec le texte de la présentation, sans titre, sans guillemets, sans markdown.`,
        },
      ],
    });
  } catch (apiErr) {
    const err = new Error('La génération IA a échoué, réessayez dans un instant.');
    err.status = 502;
    err.expose = true;
    throw err;
  }

  const textBlock = message.content.find((b) => b.type === 'text');
  return textBlock?.text?.trim() || '';
}

module.exports = { generateCategoryBio };
