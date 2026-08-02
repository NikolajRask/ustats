export type ParsedUa = {
  device: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  browser: string;
  os: string;
};

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|wget|curl|python-requests|httpclient/i;

export function parseUserAgent(ua: string | null | undefined): ParsedUa {
  if (!ua) {
    return { device: "unknown", browser: "Unknown", os: "Unknown" };
  }

  if (BOT_RE.test(ua)) {
    return { device: "bot", browser: "Bot", os: "Unknown" };
  }

  let device: ParsedUa["device"] = "desktop";
  if (/iPad|Tablet/i.test(ua)) device = "tablet";
  else if (/Mobile|Android|iPhone|iPod/i.test(ua)) device = "mobile";

  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
}

export function isBot(ua: string | null | undefined): boolean {
  return parseUserAgent(ua).device === "bot";
}
