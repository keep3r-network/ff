import { getMainnetSdk } from '@dethcrypto/eth-sdk-client';
import { Keep3rV1, Keep3r, Keep3rProxy, RKp3r, VKp3r, Gauge, CurvePool, CurveOwnerProxy, IbBurner, IbController } from '@eth-sdk-types';
import { GaugeProxyV2, GaugeProxyV2__factory, RewardDistributionJob, RewardDistributionJob__factory, IERC20 } from '@typechained';
import { ethers } from 'hardhat';
import { evm, wallet, bn } from '@utils';
import { expect } from 'chai';
import { getNodeUrl } from 'utils/env';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { JsonRpcSigner } from '@ethersproject/providers';

describe('GaugeProxyV2 @skip-on-coverage', () => {
  let deployer: SignerWithAddress;
  let keeper: SignerWithAddress;
  let governance: JsonRpcSigner;
  let curveAdmin: JsonRpcSigner;
  let keep3r: Keep3r;
  let keep3rV1: Keep3rV1;
  let keep3rProxy: Keep3rProxy;
  let rKP3R: RKp3r;
  let vKP3R: VKp3r;
  let gauge: Gauge;
  let ibEUR: IERC20;
  let sUSD: IERC20;
  let curvePool: CurvePool;
  let ibBurner: IbBurner;
  let ibController: IbController;
  let snapshotId: string;
  let gaugeProxy: GaugeProxyV2;
  let curveOwnerProxy: CurveOwnerProxy;
  let job: RewardDistributionJob;

  const IB_EUR_FEE_DISTRIBUTION = '0xb9d18ab94cf61bb2bcebe6ac8ba8c19ff0cdb0ca';
  const SYNTHETIX_FEE_ADDRESS = '0xfeefeefeefeefeefeefeefeefeefeefeefeefeef';
  const KEEP3R_GOVERNANCE = '0x0d5dc686d0a2abbfdafdfb4d0533e886517d4e83';
  const MAX_UINT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const TIMEOUT = 600;

  before(async () => {
    [deployer, keeper] = await ethers.getSigners();

    await evm.reset({
      jsonRpcUrl: getNodeUrl('ethereum'),
      blockNumber: 14877512,
    });

    const sdk = getMainnetSdk(deployer);
    keep3r = sdk.keep3r;
    keep3rV1 = sdk.keep3rV1;
    keep3rProxy = sdk.keep3rProxy;
    rKP3R = sdk.rKp3r;
    vKP3R = sdk.vKp3r;
    gauge = sdk.gauge;
    curvePool = sdk.curvePool;
    curveOwnerProxy = sdk.curveOwnerProxy;
    ibBurner = sdk.ibBurner;
    ibController = sdk.ibController;

    ibEUR = await ethers.getContractAt('IERC20', '0x96e61422b6a9ba0e068b6c5add4ffabc6a4aae27');
    sUSD = await ethers.getContractAt('IERC20', '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51');

    governance = await wallet.impersonate(KEEP3R_GOVERNANCE);
    curveAdmin = await wallet.impersonate(curveOwnerProxy.address); // TODO: impersonate EOA
    await wallet.setBalance({ account: governance._address, balance: bn.toUnit(10) });
    await wallet.setBalance({ account: curveAdmin._address, balance: bn.toUnit(10) });

    // deploys local implementation of gaugeProxy
    const gaugeProxyFactory = (await ethers.getContractFactory('GaugeProxyV2')) as GaugeProxyV2__factory;
    gaugeProxy = await gaugeProxyFactory.deploy(governance._address);
    await gaugeProxy.connect(governance).addGauge(curvePool.address, gauge.address, { gasLimit: 1e6 });

    const jobFactory = (await ethers.getContractFactory('RewardDistributionJob')) as RewardDistributionJob__factory;
    job = await jobFactory.deploy(gaugeProxy.address, ibBurner.address, ibController.address, TIMEOUT, governance._address);

    await gaugeProxy.connect(governance).setKeeper(job.address);

    await keep3r.connect(governance).addJob(job.address);
    await keep3r.connect(governance).setBondTime(1);
    await keep3r.connect(keeper).bond(keep3rV1.address, 0);
    await evm.advanceTimeAndBlock(1);
    await keep3r.connect(keeper).activate(keep3rV1.address);
    await keep3r.connect(governance).forceLiquidityCreditsToJob(job.address, bn.toUnit(10));

    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('reward distribution', () => {
    it('should be deployed', async () => {
      expect(await gaugeProxy.deployed());
      expect(await gaugeProxy.gov()).to.eq(governance._address);
      expect(await keep3rV1.allowance(gaugeProxy.address, rKP3R.address)).to.eq(MAX_UINT);
    });

    it('should distribute rewards to gauges', async () => {
      const VOTE_WEIGHT = bn.toUnit(1);
      const REWARD_AMOUNT = bn.toUnit(100);

      // add votes
      await keep3rProxy.connect(governance)['mint(address,uint256)'](keeper.address, VOTE_WEIGHT);
      await keep3rV1.connect(keeper).approve(vKP3R.address, VOTE_WEIGHT);
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      const FOUR_YEARS = 4 * 365 * 86400;
      await vKP3R.connect(keeper).create_lock(VOTE_WEIGHT, blockTimestamp + FOUR_YEARS / 2, { gasLimit: 10e6 });
      await gaugeProxy.connect(keeper).vote([curvePool.address], [1]);

      // add rKP3R rewards
      await keep3rProxy.connect(governance).addRecipient(gaugeProxy.address, REWARD_AMOUNT);

      // distribute rKP3R rewards
      await gauge.connect(curveAdmin).set_reward_distributor(rKP3R.address, gaugeProxy.address);

      const previousGaugeBalance = await rKP3R.balanceOf(gauge.address);
      await job.connect(keeper).work();

      expect(await rKP3R.balanceOf(gauge.address)).to.be.gt(previousGaugeBalance);
    });

    it('should distribute ibEUR rewards', async () => {
      let prevEURBalance = await ibEUR.balanceOf(ibBurner.address);
      await keep3rProxy.connect(governance).addRecipient(gaugeProxy.address, 1);
      await job.connect(keeper).work();
      expect(await ibEUR.balanceOf(ibBurner.address)).to.be.gt(prevEURBalance);
      await expect(job.connect(keeper).work()).to.be.reverted;

      await evm.advanceTimeAndBlock(TIMEOUT);
      const prevUSDBalance = await sUSD.balanceOf(SYNTHETIX_FEE_ADDRESS);
      await job.connect(keeper).exchange();
      expect(await sUSD.balanceOf(SYNTHETIX_FEE_ADDRESS)).to.be.gt(prevUSDBalance);
      await expect(job.connect(keeper).exchange()).to.be.reverted;

      await evm.advanceTimeAndBlock(TIMEOUT);
      prevEURBalance = await ibEUR.balanceOf(IB_EUR_FEE_DISTRIBUTION);
      await job.connect(keeper).distribute();
      expect(await ibEUR.balanceOf(IB_EUR_FEE_DISTRIBUTION)).to.be.gt(prevEURBalance);
      await expect(job.connect(keeper).distribute()).to.be.reverted;
    });
  });
});
