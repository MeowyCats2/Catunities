import type express from "express";
import { getUserInfo } from "./users.ts";

export const catCountData: {
    cachedCatCount: number | null,
    lastCatPurge: Date | null
} = {
    cachedCatCount: null,
    lastCatPurge: null
};

const createHeader = async (req: express.Request) => `
<div class="headerImage"></div>
<header id="pbHeader">
  <nav role="menubar">
	<a href="/" role="menuitem"><img src="/static/logo.png" alt="Catunities"></a>
    <a href="/dens">Dens</a>
	<div class="flex-grow"></div>
	<span>${catCountData.cachedCatCount === null ? "???" : catCountData.cachedCatCount} cats</span>
	${await getUserInfo(req) ? `<span>${(await getUserInfo(req)).username}</span>` : `<a href="/signin" role="menuitem"><button>Sign in</button></a>`}
  </nav>
</header>`

export const generatePage = async (req: express.Request, content: string, head?: string | null) => {
	return `<!DOCTYPE HTML>
  <html lang="en">
  <head>
  <title>Catunities</title>
  <meta name="format-detection" content="telephone=no">
  <link rel="stylesheet" href="/static/styles/main.css">
  <link rel="icon" type="image/x-icon" href="/static/favicon.png">
  <meta property="og:site_name" content="Catunities">
  <meta name="theme-color" content="#00FF0C">
  ${head ?? ""}
  </head>
  <body>
  <a href="#content" class="skipToMainContent"><button>Skip to main content</button></a>
  ${await createHeader(req)}
  <main id="content">
  ${content}
  </main>
  </body>
  </html>`
}

export const csrfToken: string = "69SUegDcWzy6E8qlMN4lprexFnlWj4Iv"
export const endpoint: string = "https://www.pawborough.net:8000/api"
