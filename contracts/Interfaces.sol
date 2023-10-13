// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IUniSwapV2Router02 {
    // Devuelve la cantidad mínima de activos de entrada
    // necesaria para comprar la cantidad de activos de salida
    // dada (contabilizando las tarifas) dadas las reservas.
    function getAmountIn(
        uint amountOut,
        uint reserveIn,
        uint reserveOut
    ) external pure returns (uint amountIn);

    // Llama a getReserves en el par de los tokens pasados y
    // devuelve los resultados ordenados en el orden en que
    // se pasaron los parámetros.
    function getReserves() external view returns (uint reserveA, uint reserveB);

    // Conozco la cantidad de tokens B que quiero obtener
    // No sé cuántos tokens A voy a pagar
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}
