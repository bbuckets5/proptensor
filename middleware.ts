import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Define which routes need protection
const isProtectedRoute = createRouteMatcher([
  '/', // Protects the home page
  '/analysis(.*)', // Protects the analysis pages
]);

export default clerkMiddleware(async (auth, req) => {
  // 2. If they are not logged in and try to go here, kick them to Sign In
  if (isProtectedRoute(req)) {
    // FIX: Do not call auth(). Just use auth.protect() directly.
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
