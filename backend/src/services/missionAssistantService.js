// "Assistant IA" : turns a free-text description (plus optional photos) into
// a ready-to-publish Jobber mission in a couple of exchanges. Generalizes the
// Mekanao breakdown-diagnosis flow to every category: the model reads the
// whole catalog (categories → services → each service's detailFields, the
// same fields the /missions/new form asks for), asks at most one or two
// follow-up questions, and fills the mission draft — including the
// per-service `details` — from what it was told and what it sees in the
// photos. A white-label boutique (services34.fr, Mekanao…) narrows the
// catalog to its own categories, so the same assistant powers every site.
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../config/prisma');

const MODEL = 'claude-opus-5-5';
const CATALOG_TTL_MS = 10 * 60 * 1000;

let client;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

function exposed(message, status) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

// --- Catalog -----------------------------------------------------------

let catalogCache = null;
async function loadCatalog() {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.categories;
  const categories = await prisma.category.findMany({
    include: { services: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  catalogCache = { categories, expiresAt: Date.now() + CATALOG_TTL_MS };
  return categories;
}

function fieldOptions(field) {
  if (field.groups) return field.groups.flatMap((g) => g.options);
  return field.options || [];
}

function describeField(field) {
  const type = {
    number: `nombre${field.unit ? ` en ${field.unit}` : ''}`,
    boolean: 'oui/non',
    text: 'texte libre',
    select: 'un choix parmi',
    multiselect: 'plusieurs choix parmi',
  }[field.type] || field.type;
  const options = fieldOptions(field);
  const optionsText = options.length ? ` [${options.join(' | ')}]` : '';
  const showIf = field.showIf ? ` (seulement si ${field.showIf.key} = oui)` : '';
  return `    · ${field.key} — « ${field.label} » — ${type}${optionsText}${showIf}`;
}

// Stable, deterministic text rendering of the catalog: it sits in the
// cached system prompt, so the same scope must always render byte-for-byte
// identically.
function renderCatalog(categories) {
  return categories.map((cat) => {
    const services = cat.services.map((s) => {
      const fields = Array.isArray(s.detailFields) ? s.detailFields : [];
      return [`  - ${s.slug} : ${s.name}`, ...fields.map(describeField)].join('\n');
    });
    return [`# ${cat.slug} : ${cat.name}`, ...services].join('\n');
  }).join('\n');
}

function scopeCategories(categories, scope) {
  const slugs = scope?.categorySlugs?.length ? scope.categorySlugs : null;
  if (!slugs) return categories;
  const filtered = categories.filter((c) => slugs.includes(c.slug));
  return filtered.length ? filtered : categories;
}

// --- Prompt ------------------------------------------------------------

function systemPrompt({ catalogText, brandName }) {
  return `Tu es l'assistant de ${brandName}, une plateforme française de services à domicile entre particuliers et jobbers. Une personne te décrit un besoin (parfois avec des photos). Ton travail : en une minute, transformer ce besoin en une mission complète, prête à être publiée.

Déroulé :
1. Dès le premier message, identifie la catégorie et la prestation du catalogue ci-dessous qui correspondent, et remplis tout ce que tu peux déduire du texte et des photos (dimensions estimées, type de véhicule, surface, état…).
2. Pose au maximum une ou deux questions au total, uniquement sur ce qui manque vraiment pour qu'un jobber puisse chiffrer et venir : en priorité l'adresse si elle est inconnue, puis le champ le plus déterminant de la prestation. Regroupe-les dans un seul message court. Ne redemande jamais une information déjà donnée ou visible sur une photo.
3. Pour une panne ou une réparation (véhicule, électroménager, plomberie, électricité, informatique…), fais comme un professionnel au téléphone : pose la question de diagnostic la plus utile (symptôme, bruit, voyant, depuis quand) et écris dans la description ton hypothèse de panne la plus probable, présentée comme une piste à confirmer par le jobber.
4. Dès que la catégorie, la prestation, un titre, une description utile et l'adresse sont connus, passe le statut à "ready" : n'attends pas d'avoir tous les champs facultatifs.

Règles de remplissage :
- categorySlug et serviceSlug : uniquement des slugs présents dans le catalogue. Si rien ne correspond exactement, prends la prestation la plus proche (souvent "Autre" ou une prestation générale de la catégorie).
- title : court et concret, 3 à 8 mots, à la manière d'une annonce (ex. « Taille d'une haie de 2 m de haut »).
- description : 2 à 5 phrases à la première personne, du point de vue du client, avec ce qu'on voit sur les photos et les contraintes utiles au jobber. Ne mentionne jamais l'IA ni l'assistant.
- details : uniquement les champs définis pour la prestation choisie, avec leur clé exacte. Nombre : chiffres seuls (point décimal). Oui/non : "oui" ou "non". Choix : recopie exactement une option proposée ; plusieurs choix : options séparées par " ; ". N'invente pas une valeur que ni la personne ni les photos ne permettent d'estimer.
- estimatedHours : ta meilleure estimation du temps de travail en heures.
- desiredDate : AAAA-MM-JJ si la personne a donné une date ou un délai, sinon null. isUrgent : true seulement si elle dit que c'est urgent.
- address : l'adresse d'intervention si elle est connue (donnée par la personne, ou adresse du compte / position détectée qu'elle a confirmée), sinon null. Si une adresse de compte ou une position détectée est fournie dans le contexte, propose-la dans ta question (« C'est bien au 12 rue… ? ») au lieu de demander l'adresse à froid.

Ton :
- reply : en français, chaleureux et très bref (2 phrases max). Quand le statut est "ready", résume en une phrase et invite à vérifier puis publier.
- quickReplies : 0 à 4 réponses courtes que la personne pourrait toucher pour répondre à ta question (ex. « Oui, évacuer les déchets », « Non »). Vide si le statut est "ready".
- Si la demande n'a rien à voir avec un service à domicile ou est inappropriée, explique-le gentiment dans reply, garde le statut "question" et laisse les champs de mission à null.

Catalogue (catégorie → prestations → champs à renseigner) :
${catalogText}`;
}

const nullable = (schema) => ({ anyOf: [schema, { type: 'null' }] });

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'status', 'quickReplies', 'mission'],
  properties: {
    reply: { type: 'string' },
    status: { type: 'string', enum: ['question', 'ready'] },
    quickReplies: { type: 'array', items: { type: 'string' } },
    mission: {
      type: 'object',
      additionalProperties: false,
      required: ['categorySlug', 'serviceSlug', 'title', 'description', 'estimatedHours', 'isUrgent', 'desiredDate', 'address', 'details'],
      properties: {
        categorySlug: nullable({ type: 'string' }),
        serviceSlug: nullable({ type: 'string' }),
        title: nullable({ type: 'string' }),
        description: nullable({ type: 'string' }),
        estimatedHours: nullable({ type: 'number' }),
        isUrgent: { type: 'boolean' },
        desiredDate: nullable({ type: 'string' }),
        address: nullable({ type: 'string' }),
        details: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['key', 'value'],
            properties: { key: { type: 'string' }, value: { type: 'string' } },
          },
        },
      },
    },
  },
};

