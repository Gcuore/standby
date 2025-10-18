import React from 'react';

export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28.79 20.21"
    fill="currentColor"
    className={className}
  >
    <path d="M28.22,3.15a3.6,3.6,0,0,0-2.52-2.52C23.51,0,14.4,0,14.4,0S5.28,0,3.09,0.63A3.6,3.6,0,0,0,0.57,3.15C0,5.39,0,10.1,0,10.1s0,4.72.57,6.96a3.6,3.6,0,0,0,2.52,2.52c2.19.63,11.31.63,11.31.63s9.12,0,11.31-0.63a3.6,3.6,0,0,0,2.52-2.52c.57-2.24.57-6.96.57-6.96S28.79,5.39,28.22,3.15Z" />
    <polygon points="11.52 14.44 19.01 10.1 11.52 5.77 11.52 14.44" fill="#fff"/>
  </svg>
);

export const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2L12 2C16.4183 2 20 5.58172 20 10C20 16 12 22 12 22C12 22 4 16 4 10C4 5.58172 7.58172 2 12 2Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const LoadingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

export const CloudIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

export const CloudRainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    <path d="m8 19-2 2" />
    <path d="m16 19-2 2" />
    <path d="m12 21-2 2" />
  </svg>
);

export const CloudSnowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
    <path d="m8 15-2 2" />
    <path d="m12 17-2 2" />
    <path d="m16 15-2 2" />
    <path d="M8 20l-2-2" />
    <path d="M12 22l-2-2" />
    <path d="M16 20l-2-2" />
  </svg>
);

export const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);