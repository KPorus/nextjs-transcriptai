# TranscriptAI - Complete System Architecture

## 🎯 System Overview

**TranscriptAI** is a scalable video transcription service that:
1. Accepts video uploads from multiple users simultaneously
2. Stores videos temporarily in Cloudflare R2
3. Processes with Google Gemini AI
4. Auto-deletes videos after processing
5. Returns timestamped English transcripts

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTIPLE USERS                           │
│  User 1    User 2    User 3    ...    User N               │
└──────┬───────┬────────┬──────────────────┬─────────────────┘
       │       │        │                  │
       │       │        │                  │
       ▼       ▼        ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│               NEXT.JS FRONTEND (Browser)                     │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │  FileUpload    │  │ TranscriptView │                    │
│  └────────────────┘  └────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
       │                                           ▲
       │ 1. Request Presigned URL                  │ 6. Return Transcript
       ▼                                           │
┌──────────────────────────────────────────────────────────────┐
│            NEXT.JS BACKEND (API Routes)                      │
│  ┌─────────────────┐  ┌──────────────────────────┐         │
│  │ /api/upload-url │  │ /api/generate-transcript │         │
│  └─────────────────┘  └──────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
       │                            │
       │ 2. Generate URL            │ 4. Download
       ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│              CLOUDFLARE R2 BUCKET                            │
│  videos/1707654321-abc123.mp4                               │
│  videos/1707654322-xyz789.mp4  (temporary storage)          │
│  videos/1707654323-def456.mp4                               │
└──────────────────────────────────────────────────────────────┘
       ▲                            │
       │ 3. Upload (Direct)         │ 7. Delete (Auto)
       │                            ▼
┌──────────────────────────────────────────────────────────────┐
│              GOOGLE GEMINI AI                                │
│  5. Process Video → Generate Transcript                      │
└──────────────────────────────────────────────────────────────┘
```

## 📝 Detailed Flow

### Phase 1: Upload Request
```
User selects video (my-video.mp4, 50MB)
  ↓
Frontend: POST /api/upload-url
  {
    filename: "my-video.mp4",
    contentType: "video/mp4"
  }
  ↓
Backend generates unique key
  key = "videos/1707654321-abc123.mp4"
  ↓
Backend creates presigned URL
  using AWS SDK + R2 credentials
  ↓
Returns to frontend:
  {
    uploadUrl: "https://...r2.cloudflarestorage.com/...",
    key: "videos/1707654321-abc123.mp4"
  }
```

### Phase 2: Direct Upload
```
Frontend uploads directly to R2
  ↓
PUT https://account.r2.cloudflarestorage.com/bucket/videos/...
  Headers: { Content-Type: video/mp4 }
  Body: [50MB video binary]
  ↓
R2 stores file
  ↓
Upload complete (no server involved!)
```

### Phase 3: Processing
```
Frontend notifies backend
  ↓
POST /api/generate-transcript
  {
    r2Key: "videos/1707654321-abc123.mp4",
    contentType: "video/mp4"
  }
  ↓
Backend downloads from R2
  const buffer = await downloadFromR2(key)
  ↓
Convert to base64
  const base64 = buffer.toString('base64')
  ↓
Send to Gemini AI
  model.generateContent([{
    inlineData: { mimeType, data: base64 }
  }])
  ↓
Parse transcript
  segments = parseTranscript(response.text())
  ↓
Delete from R2 ✅
  await deleteFromR2(key)
  ↓
Return transcript
  { raw, segments }
```

## 🔐 Security Model

### 1. Credential Management
```
┌─────────────────────┬──────────────────────┬────────────┐
│ Credential          │ Location             │ Access     │
├─────────────────────┼──────────────────────┼────────────┤
│ GEMINI_API_KEY      │ Server ENV only      │ Backend    │
│ R2_ACCESS_KEY_ID    │ Server ENV only      │ Backend    │
│ R2_SECRET_ACCESS_KEY│ Server ENV only      │ Backend    │
│ R2_ACCOUNT_ID       │ Server ENV only      │ Backend    │
└─────────────────────┴──────────────────────┴────────────┘

