// FILE: src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PageTitleProvider } from "@/context/PageTitleContext"; // Import PageTitleProvider
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner";
import { StoreProvider } from "@/components/StoreProvider";

const inter = Inter({ subsets: ["latin"] });

// Define your local fonts
const angelos = localFont({
  src: "../../public/fonts/angelos.ttf",
  variable: "--font-angelos",
});

const rushdriver = localFont({
  src: "../../public/fonts/rushdriver.otf",
  variable: "--font-rushdriver",
});

const schwagersans = localFont({
  src: "../../public/fonts/schwagersans.otf",
  variable: "--font-schwagersans",
});

const sofiapro = localFont({
  src: "../../public/fonts/sofiapro.otf",
  variable: "--font-sofiapro",
});

const wilker = localFont({
  src: "../../public/fonts/wilker.otf",
  variable: "--font-wilker",
});

export const metadata: Metadata = {
  title: "LMS",
  description: "Lead Management System",
};

import { LayoutWrapper } from "./LayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${angelos.variable} ${rushdriver.variable} ${schwagersans.variable} ${sofiapro.variable} ${wilker.variable}`}>
        <StoreProvider>
          <AuthProvider>
            <PageTitleProvider> {/* Wrap with PageTitleProvider */}
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <LayoutWrapper>{children}</LayoutWrapper>
                <Toaster />
              </ThemeProvider>
            </PageTitleProvider>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}