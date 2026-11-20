import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseWpengineUrl, type WpengineUrl, wpengineHandler } from './wpengine.js'

describe('parseWpengineUrl', () => {
  it('should return the archive for a tag page', () => {
    const expected: WpengineUrl = { kind: 'archive', path: '/tag/news', hintKey: 'wordpress:tag' }

    expect(parseWpengineUrl('https://example.wpenginepowered.com/tag/news/')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: WpengineUrl = { kind: 'home' }

    expect(parseWpengineUrl('https://example.wpengine.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseWpengineUrl('https://example.wordpress.com/')).toBeUndefined()
  })
})

describe('wpengineHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.wpenginepowered.com'],
      [false, 'https://blog.example.wpenginepowered.com'],
      [true, 'https://example.wpengine.com'],
      [false, 'https://blog.example.wpengine.com'],
      [false, 'https://wpenginepowered.com'],
      [false, 'https://www.wpenginepowered.com'],
      [false, 'https://wpengine.com'],
      [false, 'https://www.wpengine.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(wpengineHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(wpengineHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside WP Engine', () => {
      expect(wpengineHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URLs for blog', () => {
      const value = 'https://example.wpenginepowered.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for legacy domain', () => {
      const value = 'https://example.wpengine.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpengine.com/feed/',
            'https://example.wpengine.com/?feed=rss',
            'https://example.wpengine.com/feed/rss2/',
            'https://example.wpengine.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/atom/',
            'https://example.wpengine.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: ['https://example.wpengine.com/feed/rdf/', 'https://example.wpengine.com/?feed=rdf'],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/',
            'https://example.wpengine.com/comments/feed/rss2/',
            'https://example.wpengine.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/atom/',
            'https://example.wpengine.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include category feed when on category page', () => {
      const value = 'https://example.wpenginepowered.com/category/tech/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/category/tech/feed/',
            'https://example.wpenginepowered.com/category/tech/?feed=rss',
            'https://example.wpenginepowered.com/category/tech/feed/rss2/',
            'https://example.wpenginepowered.com/category/tech/?feed=rss2',
          ],
          hint: { key: 'wordpress:category', label: 'Category', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/category/tech/feed/atom/',
            'https://example.wpenginepowered.com/category/tech/?feed=atom',
          ],
          hint: { key: 'wordpress:category', label: 'Category', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/category/tech/feed/rdf/',
            'https://example.wpenginepowered.com/category/tech/?feed=rdf',
          ],
          hint: { key: 'wordpress:category', label: 'Category', format: 'rdf' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include post comments feeds for post URLs', () => {
      const value = 'https://example.wpengine.com/2024/06/hello-world/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpengine.com/2024/06/hello-world/feed/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=rss',
            'https://example.wpengine.com/2024/06/hello-world/feed/rss2/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=rss2',
          ],
          hint: { key: 'wordpress:post-comments', label: 'Post comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpengine.com/2024/06/hello-world/feed/atom/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=atom',
          ],
          hint: { key: 'wordpress:post-comments', label: 'Post comments', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/',
            'https://example.wpengine.com/?feed=rss',
            'https://example.wpengine.com/feed/rss2/',
            'https://example.wpengine.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/atom/',
            'https://example.wpengine.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: ['https://example.wpengine.com/feed/rdf/', 'https://example.wpengine.com/?feed=rdf'],
          hint: { key: 'wordpress:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/',
            'https://example.wpengine.com/comments/feed/rss2/',
            'https://example.wpengine.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/atom/',
            'https://example.wpengine.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for the site feed', () => {
      const value = 'https://example.wpenginepowered.com/feed/'
      const expected: DiscoverUriHint = { key: 'wordpress:posts', label: 'Posts', format: 'rss' }

      expect(wpengineHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag Atom feed on the legacy domain', () => {
      const value = 'https://example.wpengine.com/tag/news/feed/atom/'
      const expected: DiscoverUriHint = { key: 'wordpress:tag', label: 'Tag', format: 'atom' }

      expect(wpengineHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the post comments hint for a post feed query', () => {
      const value = 'https://example.wpenginepowered.com/2024/05/01/hello/?feed=rss'
      const expected: DiscoverUriHint = {
        key: 'wordpress:post-comments',
        label: 'Post comments',
        format: 'rss',
      }

      expect(wpengineHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a plugin feed under the feed path', () => {
      const value = 'https://example.wpengine.com/feed/podcast/'

      expect(wpengineHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www subdomain', () => {
      const value = 'https://www.example.wpengine.com/feed/'

      expect(wpengineHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.wordpress.com/feed/'

      expect(wpengineHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.wpenginepowered.com/feed/',
        { key: 'wordpress:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.wpengine.com/tag/news/feed/atom/',
        { key: 'wordpress:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://example.wpenginepowered.com/2024/05/01/hello/?feed=rss',
        { key: 'wordpress:post-comments', label: 'Post comments', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [wpengineHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
