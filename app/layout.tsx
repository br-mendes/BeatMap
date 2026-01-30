import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Header from './components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BeatMap - Mapeando o som do seu mundo',
  description: 'Descubra lançamentos diários, filtre por seus gêneros favoritos e exporte playlists diretamente para sua conta Spotify.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Header />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
