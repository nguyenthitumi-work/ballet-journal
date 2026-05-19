const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak,
} = require('docx');

const ACCENT = "8B2942";
const SOFT   = "F4E9DE";
const INK    = "2A2A2A";
const MUTE   = "6E6E6E";
const LINE   = "C9B79C";

const border = (c = "D4C4B0") => ({ style: BorderStyle.SINGLE, size: 6, color: c });

const P = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  ...opts,
  children: [new TextRun({ text, ...(opts.run || {}) })],
});

const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 200 },
  children: [new TextRun({ text })],
});

const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text })],
});

const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 80 },
  children: [new TextRun({ text })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text })],
});

const labelRow = (label, value) => new TableRow({
  children: [
    new TableCell({
      width: { size: 2400, type: WidthType.DXA },
      borders: { top: border(LINE), left: border(LINE), bottom: border(LINE), right: border(LINE) },
      shading: { fill: SOFT, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: ACCENT, size: 20 })] })],
    }),
    new TableCell({
      width: { size: 6960, type: WidthType.DXA },
      borders: { top: border(LINE), left: border(LINE), bottom: border(LINE), right: border(LINE) },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: value, size: 22 })] })],
    }),
  ],
});

const sceneTable = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2400, 6960],
  rows: rows.map(([k, v]) => labelRow(k, v)),
});

const rule = () => new Paragraph({
  spacing: { before: 200, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 1 } },
  children: [new TextRun({ text: "" })],
});

