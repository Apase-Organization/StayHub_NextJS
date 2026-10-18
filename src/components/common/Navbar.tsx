"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Globe,
  Menu,
  User,
  Home,
  LogOut,
  Calendar,
  Shield,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setIsMobileNavOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const userRole = session?.user?.role;
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify-email");
  const isDashboardPage =
    pathname.startsWith("/admin") || pathname.startsWith("/host");

  const handleSearchClick = () => {
    router.push("/search");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. Left: Brand Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary transition-opacity hover:opacity-90"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Home className="size-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">
              StayHub
            </span>
          </Link>

          {isDashboardPage && (
            <Badge
              variant="outline"
              className="ml-2 hidden sm:inline-flex text-xs font-semibold"
            >
              {pathname.startsWith("/admin")
                ? "Admin Portal"
                : "Host Dashboard"}
            </Badge>
          )}
        </div>

        {/* 2. Center: Search Pill (Hidden on Auth Pages) */}
        {!isAuthPage && !isDashboardPage && (
          <div className="hidden xl:flex items-center">
            <button
              onClick={handleSearchClick}
              type="button"
              className="group flex items-center rounded-full border border-border bg-card py-2 pl-5 pr-2 text-sm font-medium shadow-sm transition-all hover:border-muted-foreground/30 hover:shadow-md"
            >
              <span className="font-semibold text-foreground">Anywhere</span>
              <span className="mx-3 h-4 w-px bg-border" />
              <span className="font-semibold text-foreground">Any week</span>
              <span className="mx-3 h-4 w-px bg-border" />
              <span className="text-muted-foreground">Add guests</span>
              <div className="ml-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <Search className="size-4 stroke-[2.5]" />
              </div>
            </button>
          </div>
        )}

        {/* 3. Right: Navigation, Host Link, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthPage && (userRole === "HOST" || userRole === "ADMIN") && (
            <Link
              href="/host"
              className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted lg:inline-block"
            >
              Host Dashboard
            </Link>
          )}

          {!isAuthPage && (
            <span
              aria-label="English, VND"
              title="English · VND"
              className="hidden rounded-full p-2 text-foreground md:inline-flex"
            >
              <Globe className="size-5" />
            </span>
          )}

          {/* User Menu Dropdown Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              type="button"
              className={cn(
                "flex items-center gap-2.5 rounded-full border border-border bg-card p-1.5 pl-3 transition-all hover:shadow-md",
                isMenuOpen && "shadow-md"
              )}
              aria-expanded={isMenuOpen}
              aria-label="Account menu"
            >
              <Menu className="size-4 text-foreground" />
              <div className="relative flex size-7 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="size-4" />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-card border border-border bg-card py-2 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
                {status === "authenticated" && session?.user ? (
                  <>
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        {session.user.name || "StayHub member"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                      {userRole && (
                        <div className="mt-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {userRole}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted font-medium"
                      >
                        <User className="size-4 text-muted-foreground" />
                        Hồ sơ cá nhân
                      </Link>

                      <Link
                        href="/bookings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Calendar className="size-4 text-muted-foreground" />
                        My Trips
                      </Link>

                      {(userRole === "HOST" || userRole === "ADMIN") && (
                        <Link
                          href="/host"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <Building2 className="size-4 text-muted-foreground" />
                          Host Dashboard
                        </Link>
                      )}

                      {userRole === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <Shield className="size-4 text-muted-foreground" />
                          Admin Portal
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        type="button"
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="size-4" />
                        Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="py-1">
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                      >
                        Register
                      </Link>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        Log in
                      </Link>
                    </div>
                    <div className="border-t border-border py-1">
                      <Link
                        href="/search"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        Explore stays
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted md:hidden"
            aria-label="Open mobile menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar (Below Header on Mobile) */}
      {!isAuthPage && !isDashboardPage && (
        <div className="border-t border-border px-4 py-2.5 xl:hidden">
          <button
            onClick={handleSearchClick}
            type="button"
            className="flex w-full items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-left shadow-sm"
          >
            <Search className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                Where would you like to go?
              </span>
              <span className="text-[11px] text-muted-foreground">
                Anywhere · Any week · Add guests
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 h-dvh w-full max-w-xs overflow-y-auto border-l border-border bg-card p-6 shadow-xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <Link
                href="/"
                className="flex items-center gap-2 text-primary font-bold text-lg"
              >
                <Home className="size-5" />
                <span>StayHub</span>
              </Link>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                type="button"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/search"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Search className="size-4 text-primary" />
                Search stays
              </Link>

              {status === "authenticated" ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <User className="size-4 text-primary" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Calendar className="size-4 text-primary" />
                    My Trips
                  </Link>
                  {(userRole === "HOST" || userRole === "ADMIN") && (
                    <Link
                      href="/host"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Building2 className="size-4 text-primary" />
                      Host Dashboard
                    </Link>
                  )}
                  {userRole === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Shield className="size-4 text-primary" />
                      Admin Portal
                    </Link>
                  )}
                  <div className="pt-4 border-t border-border mt-2">
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="size-4 mr-2" />
                      Log out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-border mt-2 flex flex-col gap-2">
                  <Button asChild variant="default" className="w-full">
                    <Link href="/register">Register</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Log in</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
