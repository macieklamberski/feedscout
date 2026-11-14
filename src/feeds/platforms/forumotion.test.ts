import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  type ForumotionPage,
  forumotionHandler,
  getForumotionPage,
  isForumotionHtml,
} from './forumotion.js'

const userdataScript = `
  <script type="text/javascript">
    var _userdata = new Object();
    _userdata["session_logged_in"] = 0;
  </script>
`
const forumHtml = `
  <head>
    <link
      rel="canonical"
      href="https://shingamix.forumotion.com/f104-the-nexus"
    />
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/","name":"Super Maker Forums"}},{"@type":"ListItem","position":2,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/f104-the-nexus","name":"The Nexus"}}]}</script>
    ${userdataScript}
  </head>
`
const missingForumHtml = `
  <head>
    <link
      rel="canonical"
      href="https://shingamix.forumotion.com/f99999-forum"
    />
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/","name":"Super Maker Forums"}}]}</script>
    ${userdataScript}
  </head>
`
const topicHtml = `
  <head>
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/","name":"Super Maker Forums"}},{"@type":"ListItem","position":2,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/f104-the-nexus","name":"The Nexus"}},{"@type":"ListItem","position":3,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/f119-events","name":"Events"}},{"@type":"ListItem","position":4,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/t550-i-have-returned","name":"I have returned!!!!!"}}]}</script>
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"DiscussionForumPosting","headline":"I have returned!!!!!"}</script>
    ${userdataScript}
  </head>
`
const otherHtml = `
  <head>
    <script>var _board = new Object();</script>
  </head>
`

describe('isForumotionHtml', () => {
  it('should return true for the userdata script', () => {
    expect(isForumotionHtml(forumHtml)).toBe(true)
  })

  it('should return false for other forum software', () => {
    expect(isForumotionHtml(otherHtml)).toBe(false)
  })
})

describe('getForumotionPage', () => {
  it('should return the forum the breadcrumb ends with', () => {
    const value = 'https://shingamix.forumotion.com/f104-the-nexus'
    const expected: ForumotionPage = { kind: 'forum', forumId: '104' }

    expect(getForumotionPage(value, forumHtml)).toEqual(expected)
  })

  it('should return the forum of a later page of a forum', () => {
    const value = 'https://shingamix.forumotion.com/f104p20-the-nexus'
    const content = forumHtml.replaceAll('f104-the-nexus', 'f104p20-the-nexus')
    const expected: ForumotionPage = { kind: 'forum', forumId: '104' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return the forum before the topic for a topic page', () => {
    const value = 'https://shingamix.forumotion.com/t550-i-have-returned'
    const expected: ForumotionPage = { kind: 'topic', forumId: '119' }

    expect(getForumotionPage(value, topicHtml)).toEqual(expected)
  })

  it('should return home for a forum id the breadcrumb does not name', () => {
    const value = 'https://shingamix.forumotion.com/f99999-zzqq'
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, missingForumHtml)).toEqual(expected)
  })

  it('should return home for a forum id the breadcrumb names without a url', () => {
    const value = 'https://shingamix.forumotion.com/f99999-zzqq'
    const content = missingForumHtml.replace(
      '"name":"Super Maker Forums"}}]',
      '"name":"Super Maker Forums"}},{"@type":"ListItem","position":2,"name":"Zzqq"}]',
    )
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return home for a topic without a forum in the breadcrumb', () => {
    const value = 'https://shingamix.forumotion.com/t550-i-have-returned'
    const content = topicHtml.replace('f119-events', '')
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return home for a breadcrumb that ends after its forum at no topic', () => {
    const value = 'https://shingamix.forumotion.com/c6-frontdesk'
    const content = topicHtml.replace('t550-i-have-returned', 'c6-frontdesk')
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return home for a page without content', () => {
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage('https://shingamix.forumotion.com/', undefined)).toEqual(expected)
  })
})

describe('forumotionHandler', () => {
  describe('match', () => {
    it('should return true for a page with the userdata script', () => {
      expect(forumotionHandler.match('https://www.leschevelus.com/', userdataScript)).toBe(true)
    })

    it('should return false for a page without it', () => {
      expect(forumotionHandler.match('https://shingamix.forumotion.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the forum and latest topics feeds for a forum page', () => {
      const value = 'https://shingamix.forumotion.com/f104-the-nexus'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=104',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=104&type=atom',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?type=atom',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
        },
      ]

      expect(forumotionHandler.resolve(value, forumHtml)).toEqual(expected)
    })

    it('should return the feeds of the topic forum for a topic page', () => {
      const value = 'https://shingamix.forumotion.com/t550-i-have-returned'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=119',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=119&type=atom',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?type=atom',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
        },
      ]

      expect(forumotionHandler.resolve(value, topicHtml)).toEqual(expected)
    })

    it('should return only the latest topics feeds for a made-up forum', () => {
      const value = 'https://shingamix.forumotion.com/f99999-zzqq'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shingamix.forumotion.com/feed/',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?type=atom',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
        },
      ]

      expect(forumotionHandler.resolve(value, missingForumHtml)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.forumotion.com/feed/',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
      ],
      [
        'https://example.forumactif.org/feed/?type=atom',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
      ],
      [
        'https://example.forumeiros.com/feed/?f=12',
        { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
      ],
      [
        'https://example.1fr1.net/feed/?f=12&type=atom',
        { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
      ],
      [
        'https://example.forumactif.com/rss',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
      ],
      [
        'https://example.forumactif.com/rss?type=atom',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
      ],
      [
        'https://example.forumeiros.com/rss?tt=1',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
      ],
      [
        'https://example.forumotion.com/rss?f=12',
        { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
      ],
      [
        'https://example.forumotion.com/rss?f=12&type=atom',
        { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
      ],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(forumotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page on a forum subdomain', () => {
      const value = 'https://example.forumotion.com/f12-general'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/feed/'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an rss path on a custom domain', () => {
      const value = 'https://example.com/rss'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://forumactif.com/feed/'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.forumotion.com/feed/'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the hint for a feed on www in front of a forum', () => {
      const value = 'https://www.example.forumotion.com/feed/'
      const expected: DiscoverUriHint = {
        key: 'forumotion:latest-topics',
        label: 'Latest topics',
        format: 'rss',
      }

      expect(forumotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://cms.example.forumotion.com/feed/'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the hint for a feed on a country domain outside the old list', () => {
      const value = 'https://example.forumotion.co.uk/feed/'
      const expected: DiscoverUriHint = {
        key: 'forumotion:latest-topics',
        label: 'Latest topics',
        format: 'rss',
      }

      expect(forumotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a suffix outside the domain patterns', () => {
      const value = 'https://example.forumgratuit.net/feed/'

      expect(forumotionHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriEntry['hint']]> = [
      [
        'https://example.forumotion.net/feed',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
      ],
      [
        'https://example.forumgratuit.ro/feed/?type=atom',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
      ],
      [
        'https://example.forumotion.com/feed/?f=12',
        { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
      ],
      [
        'https://example.forumactif.fr/feed/?type=atom&f=12',
        { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
      ],
      [
        'https://example.forumactif.fr/rss',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
      ],
      [
        'https://example.forumactif.fr/rss?type=atom',
        { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
      ],
      [
        'https://example.forumactif.fr/rss?f=12',
        { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
      ],
      [
        'https://example.forumactif.fr/rss?f=12&type=atom',
        { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [forumotionHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
