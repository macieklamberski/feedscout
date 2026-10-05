import { describe, expect, it } from 'bun:test'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { defaultPlatformOptions } from '../defaults.js'
import { bigcommerceHandler } from './bigcommerce.js'
import { blogspotHandler } from './blogspot.js'
import { bookwyrmHandler } from './bookwyrm.js'
import { castopodHandler } from './castopod.js'
import { chambermasterHandler } from './chambermaster.js'
import { civicplusHandler } from './civicplus.js'
import { colorMeShopHandler } from './colorMeShop.js'
import { confluenceHandler } from './confluence.js'
import { diasporaHandler } from './diaspora.js'
import { discourseHandler } from './discourse.js'
import { discuzHandler } from './discuz.js'
import { dokuwikiHandler } from './dokuwiki.js'
import { drupalHandler } from './drupal.js'
import { dspaceHandler } from './dspace.js'
import { fluxbbHandler } from './fluxbb.js'
import { forumotionHandler } from './forumotion.js'
import { friendicaHandler } from './friendica.js'
import { funkwhaleHandler } from './funkwhale.js'
import { gancioHandler } from './gancio.js'
import { giteaHandler } from './gitea.js'
import { gitlabHandler } from './gitlab.js'
import { gnuboardHandler } from './gnuboard.js'
import { gravHandler } from './grav.js'
import { haleyJobsHandler } from './haleyJobs.js'
import { homelandHandler } from './homeland.js'
import { hubspotHandler } from './hubspot.js'
import { hubzillaHandler } from './hubzilla.js'
import { instatusHandler } from './instatus.js'
import { jimdoHandler } from './jimdo.js'
import { jiraHandler } from './jira.js'
import { joomlaHandler } from './joomla.js'
import { kohaHandler } from './koha.js'
import { lemmyHandler } from './lemmy.js'
import { mastodonHandler } from './mastodon.js'
import { mediawikiHandler } from './mediawiki.js'
import { misskeyHandler } from './misskey.js'
import { mobilizonHandler } from './mobilizon.js'
import { mybbHandler } from './mybb.js'
import { nethouseHandler } from './nethouse.js'
import { ningHandler } from './ning.js'
import { nodebbHandler } from './nodebb.js'
import { noticeableHandler } from './noticeable.js'
import { odooHandler } from './odoo.js'
import { omekaHandler } from './omeka.js'
import { opencartJournalHandler } from './opencartJournal.js'
import { openstatusHandler } from './openstatus.js'
import { peertubeHandler } from './peertube.js'
import { phpbbHandler } from './phpbb.js'
import { pixelfedHandler } from './pixelfed.js'
import { pleromaHandler } from './pleroma.js'
import { pmwikiHandler } from './pmwiki.js'
import { podhomeHandler } from './podhome.js'
import { podloveHandler } from './podlove.js'
import { powerpressHandler } from './powerpress.js'
import { publicInboxHandler } from './publicInbox.js'
import { publiiHandler } from './publii.js'
import { pukiwikiHandler } from './pukiwiki.js'
import { shaarliHandler } from './shaarli.js'
import { shopifyHandler } from './shopify.js'
import { smfHandler } from './smf.js'
import { snacHandler } from './snac.js'
import { spipHandler } from './spip.js'
import { squarespaceHandler } from './squarespace.js'
import { statuspageHandler } from './statuspage.js'
import { svbtleHandler } from './svbtle.js'
import { textpatternHandler } from './textpattern.js'
import { ucozHandler } from './ucoz.js'
import { vbulletinHandler } from './vbulletin.js'
import { webnodeHandler } from './webnode.js'
import { wikidotHandler } from './wikidot.js'
import { wixHandler } from './wix.js'
import { writefreelyHandler } from './writefreely.js'
import { xenforoHandler } from './xenforo.js'
import { yeswikiHandler } from './yeswiki.js'
import { zenfolioHandler } from './zenfolio.js'

// Every path shape is tried against every content-matched handler, because a
// handler that matches a path it cannot resolve has a `match` that drifted from
// its `resolve`.
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
  '/blog/news-1/a-post-2',
  '/events',
  '/blogs/news',
  '/blogs/news/a-post',
  '/category/1/general',
  '/topic/1/a-topic',
  '/f/general.1/',
  '/forums/general.1/',
  '/node/1',
  '/taxonomy/term/1',
  '/status',
  '/cgi-bin/koha/opac-search.pl?q=news',
  '/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber=1',
]

type Case = [string, PlatformHandler, string, Headers?]

