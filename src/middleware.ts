import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isLoggedIn = !!req.auth;

  // Protect /host: Must be logged in to access host dashboard / post listings
  if (pathname.startsWith("/host") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Protect /admin: Must be logged in and have ADMIN role
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return Response.redirect(new URL("/", req.url));
  }

  // Protect /bookings and /properties/.../book: Must be logged in
  if (
    (pathname.startsWith("/bookings") ||
      pathname.endsWith("/book") ||
      pathname.includes("/book/")) &&
    !isLoggedIn
  ) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/host",
    "/host/:path*",
    "/admin",
    "/admin/:path*",
    "/bookings",
    "/bookings/:path*",
    "/properties/:path*/book",
    "/properties/:path*/book/:path*",
  ],
};
