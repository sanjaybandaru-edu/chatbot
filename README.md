# My Personal ChatGPT

A personal ChatGPT-like web application using AWS Bedrock (Claude) with all ChatGPT features: chat history, memories, streaming responses, and dynamic model switching from the UI.

![ChatGPT Clone](https://img.shields.io/badge/Powered%20by-Claude%20Opus%204-purple)
![AWS](https://img.shields.io/badge/Cloud-AWS%20Bedrock-orange)
![Terraform](https://img.shields.io/badge/IaC-Terraform-blue)

## ✨ Features

- 💬 **Chat with Claude** - Streaming responses via AWS Bedrock
- 📝 **Chat History** - All conversations saved and searchable
- 🧠 **Memories** - Persistent context that Claude remembers across chats
- 🔄 **Dynamic Model Switching** - Change models from UI without code changes
- 🎨 **Beautiful UI** - Dark mode, glassmorphism, smooth animations
- 📐 **Rich Formatting** - Markdown, syntax highlighting, LaTeX/math support
- 📱 **Responsive** - Works on desktop and mobile
- 🚀 **Serverless** - Near-zero cost when idle

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│     S3 Bucket    │     │   AWS Bedrock   │
│   (Frontend)    │     │  (React Build)   │     │    (Claude)     │
└─────────────────┘     └──────────────────┘     └────────▲────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Lambda + URL   │────▶│    DynamoDB      │──────────────┘
│   (FastAPI)     │     │  (Chats/Memory)  │
└─────────────────┘     └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **AWS Account** with Bedrock access enabled
2. **GitHub Account** for hosting the code
3. **AWS IAM User** with programmatic access

### Step 1: Fork/Clone Repository

```bash
git clone <your-repo-url>
cd third
```

### Step 2: Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | `us-east-1` (or your preferred region with Bedrock) |

### Step 3: Push to Deploy

```bash
git push origin main
```

GitHub Actions will automatically:
1. Build the frontend
2. Package the backend
3. Deploy infrastructure with Terraform
4. Upload files to S3
5. Invalidate CloudFront cache

### Step 4: Access Your App

After deployment (~5 minutes), check the GitHub Actions logs for your URLs:

```
Frontend URL: https://xxxxx.cloudfront.net
API URL: https://xxxxx.lambda-url.us-east-1.on.aws/
```

## 💡 Usage

### Chat
Simply type your message and press Enter or click Send. Responses stream in real-time.

### Switch Models
Click the model selector in the header to switch between available models (e.g., Claude Opus 4, Claude Sonnet).

### Add Memories
Go to Settings → Memories → Add information you want Claude to remember:
- "I'm a software developer using Python and TypeScript"
- "I prefer concise explanations with code examples"
- "I'm learning machine learning"

### Add New Models (Future-Proof!)
When new models like Claude Opus 5 are released:
1. Go to Settings → Models → Add Model
2. Enter the Bedrock model ID (from AWS console)
3. Save and start using!

## 💰 Cost Estimate

| Resource | Idle Cost | Active Usage |
|----------|-----------|--------------|
| Lambda | $0 | ~$0.20/1M requests |
| DynamoDB | $0 | ~$1.25/1M writes |
| S3 | ~$0.02/month | Minimal |
| CloudFront | $0 | ~$0.085/GB transfer |
| **Bedrock** | $0 | Varies by model |

**Total idle cost: ~$0-2/month**

## 🛠 Development

### Local Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Local Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
```

## 🗑 Cleanup

To destroy all AWS resources:

1. Go to GitHub Actions → "Destroy Infrastructure"
2. Click "Run workflow"
3. Type `destroy` to confirm
4. Click "Run workflow"

Or manually:
```bash
cd infrastructure
terraform destroy
```

## 📁 Project Structure

```
├── .github/workflows/    # CI/CD pipelines
│   ├── deploy.yml        # Auto-deploy on push
│   └── destroy.yml       # Manual cleanup
├── backend/              # FastAPI application
│   ├── main.py           # API endpoints
│   ├── database.py       # DynamoDB operations
│   └── bedrock_client.py # Claude integration
├── frontend/             # React application
│   └── src/
│       ├── components/   # UI components
│       ├── api.js        # API client
│       └── App.jsx       # Main app
└── infrastructure/       # Terraform IaC
    ├── main.tf           # AWS resources
    ├── variables.tf      # Configuration
    └── outputs.tf        # Output values
```

## 🔧 Troubleshooting

### "Bedrock access denied"
Enable Claude models in AWS Bedrock console: Amazon Bedrock → Model access → Request access

### "CORS error"
Lambda Function URL already has CORS enabled. If issues persist, check CloudFront settings.

### "Model not found"
Verify the model ID in Settings matches exactly what's shown in AWS Bedrock.

## 📄 License

MIT License - Use freely for personal projects!

---

Built with ❤️ using Claude via AWS Bedrock
