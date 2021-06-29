import hre from 'hardhat';
import { expect } from 'chai';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

import Task from '../../../src/task';
import { impersonate } from '../../../src/signers';
import { getForkedNetwork } from '../../../src/test';
import { delay } from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';

describe('StablePool', function () {
  const task = new Task('20210624-stable-pool', getForkedNetwork(hre));
  task.outputFile = 'test';

  afterEach('delete deployment', async () => {
    await task.delete();
  });

  it('deploys a stable factory from admin multisig', async () => {
    const signer = await impersonate('0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f', fp(100));

    await task.run({ from: signer });
    const output = task.output();
    const factory = await task.instanceAt('StablePoolFactory', output.factory);

    expect(await factory.getVault()).to.be.equal('0xBA12222222228d8Ba445958a75a0704d566BF2C8');
  });
});
