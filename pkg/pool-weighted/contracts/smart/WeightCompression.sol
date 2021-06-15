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

import "@balancer-labs/v2-solidity-utils/contracts/math/FixedPoint.sol";

/**
 * @dev Library for compressing and uncompressing lower resolution numbers into uint256 values
 */
library WeightCompression {
    using FixedPoint for uint256;

    /**
     * @dev Convert a 16-bit value to full FixedPoint
     */
    function uncompress16(uint256 value) internal pure returns (uint256) {
        return value.mulUp(FixedPoint.ONE).divUp(type(uint16).max);
    }

    /**
     * @dev Compress a FixedPoint value to 16 bits
     */
    function compress16(uint256 value) internal pure returns (uint256) {
        return value.mulUp(type(uint16).max).divUp(FixedPoint.ONE);
    }

    /**
     * @dev Convert a 32-bit value to full FixedPoint
     */
    function uncompress32(uint256 value) internal pure returns (uint256) {
        return value.mulUp(FixedPoint.ONE).divUp(type(uint32).max);
    }

    /**
     * @dev Compress a FixedPoint value to 32 bits
     */
    function compress32(uint256 value) internal pure returns (uint256) {
        return value.mulUp(type(uint32).max).divUp(FixedPoint.ONE);
    }
}
