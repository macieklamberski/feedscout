import { describe, expect, it } from 'bun:test'
import { generateFeedUrlCombinations, processConcurrently } from './utils.js'

describe('generateFeedUrlCombinations', () => {
  it('should generate all URL combinations from multiple bases and URIs', () => {
    const baseUrls = ['https://example.com', 'https://blog.example.com']
    const feedUris = ['/feed.xml', '/rss.xml']
    const expected = [
      'https://example.com/feed.xml',
      'https://example.com/rss.xml',
      'https://blog.example.com/feed.xml',
      'https://blog.example.com/rss.xml',
    ]

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should generate combinations with single base and multiple URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed.xml', '/rss.xml', '/atom.xml']
    const expected = [
      'https://example.com/feed.xml',
      'https://example.com/rss.xml',
      'https://example.com/atom.xml',
    ]

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should generate combinations with multiple bases and single URI', () => {
    const baseUrls = ['https://example.com', 'https://www.example.com', 'https://blog.example.com']
    const feedUris = ['/feed.xml']
    const expected = [
      'https://example.com/feed.xml',
      'https://www.example.com/feed.xml',
      'https://blog.example.com/feed.xml',
    ]

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle relative URIs without leading slash', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['feed.xml', 'rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://example.com/rss.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle base URLs with trailing slash', () => {
    const baseUrls = ['https://example.com/']
    const feedUris = ['/feed.xml', 'rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://example.com/rss.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle base URLs with paths', () => {
    const baseUrls = ['https://example.com/blog/']
    const feedUris = ['/feed.xml', 'rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://example.com/blog/rss.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle query parameters in URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/?feed=rss', '/?feed=atom']
    const expected = ['https://example.com/?feed=rss', 'https://example.com/?feed=atom']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle absolute URIs in feedUris', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['https://feeds.example.com/rss.xml']
    const expected = ['https://feeds.example.com/rss.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle mixed relative and absolute URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed.xml', 'https://feeds.example.com/rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://feeds.example.com/rss.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should return empty array when baseUrls is empty', () => {
    const baseUrls: Array<string> = []
    const feedUris = ['/feed.xml', '/rss.xml']
    const expected: Array<string> = []

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should return empty array when feedUris is empty', () => {
    const baseUrls = ['https://example.com']
    const feedUris: Array<string> = []
    const expected: Array<string> = []

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should return empty array when both arrays are empty', () => {
    const baseUrls: Array<string> = []
    const feedUris: Array<string> = []
    const expected: Array<string> = []

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle single base and single URI', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed.xml']
    const expected = ['https://example.com/feed.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should preserve URL encoding in URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed%20name.xml', '/rss%2Batom.xml']
    const expected = ['https://example.com/feed%20name.xml', 'https://example.com/rss%2Batom.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle different protocols in base URLs', () => {
    const baseUrls = ['http://example.com', 'https://example.com']
    const feedUris = ['/feed.xml']
    const expected = ['http://example.com/feed.xml', 'https://example.com/feed.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle ports in base URLs', () => {
    const baseUrls = ['https://example.com:8080']
    const feedUris = ['/feed.xml']
    const expected = ['https://example.com:8080/feed.xml']

    expect(generateFeedUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })
})

describe('processConcurrently', () => {
  it('should process all items with concurrency limit', async () => {
    const items = [1, 2, 3, 4, 5]
    const processed: Array<number> = []
    const processFn = async (item: number) => {
      await new Promise((resolve) => {
        return setTimeout(resolve, 10)
      })
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 2 })

    expect(processed.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  it('should respect concurrency limit', async () => {
    const items = [1, 2, 3, 4, 5]
    let maxConcurrent = 0
    let currentConcurrent = 0
    const processFn = async () => {
      currentConcurrent++
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      await new Promise((resolve) => {
        return setTimeout(resolve, 50)
      })
      currentConcurrent--
    }

    await processConcurrently(items, processFn, { concurrency: 3 })

    expect(maxConcurrent).toBe(3)
  })

  it('should stop early when shouldStop returns true', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const processed: Array<number> = []
    const processFn = async (item: number) => {
      await new Promise((resolve) => {
        return setTimeout(resolve, 10)
      })
      processed.push(item)
    }

    await processConcurrently(items, processFn, {
      concurrency: 2,
      shouldStop: () => {
        return processed.length >= 5
      },
    })

    expect(processed.length).toBeLessThanOrEqual(7)
  })

  it('should handle errors in processFn', async () => {
    const items = [1, 2, 3, 4, 5]
    const processed: Array<number> = []
    const processFn = async (item: number) => {
      if (item === 3) {
        throw new Error('Test error')
      }
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 2 })

    expect(processed.sort((a, b) => a - b)).toEqual([1, 2, 4, 5])
  })

  it('should handle empty array', async () => {
    const items: Array<number> = []
    const processed: Array<number> = []
    const processFn = async (item: number) => {
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 2 })

    expect(processed).toEqual([])
  })

  it('should process single item', async () => {
    const items = [1]
    const processed: Array<number> = []
    const processFn = async (item: number) => {
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 2 })

    expect(processed).toEqual([1])
  })

  it('should handle concurrency of 1', async () => {
    const items = [1, 2, 3]
    const processed: Array<number> = []
    let maxConcurrent = 0
    let currentConcurrent = 0
    const processFn = async (item: number) => {
      currentConcurrent++
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      await new Promise((resolve) => {
        return setTimeout(resolve, 10)
      })
      processed.push(item)
      currentConcurrent--
    }

    await processConcurrently(items, processFn, { concurrency: 1 })

    expect(maxConcurrent).toBe(1)
    expect(processed).toEqual([1, 2, 3])
  })

  it('should handle concurrency greater than items length', async () => {
    const items = [1, 2, 3]
    const processed: Array<number> = []
    const processFn = async (item: number) => {
      await new Promise((resolve) => {
        return setTimeout(resolve, 10)
      })
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 10 })

    expect(processed.sort((a, b) => a - b)).toEqual([1, 2, 3])
  })

  it('should process items in parallel when concurrency allows', async () => {
    const items = [1, 2, 3]
    const startTimes: Array<number> = []
    const processFn = async () => {
      startTimes.push(Date.now())
      await new Promise((resolve) => {
        return setTimeout(resolve, 50)
      })
    }

    await processConcurrently(items, processFn, { concurrency: 3 })
    const timeDifferences = startTimes.slice(1).map((time, index) => {
      return time - startTimes[index]
    })

    expect(timeDifferences.every((diff) => diff < 30)).toBe(true)
  })

  it('should maintain side effects order independence', async () => {
    const items = [1, 2, 3, 4, 5]
    const results: Array<number> = []
    const processFn = async (item: number) => {
      await new Promise((resolve) => {
        return setTimeout(resolve, Math.random() * 50)
      })
      results.push(item * 2)
    }

    await processConcurrently(items, processFn, { concurrency: 3 })
    const expected = [2, 4, 6, 8, 10]

    expect(results.sort((a, b) => a - b)).toEqual(expected)
  })

  it('should not call shouldStop after completion', async () => {
    const items = [1, 2, 3]
    let shouldStopCallCount = 0
    const processFn = async () => {
      await new Promise((resolve) => {
        return setTimeout(resolve, 10)
      })
    }

    await processConcurrently(items, processFn, {
      concurrency: 2,
      shouldStop: () => {
        shouldStopCallCount++
        return false
      },
    })

    expect(shouldStopCallCount).toBeGreaterThan(0)
  })
})
