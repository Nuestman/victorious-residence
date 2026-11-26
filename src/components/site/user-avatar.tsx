const palettes = [
  { bg: "#1f3d32", shirt: "#8c6a3d", skin: "#e8c4a2" },
  { bg: "#8c6a3d", shirt: "#1f3d32", skin: "#f0d0b4" },
  { bg: "#2c4a3e", shirt: "#c4a574", skin: "#d9a67c" },
  { bg: "#3e3428", shirt: "#1f3d32", skin: "#f3d5b8" },
  { bg: "#1c1917", shirt: "#8c6a3d", skin: "#e6c2a0" },
] as const;

function hashName(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function userAvatarSrc(name: string): string {
  const palette = palettes[hashName(name) % palettes.length] ?? palettes[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="40" fill="${palette.bg}"/>
    <circle cx="40" cy="32" r="14" fill="${palette.skin}"/>
    <path d="M14 74c3-18 14-26 26-26s23 8 26 26" fill="${palette.shirt}"/>
    <circle cx="40" cy="32" r="14" fill="none" stroke="${palette.bg}" stroke-opacity="0.15" stroke-width="1"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function UserAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <img
      src={imageUrl || userAvatarSrc(name)}
      alt=""
      className={className ?? "h-9 w-9 rounded-full object-cover"}
    />
  );
}
