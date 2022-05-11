import { getMainnetSdk } from '@dethcrypto/eth-sdk-client';
import { Keep3rV1 } from '@eth-sdk-types';
import { FixedForex, FixedForex__factory } from '@typechained';
import { ethers } from 'hardhat';
import { evm } from '@utils';
import { expect } from 'chai';
import { getNodeUrl } from 'utils/env';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('FixedForex @skip-on-coverage', () => {
  let deployer: SignerWithAddress;
  let keep3rV1: Keep3rV1;
  let snapshotId: string;
  let fixedForex: FixedForex;

  before(async () => {
    [deployer] = await ethers.getSigners();

    await evm.reset({
      jsonRpcUrl: getNodeUrl('ethereum'),
      blockNumber: 14750000,
    });

    const sdk = getMainnetSdk(deployer);
    keep3rV1 = sdk.keep3rV1;

    const fixedForexFactory = (await ethers.getContractFactory('FixedForex')) as FixedForex__factory;
    fixedForex = await fixedForexFactory.connect(deployer).deploy(keep3rV1.address);

    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('fixed-forex', () => {
    it('should be deployed', async () => {
      expect(await fixedForex.deployed());
    });
  });
});
