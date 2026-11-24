---
title: "Discover Feeds: Platform Method"
---

# Platform Method

The Platform method generates feed URLs for known platforms using URL pattern matching. Most handlers work from the URL alone by recognizing URL structures specific to each platform. Some also read the page content or response headers to detect self-hosted instances or to extract an ID.

## How It Works

The Platform method uses handlers for each supported platform:

1. **Pattern Matching**: Each handler checks if the URL matches its platform (e.g., `github.com`, `youtube.com`).
2. **URL Generation**: The matching handler generates feed URLs based on the URL structure.
3. **First Match**: The first matching handler that generates feeds wins. Subsequent handlers are skipped. A handler that matches but generates nothing passes the page to the next one. Handlers that match by the URL alone are tried before the ones that need the page content or headers, so a page that links another platform's marker stays with its own handler.
4. **Requested URL**: When no handler generates feeds for the fetched page, the handlers run once more on the URL you asked for. A page that redirects, to a sign-in page for example, still yields the feeds its original URL names. This runs only when the redirect stays on the same host, and a handler that read the fetched page and declined it stays out.

> [!TIP]
> Even when feeds are discoverable via HTML `<link>` tags, the Platform method is useful because it generates feed variants the page does not advertise, like a channel's Shorts feed or a repository's releases feed. Handlers that work from the URL alone need no page content, which helps when you [use the method directly](#using-directly) and only have a URL.

## Hints

Platform handlers attach a `hint` to each feed URI they generate. Hints provide a machine-readable `key` and a human-readable `label` that describe what type of feed the URI represents (e.g., "All uploads", "Videos", "Shorts"). This is useful when a single URL generates multiple feed variants and you need to let users pick the right one, especially for feeds that don't include a descriptive title.

Hints are propagated to the final [`DiscoverResult`](/reference/types#discoverresult) objects returned by `discoverFeeds`. Results from non-platform methods (HTML, headers, guess) do not include hints.

When a platform serves the same feed in several formats, like WordPress posts in RSS, Atom and RDF, each variant gets the same `label` and its own `format`. The hint carries the format the platform serves at that URL, so it is there for results that failed to validate too.

```typescript
type DiscoverUriHint = {
  key: string                              // e.g., 'youtube:all', 'wordpress:posts'
  label: string                            // e.g., 'All uploads', 'Posts'
  format?: 'rss' | 'atom' | 'rdf' | 'json' // e.g., 'atom'
}
```

## Supported Platforms

A † after a feed marks one that only the Platform method finds. The page doesn't link it, and the HTML, Headers and Guess methods miss it. A ? marks a feed that failed to load when it was measured, so there's no result for it. The marks come from discovery runs on real pages, so a row with no measured page carries none.

### Apple Podcasts

Discovers RSS feeds for Apple Podcasts shows by extracting the feed URL from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcasts.apple.com/{locale}/podcast/{name}/id{id}` | Podcast<sup>†</sup>* |

\* *Requires HTML content to extract feed URL.*

<sup>†</sup> *Found only by the Platform method.*

### YouTube

Discovers Atom feeds for channels and playlists. Generates ten feed variants for channels: all uploads, then videos, shorts and live streams, each also as a popular and a members-only feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `youtube.com/channel/{id}` | All uploads · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>†</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup> |
| `music.youtube.com/channel/{id}` | All uploads<sup>†</sup> · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>†</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup> |
| `youtube.com/@{handle}` | All uploads · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/user/{name}` | All uploads · videos<sup>†</sup> · shorts<sup>?</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>?</sup> · popular live streams<sup>†</sup> · member videos<sup>†</sup> · member shorts<sup>?</sup> · member live streams<sup>†</sup>* |
| `youtube.com/c/{custom}` | All uploads · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>†</sup> · member shorts<sup>?</sup> · member live streams<sup>†</sup>* |
| `youtube.com/watch?v={id}` | All uploads<sup>†</sup> · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtu.be/{id}` | All uploads<sup>†</sup> · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/shorts/{id}` | All uploads<sup>†</sup> · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/live/{id}` | All uploads<sup>†</sup> · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>?</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup>* |
| `youtube.com/embed/live_stream?channel={id}` | All uploads<sup>†</sup> · videos<sup>†</sup> · shorts<sup>†</sup> · live streams<sup>†</sup> · popular videos<sup>†</sup> · popular shorts<sup>†</sup> · popular live streams<sup>†</sup> · member videos<sup>†</sup> · member shorts<sup>?</sup> · member live streams<sup>?</sup> |
| `youtube.com/embed?listType=user_uploads&list={name}` | All uploads<sup>†</sup> |
| `youtube.com/playlist?list={id}`, `youtube.com/watch?v={id}&list={id}` or `youtube.com/embed/videoseries?list={id}` | Playlist<sup>†</sup>, or for a channel's uploads list the channel feed of its prefix: all uploads<sup>†</sup> for `UU{id}`, videos<sup>†</sup> for `UULF{id}` and so on |

\* *Requires HTML content to extract channel ID.*

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Reddit

Discovers Atom feeds for subreddits, users, multireddits, wikis, searches, and domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `reddit.com` | Homepage<sup>†</sup> |
| `reddit.com/{sort}` | Sorted posts (hot/new/rising/controversial/top/best) |
| `reddit.com/search?q={query}` | Search results<sup>†</sup> |
| `reddit.com/subreddits` | Subreddits |
| `reddit.com/subreddits/{new\|popular}` | Sorted subreddits |
| `reddit.com/r/{subreddit}` | Subreddit posts · comments<sup>†</sup> |
| `reddit.com/r/{subreddit}/{sort}` | Sorted posts<sup>†</sup> (hot/new/rising/controversial/top/best) · comments<sup>†</sup> |
| `reddit.com/r/{subreddit}/search?q={query}` | Subreddit search results |
| `reddit.com/r/{subreddit}/wiki` | Wiki |
| `reddit.com/r/{subreddit}/comments/{id}` | Post comments<sup>†</sup> |
| `reddit.com/u/{username}` | User activity<sup>†</sup> |
| `reddit.com/user/{username}/submitted` | Submitted posts<sup>†</sup>, plus the feeds above |
| `reddit.com/user/{username}/comments` | User comments · user activity |
| `reddit.com/user/{username}/comments/{id}` | Post comments |
| `reddit.com/user/{username}/m/{multireddit}` | Multireddit<sup>†</sup> |
| `reddit.com/domain/{domain}` | Domain submissions |

<sup>†</sup> *Found only by the Platform method.*

### Medium

Discovers RSS feeds for Medium user profiles, publications, tags, and subdomains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `medium.com/@{username}` | User posts |
| `medium.com/{publication}` | Publication |
| `medium.com/tag/{tag}` | Tag<sup>†</sup> |
| `medium.com/{publication}/tagged/{tag}` | Tagged publication |
| `{publication}.medium.com` | Subdomain publication |
| `{publication}.medium.com/tagged/{tag}` | Subdomain tagged |

<sup>†</sup> *Found only by the Platform method.*

### Substack

Discovers RSS feeds for Substack newsletters and podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{publication}.substack.com` | Newsletter · podcast<sup>†</sup>* · podcast section<sup>†</sup>* |
| `{publication}.substack.com/s/{section}` | The publication's feeds · newsletter section* |
| `substack.com/@{user}` | Newsletter<sup>†</sup>* |

\* *Read from the page content. On a profile, the publication can differ from the handle and can sit on a custom domain, with the handle as the fallback. On a publication page, one podcast feed for a publication with a podcast, and one podcast section feed for each section that is a podcast.*

<sup>†</sup> *Found only by the Platform method.*

### WordPress.com

Discovers RSS and Atom feeds for WordPress.com and Unblog blogs, with category, tag, and author support.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.wordpress.com` | Posts (RSS + Atom + RDF<sup>†</sup>) · comments (RSS + Atom<sup>†</sup>) |
| `{blog}.wordpress.com/category/{category}` | Category (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `{blog}.wordpress.com/category/{parent}/{category}` | Nested category (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `{blog}.wordpress.com/tag/{tag}` | Tag (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `{blog}.wordpress.com/author/{author}` | Author (RSS + Atom + RDF<sup>†</sup>), plus the feeds above |
| `{blog}.wordpress.com/{yyyy}`, `{blog}.wordpress.com/{yyyy}/{mm}` or `{blog}.wordpress.com/{yyyy}/{mm}/{dd}` | Date archive (RSS<sup>†</sup> + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `{blog}.wordpress.com/{post}` | Post comments (RSS + Atom<sup>†</sup>), plus the feeds above |
| `{blog}.unblog.fr` | Same as `{blog}.wordpress.com` (Unblog) |
| `{blog}.hypotheses.org` | Same as `{blog}.wordpress.com` |
| `{blog}.hypotheses.org/{post_id}` | Post comments (RSS + Atom<sup>†</sup>), plus the feeds above |
| `{blog}.hypotheses.org/date/{yyyy}`, `/date/{yyyy}/{mm}` or `/date/{yyyy}/{mm}/{dd}` | Date archive (RSS<sup>†</sup> + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `{blog}.home.blog` | Same as `{blog}.wordpress.com` |
| `{blog}.wpcomstaging.com` | Same as `{blog}.wordpress.com` |
| `{blog}.edublogs.org` | Same as `{blog}.wordpress.com` |

<sup>†</sup> *Found only by the Platform method.*

### WP Engine

Discovers feeds for WP Engine-hosted WordPress sites. Uses the same feed structure as [WordPress.com](#wordpress-com).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.wpenginepowered.com` | Posts (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>) · comments (RSS + Atom<sup>†</sup>) |
| `{site}.wpengine.com` | Posts (RSS + Atom + RDF<sup>†</sup>) · comments (RSS<sup>†</sup> + Atom<sup>†</sup>) |
| `{site}.wpengine.com/category/{category}` or `{site}.wpenginepowered.com/category/{category}` | Category (RSS + Atom + RDF), plus the feeds above |
| `{site}.wpengine.com/category/{parent}/{category}` or `{site}.wpenginepowered.com/category/{parent}/{category}` | Nested category (RSS + Atom + RDF), plus the feeds above |
| `{site}.wpengine.com/tag/{tag}` or `{site}.wpenginepowered.com/tag/{tag}` | Tag (RSS + Atom + RDF), plus the feeds above |
| `{site}.wpengine.com/author/{author}` or `{site}.wpenginepowered.com/author/{author}` | Author (RSS + Atom + RDF), plus the feeds above |
| `{site}.wpengine.com/{yyyy}`, `/{yyyy}/{mm}` or `/{yyyy}/{mm}/{dd}`, and the same on `{site}.wpenginepowered.com` | Date archive (RSS<sup>†</sup> + Atom<sup>†</sup> + RDF<sup>†</sup>), plus the feeds above |
| `{site}.wpengine.com/{post}` or `{site}.wpenginepowered.com/{post}` | Post comments (RSS + Atom<sup>†</sup>), plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

### Blogspot

Discovers RSS and Atom feeds for Blogspot blogs, including label, comments, summary, and per-post comments feeds. Also matches country-coded TLDs (`*.blogspot.co.uk`, `*.blogspot.de`, etc.), and Blogger blogs on custom domains, detected by the `www.blogger.com/static/v1/widgets/` assets every Blogger page loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blogspot.com` | Posts (Atom + RSS) · summary (Atom + RSS) · comments (Atom + RSS<sup>†</sup>) · comments summary (Atom + RSS<sup>†</sup>) |
| `{blog}.blogspot.com/search/label/{label}` | Label<sup>†</sup> (Atom + RSS) · label summary<sup>†</sup> (Atom + RSS), plus the feeds above |
| `{blog}.blogspot.com/{year}/{month}/{slug}.html` | Post comments (Atom + RSS<sup>†</sup>)*, plus the feeds above |
| `{host}`, `{host}/search/label/{label}`, `{host}/{year}/{month}/{slug}.html` | Same as on `{blog}.blogspot.com` |

\* *Requires HTML content to extract the post ID.*

<sup>†</sup> *Found only by the Platform method.*

### DEV.to

Discovers RSS feeds for DEV.to user profiles, tags, the global community, and the latest sort.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dev.to` | Community · latest<sup>†</sup> sort<sup>†</sup> |
| `dev.to/latest` | Latest sort<sup>†</sup> · community |
| `dev.to/{username}` | User or organization posts |
| `dev.to/{username}/{article}` | Author's posts<sup>†</sup> |
| `dev.to/t/{tag}` | Tag posts<sup>†</sup> |

> Every page above also gets the community and latest sort feeds after its own.

<sup>†</sup> *Found only by the Platform method.*

### GitHub

Discovers Atom feeds for users, organizations, and repositories.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `github.com/{user}` or `github.com/{user}.png` | User activity<sup>†</sup> |
| `github.com/orgs/{org}` | Organization activity |
| `github.com/orgs/{org}/discussions` | Organization discussions<sup>†</sup> |
| `github.com/orgs/{org}/discussions/categories/{category}` | Discussion category<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}` | Releases<sup>†</sup> · commits<sup>†</sup> · tags<sup>†</sup> |
| `github.com/{owner}/{repo}/wiki` | Wiki changes<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/discussions` | Discussions<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/discussions/categories/{category}` | Discussion category<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/tree/{branch}` or `github.com/{owner}/{repo}/commits/{branch}` | Branch commits<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/blob/{branch}/{path}` | File commits<sup>†</sup>, plus the feeds above |
| `github.com/{owner}/{repo}/commits/{branch}/{path}` | File commits<sup>†</sup>, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

### Gitea

Discovers Atom and RSS feeds for Gitea users, repositories, releases, tags, branch commits and file history, one entry per format. Codeberg and `gitea.com` are matched by host; any other instance is matched by the session cookie Gitea sets on a repository page. An install under a sub-path gets its feeds there, read from `appSubUrl` in the page config.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/{user}` or `{root}/{user}.keys` | User activity |
| `{root}/{user}/{repo}` | Releases<sup>†</sup> · tags<sup>†</sup> · activity |
| `{root}/{user}/{repo}/src/branch/{branch}` | Branch commits<sup>†</sup>, plus the feeds above |
| `{root}/{user}/{repo}/src/branch/{branch}/{path}` | File history (Atom<sup>†</sup> + RSS), plus the feeds above |
| `{root}/{user}/{repo}/commits/branch/{branch}` | Branch commits<sup>†</sup>, plus the feeds above |
| `{root}/{user}/{repo}/commits/branch/{branch}/{path}` | File history<sup>†</sup>, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A self-hosted Forgejo instance sets no cookie on an anonymous request and is not matched; Codeberg, which runs Forgejo, is covered by the host list.

### GitLab

Discovers Atom feeds for GitLab users and repositories. Self-hosted instances are detected by the `window.gon` config script together with bundles under `/assets/webpack/`, which every GitLab page prints, or by the `X-Gitlab-Meta` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `gitlab.com/{user}` | User activity |
| `gitlab.com/{project}` | Releases<sup>†</sup> · tags<sup>†</sup> · issues<sup>†</sup> · merge requests<sup>†</sup> · activity |
| `gitlab.com/{project}/-/commits/{branch}` | Branch commits, plus the feeds above |
| `gitlab.com/{project}/-/tree/{branch}` | Branch commits, plus the feeds above |

<sup>†</sup> *Found only by the Platform method.*

> `{project}` is the full path and can be any depth, because groups nest: `group/subgroup/project` is one project. GitLab puts `/-/` between the project path and the feature path, which is where the split happens.

### Pinterest

Discovers RSS feeds for Pinterest user profiles and boards, on `pinterest.com` and on country sites such as `uk.pinterest.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pinterest.com/{username}` | User pins<sup>†</sup> |
| `pinterest.com/{username}/{board}` | Board pins |

<sup>†</sup> *Found only by the Platform method.*

### Dailymotion

Discovers RSS feeds for Dailymotion users, playlists, channels, searches, and the global trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dailymotion.com/{username}` or `dailymotion.com/user/{username}` | User videos<sup>†</sup> |
| `dailymotion.com/playlist/{id}` | Playlist<sup>†</sup> |
| `dailymotion.com/channel/{name}` | Channel<sup>†</sup> |
| `dailymotion.com/search/{query}` | Search<sup>†</sup> |
| `dailymotion.com` or `dailymotion.com/trending` | Trending<sup>†</sup> |

> Every page above also gets the trending feed after its own.

<sup>†</sup> *Found only by the Platform method.*

### DeviantArt

Discovers RSS feeds for DeviantArt user portfolios, gallery folders, favourites, and journals.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `deviantart.com/{username}` | User deviations<sup>†</sup> |
| `deviantart.com/{username}/gallery` | User gallery<sup>†</sup> |
| `deviantart.com/{username}/gallery/{id}` | Gallery folder<sup>†</sup> |
| `deviantart.com/{username}/favourites` | User favourites<sup>†</sup> |
| `deviantart.com/{username}/journal` | Journal |

<sup>†</sup> *Found only by the Platform method.*

### Mastodon

Discovers RSS feeds for Mastodon user profiles and hashtag pages. Detects Mastodon instances via the `<meta name="generator">` HTML tag, the `<div id="mastodon">` app root or the `Server` response header. There is no hardcoded instance list.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{username}` or `{instance}/users/{username}` | User posts |
| `{instance}/@{username}/tagged/{tag}` | User posts tagged · posts<sup>†</sup> |
| `{instance}/@{username}/with_replies` | User posts with replies<sup>†</sup> · posts |
| `{instance}/@{username}/media` | User media-only<sup>†</sup> · posts |
| `{instance}/tags/{tag}` | Hashtag<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Requires page content or response headers to detect Mastodon instances. Works with any Mastodon-compatible server, not just well-known instances.

### Tumblr

Discovers RSS feeds for Tumblr blogs and tagged posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.tumblr.com` | Blog posts · theme posts · podcast |
| `{blog}.tumblr.com/tagged/{tag}` | Tagged posts<sup>†</sup> |
| `www.tumblr.com/{blog}` | Blog posts · theme posts<sup>?</sup> · podcast<sup>?</sup> |
| `www.tumblr.com/blog/view/{blog}` | Blog posts · theme posts · podcast |
| `www.tumblr.com/{blog}/tagged/{tag}` | Tagged posts |

> Every tag page above also gets the blog posts, theme posts and podcast after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Behance

Discovers RSS feeds for Behance user portfolios, plus the homepage Featured-projects feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `behance.net` or `behance.net/galleries` | Featured projects |
| `behance.net/{username}` | User portfolio<sup>†</sup> |
| `behance.net/{username}/appreciated` | User portfolio<sup>†</sup>* |
| `behance.net/{username}/{tab}` | User portfolio |
| Any other page | Featured projects |

> Every page above also gets the featured projects after its own feeds.

\* *Behance ignores `content=appreciated` and serves the user's own projects, so the appreciated page gets the portfolio feed.*

<sup>†</sup> *Found only by the Platform method.*

### SoundCloud

Discovers RSS feeds for SoundCloud user profiles and playlists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `soundcloud.com/{user}` | User sounds<sup>†</sup>* |
| `soundcloud.com/{user}/sets/{playlist}` | Playlist sounds<sup>†</sup>* |

\* *Requires HTML content to extract the user or playlist ID.*

<sup>†</sup> *Found only by the Platform method.*

### Vimeo

Discovers RSS feeds for Vimeo user profiles, channels, groups, and albums (showcases).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `vimeo.com/{user}` | User videos |
| `vimeo.com/{user}/likes` | User likes · user videos<sup>†</sup> |
| `vimeo.com/channels/{channel}` | Channel |
| `vimeo.com/groups/{group}` | Group |
| `vimeo.com/album/{id}` or `vimeo.com/showcase/{id}` | Album/showcase<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Launchpad

Discovers the Atom feeds Launchpad serves on `feeds.launchpad.net` for projects, distributions, people, teams, bugs and Bazaar branches. The `bugs.` and `code.` subdomains get the feeds of their own section.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `launchpad.net` | Announcements · latest bugs<sup>†</sup> |
| `bugs.launchpad.net` | Latest bugs<sup>†</sup> · announcements<sup>†</sup> |
| `launchpad.net/{project}` | Announcements · latest bugs · branches · revisions |
| `bugs.launchpad.net/{project}` | Latest bugs |
| `code.launchpad.net/{project}` | Branches · revisions |
| `launchpad.net/~{user}` | Latest bugs · branches · revisions |
| `bugs.launchpad.net/~{user}` | Latest bugs |
| `code.launchpad.net/~{user}` | Branches<sup>†</sup> · revisions<sup>†</sup> |
| `bugs.launchpad.net/{distro}/+source/{package}` | Package latest bugs |
| `launchpad.net/{distro}/+source/{package}` | Package latest bugs<sup>†</sup> |
| `bugs.launchpad.net/{project}/+bug/{id}` or `bugs.launchpad.net/bugs/{id}` | Bug |
| `launchpad.net/{project}/+bug/{id}` or `launchpad.net/bugs/{id}` | Bug |
| `code.launchpad.net/~{user}/{project}/{branch}` | Branch |
| `code.launchpad.net/~{user}/{distro}/{series}/{package}/{branch}` | Branch |

> Every page past the two home pages also gets the site-wide announcements and latest bugs after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

### Letterboxd

Discovers RSS feeds for Letterboxd user profiles.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `letterboxd.com/{username}` | User diary |
| `letterboxd.com/journal` | Journal |

> Every page above also gets the journal after its own feeds.

### Steam

Discovers RSS feeds for Steam game news and community groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `store.steampowered.com` | Daily deals<sup>†</sup> · new releases<sup>†</sup> · weekly top sellers<sup>†</sup> |
| `store.steampowered.com/news` | Daily deals<sup>†</sup> · new releases<sup>†</sup> · weekly top sellers<sup>†</sup> |
| `store.steampowered.com/news/group/{id}` | Group news<sup>†</sup> |
| `store.steampowered.com/news/collection/{name}` | News collection<sup>†</sup> |
| `store.steampowered.com/app/{id}` | Game news<sup>†</sup> · community news<sup>?</sup> |
| `store.steampowered.com/news/app/{id}` | Game news<sup>†</sup> · community news<sup>?</sup> |
| `store.steampowered.com/newshub/app/{id}` | Game news · community news |
| `steamcommunity.com/app/{id}` | Game news<sup>†</sup> · community news<sup>?</sup> |
| `steamcommunity.com/groups/{name}` | Group<sup>†</sup> (RSS) |

> Every store page above also gets the daily deals, new releases and weekly top sellers after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Stack Exchange

Discovers Atom feeds for Stack Overflow, Server Fault, Super User, Ask Ubuntu, MathOverflow, Stack Apps, and all `*.stackexchange.com` sites. The `stackexchange.com` network host gives only its newest questions feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}` | Site-wide newest questions |
| `{host}/questions/tagged/{tag}` | Tag<sup>†</sup> |
| `{host}/questions/{id}` | Question |
| `{host}/users/{id}` | User<sup>†</sup> |
| `{host}/collectives/{name}` | Collective<sup>†</sup> |

> Every page above also gets the site-wide newest questions after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Tag feeds accept `?sort={newest|active|votes|creation|hot|week|month}` (also `?tab=…`). The value is passed through to the generated feed URL when it matches one of the allowed sorts. Unknown values are silently dropped.

### Hashnode

Discovers RSS feeds for Hashnode blogs on `*.hashnode.dev` and `*.hashnode.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.hashnode.dev` | Blog |
| `{blog}.hashnode.com` | Blog |

### Paragraph

Discovers RSS feeds for Paragraph blogs (successor to Mirror.xyz).

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `paragraph.com/@{username}` | Blog |

### Hatena Antenna

Discovers RSS feeds for Hatena Antenna users and their groups.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `a.hatena.ne.jp/{user}` | Antenna |
| `a.hatena.ne.jp/{user}/?gid={group}` | Group |

> A group id the user does not have falls back to the antenna feed, since Hatena serves an empty feed under any made-up group id. A real group with no updated page keeps its own feed.

### Hatena Blog

Discovers RSS and Atom feeds for Hatena Blog on `*.hatenablog.com`, `*.hatenablog.jp`, `*.hateblo.jp`, `*.hatenadiary.com`, `*.hatenadiary.jp`, and `*.hatenadiary.org`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.hatenablog.com` | Posts (RSS + Atom) |
| `{blog}.hatenablog.jp` | Posts (RSS + Atom) |
| `{blog}.hateblo.jp` | Posts (RSS + Atom) |
| `{blog}.hatenadiary.com` | Posts (RSS + Atom) |
| `{blog}.hatenadiary.jp` | Posts (RSS + Atom) |
| `{blog}.hatenadiary.org` | Posts (RSS + Atom) |
| `{blog}.{domain}/archive/category/{category}` | Category (RSS + Atom) · posts |
| `{blog}.{domain}/archive/author/{author}` | Author (RSS + Atom) · posts |

### Itch.io

Discovers RSS feeds for Itch.io games, creators, devlogs, and browse pages.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{creator}.itch.io/{game}` | Game devlog |
| `{creator}.itch.io` | Creator's games<sup>†</sup> |
| `itch.io/games` | Games<sup>†</sup> |
| `itch.io/games/by-{username}` | Creator's games<sup>†</sup> |
| `itch.io/games/tag-{tag}` | Tag<sup>†</sup> |
| `itch.io/games/platform-{platform}` | Platform<sup>†</sup> |
| `itch.io/games/genre-{genre}` | Genre<sup>†</sup> |
| `itch.io/games/made-with-{engine}` | Engine<sup>†</sup> |
| `itch.io/games/{sort}` | Sorted games<sup>†</sup> (newest/top-rated/top-sellers/on-sale/free/released/in-development) |
| `itch.io/games/{filter}/{filter}` | Games<sup>†</sup>, for a listing with two or more filters |
| `itch.io/{section}` | Section<sup>†</sup> (tools/game-assets/soundtracks/physical-games/books/comics/misc) |
| `itch.io/devlogs` | All devlogs |
| `itch.io` | Featured · new<sup>†</sup> · sales<sup>†</sup> · all devlogs |

<sup>†</sup> *Found only by the Platform method.*

> Every page above also gets the site-wide feeds after its own: featured, new, sales and all devlogs. Most pages link none of them, so there they are found only by the Platform method. The itch.io blog, updates and digest are the platform's own news, so the handler neither builds nor claims them.

### CSDN

Discovers RSS feeds for CSDN user blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.csdn.net/{username}` | Blog<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Douban

Discovers RSS feeds for Douban user interests, reviews, notes, and subject reviews.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.douban.com/people/{user}` | Interests · reviews<sup>†</sup> · notes<sup>†</sup> |
| `{book,movie,music}.douban.com/subject/{id}` | Subject reviews |
| `www.douban.com` | Book<sup>†</sup> · movie<sup>†</sup> · music<sup>†</sup> · drama<sup>†</sup> reviews · new movie reviews<sup>†</sup> · popular reviews<sup>†</sup> |

> Every page above also gets the category review feeds after its own.

<sup>†</sup> *Found only by the Platform method.*

### Ximalaya

Discovers RSS feeds for Ximalaya podcast albums.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.ximalaya.com/album/{id}` or `www.ximalaya.com/{user}/album/{id}` | Album<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Bear Blog

Discovers Atom and RSS feeds for Bear Blog, including tag-filtered feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bearblog.dev` | Trending<sup>†</sup> (Atom + RSS) |
| `{blog}.bearblog.dev` | Posts (Atom + RSS) |
| `{blog}.bearblog.dev/blog/?q={tag}` | Tag (Atom + RSS) · posts |

<sup>†</sup> *Found only by the Platform method.*

### Buttondown

Discovers RSS feeds for Buttondown newsletters.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buttondown.com/{user}` | Newsletter |

### Excite Blog

Discovers RSS and Atom feeds for Excite Blog, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.exblog.jp` | Posts (RSS + Atom) |
| `{blog}.exblog.jp/i{N}` | Category (RSS + Atom) · posts |

### Fireside.fm

Discovers RSS and JSON feeds for Fireside.fm-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{podcast}.fireside.fm` | Podcast (RSS + JSON) · blog<sup>?</sup> |
| `{podcast}.fireside.fm/tags/{tag}` | Tag · podcast (RSS + JSON) · blog |

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Firstory

Discovers the RSS feed of a Firstory podcast. The feed is keyed by the show's ID, which the handler reads from the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `open.firstory.fm/user/{show}` | Podcast (RSS)* |
| `open.firstory.fm/story/{episodeId}` | Podcast (RSS)* |
| `{show}.firstory.cc` | Podcast (RSS)* |
| `{show}.firstory.cc/episodes/{episodeId}` | Podcast (RSS)* |

\* *Requires HTML content to read the show ID.*

### Listed

Discovers RSS feeds for Listed (Standard Notes) blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `listed.to/@{user}` | Blog |

### MyAnimeList

Discovers RSS feeds for MyAnimeList user lists and site-wide news.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `myanimelist.net/profile/{user}` | Anime list<sup>†</sup> · Manga list<sup>†</sup> · Recently watched<sup>†</sup> · Recently read<sup>†</sup> · Blog (RSS) |
| `myanimelist.net/animelist/{user}` | Anime list<sup>†</sup> · Manga list<sup>†</sup> · Recently watched<sup>†</sup> · Recently read<sup>†</sup> · Blog<sup>†</sup> (RSS) |
| `myanimelist.net/mangalist/{user}` | Anime list<sup>†</sup> · Manga list<sup>†</sup> · Recently watched<sup>†</sup> · Recently read<sup>†</sup> · Blog<sup>†</sup> (RSS) |
| `myanimelist.net/history/{user}` | (same as above) |
| `myanimelist.net/news` | Site-wide news · featured<sup>†</sup> articles |
| `myanimelist.net/featured` | Featured articles · site-wide news<sup>†</sup> |
| Any other page | Site-wide news · featured articles |

> Every page above also gets the site-wide news and featured articles after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

### note.com

Discovers RSS feeds for note.com, including hashtag and magazine feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `note.com` | Featured |
| `note.com/{user}` | Blog |
| `note.com/{user}/n/{noteId}` | Blog |
| `note.com/hashtag/{tag}` or `note.com/tag/{tag}` | Hashtag<sup>†</sup> |
| `note.com/{user}/m/{magazineId}` | Magazine<sup>†</sup> |

> Every page above also gets the featured feed after its own.

<sup>†</sup> *Found only by the Platform method.*

### Odysee

Discovers RSS feeds for Odysee channels.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `odysee.com/@{channel}:{id}` | Videos<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Tistory

Discovers RSS feeds for Tistory blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.tistory.com` | Blog |

### Transistor

Discovers RSS feeds for Transistor-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.transistor.fm` | Podcast* |

\* *The feed slug can differ from the subdomain. It is read from the page content when available, with the subdomain as the fallback.*

### Velog

Discovers RSS feeds for Velog users and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `velog.io/@{user}` | Posts<sup>†</sup> |
| `velog.io` | Trending posts<sup>†</sup> |
| Any other page | Trending posts |

> Every page above also gets the trending posts after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

### Acast

Discovers RSS feeds for Acast-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `shows.acast.com/{slug}` | Podcast (RSS) |
| `play.acast.com/s/{slug}` | Podcast (RSS) |
| `embed.acast.com/{slug}` or `/$/{slug}/{episode}` | Podcast<sup>†</sup> (RSS) |
| `player.acast.com/{slug}/episodes/{episode}` | Podcast<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Ameba Blog

Discovers RSS, Atom, and RDF feeds for Ameba Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ameblo.jp/{user}` | Posts (RSS + Atom + RDF<sup>†</sup>) |
| `ameblo.jp/s/embed/reblog-card/{user}/entry-{id}.html` | Posts<sup>†</sup> (RSS + Atom + RDF) |
| `ameblo.jp/p/embed/{user}/image-{id}.html` | Posts<sup>†</sup> (RSS + Atom + RDF) |

<sup>†</sup> *Found only by the Platform method.*

### Audioboom

Discovers RSS feeds for Audioboom channels and playlists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `audioboom.com/channels/{id}` | Podcast (RSS) |
| `audioboom.com/playlists/{id}` | Playlist (RSS) |

### Ausha

Discovers the RSS feed of an Ausha show by reading its feed id from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `podcast.ausha.co/{show}` | Podcast<sup>†</sup> (RSS)* |
| `podcast.ausha.co/{show}/{episode}` | Podcast<sup>†</sup> (RSS)* |
| `smartlink.ausha.co/{show}` | Podcast (RSS)* |
| `smartlink.ausha.co/{show}/{episode}` | Podcast (RSS)* |

\* *Requires HTML content to extract the feed id.*

<sup>†</sup> *Found only by the Platform method.*

### Buzzsprout

Discovers RSS feeds for Buzzsprout-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `buzzsprout.com/{id}` | Podcast |

### CANPAN Blog

Discovers RSS 2.0 and RDF feeds for CANPAN Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.canpan.info/{blog}` | Posts (RSS 2.0<sup>†</sup> + RDF) |

<sup>†</sup> *Found only by the Platform method.*

### Canalblog

Discovers RSS feeds for Canalblog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.canalblog.com` | Posts |

### Captivate

Discovers RSS feeds for Captivate-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.captivate.fm` | Podcast · latest episode<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Castopod

Discovers the RSS feed of a podcast hosted on a Castopod instance. Detected by the theme colors stylesheet that Castopod prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/@{handle}` | Podcast (RSS) |
| `{root}/@{handle}/episodes/{slug}` | Podcast (RSS) |

### Castos

Discovers RSS feeds for podcasts with a Castos-hosted website.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{podcast}.castos.com` | Podcast (RSS) |

### Flickr

Discovers Atom and RSS feeds for Flickr photostreams, favorites, tags, groups and the help forum.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `flickr.com/photos/tags/{tag}` | Tag<sup>†</sup> |
| `flickr.com/photos/{nsid}` | Photostream (Atom · RSS<sup>†</sup>) |
| `flickr.com/photos/{nsid}/favorites` | Favorites (Atom · RSS<sup>†</sup>) |
| `flickr.com/photos/{nsid}/albums/{set}` | Album · photostream |
| `flickr.com/photos/{nsid}/tags/{tag}` | Tagged photostream<sup>†</sup> · photostream |
| `flickr.com/groups/{nsid}` | Group pool (Atom<sup>†</sup> · RSS) · group photos<sup>†</sup> · discussions · pool with location (Atom · RSS<sup>†</sup>) |
| `flickr.com/groups/{nsid}/pool` | Group pool (Atom<sup>†</sup> · RSS) · group photos<sup>†</sup> · pool with location (Atom · RSS<sup>†</sup>) |
| `flickr.com/groups/{nsid}/discuss` | Group discussions |
| `flickr.com/help/forum` | Forum<sup>†</sup> · uploads from everyone<sup>†</sup> · uploads from everyone with location<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> Every page above also gets the site-wide feeds after its own: the forum, the uploads from everyone and the uploads from everyone with location, all found only by the Platform method. Every feed comes as Atom and as its RSS 2.0 twin under `format=rss_200`.

> The photo and group feeds take an NSID such as `24662369@N07`, never a vanity alias: `photos_public.gne?id={alias}` answers 404. A URL carrying an alias is left to the other methods, and the page itself links the right feed.

### Friendica

Discovers Atom feeds for Friendica user profiles. Detected by the `Friendica` generator meta tag or the `X-Friendica-Version` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/profile/{user}`, `{root}/u/{user}` or `{root}/~{user}` | Posts · comments · replies · activity (Atom) |

### Ghost

Discovers RSS feeds for Ghost-hosted blogs, including tag and author feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.ghost.io` | Blog |
| `{blog}.ghost.io/tag/{slug}` | Tag · blog |
| `{blog}.ghost.io/author/{slug}` | Author · blog |

### Hearthis.at

Discovers RSS feeds for Hearthis.at user profiles, plus the site-wide new tracks feed every page links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `hearthis.at/{user}` | Tracks · track list · new tracks |

### InsaneJournal

Discovers RSS and Atom feeds for InsaneJournal journals.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.insanejournal.com` | Posts (RSS + Atom) · userpics<sup>†</sup> (Atom) |
| `insanejournal.com/users/{user}` or `insanejournal.com/~{user}` | Posts (RSS + Atom) · userpics<sup>†</sup> (Atom) |
| `asylums.insanejournal.com/{asylum}`, `insanejournal.com/asylum/{asylum}` or `insanejournal.com/community/{asylum}` | Posts (RSS + Atom) · userpics<sup>†</sup> (Atom) |
| `feeds.insanejournal.com/{feed}` | Posts<sup>†</sup> (RSS + Atom) · userpics<sup>?</sup> (Atom) |
| `users.insanejournal.com/{journal}` | Posts (RSS + Atom) · userpics (Atom) |
| `{user}.insanejournal.com/tag/{tag}`, `insanejournal.com/users/{user}/tag/{tag}` or `insanejournal.com/~{user}/tag/{tag}` | Tag (RSS + Atom) · posts (RSS + Atom) · userpics (Atom) |
| `users.insanejournal.com/{journal}/tag/{tag}`, `asylums.insanejournal.com/{asylum}/tag/{tag}`, `insanejournal.com/asylum/{asylum}/tag/{tag}` or `feeds.insanejournal.com/{feed}/tag/{tag}` | Tag (RSS + Atom) · posts (RSS + Atom) · userpics (Atom) |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Libsyn

Discovers RSS feeds for Libsyn-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{slug}.libsyn.com` | Podcast |
| `feeds.libsyn.com/{showId}` | Podcast |

### Livedoor Blog

Discovers RDF and Atom feeds for Livedoor Blog on `*.blog.jp`, `*.doorblog.jp`, `*.ldblog.jp`, and `*.livedoor.biz`, including category feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.jp` | Posts (RDF + Atom) |
| `{blog}.blog.jp/archives/cat_{N}.html` | Category (RDF) · posts |
| `{blog}.doorblog.jp` | Posts (RDF + Atom) |
| `{blog}.doorblog.jp/archives/cat_{N}.html` | Category (RDF) · posts |
| `{blog}.ldblog.jp` | Posts (RDF + Atom) |
| `{blog}.ldblog.jp/archives/cat_{N}.html` | Category (RDF) · posts |
| `{blog}.livedoor.biz` | Posts (RDF + Atom) |
| `{blog}.livedoor.biz/archives/cat_{N}.html` | Category (RDF) · posts |

### Megaphone

Discovers RSS feeds for Megaphone-hosted podcasts from their embed players.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `playlist.megaphone.fm/?p={id}` | Podcast<sup>†</sup> |
| `player.megaphone.fm/{episode}` | Podcast* |

\* *Requires HTML content to read the show ID.*

<sup>†</sup> *Found only by the Platform method.*

### Micro.blog

Discovers RSS, JSON, and podcast feeds for Micro.blog-hosted blogs, including category, archive, and photos feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.micro.blog` | Posts (RSS + JSON) · podcast (RSS + JSON<sup>†</sup>) |
| `{blog}.micro.blog/categories/{slug}` | Category (RSS + JSON), plus the feeds above |
| `{blog}.micro.blog/archive` | Archive<sup>†</sup>, plus the feeds above |
| `{blog}.micro.blog/photos` | Photos<sup>†</sup>, plus the feeds above |

> Every page above also gets the archive and photos feeds after its own.

<sup>†</sup> *Found only by the Platform method.*

### Misskey

Discovers Atom, RSS, and JSON feeds for Misskey and Sharkey user profiles. Detected by the `Misskey` or `Sharkey` application-name meta tag, or the `misskey_meta` script tag.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/@{user}` | Posts<sup>†</sup> (Atom + RSS + JSON) |

<sup>†</sup> *Found only by the Platform method.*

### Naver Blog

Discovers RSS feeds for Naver Blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.naver.com/{id}` | Blog (RSS + Atom<sup>†</sup> + RDF<sup>†</sup>) |
| `m.blog.naver.com/{id}` | Blog<sup>†</sup> |
| `blog.naver.com/PostView.naver?blogId={id}` or `m.blog.naver.com/PostView.naver?blogId={id}` | Blog |

<sup>†</sup> *Found only by the Platform method.*

### Observable

Discovers RSS feeds for Observable user notebooks and collections.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `observablehq.com/@{user}` | Notebooks<sup>†</sup> |
| `observablehq.com/@{user}/collection/{slug}` or `/@{user}/-/collection/{slug}` | Collection<sup>†</sup> |
| `observablehq.com/recent` or `/public?sort=publish_time` | Recent<sup>†</sup> · trending<sup>†</sup> |
| `observablehq.com/trending` or `/public` | Trending<sup>†</sup> · recent<sup>†</sup> |

> Every page above also gets the recent and trending feeds after its own.

<sup>†</sup> *Found only by the Platform method.*

### Podbean

Discovers RSS feeds for Podbean-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.podbean.com` | Podcast · latest episode<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Podigee

Discovers RSS feeds for Podigee-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{podcast}.podigee.io` | Podcast (RSS) |

The aac, opus and vorbis feeds, `/feed/{encoding}` and `/feeds/{feed}/{encoding}`, are claimed under keys of their own and never built: no page links them, and a show without an encoding answers 302 to `/feed/mp3`.

### Postach.io

Discovers Atom feeds for Postach.io sites.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.postach.io` | Posts (Atom) |

### Posthaven

Discovers Atom feeds for Posthaven blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.posthaven.com` | Posts (Atom) |
| `{blog}.posthaven.com/tag/{tag}` | Tag<sup>†</sup> (Atom) · posts (Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Qiita

Discovers Atom feeds for Qiita users, tags, organizations, and popular items.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `qiita.com/{user}` | User posts |
| `qiita.com/tags/{tag}` | Tag |
| `qiita.com/organizations/{org}` | Organization |
| `qiita.com/popular-items` | Popular items<sup>†</sup> |
| `qiita.com/official-columns` | Qiita Zine (RSS + Atom<sup>†</sup>) |

> Every page above also gets the popular items and Qiita Zine feeds after its own.

<sup>†</sup> *Found only by the Platform method.*

### RSS.com

Discovers RSS feeds for RSS.com-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rss.com/podcasts/{slug}` | Podcast |

### RubyGems

Discovers Atom feeds for RubyGems.org gems and the site-wide latest gems.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `rubygems.org/gems/{name}` | Gem versions (Atom) |
| `rubygems.org` | Latest gems<sup>†</sup> (Atom) |

> Every page above also gets the latest gems after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

> Every page links the latest gems feed through a FeedBurner address that now serves HTML, so the handler emits the rubygems.org copy.

### Sakura blog

Discovers RSS 2.0 and RDF feeds for Sakura blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.sblo.jp` | Posts (RSS 2.0 + RDF), with `rss.xml` tried after `index20.rdf` for a blog made since the redesign |

### Seesaa Blog

Discovers RSS 2.0 and RDF feeds for Seesaa Blog on `*.seesaa.net` and its other blog domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.seesaa.net` | Posts (RSS 2.0 + RDF) · podcast<sup>?</sup> |
| `{blog}.iiblog.jp` | Posts (RSS 2.0 + RDF) · podcast<sup>?</sup> |
| `{blog}.seesaa.blog` | Posts (RSS 2.0 + RDF) · podcast<sup>?</sup> |
| `{blog}.seesaa.space` | Posts (RSS 2.0 + RDF) · podcast<sup>?</sup> |
| `{blog}.sokuho.org` | Posts (RSS 2.0 + RDF) · podcast<sup>?</sup> |
| `{blog}.stablo.jp` | Posts (RSS 2.0<sup>†</sup> + RDF) · podcast<sup>?</sup> |
| `{blog}.xblog.jp` | Posts (RSS 2.0 + RDF) · podcast<sup>?</sup> |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Sermon.net

Discovers the audio, all-media, video, and audio with PDF feeds of every channel a church page lists, or of the one channel a channel page names.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{church}.sermon.net` | Channel podcasts, media, video podcasts<sup>†</sup>, and podcasts with PDFs (RSS)* · church feed (RSS) |
| `{church}.sermon.net/{mediaCentre}/{channel}` | That channel's podcast<sup>†</sup>, media<sup>†</sup>, video podcast<sup>†</sup>, and podcast with PDFs<sup>†</sup> (RSS) |

> Every page above also gets the church feed after its own.

\* *Requires HTML content to read the channels the page lists.*

<sup>†</sup> *Found only by the Platform method.*

### Shinobi Blog

Discovers RSS, Atom and RDF feeds for Shinobi Blog. A blog on any other domain is detected by the Ninja Blog banner its pages print.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.shinobi.jp` | Posts (RSS + Atom + RDF) |
| `{host}` | Posts (RSS + Atom + RDF) |

### Spotify for Creators

Discovers RSS feeds for Spotify for Creators (formerly Anchor) podcasts by extracting the station ID from the page content.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `creators.spotify.com/pod/profile/{name}` | Podcast* |
| `creators.spotify.com/pod/show/{name}` | Podcast* |
| `creators.spotify.com/pod/profile/{name}/episodes/{slug}` | Podcast* |

\* *Requires HTML content to extract the station ID.*

### Spreaker

Discovers RSS feeds for Spreaker-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `spreaker.com/podcast/{slug}--{id}` | Podcast |
| `spreaker.com/show/{id}` | Podcast |

### Viabloga

Discovers RSS, Atom and RDF feeds for Viabloga.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.viabloga.com` | Posts (RSS + Atom + RDF) · comments<sup>†</sup> · wiki<sup>†</sup> |
| `{blog}.viabloga.com/{category}.shtml` | Category · the feeds above |

<sup>†</sup> *Found only by the Platform method.*

### Weebly

Discovers RSS feeds for Weebly-hosted blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.weebly.com` | Blog (the default blog and every page the home page links) |
| `{site}.weebly.com/{slug}` | Blog (custom page slug or blog id) |

### Zenn

Discovers RSS feeds for Zenn users, topics, publications, and the platform-wide trending feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `zenn.dev/{user}` | User posts · all user posts<sup>†</sup>, with those in publications |
| `zenn.dev/topics/{topic}` | Topic |
| `zenn.dev/p/{pub}` | Publication |
| `zenn.dev` | Trending posts |

> Every page above also gets the trending posts after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

### BitChute

Discovers RSS feeds for BitChute channels. Channel pages carry only an oEmbed link, so nothing finds these without the handler.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bitchute.com/channel/{slug}` | Channel<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feed endpoint accepts only the vanity slug that appears in the channel URL. A channel's internal id returns 404.

### Instatus

Discovers the incident history feeds of an Instatus status page. Matched by host on `{page}.instatus.com`. A custom domain is detected by the status page route Instatus names in the `x-matched-path` response header, or by the custom HTML slots of its page template.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/…` | Incident history (RSS + Atom) |

### Jira

Discovers the Atom activity streams of a Jira site. Cloud is detected by the `atlassian.net` host, Data Center by the `ajs-base-url` meta tag together with a Jira path.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/browse/{KEY}-{n}` | Issue<sup>†</sup> (RSS) · project stream<sup>†</sup> · site stream<sup>†</sup> (Atom) |
| `{root}/projects/{KEY}` | Project stream<sup>†</sup> · site stream<sup>†</sup> (Atom) |
| `{root}/`, any other page | Site stream<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Bitbucket Server ships the same meta tag and uses `/projects/{KEY}/repos/`, which is excluded. Confluence under `/wiki/` on a Cloud site is excluded too.

### Neocities

Discovers the RSS feed of a Neocities site. The feed is served from `neocities.org`, not from the site's own host, and lists file updates rather than posts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.neocities.org` | Site updates<sup>†</sup> (RSS) |
| `neocities.org/site/{user}` | Site updates<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A site served on a custom domain carries no username, so it is not matched.

### Sourcehut

Discovers the commit and ref feeds of a Sourcehut repository and the activity feed of a project. Repository pages carry no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `git.sr.ht/~{user}/{repo}` | Commits<sup>†</sup> · refs<sup>†</sup> (RSS) |
| `sr.ht/~{user}/{project}` | Project (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Statuspage

Discovers the incident history feeds of an Atlassian Statuspage status page. Detected by the `x-statuspage-version` response header or the page's `dka575ofm4ao0.cloudfront.net/packs/` assets, so custom domains are covered as well as `*.statuspage.io` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/…` | Incident history (RSS + Atom) |

### Wikidot

Discovers the site and forum feeds of a Wikidot wiki. Detected by the `WIKIDOT.page.listeners.editClick()` call in the page, so custom domains are covered as well as `*.wikidot.com` hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/forum/t-{thread}` | Forum thread · site changes<sup>†</sup> · forum threads<sup>†</sup> · forum posts<sup>†</sup> (RSS) |
| `{host}/forum/c-{category}` | Forum category threads · forum category posts · site changes<sup>†</sup> · forum threads<sup>†</sup> · forum posts<sup>†</sup> (RSS) |
| `{host}/`, any other page | Site changes<sup>†</sup> · forum threads<sup>†</sup> · forum posts<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Drupal

Discovers the site feed of a Drupal site. Detected by the `Generator` meta tag or the `X-Generator` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Site (RSS) |

The feed is built under the install's base path from the page's Drupal settings, so a site installed under a sub-path gets its own feed.

> [!NOTE]
> Both signals are Drupal 8 and later, and a site builder can disable the `/rss.xml` view, so treat the feed as a probe.

### Shopify

Discovers the Atom feed of a Shopify store's blog. Detected by the `Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/blogs/{handle}` | Blog (Atom) |
| `{host}/{locale}/blogs/{handle}` | Blog (Atom) |
| `{host}/blogs/{handle}/tagged/{tag}` | Blog (Atom) · tag (Atom) |

> [!NOTE]
> There is no store-wide feed, so the blog handle is required. A missing blog answers 404 with an Atom content type and an empty body.

### Wix

Discovers the blog feed of a Wix site. Detected by the `Wix.com` generator meta tag, `static.parastorage.com` assets or the `x-wix-request-id` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{account}.wixsite.com/{site}/…` | Blog (RSS), under the site path |
| `{account}.wixstudio.com/{site}/…` | Blog (RSS), under the site path |
| `{host}/…` | Blog (RSS) |

> [!NOTE]
> The feed sits at the site root wherever the blog appears in navigation, and only sites with the Wix Blog app installed have it.

### Webnode

Discovers the article feeds of a Webnode site. Detected by the classic editor's client script, so custom domains are covered. Sites built in Webnode 2 serve no feeds and are not matched.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/{page}/` | Section articles<sup>†</sup> · all articles (RSS) |
| `{host}/news/{article}/` | All articles (RSS) |
| `{host}/`, any other page | All articles (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A section feed is named after the page that holds its articles, so a page without an articles block has none. A block whose name repeats another's is numbered, `blog1.xml`, and a page holding one gets the unnumbered feed.

### Svbtle

Discovers the Atom feed of a Svbtle blog. Detected by the `Svbtle.com` generator meta tag or `lightning.svbtle.com/cargo/` assets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}` | Posts (Atom) |

> [!NOTE]
> `svbtle.com` itself is excluded: its `/feed` answers 200 with an HTML discovery page, and the `svbtle.com/{user}/feed` form does not exist.

### Textpattern

Discovers the feeds of a Textpattern site, its sections and its categories. Detected by the `Textpattern` generator meta tag. A clean URL names the section in its first segment, so a site whose URLs start with the article title or date gets a section feed that answers 404.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/{section}/…` or `{root}/?s={section}` | Section (RSS + Atom) · posts (RSS + Atom) |
| `{root}/category/{category}/` or `{root}/?c={category}` | Category (RSS + Atom) · posts (RSS + Atom) |
| `{root}/`, any other page | Posts (RSS + Atom) |

### Mailchimp

Discovers the RSS feed of a Mailchimp campaign archive.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{dc}.campaign-archive.com/home/?u={u}&id={list}` | Archive (RSS) |
| `{dc}.campaign-archive.com/?u={u}&id={campaign}` | Archive (RSS)* |

\* *Requires HTML content to read the list ID.*

> [!NOTE]
> The datacentre prefix and the account id come from the input URL. On a campaign page the `id` names the campaign, so the list id is read from the archive link in the page.

### FC2 Blog

Discovers the RSS feeds of an FC2 blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.blog.fc2.com` | Posts · comments · trackbacks (RSS) |
| `{user}.blog{n}.fc2.com` | Posts · comments · trackbacks (RSS) |
| `{user}.fc2.net` | Posts · comments · trackbacks (RSS) |
| `{user}.blog.fc2.com/blog-category-{n}.html` | Category · posts · comments · trackbacks (RSS) |
| `{user}.blog.fc2.com/?tag={tag}` | Tag · posts · comments · trackbacks (RSS) |

> [!NOTE]
> A category or tag page on a `blog{n}.fc2.com` or `fc2.net` host gives the same feeds.
>
> The canonical host redirects to a numbered host from the old sharding scheme, so both shapes are matched and the feed is built from whichever host answers.

### Cnblogs

Discovers the feed of a Cnblogs blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cnblogs.com/{user}` | Posts |

> [!NOTE]
> The response says RSS while the document is Atom, and the body opens with a byte order mark before the XML declaration.

### Habr

Discovers the feeds of a Habr hub, user, company, flow or article, plus the site articles and news feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `habr.com/{lang}/hubs/{hub}` | Hub · hub posts<sup>†</sup> · articles · news (RSS) |
| `habr.com/{lang}/users/{user}` | User · articles · news (RSS) |
| `habr.com/{lang}/companies/{company}` | Company · articles · news (RSS) |
| `habr.com/{lang}/articles/{id}` | Comments · articles · news<sup>†</sup> (RSS) |
| `habr.com/{lang}/companies/{company}/articles/{id}` | Comments · company<sup>†</sup> · articles · news<sup>†</sup> (RSS) |
| `habr.com/{lang}/flows/{flow}` | Flow · articles · news<sup>†</sup> (RSS) |
| Any other page | Articles · news (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The language segment is taken from the page URL and every one of these paths needs its trailing slash.

### phpBB

Discovers the feeds of a phpBB board. Detected by the `phpbb` body id or the `{name}_u`, `{name}_k` and `{name}_sid` cookies.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/viewtopic.php?t={id}` | Topic · forum<sup>†</sup>, plus the board feeds (Atom) |
| `{board}/viewtopic.php?p={id}` | Topic from the page's canonical link, plus the board feeds (Atom) |
| `{board}/viewforum.php?f={id}` | Forum, plus the board feeds (Atom) |
| Any other page | Board: all posts · news<sup>†</sup> · new topics · active topics · forums (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the directory holding the script. Each feed is an administrator toggle, so a board serves any subset of them.

### FluxBB

Discovers the feeds of a FluxBB board. Detected by the `brdheader` and `brdmain` ids together, or the `brdmenu` and `brdfooter` ids together, which the board prints whatever its template.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/viewforum.php?id={id}` | Forum (Atom) · posts<sup>†</sup> (RSS + Atom) |
| `{root}/viewtopic.php?id={id}` | Topic (Atom) · posts<sup>†</sup> (RSS + Atom) |
| Any other page | Posts (RSS<sup>†</sup> + Atom) |

<sup>†</sup> *Found only by the Platform method.*

### MyBB

Discovers the feeds of a MyBB board. Detected by the `mybb[lastvisit]` cookie, under any cookie prefix, or the `cookiePrefix` and `cookieDomain` script variables core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{board}/forumdisplay.php?fid={id}` or `{board}/forum-{id}.html` | Forum · latest threads (RSS + Atom) |
| `{board}/showthread.php?tid={id}` or `{board}/thread-{id}.html` | Forum<sup>†</sup> from the breadcrumb · latest threads (RSS + Atom) |
| Any other page | Latest threads (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A board is routinely mounted under a sub-path, so the feed is built from the board URL the page prints as `rootpath`, or from the page's directory on a board older than 1.8.

### SMF

Discovers the feeds of a Simple Machines Forum. Detected by the `smf_scripturl` and `smf_theme_url` script variables core prints in every page head.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{script}?board={id}` | Board · recent posts (RSS + Atom<sup>†</sup>) |
| `{script}?topic={id}` | Board from the `rel="index"` link · recent posts (RSS + Atom<sup>†</sup>) |
| Any other page | Recent posts (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A forum is routinely mounted under a sub-path, so the feed is built from the script URL the page prints as `smf_scripturl`. A forum can disable feeds, and then the feed URLs answer with an HTML page.

### Shaarli

Discovers the feeds of a Shaarli instance. Detected by the `shaarli-menu` id or the `shaarli` cookie. An instance under a sub-path gets its feeds there, read from `js_base_path` or from the page directory.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Posts (RSS + Atom)* |

\* *Installs older than 0.12 serve the RSS feed at `/?do=rss`, which is tried after `/feed/rss`.*

### PeerTube

Discovers the feeds of a PeerTube instance, channel or account. Detected by the `X-Powered-By` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{instance}/c/{channel}` or `{instance}/video-channels/{channel}` | Channel · podcast · instance |
| `{instance}/a/{account}` or `{instance}/accounts/{account}` | Account<sup>†</sup> · instance |
| Any other page | Instance |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A channel federated from another instance is addressed as `handle@remote.host`, and the bare handle answers 404.

### Art19

Discovers the RSS feed of an Art19 show.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `art19.com/shows/{slug}` | Show (RSS) |

> [!NOTE]
> The feed is derived from the URL in hand, never from where it redirects: a show can redirect to a site that mentions no feed while the derived feed still resolves.

### Omny Studio

Discovers the RSS feeds of an Omny Studio show and its playlists.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `omny.fm/shows/{slug}` | Show (RSS) |
| `omny.fm/shows/{slug}/playlists/{playlist}` | Playlist (RSS) · show (RSS) |

> [!NOTE]
> A show whose page answers 404 can still resolve through this shortcut, which redirects to an identifier path on the content host.

### Blubrry PowerPress

Discovers the podcast feed of a WordPress site running the PowerPress plugin. Detected by the player function the plugin writes into the page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcast (RSS) |

> [!NOTE]
> Generic discovery finds `{site}/feed/`, which is the blog feed. This adds the podcast feed. A site can redirect it to its podcast host, which resolves normally.

### Podlove Publisher

Discovers the podcast feeds of a WordPress site running the Podlove Publisher plugin. Detected by the plugin's asset path, and the feeds are read from the alternate links the plugin prints on every page, since the owner sets each feed's slug.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| Any page | Podcasts (RSS), one per feed the site marks discoverable |

### iVoox

Discovers the RSS feed of an iVoox podcast.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ivoox.com/{slug}_sq_f{id}_1.html` | Podcast<sup>†</sup> (RSS) |
| `ivoox.com/{slug}_rf_{episode}_1.html` | Podcast<sup>†</sup> (RSS)* |

\* *Requires HTML content to read the series ID from the episode page.*

<sup>†</sup> *Found only by the Platform method.*

### Atypon

Discovers the table of contents feed of a journal hosted on Atypon Literatum: ACM, ASCE, Health Affairs, INFORMS, Mary Ann Liebert, NEJM, Sage, Science, SIAM, Taylor & Francis, University of Chicago Press and Wiley.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/toc/{code}/…` | Journal (RDF) · ahead of print<sup>†</sup> (RDF) |
| `{host}/journal/{code}` | Journal (RDF) · ahead of print<sup>†</sup> (RDF) |
| `{host}/loi/{code}` | Journal<sup>†</sup> (RDF) · ahead of print<sup>†</sup> (RDF) |
| `www.tandfonline.com/journals/{code}` | Journal (RDF) · ahead of print (RDF) |
| `journals.sagepub.com/home/{code}` | Journal (RDF) · ahead of print (RDF) |
| `onlinelibrary.wiley.com/journal/{code}` | Journal (RSS) · ahead of print (RDF) · Most cited (RSS) |

> [!NOTE]
> Journal pages answer a server-side fetch with a Cloudflare challenge, so the feed is derived from the URL alone. Article pages under `/doi/` name no journal and are not matched.

<sup>†</sup> *Found only by the Platform method.*

### SoundOn

Discovers the RSS feed of a SoundOn podcast. The player page is a script-only shell with no feed link.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `player.soundon.fm/p/{id}` | Podcast<sup>†</sup> (RSS) |
| `player.soundon.fm/p/{id}/episodes/{episodeId}` | Podcast<sup>†</sup> (RSS) |
| `player.soundon.fm/embed?podcast={id}` | Podcast<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### crates.io

Discovers the RSS feeds of crates.io, built from the URL, since the page answers 404 to a request without `Accept: text/html`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `crates.io` | New crates<sup>†</sup> · recent updates<sup>†</sup> (RSS) |
| `crates.io/crates/{name}` | Crate releases<sup>†</sup> (RSS) |

> Every page above also gets the new crates and recent updates after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feed path takes the crate name exactly as crates.io spells it, so a page URL with another case or `-` in place of `_` leads to a feed that answers 404.

### Internet Archive

Discovers the RSS feeds of Internet Archive collections, their forums, searches and account bookmarks. A collection page is told from an item page by its markup: collections serve the app shell that loads `/offshoot_assets/`, and items serve full HTML. Item pages resolve nothing.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `archive.org/details/{collection}` | Collection<sup>†</sup> (RSS)* · forum<sup>†</sup> (RSS)* |
| `archive.org/details/@{user}` | Bookmarks<sup>†</sup> (RSS)* |
| `archive.org/search?query={query}` | Search<sup>†</sup> (RSS) |

\* *Requires HTML content to tell a collection from an item.*

<sup>†</sup> *Found only by the Platform method.*

### Sveriges Radio

Discovers the feed of a Sveriges Radio program.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `sverigesradio.se/{program}` | Program (RSS) |
| `sverigesradio.se/poddar/{program}` | Program (RSS) |
| `sverigesradio.se/...?programid={id}` | Program<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Program pages answer 403 to many server-side fetches, so the feed is derived from the URL alone. A discontinued program's feed answers 404.

### Niconico

Discovers the video, live and blog feeds of a Niconico channel on `ch.nicovideo.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `ch.nicovideo.jp/{channel}` | Videos · Live<sup>†</sup> · Blog<sup>†</sup> |
| `ch.nicovideo.jp/{channel}/video` | Videos first, then Live<sup>†</sup> · Blog<sup>†</sup> |
| `ch.nicovideo.jp/{channel}/live` | Live first, then Videos<sup>†</sup> · Blog<sup>†</sup> |
| `ch.nicovideo.jp/{channel}/blomaga` or `ch.nicovideo.jp/{channel}/blomaga/ar{id}` | Blog first, then Videos<sup>†</sup> · Live<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### LibriVox

Discovers the RSS feed of a LibriVox audiobook, read from the feed link on the audiobook page, and the site's new releases.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `librivox.org/{slug}` | Audiobook (RSS)* · new releases<sup>†</sup> (RSS) |
| `librivox.org/…` | New releases (RSS) |

\* *Requires HTML content to read the audiobook ID.*

<sup>†</sup> *Found only by the Platform method.*

### PyPI

Discovers the RSS feeds of the Python Package Index, built from the URL.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pypi.org` | New packages · recent updates (RSS) |
| `pypi.org/project/{name}` | Project releases · new packages · recent updates (RSS) |
| `pypi.org/project/{name}/{version}` | Project releases · new packages · recent updates (RSS) |
| Any other page | New packages · recent updates (RSS) |

### RedCircle

Discovers the RSS feed of a RedCircle show. A show under a slug is read from the show uuid its page names in `og:url`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `redcircle.com/shows/{uuid}` or `redcircle.com/shows/{slug}` | Show (RSS)* |
| `redcircle.com/shows/{uuid}/ep/{episode}` or `redcircle.com/shows/{slug}/ep/{episode}` | Show (RSS)* |

\* *Under a slug, requires HTML content to read the show uuid.*

### Webtoons

Discovers the episode feed of a WEBTOON series, Originals and Canvas alike.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `webtoons.com/{language}/{genre}/{name}/list?title_no={id}` | Series |
| `webtoons.com/{language}/{genre}/{name}/{episode}/viewer?title_no={id}` | Series<sup>†</sup> |
| `webtoons.com/{language}/canvas/{name}/list?title_no={id}` | Series |

<sup>†</sup> *Found only by the Platform method.*

### @wiki

Discovers the updated pages and new pages feeds of an @wiki (atwiki.jp) wiki. Links to the legacy `www{N}.atwiki.jp` hosts redirect to `w.atwiki.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `w.atwiki.jp/{wiki}/…` | Updated pages (RDF + Atom) · new pages (RDF) |

### Teletype.in

Discovers RSS and Atom feeds for Teletype.in blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `teletype.in/@{user}` | Posts (RSS + Atom) |
| `teletype.in/@{user}/{post}` | Posts<sup>†</sup> (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Ning

Discovers the site feeds of a Ning network and the feed of a forum topic. Detected by the `static.ning.com/socialnetworkmain/` asset path, so `{tenant}.ning.com` networks and custom domains are both covered. Ning 3 networks load their assets from another path and serve their own section feeds in place of these, so their pages are left to generic discovery.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/forum/topics/{topic}` | Topic · latest activity<sup>†</sup> · blog posts<sup>†</sup> · featured blog posts<sup>†</sup> · forum · featured topics<sup>†</sup> · members<sup>†</sup> · featured members<sup>†</sup> · photos<sup>†</sup> · featured photos<sup>†</sup> · videos<sup>†</sup> · featured videos<sup>†</sup> · events<sup>†</sup> · groups<sup>†</sup> · featured groups<sup>†</sup> · pages<sup>†</sup> · notes<sup>†</sup> |
| `{host}/group/{group}/forum/topics/{topic}` | Topic · group forum · the site feeds and lists above |
| `{host}/group/{group}` | Group forum · the site feeds and lists above |
| `{host}/`, any other page | Latest activity<sup>†</sup> · blog posts<sup>†</sup> · featured blog posts<sup>†</sup> · forum<sup>†</sup> · featured topics<sup>†</sup> · members<sup>†</sup> · featured members<sup>†</sup> · photos<sup>†</sup> · featured photos<sup>†</sup> · videos<sup>†</sup> · featured videos<sup>†</sup> · events<sup>†</sup> · groups<sup>†</sup> · featured groups<sup>†</sup> · pages<sup>†</sup> · notes<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### public-inbox

Discovers the Atom feeds of a public-inbox mailing list archive. Detected by the help and color links every page prints, so any domain is covered, and `lore.kernel.org` by its host, since its pages answer a plain fetch with a bot challenge. An inbox under a sub-path or at the root of its host gets its feeds there.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/` | Messages (Atom) |
| `{root}/{message-id}/` | Thread · messages (Atom) |
| `{root}/{message-id}/T/` | Thread · messages (Atom) |

### CivicPlus

Discovers the module feeds of a CivicPlus government website. Detected by the `CP_IsMobile` cookie or the `/Areas/Layout/Assets/` scripts, so any domain is covered. The module is read from the page's `pageModuleID` field, and a page with no module feed gets the site-wide Pages feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{root}/CivicAlerts.aspx`, `{root}/m/newsflash` | News Flash<sup>†</sup> (RSS) |
| `{root}/Blog.aspx` | Blog<sup>†</sup> (RSS) |
| `{root}/Gallery.aspx` | Photo Gallery<sup>†</sup> (RSS) |
| `{root}/Calendar.aspx`, `{root}/m/calendar` | Calendar<sup>†</sup> (RSS) |
| `{root}/AlertCenter.aspx` | Alert Center<sup>†</sup> (RSS) |
| `{root}/RealEstate.aspx` | Real Estate Locator<sup>†</sup> (RSS) |
| `{root}/AgendaCenter` | Agenda Center<sup>†</sup> (RSS) |
| `{root}/Jobs.aspx` | Jobs<sup>†</sup> (RSS) |
| `{root}/CivicMedia.aspx` | Media Center<sup>†</sup> (RSS) |
| `{root}/`, any other page | Pages<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Each feed covers every category of its module. The home page, content pages and modules with no feed of their own get the Pages feed.

### Odoo

Discovers the Atom feed of a blog on an Odoo website. Detected by the `frontend_lang` and `session_id` cookies Odoo sets on every website page, so any domain is covered. A page under a language prefix gets the blog's feed at the root, without the prefix.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/blog/{blog}-{id}` | Blog (Atom) |
| `{host}/blog/{blog}-{id}/{post}-{id}` | Blog (Atom) |
| `{host}/blog/{blog}-{id}/post/{post}-{id}` | Blog (Atom) |
| `{host}/blog/{blog}-{id}/tag/{tag}-{id}` | Blog (Atom) |

### BubbleLife

Discovers the RSS feed of a BubbleLife community. The page's alternate link has no `href`, so the feed id is read from the community's library links.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{city}.bubblelife.com/community/{name}` | Posts<sup>†</sup> (RSS)* |
| `{city}.bubblelife.com/community/{name}/library/{id}` | Library<sup>†</sup> (RSS)* |
| `{city}.bubblelife.com/community/{name}/library/{id}/type/rssinfo` | Library<sup>†</sup> · news alerts<sup>†</sup> (RSS)* |
| `{city}.bubblelife.com/community/{name}/type/rssinfo` | Posts<sup>†</sup> · news alerts<sup>†</sup> (RSS)* |

\* *Requires HTML content to read the feed ID.*

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A city news community links no library of its own, so its page yields no feed. Its rssinfo page names the feed.

### BigCommerce

Discovers the product and blog feeds of a BigCommerce store. Detected by the `SHOP_SESSION_TOKEN` cookie, so any domain is covered. Interspire Shopping Cart installs set the same cookie and serve the same feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/{category}/` | Category new products · category popular products · new products · popular products · featured products<sup>†</sup> · blog (RSS + Atom) |
| `{host}/search.php?search_query={query}` | Product search · new products · popular products · featured products<sup>†</sup> · blog (RSS + Atom) |
| `{host}/`, any other page | New products · popular products · featured products<sup>†</sup> · blog (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A category URL carries only its slug, so the category id is read from the feed link the category page prints.

### blog.hu

Discovers the feeds of blog.hu blogs, and the activity feed of a blog.hu user.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blog.hu` | Posts (RSS + Atom) · comments (RSS + Atom) |
| `{blog}.blog.hu/{year}/{month}/{day}/{slug}` | Post comments (RSS + Atom) · posts (RSS + Atom) · comments (RSS + Atom) |
| `{blog}.blog.hu/tags/{tag}` | Tag<sup>†</sup> (RSS + Atom) · posts (RSS + Atom) · comments (RSS + Atom) |
| `blog.hu/user/{id}` | User activity<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### ChamberMaster

Discovers the RSS feeds of a ChamberMaster (GrowthZone) chamber of commerce directory. Detected by the `x-source: cmdotnet…` response header, so any domain is covered. The pages link none of these feeds. On a `chambermaster.com` or `memberzone.com` subdomain no feed is built, since the feeds there redirect to the sign-in page over `http` and `https` alike.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/events/…` | Upcoming events<sup>†</sup> · new events<sup>†</sup> · featured events<sup>†</sup> |
| `{host}/list/…` | New members<sup>†</sup> · featured members<sup>†</sup> |
| `{host}/jobs/…` | New jobs<sup>†</sup> |
| `{host}/hotdeals/…` | New coupons<sup>†</sup> |
| `{host}/marketspace/…`, `{host}/marketplace/…` | New marketplace items<sup>†</sup> |
| `{host}/news/…` | News releases<sup>†</sup> |
| `{host}/MemberToMember/…` | New member to member deals<sup>†</sup> |

> Every page above also gets the chamber's other lists after its own feeds.

<sup>†</sup> *Found only by the Platform method.*

### PChome Online 個人新聞台

Discovers RSS feeds for papers on PChome's blog host, including category feeds. Pages on the mobile host `mypaper.m.pchome.com.tw` get the same feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mypaper.pchome.com.tw/{user}` | Posts |
| `mypaper.pchome.com.tw/{user}/category/{id}` | Category<sup>†</sup> · posts |

<sup>†</sup> *Found only by the Platform method.*

### ProBoards

Discovers the posts feed of a ProBoards forum. A forum on a custom domain is detected by the `proboards.combined` script ProBoards serves from its own storage hosts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}.proboards.com` | Posts (RSS) |
| `{forum}.freeforums.net` | Posts (RSS) |
| `{forum}.boards.net` | Posts (RSS) |
| `{host}` | Posts (RSS) |

> [!NOTE]
> On a ProBoards domain, a request with a browser user agent gets a proof-of-work challenge instead of the page, so the feed is built from the forum host alone. The feed answers 406 to a bare `Mozilla/5.0` or an empty user agent.

### The Mail Archive

Discovers the RSS and RDF feeds of a mailing list archived on The Mail Archive (mail-archive.com). The list is named by its posting address in the first path segment.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `mail-archive.com/{list}/` | Mailing list (RSS + RDF<sup>†</sup>) |
| `mail-archive.com/{list}/msg{n}.html` | Mailing list<sup>†</sup> (RSS + RDF) |

<sup>†</sup> *Found only by the Platform method.*

### Bloggang

Discovers RSS feeds for Bloggang blogs. A blog lives on its own subdomain, which redirects to its pages on `www.bloggang.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{user}.bloggang.com` | Posts |
| `www.bloggang.com/mainblog.php?id={user}` | Posts |
| `www.bloggang.com/viewblog.php?id={user}` | Posts |
| `www.bloggang.com/viewdiary.php?id={user}` | Posts |

### SME Blog

Discovers the RSS feeds of blogs on SME Blog, the blog platform of the Slovak daily SME.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.sme.sk/{user}` | Posts |
| `blog.sme.sk/{user}/{category}/{slug}` | Posts |
| `blog.sme.sk` | Site |
| `blog.sme.sk/t/{topic}` | Site |

> Every page above also gets the site feed after its own.

### Acomics

Discovers RSS feeds for Acomics comics and users. A user's feed carries the new issues of the comics the user subscribes to.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `acomics.ru/~{comic}` | Comic issues |
| `acomics.ru/-{user}` | User subscriptions<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Eklablog

Discovers the posts and comments feeds of an Eklablog blog. A blog on any other domain is detected by the script it loads from `connect.eklablog.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.eklablog.com` | Posts · comments<sup>†</sup> |
| `{host}` | Posts · comments<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### ComicFury

Discovers the feeds of a ComicFury webcomic.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{comic}.thecomicseries.com`, `.thecomicstrip.org`, `.the-comic.org`, `.webcomic.ws` or `.cfw.me` | Comic |
| `comicfury.com/comicprofile.php?url={comic}` | Comic<sup>†</sup> |
| `comicfury.com/read/{comic}` | Comic feed in the ComicFury reader |

<sup>†</sup> *Found only by the Platform method.*

### Jimdo

Discovers the blog feed of a Jimdo site. Detected by the `x-jimdo-wid` response header, so `*.jimdofree.com` sites and custom domains are both covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.jimdofree.com`, `{host}` | Blog (RSS) |
| `{site}.jimdofree.com/?tag={tag}`, `{host}/?tag={tag}` | Blog (RSS) · tag (RSS) |

> [!NOTE]
> Only sites with a blog have the feed.

### Forumotion

Discovers the feeds of a Forumotion forum, under any of the brands Forumotion lists on [forumotion.com/languages](https://www.forumotion.com/languages), such as Forumactif, Foroactivo, Forumeiros, Ahlamontada and Forum2x2. Matched by host on those domains. A custom domain is detected by the `_userdata` script every page prints. The forum comes from the page's breadcrumb.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/f{id}-{slug}` | Forum<sup>†</sup> · latest topics (RSS + Atom<sup>†</sup>) |
| `{host}/t{id}-{slug}` | The topic's forum<sup>†</sup> · latest topics (RSS + Atom<sup>†</sup>) |
| `{host}/`, any other page | Latest topics (RSS + Atom) |

<sup>†</sup> *Found only by the Platform method.*

### Noticeable

Discovers the feeds of a Noticeable newspage. Newspages on `noticeable.news` are matched by host, and a newspage on a custom domain by the `assets.noticeable.news/templates/` stylesheets every template loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{newspage}.noticeable.news/labels/{label}` | Label<sup>†</sup> · newspage (RSS + Atom<sup>†</sup> + JSON Feed) |
| `{host}/labels/{label}` | Label<sup>†</sup> · newspage (RSS + Atom<sup>†</sup> + JSON Feed) |
| `{newspage}.noticeable.news`, `{host}/`, any other page | Newspage (RSS + Atom<sup>†</sup> + JSON Feed) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> A label page links only the newspage feed, never its own label feed.

### Legistar

Discovers the history feed of a Legistar legislation record or meeting, on any `*.legistar.com` client site. A client site on a custom domain is detected by the `BIGipServerinsite.legistar.com_443` cookie Legistar's load balancer sets, or by the `addthis_widget.js#username=legistarinsite` script every page loads.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{client}.legistar.com/LegislationDetail.aspx?ID={id}&GUID={guid}` | Legislation (RSS) |
| `{client}.legistar.com/MeetingDetail.aspx?ID={id}&GUID={guid}` | Meeting (RSS) |
| `{host}/LegislationDetail.aspx?ID={id}&GUID={guid}` | Legislation (RSS) |
| `{host}/MeetingDetail.aspx?ID={id}&GUID={guid}` | Meeting (RSS) |

### Nethouse

Discovers the news and articles feeds of a Nethouse site. Custom domains are detected by the `x-generator: nethouse` response header.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.nethouse.ru`, `{site}.nethouse.me` | News · articles (RSS) |
| `{host}/…` | News · articles (RSS) |

> [!NOTE]
> A site with the news or articles section turned off answers that feed with 404.

### Hautetfort

Discovers RSS and Atom feeds for blogs on `*.hautetfort.com`, `*.blogspirit.com` and `*.blogspirit-business.com`. Blog feeds are built on `http`, since blog subdomains serve no certificate for their own name.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.{domain}` | Posts (RSS + Atom) |
| `{blog}.{domain}/{category}` | Category (RSS) · posts |
| `{blog}.{domain}/archives/category/{category}` | Category<sup>†</sup> (RSS) · posts |

<sup>†</sup> *Found only by the Platform method.*

### uCoz

Discovers the module and forum feeds of a uCoz site. Covers sites on uCoz's own domains, such as `{site}.ucoz.ru`, and every other domain through the `{n}{site}uCoz` cookie every uCoz page sets, uCoz's free domains such as `at.ua` and `narod.ru` included.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/{module}/…` | Module (RSS) for `news<sup>†</sup>`, `publ`, `load`, `photo`, `blog`, `dir`, `board`, `stuff` and `forum` |
| `{host}/forum/{section}…` | Forum section · forum (RSS) |
| `{host}/`, any other page | News (RSS) |

> Every page above also gets the news feed after its own.

> [!NOTE]
> A module the site has not turned on answers 404.

<sup>†</sup> *Found only by the Platform method.*

### dasauge

Discovers the site-wide Atom feeds of dasauge on any of its country domains.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `dasauge.de` | Jobs<sup>†</sup> · workspaces<sup>†</sup> |
| `dasauge.de/{page}` | Jobs<sup>†</sup> · workspaces<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Estranky

Discovers the site feeds of an Estranky site. A site serves the article feeds, the Web Slice feeds or both, depending on its template, and validation drops a set it lacks. A custom domain is detected by stylesheets or scripts loaded from the `s3*.estranky.cz` and `s3*.estranky.sk` asset hosts, or from the `s3*.eoldal.hu` hosts of the Hungarian eOldal brand. On a custom domain, the slice feeds take the Estranky subdomain of the page's `rel="feedurl"` link. An eOldal site keeps its slice feeds on its own domain, since its `eoldal.hu` subdomain no longer resolves.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}.estranky.cz/…` | Posts · photos<sup>†</sup> · comments<sup>†</sup> · home page slice · photo album slice<sup>†</sup> |
| `{site}.estranky.sk/…` | Posts · photos<sup>†</sup> · comments<sup>†</sup> · home page slice<sup>?</sup> · photo album slice<sup>?</sup> |
| `{host}/…` | Posts · photos<sup>†</sup> · comments<sup>†</sup> · home page slice · photo album slice<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### Color Me Shop

Discovers the RSS 1.0 and Atom feeds of new products in a Color Me Shop store. Shops on `shop-pro.jp` are matched by host, and a shop on its own domain by the `colorme_PHPSESSID` cookie every shop page sets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{shop}.shop-pro.jp` | Products (RSS 1.0 + Atom) |
| `{host}`, a shop on its own domain | Products (RSS 1.0 + Atom) |

### PRLog

Discovers the press releases feed of a PRLog pressroom.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `pressroom.prlog.org/{id}` | Press releases |

### Rakuten Blog

Discovers the RSS feed of a Rakuten Blog (plaza.rakuten.co.jp) blog, which Rakuten serves from `api.plaza.rakuten.ne.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `plaza.rakuten.co.jp/{user}/…` | Posts |

### Overblog

Discovers the posts feed of an Overblog blog.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.over-blog.{tld}`, `{blog}.over.blog`, `{blog}.overblog.{tld}` | Posts |

### Wild Apricot

Discovers the blog and events feeds of a Wild Apricot site. Detected by the `x-lb-server` response header, so `{tenant}.wildapricot.org` sites and custom domains are both covered.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{host}/{blog-page}` | Blog (RSS) |
| `{host}/{blog-page}/{post-id}` | Blog (RSS), from the post's back link |
| `{host}/{post-id}`, a post on a home-page blog | Blog (RSS), at `{host}/RSS` |
| `{host}/{events-page}` | Events (RSS), in the list and calendar views |

> [!NOTE]
> A post page links `/page-{id}/RSS` as its feed, which answers 404. An event page links no events page, so it gets no feed.

### Jellypod

Discovers RSS feeds for Jellypod-hosted podcasts.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{podcast}.jellypod.com` | Podcast (RSS) |

### Goope

Discovers the news feed of a Goope site, the member news feed of a chamber of commerce site, and the association news feed of a federation of chambers. Sites on a custom domain are detected by the QR code image served from `r.goope.jp` or a favicon on `cdn.goope.jp`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `r.goope.jp/{site}/…` | News (RDF) |
| `r.goope.jp/{site}/shokokai/…` | Association news · news (RDF) |
| `r.goope.jp/{site}/shokokai/member/…` | Member news · news (RDF) |
| `{host}/shokokai/…` | Association news · news (RDF) |
| `{host}/shokokai/member/…` | Member news · news (RDF) |
| `{host}/…` | News (RDF) |

> [!NOTE]
> A page under a `t_{id}` template segment gets the plain feeds, as the page links them. The feeds under the segment are recognised too.

### Duck Webcomics

Discovers the feed of a webcomic on The Duck Webcomics.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `theduckwebcomics.com/{comic}/…` | Comic |

### is-Programmer

Discovers RSS feeds for is-Programmer blogs, including the comment feed of a post.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.is-programmer.com` | Posts · comments · messages · site |
| `{blog}.is-programmer.com/posts/{id}` | Post comments<sup>†</sup> · posts · comments · messages · site |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> is-Programmer serves its blogs over http only, so the feeds are http URLs whatever the page URL's scheme.

### twoday

Discovers RSS 1.0 feeds for blogs on `*.twoday.net`. A blog's skin links its posts feed as `/index.rdf` or `/rss`, and both serve the same feed.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.twoday.net` | Posts · summaries<sup>†</sup> · comments<sup>?</sup> · recently commented<sup>†</sup> |
| `{blog}.twoday.net/topics/{topic}` | Topic · posts · summaries<sup>†</sup> · comments<sup>?</sup> · recently commented<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

<sup>?</sup> *Not measured, the feed failed to load during the run.*

### cppblog

Discovers RSS feeds for cppblog blogs on `www.cppblog.com` and `cppblog.com`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `cppblog.com/{user}` | Posts · comments<sup>†</sup> |
| `cppblog.com/{user}/category/{id}.html` | Category · posts · comments<sup>†</sup> |
| `cppblog.com/{user}/favorite/{id}.html` | Favorites · posts · comments<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The site's https certificate has expired, so the feeds are `http://www.cppblog.com` URLs whatever the page URL's scheme and host.

### Reformal

Discovers the feedback feed of a Reformal project, on reformal.ru and its English farm idea.informer.com.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{project}.reformal.ru` | Feedback (RSS) |
| `{project}.idea.informer.com` | Feedback (RSS) |

### Bloggo

Discovers RSS feeds for Bloggo blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.bloggo.nu` | Posts |
| `{blog}.bloggo.nu/{slug}` | Post comments · posts |

### podCloud

Discovers the RSS feed of a show hosted on podCloud.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{show}.lepodcast.fr` | Podcast (RSS) |

### PromoDJ

Discovers the feeds of a PromoDJ artist profile.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `promodj.com/{user}` | Podcast · content · blog · favorites · events |
| `promodj.com/{user}/…` | Podcast · content · blog · favorites · events |

> [!NOTE]
> A feed the artist has never posted to answers with a redirect to the profile, which validation drops.

### KKTIX

Discovers the Atom feed of a KKTIX organizer's public events.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{organizer}.kktix.cc` | Events |
| `{organizer}.kktix.cc/events/{event}` | Events<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Sportsregions

Discovers the news and events feeds of a Sportsregions club site. A club on its own domain is detected by the link to the platform's content report form in the footer of every club page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{club}.sportsregions.fr/…` | News · events |
| `{club}.sportsregions.fr/evenements?type_id={type}&groupe_id={group}` | Filtered events · news · events |
| `{host}/…` | News · events |

### Ochanoko Net

Discovers the RSS 1.0 feed of new products in an Ochanoko Net shop. A shop on a custom domain is detected by the cart script, `/res/{template}/js/ocnk.js` or `/res/{template}/js/pack/ocnk-min.js`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{shop}.ocnk.net` | Products (RSS 1.0) |
| `{host}` | Products (RSS 1.0) |

### Blogia

Discovers the RSS feeds for blogs hosted on Blogia.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.blogia.com` | Posts (RSS) · comments (RSS) |

### Parsiblog

Discovers RSS and Atom feeds for Parsiblog blogs. Parsiblog serves no HTTPS, so the feeds are always `http://`.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.parsiblog.com` | Posts (RSS + Atom) |
| `{blog}.parsiblog.ir` | Posts (RSS + Atom), on the .com host |

### Blogalia

Discovers RDF and RSS 2.0 feeds for Blogalia blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{tenant}.blogalia.com` | Posts (RDF + RSS 2.0<sup>†</sup>) |

<sup>†</sup> *Found only by the Platform method.*

### Travellerspoint

Discovers Atom feeds for Travellerspoint travel blogs.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{blog}.travellerspoint.com` | Posts |

### Big Cartel

Discovers the product feeds of a Big Cartel store. A store on its own domain is detected by the `X-Frame-Options` header naming `my.bigcartel.com`, or by its `/theme_stylesheets/` stylesheet.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{store}.bigcartel.com` | Products |
| `{host}` | Products<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> Most store themes link only `/products.xml`, a Google Merchant feed whose items carry no title or link, so it parses with no items. The handler emits `/products.rss`, which carries both.

### GCS-web

Discovers the news release, SEC filing and event feeds of a company investor relations site on GCS-web. A site on the company's own domain is detected by the `/sites/g/files/knoqqb{id}/` path of its assets.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{company}.gcs-web.com` | News releases<sup>†</sup> · SEC filings<sup>†</sup> · events<sup>†</sup> |
| `{host}` | News releases<sup>†</sup> · SEC filings<sup>†</sup> · events<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### Purot.net

Discovers the change feeds of a wiki on Purot.net. The page's own feeds come from the feed link the page carries, since a page that does not exist answers with the whole wiki's changes.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{wiki}.purot.net/{page}`, `{wiki}.purot.net/` | Page changes* · page discussions* · page changes, discussions and likes (RSS)* · recent changes · recent page changes · recent discussions<sup>†</sup> |
| `{wiki}.purot.net/profile/{user}`, any other page | Recent changes · recent page changes<sup>†</sup> · recent discussions (RSS) |

\* *Requires HTML content to read the page ID.*

<sup>†</sup> *Found only by the Platform method.*

### SkyCMS

Discovers the feed of a page in a Polish public information bulletin built on SkyCMS. Detected by the bulletin template's `/cms/public/image/default/bip_v{n}/` icon path, `/clients/cms_{client}/image/default/bip/` on a branded bulletin, or the `skycms_PageCounter` cookie, beside the link to the bulletin's RSS channel list, so any domain is covered. SkyCMS sites outside the bulletin template serve no page feeds and are left alone.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{site}/{id}/{slug}.html` | Page<sup>†</sup> at `/rss/{id}/{slug}.html` (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### AlloForum

Discovers the latest topics feeds of a forum on `*.alloforum.com`. Forum, category and subcategory pages link their feeds only as plain anchors, so the handler covers them.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{forum}.alloforum.com` | Latest topics<sup>†</sup> |
| `{forum}.alloforum.com/{slug}-c{id}-{page}.html` | Category<sup>†</sup> · latest topics<sup>†</sup> |
| `{forum}.alloforum.com/{slug}-c{id}-{subslug}-s{subid}-{page}.html` | Subcategory<sup>†</sup> · latest topics<sup>†</sup> |

<sup>†</sup> *Found only by the Platform method.*

### SportAdmin

Discovers the news feeds of a Swedish sports club website on SportAdmin. On the classic template a team page redirects to a url that no longer names the team, so the team is read from the page's link to its other layout. The new template keeps the team in the url.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{club}.web.sportadmin.se/?SID={id}`, a classic team page linking its other layout | Team news<sup>†</sup>* at `/rss/?SID={id}` · club news |
| `{club}.web.sportadmin.se/?SID={id}` on the new template | Team news<sup>†</sup>* at `/rss/?SID={id}` · club news |
| `{club}.web.sportadmin.se/`, any other page | Club news at `/rss/` |

\* *Requires HTML content to read the team ID.*

<sup>†</sup> *Found only by the Platform method.*

### laget.se

Discovers the news feed of a sports club or team site on laget.se. The team page links the feed only through an icon with no text, and a team page without a news box links nothing, yet its feed still answers. A club on its own domain is detected by stylesheets or scripts loaded from a laget.se content host such as `b-content.laget.se`, and serves its feed at the domain root.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `www.laget.se/{team}`, `www.laget.se/{team}/…` | News<sup>†</sup> at `www.laget.se/{team}/Home/NewsRss` (RSS) |
| `{host}/…` | News<sup>†</sup> at `{host}/Home/NewsRss` (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### OpenEdition Journals

Discovers the feeds of an academic journal on OpenEdition Journals at `journals.openedition.org/{journal}`. The feeds are built from the url, since the journal pages answer a browser with a bot challenge while the feeds do not.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `journals.openedition.org/{journal}/…` | Documents at `{journal}/backend?format=rssdocuments` · issues at `?format=rssnumeros` · reviews<sup>†</sup> at `?format=rssdocuments&type=review` (RSS 1.0) |

<sup>†</sup> *Found only by the Platform method.*

### Jinbo blog

Discovers the feeds of a blog on Jinbonet's blog host, `blog.jinbo.net/{user}`. The blog name keeps the case its own pages link the feeds in.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.jinbo.net/{user}` | Posts · comments and trackbacks · comments<sup>†</sup> · trackbacks<sup>†</sup> · lines<sup>†</sup> (RSS and Atom) |
| `blog.jinbo.net/{user}/category/{id}` | Category (RSS<sup>†</sup> and Atom), plus the blog feeds |
| `blog.jinbo.net/{user}/tag/{tag}` | Tag (Atom), plus the blog feeds |
| `blog.jinbo.net/{user}/{postId}` | Post comments and trackbacks (RSS and Atom), plus the blog feeds |

<sup>†</sup> *Found only by the Platform method.*

### TischtennisLive

Discovers the feeds of a table tennis association on `{association}.tischtennislive.de`. A league or group page gets the results feeds whose id its own feed link names, since a results feed answers any id.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{association}.tischtennislive.de/?L2P={league}`, a league overview linking its results feeds | League results of the last 10 days · fixtures of the next 10 days at `/Export/Tischtennis/RSS.aspx?Typ=Wett&ID={league}&Next={0\|1}` (RSS)* |
| `{association}.tischtennislive.de/?L3=SpielUebersicht&Gruppe={group}`, a match overview linking its results feeds | Group results of the last 10 days · fixtures of the next 10 days at `/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID={group}&Next={0\|1}` (RSS)* |
| `{association}.tischtennislive.de`, any other page | News<sup>†</sup> · dates<sup>†</sup> · documents<sup>†</sup> · tournaments<sup>†</sup> (RSS) |

> Every page above also gets the news, dates, documents and tournaments after its own feeds.

\* *Requires HTML content to read the ID from the page's results feed link.*

<sup>†</sup> *Found only by the Platform method.*

### Newswire

Discovers the feeds of a company newsroom on `{newsroom}.newswire.com`. The newsroom links its own feed, and its beat and content type pages link none.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{newsroom}.newswire.com/browse/beat/{beat}` | Beat<sup>†</sup> at `/browse/rss/beat/{beat}` · newsroom at `/browse/rss` (RSS) |
| `{newsroom}.newswire.com/browse/pr`, `/browse/news`, `/browse/social`, `/browse/image`, `/browse/video`, `/browse/audio`, `/browse/event` | Press releases<sup>†</sup>, news<sup>†</sup>, social<sup>†</sup> wire, images<sup>†</sup>, videos<sup>†</sup>, audio<sup>†</sup> or events<sup>†</sup> at `/browse/rss/{type}` · newsroom at `/browse/rss` (RSS) |
| `{newsroom}.newswire.com`, any other page | Newsroom at `/browse/rss` (RSS) |

> Every page above also gets the newsroom and every content type feed after its own.

<sup>†</sup> *Found only by the Platform method.*

### Open Journal Systems

Discovers the feeds of a journal on Open Journal Systems, on any domain. Detected by the `Open Journal Systems` generator meta or the `OJSSID` session cookie. The journal's root is read from the theme stylesheet the page loads through `/$$$call$$$/`, so each journal of a multi-journal install gets its own feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `{journal}/`, `{journal}/article/view/{id}`, `{journal}/issue/view/{id}`, any other journal page | Articles · announcements (Atom + RSS 1.0 + RSS 2.0) |

> [!NOTE]
> The site-wide pages of a multi-journal install, under `/index`, belong to no journal and get no feeds. OJS 3.5 serves a non-default locale's feeds only to a client that keeps cookies, so the feeds are the journal root's, which redirect to the default locale.

### Aladin blog

Discovers the feeds of a user blog on Aladin, `blog.aladin.co.kr/{user}`. A category page links only the blog feed, and its own feed is listed only on the blog's subscribe page.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `blog.aladin.co.kr/{user}`, any other blog page | Blog |
| `blog.aladin.co.kr/{user}/category/{id}` | Category<sup>†</sup> · blog |

<sup>†</sup> *Found only by the Platform method.*

### Bangumi

Discovers the collections and timeline feeds of a Bangumi user, plus the site blog feed. A page on `bangumi.tv`, `chii.in` or `www.bgm.tv` gets the `bgm.tv` feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bgm.tv/user/{user}` | Collections · timeline<sup>†</sup> (RSS) |
| Any other page | Blog (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Bing

Discovers the feed of a Bing web or news search. The news search page links no feed. `cn.bing.com` is matched too, unverified, since it redirects to `www.bing.com` outside China.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `bing.com/search?q={query}` | Search (RSS) |
| `bing.com/news/search?q={query}` | News search<sup>†</sup> (RSS) |

<sup>†</sup> *Found only by the Platform method.*

### Greasy Fork

Discovers the scripts feed of a Greasy Fork user, read from the user page URL or from the author of a script page, plus the site's new and updated scripts feeds.

| URL Pattern | Feeds Generated |
|-------------|-----------------|
| `greasyfork.org/{locale}/users/{id}` | User scripts<sup>†</sup> (Atom) |
| `greasyfork.org/{locale}/scripts/{id}` | Author's user scripts<sup>†</sup> (Atom) |
| Any other page | New scripts<sup>†</sup> · updated scripts<sup>†</sup> (Atom) |

<sup>†</sup> *Found only by the Platform method.*

> [!NOTE]
> The feeds live on `api.greasyfork.org` under the page's locale. Sleazy Fork, `sleazyfork.org`, runs the same software and is read the same way, with its feeds on `api.sleazyfork.org`. A script's feedback, code and version pages name no author, so they get no feed.

## Basic Usage

```typescript
import { discoverFeeds } from 'feedscout'

const feeds = await discoverFeeds('https://github.com/macieklamberski/feedsmith', {
  methods: ['platform'],
})

// [
//   { url: 'https://github.com/macieklamberski/feedsmith/releases.atom', ... },
//   { url: 'https://github.com/macieklamberski/feedsmith/commits.atom', ... },
//   { url: 'https://github.com/macieklamberski/feedsmith/tags.atom', ... },
// ]
```

## Configuration

### Handler Order

Handlers are checked in order, the ones that match by the URL alone first. The first matching handler that generates feeds wins:

```typescript
import { githubHandler, redditHandler, youtubeHandler } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [youtubeHandler, githubHandler, redditHandler],
    },
  },
})
```

## Default Values

Import the default Platform options:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'
```

Or import individual handlers:

```typescript
import {
  acastHandler,
  acomicsHandler,
  aladinHandler,
  alloforumHandler,
  amebloHandler,
  applePodcastsHandler,
  art19Handler,
  atwikiHandler,
  atyponHandler,
  audioboomHandler,
  aushaHandler,
  bangumiHandler,
  bearblogHandler,
  behanceHandler,
  bigCartelHandler,
  bigcommerceHandler,
  bingHandler,
  bitchuteHandler,
  blogHuHandler,
  blogaliaHandler,
  bloggangHandler,
  bloggoHandler,
  blogiaHandler,
  blogspotHandler,
  bubblelifeHandler,
  buttondownHandler,
  buzzsproutHandler,
  canalblogHandler,
  canpanHandler,
  captivateHandler,
  castopodHandler,
  castosHandler,
  chambermasterHandler,
  civicplusHandler,
  cnblogsHandler,
  colorMeShopHandler,
  comicfuryHandler,
  cppblogHandler,
  cratesIoHandler,
  csdnHandler,
  dailymotionHandler,
  dasaugeHandler,
  deviantartHandler,
  devtoHandler,
  doubanHandler,
  drupalHandler,
  duckWebcomicsHandler,
  eklablogHandler,
  estrankyHandler,
  exblogHandler,
  fc2Handler,
  firesideHandler,
  firstoryHandler,
  flickrHandler,
  fluxbbHandler,
  forumotionHandler,
  friendicaHandler,
  gcsWebHandler,
  ghostHandler,
  giteaHandler,
  githubHandler,
  gitlabHandler,
  goopeHandler,
  greasyForkHandler,
  habrHandler,
  hashnodeHandler,
  hatenaAntennaHandler,
  hatenablogHandler,
  hautetfortHandler,
  hearthisHandler,
  insanejournalHandler,
  instatusHandler,
  internetArchiveHandler,
  isProgrammerHandler,
  itchioHandler,
  ivooxHandler,
  jellypodHandler,
  jimdoHandler,
  jinboHandler,
  jiraHandler,
  kktixHandler,
  lagetHandler,
  launchpadHandler,
  legistarHandler,
  letterboxdHandler,
  librivoxHandler,
  libsynHandler,
  listedHandler,
  livedoorBlogHandler,
  mailArchiveHandler,
  mailchimpHandler,
  mastodonHandler,
  mediumHandler,
  megaphoneHandler,
  microblogHandler,
  misskeyHandler,
  myanimelistHandler,
  mybbHandler,
  naverBlogHandler,
  neocitiesHandler,
  nethouseHandler,
  newswireHandler,
  niconicoHandler,
  ningHandler,
  noteHandler,
  noticeableHandler,
  observableHandler,
  ocnkHandler,
  odooHandler,
  odyseeHandler,
  ojsHandler,
  omnystudioHandler,
  openeditionHandler,
  overblogHandler,
  paragraphHandler,
  parsiblogHandler,
  pchomeHandler,
  peertubeHandler,
  phpbbHandler,
  pinterestHandler,
  podbeanHandler,
  podcloudHandler,
  podigeeHandler,
  podloveHandler,
  postachioHandler,
  posthavenHandler,
  powerpressHandler,
  prlogHandler,
  proboardsHandler,
  promodjHandler,
  publicInboxHandler,
  purotHandler,
  pypiHandler,
  qiitaHandler,
  rakutenBlogHandler,
  redcircleHandler,
  redditHandler,
  reformalHandler,
  rssComHandler,
  rubygemsHandler,
  sakuraBlogHandler,
  seesaaHandler,
  sermonNetHandler,
  shaarliHandler,
  shinobiHandler,
  shopifyHandler,
  skycmsHandler,
  smeBlogHandler,
  smfHandler,
  soundcloudHandler,
  soundonHandler,
  sourcehutHandler,
  sportadminHandler,
  sportsregionsHandler,
  spotifyForCreatorsHandler,
  spreakerHandler,
  stackExchangeHandler,
  statuspageHandler,
  steamHandler,
  substackHandler,
  svbtleHandler,
  sverigesRadioHandler,
  teletypeHandler,
  textpatternHandler,
  tischtennisliveHandler,
  tistoryHandler,
  transistorHandler,
  travellerspointHandler,
  tumblrHandler,
  twodayHandler,
  ucozHandler,
  velogHandler,
  viablogaHandler,
  vimeoHandler,
  webnodeHandler,
  webtoonsHandler,
  weeblyHandler,
  wikidotHandler,
  wildApricotHandler,
  wixHandler,
  wordpressHandler,
  wpengineHandler,
  ximalayaHandler,
  youtubeHandler,
  zennHandler,
} from 'feedscout/platform'
```

## Using Directly

Use the Platform discovery function directly to get URIs without validation:

```typescript
import { discoverUrisFromPlatform, youtubeHandler } from 'feedscout/platform'

const uris = await discoverUrisFromPlatform(htmlContent, undefined, {
  baseUrl: 'https://www.youtube.com/@mkbhd',
  handlers: [youtubeHandler],
})

// [
//   {
//     uri: [
//       'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ',
//       'https://www.youtube.com/feeds/videos.xml?playlist_id=UUBJycsmduvYEL83R_U4JriQ',
//     ],
//     hint: { key: 'youtube:all', label: 'All uploads' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULFBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:videos', label: 'Videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:shorts', label: 'Shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:live', label: 'Live streams' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UULPBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-videos', label: 'Popular videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPSBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-shorts', label: 'Popular shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUPVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:popular-live', label: 'Popular live streams' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMOBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-videos', label: 'Member videos' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMSBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-shorts', label: 'Member shorts' },
//   },
//   {
//     uri: 'https://www.youtube.com/feeds/videos.xml?playlist_id=UUMVBJycsmduvYEL83R_U4JriQ',
//     hint: { key: 'youtube:member-live', label: 'Member live streams' },
//   },
// ]
```

The arguments are the page content, the response headers, the options, an optional `fetchFn` that is passed on to handlers, and an optional `onError` that receives a throw from a handler or from `enrichFn`. Pass `undefined` for content or headers you do not have.

The options also take an optional `requestedUrl`: the URL you asked for, when the fetch ended on another one. When no handler generates feeds for `baseUrl`, the handlers run on `requestedUrl` without the content and headers, which belong to the other page. Two cases are left out. A `requestedUrl` on another host than `baseUrl` is not tried, since a site that moved can still serve its old feeds with nothing new in them. A handler that matches `baseUrl` alone and stops matching with the content and headers has declined that page, and is skipped.

> [!NOTE]
> The YouTube handler requires HTML content for `@handle`, `/user/`, `/c/`, and video URLs to extract the channel ID. For `/channel/UC...` URLs, no content is needed.

## Creating Custom Handlers

You can create handlers for platforms not included by default.

### Handler Interface

A `PlatformHandler` has two methods and an optional third:

```typescript
type PlatformHandler = {
  match: (url: string, content?: string, headers?: Headers) => boolean
  resolve: (
    url: string,
    content?: string,
    headers?: Headers,
    fetchFn?: FetchFn,
  ) => MaybePromise<Array<DiscoverUriEntry | DiscoverRef | undefined>>
  getFeedHint?: (url: string) => DiscoverUriHint | undefined
}
```

| Member | Description |
|--------|-------------|
| `match(url, content?, headers?)` | Returns `true` if this handler should process the URL |
| `resolve(url, content?, headers?, fetchFn?)` | Returns an array of [`DiscoverUriEntry`](/reference/types#discoverurientry) objects for the given page URL. A favicon handler can also return a [`DiscoverRef`](/reference/types#discoverref) for an icon that takes an extra request. See [Enriching Platform Icons](/other/favicons#enriching-platform-icons) |
| `getFeedHint(url)` | Returns the [hint](/reference/types#discoverurihint) of the feed the URL is, when it is one of the feeds the handler builds. The Platform method returns such a URL as given with that hint, and the [Guess method](/feeds/guess) drops a guessed one |

`guessExclusionRegex` is a deprecated field, kept so a handler that sets it still type-checks. It is ignored: the Guess method drops a guessed URL through `getFeedHint`, so declare the handler's feeds as in [Declaring Feeds](#declaring-feeds).

### Declaring Feeds

A handler declares its feeds in two places. `resolve` returns one [`DiscoverUriEntry`](/reference/types#discoverurientry) for each feed of the page, and `getFeedHint` reads a feed URL back to its hint.

An entry has a `uri` and an optional `hint`. The `uri` is the feed URL, or a list of URLs when one feed is served under several spellings, which discovery tries in order until one is a feed. The `hint` needs a `key` and a `label`, and takes a `format` when the platform serves a known one at that URL. A hint is keyed `{platform}:{kind}`, such as `example:posts`. The label is the text shown for that feed, written in the handler, since the labels feedscout ships cover only the built-in handlers. An entry without a hint is valid, and its result has none. The Platform method skips an `undefined` item `resolve` returns.

`getFeedHint` takes a URL and returns the hint of the feed it is, or `undefined` for a URL that is none of the handler's feeds. Check the host and the path, so the handler claims only the URLs it builds. The Platform method then returns such a URL as given with that hint, without running `match` and `resolve` on it, and the Guess method drops a guessed URL the handler claims, unless the handler returned it for the page. A handler without `getFeedHint` claims nothing: one of its feed URLs goes to `match` and `resolve` as any page does, and the Guess method keeps every URL it guesses.

```typescript
import type { PlatformHandler } from 'feedscout/platform'

const hosts = ['example.com', 'www.example.com']

const feedPathRegex = /^\/[^/]+\/feed\.rss$/

const exampleHandler: PlatformHandler = {
  match: (url) => hosts.includes(new URL(url).hostname),

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const [username] = pathname.split('/').filter(Boolean)

    if (!username) {
      return []
    }

    return [
      {
        uri: `${origin}/${username}/feed.rss`,
        hint: { key: 'example:posts', label: 'Posts', format: 'rss' },
      },
    ]
  },

  getFeedHint: (url) => {
    const { hostname, pathname } = new URL(url)

    if (hosts.includes(hostname) && feedPathRegex.test(pathname)) {
      return { key: 'example:posts', label: 'Posts', format: 'rss' }
    }
  },
}
```

For `https://example.com/alice` the handler returns the `https://example.com/alice/feed.rss` entry with its hint. For `https://example.com/alice/feed.rss` the Platform method returns that URL with the same hint.

A platform with many kinds of feed can describe them once as a table with `defineFeedUrls` from the `feedintel` package, which builds a feed URL from a row and reads a URL back to its row. The built-in handlers declare their feeds that way.

### Basic Example

A handler that appends `/feed.xml` to any URL on a specific domain:

```typescript
import type { PlatformHandler } from 'feedscout/platform'

const myHandler: PlatformHandler = {
  match: (url) => {
    return new URL(url).hostname === 'example.com'
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed.xml` }]
  },
}
```

### Using URL Patterns

A handler that extracts a username from the URL path:

```typescript
const profileHandler: PlatformHandler = {
  match: (url) => {
    const { hostname, pathname } = new URL(url)

    return hostname === 'example.com' && pathname.startsWith('/users/')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(/^\/users\/([^/]+)/)

    if (match?.[1]) {
      return [{ uri: `${origin}/users/${match[1]}/feed.rss` }]
    }

    return []
  },
}
```

### Using Page Content

When feed URLs can only be found in the HTML, use the `content` parameter:

```typescript
const contentHandler: PlatformHandler = {
  match: (url) => new URL(url).hostname === 'example.com',

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const match = content.match(/data-feed-url="([^"]+)"/)

    return match?.[1] ? [{ uri: match[1] }] : []
  },
}
```

### Combining with Defaults

Add custom handlers alongside the built-in ones:

```typescript
import { defaultPlatformOptions } from 'feedscout/platform'

const feeds = await discoverFeeds(url, {
  methods: {
    platform: {
      handlers: [myHandler, ...defaultPlatformOptions.handlers],
    },
  },
})
```
