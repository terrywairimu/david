import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import "bootstrap/dist/css/bootstrap.min.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import AppShell from "@/components/AppShell"
import { AuthProvider } from "@/lib/auth-context"
import { ProgressProvider } from "@/components/GlobalProgressManager"
import PaymentMonitor from "@/components/PaymentMonitor"
import InstallPrompt from "@/components/install-prompt"
import NetworkStatus from "@/components/network-status"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Business Management System",
  description: "Complete business management for inventory, sales, purchases, payments, and reports",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "David System",
  },
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="David System" />
        <meta name="theme-color" content="#FF9500" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" async></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
          <ProgressProvider>
            <PaymentMonitor />
            <AppShell>{children}</AppShell>
          </ProgressProvider>
        </AuthProvider>
          <Toaster />
          <InstallPrompt />
          <NetworkStatus />
        </ThemeProvider>
      </body>
    </html>
  )
}
