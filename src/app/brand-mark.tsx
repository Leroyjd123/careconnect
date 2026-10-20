// The CareConnect heart mark as plain SVG, for generated images (apple icon, link preview).
// Image generation can't read CSS tokens, so these hex values mirror globals.css on purpose.
export const BRAND = { forest: "#1f6b57", sage: "#8faf9b", ground: "#edf4ef", ink: "#26332f", ink2: "#4f5f58" };

export function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="16.5" cy="8.5" r="5" fill={BRAND.forest} />
      <circle cx="31.5" cy="11" r="4.2" fill={BRAND.sage} />
      <path d="M24 45C13 37 4.5 30 4.5 22.5 4.5 16.5 9.5 13.5 14.5 15.5 18.5 17 21.5 20.5 24 24.5Z" fill={BRAND.forest} />
      <path d="M24 45C35 37 43.5 30 43.5 22.5 43.5 16.5 38.5 13.5 33.5 15.5 29.5 17 26.5 20.5 24 24.5Z" fill={BRAND.sage} />
      <path
        d="M24 36.5C19.5 33 16.5 30 16.5 27 16.5 24.6 18.4 23.2 20.4 23.7 22 24.1 23.2 25.2 24 26.6 24.8 25.2 26 24.1 27.6 23.7 29.6 23.2 31.5 24.6 31.5 27 31.5 30 28.5 33 24 36.5Z"
        fill={BRAND.ground}
      />
    </svg>
  );
}
