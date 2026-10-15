import MissionAssistant from '../../components/MissionAssistant';
import { SITE_URL } from '../../lib/seo';

export const metadata = {
  title: 'Assistant IA : publiez votre mission en une minute | Jobber',
  description: "Décrivez votre besoin à l'assistant IA de Jobber, ajoutez quelques photos : il complète la mission avec vous et la publie auprès des jobbers près de chez vous.",
  alternates: { canonical: `${SITE_URL}/assistant` },
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">Votre mission en une minute</h1>
      <p className="mt-1 text-sm text-slate-600">
        Dites-nous ce dont vous avez besoin, prenez une photo si ça aide : l'assistant pose une ou deux questions, prépare l'annonce et vous n'avez plus qu'à publier.
      </p>
      <div className="mt-5">
        <MissionAssistant />
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Vous préférez remplir vous-même ? <a href="/missions/new" className="font-medium text-moss hover:underline">Formulaire classique</a>
      </p>
    </div>
  );
}
