import { describe, expect, it } from 'bun:test'
import { isLocale } from 'trousse'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import { definePlatformFeeds } from './feeds.js'

const feeds = definePlatformFeeds(
  'example',
  [
    { key: 'posts', main: 'https://www.example.com/{username}/feed.rss' },
    { key: 'posts', main: 'https://www.example.com/{username}/feed.atom', format: 'atom' },
    { key: 'board', main: 'https://www.example.com/{username}/{board}.rss' },
    { key: 'tag', main: 'https://feeds.example.com/rss.xml?q=tag:{tag}' },
    {
      key: 'search',
      main: 'https://feeds.example.com/rss.xml?type=item&q=by:{username} sort:time',
    },
    { key: 'blog', main: 'https://{username}.example.org/feed' },
    { key: 'site', main: 'https://{host}/feeds/site' },
    { key: 'journal', main: 'https://{username}.{domain}/journal/feed' },
    { key: 'site-feed', main: '{scheme}://{host}/feed' },
    { key: 'channel', main: 'https://www.example.com/feed/{channel}' },
    { key: 'channel', main: 'https://{subdomain}.example.org/feed' },
    { key: 'profile', main: 'https://www.example.com/-{username}/?rss' },
    { key: 'member', main: 'https://www.example.com/members/{username}?rss=' },
    { key: 'page', main: 'https://www.example.com/pages/{username}?rss&page={page}' },
    { key: 'handle', main: 'https://www.example.com/rss/@{username}' },
    { key: 'topic', main: 'https://www.example.com/topics/tag:{tag}/feed' },
  ],
  {
    hosts: { exact: ['example.com', 'www.example.com'], tenants: ['example.net', 'example.edu'] },
  },
)

const encodedFeeds = definePlatformFeeds('example', [
  { key: 'handle', main: 'https://www.example.com/rss/%40{username}' },
  { key: 'slash', main: 'https://www.example.com/a%2Fb/{username}' },
  { key: 'brace', main: 'https://www.example.com/b/%7Bx%7D/rss' },
])

const hintFeeds = definePlatformFeeds('youtube', [
  { key: 'shorts', main: 'https://example.com/{shop}/products.rdf', format: 'rdf' },
  { key: 'videos', main: 'https://example.com/{username}/videos.xml' },
])

const wwwTenantTemplates = [
  { key: 'site', main: 'https://example.org/rss' },
  { key: 'blog', main: 'https://{username}.example.org/rss' },
  { key: 'journal', main: 'https://{username}.example.org/feed' },
  { key: 'videos', main: 'https://example.com/{username}/videos.xml' },
]

const wwwTenantFeeds = definePlatformFeeds('example', wwwTenantTemplates, { isWwwTenant: true })

const wwwStrippedFeeds = definePlatformFeeds('example', wwwTenantTemplates)

const wwwPrefixFeeds = definePlatformFeeds('example', wwwTenantTemplates, {
  isWwwTenantPrefix: true,
})

const wwwPrefixDomainFeeds = definePlatformFeeds(
  'example',
  [
    { key: 'blog', main: '{scheme}://{username}.{domain}/feed' },
    { key: 'site', main: 'https://{host}/feeds/site' },
  ],
  { hosts: { tenants: ['example.net'] }, isWwwTenantPrefix: true },
)

const domainPatternTemplates = [
  { key: 'blog', main: '{scheme}://{username}.{domain}/feed' },
  { key: 'site', main: 'https://{host}/feeds/site' },
]

const domainPatternOptions = {
  hosts: { tenants: ['example.net', /^example\.(?:com|co\.[a-z]{2}|[a-z]{2})$/] },
}

const domainPatternFeeds = definePlatformFeeds(
  'example',
  domainPatternTemplates,
  domainPatternOptions,
)

const hostPatternFeeds = definePlatformFeeds(
  'example',
  [{ key: 'profile', main: 'https://{host}/-{username}/feed' }],
  { hosts: { exact: ['example.org', /^example\.(?:com|co\.[a-z]{2}|[a-z]{2})$/] } },
)

const rootTemplates = [
  { key: 'latest', main: '{root}/latest.rss' },
  { key: 'search', main: '{root}/search.rss?q={query}' },
]

const rootFeeds = definePlatformFeeds('example', rootTemplates, {
  hosts: { exact: ['example.com'], tenants: ['example.net'] },
})

const selfHostedRootFeeds = definePlatformFeeds('example', rootTemplates)

const categoryFeeds = definePlatformFeeds('example', [
  { key: 'category', main: 'https://www.example.com/c/{slug}/{id}.rss' },
  { key: 'category', main: 'https://www.example.com/c/{slug}.rss' },
])

const pathFeeds = definePlatformFeeds(
  'discourse',
  [
    { key: 'tag', main: 'https://www.example.com/t/{tag}/feed' },
    { key: 'folder', main: 'https://www.example.com/{path*}/feed' },
    { key: 'category', main: 'https://www.example.com/c/{path*}.rss' },
    { key: 'search', main: 'https://www.example.com/c/{path*}.rss?q={query}' },
    { key: 'site', main: '{root}/site/{path*}.rss' },
  ],
  { hosts: { exact: ['example.com', 'www.example.com'] } },
)

const passedQueryFeeds = definePlatformFeeds(
  'example',
  [
    { key: 'view', main: '{root}/index.php?{query}&format=feed&type=rss' },
    { key: 'posts', main: '{root}/index.php?{query}&tempskin=_rss2' },
    { key: 'search', main: '{root}/jobs/feed?sort=date&{query}' },
    { key: 'site', main: '{root}/index.php?format=feed&type=atom' },
  ],
  { hosts: { exact: ['example.com'] } },
)

const repeatedQueryFeeds = definePlatformFeeds(
  'confluence',
  [
    {
      key: 'space',
      main: 'https://{host}/createrssfeed.action?types=page&types=blogpost&types=comment&spaces={space}',
    },
    {
      key: 'site',
      main: 'https://{host}/createrssfeed.action?types=page&spaces=conf_all',
    },
  ],
  { hosts: { exact: ['example.com'] } },
)

const formQueryFeeds = definePlatformFeeds(
  'mediawiki',
  [
    {
      key: 'history',
      main: '{root}/index.php?title={title}&action=history&feed=atom',
      format: 'atom',
      queryEncoding: 'form',
    },
    {
      key: 'recent-changes',
      main: '{root}/index.php?title=Special:RecentChanges&feed=atom&{query}',
      format: 'atom',
      queryEncoding: 'form',
    },
    { key: 'profile', main: '{root}/index.php?title={title}&rss', queryEncoding: 'form' },
    { key: 'search', main: '{root}/search?q={terms}&feed=atom' },
  ],
  { hosts: { exact: ['example.com'] } },
)

