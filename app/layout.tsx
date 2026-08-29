import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Farmacias de turno hoy en Argentina | Web farmacias de turno",
  description:
    "Encontrá farmacias abiertas hoy en tu ciudad. Información clara y actualizada de farmacias de turno en Argentina.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icono-farmacias-de-turno.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icono-farmacias-de-turno-fondo-oscuro.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-32.png",
        sizes: "32x32",
      },
      {
        url: "/favicon-64.png",
        sizes: "64x64",
      },
    ],
    apple: "/apple-touch-icon-180.png",
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-0PYJSPX9BD"
        ></script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0PYJSPX9BD');
            `,
          }}
        />
      </head>

      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
