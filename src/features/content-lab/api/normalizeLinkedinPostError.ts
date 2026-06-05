export const normalizeLinkedinPostError = (rawMessage: string): string => {
  const msg = rawMessage.trim();
  if (!msg) return "Something went wrong while publishing to LinkedIn.";
  if (/linkedin.*not.*connect/i.test(msg) || /no linkedin/i.test(msg)) {
    return "Connect your LinkedIn account in settings before posting.";
  }
  if (/rate limit|429/i.test(msg)) return "LinkedIn rate limit reached. Try again in a few minutes.";
  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg;
};
