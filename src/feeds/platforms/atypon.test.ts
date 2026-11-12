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
      const expected = [
        {
          uri: 'https://www.tandfonline.com/action/showFeed?type=etoc&feed=rss&jc=tprs20',
          hint: { key: 'atypon:journal', label: 'Journal' },
        },
        {
          uri: 'https://www.tandfonline.com/action/showFeed?type=axatoc&feed=rss&jc=tprs20',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should return journal and most cited feeds for Wiley journal page', () => {
      const value = 'https://onlinelibrary.wiley.com/journal/15406261'
      const expected = [
        {
          uri: 'https://onlinelibrary.wiley.com/action/showFeed?type=etoc&feed=rss&jc=15406261',
          hint: { key: 'atypon:journal', label: 'Journal' },
        },
        {
          uri: 'https://onlinelibrary.wiley.com/action/showFeed?type=axatoc&feed=rss&jc=15406261',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print' },
        },
        {
          uri: 'https://onlinelibrary.wiley.com/feed/15406261/most-cited',
          hint: { key: 'atypon:most-cited', label: 'Most cited' },
        },
      ]

      expect(atyponHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http journal page', () => {
      const value = 'http://www.tandfonline.com/toc/tprs20/current'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.tandfonline.com/action/showFeed?type=etoc&feed=rss&jc=tprs20',
          hint: { key: 'atypon:journal', label: 'Journal' },
        },
        {
          uri: 'http://www.tandfonline.com/action/showFeed?type=axatoc&feed=rss&jc=tprs20',
          hint: { key: 'atypon:ahead-of-print', label: 'Ahead of print' },
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
    const values: Array<[string, DiscoverUriHint]> = [
      [
        'https://www.tandfonline.com/action/showFeed?type=etoc&feed=rss&jc=rdis20',
        { key: 'atypon:journal', label: 'Journal' },
      ],
      [
        'https://onlinelibrary.wiley.com/action/showFeed?type=etoc&feed=rss&jc=14429993',
        { key: 'atypon:journal', label: 'Journal' },
      ],
      [
        'https://www.tandfonline.com/action/showFeed?ai=2a7&feed=rss&jc=pcem20&mi=3dg6fv&type=etoc&ui=0',
        { key: 'atypon:journal', label: 'Journal' },
      ],
      [
        'https://www.science.org/action/showFeed/feed?jc=science&type=etoc',
        { key: 'atypon:journal', label: 'Journal' },
      ],
      ['https://www.tandfonline.com/feed/rss/uann20', { key: 'atypon:journal', label: 'Journal' }],
      [
        'https://onlinelibrary.wiley.com/feed/16136829/most-recent',
        { key: 'atypon:journal', label: 'Journal' },
      ],
      [
        'https://onlinelibrary.wiley.com/feed/14429993/most-cited',
        { key: 'atypon:most-cited', label: 'Most cited' },
      ],
      [
        'https://onlinelibrary.wiley.com/action/showMostCitedArticlesFeed?journalCode=14429993',
        { key: 'atypon:most-cited', label: 'Most cited' },
      ],
      [
        'https://www.science.org/action/showFeed?feed=rss&jc=example&type=axatoc',
        { key: 'atypon:ahead-of-print', label: 'Ahead of print' },
      ],
      [
        'https://www.science.org/action/showFeed/feed?jc=example&type=axatoc',
        { key: 'atypon:ahead-of-print', label: 'Ahead of print' },
      ],
      [
        'https://dl.acm.org/action/showFeed?feed=rss&mi=abc123&query=%2526AllField%253Dexample&type=search&ui=0',
        { key: 'atypon:search', label: 'Saved search' },
      ],
      [
        'https://dl.acm.org/action/showFeed/feed?mi=abc123&query=%2526AllField%253Dexample&type=search&ui=0',
        { key: 'atypon:search', label: 'Saved search' },
      ],
      [
        'https://epubs.siam.org/action/showFeed?tagCode=topic-example&taxonomyCode=topics&type=searchTopic',
        { key: 'atypon:topic', label: 'Topic' },
      ],
    ]

    it.each(values)('should read the hint of %s', (value, expected) => {
      expect(atyponHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a journal page', () => {
      const value = 'https://www.tandfonline.com/toc/rdis20/current'

      expect(atyponHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a most cited feed outside Wiley', () => {
      const value = 'https://www.tandfonline.com/feed/rdis20/most-cited'

      expect(atyponHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a journal feed on another host', () => {
      const value = 'https://example.com/action/showFeed?type=etoc&feed=rss&jc=rdis20'

      expect(atyponHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const journal: DiscoverUriHint = { key: 'atypon:journal', label: 'Journal' }
    const mostCited: DiscoverUriHint = { key: 'atypon:most-cited', label: 'Most cited' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://www.tandfonline.com/action/showFeed?type=etoc&feed=rss&jc=rdis20', journal],
      ['https://www.science.org/action/showFeed/feed?jc=science&type=etoc', journal],
      ['https://www.tandfonline.com/feed/rss/uann20', journal],
      ['https://onlinelibrary.wiley.com/feed/16136829/most-recent', journal],
      ['https://onlinelibrary.wiley.com/feed/14429993/most-cited', mostCited],
      [
        'https://onlinelibrary.wiley.com/action/showMostCitedArticlesFeed?journalCode=14429993',
        mostCited,
      ],
      [
        'http://www.science.org/action/showFeed?feed=rss&jc=example&type=axatoc',
        { key: 'atypon:ahead-of-print', label: 'Ahead of print' },
      ],
      [
        'https://dl.acm.org/action/showFeed?feed=rss&mi=abc123&query=%2526AllField%253Dexample&type=search&ui=0',
        { key: 'atypon:search', label: 'Saved search' },
      ],
      [
        'https://epubs.siam.org/action/showFeed?tagCode=topic-example&taxonomyCode=topics&type=searchTopic',
        { key: 'atypon:topic', label: 'Topic' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [atyponHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
