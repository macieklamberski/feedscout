import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getSapoBlogsPage,
  parseSapoBlogsUrl,
  type SapoBlogsPage,
  type SapoBlogsUrl,
  sapoBlogsHandler,
} from './sapoBlogs.js'

describe('parseSapoBlogsUrl', () => {
  it('should return the blog for the home page', () => {
    const expected: SapoBlogsUrl = { kind: 'blog', blog: 'alice' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/')).toEqual(expected)
  })

  it('should return the blog for a monthly archive', () => {
    const expected: SapoBlogsUrl = { kind: 'blog', blog: 'alice' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/2024/05/')).toEqual(expected)
  })

  it('should return the post for a slug ending in the post id', () => {
    const expected: SapoBlogsUrl = { kind: 'post', blog: 'alice', postId: '1234567' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/a-new-address-1234567')).toEqual(expected)
  })

  it('should return the post for a numbered html page', () => {
    const expected: SapoBlogsUrl = { kind: 'post', blog: 'alice', postId: '12345' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/12345.html')).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: SapoBlogsUrl = { kind: 'tag', blog: 'alice', tag: 'blogs' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/tag/blogs')).toEqual(expected)
  })

  it('should decode a tag spelled with a plus and an escape', () => {
    const expected: SapoBlogsUrl = { kind: 'tag', blog: 'alice', tag: 'antónio costa' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/tag/ant%C3%B3nio+costa')).toEqual(
      expected,
    )
  })

  it('should return the tag for a tag with a slash', () => {
    const expected: SapoBlogsUrl = { kind: 'tag', blog: 'alice', tag: 'fim de ano 2010/11' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/tag/fim+de+ano+2010/11')).toEqual(
      expected,
    )
  })

  it('should return the tag for an uppercase route word', () => {
    const expected: SapoBlogsUrl = { kind: 'tag', blog: 'alice', tag: 'blogs' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/TAG/blogs')).toEqual(expected)
  })

  it('should return the tag for the next page of a tag listing', () => {
    const value = 'https://alice.blogs.sapo.pt/?skip=20&tag=ant%C3%B3nio+costa'
    const expected: SapoBlogsUrl = { kind: 'tag', blog: 'alice', tag: 'antónio costa' }

    expect(parseSapoBlogsUrl(value)).toEqual(expected)
  })

  it('should return the blog for an empty tag query', () => {
    const expected: SapoBlogsUrl = { kind: 'blog', blog: 'alice' }

    expect(parseSapoBlogsUrl('https://alice.blogs.sapo.pt/?skip=20&tag=')).toEqual(expected)
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseSapoBlogsUrl('https://www.alice.blogs.sapo.pt/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseSapoBlogsUrl('https://www.blogs.sapo.pt/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSapoBlogsUrl('https://blogs.sapo.pt/')).toBeUndefined()
  })

  it('should return undefined for another sapo.pt host', () => {
    expect(parseSapoBlogsUrl('https://alice.sapo.pt/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSapoBlogsUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getSapoBlogsPage', () => {
  const value = 'https://alice.blogs.sapo.pt/a-new-address-1234567'

  it('should return the post when the page links its comments feed', () => {
    const content =
      '<a href="https://blogs.sapo.pt/commentsrss.bml?blog=alice&amp;ditemid=1234567">'
    const expected: SapoBlogsPage = { kind: 'post', blog: 'alice', postId: '1234567' }

    expect(getSapoBlogsPage(value, content)).toEqual(expected)
  })

  it('should fall back to the blog when the page links only a longer id', () => {
    const value = 'https://alice.blogs.sapo.pt/a-new-address-123'
    const content =
      '<a href="https://blogs.sapo.pt/commentsrss.bml?blog=alice&amp;ditemid=1234567">'
    const expected: SapoBlogsPage = { kind: 'blog', blog: 'alice' }

    expect(getSapoBlogsPage(value, content)).toEqual(expected)
  })

  it('should fall back to the blog without content', () => {
    const expected: SapoBlogsPage = { kind: 'blog', blog: 'alice' }

    expect(getSapoBlogsPage(value, undefined)).toEqual(expected)
  })
})

describe('sapoBlogsHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(sapoBlogsHandler.match('https://alice.blogs.sapo.pt/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(sapoBlogsHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside SAPO Blogs', () => {
      expect(sapoBlogsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the blog feeds for a blog', () => {
      const value = 'https://alice.blogs.sapo.pt/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the post comments feed first for a post', () => {
      const value = 'https://alice.blogs.sapo.pt/a-new-address-1234567'
      const content = `
        <a href="https://blogs.sapo.pt/commentsrss.bml?blog=alice&amp;ditemid=1234567">
          Coment&aacute;rios do post
        </a>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice&ditemid=1234567',
          hint: { key: 'sapo-blogs:post-comments', label: 'Post comments' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should skip the post comments feed when the page does not link it', () => {
      const value = 'https://alice.blogs.sapo.pt/a-new-address-1234567'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value, '<html></html>')).toEqual(expected)
    })

    it('should skip the post comments feed when the page links only a longer id', () => {
      const value = 'https://alice.blogs.sapo.pt/a-new-address-123'
      const content =
        '<a href="https://blogs.sapo.pt/commentsrss.bml?blog=alice&amp;ditemid=1234567">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the tag feed for a tag', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/ant%C3%B3nio+costa'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss?tag=antónio%20costa',
          hint: { key: 'sapo-blogs:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the punctuation of a tag as written', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/don%27t+kill+%28me%29%21'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: "https://alice.blogs.sapo.pt/data/rss?tag=don't%20kill%20(me)!",
          hint: { key: 'sapo-blogs:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the slash in a tag as written', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/fim+de+ano+2010/11'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss?tag=fim%20de%20ano%202010/11',
          hint: { key: 'sapo-blogs:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.blogs.sapo.pt/data/atom',
          hint: { key: 'sapo-blogs:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blogs.sapo.pt/commentsrss.bml?blog=alice',
          hint: { key: 'sapo-blogs:comments', label: 'Comments' },
        },
      ]

      expect(sapoBlogsHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS feed', () => {
      const value = 'https://cantinhodacasa.blogs.sapo.pt/data/rss'
      const expected = 'sapo-blogs:posts'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an Atom feed', () => {
      const value = 'https://cantinhodacasa.blogs.sapo.pt/data/atom'
      const expected = 'sapo-blogs:posts'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag feed', () => {
      const value = 'https://cantinhodacasa.blogs.sapo.pt/data/rss?tag=compal'
      const expected = 'sapo-blogs:tag'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag spelled with a plus and an escape', () => {
      const value = 'https://alice.blogs.sapo.pt/data/rss?tag=ant%C3%B3nio+costa'
      const expected = 'sapo-blogs:tag'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for a comments feed', () => {
      const value = 'https://blogs.sapo.pt/commentsrss.bml?blog=canetadapoesia'
      const expected = 'sapo-blogs:comments'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for a comments feed naming a blog with an underscore', () => {
      const value = 'https://blogs.sapo.pt/commentsrss.bml?blog=the_other_side'
      const expected = 'sapo-blogs:comments'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the post comments key for a post comments feed', () => {
      const value = 'https://blogs.sapo.pt/commentsrss.bml?blog=21ng&ditemid=62534'
      const expected = 'sapo-blogs:post-comments'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/blogs'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog query on another apex path', () => {
      const value = 'https://blogs.sapo.pt/?blog=alice'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a comments feed without a blog', () => {
      const value = 'https://blogs.sapo.pt/commentsrss.bml'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the posts path on the apex', () => {
      const value = 'https://blogs.sapo.pt/data/rss'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the posts path on a nested subdomain', () => {
      const value = 'https://news.alice.blogs.sapo.pt/data/rss'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/data/rss'

      expect(sapoBlogsHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://cantinhodacasa.blogs.sapo.pt/data/rss',
        { key: 'sapo-blogs:posts', label: 'Posts' },
      ],
      [
        'https://cantinhodacasa.blogs.sapo.pt/data/atom',
        { key: 'sapo-blogs:posts', label: 'Posts' },
      ],
      [
        'https://cantinhodacasa.blogs.sapo.pt/data/rss?tag=compal',
        { key: 'sapo-blogs:tag', label: 'Tag' },
      ],
      [
        'https://alice.blogs.sapo.pt/data/rss?tag=ant%C3%B3nio+costa',
        { key: 'sapo-blogs:tag', label: 'Tag' },
      ],
      [
        'https://blogs.sapo.pt/commentsrss.bml?blog=canetadapoesia',
        { key: 'sapo-blogs:comments', label: 'Comments' },
      ],
      [
        'https://blogs.sapo.pt/commentsrss.bml?blog=the_other_side',
        { key: 'sapo-blogs:comments', label: 'Comments' },
      ],
      [
        'https://blogs.sapo.pt/commentsrss.bml?blog=21ng&ditemid=62534',
        { key: 'sapo-blogs:post-comments', label: 'Post comments' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [sapoBlogsHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
