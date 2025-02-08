import app from "./app.ts";
import { getUserInfo } from "./users.ts";
import { generatePage, endpoint } from "./page.ts";
import { generateImageURL, createCat } from "./cats.ts"
import type { Cat, Borough } from "./cats.ts"
import { generateName } from "./generateName.ts"
import { generateCatCreator } from "./cat_creator.ts";

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
	res.send(await generatePage(req, `<nav class="breadcrumbs"><a href="/signup">Create an account</a> | <span class="currBreadcrumb">Choose a Borough</span></nav><br/>Click the borough you want to be.<form action="/onboarding/borough" method="POST" class="boroughChooseList">${boroughs.map((borough: Borough) => `<div><label for="borough${borough.id}Submit" class="boroughChooseItem"><img src="${borough.emblem}" alt="${borough.name}"><span>${borough.name}</span></label><input type="submit" id="borough${borough.id}Submit" name="borough" value="${borough.id}"></div>`).join("")}</div>`, `<link rel="stylesheet" href="/static/styles/forms.css">`))
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
		"body": JSON.stringify({ "borough": req.body.borough })
	})
	if (!apiRes.ok) await generatePage(req, "An unexpected error occured: " + JSON.stringify(await apiRes.json()))
	res.redirect(303, "/onboarding/founder#generalSection")
})

app.get('/onboarding/founder', async (req, res) => {
    if (await getUserInfo(req) === false) res.redirect(302, "/signin")
    res.send(await generatePage(req, `<nav class="breadcrumbs">
  <a href="/signup">Create an account</a> | <a href="/onboarding/borough">Choose a Borough</a>  | <span class="currBreadcrumb">Create your founder</span>
</nav>
<br/>
<h1>Your Territory Founder</h1>
${req.query.preview ? `<img src="${generateImageURL(req.query as unknown as Cat["genetic_data"])}" alt="Generated cat." class="catPreview">` : ""}
<form action="/onboarding/founder" method="POST">
  <label for="name">Name</label>
  <br/>
  <input type="text" name="name" id="name" value="${req.query.name ? ` ${(req.query.name as string).replaceAll('"', "&quot;")}` : generateName()}">
  ${await generateCatCreator(req.query as Record<string, string>)}
  <input type="submit" value="Submit"><button formmethod="GET" name="preview" value="true">Preview</button>
</form>`, `<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})
app.post('/onboarding/founder', async (req, res) => {
	if (await getUserInfo(req) === false) res.redirect(302, "/signin")
	await createCat({ ...req.body, user: (await getUserInfo(req)).id }, res)
	res.redirect(303, "/onboarding/cofounder")
})

app.get('/onboarding/cofounder', async (req, res) => {
	if (await getUserInfo(req) === false) res.redirect(302, "/signin")
	res.send(await generatePage(req, `<nav class="breadcrumbs">
  <a href="/signup">Create an account</a> | <a href="/onboarding/borough">Choose a Borough</a>  | <a href="/onboarding/borough">Create your founder</a> | <span class="currBreadcrumb">Create your co-founder</span>
</nav>
<br/>
<h1>Your Territory Co-Founder</h1>
${req.query.preview ? `<img src="${generateImageURL(req.query as unknown as Cat["genetic_data"])}" alt="Generated cat." class="catPreview">` : ""}
<form action="/onboarding/cofounder" method="POST">
  <label for="name">Name</label>
  <br/>
  <input type="text" name="name" id="name" value="${req.query.name ? ` ${(req.query.name as string).replaceAll('"', "&quot;")}` : generateName()}">
  ${await generateCatCreator(req.query as Record<string, string>)}
  <input type="submit" value="Submit"><button formmethod="GET" name="preview" value="true">Preview</button>
</form>`, `<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})

app.post('/onboarding/cofounder', async (req, res) => {
	if (await getUserInfo(req) === false) return res.redirect(302, "/signin")
	await createCat({ ...req.body, user: (await getUserInfo(req)).id }, res)
	res.redirect(303, "/onboarding/welcome")
})

app.get('/onboarding/welcome', async (req, res) => {
	if (await getUserInfo(req) === false) return res.redirect(302, "/signin")
	res.send(await generatePage(req, `You have now completed setting up your account! You can now start having fun.`))
})