# Safety Component Visualization - Implementation Roadmap

## Project Goal

Create a complete tool for risk assessment and safety concept visualization by improving the workflow of placing safety components (light curtains, laser scanners, guard fences) onto Gaussian splat scans of machines and production lines.

## Current Workflow

1. **Capture** → Create Gaussian splats with Polycam
2. **Model** → Create safety components in Blender
3. **Import** → Load both into PlayCanvas Editor
4. **Place** → Manually position components on gsplats
5. **Visualize** → Present safety concepts for risk assessment

## Core Challenge

**Gaussian splats are point clouds without geometric surfaces**, making it difficult to:
- ❌ Accurately place components
- ❌ Align components to surfaces
- ❌ Match lighting between scans and components
- ❌ Measure distances and clearances
- ❌ Verify safety compliance

## Solution Architecture

### Phase 1: Foundation - Enhanced Placement Tools (4-6 weeks)

#### 1.1 Enhanced Raycasting & Intersection Detection
**Priority**: HIGH | **Impact**: HIGH | **Effort**: MEDIUM

**Implementation**:
- Modify `src/editor/viewport/viewport-pick.ts`
- Extend picker to return 3D intersection point
- Return surface normal (from proxy mesh)
- Return distance from camera

**Technical Details**:
```javascript
interface PickResult {
    entity: Entity;
    point: Vec3;        // 3D intersection point
    normal: Vec3;       // Surface normal
    distance: number;   // Camera distance
    meshInstance: MeshInstance;
}
```

**Files to Modify**:
- `src/editor/viewport/viewport-pick.ts` (primary)
- `src/editor/entities/entities-pick.ts` (integration)

**Deliverables**:
- ✅ Click anywhere in viewport → see 3D coordinates
- ✅ Visual marker at intersection point
- ✅ Display coordinates in UI

---

#### 1.2 Proxy Mesh Generation System
**Priority**: HIGH | **Impact**: HIGH | **Effort**: MEDIUM-HIGH

**Purpose**: Create simplified collision meshes from gsplat AABBs for placement assistance

**Implementation Options**:

**Option A: Simple AABB Box** (Quick Win)
- Generate box matching gsplat bounding box
- Fast, works immediately
- Least accurate but functional

**Option B: Manual Trace Tool** (Most Practical)
- User draws simplified mesh outline
- Most accurate for complex shapes
- Requires tool development

**Option C: Voxel-Based** (Advanced)
- Voxelize point cloud
- Extract marching cubes surface
- Best automatic quality, complex implementation

**Recommended**: Start with A, add B for production use

**New Files**:
- `src/editor/tools/proxy-mesh-generator.ts`
- `src/editor/viewport/tools/mesh-trace-tool.ts`

**Features**:
- Generate proxy mesh from gsplat AABB
- Manual editing/refinement tools
- Save/load proxy meshes with project
- Toggle visibility of proxy mesh

**Deliverables**:
- ✅ Right-click gsplat → "Generate Proxy Mesh"
- ✅ Simple box mesh created
- ✅ Can be used for raycasting
- ✅ Visible/invisible toggle

---

#### 1.3 Measurement Tools
**Priority**: MEDIUM | **Impact**: MEDIUM | **Effort**: LOW-MEDIUM

**Purpose**: Verify safety distances and clearances accurately

**Tools to Implement**:

1. **Distance Measurement**
   - Click two points → show distance
   - Multi-point path measurement
   - Snap to grid/entities/vertices
   - Display in meters/mm/cm

2. **Angle Measurement**
   - Select three points
   - Show angle between them
   - Useful for alignment verification

3. **Height Reference**
   - Measure from ground plane
   - Show vertical rulers
   - Reference heights for safety zones

**New Files**:
- `src/editor/viewport/tools/measurement-tool.ts`
- `src/editor/viewport/tools/distance-tool.ts`
- `src/editor/viewport/tools/angle-tool.ts`

**UI Integration**:
- Toolbar button: "Measure" (with icon)
- Measurement mode toggle
- Persistent measurements (save with scene)
- Export measurements to report

**Deliverables**:
- ✅ Distance tool working
- ✅ Measurements displayed in viewport
- ✅ Can save/load measurements
- ✅ Export to CSV/JSON

---

#### 1.4 Surface Alignment Gizmo
**Priority**: HIGH | **Impact**: HIGH | **Effort**: MEDIUM

**Purpose**: Automatically orient components to surface normals

**Implementation**:

**New File**: `src/editor/viewport/gizmo/gizmo-surface-align.ts`

**Workflow**:
1. Select safety component entity
2. Activate "Surface Align" mode
3. Hover over target surface (proxy mesh or model)
4. Shows preview of aligned placement
5. Click to apply alignment

**Features**:
- Auto-rotate to match surface normal
- Offset from surface (e.g., 10cm above)
- Preview before applying
- Undo/redo support

