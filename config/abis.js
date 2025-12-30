// ABIs estándar para diferentes tipos de contratos NFT
module.exports = {
  // ABI estándar ERC-721 con función mint básica
  standardMint: [
    {
      "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
      "name": "mint",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "cost",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "maxSupply",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],

  // ABI para detectar funciones de mint
  mintFunctionDetector: [
    "function mint(uint256) payable",
    "function publicMint(uint256) payable",
    "function mintNFT(uint256) payable",
    "function safeMint(uint256) payable",
    "function mint(address,uint256) payable",
    "function mintTo(address,uint256) payable",
    "function freeMint(uint256)",
    "function claim(uint256) payable",
    "function purchase(uint256) payable",
    "function cost() view returns (uint256)",
    "function price() view returns (uint256)",
    "function mintPrice() view returns (uint256)",
    "function getPrice() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function maxMintAmount() view returns (uint256)",
    "function paused() view returns (bool)",
    "function publicSaleActive() view returns (bool)"
  ],

  // ABI completo ERC-721
  erc721Full: [
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
  ],

  // ABI para Magic Eden launchpad
  magicEdenLaunchpad: [
    "function mint(uint256 quantity) payable",
    "function mintPrice() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function maxPerWallet() view returns (uint256)",
    "function mintStartTime() view returns (uint256)"
  ]
};
