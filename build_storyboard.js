const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageOrientation, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageBreak, TabStopType, TabStopPosition,
} = require('docx');

// ---------- helpers ----------
const ACCENT = "8B2942";   // deep wine-rose
const SOFT   = "F4E9DE";   // warm cream
const INK    = "2A2A2A";   // near-black
const MUTE   = "6E6E6E";   // muted grey
const LINE   = "C9B79C";   // dusty gold

const border = (c = "D4C4B0") => ({ style: BorderStyle.SINGLE, size: 6, color: c });
const allBorders = (c) => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) });

const P = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  ...opts,
  children: [new TextRun({ text, ...(opts.run || {}) })],
});

const Pmix = (runs, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  ...opts,
  children: runs.map(r => new TextRun(r)),
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
      borders: allBorders(LINE),
      shading: { fill: SOFT, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: ACCENT, size: 20 })] })],
    }),
    new TableCell({
      width: { size: 6960, type: WidthType.DXA },
      borders: allBorders(LINE),
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

// ---------- content ----------
const titlePage = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 200 },
    children: [new TextRun({ text: "SWAN LAKE", bold: true, size: 64, color: ACCENT, font: "Garamond" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "A Visual Storyboard for Young Dancers", italics: true, size: 32, color: INK, font: "Garamond" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: "Act I — Twelve Scenes", size: 26, color: MUTE, font: "Garamond" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200, after: 80 },
    children: [new TextRun({ text: "Featuring", size: 20, color: MUTE, smallCaps: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "Sasha", size: 36, color: ACCENT, italics: true, font: "Garamond" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 1200 },
    children: [new TextRun({ text: "a ten-year-old dancer", size: 22, color: MUTE, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 40 },
    children: [new TextRun({ text: "Prepared for Mi Nguyen", size: 18, color: MUTE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: "May 2026", size: 18, color: MUTE })],
  }),
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
      ["Mouth", "Small bow lips, faint dusty-pink tint, often closed in concentration with the corners just lifting"],
      ["Hands", "Refined ballet hands — fingers gently gathered with the middle finger leading, never splayed flat"],
      ["Feet", "Pink ballet slippers throughout Act I (not pointe shoes — she's too young). Ribbons crossed at the ankle"],
      ["Carriage", "Lifted sternum, shoulders rolled back and down, long neck; the unmistakable carriage of a child who has been studying ballet for several years"],
    ].map(([k, v]) => labelRow(k, v)),
  }),

  H3("Expression Baseline"),
  P("Earnest. Focused. A child who has been told this is her important moment and is determined to do it correctly — but the eyes still hold the soft brightness of a 10-year-old. She is not glamorous and she is not solemn; she is a serious young dancer playing dress-up at the very highest level.", { run: { size: 22 } }),

  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- style guide ----------
const styleGuide = [
  H1("Visual Style Guide"),
  P("Every frame should match the aesthetic of your two reference images: stylized photography that reads as painterly, vintage, and theatrical — never as a flat snapshot.", { run: { size: 22 } }),

  H3("Format & Medium"),
  bullet("Square 1:1 aspect ratio with soft dark vignette at the corners"),
  bullet("Medium-format film look — visible warm grain, slight chromatic softness, light halation around bright highlights"),
  bullet("Shallow depth of field; Sasha is in focus, background falls gently soft"),
  bullet("Faint matte border framing the image, as if printed on aged card stock"),

  H3("Color Palette"),
  bullet("Deep wine-red, oxblood, burgundy (curtains, hangings, court costumes)"),
  bullet("Antique gold and brass (tassels, embroidery, candlelight)"),
  bullet("Warm ivory and cream (Sasha's tutu, marble floors, columns)"),
  bullet("Dusty French blue and slate (sky through arches, twilight backgrounds)"),
  bullet("Soft sage and olive (foliage in courtyard scenes)"),
  bullet("Overall saturation pulled gently down — muted, never neon"),

  H3("Lighting"),
  bullet("Soft directional key light, generally from upper-left, mimicking either stage spotlight or window light"),
  bullet("Warm fill on Sasha's face and arms; cooler shadow side"),
  bullet("Background light always at least one stop dimmer than her body so she reads as the focal point"),
  bullet("For interior scenes, add suggestion of candlelight warmth in the deep background"),

  H3("Composition Rules"),
  bullet("Sasha is centered or slightly left-of-center; her head occupies the upper third"),
  bullet("Her full body is visible from above her crown to below her feet — never crop her pose"),
  bullet("Background characters (Queen, courtiers, villagers, friends) are intentionally blurred or painted in tapestry-style, not photo-real, so attention stays on Sasha"),
  bullet("Floor and architecture establish each scene's location in the first 20% of the lower frame"),

  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- Act I scenes ----------
const scenes = [
  {
    n: "Scene 1",
    title: "The Curtain Rises",
    pose: "Standing in fifth position, weight even on both feet, arms in bras bas (low oval, hands almost touching in front of her thighs). Head inclined slightly down and to the right, eyes lowered — a held, breath-suspended opening tableau. Chin tucked just enough that you can see the part in her hair.",
    costume: "Pale ivory romantic-length tutu (just below the knee), simple bodice with delicate gold trim at the neckline, cream tights, pink slippers. Cream satin ribbon in her bun.",
    setting: "She stands center-stage on a bare wooden stage. The heavy crimson velvet curtain is mid-rise — visible at the top of the frame, draped open in soft folds, with gold tassels catching the light. Behind her, the painted backdrop of the courtyard is just barely revealed.",
    lighting: "Single warm spotlight from above and slightly forward — her shadow pools tight at her feet. The rest of the stage falls into deep maroon shadow.",
    mood: "Anticipation. The audience has just hushed. She is the very first thing they see.",
    prompt: "A 10-year-old ballerina in pale ivory tutu, standing in perfect fifth position with arms low in bras bas, head softly inclined, on a bare wooden stage as the heavy crimson velvet curtain rises behind her. Single warm spotlight from above, deep theatrical shadows, vintage medium-format film grain, square 1:1 frame, soft matte border, painterly and cinematic.",
  },
  {
    n: "Scene 2",
    title: "Prince Siegfried Enters the Courtyard",
    pose: "Mid-step turn — she has just spun on her left foot and is opening into a small attitude derrière with her right leg lifted low behind her, knee bent at about 90 degrees. Right arm extended forward and slightly up, palm soft, fingers gathered, as if welcoming someone arriving. Left arm curves out to the side. Head turned to follow the gaze of the prince entering from frame right.",
    costume: "Same ivory tutu, but now with a delicate pale-blue sash tied at the waist (to mark her as part of the welcoming party). Hair ribbon ice-blue.",
    setting: "Sun-drenched palace courtyard. Wide stone flagstones, pale honey-colored. Tall arched stone gateway visible behind her at frame right, with a sliver of figure (the Prince) just stepping through. A few softly blurred courtiers stand in a respectful cluster to her left.",
    lighting: "Warm golden-hour sunlight from the upper right (the direction of his entrance). Her face catches the light, the courtyard floor glows.",
    mood: "Bright welcome. She is the first to notice him arriving — a child's open, unguarded excitement contained by her training.",
    prompt: "A 10-year-old ballerina in ivory tutu with pale blue sash, mid-step opening into a low attitude derrière, right arm extended in welcome, head turned to greet someone arriving through a tall stone archway in a sunlit palace courtyard. Golden hour light from upper right, soft-blurred courtiers in the background, vintage film grain, painterly square frame.",
  },
  {
    n: "Scene 3",
    title: "The Pas de Trois — Friends Dance",
    pose: "Caught mid-jeté — left leg extended forward in the air about waist-high, right leg trailing behind, both feet pointed perfectly, hovering an inch above the ground. Arms in third arabesque — right arm forward and slightly up, left arm low and behind. Body tilted forward into the line of the jump. Joyful open face, lips parted in a small smile.",
    costume: "Soft pink classical tutu (mid-thigh, stiffer than the ivory romantic one), bodice trimmed with tiny silk rosettes. Pink ribbon in her bun. Same pink slippers.",
    setting: "The same courtyard, now with two softly blurred friends (also young dancers, also in pink tutus) framing her — one behind to the left, one behind to the right — caught in matching jumps. Garlands of pale pink and cream flowers strung between courtyard columns overhead.",
    lighting: "Bright, even daylight with a sparkly catchlight in her eyes. Slight backlight outlines the edge of her tutu.",
    mood: "Pure delight. The freest, lightest moment in Act I.",
    prompt: "A 10-year-old ballerina in soft pink classical tutu caught mid-jeté, both feet pointed, arms in third arabesque, joyful expression, two soft-blurred young dancer friends in matching jumps flanking her. Sunlit palace courtyard with flower garlands strung between columns, bright daylight, painterly vintage film aesthetic, square frame.",
  },
  {
    n: "Scene 4",
    title: "A Birthday Celebration",
    pose: "Standing in a graceful balancé pose — weight on her right leg, left foot pointed and crossed in front in a small tendu devant, arms raised in fifth position en haut (rounded overhead, hands not quite touching). She is mid-sway, body curving gently to her right, head tilted to follow the arms. The wide eyes and small open smile of a child genuinely thrilled by a party.",
    costume: "Pale gold-and-cream tutu — slightly more ornate, with seed-pearl scattering on the bodice and a thin gold ribbon at the waist. Tiny gold ribbon in her bun. A small wreath of fresh white flowers and ivy crowns her head.",
    setting: "The courtyard transformed for the birthday: long banquet table at the rear draped in burgundy cloth and gold candlesticks (visible but soft); flower garlands overhead, lanterns just beginning to glow as evening approaches. Soft-blurred villagers and courtiers in deep reds, golds, and greens hold hands in a circle behind her — suggested, not detailed.",
    lighting: "Late afternoon light, warm amber, just beginning to turn toward dusk. Lantern light contributes secondary warmth from behind.",
    mood: "Festive, swept-up, joyful. The party is in full bloom and she is part of the dance.",
    prompt: "A 10-year-old ballerina in pale gold tutu with seed-pearl bodice, white flower crown, in a graceful balancé pose with arms in fifth en haut and left foot in tendu devant. Festive palace courtyard with banquet table, garlands, lanterns beginning to glow, soft-blurred villagers in a circle dance behind her. Warm amber late-afternoon light, painterly vintage square frame.",
  },
  {
    n: "Scene 5",
    title: "The Queen Mother Arrives",
    pose: "Frozen mid-curtsy preparation — feet in a small B-plus (right foot pointed slightly behind the left, knees beginning to soften), arms drawn in close to her body in a respectful first position. Head turned in profile toward frame right, watching the Queen's approach with held breath. Spine very straight.",
    costume: "Same pale gold tutu, flower crown removed and replaced with just the gold satin ribbon, in deference to the royal arrival.",
    setting: "She stands at the front of a line of young attendants on the right side of the courtyard. To her left, in the deep distance, the Queen Mother is making her entrance — a tall regal figure in a deep burgundy gown with a long train carried by pages, painted in soft tapestry-style rather than photo-real. Banners with the royal coat of arms hang from the columns.",
    lighting: "Cooler now — the sun has dipped lower. Strong sidelight from her left highlighting the Queen's procession, leaving Sasha in a slightly more reverent half-shadow.",
    mood: "Hushed reverence. The party stops. Even the music holds its breath.",
    prompt: "A 10-year-old ballerina in pale gold tutu standing in B-plus position with arms in first, head turned in profile, watching a regal Queen Mother in burgundy with long train enter a palace courtyard in the background, rendered in soft tapestry style. Royal banners on stone columns, cooler late-afternoon sidelight, painterly vintage square frame.",
  },
  {
    n: "Scene 6",
    title: "A Bow to the Queen",
    pose: "Full classical révérence (curtsy). Right foot pointed behind her left in a deep tendu derrière, knees softly bent into the curtsy, weight forward. Left arm extended out and slightly down to her side, palm open and softly turned up; right hand gently holding the edge of her tutu. Head bowed forward, chin tucked, eyes lowered — but a small, earnest, slightly proud smile playing at her mouth. The shoulders stay broad and lifted even in the bow.",
    costume: "Same pale gold tutu with seed pearls. Gold ribbon in her bun.",
    setting: "Grand palace hall (or formal portion of the courtyard near the throne dais). Tall painted murals or tapestries fill the background — soft figures of saints, knights, and ladies. The Queen Mother's throne is partially visible at frame right, deep crimson velvet and gilded wood. A few courtiers stand in respectful diagonal lines behind her, blurred.",
    lighting: "Warm candlelight from above and from the right, casting a long soft shadow behind Sasha across the marble floor. Gold accents on the throne catch and glow.",
    mood: "Quiet pride. The moment of formal respect. The audience's heart melts.",
    prompt: "A 10-year-old ballerina in pale gold tutu, in a deep classical révérence — right foot pointed behind in tendu derrière, knees softly bent, left arm extended down with palm open, right hand holding tutu edge, head bowed with small earnest smile. Grand palace hall with painted murals, gilded crimson throne partly visible at right, candlelit warm tones, soft long shadow on marble floor, painterly vintage square frame.",
  },
  {
    n: "Scene 7",
    title: "The Queen Presents the Crossbow",
    pose: "Standing tall in a modest first position, arms in bras bas. Her head is turned and tilted upward to her left, watching the moment between the Queen and the Prince. Right hand lifted just slightly, as if instinctively reaching to touch the moment, then remembering she shouldn't. Wide attentive eyes.",
    costume: "Same pale gold tutu, ribbon at waist. She is an observer here, not the action.",
    setting: "She stands a few feet back from the central action, framed at the right edge of the composition. In the center-left, soft-painted figures: the Queen offering an ornate jeweled crossbow to a young Prince who kneels on one knee. Their figures rendered in classical-painting style, slightly blurred. Tall stone arches behind them open onto a darkening sky.",
    lighting: "Cooler blue light from the open arches behind the Queen and Prince, contrasted by warm torchlight on Sasha's face from out of frame right. Her gold tutu picks up both colors.",
    mood: "Childlike attentiveness to a grown-up moment she half-understands. The first hint that something serious is happening.",
    prompt: "A 10-year-old ballerina in pale gold tutu standing in first position with arms in bras bas, right edge of frame, head tilted up to her left watching a soft-painted scene of a Queen offering a jeweled crossbow to a kneeling young Prince. Tall stone arches behind opening to darkening sky, cool blue light contrasted with warm torchlight on her face, painterly vintage square frame.",
  },
  {
    n: "Scene 8",
    title: "The Queen Departs",
    pose: "Beginning to relax out of formality — feet still in a tidy fifth position but arms have drifted into a low demi-seconde (slightly open at her sides, elbows soft). Head turned over her left shoulder, watching the Queen exit. A small held breath. The first hint that her shoulders are softening.",
    costume: "Same pale gold tutu. Same ribbon.",
    setting: "Courtyard returning to normal. The Queen's retreating figure (back to camera, train sweeping behind) recedes through a tall archway at frame left. Other young dancers and courtiers, blurred, begin to relax their postures behind Sasha.",
    lighting: "Mixed — cool blue from the open archway pulling the eye out with the Queen, warm gold from lanterns staying with Sasha and the party.",
    mood: "The exhale. Reverence passing into relief.",
    prompt: "A 10-year-old ballerina in pale gold tutu, feet in fifth position with arms relaxed into low demi-seconde, head turned over her left shoulder, watching a regal figure with sweeping train exit through a tall archway. Courtyard scene with soft-blurred dancers relaxing behind her, mixed cool blue and warm gold light, painterly vintage square frame.",
  },
  {
    n: "Scene 9",
    title: "Wolfgang's Toast — A Comic Interlude",
    pose: "Caught mid-laugh — a small épaulé pose with her body angled slightly toward frame left. Right hand lifted to her mouth in a delighted, surprised gesture, fingers softly gathered, not flat. Left arm low and out to the side. Shoulders genuinely shaking with a child's laughter. Eyes crinkled, smile wide and unguarded — the only frame in Act I where her formal poise breaks completely.",
    costume: "Same pale gold tutu. A few wisps of hair have escaped the bun.",
    setting: "Center-left, the soft-painted figure of Wolfgang the tutor — a rotund older man in a velvet jacket, raising a goblet much too high, his powdered wig askew. Around them, other young dancers and villagers also laughing, hands at their mouths, painted in lively tapestry style. A banquet table foregrounded slightly with goblets and cake.",
    lighting: "Warm, party-bright lantern light from all directions now. A glow on her cheeks. The world is gold and red and merry.",
    mood: "Pure laughter. The audience leans forward and smiles with her.",
    prompt: "A 10-year-old ballerina in pale gold tutu in a small épaulé pose, caught mid-laugh, right hand lifted softly to her mouth in delighted surprise, eyes crinkled and shoulders genuinely laughing. Soft-painted scene of a rotund tutor in velvet raising a goblet with wig askew, surrounding dancers laughing, banquet table with goblets and cake. Warm party-bright lantern light, painterly vintage square frame.",
  },
  {
    n: "Scene 10",
    title: "The Peasant Waltz",
    pose: "Mid-waltz pose — right foot stepped forward and slightly across, weight transferring, left foot pointing back. Arms in a soft, low fourth — right arm gently curved in front of her body at waist height, left arm extended out to her left side. Body in a gentle waltz sway. Eyes looking softly out to her right, with the dreamy half-smile of a child swept up in 3/4 time.",
    costume: "Costume change: a peasant-style dress instead of a tutu, just for this number — soft sage-green skirt to the knee, cream blouse with puffed short sleeves, small embroidered red-and-gold vest laced at the front, flower crown of small white and pink blossoms restored. Same pink ballet slippers.",
    setting: "Open courtyard space. A chain of young dancers in matching peasant costumes (sage greens, dusty blues, warm rose) curves behind her in soft focus, forming the waltz formation. Garlands overhead. Late sunset sky visible above the palace walls — pink and gold dissolving into dusty blue.",
    lighting: "Magic-hour sidelight from frame right — long warm pink-gold light on her face and the front of her skirt, with cool dusty-blue shadow falling softly behind.",
    mood: "Sweet, gentle, slightly dreamy. The party's most romantic moment.",
    prompt: "A 10-year-old ballerina in a peasant costume — sage-green skirt, cream puffed-sleeve blouse, embroidered red-and-gold laced vest, white-and-pink flower crown — in a mid-waltz pose with right foot forward and arms in soft low fourth. A chain of young dancers in matching peasant costumes curves softly behind her. Sunset palace courtyard with garlands, magic-hour pink-gold sidelight, painterly vintage square frame.",
  },
  {
    n: "Scene 11",
    title: "Twilight Descends — The Guests Depart",
    pose: "Standing alone (or nearly so) in a quiet, contemplative B-plus — right foot pointed behind the left, weight on the left leg, knees softly bent. Arms folded gently in front of her body, right hand cupping her left elbow, the way a child stands when she's tired but trying to stay polite. Head tilted very slightly down and to her right. The faintest wistful smile.",
    costume: "Back to the pale ivory tutu from Scene 1 (a quiet visual rhyme — the party is over, the formal evening returns). Flower crown gone. A thin cream ribbon in her hair.",
    setting: "The courtyard, now nearly empty. A few last figures (courtiers, the tutor leaning on a friend) walk off-frame to the left in soft silhouette. Lanterns still glow on the columns but the sky behind has gone deep dusty blue, with the very first stars. The banquet table behind her holds half-melted candles.",
    lighting: "Cool blue twilight as the dominant key, broken only by the warm pools of lantern light. Her face caught between the two — half warm, half cool.",
    mood: "Quiet wonder. End-of-evening tiredness. The fairy tale is shifting.",
    prompt: "A 10-year-old ballerina in pale ivory tutu standing in a quiet B-plus pose, arms gently folded in front with right hand cupping left elbow, head tilted slightly down with a wistful smile. Nearly empty twilight palace courtyard with a few silhouetted figures walking away, lanterns glowing on stone columns, deep dusty blue sky with first stars, half-melted candles on the banquet table. Cool blue twilight with warm lantern accents, painterly vintage square frame.",
  },
  {
    n: "Scene 12",
    title: "The Swans Appear",
    pose: "She has turned to face the sky. Standing in a small attitude croisé devant — right leg lifted low and crossed in front of her body, knee bent and softly turned out, foot pointed; weight on the left leg. Both arms lifted high, open and reaching upward in a soft V (a higher, more open fifth en haut). Head tilted back, eyes wide, lips just parted in awe. Her whole small body is straining gently upward, as if she could follow the swans into the sky.",
    costume: "Pale ivory tutu, now with a single white feather tucked into the cream ribbon at her bun — a small visual seed of Act II to come.",
    setting: "Looking up. The palace courtyard recedes into deep blue shadow at the bottom of the frame. Above, the night sky in deep cobalt and indigo. Across the upper third of the frame, the soft-painted silhouettes of swans flying in formation — gracefully blurred, almost dreamlike, with moonlight catching their wings. A pale full moon at upper right.",
    lighting: "Moonlight as the dominant source — cool, silvery-blue from above, washing down over her upturned face and arms. A faint warm rim from the last lantern below.",
    mood: "Wonder. Yearning. The hinge moment that ends Act I and pulls the entire ballet toward the lake.",
    prompt: "A 10-year-old ballerina in pale ivory tutu with a single white feather in her bun, in a small attitude croisé devant with arms lifted high in an open V, head tilted back and eyes wide in awe. Soft-painted silhouettes of swans flying in formation across a deep cobalt night sky with a pale full moon, palace courtyard receding into shadow below. Cool silvery moonlight from above with faint warm lantern rim, painterly vintage square frame.",
  },
];

const sceneSection = (s) => [
  H2(`${s.n} — ${s.title}`),
  sceneTable([
    ["Pose", s.pose],
    ["Costume", s.costume],
    ["Setting", s.setting],
    ["Lighting", s.lighting],
    ["Mood", s.mood],
  ]),
  new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: "Image-generation prompt", bold: true, color: ACCENT, size: 22 })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 200 },
    shading: { fill: SOFT, type: ShadingType.CLEAR },
    border: { top: border(LINE), left: border(LINE), bottom: border(LINE), right: border(LINE) },
    children: [new TextRun({ text: s.prompt, italics: true, size: 22 })],
  }),
  rule(),
];

