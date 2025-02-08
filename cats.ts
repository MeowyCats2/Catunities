import express from "express";
import app from "./app.ts";
import { generatePage, endpoint, csrfToken, catCountData } from "./page.ts";
import sharp from "sharp";

export type Borough = {
    "id": number,
    "name": string,
    "description": string,
    "emblem": string
}

export type Cat = {
    "id": number,
    "name": string,
    "user": null,
    "is_founder": boolean,
    "is_follower": boolean,
    "den": {
        "name": string
    },
    "created_at": string,
    "primary_pronoun": string,
    "secondary_pronoun": string,
    "tertiary_pronoun": string,
    "pronoun_frequency": string,
    "age": string,
    "breed": string,
    "pose": string,
    "gender": string,
    "pawprint": string | null,
    "equippable_slots": number,
    "equipment_slot_price": number,
    "front_end_genetic_data": {
        "gender_image": string,
        "overcoat_pattern_preview": string,
        "overcoat_palette_preview": string | null,
        "undercoat_pattern_preview": string,
        "undercoat_palette_preview": string | null,
        "accent_1_pattern_preview": string,
        "accent_1_palette_preview": string | null,
        "accent_2_pattern_preview": string,
        "accent_2_palette_preview": string | null,
        "eye_pattern_preview": string,
        "borough_preview": string
    },
    "genetic_data": {
        "age": string,
        "gender": string,
        "breed": string,
        "overcoat_pattern": string,
        "overcoat_palette": string,
        "undercoat_pattern": string,
        "undercoat_palette": string,
        "accent_pattern_1": string,
        "accent_palette_1": string,
        "accent_pattern_2": string,
        "accent_palette_2": string,
        "eye_pattern": string,
        "eye_palette": string,
        "borough": string,
        "white_coverage_marks": string[],
        "white_coverage": string,
        "generation": number
    },
    "white_coverage": string,
    "favorite_flavor": string | null,
    "favorite_flavor_image": string | null,
    "disliked_flavor": string | null,
    "disliked_flavor_image": string | null,
    "nature": string | null,
    "nature_image": string | null,
    "role": string | null,
    "crest": string | null,
    "image": string,
    "headshot": string,
    "height_4_paws": string | null,
    "height_2_paws": string | null,
    "weight": string | null,
    "base_number": number,
    "base_strength": number,
    "base_sense": number,
    "base_smarts": number,
    "base_speed": number,
    "base_savvy": number,
    "base_stamina": number,
    "base_sorcery": number,
    "strength": number,
    "sense": number,
    "smarts": number,
    "speed": number,
    "savvy": number,
    "stamina": number,
    "sorcery": number,
    "fortune": number,
    "doom": number
};

export const generateImageURL = (body: Cat["genetic_data"]) => "/cat.webp?data=" + encodeURIComponent(JSON.stringify({ "gender": body.gender, "age": body.age, "breed": body.breed, "overcoat_pattern": body.overcoat_pattern, "overcoat_palette": body.overcoat_palette, "undercoat_pattern": body.undercoat_pattern, "undercoat_palette": body.undercoat_palette, "accent_pattern_1": body.accent_pattern_1, "accent_palette_1": body.accent_palette_1, "accent_pattern_2": body.accent_pattern_2, "accent_palette_2": body.accent_palette_2, "eye_pattern": body.eye_pattern, "eye_palette": body.eye_palette, "borough": body.borough, "white_coverage": body.white_coverage }))

app.get('/cat.webp', async (req, res) => {
	const apiRes = await fetch(endpoint + "/cat_creator/generate/?cat_type=onboarding", {
		"method": "POST",
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": csrfToken
		},
		"body": req.query.data as string
	})
	if (!apiRes.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
		return void res.status(400).send({ "error": "Invalid cat.", "content": await apiRes.text() })
	}
	const formData = await apiRes.formData()
	const file = formData.get("file") as Blob;
	console.log(formData)
	console.log(file)
	const enc = new TextDecoder("utf-8");
	console.log(enc.decode(new Uint8Array(await (formData.get("data") as Blob).arrayBuffer())))
	res.set("Content-Type", file.type).send(Buffer.from(await file.arrayBuffer()))
})
app.get('/cat.png', async (req, res) => {
	const apiRes = await fetch(endpoint + "/cat_creator/generate/?cat_type=onboarding", {
		"method": "POST",
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": csrfToken
		},
		"body": req.query.data as string
	})
	if (!apiRes.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
		return void res.status(400).send({ "error": "Invalid cat.", "content": await apiRes.text() })
	}
	const formData = await apiRes.formData()
	const file = formData.get("file") as Blob;
	const enc = new TextDecoder("utf-8");
	res.set("Content-Type", "image/png").send(await sharp(await file.arrayBuffer()).png({compressionLevel: 9}).toBuffer());
})

