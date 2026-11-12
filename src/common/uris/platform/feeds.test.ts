import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import { definePlatformFeeds } from './feeds.js'

const feeds = definePlatformFeeds(
  [
    { key: 'example:posts', template: 'https://www.example.com/{username}/feed.rss' },
    {
      key: 'example:posts',
      template: 'https://www.example.com/{username}/feed.atom',
      format: 'atom',
    },
    { key: 'example:board', template: 'https://www.example.com/{username}/{board}.rss' },
    { key: 'example:tag', template: 'https://feeds.example.com/rss.xml?q=tag:{tag}' },
    {
      key: 'example:search',
      template: 'https://feeds.example.com/rss.xml?type=item&q=by:{username} sort:time',
    },
    { key: 'example:blog', template: 'https://{username}.example.org/feed' },
    { key: 'example:site', template: 'https://{host}/feeds/site' },
    { key: 'example:journal', template: 'https://{username}.{domain}/journal/feed' },
    { key: 'example:site-feed', template: '{scheme}://{host}/feed' },
    { key: 'example:channel', template: 'https://www.example.com/feed/{channel}' },
    { key: 'example:channel', template: 'https://{subdomain}.example.org/feed' },
    { key: 'example:handle', template: 'https://www.example.com/rss/@{username}' },
    { key: 'example:topic', template: 'https://www.example.com/topics/tag:{tag}/feed' },
  ],
  { hosts: ['example.com', 'www.example.com'], domains: ['example.net', 'example.edu'] },
)

const encodedFeeds = definePlatformFeeds([
  { key: 'example:handle', template: 'https://www.example.com/rss/%40{username}' },
  { key: 'example:slash', template: 'https://www.example.com/a%2Fb/{username}' },
  { key: 'example:brace', template: 'https://www.example.com/b/%7Bx%7D/rss' },
])

const hintFeeds = definePlatformFeeds([
  { key: 'ocnk:products', template: 'https://example.com/{shop}/products.rdf', format: 'rdf' },
  { key: 'youtube:videos', template: 'https://example.com/{username}/videos.xml' },
])

const wwwTenantTemplates = [
  { key: 'example:site', template: 'https://example.org/rss' },
  { key: 'example:blog', template: 'https://{username}.example.org/rss' },
  { key: 'example:journal', template: 'https://{username}.example.org/feed' },
  { key: 'example:videos', template: 'https://example.com/{username}/videos.xml' },
]

const wwwTenantFeeds = definePlatformFeeds(wwwTenantTemplates, { isWwwTenant: true })

const wwwStrippedFeeds = definePlatformFeeds(wwwTenantTemplates)

const domainPatternTemplates = [
  { key: 'example:blog', template: '{scheme}://{username}.{domain}/feed' },
  { key: 'example:site', template: 'https://{host}/feeds/site' },
]

const domainPatternOptions = {
  domains: ['example.net', /^example\.(?:com|co\.[a-z]{2}|[a-z]{2})$/],
}

const domainPatternFeeds = definePlatformFeeds(domainPatternTemplates, domainPatternOptions)

const rootTemplates = [
  { key: 'example:latest', template: '{root}/latest.rss' },
  { key: 'example:search', template: '{root}/search.rss?q={query}' },
]

const rootFeeds = definePlatformFeeds(rootTemplates, {
  hosts: ['example.com'],
  domains: ['example.net'],
})

const selfHostedRootFeeds = definePlatformFeeds(rootTemplates)

const categoryFeeds = definePlatformFeeds([
  { key: 'example:category', template: 'https://www.example.com/c/{slug}/{id}.rss' },
  { key: 'example:category', template: 'https://www.example.com/c/{slug}.rss' },
])

