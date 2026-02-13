# TranscriptAI - Next.js Version

A modern video transcription application built with Next.js 14. Upload videos in any language and get accurate English transcripts with timestamps.

## 🚀 Features

- **Video Upload to Cloud Storage**: Direct upload to Cloudflare R2 bucket
- **Automatic Cleanup**: Videos are automatically deleted after processing
- **AI-Powered Transcription**: Uses Google's Gemini AI to transcribe and translate videos
- **Timestamp Generation**: Automatic timestamp generation for easy navigation
- **Editable Transcripts**: Edit transcript segments in real-time
- **Export Options**: Copy to clipboard or download as text file
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **State Management**: Redux Toolkit for predictable state management
- **Secure Processing**: Videos temporarily stored in R2, never on your server

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **AI Provider**: Google Gemini AI
- **Storage**: Cloudflare R2 (S3-compatible)
- **Icons**: Lucide React

<!-- ## 📋 Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- A Cloudflare account with R2 enabled ([Setup guide](./R2_SETUP.md)) -->

<!-- ## 🔧 Installation

1. **Clone or extract the project**

```bash
cd nextjs-transcriptai
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_r2_account_id_here
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_BUCKET_NAME=transcriptai-videos
```

**See [R2_SETUP.md](./R2_SETUP.md) for detailed R2 configuration instructions.**

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) -->

## 📁 Project Structure

```
nextjs-transcriptai/
├── app/
│   ├── api/
│   │   └── generate-transcript/
│   │       └── route.ts          # API endpoint for transcript generation
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout with Redux provider
│   └── page.tsx                  # Main page component
├── components/
│   ├── FileUpload.tsx            # File upload component
│   ├── Header.tsx                # Header component
│   ├── StoreProvider.tsx         # Redux provider wrapper
│   └── TranscriptView.tsx        # Transcript display and editing
├── store/
│   ├── hooks.ts                  # Typed Redux hooks
│   ├── index.ts                  # Store configuration
│   └── transcriptSlice.ts        # Transcript state slice
├── types.ts                      # TypeScript type definitions
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## 🔑 How It Works

### Frontend Flow

1. User uploads a video file via the `FileUpload` component
2. File is validated (type and size)
3. Redux store is updated with the file
4. The main page (`page.tsx`) detects the file and triggers the API call
5. File is sent to the backend API endpoint via FormData

### Backend Flow (API Route)

1. API route (`/api/generate-transcript/route.ts`) receives the file
2. File is converted to base64 format
3. Gemini AI API is called with the video data and prompt
4. Response is parsed to extract timestamps and text
5. Structured transcript is returned to the frontend
6. Redux store is updated with the transcript data
7. `TranscriptView` component displays the results

## 🎨 Key Components

### API Route (`app/api/generate-transcript/route.ts`)

The backend API endpoint that:
- Receives video files
- Converts them to base64
- Calls Google Gemini AI
- Parses and returns structured transcript data

### FileUpload Component

- Drag & drop functionality
- File validation
- Tab interface (Upload/YouTube)
- Error handling

### TranscriptView Component

- Display transcript segments with timestamps
- Inline editing of transcript text
- Copy to clipboard
- Download as text file
- Reset functionality

### Redux Store

- `transcriptSlice.ts`: Manages all transcript-related state
- `hooks.ts`: Provides typed versions of Redux hooks
- `index.ts`: Configures the store with proper serialization settings

<!-- ## 🔒 Security Notes

- API key is stored server-side in environment variables
- Never exposed to the client
- File upload is limited to 100MB (configurable in `next.config.js`) -->

<!-- ## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add `GEMINI_API_KEY` to environment variables
4. Deploy!

### Other Platforms

Ensure the platform supports:
- Next.js 14 App Router
- API Routes
- Environment variables
- File uploads up to 100MB -->

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |

## 🎯 Future Enhancements

- [ ] YouTube URL support
- [ ] Multiple language output options
- [ ] Video player integration with synchronized playback
- [ ] Export to SRT/VTT subtitle formats
- [ ] Batch processing
- [ ] Real-time collaboration
- [ ] Speaker diarization

## 🐛 Troubleshooting

### "API Key is missing" error
- Ensure `.env.local` exists in the root directory
- Verify the variable name is exactly `GEMINI_API_KEY`
- Restart the dev server after adding the key

### Upload fails
- Check file size (max 100MB by default)
- Verify file type is supported (MP4, WebM, MOV, MP3, WAV)
- Check network console for API errors

### Transcript doesn't appear
- Check browser console for errors
- Verify API key is valid
- Ensure Gemini API quota isn't exceeded

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Google Gemini AI for the transcription engine
- Lucide React for beautiful icons
- Tailwind CSS for styling
- Redux Toolkit for state management

---

**Built with ❤️ using Next.js**
