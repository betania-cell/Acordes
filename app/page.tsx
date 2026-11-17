'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'harmona:songs:v1';
const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

type Song = {
  id: string;
  name: string;
  content: string;
};

const defaultSongText = `Tom: G

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

const makeSong = (name: string, content: string): Song => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name,
  content,
});

const defaultSongs: Song[] = [makeSong('Acordes demo', defaultSongText)];

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

function getActiveKeyFromSong(song: string) {
  const firstChord = song.match(/[A-G](?:#|b)?/g)?.[0];
  return firstChord ?? 'C';
}

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>(defaultSongs);
  const [selectedId, setSelectedId] = useState<string>(defaultSongs[0].id);
  const [activeKey, setActiveKey] = useState('G');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Song[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSongs(parsed);
        setSelectedId(parsed[0].id);
        setActiveKey(getActiveKeyFromSong(parsed[0].content));
      }
    } catch {
      // fallback keeps defaults
    }
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    }
  }, [songs]);

  const activeSong = songs.find((song) => song.id === selectedId) ?? songs[0];
  const previewLines = useMemo(() => activeSong?.content.split('\n') ?? [], [activeSong]);

  useEffect(() => {
    if (!activeSong) return;
    setActiveKey(getActiveKeyFromSong(activeSong.content));
  }, [activeSong]);

  const updateSong = (nextContent: string) => {
    if (!activeSong) return;

    setSongs((current) =>
      current.map((song) =>
        song.id === activeSong.id ? { ...song, content: nextContent } : song,
      ),
    );
  };

  const addSong = () => {
    const nextSong = makeSong(`Música ${songs.length + 1}`, `Tom: C\n\nC\nG\nAm\nF`);
    setSongs((current) => [...current, nextSong]);
    setSelectedId(nextSong.id);
  };

  const removeSong = (id: string) => {
    if (songs.length === 1) {
      const fresh = defaultSongs[0];
      setSongs([fresh]);
      setSelectedId(fresh.id);
      return;
    }

    const nextSongs = songs.filter((song) => song.id !== id);
    setSongs(nextSongs);
    setSelectedId(nextSongs[0].id);
  };

  const renameSong = (name: string) => {
    if (!activeSong) return;
    setSongs((current) =>
      current.map((song) =>
        song.id === activeSong.id ? { ...song, name } : song,
      ),
    );
  };

  const changeTranspose = (amount: number) => {
    if (!activeSong) return;

    const transposedContent = transposeSong(activeSong.content, amount);
    setSongs((current) =>
      current.map((song) =>
        song.id === activeSong.id ? { ...song, content: transposedContent } : song,
      ),
    );

    const currentKeyIndex = noteOrder.indexOf(activeKey);
    const nextKeyIndex = ((currentKeyIndex + amount) % 12 + 12) % 12;
    setActiveKey(noteOrder[nextKeyIndex]);
  };

  if (!activeSong) {
    return <main className="empty-shell">Carregando música...</main>;
  }

  return (
    <main className="harmona-shell">
      <div className="harmona-max">
        <header className="topbar">
          <div>
            <p className="eyebrow">Harmona</p>
            <h1>Editor de acordes reais</h1>
          </div>

          <div className="toolbar">
            <button onClick={() => changeTranspose(-1)}>-1 tom</button>
            <button onClick={() => changeTranspose(1)}>+1 tom</button>
            <div className="key-pill">Tom: {activeKey}</div>
          </div>
        </header>

        <section className="workspace">
          <aside className="sidebar panel">
            <div className="sidebar-header">
              <h2>Biblioteca</h2>
              <button className="ghost-button" onClick={addSong}>+ Nova</button>
            </div>

            <div className="song-list">
              {songs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  className={`song-item ${song.id === selectedId ? 'selected' : ''}`}
                  onClick={() => setSelectedId(song.id)}
                >
                  <span>{song.name}</span>
                  <small>{song.content.split('\n').length} linhas</small>
                </button>
              ))}
            </div>
          </aside>

          <div className="editor-panel panel">
            <div className="editor-header">
              <input
                className="title-input"
                value={activeSong.name}
                onChange={(event) => renameSong(event.target.value)}
                aria-label="Nome da música"
              />
              <button className="danger-button" onClick={() => removeSong(activeSong.id)}>
                Excluir
              </button>
            </div>

            <textarea
              value={activeSong.content}
              onChange={(event) => updateSong(event.target.value)}
              rows={18}
              aria-label="Editor de cifra"
            />
          </div>

          <aside className="preview-panel panel">
            <h2>Pré-visualização</h2>
            <div className="preview-box">
              {previewLines.map((line, index) => (
                <div key={`${line}-${index}`} className="preview-line">
                  {line || ' '}
                </div>
              ))}
            </div>

            <div className="info-card">
              <strong>Regra do Harmona</strong>
              <p>
                A cifra preserva o acorde real, sem simplificar os acordes com extensões,
                inversões ou acidentes.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}