// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./rng.sol"; // Import the SecureRandomConsumer contract (your provided rng.sol)

contract NFTCardGame is ERC721, Ownable {
    SecureRandomConsumer public secureRandomConsumer; // Instance of SecureRandomConsumer
    uint256 public mintPrice;
    uint256 private _tokenIdCounter;

    enum Rarity { Common, Rare, Epic, Legendary }
    struct NFTAttributes {
        Rarity rarity;
        string name;
        uint256 attackDamage; // Scaled by 100 (2 decimals)
    }

    string[5] private names = [
        "Dragonblade",
        "Shadowstrike",
        "Frostguard",
        "Soulreaver",
        "Thunderclaw"
    ];

    mapping(uint256 => NFTAttributes) private _nftAttributes;
    mapping(address => uint256[]) private _ownedTokens;

    // New mappings for fight functionality
    struct Fight {
        uint256 tokenIdPlayer1;
        uint256 tokenIdPlayer2;
        address player1;
        address player2;
        bool isComplete;
    }

    uint256 private fightIdCounter;
    mapping(uint256 => Fight) private fights;

    event NFTMinted(address indexed owner, uint256 tokenId, Rarity rarity, string name, uint256 attackDamage);
    event MintPriceChanged(uint256 newPrice);

    // Events for fight system
    event FightStarted(uint256 indexed fightId, address player1, uint256 tokenIdPlayer1);
    event FightJoined(uint256 fightId, address player2, uint256 tokenIdPlayer2);
    event FightResolved(uint256 fightId, address winner);

    constructor(
        uint256 _initialMintPrice,
        address initialOwner // Optional parameter for initial owner
    ) ERC721("CardGameNFT", "CGNFT") Ownable(initialOwner != address(0) ? initialOwner : msg.sender) {
        secureRandomConsumer = new SecureRandomConsumer(); // Initialize SecureRandomConsumer
        mintPrice = _initialMintPrice;
        _tokenIdCounter = 1;
        fightIdCounter = 1;
    }

    // Helper function to remove a token ID from an array
    function _removeTokenFromOwnedTokens(address owner, uint256 tokenId) internal {
        uint256[] storage tokens = _ownedTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                // Replace the token with the last element and reduce the array size
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // Helper function to add a token ID to an array
    function _addTokenToOwnedTokens(address owner, uint256 tokenId) internal {
        _ownedTokens[owner].push(tokenId);
    }

    // Function to mint an NFT
    function mintNFT() external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        (uint256 randomNumber, bool isSecure, ) = secureRandomConsumer.getSecureRandomNumber();
        require(isSecure, "Random number is not secure");
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        _ownedTokens[msg.sender].push(tokenId);
        (Rarity rarity, string memory name, uint256 attackDamage) = _generateAttributes(randomNumber);
        _nftAttributes[tokenId] = NFTAttributes(rarity, name, attackDamage);
        emit NFTMinted(msg.sender, tokenId, rarity, name, attackDamage);
    }

    // Function to generate attributes for newly minted NFTs
    function _generateAttributes(uint256 randomNumber) internal view returns (
        Rarity rarity,
        string memory name,
        uint256 attackDamage
    ) {
        rarity = Rarity(randomNumber % 4); // Random rarity (0-3)
        uint256 nameIndex = (randomNumber / 4) % 5; // Random name index (0-4)
        uint256 variation = 9000 + ((randomNumber / 20) % 2001); // 90.00%-110.00%
        uint256 damageMultiplier = _getMultiplier(rarity);
        attackDamage = (damageMultiplier * variation) / 100;
        return (rarity, names[nameIndex], attackDamage);
    }

    // Function to get the attack damage multiplier based on rarity
    function _getMultiplier(Rarity rarity) internal pure returns (uint256) {
        if (rarity == Rarity.Common) return 100;
        if (rarity == Rarity.Rare) return 120;
        if (rarity == Rarity.Epic) return 150;
        return 200; // Legendary
    }

    // Function to retrieve attributes of an NFT
    function getNFTAttributes(uint256 tokenId) external view returns (
        Rarity rarity,
        string memory name,
        uint256 attackDamage
    ) {
        require(_exists(tokenId), "Token does not exist");
        NFTAttributes memory attributes = _nftAttributes[tokenId];
        return (attributes.rarity, attributes.name, attributes.attackDamage);
    }

    // Custom _exists function to check if a token ID exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Function to allow the owner to update the mint price
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
        emit MintPriceChanged(_newPrice);
    }

    // Function to allow the owner to withdraw funds from the contract
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Overrides the base URI for metadata
    function _baseURI() internal pure override returns (string memory) {
        return "https://your-metadata-server.com/api/token/ ";
    }

    // Function to retrieve all token IDs owned by the caller (msg.sender)
    function getMyNFTs() external view returns (uint256[] memory) {
        return _ownedTokens[msg.sender];
    }

    // Function to retrieve all NFTs owned by the caller (msg.sender) along with their data
    function getMyNFTsWithData() external view returns (
        uint256[] memory tokenIds,
        Rarity[] memory rarities,
        string[] memory names,
        uint256[] memory attackDamages
    ) {
        uint256[] memory ownedTokens = _ownedTokens[msg.sender];
        uint256 count = ownedTokens.length;
        tokenIds = new uint256[](count);
        rarities = new Rarity[](count);
        names = new string[](count);
        attackDamages = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = ownedTokens[i];
            NFTAttributes memory attributes = _nftAttributes[tokenId];
            tokenIds[i] = tokenId;
            rarities[i] = attributes.rarity;
            names[i] = attributes.name;
            attackDamages[i] = attributes.attackDamage;
        }
        return (tokenIds, rarities, names, attackDamages);
    }

    // Function to start a fight
    function startFight(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "You do not own this token");
        require(fights[fightIdCounter].player1 == address(0), "Fight ID already in use");

        // Transfer the NFT to the contract
        _transfer(msg.sender, address(this), tokenId);

        // Create a new fight
        fights[fightIdCounter] = Fight({
            tokenIdPlayer1: tokenId,
            tokenIdPlayer2: 0,
            player1: msg.sender,
            player2: address(0),
            isComplete: false
        });

        // Emit the fight ID along with the player and token details
        emit FightStarted(fightIdCounter, msg.sender, tokenId);

        // Increment the fight ID counter
        fightIdCounter++;
    }

    // Function to join a fight
    function joinFight(uint256 fightId, uint256 tokenId) external {
        require(fightId > 0 && fightId < fightIdCounter, "Invalid fight ID");
        require(fights[fightId].player2 == address(0), "Fight already joined");
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "You do not own this token");

        // Transfer the NFT to the contract
        _transfer(msg.sender, address(this), tokenId);

        // Update fight details
        fights[fightId].tokenIdPlayer2 = tokenId;
        fights[fightId].player2 = msg.sender;

        emit FightJoined(fightId, msg.sender, tokenId);
    }

    // Function to resolve a fight
    function resolveFight(uint256 fightId) external {
        require(fightId > 0 && fightId < fightIdCounter, "Invalid fight ID");
        require(fights[fightId].player2 != address(0), "Fight not fully joined");
        require(!fights[fightId].isComplete, "Fight already resolved");

        Fight storage fight = fights[fightId];

        // Get attack damages
        uint256 attackDamage1 = _nftAttributes[fight.tokenIdPlayer1].attackDamage;
        uint256 attackDamage2 = _nftAttributes[fight.tokenIdPlayer2].attackDamage;

        // Calculate winner randomly weighted by attack damage
        (uint256 randomNumber, bool isSecure, ) = secureRandomConsumer.getSecureRandomNumber();
        require(isSecure, "Random number is not secure");

        uint256 totalAttack = attackDamage1 + attackDamage2;
        uint256 randomValue = randomNumber % totalAttack;

        address winner = randomValue < attackDamage1 ? fight.player1 : fight.player2;
        address loser = winner == fight.player1 ? fight.player2 : fight.player1;

        // Transfer both NFTs to the winner and update _ownedTokens
        _transfer(address(this), winner, fight.tokenIdPlayer1);
        _transfer(address(this), winner, fight.tokenIdPlayer2);

        // Update _ownedTokens for the winner
        _addTokenToOwnedTokens(winner, fight.tokenIdPlayer1);
        _addTokenToOwnedTokens(winner, fight.tokenIdPlayer2);

        // Remove the NFTs from the loser's _ownedTokens
        _removeTokenFromOwnedTokens(loser, fight.tokenIdPlayer1);
        _removeTokenFromOwnedTokens(loser, fight.tokenIdPlayer2);

        // Emit the winner details
        emit FightResolved(fightId, winner);

        // Mark the fight as complete
        fight.isComplete = true;
    }

    // Function to get the status of a fight by fightId
    function getFightStatus(uint256 fightId) external view returns (
        uint256 tokenIdPlayer1,
        uint256 tokenIdPlayer2,
        address player1,
        address player2,
        bool isComplete
    ) {
        require(fightId > 0 && fightId < fightIdCounter, "Invalid fight ID");

        Fight memory fight = fights[fightId];

        // Return the fight details
        return (
            fight.tokenIdPlayer1,
            fight.tokenIdPlayer2,
            fight.player1,
            fight.player2,
            fight.isComplete
        );
    }
}