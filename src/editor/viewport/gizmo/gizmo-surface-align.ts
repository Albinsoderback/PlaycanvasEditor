/**
 * Surface Alignment Gizmo
 *
 * Automatically aligns selected entities to surface normals
 * for accurate component placement on proxy meshes and models.
 */

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return;

    let alignmentMode = false;
    let previewEntity: pc.Entity | null = null;
    let alignmentOffset = 0.0; // Distance to offset from surface
    let selectedEntity: pc.Entity | null = null;
    let lastPickResult: any = null;

    /**
     * Create preview ghost of entity at alignment position
     */
    const createAlignmentPreview = (entity: pc.Entity): pc.Entity => {
        const preview = new pc.Entity('AlignmentPreview');

        // Copy render component if exists
        if (entity.render) {
            preview.addComponent('render', {
                type: entity.render.type,
                castShadows: false,
                receiveShadows: false
            });

            // Make semi-transparent
            if (preview.render) {
                const material = new pc.StandardMaterial();
                material.diffuse = new pc.Color(0.2, 0.8, 1); // Cyan
                material.opacity = 0.4;
                material.blendType = pc.BLEND_NORMAL;
                material.emissive = new pc.Color(0.2, 0.8, 1);
                material.emissiveIntensity = 0.3;
                material.update();

                preview.render.meshInstances.forEach((mi: pc.MeshInstance) => {
                    mi.material = material;
                });

                // Use gizmo layers
                const layers = editor.call('gizmo:layers') || [pc.LAYERID_UI];
                preview.render.layers = layers;
            }
        }

        // Copy transform
        preview.setLocalPosition(entity.getLocalPosition());
        preview.setLocalRotation(entity.getLocalRotation());
        preview.setLocalScale(entity.getLocalScale());

        preview.tags.add('alignment-preview');
        preview.tags.add('safety-tool');

        return preview;
    };

    /**
     * Calculate alignment transform from surface normal
     */
    const calculateAlignmentTransform = (
        point: pc.Vec3,
        normal: pc.Vec3,
        entity: pc.Entity
    ): { position: pc.Vec3; rotation: pc.Quat } => {
        // Position: point + normal * offset
        const position = new pc.Vec3().add2(point, new pc.Vec3().copy(normal).mulScalar(alignmentOffset));

        // Rotation: align entity's up (Y) axis with surface normal
        const rotation = new pc.Quat();
        const up = new pc.Vec3(0, 1, 0);

        if (normal.length() > 0) {
            const normalizedNormal = normal.clone().normalize();

            // Calculate rotation to align up vector with normal
            rotation.setFromUnitVectors(up, normalizedNormal);

            // Preserve entity's original rotation around the normal axis
            const entityRotation = entity.getRotation();
            const forward = new pc.Vec3(0, 0, 1);
            entityRotation.transformVector(forward, forward);

            // Project forward onto the plane perpendicular to normal
            const dot = forward.dot(normalizedNormal);
            const projectedForward = new pc.Vec3().sub2(forward, new pc.Vec3().copy(normalizedNormal).mulScalar(dot));

            if (projectedForward.length() > 0.001) {
                projectedForward.normalize();

                // Calculate tangent rotation
                const tangent = new pc.Vec3().cross(normalizedNormal, projectedForward).normalize();
                const bitangent = new pc.Vec3().cross(tangent, normalizedNormal).normalize();

                // Build rotation matrix
                const m = new pc.Mat4();
                m.data[0] = tangent.x;
                m.data[1] = tangent.y;
                m.data[2] = tangent.z;
                m.data[4] = normalizedNormal.x;
                m.data[5] = normalizedNormal.y;
                m.data[6] = normalizedNormal.z;
                m.data[8] = bitangent.x;
                m.data[9] = bitangent.y;
                m.data[10] = bitangent.z;

                rotation.setFromMat4(m);
            }
        }

        return { position, rotation };
    };

    /**
     * Update preview based on current pick result
     */
    const updateAlignmentPreview = () => {
        if (!alignmentMode || !selectedEntity || !lastPickResult || !lastPickResult.point) {
            if (previewEntity && previewEntity.enabled) {
                previewEntity.enabled = false;
            }
            return;
        }

        // Create preview if it doesn't exist
        if (!previewEntity) {
            previewEntity = createAlignmentPreview(selectedEntity);
            app.root.addChild(previewEntity);
        }

        // Calculate alignment
        const transform = calculateAlignmentTransform(
            lastPickResult.point,
            lastPickResult.normal || new pc.Vec3(0, 1, 0),
            selectedEntity
        );

        // Update preview
        previewEntity.setPosition(transform.position);
        previewEntity.setRotation(transform.rotation);
        previewEntity.setLocalScale(selectedEntity.getLocalScale());
        previewEntity.enabled = true;
    };

    /**
     * Apply alignment to selected entity
     */
    const applyAlignment = () => {
        if (!selectedEntity || !lastPickResult || !lastPickResult.point) {
            console.warn('[Surface Align] No valid alignment to apply');
            return;
        }

        const transform = calculateAlignmentTransform(
            lastPickResult.point,
            lastPickResult.normal || new pc.Vec3(0, 1, 0),
            selectedEntity
        );

        // Record undo
        const history = editor.call('history:add', {
            name: 'entity.align',
            undo: () => {
                const item = editor.call('entities:get', selectedEntity.getGuid());
                if (!item) return;

                item.history.enabled = false;
                item.set('position', selectedEntity.getPosition().data);
                item.set('rotation', selectedEntity.getRotation().data);
                item.history.enabled = true;
            },
            redo: () => {
                const item = editor.call('entities:get', selectedEntity.getGuid());
                if (!item) return;

                item.history.enabled = false;
                item.set('position', transform.position.data);
                item.set('rotation', [transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w]);
                item.history.enabled = true;
            }
        });

        // Apply transform
        selectedEntity.setPosition(transform.position);
        selectedEntity.setRotation(transform.rotation);

        // Hide preview
        if (previewEntity) {
            previewEntity.enabled = false;
        }

        editor.emit('surface:aligned', selectedEntity, lastPickResult);

        console.log(`[Surface Align] Applied alignment to ${selectedEntity.name}`);
    };

    /**
     * Enable/disable alignment mode
     */
    editor.method('gizmo:surfaceAlign:enable', (enabled: boolean) => {
        alignmentMode = enabled;

        if (!enabled) {
            // Hide preview
            if (previewEntity) {
                previewEntity.enabled = false;
            }
            lastPickResult = null;
        } else {
            // Get selected entity
            const selection = editor.call('selector:items');
            if (selection && selection.length > 0) {
                const entityObserver = selection[0];
                selectedEntity = editor.call('entities:get', entityObserver.get('resource_id'));
            }
        }

        editor.emit('gizmo:surfaceAlign:mode', enabled);
        console.log(`[Surface Align] Mode ${enabled ? 'enabled' : 'disabled'}`);
    });

    /**
     * Set alignment offset distance
     */
    editor.method('gizmo:surfaceAlign:offset', (offset: number) => {
        alignmentOffset = offset;
        updateAlignmentPreview();
        console.log(`[Surface Align] Offset set to ${offset.toFixed(3)}m`);
    });

    /**
     * Get current alignment mode state
     */
    editor.method('gizmo:surfaceAlign:isActive', () => {
        return alignmentMode;
    });

    /**
     * Apply current alignment
     */
    editor.method('gizmo:surfaceAlign:apply', () => {
        applyAlignment();
    });

    // Listen to 3D pick events
    editor.on('viewport:pick:3d:point', (result: any) => {
        if (!alignmentMode) return;

        lastPickResult = result;
        updateAlignmentPreview();
    });

    // Listen to selection changes
    editor.on('selector:change', (type: string, items: any[]) => {
        if (!alignmentMode) return;

        if (type === 'entity' && items.length > 0) {
            const entityObserver = items[0];
            selectedEntity = editor.call('entities:get', entityObserver.get('resource_id'));

            // Recreate preview for new entity
            if (previewEntity) {
                if (previewEntity.parent) {
                    previewEntity.parent.removeChild(previewEntity);
                }
                previewEntity.destroy();
                previewEntity = null;
            }

            updateAlignmentPreview();
        } else {
            selectedEntity = null;
            if (previewEntity) {
                previewEntity.enabled = false;
            }
        }
    });

    // Handle click to apply alignment
    editor.on('viewport:tap:click', (tap) => {
        if (!alignmentMode || tap.button !== 0) return;

        // Check if we have a valid alignment
        if (lastPickResult && lastPickResult.point) {
            applyAlignment();
        }
    });

    // Hotkey: A for alignment mode toggle
    editor.on('hotkey:a', () => {
        const currentMode = editor.call('gizmo:surfaceAlign:isActive');
        editor.call('gizmo:surfaceAlign:enable', !currentMode);
    });

    // Cleanup
    editor.on('scene:unload', () => {
        if (previewEntity && previewEntity.parent) {
            previewEntity.parent.removeChild(previewEntity);
        }
        if (previewEntity) {
            previewEntity.destroy();
        }
        previewEntity = null;
        selectedEntity = null;
        lastPickResult = null;
        alignmentMode = false;
    });

    console.log('[Safety Tools] Surface alignment gizmo initialized (Hotkey: A)');
});
