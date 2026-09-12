import { describe, expect, it } from 'bun:test'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { bookwyrmHandler } from './bookwyrm.js'
import { discourseHandler } from './discourse.js'
import { friendicaHandler } from './friendica.js'
import { gitlabHandler } from './gitlab.js'
import { lemmyHandler } from './lemmy.js'
import { mastodonHandler } from './mastodon.js'
import { misskeyHandler } from './misskey.js'
import { pixelfedHandler } from './pixelfed.js'
import { pleromaHandler } from './pleroma.js'

// Every path shape is tried against every content-matched handler, because a
// handler that matches a path it cannot resolve shadows the later handlers that
// could: dispatch stops at the first passing `match`.
const hosts = ['https://example.org', 'https://gitlab.com']
const paths = [
  '/',
  '/about',
  '/explore',
  '/admin',
  '/-',
  '/-/profile',
  '/@alice',
  '/@alice/media',
  '/@alice/with_replies',
  '/@alice/tagged/news',
  '/tags/news',
  '/c/programming',
  '/u/alice',
  '/t/a-topic/12',
  '/top/weekly',
  '/user/alice',
  '/user/alice/shelf/to-read',
  '/users/alice',
  '/users/alice/statuses/1',
  '/profile/alice',
  '/group/project',
  '/group/project/-/issues',
  '/group/subgroup/project/-/commits/main',
  '/alice',
  '/p/12345',
]

const cases: Array<[string, PlatformHandler, string]> = [
  ['bookwyrm', bookwyrmHandler, '<meta name="generator" content="BookWyrm 0.7.5">'],
  ['discourse', discourseHandler, '<meta id="data-discourse-setup" data-base-url="/">'],
  ['friendica', friendicaHandler, '<meta name="generator" content="Friendica 2026.05">'],
  ['gitlab', gitlabHandler, '<meta property="og:site_name" content="GitLab">'],
  ['lemmy', lemmyHandler, '<div class="lemmy-site" id="app"></div>'],
  ['mastodon', mastodonHandler, '<div class="app-holder" id="mastodon"></div>'],
  ['misskey', misskeyHandler, '<script type="application/json" id="misskey_meta">{}</script>'],
  ['pixelfed', pixelfedHandler, '<meta name="generator" content="pixelfed">'],
  [
    'pleroma',
    pleromaHandler,
    '<script id="initial-results" type="application/json">{"/api/pleroma/frontend_configurations":{}}</script>',
  ],
]

describe('platform handler invariant', () => {
  it.each(cases)('should resolve a feed wherever %s matches', async (_platform, handler, value) => {
    const violations: Array<string> = []

    for (const host of hosts) {
      for (const path of paths) {
        const url = `${host}${path}`

        if (!handler.match(url, value)) {
          continue
        }

        const uris = await handler.resolve(url, value)

        if (uris.length === 0) {
          violations.push(url)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
