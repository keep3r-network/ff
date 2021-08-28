// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

interface ve {
    function balanceOfAt(address owner, uint block_number) external view returns (uint);
    function deposit_for(address addr, uint value) external;
}

interface erc20 {
    function approve(address spender, uint amount) external returns (bool);
}

contract swap {
    ve constant veIBFF = ve(0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2);
    ve constant veKP3R = ve(0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2);
    address constant kp3r = 0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44;
    uint immutable public snapshot;

    mapping(address => bool) public has_claimed;

    event Claim(address indexed claimant, uint amount);

    constructor(uint _snapshot) {
        snapshot = _snapshot;
        _safeApprove(kp3r, address(veKP3R), type(uint).max);
    }

    function claim(address claimant) external returns (bool) {
        return _claim(claimant);
    }

    function claim() external returns (bool) {
        return _claim(msg.sender);
    }

    function _claim(address claimant) internal returns (bool) {
        require(!has_claimed[claimant]);
        has_claimed[claimant] = true;

        uint _amount = veIBFF.balanceOfAt(claimant, snapshot);
        veKP3R.deposit_for(claimant, _amount);
        emit Claim(claimant, _amount);
        return true;
    }

    function _safeApprove(address token, address spender, uint256 value) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(erc20.approve.selector, spender, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }
}
