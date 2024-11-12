import express from "express";
import cookieParser from "cookie-parser";
import { Buffer } from "node:buffer";
import { generateName } from "./generateName.ts"
import "express-async-errors"
const app = express();
const port: number = 3000;

const csrfToken: string = "69SUegDcWzy6E8qlMN4lprexFnlWj4Iv"
const endpoint: string = "https://www.pawborough.net:8000/api"
const endpoints = {
	"demo": "https://www.pawborough.net:8000/api",
	"alpha": "https://alpha.pawborough.net:8000/api"
}

let cachedCatCount = null

let lastCatPurge = null

app.use('/static', express.static('static'))
app.use(express.urlencoded({ extended: false}))
app.use(cookieParser())

const createHeader = async (req) => `
<div class="headerImage"></div>
<header id="pbHeader">
  <nav role="menubar">
	<a href="/" role="menuitem"><img src="/static/logo.png" alt="Catunities"></a>
	<div class="flex-grow"></div>
	<span>${cachedCatCount === null ? "???" : cachedCatCount} cats</span>
	${await getUserInfo(req) ? `<span>${(await getUserInfo(req)).username}</span>` : `<a href="/signin" role="menuitem"><button>Sign in</button></a>`}
  </nav>
</header>`

const generatePage = async (req, content, head) => {
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

app.get('/', async (req, res) => {
  res.send(await generatePage(req, "Welcome! Note that this is just a fan site and isn't official.", `<meta property="og:title" content="Home Page">`))
})

app.get('/signin', async (req, res) => {
  res.send(await generatePage(req, `<form action="/signin" method="POST">
<label for="username">Username</label><br>
<input type="text" id="username" name="username" autocomplete="username" required>
<br>
<label for="password">Password</label>
<br>
<input type="checkbox" id="showPassword"> <label for="showPassword">Show Password</label>
<br>
<input type="text" id="password" name="password" autocomplete="current-password" required><br/>
<input type="submit" value="Submit">
</form>`, `<meta property="og:title" content="Sign in">`))
})

app.post('/signin', async (req, res) => {
  const apiRes = await fetch(endpoint + "/auth/login/", {
	"method": "POST",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken,
	  "Cookie": "csrftoken=" + csrfToken
	},
	"body": JSON.stringify({username: req.body.username, password: req.body.password})
  })
  console.log(apiRes.headers.getSetCookie())
  const userData = await apiRes.json()
  console.log(apiRes.headers.getSetCookie().concat("usercache=" + encodeURIComponent(JSON.stringify(userData))))
  res.set("Set-Cookie", apiRes.headers.getSetCookie().concat("UserCache=" + encodeURIComponent(JSON.stringify(userData))))
  res.send(await generatePage(req, `${JSON.stringify(userData)}`))
})

const getUserInfo = async (req) => {
  if (req.user) return req.user
  const apiRes = await fetch(endpoint + "/users/me/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": req.cookies.csrftoken,
	  "Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
	}
  })
  if (apiRes.status === 401) {
	req.user = false
	return false
  }
  req.user = await apiRes.json()
  return req.user
}


app.get('/me', async (req, res) => {
  console.log(req.cookies)
  if (await getUserInfo(req) === false) res.redirect(302, "/signin")
  res.send(await generatePage(req, `${JSON.stringify(await getUserInfo(req))}`))
})

app.get('/onboarding/borough', async (req, res) => {
  if (await getUserInfo(req) === false) res.redirect(302, "/signin")
  const apiRes = await fetch(endpoint + "/boroughs/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": req.cookies.csrftoken,
	  "Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
	}
  })
  const boroughs = await apiRes.json()
  console.log(req.cookies)
  res.send(await generatePage(req, `<nav class="breadcrumbs"><a href="/signup">Create an account</a> | <span class="currBreadcrumb">Choose a Borough</span></nav><br/>Click the borough you want to be.<form action="/onboarding/borough" method="POST" class="boroughChooseList">${boroughs.map(borough => `<div><label for="borough${borough.id}Submit" class="boroughChooseItem"><img src="${borough.emblem}" alt="${borough.name}"><span>${borough.name}</span></label><input type="submit" id="borough${borough.id}Submit" name="borough" value="${borough.id}"></div>`).join("")}</div>`, `<link rel="stylesheet" href="/static/styles/forms.css">`))
})

