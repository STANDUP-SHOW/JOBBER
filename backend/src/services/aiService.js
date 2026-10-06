const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

const MODEL = 'claude-opus-5-5';

function unavailable() {
  const err = new Error('Génération IA indisponible pour le moment.');
  err.status = 503;
  err.expose = true;
  return err;
}

function failed() {
  const err = new Error('La génération IA a échoué, réessayez dans un instant.');
  err.status = 502;
  err.expose = true;
  return err;
}

// Fallbacks re-run a request that a safety classifier declines on another
// model inside the same call, so a false positive doesn't surface as an error.
async function ask(anthropic, params) {
  let message;
  try {
    message = await anthropic.beta.messages.create({
      model: MODEL,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      ...params,
    });
  } catch (apiErr) {
    throw failed();
  }
  if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') throw failed();
  return message.content.find((b) => b.type === 'text')?.text?.trim() || '';
}

const LEVEL_LABEL = { PROFESSIONNEL: 'professionnel', EXPERT: 'expert', PASSIONNE: 'passionné' };

// Generates a short first-person bio for one skill category — used by the
// "Générer avec l'IA" button so jobbers don't have to write it themselves.
async function generateCategoryBio({ categoryName, level, serviceNames }) {
  const anthropic = getClient();
  if (!anthropic) throw unavailable();

  const levelLabel = LEVEL_LABEL[level] || 'passionné';
  const servicesLine = serviceNames?.length ? ` Prestations proposées : ${serviceNames.join(', ')}.` : '';

  return ask(anthropic, {
    max_tokens: 2000,
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: `Rédige une courte présentation professionnelle (3 à 4 phrases, en français) pour un particulier qui propose des services de "${categoryName}" sur une plateforme de mise en relation à domicile, avec un niveau déclaré "${levelLabel}".${servicesLine}

Consignes : ton chaleureux et rassurant, écriture à la première personne, reste général et n'invente ni diplôme, ni nombre précis d'années d'expérience, ni nom, ni entreprise. Réponds uniquement avec le texte de la présentation, sans titre, sans guillemets, sans markdown.`,
      },
    ],
  });
}

const ESTIMATE_SCHEMA = {
  type: 'object',
  properties: {
    minHours: { type: 'number', description: 'Durée basse réaliste, en heures, pour un jobber seul' },
    maxHours: { type: 'number', description: 'Durée haute réaliste, en heures, pour un jobber seul' },
    suggestedHours: { type: 'number', description: 'Durée à indiquer dans l\'annonce, multiple de 0,5' },
    explanation: { type: 'string', description: 'Une ou deux phrases en français qui justifient la durée' },
  },
  required: ['minHours', 'maxHours', 'suggestedHours', 'explanation'],
  additionalProperties: false,
};

// Estimates how long a mission will take from what the client typed in the
// publishing form. Only the duration comes from the model; the price range
// is computed from real jobbers' hourly rates by the caller, so the AI never
// invents a price.
async function estimateMissionDuration({ categoryName, serviceName, title, description, details }) {
  const anthropic = getClient();
  if (!anthropic) throw unavailable();

  const detailLines = (details || [])
    .filter((d) => d.value !== '' && d.value != null)
    .map((d) => `- ${d.label} : ${d.value}${d.unit ? ` ${d.unit}` : ''}`)
    .join('\n');

  const text = await ask(anthropic, {
    max_tokens: 4000,
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: ESTIMATE_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Un particulier publie une mission sur une plateforme de services à domicile en France. Estime le temps de travail nécessaire à un jobber seul, sur place, sans compter le trajet.

Catégorie : ${categoryName}${serviceName ? `\nPrestation : ${serviceName}` : ''}
Titre : ${title || '(non renseigné)'}
Description : ${description || '(non renseignée)'}${detailLines ? `\nDétails :\n${detailLines}` : ''}

Si la description est trop vague, donne une fourchette plus large et dis dans l'explication quelle précision aiderait. Ne parle pas de prix.`,
      },
    ],
  });

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw failed();
  }
  const round = (h) => Math.min(80, Math.max(0.5, Math.round(Number(h) * 2) / 2));
  const minHours = round(parsed.minHours);
  const maxHours = Math.max(minHours, round(parsed.maxHours));
  const suggestedHours = Math.min(maxHours, Math.max(minHours, round(parsed.suggestedHours)));
  return { minHours, maxHours, suggestedHours, explanation: String(parsed.explanation || '').slice(0, 400) };
}

module.exports = { generateCategoryBio, estimateMissionDuration };
