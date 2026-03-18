"use client";
import PictionAILogo from "@/assets";
import { ModeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Loader2, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CurrentUserAvatar } from "../auth/current-user-avatar";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const authActions = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const isActiveNavItem = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/gioca") {
      return pathname === "/gioca" || pathname.startsWith("/game/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    await authActions.signOut();
    router.push("/auth/login");
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Gioca", href: "/gioca" },
    { name: "History", href: "/history" },
  ] as const;

  return (
    <header className="top-0 z-50 sticky bg-background shadow-[0_4px_0_0_var(--color-foreground)] border-foreground border-b-4">
      <div className="flex justify-between items-center h-16 container">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-bold text-black text-gradient dark:text-white text-2xl hover:scale-105 transition-transform !important"
          >
            <PictionAILogo
              height={40}
              className="text-black dark:text-white !important"
            />
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 mt-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-display uppercase tracking-widest font-bold transition-all hover:-translate-y-1 hover:text-primary ${
                  isActiveNavItem(item.href)
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          {/* Mobile nav */}
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Apri menu di navigazione"
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                }
              ></PopoverTrigger>
              <PopoverContent align="start" className="p-0 w-56">
                <nav className="flex flex-col gap-1 py-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-primary/10 hover:text-primary ${
                        isActiveNavItem(item.href)
                          ? "text-primary"
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
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          {isLoading ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon">
                        <CurrentUserAvatar />
                      </Button>
                    }
                  ></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        render={<Link href="/profile">Profilo</Link>}
                      ></DropdownMenuItem>
                      <DropdownMenuItem
                        render={<Link href="/gioca">Gioca</Link>}
                      ></DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 w-4 h-4" />
                      <span>Esci</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  className={`${buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })} border-2`}
                  href="/auth/login"
                >
                  Accedi
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
