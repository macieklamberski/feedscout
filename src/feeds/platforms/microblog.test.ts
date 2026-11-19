import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { MicroblogUrl } from './microblog.js'
import { microblogHandler, parseMicroblogUrl } from './microblog.js'

describe('parseMicroblogUrl', () => {
  it('should return the user for a blog subdomain', () => {
    const expected: MicroblogUrl = { kind: 'blog', username: 'example' }

    expect(parseMicroblogUrl('https://example.micro.blog')).toEqual(expected)
  })

  it('should return the user for a post on a blog subdomain', () => {
    const value = 'https://example.micro.blog/2026/09/24/hello.html'
    const expected: MicroblogUrl = { kind: 'blog', username: 'example' }

    expect(parseMicroblogUrl(value)).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const value = 'https://example.micro.blog/categories/Tech/'
    const expected: MicroblogUrl = { kind: 'category', username: 'example', category: 'Tech' }

    expect(parseMicroblogUrl(value)).toEqual(expected)
  })

  it('should return the archive for an archive page', () => {
    const expected: MicroblogUrl = { kind: 'archive', username: 'example' }

    expect(parseMicroblogUrl('https://example.micro.blog/archive/')).toEqual(expected)
  })

  it('should return the photos for a photos page', () => {
    const expected: MicroblogUrl = { kind: 'photos', username: 'example' }

    expect(parseMicroblogUrl('https://example.micro.blog/photos')).toEqual(expected)
  })

  it('should return the blog for a replies page', () => {
    const expected: MicroblogUrl = { kind: 'blog', username: 'example' }

    expect(parseMicroblogUrl('https://example.micro.blog/replies/')).toEqual(expected)
  })

  it('should return undefined for the micro.blog apex', () => {
    expect(parseMicroblogUrl('https://micro.blog/example')).toBeUndefined()
  })

  it('should return undefined for www.micro.blog', () => {
    expect(parseMicroblogUrl('https://www.micro.blog')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseMicroblogUrl('https://blog.example.micro.blog')).toBeUndefined()
  })

  it('should return undefined for a lookalike host', () => {
    expect(parseMicroblogUrl('https://example.notmicro.blog')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMicroblogUrl('https://example.com')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseMicroblogUrl('not-a-url')).toBeUndefined()
  })
})

describe('microblogHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      const value = 'https://alice.micro.blog/'

      expect(microblogHandler.match(value)).toBe(true)
    })

    it('should not match the micro.blog apex', () => {
      const value = 'https://micro.blog/alice'

      expect(microblogHandler.match(value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Micro.blog', () => {
      expect(microblogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the category feed for a capitalized categories segment', () => {
      const value = 'https://example.micro.blog/Categories/test'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/categories/test/feed.xml',
          hint: { key: 'microblog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/categories/test/feed.json',
          hint: { key: 'microblog:category', label: 'Category', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS, JSON, and podcast feeds for blog', () => {
      const value = 'https://example.micro.blog'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feeds for category page', () => {
      const value = 'https://example.micro.blog/categories/test'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/categories/test/feed.xml',
          hint: { key: 'microblog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/categories/test/feed.json',
          hint: { key: 'microblog:category', label: 'Category', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of a capitalized category', () => {
      const value = 'https://example.micro.blog/categories/Tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/categories/Tech/feed.xml',
          hint: { key: 'microblog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/categories/Tech/feed.json',
          hint: { key: 'microblog:category', label: 'Category', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return archive feed for archive page', () => {
      const value = 'https://example.micro.blog/archive'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feeds for a sibling path of the archive page', () => {
      const value = 'https://example.micro.blog/archive_months.css'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return photos feed for photos page', () => {
      const value = 'https://example.micro.blog/photos'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feeds for a replies page', () => {
      const value = 'https://example.micro.blog/replies'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    const capitalizedSectionValues: Array<[string, DiscoverUriEntry, DiscoverUriEntry]> = [
      [
        'https://example.micro.blog/Archive',
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ],
      [
        'https://example.micro.blog/Photos',
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
      ],
    ]

    it.each(capitalizedSectionValues)(
      'should return the section feed for %s',
      (value, sectionFeed, otherSectionFeed) => {
        const expected: Array<DiscoverUriEntry> = [
          sectionFeed,
          {
            uri: 'https://example.micro.blog/feed.xml',
            hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
          },
          {
            uri: 'https://example.micro.blog/feed.json',
            hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
          },
          {
            uri: 'https://example.micro.blog/podcast.xml',
            hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
          },
          {
            uri: 'https://example.micro.blog/podcast.json',
            hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
          },
          otherSectionFeed,
        ]

        expect(microblogHandler.resolve(value)).toEqual(expected)
      },
    )

    it('should return feed URLs regardless of path', () => {
      const value = 'https://example.micro.blog/2024/01/01/some-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://example.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds under the page scheme for an http blog page', () => {
      const value = 'http://alice.micro.blog/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'http://alice.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'http://alice.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'http://alice.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'http://alice.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts key for a replies feed', () => {
      const value = 'https://frank.micro.blog/replies.xml'
      const expected: DiscoverUriHint = { key: 'microblog:posts', label: 'Posts', format: 'rss' }

      expect(microblogHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a replies feed as itself', async () => {
      const value = 'https://frank.micro.blog/replies.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [microblogHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
