import feeds from './feeds.json' with { type: 'json' }
import { checkPlatforms, getBrowser, timeoutMs } from './utils.js'

const shouldFallback = (status: number) => status === 429 || status >= 500

const checkWithBrowser = async (url: string) => {
  const context = await (await getBrowser()).newContext()
  try {
    const page = await context.newPage()
    const response = await page.goto(url, { timeout: timeoutMs })

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
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      proxy: process.env.FETCH_PROXY,
    })

    if (response.ok) {
      return
    }
    if (shouldFallback(response.status)) {
      return await checkWithBrowser(url)
    }
    return `HTTP ${response.status}`
  } catch {
    try {
      return await checkWithBrowser(url)
    } catch (error) {
      return error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

await checkPlatforms(Object.entries(feeds), checkUrl)
