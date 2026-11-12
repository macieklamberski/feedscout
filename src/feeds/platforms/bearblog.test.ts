import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type BearblogUrl, bearblogHandler, parseBearblogUrl } from './bearblog.js'

describe('parseBearblogUrl', () => {
  it('should return the discover page for the apex host', () => {
    const expected: BearblogUrl = { kind: 'discover' }

    expect(parseBearblogUrl('https://bearblog.dev/')).toEqual(expected)
  })

  it('should return the blog for a subdomain', () => {
    const expected: BearblogUrl = {
      kind: 'blog',
      blog: 'herman',
      tag: undefined,
    }

    expect(parseBearblogUrl('https://herman.bearblog.dev/')).toEqual(expected)
  })

  it('should return the blog with its tag for a tag filter', () => {
    const expected: BearblogUrl = {
      kind: 'blog',
      blog: 'herman',
      tag: 'python',
    }

    expect(parseBearblogUrl('https://herman.bearblog.dev/blog/?q=python')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseBearblogUrl('https://example.com/')).toBeUndefined()
  })
})

describe('bearblogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.bearblog.dev'],
      [false, 'https://blog.example.bearblog.dev'],
      [false, 'https://www.alice.bearblog.dev'],
      [true, 'https://bearblog.dev'],
      [true, 'https://www.bearblog.dev'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(bearblogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(bearblogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(bearblogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return Atom and RSS feeds for blog', () => {
      const value = 'https://alice.bearblog.dev'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http blog page', () => {
      const value = 'http://alice.bearblog.dev/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.bearblog.dev/some-article-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return apex discover feeds for bearblog.dev', () => {
      const value = 'https://bearblog.dev/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bearblog.dev/discover/feed/',
          hint: { key: 'bearblog:discover', label: 'Trending', format: 'atom' },
        },
        {
          uri: 'https://bearblog.dev/discover/feed/?type=rss',
          hint: { key: 'bearblog:discover', label: 'Trending', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered and main feeds when q query param is set', () => {
      const value = 'https://alice.bearblog.dev/blog/?q=tips'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/?q=tips',
          hint: { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss&q=tips',
          hint: { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedHints: Array<[string, DiscoverUriHint]> = [
      [
        'https://bearblog.dev/discover/feed/',
        { key: 'bearblog:discover', label: 'Trending', format: 'atom' },
      ],
      [
        'https://bearblog.dev/discover/feed/?type=rss',
        { key: 'bearblog:discover', label: 'Trending', format: 'rss' },
      ],
      [
        'https://bearblog.dev/discover/feed/?newest=True',
        { key: 'bearblog:discover', label: 'Trending', format: 'atom' },
      ],
      [
        'https://tiramisu.bearblog.dev/feed/?q=psychology',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://tiramisu.bearblog.dev/feed/?type=rss&q=psychology',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://reedybear.bearblog.dev/feed/?q=bearblog&type=rss',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://example.bearblog.dev/atom/?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/atom.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'http://example.bearblog.dev/rss/?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://example.bearblog.dev/feed.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/index.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/rss.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://docs.bearblog.dev/feed/',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://docs.bearblog.dev/feed/?type=rss',
        { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://herman.bearblog.dev/feed/',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://gabrielcornish.bearblog.dev/atom/',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://achyut.bearblog.dev/atom.xml',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://nikspyratos.bearblog.dev/feed.xml',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://reedybear.bearblog.dev/index.xml',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://ludwigabap.bearblog.dev/rss/',
        { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://tbr.bearblog.dev/rss.xml',
        { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
      ],
    ]

    it.each(feedHints)('should return the key of %s', (value, expected) => {
      expect(bearblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://herman.bearblog.dev/blog/'

      expect(bearblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://herman.bearblog.dev/blog/?q=python'

      expect(bearblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the discover page', () => {
      const value = 'https://bearblog.dev/discover/'

      expect(bearblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://bearblog.dev/feed/'

      expect(bearblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.bearblog.dev/feed/'

      expect(bearblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/feed/'

      expect(bearblogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://bearblog.dev/discover/feed/',
        { key: 'bearblog:discover', label: 'Trending', format: 'atom' },
      ],
      [
        'https://bearblog.dev/discover/feed/?type=rss',
        { key: 'bearblog:discover', label: 'Trending', format: 'rss' },
      ],
      [
        'https://tiramisu.bearblog.dev/feed/?q=psychology',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://tiramisu.bearblog.dev/feed/?type=rss&q=psychology',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://docs.bearblog.dev/feed/',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://docs.bearblog.dev/feed/?type=rss',
        { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://achyut.bearblog.dev/atom.xml',
        { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/atom/?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/atom.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/rss/?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://example.bearblog.dev/feed.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/index.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.bearblog.dev/rss.xml?q=example',
        { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [bearblogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
