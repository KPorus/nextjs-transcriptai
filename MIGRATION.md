# Migration from Vite + React to Next.js

## Key Changes Summary

### 1. **Project Structure**

**Before (Vite + React):**
```
transcriptai/
├── src/
│   ├── components/
│   ├── services/
│   ├── store/
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── vite.config.ts
```

**After (Next.js):**
```
nextjs-transcriptai/
├── app/
│   ├── api/generate-transcript/route.ts  (NEW - Backend API)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── store/
└── next.config.js
```

### 2. **Gemini Service Migration**

**Before:** Client-side service (`services/geminiService.ts`)
- API key exposed in client
- File processing in browser
- Direct Gemini SDK usage in client

**After:** Server-side API route (`app/api/generate-transcript/route.ts`)
- API key secured on server
- File processing on backend
- Proper environment variable usage
- Follows Next.js API route pattern

### 3. **Component Updates**

All components now use:
- `'use client'` directive (for client components)
- Next.js 14 App Router conventions
- Updated import paths with `@/` alias
- Typed Redux hooks from `store/hooks.ts`

### 4. **Redux Store Changes**

**Enhanced for Next.js:**
```typescript
// Before
export const store = configureStore({ ... });

// After
export const makeStore = () => configureStore({ ... });
// Allows server-side rendering compatibility
```

**New Files:**
- `store/hooks.ts` - Typed hooks for Redux
- `components/StoreProvider.tsx` - Client-side provider wrapper

### 5. **Environment Variables**

**Before:**
```env
API_KEY=your_key
```

**After:**
```env
GEMINI_API_KEY=your_key  # Server-only, never exposed to client
```

### 6. **API Integration**

**Before (Client-side):**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const result = await generateTranscript(file);
```

**After (API Route):**
```typescript
// Frontend
const formData = new FormData();
formData.append('file', videoFile);
const response = await fetch('/api/generate-transcript', {
  method: 'POST',
  body: formData,
});

// Backend (API Route)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

### 7. **Dependency Changes**

**Removed:**
- `vite` and `@vitejs/plugin-react`
- `@google/genai` from client dependencies

**Added:**
- `next` - Next.js framework
- `@google/generative-ai` - Gemini SDK (server-side only)

**Updated:**
- React 18.3.1 (Next.js compatible version)

## Benefits of Migration

### Security
✅ API keys never exposed to client
✅ Backend-only processing
✅ Server-side validation

### Performance
✅ Server-side rendering support
✅ Automatic code splitting
✅ Optimized production builds
✅ Image optimization built-in

### Developer Experience
✅ File-based routing
✅ API routes in the same project
✅ Better TypeScript support
✅ Built-in optimization

### Scalability
✅ Easy to add server actions
✅ Better for large applications
✅ Built-in middleware support
✅ Edge runtime support

## File Mapping

| Original (Vite) | New (Next.js) | Changes |
|----------------|---------------|---------|
| `App.tsx` | `app/page.tsx` | Now a client component |
| `main.tsx` | `app/layout.tsx` | Root layout with providers |
| `index.html` | Built by Next.js | Not needed |
| `vite.config.ts` | `next.config.js` | Next.js config |
| `services/geminiService.ts` | `app/api/generate-transcript/route.ts` | Backend API route |
| `components/*` | `components/*` | Added `'use client'` directive |
| `store/index.ts` | `store/index.ts` | Updated for SSR |
| - | `store/hooks.ts` | NEW - Typed hooks |
| - | `components/StoreProvider.tsx` | NEW - Redux provider |

## Breaking Changes

1. **No Direct Gemini SDK Access from Client**
   - Must use API route
   - All processing server-side

2. **Import Paths**
   - Use `@/` alias instead of relative paths
   - Example: `@/components/Header` instead of `'./components/Header'`

3. **Redux Hooks**
   - Use typed hooks from `store/hooks.ts`
   - `useAppDispatch()` instead of `useDispatch()`
   - `useAppSelector()` instead of `useSelector()`

4. **Environment Variables**
   - Renamed `API_KEY` to `GEMINI_API_KEY`
   - Only accessible server-side (no `NEXT_PUBLIC_` prefix)

## Migration Checklist

- [x] Convert Vite config to Next.js config
- [x] Move Gemini service to API route
- [x] Update all components with 'use client'
- [x] Create Redux provider wrapper
- [x] Update import paths to use @ alias
- [x] Convert main.tsx to layout.tsx
- [x] Convert App.tsx to page.tsx
- [x] Create typed Redux hooks
- [x] Update environment variables
- [x] Add global CSS with Tailwind
- [x] Test all functionality

## Testing the Migration

1. **Install and Run:**
   ```bash
   npm install
   npm run dev
   ```

2. **Test Upload:**
   - Upload a small video file
   - Verify transcript generation works
   - Check that API key is not in client bundle

3. **Verify Security:**
   - Open browser DevTools > Network
   - Upload a file
   - Confirm API key never appears in requests
   - Check that processing happens server-side

4. **Check Build:**
   ```bash
   npm run build
   ```
   - Ensure no errors
   - Verify bundle size is reasonable
   - Test production build locally

## Deployment Notes

- Set `GEMINI_API_KEY` in hosting platform environment variables
- Ensure platform supports Next.js 14 App Router
- Configure file upload limits if needed
- Set up monitoring for API routes

---

**Migration completed successfully! 🎉**

The app now has better security, performance, and scalability while maintaining all original features.
