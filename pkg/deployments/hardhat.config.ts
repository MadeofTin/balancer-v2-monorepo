import '@nomiclabs/hardhat-ethers';
import 'hardhat-local-networks-config-plugin';

import { task } from 'hardhat/config';
import { TASK_TEST } from 'hardhat/builtin-tasks/task-names';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import test from './src/test';
import Task from './src/task';
import Verifier from './src/verifier';
import { Logger } from './src/logger';

task('deploy', 'Run deployment task')
  .addParam('id', 'Deployment task ID')
  .addFlag('force', 'Ignore previous deployments')
  .addOptionalParam('key', 'Etherscan API key to verify contracts')
  .setAction(
    async (args: { id: string; force?: boolean; key?: string; verbose?: boolean }, hre: HardhatRuntimeEnvironment) => {
      Logger.setDefaults(false, args.verbose || false);
      const verifier = args.key ? new Verifier(hre.network, args.key) : undefined;
      await new Task(args.id, hre.network.name, verifier).run(args);
    }
  );

task(TASK_TEST)
  .addOptionalParam('fork', 'Optional network name to be forked block number to fork in case of running fork tests.')
  .addOptionalParam('blockNumber', 'Optional block number to fork in case of running fork tests.')
  .setAction(test);

export default {};