app.post('/onboarding/borough', async (req, res) => {
  if (await getUserInfo(req) === false) res.redirect(302, "/signin")
  const apiRes = await fetch(endpoint + "/users/" + (await getUserInfo(req)).id + "/", {
	"method": "PATCH",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": req.cookies.csrftoken,
	  "Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
	},
	"body": JSON.stringify({"borough": req.body.borough})
  })
  if (!apiRes.ok) await generatePage(req, "An unexpected error occured: " + JSON.stringify(await apiRes.json()))
  res.redirect(303, "/onboarding/founder#generalSection")
})
app.get('/cat.png', async (req, res) => {
  const apiRes = await fetch(endpoint + "/cat_creator/generate/?cat_type=onboarding", {
	"method": "POST",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	},
	"body": req.query.data
  })
  if (!apiRes.headers.get("Content-Type").startsWith("multipart/form-data")) {
	return res.status(400).send({"error": "Invalid cat.", "content": await apiRes.text()})
  }
  const formData = await apiRes.formData()
  const file = formData.get("file")
  console.log([...formData.entries()])
  console.log(file)
  const enc = new TextDecoder("utf-8");
  console.log(enc.decode(new Uint8Array(await formData.get("data").arrayBuffer())))
  res.set("Content-Type", file.type).send(Buffer.from(await file.arrayBuffer()))
})
const generateCatCreator = async (selected) => {
  const apiRes = await fetch(endpoint + "/cat_creator/dropdown_options/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	}
  })
  const data = await apiRes.json()
  const boroughs = await (await fetch(endpoint + "/boroughs/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	}
  })).json()
  const generateRadioList = (key, id) => {
	const random = Math.floor(Math.random() * data[key].length);
	return `<div class="formRadioList">${data[key].map((attribute, index) => `<input type="radio" id="${attribute.name}${id}" name="${id}" value="${attribute.name}" required${id in selected && selected[id] === attribute.name ? " checked" : (index === random ? " checked": "")}><label for="${attribute.name}${id}" class="formRadioItem"><img src="${attribute.image}" alt="${attribute.name}"><span>${attribute.name}</span></label>`).join("")}</div>`;
  }
  const generateColorChooser = (title, id) => `<div class="colorChooser"><h2>${title}</h2>${data.palettes.map((color, index) => `<div class="colorChooserColor"><input type="radio" id="${color.name}${id}" name="${id}" value="${color.name}" required${id in selected && selected[id] === color.name ? " checked" : (index === 0 ? " checked": "")}><label for="${color.name}${id}"><div class="colorChooserPreview" aria-label="${color.preview_color}" style="background: ${color.preview_color}"></div> ${color.name}</label></div>`).join("")}</div>`;
  const generateBoroughChooser = (id) => `<div class="formRadioList">${boroughs.map((attribute, index) => `<input type="radio" id="${attribute.id}${id}" name="${id}" value="${attribute.id}" required${id in selected && selected[id] === attribute.name ? " checked" : (index === 0 ? " checked": "")}><label for="${attribute.id}${id}" class="formRadioItem"><img src="${attribute.emblem}" alt="${attribute.name}"><span>${attribute.name}</span></label>`).join("")}</div>`
  const generateEyePalettes = (key, id) => `<div class="formRadioList">${data[key].filter(attribute => attribute.borough === "Harvest").map((attribute, index) => `<input type="radio" id="${attribute.name}${id}" name="${id}" value="${attribute.name}" required${id in selected && selected[id] === attribute.name ? " checked" : (index === 0 ? " checked": "")}><label for="${attribute.name}${id}" class="formRadioItem"><img src="${attribute.image}" alt="${attribute.name}"><span>${attribute.name}</span></label>`).join("")}</div>`
  
  return `<input type="radio" id="generalRadio" class="sectionRadio" name="section" checked>
  <input type="radio" id="overcoatRadio" class="sectionRadio" name="section">
  <input type="radio" id="undercoatRadio" class="sectionRadio" name="section">
  <input type="radio" id="accent1Radio" class="sectionRadio" name="section">
  <input type="radio" id="accent2Radio" class="sectionRadio" name="section">
  <input type="radio" id="eyesRadio" class="sectionRadio" name="section">
  <input type="radio" id="whiteCoverageRadio" class="sectionRadio" name="section">
  <div class="catCreatorButtons">
	<label for="generalRadio" class="button">General</label>
	<label for="overcoatRadio" class="button">Overcoat</label>
	<label for="undercoatRadio" class="button">Undercoat</label>
	<label for="accent1Radio" class="button">Accent 1</label>
	<label for="accent2Radio" class="button">Accent 2</label>
	<label for="eyesRadio" class="button">Eyes</label>
	<label for="whiteCoverageRadio" class="button">White Coverage</label>
  </div>
  <div class="catCreatorSections" id="generalSection">
	<div class="catCreatorSection">
	  <h2>Breed</h2>
	  ${generateRadioList("breeds", "breed")}
	</div>
	<div class="catCreatorHalf">
	  <div class="catCreatorSection">
		<h2>Gender</h2>
		${generateRadioList("genders", "gender")}
	  </div>
	  <div class="catCreatorSection">
		<h2>Age</h2>
		${generateRadioList("ages", "age")}
	  </div>
	</div>
  </div>
  <div class="catCreatorSections" id="overcoatSection">
	<div class="catCreatorSection">
	  <h2>Overcoat Pattern</h2>
	  ${generateRadioList("overcoat_patterns", "overcoat_pattern")}
	</div>
	${generateColorChooser("Overcoat Color", "overcoat_palette")}
  </div>
  <div class="catCreatorSections" id="undercoatSection">
	<div class="catCreatorSection">
	  <h2>Undercoat Pattern</h2>
	  ${generateRadioList("undercoat_patterns", "undercoat_pattern")}
	</div>
	${generateColorChooser("Undercoat Color", "undercoat_palette")}
  </div>
  <div class="catCreatorSections" id="accent1Section">
	<div class="catCreatorSection">
	  <h2>Accent 1 Pattern</h2>
	  ${generateRadioList("accent_patterns", "accent_pattern_1")}
	</div>
	${generateColorChooser("Accent 1 Color", "accent_palette_1")}
  </div>
  <div class="catCreatorSections" id="accent2Section">
	<div class="catCreatorSection">
	  <h2>Accent 2 Pattern</h2>
	  ${generateRadioList("accent_patterns", "accent_pattern_2")}
	</div>
	${generateColorChooser("Accent 2 Color", "accent_palette_2")}
  </div>
  <div class="catCreatorSections" id="eyesSection">
	<div class="catCreatorSection">
	  <h2>Eye Pattern</h2>
	  ${generateRadioList("eye_patterns", "eye_pattern")}
	</div>
	<div class="catCreatorHalf">
	  <div class="catCreatorSection">
		<h2>Eye Palette</h2>
		${generateEyePalettes("eye_palettes", "eye_palette")}
	  </div>
	  <div class="catCreatorSection">
		<h2>Borough</h2>
		${generateBoroughChooser("borough")}
	  </div>
	</div>
  </div>
  <div class="catCreatorSections" id="whiteCoverageSection">
	<div class="catCreatorSection">
	  <h2>White Coverage</h2>
	  ${generateRadioList("white_coverage", "white_coverage")}
	</div>
  </div>`
}

