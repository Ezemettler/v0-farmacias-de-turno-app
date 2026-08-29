import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { enviarMensaje, descargarArchivo } from "./lib/telegram-api.js"
import { extraerFarmacias } from "./lib/extract.js"
import { upsertEntradasManuales } from "./lib/upsert-manual.js"
import { hoyArgentinaYYYYMMDD } from "./lib/fecha.js"
import { CIUDADES_MANUALES, esCiudadManualValida } from "./lib/types.js"

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

const AYUDA = `Mandame una foto o un PDF con el cronograma de farmacias de turno.

Poné como <b>descripción/caption</b> el slug de la ciudad (ej. <code>venado-tuerto</code>). Si no ponés nada, asumo <code>venado-tuerto</code>.

Ciudades habilitadas: ${CIUDADES_MANUALES.join(", ")}`

interface TelegramPhotoSize {
  file_id: string
  width: number
  height: number
}

interface TelegramDocument {
  file_id: string
  mime_type?: string
}

interface TelegramMessage {
  chat: { id: number }
  text?: string
  caption?: string
  photo?: TelegramPhotoSize[]
  document?: TelegramDocument
}

interface TelegramUpdate {
  message?: TelegramMessage
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString("utf-8")
}

async function manejarMensaje(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id

  const fileRef = message.photo
    ? message.photo[message.photo.length - 1] // mayor resolución
    : message.document && (message.document.mime_type?.startsWith("image/") || message.document.mime_type === "application/pdf")
      ? message.document
      : null

  if (!fileRef) {
    await enviarMensaje(chatId, AYUDA)
    return
  }

  const caption = message.caption?.trim().toLowerCase() || "venado-tuerto"
  if (!esCiudadManualValida(caption)) {
    await enviarMensaje(
      chatId,
      `No reconozco la ciudad "${caption}". Ciudades habilitadas: ${CIUDADES_MANUALES.join(", ")}.`
    )
    return
  }

  await enviarMensaje(chatId, "📥 Recibido, procesando...")

  const archivo = await descargarArchivo(fileRef.file_id)
  if (!archivo) {
    await enviarMensaje(chatId, "⚠️ No pude descargar el archivo desde Telegram. Probá de nuevo.")
    return
  }

  const resultado = await extraerFarmacias({
    base64: archivo.base64,
    mediaType: archivo.mediaType,
    fechaHoyAR: hoyArgentinaYYYYMMDD(),
  })

  if (resultado.entradas.length === 0) {
    await enviarMensaje(
      chatId,
      `⚠️ No pude leer ninguna farmacia con confianza.\n${resultado.notas ? `Motivo: ${resultado.notas}` : ""}`
    )
    return
  }

  const { filas_guardadas, error } = await upsertEntradasManuales(caption, resultado)

  if (error) {
    await enviarMensaje(chatId, `❌ Se leyeron los datos pero falló la carga a Supabase: ${error}`)
    return
  }

  const fechas = [...new Set(resultado.entradas.map((e) => e.fecha_turno))].sort()
  const detalle = resultado.entradas
    .map((e) => `• ${e.fecha_turno} — <b>${e.nombre_farmacia}</b> (${e.direccion})`)
    .join("\n")

  await enviarMensaje(
    chatId,
    `✅ Cargadas ${filas_guardadas} farmacias en <b>${caption}</b> (${fechas.join(", ")}) — confianza ${resultado.confianza}\n\n${detalle}${
      resultado.notas ? `\n\n📝 ${resultado.notas}` : ""
    }`
  )
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200).end("ok")
    return
  }

  if (req.method !== "POST" || req.url !== "/telegram-webhook") {
    res.writeHead(404).end()
    return
  }

  if (WEBHOOK_SECRET && req.headers["x-telegram-bot-api-secret-token"] !== WEBHOOK_SECRET) {
    res.writeHead(401).end()
    return
  }

  // Responder rápido y procesar: si el chat_id es inválido no hay a quién
  // avisar del error, así que devolvemos 200 recién al terminar de procesar
  // (Telegram tolera varios segundos de latencia en el webhook).
  try {
    const body = await readBody(req)
    const update = JSON.parse(body) as TelegramUpdate

    if (update.message) {
      await manejarMensaje(update.message)
    }

    res.writeHead(200).end("ok")
  } catch (err) {
    console.error("[webhook] Error procesando update:", err)
    res.writeHead(200).end("ok") // 200 igual, para que Telegram no reintente en loop
  }
})

server.listen(PORT, () => {
  console.log(`[server] Escuchando en puerto ${PORT}`)
})
