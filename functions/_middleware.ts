
export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);

  // Only intercept the root path. You do not want to redirect static assets 
  // like CSS/JS or users already navigating a specific language path (/en/about)
  if (url.pathname === "/") {
    
    // 1. Check the Accept-Language header (Browser Preference)
    const acceptLanguage = request.headers.get("accept-language") || "";
    const prefersEnglish = acceptLanguage.toLowerCase().includes("en");

    // 2. Check the User's Location (Cloudflare injects geo-data automatically)
    const country = (request.cf?.country as string) || "";
    const isEnglishLocation = ["GB", "US", "AU", "HK", "SG"].includes(country);

    // Prioritize the header, fallback to location
    if (prefersEnglish || isEnglishLocation) {
      // Redirect to the English sub-path
      return Response.redirect(`${url.origin}/en`, 302); // 302 is temporary redirect
    }

    // If the user prefers French (or is in France/Europe), do nothing 
    // assuming your default French site is served directly at "/"
    // 
    // Note: If your French site is strictly under "/fr", uncomment the line below:
    // return Response.redirect(`${url.origin}/fr`, 302);
  }

  // For all other requests, proceed to serve the static asset normally
  return next();
};