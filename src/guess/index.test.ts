import { describe, expect, it } from 'bun:test'
import {
  discoverCommonFeedUrisFromGuess,
  feedUrisBalanced,
  feedUrisComprehensive,
  feedUrisMinimal,
} from './index.js'
import type { FetchFn, FetchFnResponse, Progress } from './types.js'

describe('guessCommonFeedUris', () => {
  const createMockFetchFn = (mockResponses: Record<string, Partial<FetchFnResponse>>): FetchFn => {
    return async (url: string): Promise<FetchFnResponse> => {
      const mock = mockResponses[url]

      if (!mock) {
        throw new Error(`No mock response for ${url}`)
      }

      return {
        headers: mock.headers || new Headers(),
        body: mock.body || '',
        url: mock.url || url,
        status: mock.status || 200,
        statusText: mock.statusText || 'OK',
      }
    }
  }

  it('should find valid feeds using default URIs', async () => {
    const value = createMockFetchFn({
      'https://example.com/feed.xml': {
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        headers: new Headers({ 'content-type': 'application/rss+xml' }),
        status: 200,
      },
      'https://example.com/atom.xml': {
        body: '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>',
        headers: new Headers({ 'content-type': 'application/atom+xml' }),
        status: 200,
      },
    })

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed.xml', '/atom.xml'],
    })

    expect(expected).toHaveLength(2)
    expect(expected[0].isFeed).toBe(true)
    expect(expected[0].url).toBe('https://example.com/feed.xml')
    expect(expected[1].isFeed).toBe(true)
    expect(expected[1].url).toBe('https://example.com/atom.xml')
  })

  it('should detect feed format from content-type', async () => {
    const value = createMockFetchFn({
      'https://example.com/feed': {
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        headers: new Headers({ 'content-type': 'application/rss+xml' }),
        status: 200,
      },
    })

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed'],
    })

    expect(expected[0].isFeed).toBe(true)
    if (expected[0].isFeed) {
      expect(expected[0].feedFormat).toBe('rss')
    }
  })

  it('should stop on first valid feed when stopOnFirst is true', async () => {
    let fetchCount = 0
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchCount += 1

      return {
        headers: new Headers({ 'content-type': 'application/rss+xml' }),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed1', '/feed2', '/feed3'],
      stopOnFirst: true,
      concurrency: 1,
    })

    expect(expected).toHaveLength(1)
    expect(fetchCount).toBeLessThanOrEqual(1)
  })

  it('should include invalid results when includeInvalid is true', async () => {
    const value = createMockFetchFn({
      'https://example.com/feed.xml': {
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        status: 200,
      },
      'https://example.com/invalid': {
        body: '<html><body>Not a feed</body></html>',
        status: 200,
      },
    })

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed.xml', '/invalid'],
      includeInvalid: true,
    })

    expect(expected).toHaveLength(2)
    expect(expected[0].isFeed).toBe(true)
    expect(expected[1].isFeed).toBe(false)
  })

  it('should not include invalid results by default', async () => {
    const value = createMockFetchFn({
      'https://example.com/feed.xml': {
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        status: 200,
      },
      'https://example.com/invalid': {
        body: '<html><body>Not a feed</body></html>',
        status: 200,
      },
    })

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed.xml', '/invalid'],
    })

    expect(expected).toHaveLength(1)
    expect(expected[0].isFeed).toBe(true)
  })

  it('should call onProgress callback', async () => {
    const values: Array<Progress> = []
    const value = createMockFetchFn({
      'https://example.com/feed1': {
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        status: 200,
      },
      'https://example.com/feed2': {
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        status: 200,
      },
    })

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed1', '/feed2'],
      onProgress: (progress) => {
        values.push(progress)
      },
    })

    expect(values.length).toBeGreaterThan(0)
    expect(values[values.length - 1].tested).toBe(2)
    expect(values[values.length - 1].total).toBe(2)
  })

  it('should handle fetch errors gracefully', async () => {
    const value: FetchFn = async (): Promise<FetchFnResponse> => {
      throw new Error('Network error')
    }

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed'],
    })

    expect(expected).toHaveLength(0)
  })

  it('should include errors when includeInvalid is true', async () => {
    const value: FetchFn = async (): Promise<FetchFnResponse> => {
      throw new Error('Network error')
    }

    const expected = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed'],
      includeInvalid: true,
    })

    expect(expected).toHaveLength(1)
    expect(expected[0].isFeed).toBe(false)
  })

  it('should use custom validator when provided', async () => {
    const value = createMockFetchFn({
      'https://example.com/custom': {
        body: 'CUSTOM_FEED_MARKER',
        status: 200,
      },
    })
    const customValidator = async (response: FetchFnResponse) => {
      return {
        url: response.url,
        isFeed: true as const,
        feedFormat: 'rss' as const,
      }
    }

    const expectedValue = await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/custom'],
      validateFn: customValidator,
    })

    expect(expectedValue[0].isFeed).toBe(true)
  })

  it('should respect concurrency limit', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      currentConcurrent += 1
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)

      await new Promise((resolve) => {
        return setTimeout(resolve, 10)
      })

      currentConcurrent -= 1

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed1', '/feed2', '/feed3', '/feed4', '/feed5'],
      concurrency: 2,
    })

    expect(maxConcurrent).toBeLessThanOrEqual(2)
  })

  it('should accept minimal feed URIs array', async () => {
    const fetchedUrls: Array<string> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchedUrls.push(url)

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: feedUrisMinimal,
    })

    expect(fetchedUrls.some((url) => url.includes('/feed'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/rss'))).toBe(true)
  })

  it('should accept balanced feed URIs array', async () => {
    const fetchedUrls: Array<string> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchedUrls.push(url)

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: feedUrisBalanced,
    })

    expect(fetchedUrls.some((url) => url.includes('/feed.json'))).toBe(true)
  })

  it('should accept comprehensive feed URIs array', async () => {
    const fetchedUrls: Array<string> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchedUrls.push(url)

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: feedUrisComprehensive,
    })

    expect(fetchedUrls.some((url) => url.includes('?feed=rss'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/feeds/posts/default'))).toBe(true)
  })

  it('should accept custom array of feed URIs', async () => {
    const fetchedUrls: Array<string> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchedUrls.push(url)

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/custom-feed', '/my-rss.xml'],
    })

    expect(fetchedUrls).toEqual([
      'https://example.com/custom-feed',
      'https://example.com/my-rss.xml',
    ])
  })

  it('should test additional base URLs alongside main baseUrl', async () => {
    const fetchedUrls: Array<string> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchedUrls.push(url)

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed', '/rss'],
      additionalBaseUrls: ['https://www.example.com', 'https://blog.example.com'],
    })

    // Should test: base × feedUris + additional × feedUris
    // (1 + 2) base URLs × 2 feed URIs = 6 total requests
    expect(fetchedUrls).toHaveLength(6)
    expect(fetchedUrls).toContain('https://example.com/feed')
    expect(fetchedUrls).toContain('https://example.com/rss')
    expect(fetchedUrls).toContain('https://www.example.com/feed')
    expect(fetchedUrls).toContain('https://www.example.com/rss')
    expect(fetchedUrls).toContain('https://blog.example.com/feed')
    expect(fetchedUrls).toContain('https://blog.example.com/rss')
  })

  it('should generate correct cartesian product with additionalBaseUrls', async () => {
    const fetchedUrls: Array<string> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      fetchedUrls.push(url)

      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed.xml'],
      additionalBaseUrls: ['https://www.example.com'],
    })

    // 2 base URLs × 1 feed URI = 2 requests
    expect(fetchedUrls).toEqual([
      'https://example.com/feed.xml',
      'https://www.example.com/feed.xml',
    ])
  })

  it('should update progress correctly with additional base URLs', async () => {
    const progressUpdates: Array<Progress> = []
    const value: FetchFn = async (url: string): Promise<FetchFnResponse> => {
      return {
        headers: new Headers(),
        body: '<?xml version="1.0"?><rss version="2.0"></rss>',
        url,
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverCommonFeedUrisFromGuess('https://example.com', {
      fetchFn: value,
      feedUris: ['/feed', '/rss'],
      additionalBaseUrls: ['https://www.example.com'],
      onProgress: (progress) => {
        progressUpdates.push(progress)
      },
    })

    // Should have 4 total URLs (2 base × 2 feedUris)
    const lastProgress = progressUpdates[progressUpdates.length - 1]
    expect(lastProgress.total).toBe(4)
    expect(lastProgress.tested).toBe(4)
  })
})
