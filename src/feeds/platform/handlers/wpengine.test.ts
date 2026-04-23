import { describe, expect, it } from 'bun:test'
import { wpengineHandler } from './wpengine.js'

describe('wpengineHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.wpenginepowered.com', true],
      ['https://blog.example.wpenginepowered.com', true],
      ['https://example.wpengine.com', true],
      ['https://blog.example.wpengine.com', true],
      ['https://wpenginepowered.com', false],
      ['https://wpengine.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(wpengineHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(wpengineHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URLs for blog', () => {
      const value = 'https://example.wpenginepowered.com'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for legacy domain', () => {
      const value = 'https://example.wpengine.com'
      const expected = [
        {
          uri: [
            'https://example.wpengine.com/feed/',
            'https://example.wpengine.com/?feed=rss',
            'https://example.wpengine.com/feed/rss2/',
            'https://example.wpengine.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/atom/',
            'https://example.wpengine.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://example.wpengine.com/feed/rdf/', 'https://example.wpengine.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/',
            'https://example.wpengine.com/?feed=comments-rss',
            'https://example.wpengine.com/comments/feed/rss2/',
            'https://example.wpengine.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/atom/',
            'https://example.wpengine.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/rdf/',
            'https://example.wpengine.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include category feed when on category page', () => {
      const value = 'https://example.wpenginepowered.com/category/tech/'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/category/tech/feed/',
            'https://example.wpenginepowered.com/category/tech/?feed=rss',
            'https://example.wpenginepowered.com/category/tech/feed/rss2/',
            'https://example.wpenginepowered.com/category/tech/?feed=rss2',
          ],
          hint: { key: 'wordpress:category-rss', label: 'Category (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/category/tech/feed/atom/',
            'https://example.wpenginepowered.com/category/tech/?feed=atom',
          ],
          hint: { key: 'wordpress:category-atom', label: 'Category (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/category/tech/feed/rdf/',
            'https://example.wpenginepowered.com/category/tech/?feed=rdf',
          ],
          hint: { key: 'wordpress:category-rdf', label: 'Category (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include tag feed when on tag page', () => {
      const value = 'https://example.wpenginepowered.com/tag/javascript/'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/tag/javascript/feed/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=rss',
            'https://example.wpenginepowered.com/tag/javascript/feed/rss2/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=rss2',
          ],
          hint: { key: 'wordpress:tag-rss', label: 'Tag (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/tag/javascript/feed/atom/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=atom',
          ],
          hint: { key: 'wordpress:tag-atom', label: 'Tag (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/tag/javascript/feed/rdf/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=rdf',
          ],
          hint: { key: 'wordpress:tag-rdf', label: 'Tag (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include author feed when on author page', () => {
      const value = 'https://example.wpenginepowered.com/author/johndoe/'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/author/johndoe/feed/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=rss',
            'https://example.wpenginepowered.com/author/johndoe/feed/rss2/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=rss2',
          ],
          hint: { key: 'wordpress:author-rss', label: 'Author (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/author/johndoe/feed/atom/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=atom',
          ],
          hint: { key: 'wordpress:author-atom', label: 'Author (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/author/johndoe/feed/rdf/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=rdf',
          ],
          hint: { key: 'wordpress:author-rdf', label: 'Author (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include year archive feed when on year page', () => {
      const value = 'https://example.wpenginepowered.com/2024/'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/2024/feed/',
            'https://example.wpenginepowered.com/2024/?feed=rss',
            'https://example.wpenginepowered.com/2024/feed/rss2/',
            'https://example.wpenginepowered.com/2024/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive-rss', label: 'Date archive (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/feed/atom/',
            'https://example.wpenginepowered.com/2024/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive-atom', label: 'Date archive (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/feed/rdf/',
            'https://example.wpenginepowered.com/2024/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive-rdf', label: 'Date archive (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include month archive feed when on year/month page', () => {
      const value = 'https://example.wpenginepowered.com/2024/06/'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/feed/',
            'https://example.wpenginepowered.com/2024/06/?feed=rss',
            'https://example.wpenginepowered.com/2024/06/feed/rss2/',
            'https://example.wpenginepowered.com/2024/06/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive-rss', label: 'Date archive (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/feed/atom/',
            'https://example.wpenginepowered.com/2024/06/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive-atom', label: 'Date archive (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/feed/rdf/',
            'https://example.wpenginepowered.com/2024/06/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive-rdf', label: 'Date archive (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include day archive feed when on year/month/day page', () => {
      const value = 'https://example.wpenginepowered.com/2024/06/15/'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/15/feed/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=rss',
            'https://example.wpenginepowered.com/2024/06/15/feed/rss2/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive-rss', label: 'Date archive (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/15/feed/atom/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive-atom', label: 'Date archive (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/15/feed/rdf/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive-rdf', label: 'Date archive (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=rdf',
          ],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss',
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include post comments feeds for post URLs', () => {
      const value = 'https://example.wpengine.com/2024/06/hello-world/'
      const expected = [
        {
          uri: [
            'https://example.wpengine.com/2024/06/hello-world/feed/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=rss',
            'https://example.wpengine.com/2024/06/hello-world/feed/rss2/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=rss2',
          ],
          hint: { key: 'wordpress:post-comments-rss', label: 'Post comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpengine.com/2024/06/hello-world/feed/atom/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=atom',
          ],
          hint: { key: 'wordpress:post-comments-atom', label: 'Post comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpengine.com/2024/06/hello-world/feed/rdf/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=rdf',
          ],
          hint: { key: 'wordpress:post-comments-rdf', label: 'Post comments (RDF)' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/',
            'https://example.wpengine.com/?feed=rss',
            'https://example.wpengine.com/feed/rss2/',
            'https://example.wpengine.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/atom/',
            'https://example.wpengine.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: ['https://example.wpengine.com/feed/rdf/', 'https://example.wpengine.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/',
            'https://example.wpengine.com/?feed=comments-rss',
            'https://example.wpengine.com/comments/feed/rss2/',
            'https://example.wpengine.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss', label: 'Comments (RSS)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/atom/',
            'https://example.wpengine.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/rdf/',
            'https://example.wpengine.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })
  })
})
