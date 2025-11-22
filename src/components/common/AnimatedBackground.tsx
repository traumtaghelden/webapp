import React from 'react';

interface AnimatedBackgroundProps {
  className?: string;
  particleCount?: number;
}

export default function AnimatedBackground({
  className = '',
  particleCount = 20
}: AnimatedBackgroundProps) {
  return (
    <>
      {/* Floating Orbs */}
      <div className="bg-floating-orb" style={{ top: '10%', left: '5%' }} />
      <div className="bg-floating-orb" style={{ top: '60%', right: '10%', animationDelay: '4s' }} />
      <div className="bg-floating-orb" style={{ bottom: '20%', left: '15%', animationDelay: '8s' }} />

      {/* Particle Container */}
      <div className="bg-particles">
        {[...Array(particleCount)].map((_, i) => (
          <div
            key={i}
            className="bg-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              '--tx': `${(Math.random() - 0.5) * 100}px`,
              '--ty': `${-Math.random() * 150}px`
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}
