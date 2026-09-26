import { describe, expect, it } from 'bun:test'
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

  it('should return undefined for an excluded path', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com/journal')).toBeUndefined()
    expect(parseLetterboxdUrl('https://letterboxd.com/films')).toBeUndefined()
    expect(parseLetterboxdUrl('https://letterboxd.com/settings/')).toBeUndefined()
    expect(parseLetterboxdUrl('https://letterboxd.com/sign-in/')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com/Films')).toBeUndefined()
  })

  it('should return undefined for a film page', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com/film/barbie/')).toBeUndefined()
  })

  it('should return undefined for a filmography page', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com/director/greta-gerwig/')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseLetterboxdUrl('https://letterboxd.com')).toBeUndefined()
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

    it('should return empty array for a page without a feed', () => {
      expect(letterboxdHandler.resolve('https://letterboxd.com/films/')).toEqual([])
    })
  })
})
