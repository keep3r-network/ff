// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import '../utils/Keep3rJob.sol';

contract Keep3rJobForTest is Keep3rJob {
  constructor(address _governor) Governable(_governor) Keep3rJob() {}

  function externalIsValidKeeper(address _keeper) external {
    _isValidKeeper(_keeper);
  }
}