// ---------- title and front matter ----------
const titlePage = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 },
    children: [new TextRun({ text: "SWAN LAKE", bold: true, size: 64, color: ACCENT, font: "Garamond" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "A Visual Storyboard for Young Dancers", italics: true, size: 32, color: INK, font: "Garamond" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: "All 24 Scenes — Acts I to IV", size: 26, color: MUTE, font: "Garamond" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 80 },
    children: [new TextRun({ text: "Featuring", size: 20, color: MUTE, smallCaps: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "Sasha", size: 36, color: ACCENT, italics: true, font: "Garamond" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 1200 },
    children: [new TextRun({ text: "a ten-year-old dancer", size: 22, color: MUTE, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 },
    children: [new TextRun({ text: "Prepared for Mi Nguyen", size: 18, color: MUTE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: "May 2026", size: 18, color: MUTE })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- character sheet ----------
const characterSheet = [
  H1("Character Reference — Sasha"),
  P("Sasha is the single young dancer who appears in every frame of this storyboard. Lock these details before generating each scene so she remains visually consistent — same face, same body, same hair, same hands — and only her pose, costume detail, and environment change.", { run: { size: 22 } }),
  H3("Physical Description"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 6960],
    rows: [
      ["Age", "10 years old"],
      ["Build", "Slim and long-limbed, the willowy proportions of a serious young ballet student; small frame, pulled-up posture"],
      ["Height", "Average for age — about 4'5\" / 135 cm"],
      ["Hair", "Glossy chestnut-auburn, parted center, pulled into a smooth low classical bun secured with a satin ribbon. Ribbon color shifts subtly with each scene to match her costume"],
      ["Face", "Heart-shaped, fair skin with a faint dusting of freckles across the bridge of her nose; high soft cheekbones, slightly flushed"],
      ["Eyes", "Large, hazel-green, dark lashes, alert and earnest"],
      ["Brows", "Soft natural arch, lightly defined"],
      ["Mouth", "Small bow lips, faint dusty-pink tint"],
      ["Hands", "Refined ballet hands — fingers gently gathered with the middle finger leading, never splayed flat"],
      ["Feet", "Pink ballet slippers throughout — for the Black Swan scenes (18, 19), the same slippers tied with deeper-red ribbons. She is too young for pointe"],
      ["Carriage", "Lifted sternum, shoulders rolled back and down, long neck"],
    ].map(([k, v]) => labelRow(k, v)),
  }),
  H3("Expression Baseline"),
  P("Earnest. Focused. A child who has been told this is her important moment and is determined to do it correctly — but the eyes still hold the soft brightness of a 10-year-old. She is not glamorous and she is not solemn; she is a serious young dancer playing dress-up at the very highest level.", { run: { size: 22 } }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- style guide ----------
const styleGuide = [
  H1("Visual Style Guide"),
  P("Every frame should match the aesthetic of your reference photos: stylized photography that reads as painterly, vintage, and theatrical — never as a flat snapshot.", { run: { size: 22 } }),
  H3("Format & Medium"),
  bullet("Square 1:1 aspect ratio with soft dark vignette at the corners"),
  bullet("Medium-format film look — visible warm grain, slight chromatic softness, light halation around bright highlights"),
  bullet("Shallow depth of field; Sasha is in focus, background falls gently soft"),
  bullet("Faint matte border framing the image, as if printed on aged card stock"),
  H3("Color Palette"),
  bullet("Deep wine-red, oxblood, burgundy (curtains, hangings, court costumes)"),
  bullet("Antique gold and brass (tassels, embroidery, candlelight)"),
  bullet("Warm ivory and cream (most tutus, marble floors, columns)"),
  bullet("Dusty French blue and slate (sky through arches, twilight, lakeside)"),
  bullet("Pearl white and silver-grey (the swan-court palette — Acts II and IV)"),
  bullet("Black, oxblood, jet (the Black Swan palette — Act III scenes 17-19)"),
  bullet("Dawn pink, peach, gold (the closing scenes — sunrise palette)"),
  H3("Lighting"),
  bullet("Soft directional key light, generally from upper-left, mimicking either stage spotlight or window light"),
  bullet("Acts I and III (palace) use warm candlelight; Acts II and IV (lakeside) use cool moonlight"),
  bullet("Background light always at least one stop dimmer than her body"),
  H3("Composition Rules"),
  bullet("Sasha is centered or slightly off-center; her head occupies the upper third"),
  bullet("Her full body is visible from above her crown to below her feet — never crop her pose"),
  bullet("Background characters (Queen, Prince, courtiers, swans) are intentionally blurred or painted in tapestry-style"),
  bullet("Floor and architecture establish each scene's location in the first 20% of the lower frame"),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- 24 scenes ----------
const scenes = [
  // ACT I
  { n: "Scene 01", act: "ACT I — The Palace Courtyard", title: "The curtain rises",
    pose: "Standing in fifth position, weight even on both feet, arms in bras bas (low oval). Head inclined slightly down and to the right, eyes lowered — a held, breath-suspended opening tableau.",
    costume: "Pale ivory romantic-length tutu, simple bodice with delicate gold trim at the neckline, cream tights, pink slippers, cream satin ribbon in her bun.",
    setting: "A bare wooden stage with a heavy crimson velvet curtain mid-rise above her, gold tassels catching the light. The painted backdrop is just barely revealed.",
    lighting: "Single warm spotlight from above; the rest of the stage falls into deep maroon shadow.",
    mood: "Anticipation. The audience has just hushed.",
    prompt: "A 10-year-old ballerina in pale ivory tutu, standing in perfect fifth position with arms low in bras bas, head softly inclined, on a bare wooden stage as the heavy crimson velvet curtain rises behind her. Single warm spotlight from above, deep theatrical shadows, vintage medium-format film grain, square 1:1 frame, soft matte border, painterly and cinematic." },

  { n: "Scene 02", act: "ACT I — The Palace Courtyard", title: "Prince Siegfried enters the courtyard",
    pose: "Mid-step turn into a small attitude derrière, right leg lifted low behind, knee bent. Right arm extended forward in welcome, head turned to follow the Prince's arrival.",
    costume: "Ivory tutu with a pale-blue sash at the waist; ice-blue ribbon in her bun.",
    setting: "Sun-drenched palace courtyard. Stone flagstones, a tall arched gateway at frame right with a sliver of the Prince stepping through; blurred courtiers behind her.",
    lighting: "Warm golden-hour sunlight from the upper right.",
    mood: "Bright welcome — a child's open excitement contained by training.",
    prompt: "A 10-year-old ballerina in ivory tutu with pale blue sash, mid-step opening into a low attitude derrière, right arm extended in welcome, head turned to greet someone arriving through a tall stone archway in a sunlit palace courtyard. Golden hour light from upper right, soft-blurred courtiers in the background, vintage film grain, painterly square frame." },

  { n: "Scene 03", act: "ACT I — The Palace Courtyard", title: "A birthday celebration",
    pose: "Balancé pose — weight on right leg, left foot pointed forward in tendu devant, arms raised in fifth en haut, body swaying right.",
    costume: "Pale gold-and-cream tutu with seed-pearl bodice, a small white-flower crown in her hair.",
    setting: "Festive courtyard with banquet table, garlands overhead, lanterns beginning to glow, soft-blurred circle of villagers behind.",
    lighting: "Late-afternoon amber light, lantern fill from behind.",
    mood: "Festive, swept-up, joyful.",
    prompt: "A 10-year-old ballerina in pale gold tutu with seed-pearl bodice, white flower crown, in a graceful balancé pose with arms in fifth en haut and left foot in tendu devant. Festive palace courtyard with banquet table, garlands, lanterns beginning to glow, soft-blurred villagers in a circle dance behind her. Warm amber late-afternoon light, painterly vintage square frame." },

  { n: "Scene 04", act: "ACT I — The Palace Courtyard", title: "A bow to the Queen",
    pose: "Full classical révérence — right foot pointed behind in tendu derrière, knees softly bent, left arm extended down with palm open, right hand holding her tutu edge, head bowed forward.",
    costume: "Same pale gold tutu with seed pearls. Gold ribbon in her bun.",
    setting: "Grand palace hall. Tall painted murals or tapestries in the background. The Queen Mother's throne partially visible at frame right.",
    lighting: "Warm candlelight from upper right; long soft shadow on marble floor.",
    mood: "Quiet pride, formal respect.",
    prompt: "A 10-year-old ballerina in pale gold tutu, in a deep classical révérence — right foot pointed behind in tendu derrière, knees softly bent, left arm extended down with palm open, right hand holding tutu edge, head bowed with small earnest smile. Grand palace hall with painted murals, gilded crimson throne partly visible at right, candlelit warm tones, soft long shadow on marble floor, painterly vintage square frame." },

  { n: "Scene 05", act: "ACT II — The Lake by Moonlight", title: "Off to the lake by moonlight",
    pose: "Tendu devant, right foot pointed forward, right arm extended forward and slightly down — pointing the way. Head turned in the direction of her hand. A determined, serious expression.",
    costume: "Pale ivory tutu, now with a soft slate-blue tulle overlay; a tiny white feather tucked into her bun ribbon.",
    setting: "A moonlit forest path. Tall dark cypress trees on either side, the moon high at upper right, first stars scattered. The palace recedes behind her.",
    lighting: "Cool silvery moonlight as the dominant key.",
    mood: "Yearning, almost magnetic — she is following something she half understands.",
    prompt: "A 10-year-old ballerina in pale ivory tutu with slate-blue tulle overlay and small white feather in her bun, in a tendu devant pointing forward with her right arm, head turned to follow her line. Moonlit forest path with tall dark cypress trees, full moon at upper right, first stars in a deep cobalt sky. Cool silvery moonlight, painterly vintage square frame." },

  { n: "Scene 06", act: "ACT II — The Lake by Moonlight", title: "Footprints in the moonlight",
    pose: "Standing on left leg in passé — right foot drawn up to left knee — head bowed steeply, both arms low and slightly forward as she peers at the ground.",
    costume: "Same ivory-with-slate-blue tutu. White feather still in her bun.",
    setting: "Open clearing at the lakeshore. A trail of small bird/swan footprints leading off into the mist at frame left. Soft pale snow or frost on the ground.",
    lighting: "Cool moonlight from upper left, faint warm glow from the distant palace far behind her.",
    mood: "Discovery. Quiet, careful curiosity.",
    prompt: "A 10-year-old ballerina in pale ivory tutu with slate-blue overlay, standing on her left leg in passé with right foot at her knee, head bowed to study a trail of small swan footprints leading into mist on a frosty lakeshore. Cool moonlight from upper left, faint warm palace glow far behind, painterly vintage square frame." },

  { n: "Scene 07", act: "ACT II — The Lake by Moonlight", title: "A flock of swans appears",
    pose: "Small attitude croisé devant — right leg lifted low and crossed in front, foot pointed; both arms lifted high in an open V; head tilted back, lips parted in awe.",
    costume: "Pearl-white tutu (the first true swan tutu) with silver embroidery at the neckline. Silver-grey ribbon in her bun.",
    setting: "She stands at the lakeshore. Across the upper third of the frame, the soft-painted silhouettes of swans in formation, moonlight catching their wings. A full moon at upper right.",
    lighting: "Moonlight overhead, washing down across her upturned face and arms.",
    mood: "Wonder. The hinge moment of Act II.",
    prompt: "A 10-year-old ballerina in pearl-white tutu with silver embroidery, in a small attitude croisé devant with arms lifted high in an open V, head tilted back and eyes wide in awe. Soft-painted silhouettes of swans flying in formation across a deep cobalt night sky with a pale full moon, a misty lakeshore below. Cool silvery moonlight from above, painterly vintage square frame." },

  { n: "Scene 08", act: "ACT II — The Lake by Moonlight", title: "Odette emerges from the lake",
    pose: "On relevé (high on both pointes — or here, half-pointe since she's 10), both arms reaching upward in fifth en haut, body extended tall and luminous, head lifted softly.",
    costume: "Full Odette-style swan tutu — luminous white with tiny iridescent feather detailing at the bodice, white-feather headpiece woven into the ribbon.",
    setting: "Mist rising off the lake at her feet; the lake surface stretches behind her in deep blue. Soft moonlight halo around her body.",
    lighting: "Backlit moonlight outlining her tutu and arms; warm key on her face.",
    mood: "Transcendent. Birth-of-Odette moment.",
    prompt: "A 10-year-old ballerina in luminous white Odette swan tutu with iridescent feather bodice and feather headpiece, on relevé with both arms reaching upward in fifth en haut, body extended tall. Mist rising off a moonlit lake at her feet, deep cobalt water stretching behind, soft moonlight halo around her. Backlit moonlight outlining her tutu, warm key on face, painterly vintage square frame." },

  { n: "Scene 09", act: "ACT II — The Lake by Moonlight", title: "She tells her story",
    pose: "Seated low on the ground (one knee bent, the other leg tucked to her side), both arms folded gently across her chest in a self-protective gesture, head tilted slightly down with a wistful expression.",
    costume: "Same white Odette tutu; her arms have a faint shimmer suggesting feathers.",
    setting: "Lakeshore, with tall reeds painted in soft silhouette behind her. Moon reflected in the still water at frame right.",
    lighting: "Soft cool moonlight from upper right; warm rim along her cheek.",
    mood: "Tender melancholy. The story behind the curse.",
    prompt: "A 10-year-old ballerina in white Odette swan tutu, seated low on a moonlit lakeshore with one knee bent and arms folded gently across her chest, head tilted with a wistful expression. Tall reeds in soft silhouette behind, moon reflected in still water at right. Soft cool moonlight from upper right with warm rim along cheek, painterly vintage square frame." },

  { n: "Scene 10", act: "ACT II — The Lake by Moonlight", title: "A vow under the stars",
    pose: "Standing in a tendu devant, hands clasped softly in front of her chest in a first-position rounded port de bras. Head tilted back slightly to look up at the stars. Eyes soft, lips just parted.",
    costume: "Same white Odette tutu; faint glow around her.",
    setting: "Deep indigo sky filled with stars (a few drawn as small four-point sparkles), the lake distant behind. A halo of starlight around her.",
    lighting: "Starlight as ambient key — a cool, pearl-blue glow on her face and arms.",
    mood: "Sacred. A promise made.",
    prompt: "A 10-year-old ballerina in white Odette swan tutu, standing in tendu devant with hands clasped softly in rounded first position at her chest, head tilted back to look up at the stars. Deep indigo sky filled with star sparkles, halo of starlight around her, distant lake behind. Pearl-blue starlight key on face and arms, painterly vintage square frame." },

  { n: "Scene 11", act: "ACT II — The Lake by Moonlight", title: "Siegfried lifts Odette",
    pose: "Held in a high arabesque lift — body horizontal at shoulder height of an offscreen partner (silhouetted Prince below her), right leg extended back in classical arabesque, both arms lifted open above her head.",
    costume: "White Odette classical tutu (the wider, flatter pancake tutu now, for the dramatic line).",
    setting: "Lakeside; the Prince's dark silhouette below holds her aloft. Moon at upper right behind them, water in the lower third.",
    lighting: "Strong backlight from the moon outlines them as a single silhouette/composition; warm key on Sasha's face.",
    mood: "Soaring. The lovers' first lift.",
    prompt: "A 10-year-old ballerina in classical white pancake tutu, held in a high arabesque lift at shoulder height of a silhouetted prince below her, right leg in arabesque line, both arms lifted open. Moonlit lakeside, moon at upper right behind them, water in lower third. Strong backlight from the moon, warm key on her face, painterly vintage square frame." },

  { n: "Scene 12", act: "ACT II — The Lake by Moonlight", title: "The Pas de Quatre begins",
    pose: "Standing on relevé on both feet, arms in the famous cygnet linked-arms pose — both forearms crossed low in front of the body, hands open as if linked to imaginary partners on either side. Bright, focused expression.",
    costume: "Small classical white tutu with simple silver trim; a tiny white feather headpiece. Same as the cygnets she dances with.",
    setting: "Lakeside, with two or three other young cygnets in soft-blurred matching positions to her left and right. Misty water behind.",
    lighting: "Cool moonlight overhead, even and bright on all of them.",
    mood: "Crisp, precise, delighted concentration.",
    prompt: "A 10-year-old ballerina in small classical white tutu with silver trim and tiny feather headpiece, on relevé with both forearms crossed low in front in the cygnet linked-arms pose. Two or three soft-blurred matching young cygnets to her sides, misty moonlit lakeside behind. Even cool moonlight from above, painterly vintage square frame." },

  // ACT II — into the cygnets sequence
  { n: "Scene 13", act: "ACT II — The Lake by Moonlight", title: "Cygnets in a row",
    pose: "Same linked-arms cygnet pose as Scene 12, but Sasha is centered as the lead cygnet — head turned slightly to follow the line of the dance. On relevé, weight forward, body in profile-three-quarter.",
    costume: "Identical to Scene 12 — small white classical tutu, silver trim, feather headpiece.",
    setting: "Tight row of four cygnets linked side-to-side, Sasha at center, three other young dancers in soft focus to either side. Lake at the lower edge.",
    lighting: "Moonlight from above-left; sparkle highlights on tutu hems.",
    mood: "Joyful precision. The famous cygnet line.",
    prompt: "A 10-year-old ballerina in small white classical tutu with silver trim and feather headpiece, centered as lead cygnet in a row of four young dancers linked by crossed forearms, on relevé, head turned slightly to follow the line of the dance. Soft-focus matching cygnets to either side, misty moonlit lake at lower edge. Moonlight from above-left, sparkle highlights on tutu hems, painterly vintage square frame." },

  { n: "Scene 14", act: "ACT II — The Lake by Moonlight", title: "Dawn returns — Odette must go",
    pose: "Arabesque — left supporting leg, right leg extended straight back at hip height; left arm reaching back over her shoulder, right arm extended low forward. Head turned to look back over her shoulder with a sorrowful expression.",
    costume: "White Odette tutu; the pink dawn light catches the iridescent feather detail.",
    setting: "Lakeshore, sky beginning to glow pink-peach at upper right (dawn arriving). The lake fades into the brightening horizon. A long shadow pulled forward from her body.",
    lighting: "First warm pink dawn light from upper right competes with the last cool moonlight.",
    mood: "Heartbreaking departure.",
    prompt: "A 10-year-old ballerina in white Odette swan tutu, in arabesque with left arm reaching back over her shoulder and right arm low forward, head turned back with a sorrowful expression. Lakeshore with pink-peach dawn glow at upper right, last cool moonlight on the lake, long shadow pulled forward. Painterly vintage square frame, melancholy mood." },

  // ACT III — The Grand Ball
  { n: "Scene 15", act: "ACT III — The Grand Ball", title: "Roses on the palace floor",
    pose: "Kneeling on her right knee, left foot forward and pointed; both hands extended low to gently lift a single red rose from the floor. Head tilted softly down toward the rose.",
    costume: "Cream-and-gold court tutu (a more formal cut than Act I — slightly wider, more embroidery), gold ribbon in her bun.",
    setting: "Polished marble palace floor with scattered red roses around her. Tall columns and a chandelier in deep soft focus above.",
    lighting: "Warm chandelier candlelight from above; pools of soft gold light on the floor.",
    mood: "Hopeful, quiet beauty before the ball.",
    prompt: "A 10-year-old ballerina in cream-and-gold court tutu with gold-embroidered bodice, kneeling on her right knee with left foot pointed forward, both hands lifting a single red rose from a polished marble palace floor. Tall columns and chandelier in deep soft focus above, scattered red roses around her. Warm chandelier candlelight pooling on the floor, painterly vintage square frame." },

  { n: "Scene 16", act: "ACT III — The Grand Ball", title: "The grand ball begins",
    pose: "Standing in tendu devant with arms in second position (open out to sides at shoulder height, palms softly turned forward). Head tilted gracefully toward her right hand. A composed, formal smile.",
    costume: "Same cream-and-gold court tutu, now with a thin gold sash newly added at the waist for the ball.",
    setting: "Grand ballroom — gilded columns, an enormous chandelier visible above, blurred court figures in deep reds and golds behind her in a swirl of waltz.",
    lighting: "Warm candlelight saturating the room, chandelier glow falling onto her crown.",
    mood: "Stately, formal grandeur.",
    prompt: "A 10-year-old ballerina in cream-and-gold court tutu with thin gold sash, standing in tendu devant with arms in open second position, head tilted gracefully toward her right hand with a composed smile. Grand gilded ballroom with enormous chandelier and blurred court figures waltzing behind in deep reds and golds. Warm candlelight, painterly vintage square frame." },

  { n: "Scene 17", act: "ACT III — The Grand Ball", title: "Mysterious guests arrive",
    pose: "Standing tall, body slightly twisted to face frame right, arms in a soft first position, head turned sharply over her right shoulder. Wide alert eyes, lips slightly parted in surprise.",
    costume: "Same cream-and-gold court tutu.",
    setting: "Ballroom doorway at frame right — a tall, dark, cloaked figure (von Rothbart) in deep shadow with subtle glints of red. Other guests have stopped mid-step, painted in soft blur, looking the same direction.",
    lighting: "Light from the chandeliers above is partially eclipsed by the cloaked figure; cool shadow falls across the right side of the frame.",
    mood: "Unease. Something has shifted.",
    prompt: "A 10-year-old ballerina in cream-and-gold court tutu, standing tall with body twisted toward frame right, arms in soft first position, head turned sharply over her right shoulder with wide alert eyes. A tall dark cloaked figure in deep shadow with subtle red glints stands in the ballroom doorway; other guests soft-blurred and frozen. Cool shadow falling from the right, painterly vintage square frame, ominous." },

  { n: "Scene 18", act: "ACT III — The Grand Ball", title: "Odile dances in disguise",
    pose: "Mid-pose attitude derrière, right leg lifted low behind; left arm thrown back and high (dramatic line), right arm curved low in front. Head tilted in profile with a small, secret, slightly knowing smile.",
    costume: "DRAMATIC SHIFT — full Odile costume: jet-black classical tutu with crimson and gold embroidery, deep-red satin ribbon in her bun, ruby-red lip tint. Her face is still recognizably hers, just sharpened.",
    setting: "Ballroom floor with a spotlight pool around her, the rest of the room receding into dark wine-red shadow. A single small ruby glint at her throat.",
    lighting: "Hot single spotlight from above; everything else falls into deep shadow.",
    mood: "Seductive theatrical power — a 10-year-old playing dress-up at being dangerous.",
    prompt: "A 10-year-old ballerina in dramatic black Odile classical tutu with crimson and gold embroidery, deep-red ribbon in her bun, in a low attitude derrière with left arm thrown back high and right arm curved low in front, head tilted in profile with a small secret smile. Ballroom floor in a spotlight pool with the rest of the room in wine-red shadow, ruby glint at her throat. Hot spotlight from above, painterly vintage square frame, theatrical." },

  { n: "Scene 19", act: "ACT III — The Grand Ball", title: "32 fouettés",
    pose: "Mid-fouetté turn — supporting left leg straight on relevé, right working leg extended out to second position at hip height; arms in second; head spotted forward with concentration. Slight motion-blur lines around the working leg suggest the spin.",
    costume: "Same dramatic black Odile tutu.",
    setting: "Center of the ballroom floor, spotlight tight on her. Faint concentric chalk circles on the floor mark her turn axis. Crowd entirely receded into shadow.",
    lighting: "Single overhead spotlight; everything else black except faint floor glow.",
    mood: "Astonishing, almost dangerous virtuosity.",
    prompt: "A 10-year-old ballerina in dramatic black Odile tutu mid-fouetté turn, supporting left leg on relevé and right working leg extended to second at hip height, arms in second, head spotted forward in concentration with subtle motion-blur lines around the working leg. Spotlight pool on ballroom floor with faint concentric chalk circles marking her axis, crowd in shadow. Single overhead spotlight, painterly vintage square frame, virtuosic." },

  { n: "Scene 20", act: "ACT III — The Grand Ball", title: "Siegfried realizes the trick",
    pose: "Standing in a quiet B-plus (right foot pointed behind left, knees softly bent), both hands lifted to her face — hands cupped just under her cheeks, fingers curved. Head tilted slightly down, eyes wide and stricken.",
    costume: "Back in the cream-and-gold court tutu (the disguise has fallen — she's herself again, devastated for the Prince).",
    setting: "Ballroom emptied of the swirl — distant figures frozen at the edges, columns in soft focus. A single fallen rose on the floor at her feet.",
    lighting: "Warm candlelight now feels too warm — almost suffocating; long shadows pull from her body.",
    mood: "Devastation. The realization moment.",
    prompt: "A 10-year-old ballerina in cream-and-gold court tutu, standing in quiet B-plus with both hands lifted softly to her face just under her cheeks, head tilted slightly down with wide stricken eyes. Ballroom emptied to a frozen tableau, distant figures soft, single fallen rose at her feet. Warm candlelight feels almost too warm, long shadows pull from her body, painterly vintage square frame, heartbreak." },

  // ACT IV — The Lakeside, Resolution
  { n: "Scene 21", act: "ACT IV — Return to the Lake", title: "He races back to the lake",
    pose: "Mid-stride running attitude — right knee high, left leg extended behind in a soft attitude; left arm thrown back, right arm reaching forward. Hair-ribbon trailing slightly. Head turned forward, focused, urgent.",
    costume: "Pale ivory traveling tutu — soft, almost grey-blue from the night.",
    setting: "Wooded path back to the lake under a stormy sky. Dark trees framing both sides of the frame, the lake just visible in the lower right. A break of pale lightning at upper left.",
    lighting: "Stormy moonlight; sharp shadows; a hint of cold blue rim from the lightning break.",
    mood: "Urgency. Hope racing.",
    prompt: "A 10-year-old ballerina in pale ivory traveling tutu in mid-stride running attitude — right knee high, left leg extended behind, left arm thrown back, right arm reaching forward, hair-ribbon trailing. Wooded path under a stormy night sky with dark trees framing both sides, lake glimpsed lower right, pale lightning at upper left. Stormy moonlight with sharp shadows, painterly vintage square frame, urgent." },

  { n: "Scene 22", act: "ACT IV — Return to the Lake", title: "A storm breaks over the water",
    pose: "Dramatic arabesque — left leg supporting, right leg extended high behind, both arms thrown up and out in an open V like wings against the wind. Head tilted back, eyes closed, expression of defiant resolve.",
    costume: "White Odette tutu reclaimed; tulle layers wind-tossed.",
    setting: "Lakeshore in storm. Lightning crackles down across the upper half of the frame, the water below is choppy and dark. Reeds bent in the wind.",
    lighting: "Lightning flash provides a stark cool key from upper left; deep blue shadow elsewhere.",
    mood: "Stormy resolve. The climax.",
    prompt: "A 10-year-old ballerina in white Odette swan tutu with wind-tossed tulle, in a dramatic high arabesque with both arms thrown up and out in an open V like wings, head tilted back with eyes closed in defiant resolve. Stormy lakeshore with crackling lightning across the upper sky, choppy dark water, reeds bent in wind. Lightning flash key from upper left, deep blue shadow elsewhere, painterly vintage square frame, climactic." },

  { n: "Scene 23", act: "ACT IV — Return to the Lake", title: "Love endures",
    pose: "Tendu devant, both arms extended forward at chest height, palms open and soft — about to embrace someone just out of frame. Head tilted gently up, lips just parted, eyes shining.",
    costume: "White Odette tutu, but with the first hints of dawn-pink in the tulle.",
    setting: "First light. A silhouetted Prince figure approaches her from the right with arms also extended. Lake at calm in the lower third, dawn light blooming across the horizon.",
    lighting: "Warm dawn key from upper right; cool last-of-night fill from the left.",
    mood: "Tender reconciliation.",
    prompt: "A 10-year-old ballerina in white Odette tutu with pink-dawn tinted tulle, in tendu devant with both arms extended forward at chest height palms open soft, head tilted gently up with shining eyes, about to embrace a silhouetted prince figure approaching from the right with arms also extended. Calm dawn lakeshore, dawn light blooming across the horizon. Warm dawn key, painterly vintage square frame, tender." },

  { n: "Scene 24", act: "ACT IV — Return to the Lake", title: "The swans take flight at dawn",
    pose: "Small attitude croisé devant — right leg lifted low and crossed in front of her body, foot pointed; both arms lifted high and open in a V, fingers softly gathered. Head tilted back, eyes wide in awe, lips just parted.",
    costume: "White Odette tutu, fully bathed in dawn light; a single white feather still tucked into the ribbon at her bun (the same one from Scene 5 — visual rhyme).",
    setting: "Sunrise. The painted silhouettes of swans take flight across the upper half of the frame, wings catching the first golden light. The sun blooms at upper right. Reeds and lake in the lower third.",
    lighting: "Full golden dawn — warm, expansive, almost spiritual.",
    mood: "Resolution. Wonder. Closure.",
    prompt: "A 10-year-old ballerina in white Odette tutu bathed in dawn light, with a single white feather at her bun, in a small attitude croisé devant with arms lifted high and open in a V, head tilted back and eyes wide in awe. Painted silhouettes of swans taking flight across the upper sky, wings catching first golden light, sun blooming at upper right, reeds and lake in lower third. Full golden dawn light, painterly vintage square frame, resolving." },
];

const sceneSection = (s) => {
  const out = [];
  if (s.act) {
    // section heading shown above first scene of each act (we'll dedupe later)
  }
  out.push(H2(`${s.n} — ${s.title}`));
  out.push(sceneTable([
    ["Pose", s.pose], ["Costume", s.costume], ["Setting", s.setting],
    ["Lighting", s.lighting], ["Mood", s.mood],
  ]));
  out.push(new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: "Image-generation prompt", bold: true, color: ACCENT, size: 22 })],
  }));
  out.push(new Paragraph({
    spacing: { before: 0, after: 200 },
    shading: { fill: SOFT, type: ShadingType.CLEAR },
    border: { top: border(LINE), left: border(LINE), bottom: border(LINE), right: border(LINE) },
    children: [new TextRun({ text: s.prompt, italics: true, size: 22 })],
  }));
  out.push(rule());
  return out;
};

// Build scene body with act headings interleaved
const sceneBody = [];
let lastAct = null;
for (const s of scenes) {
  if (s.act && s.act !== lastAct) {
    sceneBody.push(H1(s.act));
    lastAct = s.act;
  }
  sceneBody.push(...sceneSection(s));
}

const closing = [
  new Paragraph({ children: [new PageBreak()] }),
  H1("How to Use This Storyboard"),
  P("Each scene has two pieces. The grid (Pose / Costume / Setting / Lighting / Mood) is your reference for an illustrator, photographer, or art-direction conversation — the locked details. The italic Image-generation prompt below it is a single dense paragraph, ready to paste into Midjourney, DALL·E, Firefly, Imagen, or similar tools.", { run: { size: 22 } }),
  P("For consistency of Sasha across all 24 frames, prepend your prompts with: \"Same girl throughout: 10 years old, chestnut hair in a low classical bun with satin ribbon, hazel-green eyes, fair skin with faint freckles, slim ballet build.\" Then add the scene-specific prompt.", { run: { size: 22 } }),
  H3("Costume color map across the four acts"),
  bullet("Act I (palace, daytime): pale ivory / pale gold tutus, cream and gold ribbons"),
  bullet("Act II (lake by moonlight): slate-blue overlay → pearl-white → full Odette feather tutu"),
  bullet("Act III (the ball): cream-and-gold court tutu; Scene 18-19 shift to dramatic black Odile"),
  bullet("Act IV (return to the lake): white Odette tutu picking up dawn-pink in the closing frames"),
  H3("Visual rhymes worth preserving"),
  bullet("The single white feather in her bun first appears in Scene 5 and returns in Scene 24"),
  bullet("Her révérence in Scene 4 (warm palace) mirrors her vow in Scene 10 (cool lakeside)"),
  bullet("The cygnet line (Scenes 12-13) and the swan flight (Scene 24) bookend Acts II and IV"),
  bullet("The dropped rose in Scene 20 picks up the lifted rose in Scene 15"),
  P("These rhymes make the 24 cards feel like a single emotional arc rather than 24 separate pictures.", { run: { size: 22, italics: true, color: MUTE } }),
];

const doc = new Document({
  creator: "Mi Nguyen",
  title: "Swan Lake — Visual Storyboard (All 24 Scenes)",
  styles: {
    default: { document: { run: { font: "Garamond", size: 22, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, color: ACCENT, font: "Garamond" },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: ACCENT, font: "Garamond" },
        paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: INK, font: "Garamond", italics: true },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: { page: {
      size: { width: 12240, height: 15840 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    } },
    children: [
      ...titlePage,
      ...characterSheet,
      ...styleGuide,
      H1("The 24 Scenes"),
      P("Each frame features Sasha as the focal child dancer; everything else — Queen, Prince, courtiers, friends, villagers, swans, von Rothbart — should be painted into the background in softly blurred, tapestry-like style so the eye stays on her. Scenes appear in performance order across the four acts.", { run: { size: 22 } }),
      rule(),
      ...sceneBody,
      ...closing,
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/sessions/kind-lucid-einstein/mnt/ballet-journal/Swan_Lake_Storyboard.docx", buffer);
  console.log("Wrote Swan_Lake_Storyboard.docx");
});
