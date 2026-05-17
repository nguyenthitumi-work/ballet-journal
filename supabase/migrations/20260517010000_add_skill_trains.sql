-- Add a `trains` text[] column to skill so each skill can list what it
-- trains (body parts and qualities like "Core", "Balance", "Turnout").
-- New rows default to '{}'. Existing rows are backfilled by name match
-- against the canonical seed list — users already onboarded keep their
-- IDs and any progress, but their skills now show tags.

ALTER TABLE skill
  ADD COLUMN trains text[] NOT NULL DEFAULT '{}';

WITH seed(name, trains) AS (
  VALUES
    ('Demi & Grand Pliés',          ARRAY['Quads','Glutes','Turnout','Control']),
    ('Tendus',                      ARRAY['Feet','Turnout','Control','Posture']),
    ('Dégagés',                     ARRAY['Feet','Calves','Control','Coordination']),
    ('Rond de Jambe à Terre',       ARRAY['Hip Flexors','Turnout','Control','Coordination']),
    ('Fondus',                      ARRAY['Quads','Balance','Control','Coordination']),
    ('Frappés',                     ARRAY['Feet','Calves','Power','Coordination']),
    ('Développé',                   ARRAY['Hip Flexors','Quads','Flexibility','Control']),
    ('Grand Battement',             ARRAY['Hip Flexors','Hamstrings','Power','Flexibility']),
    ('Port de Bras',                ARRAY['Arms','Shoulders','Posture','Musicality']),
    ('Balancé',                     ARRAY['Coordination','Musicality','Rhythm','Balance']),
    ('Pas de Bourrée',              ARRAY['Feet','Calves','Coordination','Rhythm']),
    ('Soutenu en Tournant',         ARRAY['Calves','Spotting','Balance','Control']),
    ('Adagio Basics',               ARRAY['Core','Balance','Control','Strength']),
    ('Chassé',                      ARRAY['Quads','Coordination','Control','Musicality']),
    ('Sautés',                      ARRAY['Calves','Quads','Power','Jump Height']),
    ('Échappés Sautés',             ARRAY['Calves','Turnout','Power','Coordination']),
    ('Changements',                 ARRAY['Calves','Feet','Power','Coordination']),
    ('Assemblé',                    ARRAY['Calves','Power','Coordination','Jump Height']),
    ('Jeté',                        ARRAY['Calves','Power','Coordination','Balance']),
    ('Sissonne',                    ARRAY['Glutes','Power','Coordination','Jump Height']),
    ('Grand Jeté',                  ARRAY['Power','Jump Height','Flexibility','Coordination']),
    ('Pirouette en Dehors',         ARRAY['Core','Balance','Spotting','Control']),
    ('Pirouette en Dedans',         ARRAY['Core','Balance','Spotting','Control']),
    ('Piqué Turns',                 ARRAY['Calves','Spotting','Balance','Coordination']),
    ('Chaînés',                     ARRAY['Calves','Spotting','Coordination','Endurance']),
    ('Quarter & Half Turns (Prep)', ARRAY['Balance','Spotting','Control','Coordination']),
    ('Front Split (Right Leg)',     ARRAY['Hamstrings','Hip Flexors','Flexibility']),
    ('Front Split (Left Leg)',      ARRAY['Hamstrings','Hip Flexors','Flexibility']),
    ('Middle Split',                ARRAY['Adductors','Flexibility','Turnout']),
    ('Butterfly Stretch',           ARRAY['Adductors','Hip Flexors','Flexibility','Turnout']),
    ('Gentle Back Arch (Cobra)',    ARRAY['Back','Flexibility','Posture']),
    ('Hip Flexor Stretch',          ARRAY['Hip Flexors','Flexibility','Posture']),
    ('Seated Hamstring Stretch',    ARRAY['Hamstrings','Back','Flexibility']),
    ('Forearm Plank',               ARRAY['Core','Shoulders','Strength','Endurance']),
    ('Hollow Body Hold',            ARRAY['Core','Strength','Control','Endurance']),
    ('Theraband Foot Work',         ARRAY['Feet','Ankles','Strength','Control']),
    ('Relevés at the Barre',        ARRAY['Calves','Feet','Ankles','Strength']),
    ('Calf Raises (Single Leg)',    ARRAY['Calves','Ankles','Balance','Strength']),
    ('Turnout Clams',               ARRAY['Glutes','Turnout','Hip Flexors','Strength']),
    ('Passé Balance Hold',          ARRAY['Core','Balance','Turnout','Control'])
)
UPDATE skill s
   SET trains = seed.trains
  FROM seed
 WHERE s.name = seed.name
   AND s.trains = '{}';
