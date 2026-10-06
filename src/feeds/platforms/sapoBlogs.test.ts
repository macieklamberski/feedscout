import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { parseSapoBlogsUrl, type SapoBlogsUrl, sapoBlogsHandler } from './sapoBlogs.js'

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

  it('should return undefined for a dotted subdomain', () => {
    expect(parseSapoBlogsUrl('https://www.alice.blogs.sapo.pt/')).toBeUndefined()
  })

  const serviceHosts = ['https://m.blogs.sapo.pt/', 'https://www.blogs.sapo.pt/']

  it.each(serviceHosts)('should return undefined for service host %s', (value) => {
    expect(parseSapoBlogsUrl(value)).toBeUndefined()
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

    it('should return the tag feed spelled as the page links it for a tag', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/ant%C3%B3nio+costa'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss?tag=ant%C3%B3nio%20costa',
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

    it('should escape the characters the page escapes in a tag', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/don%27t+kill+%28me%29%21'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss?tag=don%27t%20kill%20%28me%29%21',
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

    it('should escape the slash in a tag', () => {
      const value = 'https://alice.blogs.sapo.pt/tag/fim+de+ano+2010/11'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogs.sapo.pt/data/rss?tag=fim%20de%20ano%202010%2F11',
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
})
