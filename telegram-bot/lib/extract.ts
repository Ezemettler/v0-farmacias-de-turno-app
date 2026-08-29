import Anthropic from "@anthropic-ai/sdk"
import type { ResultadoExtraccion } from "./types.js"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = "claude-sonnet-5"

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "cargar_farmacias_de_turno",
  description:
    "Carga las farmacias de turno extraídas de la imagen o PDF, una entrada por farmacia y por día visible en la fuente.",
  input_schema: {
    type: "object",
    properties: {
      entradas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fecha_turno: {
              type: "string",
              description: "Fecha del turno en formato YYYY-MM-DD",
            },
            nombre_farmacia: { type: "string" },
            direccion: { type: "string" },
            telefono: { type: ["string", "null"] },
            inicio_turno: {
              type: "string",
              description: "Hora local Argentina de inicio, formato HH:MM. Si no está indicada, usar 08:30.",
            },
            fin_turno: {
              type: "string",
              description: "Hora local Argentina de fin, formato HH:MM. Si no está indicada, usar 08:30.",
            },
            fin_turno_dia_siguiente: {
              type: "boolean",
              description: "true si el turno termina al día siguiente (caso típico: 08:30 a 08:30), false si termina el mismo día.",
            },
          },
          required: [
            "fecha_turno",
            "nombre_farmacia",
            "direccion",
            "inicio_turno",
            "fin_turno",
            "fin_turno_dia_siguiente",
          ],
        },
      },
      confianza: {
        type: "string",
        enum: ["alta", "media", "baja"],
        description: "Qué tan segura es la lectura de la imagen/PDF en general.",
      },
      notas: {
        type: ["string", "null"],
        description: "Ambigüedades, campos ilegibles, o cualquier aclaración relevante. null si no hay nada que aclarar.",
      },
    },
    required: ["entradas", "confianza", "notas"],
  },
}

function systemPrompt(fechaHoyAR: string): string {
  return `Sos un extractor de datos para un directorio de farmacias de turno en Argentina.
Se te va a mostrar una imagen o PDF publicado por un colegio/círculo de farmacéuticos con el
cronograma de farmacias de turno.

Hoy es ${fechaHoyAR} (hora Argentina). Si el cronograma muestra días sin año o sin mes explícito
(ej. "Lunes 05"), asumí que corresponden al mes y año actuales salvo que el documento indique
otra cosa explícitamente (ej. un calendario que dice "Septiembre 2026").

Extraé UNA entrada por farmacia y por día visible en la fuente — si es un calendario mensual con
varias farmacias por día, generá una entrada por cada una. Si el horario de turno no está
indicado explícitamente en la imagen, usá el valor por defecto habitual en Argentina: 08:30 a
08:30 del día siguiente.

Llamá a la herramienta "cargar_farmacias_de_turno" con los datos extraídos. Si no podés leer con
confianza ninguna farmacia, devolvé "entradas" vacío y explicá por qué en "notas".`
}

export async function extraerFarmacias(params: {
  base64: string
  mediaType: string
  fechaHoyAR: string
}): Promise<ResultadoExtraccion> {
  const { base64, mediaType, fechaHoyAR } = params

  const contentBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam =
    mediaType === "application/pdf"
      ? {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: base64,
          },
        }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt(fechaHoyAR),
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "cargar_farmacias_de_turno" },
    messages: [
      {
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: "Extraé las farmacias de turno de este documento." },
        ],
      },
    ],
  })

  const toolUse = response.content.find((block) => block.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no devolvió una llamada a la herramienta de extracción")
  }

  return toolUse.input as ResultadoExtraccion
}
