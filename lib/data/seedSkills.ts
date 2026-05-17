import type { Difficulty } from '@/lib/types';

export type SeedSkillCategory =
  | 'Barre'
  | 'Center'
  | 'Jumps'
  | 'Turns'
  | 'Stretches'
  | 'Conditioning';

export type SeedSkill = {
  name: string;
  category: SeedSkillCategory;
  description: string;
  techniqueTips: string[];
  trains: string[];
  difficulty: Difficulty;
  defaultDurationSeconds: number;
};

export const SEED_SKILLS: SeedSkill[] = [
  {
    name: 'Demi & Grand Pliés',
    category: 'Barre',
    description:
      'Plié — a smooth bend at the knees. Demi is a half bend (heels stay down); grand is a deep bend where the heels lift in most positions.',
    techniqueTips: [
      'Imagine melting down like warm ice cream, then growing tall like a tree.',
      'Knees track right over your toes — like little flashlights pointing the same way as your feet.',
      'Keep your shoulders soft and away from your ears.',
    ],
    trains: ['Quads', 'Glutes', 'Turnout', 'Control'],
    difficulty: 1,
    defaultDurationSeconds: 180,
  },
  {
    name: 'Tendus',
    category: 'Barre',
    description:
      'Tendu — stretching one foot along the floor until the toes point, then sliding it back home. The toes never leave the ground.',
    techniqueTips: [
      'Pretend your toe is painting a line of glitter on the floor.',
      'Squeeze the floor away as the foot slides out.',
      'Keep your standing leg long and your hips facing forward like headlights.',
    ],
    trains: ['Feet', 'Turnout', 'Control', 'Posture'],
    difficulty: 1,
    defaultDurationSeconds: 150,
  },
  {
    name: 'Dégagés',
    category: 'Barre',
    description:
      'Dégagé — a quick tendu where the toe brushes the floor and pops just a few inches into the air.',
    techniqueTips: [
      'Brush the floor like you are flicking water off your toe.',
      'Sharp out, controlled back in — like a snapping rubber band.',
      'Hips stay quiet — only the leg is doing the work.',
    ],
    trains: ['Feet', 'Calves', 'Control', 'Coordination'],
    difficulty: 2,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Rond de Jambe à Terre',
    category: 'Barre',
    description:
      'Rond de jambe — drawing a half-circle on the floor with your pointed toe, from front, to side, to back (or the reverse).',
    techniqueTips: [
      'Pretend you are drawing the letter D on the floor with your big toe.',
      'Standing leg stays still — only the working leg travels.',
      'Keep the circle smooth, like icing a cake.',
    ],
    trains: ['Hip Flexors', 'Turnout', 'Control', 'Coordination'],
    difficulty: 2,
    defaultDurationSeconds: 150,
  },
  {
    name: 'Fondus',
    category: 'Barre',
    description:
      'Fondu — meaning "melting." You bend the standing leg while the working leg unfolds, then both stretch together.',
    techniqueTips: [
      'Both legs melt and grow at the same time — like an elevator going down and up.',
      'Keep your weight centered over the ball of the standing foot.',
      'Slow and creamy — no jerky motion.',
    ],
    trains: ['Quads', 'Balance', 'Control', 'Coordination'],
    difficulty: 3,
    defaultDurationSeconds: 150,
  },
  {
    name: 'Frappés',
    category: 'Barre',
    description:
      'Frappé — meaning "struck." The foot strikes out from the ankle of the standing leg like a tiny spark.',
    techniqueTips: [
      'Imagine flicking a marshmallow off your ankle.',
      'Sharp and quick out, but stay light — no stomping.',
      'Toes point the second they leave the ankle.',
    ],
    trains: ['Feet', 'Calves', 'Power', 'Coordination'],
    difficulty: 3,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Développé',
    category: 'Barre',
    description:
      'Développé — meaning "unfolded." The foot slides up the standing leg to the knee, then slowly unfolds out into the air.',
    techniqueTips: [
      'Unfold the leg like a flower opening, petal by petal.',
      'Keep both hips level — pretend a glass of water is balanced on each one.',
      'It does not have to be high — high comes later. Aim for clean.',
    ],
    trains: ['Hip Flexors', 'Quads', 'Flexibility', 'Control'],
    difficulty: 3,
    defaultDurationSeconds: 150,
  },
  {
    name: 'Grand Battement',
    category: 'Barre',
    description:
      'Grand battement — a big throw of the leg into the air, front, side, or back, with both legs straight.',
    techniqueTips: [
      'Throw the leg up like you are kicking a balloon — light, not heavy.',
      'The lift is up, but landing is just as important — bring it down quietly.',
      'Standing leg is your pole — straight, strong, planted.',
    ],
    trains: ['Hip Flexors', 'Hamstrings', 'Power', 'Flexibility'],
    difficulty: 2,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Port de Bras',
    category: 'Center',
    description:
      'Port de bras — the way you carry your arms through the positions. It is the dance your arms do while your legs are still.',
    techniqueTips: [
      'Pretend you are gliding your hands across the top of a calm lake.',
      'Lead with the elbows, finish with the fingertips.',
      'Shoulders stay low — even when arms go high.',
    ],
    trains: ['Arms', 'Shoulders', 'Posture', 'Musicality'],
    difficulty: 1,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Balancé',
    category: 'Center',
    description:
      'Balancé — a rocking waltz step: down, up, up, like a swaying boat. It travels side to side.',
    techniqueTips: [
      'Feel the rhythm: BIG, little, little.',
      'Use your whole body — arms, head, eyes all sway with you.',
      'Stay light on the up-steps, like you are bouncing on a cloud.',
    ],
    trains: ['Coordination', 'Musicality', 'Rhythm', 'Balance'],
    difficulty: 2,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Pas de Bourrée',
    category: 'Center',
    description:
      'Pas de bourrée — a tiny three-step pattern (back, side, front) that often sets you up for a turn or jump.',
    techniqueTips: [
      'Quick and tidy — like running on hot sand.',
      'Each step is a relevé, not a flat-foot stomp.',
      'Count it like a heartbeat: one-two-three, one-two-three.',
    ],
    trains: ['Feet', 'Calves', 'Coordination', 'Rhythm'],
    difficulty: 2,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Soutenu en Tournant',
    category: 'Center',
    description:
      'Soutenu — a "sustained" turn where you draw your feet together in a high relevé and spin around as one tall pencil.',
    techniqueTips: [
      'Become one straight pencil — legs glued together.',
      'Pull up out of the floor, do not sit into the turn.',
      'Spot a single point on the wall and snap your head back to it.',
    ],
    trains: ['Calves', 'Spotting', 'Balance', 'Control'],
    difficulty: 3,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Adagio Basics',
    category: 'Center',
    description:
      'Adagio — slow, controlled movements like développés and balances in the center. It is how dancers build strength to look graceful.',
    techniqueTips: [
      'Move like honey pouring — slow and continuous.',
      'Find your balance by pulling up, not by gripping the floor.',
      'Breathe through every shape; do not hold your breath.',
    ],
    trains: ['Core', 'Balance', 'Control', 'Strength'],
    difficulty: 3,
    defaultDurationSeconds: 180,
  },
  {
    name: 'Chassé',
    category: 'Center',
    description:
      'Chassé — meaning "chased." One foot chases the other across the floor in a smooth gliding step.',
    techniqueTips: [
      'One foot chases the other — they never quite catch up.',
      'Glide low to the floor like you are skating on butter.',
      'Keep your torso lifted even though your feet are skimming.',
    ],
    trains: ['Quads', 'Coordination', 'Control', 'Musicality'],
    difficulty: 2,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Sautés',
    category: 'Jumps',
    description:
      'Sauté — a simple jump straight up and down from two feet, in first, second, or fifth position.',
    techniqueTips: [
      'Push the floor away — the floor jumps you, you do not lift yourself.',
      'Point your toes the instant your feet leave the ground.',
      'Land through toes, ball, heel — soft like a cat.',
    ],
    trains: ['Calves', 'Quads', 'Power', 'Jump Height'],
    difficulty: 1,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Échappés Sautés',
    category: 'Jumps',
    description:
      'Échappé — "escaped." You jump from fifth position and your feet escape out to second, then jump back together.',
    techniqueTips: [
      'In the air, your feet "escape" apart — out, then back home.',
      'Land in plié every single time, no stiff legs.',
      'Try not to look down — eyes forward like you are watching a friend.',
    ],
    trains: ['Calves', 'Turnout', 'Power', 'Coordination'],
    difficulty: 2,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Changements',
    category: 'Jumps',
    description:
      'Changement — "change." A jump from fifth position where the feet swap which one is in front before you land.',
    techniqueTips: [
      'In the air, switch the feet like turning a page.',
      'Stay lifted — do not crunch down between jumps.',
      'Heels press down each landing — never skip the heels.',
    ],
    trains: ['Calves', 'Feet', 'Power', 'Coordination'],
    difficulty: 2,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Assemblé',
    category: 'Jumps',
    description:
      'Assemblé — "assembled." One foot brushes out, the other pushes off, and they meet in the air to land together.',
    techniqueTips: [
      'The two feet shake hands in the air before landing.',
      'Brush the floor sharp — that brush is what sends you up.',
      'Land in a tidy fifth, not a sloppy plop.',
    ],
    trains: ['Calves', 'Power', 'Coordination', 'Jump Height'],
    difficulty: 3,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Jeté',
    category: 'Jumps',
    description:
      'Jeté — "thrown." A small jump from one foot to the other, throwing the working leg out and landing on it.',
    techniqueTips: [
      'You are thrown like a paper airplane — light and gliding.',
      'Both legs straighten in the air for a second.',
      'Land softly on one leg in plié.',
    ],
    trains: ['Calves', 'Power', 'Coordination', 'Balance'],
    difficulty: 3,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Sissonne',
    category: 'Jumps',
    description:
      'Sissonne — a jump that takes off from two feet and lands on one, with the other leg extended.',
    techniqueTips: [
      'Two feet push, one foot catches.',
      'Imagine your back leg is a tail pointing behind you in the air.',
      'Reach the shape before you land — do not collapse on touchdown.',
    ],
    trains: ['Glutes', 'Power', 'Coordination', 'Jump Height'],
    difficulty: 3,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Grand Jeté',
    category: 'Jumps',
    description:
      'Grand jeté — a big leap across the floor, splitting the legs in the air. The "flying split" jump.',
    techniqueTips: [
      'Run-up is everything — push the floor on the last step.',
      'Aim to fly forward, not just up. Imagine leaping over a puddle.',
      'Front leg reaches first, like reaching for a cookie on a shelf.',
    ],
    trains: ['Power', 'Jump Height', 'Flexibility', 'Coordination'],
    difficulty: 4,
    defaultDurationSeconds: 180,
  },
  {
    name: 'Pirouette en Dehors',
    category: 'Turns',
    description:
      'Pirouette en dehors — a turn on one leg that spins outward, away from the standing leg. Usually one full rotation at this level.',
    techniqueTips: [
      'Spot the wall: eyes whip around faster than your body.',
      'Pull up tall — long like a candle, not a slumpy bean bag.',
      'Working knee stays at the side of the kneecap, glued there.',
    ],
    trains: ['Core', 'Balance', 'Spotting', 'Control'],
    difficulty: 3,
    defaultDurationSeconds: 180,
  },
  {
    name: 'Pirouette en Dedans',
    category: 'Turns',
    description:
      'Pirouette en dedans — a turn on one leg that spins inward, toward the standing leg.',
    techniqueTips: [
      'Step into the turn like stepping onto an escalator that pulls you around.',
      'Spot, spot, spot — your head is the steering wheel.',
      'Land in a tidy fourth or fifth, not a stumble.',
    ],
    trains: ['Core', 'Balance', 'Spotting', 'Control'],
    difficulty: 4,
    defaultDurationSeconds: 180,
  },
  {
    name: 'Piqué Turns',
    category: 'Turns',
    description:
      'Piqué turn — you step directly onto a high straight leg ("piqué" means "pricked") and turn once, then step and repeat across the floor.',
    techniqueTips: [
      'Step straight up onto the leg — no sinking into the knee.',
      'The other foot tucks neatly to the side of the knee.',
      'Spot a clock on the wall and find it every single turn.',
    ],
    trains: ['Calves', 'Spotting', 'Balance', 'Coordination'],
    difficulty: 3,
    defaultDurationSeconds: 150,
  },
  {
    name: 'Chaînés',
    category: 'Turns',
    description:
      'Chaînés — "chains." A line of fast, tiny half-turns on two straight legs traveling across the floor.',
    techniqueTips: [
      'Stay on the tippy-tops of your feet — high relevé the whole way.',
      'Legs glued together like one chopstick.',
      'Spot fast — your head leads, your feet follow.',
    ],
    trains: ['Calves', 'Spotting', 'Coordination', 'Endurance'],
    difficulty: 3,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Quarter & Half Turns (Prep)',
    category: 'Turns',
    description:
      'Quarter and half turns — small practice turns to build balance and spotting before doing full pirouettes.',
    techniqueTips: [
      'Find your balance in passé BEFORE you try to turn.',
      'Hold the finish for two seconds — sticky landing, no wobble.',
      'Each quarter is a tiny goal — collect them like coins.',
    ],
    trains: ['Balance', 'Spotting', 'Control', 'Coordination'],
    difficulty: 1,
    defaultDurationSeconds: 120,
  },
  {
    name: 'Front Split (Right Leg)',
    category: 'Stretches',
    description:
      'Front split with the right leg forward — stretches the right hamstring and the left hip flexor at the same time.',
    techniqueTips: [
      'Square your hips like the headlights of a car pointing straight ahead.',
      'Go only to your edge — discomfort yes, sharp pain never.',
      'Breathe out and sink a tiny bit deeper on each exhale.',
    ],
    trains: ['Hamstrings', 'Hip Flexors', 'Flexibility'],
    difficulty: 3,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Front Split (Left Leg)',
    category: 'Stretches',
    description:
      'Front split with the left leg forward — same as the right side, because both legs need equal love.',
    techniqueTips: [
      'Both hips face front — no twisting open.',
      'Hands can press into the floor or blocks to support you.',
      'Stay in it long enough to actually breathe — 5 slow breaths minimum.',
    ],
    trains: ['Hamstrings', 'Hip Flexors', 'Flexibility'],
    difficulty: 3,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Middle Split',
    category: 'Stretches',
    description:
      'Middle split — also called a side or straddle split. Both legs reach straight out to the sides.',
    techniqueTips: [
      'Sit up tall first — slumping closes the stretch.',
      'Walk your hands forward only as far as you can keep a long back.',
      'Knees and toes point UP, not forward — that protects your knees.',
    ],
    trains: ['Adductors', 'Flexibility', 'Turnout'],
    difficulty: 3,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Butterfly Stretch',
    category: 'Stretches',
    description:
      'Butterfly — sit with the soles of your feet together and let your knees fall open like butterfly wings.',
    techniqueTips: [
      'Sit tall — pretend a balloon is lifting the top of your head.',
      'Do not push the knees down with your hands; let gravity do it.',
      'Fold forward from your hips, not your shoulders.',
    ],
    trains: ['Adductors', 'Hip Flexors', 'Flexibility', 'Turnout'],
    difficulty: 1,
    defaultDurationSeconds: 60,
  },
  {
    name: 'Gentle Back Arch (Cobra)',
    category: 'Stretches',
    description:
      'A gentle back stretch on the belly, pressing the chest up like a cobra. Opens the front of the body.',
    techniqueTips: [
      'Press the floor with your hands like you are pushing a wall away.',
      'Shoulders stay low, away from your ears.',
      'Only go as high as feels good — no pinching in the lower back.',
    ],
    trains: ['Back', 'Flexibility', 'Posture'],
    difficulty: 2,
    defaultDurationSeconds: 60,
  },
  {
    name: 'Hip Flexor Stretch',
    category: 'Stretches',
    description:
      'A kneeling lunge stretch for the front of the hip — the part that gets tight from sitting and from développés.',
    techniqueTips: [
      'Tuck your tail under like a puppy hiding its tail.',
      'Press the front of the back hip toward the floor.',
      'Keep the front knee right over the front ankle, not past your toes.',
    ],
    trains: ['Hip Flexors', 'Flexibility', 'Posture'],
    difficulty: 2,
    defaultDurationSeconds: 60,
  },
  {
    name: 'Seated Hamstring Stretch',
    category: 'Stretches',
    description:
      'Sit with one leg straight out and reach for the toes. Stretches the back of the leg for higher kicks and développés.',
    techniqueTips: [
      'Lead with your chest, not your forehead — long spine wins.',
      'Flex the foot strongly — toes point at your nose.',
      'A little reach for a long time beats a big reach for a second.',
    ],
    trains: ['Hamstrings', 'Back', 'Flexibility'],
    difficulty: 2,
    defaultDurationSeconds: 60,
  },
  {
    name: 'Forearm Plank',
    category: 'Conditioning',
    description:
      'A plank on the forearms to build the core muscles that hold you up tall in every step.',
    techniqueTips: [
      'Make your body one straight line — no banana, no mountain.',
      'Imagine zipping a jacket from your belly button up to your chin.',
      'Look at the floor between your hands so your neck stays long.',
    ],
    trains: ['Core', 'Shoulders', 'Strength', 'Endurance'],
    difficulty: 2,
    defaultDurationSeconds: 60,
  },
  {
    name: 'Hollow Body Hold',
    category: 'Conditioning',
    description:
      'Lie on your back, lift the legs and shoulders, and scoop your belly to form a "banana" shape. Builds deep core strength for balance.',
    techniqueTips: [
      'Press your lower back into the floor like you are squishing a grape.',
      'If it is too hard, bend the knees or lower the arms.',
      'Breathe — small sips of air, do not hold your breath.',
    ],
    trains: ['Core', 'Strength', 'Control', 'Endurance'],
    difficulty: 3,
    defaultDurationSeconds: 45,
  },
  {
    name: 'Theraband Foot Work',
    category: 'Conditioning',
    description:
      'Sitting with a stretchy band around the ball of the foot, point and flex against the band to strengthen the feet and ankles.',
    techniqueTips: [
      'Point through the ball of the foot first, then the toes — like rolling toothpaste out of a tube.',
      'Slow on the way out, slow on the way back — fight the band both directions.',
      'Keep the leg quiet — only the foot is working.',
    ],
    trains: ['Feet', 'Ankles', 'Strength', 'Control'],
    difficulty: 1,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Relevés at the Barre',
    category: 'Conditioning',
    description:
      'Rising up to the balls of the feet and lowering back down. Builds the calves and the high arches dancers need.',
    techniqueTips: [
      'Rise straight up — do not roll out toward the pinky toe.',
      'Big toe, second toe, and third toe all press the floor evenly.',
      'Come down slowly — the lowering builds the strength.',
    ],
    trains: ['Calves', 'Feet', 'Ankles', 'Strength'],
    difficulty: 1,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Calf Raises (Single Leg)',
    category: 'Conditioning',
    description:
      'One-legged relevés, holding the barre or a chair lightly. Stronger calves mean higher jumps and better balance.',
    techniqueTips: [
      'Light fingers on the barre — it is a guide, not a crutch.',
      'Aim to do them slow: 3 counts up, 3 counts down.',
      'If you wobble, that is good — your balance is learning.',
    ],
    trains: ['Calves', 'Ankles', 'Balance', 'Strength'],
    difficulty: 2,
    defaultDurationSeconds: 90,
  },
  {
    name: 'Turnout Clams',
    category: 'Conditioning',
    description:
      'Lie on your side with knees bent and open the top knee like a clam shell. Strengthens the hip muscles that make turnout work.',
    techniqueTips: [
      'Keep your feet glued together as the knee opens.',
      'Do not let your top hip roll backward — stack the hips.',
      'Slow and small beats fast and floppy.',
    ],
    trains: ['Glutes', 'Turnout', 'Hip Flexors', 'Strength'],
    difficulty: 2,
    defaultDurationSeconds: 60,
  },
  {
    name: 'Passé Balance Hold',
    category: 'Conditioning',
    description:
      'Stand on one leg with the other foot at the side of the knee (passé) and hold. Trains the balance you need for every pirouette.',
    techniqueTips: [
      'Pull UP out of the standing leg, do not sink into the hip.',
      'Fix your eyes on one spot on the wall — your eyes are your anchor.',
      'When you wobble, do not give up — adjust and find it again.',
    ],
    trains: ['Core', 'Balance', 'Turnout', 'Control'],
    difficulty: 2,
    defaultDurationSeconds: 60,
  },
];
