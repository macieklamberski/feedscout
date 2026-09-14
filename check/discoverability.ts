import { writeFileSync } from 'node:fs'
import { defaultFetchFn } from '../src/common/discover/defaults.js'
import type { DiscoverFetchFn, DiscoverMethod } from '../src/common/types.js'
import { discoverFeeds } from '../src/feeds/index.js'
import { renderComment } from './comment.js'
import { isChallengePage, walledStatuses } from './http.js'
import pages from './pages.json' with { type: 'json' }
import { closeBrowser, delay, delayMs, fetchWithFallback, userAgent } from './utils.js'
import type { PlatformResult, ShapeResult } from './verdict.js'
import { combine, decide, isWalled, platformLabel } from './verdict.js'

const retryPauseMs = 30_000
// Long enough for a rate limit window to roll over between the two passes.
const passPauseMs = 60_000
const preflightOnly = process.argv.includes('--preflight')
// Rendering reads the committed baseline, so the comment blocks can be
// regenerated without spending another measurement run on the network.
const renderOnly = process.argv.includes('--render')

// Reddit caps unauthenticated feed reads near one request per minute, which no
// pacing this harness can afford. The account's own feed parameters lift it.
// They authenticate the request, so anything they touch is recorded as
// authenticated and cannot be read as what a plain consumer reaches.
const redditHostRegex = /(^|\.)reddit\.com$/
const redditUser = process.env.REDDIT_FEED_USER
const redditToken = process.env.REDDIT_FEED_TOKEN

export const withRedditParams = (url: string): string => {
  if (!redditUser || !redditToken) {
    return url
  }

  try {
    const parsed = new URL(url)

    if (!redditHostRegex.test(parsed.hostname)) {
      return url
    }

    parsed.searchParams.set('user', redditUser)
    parsed.searchParams.set('feed', redditToken)

    return parsed.href
  } catch {
    return url
  }
}

const isAuthenticated = (url: string) => withRedditParams(url) !== url

// The params are a transport detail. Left on the response URL they would make
// every generic result differ from the handler's plain feed URL.
const stripRedditParams = (url: string): string => {
  try {
    const parsed = new URL(url)

    if (!redditHostRegex.test(parsed.hostname)) {
      return url
    }

    parsed.searchParams.delete('user')
    parsed.searchParams.delete('feed')

    return parsed.href
  } catch {
    return url
  }
}

const fetchPage = async (url: string) => {
  const response = await fetchWithFallback(withRedditParams(url))

  return { ...response, url: stripRedditParams(response.url) }
}

// Records every status the discoverer sees, so a bot wall or an outage inside a
// run becomes an inconclusive verdict instead of a false "not discoverable".
const recordingFetch = (statuses: Array<number>): DiscoverFetchFn => {
  return async (url, options) => {
    try {
      const response = await fetchWithFallback(withRedditParams(url), options)
      statuses.push(isChallengePage(response.body) ? challengeStatus : response.status)
      return { ...response, url: stripRedditParams(response.url) }
    } catch (error) {
      statuses.push(0)
      throw error
    }
  }
}

// Dreamwidth answers 202 on some journals, so the page was served whenever the
// status is a 2xx. Only exactly-200 would read those as dead.
const isServed = (status: number) => status >= 200 && status < 300

// A challenge page answers 200 with an interstitial, so the status alone never
// clears a page. It is reported under its own code so the log says which wall.
const challengeStatus = 429

const asText = (body: string | ReadableStream<Uint8Array>) => {
  return typeof body === 'string' ? body : ''
}

const fallbackProbe = async (url: string): Promise<number> => {
  try {
    const response = await fetchWithFallback(withRedditParams(url))

    return isChallengePage(response.body) ? challengeStatus : response.status
  } catch {
    return 0
  }
}

// Three outcomes, because a page that does not exist and a page behind a bot
// wall need different handling. A 404 is a corpus error and blocks the run: it
// would measure as "not discoverable" and that is the exact failure being
// fixed. A wall the cascade cannot get past is a live fact about the platform,
// so the URL is measured as inconclusive and left out of the label.
const preflight = async (url: string) => {
  let plainStatus = 0

  try {
    const plain = await defaultFetchFn(withRedditParams(url))
    plainStatus = isChallengePage(asText(plain.body)) ? challengeStatus : plain.status
  } catch {}

  if (isServed(plainStatus)) {
    return { status: plainStatus, botWalled: false, outcome: 'ok' as const }
  }

  let fallbackStatus = await fallbackProbe(url)

  if (isServed(fallbackStatus)) {
    return { status: fallbackStatus, botWalled: true, outcome: 'ok' as const }
  }

  // Every non-200 gets one retry after a pause. A wall status is often a rate
  // limit that clears, and hosts that 404 a bot do it intermittently, so a
  // single miss is not enough to call a URL dead and block the run.
  await delay(retryPauseMs)

  fallbackStatus = await fallbackProbe(url)

  if (isServed(fallbackStatus)) {
    return { status: fallbackStatus, botWalled: true, outcome: 'ok' as const }
  }

  // A zero status means the browser threw rather than answered, so nothing was
  // learned about the page. Only a real status that is not a wall says the URL
  // is dead.
  const outcome =
    fallbackStatus === 0 || walledStatuses.has(fallbackStatus)
      ? ('walled' as const)
      : ('missing' as const)

  return { status: fallbackStatus || plainStatus, botWalled: outcome === 'walled', outcome }
}

