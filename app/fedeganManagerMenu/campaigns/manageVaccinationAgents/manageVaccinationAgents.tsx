import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
    errorRed: "#D32F2F", // Added for delete button
};

// Interfaz para datos de usuario
interface User {
    id: string;
    name: string;
    role: string;
}

// Interfaz para finca
interface Farm {
    id: string;
    name: string;
    region: string;
    createdBy: string;
}

// Interfaz para animal
interface Animal {
    id: string;
    species: string;
    createdBy: string;
}

// Interfaz para campaña (para vaccinationRecords)
interface Campaign {
    id: string;
    vaccinationRecords?: { createdBy: string }[];
}

// Interfaz para datos agregados de un agente
interface AgentMetrics {
    id: string;
    name: string;
    farmCount: number;
    animalCount: number;
    vaccinationRecordCount: number;
}

// Función para mostrar alertas
const showAlert = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
        if (window.confirm(`${title}\n${message}`)) {
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [
            { text: "Cancelar", style: "cancel" },
            { text: "OK", onPress: onConfirm },
        ]);
    }
};

export default function ManageVaccinationAgents() {
    const { user } = useAuth();
    const [agents, setAgents] = useState<AgentMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== "fedeganManager") {
            console.error("Acceso denegado: Rol no permitido");
            showAlert("Error", "No tienes permiso para ver esta página.", () => router.back());
            return;
        }

        // Cargar vacunadores
        const qUsers = query(collection(db, "users"), where("role", "==", "vaccinationAgent"));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            const usersData: User[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];

            // Inicializar métricas
            const initialMetrics: AgentMetrics[] = usersData.map(user => ({
                id: user.id,
                name: user.name || "Usuario desconocido",
                farmCount: 0,
                animalCount: 0,
                vaccinationRecordCount: 0,
            }));

            // Cargar fincas
            const qFarms = query(collection(db, "farms"));
            const unsubscribeFarms = onSnapshot(qFarms, (snapshot) => {
                const farmsData: Farm[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Farm[];

                // Contar fincas por agente
                const farmCounts = farmsData.reduce((acc, farm) => {
                    acc[farm.createdBy] = (acc[farm.createdBy] || 0) + 1;
                    return acc;
                }, {} as { [key: string]: number });

                // Cargar animales
                const qAnimals = query(collection(db, "animals"));
                const unsubscribeAnimals = onSnapshot(qAnimals, (snapshot) => {
                    const animalsData: Animal[] = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Animal[];

                    // Contar animales por agente
                    const animalCounts = animalsData.reduce((acc, animal) => {
                        acc[animal.createdBy] = (acc[animal.createdBy] || 0) + 1;
                        return acc;
                    }, {} as { [key: string]: number });

                    // Cargar campañas para vaccinationRecords
                    const qCampaigns = query(collection(db, "campaigns"));
                    const unsubscribeCampaigns = onSnapshot(qCampaigns, (snapshot) => {
                        const campaignsData: Campaign[] = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Campaign[];

                        // Contar registros de vacunación por agente
                        const vaccinationRecordCounts = campaignsData.reduce((acc, campaign) => {
                            if (campaign.vaccinationRecords) {
                                campaign.vaccinationRecords.forEach(record => {
                                    acc[record.createdBy] = (acc[record.createdBy] || 0) + 1;
                                });
                            }
                            return acc;
                        }, {} as { [key: string]: number });

                        // Combinar métricas
                        const updatedMetrics = initialMetrics.map(agent => ({
                            ...agent,
                            farmCount: farmCounts[agent.id] || 0,
                            animalCount: animalCounts[agent.id] || 0,
                            vaccinationRecordCount: vaccinationRecordCounts[agent.id] || 0,
                        }));

                        setAgents(updatedMetrics);
                        setLoading(false);
                    }, (error) => {
                        console.error("Error al cargar campañas:", error.message);
                        setLoading(false);
                    });

                    return () => unsubscribeCampaigns();
                }, (error) => {
                    console.error("Error al cargar animales:", error.message);
                    setLoading(false);
                });

                return () => unsubscribeAnimals();
            }, (error) => {
                console.error("Error al cargar fincas:", error.message);
                setLoading(false);
            });

            return () => unsubscribeFarms();
        }, (error) => {
            console.error("Error al cargar usuarios:", error.message);
            showAlert("Error", "No se pudo cargar la lista de vacunadores.", () => router.back());
            setLoading(false);
        });

        return () => unsubscribeUsers();
    }, [user, router]);

    const handleDeleteAgent = (agentId: string, agentName: string) => {
        showAlert(
            "Confirmar Eliminación",
            `¿Estás seguro de que deseas eliminar al vacunador ${agentName}? Esta acción no se puede deshacer.`,
            async () => {
                try {
                    const userRef = doc(db, "users", agentId);
                    await deleteDoc(userRef);
                    console.log(`Vacunador ${agentName} (ID: ${agentId}) eliminado.`);
                    showAlert("Éxito", "El vacunador ha sido eliminado correctamente.", () => {});
                } catch (error: any) {
                    console.error(`Error al eliminar vacunador ${agentId}:`, error.message);
                    showAlert("Error", "No se pudo eliminar el vacunador. Inténtalo de nuevo.", () => {});
                }
            }
        );
    };

    const renderAgent = ({ item }: { item: AgentMetrics }) => (
        <View style={styles.agentCard}>
            <View style={styles.agentContent}>
                <View style={styles.detailRow}>
                    <Icon name="account" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                    <Text style={styles.agentText}>Nombre: {item.name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                    <Text style={styles.agentText}>Fincas creadas: {item.farmCount}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="paw" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                    <Text style={styles.agentText}>Animales registrados: {item.animalCount}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="syringe" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                    <Text style={styles.agentText}>Registros de vacunación: {item.vaccinationRecordCount}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAgent(item.id, item.name)}
                activeOpacity={0.7}
            >
                <Icon name="delete" size={20} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
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
                <Text style={styles.title}>Vacunadores</Text>
            </View>
            <View style={styles.agentsContainer}>
                <Text style={styles.agentsTitle}>Lista de Vacunadores</Text>
                <FlatList
                    data={agents}
                    renderItem={renderAgent}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text style={styles.emptyAgentsText}>No hay vacunadores registrados</Text>}
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
    },
    agentsContainer: {
        backgroundColor: COLORS.cream,
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
    agentsTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 12,
    },
    agentCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    agentContent: {
        flex: 1,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailIcon: {
        marginRight: 8,
    },
    agentText: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginLeft: 8,
    },
    deleteButton: {
        backgroundColor: COLORS.errorRed,
        borderRadius: 8,
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyAgentsText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
        marginTop: 20,
    },
});