app.get('/cat_creator', async (req, res) => {
  return res.send(await generatePage(req, `<form action="/cat_creator" method="POST">${await generateCatCreator(req.query)}<input type="submit" value="Submit"></form>`, `<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})

const generateImageURL = (body) => "/cat.png?data=" + encodeURIComponent(JSON.stringify({"gender": body.gender, "age": body.age, "breed": body.breed, "overcoat_pattern":body.overcoat_pattern,"overcoat_palette":body.overcoat_palette,"undercoat_pattern":body.undercoat_pattern,"undercoat_palette":body.undercoat_palette,"accent_pattern_1":body.accent_pattern_1,"accent_palette_1":body.accent_palette_1,"accent_pattern_2":body.accent_pattern_2,"accent_palette_2":body.accent_palette_2,"eye_pattern":body.eye_pattern,"eye_palette":body.eye_palette,"borough":body.borough,"white_coverage":body.white_coverage}))

app.post('/cat_creator', async (req, res) => {
  console.log(req.body)
  res.send(await generatePage(req, `<img src="${generateImageURL(req.body)}" alt="Generated cat.">`, `<meta property="og:title" content="Cat Creator">`))
})

app.get('/onboarding/founder', async (req, res) => {
  if (await getUserInfo(req) === false) res.redirect(302, "/signin")
  res.send(await generatePage(req, `<nav class="breadcrumbs">
  <a href="/signup">Create an account</a> | <a href="/onboarding/borough">Choose a Borough</a>  | <span class="currBreadcrumb">Create your founder</span>
</nav>
<br/>
<h1>Your Territory Founder</h1>
${req.query.preview ? `<img src="${generateImageURL(req.query)}" alt="Generated cat." class="catPreview">` : ""}
<form action="/onboarding/founder" method="POST">
  <label for="name">Name</label>
  <br/>
  <input type="text" name="name" id="name" value="${req.query.name ? ` ${req.query.name.replaceAll('"', "&quot;")}` : generateName()}">
  ${await generateCatCreator(req.query)}
  <input type="submit" value="Submit"><button formmethod="GET" name="preview" value="true">Preview</button>
</form>`, `<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})
const createCat = async (body) => {
  const renderRes = await fetch(endpoint + "/cat_creator/generate/?cat_type=onboarding", {
	"method": "POST",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	},
	"body": JSON.stringify(body)
  })
  if (!renderRes.headers.get("Content-Type").startsWith("multipart/form-data")) {
	return res.status(400).send({"error": "Invalid cat.", "content": await renderRes.text()})
  }
  const formData = await renderRes.formData()
  const enc = new TextDecoder("utf-8");
  const renderData = JSON.parse(enc.decode(new Uint8Array(await formData.get("data").arrayBuffer())))
  const catData = structuredClone(body)
  delete catData.white_coverage
  catData.borough = +catData.borough
  catData.white_coverage_marks = renderData.marks
  console.log(catData)
  const apiRes = await fetch(endpoint + "/cats/", {
	"method": "POST",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	},
	"body": JSON.stringify(catData)
  })
  const data = await apiRes.json()
  const apiRes2 = await fetch(endpoint + "/cats/" + data.id + "/", {
	"method": "PATCH",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	},
	"body": JSON.stringify(catData)
  })
  const data2 = await apiRes2.json()
  return data2
};

