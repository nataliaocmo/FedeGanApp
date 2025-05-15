const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
    const config = await getDefaultConfig(__dirname);
    return {
        ...config,
        resolver: {
        ...config.resolver,
        assetExts: [...config.resolver.assetExts, 'png'],
        sourceExts: [...config.resolver.sourceExts, 'jsx', 'tsx', 'ts', 'js'],
        // Evitar módulos nativos en la web
        unstable_condition: {
            web: {
            blockList: [/react-native-maps/],
            },
        },
        },
    };
})();