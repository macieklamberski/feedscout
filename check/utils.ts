import { type Browser, chromium } from 'playwright'

export const timeoutMs = 30_000
export const delayMs = 1_000
export const userAgent = 'Feedscout (https://feedscout.dev)'

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
