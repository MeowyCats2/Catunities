import { generatePage, endpoint, csrfToken } from "./page.ts"
import app from "./app.ts"
import sharp from "sharp";

import type { Cat, Borough } from "./cats.ts";
const colorMap: Record<string, string> = {
	greyscale: "#434343",
	brown: "brown",
	red: "red",
	orange: "orange",
	yellow: "yellow",
	green: "green",
	teal: "teal",
	blue: "blue",
	purple: "purple",
	pink: "pink"
}

const catCache: Record<string, WeakRef<Blob>> = {};

export const generateCatCreator = async (selected: Record<string, string>, marks?: string[]) => {
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
	const generateRadioList = (key: string, id: string) => {
		const random = Math.floor(Math.random() * data[key].length);
		return `<div class="formRadioList">${data[key].map((attribute: {name: string, image: string}, index: number) => `<input type="radio" id="${attribute.name}${id}" name="${id}" value="${attribute.name}" required${id in selected ? (selected[id] === attribute.name ? " checked" : "") : (index === random ? " checked" : "")}><label for="${attribute.name}${id}" class="formRadioItem"><img src="${attribute.image}" alt="${attribute.name}"><span>${attribute.name}</span></label>`).join("")}</div>`;
	}
	const generateColorChooser = (title: string, id: string) => {
		let colors: Record<string, string[]>= {};
		const randomIndex = Math.floor(Math.random() * data.palettes.length);
		for (const [index, color] of (data.palettes as {
			name: string,
			preview_color: string,
			hue: string,
			saturation: string,
			luminosity: string
		}[]).entries()) {
			if (!(color.hue in colors)) colors[color.hue] = [];
			colors[color.hue].push(`<div class="colorChooserColor"><input type="radio" id="${color.name}${id}" name="${id}" value="${color.name}" required${id in selected ? (selected[id] === color.name ? " checked" : "") : (index === randomIndex ? " checked" : "")}><label for="${color.name}${id}"><div class="colorChooserPreview" aria-label="${color.preview_color}" style="background: ${color.preview_color}"></div> ${color.name}</label></div>`);
		}
		const result: string[]= [];
		for (const [key, value] of Object.entries(colors)) {
			result.push(`<div class="hueSection ${key}">
<h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
${value.join("\n")}
</div>`);
		}
		return `<div class="colorChooser">
${Object.keys(colors).map((hue: string, index: number) => `<input type="radio" id="${id}${hue}Radio" class="sectionRadio ${hue}Radio" name="${id}Radio"${index === 0 ? " checked" : ""}>`).join("")}
<div class="hues">${Object.keys(colors).map((hue: string) => `<label for="${id}${hue}Radio" style="background-color: ${colorMap[hue]}"></label>`).join("")}</div>
<h2>${title}</h2>
${result.join("\n")}
</div>`
	}
	const generateBoroughChooser = (id: string) => `<div class="formRadioList">${boroughs.map((attribute: Borough, index: number) => `<input type="radio" id="${attribute.id}${id}" name="${id}" value="${attribute.id}" required${id in selected ? (selected[id] === index + 1 + "" ? " checked" : "") : (index === 0 ? " checked" : "")}><label for="${attribute.id}${id}" class="formRadioItem"><img src="${attribute.emblem}" alt="${attribute.name}"><span>${attribute.name}</span></label>`).join("")}</div>`
	const generateEyePalettes = (key: string, id: string) => `<div class="formRadioList">${data[key].filter((attribute: {borough: string, name: string, image: string}) => attribute.borough === "Harvest").map((attribute: {borough: string, name: string, image: string}, index: number) => `<input type="radio" id="${attribute.name}${id}" name="${id}" value="${attribute.name}" required${id in selected ? (selected[id] === attribute.name ? " checked" : "") : (index === 0 ? " checked" : "")}><label for="${attribute.name}${id}" class="formRadioItem"><img src="${attribute.image}" alt="${attribute.name}"><span>${attribute.name}</span></label>`).join("")}</div>`

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
	<div class="catCreatorSection">
	  <h2>Marks (advanced)</h2>
	  <textarea id="marksTextarea" placeholder="A newline seperated list of the marks." name="marks">${marks?.join("\n")}</textarea>
	</div>
  </div>`
}

const convertToCatCreatorCat = (data: any) => {
	if (data.marks && data.marks !== "undefined") {
		data.white_coverage_marks = data.marks.split("\n");
		delete data.white_coverage;
	}
	return data;
};

const generateCat = async (data: string) => {
	const apiRes = await fetch(endpoint + "/cat_creator/generate/?cat_type=onboarding", {
		"method": "POST",
		"headers": {
			"Content-Type": "application/json",
			"X-CSRFToken": csrfToken
		},
		"body": data
	})
	if (!apiRes.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
		return false;
	}
	const formData = await apiRes.formData()
	const file = formData.get("file") as Blob;
	const enc = new TextDecoder("utf-8");
	return {
		file,
		data: JSON.parse(enc.decode(new Uint8Array(await (formData.get("data") as Blob).arrayBuffer())))
	}
}

app.get('/cat_creator', async (req, res) => {
	return void res.send(await generatePage(req, `<form action="/cat_creator" method="POST">${await generateCatCreator(req.query as Record<string, string>)}<input type="submit" value="Submit"></form>`, `<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})

app.get('/cached_cat.webp', async (req, res) => {
	const blob = catCache[req.query.requestId as string].deref();
	if (!blob) return void await res.status(404).send("Not found.")
	return void res.send(Buffer.from(await blob.arrayBuffer()));
})

app.get('/cached_cat.png', async (req, res) => {
	const blob = catCache[req.query.requestId as string].deref();
	if (!blob) return void await res.status(404).send("Not found.")
	res.set("Content-Type", "image/png").send(await sharp(await blob.arrayBuffer()).png({compressionLevel: 9}).toBuffer());
})

app.post('/cat_creator', async (req, res) => {
	console.log(req.body)
	const requestId = Math.random();
	const cat = await generateCat(JSON.stringify(convertToCatCreatorCat(req.body)));
	if (!cat) return void await generatePage(req, "Invalid cat.")
	catCache[requestId] = new WeakRef(cat.file);
    if (req.body.enablePNG === "true") {
        res.set("Set-Cookie", "enablePNG=true")
    }
    if (req.body.enablePNG === "false") {
        res.set("Set-Cookie", "enablePNG=; expires=Thu, 01 Jan 1970 00:00:00 GMT;")
    }
	res.send(await generatePage(req, `<img src="/cached_cat.${(req.body.enablePNG ? req.body.enablePNG === "true" : req.cookies.enablePNG) ? "png" : "webp"}?requestId=${requestId}" alt="Generated cat." class="catPreview">
<form action="/cat_creator" method="POST">
${Object.entries(req.body).map(([key, value]) => key === "enablePNG" ? "" : `<input type="hidden" name="${key}" value="${value}">`).join("")}
<input type="hidden" name="enablePNG" value="${(req.body.enablePNG ? req.body.enablePNG === "true" : req.cookies.enablePNG) ? "false": "true"}">
${(req.body.enablePNG ? req.body.enablePNG === "true" : req.cookies.enablePNG) ? `<input type="submit" value="Disable PNG format conversion">` : `<input type="submit" value="Enable PNG format conversion for old browsers">`}
</form><br/>
<form action="/cat_creator" method="POST">${await generateCatCreator(req.body as Record<string, string>, cat.data.marks)}<input type="submit" value="Submit"></form>`, `<meta property="og:title" content="Cat Creator">
<link rel="stylesheet" href="/static/styles/cat_creator.css">`))
})
