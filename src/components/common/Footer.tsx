import Link from "next/link";
import { Globe, Heart } from "lucide-react";
import { displayPlace } from "@/lib/auth-ui";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card text-foreground">
      {/* Main Links Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1: Về StayHub */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              About StayHub
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  News & Press
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  New features
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Investors
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Khám phá điểm đến */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/search?location=Đà Nẵng"
                  className="hover:text-foreground transition-colors"
                >
                  Homestays in {displayPlace("Đà Nẵng")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search?location=Hà Nội"
                  className="hover:text-foreground transition-colors"
                >
                  Apartments in {displayPlace("Hà Nội")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search?location=Đà Lạt"
                  className="hover:text-foreground transition-colors"
                >
                  Vacation villas in {displayPlace("Đà Lạt")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search?location=Phú Quốc"
                  className="hover:text-foreground transition-colors"
                >
                  Seaside villas in {displayPlace("Phú Quốc")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search?location=Hồ Chí Minh"
                  className="hover:text-foreground transition-colors"
                >
                  Apartments in {displayPlace("Hồ Chí Minh")} City
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Đón tiếp khách (Hosting) */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Hosting</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/host"
                  className="hover:text-foreground transition-colors"
                >
                  List your place on StayHub
                </Link>
              </li>
              <li>
                <Link
                  href="/host"
                  className="hover:text-foreground transition-colors"
                >
                  StayCover for hosts
                </Link>
              </li>
              <li>
                <Link
                  href="/host"
                  className="hover:text-foreground transition-colors"
                >
                  Hosting resources
                </Link>
              </li>
              <li>
                <Link
                  href="/host"
                  className="hover:text-foreground transition-colors"
                >
                  Community forum
                </Link>
              </li>
              <li>
                <Link
                  href="/host"
                  className="hover:text-foreground transition-colors"
                >
                  Stay safety standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Hỗ trợ & Trợ năng */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Help center
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Accessibility support
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Cancellation options
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Emergency assistance
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Report a neighborhood concern
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Settings */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
            <span>© 2026 StayHub, Inc.</span>
            <span>·</span>
            <Link href="/" className="hover:underline">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/" className="hover:underline">
              Terms
            </Link>
            <span>·</span>
            <Link href="/" className="hover:underline">
              Sitemap
            </Link>
            <span>·</span>
            <Link href="/" className="hover:underline">
              Company information
            </Link>
          </div>

          <div className="flex items-center gap-6 font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Globe className="size-4" />
              <span>English</span>
            </span>
            <span>
              <span>₫ VND</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
              Made with <Heart className="size-3 text-primary fill-primary" />{" "}
              by StayHub Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
