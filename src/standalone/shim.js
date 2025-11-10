/**
 * Standalone Editor Shim
 *
 * Initializes the DOM structure required for the PlayCanvas Editor
 * to run in standalone mode without a backend server.
 */

(function() {
    'use strict';

    console.log('[Standalone Shim] Initializing editor DOM structure...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDOM);
    } else {
        initializeDOM();
    }

    function initializeDOM() {
        // Create root layout structure
        const layoutRoot = document.createElement('div');
        layoutRoot.id = 'layout-root';
        layoutRoot.className = 'pcui-element font-regular pcui-container';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.id = 'layout-toolbar';
        toolbar.className = 'pcui-element font-regular pcui-container';

        // Hierarchy panel (left)
        const hierarchy = document.createElement('div');
        hierarchy.id = 'layout-hierarchy';
        hierarchy.className = 'pcui-element font-regular pcui-container';
        hierarchy.style.width = '300px';

        // Viewport (center)
        const viewport = document.createElement('div');
        viewport.id = 'layout-viewport';
        viewport.className = 'pcui-element font-regular viewport';

        const canvas = document.createElement('canvas');
        canvas.id = 'canvas-3d';
        canvas.className = 'pcui-element font-regular pcui-canvas';
        viewport.appendChild(canvas);

        // Assets panel (bottom)
        const assets = document.createElement('div');
        assets.id = 'layout-assets';
        assets.className = 'pcui-element font-regular assets';
        assets.style.height = '200px';

        // Attributes/Inspector panel (right)
        const attributes = document.createElement('div');
        attributes.id = 'layout-attributes';
        attributes.className = 'pcui-element font-regular attributes';
        attributes.style.width = '300px';

        // Console panel (bottom right)
        const consolePanel = document.createElement('div');
        consolePanel.id = 'layout-console';
        consolePanel.className = 'pcui-element font-regular pcui-container';

        // Assemble the layout
        layoutRoot.appendChild(toolbar);
        layoutRoot.appendChild(hierarchy);
        layoutRoot.appendChild(viewport);
        layoutRoot.appendChild(assets);
        layoutRoot.appendChild(attributes);
        layoutRoot.appendChild(consolePanel);

        // Replace loading screen with editor UI
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen && loadingScreen.parentNode) {
            loadingScreen.parentNode.insertBefore(layoutRoot, loadingScreen);
        } else {
            document.body.appendChild(layoutRoot);
        }

        console.log('[Standalone Shim] DOM structure created');

        // Initialize scene data if not present
        initializeSceneData();
    }

    function initializeSceneData() {
        if (!window.config) {
            console.error('[Standalone Shim] window.config not found!');
            return;
        }

        // Add scene entities if missing
        if (!window.config.scene.entities) {
            console.log('[Standalone Shim] Creating default scene entities...');

            window.config.scene.entities = {
                // Root entity
                'root': {
                    resource_id: 'root',
                    name: 'Root',
                    tags: [],
                    enabled: true,
                    parent: null,
                    children: ['camera', 'light'],
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    components: {}
                },

                // Camera entity
                'camera': {
                    resource_id: 'camera',
                    name: 'Camera',
                    tags: [],
                    enabled: true,
                    parent: 'root',
                    children: [],
                    position: [0, 2, 10],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    components: {
                        camera: {
                            clearColor: [0.118, 0.118, 0.118, 1],
                            clearColorBuffer: true,
                            clearDepthBuffer: true,
                            clearStencilBuffer: true,
                            enabled: true,
                            farClip: 1000,
                            fov: 45,
                            frustumCulling: true,
                            nearClip: 0.1,
                            projection: 0,
                            priority: 0,
                            rect: [0, 0, 1, 1]
                        }
                    }
                },

                // Directional light entity
                'light': {
                    resource_id: 'light',
                    name: 'Directional Light',
                    tags: [],
                    enabled: true,
                    parent: 'root',
                    children: [],
                    position: [0, 5, 0],
                    rotation: [45, 0, 0],
                    scale: [1, 1, 1],
                    components: {
                        light: {
                            type: 'directional',
                            color: [1, 1, 1],
                            intensity: 1,
                            castShadows: true,
                            shadowDistance: 40,
                            shadowResolution: 2048,
                            shadowBias: 0.05,
                            normalOffsetBias: 0.05,
                            range: 10,
                            falloffMode: 0,
                            shadowType: 1
                        }
                    }
                }
            };

            console.log('[Standalone Shim] Default scene entities created');
        }
    }

    console.log('[Standalone Shim] Initialization complete');
})();
