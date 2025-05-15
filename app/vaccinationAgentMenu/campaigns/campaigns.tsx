import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
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
};

interface Campaign {
    id: string;
    outbreakId: string;
    farmId: string;
    vaccineType: string;
    targetAnimals: number;
    startDate: string;
    createdAt: any;
    createdBy: string;
    status: "planned" | "in_progress" | "completed";
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

export default function CampaignsList() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [farms, setFarms] = useState<{ [key: string]: string }>({});
    const [outbreaks, setOutbreaks] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== "vaccinationAgent") {
            console.error("Acceso denegado: Rol no es vaccinationAgent");
            showAlert("Error", "No tienes permiso para ver esta página.", () => {});
            return;
        }

        // Cargar todas las campañas
        const qCampaigns = query(collection(db, "campaigns"));
        const unsubscribeCampaigns = onSnapshot(qCampaigns, (snapshot) => {
            const campaignsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Campaign[];
            console.log("Campañas cargadas:", campaignsData);
            setCampaigns(campaignsData);
        }, (error) => {
            console.error("Error al cargar campañas:", error.message);
            showAlert("Error", "No se pudieron cargar las campañas.", () => {});
        });

        // Cargar todas las fincas
        const qFarms = query(collection(db, "farms"));
        const unsubscribeFarms = onSnapshot(qFarms, (snapshot) => {
            const farmsData = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                return { ...acc, [doc.id]: data.name || "Finca desconocida" };
            }, {} as { [key: string]: string });
            console.log("Fincas cargadas:", farmsData);
            setFarms(farmsData);
        }, (error) => {
            console.error("Error al cargar fincas:", error.message);
            showAlert("Error", "No se pudieron cargar las fincas.", () => {});
        });

        // Cargar todos las brotes
        const qOutbreaks = query(collection(db, "outbreaks"));
        const unsubscribeOutbreaks = onSnapshot(qOutbreaks, (snapshot) => {
            const outbreaksData = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                return { ...acc, [doc.id]: data.diseases || "Brote desconocido" };
            }, {} as { [key: string]: string });
            console.log("Brotes cargados:", outbreaksData);
            setOutbreaks(outbreaksData);
        }, (error) => {
            console.error("Error al cargar brotes:", error.message);
            showAlert("Error", "No se pudieron cargar los brotes.", () => {});
        });

        return () => {
            unsubscribeCampaigns();
            unsubscribeFarms();
            unsubscribeOutbreaks();
        };
    }, [user]);

    const handleUpdateStatus = async (campaignId: string, newStatus: Campaign["status"]) => {
        if (!user) {
            showAlert("Error", "Usuario no autenticado.", () => {});
            return;
        }

        showAlert(
            "Confirmar",
            `¿Deseas actualizar el estado a "${newStatus === 'planned' ? 'Planeación' : newStatus === 'in_progress' ? 'Desarrollo' : 'Completada'}"?`,
            async () => {
                try {
                    const campaignRef = doc(db, "campaigns", campaignId);
                    await updateDoc(campaignRef, { status: newStatus });
                    console.log(`Estado actualizado para campaña ${campaignId}: ${newStatus}`);
                } catch (error: any) {
                    console.error("Error al actualizar estado:", error.message);
                    showAlert("Error", "No se pudo actualizar el estado.", () => {});
                }
            }
        );
    };

    const renderTimeline = (campaign: Campaign) => {
        const status = campaign.status || "planned";
        const stages = [
            { key: "planned", label: "Planeación", icon: "calendar" },
            { key: "in_progress", label: "Desarrollo", icon: "play-circle-outline" },
            { key: "completed", label: "Completada", icon: "check-circle-outline" },
        ];

        return (
            <View style={styles.timelineContainer}>
                {stages.map((stage, index) => {
                    const isActive = status === stage.key;
                    const isPast = stages.findIndex(s => s.key === status) >= index;
                    return (
                        <TouchableOpacity
                            key={stage.key}
                            style={styles.timelineStage}
                            onPress={() => handleUpdateStatus(campaign.id, stage.key as Campaign["status"])}
                            activeOpacity={0.7}
                        >
                            <View style={styles.timelineIconContainer}>
                                <Icon
                                    name={stage.icon}
                                    size={18}
                                    color={isActive ? COLORS.forestGreen : isPast ? COLORS.forestGreen : COLORS.darkGray}
                                />
                                {index < stages.length - 1.5 && (
                                    <View
                                        style={[
                                            styles.timelineConnector,
                                            { backgroundColor: isPast ? COLORS.forestGreen : COLORS.softBrown },
                                        ]}
                                    />
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.timelineLabel,
                                    { color: isActive ? COLORS.forestGreen : isPast ? COLORS.forestGreen : COLORS.darkGray },
                                ]}
                            >
                                {stage.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderCampaign = ({ item }: { item: Campaign }) => {
        const farmName = farms[item.farmId] || "Finca desconocida";
        const outbreakName = outbreaks[item.outbreakId] || "Brote desconocido";
        return (
            <View style={styles.campaignItem}>
                <View style={styles.campaignContent}>
                    <View style={styles.campaignHeader}>
                        <Icon name="hospital" size={24} color={COLORS.forestGreen} style={styles.icon} />
                        <Text style={styles.campaignTitle}>{item.vaccineType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="paw" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>Animales: {item.targetAnimals}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="calendar" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>Inicio: {item.startDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>Finca: {farmName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="alert-circle-outline" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>
                            Brote: {Array.isArray(outbreakName) ? outbreakName.join(', ') : outbreakName.split(/\s+/).join(', ')}
                        </Text>
                    </View>
                    {renderTimeline(item)}
                </View>
            </View>
        );
    };

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
                <Text style={styles.title}>Campañas</Text>
            </View>
            {campaigns.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="syringe" size={48} color={COLORS.softBrown} />
                    <Text style={styles.emptyText}>No hay campañas registradas</Text>
                </View>
            ) : (
                <FlatList
                    data={campaigns}
                    renderItem={renderCampaign}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
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
        backgroundColor: COLORS.forestGreen,
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 8,
    },
    backButton: {
        position: "absolute",
        left: 0,
        padding: 8,
        marginLeft: 10
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    campaignItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.forestGreen,
    },
    campaignContent: {
        marginBottom: 8,
    },
    campaignHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    icon: {
        marginRight: 8,
    },
    campaignTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    detailIcon: {
        marginRight: 8,
    },
    campaignDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    timelineContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        paddingVertical: 8,
        paddingLeft: 20, // Shift timeline right
    },
    timelineStage: {
        alignItems: "center",
        flex: 1,
    },
    timelineIconContainer: {
        position: "relative",
        alignItems: "center",
    },
    timelineConnector: {
        position: "absolute",
        top: 9,
        right: -70, // Adjusted to match wider spacing
        width: 70, // Increased to move stages right
        height: 2,
        backgroundColor: COLORS.softBrown,
    },
    timelineLabel: {
        fontSize: 11,
        fontWeight: "500",
        marginTop: 4,
        textAlign: "center",
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