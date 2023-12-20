import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContract, FakeContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { RewardDistributionJob, GaugeProxyV2, IKeep3rV2, RewardDistributionJob__factory, IIBBurner, IIBController } from '@typechained';
import { evm, wallet, behaviours } from '@utils';

chai.use(smock.matchers);

const NOT_YET = ethers.BigNumber.from('0xffffffff');

describe('RewardDistributionJob', () => {
  let job: MockContract<RewardDistributionJob>;
  let governor: SignerWithAddress;
  let gaugeProxy: FakeContract<GaugeProxyV2>;
  let ibBurner: FakeContract<IIBBurner>;
  let ibController: FakeContract<IIBController>;
  let keep3r: FakeContract<IKeep3rV2>;
  let jobFactory: MockContractFactory<RewardDistributionJob__factory>;
  let snapshotId: string;

  before(async () => {
    [, governor] = await ethers.getSigners();

    gaugeProxy = await smock.fake('GaugeProxyV2');
    ibBurner = await smock.fake('IIBBurner');
    ibController = await smock.fake('IIBController');
    keep3r = await smock.fake('IKeep3rV2', { address: '0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC' });

    jobFactory = await smock.mock<RewardDistributionJob__factory>('RewardDistributionJob');
    job = await jobFactory.deploy(gaugeProxy.address, ibBurner.address, ibController.address, 600, governor.address);
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  it('should be deployed', async () => {
    expect(await job.deployed());
  });

  describe('work', () => {
    beforeEach(async () => {
      keep3r.worked.reset();
      keep3r.isKeeper.reset();
      gaugeProxy.distribute.reset();
      ibController['profit()'].reset();
      ibBurner.update_snx.reset();

      keep3r.isKeeper.returns(true);
    });

    it('should revert when paused', async () => {
      await job.setVariable('paused', true);
      await expect(job.callStatic.work()).to.be.revertedWith('Paused');
    });

    it('should validate keeper', async () => {
      await job.work();
      expect(keep3r.isKeeper).to.have.been.calledOnce;
    });

    it('should call gaugeProxy distribute', async () => {
      await job.work();
      expect(gaugeProxy.distribute).to.have.been.calledOnce;
    });

    it('should call ibController profit', async () => {
      await job.work();
      expect(ibController['profit()']).to.have.been.calledOnce;
    });

    it('should call ibBurner update_snx', async () => {
      await job.work();
      expect(ibBurner.update_snx).to.have.been.calledOnce;
    });

    it('should reward keeper', async () => {
      await job.connect(governor).work();
      expect(keep3r.worked).to.have.been.calledOnceWith(governor.address);
    });

    it('should set the timeout for exchange', async () => {
      await job.work();
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      expect(await job.needsExchange()).to.eq(blockTimestamp + (await job.timeout()));
    });

    it('should reset the timeout for distribute', async () => {
      // NOTE: smock bug overwrites packed data when setVariable
      // await job.setVariable('needsDistribute', 1);
      await job.work();
      expect(await job.needsDistribute()).to.eq(NOT_YET);
    });
  });

  describe('exchange', () => {
    beforeEach(async () => {
      keep3r.worked.reset();
      keep3r.isKeeper.reset();
      ibBurner.exchanger.reset();

      keep3r.isKeeper.returns(true);
    });

    it('should revert if worked before timeout', async () => {
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      await job.setVariable('needsExchange', blockTimestamp + 1);

      await expect(job.callStatic.exchange()).to.be.revertedWith('NotYet(1)');
    });

    it('should revert when paused', async () => {
      await job.setVariable('paused', true);
      await expect(job.callStatic.exchange()).to.be.revertedWith('Paused');
    });

    it('should validate keeper', async () => {
      await job.exchange();
      expect(keep3r.isKeeper).to.have.been.calledOnce;
    });

    it('should call ibBurner exchanger', async () => {
      await job.exchange();
      expect(ibBurner.exchanger).to.have.been.calledOnce;
    });

    it('should reward keeper', async () => {
      await job.connect(governor).exchange();
      expect(keep3r.worked).to.have.been.calledOnceWith(governor.address);
    });

    it('should set the timeout for distribute', async () => {
      await job.exchange();
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      expect(await job.needsDistribute()).to.eq(blockTimestamp + (await job.timeout()));
    });

    it('should reset the timeout for exchange', async () => {
      // await job.setVariable('needsExchange', 1);
      await job.exchange();
      expect(await job.needsExchange()).to.eq(NOT_YET);
    });
  });

  describe('distribute', () => {
    beforeEach(async () => {
      keep3r.worked.reset();
      keep3r.isKeeper.reset();
      ibBurner.distribute.reset();

      keep3r.isKeeper.returns(true);
    });

    it('should revert if worked before timeout', async () => {
      const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      await job.setVariable('needsDistribute', blockTimestamp + 1);

      await expect(job.callStatic.distribute()).to.be.revertedWith('NotYet(1)');
    });

    it('should revert when paused', async () => {
      await job.setVariable('paused', true);
      await expect(job.callStatic.distribute()).to.be.revertedWith('Paused');
    });

    it('should validate keeper', async () => {
      await job.distribute();
      expect(keep3r.isKeeper).to.have.been.calledOnce;
    });

    it('should call ibBurner distribute', async () => {
      await job.distribute();
      expect(ibBurner.distribute).to.have.been.calledOnce;
    });

    it('should reward keeper', async () => {
      await job.connect(governor).distribute();
      expect(keep3r.worked).to.have.been.calledOnceWith(governor.address);
    });

    it('should reset the timeout for distribute', async () => {
      // await job.setVariable('needsExchange', 1);
      await job.exchange();
      expect(await job.needsExchange()).to.eq(NOT_YET);
    });
  });

  describe('setGaugeProxy', () => {
    const random = wallet.generateRandomAddress();

    behaviours.onlyGovernor(
      () => job,
      'setGaugeProxy',
      () => [governor],
      [random]
    );

    it('should set the gaugeProxy', async () => {
      await job.connect(governor).setGaugeProxy(random);
      expect(await job.gaugeProxy()).to.equal(random);
    });

    it('should emit event', async () => {
      await expect(job.connect(governor).setGaugeProxy(random)).to.emit(job, 'GaugeProxyAddressSet').withArgs(random);
    });
  });

  describe('setIbBurner', () => {
    const random = wallet.generateRandomAddress();

    behaviours.onlyGovernor(
      () => job,
      'setIbBurner',
      () => [governor],
      [random]
    );

    it('should set the gaugeProxy', async () => {
      await job.connect(governor).setIbBurner(random);
      expect(await job.ibBurner()).to.equal(random);
    });

    it('should emit event', async () => {
      await expect(job.connect(governor).setIbBurner(random)).to.emit(job, 'IbBurnerAddressSet').withArgs(random);
    });
  });

  describe('setIbController', () => {
    const random = wallet.generateRandomAddress();

    behaviours.onlyGovernor(
      () => job,
      'setIbController',
      () => [governor],
      [random]
    );

    it('should set the ibController', async () => {
      await job.connect(governor).setIbController(random);
      expect(await job.ibController()).to.equal(random);
    });

    it('should emit event', async () => {
      await expect(job.connect(governor).setIbController(random)).to.emit(job, 'IbControllerAddressSet').withArgs(random);
    });
  });

  describe('setTimeout', () => {
    const random = 42;

    behaviours.onlyGovernor(
      () => job,
      'setTimeout',
      () => [governor],
      [random]
    );

    it('should set the timeout', async () => {
      await job.connect(governor).setTimeout(random);
      expect(await job.timeout()).to.equal(random);
    });

    it('should emit event', async () => {
      const tx = await job.connect(governor).setTimeout(random);
      await expect(tx).to.emit(job, 'TimeoutSet').withArgs(random);
    });
  });
});
