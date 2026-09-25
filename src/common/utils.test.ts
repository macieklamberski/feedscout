import { describe, expect, it } from 'bun:test'
import type { DiscoverUriHint } from './types.js'
import {
  composeHint,
  type Element,
  findDescendant,
  findElement,
  getCookieNames,
  getJsonLd,
  getMetaContent,
  getScriptText,
  hasAnyMeta,
  hasClass,
  hasElementWithId,
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

  it('should return hint with format when a format is given', () => {
    const expected: DiscoverUriHint = {
      key: 'wordpress:posts',
      label: 'Posts',
      format: 'atom',
    }

    expect(composeHint('wordpress:posts', 'atom')).toEqual(expected)
  })

  it('should not return format when no format is given', () => {
    expect(composeHint('youtube:all')).not.toHaveProperty('format')
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

describe('getCookieNames', () => {
  it('should return every cookie name from a joined Set-Cookie value', () => {
    const value = new Headers()
    value.append('set-cookie', 'a_saltkey=x; expires=Fri, 23-Oct-2026 06:37:31 GMT; path=/')
    value.append('set-cookie', 'a_lastvisit=1; path=/')
    const expected = ['a_saltkey', 'a_lastvisit']

    expect(getCookieNames(value)).toEqual(expected)
  })

  it('should not return cookie attributes', () => {
    const value = new Headers({ 'set-cookie': 'session=abc; Path=/; Domain=example.com' })

    expect(getCookieNames(value)).toEqual(['session'])
  })

  it('should return an empty array without Set-Cookie', () => {
    expect(getCookieNames(new Headers())).toEqual([])
  })
})

describe('hasAnyMeta', () => {
  const markers: Array<[string, string]> = [
    ['generator', 'pixelfed'],
    ['application-name', 'Pixelfed'],
  ]

  it('should return true when the first marker matches', () => {
    const value = '<meta name="generator" content="pixelfed">'

    expect(hasAnyMeta(value, markers)).toBe(true)
  })

  it('should return true when a later marker matches', () => {
    const value = '<meta name="application-name" content="Pixelfed">'

    expect(hasAnyMeta(value, markers)).toBe(true)
  })

  it('should return false when no marker matches', () => {
    const value = '<meta name="generator" content="WordPress 6.4">'

    expect(hasAnyMeta(value, markers)).toBe(false)
  })

  it('should return false for an empty marker list', () => {
    const value = '<meta name="generator" content="pixelfed">'

    expect(hasAnyMeta(value, [])).toBe(false)
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

  it('should match a name and value with regex metacharacters literally', () => {
    const value = '<meta name="og:site_name(beta)" content="C++ Blog">'

    expect(hasMetaContent(value, 'og:site_name(beta)', 'C++ Blog')).toBe(true)
  })

  it('should match single-quoted attribute values', () => {
    const value = "<meta name='generator' content='Mastodon v4.2.0'>"

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should match unquoted attribute values', () => {
    const value = '<meta name=generator content=Mastodon>'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should return false when the name is in a data attribute', () => {
    const value = `
      <meta
        data-name="generator"
        data-content="Mastodon"
      >
    `

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when the meta tag is in a comment', () => {
    const value = '<!-- <meta name="generator" content="Mastodon"> -->'

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })

  it('should return false when the meta tag is in a script string', () => {
    const value = `<script>const tag = '<meta name="generator" content="Mastodon">'</script>`

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(false)
  })
})

describe('getMetaContent', () => {
  it('should return the content of a meta tag by name', () => {
    const value = '<meta name="generator" content="Mastodon v4.2.0">'

    expect(getMetaContent(value, 'generator')).toBe('Mastodon v4.2.0')
  })

  it('should return the content of a meta tag by property', () => {
    const value = '<meta property="og:image" content="https://example.com/avatar.png">'

    expect(getMetaContent(value, 'og:image')).toBe('https://example.com/avatar.png')
  })

  it('should return the content when content comes before property', () => {
    const value = '<meta content="https://example.com/avatar.png" property="og:image">'

    expect(getMetaContent(value, 'og:image')).toBe('https://example.com/avatar.png')
  })

  it('should return the first matching meta tag', () => {
    const value = `
      <meta
        property="og:image"
        content="https://example.com/first.png"
      >
      <meta
        property="og:image"
        content="https://example.com/second.png"
      >
    `

    expect(getMetaContent(value, 'og:image')).toBe('https://example.com/first.png')
  })

  it('should keep an apostrophe inside a double-quoted value', () => {
    const value = `<meta property="og:title" content="Tom's blog">`

    expect(getMetaContent(value, 'og:title')).toBe("Tom's blog")
  })

  it('should keep a double quote inside a single-quoted value', () => {
    const value = `<meta property="og:title" content='Say "hi"'>`

    expect(getMetaContent(value, 'og:title')).toBe('Say "hi"')
  })

  it('should decode entities in the value', () => {
    const value = '<meta property="og:image" content="https://example.com/a.png?w=1&amp;h=2">'

    expect(getMetaContent(value, 'og:image')).toBe('https://example.com/a.png?w=1&h=2')
  })

  it('should ignore a data-content attribute after content', () => {
    const value = `
      <meta
        name="generator"
        content="Drupal"
        data-content="other"
      >
    `

    expect(getMetaContent(value, 'generator')).toBe('Drupal')
  })

  it('should return the content when attributes have whitespace around equals signs', () => {
    const value = '<meta name = "generator" content = "Drupal">'

    expect(getMetaContent(value, 'generator')).toBe('Drupal')
  })

  it('should return an empty string for an empty content attribute', () => {
    expect(getMetaContent('<meta name="generator" content="">', 'generator')).toBe('')
  })

  it('should return undefined when no meta tag matches', () => {
    const value = '<meta name="description" content="A blog">'

    expect(getMetaContent(value, 'generator')).toBeUndefined()
  })

  it('should return undefined when the meta tag is in a comment', () => {
    const value = '<!-- <meta name="generator" content="Drupal"> -->'

    expect(getMetaContent(value, 'generator')).toBeUndefined()
  })

  it('should read each page when called with different pages in turn', () => {
    const first = '<meta name="generator" content="Drupal">'
    const second = '<meta name="generator" content="Joomla">'

    expect(getMetaContent(first, 'generator')).toBe('Drupal')
    expect(getMetaContent(second, 'generator')).toBe('Joomla')
    expect(getMetaContent(first, 'generator')).toBe('Drupal')
  })
})

describe('findDescendant', () => {
  const value = '<div id="card"><span><img src="nested.png"></span></div><img src="outside.png">'

  it('should return a nested descendant that passes the test', () => {
    const card = findElement(value, (element) => element.attribs.id === 'card') as Element

    expect(findDescendant(card, (element) => element.name === 'img')).toMatchObject({
      attribs: { src: 'nested.png' },
    })
  })

  it('should return undefined when no descendant passes the test', () => {
    const card = findElement(value, (element) => element.attribs.id === 'card') as Element

    expect(findDescendant(card, (element) => element.name === 'a')).toBeUndefined()
  })
})

describe('findElement', () => {
  it('should return the first element passing the test', () => {
    const value = `
      <img src="https://example.com/first.png">
      <img src="https://example.com/second.png">
    `
    const element = findElement(value, (element) => element.name === 'img')

    expect(element).toMatchObject({
      attribs: {
        src: 'https://example.com/first.png',
      },
    })
  })

  it('should let the test read the parent element', () => {
    const value = `
      <img src="https://example.com/logo.png">
      <div class="avatar"><img src="https://example.com/avatar.png"></div>
    `
    const element = findElement(value, (element) => hasClass(element.parent, 'avatar'))

    expect(element).toMatchObject({
      attribs: {
        src: 'https://example.com/avatar.png',
      },
    })
  })

  it('should decode entities in attribute values', () => {
    const value = '<a href="https://example.com/?a=1&amp;b=2">Link</a>'
    const element = findElement(value, (element) => element.name === 'a')

    expect(element).toMatchObject({
      attribs: {
        href: 'https://example.com/?a=1&b=2',
      },
    })
  })

  it('should not match markup inside a comment', () => {
    const value = '<!-- <img src="https://example.com/avatar.png"> -->'

    expect(findElement(value, (element) => element.name === 'img')).toBeUndefined()
  })

  it('should not match markup inside script text', () => {
    const value = '<script>const html = \'<img src="https://example.com/avatar.png">\'</script>'

    expect(findElement(value, (element) => element.name === 'img')).toBeUndefined()
  })

  it('should return undefined for empty content', () => {
    expect(findElement('', () => true)).toBeUndefined()
  })

  it('should return undefined for undefined content', () => {
    expect(findElement(undefined, () => true)).toBeUndefined()
  })
})

describe('hasElementWithId', () => {
  it('should return true for an element with the id', () => {
    expect(hasElementWithId('<body id="phpbb"></body>', 'phpbb')).toBe(true)
  })

  it('should return true for a single-quoted id', () => {
    expect(hasElementWithId("<body id='phpbb'></body>", 'phpbb')).toBe(true)
  })

  it('should return false for an id with another value', () => {
    expect(hasElementWithId('<body id="phpbb-forum"></body>', 'phpbb')).toBe(false)
  })

  it('should return false for the id inside a comment', () => {
    expect(hasElementWithId('<!-- <body id="phpbb"> -->', 'phpbb')).toBe(false)
  })
})

describe('hasClass', () => {
  it('should return true for a class among others', () => {
    const element = findElement('<img class="image avatar is-96x96">', () => true)

    expect(hasClass(element, 'avatar')).toBe(true)
  })

  it('should return true for a class in another case', () => {
    const element = findElement('<div class="Lemmy-Site">', () => true)

    expect(hasClass(element, 'lemmy-site')).toBe(true)
  })

  it('should return false for a class that only starts with the name', () => {
    const element = findElement('<img class="avatar-placeholder">', () => true)

    expect(hasClass(element, 'avatar')).toBe(false)
  })

  it('should return false for an element without a class', () => {
    const element = findElement('<img>', () => true)

    expect(hasClass(element, 'avatar')).toBe(false)
  })

  it('should return false for the document as parent', () => {
    const element = findElement('<img class="avatar">', () => true)

    expect(hasClass(element?.parent, 'avatar')).toBe(false)
  })

  it('should return false for null', () => {
    expect(hasClass(null, 'avatar')).toBe(false)
  })
})

describe('getScriptText', () => {
  it('should return the text of the script with the id', () => {
    const value = `
      <script
        id="__INITIAL_STATE__"
        type="application/json"
      >{"user":"alice"}</script>
    `

    expect(getScriptText(value, '__INITIAL_STATE__')).toBe('{"user":"alice"}')
  })

  it('should return an empty string for an empty script', () => {
    expect(getScriptText('<script id="state"></script>', 'state')).toBe('')
  })

  it('should return undefined for a non-script element with the id', () => {
    expect(getScriptText('<div id="state">{}</div>', 'state')).toBeUndefined()
  })

  it('should return undefined without a script with the id', () => {
    expect(getScriptText('<script id="other">{}</script>', 'state')).toBeUndefined()
  })
})

describe('getJsonLd', () => {
  it('should return every parsed JSON-LD block', () => {
    const value = `
      <script type="application/ld+json">{"@type":"Person"}</script>
      <script type="application/ld+json">[{"@type":"WebSite"}]</script>
    `
    const expected: Array<unknown> = [{ '@type': 'Person' }, [{ '@type': 'WebSite' }]]

    expect(getJsonLd(value)).toEqual(expected)
  })

  it('should read a block with other attributes in any order', () => {
    const value = `
      <script
        data-rh="true"
        type="application/ld+json"
      >{"@type":"Person"}</script>
    `
    const expected: Array<unknown> = [{ '@type': 'Person' }]

    expect(getJsonLd(value)).toEqual(expected)
  })

  it('should read a block whose JSON contains a less-than sign', () => {
    const value = '<script type="application/ld+json">{"name":"A <3 B"}</script>'
    const expected: Array<unknown> = [{ name: 'A <3 B' }]

    expect(getJsonLd(value)).toEqual(expected)
  })

  it('should skip a block with invalid JSON', () => {
    const value = `
      <script type="application/ld+json">{invalid</script>
      <script type="application/ld+json">{"@type":"Person"}</script>
    `
    const expected: Array<unknown> = [{ '@type': 'Person' }]

    expect(getJsonLd(value)).toEqual(expected)
  })

  it('should skip scripts of another type', () => {
    const value = '<script type="application/json">{"@type":"Person"}</script>'

    expect(getJsonLd(value)).toEqual([])
  })

  it('should return empty array for empty content', () => {
    expect(getJsonLd('')).toEqual([])
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