app.post('/onboarding/founder', async (req, res) => {
  if (await getUserInfo(req) === false) res.redirect(302, "/signin")
  await createCat({...req.body, user: (await getUserInfo(req)).id})
  res.redirect(303, "/onboarding/cofounder")
})

app.get('/onboarding/cofounder', async (req, res) => {
  if (await getUserInfo(req) === false) res.redirect(302, "/signin")
  res.send(await generatePage(req, `<nav class="breadcrumbs">
  <a href="/signup">Create an account</a> | <a href="/onboarding/borough">Choose a Borough</a>  | <a href="/onboarding/borough">Create your founder</a> | <span class="currBreadcrumb">Create your co-founder</span>
</nav>
<br/>
<h1>Your Territory Co-Founder</h1>
${req.query.preview ? `<img src="${generateImageURL(req.query)}" alt="Generated cat." class="catPreview">` : ""}
<form action="/onboarding/cofounder" method="POST">
  <label for="name">Name</label>
  <br/>
  <input type="text" name="name" id="name" value="${req.query.name ? ` ${req.query.name.replaceAll('"', "&quot;")}` : generateName()}">
  ${await generateCatCreator(req.query)}
  <input type="submit" value="Submit"><button formmethod="GET" name="preview" value="true">Preview</button>
</form>`, `<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})

app.post('/onboarding/cofounder', async (req, res) => {
  if (await getUserInfo(req) === false) return res.redirect(302, "/signin")
  await createCat({...req.body, user: (await getUserInfo(req)).id})
  res.redirect(303, "/onboarding/welcome")
})

app.get('/onboarding/welcome', async (req, res) => {
  if (await getUserInfo(req) === false) return res.redirect(302, "/signin")
  res.send(await generatePage(req, `You have now completed setting up your account! You can now start having fun.`))
})

app.get('/cats/:id', async (req, res) => {
  const catRes = await fetch(endpoint + "/cats/" + req.params.id + "/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	}
  })
  if (catRes.status === 404) return res.status(404).send(await generatePage(req, `Cat not found.`))
  if (catRes.status === 500) return res.status(503).send(await generatePage(req, `This cat is currently unavailable.`))
  const catData = await catRes.json()
  const dropdownRes = await fetch(endpoint + "/cat_creator/dropdown_options/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	}
  })
  const dropdownData = await dropdownRes.json()
  const imageRes = await fetch(catData.image)
  const boroughData = imageRes.status === 404 ? await (await fetch(endpoint + "/boroughs/", {
	"method": "GET",
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": csrfToken
	}
  })).json() : null;
  const generateStat = (name, key, special) => `<div class="catStat${special ? " catStatSpecial" : ""}">
	  <span class="catStatName">${name}</span>
	  <span class="catStatQuality">poor</span>
	  <span class="catStatValue">${typeof key === "string" ? catData[key] : key}</span>
	  ${special ? "" : `<div class="catStatDice">D1 | (-5)</div>`}
	</div>`
  const generateAppearancePart = (frontendKey, patternKey, paletteKey) => `      <div class="catAppearancePart">
		<img src="${catData.front_end_genetic_data[frontendKey]}" alt="Genetic pattern preview">
		<div class="catAppearanceDetails">
	   <span>${catData.genetic_data[patternKey]}</span>
	  <span>${catData.genetic_data[paletteKey]}</span>
		</div>
		<div style="background: ${dropdownData.palettes.find(palette => palette.name.toLowerCase() === catData.genetic_data[paletteKey].toLowerCase()).preview_color}" class="catAppearanceColor"></div>
	  </div>`
  const imageURL = imageRes.status === 404 ? generateImageURL({...catData.genetic_data, "borough": boroughData.find(borough => borough.name === catData.genetic_data.borough).id}) : catData.image
  res.send(await generatePage(req, `<div class="catHeader">
  <div class="catHeaderInfo">
	<div class="catImageWrapper">
	  <img src="${imageURL}" alt="Image of the cat.">
	</div>
	<div class="catBiologicalInfo">
	  <span>${catData.name}</span>
	  <span>${catData.created_at}</span>
	  <span>ID #${catData.id}</span>
	</div>
  </div>
</div>
<div class="catInformation">
  <div class="catStats">
	${generateStat("Stamina", "stamina")}
	${generateStat("Strength", "strength")}
	${generateStat("Sense", "sense")}
	${generateStat("Smarts", "smarts")}
	${generateStat("Fortune", "fortune", true)}
	${generateStat("Speed", "speed")}
	${generateStat("Savvy", "savvy")}
	${generateStat("Sorcery", "sorcery")}
	${generateStat("Summary", catData.stamina + catData.strength + catData.sense + catData.fortune + catData.speed + catData.savvy + catData.sorcery + catData.doom)}
	${generateStat("Doom", "doom", true)}
  </div>
  <div class="catTraits">
	<span class="catTraitsTitle">Traits</span>
	<span>${catData.age} | ${catData.breed}</span>
	<div class="catTraitsMain">
	  <div class="catAppearance">
		${generateAppearancePart("overcoat_pattern_preview", "overcoat_pattern", "overcoat_palette")}
		${generateAppearancePart("undercoat_pattern_preview", "undercoat_pattern", "undercoat_palette")}
		${generateAppearancePart("accent_1_pattern_preview", "accent_pattern_1", "accent_palette_1")}
		${generateAppearancePart("accent_2_pattern_preview", "accent_pattern_2", "accent_palette_2")}
	  </div>
	  <div class="catPhysicalTraits">
		<div>
		  <span>Height 4 Paws</span>
		  <span class="catPhysicalValue">${catData.height_4_paws}</span>
		</div>
		<div>
		  <span>Height 2 Paws</span>
		  <span class="catPhysicalValue">${catData.height_2_paws}</span>
		</div>
		<div>
		  <span>Weight</span>
		  <span class="catPhysicalValue">${catData.weight}</span>
		</div>
	  </div>
	</div>
  </div>
</div>`, `<meta property="og:title" content="${catData.name}"><meta property="og:image" content="${imageURL}"><meta property="og:description" content="Created at ${catData.created_at}\nID: #${catData.id}"><link rel="stylesheet" href="/static/styles/cats.css">`))
})

const calculateCatCount = async () => {
  let curr = 2

  const search = async (subtract, add) => {
	curr -= subtract
	while (1) {
	  const res = await fetch(endpoint + "/cats/" + curr + "/")
	  if (res.status === 404) break
	  curr += add
	}
  }

  await search(0, 10000)
  await search(10000, 1000)
  await search(1000, 100)
  await search(100, 10)
  await search(10, 1)

  curr -= 1

  cachedCatCount = curr

  return curr
}

app.get('/cat_counter', async (req, res) => {
  res.send(await generatePage(req, await calculateCatCount(), `<meta property="og:title" content="Cat Counter">`))
})

app.get('/last_cat_purge', async (req, res) => {
  res.send(await generatePage(req, lastCatPurge.toString(), `<meta property="og:title" content="Last Purge">`))
})

app.get('/:server/api_sandbox', async (req, res) => {
  res.send(await generatePage(req, `
<form action="/api_sandbox" method="POST">
  <input type="hidden" name="csrftoken" value="${req.cookies.csrftoken}">
  <label for="url">URL</label>
  <input id="url" name="url"${req.query.url ? ` value="${req.query.url}"` : ""}>
  <label for="method">Method</label>
  <input id="method" name="method" value="GET">
  <label for="body">Body</label>
  <textarea id="body" name="body"></textarea>
  <input type="submit" value="Submit">
</form>
`, `<meta property="og:title" content="API Sandbox">`, "", server))
})
app.post('/:server/api_sandbox', async (req, res) => {
  if (!req.body.url) return res.status(400).send(await generatePage(req, `No URL!`))
  if (req.body.csrftoken !== req.cookies.csrftoken) return res.status(401).send(await generatePage(req, "Session error!"))
  const payload = {
	"method": req.body.method,
	"headers": {
	  "Content-Type": "application/json",
	  "X-CSRFToken": req.cookies.csrftoken,
	  "Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
	}
  }
  if (req.body.method !== "GET" && req.body.method !== "OPTIONS") payload.body = req.body.body
  const result = await fetch(endpoints[server] + req.body.url, payload)
  const text = (await result.text()).replaceAll(new RegExp(endpoint.replace("https", "http").replaceAll(".", "\\.") + "(.+?)\"", "g"), `<a href="/api_sandbox?url=$1">${endpoint.replace("https", "http")}$1</a>"`)
  res.send(await generatePage(req, `
Status: ${result.status}
<br/><br/>
${text}
`, null, server))
})

app.get("/dens", async (req, res) => {
  const data = await (await fetch(endpoint + "/dens/", {
	"method": "GET",
	"headers": {
		"Content-Type": "application/json",
		"X-CSRFToken": req.cookies.csrftoken,
		"Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
	}
  })).json()
  res.send(await generatePage(req, `
  Dens list
  <ul>
  ${data.sort((a, b) => a.position - b.position).map(den => `
    <li><a href="/dens/${den.id}">${den.name}</a></li>
  `).join("")}
  </ul>
  `))
})

app.get("/dens/:id", async (req, res) => {
	const dropdownRes = await fetch(endpoint + "/cat_creator/dropdown_options/", {
		"method": "GET",
		"headers": {
		  "Content-Type": "application/json",
		  "X-CSRFToken": csrfToken
		}
	  })
	const dropdownData = await dropdownRes.json()
  const data = await (await fetch(endpoint + "/cats/?den_id=" + req.params.id, {
	"method": "GET",
	"headers": {
		"Content-Type": "application/json",
		"X-CSRFToken": req.cookies.csrftoken,
		"Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
	}
  })).json()
  res.send(await generatePage(req, `
  Cat list
  <div class="catList">
  ${data.length > 0 ? data.sort((a, b) => a.position - b.position).map(cat => `
	<div class="cat"><a href="/cats/${cat.id}">
	${cat.name}
	<img src="${cat.image}" alt="Image of cat">
	<div class="catAttributes">
	<img src="${dropdownData.genders.find(gender => gender.name.toLowerCase() === cat.gender.toLowerCase()).image}" alt="${cat.gender}">
	<img src="${cat.borough.emblem}" alt="${cat.borough.name}">
	<img src="${dropdownData.ages.find(age => age.name.toLowerCase() === cat.age.toLowerCase()).image}" alt="${cat.age}">
	</div>
	</a></div>
  `).join("") : "No cats yet."}
  </div>
  `, `<link rel="stylesheet" href="/static/styles/dens.css">`))
})

app.use(async (req, res) => {
  res.status(404).send(await generatePage(req, `You seem a bit lost. There's nothing to see here.`, `<meta property="og:title" content="404 Not Found">`))
})

app.use(async (error, req, res, next) => {
  console.error(error)
  res.status(500).send(await generatePage(req, `Oops! An error occured!`, `<meta property="og:title" content="500 Internal Server Error">`))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

setInterval(async () => {
  if (cachedCatCount === null) return
  const lastKnownRes = await fetch("https://www.pawborough.net:8000/api/cats/" + cachedCatCount + "/")
  if (lastKnownRes.status === 404) {
	lastCatPurge = new Date()
	await calculateCatCount()
	return
  }
  while (1) {
	const res = await fetch("https://www.pawborough.net:8000/api/cats/" + (cachedCatCount + 1) + "/")
	if (res.status === 404) break
	cachedCatCount += 1
  }
}, 60000)

await calculateCatCount()