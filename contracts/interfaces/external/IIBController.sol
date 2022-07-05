// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9 <0.9.0;

interface IIBController {
  // claim profits and distribute to ve_dist
  function profit() external;

  function profit(address[] memory _tokens) external;
}
