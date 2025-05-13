import { auth, db } from "@/utils/FirebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useState } from "react";

interface AuthContextInterface {
    login: (email: string, password: string) => Promise<boolean>;
    register: (user: any) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (user: any) => Promise<void>;
    updateRole: (role: "vaccinationAgent" | "fedeganManager" | "farmManager") => Promise<void>;
}

const AuthContext = createContext<AuthContextInterface | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [setUser] = useState<any>(null);

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            return true;
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            return false;
        }
    };

    const register = async (userData: any) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const newUser = userCredential.user;
    
            // Guardar datos adicionales en Firestore
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                phone: userData.phone,
                birthdate: userData.birthdate,
                createdAt: new Date()
            });
    
            setUser(newUser);
            return true;
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
    
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ login, register, logout, updateUser: async () => {}, updateRole: async () => {} }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
