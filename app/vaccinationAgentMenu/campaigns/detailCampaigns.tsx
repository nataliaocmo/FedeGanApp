import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayUnion, collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Colores definidos
const COLORS = {
    forestGreen: "#2E7D32",
    softBrown: "#8D6E63",
    cream: "#F1F8E9",
    white: "#FFFFFF",
    darkGray: "#424242",
};

// Interfaz para los datos crudos de Firestore (sin id)
interface CampaignData {
    outbreakId: string;
    farmId: string;
    vaccineType: string;
    targetAnimals: number;
    startDate: string;
    createdAt: any;
    createdBy: string;
    status: "planned" | "in_progress" | "completed";
    vaccinatedAnimals?: number;
    progress?: number;
    vaccinationRecords?: {
        vaccinatedAnimals: number;
        vaccinationDate: any;
        comments: string;
        createdBy: string;
        createdAt: any;
    }[];
}

// Interfaz completa con id
interface Campaign extends CampaignData {
    id: string;
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

export default function DetailCampaigns() {
    const { user } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [farmName, setFarmName] = useState<string>("Finca desconocida");
    const [outbreakName, setOutbreakName] = useState<string>("Brote desconocido");
    const [vaccinatedAnimalsInput, setVaccinatedAnimalsInput] = useState<string>("");
    const [comments, setComments] = useState<string>("");
    const router = useRouter();
    const params = useLocalSearchParams();
    const campaignId = params.campaignId as string;

    useEffect(() => {
        if (!user || user.role !== "vaccinationAgent") {
            console.error("Acceso denegado: Rol no es vaccinationAgent");
            showAlert("Error", "No tienes permiso para ver esta página.", () => {});
            return;
        }

        if (!campaignId) {
            console.error("No se proporcionó campaignId");
            showAlert("Error", "No se encontró la campaña.", () => router.back());
            return;
        }

        // Cargar la campaña
        const campaignRef = doc(db, "campaigns", campaignId);
        const unsubscribeCampaign = onSnapshot(campaignRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as CampaignData;
                console.log("Campaign data from Firestore:", data); // Log para verificar si data tiene id
                setCampaign({ ...data, id: doc.id });
                console.log("Campaña cargada:", { ...data, id: doc.id });
            } else {
                console.error("Campaña no encontrada");
                showAlert("Error", "La campaña no existe.", () => router.back());
            }
        }, (error) => {
            console.error("Error al cargar campaña:", error.message);
            showAlert("Error", "No se pudo cargar la campaña.", () => router.back());
        });

        // Cargar finca
        const qFarms = query(collection(db, "farms"));
        const unsubscribeFarms = onSnapshot(qFarms, (snapshot) => {
            const farmsData = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                return { ...acc, [doc.id]: data.name || "Finca desconocida" };
            }, {} as { [key: string]: string });
            if (campaign?.farmId) {
                setFarmName(farmsData[campaign.farmId] || "Finca desconocida");
            }
        });

        // Cargar brote
        const qOutbreaks = query(collection(db, "outbreaks"));
        const unsubscribeOutbreaks = onSnapshot(qOutbreaks, (snapshot) => {
            const outbreaksData = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                return { ...acc, [doc.id]: data.diseases || "Brote desconocido" };
            }, {} as { [key: string]: string });
            if (campaign?.outbreakId) {
                setOutbreakName(outbreaksData[campaign.outbreakId] || "Brote desconocido");
            }
        });

        return () => {
            unsubscribeCampaign();
            unsubscribeFarms();
            unsubscribeOutbreaks();
        };
    }, [user, campaignId, campaign?.farmId, campaign?.outbreakId, router]);

    const handleAddVaccinationRecord = async () => {
        if (!user || !campaign) {
            showAlert("Error", "Usuario no autenticado o campaña no cargada.", () => {});
            return;
        }

        const vaccinatedAnimals = parseInt(vaccinatedAnimalsInput, 10);
        if (isNaN(vaccinatedAnimals) || vaccinatedAnimals <= 0) {
            showAlert("Error", "Ingresa un número válido de animales vacunados.", () => {});
            return;
        }

        if (vaccinatedAnimals > (campaign.targetAnimals - (campaign.vaccinatedAnimals || 0))) {
            showAlert("Error", "El número de animales vacunados excede el objetivo restante.", () => {});
            return;
        }

        showAlert(
            "Confirmar",
            `¿Deseas registrar ${vaccinatedAnimals} animales vacunados?`,
            async () => {
                try {
                    const campaignRef = doc(db, "campaigns", campaignId);
                    const newVaccinatedAnimals = (campaign.vaccinatedAnimals || 0) + vaccinatedAnimals;
                    const newProgress = (newVaccinatedAnimals / campaign.targetAnimals) * 100;

                    const vaccinationRecord = {
                        vaccinatedAnimals,
                        vaccinationDate: new Date().toISOString(),
                        comments: comments.trim() || "Sin comentarios",
                        createdBy: user.uid,
                        createdAt: new Date().toISOString(),
                    };

                    await updateDoc(campaignRef, {
                        vaccinatedAnimals: newVaccinatedAnimals,
                        progress: newProgress,
                        vaccinationRecords: arrayUnion(vaccinationRecord),
                    });

                    console.log("Registro de vacunación añadido:", vaccinationRecord);
                    showAlert("Éxito", "Registro de vacunación añadido correctamente.", () => {
                        setVaccinatedAnimalsInput("");
                        setComments("");
                    });
                    router.back();
                } catch (error: any) {
                    console.error("Error al añadir registro:", error.message);
                    showAlert("Error", "No se pudo registrar la vacunación.", () => {});
                }
            }
        );
    };

    if (!campaign) {
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
                <Text style={styles.title}>Detalles de la Campaña</Text>
            </View>
            <View style={styles.campaignDetails}>
                <View style={styles.detailRow}>
                    <Icon name="hospital" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>Vacuna: {campaign.vaccineType}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="barn" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>Finca: {farmName}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="alert-circle-outline" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>
                        Brote: {Array.isArray(outbreakName) ? outbreakName.join(", ") : outbreakName}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="paw" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>Animales objetivo: {campaign.targetAnimals}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="pill" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>
                        Animales vacunados: {campaign.vaccinatedAnimals || 0} (
                        {campaign.progress ? campaign.progress.toFixed(1) : 0}%)
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="calendar" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>Inicio: {campaign.startDate}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="check-circle-outline" size={20} color={COLORS.forestGreen} />
                    <Text style={styles.detailText}>
                        Estado: {campaign.status === "planned" ? "Planeación" : campaign.status === "in_progress" ? "En desarrollo" : "Completada"}
                    </Text>
                </View>
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Animales vacunados:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={vaccinatedAnimalsInput}
                    onChangeText={setVaccinatedAnimalsInput}
                    placeholder="Ingresa el número"
                />
                <Text style={styles.inputLabel}>Comentarios:</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    multiline
                    value={comments}
                    onChangeText={setComments}
                    placeholder="Opcional"
                />
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddVaccinationRecord}
                    activeOpacity={0.7}
                >
                    <Text style={styles.submitButtonText}>Registrar vacunación</Text>
                </TouchableOpacity>
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
    campaignDetails: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: COLORS.darkGray,
        marginLeft: 8,
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.cream,
        borderWidth: 1,
        borderColor: COLORS.forestGreen,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.darkGray,
        marginBottom: 16,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: "top",
    },
    submitButton: {
        backgroundColor: COLORS.forestGreen,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.white,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.darkGray,
        textAlign: "center",
        marginTop: 20,
    },
});