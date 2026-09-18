// Predicates over an HTTP status or body, kept apart from the fetching so the
// verdict logic can be tested without pulling in a browser driver.

// Anubis and Cloudflare answer a challenge with status 200, so the body is the
// only signal that the page was never served.
const challengeMarkers = [
  'id="anubis_base_prefix"', // Anubis
  'cf_chl_opt', // Cloudflare interstitial
]

// A refusal rather than an answer: nothing was learned about the page.
export const walledStatuses = new Set([401, 403, 406, 429, 500, 502, 503, 504])

export const isChallengePage = (body: string): boolean => {
  return challengeMarkers.some((marker) => body.includes(marker))
}
