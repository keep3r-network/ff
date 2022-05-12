import { getMainnetSdk } from '@dethcrypto/eth-sdk-client';
import { Keep3rV1, Keep3rProxy, RKp3r, VKp3r, Gauge, CurvePool, CurveOwnerProxy } from '@eth-sdk-types';
import { GaugeProxyV2, GaugeProxyV2__factory } from '@typechained';
import { ethers } from 'hardhat';
import { evm, wallet, bn } from '@utils';
import { expect } from 'chai';
import { getNodeUrl } from 'utils/env';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { JsonRpcSigner } from '@ethersproject/providers';

describe('GaugeProxyV2 @skip-on-coverage', () => {
  let deployer: SignerWithAddress;
  let stranger: SignerWithAddress;
  let governance: JsonRpcSigner;
  let curveAdmin: JsonRpcSigner;
  let keep3rV1: Keep3rV1;
  let keep3rProxy: Keep3rProxy;
  let rKP3R: RKp3r;
  let vKP3R: VKp3r;
  let gauge: Gauge;
  let curvePool: CurvePool;
  let snapshotId: string;
  let gaugeProxy: GaugeProxyV2;
  let curveOwnerProxy: CurveOwnerProxy;

  const KEEP3R_GOVERNANCE = '0x0d5dc686d0a2abbfdafdfb4d0533e886517d4e83';
  const CURVE_ADMIN = '0x40907540d8a6c65c637785e8f8b742ae6b0b9968';

  before(async () => {
    [deployer, stranger] = await ethers.getSigners();

    await evm.reset({
      jsonRpcUrl: getNodeUrl('ethereum'),
      blockNumber: 14750000,
    });

    const sdk = getMainnetSdk(deployer);
    keep3rV1 = sdk.keep3rV1;
    keep3rProxy = sdk.keep3rProxy;
    rKP3R = sdk.rKp3r;
    vKP3R = sdk.vKp3r;
    gauge = sdk.gauge;
    curvePool = sdk.curvePool;
    curveOwnerProxy = sdk.curveOwnerProxy;

    governance = await wallet.impersonate(KEEP3R_GOVERNANCE);
    curveAdmin = await wallet.impersonate(curveOwnerProxy.address); // TODO: impersonate EOA
    await wallet.setBalance({ account: governance._address, balance: bn.toUnit(10) });
    await wallet.setBalance({ account: curveAdmin._address, balance: bn.toUnit(10) });

    // deploys local implementation of gaugeProxy
    const gaugeProxyFactory = (await ethers.getContractFactory('GaugeProxyV2')) as GaugeProxyV2__factory;
    gaugeProxy = await gaugeProxyFactory.connect(governance).deploy();
    await gaugeProxy.connect(governance).addGauge(curvePool.address, gauge.address, { gasLimit: 1e6 });

    await gaugeProxy.setKeeper(stranger.address);

    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('reward distribution', () => {
    it('should be deployed', async () => {
      expect(await gaugeProxy.deployed());
    });

    it('should distribute rewards to gauges', async () => {
      const VOTE_WEIGHT = bn.toUnit(1);
      const REWARD_AMOUNT = bn.toUnit(100);

      // // add votes
      await keep3rProxy.connect(governance)['mint(address,uint256)'](stranger.address, VOTE_WEIGHT);
      await keep3rV1.connect(stranger).approve(vKP3R.address, VOTE_WEIGHT);
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      const FOUR_YEARS = 4 * 365 * 86400;
      await vKP3R.connect(stranger).create_lock(VOTE_WEIGHT, blockTimestamp + FOUR_YEARS / 2, { gasLimit: 10e6 });
      await gaugeProxy.connect(stranger).vote([curvePool.address], [1]);

      // add rKP3R rewards
      await keep3rProxy.connect(governance).addRecipient(gaugeProxy.address, REWARD_AMOUNT);

      // distribute rKP3R rewards
      await gauge.connect(curveAdmin).set_reward_distributor(rKP3R.address, gaugeProxy.address);

      const previousGaugeBalance = await rKP3R.balanceOf(gauge.address);
      await gaugeProxy.connect(stranger).distribute();

      expect(await rKP3R.balanceOf(gauge.address)).to.be.gt(previousGaugeBalance);
    });
  });
});