export const createCat = async (body: Cat["genetic_data"], res: express.Response) => {
	const renderRes = await fetch(endpoint + "/cat_creator/generate/?cat_type=onboarding", {
		"method": "POST",
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": csrfToken
		},
		"body": JSON.stringify(body)
	})
	if (!renderRes.headers.get("Content-Type")!.startsWith("multipart/form-data")) {
		return res.status(400).send({ "error": "Invalid cat.", "content": await renderRes.text() })
	}
	const formData = await renderRes.formData()
	const enc = new TextDecoder("utf-8");
	const renderData = JSON.parse(enc.decode(new Uint8Array(await (formData.get("data") as Blob).arrayBuffer())))
	const catData: any = structuredClone(body)
	catData.white_coverage = "";
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

app.get('/cats/:id', async (req, res) => {
	const catRes = await fetch(endpoint + "/cats/" + req.params.id + "/", {
		"method": "GET",
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": csrfToken
		}
	})
	if (catRes.status === 404) return void res.status(404).send(await generatePage(req, `Cat not found.`))
	if (catRes.status === 500) return void res.status(503).send(await generatePage(req, `This cat is currently unavailable.`))
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
	const generateStat = (name: string, key: string, special?: boolean) => `<div class="catStat${special ? " catStatSpecial" : ""}">
	  <span class="catStatName">${name}</span>
	  <span class="catStatQuality">poor</span>
	  <span class="catStatValue">${typeof key === "string" ? catData[key] : key}</span>
	  ${special ? "" : `<div class="catStatDice">D1 | (-5)</div>`}
	</div>`
	const generateAppearancePart = (frontendKey: string, patternKey: string, paletteKey: string) => `      <div class="catAppearancePart">
		<img src="${catData.front_end_genetic_data[frontendKey]}" alt="Genetic pattern preview">
		<div class="catAppearanceDetails">
	   <span>${catData.genetic_data[patternKey]}</span>
	  <span>${catData.genetic_data[paletteKey]}</span>
		</div>
		<div style="background: ${dropdownData.palettes.find((palette: {
			name: string,
			preview_color: string,
			hue: string,
			saturation: string,
			luminosity: string
		}) => palette.name.toLowerCase() === catData.genetic_data[paletteKey].toLowerCase()).preview_color}" class="catAppearanceColor"></div>
	  </div>`
	const imageURL = imageRes.status === 404 ? generateImageURL({ ...catData.genetic_data, "borough": boroughData.find((borough: Borough) => borough.name === catData.genetic_data.borough).id }) : catData.image
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

	const search = async (subtract: number, add: number) => {
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

	catCountData.cachedCatCount = curr

	return curr
}

app.get('/cat_counter', async (req, res) => {
	res.send(await generatePage(req, await calculateCatCount() + "", `<meta property="og:title" content="Cat Counter">`))
})

app.get('/last_cat_purge', async (req, res) => {
	res.send(await generatePage(req, catCountData.lastCatPurge?.toString() ?? "None.", `<meta property="og:title" content="Last Purge">`))
})

setInterval(async () => {
	if (catCountData.cachedCatCount === null) return
	const lastKnownRes = await fetch("https://www.pawborough.net:8000/api/cats/" + catCountData.cachedCatCount + "/")
	if (lastKnownRes.status === 404) {
		catCountData.lastCatPurge = new Date()
		await calculateCatCount()
		return
	}
	while (1) {
		const res = await fetch("https://www.pawborough.net:8000/api/cats/" + (catCountData.cachedCatCount + 1) + "/")
		if (res.status === 404) break
		catCountData.cachedCatCount += 1
	}
}, 60000)

await calculateCatCount()