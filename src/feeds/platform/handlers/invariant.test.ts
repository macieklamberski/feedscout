import { describe, expect, it } from 'bun:test'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { bookwyrmHandler } from './bookwyrm.js'
import { confluenceHandler } from './confluence.js'
import { diasporaHandler } from './diaspora.js'
import { discourseHandler } from './discourse.js'
import { drupalHandler } from './drupal.js'
import { friendicaHandler } from './friendica.js'
import { giteaHandler } from './gitea.js'
import { gitlabHandler } from './gitlab.js'
import { jiraHandler } from './jira.js'
import { lemmyHandler } from './lemmy.js'
import { mastodonHandler } from './mastodon.js'
import { misskeyHandler } from './misskey.js'
import { nodebbHandler } from './nodebb.js'
import { openstatusHandler } from './openstatus.js'
import { peertubeHandler } from './peertube.js'
import { pixelfedHandler } from './pixelfed.js'
import { pleromaHandler } from './pleroma.js'
import { shopifyHandler } from './shopify.js'
import { squarespaceHandler } from './squarespace.js'
import { wikidotHandler } from './wikidot.js'
import { xenforoHandler } from './xenforo.js'

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
  '/a/alice',
  '/u/alice',
  '/people/8d87a9403ee7013c',
  '/public/alice',
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
  '/alice/project',
  '/alice/project/issues',
  '/p/12345',
  '/display/SPACE',
  '/wiki/display/SPACE',
  '/wiki/spaces/SPACE/overview',
  '/projects/KEY',
  '/browse/KEY-1',
  '/jira/projects/KEY',
  '/blog',
  '/blogs/news',
  '/blogs/news/a-post',
  '/category/1/general',
  '/topic/1/a-topic',
  '/f/general.1/',
  '/forums/general.1/',
  '/node/1',
  '/taxonomy/term/1',
  '/status',
]

type Case = [string, PlatformHandler, string, Headers?]

const cases: Array<Case> = [
  ['bookwyrm', bookwyrmHandler, '<meta name="generator" content="BookWyrm 0.7.5">'],
  [
    'confluence',
    confluenceHandler,
    '<meta name="confluence-base-url" content="https://example.org">',
  ],
  ['diaspora', diasporaHandler, '<script>Diaspora.Page = "Home";</script>'],
  ['discourse', discourseHandler, '<meta id="data-discourse-setup" data-base-url="/">'],
  ['drupal', drupalHandler, '<meta name="generator" content="Drupal 10 (https://www.drupal.org)">'],
  ['friendica', friendicaHandler, '<meta name="generator" content="Friendica 2026.05">'],
  ['gitea', giteaHandler, '', new Headers({ 'set-cookie': 'i_like_gitea=abc; Path=/' })],
  ['gitlab', gitlabHandler, '<meta property="og:site_name" content="GitLab">'],
  ['jira', jiraHandler, '<meta name="ajs-base-url" content="https://example.org">'],
  ['lemmy', lemmyHandler, '<div class="lemmy-site" id="app"></div>'],
  ['mastodon', mastodonHandler, '<div class="app-holder" id="mastodon"></div>'],
  ['misskey', misskeyHandler, '<script type="application/json" id="misskey_meta">{}</script>'],
  ['nodebb', nodebbHandler, '', new Headers({ 'x-powered-by': 'NodeBB' })],
  ['openstatus', openstatusHandler, '<link href="/api/status/summary.json">'],
  ['peertube', peertubeHandler, '', new Headers({ 'x-powered-by': 'PeerTube' })],
  ['pixelfed', pixelfedHandler, '<meta name="generator" content="pixelfed">'],
  [
    'pleroma',
    pleromaHandler,
    '<script id="initial-results" type="application/json">{"/api/pleroma/frontend_configurations":{}}</script>',
  ],
  ['shopify', shopifyHandler, '', new Headers({ 'powered-by': 'Shopify' })],
  ['squarespace', squarespaceHandler, '', new Headers({ server: 'Squarespace' })],
  ['wikidot', wikidotHandler, '<a onclick="WIKIDOT.page.listeners.editClick()">Edit</a>'],
  ['xenforo', xenforoHandler, '<html id="XF">'],
]

describe('platform handler invariant', () => {
  it.each(cases)(
    'should resolve a feed wherever %s matches',
    async (_platform, handler, value, headers) => {
      const violations: Array<string> = []
      let matched = 0

      for (const host of hosts) {
        for (const path of paths) {
          const url = `${host}${path}`

          if (!handler.match(url, value, headers)) {
            continue
          }

          matched++

          const uris = await handler.resolve(url, value, headers)

          if (uris.length === 0) {
            violations.push(url)
          }
        }
      }

      // A marker the handler no longer reads would pass every path vacuously.
      expect(matched).toBeGreaterThan(0)
      expect(violations).toEqual([])
    },
  )
})
