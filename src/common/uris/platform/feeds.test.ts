import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../types.js'
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
    {
      key: 'example:products',
      template: 'https://www.example.com/{username}/products.rdf',
      format: 'rdf',
    },
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

  describe('getFeedKey', () => {
    it('should return the key of a feed URL', () => {
      expect(feeds.getFeedKey('https://www.example.com/alice/feed.rss')).toBe('example:posts')
    })

    it('should return the key of a feed with two values', () => {
      expect(feeds.getFeedKey('https://www.example.com/alice/recipes.rss')).toBe('example:board')
    })

    it('should return the key of a feed named by its query', () => {
      expect(feeds.getFeedKey('https://feeds.example.com/rss.xml?q=tag%3Acats')).toBe('example:tag')
    })

    it('should return the key of the template with more query parameters first', () => {
      const value = 'https://feeds.example.com/rss.xml?type=item&q=by%3Aalice%20sort%3Atime'

      expect(feeds.getFeedKey(value)).toBe('example:search')
    })

    it('should return the key of a feed on a tenant host', () => {
      expect(feeds.getFeedKey('https://alice.example.org/feed')).toBe('example:blog')
    })

    it('should return the key of a feed on any listed host', () => {
      expect(feeds.getFeedKey('https://example.com/feeds/site')).toBe('example:site')
    })

    it('should return the key of a feed under either scheme for a scheme placeholder', () => {
      const value = 'http://example.com/feed'
      const expected = 'example:site-feed'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed on a host under a listed domain', () => {
      expect(feeds.getFeedKey('https://meta.example.net/feeds/site')).toBe('example:site')
    })

    it('should return the key of a feed on a tenant host of a listed domain', () => {
      expect(feeds.getFeedKey('https://alice.example.edu/journal/feed')).toBe('example:journal')
    })

    it('should return undefined for a tenant host of another domain', () => {
      expect(feeds.getFeedKey('https://alice.example.com/journal/feed')).toBeUndefined()
    })

    it('should ignore the scheme, www, a trailing slash and the case of a route word', () => {
      expect(feeds.getFeedKey('http://example.com/alice/Feed.rss/')).toBe('example:posts')
    })

    it('should ignore the query order and extra parameters', () => {
      const value =
        'https://feeds.example.com/rss.xml?utm_source=x&q=by%3Aalice%20sort%3Atime&type=item'

      expect(feeds.getFeedKey(value)).toBe('example:search')
    })

    it('should match an at sign of the template against its percent-encoded form', () => {
      const value = 'https://www.example.com/rss/%40alice'
      const expected = 'example:handle'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should match an at sign of the template as written', () => {
      const value = 'https://www.example.com/rss/@alice'
      const expected = 'example:handle'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should match a percent-encoded character of the template in lower case', () => {
      const value = 'https://www.example.com/topics/tag%3acats/feed'
      const expected = 'example:topic'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should match a percent-encoded character of the template in upper case', () => {
      const value = 'https://www.example.com/topics/tag%3Acats/feed'
      const expected = 'example:topic'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should match a template written with a percent-encoded character as written', () => {
      const value = 'https://www.example.com/rss/@alice'
      const expected = 'example:handle'

      expect(encodedFeeds.getFeedKey(value)).toBe(expected)
    })

    it('should match a template written with a percent-encoded character percent-encoded', () => {
      const value = 'https://www.example.com/rss/%40alice'
      const expected = 'example:handle'

      expect(encodedFeeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed built from an encoded value', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'c#' })
      const expected = 'example:posts'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should keep an encoded slash inside one segment', () => {
      const value = 'https://www.example.com/alice%2Fbob/feed.rss'
      const expected = 'example:posts'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed with a malformed percent sequence', () => {
      const value = 'https://www.example.com/%E0%A4/feed.rss'
      const expected = 'example:posts'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return undefined when an encoded slash would split a segment', () => {
      const value = 'https://www.example.com/alice%2Frecipes.rss'

      expect(feeds.getFeedKey(value)).toBeUndefined()
    })

    it('should return undefined for a double-encoded at sign', () => {
      const value = 'https://www.example.com/rss/%2540alice'

      expect(feeds.getFeedKey(value)).toBeUndefined()
    })

    it('should match an encoded slash of the template', () => {
      const value = 'https://www.example.com/a%2fb/alice'
      const expected = 'example:slash'

      expect(encodedFeeds.getFeedKey(value)).toBe(expected)
    })

    it('should return undefined for a double-encoded slash against an encoded slash', () => {
      const value = 'https://www.example.com/a%252Fb/alice'

      expect(encodedFeeds.getFeedKey(value)).toBeUndefined()
    })

    it('should keep an encoded brace of the template a literal', () => {
      const value = 'https://www.example.com/b/anything/rss'

      expect(encodedFeeds.getFeedKey(value)).toBeUndefined()
    })

    it('should return undefined for a page URL', () => {
      expect(feeds.getFeedKey('https://www.example.com/alice')).toBeUndefined()
    })

    it('should return undefined for a nested subdomain', () => {
      expect(feeds.getFeedKey('https://a.alice.example.org/feed')).toBeUndefined()
    })

    it('should return undefined for a feed missing a query parameter', () => {
      expect(feeds.getFeedKey('https://feeds.example.com/rss.xml?type=item')).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      expect(feeds.getFeedKey('https://example.edu/alice/feed.rss')).toBeUndefined()
    })

    it('should return undefined for a URL without an http origin', () => {
      expect(feeds.getFeedKey('ftp://www.example.com/alice/feed.rss')).toBeUndefined()
    })
  })

  describe('getFeedFormat', () => {
    it('should return the format of a feed whose row names one', () => {
      const value = 'https://www.example.com/alice/products.rdf'
      const expected = 'rdf'

      expect(feeds.getFeedFormat(value)).toBe(expected)
    })

    it('should return undefined for a feed whose row names no format', () => {
      const value = 'https://www.example.com/alice/feed.rss'

      expect(feeds.getFeedFormat(value)).toBeUndefined()
    })
  })
})
