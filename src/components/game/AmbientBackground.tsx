'use client';

/**
 * Purely decorative ambient background: floating arcane runes/orbs that
 * drift slowly behind the content. Pointer-events disabled, fixed position.
 */
export function AmbientBackground() {
  // 14 floating orbs with varied positions/sizes/delays.
  const orbs = Array.from({ length: 14 }, (_, i) => {
    const seed = i * 137.5;
    return {
      id: i,
      left: (Math.sin(seed) * 0.5 + 0.5) * 100,
      top: (Math.cos(seed * 1.3) * 0.5 + 0.5) * 100,
      size: 60 + ((i * 37) % 120),
      delay: (i * 1.3) % 8,
      duration: 8 + ((i * 1.7) % 6),
      color: i % 3 === 0 ? 'rgba(168,85,247,0.10)' : i % 3 === 1 ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.05)',
    };
  });

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {orbs.map((o) => (
        <div
          key={o.id}
          className="absolute rounded-full blur-3xl"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            width: `${o.size}px`,
            height: `${o.size}px`,
            background: o.color,
            animation: `float-slow ${o.duration}s ease-in-out ${o.delay}s infinite`,
          }}
        />
      ))}
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />
    </div>
  );
}
