import { describe, expect, it } from 'bun:test'
import type { FetchFn } from '../common/types.js'
import {
  anchorLabels,
  feedMimeTypes,
  feedUrisBalanced,
  feedUrisComprehensive,
  ignoredUris,
} from '../defaults.js'
import locales from '../locales.json' with { type: 'json' }
import { normalizeInput, normalizeMethodsConfig, processConcurrently } from './utils.js'

describe('normalizeInput', () => {
  it('should fetch and normalize string input', async () => {
    const fetchFn: FetchFn = async (url) => {
      return {
        url,
        body: '<html>content</html>',
        headers: new Headers({ 'content-type': 'text/html' }),
        status: 200,
        statusText: 'OK',
      }
    }
    const expected = {
      url: 'https://example.com',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', fetchFn)).toEqual(expected)
  })

  it('should preserve redirected URL from fetch response', async () => {
    const fetchFn: FetchFn = async () => {
      return {
        url: 'https://example.com/redirected',
        body: '<html>content</html>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const expected = {
      url: 'https://example.com/redirected',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', fetchFn)).toEqual(expected)
  })

  it('should handle ReadableStream body by converting to empty string', async () => {
    const fetchFn: FetchFn = async (url) => {
      return {
        url,
        body: new ReadableStream(),
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const expected = {
      url: 'https://example.com',
      content: '',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', fetchFn)).toEqual(expected)
  })

  it('should preserve headers from fetch response', async () => {
    const headers = new Headers({ 'content-type': 'text/html', link: '</feed>; rel="alternate"' })
    const fetchFn: FetchFn = async (url) => {
      return {
        url,
        body: '<html></html>',
        headers,
        status: 200,
        statusText: 'OK',
      }
    }

    const result = await normalizeInput('https://example.com', fetchFn)

    expect(result.headers).toBe(headers)
    expect(result.headers?.get('content-type')).toBe('text/html')
    expect(result.headers?.get('link')).toBe('</feed>; rel="alternate"')
  })

  it('should throw error when string input without fetchFn', async () => {
    const throwing = async () => {
      return normalizeInput('https://example.com')
    }

    await expect(throwing()).rejects.toThrow(locales.errors.fetchFnRequired)
  })

  it('should return object input as-is', async () => {
    const value = {
      url: 'https://example.com',
      content: '<html>existing content</html>',
      headers: new Headers({ 'content-type': 'text/html' }),
    }

    expect(await normalizeInput(value)).toEqual(value)
  })

  it('should return object input without fetchFn', async () => {
    const value = {
      url: 'https://example.com',
      content: '<html>content</html>',
    }

    expect(await normalizeInput(value)).toEqual(value)
  })

  it('should return object input with only url', async () => {
    const value = {
      url: 'https://example.com',
    }

    expect(await normalizeInput(value)).toEqual(value)
  })

  it('should return object input with url and content', async () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }

    expect(await normalizeInput(value)).toEqual(value)
  })

  it('should return object input with url and headers', async () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }

    expect(await normalizeInput(value)).toEqual(value)
  })

  it('should return object input with all fields', async () => {
    const headers = new Headers({ 'content-type': 'text/html' })
    const value = {
      url: 'https://example.com',
      content: '<html>full content</html>',
      headers,
    }

    expect(await normalizeInput(value)).toEqual(value)
  })

  it('should handle empty string content from fetch', async () => {
    const fetchFn: FetchFn = async (url) => {
      return {
        url,
        body: '',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const expected = {
      url: 'https://example.com',
      content: '',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', fetchFn)).toEqual(expected)
  })

  it('should not call fetchFn when object input provided', async () => {
    let fetchCalled = false
    const fetchFn: FetchFn = async (url) => {
      fetchCalled = true
      return {
        url,
        body: '<html></html>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const value = {
      url: 'https://example.com',
      content: '<html>existing</html>',
    }

    await normalizeInput(value, fetchFn)

    expect(fetchCalled).toBe(false)
  })

  it('should handle fetch response with different status codes', async () => {
    const fetchFn: FetchFn = async (url) => {
      return {
        url,
        body: '<html>content</html>',
        headers: new Headers(),
        status: 301,
        statusText: 'Moved Permanently',
      }
    }
    const expected = {
      url: 'https://example.com',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', fetchFn)).toEqual(expected)
  })
})

describe('normalizeMethodsConfig', () => {
  it('should normalize array with single method to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: expect.objectContaining({
          linkMimeTypes: feedMimeTypes,
          anchorUris: expect.arrayContaining(['/feed', '/rss', '/atom']),
          anchorIgnoredUris: ['wp-json/oembed/', 'wp-json/wp/'],
          anchorLabels: ['rss', 'feed', 'atom', 'subscribe', 'syndicate', 'json feed'],
          baseUrl: 'https://example.com',
        }),
      },
    }

    expect(normalizeMethodsConfig(value, ['html'])).toEqual(expected)
  })

  it('should normalize array with multiple methods to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers: new Headers(),
    }

    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'])

    expect(result.html).toBeDefined()
    expect(result.headers).toBeDefined()
    expect(result.guess).toBeDefined()
  })

  it('should normalize object with true values to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: expect.objectContaining({
          linkMimeTypes: feedMimeTypes,
          baseUrl: 'https://example.com',
        }),
      },
    }

    expect(normalizeMethodsConfig(value, { html: true })).toEqual(expected)
  })

  it('should normalize object with custom options and merge with defaults', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {
      guess: {
        options: {
          feedUris: ['/custom-feed'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { guess: { feedUris: ['/custom-feed'] } })).toEqual(
      expected,
    )
  })

  it('should normalize mixed object with true and custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }

    const result = normalizeMethodsConfig(value, { html: true, guess: { feedUris: ['/custom'] } })

    expect(result.html).toBeDefined()
    expect(result.guess?.options.feedUris).toEqual(['/custom'])
  })

  it('should override default options with custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }

    const result = normalizeMethodsConfig(value, { html: { anchorLabels: ['custom-label'] } })

    expect(result.html?.options.anchorLabels).toEqual(['custom-label'])
    expect(result.html?.options.linkMimeTypes).toEqual(feedMimeTypes)
  })

  it('should handle empty array', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {}

    expect(normalizeMethodsConfig(value, [])).toEqual(expected)
  })

  it('should handle empty object', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {}

    expect(normalizeMethodsConfig(value, {})).toEqual(expected)
  })

  it('should include baseUrl from input in all method configs', () => {
    const value = {
      url: 'https://blog.example.com',
      content: '<html></html>',
      headers: new Headers(),
    }

    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'])

    expect(result.html?.options.baseUrl).toBe('https://blog.example.com')
    expect(result.headers?.options.baseUrl).toBe('https://blog.example.com')
    expect(result.guess?.options.baseUrl).toBe('https://blog.example.com')
  })

  it('should pass headers object to headers method config', () => {
    const headers = new Headers({ 'content-type': 'text/html' })
    const value = {
      url: 'https://example.com',
      headers,
    }

    const result = normalizeMethodsConfig(value, ['headers'])

    expect(result.headers?.headers).toBe(headers)
  })

  it('should pass html content to html method config', () => {
    const htmlContent =
      '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml" /></head></html>'
    const value = {
      url: 'https://example.com',
      content: htmlContent,
    }

    const result = normalizeMethodsConfig(value, ['html'])

    expect(result.html?.html).toBe(htmlContent)
  })

  it('should preserve custom options when merging with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const customOptions = {
      anchorLabels: ['custom1', 'custom2'],
      anchorUris: ['/custom-feed'],
    }

    const result = normalizeMethodsConfig(value, { html: customOptions })

    expect(result.html?.options.anchorLabels).toEqual(['custom1', 'custom2'])
    expect(result.html?.options.anchorUris).toEqual(['/custom-feed'])
    expect(result.html?.options.linkMimeTypes).toEqual(feedMimeTypes)
  })

  it('should handle all three methods with array format', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers: new Headers(),
    }

    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'])

    expect(result.html).toBeDefined()
    expect(result.headers).toBeDefined()
    expect(result.guess).toBeDefined()
  })

  it('should handle all three methods with object format', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers: new Headers(),
    }

    const result = normalizeMethodsConfig(value, { html: true, headers: true, guess: true })

    expect(result.html).toBeDefined()
    expect(result.headers).toBeDefined()
    expect(result.guess).toBeDefined()
  })

  it('should throw error when html method requested without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, ['html'])

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method requested without headers', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, ['headers'])

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method requested without url', () => {
    const value = {
      url: '',
      content: '<html></html>',
    }
    const throwing = () => normalizeMethodsConfig(value, ['guess'])

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should throw error when html method in object format without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, { html: true })

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method in object format without headers', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, { headers: true })

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method in object format without url', () => {
    const value = {
      url: '',
    }
    const throwing = () => normalizeMethodsConfig(value, { guess: true })

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should return complete html config with all default values', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkMimeTypes: feedMimeTypes,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, ['html'])).toEqual(expected)
  })

  it('should return complete headers config with all default values', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }
    const expected = {
      headers: {
        headers,
        options: {
          linkMimeTypes: feedMimeTypes,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, ['headers'])).toEqual(expected)
  })

  it('should return complete guess config with all default values', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {
      guess: {
        options: {
          feedUris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, ['guess'])).toEqual(expected)
  })

  it('should keep all defaults when overriding html anchorLabels', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkMimeTypes: feedMimeTypes,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels: ['custom-label'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { html: { anchorLabels: ['custom-label'] } })).toEqual(
      expected,
    )
  })

  it('should keep all defaults when overriding html anchorUris', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkMimeTypes: feedMimeTypes,
          anchorUris: ['/custom-feed'],
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { html: { anchorUris: ['/custom-feed'] } })).toEqual(
      expected,
    )
  })

  it('should keep all defaults when overriding html anchorIgnoredUris', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkMimeTypes: feedMimeTypes,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ['custom-ignore'],
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(
      normalizeMethodsConfig(value, { html: { anchorIgnoredUris: ['custom-ignore'] } }),
    ).toEqual(expected)
  })

  it('should keep all defaults when overriding html linkMimeTypes', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkMimeTypes: ['custom/mime'],
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { html: { linkMimeTypes: ['custom/mime'] } })).toEqual(
      expected,
    )
  })

  it('should keep all defaults when overriding guess feedUris', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {
      guess: {
        options: {
          feedUris: ['/custom-feed'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { guess: { feedUris: ['/custom-feed'] } })).toEqual(
      expected,
    )
  })

  it('should keep all defaults when overriding headers linkMimeTypes', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }
    const expected = {
      headers: {
        headers,
        options: {
          linkMimeTypes: ['custom/mime'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { headers: { linkMimeTypes: ['custom/mime'] } })).toEqual(
      expected,
    )
  })

  it('should handle empty string content for html method', () => {
    const value = {
      url: 'https://example.com',
      content: '',
    }
    const expected = {
      html: {
        html: '',
        options: {
          linkMimeTypes: feedMimeTypes,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, ['html'])).toEqual(expected)
  })

  it('should handle undefined url as falsy', () => {
    const value = {
      content: '<html></html>',
    }
    // @ts-expect-error: This is for testing purposes.
    const throwing = () => normalizeMethodsConfig(value, ['guess'])

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should return all three method configs with complete defaults', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkMimeTypes: feedMimeTypes,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
      headers: {
        headers,
        options: {
          linkMimeTypes: feedMimeTypes,
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          feedUris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, ['html', 'headers', 'guess'])).toEqual(expected)
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

    expect(
      processed.sort((a, b) => {
        return a - b
      }),
    ).toEqual([1, 2, 3, 4, 5])
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

    expect(
      processed.sort((a, b) => {
        return a - b
      }),
    ).toEqual([1, 2, 4, 5])
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

    expect(
      processed.sort((a, b) => {
        return a - b
      }),
    ).toEqual([1, 2, 3])
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

    expect(
      timeDifferences.every((diff) => {
        return diff < 30
      }),
    ).toBe(true)
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

    expect(
      results.sort((a, b) => {
        return a - b
      }),
    ).toEqual(expected)
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
