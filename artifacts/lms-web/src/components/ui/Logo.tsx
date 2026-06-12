import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  /** Height of the logo image in pixels (default 48) */
  size?: number;
  /** Whether to wrap the logo in a link to "/" */
  linked?: boolean;
  className?: string;
}

/**
 * Reusable EduLibya logo component.
 * Uses the new Libyan-flag branded PNG from /images/logo.png.
 */
export function Logo({ size = 48, linked = true, className = '' }: LogoProps) {
  const img = (
    <img
      src="/images/logo.png"
      alt="EduLibya – Empowering Minds, Advancing Nations"
      className={`object-contain select-none block ${className}`}
      style={{ height: size, width: 'auto', maxHeight: size, flexShrink: 0 }}
      draggable={false}
    />
  );

  if (linked) {
    return (
      <Link href="/" className="flex items-center hover:opacity-90 transition-opacity duration-200">
        {img}
      </Link>
    );
  }

  return <div className="flex items-center">{img}</div>;
}
