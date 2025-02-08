import { generatePage, endpoint } from "./page.ts"
import app from "./app.ts"

app.get('/api_sandbox', async (req, res) => {
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
`, `<meta property="og:title" content="API Sandbox">`))
})
app.post('/api_sandbox', async (req, res) => {
	if (!req.body.url) return void res.status(400).send(await generatePage(req, `No URL!`))
	if (req.body.csrftoken !== req.cookies.csrftoken && (req.body.csrftoken === "undefined" ? req.cookies.csrftoken !== undefined : true)) return void res.status(401).send(await generatePage(req, "Session error!"))
	const payload: any = {
		"method": req.body.method,
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": req.cookies.csrftoken,
			"Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
		}
	}
	if (req.body.method !== "GET" && req.body.method !== "OPTIONS") payload.body = req.body.body
	const result = await fetch(endpoint + req.body.url, payload)
	const text = (await result.text()).replaceAll(new RegExp(endpoint.replace("https", "http").replaceAll(".", "\\.") + "(.+?)\"", "g"), `<a href="/api_sandbox?url=$1">${endpoint.replace("https", "http")}$1</a>"`)
	res.send(await generatePage(req, `
Status: ${result.status}
<br/><br/>
${text}
`, null))
})