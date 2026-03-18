"use client";
import { buttonVariants } from "@/components/ui/button";
import { useConvexAuth } from "convex/react";
import Link from "next/link";

export function LoginButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <>
      {!isAuthenticated && (
        <Link
          className={`${buttonVariants({
            variant: "secondary",
            size: "lg",
          })} w-full sm:w-auto h-16`}
          href="/auth/login"
        >
          Accedi
        </Link>
      )}
    </>
  );
}