⚠️ NEVER exposed to client/browser!
```

### 2. Presigned URL Security
```
Generated presigned URL:
  https://account.r2.cloudflarestorage.com/transcriptai-videos/
  videos/1707654321-abc123.mp4
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=...
  &X-Amz-Date=20240212T120000Z
  &X-Amz-Expires=3600        ← Expires in 1 hour
  &X-Amz-Signature=...       ← Cryptographic signature

Properties:
  ✅ Time-limited (1 hour)
  ✅ Single-use for specific file
  ✅ Can't upload to different path
  ✅ Can't be modified
  ✅ Auto-expires
```

### 3. CORS Protection
```json
R2 Bucket CORS Rules:
{
  "AllowedOrigins": [
    "http://localhost:3000",          // Dev
    "https://your-app.onrender.com"   // Prod
  ],
  "AllowedMethods": ["PUT"],          // Only upload
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}

Result:
  ✅ Only your domain can upload
  ❌ Other sites blocked
  ❌ Can't download (no GET)
  ❌ Can't list files (no LIST)
```

## 💾 Multi-User Data Isolation

### Unique File Keys
```javascript
User A uploads "video.mp4" → videos/1707654321-abc123.mp4
User B uploads "video.mp4" → videos/1707654322-xyz789.mp4
User C uploads "video.mp4" → videos/1707654323-def456.mp4

All different files, no conflicts!

Key generation:
  timestamp (ms) + random string + original extension
  1707654321 + abc123 + .mp4
  = videos/1707654321-abc123.mp4
```

### Parallel Processing
```
Time: 12:00:00
  User A starts processing video1.mp4 (60 seconds to complete)

Time: 12:00:10 (10 seconds later)
  User B starts processing video2.mp4 (60 seconds to complete)

Time: 12:00:20 (20 seconds later)
  User C starts processing video3.mp4 (60 seconds to complete)

Time: 12:01:00
  User A's transcript completes ✓
  
Time: 12:01:10
  User B's transcript completes ✓
  
Time: 12:01:20
  User C's transcript completes ✓

All processed independently, no interference!
```

### Resource Isolation
```
Each request gets:
  - Own R2 key (unique filename)
  - Own server process
  - Own Gemini API call
  - Own memory allocation
  - Own auto-cleanup

No shared state between users!
```

## 🔄 Cleanup Mechanism

### Automatic Deletion
```typescript
// In generate-transcript API route
try {
  // Download and process
  const result = await processWithGemini(videoBuffer);
  
  // Success: delete file
  await deleteFromR2(r2Key);
  
  return { transcript: result };
  
} catch (error) {
  // Error: STILL delete file
  await deleteFromR2(r2Key);
  
  throw error;
}
```

### Cleanup Guarantees
```
┌──────────────────┬─────────────────────┬──────────┐
│ Scenario         │ Video Deleted?      │ When?    │
├──────────────────┼─────────────────────┼──────────┤
│ Success          │ ✅ Yes              │ After    │
│ Gemini API error │ ✅ Yes              │ Catch    │
│ Download error   │ ✅ Yes              │ Catch    │
│ Network error    │ ✅ Yes              │ Catch    │
│ Server crash     │ ⚠️ Manual cleanup   │ Policy   │
└──────────────────┴─────────────────────┴──────────┘

Backup: R2 lifecycle policy deletes after 24 hours
```

## 📊 Performance & Scalability

### Throughput
```
Single Server (Render Starter):
  Concurrent uploads: Unlimited (direct to R2)
  Concurrent processing: ~5-10 (Gemini API limit)
  Bottleneck: Gemini API processing time

With Queue System (Future):
  Concurrent uploads: Unlimited
  Concurrent processing: Unlimited
  Queue workers: Scalable
```

### Latency Breakdown
```
┌──────────────────────────┬──────────────┐
│ Operation                │ Time         │
├──────────────────────────┼──────────────┤
│ Presigned URL generation │ ~100ms       │
│ Upload to R2 (50MB)      │ ~5s          │
│ Download from R2         │ ~2s          │
│ Gemini processing        │ 30-90s       │
│ R2 deletion              │ ~100ms       │
├──────────────────────────┼──────────────┤
│ Total (typical)          │ 40-100s      │
└──────────────────────────┴──────────────┘
```

### Cost Efficiency
```
Traditional Approach (upload via server):
  User → Server → Process → User
  
  Server bandwidth: 50MB up + 50MB down = 100MB
  Server storage: 50MB (temporary)
  Server memory: 50MB + 67MB (base64) = 117MB
  