**Integration**:
- Add to gizmo toolbar
- Hotkey: `A` (for Align)
- Works with proxy meshes

**Deliverables**:
- ✅ Surface alignment mode working
- ✅ Visual preview of alignment
- ✅ One-click alignment to normals
- ✅ Configurable offset distance

---

### Phase 2: Smart Workflows (4-6 weeks)

#### 2.1 Component Library & Templates
**Priority**: MEDIUM | **Impact**: MEDIUM | **Effort**: LOW-MEDIUM

**Purpose**: Standardize and speed up component placement

**Features**:
- Drag-and-drop component catalog
- Preset configurations (e.g., "Standard Light Curtain Setup")
- Save custom templates
- Metadata: manufacturer, specs, safety ratings
- Auto-naming conventions

**Implementation**:
- `src/editor/components/safety-library.ts`
- `src/editor/components/component-templates.ts`

**UI**:
- New panel: "Safety Components Library"
- Categories: Light Curtains, Laser Scanners, Guards, Fences
- Search and filter
- Preview thumbnails

---

#### 2.2 Snap System Enhancement
**Priority**: MEDIUM | **Impact**: MEDIUM | **Effort**: MEDIUM

**Purpose**: Improve placement precision

**Features**:
- Snap to proxy mesh surfaces
- Snap to other components
- Smart alignment suggestions
- Grid projection on surfaces
- Local coordinate system per surface

**Files to Modify**:
- `src/editor/viewport/gizmo/gizmo.ts`
- `src/editor/viewport/gizmo/gizmo-transform.ts`

---

#### 2.3 Lighting Match Tool
**Priority**: LOW-MEDIUM | **Impact**: MEDIUM | **Effort**: MEDIUM-HIGH

**Purpose**: Match component lighting to gsplat capture lighting

**Approach 1: Manual Matching** (Simple)
- Extract dominant colors from gsplat
- Suggest directional light parameters
- User tweaks manually

**Approach 2: Spherical Harmonics** (Advanced)
- If gsplat has SH data, use it
- Auto-configure environment lighting
- Match ambient and directional lights

**Deliverables**:
- ✅ Analyze gsplat lighting
- ✅ Suggest light configuration
- ✅ One-click apply lighting

---

### Phase 3: Intelligence & Automation (6-8 weeks)

#### 3.1 Point Cloud Surface Extraction
**Priority**: MEDIUM-LOW | **Impact**: HIGH | **Effort**: HIGH

**Purpose**: Extract actual surface data from gsplat point clouds

**Challenges**:
- Gsplats don't expose individual points currently
- Need to work with underlying ply data

**Approach**:
- Load `.ply` file separately
- Estimate surface normals (PCA, neighborhood analysis)
- Detect planar surfaces (RANSAC)
- Create editable surface regions

**Technology Stack**:
- Point cloud library integration
- WebAssembly for performance
- Worker threads for processing

**New Files**:
- `src/editor/workers/point-cloud-processor.worker.ts`
- `src/editor/tools/surface-detector.ts`

**Deliverables**:
- ✅ Extract surfaces from point cloud
- ✅ Calculate normals
- ✅ Highlight detected surfaces
- ✅ Export surface data

---

#### 3.2 Automated Safety Component Suggestion
**Priority**: LOW | **Impact**: HIGH | **Effort**: HIGH

**Purpose**: AI-assisted safety planning

**Features**:
- Analyze gsplat geometry
- Identify potential hazard zones
- Suggest optimal component placement
- Coverage analysis
- Gap detection

**ML Approach**:
- Train on existing safety setups
- Pattern recognition for common scenarios
- Risk heatmap visualization

---

#### 3.3 Compliance Validation
**Priority**: MEDIUM | **Impact**: HIGH | **Effort**: MEDIUM-HIGH

**Purpose**: Real-time safety standard compliance checking

**Standards to Support**:
- ISO 13849 (Safety of machinery)
- IEC 62061 (Functional safety)
- ISO 13855 (Positioning of safeguards)

**Features**:
- Automatic safety distance checking
- Coverage gap highlighting
- Compliance report generation
- Export to PDF

**Implementation**:
- `src/editor/tools/compliance-checker.ts`
- Rule-based validation engine
- Visual warnings and errors

---

### Phase 4: Professional Workflow (4-6 weeks)

#### 4.1 Annotation & Documentation System
**Purpose**: Complete project documentation

**Features**:
- Add labels, dimensions, notes to scene
- Risk level indicators (color-coded)
- Safety compliance checklist
- Photo/screenshot annotations
- Export to PDF report

---

#### 4.2 Scenario Comparison
**Purpose**: Compare multiple safety configurations

**Features**:
- Save multiple configurations per project
- A/B comparison view (side-by-side)
- Cost vs. risk analysis
- Version history
- Diff visualization

---

#### 4.3 Export & Reporting
**Purpose**: Professional deliverables

