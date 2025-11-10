# Debug Checklist - Standalone Editor Not Loading

## Quick Checks

### 1. Verify Server is Running
```bash
ps aux | grep "serve dist"
```
**Expected**: Two processes (sh and node)

### 2. Check dist/index.html Exists
```bash
ls -lh /home/user/PlaycanvasEditor/dist/index.html
```
**Expected**: File exists, ~6.7KB

### 3. Check Built Files Exist
```bash
ls -lh /home/user/PlaycanvasEditor/dist/js/editor.js
```
**Expected**: File exists, ~3.4MB

### 4. Test Server Response
```bash
curl -I http://localhost:3487/
```
**Expected**: HTTP 200 OK

### 5. Test index.html Loads
```bash
curl http://localhost:3487/index.html | head -20
```
**Expected**: HTML content with "PlayCanvas Editor - Standalone"

## Common Issues

### Issue 1: Seeing Directory Listing

**Symptom**: Browser shows folders (css/, js/, etc.) instead of editor

**Causes**:
- Server doesn't default to index.html
- Need to visit `/index.html` explicitly
- OR server config issue

**Fix**:
Visit: `http://localhost:3487/index.html` (with /index.html)

### Issue 2: Blank White Page

**Symptom**: Page loads but shows nothing

**Causes**:
- JavaScript errors
- Missing files
- CORS issues

**Fix**:
1. Press F12 (open console)
2. Check Console tab for errors
3. Check Network tab - all files 200 OK?

### Issue 3: Loading Screen Stays Forever

**Symptom**: "Loading PlayCanvas Editor..." never goes away

**Causes**:
- window.config not set
- Editor JavaScript failed to load
- PlayCanvas engine failed to load from CDN

**Fix**:
1. Check console for errors
2. Verify internet connection (engine loads from CDN)
3. Check if editor.js loaded (Network tab)

### Issue 4: Editor Loads But No Safety Tools

**Symptom**: Editor UI appears but no safety tools toolbar

**Causes**:
- Old cached JavaScript
- Build didn't include safety tools
- JavaScript error during initialization

**Fix**:
1. Hard refresh (Ctrl+Shift+R)
2. Clear cache
3. Rebuild: `npm run build`
4. Check console for errors

## Step-by-Step Verification

### Step 1: Server
```bash
# Check server is running
lsof -i :3487

# Should show node process
```

### Step 2: Files
```bash
# Check all required files exist
ls -lh dist/index.html
ls -lh dist/css/editor.css
ls -lh dist/js/editor.js
```

### Step 3: Browser
1. Open: `http://localhost:3487/`
2. If directory listing: add `/index.html`
3. Press F12
4. Check Console tab
5. Look for "Safety Tools" messages

### Step 4: Functionality
1. Click in viewport
2. Check console for pick coordinates
3. Look for orange marker
4. Check toolbar for safety tools buttons

## Expected Console Output

When editor loads successfully, you should see:

```
PlayCanvas Editor - Standalone Mode
Running in standalone mode - no backend connection required
PlayCanvas Editor API v1.1.26 revision xxxxx
[Safety Tools] Enhanced 3D picking system initialized
[Safety Tools] Proxy mesh generator initialized
[Safety Tools] Measurement tools initialized
[Safety Tools] Surface alignment gizmo initialized (Hotkey: A)

╔════════════════════════════════════════════════════════════╗
║           SAFETY TOOLS - PHASE 1 INITIALIZED               ║
╠════════════════════════════════════════════════════════════╣
║  3D Picking: Click anywhere to get 3D coordinates         ║
║  Proxy Meshes: Select gsplat → "Generate Proxy"           ║
║  Measurements: Distance (2pts), Angle (3pts), Height (1pt)║
║  Surface Alignment: Select entity → Press 'A' → Click     ║
╚════════════════════════════════════════════════════════════╝

Safety Tools ready! See console for help.
```

## If Still Not Working

### Nuclear Option: Rebuild Everything

```bash
# Stop server
pkill -f "serve dist"

# Clean build
rm -rf dist/
npm run build

# Verify files
ls -lh dist/
ls -lh dist/index.html
ls -lh dist/js/editor.js

# Start server
npm run serve

# Test
curl http://localhost:3487/index.html | head -5
```

### Check Browser

1. Try different browser (Chrome, Firefox, Safari)
2. Try incognito/private mode
3. Disable browser extensions
4. Check browser console for CORS errors

### Check Network

```bash
# Test if port is accessible
nc -zv localhost 3487

# Check what's listening
netstat -tuln | grep 3487
```

## Success Criteria

✅ Server responds on port 3487
✅ dist/index.html loads in browser
✅ Console shows "Safety Tools" messages
✅ Editor UI visible (panels, toolbar, viewport)
✅ Safety tools toolbar visible (orange border)
✅ Clicking viewport logs coordinates to console

## Contact Points

If nothing works:
1. Share browser console output
2. Share server terminal output
3. Share result of `curl http://localhost:3487/index.html | head -20`
4. Share screenshot of what you see
