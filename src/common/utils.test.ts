import { describe, expect, it } from 'bun:test'
import {
  anyWordMatchesAnyOf,
  composeHint,
  endsWithAnyOf,
  hasMetaContent,
  includesAnyOf,
  isAnyOf,
  isHostOf,
  isObject,
  isOfAllowedMimeType,
  isSubdomainOf,
  matchesAnyOfLinkSelectors,
  normalizeMimeType,
  omitEmpty,
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

describe('isSubdomainOf', () => {
  it('should return true for subdomain of domain', () => {
    const value = 'https://example.blogspot.com'

    expect(isSubdomainOf(value, 'blogspot.com')).toBe(true)
  })

  it('should return true for nested subdomain', () => {
    const value = 'https://blog.example.blogspot.com'

    expect(isSubdomainOf(value, 'blogspot.com')).toBe(true)
  })

  it('should return false for exact domain match', () => {
    const value = 'https://blogspot.com'

    expect(isSubdomainOf(value, 'blogspot.com')).toBe(false)
  })

  it('should return false for unrelated domain', () => {
    const value = 'https://example.com'

    expect(isSubdomainOf(value, 'blogspot.com')).toBe(false)
  })

  it('should handle case-insensitive matching', () => {
    const value = 'https://EXAMPLE.BLOGSPOT.COM'

    expect(isSubdomainOf(value, 'blogspot.com')).toBe(true)
  })

  it('should return false for partial domain match', () => {
    const value = 'https://fakeblogspot.com'

    expect(isSubdomainOf(value, 'blogspot.com')).toBe(false)
  })

  it('should return true when matching any domain in array', () => {
    const value = 'https://example.wordpress.com'

    expect(isSubdomainOf(value, ['blogspot.com', 'wordpress.com'])).toBe(true)
  })

  it('should return false when matching no domain in array', () => {
    const value = 'https://example.tumblr.com'

    expect(isSubdomainOf(value, ['blogspot.com', 'wordpress.com'])).toBe(false)
  })

  it('should return false for invalid URL', () => {
    expect(isSubdomainOf('not-a-url', 'blogspot.com')).toBe(false)
  })
})

describe('isHostOf', () => {
  it('should return true when hostname matches one of hosts', () => {
    const value = 'https://github.com/owner/repo'

    expect(isHostOf(value, ['github.com', 'www.github.com'])).toBe(true)
  })

  it('should return true for www subdomain match', () => {
    const value = 'https://www.github.com/owner/repo'

    expect(isHostOf(value, ['github.com', 'www.github.com'])).toBe(true)
  })

  it('should return false when hostname does not match any host', () => {
    const value = 'https://gitlab.com/owner/repo'

    expect(isHostOf(value, ['github.com', 'www.github.com'])).toBe(false)
  })

  it('should handle case-insensitive matching', () => {
    const value = 'https://GITHUB.COM/owner/repo'

    expect(isHostOf(value, ['github.com'])).toBe(true)
  })

  it('should return false for empty hosts array', () => {
    const value = 'https://github.com/owner/repo'

    expect(isHostOf(value, [])).toBe(false)
  })

  it('should return false for subdomain when only root domain in hosts', () => {
    const value = 'https://api.github.com/users'

    expect(isHostOf(value, ['github.com'])).toBe(false)
  })

  it('should return true for string argument', () => {
    const value = 'https://github.com/owner/repo'

    expect(isHostOf(value, 'github.com')).toBe(true)
  })

  it('should return false for non-matching string argument', () => {
    const value = 'https://gitlab.com/owner/repo'

    expect(isHostOf(value, 'github.com')).toBe(false)
  })

  it('should return false for invalid URL', () => {
    expect(isHostOf('not-a-url', ['github.com'])).toBe(false)
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

  it('should return false when pattern is empty string', () => {
    expect(includesAnyOf('anything', [''])).toBe(false)
  })

  it('should return true when value matches a RegExp pattern', () => {
    const value = '/rss/now.xml'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/\/rss\//]

    expect(includesAnyOf(value, patterns)).toBe(true)
  })

  it('should return false when value does not match a RegExp pattern', () => {
    const value = '/blog/post.html'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/\/rss\//]

    expect(includesAnyOf(value, patterns)).toBe(false)
  })

  it('should handle mixed string and RegExp patterns', () => {
    const value = '/rss/now.xml'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = ['atom', /\/rss\//]

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

  it('should return true when value matches a RegExp pattern', () => {
    const value = 'application/rss+xml'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/^application\/rss/]

    expect(isAnyOf(value, patterns)).toBe(true)
  })

  it('should return false when value does not match a RegExp pattern', () => {
    const value = 'text/html'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/^application\/rss/]

    expect(isAnyOf(value, patterns)).toBe(false)
  })
})

describe('omitEmpty', () => {
  it('should remove undefined values', () => {
    const value = ['a', undefined, 'b']
    const expected = ['a', 'b']

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should remove null values', () => {
    const value = ['a', null, 'b']
    const expected = ['a', 'b']

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should remove empty strings', () => {
    const value = ['a', '', 'b']
    const expected = ['a', 'b']

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should remove mixed empty values', () => {
    const value = [undefined, 'a', null, '', 'b', undefined]
    const expected = ['a', 'b']

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should return empty array when all values are empty', () => {
    const value = [undefined, null, '']
    const expected: Array<string> = []

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should return empty array for empty input', () => {
    const value: Array<string | undefined> = []
    const expected: Array<string> = []

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should preserve all values when none are empty', () => {
    const value = ['a', 'b', 'c']
    const expected = ['a', 'b', 'c']

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should work with number arrays', () => {
    const value = [1, undefined, 0, null, 3]
    const expected = [1, 0, 3]

    expect(omitEmpty(value)).toEqual(expected)
  })

  it('should preserve order of remaining values', () => {
    const value = ['c', undefined, 'a', null, 'b']
    const expected = ['c', 'a', 'b']

    expect(omitEmpty(value)).toEqual(expected)
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

  it('should match rel with leading and trailing whitespace', () => {
    const rel = '  alternate  '
    const type = 'application/rss+xml'
    const selectors = [{ rel: 'alternate', types: ['application/rss+xml'] }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should match rel words separated by tabs and newlines', () => {
    const rel = 'alternate\t\nfeed'
    const type = undefined
    const selectors = [{ rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should trim whitespace around selector rel', () => {
    const rel = 'feed'
    const type = undefined
    const selectors = [{ rel: '  feed  ' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
  })

  it('should return false for empty rel', () => {
    const rel = ''
    const type = undefined
    const selectors = [{ rel: 'feed' }]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(false)
  })

  it('should check types of every selector whose rel matches', () => {
    const rel = 'alternate feed'
    const type = 'application/rss+xml'
    const selectors = [
      { rel: 'alternate', types: ['text/html'] },
      { rel: 'feed', types: ['application/rss+xml'] },
    ]

    expect(matchesAnyOfLinkSelectors(rel, type, selectors)).toBe(true)
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

  it('should return true when a word matches a RegExp pattern', () => {
    const value = 'alternate feed'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/^feed$/]

    expect(anyWordMatchesAnyOf(value, patterns)).toBe(true)
  })

  it('should return false when no word matches a RegExp pattern', () => {
    const value = 'alternate stylesheet'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/^feed$/]

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

  it('should return false when pattern is empty string', () => {
    expect(endsWithAnyOf('anything', [''])).toBe(false)
  })

  it('should return true when value matches a RegExp pattern', () => {
    const value = '/rss/now.xml'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/\/rss\//]

    expect(endsWithAnyOf(value, patterns)).toBe(true)
  })

  it('should return false when value does not match a RegExp pattern', () => {
    const value = '/blog/post.html'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = [/\/rss\//]

    expect(endsWithAnyOf(value, patterns)).toBe(false)
  })

  it('should handle mixed string and RegExp patterns', () => {
    const value = '/rss/now.xml'
    // biome-ignore lint/performance/useTopLevelRegex: Test-specific pattern.
    const patterns = ['.html', /\/rss\//]

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

    expect(
      processed.sort((a, b) => {
        return a - b
      }),
    ).toEqual([1, 2, 4, 5])
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

  // TODO: Should handle concurrency=0 — causes infinite loop, items never process.

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

  it('should return true when attributes use single quotes', () => {
    const value = "<meta name='generator' content='Mastodon v4.2.0'>"

    expect(hasMetaContent(value, 'generator', 'Mastodon')).toBe(true)
  })

  it('should escape regex special characters in name and value', () => {
    const value = '<meta name="a.b*c" content="x$y (1+2)">'

    expect(hasMetaContent(value, 'a.b*c', 'x$y (1+2)')).toBe(true)
    expect(hasMetaContent(value, 'aXbXc', 'x$y (1+2)')).toBe(false)
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

describe('isObject', () => {
  it('should return true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ url: 'https://example.com' })).toBe(true)
  })

  it('should return false for null', () => {
    expect(isObject(null)).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isObject([])).toBe(false)
    expect(isObject(['https://example.com'])).toBe(false)
  })

  it('should return false for primitives', () => {
    expect(isObject('https://example.com')).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject(undefined)).toBe(false)
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
