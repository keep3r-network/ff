// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import '../utils/Pausable.sol';

contract PausableForTest is Pausable {
  constructor(address _governor) Governable(_governor) {}
}
