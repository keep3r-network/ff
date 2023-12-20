// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import '../utils/Governable.sol';

contract GovernableForTest is Governable {
  constructor(address _governor) Governable(_governor) {}
}
