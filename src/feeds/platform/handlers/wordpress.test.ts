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
          uri: ['https://example.wordpress.com/feed/', 'https://example.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wordpress.com/feed/rss2/',
            'https://example.wordpress.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
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
            'https://example.wordpress.com/feed/atom/',
            'https://example.wordpress.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/',
            'https://example.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/rss2/',
            'https://example.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/rdf/',
            'https://example.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://example.wordpress.com/comments/feed/atom/',
            'https://example.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for post page', () => {
      const value = 'https://blog.wordpress.com/2024/01/01/some-post/'
      const expected = [
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:category', label: 'Category' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:tag', label: 'Tag' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:category', label: 'Category' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:author', label: 'Author' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include year archive feed when on year page', () => {
      const value = 'https://blog.wordpress.com/2024/'
      const expected = [
        {
          uri: 'https://blog.wordpress.com/2024/feed/',
          hint: { key: 'wordpress:date-archive', label: 'Date archive' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include month archive feed when on year/month page', () => {
      const value = 'https://blog.wordpress.com/2024/06/'
      const expected = [
        {
          uri: 'https://blog.wordpress.com/2024/06/feed/',
          hint: { key: 'wordpress:date-archive', label: 'Date archive' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/', 'https://blog.wordpress.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rss2/', 'https://blog.wordpress.com/?feed=rss2'],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/rdf/', 'https://blog.wordpress.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: ['https://blog.wordpress.com/feed/atom/', 'https://blog.wordpress.com/?feed=atom'],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rss2/',
            'https://blog.wordpress.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/rdf/',
            'https://blog.wordpress.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://blog.wordpress.com/comments/feed/atom/',
            'https://blog.wordpress.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should not include date archive feed for post URLs like /2024/06/post-slug/', () => {
      const value = 'https://blog.wordpress.com/2024/06/some-post/'
      const result = wordpressHandler.resolve(value) as Array<{ hint?: { key: string } }>

      for (const entry of result) {
        expect(entry.hint?.key).not.toBe('wordpress:date-archive')
      }
    })
  })
})
