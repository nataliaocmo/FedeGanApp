// app/auth/Register.tsx
import { useAuth } from "@/context/authContext/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

// Mapa de nombres de roles (para UI) a valores internos (para lógica y DB)
const ROLE_MAP: { [key: string]: string } = {
    Administrador: "fedeganManager",
    Vacunador: "vaccinationAgent",
    Trabajador: "farmManager",
};

// Mapa inverso para mostrar el nombre legible en la UI
const DISPLAY_ROLE_MAP: { [key: string]: string } = {
    fedeganManager: "Administrador",
    vaccinationAgent: "Vacunador",
    farmManager: "Trabajador",
};

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [birthdateError, setBirthdateError] = useState("");
    const [role, setRole] = useState("farmManager"); // Valor interno por defecto
    const [roleOptions, setRoleOptions] = useState<string[]>(["En espera..."]); // Opciones para la UI

    const router = useRouter();
    const { register } = useAuth();

    // Función para validar el formato de la fecha (YYYY-MM-DD)
    const validateDateFormat = (input: string): boolean => {
        // Expresión regular para YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input)) {
            return false;
        }

        // Validar que sea una fecha válida
        const [year, month, day] = input.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            year >= 1900 && // Límite inferior razonable
            year <= new Date().getFullYear() // No fechas futuras
        );
    };

    // Función para manejar cambios en el campo de fecha
    const handleBirthdateChange = (text: string) => {
        // Permitir solo números y guiones en posiciones válidas
        const cleanedText = text.replace(/[^0-9-]/g, ""); // Solo números y guiones
        let formattedText = cleanedText;

        // Aplicar formato automático
        if (cleanedText.length > 4 && cleanedText[4] !== "-") {
            formattedText = `${cleanedText.slice(0, 4)}-${cleanedText.slice(4)}`;
        }
        if (cleanedText.length > 7 && cleanedText[7] !== "-") {
            formattedText = `${formattedText.slice(0, 7)}-${formattedText.slice(7)}`;
        }

        // Limitar longitud a 10 caracteres (YYYY-MM-DD)
        if (formattedText.length > 10) {
            formattedText = formattedText.slice(0, 10);
        }

        setBirthdate(formattedText);

        // Validar el formato
        if (formattedText.length === 10) {
            if (validateDateFormat(formattedText)) {
                setBirthdateError("");
            } else {
                setBirthdateError("Formato inválido. Usa YYYY-MM-DD (ej. 2025-05-14)");
            }
        } else {
            setBirthdateError("");
        }
    };

    // Función que devuelve los roles disponibles según el correo
    const getRoleOptions = (email: string): string[] => {
        if (!email) return ["En espera..."];
        const emailLower = email.toLowerCase();

        if (emailLower.endsWith("@fedegan.gob.co")) {
            return ["Vacunador", "Administrador"]; // Nombres legibles para la UI
        }

        return ["Trabajador"];
    };

    // Actualiza las opciones de rol cada vez que cambia el correo
    useEffect(() => {
        const options = getRoleOptions(email);
        setRoleOptions(options);
        if (!options.includes(DISPLAY_ROLE_MAP[role] || "")) {
            // Selecciona el valor interno correspondiente a la primera opción
            setRole(ROLE_MAP[options[0]] || "farmManager");
        }
    }, [email]);

    const handleRegister = async () => {
        if (!name || !email || !password || !phone || !birthdate || !role) {
            Alert.alert("Error", "Por favor completa todos los campos.");
            return;
        }

        // Validar que la fecha sea correcta antes de registrar
        if (birthdate.length !== 10 || !validateDateFormat(birthdate)) {
            Alert.alert("Error", "La fecha de nacimiento debe tener el formato YYYY-MM-DD y ser válida.");
            return;
        }

        const userData = {
            name,
            email,
            password,
            phone,
            birthdate,
            role, // Aquí se envía el valor interno (fedeganManager, vaccinationAgent, farmManager)
        };

        const success = await register(userData);
        if (success) {
            Alert.alert("Registro exitoso", "Tu cuenta ha sido creada.");
            if (role === "vaccinationAgent") {
                router.push("/vaccinationAgentMenu");
            } else if (role === "farmManager") {
                router.push("/farmManagerMenu");
            } else if (role === "fedeganManager") {
                router.push("/fedeganManagerMenu");
            }
            console.log("Registro exitoso");
        } else {
            Alert.alert("Error", "No se pudo registrar al usuario.");
            console.error("Registro erróneo");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Registro de Usuario</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Heriberto Pérez Rosales"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#aaa"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. ejemplo@correo.com"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#aaa"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu contraseña"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#aaa"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. +57 3021123456"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor="#aaa"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Fecha de nacimiento</Text>
                <TextInput
                    style={[styles.input, birthdateError ? styles.inputError : null]}
                    placeholder="YYYY-MM-DD"
                    value={birthdate}
                    onChangeText={handleBirthdateChange}
                    placeholderTextColor="#aaa"
                    keyboardType="numeric" // Solo números para facilitar la entrada
                    maxLength={10} // Limitar a 10 caracteres (YYYY-MM-DD)
                />
                {birthdateError ? <Text style={styles.errorText}>{birthdateError}</Text> : null}
            </View>

            {/* Botones dinámicos para seleccionar el rol */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Rol</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                    {roleOptions.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                if (option !== "En espera...") {
                                    setRole(ROLE_MAP[option]); // Guarda el valor interno
                                }
                            }}
                            disabled={option === "En espera..."}
                            style={[
                                styles.roleButton,
                                role === ROLE_MAP[option] && styles.roleButtonSelected,
                                option === "En espera..." && styles.roleButtonDisabled,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.roleButtonText,
                                    role === ROLE_MAP[option] && styles.roleButtonTextSelected,
                                    option === "En espera..." && styles.roleButtonTextDisabled,
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/auth/Login")}>
                <Text style={styles.registerText}>
                    ¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text>
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
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
        fontSize: 30,
        fontWeight: "bold",
        color: COLORS.forestGreen,
        marginBottom: 30,
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
    inputError: {
        borderColor: "red", // Resaltar el campo si hay error
    },
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 4,
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
    roleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.forestGreen,
        backgroundColor: COLORS.white,
        marginRight: 1,
        marginBottom: 8,
    },
    roleButtonSelected: {
        backgroundColor: COLORS.forestGreen,
    },
    roleButtonDisabled: {
        backgroundColor: "#ccc",
        borderColor: "#ccc",
    },
    roleButtonText: {
        color: COLORS.forestGreen,
    },
    roleButtonTextSelected: {
        color: COLORS.white,
        fontWeight: "bold",
        textAlign: "center",
    },
    roleButtonTextDisabled: {
        color: "#666",
        textAlign: "center",
    },
});