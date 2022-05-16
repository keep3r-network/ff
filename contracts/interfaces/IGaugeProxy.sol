// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IGaugeProxy {
  function totalWeight() external returns (uint256);

  function keeper() external returns (address);

  function gov() external returns (address);

  function nextgov() external returns (address);

  function commitgov() external returns (uint256);

  function delay() external returns (uint256);

  function gauges(address _pool) external view returns (address _gauge);

  function weights(address _token) external view returns (uint256 _weight);

  function votes(address _voter, address _gauge) external view returns (uint256 _votes);

  function tokenVote(address _voter, uint256 _i) external view returns (address _votes);

  function usedWeights(address _voter) external view returns (uint256 _usedWeights);

  function enabled(address _token) external view returns (bool _enabled);

  function tokens() external view returns (address[] memory);

  function setKeeper(address _keeper) external;

  function setGov(address _gov) external;

  function acceptGov() external;

  function reset() external;

  function poke(address _owner) external;

  function vote(address[] calldata _tokenVote, uint256[] calldata _weights) external;

  function addGauge(address _token, address _gauge) external;

  function disable(address _token) external;

  function enable(address _token) external;

  function length() external view returns (uint256);

  function forceDistribute() external;

  function distribute() external;
}
