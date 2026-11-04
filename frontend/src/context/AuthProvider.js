import { createContext, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) return {};

        const role = sessionStorage.getItem("authRole");
        return {
            user: sessionStorage.getItem("authUser") || "",
            accessToken,
            roles: [role === "Recruiter" ? "Recruiter" : 2001],
        };
    });

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;