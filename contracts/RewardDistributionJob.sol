// SPDX-License-Identifier: MIT

/*

  Coded for The Keep3r Network with ♥ by
  ██████╗░███████╗███████╗██╗  ░██╗░░░░░░░██╗░█████╗░███╗░░██╗██████╗░███████╗██████╗░██╗░░░░░░█████╗░███╗░░██╗██████╗░
  ██╔══██╗██╔════╝██╔════╝██║  ░██║░░██╗░░██║██╔══██╗████╗░██║██╔══██╗██╔════╝██╔══██╗██║░░░░░██╔══██╗████╗░██║██╔══██╗
  ██║░░██║█████╗░░█████╗░░██║  ░╚██╗████╗██╔╝██║░░██║██╔██╗██║██║░░██║█████╗░░██████╔╝██║░░░░░███████║██╔██╗██║██║░░██║
  ██║░░██║██╔══╝░░██╔══╝░░██║  ░░████╔═████║░██║░░██║██║╚████║██║░░██║██╔══╝░░██╔══██╗██║░░░░░██╔══██║██║╚████║██║░░██║
  ██████╔╝███████╗██║░░░░░██║  ░░╚██╔╝░╚██╔╝░╚█████╔╝██║░╚███║██████╔╝███████╗██║░░██║███████╗██║░░██║██║░╚███║██████╔╝
  ╚═════╝░╚══════╝╚═╝░░░░░╚═╝  ░░░╚═╝░░░╚═╝░░░╚════╝░╚═╝░░╚══╝╚═════╝░╚══════╝╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░
  https://defi.sucks

*/

pragma solidity >=0.8.12 <0.9.0;

import './utils/Governable.sol';
import './utils/Pausable.sol';
import './utils/DustCollector.sol';
import './utils/Keep3rJob.sol';
import './interfaces/IRewardDistributionJob.sol';
import './interfaces/IGaugeProxy.sol';

contract RewardDistributionJob is IRewardDistributionJob, Governable, Keep3rJob, Pausable, DustCollector {
  address public gaugeProxy;

  constructor(address _gaugeProxy, address _governor) Governable(_governor) {
    _setGaugeProxy(_gaugeProxy);
  }

  function work() external upkeep {
    if (paused) revert Paused();
    IGaugeProxy(gaugeProxy).distribute();
  }

  function setGaugeProxy(address _gaugeProxy) external onlyGovernor {
    _setGaugeProxy(_gaugeProxy);
  }

  // Internals

  function _setGaugeProxy(address _gaugeProxy) internal {
    gaugeProxy = _gaugeProxy;
    emit GaugeProxyAddressSet(gaugeProxy);
  }
}
