import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { wpengineHandler } from './wpengine.js'

describe('wpengineHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.wpenginepowered.com'],
      [true, 'https://blog.example.wpenginepowered.com'],
      [true, 'https://example.wpengine.com'],
      [true, 'https://blog.example.wpengine.com'],
      [false, 'https://wpenginepowered.com'],
      [false, 'https://wpengine.com'],
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
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
            'https://example.wpengine.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpengine.com/comments/feed/rdf/',
            'https://example.wpengine.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include tag feed when on tag page', () => {
      const value = 'https://example.wpenginepowered.com/tag/javascript/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/tag/javascript/feed/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=rss',
            'https://example.wpenginepowered.com/tag/javascript/feed/rss2/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=rss2',
          ],
          hint: { key: 'wordpress:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/tag/javascript/feed/atom/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=atom',
          ],
          hint: { key: 'wordpress:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/tag/javascript/feed/rdf/',
            'https://example.wpenginepowered.com/tag/javascript/?feed=rdf',
          ],
          hint: { key: 'wordpress:tag', label: 'Tag', format: 'rdf' },
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include author feed when on author page', () => {
      const value = 'https://example.wpenginepowered.com/author/johndoe/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/author/johndoe/feed/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=rss',
            'https://example.wpenginepowered.com/author/johndoe/feed/rss2/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=rss2',
          ],
          hint: { key: 'wordpress:author', label: 'Author', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/author/johndoe/feed/atom/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=atom',
          ],
          hint: { key: 'wordpress:author', label: 'Author', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/author/johndoe/feed/rdf/',
            'https://example.wpenginepowered.com/author/johndoe/?feed=rdf',
          ],
          hint: { key: 'wordpress:author', label: 'Author', format: 'rdf' },
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include year archive feed when on year page', () => {
      const value = 'https://example.wpenginepowered.com/2024/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/2024/feed/',
            'https://example.wpenginepowered.com/2024/?feed=rss',
            'https://example.wpenginepowered.com/2024/feed/rss2/',
            'https://example.wpenginepowered.com/2024/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/feed/atom/',
            'https://example.wpenginepowered.com/2024/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/feed/rdf/',
            'https://example.wpenginepowered.com/2024/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'rdf' },
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include month archive feed when on year/month page', () => {
      const value = 'https://example.wpenginepowered.com/2024/06/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/feed/',
            'https://example.wpenginepowered.com/2024/06/?feed=rss',
            'https://example.wpenginepowered.com/2024/06/feed/rss2/',
            'https://example.wpenginepowered.com/2024/06/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/feed/atom/',
            'https://example.wpenginepowered.com/2024/06/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/feed/rdf/',
            'https://example.wpenginepowered.com/2024/06/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'rdf' },
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it('should include day archive feed when on year/month/day page', () => {
      const value = 'https://example.wpenginepowered.com/2024/06/15/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/15/feed/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=rss',
            'https://example.wpenginepowered.com/2024/06/15/feed/rss2/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=rss2',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'rss' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/15/feed/atom/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=atom',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'atom' },
        },
        {
          uri: [
            'https://example.wpenginepowered.com/2024/06/15/feed/rdf/',
            'https://example.wpenginepowered.com/2024/06/15/?feed=rdf',
          ],
          hint: { key: 'wordpress:date-archive', label: 'Date archive', format: 'rdf' },
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
            'https://example.wpenginepowered.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpenginepowered.com/comments/feed/rdf/',
            'https://example.wpenginepowered.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
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
            'https://example.wpengine.com/2024/06/hello-world/feed/rdf/',
            'https://example.wpengine.com/2024/06/hello-world/?feed=rdf',
          ],
          hint: { key: 'wordpress:post-comments', label: 'Post comments', format: 'rdf' },
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
            'https://example.wpengine.com/?feed=comments-rss',
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
        {
          uri: [
            'https://example.wpengine.com/comments/feed/rdf/',
            'https://example.wpengine.com/?feed=comments-rdf',
          ],
          hint: { key: 'wordpress:comments', label: 'Comments', format: 'rdf' },
        },
      ]

      expect(wpengineHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
