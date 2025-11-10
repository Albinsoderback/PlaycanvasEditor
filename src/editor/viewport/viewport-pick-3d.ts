/**
 * Enhanced 3D Picking System
 *
 * Extends the basic picking to provide:
 * - 3D intersection points
 * - Surface normals
 * - Distance from camera
 * - Visual markers
 */

import { FORCE_PICK_TAG } from '../../core/constants.ts';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return;

    // Ray for raycasting
    const ray = new pc.Ray();
    const cameraPosition = new pc.Vec3();

    // Pick result interface
    interface PickResult3D {
        entity: pc.Entity | null;
        point: pc.Vec3 | null;
        normal: pc.Vec3 | null;
        distance: number;
        meshInstance: pc.MeshInstance | null;
    }

    // Current pick result
    let currentPickResult: PickResult3D = {
        entity: null,
        point: null,
        normal: null,
        distance: 0,
        meshInstance: null
    };

    // Visual marker for picked point
    let pickMarker: pc.Entity | null = null;
    let pickMarkerEnabled = false;

    /**
     * Create visual marker for picked points
     */
    const createPickMarker = () => {
        if (pickMarker) return pickMarker;

        pickMarker = new pc.Entity('PickMarker');
        pickMarker.addComponent('render', {
            type: 'sphere',
            castShadows: false,
            receiveShadows: false,
            material: new pc.StandardMaterial()
        });

        if (pickMarker.render?.material) {
            pickMarker.render.material.diffuse = new pc.Color(1, 0.4, 0); // Orange
            pickMarker.render.material.emissive = new pc.Color(1, 0.4, 0);
            pickMarker.render.material.emissiveIntensity = 0.5;
            pickMarker.render.material.opacity = 0.8;
            pickMarker.render.material.blendType = pc.BLEND_NORMAL;
            pickMarker.render.material.update();
        }

        pickMarker.setLocalScale(0.05, 0.05, 0.05);

        // Add to special layer that's always visible
        const layers = editor.call('gizmo:layers') || [pc.LAYERID_UI];
        if (pickMarker.render) {
            pickMarker.render.layers = layers;
        }

        return pickMarker;
    };

    /**
     * Show pick marker at position
     */
    const showPickMarker = (position: pc.Vec3) => {
        if (!pickMarkerEnabled) return;

        if (!pickMarker) {
            createPickMarker();
            app.root.addChild(pickMarker);
        }

        pickMarker.setPosition(position);
        pickMarker.enabled = true;
    };

    /**
     * Hide pick marker
     */
    const hidePickMarker = () => {
        if (pickMarker) {
            pickMarker.enabled = false;
        }
    };

    /**
     * Convert screen coordinates to world ray
     */
    const screenToRay = (x: number, y: number, camera: pc.CameraComponent): pc.Ray => {
        const canvas = app.graphicsDevice.canvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Convert to normalized device coordinates (-1 to 1)
        const deviceX = (x / width) * 2 - 1;
        const deviceY = ((height - y) / height) * 2 - 1;

        // Create ray from camera through screen point
        camera.screenToWorld(x, y, camera.farClip, ray.direction);
        ray.origin.copy(camera.entity.getPosition());
        ray.direction.sub(ray.origin).normalize();

        return ray;
    };

    /**
     * Perform raycast against mesh instances
     */
    const raycastMeshInstances = (ray: pc.Ray, meshInstances: pc.MeshInstance[]): PickResult3D => {
        let closestDistance = Infinity;
        let result: PickResult3D = {
            entity: null,
            point: null,
            normal: null,
            distance: 0,
            meshInstance: null
        };

        for (const meshInstance of meshInstances) {
            if (!meshInstance.node || !meshInstance.visible) continue;

            // Get entity from node
            let entity: any = meshInstance.node;
            while (!(entity instanceof pc.Entity) && entity && entity.parent) {
                entity = entity.parent;
            }
            if (!entity || !(entity instanceof pc.Entity)) continue;

            // Check AABB first for early rejection
            const aabb = meshInstance.aabb;
            if (!aabb.intersectsRay(ray)) continue;

            // For detailed intersection, we need to check triangles
            // Since PlayCanvas doesn't expose this directly, we'll use AABB intersection
            // and estimate the intersection point
            const intersectionPoint = new pc.Vec3();
            if (aabb.intersectsRay(ray, intersectionPoint)) {
                const distance = intersectionPoint.distance(ray.origin);

                if (distance < closestDistance) {
                    closestDistance = distance;

                    // Calculate approximate normal from AABB
                    const center = aabb.center;
                    const halfExtents = aabb.halfExtents;
                    const localPoint = intersectionPoint.clone().sub(center);

                    // Find which face of the AABB we hit
                    const normal = new pc.Vec3();
                    const absX = Math.abs(localPoint.x / halfExtents.x);
                    const absY = Math.abs(localPoint.y / halfExtents.y);
                    const absZ = Math.abs(localPoint.z / halfExtents.z);

                    if (absX > absY && absX > absZ) {
                        normal.set(Math.sign(localPoint.x), 0, 0);
                    } else if (absY > absZ) {
                        normal.set(0, Math.sign(localPoint.y), 0);
                    } else {
                        normal.set(0, 0, Math.sign(localPoint.z));
                    }

                    // Transform normal to world space
                    const worldTransform = meshInstance.node.getWorldTransform();
                    worldTransform.transformVector(normal, normal);
                    normal.normalize();

                    result = {
                        entity,
                        point: intersectionPoint,
                        normal,
                        distance,
                        meshInstance
                    };
                }
            }
        }

        return result;
    };

    /**
     * Enhanced pick method with 3D data
     */
    editor.method('viewport:pick:3d', (x: number, y: number, callback: (result: PickResult3D) => void) => {
        const camera = editor.call('camera:current');
        if (!camera) {
            callback(currentPickResult);
            return;
        }

        // Create ray from screen coordinates
        screenToRay(x, y, camera.camera);
        cameraPosition.copy(camera.entity.getPosition());

        // Get all mesh instances in the scene
        const scene = app.scene;
        const meshInstances: pc.MeshInstance[] = [];

        // Collect mesh instances from draw calls
        scene.drawCalls.forEach((drawCall: any) => {
            if (drawCall.visible && drawCall.drawToDepth) {
                meshInstances.push(drawCall);
            }
        });

        // Perform raycast
        const result = raycastMeshInstances(ray, meshInstances);

        currentPickResult = result;

        // Update visual marker
        if (result.point) {
            showPickMarker(result.point);
        } else {
            hidePickMarker();
        }

        callback(result);
    });

    /**
     * Enable/disable pick marker
     */
    editor.method('viewport:pick:marker', (enabled: boolean) => {
        pickMarkerEnabled = enabled;
        if (!enabled) {
            hidePickMarker();
        }
    });

    /**
     * Get current pick result
     */
    editor.method('viewport:pick:3d:current', () => {
        return currentPickResult;
    });

    /**
     * Clear current pick result
     */
    editor.method('viewport:pick:3d:clear', () => {
        currentPickResult = {
            entity: null,
            point: null,
            normal: null,
            distance: 0,
            meshInstance: null
        };
        hidePickMarker();
    });

    /**
     * Integrate with existing pick events
     */
    let enabled3DPicking = false;

    editor.method('viewport:pick:3d:enable', (enabled: boolean) => {
        enabled3DPicking = enabled;
    });

    // Listen to existing pick events and enhance them
    editor.on('viewport:tap:click', (tap) => {
        if (!enabled3DPicking) return;

        editor.call('viewport:pick:3d', tap.x, tap.y, (result: PickResult3D) => {
            if (result.point) {
                editor.emit('viewport:pick:3d:point', result);

                // Log to console for debugging
                console.log('3D Pick Result:', {
                    entity: result.entity?.name,
                    point: result.point.toString(),
                    normal: result.normal?.toString(),
                    distance: result.distance.toFixed(2) + 'm'
                });
            }
        });
    });

    // Cleanup on scene unload
    editor.on('scene:unload', () => {
        if (pickMarker && pickMarker.parent) {
            pickMarker.parent.removeChild(pickMarker);
        }
        hidePickMarker();
        currentPickResult = {
            entity: null,
            point: null,
            normal: null,
            distance: 0,
            meshInstance: null
        };
    });

    // Enable by default
    editor.call('viewport:pick:3d:enable', true);
    editor.call('viewport:pick:marker', true);

    console.log('[Safety Tools] Enhanced 3D picking system initialized');
});
