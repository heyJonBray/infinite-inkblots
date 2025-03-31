# Generative Rorschach NFT Architecture

## Frontend (Minting Site)

- React-based web application with Web3 integration
- Components for wallet connection and minting interface
- Ethereum address validation
- Optional preview of the Rorschach pattern using your algorithm

## Backend Generation Service

- Node.js server to handle generation requests
- Integration with your existing image generation algorithm
- Metadata generation service that creates the NFT JSON
- Optimization for handling concurrent minting requests

## IPFS Integration

- NFT.Storage or Pinata API for uploading files to IPFS
- Content addressing to ensure uniqueness
- Pinning service for content availability

## Smart Contract

- ERC-721 standard contract with on-demand minting
- TokenURI updating mechanism pointing to IPFS
- Gas optimization for on-chain operations

## Deployment Flow

- User connects wallet to minting site
- User initiates mint transaction
- Frontend sends Ethereum address to backend service
- Backend runs your algorithm to generate the unique image
- Backend creates metadata with appropriate attributes
- Images and metadata get uploaded to IPFS
- IPFS URIs are returned to the smart contract
- NFT is minted with the IPFS URI as tokenURI

## Project Directories

```t
INKBLOTS-NFT/
├── .cursor/
├── app/                     # minting site
│   ├── components/
│   ├── pages/
│   └── public/
├── docs/
├── node_modules/
├── output/                  # output files
├── server/                  # backend API
│   ├── controllers/
│   ├── middleware/
│   └── services/
├── src/                     # inkblot generator
│   └── utils/
│       ├── colors.js
│       ├── ethUtils.js
│       └── patternGeneration.js
├── contracts/
├── ipfs/                    # IPFS integration
│   ├── services/
│   │   ├── ipfsService.js      # main interaction wrapper
│   │   └── pinningService.js   # handle persistent pinning
│   ├── utils/
│   │   └── formatters.js       # URI formatting utils
│   └── config/
│       └── ipfsConfig.js       # API endpoints
├── scripts/                 # build/deploy scripts
└── test/                    # Tests
```
