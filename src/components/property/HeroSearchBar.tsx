"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { POPULAR_DESTINATIONS } from "@/lib/mock-data";
import { displayPlace } from "@/lib/auth-ui";

export function HeroSearchBar() {
  const router = useRouter();

  const [location, setLocation] = React.useState("");
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [guests, setGuests] = React.useState(2);

  const [isLocationOpen, setIsLocationOpen] = React.useState(false);
  const [isGuestOpen, setIsGuestOpen] = React.useState(false);

  const locationRef = React.useRef<HTMLDivElement>(null);
  const guestRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        locationRef.current &&
        !locationRef.current.contains(e.target as Node)
      ) {
        setIsLocationOpen(false);
      }
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setIsGuestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests.toString());

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSearch}
        className="flex flex-col md:flex-row items-center rounded-3xl md:rounded-full border border-border/80 bg-card p-2 md:p-2.5 shadow-xl backdrop-blur-md"
      >
        {/* 1. Destination Input */}
        <div
          ref={locationRef}
          className="relative w-full md:w-1/3 px-4 py-2.5 md:py-2 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <div
            onClick={() => {
              setIsLocationOpen(!isLocationOpen);
              setIsGuestOpen(false);
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
              <MapPin className="size-3.5 text-primary" />
              <span>Destination</span>
            </div>
            <input
              type="text"
              placeholder="Where would you like to go?"
              aria-label="Destination"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-hidden"
            />
          </div>

          {/* Quick Destination Dropdown */}
          {isLocationOpen && (
            <div className="absolute left-0 top-full mt-3 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Popular destinations
              </p>
              <div className="flex flex-col gap-1">
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => {
                      setLocation(dest.name);
                      setIsLocationOpen(false);
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="font-semibold">
                      {displayPlace(dest.name)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dest.propertiesCount} stays
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block h-8 w-px bg-border" />

        {/* 2. Check-in Date */}
        <div className="w-full md:w-1/4 px-4 py-2.5 md:py-2 rounded-full hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Calendar className="size-3.5 text-primary" />
            <span>Check-in</span>
          </div>
          <input
            type="date"
            value={checkIn}
            aria-label="Check-in date"
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-0.5 w-full bg-transparent text-sm font-medium text-foreground outline-hidden cursor-pointer"
          />
        </div>

        <div className="hidden md:block h-8 w-px bg-border" />

        {/* 3. Check-out Date */}
        <div className="w-full md:w-1/4 px-4 py-2.5 md:py-2 rounded-full hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Calendar className="size-3.5 text-primary" />
            <span>Check-out</span>
          </div>
          <input
            type="date"
            value={checkOut}
            aria-label="Check-out date"
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-0.5 w-full bg-transparent text-sm font-medium text-foreground outline-hidden cursor-pointer"
          />
        </div>

        <div className="hidden md:block h-8 w-px bg-border" />

        {/* 4. Guest Count & Search Button */}
        <div
          ref={guestRef}
          className="relative w-full md:w-auto flex-1 flex items-center justify-between pl-4 pr-1.5 py-2 rounded-full hover:bg-muted/70 transition-colors"
        >
          <div
            onClick={() => {
              setIsGuestOpen(!isGuestOpen);
              setIsLocationOpen(false);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
              <Users className="size-3.5 text-primary" />
              <span>Guests</span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {guests} adults
            </p>
          </div>

          {/* Guest Selector Popover */}
          {isGuestOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Adults
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ages 13 and up
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={guests <= 1}
                    aria-label="Remove one guest"
                    onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold">{guests}</span>
                  <button
                    type="button"
                    disabled={guests >= 16}
                    aria-label="Add one guest"
                    onClick={() => setGuests((prev) => Math.min(16, prev + 1))}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <button
            type="submit"
            aria-label="Search stays"
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Search className="size-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}
