import { useAuth } from "@/context/authContext/AuthContext";
import { db } from "@/utils/FirebaseConfig";
import { useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import 'leaflet/dist/leaflet.css'; // Agregar estilos de Leaflet para la web
import React, { Suspense, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Ensure this is installed
import { WebView } from 'react-native-webview';

// Importaciones dinámicas para React-Leaflet
const MapContainer = React.lazy(() => import('react-leaflet').then(module => ({ default: module.MapContainer })));
const TileLayer = React.lazy(() => import('react-leaflet').then(module => ({ default: module.TileLayer })));
const LeafletMarker = React.lazy(() => import('react-leaflet').then(module => ({ default: module.Marker })));
const Popup = React.lazy(() => import('react-leaflet').then(module => ({ default: module.Popup })));

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

interface Farm {
    name: string;
}

// Función para cargar Leaflet y crear íconos dinámicamente
const createIcons = async () => {
    const { default: Leaflet } = await import('leaflet');
    return {
        redPinIcon: new Leaflet.Icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
        }),
        greenPinIcon: new Leaflet.Icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447194.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
        }),
    };
};

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

export default function InteractiveMap() {
    const { user } = useAuth();
    const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
    const [selectedOutbreak, setSelectedOutbreak] = useState<Outbreak | null>(null);
    const [farmName, setFarmName] = useState<string>("");
    const [recommendations, setRecommendations] = useState("");
    const [validatedOutbreaks, setValidatedOutbreaks] = useState<string[]>([]);
    const [icons, setIcons] = useState<{ redPinIcon: any; greenPinIcon: any } | null>(null);
    const mapRef = useRef<any>(null); // Referencia para el mapa
    const router = useRouter();

    // Cargar íconos dinámicamente
    useEffect(() => {
        createIcons().then(setIcons).catch((error) => {
            console.error("Error al cargar íconos de Leaflet:", error);
        });
    }, []);

    // Invalidar el tamaño del mapa después de la carga
    useEffect(() => {
        if (Platform.OS === "web" && mapRef.current && icons) {
            const map = mapRef.current;
            setTimeout(() => {
                map.invalidateSize();
            }, 100); // Pequeño retraso para asegurar que el contenedor esté listo
        }
    }, [icons, outbreaks, selectedOutbreak]);

    useEffect(() => {
        if (!user) {
            console.error("Acceso denegado: Usuario no autenticado");
            showAlert("Error", "Debes iniciar sesión para ver esta página.", () => {});
            return;
        }

        if (user.role !== "fedeganManager") {
            console.error("Acceso denegado: Rol no es fedeganManager");
            showAlert("Error", "No tienes permiso para ver esta página.", () => {});
            return;
        }

        // Cargar brotes
        const q = query(collection(db, "outbreaks"));
        const unsubscribeOutbreaks = onSnapshot(
            q,
            (snapshot) => {
                const outbreaksData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Outbreak[];
                console.log("Brotes cargados:", outbreaksData);
                setOutbreaks(outbreaksData);
            },
            (error) => {
                console.error("Error al cargar brotes:", error.message);
                showAlert("Error", "No se pudieron cargar los brotes.", () => {});
            }
        );

        // Cargar validaciones
        const qValidations = query(collection(db, "outbreakValidations"));
        const unsubscribeValidations = onSnapshot(
            qValidations,
            (snapshot) => {
                const validatedIds = snapshot.docs
                    .filter((doc) => doc.data().isValidated)
                    .map((doc) => doc.data().outbreakId);
                console.log("Brotes validados:", validatedIds);
                setValidatedOutbreaks(validatedIds);
            },
            (error) => {
                console.error("Error al cargar validaciones:", error.message);
            }
        );

        return () => {
            unsubscribeOutbreaks();
            unsubscribeValidations();
        };
    }, [user]);

    // Cargar nombre de la finca
    useEffect(() => {
        const fetchFarmName = async () => {
            if (selectedOutbreak && selectedOutbreak.farmId) {
                try {
                    const farmDoc = await getDoc(doc(db, "farms", selectedOutbreak.farmId));
                    if (farmDoc.exists()) {
                        const farmData = farmDoc.data() as Farm;
                        setFarmName(farmData.name || "Finca desconocida");
                    } else {
                        setFarmName("Finca no encontrada");
                    }
                } catch (error) {
                    console.error("Error al cargar nombre de finca:", error);
                    setFarmName("Error al cargar finca");
                }
            } else {
                setFarmName("");
            }
        };
        fetchFarmName();
    }, [selectedOutbreak]);

    const handleMarkerPress = (outbreak: Outbreak) => {
        setSelectedOutbreak(outbreak);
        setRecommendations("");
    };

    const handleValidateOutbreak = async () => {
        if (!selectedOutbreak || !recommendations.trim()) {
            showAlert("Error", "Selecciona un brote y escribe recomendaciones.", () => {});
            return;
        }

        if (!user) {
            showAlert("Error", "Usuario no autenticado.", () => {});
            return;
        }

        try {
            console.log("Validando brote:", selectedOutbreak.id);
            await addDoc(collection(db, "outbreakValidations"), {
                outbreakId: selectedOutbreak.id,
                farmId: selectedOutbreak.farmId,
                isValidated: true,
                recommendations,
                createdAt: new Date(),
                createdBy: user.uid,
            });
            console.log("Validación enviada para brote:", selectedOutbreak.id);
            showAlert("Éxito", "Validación enviada correctamente.", () => {});
            setSelectedOutbreak(null);
            setRecommendations("");
            setFarmName("");
        } catch (error: any) {
            console.error("Error al enviar validación:", error.message);
            showAlert("Error", "No se pudo enviar la validación.", () => {});
        }
    };

    // Configuración inicial del mapa
    const initialRegion = {
        latitude: 4.60971, // Bogotá, Colombia
        longitude: -74.08175,
        latitudeDelta: 10,
        longitudeDelta: 10,
    };

    // HTML para WebView en móvil
    const leafletHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <style>
                    html, body, #map { height: 100%; width: 100%; margin: 0; }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <script>
                    const map = L.map('map').setView([${initialRegion.latitude}, ${initialRegion.longitude}], 6);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);
                    const outbreaks = ${JSON.stringify(outbreaks)};
                    const validatedOutbreaks = ${JSON.stringify(validatedOutbreaks)};
                    outbreaks.forEach(outbreak => {
                        L.marker([outbreak.latitude, outbreak.longitude], {
                            icon: L.icon({
                                iconUrl: validatedOutbreaks.includes(outbreak.id) ? 
                                    'https://cdn-icons-png.flaticon.com/512/447/447194.png' : 
                                    'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                                iconSize: [32, 32],
                                iconAnchor: [16, 32],
                                popupAnchor: [0, -32]
                            })
                        })
                        .addTo(map)
                        .bindPopup('Brote: ' + outbreak.diseases.join(", ") + '<br>Animales: ' + outbreak.sickAnimalsCount)
                        .on('click', () => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ id: outbreak.id }));
                        });
                    });
                </script>
            </body>
        </html>
    `;

    // Evitar renderizado durante SSR
    if (Platform.OS === "web" && typeof window === "undefined") {
        return null;
    }

    // Esperar a que los íconos estén listos
    if (Platform.OS === "web" && !icons) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Icon name="arrow-left" size={24} color={COLORS.forestGreen} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Cargando mapa...</Text>
                </View>
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
                    <Icon name="arrow-left" size={24} color={COLORS.forestGreen} />
                </TouchableOpacity>
                <Text style={styles.title}>Mapa de Brotes</Text>
            </View>
            <View style={styles.mapContainer}>
                {Platform.OS === "web" ? (
                    <Suspense fallback={<Text style={styles.loadingText}>Cargando mapa...</Text>}>
                        <MapContainer
                            center={[initialRegion.latitude, initialRegion.longitude]}
                            zoom={6}
                            style={{ height: '100%', width: '100%' }}
                            ref={mapRef}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {outbreaks.map((outbreak) => (
                                <LeafletMarker
                                    key={outbreak.id}
                                    position={[outbreak.latitude, outbreak.longitude]}
                                    icon={validatedOutbreaks.includes(outbreak.id) ? icons!.greenPinIcon : icons!.redPinIcon}
                                    eventHandlers={{
                                        click: () => handleMarkerPress(outbreak),
                                    }}
                                >
                                    <Popup>
                                        Brote: {outbreak.diseases.join(", ")}<br />
                                        Razas afectadas: {outbreak.sickAnimalsCount}
                                    </Popup>
                                </LeafletMarker>
                            ))}
                        </MapContainer>
                    </Suspense>
                ) : (
                    <WebView
                        style={styles.map}
                        originWhitelist={['*']}
                        source={{ html: leafletHtml }}
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                const outbreak = outbreaks.find(o => o.id === data.id);
                                if (outbreak) handleMarkerPress(outbreak);
                            } catch (error) {
                                console.error("Error parsing WebView message:", error);
                            }
                        }}
                    />
                )}
            </View>
            {selectedOutbreak && !validatedOutbreaks.includes(selectedOutbreak.id) && (
                <View style={styles.validationForm}>
                    <View style={styles.formHeader}>
                        <Icon name="alert-circle-outline" size={20} color={COLORS.forestGreen} style={styles.formIcon} />
                        <Text style={styles.formTitle}>
                            Brote: {selectedOutbreak.diseases.join(", ")}
                        </Text>
                    </View>
                    <Text style={styles.formSubtitle}>
                        <Text style={{ fontWeight: 'bold' }}>Finca: </Text>
                        {farmName}
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe recomendaciones..."
                        placeholderTextColor={COLORS.darkGray}
                        value={recommendations}
                        onChangeText={setRecommendations}
                        multiline
                        numberOfLines={4}
                    />
                    <TouchableOpacity
                        style={styles.validateButton}
                        onPress={handleValidateOutbreak}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>Enviar Validación</Text>
                    </TouchableOpacity>
                </View>
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
        paddingBottom: 20,
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
        fontSize: 26,
        fontWeight: "700",
        color: COLORS.forestGreen,
        letterSpacing: 0.5,
    },
    mapContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    map: {
        flex: 1,
    },
    validationForm: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginVertical: 20,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    formIcon: {
        marginRight: 8,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.forestGreen,
    },
    formSubtitle: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 12,
    },
    input: {
        backgroundColor: COLORS.cream,
        borderColor: COLORS.darkGray,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: COLORS.darkGray,
        marginBottom: 12,
        minHeight: 80,
        textAlignVertical: "top",
    },
    validateButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.forestGreen,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: COLORS.darkGray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "500",
        flex: 1,
        textAlign: "center",
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.darkGray,
        textAlign: "center",
        marginTop: 20,
    },
});