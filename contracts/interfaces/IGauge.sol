// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

interface IGauge {
  function deposit_reward_token(address, uint256) external;
}
