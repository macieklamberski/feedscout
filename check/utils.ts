import ky from 'ky'
import { type Browser, chromium } from 'playwright'

export const timeoutMs = 30_000
export const delayMs = 1_000
export const userAgent = 'Feedscout (https://feedscout.dev)'

const retryDelaysMs = [1_000, 3_000, 7_000]
const fallbackStatuses = new Set([403, 408, 413, 429, 500, 502, 503, 504])

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

const fetchWithKy = async (url: string, options?: FetchOptions): Promise<FetchResult> => {
  const response = await ky(url, {
    method: options?.method ?? 'GET',
    timeout: timeoutMs,
    headers: { 'User-Agent': userAgent, ...options?.headers },
    throwHttpErrors: false,
    retry: {
      limit: retryDelaysMs.length,
      statusCodes: Array.from(fallbackStatuses),
      delay: (attemptCount) => retryDelaysMs[attemptCount - 1] ?? 0,
    },
  })

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
    const result = await fetchWithKy(url, options)
    if (!fallbackStatuses.has(result.status)) {
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
      proxy: parseProxy(process.env.FETCH_PROXY),
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
          await delay(delayMs)
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
