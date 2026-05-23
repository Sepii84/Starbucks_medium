export const DEFAULT_SOCIAL_LINKS = {
  // TODO: Replace with official project social links when available.
  instagramUrl: "#",
  twitterUrl: "#"
} as const;

const demoSocialLinks = new Set([
  "https://instagram.com",
  "https://www.instagram.com",
  "https://instagram.com/starbucksmedium",
  "https://www.instagram.com/starbucksmedium",
  "https://twitter.com",
  "https://www.twitter.com",
  "https://twitter.com/starbucksmedium",
  "https://www.twitter.com/starbucksmedium",
  "https://x.com/starbucksmedium",
  "https://www.x.com/starbucksmedium"
]);

export function normalizeSocialLink(
  value: string | null | undefined,
  type: keyof typeof DEFAULT_SOCIAL_LINKS
) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_SOCIAL_LINKS[type];
  }

  const comparable = trimmed.replace(/\/+$/, "").toLowerCase();

  if (demoSocialLinks.has(comparable)) {
    return DEFAULT_SOCIAL_LINKS[type];
  }

  return trimmed;
}

export function isAllowedSocialLink(value: string) {
  return value === "#" || value === "" || URL.canParse(value);
}
