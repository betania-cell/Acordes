'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'harmona:editor';

const defaultSong = `Tom: G

G           D/F#
Hoje o céu abriu de vez
Em      C
E o vento entrou no meu peito

G            D
Quero tocar teu nome
C             D
Sem medo, sem mapa, sem fim

G                 D
E quando a noite cair
Em            C
Eu vou seguir, meu coração

G      D      Em      C
Se a música me levar
G      D      Em      C
Eu vou te encontrar`;

const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function transposeChord(chord: string, amount: number) {
  const rootMatch = chord.match(/^([A-G](?:#|b)?)/);

  if (!rootMatch) return chord;

  const root = rootMatch[1];
  const rest = chord.slice(root.length);

  const rootIndex = noteOrder.indexOf(root);
  if (rootIndex === -1) return chord;

  const baseIndex = rootIndex + amount;
  const normalized = ((baseIndex % 12) + 12) % 12;
  const transposedRoot = noteOrder[normalized];

  return `${transposedRoot}${rest}`;
}

function transposeSong(text: string, amount: number) {
  return text
    .split('\n')
    .map((line) => {
      const chords = line.match(/[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|7|9|11|13|6|\d+)*(?:\/[A-G](?:#|b)?)*/g);

      if (!chords || chords.length === 0) return line;

      let transformed = line;
      for (const chord of chords) {
        const transposed = transposeChord(chord, amount);
        transformed = transformed.replace(chord, transposed);
      }

      return transformed;
    })
    .join('\n');
}

export default function HomePage() {
  const [song, setSong] = useState(defaultSong);
  const [activeKey, setActiveKey] = useState('G');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSong(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, song);
  }, [song]);

  const previewLines = useMemo(() => song.split('\n'), [song]);

  const changeTranspose = (amount: number) => {
    setSong((current) => transposeSong(current, amount));
    setActiveKey((current) => {
      const currentIndex = noteOrder.indexOf(current);
      const nextIndex = ((currentIndex + amount) % 12 + 12) % 12;
      return noteOrder[nextIndex];
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <header className="mb-8 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-300">Harmona</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">Acordes reais, sem limitação</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => changeTranspose(-1)}
              className="rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/25"
            >
              -1 tom
            </button>
            <button
              onClick={() => changeTranspose(1)}
              className="rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/25"
            >
              +1 tom
            </button>
            <div className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200">
              Tom atual: {activeKey}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Editor de cifra</h2>
              <button
                onClick={() => setSong(defaultSong)}
                className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-400"
              >
                Resetar exemplo
              </button>
            </div>

            <textarea
              value={song}
              onChange={(event) => setSong(event.target.value)}
              rows={18}
              className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100 outline-none ring-0 transition focus:border-violet-400"
              aria-label="Editor de música"
            />
          </div>

          <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-white">Pré-visualização</h2>

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100">
              {previewLines.map((line, index) => (
                <div key={`${line}-${index}`} className="min-h-7">
                  {line || ' '}
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100">
              <p className="font-semibold">Regra do Harmona</p>
              <p>
                A cifra não é simplificada. A transposição preserva o acorde real, respeitando extensão,
                inversão e caráter da música.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}