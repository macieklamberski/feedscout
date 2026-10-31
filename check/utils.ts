import { type Browser, chromium } from 'playwright'
import { sleep } from 'trousse'
import * as constants from './constants.js'

export const timeoutMs = 30_000
export const delayMs = 1_000
export const userAgent =
  'Feedscout (https://feedscout.dev; https://github.com/macieklamberski/feedscout)'
// Akamai on GCS-web answers 403 to the headless shell and to a user agent that names HeadlessChrome.
// The full Chromium build in headless mode with a desktop Chrome user agent passes.
const browserUserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

const retryDelaysMs = [1_000, 3_000, 7_000]
const fallbackStatuses = [403, 408, 413, 429, 500, 502, 503, 504]
// Some hosts answer a client that does not look like a browser with 404, such as Haley job boards.
// A retry does not change that, so a 404 goes to the browser without one.
const browserFallbackStatuses = [...fallbackStatuses, 404]

export type FetchResult = {
  status: number
  statusText: string
  body: string
  headers: Headers
  url: string
}

export type FetchOptions = {
  method?: string
  headers?: Record<string, string>
}

// Reddit answers 429 past one anonymous request per minute per IP.
const redditGapMs = 61_000
let redditNextAt = 0

const waitForReddit = async (url: string) => {
  const { hostname } = new URL(url)

  if (hostname !== 'reddit.com' && !hostname.endsWith('.reddit.com')) {
    return
  }

  const waitMs = redditNextAt - Date.now()
  redditNextAt = Math.max(redditNextAt, Date.now()) + redditGapMs

  if (waitMs > 0) {
    await sleep(waitMs)
  }
}

const fetchOnce = async (url: string, options?: FetchOptions) => {
  await waitForReddit(url)

  return fetch(url, {
    method: options?.method ?? 'GET',
    headers: { 'User-Agent': userAgent, ...options?.headers },
    signal: AbortSignal.timeout(timeoutMs),
    proxy: constants.fetchProxy,
  })
}

const fetchWithRetry = async (url: string, options?: FetchOptions): Promise<FetchResult> => {
  let response = await fetchOnce(url, options)

  for (const retryDelayMs of retryDelaysMs) {
    if (!fallbackStatuses.includes(response.status)) {
      break
    }
    await sleep(retryDelayMs)
    response = await fetchOnce(url, options)
  }

  return {
    status: response.status,
    statusText: response.statusText,
    body: await response.text(),
    headers: response.headers,
    url: response.url,
  }
}

const fetchWithBrowser = async (url: string, options?: FetchOptions): Promise<FetchResult> => {
  const context = await (await getBrowser()).newContext({
    userAgent: browserUserAgent,
    extraHTTPHeaders: options?.headers,
  })
  try {
    const page = await context.newPage()
    const response = await page.goto(url, {
      timeout: timeoutMs,
      waitUntil: 'domcontentloaded',
    })

    if (!response) {
      throw new Error('No response from browser')
    }

    return {
      status: response.status(),
      statusText: response.statusText(),
      body: await response.text(),
      headers: new Headers(response.headers()),
      url: response.url(),
    }
  } finally {
    await context.close()
  }
}

export const fetchWithFallback = async (
  url: string,
  options?: FetchOptions,
): Promise<FetchResult> => {
  try {
    const result = await fetchWithRetry(url, options)
    if (!browserFallbackStatuses.includes(result.status)) {
      return result
    }
    try {
      return await fetchWithBrowser(url, options)
    } catch {
      return result
    }
  } catch {
    return await fetchWithBrowser(url, options)
  }
}

let browser: Browser | undefined

const parseProxy = (url: string | undefined) => {
  if (!url) {
    return
  }
  const parsed = new URL(url)
  return {
    server: `${parsed.protocol}//${parsed.host}`,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  }
}

export const getBrowser = async () => {
  if (!browser) {
    browser = await chromium.launch({
      channel: 'chromium',
      proxy: parseProxy(constants.fetchProxy),
    })
  }
  return browser
}

export const closeBrowser = async () => {
  await browser?.close()
  browser = undefined
}

export const checkPlatforms = async (
  platforms: Array<[string, Array<string>]>,
  checkUrl: (url: string) => Promise<string | undefined>,
) => {
  const counts = await Promise.all(
    platforms.map(async ([platform, urls]) => {
      const failures: Array<{ url: string; detail: string }> = []

      for (let i = 0; i < urls.length; i++) {
        if (i > 0) {
          await sleep(delayMs)
        }

        const detail = await checkUrl(urls[i])

        if (detail) {
          failures.push({ url: urls[i], detail })
        }
      }

      const icon = failures.length === 0 ? '✓' : '✗'
      console.log(`${icon} ${platform} (${urls.length - failures.length}/${urls.length})`)

      for (const { url, detail } of failures) {
        console.log(`  ✗ ${url} (${detail})`)
      }

      return failures.length
    }),
  )

  await closeBrowser()

  const failed = counts.reduce((sum, count) => sum + count, 0)

  process.exit(failed === 0 ? 0 : 1)
}
