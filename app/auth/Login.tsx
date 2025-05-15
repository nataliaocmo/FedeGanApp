// app/auth/Login.tsx
import { useAuth } from "@/context/authContext/AuthContext"; // Asegúrate de que este sea el path correcto
import { auth, db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingresa todos los campos");
            return;
        }

        const success = await login(email, password);
        if (!success) {
            Alert.alert("Error", "Credenciales inválidas");
            return;
        }

        try {
            // Obtener el documento del usuario por UID
            const userDocRef = doc(db, "users", auth.currentUser!.uid);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                Alert.alert("Error", "No se encontró el perfil del usuario");
                return;
            }

            const userData = userSnap.data();
            const role = userData.role;

            if (role === "farmManager") {
                router.push("/farmManagerMenu");
            } else if (role === "vaccinationAgent") {
                router.push("/vaccinationAgentMenu");
            } else if (role === "fedeganManager") {
                router.push("/fedeganManagerMenu");
            } else {
                Alert.alert("Error", "Rol de usuario desconocido");
            }

        } catch (error) {
            console.error("Error obteniendo datos del usuario:", error);
            Alert.alert("Error", "Ocurrió un error al iniciar sesión");
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    <Text style={styles.title}>FEDEGAN</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Correo electrónico</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="usuario@ejemplo.com"
                            placeholderTextColor={COLORS.softBrown}
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="********"
                            placeholderTextColor={COLORS.softBrown}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Iniciar sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/auth/Register")}>
                        <Text style={styles.registerText}>
                            ¿No tienes cuenta? <Text style={styles.link}>Regístrate</Text>
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: COLORS.forestGreen,
        marginBottom: 40,
    },
    inputContainer: {
        width: "85%",
        marginBottom: 16,
    },
    label: {
        marginBottom: 4,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    input: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.lightGreen,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: COLORS.darkGray,
    },
    button: {
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 24,
        width: "85%",
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: "center",
        fontWeight: "600",
    },
    registerText: {
        marginTop: 20,
        color: COLORS.softBrown,
        fontSize: 14,
    },
    link: {
        color: COLORS.forestGreen,
        fontWeight: "600",
    },
});