// Cloudinary serves a resized copy when the path carries a transformation —
// the model doesn't need a 12-megapixel phone photo to judge a hedge.
function modelImageUrl(url) {
  return url.replace('/image/upload/', '/image/upload/w_1280,h_1280,c_limit/');
}

function buildMessages(conversation, contextText) {
  return conversation.map((turn, i) => {
    if (turn.role === 'assistant') return { role: 'assistant', content: turn.text };
    const content = [];
    for (const url of turn.photos || []) {
      content.push({ type: 'image', source: { type: 'url', url: modelImageUrl(url) } });
    }
    const text = i === 0 ? `${contextText}\n\nDemande :\n${turn.text}` : turn.text;
    content.push({ type: 'text', text: text || '(photos uniquement)' });
    return { role: 'user', content };
  });
}

function contextLines({ today, accountAddress, detectedAddress, scope }) {
  const lines = [`Contexte (fourni par la plateforme, pas par la personne) :`, `- Date du jour : ${today}`];
  if (accountAddress) lines.push(`- Adresse enregistrée sur le compte : ${accountAddress}`);
  if (detectedAddress) lines.push(`- Position détectée par le téléphone : ${detectedAddress}`);
  if (!accountAddress && !detectedAddress) lines.push(`- Aucune adresse connue pour l'instant.`);
  if (scope?.serviceSlug) lines.push(`- La personne vient de la page de la prestation « ${scope.serviceSlug} ».`);
  return lines.join('\n');
}

// --- Draft normalization -------------------------------------------------

function coerceDetail(field, raw) {
  const value = String(raw ?? '').trim();
  if (!value) return undefined;
  switch (field.type) {
    case 'number': {
      const n = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : undefined;
    }
    case 'boolean':
      if (/^(oui|yes|true|vrai)$/i.test(value)) return true;
      if (/^(non|no|false|faux)$/i.test(value)) return false;
      return undefined;
    case 'select': {
      const match = fieldOptions(field).find((o) => o.toLowerCase() === value.toLowerCase());
      if (match) return { value: match };
      if (field.other) return { value: 'Autre', precision: value };
      return undefined;
    }
    case 'multiselect': {
      const options = fieldOptions(field);
      const picked = value.split(/\s*;\s*/)
        .map((v) => options.find((o) => o.toLowerCase() === v.toLowerCase()))
        .filter(Boolean);
      return picked.length ? [...new Set(picked)] : undefined;
    }
    default:
      return value.slice(0, 300);
  }
}

