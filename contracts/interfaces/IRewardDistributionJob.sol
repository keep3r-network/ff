// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

interface IRewardDistributionJob {
  /// @notice Emitted when the gaugeProxy is changed
  /// @param _gaugeProxy Address of the new gaugeProxy
  event GaugeProxyAddressSet(address _gaugeProxy);

  /// @notice Emitted when the ibBurner is changed
  /// @param _ibBurner Address of the new ibBurner
  event IbBurnerAddressSet(address _ibBurner);

  /// @notice Emitted when the ibController is changed
  /// @param _ibController Address of the new ibController
  event IbControllerAddressSet(address _ibController);

  /// @notice Emitted when the timeout is changed
  /// @param _timeout Amount of seconds to pass between each step of the job
  event TimeoutSet(uint32 _timeout);

  /// @notice Throws when a keeper tries to work a step of the job before the timeout has passed
  /// @param _timeUntilNeeded Amount of seconds to pass before current step of the job is workable
  error NotYet(uint32 _timeUntilNeeded);

  /// @return _gaugeProxy Address of the GaugeProxy
  function gaugeProxy() external returns (address _gaugeProxy);

  /// @return _ibBurner Address of the IbBurner
  function ibBurner() external returns (address _ibBurner);

  /// @return _ibController Address of the IbController
  function ibController() external returns (address _ibController);

  /// @return _needsExchange Timestamp of when the job will need exchange
  function needsExchange() external returns (uint32 _needsExchange);

  /// @return _needsDistribute Timestamp of when the job will need distribution
  function needsDistribute() external returns (uint32 _needsDistribute);

  /// @return _timeout Amount of seconds to pass before each step of the job
  function timeout() external returns (uint32 _timeout);

  /// @notice This function will trigger rKP3R gauges distribution, ibController profit, and SNX update
  /// @dev Can be called once a week, else Keep3rProxy should revert
  function work() external;

  /// @notice This function will trigger ibBurner exchanger
  /// @dev Can be called at least one timeout after work
  function exchange() external;

  /// @notice This function will trigger ibBurner distribute
  /// @dev Can be called at least one timeout after distribute
  function distribute() external;

  /// @notice Sets the gaugeProxy address
  /// @param _gaugeProxy The address of the new gaugeProxy
  function setGaugeProxy(address _gaugeProxy) external;

  /// @notice Sets the ibBurner address
  /// @param _ibBurner The address of the new ibBurner
  function setIbBurner(address _ibBurner) external;

  /// @notice Sets the ibController address
  /// @param _ibController The address of the new ibController
  function setIbController(address _ibController) external;

  /// @notice Sets the timeout
  /// @param _timeout Amount of seconds for the new timeout
  function setTimeout(uint32 _timeout) external;
}
