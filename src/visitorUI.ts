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
  /** gates the whole cluster before the garden has started (audio unlocked) */
  setEntered(entered: boolean): void;
  /** gates only the specific-personality picks once full — "+" and the auto toggle stay reachable */
  setInviteEnabled(enabled: boolean): void;
  setAutoActive(active: boolean): void;
}

/** quiet top-left cluster: "+ visitor" invite menu, and a dot per present visitor */
export function buildVisitorUI(
  container: HTMLElement,
  onInvite: (personality: VisitorPersonality) => void,
  onToggleAuto: (active: boolean) => void,
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

  const autoBtn = document.createElement('button');
  autoBtn.className = 'auto-toggle';
  autoBtn.textContent = 'let the garden choose';
  autoBtn.title = 'toggle a passive mode where the garden invites and releases visitors on its own';
  autoBtn.addEventListener('click', () => {
    const active = !autoBtn.classList.contains('active');
    onToggleAuto(active);
    menu.classList.add('hidden');
  });
  menu.appendChild(autoBtn);

  const personalityBtns: HTMLButtonElement[] = [];
  const personalities: VisitorPersonality[] = ['cautious', 'playful', 'meditative', 'childlike', 'ritual'];
  for (const p of personalities) {
    const b = document.createElement('button');
    b.textContent = LABELS[p];
    b.addEventListener('click', () => {
      onInvite(p);
      menu.classList.add('hidden');
    });
    menu.appendChild(b);
    personalityBtns.push(b);
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
    setEntered(entered) {
      inviteBtn.disabled = !entered;
    },
    setInviteEnabled(enabled) {
      // the "+" button and the auto-choose toggle stay reachable even when the
      // garden is full — only picking a specific personality is blocked, so
      // there's always a way to open the menu and turn auto-populate back off
      inviteBtn.title = enabled
        ? 'invite a virtual visitor to tend the garden'
        : 'the garden is full — send someone off, or open the menu to manage visitors';
      for (const b of personalityBtns) b.disabled = !enabled;
    },
    setAutoActive(active) {
      autoBtn.classList.toggle('active', active);
      inviteBtn.classList.toggle('auto-active', active);
    },
  };
}
