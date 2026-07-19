// Natural-language search terms for the "Apprendre" (lessons) local-SEO
// pages — real people search "professeur d'électricité" or "apprendre le
// jardinage", not "cours dans la catégorie Électricité". Only categories
// where a jobber can actually offer lessons in the app are listed here
// (matches the "Espace formation" feature's teachable categories).
export const SEO_LESSON_CATEGORIES = {
  jardinage: {
    title: 'Cours de jardinage',
    teacher: 'un jardinier',
    searchTerms: ['cours de jardinage', 'apprendre le jardinage', 'professeur de jardinage', 'formation jardinage'],
    intro: "Vous voulez apprendre à entretenir votre jardin vous-même ? Un jobber passionné de jardinage vient chez vous pour vous transmettre les bons gestes, en pratique : tonte, taille de haie, entretien, potager.",
  },
  menage: {
    title: 'Cours de ménage',
    teacher: 'une professionnelle du ménage',
    searchTerms: ['cours de ménage', 'apprendre à faire le ménage', 'formation ménage efficace'],
    intro: "Apprenez les techniques et astuces d'une professionnelle du ménage pour gagner du temps et obtenir un résultat impeccable chez vous, en pratique et à votre rythme.",
  },
  electricite: {
    title: "Cours d'électricité",
    teacher: 'un électricien',
    searchTerms: ["professeur d'électricité", "cours d'électricité", "apprendre l'électricité", 'formation électricité domestique'],
    intro: "Vous voulez comprendre votre tableau électrique, changer une prise ou poser un luminaire en toute sécurité ? Un électricien vient chez vous pour vous former en pratique.",
  },
  plomberie: {
    title: 'Cours de plomberie',
    teacher: 'un plombier',
    searchTerms: ['cours de plomberie', 'apprendre la plomberie', 'professeur de plomberie', 'formation plomberie de base'],
    intro: "Réparer une fuite simple, entretenir vos canalisations, comprendre votre installation : un plombier expérimenté vous apprend les bons gestes chez vous, en pratique.",
  },
  bricolage: {
    title: 'Cours de bricolage',
    teacher: 'un bricoleur',
    searchTerms: ['cours de bricolage', 'apprendre le bricolage', 'formation bricolage débutant'],
    intro: "Perceuse, montage de meubles, petites réparations : apprenez les bases du bricolage avec un jobber expérimenté, directement chez vous et en pratique.",
  },
  peinture: {
    title: 'Cours de peinture',
    teacher: 'un peintre',
    searchTerms: ['cours de peinture bâtiment', 'apprendre à peindre un mur', 'formation peinture intérieure'],
    intro: "Peindre un mur sans traces ni coulures, poser du papier peint proprement : un peintre professionnel vous montre les techniques chez vous, en pratique.",
  },
  mecanique: {
    title: 'Cours de mécanique',
    teacher: 'un mécanicien',
    searchTerms: ['cours de mécanique auto', 'apprendre la mécanique', 'formation entretien voiture'],
    intro: "Vidange, contrôle des niveaux, entretien de base de votre voiture, scooter ou moto : un mécanicien vous apprend à faire vous-même les gestes essentiels.",
  },
  informatique: {
    title: "Cours d'informatique",
    teacher: 'un formateur informatique',
    searchTerms: ["cours d'informatique à domicile", 'apprendre l\'informatique', 'initiation informatique seniors'],
    intro: "Sécuriser son ordinateur, faire ses sauvegardes, se familiariser avec un smartphone : un formateur vient chez vous pour une initiation adaptée à votre niveau.",
  },
  piscine: {
    title: 'Cours d\'entretien de piscine',
    teacher: 'un pisciniste',
    searchTerms: ["cours d'entretien piscine", 'apprendre à entretenir sa piscine', 'formation piscine hivernage'],
    intro: "Analyse de l'eau, nettoyage, hivernage : un pisciniste vous apprend à entretenir votre piscine vous-même, pour ne plus dépendre de personne.",
  },
};
