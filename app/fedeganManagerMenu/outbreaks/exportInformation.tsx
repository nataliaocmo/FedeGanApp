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

interface Farm {
    id: string;
    name: string;
    owner: string;
    address: string;
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

// Función para escapar caracteres especiales en LaTeX
const escapeLatex = (str: string) => {
    return str
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
        .replace(/\$/g, "\\$")
        .replace(/#/g, "\\#")
        .replace(/_/g, "\\_")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}")
        .replace(/~/g, "\\textasciitilde")
        .replace(/\^/g, "\\textasciicircum")
        .replace(/\\/g, "\\textbackslash");
};

export default function ExportInformation() {
    const { user } = useAuth();
    const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
    const [validations, setValidations] = useState<Validation[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [farms, setFarms] = useState<Farm[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== "fedeganManager") {
            console.error("Acceso denegado: Rol no es fedeganManager");
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

        // Cargar fincas
        const qFarms = query(collection(db, "farms"));
        const unsubscribeFarms = onSnapshot(qFarms, (snapshot) => {
            const farmsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Farm[];
            console.log("Fincas cargadas:", farmsData);
            setFarms(farmsData);
        }, (error) => {
            console.error("Error al cargar fincas:", error.message);
        });

        return () => {
            unsubscribeOutbreaks();
            unsubscribeValidations();
            unsubscribeCampaigns();
            unsubscribeFarms();
        };
    }, [user]);

    const handleExportPDF = (outbreak: Outbreak) => {
        // Format createdAt to a readable date
        let formattedDate = "Desconocida";
        try {
            const createdAtDate = outbreak.createdAt?.toDate
                ? outbreak.createdAt.toDate()
                : new Date(outbreak.createdAt);
            formattedDate = createdAtDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            console.error("Error formatting createdAt:", error);
        }

        // Sanitize outbreak fields for LaTeX
        const safeId = escapeLatex(outbreak.id);
        const safeFarmId = escapeLatex(outbreak.farmId);
        const safeDiseases = escapeLatex(outbreak.diseases.join(", "));
        const safeCreatedBy = escapeLatex(outbreak.createdBy);
        const safeFormattedDate = escapeLatex(formattedDate);

        // Generate LaTeX content
        const latexContent = `
\\documentclass[a4paper,12pt]{article}

% Setting up the page layout
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{margin=2cm}

% Including necessary packages
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{parskip}
\\usepackage{hyperref}

% Setting up fonts
\\usepackage{noto}

% Defining colors
\\definecolor{forestGreen}{RGB}{46,125,50}

% Customizing the title
\\title{Reporte de Brote}
\\author{FedeGanApp}
\\date{\\today}

% Customizing the table
\\newcolumntype{L}[1]{>{\\raggedright\\arraybackslash}p{#1}}
\\hypersetup{
    colorlinks=true,
    linkcolor=forestGreen,
    citecolor=forestGreen,
    urlcolor=forestGreen
}

\\begin{document}

\\maketitle

\\section{Detalles del Brote}

Este documento contiene la información detallada de un brote registrado en el sistema FedeGanApp.

\\begin{table}[h]
    \\centering
    \\caption{Información del Brote}
    \\begin{tabular}{L{5cm} L{9cm}}
        \\toprule
        \\textbf{Campo} & \\textbf{Valor} \\
        \\midrule
        ID del Brote & ${safeId} \\
        ID de la Finca & ${safeFarmId} \\
        Latitud & ${outbreak.latitude} \\
        Longitud & ${outbreak.longitude} \\
        Enfermedades & ${safeDiseases} \\
        Animales Afectados & ${outbreak.sickAnimalsCount} \\
        Fecha de Creación & ${safeFormattedDate} \\
        Creado Por & ${safeCreatedBy} \\
        \\bottomrule
    \\end{tabular}
\\end{table}

\\end{document}
        `;

        console.log("LaTeX content for outbreak", outbreak.id, ":", latexContent);

        // Download as .tex file on web
        if (Platform.OS === "web") {
            try {
                const blob = new Blob([latexContent], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `outbreak_${safeId}.tex`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                showAlert(
                    "Éxito",
                    "El archivo LaTeX se ha descargado. Compílalo con latexmk para generar el PDF.",
                    () => {}
                );
            } catch (error) {
                console.error("Error downloading .tex file:", error);
                showAlert("Error", "No se pudo descargar el archivo LaTeX.", () => {});
            }
        } else {
            showAlert(
                "Advertencia",
                "La generación de PDF no está soportada en dispositivos móviles. Usa la versión web para descargar el archivo LaTeX.",
                () => {}
            );
        }
    };

    const renderOutbreak = ({ item }: { item: Outbreak }) => {
        const validation = validations.find((v) => v.outbreakId === item.id);
        const isValidated = validation?.isValidated || false;
        const hasCampaign = campaigns.some((c) => c.outbreakId === item.id);
        const farm = farms.find((v) => v.id === item.farmId);

        return (
            <TouchableOpacity
                style={[
                    styles.outbreakItem,
                    {
                        borderColor: isValidated ? COLORS.forestGreen : COLORS.yellow,
                    },
                ]}
                onPress={() => handleExportPDF(item)}
                activeOpacity={0.7}
            >
                <View style={styles.outbreakContent}>
                    <View style={styles.outbreakHeader}>
                        <Icon name="alert-circle-outline" size={20} color={COLORS.forestGreen} style={styles.icon} />
                        <Text style={styles.outbreakTitle}>{item.diseases.join(", ")}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="barn" size={16} color={COLORS.darkGray} style={styles.detailIcon} />
                        <Text style={styles.outbreakDetail}>Finca: {farm?.name || "Desconocida"}</Text>
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
                    {isValidated && hasCampaign && (
                        <View style={styles.treatmentContainer}>
                            <Icon name="medical-bag" size={18} color={COLORS.forestGreen} style={styles.treatmentIcon} />
                            <Text style={styles.treatmentText}>Brote en tratamiento</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
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
                <Text style={styles.title}>Exportar Información</Text>
            </View>
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
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    outbreakItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
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
    treatmentContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        backgroundColor: `${COLORS.forestGreen}10`,
        padding: 12,
        borderRadius: 8,
    },
    treatmentIcon: {
        marginRight: 8,
    },
    treatmentText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.forestGreen,
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
});