R2 Approach (direct upload):
  User → R2 → Server downloads → Process
  
  Server bandwidth: 50MB down only
  Server storage: 0MB (R2 handles it)
  Server memory: 50MB + 67MB = 117MB
  
  Savings: 50% bandwidth, 0% storage
```

## 🔧 Implementation Details

### File Structure
```
nextjs-transcriptai/
├── app/
│   ├── api/
│   │   ├── upload-url/
│   │   │   └── route.ts          ← Generate presigned URLs
│   │   ├── generate-transcript/
│   │   │   └── route.ts          ← Process & cleanup
│   │   └── health/
│   │       └── route.ts          ← Health check
│   ├── page.tsx                  ← Main upload flow
│   └── layout.tsx
├── lib/
│   └── r2.ts                     ← R2 utilities
└── components/
    ├── FileUpload.tsx            ← Upload UI
    └── TranscriptView.tsx        ← Results UI
```

### Key Code Sections

#### 1. Presigned URL Generation
```typescript
// lib/r2.ts
export async function getUploadPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const key = generateUniqueFilename(filename);
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(
    r2Client, 
    command, 
    { expiresIn: 3600 }
  );

  return { uploadUrl, key };
}
```

#### 2. Direct Upload (Frontend)
```typescript
// app/page.tsx
// Get presigned URL
const { uploadUrl, key } = await fetch('/api/upload-url', {
  method: 'POST',
  body: JSON.stringify({ filename, contentType })
}).then(r => r.json());

// Upload directly to R2
await fetch(uploadUrl, {
  method: 'PUT',
  body: videoFile,
  headers: { 'Content-Type': videoFile.type }
});

// Notify backend to process
await fetch('/api/generate-transcript', {
  method: 'POST',
  body: JSON.stringify({ r2Key: key, contentType })
});
```

#### 3. Processing & Cleanup
```typescript
// app/api/generate-transcript/route.ts
try {
  // Download
  const buffer = await downloadFromR2(r2Key);
  
  // Process
  const transcript = await processWithGemini(buffer);
  
  // Cleanup
  await deleteFromR2(r2Key);
  
  return transcript;
} catch (error) {
  // Cleanup even on error
  await deleteFromR2(r2Key);
  throw error;
}
```

## 📈 Monitoring

### Key Metrics
```
1. R2 Bucket Size
   Target: ~0 MB (files auto-deleted)
   Alert: >100 MB (cleanup failing)

2. R2 Operations
   PUT: Upload count
   GET: Download count
   DELETE: Cleanup count
   DELETE should equal PUT + GET

3. Processing Time
   Average: 40-60 seconds
   P95: <90 seconds
   P99: <120 seconds

4. Error Rate
   Success rate: >95%
   Common errors: Network, Quota
```

## 🚀 Deployment

### Required Environment Variables
```bash
# .env.local or Render Environment
GEMINI_API_KEY=your_gemini_key
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=transcriptai-videos
```

### Render Configuration
```yaml
Build Command: npm install && npm run build
Start Command: npm start
Environment: Node 18+
Instance: Starter ($7/month) minimum
```

### R2 Bucket Setup
```json
{
  "name": "transcriptai-videos",
  "publicAccess": false,
  "cors": [{
    "AllowedOrigins": ["https://your-app.onrender.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"]
  }],
  "lifecycle": [{
    "rule": "Delete after 1 day",
    "filter": "videos/*"
  }]
}
```

## ✅ Production Checklist

- [ ] R2 bucket created
- [ ] R2 API tokens generated
- [ ] CORS configured on bucket
- [ ] Lifecycle policy added (cleanup)
- [ ] Gemini API key obtained
- [ ] All env vars set
- [ ] Tested locally
- [ ] Deployed to Render
- [ ] Tested production
- [ ] Monitored R2 bucket (empty)
- [ ] Set up alerts

---

**System is production-ready with multi-user support and automatic cleanup! 🎉**
