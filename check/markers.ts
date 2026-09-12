import type { PlatformHandler } from '../src/common/uris/platform/types.js'
import { defaultPlatformOptions } from '../src/feeds/defaults.js'
import { bookwyrmHandler } from '../src/feeds/platform/handlers/bookwyrm.js'
import { discourseHandler } from '../src/feeds/platform/handlers/discourse.js'
import { friendicaHandler } from '../src/feeds/platform/handlers/friendica.js'
import { gitlabHandler } from '../src/feeds/platform/handlers/gitlab.js'
import { lemmyHandler } from '../src/feeds/platform/handlers/lemmy.js'
import { mastodonHandler } from '../src/feeds/platform/handlers/mastodon.js'
import { misskeyHandler } from '../src/feeds/platform/handlers/misskey.js'
import { pixelfedHandler } from '../src/feeds/platform/handlers/pixelfed.js'
import { pleromaHandler } from '../src/feeds/platform/handlers/pleroma.js'
import { closeBrowser, delay, delayMs, fetchWithFallback } from './utils.js'

type MarkerEntry = {
  platform: string
  handler: PlatformHandler
  url: string
}

type CheckResult = { detail: string; isWalled: boolean } | undefined

// A handler that matches on page content cannot be covered by a unit test: the
// test encodes the marker its author saw, so it keeps passing after the
// platform stops serving it. Only a real page says whether the marker is live.
const entries: Array<MarkerEntry> = [
  { platform: 'bookwyrm', handler: bookwyrmHandler, url: 'https://bookwyrm.social/user/mouse' },
  { platform: 'discourse', handler: discourseHandler, url: 'https://meta.discourse.org/' },
  { platform: 'friendica', handler: friendicaHandler, url: 'https://libranet.de/profile/support' },
  {
    platform: 'gitlab',
    handler: gitlabHandler,
    url: 'https://gitlab.com/gitlab-org/security-products/analyzers/semgrep',
  },
  { platform: 'lemmy', handler: lemmyHandler, url: 'https://lemmy.ml/c/programming' },
  { platform: 'mastodon', handler: mastodonHandler, url: 'https://mastodon.social/@Gargron' },
  { platform: 'misskey', handler: misskeyHandler, url: 'https://misskey.io/@syuilo' },
  { platform: 'pixelfed', handler: pixelfedHandler, url: 'https://pixelfed.social/dansup' },
  { platform: 'pleroma', handler: pleromaHandler, url: 'https://lain.com/users/lain' },
]

// Anubis and Cloudflare answer a challenge with status 200, so the body is the
// only signal that the page was never served.
const challengeMarkers = [
  'id="anubis_base_prefix"', // Anubis
  'cf_chl_opt', // Cloudflare interstitial
]
const walledStatuses = new Set([401, 403, 406, 429, 503])

const handlers = defaultPlatformOptions.handlers
const platformNames = new Map(entries.map((entry) => [entry.handler, entry.platform]))

const describeHandler = (handler: PlatformHandler): string => {
  return platformNames.get(handler) ?? `handler #${handlers.indexOf(handler)}`
}

const checkEntry = async ({ handler, url }: MarkerEntry): Promise<CheckResult> => {
  try {
    const response = await fetchWithFallback(url)

    if (challengeMarkers.some((marker) => response.body.includes(marker))) {
      return { detail: 'bot challenge', isWalled: true }
    }

    if (walledStatuses.has(response.status)) {
      return { detail: `status ${response.status}`, isWalled: true }
    }

    if (response.status !== 200) {
      return { detail: `status ${response.status}`, isWalled: false }
    }

    const matched = handlers.find((candidate) => {
      return candidate.match(response.url, response.body, response.headers)
    })

    if (!matched) {
      return { detail: 'no handler matched', isWalled: false }
    }

    if (matched !== handler) {
      return { detail: `shadowed by ${describeHandler(matched)}`, isWalled: false }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error'

    return { detail, isWalled: false }
  }
}

let failed = 0
let walled = 0

for (let i = 0; i < entries.length; i++) {
  if (i > 0) {
    await delay(delayMs)
  }

  const entry = entries[i]
  const result = await checkEntry(entry)

  if (!result) {
    console.log(`✓ ${entry.platform}`)
    continue
  }

  if (result.isWalled) {
    walled++
    console.log(`⚠ ${entry.platform} (${result.detail})`)
    continue
  }

  failed++
  console.log(`✗ ${entry.platform} (${result.detail})`)
}

if (walled > 0) {
  console.log(`\n${walled} walled, not counted as failures`)
}

await closeBrowser()

process.exit(failed === 0 ? 0 : 1)
