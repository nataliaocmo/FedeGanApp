import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
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

// Interfaz para finca
interface Farm {
    id: string;
    name: string;
}

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [birthdateError, setBirthdateError] = useState("");
    const [role, setRole] = useState("farmManager");
    const [roleOptions, setRoleOptions] = useState<string[]>(["En espera..."]);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

    const router = useRouter();
    const { register } = useAuth();

    // Cargar fincas
    useEffect(() => {
        const qFarms = query(collection(db, "farms"));
        const unsubscribeFarms = onSnapshot(qFarms, (snapshot) => {
            const farmsData = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || "Finca desconocida",
            }));
            setFarms(farmsData);
        }, (error) => {
            console.error("Error al cargar fincas:", error.message);
            Alert.alert("Error", "No se pudieron cargar las fincas.");
        });

        return () => unsubscribeFarms();
    }, []);

    // Validar formato de fecha
    const validateDateFormat = (input: string): boolean => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input)) return false;
        const [year, month, day] = input.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            year >= 1900 &&
            year <= new Date().getFullYear()
        );
    };

    // Manejar cambios en fecha
    const handleBirthdateChange = (text: string) => {
        const cleanedText = text.replace(/[^0-9-]/g, "");
        let formattedText = cleanedText;
        if (cleanedText.length > 4 && cleanedText[4] !== "-") {
            formattedText = `${cleanedText.slice(0, 4)}-${cleanedText.slice(4)}`;
        }
        if (cleanedText.length > 7 && cleanedText[7] !== "-") {
            formattedText = `${formattedText.slice(0, 7)}-${formattedText.slice(7)}`;
        }
        if (formattedText.length > 10) formattedText = formattedText.slice(0, 10);
        setBirthdate(formattedText);
        if (formattedText.length === 10) {
            setBirthdateError(validateDateFormat(formattedText) ? "" : "Formato inválido. Usa YYYY-MM-DD (ej. 2025-05-14)");
        } else {
            setBirthdateError("");
        }
    };

    // Obtener opciones de rol según correo
    const getRoleOptions = (email: string): string[] => {
        if (!email) return ["En espera..."];
        const emailLower = email.toLowerCase();
        if (emailLower.endsWith("@fedegan.gob.co")) {
            return ["Vacunador", "Administrador"];
        }
        return ["Trabajador"];
    };

    // Actualizar opciones de rol
    useEffect(() => {
        const options = getRoleOptions(email);
        setRoleOptions(options);
        if (!options.includes(DISPLAY_ROLE_MAP[role] || "")) {
            setRole(ROLE_MAP[options[0]] || "farmManager");
        }
    }, [email, role]);

    const handleRegister = async () => {
        if (!name || !email || !password || !phone || !birthdate || !role) {
            Alert.alert("Error", "Por favor completa todos los campos.");
            return;
        }
        if (birthdate.length !== 10 || !validateDateFormat(birthdate)) {
            Alert.alert("Error", "La fecha de nacimiento debe tener el formato YYYY-MM-DD y ser válida.");
            return;
        }
        if (role === "farmManager" && !selectedFarmId) {
            Alert.alert("Error", "Por favor selecciona una finca.");
            return;
        }

        const userData = {
            name,
            email,
            password,
            phone,
            birthdate,
            role,
            ...(role === "farmManager" && { farmId: selectedFarmId }),
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
                    keyboardType="numeric"
                    maxLength={10}
                />
                {birthdateError ? <Text style={styles.errorText}>{birthdateError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Rol</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                    {roleOptions.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                if (option !== "En espera...") {
                                    setRole(ROLE_MAP[option]);
                                    if (ROLE_MAP[option] !== "farmManager") {
                                        setSelectedFarmId(null);
                                    }
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

            {role === "farmManager" && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Finca</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                        {farms.length > 0 ? (
                            farms.map((farm) => (
                                <TouchableOpacity
                                    key={farm.id}
                                    onPress={() => setSelectedFarmId(farm.id)}
                                    style={[
                                        styles.roleButton,
                                        selectedFarmId === farm.id && styles.roleButtonSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.roleButtonText,
                                            selectedFarmId === farm.id && styles.roleButtonTextSelected,
                                        ]}
                                    >
                                        {farm.name}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.errorText}>No hay fincas disponibles</Text>
                        )}
                    </View>
                </View>
            )}

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
        borderColor: "red",
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