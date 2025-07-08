"use client";

import { type ReactNode } from "react";
import { RootProvider } from "./root-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
    return <RootProvider>{children}</RootProvider>;
}
