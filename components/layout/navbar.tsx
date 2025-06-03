"use client";

import PictionAILogo from "@/assets";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/supabase/supabase-provider";
import { Loader2, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CurrentUserAvatar } from "../auth/current-user-avatar";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, supabase, user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Gioca", href: "/gioca" },
    { name: "Classifica", href: "/leaderboard" },
  ];

  return (
    <header className="border-b">
      <div className="flex justify-between items-center h-16 container">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-bold text-black text-gradient dark:text-white text-2xl !important"
          >
            <PictionAILogo
              height={40}
              className="text-black dark:text-white !important"
            />
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          {/* Mobile nav */}
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Apri menu di navigazione"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0 w-56">
                <nav className="flex flex-col gap-1 py-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href as any}
                      className={`block px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-primary/10 hover:text-primary ${
                        pathname === item.href
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </PopoverContent>
            </Popover>
          </div>
          {/* MobileNav component removed (inlined above) */}
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          {loading ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <CurrentUserAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profilo</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gioca">Gioca</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 w-4 h-4" />
                      <span>Esci</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link href="/auth/login">Accedi</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
