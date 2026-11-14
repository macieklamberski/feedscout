import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { LetterboxdUrl } from './letterboxd.js'
import { letterboxdHandler, parseLetterboxdUrl } from './letterboxd.js'

describe('parseLetterboxdUrl', () => {
  it('should return the member for a profile page', () => {
    const expected: LetterboxdUrl = { kind: 'member', username: 'dave' }

    expect(parseLetterboxdUrl('https://letterboxd.com/dave')).toEqual(expected)
  })

  it('should return the member for a films page', () => {
    const expected: LetterboxdUrl = { kind: 'member', username: 'dave' }

    expect(parseLetterboxdUrl('https://letterboxd.com/dave/films/')).toEqual(expected)
  })

  it('should return the member for a diary page', () => {
    const expected: LetterboxdUrl = { kind: 'member', username: 'dave' }

    expect(parseLetterboxdUrl('https://letterboxd.com/dave/films/diary/')).toEqual(expected)
  })

  it('should return the member for a list page', () => {
    const value = 'https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/'
    const expected: LetterboxdUrl = { kind: 'member', username: 'dave' }

    expect(parseLetterboxdUrl(value)).toEqual(expected)
  })

  it('should return the member for the www host', () => {
    const expected: LetterboxdUrl = { kind: 'member', username: 'dave' }

    expect(parseLetterboxdUrl('https://www.letterboxd.com/dave')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: LetterboxdUrl = { kind: 'member', username: 'Dave' }

    expect(parseLetterboxdUrl('https://letterboxd.com/Dave')).toEqual(expected)
  })

  it('should return the journal for a journal page', () => {
    const expected: LetterboxdUrl = { kind: 'journal' }

    expect(parseLetterboxdUrl('https://letterboxd.com/journal/')).toEqual(expected)
  })

  it('should return undefined for the homepage', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseLetterboxdUrl('https://example.com/letterboxd')).toBeUndefined()
    expect(parseLetterboxdUrl('https://example.org/letterboxd')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLetterboxdUrl('not-a-url')).toBeUndefined()
  })
})

describe('letterboxdHandler', () => {
  describe('match', () => {
    it('should match a Letterboxd URL', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/dave')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(letterboxdHandler.match('https://example.com/letterboxd')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed for user profile', () => {
      const value = 'https://letterboxd.com/dave'
      const expected = [
        {
          uri: 'https://letterboxd.com/dave/rss/',
          hint: { key: 'letterboxd:diary', label: 'Diary' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return Journal feed for /journal', () => {
      const value = 'https://letterboxd.com/journal'
      const expected = [
        {
          uri: 'https://letterboxd.com/journal/rss/',
          hint: { key: 'letterboxd:journal', label: 'Journal' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return Journal feed for /journal with a capitalized journal segment', () => {
      const value = 'https://letterboxd.com/Journal'
      const expected = [
        {
          uri: 'https://letterboxd.com/journal/rss/',
          hint: { key: 'letterboxd:journal', label: 'Journal' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return Journal feed for a journal article', () => {
      const value = 'https://letterboxd.com/journal/the-best-films-of-the-year'
      const expected = [
        {
          uri: 'https://letterboxd.com/journal/rss/',
          hint: { key: 'letterboxd:journal', label: 'Journal' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the homepage', () => {
      const value = 'https://letterboxd.com/'
      const expected: Array<DiscoverUriEntry> = []

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the diary hint for a member feed', () => {
      const value = 'https://letterboxd.com/alice/rss/'
      const expected: DiscoverUriHint = { key: 'letterboxd:diary', label: 'Diary' }

      expect(letterboxdHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the diary hint for a member feed on the embed host', () => {
      const value = 'https://embed.letterboxd.com/alice/rss/'
      const expected: DiscoverUriHint = { key: 'letterboxd:diary', label: 'Diary' }

      expect(letterboxdHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the journal hint for the journal feed', () => {
      const value = 'https://letterboxd.com/journal/rss/'
      const expected: DiscoverUriHint = { key: 'letterboxd:journal', label: 'Journal' }

      expect(letterboxdHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a member page', () => {
      const value = 'https://letterboxd.com/alice/'

      expect(letterboxdHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a member feed on another host', () => {
      const value = 'https://example.com/alice/rss/'

      expect(letterboxdHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const diaryHint: DiscoverUriHint = {
    key: 'letterboxd:diary',
    label: 'Diary',
  }
  const journalHint: DiscoverUriHint = {
    key: 'letterboxd:journal',
    label: 'Journal',
  }
  const feedUrls: Array<[string, DiscoverUriHint]> = [
    ['https://letterboxd.com/alice/rss/', diaryHint],
    ['http://letterboxd.com/alice/rss/', diaryHint],
    ['https://www.letterboxd.com/alice/rss', diaryHint],
    ['https://embed.letterboxd.com/alice/rss/', diaryHint],
    ['https://letterboxd.com/journal/rss/', journalHint],
    ['http://www.letterboxd.com/journal/rss', journalHint],
  ]

  it.each(feedUrls)('should return the feed URL as given for %s', async (value, hint) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [letterboxdHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
