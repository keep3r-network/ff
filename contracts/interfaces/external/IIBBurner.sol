// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9 <0.9.0;

interface IIBBurner {
  function update_snx() external;

  // converts all profits from non eur based tokens to sEUR
  function exchanger() external;

  // convert sEUR to ibEUR and distribute
  function distribute_no_checkpoint() external;

  // convert sEUR to ibEUR and distribute
  function distribute() external;
}
