# Butler 🤖

A lightweight desktop MCP client powered by Rust to streamline Web3 development workflows

## Features

- 🤖 **Claude AI Integration** - Real-time code assistance with streaming responses
- 🔗 **Blockchain Support** - Multi-chain data access via Nodit APIs (Ethereum, Polygon, Arbitrum, Base)
- 🛠️ **MCP Protocol** - Extensible tool ecosystem for enhanced AI capabilities
- 📁 **File Management** - Full project workspace with syntax highlighting
- ⚡ **Low Memory** - Tauri-based desktop app with minimal footprint
- 🎨 **Modern UI** - VS Code-inspired interface with dark theme

## Quick Start

### Prerequisites
- Node.js 18+
- Rust (for Tauri)

### Installation

```bash
# Clone repository
git clone https://github.com/pisuthd/butler.git
cd butler

# Install dependencies
npm install

# Run development server
npm run tauri dev
```

### Authentication

Sign in with demo access key: `butler-demo`

## Usage

### Basic Workflow
1. **Open Project**: `Ctrl+Shift+O` to open folder
2. **AI Chat**: `Ctrl+J` to toggle AI panel
3. **Quick Actions**: Use AI buttons (Analyze, Debug, Explain, Optimize)
4. **MCP Tools**: Access blockchain data and file operations

### Keyboard Shortcuts
- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+J` - Toggle AI panel
- `Ctrl+Shift+P` - Command palette

### AI Features
- Code analysis and suggestions
- Bug detection and fixes
- Code explanation
- Performance optimization
- Blockchain smart contract analysis

### Blockchain Integration
- Multi-chain wallet analysis
- Smart contract inspection
- Token balance queries
- Transaction history
- DeFi protocol integration

## MCP Tools

Butler supports Model Context Protocol for extensible AI capabilities:

- **Nodit** - Blockchain data across multiple networks
- **Filesystem** - File operations and project management
- **Git** - Repository status and history
- **Database** - SQLite query capabilities

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   React UI      │────│  Claude AI   │────│ MCP Servers │
│   (Frontend)    │    │  (Assistant) │    │   (Tools)   │
└─────────────────┘    └──────────────┘    └─────────────┘
         │                       │                  │
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Tauri Core    │    │ File Manager │    │ Nodit APIs  │
│   (Backend)     │    │   (Hooks)    │    │ (Blockchain)│
└─────────────────┘    └──────────────┘    └─────────────┘
```

## Development

### Project Structure
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # AI and MCP services
├── utils/              # Utility functions
└── test/               # Test files

src-tauri/              # Rust backend
├── src/                # Tauri application code
└── Cargo.toml          # Rust dependencies
```
   

## License

MIT License