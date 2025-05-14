import { auth, db } from "@/utils/FirebaseConfig";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextInterface {
    user: User | null; // Añadimos user al contexto
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: any) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
    updateRole: (role: "vaccinationAgent" | "fedeganManager" | "farmManager") => Promise<void>;
}

const AuthContext = createContext<AuthContextInterface | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Para manejar la carga inicial

    // Escuchar cambios en el estado de autenticación
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
                createdAt: new Date(),
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

    const updateUser = async (userData: any) => {
        // Implementar si necesitas actualizar datos del usuario
        console.log("Actualizando usuario:", userData);
    };

    const updateRole = async (role: "vaccinationAgent" | "fedeganManager" | "farmManager") => {
        // Implementar si necesitas actualizar el rol
        console.log("Actualizando rol:", role);
    };

    return (
        <AuthContext.Provider
            value={{
                user, // Exponemos user en el contexto
                login,
                register,
                logout,
                updateUser,
                updateRole,
            }}
        >
            {!loading && children} {/* Renderizamos hijos solo cuando no está cargando */}
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