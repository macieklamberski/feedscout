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
      const value = 'https://iamtony.micro.blog/'

      expect(microblogHandler.match(value)).toBe(true)
    })

    it('should not match the micro.blog apex', () => {
      const value = 'https://micro.blog/iamtony'

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
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feeds without the archive feed for a sibling path of the archive page', () => {
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
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the blog feeds for a replies page', () => {
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
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    const capitalizedSectionValues: Array<[string, DiscoverUriEntry]> = [
      [
        'https://example.micro.blog/Archive',
        {
          uri: 'https://example.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
      ],
      [
        'https://example.micro.blog/Photos',
        {
          uri: 'https://example.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
      ],
    ]

    it.each(capitalizedSectionValues)(
      'should return the section feed for %s',
      (value, sectionFeed) => {
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
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http blog page', () => {
      const value = 'http://iamtony.micro.blog/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://iamtony.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://iamtony.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://iamtony.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://iamtony.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS feed', () => {
      const value = 'https://iamtony.micro.blog/feed.xml'
      const expected = 'microblog:posts'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a JSON feed', () => {
      const value = 'https://iamtony.micro.blog/feed.json'
      const expected = 'microblog:posts'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a replies feed', () => {
      const value = 'https://michaelsmanley.micro.blog/replies.xml'
      const expected = 'microblog:posts'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for an RSS podcast feed', () => {
      const value = 'https://agilelisa.micro.blog/podcast.xml'
      const expected = 'microblog:podcast'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a JSON podcast feed', () => {
      const value = 'https://agilelisa.micro.blog/podcast.json'
      const expected = 'microblog:podcast'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for an RSS category feed', () => {
      const value = 'https://mersontheperson.micro.blog/categories/public-health/feed.xml'
      const expected = 'microblog:category'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for a JSON category feed', () => {
      const value = 'https://agilelisa.micro.blog/categories/long-covid/feed.json'
      const expected = 'microblog:category'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the archive key for an archive feed', () => {
      const value = 'https://amandabishopp1.micro.blog/archive/index.json'
      const expected = 'microblog:archive'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the photos key for a photos feed', () => {
      const value = 'https://hapax.micro.blog/photos/index.json'
      const expected = 'microblog:photos'

      expect(microblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://iamtony.micro.blog/'

      expect(microblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a category page', () => {
      const value = 'https://iamtony.micro.blog/categories/books/'

      expect(microblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www.micro.blog', () => {
      const value = 'https://www.micro.blog/feed.xml'

      expect(microblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.micro.blog/feed.xml'

      expect(microblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://micro.blog/feed.xml'

      expect(microblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feed.xml'

      expect(microblogHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://iamtony.micro.blog/feed.xml', { key: 'microblog:posts', label: 'Posts' }],
      ['https://iamtony.micro.blog/feed.json', { key: 'microblog:posts', label: 'Posts' }],
      ['https://michaelsmanley.micro.blog/replies.xml', { key: 'microblog:posts', label: 'Posts' }],
      ['https://agilelisa.micro.blog/podcast.xml', { key: 'microblog:podcast', label: 'Podcast' }],
      ['https://agilelisa.micro.blog/podcast.json', { key: 'microblog:podcast', label: 'Podcast' }],
      [
        'https://mersontheperson.micro.blog/categories/public-health/feed.xml',
        { key: 'microblog:category', label: 'Category' },
      ],
      [
        'https://agilelisa.micro.blog/categories/long-covid/feed.json',
        { key: 'microblog:category', label: 'Category' },
      ],
      [
        'https://amandabishopp1.micro.blog/archive/index.json',
        { key: 'microblog:archive', label: 'Archive' },
      ],
      ['https://hapax.micro.blog/photos/index.json', { key: 'microblog:photos', label: 'Photos' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [microblogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
