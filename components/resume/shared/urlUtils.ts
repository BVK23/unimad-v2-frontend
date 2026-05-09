export const formatUrl = (url: string, defaultDomain: string, pathPrefix: string = ""): string => {
  if (!url) return "";
  const trimmed = url.trim();

  // If it already has http/https, use it straight
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // If it literally contains the domain (e.g. github.com, linkedin.com)
  // assume it's a domain path missing https
  if (trimmed.toLowerCase().includes(defaultDomain)) {
    return `https://${trimmed}`;
  }

  // It's a raw username/handle
  const base = `https://${defaultDomain}`;
  // If there's a path prefix (like 'in/'), append it
  const prefix = pathPrefix && !pathPrefix.endsWith("/") ? `${pathPrefix}/` : pathPrefix;
  return `${base}/${prefix}${trimmed}`;
};

export const getGithubUrl = (userOrUrl?: string) => {
  if (!userOrUrl) return "";
  return formatUrl(userOrUrl, "github.com");
};

export const getLinkedinUrl = (userOrUrl?: string) => {
  if (!userOrUrl) return "";
  return formatUrl(userOrUrl, "linkedin.com", "in/");
};

export const getPortfolioUrl = (userOrUrl?: string) => {
  if (!userOrUrl) return "";
  const trimmed = userOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};
