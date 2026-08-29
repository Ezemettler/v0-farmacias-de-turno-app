const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) {
  throw new Error("Falta la variable de entorno TELEGRAM_BOT_TOKEN")
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`
const FILE_BASE = `https://api.telegram.org/file/bot${BOT_TOKEN}`

export async function enviarMensaje(chatId: number, texto: string): Promise<void> {
  await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML" }),
  })
}

export async function descargarArchivo(
  fileId: string
): Promise<{ base64: string; mediaType: string } | null> {
  const resFile = await fetch(`${API_BASE}/getFile?file_id=${fileId}`)
  const dataFile = (await resFile.json()) as {
    ok: boolean
    result?: { file_path: string }
  }

  if (!dataFile.ok || !dataFile.result?.file_path) return null

  const filePath = dataFile.result.file_path
  const resContent = await fetch(`${FILE_BASE}/${filePath}`)
  if (!resContent.ok) return null

  const buffer = Buffer.from(await resContent.arrayBuffer())
  const base64 = buffer.toString("base64")
  const mediaType = filePath.endsWith(".pdf")
    ? "application/pdf"
    : filePath.endsWith(".png")
      ? "image/png"
      : filePath.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg"

  return { base64, mediaType }
}
