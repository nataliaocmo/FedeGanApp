// app/auth/Register.tsx
import { useAuth } from "@/context/authContext/AuthContext";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function Register() {
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [role, setRole] = useState("farmManager");

    const router = useRouter();
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password || !phone || !birthdate || !role) {
            Alert.alert("Error", "Por favor completa todos los campos.");
            return;
        }
        
        const userData = {
            name,
            email,
            password,
            phone,
            birthdate,
            role,
        };
        
        const success = await register(userData);
        if (success) {
        Alert.alert("Registro exitoso", "Tu cuenta ha sido creada.");
        if (role === "vaccinationAgent") {
            router.push("/vaccinationAgentMenu");
        } else if (role === "farmManager") {
            router.push("/farmManagerMenu");
        }
        console.log("Registro exitoso")
        } else {
        Alert.alert("Error", "No se pudo registrar al usuario.");
        console.error("Registro erróneo")
        }
    };

    return (
        
            <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Registro de Usuario</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                style={styles.input}
                placeholder="Juan Pérez"
                value={name}
                onChangeText={setName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                style={styles.input}
                placeholder="usuario@ejemplo.com"
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
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                style={styles.input}
                placeholder="3123456789"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Fecha de nacimiento</Text>
                <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={birthdate}
                onChangeText={setBirthdate}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Rol</Text>
                <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={role}
                    onValueChange={(itemValue: React.SetStateAction<string>) => setRole(itemValue)}
                >
                    <Picker.Item label="Trabajador" value="farmManager" />
                    <Picker.Item label="Vacunador" value="vaccinationAgent" />
                </Picker>
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
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.lightGreen,
    borderRadius: 8,
    backgroundColor: COLORS.white,
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
