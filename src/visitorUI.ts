import type { VisitorPersonality } from './virtual/visitor';

const LABELS: Record<VisitorPersonality, string> = {
  cautious: 'cautious',
  playful: 'playful',
  meditative: 'meditative',
  childlike: 'childlike',
  ritual: 'ritual',
};

const TINT: Record<VisitorPersonality, string> = {
  cautious: 'rgb(200,210,205)',
  playful: 'rgb(255,176,140)',
  meditative: 'rgb(198,178,226)',
  childlike: 'rgb(255,214,120)',
  ritual: 'rgb(214,150,90)',
};

export interface VisitorUIHandle {
  sync(list: { id: string; personality: VisitorPersonality }[]): void;
  setInviteEnabled(enabled: boolean): void;
}

/** quiet top-left cluster: "+ visitor" invite menu, and a dot per present visitor */
export function buildVisitorUI(
  container: HTMLElement,
  onInvite: (choice: VisitorPersonality | 'auto') => void,
  onDismiss: (id: string) => void
): VisitorUIHandle {
  const wrap = document.createElement('div');
  wrap.id = 'visitors';

  const inviteBtn = document.createElement('button');
  inviteBtn.id = 'invite-btn';
  inviteBtn.textContent = '+ visitor';

  const menu = document.createElement('div');
  menu.id = 'invite-menu';
  menu.classList.add('hidden');

  const options: Array<VisitorPersonality | 'auto'> = ['auto', 'cautious', 'playful', 'meditative', 'childlike', 'ritual'];
  for (const p of options) {
    const b = document.createElement('button');
    b.textContent = p === 'auto' ? 'let the garden choose' : LABELS[p];
    b.addEventListener('click', () => {
      onInvite(p);
      menu.classList.add('hidden');
    });
    menu.appendChild(b);
  }

  inviteBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target as Node)) menu.classList.add('hidden');
  });

  const chips = document.createElement('div');
  chips.id = 'visitor-chips';

  wrap.append(inviteBtn, menu, chips);
  container.appendChild(wrap);

  return {
    sync(list) {
      chips.innerHTML = '';
      for (const v of list) {
        const chip = document.createElement('button');
        chip.className = 'visitor-chip';
        chip.style.setProperty('--tint', TINT[v.personality]);
        chip.title = `${LABELS[v.personality]} visitor — click to send them off`;
        chip.addEventListener('click', () => onDismiss(v.id));
        chips.appendChild(chip);
      }
    },
    setInviteEnabled(enabled) {
      inviteBtn.disabled = !enabled;
      inviteBtn.title = enabled
        ? 'invite a virtual visitor to tend the garden'
        : 'the garden is full — send someone off first';
    },
  };
}
