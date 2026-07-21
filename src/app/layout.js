import { AppContextProvider } from "@/context/AppContext";
import ClientLayout from "@/components/ClientLayout";
import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "lowpriceplaces - Classifieds Deals & Connections",
  description: "Discover local advertisements and connections for budget deals at lowpriceplaces.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AppContextProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppContextProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
