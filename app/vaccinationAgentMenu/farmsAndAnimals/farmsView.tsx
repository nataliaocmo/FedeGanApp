import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Colores definidos
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
    address: string;
    owner: string;
    createdAt: any; // Timestamp de Firebase
    createdBy: string;
}

export default function FarmsView() {
    const [farms, setFarms] = useState<Farm[]>([]);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "farms"), (snapshot) => {
            const farmsData: Farm[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Farm[];
            setFarms(farmsData);
        }, (error) => {
            console.error("Error al obtener fincas:", error);
            Alert.alert("Error", "No se pudieron cargar las fincas.");
        });

        return () => unsubscribe();
    }, []);

    const renderFarmItem = ({ item }: { item: Farm }) => (
        <View style={styles.farmItem}>
            <Text style={styles.farmName}>{item.name}</Text>
            <Text style={styles.farmDetail}>Dirección: {item.address}</Text>
            <Text style={styles.farmDetail}>Propietario: {item.owner}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lista de Fincas</Text>
            {farms.length === 0 ? (
                <Text style={styles.emptyText}>No hay fincas registradas.</Text>
            ) : (
                <FlatList
                    data={farms}
                    renderItem={renderFarmItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
        padding: 24,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: COLORS.forestGreen,
        marginBottom: 20,
        textAlign: "center",
    },
    farmItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.lightGreen,
    },
    farmName: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 4,
    },
    farmDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.softBrown,
        textAlign: "center",
        marginTop: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    backButton: {
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 20,
        alignSelf: "center",
        width: "85%",
    },
    backButtonText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: "center",
        fontWeight: "600",
    },
});