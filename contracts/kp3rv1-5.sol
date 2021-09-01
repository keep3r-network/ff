// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface kp3r {
    function addVotes(address voter, uint amount) external;
    function removeVotes(address voter, uint amount) external;
    function addKPRCredit(address job, uint amount) external;
    function approveLiquidity(address liquidity) external;
    function revokeLiquidity(address liquidity) external;
    function mint(uint amount) external;
    function addJob(address job) external;
    function removeJob(address job) external;
    function setKeep3rHelper(address _kprh) external;
    function setGovernance(address _governance) external;
    function dispute(address keeper) external;
    function slash(address bonded, address keeper, uint amount) external;
    function revoke(address keeper) external;
    function resolve(address keeper) external;
    function acceptGovernance() external;

    function liquidityAmount(address owner, address liquidity, address job) external view returns (uint);
    function liquidityAmountsUnbonding(address owner, address liquidity, address job) external view returns (uint);
    function liquidityProvided(address owner, address liquidity, address job) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
    function balanceOf(address) external view returns (uint);
}

contract Keep3rV2 {
    uint constant WEEK = 86400 * 6;
    kp3r constant _kp3r = kp3r(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    address public governance;
    address public pendingGov;

    mapping(address => uint) public caps;
    mapping(address => uint) public next;
    address[] _recipients;
    mapping(address => bool) _recipientExists;

    constructor() {
        governance = 0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83;
    }

    modifier gov() {
        require(msg.sender == governance);
        _;
    }

    function setGov(address _gov) external gov {
        pendingGov = _gov;
    }

    function acceptGov() external {
        require(msg.sender == pendingGov);
        governance = pendingGov;
    }

    function addRecipient(address recipient, uint amount) external gov {
        if (!_recipientExists[recipient]) {
            _recipientExists[recipient] = true;
            _recipients.push(recipient);
        }
        caps[recipient] = amount;
    }

    function recipients() external view returns (address[] memory) {
        return _recipients;
    }

    function draw() external returns (bool) {
        require(block.timestamp > next[msg.sender]);
        next[msg.sender] = block.timestamp + WEEK;
        uint _amount = caps[msg.sender];
        _kp3r.mint(_amount);
        return _kp3r.transfer(msg.sender, _amount);
    }

    function addVotes(address voter, uint amount) external gov {
        _kp3r.addVotes(voter, amount);
    }
    function removeVotes(address voter, uint amount) external gov {
        _kp3r.removeVotes(voter, amount);
    }
    function addKPRCredit(address job, uint amount) external gov {
        _kp3r.addKPRCredit(job, amount);
    }
    function approveLiquidity(address liquidity) external gov {
        _kp3r.approveLiquidity(liquidity);
    }
    function revokeLiquidity(address liquidity) external gov {
        _kp3r.revokeLiquidity(liquidity);
    }
    function mint(address to, uint amount) external gov {
        _kp3r.mint(amount);
        _kp3r.transfer(to, amount);
    }
    function mint(uint amount) external gov {
        _kp3r.mint(amount);
    }
    function addJob(address job) external gov {
        _kp3r.addJob(job);
    }
    function removeJob(address job) external gov {
        _kp3r.removeJob(job);
    }
    function setKeep3rHelper(address _kprh) external gov {
        _kp3r.setKeep3rHelper(_kprh);
    }
    function setGovernance(address _governance) external gov {
        _kp3r.setGovernance(_governance);
    }
    function acceptGovernance() external gov {
        _kp3r.acceptGovernance();
    }
    function dispute(address keeper) external gov {
        _kp3r.dispute(keeper);
    }
    function slash(address bonded, address keeper, uint amount) external gov {
        _kp3r.slash(bonded, keeper, amount);
    }
    function revoke(address keeper) external gov {
        _kp3r.revoke(keeper);
    }
    function resolve(address keeper) external gov {
        _kp3r.resolve(keeper);
    }
    function transfer(address to, uint amount) external gov {
        _kp3r.transfer(to, amount);
    }

    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    function dust(address _token, uint256 _amount) external gov {
        if (_token == ETH_ADDRESS) {
          payable(governance).transfer(_amount);
        } else {
          _safeTransfer(_token, governance, _amount);
        }
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(kp3r.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))));
    }
}
