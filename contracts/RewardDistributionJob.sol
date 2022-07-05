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
import './interfaces/external/IIBBurner.sol';
import './interfaces/external/IIBController.sol';

contract RewardDistributionJob is IRewardDistributionJob, Governable, Keep3rJob, Pausable, DustCollector {
  /// @inheritdoc IRewardDistributionJob
  address public gaugeProxy;
  /// @inheritdoc IRewardDistributionJob
  address public ibBurner;
  /// @inheritdoc IRewardDistributionJob
  address public ibController;

  uint32 constant NOT_YET = 0xffffffff;
  /// @inheritdoc IRewardDistributionJob
  uint32 public needsExchange;
  /// @inheritdoc IRewardDistributionJob
  uint32 public needsDistribute;
  /// @inheritdoc IRewardDistributionJob
  uint32 public timeout;

  constructor(
    address _gaugeProxy,
    address _ibBurner,
    address _ibController,
    uint32 _timeout,
    address _governor
  ) Governable(_governor) {
    _setGaugeProxy(_gaugeProxy);
    _setIbBurner(_ibBurner);
    _setIbController(_ibController);
    _setTimeout(_timeout);
  }

  // methods

  /// @inheritdoc IRewardDistributionJob
  function work() external upkeep notPaused {
    IGaugeProxy(gaugeProxy).distribute();
    IIBController(ibController).profit();
    IIBBurner(ibBurner).update_snx();
    needsExchange = _timestamp() + timeout;
    needsDistribute = NOT_YET;
  }

  /// @inheritdoc IRewardDistributionJob
  function exchange() external upkeep notPaused {
    uint32 _t = _timestamp();
    if (needsExchange > _t) revert NotYet(needsExchange - _t);
    IIBBurner(ibBurner).exchanger();
    needsDistribute = _t + timeout;
    needsExchange = NOT_YET;
  }

  /// @inheritdoc IRewardDistributionJob
  function distribute() external upkeep notPaused {
    uint32 _t = _timestamp();
    if (needsDistribute > _t) revert NotYet(needsDistribute - _t);
    IIBBurner(ibBurner).distribute();
    needsDistribute = NOT_YET;
  }

  // setters

  /// @inheritdoc IRewardDistributionJob
  function setGaugeProxy(address _gaugeProxy) external onlyGovernor {
    _setGaugeProxy(_gaugeProxy);
  }

  /// @inheritdoc IRewardDistributionJob
  function setIbBurner(address _ibBurner) external onlyGovernor {
    _setIbBurner(_ibBurner);
  }

  /// @inheritdoc IRewardDistributionJob
  function setIbController(address _ibController) external onlyGovernor {
    _setIbController(_ibController);
  }

  /// @inheritdoc IRewardDistributionJob
  function setTimeout(uint32 _timeout) external onlyGovernor {
    _setTimeout(_timeout);
  }

  // Internals

  function _setGaugeProxy(address _gaugeProxy) internal {
    gaugeProxy = _gaugeProxy;
    emit GaugeProxyAddressSet(gaugeProxy);
  }

  function _setIbBurner(address _ibBurner) internal {
    ibBurner = _ibBurner;
    emit IbBurnerAddressSet(ibBurner);
  }

  function _setIbController(address _ibController) internal {
    ibController = _ibController;
    emit IbControllerAddressSet(ibController);
  }

  function _setTimeout(uint32 _timeout) internal {
    timeout = _timeout;
    emit TimeoutSet(timeout);
  }

  function _timestamp() internal view returns (uint32) {
    return uint32(block.timestamp);
  }
}