function displayValue(field, value) {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.join(', ');
  if (field.type === 'number' && field.unit) return `${value} ${field.unit}`;
  return String(value);
}

// Maps the model's slugs back to real ids and keeps only detail values that
// match the chosen service's field definitions — the draft can then be
// POSTed to /api/missions as-is.
function normalizeDraft(raw, categories) {
  const category = categories.find((c) => c.slug === raw.categorySlug)
    || categories.find((c) => c.services.some((s) => s.slug === raw.serviceSlug));
  const service = category?.services.find((s) => s.slug === raw.serviceSlug) || null;
  const fields = Array.isArray(service?.detailFields) ? service.detailFields : [];

  const details = {};
  const detailsDisplay = [];
  for (const { key, value } of raw.details || []) {
    const field = fields.find((f) => f.key === key);
    if (!field) continue;
    const coerced = coerceDetail(field, value);
    if (coerced === undefined) continue;
    if (field.type === 'select') {
      details[key] = coerced.value;
      if (coerced.precision) details[`${key}Precision`] = coerced.precision.slice(0, 200);
      detailsDisplay.push({ label: field.label, value: coerced.precision || coerced.value });
    } else {
      details[key] = coerced;
      detailsDisplay.push({ label: field.label, value: displayValue(field, coerced) });
    }
  }

  const hours = Number(raw.estimatedHours);
  const desiredDate = /^\d{4}-\d{2}-\d{2}$/.test(raw.desiredDate || '') ? raw.desiredDate : null;
  return {
    categoryId: category?.id || null,
    categoryName: category?.name || null,
    categorySlug: category?.slug || null,
    serviceId: service?.id || null,
    serviceName: service?.name || null,
    title: raw.title?.trim() || null,
    description: raw.description?.trim() || null,
    estimatedHours: Number.isFinite(hours) && hours > 0 ? Math.min(Math.round(hours * 2) / 2 || 0.5, 100) : 1,
    isUrgent: !!raw.isUrgent,
    desiredDate,
    address: raw.address?.trim() || null,
    details,
    detailsDisplay,
  };
}

function draftIsPublishable(draft) {
  return !!(draft.categoryId && draft.title && draft.title.length >= 3
    && draft.description && draft.description.length >= 10
    && draft.address && draft.address.length >= 3);
}

// --- Entry point -----------------------------------------------------------

async function runAssistantTurn({ conversation, scope, brandName, accountAddress, detectedAddress }) {
  const anthropic = getClient();
  if (!anthropic) throw exposed("L'assistant IA est indisponible pour le moment.", 503);

  const categories = scopeCategories(await loadCatalog(), scope);
  const today = new Date().toISOString().slice(0, 10);

  let message;
  try {
    message = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system: [{
        type: 'text',
        text: systemPrompt({ catalogText: renderCatalog(categories), brandName }),
        cache_control: { type: 'ephemeral' },
      }],
      messages: buildMessages(conversation, contextLines({ today, accountAddress, detectedAddress, scope })),
    });
  } catch (apiErr) {
    console.error('[missionAssistant] API error', apiErr?.status, apiErr?.message);
    throw exposed("L'assistant n'a pas pu répondre, réessayez dans un instant.", 502);
  }

  if (message.stop_reason === 'refusal') {
    return {
      reply: "Je ne peux pas vous aider pour cette demande. Décrivez-moi plutôt un service dont vous avez besoin à domicile.",
      status: 'question', quickReplies: [], draft: null,
    };
  }
  const text = message.content.find((b) => b.type === 'text')?.text;
  let parsed;
  try { parsed = JSON.parse(text); } catch {
    throw exposed("L'assistant n'a pas pu répondre, réessayez dans un instant.", 502);
  }

  const draft = normalizeDraft(parsed.mission || {}, categories);
  const ready = parsed.status === 'ready' && draftIsPublishable(draft);
  // The model said "ready" but forgot the one thing a jobber can't do
  // without: ask for it instead of offering a draft that can't be published.
  const reply = parsed.status === 'ready' && !ready && draft.categoryId && !draft.address
    ? "Presque terminé ! À quelle adresse faut-il intervenir ?"
    : parsed.reply;
  return {
    reply,
    status: ready ? 'ready' : 'question',
    quickReplies: ready ? [] : (parsed.quickReplies || []).slice(0, 4),
    draft: draft.categoryId ? draft : null,
  };
}

module.exports = { runAssistantTurn, normalizeDraft, renderCatalog, coerceDetail };
