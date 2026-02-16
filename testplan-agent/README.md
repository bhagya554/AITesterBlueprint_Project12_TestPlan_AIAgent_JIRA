# TestPlan Agent

An intelligent, AI-powered test plan generator that automatically creates comprehensive test plans by pulling context from JIRA tickets and filling a user-provided test plan template using Large Language Models (LLMs).

![TestPlan Agent](https://via.placeholder.com/800x400?text=TestPlan+Agent+Screenshot)

## Features

- **JIRA Integration**: Fetch ticket details including description, acceptance criteria, comments, linked issues, and attachments
- **AI-Powered Generation**: Uses Groq (cloud) or Ollama (local) LLMs to generate test plans
- **Template-Based**: Extracts structure from PDF templates to ensure consistent formatting
- **Real-time Streaming**: Watch the test plan being generated in real-time
- **Export Options**: Download test plans as PDF or DOCX
- **History Management**: Save and retrieve previously generated test plans
- **Modern UI**: Clean, responsive React-based interface with Tailwind CSS

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React 18, Vite, Tailwind CSS
- **PDF Processing**: pdfplumber (parsing), ReportLab/WeasyPrint (generation)
- **DOCX Generation**: python-docx
- **LLM Providers**: Groq SDK, Ollama

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- (Optional) Ollama for local LLM support

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd testplan-agent
   ```

2. **Configure environment variables**
   
   Edit the `.env` file in the project root:
   ```env
   # JIRA Configuration
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@company.com
   JIRA_API_TOKEN=your-jira-api-token

   # Groq Configuration
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile

   # Ollama Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_DEFAULT_MODEL=llama3.1

   # LLM Settings
   DEFAULT_PROVIDER=groq
   LLM_TEMPERATURE=0.3
   LLM_MAX_TOKENS=4096

   # Template
   TEMPLATE_PATH=../testplan.pdf
   ```

3. **Start the application**

   **Windows:**
   ```bash
   start.bat
   ```

   **Linux/Mac:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

4. **Open your browser**
   
   Navigate to http://localhost:8000

## Getting API Keys

### JIRA API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a name (e.g., "TestPlan Agent")
4. Copy the token and paste it in your `.env` file

### Groq API Key

1. Sign up at [Groq Console](https://console.groq.com)
2. Navigate to API Keys
3. Create a new API key
4. Copy the key and paste it in your `.env` file

### Ollama (Optional - for local LLMs)

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model:
   ```bash
   ollama pull llama3.1
   ```
3. Start Ollama server:
   ```bash
   ollama serve
   ```

## Usage

1. **Configure Settings**
   - Go to the Settings page
   - Enter your JIRA and LLM credentials
   - Test the connections
   - Save settings

2. **Generate Test Plans**
   - Go to the Generator page
   - Select your preferred LLM provider and model
   - Enter a JIRA ticket ID (e.g., `PROJ-123`)
   - Click "Fetch & Generate"
   - Review the generated test plan
   - Export as PDF or DOCX, or save to history

3. **View History**
   - Go to the History page
   - View, download, or delete previously generated test plans

## Project Structure

```
testplan-agent/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings management
│   ├── database.py          # SQLAlchemy models
│   ├── requirements.txt     # Python dependencies
│   ├── routers/
│   │   ├── jira.py          # JIRA API endpoints
│   │   ├── generator.py     # Generation endpoints
│   │   ├── history.py       # History endpoints
│   │   ├── settings.py      # Settings endpoints
│   │   ├── llm.py           # LLM endpoints
│   │   └── template.py      # Template endpoints
│   └── services/
│       ├── jira_client.py   # JIRA API integration
│       ├── template_parser.py # PDF template parsing
│       ├── llm_provider.py  # LLM abstraction
│       ├── prompt_builder.py # Prompt construction
│       └── export_service.py # PDF/DOCX generation
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Generator.jsx
│   │   │   ├── History.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── LLMSelector.jsx
│   │   │   ├── JiraPreview.jsx
│   │   │   ├── StreamOutput.jsx
│   │   │   └── ExportButtons.jsx
│   │   └── api/
│   │       └── client.js
│   ├── package.json
│   └── vite.config.js
├── .env                     # Environment variables
├── start.bat               # Windows startup script
├── start.sh                # Linux/Mac startup script
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jira/ticket/{id}` | Fetch JIRA ticket |
| GET | `/api/jira/test-connection` | Test JIRA credentials |
| POST | `/api/generate/stream` | Stream test plan generation |
| POST | `/api/generate/export/pdf` | Export as PDF |
| POST | `/api/generate/export/docx` | Export as DOCX |
| GET | `/api/history` | List saved test plans |
| GET | `/api/history/{id}` | Get specific test plan |
| DELETE | `/api/history/{id}` | Delete test plan |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/llm/providers` | List LLM providers |
| GET | `/api/llm/models/{provider}` | List available models |
| POST | `/api/llm/test` | Test LLM connection |

## Troubleshooting

### JIRA Connection Failed
- Verify your JIRA base URL is correct (e.g., `https://company.atlassian.net`)
- Ensure your API token is valid and not expired
- Check that your JIRA account has access to the project

### Groq Rate Limit
- Groq has rate limits on the free tier
- Wait a few seconds and try again
- Consider upgrading your Groq plan for higher limits

### Ollama Not Found
- Make sure Ollama is installed and running: `ollama serve`
- Verify the model is pulled: `ollama pull llama3.1`
- Check that the base URL is correct (default: `http://localhost:11434`)

### Template PDF Not Found
- Place your `testplan.pdf` file in the project root
- Update the `TEMPLATE_PATH` in settings
- If no template is found, the app will use a default structure

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
