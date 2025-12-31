import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PropTensor AI",
  description: "AI-Powered NBA Prop Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          
          {/* NAVIGATION BAR (Handles Login/Logout UI) */}
          <nav className="flex justify-between items-center p-4 border-b-4 border-black bg-white">
            <div className="font-black text-xl uppercase tracking-tighter">PropTensor AI</div>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-black text-white px-4 py-2 font-bold border-2 border-black hover:bg-zinc-800">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-sm hidden md:inline">Welcome Back</span>
                    <UserButton />
                </div>
              </SignedIn>
            </div>
          </nav>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
