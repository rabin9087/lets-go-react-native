import { RootState } from "@/app/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function Protect({ children, fallback = null }: Props) {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.userInfo.user);

    useEffect(() => {
        // 🚨 redirect if user not logged in
        if (!user?._id) {
            router.replace("/pages/user/UserSignin"); // 👈 adjust path if needed
        }
    }, [user?._id]);

    // Prevent flicker while redirecting
    if (!user?._id) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}



