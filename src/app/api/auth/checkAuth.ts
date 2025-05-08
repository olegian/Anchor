"use server"

import { auth } from "@/app/auth"

export const checkAuth = async () => {
    const session = await auth();
    return !!session;
}