const toUris = (results: Array<{ url: string; method?: DiscoverMethod; isValid: boolean }>) =>
  results
    .map(({ url, method, isValid }) => ({ uri: url, method, isValid }))
    .sort((a, b) => a.uri.localeCompare(b.uri))

const measure = async (shape: string, url: string): Promise<ShapeResult> => {
  const { status, botWalled, outcome } = await preflight(url)

  const base: ShapeResult = {
    shape,
    url,
    preflightStatus: status,
    botWalled,
    authenticated: isAuthenticated(url),
    state: 'inconclusive',
    flagged: false,
    handlerMatched: false,
    statuses: [],
    generic: [],
    handler: [],
  }

  if (outcome === 'missing') {
    return { ...base, reason: 'preflight failed' }
  }

  if (outcome === 'walled') {
    return { ...base, reason: 'bot wall' }
  }

  if (preflightOnly) {
    return { ...base, reason: 'preflight only' }
  }

  const statuses: Array<number> = []
  const fetchFn = recordingFetch(statuses)

  // One transport failure must not take the run down with it: 114 other
  // platforms are in flight and a thrown fetch here would abort all of them.
  let page: Awaited<ReturnType<typeof fetchPage>>

  try {
    page = await fetchPage(url)
  } catch (error) {
    return {
      ...base,
      statuses: [0],
      reason: error instanceof Error ? error.message.split('\n')[0] : 'page fetch failed',
    }
  }

  const input = { url: page.url, content: page.body, headers: page.headers }

  const [genericResults, handlerResults] = await Promise.all([
    discoverFeeds(input, {
      methods: ['html', 'headers', 'guess'],
      fetchFn,
      includeInvalid: true,
    }),
    discoverFeeds(input, { methods: ['platform'], fetchFn, includeInvalid: true }),
  ])

  const generic = toUris(genericResults)
  const handler = toUris(handlerResults)
  const { state, flagged } = decide(generic, handler, isWalled(statuses))

  return {
    ...base,
    state,
    flagged,
    handlerMatched: handler.length > 0,
    statuses,
    generic,
    handler,
  }
}

const forRecord = (result: PlatformResult): PlatformResult => ({
  ...result,
  shapes: result.shapes.map((shape) => ({
    ...shape,
    statuses: [...new Set(shape.statuses)].sort((a, b) => a - b),
    generic: shape.generic.filter((entry) => entry.isValid),
  })),
})

const run = async () => {
  const entries = Object.entries(pages as Record<string, Record<string, string>>).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  const results: Array<PlatformResult> = await Promise.all(
    entries.map(async ([platform, shapes]) => {
      const measured: Array<ShapeResult> = []

      for (const [shape, url] of Object.entries(shapes).sort(([a], [b]) => a.localeCompare(b))) {
        if (measured.length > 0) {
          await delay(delayMs)
        }

        const first = await measure(shape, url)

        if (preflightOnly) {
          measured.push(first)
          continue
        }

        await delay(passPauseMs)
        measured.push(combine(first, await measure(shape, url)))
      }

      const botWalled = measured.some((shape) => shape.botWalled)
      const authenticated = measured.some((shape) => shape.authenticated)
      const result = {
        platform,
        label: platformLabel(measured),
        botWalled,
        authenticated,
        shapes: measured,
      }

      const failed = measured.filter((shape) => shape.reason === 'preflight failed')
      const icon = failed.length === 0 ? '✓' : '✗'
      console.log(
        `${icon} ${platform} (${measured.length - failed.length}/${measured.length})${botWalled ? ' bot-walled' : ''}`,
      )

      for (const shape of measured) {
        const tag = shape.reason ?? shape.state
        const walled = shape.botWalled ? ' bot-walled' : ''
        console.log(`  ${shape.shape}: ${shape.preflightStatus}${walled} ${tag} ${shape.url}`)
      }

      return result
    }),
  )

  await closeBrowser()

  const blocked = results.flatMap((r) => r.shapes).filter((s) => s.reason === 'preflight failed')

  if (preflightOnly) {
    console.log(`\nPre-flight: ${blocked.length} URL(s) failed both fetches.`)
    process.exit(blocked.length === 0 ? 0 : 1)
  }

  if (blocked.length > 0) {
    console.log('\nBlocked. Fix these corpus URLs before measuring:')
    for (const shape of blocked) {
      console.log(`  ${shape.url}`)
    }
    process.exit(1)
  }

  writeFileSync(
    new URL('./discoverability.json', import.meta.url),
    `${JSON.stringify(
      {
        runAt: new Date().toISOString(),
        fetch: 'fetchWithFallback',
        proxied: Boolean(process.env.FETCH_PROXY),
        userAgent,
        results: results.map(forRecord),
      },
      null,
      2,
    )}\n`,
  )

  console.log('\n--- comment blocks ---\n')

  for (const result of results) {
    console.log(`// ${result.platform}`)
    console.log(renderComment(result))
    console.log()
  }
}

const render = async () => {
  const baseline = (await import('./discoverability.json', { with: { type: 'json' } })).default

  for (const result of (baseline as { results: Array<PlatformResult> }).results) {
    console.log(`// ${result.platform}`)
    console.log(renderComment(result))
    console.log()
  }
}

// Guarded so the test can import the verdict logic without starting a run.
if (import.meta.main) {
  await (renderOnly ? render() : run())
}
