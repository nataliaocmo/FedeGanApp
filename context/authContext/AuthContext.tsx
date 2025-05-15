import { auth, db } from "@/utils/FirebaseConfig";
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface CustomUser {
    uid: string;
    email: string | null;
    role: "vaccinationAgent" | "fedeganManager" | "farmManager" | null;
    farmId?: string; // Added to support farmManager
}

interface AuthContextInterface {
    user: CustomUser | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: {
        name: string;
        email: string;
        password: string;
        phone: string;
        birthdate: string;
        role: "vaccinationAgent" | "fedeganManager" | "farmManager";
        farmId?: string;
    }) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
    updateRole: (role: "vaccinationAgent" | "fedeganManager" | "farmManager") => Promise<void>;
}

const AuthContext = createContext<AuthContextInterface | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: userData.role as "vaccinationAgent" | "fedeganManager" | "farmManager" | null,
                        farmId: userData.farmId, // Include farmId
                    });
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: userData.role as "vaccinationAgent" | "fedeganManager" | "farmManager" | null,
                farmId: userData.farmId, // Include farmId
            });
            return true;
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            return false;
        }
    };

    const register = async (userData: {
        name: string;
        email: string;
        password: string;
        phone: string;
        birthdate: string;
        role: "vaccinationAgent" | "fedeganManager" | "farmManager";
        farmId?: string;
    }) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const newUser = userCredential.user;

            const userDocData = {
                uid: newUser.uid,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                phone: userData.phone,
                birthdate: userData.birthdate,
                createdAt: new Date(),
                ...(userData.farmId && { farmId: userData.farmId }), // Include farmId if present
            };

            await setDoc(doc(db, "users", newUser.uid), userDocData);

            console.log(`Usuario registrado con ID: ${newUser.uid}, Datos:`, userDocData); // Log for debugging

            setUser({
                uid: newUser.uid,
                email: newUser.email,
                role: userData.role,
                farmId: userData.farmId, // Include farmId
            });
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
        console.log("Actualizando usuario:", userData);
    };

    const updateRole = async (role: "vaccinationAgent" | "fedeganManager" | "farmManager") => {
        if (user) {
            try {
                await setDoc(doc(db, "users", user.uid), { role }, { merge: true });
                setUser({ ...user, role });
            } catch (error) {
                console.error("Error al actualizar rol:", error);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                updateUser,
                updateRole,
            }}
        >
            {!loading && children}
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