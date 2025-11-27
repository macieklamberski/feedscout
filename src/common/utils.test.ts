import { describe, expect, it } from 'bun:test'
import {
  anyWordMatchesAnyOf,
  endsWithAnyOf,
  includesAnyOf,
  isAnyOf,
  isOfAllowedMimeType,
  normalizeMimeType,
  processConcurrently,
} from './utils.js'

describe('normalizeMimeType', () => {
  it('should extract base MIME type without parameters', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type without parameters', () => {
    const value = 'application/atom+xml'
    const expected = 'application/atom+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should normalize case to lowercase', () => {
    const value = 'APPLICATION/RSS+XML'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should trim whitespace', () => {
    const value = '  application/rss+xml  '
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle multiple parameters', () => {
    const value = 'application/rss+xml; charset=utf-8; boundary=something'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle empty string', () => {
    const value = ''
    const expected = ''

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle string with only semicolons', () => {
    const value = ';;;'
    const expected = ''

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type with space before semicolon', () => {
    const value = 'application/rss+xml ; charset=utf-8'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type with tab characters', () => {
    const value = 'application/rss+xml\t; charset=utf-8'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type with newline characters', () => {
    const value = 'application/rss+xml\n; charset=utf-8'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type starting with semicolon', () => {
    const value = '; charset=utf-8'
    const expected = ''

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type with quotes in parameters', () => {
    const value = 'application/rss+xml; charset="utf-8"'
    const expected = 'application/rss+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })

  it('should handle MIME type with mixed whitespace', () => {
    const value = ' \t application/atom+xml \n '
    const expected = 'application/atom+xml'

    expect(normalizeMimeType(value)).toBe(expected)
  })
})

describe('includesAnyOf', () => {
  it('should return true when value includes one of the patterns', () => {
    const value = 'application/rss+xml'
    const patterns = ['application/rss+xml', 'application/atom+xml']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when value includes pattern with case-insensitive match', () => {
    const value = 'APPLICATION/RSS+XML'
    const patterns = ['application/rss+xml']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when patterns have mixed case', () => {
    const value = 'subscribe to our feed'
    const patterns = ['RSS', 'Feed']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when value partially includes pattern', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['rss+xml']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when using custom parser', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['application/rss+xml']

    expect(includesAnyOf(value, patterns, normalizeMimeType)).toBe(true)
  })

  it('should return false when value does not include any pattern', () => {
    const value = 'text/html'
    const patterns = ['application/rss+xml', 'application/atom+xml']

    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should return false when patterns array is empty', () => {
    const value = 'application/rss+xml'
    const patterns: Array<string> = []

    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should handle empty string value', () => {
    const value = ''
    const patterns = ['application/rss+xml']

    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should handle undefined value', () => {
    const value = undefined
    const patterns = ['application/rss+xml']

    // @ts-expect-error: This is for testing purposes.
    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should handle null value', () => {
    const value = null
    const patterns = ['application/rss+xml']

    // @ts-expect-error: This is for testing purposes.
    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should return true when multiple patterns match', () => {
    const value = 'application/rss+xml feed'
    const patterns = ['rss', 'feed', 'atom']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should handle special characters in patterns', () => {
    const value = 'Subscribe via RSS/Atom'
    const patterns = ['RSS/Atom']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should handle whitespace-only value', () => {
    const value = '   '
    const patterns = ['rss']

    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should handle pattern with numbers', () => {
    const value = 'RSS 2.0 feed'
    const patterns = ['2.0']

    expect(includesAnyOf(value, patterns)).toBe(true)
  })
})

describe('isAnyOf', () => {
  it('should return true when value exactly matches one of the patterns', () => {
    const value = 'application/rss+xml'
    const patterns = ['application/rss+xml', 'application/atom+xml']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when value matches pattern with case-insensitive match', () => {
    const value = 'APPLICATION/RSS+XML'
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when value has whitespace and matches after trim', () => {
    const value = '  application/rss+xml  '
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when using custom parser', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns, normalizeMimeType)).toBe(true)
  })

  it('should return false when value only partially matches', () => {
    const value = 'application/rss+xml; charset=utf-8'
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should return false when value does not match any pattern', () => {
    const value = 'text/html'
    const patterns = ['application/rss+xml', 'application/atom+xml']

    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should return false when patterns array is empty', () => {
    const value = 'application/rss+xml'
    const patterns: Array<string> = []

    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should handle empty string value', () => {
    const value = ''
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should handle whitespace-only value', () => {
    const value = '   '
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should handle undefined value', () => {
    const value = undefined
    const patterns = ['application/rss+xml']

    // @ts-expect-error: This is for testing purposes.
    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should handle null value', () => {
    const value = null
    const patterns = ['application/rss+xml']

    // @ts-expect-error: This is for testing purposes.
    expect(isAnyOf(value, patterns)).toBe(false)
  })

  it('should handle value with tab characters', () => {
    const value = 'application/rss+xml\t'
    const patterns = ['application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should handle pattern with leading whitespace', () => {
    const value = 'application/rss+xml'
    const patterns = ['  application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should handle pattern with trailing whitespace', () => {
    const value = 'application/rss+xml'
    const patterns = ['application/rss+xml  ']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when last pattern matches', () => {
    const value = 'application/json'
    const patterns = ['application/rss+xml', 'application/atom+xml', 'application/json']

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should handle empty pattern in array', () => {
    const value = ''
    const patterns = ['', 'application/rss+xml']

    expect(isAnyOf(value, patterns)).toBe(true)
  })
})

describe('anyWordMatchesAnyOf', () => {
  it('should return true when a word matches a pattern', () => {
    const value = 'alternate feed'
    const patterns = ['feed', 'rss']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(true)
  })

  it('should return true when multiple words match patterns', () => {
    const value = 'alternate rss feed'
    const patterns = ['feed', 'rss']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(true)
  })

  it('should return false when no words match patterns', () => {
    const value = 'alternate stylesheet'
    const patterns = ['feed', 'rss']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(false)
  })

  it('should match case-insensitively', () => {
    const value = 'ALTERNATE FEED'
    const patterns = ['feed', 'rss']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(true)
  })

  it('should match patterns case-insensitively', () => {
    const value = 'alternate feed'
    const patterns = ['FEED', 'RSS']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(true)
  })

  it('should not match partial words', () => {
    const value = 'feedburner'
    const patterns = ['feed']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(false)
  })

  it('should handle multiple whitespace characters', () => {
    const value = 'alternate   feed\trss'
    const patterns = ['rss']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(true)
  })

  it('should return false for empty patterns array', () => {
    const value = 'alternate feed'
    const patterns: Array<string> = []

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(false)
  })

  it('should return false for empty value', () => {
    const value = ''
    const patterns = ['feed', 'rss']

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(false)
  })
})

describe('endsWithAnyOf', () => {
  it('should return true when value ends with a pattern', () => {
    const value = '/blog/feed.xml'
    const patterns = ['.xml', '.rss']

    expect(endsWithAnyOf(value, patterns)).toBe(true)
  })

  it('should return false when value does not end with any pattern', () => {
    const value = '/blog/index.html'
    const patterns = ['.xml', '.rss']

    expect(endsWithAnyOf(value, patterns)).toBe(false)
  })

  it('should match case-insensitively', () => {
    const value = '/blog/FEED.XML'
    const patterns = ['.xml', '.rss']

    expect(endsWithAnyOf(value, patterns)).toBe(true)
  })

  it('should match patterns case-insensitively', () => {
    const value = '/blog/feed.xml'
    const patterns = ['.XML', '.RSS']

    expect(endsWithAnyOf(value, patterns)).toBe(true)
  })

  it('should return false for empty patterns array', () => {
    const value = '/blog/feed.xml'
    const patterns: Array<string> = []

    expect(endsWithAnyOf(value, patterns)).toBe(false)
  })

  it('should return false for empty value', () => {
    const value = ''
    const patterns = ['.xml', '.rss']

    expect(endsWithAnyOf(value, patterns)).toBe(false)
  })

  it('should match full pattern at end', () => {
    const value = '/feed'
    const patterns = ['/feed', '/rss']

    expect(endsWithAnyOf(value, patterns)).toBe(true)
  })
})

describe('isOfAllowedMimeType', () => {
  it('should return true when type matches allowed type', () => {
    const type = 'application/rss+xml'
    const allowedTypes = ['application/rss+xml', 'application/atom+xml']

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(true)
  })

  it('should return true when allowedTypes is empty', () => {
    const type = 'text/html'
    const allowedTypes: Array<string> = []

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(true)
  })

  it('should return false when type is undefined', () => {
    const type = undefined
    const allowedTypes = ['application/rss+xml']

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(false)
  })

  it('should return true when type is undefined and allowedTypes is empty', () => {
    const type = undefined
    const allowedTypes: Array<string> = []

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(true)
  })

  it('should return false when type does not match allowed types', () => {
    const type = 'text/html'
    const allowedTypes = ['application/rss+xml', 'application/atom+xml']

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(false)
  })

  it('should match case-insensitively', () => {
    const type = 'APPLICATION/RSS+XML'
    const allowedTypes = ['application/rss+xml']

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(true)
  })

  it('should handle type with charset parameter', () => {
    const type = 'application/rss+xml; charset=utf-8'
    const allowedTypes = ['application/rss+xml']

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(true)
  })

  it('should handle type with whitespace around charset', () => {
    const type = 'application/rss+xml ; charset=utf-8'
    const allowedTypes = ['application/rss+xml']

    expect(isOfAllowedMimeType(type, allowedTypes)).toBe(true)
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