describe('definePlatformFeeds', () => {
  it('should throw for a template without an http scheme', () => {
    const throwing = () =>
      definePlatformFeeds([{ key: 'example:posts', template: 'example.com/feed' }])

    expect(throwing).toThrow('Not a feed URL template: example.com/feed')
  })

  it('should throw for a host placeholder without hosts', () => {
    const throwing = () =>
      definePlatformFeeds([{ key: 'example:site', template: 'https://{host}/feed' }])

    expect(throwing).toThrow('No hosts for the example:site feed')
  })

  it('should throw for a domain placeholder without domains', () => {
    const throwing = () =>
      definePlatformFeeds([{ key: 'example:blog', template: 'https://{username}.{domain}/feed' }])

    expect(throwing).toThrow('No hosts for the example:blog feed')
  })

  describe('getFeedUrl', () => {
    it('should write a path value into the template', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'alice' })
      const expected = 'https://www.example.com/alice/feed.rss'

      expect(value).toBe(expected)
    })

    it('should encode a path value', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'c#' })
      const expected = 'https://www.example.com/c%23/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a query value through composeQuery', () => {
      const value = feeds.getFeedUrl('example:search', { username: 'alice' })
      const expected = 'https://feeds.example.com/rss.xml?type=item&q=by:alice%20sort:time'

      expect(value).toBe(expected)
    })

    it('should write a host value as given', () => {
      const value = feeds.getFeedUrl('example:site', { host: 'example.com' })
      const expected = 'https://example.com/feeds/site'

      expect(value).toBe(expected)
    })

    it('should write the scheme value as given', () => {
      const value = feeds.getFeedUrl('example:site-feed', { scheme: 'http', host: 'example.com' })
      const expected = 'http://example.com/feed'

      expect(value).toBe(expected)
    })

    it('should build the first template of a key whose placeholders the values fill', () => {
      const value = feeds.getFeedUrl('example:channel', { subdomain: 'alice' })
      const expected = 'https://alice.example.org/feed'

      expect(value).toBe(expected)
    })

    it('should build the first template of a key when the values fill none', () => {
      const value = feeds.getFeedUrl('example:channel', {})
      const expected = 'https://www.example.com/feed/{channel}'

      expect(value).toBe(expected)
    })

    it('should pick the template of the format', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'alice' }, 'atom')
      const expected = 'https://www.example.com/alice/feed.atom'

      expect(value).toBe(expected)
    })

    it('should throw for an unknown key', () => {
      const throwing = () => feeds.getFeedUrl('example:unknown')

      expect(throwing).toThrow('No feed template for example:unknown')
    })

    it('should write a reserved character of the template as written', () => {
      const value = feeds.getFeedUrl('example:handle', { username: 'alice' })
      const expected = 'https://www.example.com/rss/@alice'

      expect(value).toBe(expected)
    })

    it('should keep a placeholder with no value', () => {
      const value = feeds.getFeedUrl('example:posts')
      const expected = 'https://www.example.com/{username}/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a root as given', () => {
      const value = { root: 'https://example.com' }
      const expected = 'https://example.com/latest.rss'

      expect(rootFeeds.getFeedUrl('example:latest', value)).toBe(expected)
    })

    it('should write a root with a base path unencoded', () => {
      const value = { root: 'https://example.com/forum' }
      const expected = 'https://example.com/forum/latest.rss'

      expect(rootFeeds.getFeedUrl('example:latest', value)).toBe(expected)
    })

    it('should drop the trailing slash of a root', () => {
      const value = { root: 'https://example.com/forum/' }
      const expected = 'https://example.com/forum/latest.rss'

      expect(rootFeeds.getFeedUrl('example:latest', value)).toBe(expected)
    })

    it('should keep a root placeholder with no value', () => {
      const value = {}
      const expected = '{root}/latest.rss'

      expect(rootFeeds.getFeedUrl('example:latest', value)).toBe(expected)
    })

    it('should build the row without the placeholder whose value is undefined', () => {
      const value = {
        slug: 'news',
        id: undefined,
      }
      const expected = 'https://www.example.com/c/news.rss'

      expect(categoryFeeds.getFeedUrl('example:category', value)).toBe(expected)
    })

    it('should keep a placeholder whose value is undefined', () => {
      const value = { username: undefined }
      const expected = 'https://www.example.com/{username}/feed.rss'

      expect(feeds.getFeedUrl('example:posts', value)).toBe(expected)
    })
  })

  describe('getFeedEntry', () => {
    const labelled = definePlatformFeeds([
      { key: 'plurk:plurks', template: 'https://www.example.com/{username}.xml' },
      { key: 'plurk:plurks', template: 'https://www.example.com/{username}.atom', format: 'atom' },
    ])

    it('should return the feed with its hint', () => {
      const value = labelled.getFeedEntry('plurk:plurks', { username: 'alice' })
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.xml',
        hint: { key: 'plurk:plurks', label: 'Plurks' },
      }

      expect(value).toEqual(expected)
    })

    it('should return the feed of the format with the format in its hint', () => {
      const value = labelled.getFeedEntry('plurk:plurks', { username: 'alice' }, 'atom')
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.atom',
        hint: { key: 'plurk:plurks', label: 'Plurks', format: 'atom' },
      }

      expect(value).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the hint of a feed whose row names a format', () => {
      const value = 'https://example.com/alice/products.rdf'
      const expected: DiscoverUriHint = { key: 'ocnk:products', label: 'Products', format: 'rdf' }

      expect(hintFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return the hint of a feed whose row names no format', () => {
      const value = 'https://example.com/alice/videos.xml'
      const expected: DiscoverUriHint = { key: 'youtube:videos', label: 'Videos' }

      expect(hintFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return the key of a feed URL', () => {
      const value = 'https://www.example.com/alice/feed.rss'
      const expected = 'example:posts'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed with two values', () => {
      const value = 'https://www.example.com/alice/recipes.rss'
      const expected = 'example:board'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed named by its query', () => {
      const value = 'https://feeds.example.com/rss.xml?q=tag%3Acats'
      const expected = 'example:tag'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of the template with more query parameters first', () => {
      const value = 'https://feeds.example.com/rss.xml?type=item&q=by%3Aalice%20sort%3Atime'

      expect(feeds.getFeedHint(value)?.key).toBe('example:search')
    })

    it('should return the key of a feed on a tenant host', () => {
      const value = 'https://alice.example.org/feed'
      const expected = 'example:blog'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on any listed host', () => {
      const value = 'https://example.com/feeds/site'
      const expected = 'example:site'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed under either scheme for a scheme placeholder', () => {
      const value = 'http://example.com/feed'
      const expected = 'example:site-feed'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant of a listed domain', () => {
      const value = 'https://meta.example.net/feeds/site'
      const expected = 'example:site'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant with www of a listed domain', () => {
      const value = 'https://www.meta.example.net/feeds/site'
      const expected = 'example:site'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined for a feed on the apex of a listed domain', () => {
      const value = 'https://example.net/feeds/site'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www of a listed domain', () => {
      const value = 'https://www.example.net/feeds/site'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed on www of a listed domain with isWwwTenant', () => {
      const wwwTenantHostFeeds = definePlatformFeeds(
        [{ key: 'example:site', template: 'https://{host}/feeds/site' }],
        { domains: ['example.net'], isWwwTenant: true },
      )
      const value = 'https://www.example.net/feeds/site'
      const expected = 'example:site'

      expect(wwwTenantHostFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined for a feed on a nested host of a listed domain', () => {
      const value = 'https://blog.meta.example.net/feeds/site'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed on a listed host under a listed domain', () => {
      const hostFeeds = definePlatformFeeds(
        [{ key: 'example:site', template: 'https://{host}/feeds/site' }],
        { hosts: ['example.net'], domains: ['example.net'] },
      )
      const value = 'https://example.net/feeds/site'
      const expected = 'example:site'

      expect(hostFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant host of a listed domain', () => {
      const value = 'https://alice.example.edu/journal/feed'
      const expected = 'example:journal'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined for a tenant host of another domain', () => {
      const value = 'https://alice.example.com/journal/feed'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should ignore the scheme, www, a trailing slash and the case of a route word', () => {
      const value = 'http://example.com/alice/Feed.rss/'
      const expected = 'example:posts'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a tenant named www as given with isWwwTenant', () => {
      const value = 'https://www.example.org/feed'
      const expected = 'example:journal'

      expect(wwwTenantFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant host with www with isWwwTenant', () => {
      const value = 'https://www.alice.example.org/feed'
      const expected = 'example:journal'

      expect(wwwTenantFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on a fixed host with www with isWwwTenant', () => {
      const value = 'https://www.example.com/alice/videos.xml'
      const expected = 'example:videos'

      expect(wwwTenantFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a tenant row as given over an apex row with isWwwTenant', () => {
      const value = 'https://www.example.org/rss'
      const expected = 'example:blog'

      expect(wwwTenantFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of an apex row for the apex host with isWwwTenant', () => {
      const value = 'https://example.org/rss'
      const expected = 'example:site'

      expect(wwwTenantFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined for a tenant named www without isWwwTenant', () => {
      const value = 'https://www.example.org/feed'

      expect(wwwStrippedFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of an apex row for a www host without isWwwTenant', () => {
      const value = 'https://www.example.org/rss'
      const expected = 'example:site'

      expect(wwwStrippedFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant host with www without isWwwTenant', () => {
      const value = 'https://www.alice.example.org/feed'
      const expected = 'example:journal'

      expect(wwwStrippedFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should ignore the query order and extra parameters', () => {
      const value =
        'https://feeds.example.com/rss.xml?utm_source=x&q=by%3Aalice%20sort%3Atime&type=item'

      expect(feeds.getFeedHint(value)?.key).toBe('example:search')
    })

    it('should match an at sign of the template against its percent-encoded form', () => {
      const value = 'https://www.example.com/rss/%40alice'
      const expected = 'example:handle'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should match an at sign of the template as written', () => {
      const value = 'https://www.example.com/rss/@alice'
      const expected = 'example:handle'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should match a percent-encoded character of the template in lower case', () => {
      const value = 'https://www.example.com/topics/tag%3acats/feed'
      const expected = 'example:topic'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should match a percent-encoded character of the template in upper case', () => {
      const value = 'https://www.example.com/topics/tag%3Acats/feed'
      const expected = 'example:topic'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should match a template written with a percent-encoded character as written', () => {
      const value = 'https://www.example.com/rss/@alice'
      const expected = 'example:handle'

      expect(encodedFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should match a template written with a percent-encoded character percent-encoded', () => {
      const value = 'https://www.example.com/rss/%40alice'
      const expected = 'example:handle'

      expect(encodedFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed built from an encoded value', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'c#' })
      const expected = 'example:posts'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should keep an encoded slash inside one segment', () => {
      const value = 'https://www.example.com/alice%2Fbob/feed.rss'
      const expected = 'example:posts'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed with a malformed percent sequence', () => {
      const value = 'https://www.example.com/%E0%A4/feed.rss'
      const expected = 'example:posts'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined when an encoded slash would split a segment', () => {
      const value = 'https://www.example.com/alice%2Frecipes.rss'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for a double-encoded at sign', () => {
      const value = 'https://www.example.com/rss/%2540alice'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should match an encoded slash of the template', () => {
      const value = 'https://www.example.com/a%2fb/alice'
      const expected = 'example:slash'

      expect(encodedFeeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined for a double-encoded slash against an encoded slash', () => {
      const value = 'https://www.example.com/a%252Fb/alice'

      expect(encodedFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should keep an encoded brace of the template a literal', () => {
      const value = 'https://www.example.com/b/anything/rss'

      expect(encodedFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for a page URL', () => {
      const value = 'https://www.example.com/alice'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for a nested subdomain', () => {
      const value = 'https://a.alice.example.org/feed'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for a feed missing a query parameter', () => {
      const value = 'https://feeds.example.com/rss.xml?type=item'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.edu/alice/feed.rss'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return undefined for a URL without an http origin', () => {
      const value = 'ftp://www.example.com/alice/feed.rss'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    describe('with a domain pattern', () => {
      it('should return the key of a feed on a domain the pattern matches', () => {
        const value = 'https://alice.example.co.uk/feed'
        const expected = 'example:blog'

        expect(domainPatternFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a feed on a plain domain beside the pattern', () => {
        const value = 'https://alice.example.net/feed'
        const expected = 'example:blog'

        expect(domainPatternFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a feed with www before the tenant', () => {
        const value = 'https://www.alice.example.de/feed'
        const expected = 'example:blog'

        expect(domainPatternFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a feed on a port', () => {
        const value = 'https://alice.example.de:8080/feed'
        const expected = 'example:blog'

        expect(domainPatternFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a host feed on a tenant', () => {
        const value = 'https://alice.example.co.uk/feeds/site'
        const expected = 'example:site'

        expect(domainPatternFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return undefined for a host feed on the apex', () => {
        const value = 'https://example.co.uk/feeds/site'

        expect(domainPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a host feed on a nested host', () => {
        const value = 'https://blog.alice.example.co.uk/feeds/site'

        expect(domainPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of www as a tenant', () => {
        const wwwTenantPatternFeeds = definePlatformFeeds(domainPatternTemplates, {
          ...domainPatternOptions,
          isWwwTenant: true,
        })
        const value = 'https://www.example.de/feed'
        const expected = 'example:blog'

        expect(wwwTenantPatternFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return undefined for www as a tenant without isWwwTenant', () => {
        const value = 'https://www.example.de/feed'

        expect(domainPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a suffix outside the pattern', () => {
        const value = 'https://alice.example.info/feed'

        expect(domainPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a matching domain inside another host', () => {
        const value = 'https://alice.example.de.example.org/feed'

        expect(domainPatternFeeds.getFeedHint(value)).toBeUndefined()
      })
    })

    describe('with a root', () => {
      it('should return the key of a feed on a listed host', () => {
        const value = 'https://example.com/latest.rss'
        const expected = 'example:latest'

        expect(rootFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a feed under a base path', () => {
        const value = 'https://example.com/forum/latest.rss'
        const expected = 'example:latest'

        expect(rootFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a feed on a tenant of a listed domain', () => {
        const value = 'https://alice.example.net/latest.rss'
        const expected = 'example:latest'

        expect(rootFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return the key of a feed named by its query under a base path', () => {
        const value = 'https://example.com/forum/search.rss?q=rss'
        const expected = 'example:search'

        expect(rootFeeds.getFeedHint(value)?.key).toBe(expected)
      })

      it('should return undefined for another host', () => {
        const value = 'https://example.org/forum/latest.rss'

        expect(rootFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for the apex of a listed domain', () => {
        const value = 'https://example.net/latest.rss'

        expect(rootFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a table without hosts', () => {
        const value = 'https://example.org/forum/latest.rss'

        expect(selfHostedRootFeeds.getFeedHint(value)).toBeUndefined()
      })
    })
  })

  describe('forUrl', () => {
    const siteFeeds = definePlatformFeeds(
      [
        { key: 'example:posts', template: '{scheme}://{blog}.{domain}/feed' },
        { key: 'ocnk:products', template: '{scheme}://{host}/feed' },
      ],
      { domains: ['example.net', 'example.org'] },
    )

    it('should fill the scheme of an http page', () => {
      const value = 'http://alice.example.net/about'
      const expected = 'http://alice.example.net/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', { blog: 'alice' })).toBe(expected)
    })

    it('should fill the scheme of an https page', () => {
      const value = 'https://alice.example.net/about'
      const expected = 'https://alice.example.net/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', { blog: 'alice' })).toBe(expected)
    })

    it('should fill the host of the page', () => {
      const value = 'https://www.example.com/about'
      const expected = 'https://www.example.com/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('ocnk:products')).toBe(expected)
    })

    it('should keep the port in the host of the page', () => {
      const value = 'http://example.com:8080/about'
      const expected = 'http://example.com:8080/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('ocnk:products')).toBe(expected)
    })

    it('should fill the domain the host of the page is under', () => {
      const value = 'https://alice.example.org/about'
      const expected = 'https://alice.example.org/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', { blog: 'alice' })).toBe(expected)
    })

    it('should fill the domain under a tenant with a dot', () => {
      const value = 'https://my.blog.example.org/'
      const params = { blog: 'my.blog' }
      const expected = 'https://my.blog.example.org/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', params)).toBe(expected)
    })

    it('should fill the domain a pattern matches', () => {
      const value = 'https://alice.example.co.uk/about'
      const params = { username: 'alice' }
      const expected = 'https://alice.example.co.uk/feed'

      expect(domainPatternFeeds.forUrl(value)?.getFeedUrl('example:blog', params)).toBe(expected)
    })

    it('should fill the domain a pattern matches under a nested host', () => {
      const value = 'https://my.blog.example.de/'
      const params = { username: 'my.blog' }
      const expected = 'https://my.blog.example.de/feed'

      expect(domainPatternFeeds.forUrl(value)?.getFeedUrl('example:blog', params)).toBe(expected)
    })

    it('should keep the domain placeholder for the apex of a pattern', () => {
      const value = 'https://example.de/'
      const params = { username: 'alice' }
      const expected = 'https://alice.{domain}/feed'

      expect(domainPatternFeeds.forUrl(value)?.getFeedUrl('example:blog', params)).toBe(expected)
    })

    it('should keep the domain placeholder for a host under no domain', () => {
      const value = 'https://alice.example.com/'
      const expected = 'https://alice.{domain}/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', { blog: 'alice' })).toBe(expected)
    })

    it('should write a value the handler passes over the one of the page', () => {
      const value = 'https://alice.example.net/'
      const params = {
        scheme: 'http',
        blog: 'alice',
      }
      const expected = 'http://alice.example.net/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', params)).toBe(expected)
    })

    it('should keep the value of the page over an undefined value the handler passes', () => {
      const value = 'http://alice.example.net/about'
      const params = {
        scheme: undefined,
        blog: 'alice',
      }
      const expected = 'http://alice.example.net/feed'

      expect(siteFeeds.forUrl(value)?.getFeedUrl('example:posts', params)).toBe(expected)
    })

    it('should return the feed with its hint', () => {
      const value = 'https://www.example.com/'
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/feed',
        hint: { key: 'ocnk:products', label: 'Products' },
      }

      expect(siteFeeds.forUrl(value)?.getFeedEntry('ocnk:products')).toEqual(expected)
    })

    it('should fill the root with the origin of the page', () => {
      const value = 'https://example.com/forum/t/1'
      const expected = 'https://example.com/latest.rss'

      expect(rootFeeds.forUrl(value)?.getFeedUrl('example:latest')).toBe(expected)
    })

    it('should keep the port in the root of the page', () => {
      const value = 'http://example.com:8080/about'
      const expected = 'http://example.com:8080/latest.rss'

      expect(rootFeeds.forUrl(value)?.getFeedUrl('example:latest')).toBe(expected)
    })

    it('should write a root with a base path the handler passes', () => {
      const value = 'https://example.com/forum/t/1'
      const params = { root: 'https://example.com/forum' }
      const expected = 'https://example.com/forum/latest.rss'

      expect(rootFeeds.forUrl(value)?.getFeedUrl('example:latest', params)).toBe(expected)
    })

    it('should fill the root on a table without hosts', () => {
      const value = 'https://example.org/forum/t/1'
      const expected = 'https://example.org/latest.rss'

      expect(selfHostedRootFeeds.forUrl(value)?.getFeedUrl('example:latest')).toBe(expected)
    })

    it('should return undefined for an unparsable URL', () => {
      const value = 'not a url'

      expect(siteFeeds.forUrl(value)).toBeUndefined()
    })

    it('should return undefined for a URL without an http origin', () => {
      const value = 'ftp://www.example.com/'

      expect(siteFeeds.forUrl(value)).toBeUndefined()
    })
  })
})
