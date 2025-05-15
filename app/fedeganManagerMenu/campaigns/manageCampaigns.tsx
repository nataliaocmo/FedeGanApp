import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
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
    vaccinatedAnimals?: number;
    progress?: number;
}

interface Farm {
    id: string;
    name: string;
    region: string;
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

export default function ManageCampaigns() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [farms, setFarms] = useState<{ [key: string]: { name: string; region: string } }>({});
    const [outbreaks, setOutbreaks] = useState<{ [key: string]: string }>({});
    const [regionStats, setRegionStats] = useState<{
        [region: string]: { totalVaccinated: number; averageProgress: number; campaignCount: number };
    }>({});
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== "fedeganManager") {
            console.error("Acceso denegado: Rol no es fedeganManager");
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
                const data = doc.data() as Farm;
                return { ...acc, [doc.id]: { name: data.name || "Finca desconocida", region: data.region || "Sin región" } };
            }, {} as { [key: string]: { name: string; region: string } });
            console.log("Fincas cargadas:", farmsData);
            setFarms(farmsData);
        }, (error) => {
            console.error("Error al cargar fincas:", error.message);
        });

        // Cargar todos los brotes
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
        });

        return () => {
            unsubscribeCampaigns();
            unsubscribeFarms();
            unsubscribeOutbreaks();
        };
    }, [user]);

    // Calcular estadísticas por región
    useEffect(() => {
        const stats: { [region: string]: { totalVaccinated: number; averageProgress: number; campaignCount: number } } = {};
        campaigns.forEach((campaign) => {
            const farm = farms[campaign.farmId];
            if (farm) {
                const region = farm.region || "Sin región";
                if (!stats[region]) {
                    stats[region] = { totalVaccinated: 0, averageProgress: 0, campaignCount: 0 };
                }
                stats[region].totalVaccinated += campaign.vaccinatedAnimals || 0;
                stats[region].averageProgress += campaign.progress || 0;
                stats[region].campaignCount += 1;
            }
        });

        // Calcular promedio de progreso
        Object.keys(stats).forEach((region) => {
            if (stats[region].campaignCount > 0) {
                stats[region].averageProgress /= stats[region].campaignCount;
            }
        });

        setRegionStats(stats);
    }, [campaigns, farms]);

    const renderCampaign = ({ item }: { item: Campaign }) => {
        const farm = farms[item.farmId] || { name: "Finca desconocida", region: "Sin región" };
        const outbreakName = outbreaks[item.outbreakId] || "Brote desconocido";
        return (
            <View style={styles.campaignItem}>
                <View style={styles.campaignContent}>
                    <View style={styles.campaignHeader}>
                        <Icon name="hospital" size={24} color={COLORS.forestGreen} style={styles.icon} />
                        <Text style={styles.campaignTitle}>{item.vaccineType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>Finca: {farm.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="map-marker" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>Región: {farm.region}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="alert-circle-outline" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>
                            Brote: {Array.isArray(outbreakName) ? outbreakName.join(", ") : outbreakName}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="paw" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>Animales objetivo: {item.targetAnimals}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="syringe" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>
                            Animales vacunados: {item.vaccinatedAnimals || 0} (
                            {item.progress ? item.progress.toFixed(1) : 0}%)
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="check-circle-outline" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.campaignDetail}>
                            Estado: {item.status === "planned" ? "Planeación" : item.status === "in_progress" ? "En desarrollo" : "Completada"}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderRegionStats = () => {
        return Object.entries(regionStats).map(([region, stats]) => (
            <View key={region} style={styles.regionStatsItem}>
                <Text style={styles.regionStatsTitle}>{region}</Text>
                <Text style={styles.regionStatsText}>Campañas: {stats.campaignCount}</Text>
                <Text style={styles.regionStatsText}>Animales vacunados: {stats.totalVaccinated}</Text>
                <Text style={styles.regionStatsText}>
                    Progreso promedio: {stats.averageProgress.toFixed(1)}%
                </Text>
            </View>
        ));
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
                <Text style={styles.title}>Gestión de Campañas</Text>
            </View>
            <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Estadísticas por Región</Text>
                {Object.keys(regionStats).length === 0 ? (
                    <Text style={styles.emptyStatsText}>No hay datos disponibles</Text>
                ) : (
                    renderRegionStats()
                )}
            </View>
            <FlatList
                data={campaigns}
                renderItem={renderCampaign}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    campaigns.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="syringe" size={48} color={COLORS.softBrown} />
                            <Text style={styles.emptyText}>No hay campañas registradas</Text>
                        </View>
                    ) : null
                }
            />
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
    statsContainer: {
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
    statsTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.forestGreen,
        marginBottom: 12,
    },
    regionStatsItem: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: COLORS.cream,
        borderRadius: 8,
    },
    regionStatsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.darkGray,
    },
    regionStatsText: {
        fontSize: 14,
        color: COLORS.darkGray,
    },
    emptyStatsText: {
        fontSize: 14,
        color: COLORS.softBrown,
        textAlign: "center",
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
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
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