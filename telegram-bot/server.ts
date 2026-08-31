import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { enviarMensaje, descargarArchivo } from "./lib/telegram-api.js"
import { extraerFarmacias } from "./lib/extract.js"
import { upsertEntradasManuales } from "./lib/upsert-manual.js"
import { hoyArgentinaYYYYMMDD } from "./lib/fecha.js"
import { CIUDADES_MANUALES, resolverCiudadManual, type CiudadManual } from "./lib/types.js"

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

const AYUDA = `Mandame una foto o un PDF con el cronograma de farmacias de turno.

Decime de qué ciudad es — como <b>descripción/caption</b> de la foto, o en un mensaje aparte (antes o después de mandarla, como te resulte más cómodo). No hace falta el slug exacto: "San Nicolás" también funciona.

Ciudades habilitadas: ${CIUDADES_MANUALES.join(", ")}`

interface ArchivoDescargado {
  base64: string
  mediaType: string
}

interface PendingEntry<T> {
  valor: T
  timestamp: number
}

// Cuánto tiempo queda "recordada" una foto sin ciudad o una ciudad sin foto,
// esperando el mensaje que la complete. Estado en memoria: alcanza para uso
// personal de bajo volumen, no hace falta persistirlo.
const TTL_MS = 15 * 60 * 1000

const archivosPendientes = new Map<number, PendingEntry<ArchivoDescargado>>()
const ciudadesPendientes = new Map<number, PendingEntry<CiudadManual>>()

function vigente<T>(entry: PendingEntry<T> | undefined): entry is PendingEntry<T> {
  return entry !== undefined && Date.now() - entry.timestamp < TTL_MS
}

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

async function procesarArchivo(chatId: number, ciudad: CiudadManual, archivo: ArchivoDescargado): Promise<void> {
  await enviarMensaje(chatId, "📥 Recibido, procesando...")

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

  const { filas_guardadas, error } = await upsertEntradasManuales(ciudad, resultado)

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
    `✅ Cargadas ${filas_guardadas} farmacias en <b>${ciudad}</b> (${fechas.join(", ")}) — confianza ${resultado.confianza}\n\n${detalle}${
      resultado.notas ? `\n\n📝 ${resultado.notas}` : ""
    }`
  )
}

async function manejarMensaje(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id

  const fileRef = message.photo
    ? message.photo[message.photo.length - 1] // mayor resolución
    : message.document && (message.document.mime_type?.startsWith("image/") || message.document.mime_type === "application/pdf")
      ? message.document
      : null

  if (fileRef) {
    const captionTexto = message.caption?.trim()
    const ciudadDelCaption = captionTexto ? resolverCiudadManual(captionTexto) : null

    if (captionTexto && !ciudadDelCaption) {
      await enviarMensaje(
        chatId,
        `No reconozco la ciudad "${captionTexto}". Ciudades habilitadas: ${CIUDADES_MANUALES.join(", ")}.`
      )
      return
    }

    const archivo = await descargarArchivo(fileRef.file_id)
    if (!archivo) {
      await enviarMensaje(chatId, "⚠️ No pude descargar el archivo desde Telegram. Probá de nuevo.")
      return
    }

    const ciudadPendiente = ciudadesPendientes.get(chatId)
    const ciudad = ciudadDelCaption ?? (vigente(ciudadPendiente) ? ciudadPendiente.valor : null)

    if (!ciudad) {
      // No sabemos la ciudad todavía — guardamos el archivo ya descargado
      // (el file_id de Telegram puede volverse inválido con el tiempo) y
      // preguntamos, en vez de asumir una ciudad por default.
      archivosPendientes.set(chatId, { valor: archivo, timestamp: Date.now() })
      await enviarMensaje(
        chatId,
        `¿De qué ciudad es esta foto/PDF? Respondé con el nombre. Ciudades habilitadas: ${CIUDADES_MANUALES.join(", ")}.`
      )
      return
    }

    ciudadesPendientes.delete(chatId)
    archivosPendientes.delete(chatId)
    await procesarArchivo(chatId, ciudad, archivo)
    return
  }

  // Sin archivo: puede ser el nombre de una ciudad, ya sea contestando la
  // pregunta de arriba o adelantándose antes de mandar la foto/PDF.
  const texto = message.text?.trim()
  const ciudadDelTexto = texto ? resolverCiudadManual(texto) : null

  if (ciudadDelTexto) {
    const archivoPendiente = archivosPendientes.get(chatId)
    if (vigente(archivoPendiente)) {
      archivosPendientes.delete(chatId)
      ciudadesPendientes.delete(chatId)
      await procesarArchivo(chatId, ciudadDelTexto, archivoPendiente.valor)
      return
    }

    ciudadesPendientes.set(chatId, { valor: ciudadDelTexto, timestamp: Date.now() })
    await enviarMensaje(chatId, `Ok, la próxima foto o PDF que mandes la cargo en <b>${ciudadDelTexto}</b>.`)
    return
  }

  await enviarMensaje(chatId, AYUDA)
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
