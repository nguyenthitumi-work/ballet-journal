'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Self-contained ambient music for practice. Rather than ship audio files, we
// synthesize a soft, slow-breathing drone with the Web Audio API: a few detuned
// sine voices through a low-pass filter, with an LFO gently opening and closing
// the filter. Works offline, no assets, no autoplay surprises — sound only ever
// starts on the user's tap (which also satisfies browser autoplay policies).

// A calm open chord (D3 · A3 · D4 · F#4), in Hz.
const VOICES = [146.83, 220.0, 293.66, 369.99];
const MAX_GAIN = 0.16; // headroom for several summed voices
const FADE_SECONDS = 0.6;

type AudioCtor = typeof AudioContext;

export default function PracticeMusic() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    const stopAt = now + FADE_SECONDS + 0.05;
    oscRef.current.forEach((o) => o.stop(stopAt));
    lfoRef.current?.stop(stopAt);
    oscRef.current = [];
    lfoRef.current = null;
  }, []);

  const start = useCallback(() => {
    const Ctor: AudioCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = ctxRef.current ?? new Ctor();
    ctxRef.current = ctx;
    void ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.7;
    filter.connect(master);

    // Slow LFO breathing the filter cutoff for gentle movement.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    lfoRef.current = lfo;

    oscRef.current = VOICES.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = i % 2 === 0 ? -4 : 4; // subtle chorus warmth
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1 / VOICES.length;
      osc.connect(voiceGain).connect(filter);
      osc.start();
      return osc;
    });

    const now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(volume * MAX_GAIN, now + FADE_SECONDS);
  }, [volume]);

  const toggle = () => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      start();
      setPlaying(true);
    }
  };

  // Live-adjust loudness while playing.
  useEffect(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!playing || !ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.linearRampToValueAtTime(volume * MAX_GAIN, now + 0.1);
  }, [volume, playing]);

  // Tear down the audio graph if the player unmounts mid-flow.
  useEffect(() => {
    return () => {
      oscRef.current.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      });
      lfoRef.current?.stop();
      void ctxRef.current?.close();
    };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-full border border-violet-200 bg-white px-4 py-2 shadow-sm">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="flex items-center gap-2 text-sm font-medium text-violet-800"
      >
        <span aria-hidden className="text-base">
          {playing ? '🔊' : '🎵'}
        </span>
        {playing ? 'Music on' : 'Play music'}
      </button>
      <label className="flex flex-1 items-center gap-2">
        <span className="sr-only">Music volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          disabled={!playing}
          className="h-1 w-full accent-violet-600 disabled:opacity-40"
        />
      </label>
    </div>
  );
}
