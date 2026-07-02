import type { Soundscape } from './audio/soundscapes';

/** quiet UI: soundscape pills bottom-left, mood hint bottom-right */
export function buildUI(
  container: HTMLElement,
  scapes: Soundscape[],
  onSelect: (scape: Soundscape) => void
): { setActive(id: string): void } {
  const pills = document.createElement('div');
  pills.className = 'soundscapes';
  const hint = document.createElement('div');
  hint.className = 'scape-hint';
  container.append(pills, hint);

  const buttons = new Map<string, HTMLButtonElement>();
  for (const s of scapes) {
    const b = document.createElement('button');
    b.textContent = s.name;
    b.addEventListener('click', () => {
      onSelect(s);
      setActive(s.id);
    });
    buttons.set(s.id, b);
    pills.appendChild(b);
  }

  function setActive(id: string) {
    for (const [key, b] of buttons) b.classList.toggle('active', key === id);
    const s = scapes.find((x) => x.id === id);
    hint.textContent = s ? s.hint : '';
  }

  return { setActive };
}