const isShortLabel = (value: string): boolean => value.length === 2

const checkedFeeds = definePlatformFeeds(
  'example',
  [
    { key: 'blog', main: 'https://www.example.com/{locale}/blogs/{handle}.atom' },
    { key: 'blog', main: 'https://www.example.com/blogs/{handle}.atom' },
    { key: 'collection', main: 'https://www.example.com/collections/{handle}.atom' },
    { key: 'community', main: 'https://www.example.com/community.atom?lang={locale}' },
    { key: 'community', main: 'https://www.example.com/community.atom' },
    { key: 'docs', main: 'https://www.example.com/{locale}/docs/{path*}.rss' },
    { key: 'country', main: 'https://{country}.example.net/{username}.rss' },
    { key: 'site', main: 'https://{host}/site.rss' },
  ],
  {
    hosts: { exact: ['example.org', /^[a-z]{2}\.example\.org$/] },
    checks: { locale: isLocale, country: isShortLabel, host: (host) => host !== 'example.org' },
  },
)

const directoryFeeds = definePlatformFeeds('typecho', [
  { key: 'page', main: 'https://www.example.com/feed/{directory*}/' },
  { key: 'page', main: 'https://www.example.com/feed/{path*}' },
])

describe('definePlatformFeeds', () => {
  it('should throw for a template without an http scheme', () => {
    const throwing = () =>
      definePlatformFeeds('example', [{ key: 'posts', main: 'example.com/feed' }])

    expect(throwing).toThrow('Not a feed URL template: example.com/feed')
  })

  it('should throw for a host placeholder without hosts', () => {
    const throwing = () =>
      definePlatformFeeds('example', [{ key: 'site', main: 'https://{host}/feed' }])

    expect(throwing).toThrow('No hosts for the site feed')
  })

  it('should throw for a domain placeholder without domains', () => {
    const throwing = () =>
      definePlatformFeeds('example', [{ key: 'blog', main: 'https://{username}.{domain}/feed' }])

    expect(throwing).toThrow('No hosts for the blog feed')
  })

  describe('getFeedUrl', () => {
    it('should write a path value into the template', () => {
      const value = feeds.getFeedUrl('posts', { username: 'alice' })
      const expected = 'https://www.example.com/alice/feed.rss'

      expect(value).toBe(expected)
    })

    it('should encode a path value', () => {
      const value = feeds.getFeedUrl('posts', { username: 'c#' })
      const expected = 'https://www.example.com/c%23/feed.rss'

      expect(value).toBe(expected)
    })

    it('should percent-encode a non-ASCII path value', () => {
      const value = feeds.getFeedUrl('posts', { username: '技術' })
      const expected = 'https://www.example.com/%E6%8A%80%E8%A1%93/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a percent sign that starts no escape as %25', () => {
      const value = feeds.getFeedUrl('posts', { username: '100%off' })
      const expected = 'https://www.example.com/100%25off/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a percent-encoded path value as given', () => {
      const value = feeds.getFeedUrl('posts', { username: '%e6%8a%80%e8%a1%93' })
      const expected = 'https://www.example.com/%e6%8a%80%e8%a1%93/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a lone surrogate of a path value as given', () => {
      const value = feeds.getFeedUrl('posts', { username: 'alice\ud800' })
      const expected = 'https://www.example.com/alice\ud800/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a query value through composeQuery', () => {
      const value = feeds.getFeedUrl('search', { username: 'alice' })
      const expected = 'https://feeds.example.com/rss.xml?q=by:alice%20sort:time&type=item'

      expect(value).toBe(expected)
    })

    it('should write a query flag with no value', () => {
      const value = feeds.getFeedUrl('profile', { username: 'alice' })
      const expected = 'https://www.example.com/-alice/?rss'

      expect(value).toBe(expected)
    })

    it('should write a query flag written with an empty value as a flag', () => {
      const value = feeds.getFeedUrl('member', { username: 'alice' })
      const expected = 'https://www.example.com/members/alice?rss'

      expect(value).toBe(expected)
    })

    it('should write a query flag beside a query value', () => {
      const value = feeds.getFeedUrl('page', { username: 'alice', page: '2' })
      const expected = 'https://www.example.com/pages/alice?page=2&rss'

      expect(value).toBe(expected)
    })

    it('should percent-encode a non-ASCII query value', () => {
      const value = feeds.getFeedUrl('tag', { tag: '技術' })
      const expected = 'https://feeds.example.com/rss.xml?q=tag:%E6%8A%80%E8%A1%93'

      expect(value).toBe(expected)
    })

    it('should write a host value as given', () => {
      const value = feeds.getFeedUrl('site', { host: 'example.com' })
      const expected = 'https://example.com/feeds/site'

      expect(value).toBe(expected)
    })

    it('should write the scheme value as given', () => {
      const value = feeds.getFeedUrl('site-feed', { scheme: 'http', host: 'example.com' })
      const expected = 'http://example.com/feed'

      expect(value).toBe(expected)
    })

    it('should build the first template of a key whose placeholders the values fill', () => {
      const value = feeds.getFeedUrl('channel', { subdomain: 'alice' })
      const expected = 'https://alice.example.org/feed'

      expect(value).toBe(expected)
    })

    it('should return undefined when the values fill no template of a key', () => {
      const value = feeds.getFeedUrl('channel', {})

      expect(value).toBeUndefined()
    })

    it('should pick the template of the format', () => {
      const value = feeds.getFeedUrl('posts', { username: 'alice' }, 'atom')
      const expected = 'https://www.example.com/alice/feed.atom'

      expect(value).toBe(expected)
    })

    it('should throw for an unknown key', () => {
      // @ts-expect-error: A key the table does not hold fails the typecheck too.
      const throwing = () => feeds.getFeedUrl('unknown')

      expect(throwing).toThrow('No feed template for unknown')
    })

    it('should write a reserved character of the template as written', () => {
      const value = feeds.getFeedUrl('handle', { username: 'alice' })
      const expected = 'https://www.example.com/rss/@alice'

      expect(value).toBe(expected)
    })

    it('should return undefined for a placeholder with no value', () => {
      const value = feeds.getFeedUrl('posts')

      expect(value).toBeUndefined()
    })

    it('should write a root as given', () => {
      const value = { root: 'https://example.com' }
      const expected = 'https://example.com/latest.rss'

      expect(rootFeeds.getFeedUrl('latest', value)).toBe(expected)
    })

    it('should write a root with a base path unencoded', () => {
      const value = { root: 'https://example.com/forum' }
      const expected = 'https://example.com/forum/latest.rss'

      expect(rootFeeds.getFeedUrl('latest', value)).toBe(expected)
    })

    it('should drop the trailing slash of a root', () => {
      const value = { root: 'https://example.com/forum/' }
      const expected = 'https://example.com/forum/latest.rss'

      expect(rootFeeds.getFeedUrl('latest', value)).toBe(expected)
    })

    it('should return undefined for a root placeholder with no value', () => {
      const value = {}

      expect(rootFeeds.getFeedUrl('latest', value)).toBeUndefined()
    })

    it('should build the row without the placeholder whose value is undefined', () => {
      const value = {
        slug: 'news',
        id: undefined,
      }
      const expected = 'https://www.example.com/c/news.rss'

      expect(categoryFeeds.getFeedUrl('category', value)).toBe(expected)
    })

    it('should return undefined for a placeholder whose value is undefined', () => {
      const value = { username: undefined }

      expect(feeds.getFeedUrl('posts', value)).toBeUndefined()
    })

    it('should return undefined for an empty path segment', () => {
      const value = { username: '' }

      expect(feeds.getFeedUrl('posts', value)).toBeUndefined()
    })

    it('should return undefined for an empty host label', () => {
      const value = { username: '' }

      expect(feeds.getFeedUrl('blog', value)).toBeUndefined()
    })

    it('should build the row without the placeholder whose value is empty', () => {
      const value = {
        slug: 'news',
        id: '',
      }
      const expected = 'https://www.example.com/c/news.rss'

      expect(categoryFeeds.getFeedUrl('category', value)).toBe(expected)
    })

    it('should return undefined for an empty query value', () => {
      const value = {
        username: 'alice',
        page: '',
      }

      expect(feeds.getFeedUrl('page', value)).toBeUndefined()
    })
  })

  describe('getFeedEntry', () => {
    const labelled = definePlatformFeeds('plurk', [
      { key: 'plurks', main: 'https://www.example.com/{username}.xml' },
      { key: 'plurks', main: 'https://www.example.com/{username}.atom', format: 'atom' },
    ])

    it('should return the feed with its hint', () => {
      const value = labelled.getFeedEntry('plurks', { username: 'alice' })
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.xml',
        hint: { key: 'plurk:plurks', label: 'Plurks' },
      }

      expect(value).toEqual(expected)
    })

    it('should return undefined for a placeholder with no value', () => {
      const value = labelled.getFeedEntry('plurks', {})

      expect(value).toBeUndefined()
    })

    it('should return the feed of the format with the format in its hint', () => {
      const value = labelled.getFeedEntry('plurks', { username: 'alice' }, 'atom')
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.atom',
        hint: { key: 'plurk:plurks', label: 'Plurks', format: 'atom' },
      }

      expect(value).toEqual(expected)
    })
  })

  describe('getFeedSpellings', () => {
    const spellingFeeds = definePlatformFeeds('wordpress', [
      {
        key: 'posts',
        main: '{root}/feed/',
        aliases: ['{root}/?feed=rss', '{root}/feed/rss2/', '{root}/?feed=rss2'],
      },
      {
        key: 'posts',
        main: '{root}/feed/atom/',
        format: 'atom',
        aliases: ['{root}/?feed=atom'],
      },
      {
        key: 'category',
        main: '{root}/forums/{forum}/index.rss',
        aliases: ['{root}/f/{forum}/index.rss'],
      },
      { key: 'category', main: '{root}/forums/index.rss', aliases: ['{root}/f/index.rss'] },
      {
        key: 'tag',
        main: '{root}/feed/{id}/',
        aliases: ['{root}/index.php/feed/', '{root}/index.php/feed/{id}/'],
      },
      { key: 'author', main: '{root}/feed/{path*}/' },
    ])

    it('should return the main URL and its aliases in order', () => {
      const value = { root: 'https://example.com' }
      const expected: DiscoverUriEntry = {
        uri: [
          'https://example.com/feed/',
          'https://example.com/?feed=rss',
          'https://example.com/feed/rss2/',
          'https://example.com/?feed=rss2',
        ],
        hint: { key: 'wordpress:posts', label: 'Posts' },
      }

      expect(spellingFeeds.getFeedSpellings('posts', value)).toEqual(expected)
    })

    it('should return the rows of the format with the format in its hint', () => {
      const value = { root: 'https://example.com' }
      const expected: DiscoverUriEntry = {
        uri: ['https://example.com/feed/atom/', 'https://example.com/?feed=atom'],
        hint: { key: 'wordpress:posts', label: 'Posts', format: 'atom' },
      }

      expect(spellingFeeds.getFeedSpellings('posts', value, 'atom')).toEqual(expected)
    })

    it('should stop at the next feed of the key', () => {
      const value = {
        root: 'https://example.com',
        forum: 'news.2',
      }
      const expected: DiscoverUriEntry = {
        uri: [
          'https://example.com/forums/news.2/index.rss',
          'https://example.com/f/news.2/index.rss',
        ],
        hint: { key: 'wordpress:category', label: 'Category' },
      }

      expect(spellingFeeds.getFeedSpellings('category', value)).toEqual(expected)
    })

    it('should return the next feed when the values fill no row of the first', () => {
      const value = { root: 'https://example.com' }
      const expected: DiscoverUriEntry = {
        uri: ['https://example.com/forums/index.rss', 'https://example.com/f/index.rss'],
        hint: { key: 'wordpress:category', label: 'Category' },
      }

      expect(spellingFeeds.getFeedSpellings('category', value)).toEqual(expected)
    })

    it('should start at an alias when the values do not fill the main URL', () => {
      const value = { root: 'https://example.com' }
      const expected: DiscoverUriEntry = {
        uri: 'https://example.com/index.php/feed/',
        hint: { key: 'wordpress:tag', label: 'Tag' },
      }

      expect(spellingFeeds.getFeedSpellings('tag', value)).toEqual(expected)
    })

    it('should list every alias the values fill', () => {
      const value = {
        root: 'https://example.com',
        id: '13',
      }
      const expected: DiscoverUriEntry = {
        uri: [
          'https://example.com/feed/13/',
          'https://example.com/index.php/feed/',
          'https://example.com/index.php/feed/13/',
        ],
        hint: { key: 'wordpress:tag', label: 'Tag' },
      }

      expect(spellingFeeds.getFeedSpellings('tag', value)).toEqual(expected)
    })

    it('should return one spelling as a string', () => {
      const value = {
        root: 'https://example.com',
        path: 'archives/13',
      }
      const expected: DiscoverUriEntry = {
        uri: 'https://example.com/feed/archives/13/',
        hint: { key: 'wordpress:author', label: 'Author' },
      }

      expect(spellingFeeds.getFeedSpellings('author', value)).toEqual(expected)
    })

    it('should return undefined when the values fill no row of the key', () => {
      const value = { root: 'https://example.com' }

      expect(spellingFeeds.getFeedSpellings('author', value)).toBeUndefined()
    })

    it('should throw for an unknown key', () => {
      // @ts-expect-error: A key the table does not hold fails the typecheck too.
      const throwing = () => spellingFeeds.getFeedSpellings('unknown')

      expect(throwing).toThrow('No feed template for unknown')
    })
  })

  describe('getFeedHint', () => {
    it('should return the hint of a feed whose row names a format', () => {
      const value = 'https://example.com/alice/products.rdf'
      const expected: DiscoverUriHint = { key: 'youtube:shorts', label: 'Shorts', format: 'rdf' }

      expect(hintFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return the hint of a feed whose row names no format', () => {
      const value = 'https://example.com/alice/videos.xml'
      const expected: DiscoverUriHint = { key: 'youtube:videos', label: 'Videos' }

      expect(hintFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return the hint of the key for a feed on an alias', () => {
      const aliasFeeds = definePlatformFeeds('youtube', [
        {
          key: 'videos',
          main: 'https://feeds.example.com/{username}.xml',
          aliases: ['https://example.com/{username}/rss'],
        },
      ])
      const value = 'https://example.com/alice/rss'
      const expected: DiscoverUriHint = { key: 'youtube:videos', label: 'Videos' }

      expect(aliasFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return the key of a feed URL', () => {
      const value = 'https://www.example.com/alice/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed named by a query flag', () => {
      const value = 'https://www.example.com/-alice/?rss'
      const expected = 'example:profile'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed named by a query flag with an empty value', () => {
      const value = 'https://www.example.com/-alice/?rss='
      const expected = 'example:profile'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed whose template writes the flag with an empty value', () => {
      const value = 'https://www.example.com/members/alice?rss'
      const expected = 'example:member'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed named by a query flag beside a query value', () => {
      const value = 'https://www.example.com/pages/alice?page=2&rss='
      const expected = 'example:page'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a query flag with a value', () => {
      const value = 'https://www.example.com/-alice/?rss=1'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed with two values', () => {
      const value = 'https://www.example.com/alice/recipes.rss'
      const expected = 'example:board'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed named by its query', () => {
      const value = 'https://feeds.example.com/rss.xml?q=tag%3Acats'
      const expected = 'example:tag'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a percent-encoded non-ASCII query value', () => {
      const value = 'https://feeds.example.com/rss.xml?q=tag:%E6%8A%80%E8%A1%93'
      const expected = 'example:tag'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a raw non-ASCII query value', () => {
      const value = 'https://feeds.example.com/rss.xml?q=tag:技術'
      const expected = 'example:tag'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of the template with more query parameters first', () => {
      const value = 'https://feeds.example.com/rss.xml?type=item&q=by%3Aalice%20sort%3Atime'
      const expected = 'example:search'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant host', () => {
      const value = 'https://alice.example.org/feed'
      const expected = 'example:blog'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed on any listed host', () => {
      const value = 'https://example.com/feeds/site'
      const expected = 'example:site'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed under either scheme for a scheme placeholder', () => {
      const value = 'http://example.com/feed'
      const expected = 'example:site-feed'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant of a listed domain', () => {
      const value = 'https://meta.example.net/feeds/site'
      const expected = 'example:site'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a feed on a tenant with www of a listed domain', () => {
      const value = 'https://www.meta.example.net/feeds/site'

      expect(feeds.getFeedHint(value)).toBeUndefined()
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
        'example',
        [{ key: 'site', main: 'https://{host}/feeds/site' }],
        { hosts: { tenants: ['example.net'] }, isWwwTenant: true },
      )
      const value = 'https://www.example.net/feeds/site'
      const expected = 'example:site'
      const hint = wwwTenantHostFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a feed on a nested host of a listed domain', () => {
      const value = 'https://blog.meta.example.net/feeds/site'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed on a listed host under a listed domain', () => {
      const hostFeeds = definePlatformFeeds(
        'example',
        [{ key: 'site', main: 'https://{host}/feeds/site' }],
        { hosts: { exact: ['example.net'], tenants: ['example.net'] } },
      )
      const value = 'https://example.net/feeds/site'
      const expected = 'example:site'
      const hint = hostFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant host of a listed domain', () => {
      const value = 'https://alice.example.edu/journal/feed'
      const expected = 'example:journal'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a tenant host of another domain', () => {
      const value = 'https://alice.example.com/journal/feed'

      expect(feeds.getFeedHint(value)).toBeUndefined()
    })

    it('should ignore the scheme, www, a trailing slash and the case of a route word', () => {
      const value = 'http://example.com/alice/Feed.rss/'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a tenant named www as given with isWwwTenant', () => {
      const value = 'https://www.example.org/feed'
      const expected = 'example:journal'
      const hint = wwwTenantFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a feed on a tenant host with www with isWwwTenant', () => {
      const value = 'https://www.alice.example.org/feed'

      expect(wwwTenantFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed on a fixed host with www with isWwwTenant', () => {
      const value = 'https://www.example.com/alice/videos.xml'
      const expected = 'example:videos'
      const hint = wwwTenantFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a tenant row as given over an apex row with isWwwTenant', () => {
      const value = 'https://www.example.org/rss'
      const expected = 'example:blog'
      const hint = wwwTenantFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of an apex row for the apex host with isWwwTenant', () => {
      const value = 'https://example.org/rss'
      const expected = 'example:site'
      const hint = wwwTenantFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a tenant named www without isWwwTenant', () => {
      const value = 'https://www.example.org/feed'

      expect(wwwStrippedFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of an apex row for a www host without isWwwTenant', () => {
      const value = 'https://www.example.org/rss'
      const expected = 'example:site'
      const hint = wwwStrippedFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a feed on a tenant host with www without isWwwTenant', () => {
      const value = 'https://www.alice.example.org/feed'

      expect(wwwStrippedFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed on a tenant host with www with isWwwTenantPrefix', () => {
      const value = 'https://www.alice.example.org/feed'
      const expected = 'example:journal'
      const hint = wwwPrefixFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a tenant named www with isWwwTenantPrefix', () => {
      const value = 'https://www.example.org/feed'

      expect(wwwPrefixFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of an apex row for a www host with isWwwTenantPrefix', () => {
      const value = 'https://www.example.org/rss'
      const expected = 'example:site'
      const hint = wwwPrefixFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a feed on a tenant host with two www with isWwwTenantPrefix', () => {
      const value = 'https://www.www.alice.example.org/feed'

      expect(wwwPrefixFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed on a tenant with www of a domain with isWwwTenantPrefix', () => {
      const value = 'https://www.alice.example.net/feed'
      const expected = 'example:blog'
      const hint = wwwPrefixDomainFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed on a host with www of a domain with isWwwTenantPrefix', () => {
      const value = 'https://www.meta.example.net/feeds/site'
      const expected = 'example:site'
      const hint = wwwPrefixDomainFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return undefined for a feed on www of a domain with isWwwTenantPrefix', () => {
      const value = 'https://www.example.net/feeds/site'

      expect(wwwPrefixDomainFeeds.getFeedHint(value)).toBeUndefined()
    })

    it('should return the key of a feed with a doubled slash after the host', () => {
      const value = 'https://www.example.com//alice/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed on a tenant with a doubled slash after the host', () => {
      const value = 'https://meta.example.net//feeds/site'
      const expected = 'example:site'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a root feed with a doubled slash after the host', () => {
      const value = 'https://example.com//latest.rss'
      const expected = 'example:latest'
      const hint = rootFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should ignore the query order and extra parameters', () => {
      const value =
        'https://feeds.example.com/rss.xml?utm_source=x&q=by%3Aalice%20sort%3Atime&type=item'
      const expected = 'example:search'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should match an at sign of the template against its percent-encoded form', () => {
      const value = 'https://www.example.com/rss/%40alice'
      const expected = 'example:handle'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should match an at sign of the template as written', () => {
      const value = 'https://www.example.com/rss/@alice'
      const expected = 'example:handle'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should match a percent-encoded character of the template in lower case', () => {
      const value = 'https://www.example.com/topics/tag%3acats/feed'
      const expected = 'example:topic'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should match a percent-encoded character of the template in upper case', () => {
      const value = 'https://www.example.com/topics/tag%3Acats/feed'
      const expected = 'example:topic'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should match a template written with a percent-encoded character as written', () => {
      const value = 'https://www.example.com/rss/@alice'
      const expected = 'example:handle'
      const hint = encodedFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should match a template written with a percent-encoded character percent-encoded', () => {
      const value = 'https://www.example.com/rss/%40alice'
      const expected = 'example:handle'
      const hint = encodedFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a raw non-ASCII path value', () => {
      const value = 'https://www.example.com/技術/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a percent-encoded non-ASCII path value', () => {
      const value = 'https://www.example.com/%E6%8A%80%E8%A1%93/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a raw percent sign in a path value', () => {
      const value = 'https://www.example.com/100%off/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a percent-encoded percent sign in a path value', () => {
      const value = 'https://www.example.com/100%25off/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed built from an encoded value', () => {
      const value = feeds.getFeedUrl('posts', { username: 'c#' }) as string
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should keep an encoded slash inside one segment', () => {
      const value = 'https://www.example.com/alice%2Fbob/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
    })

    it('should return the key of a feed with a malformed percent sequence', () => {
      const value = 'https://www.example.com/%E0%A4/feed.rss'
      const expected = 'example:posts'
      const hint = feeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
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
      const hint = encodedFeeds.getFeedHint(value)

      expect(hint?.key).toBe(expected)
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
        const hint = domainPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed on a plain domain beside the pattern', () => {
        const value = 'https://alice.example.net/feed'
        const expected = 'example:blog'
        const hint = domainPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a feed with www before the tenant', () => {
        const value = 'https://www.alice.example.de/feed'

        expect(domainPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a feed on a port', () => {
        const value = 'https://alice.example.de:8080/feed'
        const expected = 'example:blog'
        const hint = domainPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a host feed on a tenant', () => {
        const value = 'https://alice.example.co.uk/feeds/site'
        const expected = 'example:site'
        const hint = domainPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
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
        const wwwTenantPatternFeeds = definePlatformFeeds('example', domainPatternTemplates, {
          ...domainPatternOptions,
          isWwwTenant: true,
        })
        const value = 'https://www.example.de/feed'
        const expected = 'example:blog'
        const hint = wwwTenantPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
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

    describe('with a host pattern', () => {
      it('should return the key of a feed on a host the pattern matches', () => {
        const value = 'https://example.co.uk/-alice/feed'
        const expected = 'example:profile'
        const hint = hostPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed on a plain host beside the pattern', () => {
        const value = 'https://example.org/-alice/feed'
        const expected = 'example:profile'
        const hint = hostPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed on www before a host the pattern matches', () => {
        const value = 'https://www.example.de/-alice/feed'
        const expected = 'example:profile'
        const hint = hostPatternFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a suffix outside the pattern', () => {
        const value = 'https://example.info/-alice/feed'

        expect(hostPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a subdomain of a host the pattern matches', () => {
        const value = 'https://alice.example.de/-alice/feed'

        expect(hostPatternFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a matching host inside another host', () => {
        const value = 'https://example.de.example.net/-alice/feed'

        expect(hostPatternFeeds.getFeedHint(value)).toBeUndefined()
      })
    })

    describe('with a root', () => {
      it('should return the key of a feed on a listed host', () => {
        const value = 'https://example.com/latest.rss'
        const expected = 'example:latest'
        const hint = rootFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a feed under a base path', () => {
        const value = 'https://example.com/forum/latest.rss'

        expect(rootFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a feed under a base path on a tenant', () => {
        const value = 'https://alice.example.net/forum/latest.rss'

        expect(rootFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a feed on a tenant with a port', () => {
        const value = 'https://alice.example.net:8080/latest.rss'
        const expected = 'example:latest'
        const hint = rootFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed on a tenant of a listed domain', () => {
        const value = 'https://alice.example.net/latest.rss'
        const expected = 'example:latest'
        const hint = rootFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed named by its query', () => {
        const value = 'https://alice.example.net/search.rss?q=rss'
        const expected = 'example:search'
        const hint = rootFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
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
      'ocnk',
      [
        { key: 'posts', main: '{scheme}://{blog}.{domain}/feed' },
        { key: 'products', main: '{scheme}://{host}/feed' },
      ],
      { hosts: { tenants: ['example.net', 'example.org'] } },
    )

    it('should fill the scheme of an http page', () => {
      const value = 'http://alice.example.net/about'
      const expected = 'http://alice.example.net/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', { blog: 'alice' })).toBe(expected)
    })

    it('should fill the scheme of an https page', () => {
      const value = 'https://alice.example.net/about'
      const expected = 'https://alice.example.net/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', { blog: 'alice' })).toBe(expected)
    })

    it('should fill the host of the page', () => {
      const value = 'https://www.example.com/about'
      const expected = 'https://www.example.com/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('products')).toBe(expected)
    })

    it('should keep the port in the host of the page', () => {
      const value = 'http://example.com:8080/about'
      const expected = 'http://example.com:8080/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('products')).toBe(expected)
    })

    it('should fill the domain the host of the page is under', () => {
      const value = 'https://alice.example.org/about'
      const expected = 'https://alice.example.org/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', { blog: 'alice' })).toBe(expected)
    })

    it('should fill the domain under a tenant with a dot', () => {
      const value = 'https://my.blog.example.org/'
      const params = { blog: 'my.blog' }
      const expected = 'https://my.blog.example.org/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', params)).toBe(expected)
    })

    it('should fill the domain a pattern matches', () => {
      const value = 'https://alice.example.co.uk/about'
      const params = { username: 'alice' }
      const expected = 'https://alice.example.co.uk/feed'
      const pageFeeds = domainPatternFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('blog', params)).toBe(expected)
    })

    it('should fill the domain a pattern matches under a nested host', () => {
      const value = 'https://my.blog.example.de/'
      const params = { username: 'my.blog' }
      const expected = 'https://my.blog.example.de/feed'
      const pageFeeds = domainPatternFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('blog', params)).toBe(expected)
    })

    it('should return undefined for the domain placeholder on the apex of a pattern', () => {
      const value = 'https://example.de/'
      const params = { username: 'alice' }
      const pageFeeds = domainPatternFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('blog', params)).toBeUndefined()
    })

    it('should return undefined for the domain placeholder on a host under no domain', () => {
      const value = 'https://alice.example.com/'
      const params = { blog: 'alice' }
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', params)).toBeUndefined()
    })

    it('should write a value the handler passes over the one of the page', () => {
      const value = 'https://alice.example.net/'
      const params = {
        scheme: 'http',
        blog: 'alice',
      }
      const expected = 'http://alice.example.net/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', params)).toBe(expected)
    })

    it('should keep the value of the page over an undefined value the handler passes', () => {
      const value = 'http://alice.example.net/about'
      const params = {
        scheme: undefined,
        blog: 'alice',
      }
      const expected = 'http://alice.example.net/feed'
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('posts', params)).toBe(expected)
    })

    it('should return the feed with its hint', () => {
      const value = 'https://www.example.com/'
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/feed',
        hint: { key: 'ocnk:products', label: 'Products' },
      }
      const pageFeeds = siteFeeds.forUrl(value)

      expect(pageFeeds?.getFeedEntry('products')).toEqual(expected)
    })

    it('should return every spelling of the feed with its hint', () => {
      const spellingFeeds = definePlatformFeeds('typecho', [
        { key: 'posts', main: '{root}/feed/', aliases: ['{root}/index.php/feed/'] },
      ])
      const value = 'https://example.com/archives/13/'
      const expected: DiscoverUriEntry = {
        uri: ['https://example.com/feed/', 'https://example.com/index.php/feed/'],
        hint: { key: 'typecho:posts', label: 'Posts' },
      }
      const pageFeeds = spellingFeeds.forUrl(value)

      expect(pageFeeds?.getFeedSpellings('posts')).toEqual(expected)
    })

    it('should fill the root with the origin of the page', () => {
      const value = 'https://example.com/forum/t/1'
      const expected = 'https://example.com/latest.rss'
      const pageFeeds = rootFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('latest')).toBe(expected)
    })

    it('should keep the port in the root of the page', () => {
      const value = 'http://example.com:8080/about'
      const expected = 'http://example.com:8080/latest.rss'
      const pageFeeds = rootFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('latest')).toBe(expected)
    })

    it('should write a root with a base path the handler passes', () => {
      const value = 'https://example.com/forum/t/1'
      const params = { root: 'https://example.com/forum' }
      const expected = 'https://example.com/forum/latest.rss'
      const pageFeeds = rootFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('latest', params)).toBe(expected)
    })

    it('should fill the root on a table without hosts', () => {
      const value = 'https://example.org/forum/t/1'
      const expected = 'https://example.org/latest.rss'
      const pageFeeds = selfHostedRootFeeds.forUrl(value)

      expect(pageFeeds?.getFeedUrl('latest')).toBe(expected)
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

  describe('with a passed query', () => {
    describe('getFeedUrl', () => {
      it('should write the passed query in place of the placeholder', () => {
        const value = {
          root: 'https://example.com',
          query: 'option=com_content&view=category&id=12',
        }
        const expected =
          'https://example.com/index.php?format=feed&id=12&option=com_content&type=rss&view=category'

        expect(passedQueryFeeds.getFeedUrl('view', value)).toBe(expected)
      })

      it('should write the passed query after the parameters before it', () => {
        const value = {
          root: 'https://example.com',
          query: 'keywords=nurse',
        }
        const expected = 'https://example.com/jobs/feed?keywords=nurse&sort=date'

        expect(passedQueryFeeds.getFeedUrl('search', value)).toBe(expected)
      })

      it('should drop the question mark in front of the passed query', () => {
        const value = {
          root: 'https://example.com',
          query: '?blog=2',
        }
        const expected = 'https://example.com/index.php?blog=2&tempskin=_rss2'

        expect(passedQueryFeeds.getFeedUrl('posts', value)).toBe(expected)
      })

      it('should drop a parameter of the passed query the row sets itself', () => {
        const value = {
          root: 'https://example.com',
          query: 'option=com_content&format=html',
        }
        const expected = 'https://example.com/index.php?format=feed&option=com_content&type=rss'

        expect(passedQueryFeeds.getFeedUrl('view', value)).toBe(expected)
      })

      it('should drop a parameter the row sets itself in another case', () => {
        const value = {
          root: 'https://example.com',
          query: 'option=com_content&Format=html',
        }
        const expected = 'https://example.com/index.php?format=feed&option=com_content&type=rss'

        expect(passedQueryFeeds.getFeedUrl('view', value)).toBe(expected)
      })

      it('should drop an empty parameter of the passed query', () => {
        const value = {
          root: 'https://example.com',
          query: 'blog=2&&page=3&',
        }
        const expected = 'https://example.com/index.php?blog=2&page=3&tempskin=_rss2'

        expect(passedQueryFeeds.getFeedUrl('posts', value)).toBe(expected)
      })

      it('should write the passed query as given', () => {
        const value = {
          root: 'https://example.com',
          query: 'keywords=caf%C3%A9+nurse&where=a:b',
        }
        const expected =
          'https://example.com/jobs/feed?keywords=caf%C3%A9+nurse&sort=date&where=a:b'

        expect(passedQueryFeeds.getFeedUrl('search', value)).toBe(expected)
      })

      it('should percent-encode a non-ASCII character of the passed query', () => {
        const value = {
          root: 'https://example.com',
          query: 'keywords=技術',
        }
        const expected = 'https://example.com/jobs/feed?keywords=%E6%8A%80%E8%A1%93&sort=date'

        expect(passedQueryFeeds.getFeedUrl('search', value)).toBe(expected)
      })

      it('should write the parameters of the row alone for an empty passed query', () => {
        const value = {
          root: 'https://example.com',
          query: '',
        }
        const expected = 'https://example.com/index.php?format=feed&type=rss'

        expect(passedQueryFeeds.getFeedUrl('view', value)).toBe(expected)
      })

      it('should return undefined for a passed query with no value', () => {
        const value = { root: 'https://example.com' }

        expect(passedQueryFeeds.getFeedUrl('view', value)).toBeUndefined()
      })
    })

    describe('getFeedHint', () => {
      it('should return the key of a feed with a passed query', () => {
        const value =
          'https://example.com/index.php?option=com_content&view=category&id=12&format=feed&type=rss'
        const expected = 'example:view'
        const hint = passedQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed without the parameters of a passed query', () => {
        const value = 'https://example.com/index.php?format=feed&type=rss'
        const expected = 'example:view'
        const hint = passedQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should not count a passed query as a parameter of the row', () => {
        const value = 'https://example.com/index.php?format=feed&type=atom'
        const expected = 'example:site'
        const hint = passedQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a feed missing a parameter of the row', () => {
        const value = 'https://example.com/index.php?option=com_content&format=feed'

        expect(passedQueryFeeds.getFeedHint(value)).toBeUndefined()
      })
    })
  })

  describe('with a repeated query parameter', () => {
    describe('getFeedUrl', () => {
      it('should write every value of the parameter in table order', () => {
        const value = {
          host: 'example.com',
          space: 'DOC',
        }
        const expected =
          'https://example.com/createrssfeed.action?spaces=DOC&types=page&types=blogpost&types=comment'

        expect(repeatedQueryFeeds.getFeedUrl('space', value)).toBe(expected)
      })
    })

    describe('getFeedHint', () => {
      it('should return the key of a feed with every value of the parameter', () => {
        const value =
          'https://example.com/createrssfeed.action?types=page&types=blogpost&types=comment&spaces=DOC'
        const expected = 'confluence:space'
        const hint = repeatedQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed with the values in another order', () => {
        const value =
          'https://example.com/createrssfeed.action?spaces=DOC&types=comment&types=page&types=blogpost'
        const expected = 'confluence:space'
        const hint = repeatedQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed with a value the row does not list', () => {
        const value =
          'https://example.com/createrssfeed.action?types=page&types=blogpost&types=comment&types=attachment&spaces=DOC'
        const expected = 'confluence:space'
        const hint = repeatedQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a feed missing a value of the parameter', () => {
        const value =
          'https://example.com/createrssfeed.action?types=page&types=blogpost&spaces=DOC'

        expect(repeatedQueryFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should read the first value of a parameter the row lists once', () => {
        const value =
          'https://example.com/createrssfeed.action?types=blogpost&types=page&spaces=conf_all'

        expect(repeatedQueryFeeds.getFeedHint(value)).toBeUndefined()
      })
    })
  })

  describe('with form query encoding', () => {
    describe('getFeedUrl', () => {
      it('should encode a query value as URLSearchParams does', () => {
        const value = {
          root: 'https://example.com',
          title: 'Talk:Main Page',
        }
        const expected =
          'https://example.com/index.php?action=history&feed=atom&title=Talk%3AMain+Page'

        expect(formQueryFeeds.getFeedUrl('history', value)).toBe(expected)
      })

      it('should encode the text of the template in a query value', () => {
        const value = {
          root: 'https://example.com',
          query: '',
        }
        const expected = 'https://example.com/index.php?feed=atom&title=Special%3ARecentChanges'

        expect(formQueryFeeds.getFeedUrl('recent-changes', value)).toBe(expected)
      })

      it('should percent-encode a non-ASCII query value', () => {
        const value = {
          root: 'https://example.com',
          title: '技術',
        }
        const expected =
          'https://example.com/index.php?action=history&feed=atom&title=%E6%8A%80%E8%A1%93'

        expect(formQueryFeeds.getFeedUrl('history', value)).toBe(expected)
      })

      it('should return undefined for an empty value', () => {
        const value = {
          root: 'https://example.com',
          title: '',
        }

        expect(formQueryFeeds.getFeedUrl('history', value)).toBeUndefined()
      })

      it('should write a query flag with no value', () => {
        const value = {
          root: 'https://example.com',
          title: 'User:Alice',
        }
        const expected = 'https://example.com/index.php?rss&title=User%3AAlice'

        expect(formQueryFeeds.getFeedUrl('profile', value)).toBe(expected)
      })

      it('should write a passed query as given', () => {
        const value = {
          root: 'https://example.com',
          query: 'days=7&namespace=0:1',
        }
        const expected =
          'https://example.com/index.php?days=7&feed=atom&namespace=0:1&title=Special%3ARecentChanges'

        expect(formQueryFeeds.getFeedUrl('recent-changes', value)).toBe(expected)
      })

      it('should escape only the structure in a row without the form option', () => {
        const value = {
          root: 'https://example.com',
          terms: 'by:alice sort:time',
        }
        const expected = 'https://example.com/search?feed=atom&q=by:alice%20sort:time'

        expect(formQueryFeeds.getFeedUrl('search', value)).toBe(expected)
      })
    })

    describe('getFeedHint', () => {
      it('should return the key of a feed with a form-encoded value', () => {
        const value = 'https://example.com/index.php?title=Special%3ARecentChanges&feed=atom'
        const expected = 'mediawiki:recent-changes'
        const hint = formQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed with the value as written', () => {
        const value = 'https://example.com/index.php?title=Special:RecentChanges&feed=atom'
        const expected = 'mediawiki:recent-changes'
        const hint = formQueryFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })
    })
  })

  describe('with a multi-segment placeholder', () => {
    describe('getFeedUrl', () => {
      it('should write one segment', () => {
        const value = { path: 'docs' }
        const expected = 'https://www.example.com/docs/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should write two segments with the slash kept', () => {
        const value = { path: 'docs/api' }
        const expected = 'https://www.example.com/docs/api/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should write four segments with the slashes kept', () => {
        const value = { path: 'docs/api/v2/guides' }
        const expected = 'https://www.example.com/docs/api/v2/guides/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should encode each segment', () => {
        const value = { path: 'docs/c# notes' }
        const expected = 'https://www.example.com/docs/c%23%20notes/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should write a percent-encoded segment as given', () => {
        const value = { path: 'docs/%40alice' }
        const expected = 'https://www.example.com/docs/%40alice/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should return undefined for an empty value', () => {
        const value = { path: '' }

        expect(pathFeeds.getFeedUrl('folder', value)).toBeUndefined()
      })

      it('should return undefined for a value of slashes only', () => {
        const value = { path: '//' }

        expect(pathFeeds.getFeedUrl('folder', value)).toBeUndefined()
      })

      it('should write a value with an empty segment without it', () => {
        const value = { path: 'archives//13' }
        const expected = 'https://www.example.com/archives/13/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should write a value with a leading and a trailing slash without them', () => {
        const value = { path: '/archives/13/' }
        const expected = 'https://www.example.com/archives/13/feed'

        expect(pathFeeds.getFeedUrl('folder', value)).toBe(expected)
      })

      it('should build the first row of a key for a value with an empty segment', () => {
        const value = { directory: 'archives//13' }
        const expected = 'https://www.example.com/feed/archives/13/'

        expect(directoryFeeds.getFeedUrl('page', value)).toBe(expected)
      })

      it('should build the row after it for an empty value', () => {
        const value = {
          directory: '',
          path: 'archives/13.html',
        }
        const expected = 'https://www.example.com/feed/archives/13.html'

        expect(directoryFeeds.getFeedUrl('page', value)).toBe(expected)
      })

      it('should write the query of a query row', () => {
        const value = {
          path: 'news/local',
          query: 'jobs',
        }
        const expected = 'https://www.example.com/c/news/local.rss?q=jobs'

        expect(pathFeeds.getFeedUrl('search', value)).toBe(expected)
      })

      it('should return the feed with its hint', () => {
        const value = pathFeeds.getFeedEntry('category', { path: 'news/local' })
        const expected: DiscoverUriEntry = {
          uri: 'https://www.example.com/c/news/local.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        }

        expect(value).toEqual(expected)
      })
    })

    describe('getFeedHint', () => {
      it('should return the key of a feed with one segment', () => {
        const value = 'https://www.example.com/docs/feed'
        const expected = 'discourse:folder'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed with two segments', () => {
        const value = 'https://www.example.com/docs/api/feed'
        const expected = 'discourse:folder'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed with four segments', () => {
        const value = 'https://www.example.com/docs/api/v2/guides/feed'
        const expected = 'discourse:folder'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a feed with an encoded character in a segment', () => {
        const value = 'https://www.example.com/docs/c%23%20notes/feed'
        const expected = 'discourse:folder'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a feed with no segment', () => {
        const value = 'https://www.example.com/feed'

        expect(pathFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a feed with an empty segment', () => {
        const value = 'https://www.example.com/docs//api/feed'

        expect(pathFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a row before it', () => {
        const value = 'https://www.example.com/t/news/feed'
        const expected = 'discourse:tag'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a row after it with more query parameters', () => {
        const value = 'https://www.example.com/c/news/local.rss?q=jobs'
        const expected = 'discourse:search'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a row without the query', () => {
        const value = 'https://www.example.com/c/news/local.rss'
        const expected = 'discourse:category'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return the key of a root row on a port', () => {
        const value = 'http://example.com:8080/site/docs/api.rss'
        const expected = 'discourse:site'
        const hint = pathFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })
    })

    describe('forUrl', () => {
      it('should write the segments under the root of the page', () => {
        const value = 'https://example.com/site/docs/api'
        const params = { path: 'docs/api' }
        const expected = 'https://example.com/site/docs/api.rss'
        const pageFeeds = pathFeeds.forUrl(value)

        expect(pageFeeds?.getFeedUrl('site', params)).toBe(expected)
      })

      it('should keep the port of the page', () => {
        const value = 'http://example.com:8080/site/docs/api'
        const params = { path: 'docs/api' }
        const expected = 'http://example.com:8080/site/docs/api.rss'
        const pageFeeds = pathFeeds.forUrl(value)

        expect(pageFeeds?.getFeedUrl('site', params)).toBe(expected)
      })
    })
  })

  describe('with value checks', () => {
    describe('getFeedUrl', () => {
      it('should write a row whose value passes its check', () => {
        const value = {
          locale: 'fr',
          handle: 'news',
        }
        const expected = 'https://www.example.com/fr/blogs/news.atom'

        expect(checkedFeeds.getFeedUrl('blog', value)).toBe(expected)
      })

      it('should write the next row of the key for a value its check refuses', () => {
        const value = {
          locale: 'abcd',
          handle: 'news',
        }
        const expected = 'https://www.example.com/blogs/news.atom'

        expect(checkedFeeds.getFeedUrl('blog', value)).toBe(expected)
      })

      it('should write the next row of the key for a query value its check refuses', () => {
        const value = { locale: 'abcd' }
        const expected = 'https://www.example.com/community.atom'

        expect(checkedFeeds.getFeedUrl('community', value)).toBe(expected)
      })

      it('should return undefined for a tenant label its check refuses', () => {
        const value = {
          country: 'usa',
          username: 'alice',
        }

        expect(checkedFeeds.getFeedUrl('country', value)).toBeUndefined()
      })

      it('should check a multi-segment value under its bare name', () => {
        const value = {
          locale: 'abcd',
          path: 'api/v2',
        }

        expect(checkedFeeds.getFeedUrl('docs', value)).toBeUndefined()
      })
    })

    describe('getFeedSpellings', () => {
      it('should skip a row whose value its check refuses', () => {
        const value = {
          locale: 'abcd',
          handle: 'news',
        }
        const expected = 'https://www.example.com/blogs/news.atom'
        const entry = checkedFeeds.getFeedSpellings('blog', value)

        expect(entry?.uri).toBe(expected)
      })
    })

    describe('getFeedHint', () => {
      it('should return the key of a feed whose path value passes its check', () => {
        const value = 'https://www.example.com/fr/blogs/news.atom'
        const expected = 'example:blog'
        const hint = checkedFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a feed whose path value its check refuses', () => {
        const value = 'https://www.example.com/abcd/blogs/news.atom'

        expect(checkedFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return undefined for a route segment in the place of a checked value', () => {
        const value = 'https://www.example.com/collections/blogs/news.atom'

        expect(checkedFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a feed whose query value passes its check', () => {
        const value = 'https://www.example.com/community.atom?lang=pt-BR'
        const expected = 'example:community'
        const hint = checkedFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a query value its check refuses', () => {
        const value = 'https://www.example.com/community.atom?lang=abcd'

        expect(checkedFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a feed without the checked query', () => {
        const value = 'https://www.example.com/community.atom'
        const expected = 'example:community'
        const hint = checkedFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a multi-segment feed whose other value its check refuses', () => {
        const value = 'https://www.example.com/abcd/docs/api/v2.rss'

        expect(checkedFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a feed whose tenant label passes its check', () => {
        const value = 'https://uk.example.net/alice.rss'
        const expected = 'example:country'
        const hint = checkedFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a tenant label its check refuses', () => {
        const value = 'https://usa.example.net/alice.rss'

        expect(checkedFeeds.getFeedHint(value)).toBeUndefined()
      })

      it('should return the key of a feed whose host passes its check', () => {
        const value = 'https://uk.example.org/site.rss'
        const expected = 'example:site'
        const hint = checkedFeeds.getFeedHint(value)

        expect(hint?.key).toBe(expected)
      })

      it('should return undefined for a host its check refuses', () => {
        const value = 'https://example.org/site.rss'

        expect(checkedFeeds.getFeedHint(value)).toBeUndefined()
      })
    })
  })
})
