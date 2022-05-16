import { FakeContract, MockContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { IKeep3rV2, Keep3rJobForTest, Keep3rJobForTest__factory } from '@typechained';
import { wallet } from '@utils';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Keep3rJob', () => {
  let governor: SignerWithAddress;
  let jobFactory: MockContractFactory<Keep3rJobForTest__factory>;
  let job: MockContract<Keep3rJobForTest>;
  let keep3r: FakeContract<IKeep3rV2>;

  const randomAddress = wallet.generateRandomAddress();
  const defaultKeep3r = '0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC';

  before(async () => {
    [, governor] = await ethers.getSigners();
    keep3r = await smock.fake('IKeep3rV2', {
      address: '0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC',
    });
    jobFactory = await smock.mock<Keep3rJobForTest__factory>('Keep3rJobForTest');
  });

  beforeEach(async () => {
    job = await jobFactory.deploy(governor.address);
  });

  describe('setKeep3r', () => {
    const random = wallet.generateRandomAddress();

    it('should set the keep3r', async () => {
      await job.connect(governor).setKeep3r(random);
      expect(await job.keep3r()).to.equal(random);
    });

    it('should emit event', async () => {
      await expect(job.connect(governor).setKeep3r(random)).to.emit(job, 'Keep3rSet').withArgs(random);
    });
  });

  describe('default values', () => {
    it('should return the default address for keep3r', async () => {
      expect(await job.keep3r()).to.equal(defaultKeep3r);
    });
  });

  // @notice I created an external function in the ForTest contract that calls _isValidKeeper to test it
  describe('_isValidKeeper', () => {
    it('should call isKeeper with the correct arguments', async () => {
      keep3r.isKeeper.whenCalledWith(randomAddress).returns(true);
      await job.externalIsValidKeeper(randomAddress);
      expect(keep3r.isKeeper).to.have.been.calledOnceWith(randomAddress);
    });

    it('should revert with the correct error', async () => {
      keep3r.isKeeper.whenCalledWith(randomAddress).returns(false);
      await expect(job.externalIsValidKeeper(randomAddress)).to.be.revertedWith('KeeperNotValid');
    });
  });
});
