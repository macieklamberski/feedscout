import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type AtyponUrl, atyponHandler, parseAtyponUrl } from './atypon.js'

describe('parseAtyponUrl', () => {
  it('should return the journal for a table of contents page', () => {
    const expected: AtyponUrl = { kind: 'journal', code: 'rjhr20', isWiley: false }

    expect(parseAtyponUrl('https://www.tandfonline.com/toc/rjhr20/current')).toEqual(expected)
  })

  it('should return the journal on Wiley', () => {
    const expected: AtyponUrl = { kind: 'journal', code: '15214095', isWiley: true }

    expect(parseAtyponUrl('https://onlinelibrary.wiley.com/journal/15214095')).toEqual(expected)
  })

  it('should return undefined for a page outside a journal', () => {
    expect(parseAtyponUrl('https://www.science.org/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAtyponUrl('https://example.com/toc/rjhr20/current')).toBeUndefined()
  })
})

describe('atyponHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://dl.acm.org/toc/tog/current'],
      [true, 'https://www.science.org/journal/science'],
      [true, 'https://www.tandfonline.com/loi/tprs20'],
      [true, 'https://onlinelibrary.wiley.com/toc/15406261/2025/80/1'],
      [true, 'https://www.nejm.org/TOC/evid/current'],
      [true, 'https://www.tandfonline.com/journals/tprs20'],
      [true, 'https://journals.sagepub.com/home/asr'],
      [false, 'https://dl.acm.org/doi/10.1145/3592433'],
      [false, 'https://dl.acm.org/toc/'],
      [false, 'https://dl.acm.org/journals'],
      [false, 'https://www.science.org'],
      [false, 'https://example.com/toc/tog/current'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(atyponHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(atyponHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(atyponHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return journal feed for journal page', () => {
      const value = 'https://www.tandfonline.com/toc/tprs20/current'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.tandfonline.com/action/showFeed?feed=rss&jc=tprs20&type=etoc',
          hint: { key: 'atypon:journal', label: 'Journal', format: 'rdf' },
        },
        {
          uri: 'https://www.tandfonline.com/action/showFeed?feed=rss&jc=tprs20&type=axatoc',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print', format: 'rdf' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should return journal and most cited feeds for Wiley journal page', () => {
      const value = 'https://onlinelibrary.wiley.com/journal/15406261'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://onlinelibrary.wiley.com/action/showFeed?feed=rss&jc=15406261&type=etoc',
          hint: { key: 'atypon:journal', label: 'Journal', format: 'rss' },
        },
        {
          uri: 'https://onlinelibrary.wiley.com/action/showFeed?feed=rss&jc=15406261&type=axatoc',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print', format: 'rdf' },
        },
        {
          uri: 'https://onlinelibrary.wiley.com/feed/15406261/most-cited',
          hint: { key: 'atypon:most-cited', label: 'Most cited', format: 'rss' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should return https journal feeds for an http Wiley journal page', () => {
      const value = 'http://onlinelibrary.wiley.com/journal/15406261'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://onlinelibrary.wiley.com/action/showFeed?feed=rss&jc=15406261&type=etoc',
          hint: { key: 'atypon:journal', label: 'Journal', format: 'rss' },
        },
        {
          uri: 'http://onlinelibrary.wiley.com/action/showFeed?feed=rss&jc=15406261&type=axatoc',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print', format: 'rdf' },
        },
        {
          uri: 'https://onlinelibrary.wiley.com/feed/15406261/most-cited',
          hint: { key: 'atypon:most-cited', label: 'Most cited', format: 'rss' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http journal page', () => {
      const value = 'http://www.tandfonline.com/toc/tprs20/current'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.tandfonline.com/action/showFeed?feed=rss&jc=tprs20&type=etoc',
          hint: { key: 'atypon:journal', label: 'Journal', format: 'rdf' },
        },
        {
          uri: 'http://www.tandfonline.com/action/showFeed?feed=rss&jc=tprs20&type=axatoc',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print', format: 'rdf' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for URL without journal code', () => {
      const value = 'https://dl.acm.org/doi/10.1145/3290605.3300233'

      expect(atyponHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the journal hint for the most recent feed on Wiley', () => {
      const value = 'https://onlinelibrary.wiley.com/feed/16136829/most-recent'
      const expected: DiscoverUriHint = {
        key: 'atypon:journal',
        label: 'Journal',
        format: 'rss',
      }

      expect(atyponHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return the short journal feed on Taylor & Francis as itself', async () => {
      const value = 'https://www.tandfonline.com/feed/rss/uann20'
      const options = {
        ...defaultPlatformOptions,
        handlers: [atyponHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: {
            key: 'atypon:journal',
            label: 'Journal',
            format: 'rdf',
          },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
