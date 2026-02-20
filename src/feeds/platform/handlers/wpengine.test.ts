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
  })

  describe('resolve', () => {
    it('should return feed URLs for blog', () => {
      const value = 'https://example.wpenginepowered.com'
      const expected = [
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
          ],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
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
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for legacy domain', () => {
      const value = 'https://example.wpengine.com'
      const expected = [
        {
          uri: ['https://example.wpengine.com/feed/', 'https://example.wpengine.com/?feed=rss'],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/rss2/',
            'https://example.wpengine.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: ['https://example.wpengine.com/feed/rdf/', 'https://example.wpengine.com/?feed=rdf'],
          hint: { key: 'wordpress:posts-rdf', label: 'Posts (RDF)' },
        },
        {
          uri: [
            'https://example.wpengine.com/feed/atom/',
            'https://example.wpengine.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/',
            'https://example.wpengine.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/rss2/',
            'https://example.wpengine.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/rdf/',
            'https://example.wpengine.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://example.wpengine.com/comments/feed/atom/',
            'https://example.wpengine.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:category', label: 'Category' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
          ],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
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
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:tag', label: 'Tag' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
          ],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
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
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
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
          ],
          hint: { key: 'wordpress:author', label: 'Author' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/',
            'https://example.wpenginepowered.com/?feed=rss',
          ],
          hint: { key: 'wordpress:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=rss2',
          ],
          hint: { key: 'wordpress:posts-rss2-alt', label: 'Posts (RSS 2.0)' },
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
            'https://example.wpenginepowered.com/feed/atom/',
            'https://example.wpenginepowered.com/?feed=atom',
          ],
          hint: { key: 'wordpress:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rss2/',
            'https://example.wpenginepowered.com/?feed=comments-rss2',
          ],
          hint: { key: 'wordpress:comments-rss2', label: 'Comments (RSS 2.0)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments-rdf', label: 'Comments (RDF)' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/atom/',
            'https://example.wpenginepowered.com/?feed=comments-atom',
          ],
          hint: { key: 'wordpress:comments-atom', label: 'Comments (Atom)' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })
  })
})
