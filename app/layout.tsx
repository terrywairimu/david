import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import "bootstrap/dist/css/bootstrap.min.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import Sidebar from "@/components/sidebar"
import MobileHeader from "@/components/mobile-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Business Management System",
  description: "Complete business management solution",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
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
          <div className="app-container">
            {/* Mobile Header */}
            <MobileHeader />
            
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <main className="main-content">
              {children}
            </main>
            
            {/* Mobile Overlay */}
            <div className="mobile-overlay" id="mobileOverlay"></div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
