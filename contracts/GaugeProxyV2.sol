// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/external/IKeep3rV1Proxy.sol';
import './interfaces/external/IvKP3R.sol';
import './interfaces/external/IrKP3R.sol';
import './interfaces/external/IGauge.sol';
import './interfaces/IGaugeProxy.sol';

contract GaugeProxyV2 is IGaugeProxy {
  address constant _rkp3r = 0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9;
  address constant _vkp3r = 0x2FC52C61fB0C03489649311989CE2689D93dC1a2;
  address constant _kp3rV1 = 0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44;
  address constant _kp3rV1Proxy = 0x976b01c02c636Dd5901444B941442FD70b86dcd5;
  address constant ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;

  uint256 public totalWeight;

  address public keeper;
  address public gov;
  address public nextgov;
  uint256 public commitgov;
  uint256 public constant delay = 1 days;

  address[] internal _tokens;
  mapping(address => address) public gauges; // token => gauge
  mapping(address => uint256) public weights; // token => weight
  mapping(address => mapping(address => uint256)) public votes; // msg.sender => votes
  mapping(address => address[]) public tokenVote; // msg.sender => token
  mapping(address => uint256) public usedWeights; // msg.sender => total voting weight of user
  mapping(address => bool) public enabled;

  function tokens() external view returns (address[] memory) {
    return _tokens;
  }

  constructor() {
    gov = msg.sender;
    _safeApprove(_kp3rV1, _rkp3r, type(uint256).max);
  }

  modifier g() {
    require(msg.sender == gov);
    _;
  }

  modifier k() {
    require(msg.sender == keeper);
    _;
  }

  function setKeeper(address _keeper) external g {
    keeper = _keeper;
  }

  function setGov(address _gov) external g {
    nextgov = _gov;
    commitgov = block.timestamp + delay;
  }

  function acceptGov() external {
    require(msg.sender == nextgov && commitgov < block.timestamp);
    gov = nextgov;
  }

  function reset() external {
    _reset(msg.sender);
  }

  function _reset(address _owner) internal {
    address[] storage _tokenVote = tokenVote[_owner];
    uint256 _tokenVoteCnt = _tokenVote.length;

    for (uint256 i = 0; i < _tokenVoteCnt; i++) {
      address _token = _tokenVote[i];
      uint256 _votes = votes[_owner][_token];

      if (_votes > 0) {
        totalWeight -= _votes;
        weights[_token] -= _votes;
        votes[_owner][_token] = 0;
      }
    }

    delete tokenVote[_owner];
  }

  function poke(address _owner) public {
    address[] memory _tokenVote = tokenVote[_owner];
    uint256 _tokenCnt = _tokenVote.length;
    uint256[] memory _weights = new uint256[](_tokenCnt);

    uint256 _prevUsedWeight = usedWeights[_owner];
    uint256 _weight = IvKP3R(_vkp3r).get_adjusted_ve_balance(_owner, ZERO_ADDRESS);

    for (uint256 i = 0; i < _tokenCnt; i++) {
      uint256 _prevWeight = votes[_owner][_tokenVote[i]];
      _weights[i] = (_prevWeight * _weight) / _prevUsedWeight;
    }

    _vote(_owner, _tokenVote, _weights);
  }

  function _vote(
    address _owner,
    address[] memory _tokenVote,
    uint256[] memory _weights
  ) internal {
    // _weights[i] = percentage * 100
    _reset(_owner);
    uint256 _tokenCnt = _tokenVote.length;
    uint256 _weight = IvKP3R(_vkp3r).get_adjusted_ve_balance(_owner, ZERO_ADDRESS);
    uint256 _totalVoteWeight = 0;
    uint256 _usedWeight = 0;

    for (uint256 i = 0; i < _tokenCnt; i++) {
      _totalVoteWeight += _weights[i];
    }

    for (uint256 i = 0; i < _tokenCnt; i++) {
      address _token = _tokenVote[i];
      address _gauge = gauges[_token];
      uint256 _tokenWeight = (_weights[i] * _weight) / _totalVoteWeight;

      if (_gauge != address(0x0)) {
        _usedWeight += _tokenWeight;
        totalWeight += _tokenWeight;
        weights[_token] += _tokenWeight;
        tokenVote[_owner].push(_token);
        votes[_owner][_token] = _tokenWeight;
      }
    }

    usedWeights[_owner] = _usedWeight;
  }

  function vote(address[] calldata _tokenVote, uint256[] calldata _weights) external {
    require(_tokenVote.length == _weights.length);
    _vote(msg.sender, _tokenVote, _weights);
  }

  function addGauge(address _token, address _gauge) external g {
    require(gauges[_token] == address(0x0), 'exists');
    _safeApprove(_rkp3r, _gauge, type(uint256).max);
    gauges[_token] = _gauge;
    enabled[_token] = true;
    _tokens.push(_token);
  }

  function disable(address _token) external g {
    enabled[_token] = false;
  }

  function enable(address _token) external g {
    enabled[_token] = true;
  }

  function length() external view returns (uint256) {
    return _tokens.length;
  }

  function forceDistribute() external g {
    _distribute();
  }

  function distribute() external k {
    _distribute();
  }

  function _distribute() internal {
    uint256 _balance = IKeep3rV1Proxy(_kp3rV1Proxy).draw();
    IrKP3R(_rkp3r).deposit(_balance);

    if (_balance > 0 && totalWeight > 0) {
      uint256 _totalWeight = totalWeight;
      for (uint256 i = 0; i < _tokens.length; i++) {
        if (!enabled[_tokens[i]]) {
          _totalWeight -= weights[_tokens[i]];
        }
      }
      for (uint256 x = 0; x < _tokens.length; x++) {
        if (enabled[_tokens[x]]) {
          uint256 _reward = (_balance * weights[_tokens[x]]) / _totalWeight;
          if (_reward > 0) {
            address _gauge = gauges[_tokens[x]];
            IGauge(_gauge).deposit_reward_token(_rkp3r, _reward);
          }
        }
      }
    }
  }

  function _safeApprove(
    address token,
    address spender,
    uint256 value
  ) internal {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.approve.selector, spender, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))));
  }
}
