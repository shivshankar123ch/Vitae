import { createContext, useState } from "react";

const ReAuthContext = createContext({});

export const AuthContext = ({ children }) => {

    const [auth_1, setAuth_1] = useState({});

    return (
        <ReAuthContext.Provider value={{ auth_1, setAuth_1 }}>
            {children}
        </ReAuthContext.Provider>
    );
};

export default ReAuthContext;