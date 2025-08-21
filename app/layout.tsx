import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import "bootstrap/dist/css/bootstrap.min.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import Sidebar from "@/components/sidebar"
import { ProgressProvider } from "@/components/GlobalProgressManager"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Business Management System",
  description: "Complete business management solution",
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ProgressProvider>
            <div className="app-container">
              <Sidebar />
              <div className="content">
                {children}
              </div>
            </div>
          </ProgressProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
