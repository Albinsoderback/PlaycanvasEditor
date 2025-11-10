# Quick Start Guide - PlayCanvas Editor Standalone

## TL;DR

```bash
# Install, build, and run
npm install
npm run build
npm run serve

# Then open browser to:
http://localhost:3487/
```

## Current Status

✅ **Working**: Editor loads locally without playcanvas.com
⚠️ **Limited**: No project persistence, realtime features disabled
📋 **Next**: Implement browser storage and safety tools

## What You Can Do Now

### ✅ Works
- Load the editor UI locally
- Use transform gizmos (translate, rotate, scale)
- Create basic entities (boxes, spheres, etc.)
- Navigate the viewport (orbit, pan, zoom)
- Access inspector and hierarchy panels

### ⚠️ Needs Implementation
- Save/load projects (browser storage needed)
- Import assets (drag-and-drop from local files)
- Gaussian splat import and handling
- Component placement tools
- Measurement tools

### ❌ Not Supported (By Design)
- Collaborative editing (realtime disabled)
- Backend project management
- Cloud asset storage

## File Structure

```
PlaycanvasEditor/
├── dist/                      # Built files (served by server)
│   ├── index.html            # ← Standalone editor entry point
│   ├── css/                  # Compiled styles
│   │   └── editor.css
│   └── js/                   # Compiled JavaScript
│       ├── editor.js         # ← Main editor bundle
│       └── ...
├── src/                      # Source code
│   └── editor/
│       ├── viewport/         # 3D viewport and gizmos
│       ├── entities/         # Entity system
│       ├── assets/           # Asset management
│       └── ...
├── STANDALONE_SETUP.md       # Detailed setup guide
├── SAFETY_TOOLS_ROADMAP.md   # Future features plan
└── QUICK_START.md            # This file
```

## Development Workflow

### Make Changes

1. Edit source files in `src/`
2. Rebuild: `npm run build`
3. Refresh browser (or use watch mode)

### Watch Mode (Auto-rebuild)

```bash
# Terminal 1: Auto-build on file changes
npm run watch

# Terminal 2: Serve files
npm run serve
```

Then just refresh browser after changes.

## Key Files for Safety Tools Implementation

### Priority 1 Files (Enhanced Picking)
- `src/editor/viewport/viewport-pick.ts` - Picking system
- `src/editor/entities/entities-pick.ts` - Entity picking

### Priority 2 Files (Proxy Mesh)
- Create: `src/editor/tools/proxy-mesh-generator.ts` (new)
- Integrate with viewport drop handlers

### Priority 3 Files (Measurement)
- Create: `src/editor/viewport/tools/measurement-tool.ts` (new)
- Toolbar integration

### Priority 4 Files (Surface Alignment)
- Create: `src/editor/viewport/gizmo/gizmo-surface-align.ts` (new)
- Extend: `src/editor/viewport/gizmo/gizmo.ts`

## Testing Your Changes

### 1. Check Browser Console
Open DevTools (F12) and check for:
- JavaScript errors (red)
- Warnings (yellow)
- Console.log output

### 2. Test Basic Functionality
- [ ] Viewport loads
- [ ] Can create entities
- [ ] Gizmos appear and work
- [ ] Inspector shows properties
- [ ] No errors in console

### 3. Test New Features
- [ ] Feature appears in UI
- [ ] No crashes or errors
- [ ] Works as expected
- [ ] Undo/redo works

## Common Commands

```bash
# Install dependencies
npm install

# Build once
npm run build

# Build CSS only
npm run build:css

# Build JS only
npm run build:js

# Watch mode (auto-rebuild)
npm run watch

# Start server
npm run serve

# Run tests
npm test

# Lint code
npm run lint

# Fix lint issues
npm run lint:js:fix

# Type check
npm run type:check
```

## Port Configuration

Default ports:
- **Editor**: `http://localhost:3487`
- **Can be changed** in package.json:
  ```json
  "serve": "serve dist -p 3487 --cors"
  ```

## Debugging Tips

### Editor Won't Load

1. Check server is running:
   ```bash
   lsof -i :3487
   ```

2. Check build completed:
   ```bash
   ls -la dist/js/editor.js
   ```

3. Check browser console for errors

### White Screen

- Open DevTools (F12)
- Check Network tab - all files loaded?
- Check Console tab - JavaScript errors?
- Verify `window.config` exists

### Changes Not Appearing

1. Did you rebuild? `npm run build`
2. Did you hard refresh? `Ctrl+Shift+R` (Chrome)
3. Clear browser cache
4. Check file timestamps in `dist/`

## Next Steps

### To Use for Safety Visualization

1. ✅ Editor is running locally
2. ⚠️ Implement browser storage (see STANDALONE_SETUP.md)
3. ⚠️ Implement asset import (drag-and-drop)
4. ⚠️ Build safety tools (see SAFETY_TOOLS_ROADMAP.md)

### Recommended Path

**Week 1-2**: Get comfortable with editor
- Load editor, explore UI
- Create test entities
- Understand file structure

**Week 3-4**: Implement storage
- IndexedDB for project data
- Save/load functionality
- Auto-save

**Week 5-8**: Build Phase 1 tools
- Enhanced picking
- Proxy mesh generator
- Measurement tools
- Surface alignment

## Resources

- **Detailed Setup**: See `STANDALONE_SETUP.md`
- **Feature Roadmap**: See `SAFETY_TOOLS_ROADMAP.md`
- **PlayCanvas Docs**: https://developer.playcanvas.com/
- **Editor API**: https://api.playcanvas.com/editor/

## Getting Help

### Check These First
1. Browser console (F12) for errors
2. `STANDALONE_SETUP.md` troubleshooting section
3. `SAFETY_TOOLS_ROADMAP.md` for implementation details

### Logs
- Browser console (F12)
- Server logs in terminal
- Build errors in terminal

---

**You're Ready!** 🚀

The editor is set up and running locally. Open http://localhost:3487/ to start using it.

Next, check `SAFETY_TOOLS_ROADMAP.md` to begin implementing the safety visualization features.

---

*Last Updated: 2025-11-10*
