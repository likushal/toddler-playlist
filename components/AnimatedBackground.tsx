'use client';

import { ThemeConfig } from '@/types';

interface Props {
  bgClass: ThemeConfig['backgroundClass'];
}

const PARTICLES: Record<string, { items: string[]; count: number; animation: string }> = {
  'bg-dreidels': { items: ['🌀', '✡️', '🕎'], count: 12, animation: 'animate-spin-slow' },
  'bg-confetti': { items: ['🎊', '🎉', '✨', '🌈'], count: 16, animation: 'animate-confetti' },
  'bg-matzah': { items: ['🫓', '⭐', '🌟'], count: 10, animation: 'animate-float' },
  'bg-stars': { items: ['✨', '⭐', '🌟', '💫'], count: 14, animation: 'animate-twinkle' },
  'bg-apples': { items: ['🍎', '🍯', '🌙'], count: 10, animation: 'animate-fall' },
  'bg-fireworks': { items: ['🎆', '🎇', '✨', '🇮🇱'], count: 8, animation: 'animate-firework' },
  'bg-fire': { items: ['🔥', '✨'], count: 10, animation: 'animate-float' },
  'bg-leaves': { items: ['🍂', '🍃', '🌿'], count: 12, animation: 'animate-fall' },
  'bg-flowers': { items: ['🌸', '🌷', '🌼'], count: 12, animation: 'animate-float' },
  'bg-candles': { items: ['🕯️', '✨', '💫'], count: 8, animation: 'animate-twinkle' },
  'bg-sun': { items: ['☀️', '🌤️', '🌻'], count: 8, animation: 'animate-spin-slow' },
  'bg-rain': { items: ['💧', '🌧️', '☔'], count: 14, animation: 'animate-fall' },
  'bg-music': { items: ['🎵', '🎶', '🎼', '🎸'], count: 12, animation: 'animate-float' },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

export default function AnimatedBackground({ bgClass }: Props) {
  const config = PARTICLES[bgClass] ?? PARTICLES['bg-music'];
  const rand = seededRandom(bgClass.length * 7 + 13);

  const particles = Array.from({ length: config.count }, (_, i) => ({
    id: i,
    emoji: config.items[i % config.items.length],
    left: Math.floor(rand() * 96) + 2,
    top: Math.floor(rand() * 90) + 2,
    delay: rand() * 3,
    duration: 2 + rand() * 4,
    size: 20 + Math.floor(rand() * 24),
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute select-none opacity-20 ${config.animation}`}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
