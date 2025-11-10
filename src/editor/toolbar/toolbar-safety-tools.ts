/**
 * Safety Tools Toolbar
 *
 * Provides UI controls for all Phase 1 safety visualization tools:
 * - Enhanced 3D picking
 * - Proxy mesh generation
 * - Measurement tools
 * - Surface alignment
 */

import * as pcui from '@playcanvas/pcui';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return;

    // Create toolbar panel
    const panel = editor.call('layout.toolbar');

    // Safety Tools section
    const safetyToolsSection = new pcui.Container({
        class: 'toolbar-safety-tools',
        flex: true,
        flexDirection: 'row'
    });

    // === 3D PICKING TOGGLE ===
    const pickingToggle = new pcui.Button({
        text: '3D Pick',
        class: 'safety-tool-button',
        icon: 'E188' // Target icon
    });

    let pickingEnabled = true;
    pickingToggle.class.add('active');

    pickingToggle.on('click', () => {
        pickingEnabled = !pickingEnabled;
        editor.call('viewport:pick:3d:enable', pickingEnabled);
        editor.call('viewport:pick:marker', pickingEnabled);

        if (pickingEnabled) {
            pickingToggle.class.add('active');
        } else {
            pickingToggle.class.remove('active');
        }
    });

    // === PROXY MESH TOOLS ===
    const proxyButton = new pcui.Button({
        text: 'Generate Proxy',
        class: 'safety-tool-button',
        icon: 'E206' // Box icon
    });

    proxyButton.on('click', () => {
        const selection = editor.call('selector:items');
        if (!selection || selection.length === 0) {
            editor.call('status:error', 'Please select a gsplat entity first');
            return;
        }

        const entityObserver = selection[0];
        const entity = editor.call('entities:get', entityObserver.get('resource_id'));

        if (!entity || !entity.gsplat) {
            editor.call('status:error', 'Selected entity is not a gsplat');
            return;
        }

        // Check if proxy already exists
        const existing = editor.call('tools:proxy:findForGsplat', entity);
        if (existing) {
            editor.call('status:text', 'Proxy mesh already exists');
            return;
        }

        // Generate proxy
        const proxy = editor.call('tools:proxy:generate', entity, 'box');
        if (proxy) {
            editor.call('status:text', `Created proxy mesh for ${entity.name}`);
        }
    });

    // === PROXY VISIBILITY TOGGLE ===
    let proxiesVisible = true;
    const proxyVisibilityButton = new pcui.Button({
        text: 'Hide Proxies',
        class: 'safety-tool-button',
        icon: 'E105' // Eye icon
    });

    proxyVisibilityButton.on('click', () => {
        proxiesVisible = !proxiesVisible;
        const proxies = editor.call('tools:proxy:findAll');

        proxies.forEach((proxy: pc.Entity) => {
            editor.call('tools:proxy:toggle', proxy, proxiesVisible);
        });

        proxyVisibilityButton.text = proxiesVisible ? 'Hide Proxies' : 'Show Proxies';
        editor.call('status:text', `Proxies ${proxiesVisible ? 'visible' : 'hidden'}`);
    });

    // === MEASUREMENT TOOLS ===
    const measurementButtons = new pcui.Container({
        class: 'measurement-buttons',
        flex: true,
        flexDirection: 'row'
    });

    let activeMeasurementTool: string | null = null;

    const createMeasurementButton = (type: string, text: string, icon: string) => {
        const button = new pcui.Button({
            text,
            class: 'safety-tool-button measurement-button',
            icon
        });

        button.on('click', () => {
            if (activeMeasurementTool === type) {
                // Deactivate
                editor.call('measurement:stop');
                activeMeasurementTool = null;
                button.class.remove('active');
            } else {
                // Deactivate previous
                if (activeMeasurementTool) {
                    const prevButton = measurementButtons.dom.querySelector(`[data-type="${activeMeasurementTool}"]`);
                    if (prevButton) {
                        prevButton.classList.remove('active');
                    }
                }

                // Activate new
                editor.call('measurement:start', type);
                activeMeasurementTool = type;
                button.class.add('active');

                const instructions = {
                    distance: 'Click two points to measure distance',
                    angle: 'Click three points (vertex second) to measure angle',
                    height: 'Click one point to measure height from ground'
                };

                editor.call('status:text', instructions[type as keyof typeof instructions]);
            }
        });

        button.dom.setAttribute('data-type', type);
        return button;
    };

    const distanceButton = createMeasurementButton('distance', 'Distance', 'E149');
    const angleButton = createMeasurementButton('angle', 'Angle', 'E151');
    const heightButton = createMeasurementButton('height', 'Height', 'E261');

    measurementButtons.append(distanceButton);
    measurementButtons.append(angleButton);
    measurementButtons.append(heightButton);

    // === CLEAR MEASUREMENTS ===
    const clearMeasurementsButton = new pcui.Button({
        text: 'Clear',
        class: 'safety-tool-button',
        icon: 'E289' // Delete icon
    });

    clearMeasurementsButton.on('click', () => {
        editor.call('measurement:clearAll');
        editor.call('status:text', 'All measurements cleared');
    });

    // === EXPORT MEASUREMENTS ===
    const exportMeasurementsButton = new pcui.Button({
        text: 'Export',
        class: 'safety-tool-button',
        icon: 'E226' // Download icon
    });

    exportMeasurementsButton.on('click', () => {
        const json = editor.call('measurement:export');
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'measurements.json';
        a.click();

        URL.revokeObjectURL(url);
        editor.call('status:text', 'Measurements exported');
    });

    // === SURFACE ALIGNMENT ===
    let alignmentMode = false;
    const alignButton = new pcui.Button({
        text: 'Align (A)',
        class: 'safety-tool-button',
        icon: 'E164' // Alignment icon
    });

    alignButton.on('click', () => {
        alignmentMode = !alignmentMode;
        editor.call('gizmo:surfaceAlign:enable', alignmentMode);

        if (alignmentMode) {
            alignButton.class.add('active');
            editor.call('status:text', 'Surface alignment mode (click surface to align)');
        } else {
            alignButton.class.remove('active');
            editor.call('status:text', 'Surface alignment disabled');
        }
    });

    // === ALIGNMENT OFFSET ===
    const offsetSlider = new pcui.SliderInput({
        class: 'alignment-offset-slider',
        min: 0,
        max: 1,
        step: 0.01,
        precision: 3,
        value: 0
    });

    const offsetLabel = new pcui.Label({
        text: 'Offset: 0.000m',
        class: 'alignment-offset-label'
    });

    offsetSlider.on('change', (value: number) => {
        editor.call('gizmo:surfaceAlign:offset', value);
        offsetLabel.text = `Offset: ${value.toFixed(3)}m`;
    });

    // === ASSEMBLE TOOLBAR ===
    // Add separator
    const separator = new pcui.Container({
        class: 'toolbar-separator'
    });
    separator.dom.style.width = '1px';
    separator.dom.style.height = '20px';
    separator.dom.style.background = '#2c3e50';
    separator.dom.style.margin = '0 8px';

    // Add all tools to section
    safetyToolsSection.append(pickingToggle);
    safetyToolsSection.append(separator.dom.cloneNode(true) as HTMLElement);
    safetyToolsSection.append(proxyButton);
    safetyToolsSection.append(proxyVisibilityButton);
    safetyToolsSection.append(separator.dom.cloneNode(true) as HTMLElement);
    safetyToolsSection.append(measurementButtons);
    safetyToolsSection.append(clearMeasurementsButton);
    safetyToolsSection.append(exportMeasurementsButton);
    safetyToolsSection.append(separator.dom.cloneNode(true) as HTMLElement);
    safetyToolsSection.append(alignButton);
    safetyToolsSection.append(offsetLabel);
    safetyToolsSection.append(offsetSlider);

    // Add section to toolbar
    panel.append(safetyToolsSection);

    // === STYLES ===
    const style = document.createElement('style');
    style.textContent = `
        .toolbar-safety-tools {
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.1);
            border-left: 2px solid #f60;
            margin-left: 10px;
        }

        .safety-tool-button {
            margin: 0 4px;
            padding: 6px 12px;
            font-size: 12px;
            background: #2c3e50;
            color: #ecf0f1;
            border: 1px solid #34495e;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .safety-tool-button:hover {
            background: #34495e;
            border-color: #f60;
        }

        .safety-tool-button.active {
            background: #f60;
            border-color: #ff8800;
            color: white;
        }

        .measurement-buttons {
            display: flex;
            gap: 4px;
        }

        .alignment-offset-label {
            font-size: 11px;
            color: #95a5a6;
            margin: 0 8px;
            align-self: center;
        }

        .alignment-offset-slider {
            width: 120px;
        }

        .toolbar-separator {
            display: inline-block;
        }
    `;
    document.head.appendChild(style);

    // === EVENT HANDLERS ===
    // Update button states based on events
    editor.on('measurement:mode:changed', (mode: string | null) => {
        if (!mode) {
            activeMeasurementTool = null;
            measurementButtons.dom.querySelectorAll('.measurement-button').forEach((btn: Element) => {
                btn.classList.remove('active');
            });
        }
    });

    editor.on('gizmo:surfaceAlign:mode', (enabled: boolean) => {
        alignmentMode = enabled;
        if (enabled) {
            alignButton.class.add('active');
        } else {
            alignButton.class.remove('active');
        }
    });

    // === STATUS MESSAGES ===
    let measurementPointCount = 0;

    editor.on('measurement:point:added', (point: pc.Vec3, count: number) => {
        measurementPointCount = count;

        const messages: { [key: string]: string[] } = {
            distance: [`Point 1 selected at ${point.toString()}`, `Distance measured`],
            angle: [
                `Point 1 selected at ${point.toString()}`,
                `Vertex selected at ${point.toString()}`,
                `Angle measured`
            ],
            height: [`Height measured from ${point.toString()}`]
        };

        if (activeMeasurementTool && messages[activeMeasurementTool]) {
            const message = messages[activeMeasurementTool][count - 1];
            if (message) {
                editor.call('status:text', message);
            }
        }
    });

    editor.on('measurement:created', (measurement: any) => {
        editor.call('status:text', `Measurement created: ${measurement.label}`);
        console.log(`[Safety Tools] Created ${measurement.type} measurement: ${measurement.label}`);
    });

    editor.on('tools:proxy:created', (proxy: pc.Entity, gsplat: pc.Entity) => {
        console.log(`[Safety Tools] Created proxy for ${gsplat.name}`);
    });

    editor.on('surface:aligned', (entity: pc.Entity, pickResult: any) => {
        console.log(`[Safety Tools] Aligned ${entity.name} to surface`);
        editor.call('status:text', `Aligned ${entity.name} to surface`);
    });

    // === HELP TEXT ===
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           SAFETY TOOLS - PHASE 1 INITIALIZED               ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  3D Picking:                                              ║
║    • Click anywhere to get 3D coordinates                 ║
║    • Orange marker shows picked point                     ║
║                                                            ║
║  Proxy Meshes:                                            ║
║    • Select gsplat → Click "Generate Proxy"               ║
║    • Toggle visibility with "Show/Hide Proxies"           ║
║                                                            ║
║  Measurements:                                            ║
║    • Distance: Click 2 points                             ║
║    • Angle: Click 3 points (vertex is 2nd)                ║
║    • Height: Click 1 point                                ║
║    • Export to JSON                                       ║
║                                                            ║
║  Surface Alignment:                                       ║
║    • Select entity                                        ║
║    • Click "Align" or press 'A'                           ║
║    • Click on surface to align                            ║
║    • Adjust offset with slider                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

    editor.call('status:text', 'Safety Tools ready! See console for help.');
});
