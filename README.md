# ThesisHub - Tokenized Research Platform

A decentralized application for uploading, sharing, and purchasing research papers on the blockchain.

## Features

- Upload research papers with automatic AI-generated descriptions
- Purchase and download research papers using cryptocurrency
- Blockchain-based ownership and access control
- IPFS storage for decentralized file hosting
- Intuitive UX for easy navigation and file management

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Wagmi Project ID for RainbowKit wallet connection
VITE_WAGMI_PROJECT_ID=your_wagmi_project_id_here

# AsiOne API Key for AI-generated descriptions
VITE_ASI_ONE_API_KEY=your_asi_one_api_key_here
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the development server:
```bash
npm run dev
```

## AI Description Generation

The platform uses AsiOne AI to automatically generate accurate descriptions from uploaded files. This ensures:
- File authenticity and prevents misleading descriptions
- Consistent, professional descriptions
- Automatic content analysis based on file type and content
- 200-300 character limit compliance