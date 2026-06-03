import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';

const card = 'rounded-2xl border border-violet-200 bg-white p-5 shadow-sm';
const sectionHeading = 'mt-2 text-xl font-semibold text-violet-900';
const subHeading = 'mt-3 text-base font-semibold text-violet-900';
const para = 'mt-2 text-violet-900/80';
const tableWrap = 'mt-3 overflow-x-auto';
const table = 'w-full text-left text-sm text-violet-900/80';
const th = 'border-b border-violet-200 px-2 py-2 font-semibold text-violet-900';
const td = 'border-b border-violet-100 px-2 py-2 align-top';
const bullet = 'mt-2 flex flex-col gap-1.5 pl-5 text-violet-900/80 list-disc';

export default async function GuidePage() {
  const { onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  return (
    <section className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hi! Welcome to Practice Journal 🩰
        </h1>
        <p className="text-violet-900/80">
          Your little notebook for ballet. Read this whenever you forget how something
          works — it&apos;s your guide!
        </p>
      </header>

      <nav aria-label="On this page" className={card}>
        <p className="text-sm font-semibold text-violet-900">Jump to a part:</p>
        <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-violet-700 sm:grid-cols-2">
          <li><a href="#signin" className="hover:underline">How to sign in</a></li>
          <li><a href="#setup" className="hover:underline">Setting up the first time</a></li>
          <li><a href="#tabs" className="hover:underline">The buttons at the bottom</a></li>
          <li><a href="#today" className="hover:underline">🏠 Today (home page)</a></li>
          <li><a href="#skills" className="hover:underline">💃 Skills</a></li>
          <li><a href="#practice" className="hover:underline">🎶 Practice</a></li>
          <li><a href="#video" className="hover:underline">🎥 Recording yourself</a></li>
          <li><a href="#history" className="hover:underline">📓 History</a></li>
          <li><a href="#milestones" className="hover:underline">🌟 Milestones</a></li>
          <li><a href="#badges" className="hover:underline">🏅 Badges</a></li>
          <li><a href="#summary" className="hover:underline">📈 Weekly Summary</a></li>
          <li><a href="#journey" className="hover:underline">🦢 Your journey</a></li>
          <li><a href="#settings" className="hover:underline">⚙️ Settings</a></li>
          <li><a href="#help" className="hover:underline">When something goes wrong</a></li>
          <li><a href="#privacy" className="hover:underline">Your videos are safe</a></li>
        </ul>
      </nav>

      <section id="signin" className={card}>
        <h2 className={sectionHeading}>How to sign in</h2>
        <ol className="mt-2 flex flex-col gap-1.5 pl-5 text-violet-900/80 list-decimal">
          <li>Go to the app and type your email.</li>
          <li>Tap <strong>Send code</strong>.</li>
          <li>Open your email and find the 6-number code (it looks like <code>483920</code>).</li>
          <li>Type that code back into the app.</li>
          <li>Tap <strong>Verify</strong> — you&apos;re in! 🎉</li>
        </ol>
        <p className={para}>
          There&apos;s no password to remember. You just get a fresh code each time.
        </p>
        <p className="mt-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-900/80">
          The code only works for 1 hour, and only one time. If you wait too long,
          just ask for a new one.
        </p>
      </section>

      <section id="setup" className={card}>
        <h2 className={sectionHeading}>Setting up the first time</h2>
        <p className={para}>The very first time, the app asks you three things:</p>
        <ul className={bullet}>
          <li><strong>Your name</strong> (or a nickname like &quot;Lily-bug&quot;)</li>
          <li><strong>Your birthday</strong></li>
          <li><strong>Your level</strong> — Beginner, Intermediate, or Advanced</li>
        </ul>
        <p className={para}>
          Tap <strong>Save and start</strong> and you&apos;re ready! The app gives you:
        </p>
        <ul className={bullet}>
          <li>🌷 33 ballet skills to try</li>
          <li>📋 4 practice plans</li>
          <li>✨ A clean, empty journal</li>
        </ul>
        <p className={para}>
          You can change your name, birthday, or level later in <strong>Settings</strong>.
        </p>
      </section>

      <section id="tabs" className={card}>
        <h2 className={sectionHeading}>The buttons at the bottom (or top)</h2>
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Button</th>
                <th className={th}>What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>🏠 <strong>Today</strong></td><td className={td}>Your home page — streak, daily goal, today&apos;s practice</td></tr>
              <tr><td className={td}>💃 <strong>Skills</strong></td><td className={td}>Every ballet skill, your whole library</td></tr>
              <tr><td className={td}>🎶 <strong>Practice</strong></td><td className={td}>Start dancing! Pick a plan or just go</td></tr>
              <tr><td className={td}>📓 <strong>History</strong></td><td className={td}>Look back at every day you practiced</td></tr>
              <tr><td className={td}><strong>More …</strong></td><td className={td}>Milestones, Badges, Summary, Settings, and this Guide</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="today" className={card}>
        <h2 className={sectionHeading}>🏠 Today (your home page)</h2>
        <p className={para}>
          Today is your dashboard. It says &quot;Hi, [your name]!&quot; and shows you a few cards.
        </p>

        <h3 className={subHeading}>Your streak 🔥</h3>
        <p className={para}>
          A streak is how many days in a row you&apos;ve practiced. Every day you finish even
          one skill, your streak goes up by 1. If you miss a day, it goes back to 1 — but
          that&apos;s totally okay! Just start again.
        </p>

        <h3 className={subHeading}>This week</h3>
        <p className={para}>
          A peek at the last 7 days — total dancing time, sessions, and skills that got
          better. Tap it for the full Weekly Summary.
        </p>

        <h3 className={subHeading}>Today&apos;s goal 🎯</h3>
        <p className={para}>
          A row of little dots. Each dot turns purple when you practice one new skill that
          day. Fill them all and you hit today&apos;s goal. 🎉
        </p>

        <h3 className={subHeading}>Your next skill ⭐</h3>
        <p className={para}>
          The one skill the app thinks you should try next. Sometimes it&apos;s something you
          love. Sometimes it&apos;s something that unlocks a new skill once you get good at it.
        </p>

        <h3 className={subHeading}>Today&apos;s practice</h3>
        <p className={para}>A few skills picked just for <em>today</em>. The app picks them by:</p>
        <ul className={bullet}>
          <li>Looking at your <strong>favorites</strong> (skills you marked with a heart ♥)</li>
          <li>Adding in skills you haven&apos;t tried in a while</li>
          <li>Choosing a theme for the day:</li>
        </ul>
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Day</th>
                <th className={th}>What we usually do</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>Monday</td><td className={td}>Barre</td></tr>
              <tr><td className={td}>Tuesday</td><td className={td}>Center</td></tr>
              <tr><td className={td}>Wednesday</td><td className={td}>Jumps + Turns</td></tr>
              <tr><td className={td}>Thursday</td><td className={td}>Stretches + Conditioning</td></tr>
              <tr><td className={td}>Friday</td><td className={td}>Your favorites</td></tr>
              <tr><td className={td}>Saturday</td><td className={td}>A little of everything</td></tr>
              <tr><td className={td}>Sunday</td><td className={td}>Stretches</td></tr>
            </tbody>
          </table>
        </div>
        <p className={para}>
          Tap <strong>Start practice</strong> and the app walks you through them one by one.
        </p>

        <h3 className={subHeading}>Your journey 🦢</h3>
        <p className={para}>
          A row of small pictures from <em>Swan Lake</em>. They start gray. As you dance more,
          they light up one by one and tell the story. Keep going to unlock all 12!
        </p>
      </section>

      <section id="skills" className={card}>
        <h2 className={sectionHeading}>💃 Skills</h2>
        <p className={para}>
          This is your whole library — 33 ballet skills, in 6 families:
        </p>
        <ul className={bullet}>
          <li>🪞 <strong>Barre</strong> — pliés, tendus, dégagés, and friends</li>
          <li>🌸 <strong>Center</strong> — adagio, port de bras, balances</li>
          <li>🦋 <strong>Jumps</strong> — sautés, changements, échappés</li>
          <li>🌀 <strong>Turns</strong> — pirouettes, chaînés, piqués</li>
          <li>🪷 <strong>Stretches</strong> — splits, back bends</li>
          <li>💪 <strong>Conditioning</strong> — core, ankles, turnout</li>
        </ul>

        <h3 className={subHeading}>Finding what you want</h3>
        <p className={para}>At the top there&apos;s a <strong>filter bar</strong>. You can pick:</p>
        <ul className={bullet}>
          <li>A <strong>category</strong> (just Barre, just Jumps, etc.)</li>
          <li>Your <strong>progress</strong> — 🌱 Learning, 🪻 Practicing, or 🌟 Mastered</li>
          <li>A <strong>difficulty</strong> from 1 to 5 stars</li>
        </ul>

        <h3 className={subHeading}>What the cards mean</h3>
        <ul className={bullet}>
          <li>💗 = This is one of your favorites</li>
          <li>🔒 = This skill is locked. Tap it to see what you need to master first.</li>
          <li>A dim card = It&apos;s harder than your level, but you can still peek!</li>
        </ul>

        <h3 className={subHeading}>Tapping a skill</h3>
        <p className={para}>Open any skill to see:</p>
        <ul className={bullet}>
          <li>🔊 A <strong>speaker button</strong> — tap it to hear how the French name sounds</li>
          <li>🎥 A <strong>video</strong> — usually a teacher showing how to do it</li>
          <li>💗 The <strong>heart</strong> — tap to make it a favorite (or un-favorite)</li>
          <li>🌱 → 🪻 → 🌟 — tap to say if you&apos;re Learning, Practicing, or have Mastered it</li>
          <li>📜 <strong>Every time you&apos;ve tried it</strong> — with rating, notes, and clips</li>
        </ul>
        <p className={para}>
          You can tick <strong>two of your past tries</strong> and the app shows them
          next to each other so you can see how much you&apos;ve improved. So cool!
        </p>
      </section>

      <section id="practice" className={card}>
        <h2 className={sectionHeading}>🎶 Practice — let&apos;s dance!</h2>

        <h3 className={subHeading}>Free practice (the easy one)</h3>
        <p className={para}>
          Tap the big <strong>Start</strong> at the top. The app picks today&apos;s skills for you.
        </p>

        <h3 className={subHeading}>Picking a plan</h3>
        <p className={para}>Below that you&apos;ll see four ready-made plans:</p>
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Plan</th>
                <th className={th}>What it is</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}><strong>Quick Barre</strong></td><td className={td}>A short warm-up at the barre</td></tr>
              <tr><td className={td}><strong>Stretch &amp; Strengthen</strong></td><td className={td}>Stretches + strength work</td></tr>
              <tr><td className={td}><strong>Center Practice</strong></td><td className={td}>Adagio, port de bras, balance</td></tr>
              <tr><td className={td}><strong>Jumps &amp; Turns</strong></td><td className={td}>The fun stuff!</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className={subHeading}>Inside the practice</h3>
        <p className={para}>For each skill, you&apos;ll see a screen with:</p>
        <ol className="mt-2 flex flex-col gap-1.5 pl-5 text-violet-900/80 list-decimal">
          <li>The skill name and a little reminder</li>
          <li>⭐⭐⭐⭐⭐ — <strong>tap how it felt</strong> (5 = amazing!)</li>
          <li>✏️ A spot to write a note (only if you want)</li>
          <li>⭐ A <strong>milestone star</strong> — tap if today was a BIG day for that skill!</li>
          <li>🎥 A <strong>Record</strong> button (see the video part below)</li>
          <li><strong>Next skill →</strong> when you&apos;re ready to move on</li>
          <li><strong>Skip</strong> if you&apos;d rather not do that one</li>
        </ol>
        <p className={para}>
          When you&apos;re tired, tap <strong>Finish</strong>. Everything you did is saved.
        </p>
        <p className={para}>
          If you unlock a new Swan Lake scene, you&apos;ll see it appear! 🦢✨
        </p>
      </section>

      <section id="video" className={card}>
        <h2 className={sectionHeading}>🎥 Recording yourself</h2>
        <p className={para}>
          You can film a clip of yourself doing a skill — totally optional.
        </p>

        <h3 className={subHeading}>How</h3>
        <ol className="mt-2 flex flex-col gap-1.5 pl-5 text-violet-900/80 list-decimal">
          <li>Tap <strong>Record</strong> during a skill.</li>
          <li>Pick <strong>front camera</strong> or <strong>back camera</strong>, and decide if you want sound on.</li>
          <li>Dance! Tap <strong>Stop</strong> when you&apos;re done.</li>
          <li>The clip saves by itself while you keep practicing.</li>
        </ol>

        <h3 className={subHeading}>Is anyone else watching?</h3>
        <p className={para}>
          <strong>No.</strong> Your videos are private. Only you can see them. The app
          saves them in a locked box that only your account can open.
        </p>

        <h3 className={subHeading}>See your shape</h3>
        <p className={para}>
          When you watch a clip later, you can turn on <strong>Show skeleton</strong>.
          It draws little dots on your body so you can see your lines. It doesn&apos;t say
          if they&apos;re &quot;right&quot; or &quot;wrong&quot; — it just shows you.
          (You and your teacher decide what looks good!)
        </p>
        <p className={para}>
          The very first time you turn it on, it has to download a small file. Give it
          a few seconds.
        </p>

        <h3 className={subHeading}>Comparing with a teacher&apos;s video</h3>
        <p className={para}>
          On a clip, tap <strong>Compare with reference</strong>. You&apos;ll see two
          videos side by side — yours and the teacher&apos;s. One <strong>play/pause</strong>
          button controls both, and you can slow them down to <strong>half speed</strong> or
          <strong> 3/4 speed</strong> to really study what&apos;s happening.
        </p>
      </section>

      <section id="history" className={card}>
        <h2 className={sectionHeading}>📓 History</h2>
        <p className={para}>This is your dance diary.</p>

        <h3 className={subHeading}>Streak banner</h3>
        <p className={para}>Your streak again, at the top.</p>

        <h3 className={subHeading}>The calendar</h3>
        <p className={para}>
          A whole month at once. Every day you practiced has a dot on it. Tap a day to
          see just what you did. Tap <strong>&lt;</strong> or <strong>&gt;</strong> to
          go to other months.
        </p>

        <h3 className={subHeading}>Your sessions</h3>
        <p className={para}>
          Below the calendar, every practice you&apos;ve ever done, newest first. Each
          card shows the date, how long it was, how many skills, and how it felt. Tap
          a card to open it and see every skill from that day.
        </p>

        <h3 className={subHeading}>Just the big days</h3>
        <p className={para}>
          Flip on <strong>Milestones only</strong> to hide everything except the days
          you tapped the ⭐ milestone star.
        </p>
      </section>

      <section id="milestones" className={card}>
        <h2 className={sectionHeading}>🌟 Milestones</h2>
        <p className={para}>
          Open from <strong>More → Milestones</strong>.
        </p>
        <p className={para}>
          Every time you starred a breakthrough, it lives here forever. It&apos;s your
          highlight reel — proof of all the moments you went &quot;I DID IT!&quot;
        </p>
      </section>

      <section id="badges" className={card}>
        <h2 className={sectionHeading}>🏅 Badges</h2>
        <p className={para}>
          Open from <strong>More → Badges</strong>.
        </p>
        <p className={para}>Little trophies you earn for doing dance-y things. Examples:</p>
        <ul className={bullet}>
          <li>🩰 First practice ever</li>
          <li>🔥 3-day streak, 7-day streak, 30-day streak</li>
          <li>🌟 First mastered skill</li>
          <li>⭐ First starred milestone</li>
          <li>💪 Tried 3 skills from every family</li>
        </ul>
        <p className={para}>
          Earned ones glow. Unearned ones are gray with a hint of how close you are.
          No one is &quot;behind&quot; — they just unlock when they unlock!
        </p>
      </section>

      <section id="summary" className={card}>
        <h2 className={sectionHeading}>📈 Summary (this week)</h2>
        <p className={para}>
          Open from <strong>More → Summary</strong> or tap the &quot;This week&quot; card
          on the home page. Shows the last 7 days:
        </p>
        <ul className={bullet}>
          <li>⏱️ How long you danced (and if that&apos;s more or less than last week)</li>
          <li>🎶 How many sessions</li>
          <li>💃 How many skills</li>
          <li>⭐ How many milestone stars</li>
          <li>👑 <strong>Your most-practiced skill</strong> this week</li>
          <li>📈 Skills that got <em>better</em> this week</li>
        </ul>
        <p className={para}>
          A nice way to look back and say &quot;wow, I really did all that!&quot;
        </p>
      </section>

      <section id="journey" className={card}>
        <h2 className={sectionHeading}>🦢 Your journey (Rewards)</h2>
        <p className={para}>
          Open from <strong>More → Rewards</strong> or tap the journey card on Home.
        </p>
        <p className={para}>
          Right now the journey is <strong>Swan Lake</strong> — 12 beautiful scenes
          telling the story. They all start gray. They unlock when you:
        </p>
        <ul className={bullet}>
          <li>🎶 Complete some practices</li>
          <li>🌟 Master some skills</li>
          <li>⭐ Star some milestones</li>
          <li>🔥 Reach a long streak</li>
        </ul>
        <p className={para}>
          Tap a scene to read about it. Unlock all 12 — one little dance at a time.
        </p>
      </section>

      <section id="settings" className={card}>
        <h2 className={sectionHeading}>⚙️ Settings</h2>
        <p className={para}>
          Open from <strong>More → Settings</strong>.
        </p>

        <h3 className={subHeading}>Your profile</h3>
        <p className={para}>
          Change your <strong>name</strong>, <strong>birthday</strong>,{' '}
          <strong>level</strong>, or <strong>daily goal</strong>. Tap{' '}
          <strong>Save profile</strong> when done.
        </p>

        <h3 className={subHeading}>Your stats</h3>
        <ul className={bullet}>
          <li>Total skills (always 33)</li>
          <li>Favorites (the ones with hearts)</li>
          <li>Practice plans</li>
          <li>Sessions you&apos;ve finished</li>
          <li>Skill tries (every time you danced any skill)</li>
          <li><strong>Videos</strong> — how much space they take up, with a button to <strong>delete them all</strong> if you want a fresh start</li>
        </ul>

        <h3 className={subHeading}>About</h3>
        <p className={para}>The app version + a way to <strong>sign out</strong>.</p>
      </section>

      <section className={card}>
        <h2 className={sectionHeading}>A whole day in one paragraph</h2>
        <p className={para}>
          Open the app. Look at Today. Tap <strong>Start practice</strong>. For each
          skill, give it a ⭐ rating, maybe a note, maybe a video, and a ⭐ star if it
          was a great try. Tap <strong>Next</strong>. When you&apos;re tired, tap{' '}
          <strong>Finish</strong>. Check Home to see your streak go up. 🥹
        </p>
        <p className={para}>That&apos;s the whole thing. Have fun! 💜</p>
      </section>

      <section id="help" className={card}>
        <h2 className={sectionHeading}>When something goes wrong</h2>
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Problem</th>
                <th className={th}>What to try</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={td}>&quot;Where&apos;s my sign-in code?&quot;</td><td className={td}>Check the spam/junk folder. Wait a minute and ask for a new one.</td></tr>
              <tr><td className={td}>&quot;It says the code expired&quot;</td><td className={td}>Codes only last 1 hour. Get a fresh one.</td></tr>
              <tr><td className={td}>&quot;The camera won&apos;t open&quot;</td><td className={td}>Your phone asks for permission once. Tap <strong>Allow</strong>. On iPhone, go to Settings → Safari → Camera.</td></tr>
              <tr><td className={td}>&quot;My video didn&apos;t save&quot;</td><td className={td}>Stay in the app until you see a green ✓ on the clip. If you close it too fast, the clip is lost.</td></tr>
              <tr><td className={td}>&quot;Skeleton dots aren&apos;t showing up&quot;</td><td className={td}>The very first time, the file downloads. Give it a few seconds, or refresh.</td></tr>
              <tr><td className={td}>&quot;Storage is full&quot;</td><td className={td}>Go to Settings → Storage → <strong>Delete all videos</strong> to make room.</td></tr>
              <tr><td className={td}>&quot;My streak went back to 1!&quot;</td><td className={td}>A day was missed somewhere. It&apos;s okay. Start a new streak today!</td></tr>
              <tr><td className={td}>&quot;This skill is locked 🔒&quot;</td><td className={td}>Tap it. The app tells you which skill to <strong>master</strong> first.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="privacy" className={card}>
        <h2 className={sectionHeading}>Your videos are safe</h2>
        <ul className={bullet}>
          <li>Only <strong>you</strong> can see your videos. Even other Practice Journal users can&apos;t.</li>
          <li>The app makes a special private link just for you, and it only works for 5 minutes.</li>
          <li>The skeleton dots are drawn <strong>on your phone</strong>, not sent anywhere.</li>
          <li>You can erase all your videos anytime in <strong>Settings</strong>.</li>
        </ul>
      </section>

      <p className="mt-2 text-center text-violet-900/70">
        Made for you, with love. Now go dance! 🩰💜
      </p>

      <div className="flex justify-center">
        <Link
          href="/"
          className="rounded-full bg-violet-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-violet-700"
        >
          Back to Today
        </Link>
      </div>
    </section>
  );
}
