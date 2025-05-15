import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Ensure this is installed

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

// Función para mostrar alertas compatible con web y móvil
const showAlert = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
) => {
    if (Platform.OS === "web") {
        if (window.confirm(`${title}\n${message}`)) {
            console.log("Confirmado en web");
            onConfirm();
        } else {
            console.log("Cancelado en web");
            onCancel?.();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                { text: "Cancelar", style: "cancel", onPress: onCancel },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        console.log("Confirmado en móvil");
                        onConfirm();
                    },
                },
            ],
            { cancelable: true }
        );
    }
};

export default function FarmsView() {
    const { user } = useAuth();
    const [farms, setFarms] = useState<Farm[]>([]);
    const router = useRouter();

    useEffect(() => {
        console.log("Usuario en FarmsView:", user?.uid, user?.email);
        if (user) {
            const checkUser = async () => {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                console.log("Usuario:", {
                    uid: user.uid,
                    role: userDoc.data()?.role,
                    email: user.email,
                });
            };
            checkUser();
        } else {
            console.log("No hay usuario autenticado");
        }

        const unsubscribe = onSnapshot(
            collection(db, "farms"),
            (snapshot) => {
                const farmsData: Farm[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Farm[];
                console.log("Fincas cargadas:", farmsData);
                setFarms(farmsData);
            },
            (error) => {
                console.error("Error al obtener fincas:", error);
                Alert.alert("Error", "No se pudieron cargar las fincas.");
            }
        );

        return () => unsubscribe();
    }, [user]);

    const handleDeleteFarm = async (farmId: string, farmName: string) => {
        console.log("Entro a la función handleDeleteFarm, ID:", farmId);
        if (!user) {
            showAlert("Error", "Debes estar autenticado para eliminar una finca.", () => {});
            console.error("No hay usuario autenticado");
            return;
        }
        try {
            console.log("Intentando eliminar finca con ID:", farmId);
            await deleteDoc(doc(db, "farms", farmId));
            showAlert("Éxito", `Finca "${farmName}" eliminada correctamente.`, () => {});
        } catch (error: any) {
            console.error("Error al eliminar finca:", error.message, error.code);
            let errorMessage = "No se pudo eliminar la finca.";
            if (error.code === "permission-denied") {
                errorMessage = "No tienes permiso para eliminar esta finca.";
            } else if (error.code === "not-found") {
                errorMessage = "La finca no existe en la base de datos.";
            }
            showAlert("Error", errorMessage, () => {});
        }
    };

    const handleFarmPress = (farmId: string) => {
        console.log("Finca seleccionada, ID:", farmId);
        router.push({
            pathname: "/vaccinationAgentMenu/farmsAndAnimals/farmDetails/[farmId]",
            params: { farmId },
        });
    };

    const renderFarmItem = ({ item }: { item: Farm }) => (
        <TouchableOpacity
            style={styles.farmItem}
            onPress={() => handleFarmPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.farmContent}>
                <View style={styles.farmIcon}>
                    <Icon name="barn" size={24} color={COLORS.forestGreen} />
                </View>
                <View style={styles.farmDetails}>
                    <Text style={styles.farmName}>{item.name}</Text>
                    <Text style={styles.farmDetail}>Dirección: {item.address}</Text>
                    <Text style={styles.farmDetail}>Propietario: {item.owner}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                    e.stopPropagation(); // Evita que el clic en "Eliminar" dispare handleFarmPress
                    console.log("Botón Eliminar presionado para finca:", item.name, item.id);
                    showAlert(
                        "Confirmar",
                        `¿Eliminar ${item.name}?`,
                        () => handleDeleteFarm(item.id, item.name),
                        () => console.log("Cancelado por el usuario")
                    );
                }}
                activeOpacity={0.7}
            >
                <Icon name="delete-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace("/vaccinationAgentMenu")}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={24} color={COLORS.forestGreen} />
                </TouchableOpacity>
                <Icon name="view-list-outline" size={32} color={COLORS.forestGreen} />
                <Text style={styles.title}>Lista de Fincas</Text>
            </View>
            {farms.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="alert-circle-outline" size={48} color={COLORS.softBrown} />
                    <Text style={styles.emptyText}>No hay fincas registradas</Text>
                </View>
            ) : (
                <FlatList
                    data={farms}
                    renderItem={renderFarmItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
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
    },
    backButton: {
        position: "absolute",
        left: 0,
        padding: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.forestGreen,
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    farmItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    farmContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    farmIcon: {
        marginRight: 12,
    },
    farmDetails: {
        flex: 1,
    },
    farmName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 4,
    },
    farmDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 2,
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.softBrown,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: "flex-end",
    },
    deleteButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.softBrown,
        textAlign: "center",
        marginTop: 12,
        fontWeight: "500",
    },
    listContainer: {
        paddingBottom: 20,
    },
});