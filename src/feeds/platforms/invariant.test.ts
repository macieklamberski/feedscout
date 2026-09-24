import { describe, expect, it } from 'bun:test'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { bookwyrmHandler } from './bookwyrm.js'
import { confluenceHandler } from './confluence.js'
import { diasporaHandler } from './diaspora.js'
import { discourseHandler } from './discourse.js'
import { discuzHandler } from './discuz.js'
import { drupalHandler } from './drupal.js'
import { fluxbbHandler } from './fluxbb.js'
import { friendicaHandler } from './friendica.js'
import { funkwhaleHandler } from './funkwhale.js'
import { giteaHandler } from './gitea.js'
import { gitlabHandler } from './gitlab.js'
import { gravHandler } from './grav.js'
import { homelandHandler } from './homeland.js'
import { hubspotHandler } from './hubspot.js'
import { hubzillaHandler } from './hubzilla.js'
import { jiraHandler } from './jira.js'
import { joomlaHandler } from './joomla.js'
import { lemmyHandler } from './lemmy.js'
import { mastodonHandler } from './mastodon.js'
import { misskeyHandler } from './misskey.js'
import { mobilizonHandler } from './mobilizon.js'
import { nodebbHandler } from './nodebb.js'
import { openstatusHandler } from './openstatus.js'
import { peertubeHandler } from './peertube.js'
import { phpbbHandler } from './phpbb.js'
import { pixelfedHandler } from './pixelfed.js'
import { pleromaHandler } from './pleroma.js'
import { powerpressHandler } from './powerpress.js'
import { publiiHandler } from './publii.js'
import { shaarliHandler } from './shaarli.js'
import { shopifyHandler } from './shopify.js'
import { snacHandler } from './snac.js'
import { squarespaceHandler } from './squarespace.js'
import { svbtleHandler } from './svbtle.js'
import { textpatternHandler } from './textpattern.js'
import { wikidotHandler } from './wikidot.js'
import { wixHandler } from './wix.js'
import { writefreelyHandler } from './writefreely.js'
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
  '/channel/alice',
  '/channels/alice',
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
  ['discuz', discuzHandler, '<meta name="generator" content="Discuz! X3.5">'],
  ['drupal', drupalHandler, '<meta name="generator" content="Drupal 10 (https://www.drupal.org)">'],
  ['fluxbb', fluxbbHandler, '<div id="brdmenu"></div><div id="brdfooter"></div>'],
  ['friendica', friendicaHandler, '<meta name="generator" content="Friendica 2026.05">'],
  ['funkwhale', funkwhaleHandler, '<div id="fake-app"></div>'],
  ['gitea', giteaHandler, '', new Headers({ 'set-cookie': 'i_like_gitea=abc; Path=/' })],
  ['gitlab', gitlabHandler, '<meta property="og:site_name" content="GitLab">'],
  ['grav', gravHandler, '', new Headers({ 'set-cookie': 'grav-site-9a6a5fc=abc; path=/' })],
  ['homeland', homelandHandler, '', new Headers({ 'set-cookie': '_homeland_session=abc; path=/' })],
  ['hubspot', hubspotHandler, '', new Headers({ 'x-hs-hub-id': '53' })],
  ['hubzilla', hubzillaHandler, "<script>var zid = '';</script>"],
  ['jira', jiraHandler, '<meta name="ajs-base-url" content="https://example.org">'],
  ['joomla', joomlaHandler, '<script class="joomla-script-options new">{}</script>'],
  ['lemmy', lemmyHandler, '<div class="lemmy-site" id="app"></div>'],
  ['mastodon', mastodonHandler, '<div class="app-holder" id="mastodon"></div>'],
  ['misskey', misskeyHandler, '<script type="application/json" id="misskey_meta">{}</script>'],
  [
    'mobilizon',
    mobilizonHandler,
    "<noscript>Mobilizon doesn't work properly without JavaScript</noscript>",
  ],
  ['nodebb', nodebbHandler, '', new Headers({ 'x-powered-by': 'NodeBB' })],
  ['openstatus', openstatusHandler, '<link href="/api/status/summary.json">'],
  ['peertube', peertubeHandler, '', new Headers({ 'x-powered-by': 'PeerTube' })],
  ['phpbb', phpbbHandler, '<body id="phpbb">'],
  ['pixelfed', pixelfedHandler, '<meta name="generator" content="pixelfed">'],
  [
    'pleroma',
    pleromaHandler,
    '<script id="initial-results" type="application/json">{"/api/pleroma/frontend_configurations":{}}</script>',
  ],
  ['powerpress', powerpressHandler, '<script>function powerpress_pinw(pinw_url){}</script>'],
  ['publii', publiiHandler, '<img src="https://example.org/media/website/logo.png">'],
  ['shaarli', shaarliHandler, '<div id="shaarli-menu"></div>'],
  ['shopify', shopifyHandler, '', new Headers({ 'powered-by': 'Shopify' })],
  ['snac', snacHandler, '', new Headers({ 'x-creator': 'snac/2.95' })],
  ['squarespace', squarespaceHandler, '', new Headers({ server: 'Squarespace' })],
  ['svbtle', svbtleHandler, '<link href="https://lightning.svbtle.com/cargo/blog.css">'],
  ['textpattern', textpatternHandler, '<meta name="generator" content="Textpattern CMS">'],
  ['wikidot', wikidotHandler, '<a onclick="WIKIDOT.page.listeners.editClick()">Edit</a>'],
  ['wix', wixHandler, '', new Headers({ 'x-wix-request-id': '1790000000.1' })],
  ['writefreely', writefreelyHandler, '<link rel="stylesheet" href="/css/write.css">'],
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
