import ky, { HTTPError } from 'ky'
import feeds from './feeds.json' with { type: 'json' }
import { checkPlatforms, getBrowser, timeoutMs, userAgent } from './utils.js'

const retryDelaysMs = [1_000, 3_000, 7_000]

const shouldFallback = (status: number) => status === 403 || status === 429 || status >= 500

const checkWithBrowser = async (url: string) => {
  const context = await (await getBrowser()).newContext()
  try {
    const page = await context.newPage()
    const response = await page.goto(url, {
      timeout: timeoutMs,
      waitUntil: 'domcontentloaded',
    })

    if (!response) {
      return 'No response'
    }
    if (!response.ok()) {
      return `HTTP ${response.status()} (browser)`
    }
  } finally {
    await context.close()
  }
}

const checkUrl = async (url: string) => {
  try {
    await ky(url, {
      timeout: timeoutMs,
      headers: { 'User-Agent': userAgent },
      retry: {
        limit: retryDelaysMs.length,
        statusCodes: [403, 408, 413, 429, 500, 502, 503, 504],
        delay: (attemptCount) => retryDelaysMs[attemptCount - 1] ?? 0,
      },
    })
  } catch (error) {
    if (error instanceof HTTPError && !shouldFallback(error.response.status)) {
      return `HTTP ${error.response.status}`
    }
    try {
      return await checkWithBrowser(url)
    } catch (browserError) {
      if (error instanceof HTTPError) {
        return `HTTP ${error.response.status}`
      }
      return browserError instanceof Error ? browserError.message : 'Unknown error'
    }
  }
}

await checkPlatforms(Object.entries(feeds), checkUrl)
