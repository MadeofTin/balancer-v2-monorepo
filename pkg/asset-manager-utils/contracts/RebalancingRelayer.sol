// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@balancer-labs/v2-vault/contracts/AssetHelpers.sol";
import "@balancer-labs/v2-vault/contracts/interfaces/IAsset.sol";
import "@balancer-labs/v2-vault/contracts/interfaces/IVault.sol";
import "@balancer-labs/v2-pool-utils/contracts/interfaces/IBasePoolRelayer.sol";
import "@balancer-labs/v2-solidity-utils/contracts/misc/IWETH.sol";
import "@balancer-labs/v2-solidity-utils/contracts/helpers/BalancerErrors.sol";
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Address.sol";

import "./IAssetManager.sol";

contract RebalancingRelayer is IBasePoolRelayer, AssetHelpers {
    using Address for address payable;

    // We start at a non-zero value to make EIP2200 refunds lower, meaning there'll be a higher chance of them being
    // fully effective.
    bytes32 internal constant _EMPTY_CALLED_POOL = bytes32(
        0x0000000000000000000000000000000000000000000000000000000000000001
    );

    modifier rebalance(bytes32 poolId, IAsset[] memory assets) {
        _require(_calledPool == _EMPTY_CALLED_POOL, Errors.REBALANCING_RELAYER_REENTERED);
        _calledPool = poolId;
        _;
        _calledPool = _EMPTY_CALLED_POOL;
        _rebalance(poolId, _translateToIERC20(assets));
    }

    IVault public immutable vault;
    bytes32 internal _calledPool;

    constructor(IVault _vault) AssetHelpers(_vault.WETH()) {
        vault = _vault;
        _calledPool = _EMPTY_CALLED_POOL;
    }

    function hasCalledPool(bytes32 poolId) external view override returns (bool) {
        return _calledPool == poolId;
    }

    receive() external payable {
        // Accept ETH transfers only coming from the Vault. This is only expected to happen when joining a pool,
        // any remaining ETH value will be transferred back to this contract and forwarded back to the original sender.
        _require(msg.sender == address(vault), Errors.ETH_TRANSFER);
    }

    function joinPool(
        bytes32 poolId,
        address recipient,
        IVault.JoinPoolRequest memory request
    ) external payable rebalance(poolId, request.assets) {
        vault.joinPool{ value: msg.value }(poolId, msg.sender, recipient, request);

        // Send back to the sender any remaining ETH value
        if (address(this).balance > 0) {
            msg.sender.sendValue(address(this).balance);
        }
    }

    function exitPool(
        bytes32 poolId,
        address payable recipient,
        IVault.ExitPoolRequest memory request
    ) external rebalance(poolId, request.assets) {
        vault.exitPool(poolId, msg.sender, recipient, request);
    }

    function _rebalance(bytes32 poolId, IERC20[] memory tokens) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            (, , , address assetManager) = vault.getPoolTokenInfo(poolId, tokens[i]);
            if (assetManager != address(0)) {
                // Note that malicious Asset Managers could perform reentrant calls at this stage and e.g. try to exit
                // the Pool before Managers for other tokens have rebalanced. This is considered a non-issue as a) no
                // exploits should be enabled by allowing for this, and b) Pools trust their Asset Managers.

                // Do a non-forced rebalance
                IAssetManager(assetManager).rebalance(poolId, false);
            }
        }
    }
}
