import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isXenforoHtml, xenforoHandler } from './xenforo.js'

const xenforoHtml = '<html id="XF" lang="en-US" data-xf="2.3" data-app="public">'
const legacyHtml = '<html id="XenForo" lang="en-US">'
const otherHtml = '<html lang="en"><body id="phpbb">'

describe('isXenforoHtml', () => {
  it('should return true for the XenForo 2 app root', () => {
    expect(isXenforoHtml(xenforoHtml)).toBe(true)
  })

  it('should return true for the XenForo 1 app root', () => {
    expect(isXenforoHtml(legacyHtml)).toBe(true)
  })

  it('should return true for a single-quoted app root id', () => {
    expect(isXenforoHtml("<html id='XF'>")).toBe(true)
  })

  it('should return false for another forum platform', () => {
    expect(isXenforoHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isXenforoHtml('')).toBe(false)
  })
})

describe('xenforoHandler', () => {
  describe('match', () => {
    it('should match a forum page', () => {
      expect(xenforoHandler.match('https://example.com/f/general.17/', xenforoHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(xenforoHandler.match('https://example.com/f/general.17/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(xenforoHandler.match('not-a-url', xenforoHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the forum feed for a capitalized f segment', () => {
      const value = 'https://example.com/F/general.17/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/f/general.17/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.com/f/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum and site feeds for a forum path', () => {
      const value = 'https://example.com/f/general.17/'
      const expected = [
        {
          uri: 'https://example.com/f/general.17/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        { uri: 'https://example.com/f/-/index.rss', hint: { key: 'xenforo:site', label: 'Site' } },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum and site feeds for a forum on the default route', () => {
      const value = 'https://example.com/forums/general.17/'
      const expected = [
        {
          uri: 'https://example.com/forums/general.17/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.com/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the site feed on a thread page', () => {
      const value = 'https://example.com/threads/a-thread.123/'
      const expected = [
        {
          uri: 'https://example.com/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
        { uri: 'https://example.com/f/-/index.rss', hint: { key: 'xenforo:site', label: 'Site' } },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })
  })
})
