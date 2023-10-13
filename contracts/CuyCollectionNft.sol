// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract CuyCollectionNft is
    Initializable,
    ERC721Upgradeable,
    ERC721PausableUpgradeable,
    AccessControlUpgradeable,
    ERC721BurnableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 public root;

    event Burn(address account, uint256 id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        address minter
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __ERC721Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmaGQooCF9jFDJ9XHUNvxK837JWaS1x7unxEQKba1mXntP/";
    }

    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(
            tokenId >= 0 && tokenId <= 999,
            "El tokenId debe estar en el rango de 0 a 999."
        );
        require(
            !_exists(tokenId),
            "Token previamente minteado. Elige otro tokenId."
        );
        _safeMint(to, tokenId);
    }

    function safeMintWhiteList(
        address to,
        uint256 tokenId,
        bytes32[] calldata proofs
    ) public whenNotPaused {
        require(
            to == msg.sender,
            "El destinatario del token debe ser el mismo que el minteador."
        );
        require(
            tokenId >= 1000 && 1999 <= tokenId,
            "Intentas mintear un NFT que no es elegible en la lista blanca."
        );
        require(
            !_exists(tokenId),
            "Token previamente minteado. Elige otro tokenId."
        );
        require(
            _verifyMerkleProof(to, tokenId, proofs),
            "Este tokenId y/o destinatario no pertenece a la lista blanca."
        );

        _safeMint(to, tokenId);
    }

    function buyBack(uint256 id) public {
        address ownerNFT = ERC721Upgradeable.ownerOf(id);

        require(ownerNFT == msg.sender, "Este NFT no te pertenece.");
        require(
            id >= 1000 && id <= 1999,
            "El tokenId debe estar en el rango de 1000 a 1999."
        );

        burn(id);
        emit Burn(ownerNFT, id);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _verifyMerkleProof(
        address to,
        uint256 tokenId,
        bytes32[] calldata proofs
    ) internal view returns (bool) {
        bytes32 dataHash = keccak256(abi.encodePacked(tokenId, to));
        return MerkleProof.verify(proofs, root, dataHash);
    }

    function updateRoot(bytes32 _root) public onlyRole(UPGRADER_ROLE) {
        root = _root;
    }

    // The following functions are overrides required by Solidity.
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    )
        internal
        override(ERC721PausableUpgradeable, ERC721Upgradeable)
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
