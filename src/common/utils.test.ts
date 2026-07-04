import { describe, expect, it } from 'bun:test'
import {
  composeHint,
  hasMetaContent,
  isOfAllowedMimeType,
  matchesAnyOfLinkSelectors,
  normalizeMimeType,
  processConcurrently,
  toPositiveInteger,
} from './utils.js'

describe('composeHint', () => {
  it('should return hint with key and label for valid key', () => {
    const value = 'youtube:all'
    const expected = {
      key: 'youtube:all',
      label: 'All uploads',
    }

    expect(composeHint(value)).toEqual(expected)
  })

  it('should return hint with key and label for another valid key', () => {
    const value = 'reddit:posts'
    const expected = {
      key: 'reddit:posts',
      label: 'Posts',
    }

    expect(composeHint(value)).toEqual(expected)
  })

  it('should return undefined label for unknown key', () => {
    const value = 'unknown:key'

    // @ts-expect-error: This is for testing purposes.
    expect(composeHint(value)).toEqual({ key: 'unknown:key', label: undefined })
  })
})

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

describe('matchesAnyOfLinkSelectors', () => {
  it('should return true when rel matches selector without types', () => {
    const rel = 'feed'
    const type = undefined
    const selectors = [{ rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should return true when rel and type match selector', () => {
    const rel = 'alternate'
    const type = 'application/rss+xml'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml', 'application/atom+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should return false when rel matches but type does not', () => {
    const rel = 'alternate'
    const type = 'text/html'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(false)
  })

  it('should return false when rel does not match', () => {
    const rel = 'stylesheet'
    const type = 'application/rss+xml'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(false)
  })

  it('should return true when type is undefined and selector has no types', () => {
    const rel = 'feed'
    const type = undefined
    const selectors = [{ rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should return false when type is undefined but selector requires types', () => {
    const rel = 'alternate'
    const type = undefined
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(false)
  })

  it('should match rel case-insensitively', () => {
    const rel = 'ALTERNATE'
    const type = 'application/rss+xml'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should match type case-insensitively', () => {
    const rel = 'alternate'
    const type = 'APPLICATION/RSS+XML'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should match any selector in array', () => {
    const rel = 'feed'
    const type = undefined
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }, { rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should return false for empty selectors array', () => {
    const rel = 'alternate'
    const type = 'application/rss+xml'
    const selectors: Array<{ rel: string; types?: Array<string> }> = []

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(false)
  })

  it('should match rel as word in space-separated value', () => {
    const rel = 'alternate feed'
    const type = undefined
    const selectors = [{ rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should not match partial rel word', () => {
    const rel = 'feedburner'
    const type = undefined
    const selectors = [{ rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(false)
  })

  it('should handle type with charset parameter', () => {
    const rel = 'alternate'
    const type = 'application/rss+xml; charset=utf-8'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should handle empty types array as allowing any type', () => {
    const rel = 'alternate'
    const type = 'text/html'
    const selectors = [{ rel: 'alternate', types: [] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
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
    const processedSorted = processed.sort((a, b) => a - b)
    const expected = [1, 2, 3, 4, 5]

    expect(processedSorted).toEqual(expected)
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
      shouldStop: () => processed.length >= 5,
    })

    expect(processed.length).toBeLessThanOrEqual(7)
  })

  it('should handle errors in processFn', async () => {
    const items = [1, 2, 3, 4, 5]
    const processed: Array<number> = []
    // biome-ignore lint/suspicious/useAwait: Must return Promise for processConcurrently.
    const processFn = async (item: number) => {
      if (item === 3) {
        throw new Error('Test error')
      }
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 2 })
    const processedSorted = processed.sort((a, b) => a - b)
    const expected = [1, 2, 4, 5]

    expect(processedSorted).toEqual(expected)
  })

  it('should handle empty array', async () => {
    const items: Array<number> = []
    const processed: Array<number> = []
    // biome-ignore lint/suspicious/useAwait: Must return Promise for processConcurrently.
    const processFn = async (item: number) => {
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 2 })

    expect(processed).toEqual([])
  })

  it('should process single item', async () => {
    const items = [1]
    const processed: Array<number> = []
    // biome-ignore lint/suspicious/useAwait: Must return Promise for processConcurrently.
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
    const processedSorted = processed.sort((a, b) => a - b)
    const expected = [1, 2, 3]

    expect(processedSorted).toEqual(expected)
  })

  it('should process items in parallel when concurrency allows', async () => {
    const items = [1, 2, 3]
    let startedCount = 0
    let releaseBarrier = () => {}
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve
    })
    // Each item blocks on a barrier that opens only once all three have started, so the
    // run completes only when all items execute in parallel.
    const processFn = async () => {
      startedCount++

      if (startedCount === items.length) {
        releaseBarrier()
      }

      await barrier
    }

    await processConcurrently(items, processFn, { concurrency: 3 })

    expect(startedCount).toBe(3)
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
    const resultsSorted = results.sort((a, b) => a - b)
    const expected = [2, 4, 6, 8, 10]

    expect(resultsSorted).toEqual(expected)
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

  it('should not process items when concurrency is 0', async () => {
    const items = [1, 2, 3]
    const processed: Array<number> = []
    // biome-ignore lint/suspicious/useAwait: Must return Promise for processConcurrently.
    const processFn = async (item: number) => {
      processed.push(item)
    }

    await processConcurrently(items, processFn, { concurrency: 0 })

    expect(processed).toEqual([])
  })

  it.todo('should not process items when concurrency is negative', () => {
    // Call processConcurrently with { concurrency: -1 } and a few items.
    // Expected: returns immediately without processing any item, same as concurrency 0.
  })
})

describe('hasMetaContent', () => {
  it('should return true when name comes before content', () => {
    const value = '<meta name="generator" content="Mastodon v4.2.0">'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should return true when content comes before name', () => {
    const value = '<meta content="Mastodon v4.2.0" name="generator">'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should return true when using property attribute', () => {
    const value = '<meta property="og:site_name" content="GitLab">'

    expect(hasMetaContent(value, 'og:site_name', 'GitLab')).toBe(true)
  })

  it('should return true when content comes before property', () => {
    const value = '<meta content="GitLab" property="og:site_name">'

    expect(hasMetaContent(value, 'og:site_name', 'GitLab')).toBe(true)
  })

  it('should return true when content starts with value', () => {
    const value = '<meta name="generator" content="Lemmy v0.19.5">'

    expect(hasMetaContent(value, 'generator', 'Lemmy')).toBe(true)
  })

  it('should return true when tag has additional attributes', () => {
    const value = '<meta charset="utf-8" name="generator" content="Mastodon v4.2.0" />'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should return true when meta tag is embedded in full HTML', () => {
    const value = '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should be case-insensitive for tag and attribute names', () => {
    const value = '<META NAME="generator" CONTENT="Mastodon">'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should return false when name does not match', () => {
    const value = '<meta name="description" content="Mastodon">'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when content does not match', () => {
    const value = '<meta name="generator" content="WordPress">'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when content is a suffix match', () => {
    const value = '<meta name="generator" content="not-Mastodon">'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when content attribute is missing', () => {
    expect(hasMetaContent('<meta name="generator">', 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when meta tag is absent', () => {
    expect(
      hasMetaContent('<html><body>Mastodon generator</body></html>', 'generator', 'Mastodon'),
    ).toBe(false)
  })

  it('should return false for empty HTML', () => {
    expect(hasMetaContent('', 'generator', 'Mastodon')).toBe(false)
  })

  it('should escape regex metacharacters in name and value', () => {
    const value = '<meta name="a.b*c" content="x$y (1+2)">'

    expect(hasMetaContent(value, 'a.b*c', 'x$y (1+2)')).toBe(true)
    expect(hasMetaContent(value, 'aXbXc', 'x$y (1+2)')).toBe(false)
  })

  it('should match single-quoted attribute values', () => {
    const value = "<meta name='generator' content='Mastodon v4.2.0'>"

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should return false when value appears in a non-meta content attribute', () => {
    const value = '<html><body><div content="Mastodon">text</div></body></html>'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when value appears only in body text', () => {
    const value =
      '<html><head><meta name="generator" content="WordPress"></head><body>Migrated from Mastodon last year.</body></html>'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return consistent results across repeated calls with the same pair', () => {
    const matching = '<meta name="generator" content="Mastodon">'
    const nonMatching = '<meta name="generator" content="WordPress">'

    expect(hasMetaContent(matching, 'generator', 'Mastodon')).toBe(true)
    expect(hasMetaContent(nonMatching, 'generator', 'Mastodon')).toBe(false)
    expect(hasMetaContent(matching, 'generator', 'Mastodon')).toBe(true)
  })
})

describe('toPositiveInteger', () => {
  it('should return the value when it is a positive integer', () => {
    expect(toPositiveInteger(5, 3)).toBe(5)
    expect(toPositiveInteger(1, 3)).toBe(1)
  })

  it('should fall back for undefined', () => {
    expect(toPositiveInteger(undefined, 3)).toBe(3)
  })

  it('should fall back for NaN', () => {
    expect(toPositiveInteger(Number.NaN, 3)).toBe(3)
  })

  it('should fall back for values below 1', () => {
    expect(toPositiveInteger(0, 3)).toBe(3)
    expect(toPositiveInteger(-1, 3)).toBe(3)
  })

  it('should fall back for non-integer values', () => {
    expect(toPositiveInteger(2.5, 3)).toBe(3)
  })
})
