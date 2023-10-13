// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IUniSwapV2Router02} from "./Interfaces.sol";

/// @custom:security-contact carlosalbertorios3@gmail.com
contract PublicSale is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    struct NFTData {
        address owner; // Dueño actual del NFT
        uint256 price; // Precio de compra (en BBTKN)
    }

    IERC20 usdcToken;
    IERC20Upgradeable bbToken;
    IUniSwapV2Router02 router;
    mapping(uint256 => NFTData) public mintedNFTs;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90000 * 10 ** 18;

    event PurchaseNftWithId(address account, uint256 id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _bbTokenAddress,
        address _usdcTokenAddress,
        address _uniswapRouterAddress
    ) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(EXECUTER_ROLE, msg.sender);

        usdcToken = IERC20(_usdcTokenAddress);
        bbToken = IERC20Upgradeable(_bbTokenAddress);
        router = IUniSwapV2Router02(_uniswapRouterAddress);
    }

    modifier validateNFTRange(
        uint256 _idNFT,
        uint256 _minValue,
        uint256 _maxValue
    ) {
        string memory messageError = string(
            abi.encodePacked(
                "El tokenId debe estar en el rango de ",
                uint256ToString(_minValue),
                " a ",
                uint256ToString(_maxValue),
                "."
            )
        );
        require(_idNFT >= _minValue && _idNFT <= _maxValue, messageError);
        _;
    }

    modifier notMintedBefore(uint256 _tokenId) {
        require(
            mintedNFTs[_tokenId].owner == address(0),
            "Este NFT ya ha sido minteado previamente."
        );
        _;
    }

    function purchaseWithTokens(
        uint256 _id
    ) public validateNFTRange(_id, 0, 699) notMintedBefore(_id) {
        uint256 priceToken = getPriceForId(_id);

        require(
            bbToken.balanceOf(msg.sender) >= priceToken,
            "No tienes suficientes BBTKN para comprar este NFT"
        );
        require(
            bbToken.transferFrom(msg.sender, address(this), priceToken),
            "Ha ocurrido un error en la transferencia de BBTKN"
        );

        mintedNFTs[_id] = NFTData({owner: msg.sender, price: priceToken});
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithUSDC(
        uint256 _id,
        uint256 _amountIn
    ) external validateNFTRange(_id, 0, 699) notMintedBefore(_id) {
        uint256 priceTokenBBTKN = getPriceForId(_id);
        (uint256 reserveBbtkn, uint256 reserveUsdc) = router.getReserves();
        uint256 amountInBBTKN = router.getAmountIn(
            _amountIn,
            reserveUsdc,
            reserveBbtkn
        );

        require(
            amountInBBTKN >= priceTokenBBTKN,
            "El valor enviado no es suficiente para comprar este NFT"
        );
        // transfiere _amountIn de USDC a este contrato
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amountIn),
            "Ha ocurrido un error en la transferencia de USDC"
        );

        //  approve al router para usar los USDC
        usdcToken.approve(address(router), _amountIn);

        //swap USDC a BBTKN
        address[] memory path = new address[](2);
        path[0] = address(usdcToken);
        path[1] = address(bbToken);

        uint[] memory _amounts = router.swapTokensForExactTokens(
            priceTokenBBTKN,
            _amountIn,
            path,
            address(this),
            block.timestamp + 300
        );

        // transfiere el excedente de USDC a msg.sender
        if (_amounts[0] < _amountIn)
            require(
                usdcToken.transfer(msg.sender, _amountIn - _amounts[0]),
                "Ha ocurrido un error en la devolucion del excedente de USDC"
            );

        mintedNFTs[_id] = NFTData({owner: msg.sender, price: priceTokenBBTKN});
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithEtherAndId(
        uint256 _id
    ) public payable validateNFTRange(_id, 700, 999) notMintedBefore(_id) {
        require(
            msg.value >= 0.01 ether,
            "La cantidad de ether enviada no es suficiente para comprar este NFT."
        );

        uint256 change = msg.value - 0.01 ether;
        if (change > 0) {
            address payable buyer = payable(msg.sender);
            buyer.transfer(change);
        }

        mintedNFTs[_id] = NFTData({owner: msg.sender, price: 0.01 ether});
        emit PurchaseNftWithId(msg.sender, _id);
    }

    function depositEthForARandomNft() public payable {
        require(
            msg.value == 0.01 ether,
            "Debes enviar exactamente 0.01 ether para comprar un NFT aleatorio."
        );

        uint256 randomNumber;
        bool minted = true;
        while (minted) {
            randomNumber = generateRandomNumber(700, 999);
            minted = (mintedNFTs[randomNumber].owner != address(0));
        }

        // En este punto, 'randomNumber' contiene un número que no ha sido minteado.
        mintedNFTs[randomNumber] = NFTData({
            owner: msg.sender,
            price: 0.01 ether
        });
        emit PurchaseNftWithId(msg.sender, randomNumber);
    }

    receive() external payable {
        depositEthForARandomNft();
    }

    function withdrawEther() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            address(this).balance > 0,
            "No hay ether disponible en el contrato para retirar."
        );
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawTokens() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 bbitesContractBalance = bbToken.balanceOf(address(this));
        require(
            bbitesContractBalance > 0,
            "No hay BBTKN disponibles en el contrato para retirar."
        );

        require(
            bbToken.transfer(msg.sender, bbitesContractBalance),
            "La transferencia de tokens BBTKN no se pudo completar."
        );
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function getPriceForId(
        uint256 id
    ) public view validateNFTRange(id, 0, 699) returns (uint256) {
        uint256 priceToken;

        if (id >= 0 && id <= 199) {
            priceToken = 1000 * 10 ** 18;
        } else if (id >= 200 && id <= 499) {
            priceToken = id * 20 * 10 ** 18;
        } else if (id >= 500) {
            uint256 _basePrice = 10000;
            uint256 _elapsedDays = (block.timestamp - startDate) / 86400;
            priceToken = _basePrice + _elapsedDays * 20_000;
            priceToken = priceToken <= MAX_PRICE_NFT
                ? priceToken
                : MAX_PRICE_NFT;
            priceToken *= 10 ** 18;
        }
        return priceToken;
    }

    function generateRandomNumber(
        uint256 minValue,
        uint256 maxValue
    ) internal view returns (uint256) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % (maxValue - minValue + 1);
        return randomNumber + minValue;
    }

    function uint256ToString(
        uint256 value
    ) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 length;
        while (temp > 0) {
            length++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(length);
        while (value > 0) {
            length -= 1;
            buffer[length] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
}
