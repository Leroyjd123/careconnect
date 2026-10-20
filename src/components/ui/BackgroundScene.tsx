/**
 * The calm backdrop every screen sits on: mint ground, soft sage light, faint line-leaf pattern.
 * Rendered ONCE in the root layout. Pages must not add their own blobs or patterns.
 */
export function BackgroundScene() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ground print:hidden">
      <div className="absolute -top-[30vmax] -left-[18vmax] size-[60vmax] rounded-full bg-sage opacity-45 blur-[110px]" />
      <div className="absolute -right-[16vmax] -bottom-[26vmax] size-[56vmax] rounded-full bg-mint-300 opacity-90 blur-[100px]" />
      <div className="absolute top-[22%] left-[48%] size-[34vmax] rounded-full bg-ivory opacity-70 blur-[100px]" />
      <svg width="100%" height="100%" className="absolute inset-0 text-forest">
        <defs>
          <pattern id="cc-leaf" width="96" height="96" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.08">
              <path d="M15 35c7-9 18-11 26-7-3 8-14 14-26 7z" />
              <path d="M15 35l19-5" />
              <path d="M65 81c-1-11 6-19 14-21 2 10-5 19-14 21z" />
              <path d="M65 81l12-16" />
            </g>
            <circle cx="78" cy="21" r="1.4" fill="currentColor" opacity="0.09" />
            <circle cx="26" cy="78" r="1.2" fill="currentColor" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cc-leaf)" />
      </svg>
    </div>
  );
}
