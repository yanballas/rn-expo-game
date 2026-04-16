module.exports = function (api) {
    api.cache(true);
    const presets = ['babel-preset-expo'];
    const plugins = [
        // Reanimated plugin must be last
        'react-native-reanimated/plugin',
    ];
    return { presets, plugins };
};