const cases: Array<Case> = [
  ['bigcommerce', bigcommerceHandler, '', new Headers({ 'set-cookie': 'SHOP_SESSION_TOKEN=abc' })],
  [
    'blogspot',
    blogspotHandler,
    '<script src="https://www.blogger.com/static/v1/widgets/851759228-widgets.js"></script>',
  ],
  ['bookwyrm', bookwyrmHandler, '<meta name="generator" content="BookWyrm 0.7.5">'],
  ['castopod', castopodHandler, '<link href="/themes/colors">'],
  ['chambermaster', chambermasterHandler, '', new Headers({ 'x-source': 'cmdotnetJYPM06' })],
  [
    'civicplus',
    civicplusHandler,
    '<script src="/Areas/Layout/Assets/Scripts/Search.js"></script><input id="pageModuleID" value="1">',
  ],
  [
    'colorMeShop',
    colorMeShopHandler,
    '',
    new Headers({ 'set-cookie': 'colorme_PHPSESSID=abc; Path=/' }),
  ],
  [
    'confluence',
    confluenceHandler,
    '<meta name="confluence-base-url" content="https://example.org">',
  ],
  ['diaspora', diasporaHandler, '<script>Diaspora.Page = "Home";</script>'],
  ['discourse', discourseHandler, '<meta id="data-discourse-setup" data-base-url="/">'],
  ['discuz', discuzHandler, '<meta name="generator" content="Discuz! X3.5">'],
  ['dokuwiki', dokuwikiHandler, '', new Headers({ 'set-cookie': 'DokuWiki=abc; path=/' })],
  ['drupal', drupalHandler, '<meta name="generator" content="Drupal 10 (https://www.drupal.org)">'],
  ['dspace', dspaceHandler, '<ds-app></ds-app>'],
  ['fluxbb', fluxbbHandler, '<div id="brdmenu"></div><div id="brdfooter"></div>'],
  [
    'forumotion',
    forumotionHandler,
    '<div id="phpbb"></div><script>_userdata["session_logged_in"] = 0;</script>',
  ],
  ['friendica', friendicaHandler, '<meta name="generator" content="Friendica 2026.05">'],
  ['funkwhale', funkwhaleHandler, '<div id="fake-app"></div>'],
  ['gancio', gancioHandler, '<link rel="stylesheet" href="/custom_css">'],
  ['gitea', giteaHandler, '', new Headers({ 'set-cookie': 'i_like_gitea=abc; Path=/' })],
  ['gitlab', gitlabHandler, '<meta property="og:site_name" content="GitLab">'],
  [
    'gnuboard',
    gnuboardHandler,
    '<script>var g5_url = "https://example.org"; var g5_bo_table = "free";</script>',
    new Headers({ 'set-cookie': '2a0d2363701f23f8a75028924a3af643=abc; path=/' }),
  ],
  ['grav', gravHandler, '', new Headers({ 'set-cookie': 'grav-site-9a6a5fc=abc; path=/' })],
  [
    'haleyJobs',
    haleyJobsHandler,
    '<a href="/index.smpl?arg=jb_search">Search Jobs</a>',
    new Headers({ 'x-sasnode': 'v166-alma.haleymarketing.com' }),
  ],
  ['homeland', homelandHandler, '', new Headers({ 'set-cookie': '_homeland_session=abc; path=/' })],
  ['hubspot', hubspotHandler, '', new Headers({ 'x-hs-hub-id': '53' })],
  ['hubzilla', hubzillaHandler, "<script>var zid = '';</script>"],
  [
    'instatus',
    instatusHandler,
    '',
    new Headers({ 'x-matched-path': '/[lang]/[url]/[type]/[userId]' }),
  ],
  ['jimdo', jimdoHandler, '', new Headers({ 'x-jimdo-wid': 's1c8254714bfd7968' })],
  ['jira', jiraHandler, '<meta name="ajs-base-url" content="https://example.org">'],
  ['joomla', joomlaHandler, '<script class="joomla-script-options new">{}</script>'],
  ['koha', kohaHandler, '<link rel="stylesheet" href="/opac-tmpl/bootstrap/css/opac.css">'],
  ['lemmy', lemmyHandler, '<div class="lemmy-site" id="app"></div>'],
  ['mastodon', mastodonHandler, '<div class="app-holder" id="mastodon"></div>'],
  ['mediawiki', mediawikiHandler, '<link rel="EditURI" href="/w/api.php?action=rsd">'],
  ['misskey', misskeyHandler, '<script type="application/json" id="misskey_meta">{}</script>'],
  [
    'mobilizon',
    mobilizonHandler,
    "<noscript>Mobilizon doesn't work properly without JavaScript</noscript>",
  ],
  ['mybb', mybbHandler, '', new Headers({ 'set-cookie': 'mybb[lastvisit]=1790000000; path=/' })],
  ['nethouse', nethouseHandler, '', new Headers({ 'x-generator': 'nethouse' })],
  [
    'ning',
    ningHandler,
    '<link href="https://static.ning.com/socialnetworkmain/widgets/index/css/common.min.css">',
  ],
  ['nodebb', nodebbHandler, '', new Headers({ 'x-powered-by': 'NodeBB' })],
  [
    'noticeable',
    noticeableHandler,
    '<link href="https://assets.noticeable.news/templates/noticeone/css/main.min.css">',
  ],
  [
    'odoo',
    odooHandler,
    '',
    new Headers([
      ['set-cookie', 'frontend_lang=en_US; Path=/'],
      ['set-cookie', 'session_id=abc; Path=/'],
    ]),
  ],
  ['omeka', omekaHandler, '<link href="/plugins/ExhibitBuilder/views/public/css/exhibits.css">'],
  ['opencartJournal', opencartJournalHandler, '<html data-jv="3.0.44">'],
  ['openstatus', openstatusHandler, '<link href="/api/status/summary.json">'],
  ['peertube', peertubeHandler, '', new Headers({ 'x-powered-by': 'PeerTube' })],
  ['phpbb', phpbbHandler, '<body id="phpbb">'],
  ['pixelfed', pixelfedHandler, '<meta name="generator" content="pixelfed">'],
  [
    'pleroma',
    pleromaHandler,
    '<script id="initial-results" type="application/json">{"/api/pleroma/frontend_configurations":{}}</script>',
  ],
  ['pmwiki', pmwikiHandler, '<!--HTMLHeader-->'],
  [
    'podhome',
    podhomeHandler,
    '<link href="https://cdn.podhome.fm/servesite3.min.css"><link rel="alternate" href="https://serve.podhome.fm/rss/6d610788">',
  ],
  [
    'podlove',
    podloveHandler,
    '<link href="/wp-content/plugins/podlove-podcasting-plugin-for-wordpress/css/frontend.css"><link rel="alternate" title="Podcast Feed: Show (MP3)" href="/feed/mp3/">',
  ],
  ['powerpress', powerpressHandler, '<script>function powerpress_pinw(pinw_url){}</script>'],
  [
    'publicInbox',
    publicInboxHandler,
    '<a href="_/text/help/">help</a><a href="_/text/color/">color</a>',
  ],
  ['publii', publiiHandler, '<img src="https://example.org/media/website/logo.png">'],
  ['pukiwiki', pukiwikiHandler, '<link rel="stylesheet" href="skin/pukiwiki.css">'],
  ['shaarli', shaarliHandler, '<div id="shaarli-menu"></div>'],
  ['shopify', shopifyHandler, '', new Headers({ 'powered-by': 'Shopify' })],
  [
    'smf',
    smfHandler,
    '<script>var smf_scripturl = "https://example.org/index.php";var smf_theme_url = "";</script>',
  ],
  ['snac', snacHandler, '', new Headers({ 'x-creator': 'snac/2.95' })],
  ['spip', spipHandler, '', new Headers({ 'composed-by': 'SPIP 4.4.25 @ www.spip.net' })],
  ['squarespace', squarespaceHandler, '', new Headers({ server: 'Squarespace' })],
  ['statuspage', statuspageHandler, '', new Headers({ 'x-statuspage-version': '5a16926c' })],
  ['svbtle', svbtleHandler, '<link href="https://lightning.svbtle.com/cargo/blog.css">'],
  ['textpattern', textpatternHandler, '<meta name="generator" content="Textpattern CMS">'],
  ['ucoz', ucozHandler, '', new Headers({ 'set-cookie': '0exampleuCoz=; path=/' })],
  ['vbulletin', vbulletinHandler, '<script src="/clientscript/vbulletin-core.js"></script>'],
  [
    'webnode',
    webnodeHandler,
    '<script src="https://d11bh4d8fhuq47.cloudfront.net/_system/client/js/frontend.js"></script>',
  ],
  ['wikidot', wikidotHandler, '<a onclick="WIKIDOT.page.listeners.editClick()">Edit</a>'],
  ['wix', wixHandler, '', new Headers({ 'x-wix-request-id': '1790000000.1' })],
  ['writefreely', writefreelyHandler, '<link rel="stylesheet" href="/css/write.css">'],
  ['xenforo', xenforoHandler, '<html id="XF">'],
  [
    'yeswiki',
    yeswikiHandler,
    '',
    new Headers({ 'set-cookie': 'YesWiki-main=0dc6fc2d07d67f79dbe824fa9153cfc3; path=/' }),
  ],
  ['zenfolio', zenfolioHandler, '<link href="https://cdn.zenfolio.com/zf/css/layout.css">'],
]

// Under it.each, a row without headers gets the done callback in their place.
describe('platform handler invariant', () => {
  for (const [platform, handler, value, headers] of cases) {
    it(`should resolve a feed wherever ${platform} matches`, async () => {
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
    })
  }

  // Two handlers matching one page leave the result to their order in the defaults. Only the
  // neutral host is tried, since gitlab.com never serves another platform's markup.
  for (const [platform, , value, headers] of cases) {
    it(`should match ${platform} pages with no other default handler`, () => {
      const violations: Array<string> = []

      for (const path of paths) {
        const url = `https://example.org${path}`
        const matching = defaultPlatformOptions.handlers.filter((handler) => {
          return handler.match(url, value, headers)
        })

        if (matching.length > 1) {
          violations.push(url)
        }
      }

      expect(violations).toEqual([])
    })
  }
})
