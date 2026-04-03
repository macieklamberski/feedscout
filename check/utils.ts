export const timeoutMs = 30_000
export const delayMs = 1_000

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

  const failed = counts.reduce((sum, count) => sum + count, 0)

  process.exit(failed === 0 ? 0 : 1)
}
