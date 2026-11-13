import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseSyosetuUrl, type SyosetuUrl, syosetuHandler } from './syosetu.js'

const authorHint: DiscoverUriHint = { key: 'syosetu:author', label: 'Author' }
const activityHint: DiscoverUriHint = { key: 'syosetu:activity', label: 'Activity' }
const allNovelsHint: DiscoverUriHint = { key: 'syosetu:all-novels', label: 'All novels' }
const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://api.syosetu.com/writernovel/12345.Atom', authorHint],
  ['http://api.syosetu.com/writernovel/12345.atom', authorHint],
  ['https://api.syosetu.com/writer/12345.Atom', activityHint],
  ['https://api.syosetu.com/writer/12345.Atom/', activityHint],
  ['https://api.syosetu.com/allnovel.Atom', allNovelsHint],
  ['http://api.syosetu.com/allnovel.atom', allNovelsHint],
]

describe('parseSyosetuUrl', () => {
  it('should return the writer for a writer page', () => {
    const expected: SyosetuUrl = { kind: 'writer', writerId: '12345' }

    expect(parseSyosetuUrl('https://mypage.syosetu.com/12345/')).toEqual(expected)
  })

  it('should return a one-digit writer id whole', () => {
    const expected: SyosetuUrl = { kind: 'writer', writerId: '1' }

    expect(parseSyosetuUrl('https://mypage.syosetu.com/1/')).toEqual(expected)
  })

  it('should return undefined for a writer id with a letter', () => {
    expect(parseSyosetuUrl('https://mypage.syosetu.com/372556abc/')).toBeUndefined()
  })

  it('should return undefined for a page without a writer id', () => {
    expect(parseSyosetuUrl('https://mypage.syosetu.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSyosetuUrl('https://example.com/12345/')).toBeUndefined()
  })
})

describe('syosetuHandler', () => {
  describe('match', () => {
    it('should match an author page', () => {
      expect(syosetuHandler.match('https://mypage.syosetu.com/372556/')).toBe(true)
    })

    it('should not match a novel page', () => {
      expect(syosetuHandler.match('https://ncode.syosetu.com/n4830bu/')).toBe(false)
    })

    it('should not match an author host without an id', () => {
      expect(syosetuHandler.match('https://mypage.syosetu.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(syosetuHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Syosetu', () => {
      expect(syosetuHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the author and activity feeds', () => {
      const value = 'https://mypage.syosetu.com/372556/'
      const expected = [
        {
          uri: 'https://api.syosetu.com/writernovel/372556.Atom',
          hint: { key: 'syosetu:author', label: 'Author' },
        },
        {
          uri: 'https://api.syosetu.com/writer/372556.Atom',
          hint: { key: 'syosetu:activity', label: 'Activity' },
        },
      ]

      expect(syosetuHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array without an author id', () => {
      expect(syosetuHandler.resolve('https://mypage.syosetu.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the author hint for an author feed', () => {
      const value = 'https://api.syosetu.com/writernovel/12345.Atom'
      const expected: DiscoverUriHint = { key: 'syosetu:author', label: 'Author' }

      expect(syosetuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for an activity feed', () => {
      const value = 'https://api.syosetu.com/writer/12345.Atom'
      const expected: DiscoverUriHint = { key: 'syosetu:activity', label: 'Activity' }

      expect(syosetuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the author hint for a lowercase author feed over http', () => {
      const value = 'http://api.syosetu.com/writernovel/12345.atom'
      const expected: DiscoverUriHint = { key: 'syosetu:author', label: 'Author' }

      expect(syosetuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for an activity feed with a trailing slash', () => {
      const value = 'https://api.syosetu.com/writer/12345.Atom/'
      const expected: DiscoverUriHint = { key: 'syosetu:activity', label: 'Activity' }

      expect(syosetuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the all novels hint for the all novels feed', () => {
      const value = 'https://api.syosetu.com/allnovel.Atom'
      const expected: DiscoverUriHint = { key: 'syosetu:all-novels', label: 'All novels' }

      expect(syosetuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a word in place of the writer id', () => {
      const value = 'https://api.syosetu.com/writernovel/alice.Atom'

      expect(syosetuHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed without the format suffix', () => {
      const value = 'https://api.syosetu.com/writernovel/12345'

      expect(syosetuHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a writer page', () => {
      const value = 'https://mypage.syosetu.com/12345/'

      expect(syosetuHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/writernovel/12345.Atom'

      expect(syosetuHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [syosetuHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
