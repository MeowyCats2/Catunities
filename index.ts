import express from "express";
import "express-async-errors"
import app from "./app.ts"
import { generatePage } from "./page.ts";
import "./onboarding.ts";
import "./api_sandbox.ts";
import "./dens.ts";

const port: number = 3000;

app.get('/', async (req, res) => {
	res.send(await generatePage(req, "Welcome! Note that this is just a fan site and isn't official.", `<meta property="og:title" content="Home Page">`))
})

app.use(async (req, res) => {
	res.status(404).send(await generatePage(req, `You seem a bit lost. There's nothing to see here.`, `<meta property="og:title" content="404 Not Found">`))
})

app.use(async (error: Error, req: express.Request, res: express.Response, next: Function) => {
	console.error(error)
	res.status(500).send(await generatePage(req, `Oops! An error occured!`, `<meta property="og:title" content="500 Internal Server Error">`))
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})
