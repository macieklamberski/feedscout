import links from './links.json' with { type: 'json' }

const platforms = Object.entries(links)
const timeoutMs = 30_000
const delayMs = 1_000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const checkPlatform = async (platform: string, urls: Array<string>) => {
  const failures: Array<{ url: string; detail: string }> = []

  for (let i = 0; i < urls.length; i++) {
    if (i > 0) {
      await delay(delayMs)
    }

    const url = urls[i]

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'User-Agent': 'Feedscout/1.x' },
      })

      if (!response.ok) {
        failures.push({ url, detail: `HTTP ${response.status}` })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      failures.push({ url, detail: message })
    }
  }

  const icon = failures.length === 0 ? '✓' : '✗'
  console.log(`${icon} ${platform} (${urls.length - failures.length}/${urls.length})`)

  for (const { url, detail } of failures) {
    console.log(`  ✗ ${url} (${detail})`)
  }

  return failures.length
}

const counts = await Promise.all(platforms.map(([platform, urls]) => checkPlatform(platform, urls)))

const failed = counts.reduce((sum, count) => sum + count, 0)

process.exit(failed === 0 ? 0 : 1)
