import chai, { expect } from 'chai';
import { MockContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { GaugeProxy, GaugeProxy__factory } from '@typechained';
import { evm } from '@utils';

chai.use(smock.matchers);

describe('GaugeProxy', () => {
  let gauge: MockContract<GaugeProxy>;
  let gaugeFactory: MockContractFactory<GaugeProxy__factory>;
  let snapshotId: string;

  before(async () => {
    gaugeFactory = await smock.mock<GaugeProxy__factory>('GaugeProxy');
    gauge = await gaugeFactory.deploy();
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  it('should be deployed', async () => {
    expect(await gauge.deployed());
  });
});
