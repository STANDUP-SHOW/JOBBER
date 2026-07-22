import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Politique de confidentialité — Jobber';
const description = "Comment Jobber collecte, utilise et protège vos données personnelles.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/confidentialite` },
  robots: { index: true, follow: true },
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-2xl pb-16">
      <span className="label-eyebrow text-moss">Vos données</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Politique de confidentialité</h1>
      <p className="mt-3 text-sm text-slate-500">Dernière mise à jour : 23 juillet 2026.</p>

      <div className="mt-8 space-y-8 text-slate-700">
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">1. Introduction</h2>
          <p className="mt-2">
            Cette politique explique quelles données personnelles {SITE_NAME} collecte lorsque vous utilisez le site
            et l'application, pourquoi, avec qui elles sont partagées, combien de temps elles sont conservées, et
            quels droits vous pouvez exercer.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">2. Principes généraux</h2>
          <p className="mt-2">
            Conformément au Règlement général sur la protection des données (RGPD), la collecte et le traitement de
            vos données respectent les principes de licéité, de finalité déterminée, de minimisation, de durée de
            conservation limitée, et de sécurité. Nous ne collectons que les données nécessaires au fonctionnement
            de la plateforme, et nous ne les traitons que pour les finalités décrites ci-dessous.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">3. Données que nous collectons</h2>
          <p className="mt-2">Lors de la création de votre compte, nous collectons :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Prénom et nom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse postale (pour situer vos missions ou votre zone d'intervention)</li>
          </ul>
          <p className="mt-3">Si vous complétez votre profil ou proposez vos services en tant que jobber, nous pouvons aussi collecter :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Une photo de profil (facultative)</li>
            <li>
              Des documents justificatifs si vous demandez la vérification de votre profil ou déclarez un statut
              professionnel : pièce d'identité, justificatif de domicile, relevé d'identité bancaire, diplômes ou
              titres professionnels, numéro SIRET
            </li>
          </ul>
          <p className="mt-3">
            Lorsque vous effectuez un paiement, vos coordonnées bancaires sont saisies et traitées directement par
            notre prestataire de paiement, <strong>Stripe</strong> — nous n'en conservons jamais le détail sur nos
            propres serveurs.
          </p>
          <p className="mt-3">
            Comme tout site web, nous collectons également des données techniques liées à votre navigation (adresse
            IP, type d'appareil) via nos hébergeurs, à des fins de sécurité et de bon fonctionnement du service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">4. Pourquoi nous les utilisons</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Créer et sécuriser votre compte, et vous permettre de vous connecter</li>
            <li>Mettre en relation les demandeurs et les jobbers autour d'une mission</li>
            <li>Traiter les paiements et sécuriser les fonds jusqu'à validation d'une mission</li>
            <li>Vérifier l'identité et l'éligibilité des jobbers qui en font la demande</li>
            <li>Vous envoyer les notifications liées à vos missions, offres et messages</li>
            <li>Répondre à nos obligations légales et lutter contre la fraude</li>
          </ul>
          <p className="mt-3">
            Ces traitements reposent selon les cas sur votre consentement, sur l'exécution du contrat qui nous lie
            (nos <a href="/conditions-generales" className="text-moss hover:underline">conditions générales</a>),
            ou sur nos obligations légales.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">5. Avec qui vos données sont partagées</h2>
          <p className="mt-2">Vos données ne sont jamais vendues. Elles peuvent être transmises :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Au jobber ou au demandeur concerné par une mission, dans la limite nécessaire à sa réalisation (nom, adresse de la mission, moyen de contact)</li>
            <li><strong>Stripe</strong>, pour le traitement des paiements et des versements aux jobbers</li>
            <li><strong>Cloudinary</strong>, pour l'hébergement des photos et documents que vous mettez en ligne</li>
            <li>Un service de cartographie (Google Maps/Places), pour la saisie et la localisation des adresses</li>
            <li>Nos hébergeurs techniques, <strong>Vercel</strong> et <strong>Railway</strong> (voir nos <a href="/mentions-legales" className="text-moss hover:underline">mentions légales</a>)</li>
            <li>Les autorités compétentes, si la loi nous y oblige</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">6. Combien de temps nous les conservons</h2>
          <p className="mt-2">
            Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre compte, vos
            informations d'identification (nom, email, téléphone, adresse) sont immédiatement anonymisées ; les
            données liées aux missions, paiements et factures déjà réalisés sont conservées pour la durée exigée par
            nos obligations comptables et fiscales (jusqu'à 10 ans conformément au droit français).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">7. Vos droits</h2>
          <p className="mt-2">
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation,
            d'opposition et de portabilité sur vos données. Vous pouvez exercer la plupart de ces droits directement
            depuis votre espace « Informations personnelles », ou en nous contactant à{' '}
            <a href="mailto:contact@jobber.city" className="text-moss hover:underline">contact@jobber.city</a>.
            Nous nous engageons à répondre dans un délai maximum de 30 jours. Vous pouvez également introduire une
            réclamation auprès de la CNIL (cnil.fr).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">8. Cookies</h2>
          <p className="mt-2">
            Le site utilise uniquement des cookies techniques, strictement nécessaires à son fonctionnement (maintien
            de votre connexion, sécurité), ainsi que ceux déposés par le service de cartographie utilisé pour la
            saisie d'adresses. Nous n'utilisons aucun cookie publicitaire ni traceur à des fins de marketing tiers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">9. Modification de cette politique</h2>
          <p className="mt-2">
            Nous pouvons faire évoluer cette politique pour refléter les évolutions du service ou de la
            réglementation. En cas de modification substantielle, nous vous en informerons via l'application.
          </p>
        </section>
      </div>
    </div>
  );
}
