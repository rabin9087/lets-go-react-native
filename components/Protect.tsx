import { RootState } from "@/app/store";
import React from "react";
import { useSelector } from "react-redux";

interface Props {
    children: React.ReactNode;
    fallback: React.ReactNode;
}

export default function Protect({ children, fallback }: Props) {
    const {user} = useSelector((state: RootState) => state.userInfo);

    return user?._id ? <>{children}</> : <>{fallback}</>;
}
