/**
 * Proxy Mesh Generator for Gaussian Splats
 *
 * Generates simplified collision meshes from gsplat bounding boxes
 * to enable accurate component placement without losing visual quality.
 */

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return;

    /**
     * Generate a simple box proxy mesh from gsplat AABB
     */
    const generateBoxProxy = (gsplatEntity: pc.Entity): pc.Entity | null => {
        if (!gsplatEntity.gsplat) {
            console.warn('[Proxy Mesh] Entity does not have a gsplat component');
            return null;
        }

        const aabb = gsplatEntity.gsplat.instance?.meshInstance?.aabb;
        if (!aabb) {
            console.warn('[Proxy Mesh] Could not get AABB from gsplat');
            return null;
        }

        // Create proxy entity
        const proxyEntity = new pc.Entity(`${gsplatEntity.name}_Proxy`);

        // Add render component with box
        proxyEntity.addComponent('render', {
            type: 'box',
            castShadows: false,
            receiveShadows: false
        });

        // Create semi-transparent material for visualization
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.2, 0.8, 0.2); // Green
        material.opacity = 0.3;
        material.blendType = pc.BLEND_NORMAL;
        material.depthWrite = false;
        material.update();

        if (proxyEntity.render) {
            proxyEntity.render.meshInstances[0].material = material;
        }

        // Position and scale to match AABB
        const center = aabb.center;
        const halfExtents = aabb.halfExtents;

        proxyEntity.setPosition(center);
        proxyEntity.setLocalScale(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);

        // Match rotation of gsplat entity
        proxyEntity.setRotation(gsplatEntity.getRotation());

        // Add collision component for raycasting
        proxyEntity.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.5, 0.5, 0.5) // Will be scaled by entity scale
        });

        // Tag as proxy mesh
        proxyEntity.tags.add('proxy-mesh');
        proxyEntity.tags.add('safety-tool');

        // Store reference to original gsplat
        (proxyEntity as any).sourceGsplat = gsplatEntity;

        return proxyEntity;
    };

    /**
     * Generate a more detailed voxel-based proxy (future implementation)
     */
    const generateVoxelProxy = (gsplatEntity: pc.Entity, voxelSize: number = 0.1): pc.Entity | null => {
        // TODO: Implement voxel-based surface extraction
        // This would require access to the underlying point cloud data
        console.warn('[Proxy Mesh] Voxel-based proxy generation not yet implemented');
        return generateBoxProxy(gsplatEntity);
    };

    /**
     * Toggle proxy mesh visibility
     */
    const toggleProxyVisibility = (proxyEntity: pc.Entity, visible: boolean) => {
        if (proxyEntity.render) {
            proxyEntity.render.enabled = visible;
        }
    };

    /**
     * Make proxy mesh wireframe only
     */
    const setProxyWireframe = (proxyEntity: pc.Entity, wireframe: boolean) => {
        if (!proxyEntity.render) return;

        const material = proxyEntity.render.meshInstances[0]?.material as pc.StandardMaterial;
        if (material) {
            if (wireframe) {
                material.opacity = 0.1;
                material.emissive = new pc.Color(0.2, 0.8, 0.2);
                material.emissiveIntensity = 0.3;
            } else {
                material.opacity = 0.3;
                material.emissive = new pc.Color(0, 0, 0);
                material.emissiveIntensity = 0;
            }
            material.update();
        }
    };

    /**
     * Update proxy mesh to match gsplat transform
     */
    const updateProxyTransform = (proxyEntity: pc.Entity) => {
        const sourceGsplat = (proxyEntity as any).sourceGsplat;
        if (!sourceGsplat) return;

        const aabb = sourceGsplat.gsplat?.instance?.meshInstance?.aabb;
        if (!aabb) return;

        const center = aabb.center;
        const halfExtents = aabb.halfExtents;

        proxyEntity.setPosition(center);
        proxyEntity.setLocalScale(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
        proxyEntity.setRotation(sourceGsplat.getRotation());
    };

    /**
     * Remove proxy mesh
     */
    const removeProxy = (proxyEntity: pc.Entity) => {
        if (proxyEntity.parent) {
            proxyEntity.parent.removeChild(proxyEntity);
        }
        proxyEntity.destroy();
    };

    /**
     * Find all proxy meshes in scene
     */
    const findAllProxyMeshes = (): pc.Entity[] => {
        const proxies: pc.Entity[] = [];
        const root = app.root;

        const traverse = (entity: pc.Entity) => {
            if (entity.tags.has('proxy-mesh')) {
                proxies.push(entity);
            }
            entity.children.forEach(traverse);
        };

        traverse(root);
        return proxies;
    };

    /**
     * Find proxy for specific gsplat
     */
    const findProxyForGsplat = (gsplatEntity: pc.Entity): pc.Entity | null => {
        const proxies = findAllProxyMeshes();
        return proxies.find(proxy => (proxy as any).sourceGsplat === gsplatEntity) || null;
    };

    // Register API methods
    editor.method('tools:proxy:generate', (entity: pc.Entity, type: string = 'box') => {
        if (!entity || !entity.gsplat) {
            console.error('[Proxy Mesh] Invalid entity or not a gsplat');
            return null;
        }

        // Check if proxy already exists
        const existing = findProxyForGsplat(entity);
        if (existing) {
            console.warn('[Proxy Mesh] Proxy already exists for this gsplat');
            return existing;
        }

        let proxy: pc.Entity | null = null;

        switch (type) {
            case 'box':
                proxy = generateBoxProxy(entity);
                break;
            case 'voxel':
                proxy = generateVoxelProxy(entity);
                break;
            default:
                console.warn(`[Proxy Mesh] Unknown proxy type: ${type}`);
                proxy = generateBoxProxy(entity);
        }

        if (proxy) {
            // Add to scene
            entity.parent?.addChild(proxy);

            // Emit event
            editor.emit('tools:proxy:created', proxy, entity);

            console.log(`[Proxy Mesh] Created ${type} proxy for ${entity.name}`);
        }

        return proxy;
    });

    editor.method('tools:proxy:toggle', (proxyEntity: pc.Entity, visible: boolean) => {
        toggleProxyVisibility(proxyEntity, visible);
    });

    editor.method('tools:proxy:wireframe', (proxyEntity: pc.Entity, wireframe: boolean) => {
        setProxyWireframe(proxyEntity, wireframe);
    });

    editor.method('tools:proxy:update', (proxyEntity: pc.Entity) => {
        updateProxyTransform(proxyEntity);
    });

    editor.method('tools:proxy:remove', (proxyEntity: pc.Entity) => {
        removeProxy(proxyEntity);
    });

    editor.method('tools:proxy:findAll', () => {
        return findAllProxyMeshes();
    });

    editor.method('tools:proxy:findForGsplat', (gsplatEntity: pc.Entity) => {
        return findProxyForGsplat(gsplatEntity);
    });

    // Auto-update proxies when gsplats transform
    editor.on('viewport:update', () => {
        const proxies = findAllProxyMeshes();
        proxies.forEach(proxy => {
            const sourceGsplat = (proxy as any).sourceGsplat;
            if (sourceGsplat && sourceGsplat.gsplat) {
                // Check if gsplat has moved/scaled
                updateProxyTransform(proxy);
            }
        });
    });

    console.log('[Safety Tools] Proxy mesh generator initialized');
});
