"use strict";
// bundle-config.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sources = void 0;
// Export configuration
exports.sources = {
    json: [
        require.resolve('@iconify-json/solar/icons.json'),
        {
            filename: require.resolve('@iconify/json/json/mdi.json'),
            icons: ['star', 'heart', 'circle', 'github', 'google', 'twitter', 'facebook', 'star-outline', 'heart-outline']
        }
    ],
    svg: [
        {
            dir: 'src/iconify-bundle/svg',
            monotone: false,
            prefix: 'custom'
        }
    ]
};
