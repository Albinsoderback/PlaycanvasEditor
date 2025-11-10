# PlayCanvas Editor - Standalone Setup Guide

## Overview

This document explains how to run the PlayCanvas Editor completely locally in your browser without needing to connect to playcanvas.com.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Editor

```bash
npm run build
```

This will compile the editor into the `dist/` directory.

### 3. Start the Local Server

```bash
npm run serve
```

This starts a local web server on **http://localhost:3487**

### 4. Access the Editor

Open your browser and navigate to:

```
http://localhost:3487/index.html
```

Or simply:

```
http://localhost:3487/
```

## What's Been Set Up

### Standalone HTML Page

A standalone HTML page (`dist/index.html`) has been created that:

- ✅ Loads the editor CSS and JavaScript locally
- ✅ Provides a minimal `config` object that the editor expects
- ✅ Loads the PlayCanvas Engine from CDN
- ✅ Runs without requiring authentication or backend connection
- ✅ Includes full permissions for local editing

### Configuration

The standalone mode includes:

- **Project Settings**: Default physics, rendering, and audio settings
- **User Profile**: Local standalone user with admin permissions
- **Scene**: Default empty scene named "Untitled"
- **Permissions**: Full read/write/admin access
- **Realtime**: Disabled (no collaborative editing)

## Current Limitations

### Known Issues

1. **No Backend Persistence**: Projects are not saved to a backend server
   - **Solution**: Need to implement browser storage (IndexedDB/LocalStorage)
   - **Status**: Pending implementation

2. **Realtime Features Disabled**: No collaborative editing or chat
   - **Impact**: Single-user editing only
   - **Status**: Expected behavior for standalone mode

3. **Asset Management**: Limited asset upload/storage capabilities
   - **Solution**: Need to implement local file system access or browser storage
   - **Status**: Pending implementation

4. **Engine Loading**: Currently loads from PlayCanvas CDN
   - **Solution**: Can be bundled locally if needed
   - **Status**: Works as-is, but not fully offline

### Expected Behavior

When you load the standalone editor, you should see:

- ✅ The editor UI loads correctly
- ✅ The viewport is visible
- ✅ You can create entities (though they may not persist)
- ⚠️ Some features that rely on backend APIs may not work
- ⚠️ Project saving/loading needs to be implemented

## Development Workflow

### For Your Safety Visualization Project

1. **Import Gaussian Splats**
   - Drop `.ply` or `.splat` files into the editor
   - Currently requires manual placement

2. **Import Safety Components**
   - Import Blender models as `.glb` or `.fbx`
   - Place using transform gizmos

3. **Scene Editing**
   - Use the entity hierarchy
   - Transform tools (translate, rotate, scale)
   - Inspector panel for properties

## Next Steps for Full Standalone Functionality

### Phase 1: Basic Persistence (Recommended First)

1. **Implement Browser Storage**
   ```javascript
   // Save project to IndexedDB
   // Load project from IndexedDB
   // Auto-save functionality
   ```

2. **File Import/Export**
   - Export scene as JSON
   - Import scene from JSON
   - Drag-and-drop asset loading

### Phase 2: Remove Backend Dependencies

1. **Mock Realtime API**
   - Create stub functions for realtime operations
   - Prevent connection errors

2. **Local Asset Storage**
   - Store assets in IndexedDB
   - Handle asset references locally

### Phase 3: Safety Visualization Tools

(See SAFETY_TOOLS_ROADMAP.md for detailed implementation plan)

1. **Enhanced Picking System**
   - 3D intersection point detection
   - Surface normal calculation

2. **Proxy Mesh Tool**
   - Generate simplified collision meshes from gsplats
   - Use for accurate component placement

3. **Measurement Tools**
   - Distance measurement
   - Angle measurement
   - Height references

4. **Surface Alignment**
   - Auto-align components to surfaces
   - Snap to normals

## Testing Checklist

Before implementing new features, verify:

- [ ] Editor loads without errors at http://localhost:3487/
- [ ] Viewport is visible and interactive
- [ ] Entity hierarchy panel is visible
- [ ] Inspector panel is visible
- [ ] Transform gizmos work (translate/rotate/scale)
- [ ] Can create basic entities (box, sphere, etc.)

## Troubleshooting

### Editor doesn't load

1. Check browser console for errors (F12)
2. Verify server is running: `npm run serve`
3. Check that files exist in `dist/` directory
4. Try rebuilding: `npm run build`

### White screen or errors

1. Open browser console (F12)
2. Look for JavaScript errors
3. Check that `window.config` is defined
4. Verify CSS file loaded correctly

### Assets won't import

- This is expected in current version
- Asset import requires backend or local storage implementation
- See "Next Steps" section above

## Files Created

- `/dist/index.html` - Standalone editor HTML page
- `/standalone.html` - Alternative version (root directory)
- `STANDALONE_SETUP.md` - This documentation
- `SAFETY_TOOLS_ROADMAP.md` - Future features roadmap

## Architecture Notes

### How the Editor Works

```
┌─────────────────────────────────────┐
│  Browser (http://localhost:3487)    │
├─────────────────────────────────────┤
│  index.html                          │
│  ├─ window.config (mock)            │
│  ├─ PlayCanvas Engine (CDN)         │
│  └─ Editor JS (local dist/js/)      │
├─────────────────────────────────────┤
│  Editor Components                   │
│  ├─ Viewport                        │
│  ├─ Entity Hierarchy                │
│  ├─ Inspector                       │
│  ├─ Assets Panel                    │
│  └─ Gizmos (transform tools)        │
└─────────────────────────────────────┘
```

### Key Dependencies

- **PlayCanvas Engine**: WebGL/WebGPU 3D engine
- **PCUI**: UI component library
- **Observer**: Data binding and history
- **Editor API**: Public API for automation

### Config Object Structure

The `window.config` object provides:

```javascript
{
  project: { /* project settings */ },
  self: { /* user info */ },
  scene: { /* current scene */ },
  schema: { /* data schemas */ },
  url: { /* API endpoints */ },
  permissions: { /* access control */ }
}
```

## Additional Resources

- [PlayCanvas Editor GitHub](https://github.com/playcanvas/editor)
- [PlayCanvas Engine Docs](https://developer.playcanvas.com/)
- [PlayCanvas API Reference](https://api.playcanvas.com/)

## Support

For issues with:

- **Standalone setup**: Check this document and console errors
- **PlayCanvas Editor**: See official GitHub issues
- **Safety tools implementation**: See SAFETY_TOOLS_ROADMAP.md

---

**Status**: ✅ Basic standalone mode working
**Last Updated**: 2025-11-10
**Next Priority**: Implement browser storage for project persistence
