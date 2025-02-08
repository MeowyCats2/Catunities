import app from "./app.ts";
import { generatePage, endpoint, csrfToken } from "./page.ts";
import type express from "express"

type User = {
	"user": {
		"id": number,
		"display_id": number,
		"username": string,
		"borough": string | null,
		"email": string,
		"email_verified": boolean,
		"camp_title": string | null,
		"first_name": string | null,
		"last_name": string | null,
		"date_of_birth": string | null,
		"is_active": boolean,
		"wallet": null,
		"food_points": number,
		"theme": null,
		"allow_relationships": boolean,
		"crafting_count": number,
		"tos_agree": boolean,
		"data_consent": boolean,
		"available_den_slots": number,
		"profile_icon": null,
		"pronouns": string | null,
		"is_account_complete": boolean,
		"is_onboarding_complete": boolean,
		"onboarding_cats": {
			"founding_cats": [],
			"follower_cats": []
		},
		"first_den": number,
		"priority_actions": []
	}
}

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
		"body": JSON.stringify({ username: req.body.username, password: req.body.password })
	})
	console.log(apiRes.headers.getSetCookie())
	const userData = await apiRes.json()
	console.log(apiRes.headers.getSetCookie().concat("usercache=" + encodeURIComponent(JSON.stringify(userData))))
	res.set("Set-Cookie", apiRes.headers.getSetCookie().concat("UserCache=" + encodeURIComponent(JSON.stringify(userData))))
	res.send(await generatePage(req, `${JSON.stringify(userData)}`))
})

const userInfoMap: Map<express.Request, false | any> = new Map();
export const getUserInfo = async (req: express.Request) => {
	if (userInfoMap.has(req)) return userInfoMap.get(req)
	const apiRes = await fetch(endpoint + "/users/me/", {
		"method": "GET",
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": req.cookies.csrftoken,
			"Cookie": `sessionid=${req.cookies.sessionid}; csrftoken=${req.cookies.csrftoken}`
		}
	})
	if (apiRes.status === 401) {
		userInfoMap.set(req, false)
		return false
	}
	userInfoMap.set(req, await apiRes.json());
	return userInfoMap.get(req);
}


app.get('/me', async (req, res) => {
	console.log(req.cookies)
	if (await getUserInfo(req) === false) res.redirect(302, "/signin")
	res.send(await generatePage(req, `${JSON.stringify(await getUserInfo(req))}`))
})