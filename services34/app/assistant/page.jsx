import MissionAssistant from '../../components/MissionAssistant';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Assistant IA : votre demande en une minute | Services 34';
const description = "Décrivez votre besoin à l'assistant Services 34, ajoutez une photo : il prépare votre demande d'intervention avec vous en une minute.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/assistant` },
  openGraph: { title, description, url: `${SITE_URL}/assistant`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">Votre demande en une minute</h1>
      <p className="mt-1 text-sm text-slate-600">
        Dites-nous ce dont vous avez besoin, prenez une photo si ça aide : l'assistant pose une ou deux questions et prépare votre demande d'intervention.
      </p>
      <div className="mt-5">
        <MissionAssistant />
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Vous préférez remplir vous-même ? <a href="/demande" className="font-medium text-brand hover:underline">Formulaire de demande</a>
      </p>
    </div>
  );
}
