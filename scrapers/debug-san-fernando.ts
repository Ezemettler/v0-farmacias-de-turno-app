import * as cheerio from "cheerio"

const URL = "https://colfarmasanfdo.org.ar/turnero.html"

const res = await fetch(URL, {
  headers: {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "es-AR,es;q=0.9",
  },
  signal: AbortSignal.timeout(30_000),
})

if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`)
  process.exit(1)
}

const html = await res.text()
const $ = cheerio.load(html)

// 1. Cantidad de tablas
const tablas = $("table")
console.log(`\n=== TABLAS EN LA PÁGINA: ${tablas.length} ===\n`)

// 2. HTML completo de la primera tabla
console.log("=== HTML COMPLETO DE LA PRIMERA TABLA ===\n")
console.log(tablas.first().toString())

// 3. Primeras 5 <td> con contenido exacto
console.log("\n=== PRIMERAS 5 CELDAS <td> ===\n")
$("td").slice(0, 5).each((i, el) => {
  console.log(`--- td[${i}] ---`)
  console.log("HTML:", $(el).html()?.trim())
  console.log("TEXT:", JSON.stringify($(el).text().trim()))
  console.log()
})