**Formats**:
- PDF report with screenshots and measurements
- Excel/CSV data export
- 3D model export (glb/fbx) with annotations
- Interactive web viewer

---

## Implementation Priority Matrix

### Must Have (Phase 1)
1. ✅ Enhanced picking with 3D intersection points
2. ✅ Proxy mesh generation tool
3. ✅ Measurement tools (distance, angle)
4. ✅ Surface alignment gizmo

### Should Have (Phase 2)
5. Component library & templates
6. Enhanced snapping
7. Lighting match tool

### Nice to Have (Phase 3)
8. Point cloud surface extraction
9. Automated suggestions
10. Compliance validation

### Future Enhancements (Phase 4)
11. Annotation system
12. Scenario comparison
13. Professional reporting

---

## Alternative Approach: Hybrid Visualization

**If implementation proves too complex**, consider this simplified approach:

### Concept
Use gsplats for context, meshes for work areas

### Workflow
1. Import full gsplat for overall scene
2. For specific work areas (machines to be protected):
   - Create mesh from photogrammetry (moderate detail)
   - OR manually model simplified machine outline
3. Place "work mesh" inside gsplat scene
4. Attach safety components to work mesh (has proper surfaces)
5. Gsplat provides realistic background context

### Benefits
- ✅ Use existing mesh placement tools
- ✅ No new code required immediately
- ✅ Gsplat provides visual realism
- ✅ Work mesh provides placement accuracy

### Drawbacks
- ❌ Double modeling effort
- ❌ Need to align meshes with gsplat
- ❌ More manual work

---

## Development Timeline

### Month 1: Foundation
- Week 1-2: Enhanced picking system
- Week 3-4: Proxy mesh tool (simple AABB version)

### Month 2: Core Tools
- Week 5-6: Measurement tools
- Week 7-8: Surface alignment gizmo

### Month 3: Workflows
- Week 9-10: Component library
- Week 11-12: Enhanced snapping and lighting

### Month 4+: Advanced Features
- Point cloud processing
- Automation
- Compliance checking

---

## Success Metrics

### Phase 1 Complete When:
- [ ] Can click anywhere on gsplat and see 3D coordinates
- [ ] Can generate simple proxy mesh from gsplat
- [ ] Can measure distances accurately
- [ ] Can align components to surfaces with one click
- [ ] Workflow is 3-5x faster than manual placement

### Phase 2 Complete When:
- [ ] Component library with 10+ safety items
- [ ] Templates save/load correctly
- [ ] Lighting matches reasonably well
- [ ] Snapping works on proxy meshes

### Phase 3 Complete When:
- [ ] Can extract surfaces from point cloud
- [ ] System suggests placement locations
- [ ] Compliance checking works for basic rules

### Phase 4 Complete When:
- [ ] Can generate professional PDF reports
- [ ] Scenario comparison working
- [ ] Export for client presentations

---

## Technical Architecture

```
┌───────────────────────────────────────┐
│  PlayCanvas Editor (Standalone)       │
├───────────────────────────────────────┤
│  Safety Visualization Tools           │
│  ├─ Enhanced Picking                  │
│  ├─ Proxy Mesh System                 │
│  ├─ Measurement Tools                 │
│  ├─ Surface Alignment                 │
│  ├─ Component Library                 │
│  └─ Compliance Checker                │
├───────────────────────────────────────┤
│  Data Layer                            │
│  ├─ IndexedDB (project storage)       │
│  ├─ Local Files (import/export)       │
│  └─ Browser Storage (preferences)     │
├───────────────────────────────────────┤
│  Rendering                             │
│  ├─ Gaussian Splats (context)         │
│  ├─ Proxy Meshes (placement)          │
│  ├─ Safety Components (visualization) │
│  └─ Annotations (documentation)       │
└───────────────────────────────────────┘
```

---

## Getting Started

### For Development

1. **Set up standalone editor** (see STANDALONE_SETUP.md)
2. **Create test scene**:
   - Import a sample gsplat
   - Try current placement tools
   - Document pain points

3. **Start with Priority 1**:
   - Enhanced picking implementation
   - This provides foundation for all other tools

4. **Iterate**:
   - Build → Test → Refine
   - Get user feedback early
   - Adjust priorities based on actual use

---

## Resources

### Technical References
- [PlayCanvas Engine API](https://developer.playcanvas.com/api/)
- [Gaussian Splatting Spec](https://github.com/mkkellogg/GaussianSplats3D)
- [Point Cloud Library](https://pointclouds.org/)
- [ISO 13849 Standard](https://www.iso.org/standard/69883.html)

### Example Projects
- Point cloud viewers
- CAD placement tools
- Safety planning software

---

**Status**: 📋 Planning Complete
**Next Action**: Begin Phase 1.1 - Enhanced Picking System
**Est. Timeline**: 4-6 months for complete solution
**Quick Win**: 2-4 weeks for basic functionality

---

*Last Updated: 2025-11-10*
*Version: 1.0*
