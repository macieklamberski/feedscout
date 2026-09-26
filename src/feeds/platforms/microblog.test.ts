import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
  describe('resolve', () => {
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

    it('should return replies feed for replies page', () => {
      const value = 'https://example.micro.blog/replies'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.micro.blog/replies.xml',
          hint: { key: 'microblog:replies', label: 'Replies' },
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
      [
        'https://example.micro.blog/Replies',
        {
          uri: 'https://example.micro.blog/replies.xml',
          hint: { key: 'microblog:replies', label: 'Replies' },
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
  })
})
