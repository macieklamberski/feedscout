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
import { isChallengePage, walledStatuses } from './http.js'
import pages from './pages.json' with { type: 'json' }
import { closeBrowser, delay, delayMs, fetchWithFallback } from './utils.js'

type MarkerEntry = {
  platform: string
  handler: PlatformHandler
  shape: string
}

type CheckResult = { detail: string; isWalled: boolean } | undefined

// A handler that matches on page content cannot be covered by a unit test: the
// test encodes the marker its author saw, so it keeps passing after the
// platform stops serving it. Only a real page says whether the marker is live.
// The page URLs live in pages.json, which the discoverability run pre-flights,
// so a URL that rots is corrected in one place for both checks.
const entries: Array<MarkerEntry> = [
  { platform: 'bookwyrm', handler: bookwyrmHandler, shape: 'profile' },
  { platform: 'discourse', handler: discourseHandler, shape: 'home' },
  { platform: 'friendica', handler: friendicaHandler, shape: 'profile' },
  { platform: 'gitlab', handler: gitlabHandler, shape: 'project' },
  { platform: 'lemmy', handler: lemmyHandler, shape: 'community' },
  { platform: 'mastodon', handler: mastodonHandler, shape: 'profile' },
  { platform: 'misskey', handler: misskeyHandler, shape: 'profile' },
  { platform: 'pixelfed', handler: pixelfedHandler, shape: 'profile' },
  { platform: 'pleroma', handler: pleromaHandler, shape: 'profile' },
]

const handlers = defaultPlatformOptions.handlers
const platformNames = new Map(entries.map((entry) => [entry.handler, entry.platform]))

const describeHandler = (handler: PlatformHandler): string => {
  return platformNames.get(handler) ?? `handler #${handlers.indexOf(handler)}`
}

const corpus = pages as Record<string, Record<string, string>>

const entryUrl = ({ platform, shape }: MarkerEntry): string | undefined => {
  return corpus[platform]?.[shape]
}

const checkEntry = async (entry: MarkerEntry): Promise<CheckResult> => {
  const url = entryUrl(entry)

  if (!url) {
    return { detail: `no ${entry.shape} URL in pages.json`, isWalled: false }
  }

  try {
    const { handler } = entry
    const response = await fetchWithFallback(url)

    if (isChallengePage(response.body)) {
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
