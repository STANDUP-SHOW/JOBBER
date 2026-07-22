import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Conditions générales — Jobber';
const description = "Modalités d'accès et d'utilisation de la plateforme Jobber, droits et obligations des demandeurs et des jobbers.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conditions-generales` },
  robots: { index: true, follow: true },
};

function Article({ n, title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink">Article {n} — {title}</h2>
      <div className="mt-2 space-y-3 text-slate-700">{children}</div>
    </section>
  );
}

export default function ConditionsGeneralesPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16">
      <span className="label-eyebrow text-moss">Contrat</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Conditions générales</h1>
      <p className="mt-3 text-sm text-slate-500">Dernière mise à jour : 23 juillet 2026.</p>

      <p className="mt-6 text-slate-700">
        Les présentes conditions générales (« CG ») définissent les modalités d'accès et d'utilisation de la
        plateforme {SITE_NAME}, éditée par SERVICES 34 (voir nos <Link href="/mentions-legales" className="text-moss hover:underline">mentions légales</Link>),
        ainsi que les droits et obligations des utilisateurs. Elles ne régissent pas la relation contractuelle
        conclue directement entre un demandeur et un jobber à l'occasion d'une mission, ces derniers agissant en
        leur nom et pour leur propre compte.
      </p>

      <Article n="1" title="Définitions">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Demandeur (ou Manager)</strong> : toute personne, particulière ou entreprise, qui publie une mission sur la plateforme.</li>
          <li><strong>Jobber</strong> : toute personne physique inscrite pour proposer ou réaliser des missions.</li>
          <li><strong>Mission</strong> : la tâche ou prestation publiée par un demandeur et pouvant être réalisée par un jobber.</li>
          <li><strong>Compte entreprise</strong> : compte souscrit par une personne morale, ouvert exclusivement via le formulaire dédié aux entreprises.</li>
          <li><strong>Portefeuille</strong> : le solde disponible sur le compte d'un utilisateur, alimenté par les paiements reçus.</li>
        </ul>
      </Article>

      <Article n="2" title="Rôle de Jobber">
        <p>
          Jobber exploite une plateforme de mise en relation entre demandeurs et jobbers. À ce titre, Jobber agit
          exclusivement en qualité d'intermédiaire technique : publication et consultation de missions, mise en
          relation, messagerie, et facilitation des paiements via notre prestataire de services de paiement Stripe.
        </p>
        <p>
          Jobber n'est pas partie au contrat conclu entre un demandeur et un jobber, n'agit ni en qualité
          d'employeur, ni d'agence d'intérim, ni de mandataire de l'une ou l'autre partie, et n'exerce aucun lien de
          subordination envers les jobbers. Les demandeurs et les jobbers sont seuls responsables de la bonne
          exécution des missions convenues entre eux.
        </p>
        <p>
          Jobber n'exerce aucun contrôle sur la qualité, la conformité ou la bonne réalisation des missions, ni sur
          les compétences ou qualifications déclarées par les jobbers au-delà des vérifications décrites à
          l'Article 4.
        </p>
      </Article>

      <Article n="3" title="Accès à la plateforme">
        <p>
          L'inscription est ouverte à toute personne physique majeure disposant de la capacité juridique de
          contracter. Un compte individuel permet à la fois de publier des missions (demandeur) et d'y candidater
          (jobber) depuis le même profil.
        </p>
        <p>
          L'ouverture d'un compte entreprise est réservée aux personnes morales et n'est possible que via le
          formulaire dédié « Ouvrir un compte entreprise », qui requiert une raison sociale et un numéro SIRET
          valide.
        </p>
        <p>
          Chaque compte est strictement personnel. L'utilisateur est responsable de la confidentialité de ses
          identifiants et de toute action effectuée depuis son compte.
        </p>
      </Article>

      <Article n="4" title="Vérification des profils">
        <p>
          Un jobber peut demander la vérification de son profil en transmettant une pièce d'identité, un justificatif
          de domicile et un relevé d'identité bancaire. Une fois ces documents approuvés, un badge « ✓ Vérifié »
          s'affiche sur son profil public.
        </p>
        <p>
          Un utilisateur peut également déclarer un statut de professionnel lors de son inscription, sous réserve de
          renseigner un numéro SIRET valide — un badge « PRO » s'affiche alors sur son profil public. Jobber ne
          garantit pas l'exhaustivité de cette vérification et n'effectue pas de contrôle systématique des
          qualifications, diplômes ou assurances professionnelles déclarés par les jobbers. Il appartient au
          demandeur de procéder à toute vérification complémentaire qu'il jugerait utile avant de sélectionner un
          jobber.
        </p>
      </Article>

      <Article n="5" title="Publication et candidature à une mission">
        <p>
          Le demandeur publie une mission en décrivant la catégorie, l'adresse, la date souhaitée et la durée
          estimée. Il est seul responsable de l'exactitude de cette description.
        </p>
        <p>
          Les jobbers inscrits dans la catégorie concernée peuvent candidater en proposant leur tarif horaire. Le
          demandeur est libre de sélectionner le jobber de son choix parmi les candidatures reçues, sous sa seule
          responsabilité.
        </p>
      </Article>

      <Article n="6" title="Paiement et séquestre">
        <p>
          Dès l'acceptation d'une candidature, le montant de la mission (durée estimée × tarif horaire), majoré le
          cas échéant des frais de service définis à l'Article 8, est prélevé via Stripe et conservé en séquestre.
        </p>
        <p>
          À l'issue de la mission, le demandeur valide la bonne exécution de celle-ci depuis son espace Jobber. Cette
          validation déclenche le versement du montant dû au jobber, déduction faite des frais applicables. En cas de
          litige signalé avant validation, le versement peut être suspendu conformément à l'Article 11.
        </p>
        <p>
          Jobber n'est pas un établissement de paiement et ne conserve pas elle-même les fonds : ceux-ci sont traités
          par Stripe conformément aux conditions contractuelles de Stripe, auxquelles l'utilisateur consent en
          utilisant les services de paiement de la plateforme.
        </p>
      </Article>

      <Article n="7" title="Heures supplémentaires">
        <p>
          Toute rémunération complémentaire liée à un dépassement de la durée initialement réservée doit faire
          l'objet d'un accord exprès du demandeur avant d'être facturée. À défaut d'accord, aucune somme
          supplémentaire ne peut être exigée.
        </p>
      </Article>

      <Article n="8" title="Frais de service et abonnements">
        <p>
          Jobber donne accès à l'ensemble de ses fonctionnalités gratuitement. Sauf abonnement actif, des frais fixes
          sont appliqués à chaque mission réalisée :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>2,50 € à la charge du demandeur individuel, et 2,50 € à la charge du jobber, par mission ;</li>
          <li>10 € à la charge du demandeur, sans frais pour le jobber, lorsque la mission est publiée par un compte entreprise.</li>
        </ul>
        <p>
          Des abonnements mensuels facultatifs (détaillés sur notre page{' '}
          <Link href="/frais" className="text-moss hover:underline">Nos frais</Link>) permettent de supprimer ces
          frais dans la limite d'un nombre de missions par mois selon la formule souscrite. Ils sont résiliables à
          tout moment, la résiliation prenant effet à la fin de la période déjà payée.
        </p>
      </Article>

      <Article n="9" title="Annulation">
        <p>
          Le demandeur ou le jobber peut annuler une mission avant sa réalisation. En cas d'annulation par le
          demandeur, le montant de la mission lui est recrédité, les frais de service déjà perçus restant acquis à
          Jobber. En cas d'annulation par le jobber, le montant de la mission ainsi que les frais de service sont
          recrédités au demandeur, qui peut republier sa mission sans frais additionnel.
        </p>
        <p>
          Une mission déjà exécutée, totalement ou partiellement, ne peut plus être annulée : toute contestation
          relève alors de la procédure de litige décrite à l'Article 11.
        </p>
        <p>
          Des annulations répétées ou abusives peuvent entraîner la suspension du compte concerné, dans les
          conditions de l'Article 12.
        </p>
      </Article>

      <Article n="10" title="Droit de rétractation">
        <p>
          Jobber n'étant pas partie au contrat conclu entre un demandeur et un jobber, le droit de rétractation
          prévu par le Code de la consommation ne s'applique pas à Jobber au titre de ces missions. Il appartient,
          le cas échéant, au jobber professionnel de le proposer directement au demandeur consommateur.
        </p>
        <p>
          Concernant les abonnements souscrits directement auprès de Jobber (Article 8), l'utilisateur consommateur
          dispose d'un délai de 14 jours à compter de la souscription pour se rétracter, sauf s'il a expressément
          demandé l'exécution immédiate du service et reconnu perdre son droit de rétractation une fois celui-ci
          pleinement exécuté.
        </p>
      </Article>

      <Article n="11" title="Litige relatif à une mission">
        <p>
          En cas de désaccord sur l'exécution d'une mission, le demandeur ou le jobber peut nous le signaler avant
          validation du paiement. Jobber peut, à sa discrétion et à titre de simple facilitateur, prendre contact
          avec les deux parties pour faciliter une résolution amiable, sans disposer d'un pouvoir de décision
          contraignant. À défaut d'accord amiable, chaque partie conserve la faculté de faire valoir ses droits par
          toute voie de droit.
        </p>
      </Article>

      <Article n="12" title="Suspension et résiliation">
        <p>
          Jobber se réserve le droit de suspendre ou de résilier le compte d'un utilisateur en cas de manquement aux
          présentes CG, de comportement frauduleux, ou d'usage abusif de la plateforme, après notification préalable
          sauf en cas de manquement grave justifiant une mesure immédiate.
        </p>
        <p>
          Tout utilisateur peut à tout moment demander la suppression de son compte depuis son espace personnel,
          sous réserve du règlement des missions en cours.
        </p>
      </Article>

      <Article n="13" title="Avis et évaluations">
        <p>
          À l'issue d'une mission, le demandeur peut publier un avis et une note concernant le jobber. Ces avis sont
          publiés sous la responsabilité de leur auteur et ne peuvent être modifiés par le jobber concerné. Jobber se
          réserve le droit de retirer tout avis manifestement illicite, frauduleux ou contraire aux présentes CG.
        </p>
      </Article>

      <Article n="14" title="Responsabilité de Jobber">
        <p>
          La responsabilité de Jobber, lorsqu'elle est engagée, est limitée aux dommages directs résultant d'une
          faute prouvée dans la fourniture de son service d'intermédiation, à l'exclusion de tout dommage indirect.
          Elle ne saurait être tenue responsable des faits, actes ou omissions imputables à un demandeur, un jobber
          ou tout autre tiers.
        </p>
      </Article>

      <Article n="15" title="Propriété intellectuelle">
        <p>
          La plateforme et l'ensemble de ses éléments (structure, textes, graphismes, logo, base de données) sont la
          propriété exclusive de SERVICES 34 et protégés par le droit de la propriété intellectuelle. Toute
          reproduction ou exploitation non autorisée est interdite.
        </p>
        <p>
          En publiant un contenu sur la plateforme (description de mission, photo, avis…), l'utilisateur concède à
          Jobber une licence non exclusive et gratuite d'utilisation de ce contenu, pour les besoins du
          fonctionnement et de la promotion de la plateforme.
        </p>
      </Article>

      <Article n="16" title="Données personnelles">
        <p>
          Les modalités de collecte et de traitement de vos données personnelles sont décrites dans notre{' '}
          <Link href="/confidentialite" className="text-moss hover:underline">politique de confidentialité</Link>.
        </p>
      </Article>

      <Article n="17" title="Médiation et réclamations">
        <p>
          En cas de litige avec Jobber, l'utilisateur consommateur est invité à nous contacter en priorité à{' '}
          <a href="mailto:contact@jobber.city" className="text-moss hover:underline">contact@jobber.city</a>.
          À défaut de résolution amiable, il peut recourir à tout mode de règlement amiable des différends de son
          choix, sans que cela ne le prive de son droit de saisir les juridictions compétentes.
        </p>
      </Article>

      <Article n="18" title="Droit applicable">
        <p>
          Les présentes CG sont soumises au droit français. Tout litige sera porté devant les juridictions
          françaises compétentes, sous réserve des dispositions impératives protégeant les consommateurs.
        </p>
      </Article>
    </div>
  );
}
