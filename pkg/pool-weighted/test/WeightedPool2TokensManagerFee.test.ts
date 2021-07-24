import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import WeightedPool from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPool';

import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';

import { bn, fp } from '@balancer-labs/v2-helpers/src/numbers';
import { MAX_UINT256 } from '@balancer-labs/v2-helpers/src/constants';

import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { encodeJoinWeightedPool } from '@balancer-labs/v2-helpers/src/models/pools/weighted/encoding';
import { advanceTime } from '@balancer-labs/v2-helpers/src/time';

const tokenInitialBalance = bn(200e18);

const setup = async () => {
  const [, lp, trader, other, owner, admin] = await ethers.getSigners();

  const tokens = await TokenList.create(['DAI', 'MKR'], { sorted: true });

  // Deploy Balancer Vault
  const authorizer = await deploy('v2-vault/Authorizer', { args: [admin.address] });
  const vault = await deploy('v2-vault/Vault', { args: [authorizer.address, tokens.DAI.address, 0, 0] });
  const weights = [fp(0.5), fp(0.5)]
  // Deploy Pool
  const pool = await deploy('v2-pool-weighted/WeightedPool2TokensManagerFee', {
    args: [
      {
        vault: vault.address,
        name: 'ASD',
        symbol: 'Aasdsad sadsad',
        token0: tokens.addresses[0],
        token1: tokens.addresses[1],
        normalizedWeight0: weights[0],
        normalizedWeight1: weights[1],
        swapFeePercentage: fp(0.0001),
        pauseWindowDuration: 0,
        bufferPeriodDuration: 0,
        oracleEnabled: false,
        owner: owner.address,
      },
    ],
  })
  console.log('pool', pool.address)
  //console.log('factory deploying...')
  
  
  // const factory = await deploy('v2-pool-weighted/WeightedPool2TokensFactoryManagerFee', { args: [vault.address] });
  // console.log('factory deployed')
  // console.log('creating pool...')

  /*const pool = await factory.create(
    'Fund Manager Balancer',
    'FMB',
    tokens.addresses,
    [fp(0.5), fp(0.5)],
    fp(0.0001),
    false,
    admin.address)*/
  console.log('Pool created')
  
  const poolId = await pool.getPoolId();
  console.log('poolId', poolId)
  // Deploy staking contract for pool
  await tokens.mint({ to: lp, amount: tokenInitialBalance });
  console.log(await tokens.get(0).balanceOf(lp.address))
  console.log(await tokens.get(1).balanceOf(lp.address))

  await tokens.approve({ to: vault.address, from: [lp] });

  const assets = tokens.addresses;
  const tx = await vault.connect(lp).joinPool(poolId, lp.address, lp.address, {
    assets: tokens.addresses,
    maxAmountsIn: Array(assets.length).fill(MAX_UINT256),
    fromInternalBalance: false,
    userData: encodeJoinWeightedPool({
      kind: 'Init',
      amountsIn: Array(assets.length).fill(tokenInitialBalance),
    }),
  });

  const receipt = await tx.wait()
  console.log(await tokens.get(0).balanceOf(lp.address))
  console.log(await tokens.get(1).balanceOf(lp.address))
  return {
    poolId,
    contracts: {
      vault,
      pool
    }

  }
};

describe.only('Weighted Pool 2 Tokens Manager Fee', function () {
  let vault: Contract, pool: Contract

  let lp: SignerWithAddress, other: SignerWithAddress;

  before('deploy base contracts', async () => {
    [, , lp, other] = await ethers.getSigners();
  });

  sharedBeforeEach('set up vault and pool', async () => {
    const { contracts } = await setup();
    vault = contracts.vault;
    pool = contracts.pool;
  });

  describe('bla', () => {

    beforeEach(async () => {
      const bptBalance = await pool.balanceOf(lp.address);
      console.log(bptBalance)
      

    });

    it('Should do stuff', async () => {
      expect('123').to.be('123')
    })


  });
});