// ---------- closing note ----------
const closing = [
  new Paragraph({ children: [new PageBreak()] }),
  H1("How to Use This Storyboard"),
  P("Each scene has two pieces. The grid (Pose / Costume / Setting / Lighting / Mood) is your reference for an illustrator, photographer, or art-direction conversation — these are the locked details. The italic Image-generation prompt below it is written in a single dense paragraph, ready to paste into Midjourney, DALL·E, Firefly, Imagen, or similar tools.", { run: { size: 22 } }),
  P("For maximum consistency of Sasha across all twelve frames, prepend your prompts with a one-line character lock such as: \"Same girl throughout: 10 years old, chestnut hair in a low classical bun with satin ribbon, hazel-green eyes, fair skin with faint freckles, slim ballet build.\" Then add the scene-specific prompt.", { run: { size: 22 } }),
  P("Act II (the lakeside, the swans, Odette) is a natural next document if you'd like it — let me know and I'll match the same character and visual style.", { run: { size: 22, italics: true, color: MUTE } }),
];

// ---------- assemble ----------
const doc = new Document({
  creator: "Mi Nguyen",
  title: "Swan Lake — Visual Storyboard (Act I)",
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
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      ...titlePage,
      ...characterSheet,
      ...styleGuide,
      H1("Act I — Twelve Scenes"),
      P("Each frame features Sasha as the focal child dancer; everything else — Queen, Prince, courtiers, friends, villagers, even the tutor — should be painted into the background in softly blurred, tapestry-like style so the eye stays on her. Scenes appear in performance order.", { run: { size: 22 } }),
      rule(),
      ...scenes.flatMap(sceneSection),
      ...closing,
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/sessions/kind-lucid-einstein/mnt/ballet-journal/Swan_Lake_Storyboard_Act_I.docx", buffer);
  console.log("Wrote Swan_Lake_Storyboard_Act_I.docx");
});
