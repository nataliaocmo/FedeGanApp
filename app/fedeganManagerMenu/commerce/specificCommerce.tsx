import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { Href, useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const COLORS = {
    forestGreen: "#2E7D32",
    lightGreen: "#A5D6A7",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

interface Farm {
    id: string;
    name: string;
}

export default function SpecificCommerce() {
    const { user } = useAuth();
    const router = useRouter();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            console.error("Usuario no autenticado");
            Alert.alert("Error", "Debes iniciar sesión para ver esta página.", [
                { text: "OK", onPress: () => router.replace("/auth/Login") },
            ]);
            return;
        }

        if (user.role !== "fedeganManager") {
            console.error("Acceso denegado: Rol no permitido", { role: user.role });
            Alert.alert("Error", "No tienes permiso para ver esta página.", [
                { text: "OK", onPress: () => router.push("/fedeganManagerMenu") },
            ]);
            return;
        }

        const farmsQuery = collection(db, "farms");
        const unsubscribe = onSnapshot(farmsQuery, (snapshot) => {
            const farmList = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || "Finca sin nombre",
            }));
            setFarms(farmList);
            setLoading(false);
            console.log("Fincas cargadas:", farmList);
        }, (error) => {
            console.error("Error al cargar fincas:", error.message, { code: error.code });
            Alert.alert("Error", `No se pudieron cargar las fincas: ${error.message}`);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, router]);

    const renderFarm = ({ item }: { item: Farm }) => {
        const farmRoute: Href = `/fedeganManagerMenu/commerce/farms/detailsFarm?fincaId=${item.id}`;
        console.log("Redirigiendo a:", farmRoute);
        return (
            <TouchableOpacity
                style={styles.farmItem}
                onPress={() => router.push(farmRoute)}
                activeOpacity={0.7}
            >
                <Icon name="home" size={20} color={COLORS.forestGreen} style={styles.farmIcon} />
                <Text style={styles.farmText}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Icon name="loading" size={40} color={COLORS.forestGreen} style={styles.loadingIcon} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Icon name="home" size={24} color={COLORS.white} />
                <Text style={styles.title}>Fincas</Text>
            </View>
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Lista de Fincas</Text>
                <FlatList
                    data={farms}
                    renderItem={renderFarm}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="file-document-outline" size={40} color={COLORS.softBrown} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No hay fincas registradas.</Text>
                        </View>
                    }
                />
                
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        position: "relative",
        backgroundColor: COLORS.forestGreen,
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 8,
    },
    backButton: {
        position: "absolute",
        left: 0,
        padding: 8,
        marginLeft: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.white,
        letterSpacing: 0.5,
        textAlign: "center",
        marginLeft: 8,
    },
    formContainer: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flex: 1,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 12,
        textAlign: "center",
    },
    farmItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGreen,
        marginBottom: 8,
    },
    farmIcon: {
        marginRight: 8,
    },
    farmText: {
        fontSize: 16,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.cream,
    },
    loadingIcon: {
        marginBottom: 8,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 16,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
    },
    backText: {
        marginTop: 20,
        color: COLORS.softBrown,
        fontSize: 14,
        textDecorationLine: "underline",
        textAlign: "center",
    },
});