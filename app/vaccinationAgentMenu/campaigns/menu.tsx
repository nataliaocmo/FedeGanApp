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
    yellow: "#FFB300",
};

interface Outbreak {
    id: string;
    farmId: string;
    latitude: number;
    longitude: number;
    diseases: string[];
    sickAnimalsCount: number;
    createdAt: any;
    createdBy: string;
    status?: "planned" | "in_progress" | "completed";
}

interface Validation {
    outbreakId: string;
    farmId: string;
    isValidated: boolean;
    recommendations: string;
    createdAt: any;
    createdBy: string;
}

interface Campaign {
    id: string;
    outbreakId: string;
    farmId: string;
    vaccineType: string;
    targetAnimals: number;
    startDate: string;
    createdAt: any;
    createdBy: string;
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

export default function CampaignMenu() {
    const { user } = useAuth();
    const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
    const [validations, setValidations] = useState<Validation[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== "vaccinationAgent") {
            console.error("Acceso denegado: Rol no es vaccinationAgent");
            showAlert("Error", "No tienes permiso para ver esta página.", () => {});
            return;
        }

        // Cargar todos los brotes
        const qOutbreaks = query(collection(db, "outbreaks"));
        const unsubscribeOutbreaks = onSnapshot(qOutbreaks, (snapshot) => {
            const outbreaksData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Outbreak[];
            console.log("Brotes cargados:", outbreaksData);
            setOutbreaks(outbreaksData);
        }, (error) => {
            console.error("Error al cargar brotes:", error.message);
            showAlert("Error", "No se pudieron cargar los brotes.", () => {});
        });

        // Cargar validaciones
        const qValidations = query(collection(db, "outbreakValidations"));
        const unsubscribeValidations = onSnapshot(qValidations, (snapshot) => {
            const validationsData = snapshot.docs.map((doc) => ({
                outbreakId: doc.data().outbreakId,
                ...doc.data(),
            })) as Validation[];
            console.log("Validaciones cargadas:", validationsData);
            setValidations(validationsData);
        }, (error) => {
            console.error("Error al cargar validaciones:", error.message);
        });

        // Cargar campañas
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
        });

        return () => {
            unsubscribeOutbreaks();
            unsubscribeValidations();
            unsubscribeCampaigns();
        };
    }, [user]);

    const handleStartCampaign = (outbreak: Outbreak) => {
        console.log("Navegando a campaigns, outbreakId:", outbreak.id);
        router.push({
            pathname: "/vaccinationAgentMenu/campaigns/campaigns",
            params: { outbreakId: outbreak.id, farmId: outbreak.farmId },
        });
    };

    const handleUpdateStatus = async (outbreakId: string, newStatus: Outbreak["status"]) => {
        if (!user) {
            showAlert("Error", "Usuario no autenticado.", () => {});
            return;
        }

        showAlert(
            "Confirmar",
            `¿Deseas actualizar el estado a "${newStatus === 'planned' ? 'Planificada' : newStatus === 'in_progress' ? 'En Progreso' : 'Completada'}"?`,
            async () => {
                try {
                    const outbreakRef = doc(db, "outbreaks", outbreakId);
                    await updateDoc(outbreakRef, { status: newStatus });
                    console.log(`Estado actualizado para brote ${outbreakId}: ${newStatus}`);
                } catch (error: any) {
                    console.error("Error al actualizar estado:", error.message);
                    showAlert("Error", "No se pudo actualizar el estado.", () => {});
                }
            }
        );
    };

    const renderTimeline = (outbreak: Outbreak) => {
        const status = outbreak.status || "planned";
        const stages = [
            { key: "planned", label: "Planificada", icon: "calendar" },
            { key: "in_progress", label: "En Progreso", icon: "play-circle-outline" },
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
                            onPress={() => handleUpdateStatus(outbreak.id, stage.key as Outbreak["status"])}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.timelineIconContainer,
                                isActive && styles.timelineIconActive,
                            ]}>
                                <Icon
                                    name={stage.icon}
                                    size={20}
                                    color={isActive || isPast ? COLORS.forestGreen : COLORS.darkGray}
                                />
                                {index < stages.length - 1 && (
                                    <View style={[
                                        styles.timelineConnector,
                                        isPast && styles.timelineConnectorActive,
                                    ]} />
                                )}
                            </View>
                            <Text style={[
                                styles.timelineLabel,
                                { color: isActive || isPast ? COLORS.forestGreen : COLORS.darkGray },
                            ]}>
                                {stage.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderOutbreak = ({ item }: { item: Outbreak }) => {
        const validation = validations.find((v) => v.outbreakId === item.id);
        const isValidated = validation?.isValidated || false;
        const hasCampaign = campaigns.some(c => c.outbreakId === item.id);

        return (
            <View
                style={[
                    styles.outbreakItem,
                    {
                        borderColor: isValidated ? COLORS.forestGreen : COLORS.yellow,
                    },
                ]}
            >
                <View style={styles.outbreakContent}>
                    <View style={styles.outbreakHeader}>
                        <Icon name="alert-circle-outline" size={20} color={COLORS.forestGreen} style={styles.icon} />
                        <Text style={styles.outbreakTitle}>
                            {item.diseases.join(", ")}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.outbreakDetail}>Finca ID: {item.farmId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="cow" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.outbreakDetail}>Animales afectados: {item.sickAnimalsCount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon
                            name={isValidated ? "check-circle-outline" : "clock-outline"}
                            size={16}
                            color={isValidated ? COLORS.forestGreen : COLORS.yellow}
                            style={styles.detailIcon}
                        />
                        <Text style={styles.outbreakDetail}>Estado: {isValidated ? "Validado" : "Pendiente"}</Text>
                    </View>
                    {isValidated && validation && (
                        <View style={styles.recommendationsContainer}>
                            <Icon name="note-text-outline" size={16} color={COLORS.softBrown} style={styles.detailIcon} />
                            <Text style={styles.recommendations}>Recomendaciones: {validation.recommendations}</Text>
                        </View>
                    )}
                    {isValidated && hasCampaign && renderTimeline(item)}
                </View>
                {isValidated && !hasCampaign && (
                    <TouchableOpacity
                        style={styles.campaignButton}
                        onPress={() => handleStartCampaign(item)}
                        activeOpacity={0.7}
                    >
                        <Icon name="syringe" size={16} color={COLORS.white} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Iniciar Campaña</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {outbreaks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="alert-circle-outline" size={48} color={COLORS.softBrown} />
                    <Text style={styles.emptyText}>No hay brotes disponibles</Text>
                </View>
            ) : (
                <FlatList
                    data={outbreaks}
                    renderItem={renderOutbreak}
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
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    outbreakItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    outbreakContent: {
        marginBottom: 12,
    },
    outbreakHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    icon: {
        marginRight: 8,
    },
    outbreakTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    detailIcon: {
        marginRight: 8,
    },
    outbreakDetail: {
        fontSize: 14,
        color: COLORS.darkGray,
        fontWeight: "500",
    },
    recommendationsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 6,
        marginBottom: 8,
    },
    recommendations: {
        fontSize: 13,
        color: COLORS.softBrown,
        fontStyle: "italic",
        flex: 1,
    },
    campaignButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: "center",
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonIcon: {
        marginRight: 6,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "600",
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
        paddingBottom: 24,
    },
    timelineContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        paddingVertical: 8,
        backgroundColor: `${COLORS.cream}80`,
        borderRadius: 10,
        alignItems: "center",
        textAlign: "center",
    },
    timelineStage: {
        alignItems: "center",
        flex: 1,
        textAlign: "center",
    },
    timelineIconContainer: {
        position: "relative",
        alignItems: "center",
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        justifyContent: "center",
        textAlign: "center",
    },
    timelineIconActive: {
        backgroundColor: `${COLORS.forestGreen}10`,
        borderWidth: 1,
        borderColor: COLORS.forestGreen,
    },
    timelineConnector: {
        position: "absolute",
        top: 14,
        right: -38,
        width: 36,
        height: 2,
        backgroundColor: `${COLORS.darkGray}50`,
    },
    timelineConnectorActive: {
        backgroundColor: COLORS.forestGreen,
    },
    timelineLabel: {
        fontSize: 11,
        fontWeight: "500",
        marginTop: 6,
        textAlign: "center",
    },
});