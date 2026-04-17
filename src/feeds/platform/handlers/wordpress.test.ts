import { describe, expect, it } from 'bun:test'
import { wordpressHandler } from './wordpress.js'

describe('wordpressHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.wordpress.com', true],
      ['https://blog.example.wordpress.com', true],
      ['https://wordpress.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(wordpressHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(wordpressHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URLs for blog', () => {
      const value = 'https://example.wordpress.com'
      const expected = [
        {
          uri: [
            'https://example.wordpress.com/feed/',
            'https://example.wordpress.com/?feed=rss',
            'https://example.wordpress.com/feed/rss2/',
            'https://example.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wordpress.com/feed/atom/',
            'https://example.wordpress.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wordpress.com/feed/rdf/',
            'https://example.wordpress.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/',
            'https://example.wordpress.com/?feed=comments-rss',
            'https://example.wordpress.com/comments/feed/rss2/',
            'https://example.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/atom/',
            'https://example.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/rdf/',
            'https://example.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for post page', () => {
      const value = 'https://blog.wordpress.com/2024/01/01/some-post/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include category feed when on category page', () => {
      const value = 'https://blog.wordpress.com/category/tech/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/category/tech/feed/',
            'https://blog.wordpress.com/category/tech/?feed=rss',
            'https://blog.wordpress.com/category/tech/feed/rss2/',
            'https://blog.wordpress.com/category/tech/?feed=rss2',
          ],
          hint: { key: 'wordpress:category-rss', label: 'Category (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/category/tech/feed/atom/',
            'https://blog.wordpress.com/category/tech/?feed=atom',
          ],
          hint: { key: 'wordpress:category-atom', label: 'Category (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/category/tech/feed/rdf/',
            'https://blog.wordpress.com/category/tech/?feed=rdf',
          ],
          hint: { key: 'wordpress:category-rdf', label: 'Category (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include tag feed when on tag page', () => {
      const value = 'https://blog.wordpress.com/tag/javascript/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/tag/javascript/feed/',
            'https://blog.wordpress.com/tag/javascript/?feed=rss',
            'https://blog.wordpress.com/tag/javascript/feed/rss2/',
            'https://blog.wordpress.com/tag/javascript/?feed=rss2',
          ],
          hint: { key: 'wordpress:tag-rss', label: 'Tag (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/tag/javascript/feed/atom/',
            'https://blog.wordpress.com/tag/javascript/?feed=atom',
          ],
          hint: { key: 'wordpress:tag-atom', label: 'Tag (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/tag/javascript/feed/rdf/',
            'https://blog.wordpress.com/tag/javascript/?feed=rdf',
          ],
          hint: { key: 'wordpress:tag-rdf', label: 'Tag (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URL-encoded category names', () => {
      const value = 'https://blog.wordpress.com/category/c%2B%2B/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/category/c%2B%2B/feed/',
            'https://blog.wordpress.com/category/c%2B%2B/?feed=rss',
            'https://blog.wordpress.com/category/c%2B%2B/feed/rss2/',
            'https://blog.wordpress.com/category/c%2B%2B/?feed=rss2',
          ],
          hint: { key: 'wordpress:category-rss', label: 'Category (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/category/c%2B%2B/feed/atom/',
            'https://blog.wordpress.com/category/c%2B%2B/?feed=atom',
          ],
          hint: { key: 'wordpress:category-atom', label: 'Category (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/category/c%2B%2B/feed/rdf/',
            'https://blog.wordpress.com/category/c%2B%2B/?feed=rdf',
          ],
          hint: { key: 'wordpress:category-rdf', label: 'Category (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include author feed when on author page', () => {
      const value = 'https://blog.wordpress.com/author/johndoe/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/author/johndoe/feed/',
            'https://blog.wordpress.com/author/johndoe/?feed=rss',
            'https://blog.wordpress.com/author/johndoe/feed/rss2/',
            'https://blog.wordpress.com/author/johndoe/?feed=rss2',
          ],
          hint: { key: 'wordpress:author-rss', label: 'Author (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/author/johndoe/feed/atom/',
            'https://blog.wordpress.com/author/johndoe/?feed=atom',
          ],
          hint: { key: 'wordpress:author-atom', label: 'Author (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/author/johndoe/feed/rdf/',
            'https://blog.wordpress.com/author/johndoe/?feed=rdf',
          ],
          hint: { key: 'wordpress:author-rdf', label: 'Author (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include year archive feed when on year page', () => {
      const value = 'https://blog.wordpress.com/2024/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/2024/feed/',
            'https://blog.wordpress.com/2024/?feed=rss',
            'https://blog.wordpress.com/2024/feed/rss2/',
            'https://blog.wordpress.com/2024/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive-rss', label: 'Date archive (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/2024/feed/atom/',
            'https://blog.wordpress.com/2024/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive-atom', label: 'Date archive (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/2024/feed/rdf/',
            'https://blog.wordpress.com/2024/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive-rdf', label: 'Date archive (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include month archive feed when on year/month page', () => {
      const value = 'https://blog.wordpress.com/2024/06/'
      const expected = [
        {
          uri: [
            'https://blog.wordpress.com/2024/06/feed/',
            'https://blog.wordpress.com/2024/06/?feed=rss',
            'https://blog.wordpress.com/2024/06/feed/rss2/',
            'https://blog.wordpress.com/2024/06/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive-rss', label: 'Date archive (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/2024/06/feed/atom/',
            'https://blog.wordpress.com/2024/06/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive-atom', label: 'Date archive (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/2024/06/feed/rdf/',
            'https://blog.wordpress.com/2024/06/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive-rdf', label: 'Date archive (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/feed/',
            'https://blog.wordpress.com/?feed=rss',
            'https://blog.wordpress.com/feed/rss2/',
            'https://blog.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss',
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should not include date archive feed for post URLs like /2024/06/post-slug/', () => {
      const value = 'https://blog.wordpress.com/2024/06/some-post/'
      const result = wordpressHandler.resolve(value) as Array<{ hint?: { key: string } }>

      for (const entry of result) {
        expect(entry.hint?.key?.startsWith('wordpress:date-archive')).toBe(false)
      }
    })
  })
})
