import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { help, options, run } from './cli.js'

describe('help', () => {
  it('should list every option', () => {
    for (const key of Object.keys(options)) {
      expect(help).toContain(`--${key}`)
    }
  })
})

describe('run', () => {
  const logSpy = spyOn(console, 'log').mockImplementation(() => {})
  const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
  const fetchSpy = spyOn(globalThis, 'fetch')

  const pages: Record<string, string> = {
    'https://example.com/': `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          <link rel="blogroll" href="/blogroll.opml">
          <link rel="icon" href="/favicon.svg">
          <link rel="hub" href="https://example.org/hub">
        </head>
      </html>
    `,
    'https://example.com/feed.xml': `
      <rss version="2.0">
        <channel>
          <title>Example Blog</title>
          <link>https://example.com/</link>
          <description>Posts</description>
        </channel>
      </rss>
    `,
    'https://example.com/blogroll.opml': `
      <opml version="2.0">
        <head>
          <title>Blogroll</title>
        </head>
        <body>
          <outline text="Example" xmlUrl="https://example.org/feed.xml" />
        </body>
      </opml>
    `,
    'https://example.com/favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  }

  const serve = (input: RequestInfo | URL) => {
    const url = input.toString()
    const body = pages[url]
    const response = new Response(body ?? 'Not Found', { status: body ? 200 : 404 })

    // A constructed Response has an empty url, while the discoverers read the final url from it.
    Object.defineProperty(response, 'url', { value: url })

    return Promise.resolve(response)
  }

  const getOutput = () => {
    return JSON.parse(logSpy.mock.calls[0][0])
  }

  beforeEach(() => {
    logSpy.mockClear()
    errorSpy.mockClear()
    fetchSpy.mockImplementation(serve as typeof fetch)
    process.exitCode = 0
  })

  afterAll(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
    fetchSpy.mockRestore()
    process.exitCode = 0
  })

  describe('happy paths', () => {
    it('should print help when called without arguments', async () => {
      await run([])

      expect(logSpy).toHaveBeenCalledWith(help)
      expect(process.exitCode).toBe(0)
    })

    it('should print help when called with --help', async () => {
      await run(['feeds', 'https://example.com', '--help'])

      expect(logSpy).toHaveBeenCalledWith(help)
      expect(process.exitCode).toBe(0)
    })

    it('should print discovered feeds as JSON', async () => {
      const expected = [
        {
          url: 'https://example.com/feed.xml',
          isValid: true,
          format: 'rss',
          title: 'Example Blog',
          description: 'Posts',
          siteUrl: 'https://example.com/',
          method: 'html',
        },
      ]

      await run(['feeds', 'https://example.com/', '--methods', 'html'])

      expect(getOutput()).toEqual(expected)
    })

    it('should print discovered blogrolls as JSON', async () => {
      const expected = [
        {
          url: 'https://example.com/blogroll.opml',
          isValid: true,
          title: 'Blogroll',
          method: 'html',
        },
      ]

      await run(['blogrolls', 'https://example.com/', '--methods', 'html'])

      expect(getOutput()).toEqual(expected)
    })

    it('should print discovered favicons as JSON', async () => {
      const expected = [
        {
          url: 'https://example.com/favicon.svg',
          isValid: true,
          method: 'html',
        },
      ]

      await run(['favicons', 'https://example.com/', '--methods', 'html'])

      expect(getOutput()).toEqual(expected)
    })

    it('should print discovered hubs as JSON', async () => {
      const expected = [
        {
          hub: 'https://example.org/hub',
          topic: 'https://example.com/',
        },
      ]

      await run(['hubs', 'https://example.com/', '--methods', 'html'])

      expect(getOutput()).toEqual(expected)
    })

    it('should stop after the first valid feed with --stop-on-first', async () => {
      const expected = [
        {
          url: 'https://example.com/feed.xml',
          isValid: true,
          format: 'rss',
          title: 'Example Blog',
          description: 'Posts',
          siteUrl: 'https://example.com/',
          method: 'guess',
        },
      ]

      await run([
        'feeds',
        'https://example.com/',
        '--methods',
        'guess',
        '--concurrency',
        '1',
        '--stop-on-first',
      ])

      expect(getOutput()).toEqual(expected)
    })

    it('should print a fetch error as its message with --include-invalid', async () => {
      fetchSpy.mockImplementation(((input: RequestInfo | URL) => {
        if (input.toString() === 'https://example.com/feed.xml') {
          return Promise.reject(new TypeError('fetch failed'))
        }

        return serve(input)
      }) as typeof fetch)
      const expected = [
        {
          url: 'https://example.com/feed.xml',
          isValid: false,
          error: 'fetch failed',
          method: 'html',
        },
      ]

      await run(['feeds', 'https://example.com/', '--methods', 'html', '--include-invalid'])

      expect(getOutput()).toEqual(expected)
    })

    it('should write progress to stderr when it is a terminal', async () => {
      const isTTY = process.stderr.isTTY
      const writeSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
      const expected: Array<[string]> = [
        ['\r\x1b[K[1/1] 1 found — https://example.com/feed.xml'],
        ['\r\x1b[K'],
      ]
      process.stderr.isTTY = true

      await run(['feeds', 'https://example.com/', '--methods', 'html'])
      const calls = [...writeSpy.mock.calls]
      process.stderr.isTTY = isTTY
      writeSpy.mockRestore()

      expect(calls).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should fail on an unknown command', async () => {
      await run(['podcasts', 'https://example.com'])

      expect(errorSpy).toHaveBeenCalledWith(`Unknown command: podcasts\n\n${help}`)
      expect(process.exitCode).toBe(1)
    })

    it('should fail when the URL is missing', async () => {
      await run(['feeds'])

      expect(errorSpy).toHaveBeenCalledWith(`URL is required\n\n${help}`)
      expect(process.exitCode).toBe(1)
    })

    it('should fail on an extra argument', async () => {
      await run(['feeds', 'https://example.com', 'https://example.org'])

      expect(errorSpy).toHaveBeenCalledWith(`Unexpected argument: https://example.org\n\n${help}`)
      expect(process.exitCode).toBe(1)
    })

    it('should fail on an unknown flag', async () => {
      await run(['feeds', 'https://example.com', '--timeout', '10'])

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("'--timeout'"))
      expect(process.exitCode).toBe(1)
    })

    it('should fail when concurrency is not a positive integer', async () => {
      await run(['feeds', 'https://example.com', '--concurrency', '0'])

      expect(errorSpy).toHaveBeenCalledWith('--concurrency must be a positive integer')
      expect(process.exitCode).toBe(1)
    })

    it('should fail on a method the command does not support', async () => {
      await run(['blogrolls', 'https://example.com', '--methods', 'html,platform'])

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown method: platform.'))
      expect(process.exitCode).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should warn about flags hubs does not support and still run', async () => {
      const expected = [
        {
          hub: 'https://example.org/hub',
          topic: 'https://example.com/',
        },
      ]

      await run(['hubs', 'https://example.com/', '--stop-on-first'])

      expect(errorSpy).toHaveBeenCalledWith('Ignoring --stop-on-first: not supported by hubs')
      expect(getOutput()).toEqual(expected)
    })
  })
})
