/**
 * Measurement Tools for Safety Analysis
 *
 * Provides distance, angle, and height measurement capabilities
 * for verifying safety clearances and compliance.
 */

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return;

    // Measurement types
    enum MeasurementType {
        DISTANCE = 'distance',
        ANGLE = 'angle',
        HEIGHT = 'height',
        PATH = 'path'
    }

    // Measurement data structure
    interface Measurement {
        id: string;
        type: MeasurementType;
        points: pc.Vec3[];
        value: number;
        label: string;
        visible: boolean;
        entity: pc.Entity;
    }

    // Active measurements
    const measurements = new Map<string, Measurement>();
    let measurementIdCounter = 0;
    let activeMeasurementType: MeasurementType | null = null;
    let activePoints: pc.Vec3[] = [];

    /**
     * Create visual line between two points
     */
    const createLine = (start: pc.Vec3, end: pc.Vec3, color: pc.Color = new pc.Color(1, 1, 0)): pc.Entity => {
        const lineEntity = new pc.Entity('MeasurementLine');

        // Calculate line direction and length
        const direction = new pc.Vec3().sub2(end, start);
        const length = direction.length();
        const midpoint = new pc.Vec3().add2(start, end).mulScalar(0.5);

        // Create cylinder for line
        lineEntity.addComponent('render', {
            type: 'cylinder',
            castShadows: false,
            receiveShadows: false
        });

        // Create material
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.emissive = color;
        material.emissiveIntensity = 0.5;
        material.update();

        if (lineEntity.render) {
            lineEntity.render.meshInstances[0].material = material;
        }

        // Position and orient
        lineEntity.setPosition(midpoint);
        lineEntity.setLocalScale(0.01, length / 2, 0.01); // Thin cylinder

        // Orient along direction
        const up = new pc.Vec3(0, 1, 0);
        if (direction.length() > 0) {
            direction.normalize();
            const rotation = new pc.Quat();
            rotation.setFromUnitVectors(up, direction);
            lineEntity.setRotation(rotation);
        }

        // Add to gizmo layers
        const layers = editor.call('gizmo:layers') || [pc.LAYERID_UI];
        if (lineEntity.render) {
            lineEntity.render.layers = layers;
        }

        lineEntity.tags.add('measurement');
        lineEntity.tags.add('safety-tool');

        return lineEntity;
    };

    /**
     * Create visual marker at point
     */
    const createPointMarker = (position: pc.Vec3, color: pc.Color = new pc.Color(1, 1, 0), size: number = 0.05): pc.Entity => {
        const marker = new pc.Entity('MeasurementPoint');

        marker.addComponent('render', {
            type: 'sphere',
            castShadows: false,
            receiveShadows: false
        });

        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.emissive = color;
        material.emissiveIntensity = 0.7;
        material.update();

        if (marker.render) {
            marker.render.meshInstances[0].material = material;
        }

        marker.setPosition(position);
        marker.setLocalScale(size, size, size);

        const layers = editor.call('gizmo:layers') || [pc.LAYERID_UI];
        if (marker.render) {
            marker.render.layers = layers;
        }

        marker.tags.add('measurement');
        marker.tags.add('safety-tool');

        return marker;
    };

    /**
     * Create text label for measurement
     */
    const createLabel = (text: string, position: pc.Vec3): pc.Entity => {
        const labelEntity = new pc.Entity('MeasurementLabel');

        // Create a simple sphere as placeholder for now
        // TODO: Implement proper 3D text or screen-space label
        labelEntity.addComponent('render', {
            type: 'sphere',
            castShadows: false,
            receiveShadows: false
        });

        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(1, 1, 1);
        material.emissive = new pc.Color(1, 1, 1);
        material.opacity = 0.8;
        material.blendType = pc.BLEND_NORMAL;
        material.update();

        if (labelEntity.render) {
            labelEntity.render.meshInstances[0].material = material;
        }

        labelEntity.setPosition(position);
        labelEntity.setLocalScale(0.08, 0.08, 0.08);

        const layers = editor.call('gizmo:layers') || [pc.LAYERID_UI];
        if (labelEntity.render) {
            labelEntity.render.layers = layers;
        }

        labelEntity.tags.add('measurement');
        labelEntity.tags.add('safety-tool');

        // Store label text as custom property
        (labelEntity as any).labelText = text;

        return labelEntity;
    };

    /**
     * Calculate distance between two points
     */
    const calculateDistance = (p1: pc.Vec3, p2: pc.Vec3): number => {
        return p1.distance(p2);
    };

    /**
     * Calculate angle between three points (p2 is the vertex)
     */
    const calculateAngle = (p1: pc.Vec3, p2: pc.Vec3, p3: pc.Vec3): number => {
        const v1 = new pc.Vec3().sub2(p1, p2).normalize();
        const v2 = new pc.Vec3().sub2(p3, p2).normalize();
        const dot = v1.dot(v2);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        return angle * (180 / Math.PI); // Convert to degrees
    };

    /**
     * Calculate height from ground plane (XZ plane at y=0)
     */
    const calculateHeight = (point: pc.Vec3, groundY: number = 0): number => {
        return Math.abs(point.y - groundY);
    };

    /**
     * Create distance measurement
     */
    const createDistanceMeasurement = (points: pc.Vec3[]): Measurement | null => {
        if (points.length < 2) return null;

        const id = `measurement_${measurementIdCounter++}`;
        const distance = calculateDistance(points[0], points[1]);

        // Create container entity
        const container = new pc.Entity(`Distance_${id}`);
        app.root.addChild(container);

        // Create visual elements
        const line = createLine(points[0], points[1], new pc.Color(1, 1, 0));
        const marker1 = createPointMarker(points[0], new pc.Color(0, 1, 0));
        const marker2 = createPointMarker(points[1], new pc.Color(1, 0, 0));

        const midpoint = new pc.Vec3().add2(points[0], points[1]).mulScalar(0.5);
        const label = createLabel(`${distance.toFixed(3)}m`, midpoint);

        container.addChild(line);
        container.addChild(marker1);
        container.addChild(marker2);
        container.addChild(label);

        container.tags.add('measurement');
        container.tags.add('safety-tool');

        const measurement: Measurement = {
            id,
            type: MeasurementType.DISTANCE,
            points: [points[0].clone(), points[1].clone()],
            value: distance,
            label: `${distance.toFixed(3)}m`,
            visible: true,
            entity: container
        };

        measurements.set(id, measurement);

        editor.emit('measurement:created', measurement);

        console.log(`[Measurement] Distance: ${distance.toFixed(3)}m`);

        return measurement;
    };

    /**
     * Create angle measurement
     */
    const createAngleMeasurement = (points: pc.Vec3[]): Measurement | null => {
        if (points.length < 3) return null;

        const id = `measurement_${measurementIdCounter++}`;
        const angle = calculateAngle(points[0], points[1], points[2]);

        const container = new pc.Entity(`Angle_${id}`);
        app.root.addChild(container);

        // Create lines from vertex to both points
        const line1 = createLine(points[1], points[0], new pc.Color(1, 0.5, 0));
        const line2 = createLine(points[1], points[2], new pc.Color(1, 0.5, 0));

        const marker1 = createPointMarker(points[0], new pc.Color(0, 1, 0));
        const marker2 = createPointMarker(points[1], new pc.Color(1, 1, 0)); // Vertex
        const marker3 = createPointMarker(points[2], new pc.Color(1, 0, 0));

        const label = createLabel(`${angle.toFixed(1)}°`, points[1]);

        container.addChild(line1);
        container.addChild(line2);
        container.addChild(marker1);
        container.addChild(marker2);
        container.addChild(marker3);
        container.addChild(label);

        container.tags.add('measurement');
        container.tags.add('safety-tool');

        const measurement: Measurement = {
            id,
            type: MeasurementType.ANGLE,
            points: [points[0].clone(), points[1].clone(), points[2].clone()],
            value: angle,
            label: `${angle.toFixed(1)}°`,
            visible: true,
            entity: container
        };

        measurements.set(id, measurement);

        editor.emit('measurement:created', measurement);

        console.log(`[Measurement] Angle: ${angle.toFixed(1)}°`);

        return measurement;
    };

    /**
     * Create height measurement
     */
    const createHeightMeasurement = (point: pc.Vec3, groundY: number = 0): Measurement | null => {
        const id = `measurement_${measurementIdCounter++}`;
        const height = calculateHeight(point, groundY);

        const container = new pc.Entity(`Height_${id}`);
        app.root.addChild(container);

        const groundPoint = new pc.Vec3(point.x, groundY, point.z);
        const line = createLine(groundPoint, point, new pc.Color(0, 1, 1));
        const marker1 = createPointMarker(groundPoint, new pc.Color(0.5, 0.5, 0.5));
        const marker2 = createPointMarker(point, new pc.Color(0, 1, 1));

        const midpoint = new pc.Vec3().add2(groundPoint, point).mulScalar(0.5);
        const label = createLabel(`H: ${height.toFixed(3)}m`, midpoint);

        container.addChild(line);
        container.addChild(marker1);
        container.addChild(marker2);
        container.addChild(label);

        container.tags.add('measurement');
        container.tags.add('safety-tool');

        const measurement: Measurement = {
            id,
            type: MeasurementType.HEIGHT,
            points: [point.clone()],
            value: height,
            label: `H: ${height.toFixed(3)}m`,
            visible: true,
            entity: container
        };

        measurements.set(id, measurement);

        editor.emit('measurement:created', measurement);

        console.log(`[Measurement] Height: ${height.toFixed(3)}m`);

        return measurement;
    };

    /**
     * Start measurement mode
     */
    editor.method('measurement:start', (type: MeasurementType) => {
        activeMeasurementType = type;
        activePoints = [];
        console.log(`[Measurement] Started ${type} measurement mode`);
        editor.emit('measurement:mode:changed', type);
    });

    /**
     * Stop measurement mode
     */
    editor.method('measurement:stop', () => {
        activeMeasurementType = null;
        activePoints = [];
        console.log('[Measurement] Stopped measurement mode');
        editor.emit('measurement:mode:changed', null);
    });

    /**
     * Add point to active measurement
     */
    editor.method('measurement:addPoint', (point: pc.Vec3) => {
        if (!activeMeasurementType) return;

        activePoints.push(point.clone());

        // Create measurement when we have enough points
        let measurement: Measurement | null = null;

        switch (activeMeasurementType) {
            case MeasurementType.DISTANCE:
                if (activePoints.length === 2) {
                    measurement = createDistanceMeasurement(activePoints);
                    activePoints = [];
                }
                break;

            case MeasurementType.ANGLE:
                if (activePoints.length === 3) {
                    measurement = createAngleMeasurement(activePoints);
                    activePoints = [];
                }
                break;

            case MeasurementType.HEIGHT:
                if (activePoints.length === 1) {
                    measurement = createHeightMeasurement(activePoints[0]);
                    activePoints = [];
                }
                break;
        }

        editor.emit('measurement:point:added', point, activePoints.length);
    });

    /**
     * Delete measurement
     */
    editor.method('measurement:delete', (id: string) => {
        const measurement = measurements.get(id);
        if (!measurement) return;

        if (measurement.entity.parent) {
            measurement.entity.parent.removeChild(measurement.entity);
        }
        measurement.entity.destroy();

        measurements.delete(id);

        editor.emit('measurement:deleted', id);
        console.log(`[Measurement] Deleted ${id}`);
    });

    /**
     * Clear all measurements
     */
    editor.method('measurement:clearAll', () => {
        measurements.forEach(measurement => {
            if (measurement.entity.parent) {
                measurement.entity.parent.removeChild(measurement.entity);
            }
            measurement.entity.destroy();
        });

        measurements.clear();
        editor.emit('measurement:cleared');
        console.log('[Measurement] Cleared all measurements');
    });

    /**
     * Toggle measurement visibility
     */
    editor.method('measurement:toggle', (id: string, visible: boolean) => {
        const measurement = measurements.get(id);
        if (!measurement) return;

        measurement.visible = visible;
        measurement.entity.enabled = visible;
    });

    /**
     * Get all measurements
     */
    editor.method('measurement:getAll', () => {
        return Array.from(measurements.values());
    });

    /**
     * Export measurements to JSON
     */
    editor.method('measurement:export', () => {
        const data = Array.from(measurements.values()).map(m => ({
            id: m.id,
            type: m.type,
            points: m.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
            value: m.value,
            label: m.label
        }));

        return JSON.stringify(data, null, 2);
    });

    // Integrate with 3D picking
    editor.on('viewport:pick:3d:point', (result: any) => {
        if (!activeMeasurementType || !result.point) return;

        editor.call('measurement:addPoint', result.point);
    });

    // Cleanup on scene unload
    editor.on('scene:unload', () => {
        editor.call('measurement:clearAll');
    });

    console.log('[Safety Tools] Measurement tools initialized');
});
