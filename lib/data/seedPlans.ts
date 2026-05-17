export type SeedPlan = {
  name: string;
  description: string;
  skillNames: string[];
};

export const SEED_PLANS: SeedPlan[] = [
  {
    name: 'Quick Barre',
    description:
      'A short, classic barre warm-up to wake the legs and feet up before center work.',
    skillNames: [
      'Demi & Grand Pliés',
      'Tendus',
      'Dégagés',
      'Rond de Jambe à Terre',
      'Grand Battement',
    ],
  },
  {
    name: 'Stretch & Strengthen',
    description:
      'A flexibility and core session — great for a rest day or to cool down after class.',
    skillNames: [
      'Butterfly Stretch',
      'Seated Hamstring Stretch',
      'Front Split (Right Leg)',
      'Front Split (Left Leg)',
      'Hip Flexor Stretch',
      'Forearm Plank',
      'Turnout Clams',
      'Theraband Foot Work',
    ],
  },
  {
    name: 'Center Practice',
    description:
      'Move away from the barre and dance: port de bras, traveling steps, and a slow adagio.',
    skillNames: [
      'Port de Bras',
      'Balancé',
      'Pas de Bourrée',
      'Chassé',
      'Adagio Basics',
      'Passé Balance Hold',
      'Pirouette en Dehors',
      'Hollow Body Hold',
    ],
  },
  {
    name: 'Jumps & Turns',
    description:
      'Petite allegro into turns into a big finishing jump. Make sure you are warm first!',
    skillNames: [
      'Sautés',
      'Échappés Sautés',
      'Changements',
      'Assemblé',
      'Chaînés',
      'Grand Jeté',
    ],
  },
];
