import { generatePage, endpoint, csrfToken } from "./page.ts"
import app from "./app.ts"

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
  ${data.sort((a: {position: number, id: string, name: string}, b: {position: number, id: string, name: string}) => a.position - b.position).map((den: {position: number, id: string, name: string}) => `
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
  ${data.length > 0 ? data.sort((a: any, b: any) => a.position - b.position).map((cat: any) => `
	<div class="cat"><a href="/cats/${cat.id}">
	${cat.name}
	<img src="${cat.image}" alt="Image of cat">
	<div class="catAttributes">
	<img src="${dropdownData.genders.find((gender: {name: string, image: string}) => gender.name.toLowerCase() === cat.gender.toLowerCase()).image}" alt="${cat.gender}">
	<img src="${cat.borough.emblem}" alt="${cat.borough.name}">
	<img src="${dropdownData.ages.find((age: {name: string, image: string}) => age.name.toLowerCase() === cat.age.toLowerCase()).image}" alt="${cat.age}">
	</div>
	</a></div>
  `).join("") : "No cats yet."}
  </div>
  `, `<link rel="stylesheet" href="/static/styles/dens.css">`))
})