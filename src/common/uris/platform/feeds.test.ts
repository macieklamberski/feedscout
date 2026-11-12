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
    { key: 'example:profile', template: 'https://www.example.com/-{username}/?rss' },
    { key: 'example:member', template: 'https://www.example.com/members/{username}?rss=' },
    { key: 'example:page', template: 'https://www.example.com/pages/{username}?rss&page={page}' },
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

    it('should write a query flag with no value', () => {
      const value = feeds.getFeedUrl('example:profile', { username: 'alice' })
      const expected = 'https://www.example.com/-alice/?rss'

      expect(value).toBe(expected)
    })

    it('should write a query flag written with an empty value as a flag', () => {
      const value = feeds.getFeedUrl('example:member', { username: 'alice' })
      const expected = 'https://www.example.com/members/alice?rss'

      expect(value).toBe(expected)
    })

    it('should write a query flag beside a query value', () => {
      const value = feeds.getFeedUrl('example:page', { username: 'alice', page: '2' })
      const expected = 'https://www.example.com/pages/alice?rss&page=2'

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

    it('should return the key of a feed named by a query flag', () => {
      const value = 'https://www.example.com/-alice/?rss'
      const expected = 'example:profile'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed named by a query flag with an empty value', () => {
      const value = 'https://www.example.com/-alice/?rss='
      const expected = 'example:profile'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed whose template writes the flag with an empty value', () => {
      const value = 'https://www.example.com/members/alice?rss'
      const expected = 'example:member'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return the key of a feed named by a query flag beside a query value', () => {
      const value = 'https://www.example.com/pages/alice?page=2&rss='
      const expected = 'example:page'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
    })

    it('should return undefined for a query flag with a value', () => {
      const value = 'https://www.example.com/-alice/?rss=1'

      expect(feeds.getFeedHint(value)).toBeUndefined()
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

    it('should return the key of a feed on a host under a listed domain', () => {
      const value = 'https://meta.example.net/feeds/site'
      const expected = 'example:site'

      expect(feeds.getFeedHint(value)?.key).toBe(expected)
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

    it('should return the feed with its hint', () => {
      const value = 'https://www.example.com/'
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/feed',
        hint: { key: 'ocnk:products', label: 'Products' },
      }

      expect(siteFeeds.forUrl(value)?.getFeedEntry('ocnk:products')).toEqual(expected)
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
