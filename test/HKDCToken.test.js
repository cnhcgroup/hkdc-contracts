const HKDCToken = artifacts.require('./HKDCToken.sol')
const NewToken = artifacts.require('./NewToken.sol')

contract('HKDCToken', (accounts) => {
  const initialSupply = 1000000000
  const initialVotePid = 10000;
  const owner = accounts[0]
  const accountA = accounts[1]
  const accountB = accounts[2]

  beforeEach(async()=>{
    // this.hkdcContract = await HKDCToken.at("0xB1094298d21B42b70E044A56dD1D785Fa54c07c5")
    this.hkdcContract = await HKDCToken.new(initialSupply, 6)
  })

  describe('Deployment', async()=>{
    it('deploy is successfully', async()=>{
      const address = this.hkdcContract.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('name/symbol/decimals is correct', async()=>{
      const name = await this.hkdcContract.name()
      const symbol = await this.hkdcContract.symbol()
      const decimals = await this.hkdcContract.decimals()
      assert.equal(name, 'HKDC Token')
      assert.equal(symbol, 'HKDC')
      assert.equal(decimals, 6)
    })

    it('owner/initialSupply is correct', async()=>{
      const _owner = await this.hkdcContract.owner()
      const _initialSupply = await this.hkdcContract.balanceOf(owner)
      assert.equal(_owner, owner)
      assert.equal(_initialSupply, initialSupply)
    })

  })

  describe('Normal', async()=>{
    it('transfer should work', async() => {
      const transferAmount = 100
      await this.hkdcContract.transfer(accountA, transferAmount).then(async()=>{
        const balanceOfOwner = await this.hkdcContract.balanceOf(owner)
        const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
        assert.equal(balanceOfOwner, initialSupply - transferAmount)
        assert.equal(balanceOfAccountA, transferAmount)
      })
    })

    it('transfer excced amount should throw err', async()=>{
      const transferAmount = 100
      await this.hkdcContract.transfer(accountB, transferAmount, { from: accountA }).then(assert.fail).catch(function (error) {
        assert.include(error.message, 'transfer amount exceeds balance', 'transfer excced amount should throw err.')
      })
    })

    it('transferFrom with approve should be ok', async()=>{
      const transferAmount = 100
      await this.hkdcContract.transfer(accountA, transferAmount).then(async()=>{
        const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
        assert.equal(balanceOfAccountA, transferAmount)
      }).then(async (hkdcContract) => {
        // accountA aprove to owner
        await this.hkdcContract.approve(owner, transferAmount, { from: accountA })
        const allowanceAmount1 = await this.hkdcContract.allowance(accountA, owner)
        assert.equal(allowanceAmount1.toNumber(), transferAmount)
      }).then(async (hkdcContract) => {
        await this.hkdcContract.transferFrom(accountA, accountB, transferAmount, { from: owner })

        const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
        assert.equal(balanceOfAccountA.toNumber(), 0)

        const balanceOfAccountB = await this.hkdcContract.balanceOf(accountB)
        assert.equal(balanceOfAccountB.toNumber(), transferAmount)

        const allowanceAmount2 = await this.hkdcContract.allowance(accountA, owner)
        assert.equal(allowanceAmount2.toNumber(), 0)
      })

    })

    it('transferFrom without approve should throw err', async()=>{
      const transferAmount = 100
      await this.hkdcContract.transfer(accountA, transferAmount).then(() => {
        this.hkdcContract.transferFrom(accountA, accountB, transferAmount, { from: owner }).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'allowance amount exceeds allowed', 'transferFrom without approve should throw err.')
        })
      })
    })

    it('increaseAllowance/decreaseAllowance should be ok', async()=>{
      const allowanceAmount = 100
      await this.hkdcContract.transfer(accountA, allowanceAmount).then(async()=>{
        const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
        assert.equal(balanceOfAccountA, allowanceAmount)
      }).then(async (hkdcContract) => {
        // accountA aprove to owner
        await this.hkdcContract.approve(owner, allowanceAmount, { from: accountA })
        const allowanceAmount1 = await this.hkdcContract.allowance(accountA, owner)
        assert.equal(allowanceAmount1.toNumber(), allowanceAmount)
      }).then(async (hkdcContract) => {
        await this.hkdcContract.increaseAllowance(owner, allowanceAmount, { from: accountA })
        const allowanceAmount2 = await this.hkdcContract.allowance(accountA, owner)
        assert.equal(allowanceAmount2.toNumber(), allowanceAmount + allowanceAmount)
      }).then(async (hkdcContract) => {
        await this.hkdcContract.decreaseAllowance(owner, allowanceAmount, { from: accountA })
        const allowanceAmount3 = await this.hkdcContract.allowance(accountA, owner)
        assert.equal(allowanceAmount3.toNumber(), allowanceAmount)
      })
    })

    it('burn should be ok', async()=>{
      const burnAmount = 100
      await this.hkdcContract.burn(burnAmount).then(async()=>{
        const balanceOfOwner = await this.hkdcContract.balanceOf(owner)
        assert.equal(balanceOfOwner, initialSupply - burnAmount)
      })
    })

  })

  describe('Ownable', async()=>{
    it('add black user by owner should be ok', async()=>{
      await this.hkdcContract.addBlackList(accountA).then(() => {
        this.hkdcContract.isBlackListUser(accountA).then((isBlackUser) => {
          assert.isTrue(isBlackUser)
        })
      })
    })

    it('add black user by accountA should throw err', async()=>{
      await this.hkdcContract.addBlackList(accountB, { from: accountA }).then(assert.fail).catch(function (error) {
        assert.include(error.message, 'caller is not the owner', 'add black user by accountA should throw err.')
      })
    })

    it('pause/unpause by owner should be ok', async()=>{
      await this.hkdcContract.pause().then(() => {
        this.hkdcContract.unpause()
      })
    })

    it('pause by accountA should throw err', async()=>{
      await this.hkdcContract.pause({ from: accountA }).then(assert.fail).catch(function (error) {
        assert.include(error.message, 'caller is not the owner', 'pause by accountA should throw err.')
      })
    })

    it('unpause by accountA should throw err', async()=>{
      await this.hkdcContract.unpause({ from: accountA }).then(assert.fail).catch(function (error) {
        assert.include(error.message, 'caller is not the owner', 'unpause by accountA should throw err.')
      })
    })

    it('setFeeParams by owner should be ok', async()=>{
      await this.hkdcContract.setFeeParams(50, 500)
    })

    it('setFeeParams by accountA should throw err', async()=>{
      await this.hkdcContract.setFeeParams(50, 500, { from: accountA }).then(assert.fail).catch(function (error) {
        assert.include(error.message, 'caller is not the owner', 'deprecate by accountA should throw err.')
      })
    })

    it('deprecate by owner should be ok', async()=>{
      this.newContract = await NewToken.new(initialSupply, 6)
      await this.hkdcContract.deprecate(this.newContract.address)
    })

    it('deprecate by accountA should throw err', async()=>{
      this.newContract = await NewToken.new(initialSupply, 6)
      await this.hkdcContract.deprecate(this.newContract.address, { from: accountA }).then(assert.fail).catch(function (error) {
        assert.include(error.message, 'caller is not the owner', 'deprecate by accountA should throw err.')
      })
    })

  })

  describe('BlackList', async()=>{
    it('addBlackList/removeBlackList should work', async()=>{
      await this.hkdcContract.addBlackList(accountA).then(() => {
        this.hkdcContract.isBlackListUser(accountA).then((isBlackUser) => {
          assert.isTrue(isBlackUser)
        })
      }).then(async (hkdcContract) => {
        await this.hkdcContract.removeBlackList(accountA).then(() => {
          this.hkdcContract.isBlackListUser(accountA).then((isBlackUser) => {
            assert.isFalse(isBlackUser)
          })
        })
      })
    })

    it('transfer/transferFrom/approve/increaseAllowance/decreaseAllowance by black user should throw err', async()=>{
      await this.hkdcContract.addBlackList(accountA).then(() => {
        this.hkdcContract.transfer(accountB, 100, { from: accountA }).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'this address is in blacklist', 'transfer by black user should throw err.')
        })

        this.hkdcContract.transferFrom(owner, accountB, 100, { from: accountA }).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'this address is in blacklist', 'transferFrom by black user should throw err.')
        })

        this.hkdcContract.approve(owner, 100, { from: accountA }).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'this address is in blacklist', 'approve by black user should throw err.')
        })

        this.hkdcContract.increaseAllowance(owner, 100, { from: accountA }).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'this address is in blacklist', 'increaseAllowance by black user should throw err.')
        })

        this.hkdcContract.decreaseAllowance(owner, 100, { from: accountA }).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'this address is in blacklist', 'decreaseAllowance by black user should throw err.')
        })
      })
    })

  })

  describe('Pausable', async()=>{
    it('pause/unpause should work', async()=>{
      await this.hkdcContract.pause().then(async()=>{
        const paused = await this.hkdcContract.paused()
        assert.isTrue(paused)

        await this.hkdcContract.openMintProposal(accountA, 100).then(async()=>{
          await this.hkdcContract.voteProposal(initialVotePid).then(assert.fail).catch(function (error) {
            assert.include(error.message, 'call payload failed')
          })
        })

        await this.hkdcContract.burn(100).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'token transfer while paused.')
        })

        await this.hkdcContract.transfer(accountA, 100).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'token transfer while paused.')
        })
      }).then(async (hkdcContract) => {
        await this.hkdcContract.unpause()
        const paused = await this.hkdcContract.paused()
        assert.isFalse(paused)
      }).then(async (hkdcContract) => {
        const mintAmount = 100
        const burnAmount = 30
        const remainAmount = mintAmount - burnAmount

        await this.hkdcContract.openMintProposal(accountA, mintAmount).then(async()=>{
          await this.hkdcContract.voteProposal(initialVotePid).then(async()=>{
            const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
            assert.equal(balanceOfAccountA, mintAmount)
          })
        })

        await this.hkdcContract.burn(burnAmount, { from: accountA }).then(async()=>{
          const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
          assert.equal(balanceOfAccountA, remainAmount)
        })

        await this.hkdcContract.transfer(accountB, remainAmount, { from: accountA }).then(async()=>{
          const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
          assert.equal(balanceOfAccountA, 0)

          const balanceOfAccountB = await this.hkdcContract.balanceOf(accountB)
          assert.equal(balanceOfAccountB, remainAmount)
        })
      })
    })

  })

  describe('Fee', async()=>{
    it('setFee should work', async()=>{
      const transferAmount = 10000
      await this.hkdcContract.transfer(accountA, transferAmount).then(async()=>{
        await this.hkdcContract.updateReceivingFeeAddress(owner)
        await this.hkdcContract.setFeeParams(50, 500).then(async()=>{
          const fee = transferAmount * 50 / 10000
          await this.hkdcContract.transfer(accountB, transferAmount, { from: accountA }).then(async()=>{
            const balanceOfAccountA = await this.hkdcContract.balanceOf(accountA)
            assert.equal(balanceOfAccountA, 0)

            const balanceOfAccountB = await this.hkdcContract.balanceOf(accountB)
            assert.equal(balanceOfAccountB, transferAmount - fee)

            const balanceOfOwner = await this.hkdcContract.balanceOf(owner)
            assert.equal(balanceOfOwner, initialSupply - transferAmount + fee)
          })
        })
      })
    })
  })

  describe('Deprecate and Upgrade', async()=>{
    it('deprecate and upgrade contract should work', async()=>{
      this.newContract = await NewToken.new(initialSupply, 6)
      await this.hkdcContract.deprecate(this.newContract.address).then(async()=>{
        const deprecated = await this.hkdcContract.deprecated()
        assert.isTrue(deprecated)

        // upgrade
        await this.hkdcContract.transfer(accountA, 100).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'transferByLegacy()')
        })

        // old function
        const oldBalanceOfOwner = await this.hkdcContract.oldBalanceOf(owner)
        assert.equal(oldBalanceOfOwner, initialSupply)
      })
    })
  })

  describe('Vote', async()=>{
    it('add voter should work', async()=>{
      const accountAIsVoter0 = await this.hkdcContract.voters(accountA)
      assert.isFalse(accountAIsVoter0)

      // const voterAccount = web3.eth.accounts.create();
      await this.hkdcContract.openAddVoterProposal(accountA).then(async()=>{
        const accountAIsVoter1 = await this.hkdcContract.voters(accountA)
        assert.isFalse(accountAIsVoter1)
        const voterCount1 = await this.hkdcContract.votersCount()
        assert.equal(voterCount1,1)
        const proposal1 = await this.hkdcContract.proposals(initialVotePid)
        assert.isFalse(proposal1.done)
        const hasVote1 = await this.hkdcContract.hasVoted(initialVotePid)
        assert.isFalse(hasVote1);

        // vote
        await this.hkdcContract.voteProposal(initialVotePid).then(async()=>{
          const accountAIsVoter2 = await this.hkdcContract.voters(accountA)
          assert.isTrue(accountAIsVoter2)
          const voterCount2 = await this.hkdcContract.votersCount()
          assert.equal(voterCount2,2)
          const proposal2 = await this.hkdcContract.proposals(initialVotePid)
          assert.isTrue(proposal2.done)
          const hasVote2 = await this.hkdcContract.hasVoted(initialVotePid)
          assert.isTrue(hasVote2);
        })
        
      })
    })

    it('remove voter should work(minority -> majority)', async()=>{
      await this.hkdcContract.openAddVoterProposal(accountA).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid)
      }).then(async()=>{
        const accountAIsVoter1 = await this.hkdcContract.voters(accountA)
        assert.isTrue(accountAIsVoter1)
        const voterCount1 = await this.hkdcContract.votersCount()
        assert.equal(voterCount1,2)
      }).then(async () =>{
        await this.hkdcContract.openRemoveVoterProposal(accountA)
      }).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid+1)
      }).then(async()=>{
        const accountAIsVoter2 = await this.hkdcContract.voters(accountA)
        assert.isTrue(accountAIsVoter2)
        const voterCount2 = await this.hkdcContract.votersCount()
        assert.equal(voterCount2,2)
      }).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid+1,{from:accountA})
      }).then(async()=>{
        const accountAIsVoter3 = await this.hkdcContract.voters(accountA)
        assert.isFalse(accountAIsVoter3)
        const voterCount3 = await this.hkdcContract.votersCount()
        assert.equal(voterCount3,1)
      })
    })

    it('only voter can do a vote', async()=>{
      await this.hkdcContract.openAddVoterProposal(accountA).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid, {from:accountA}).then(assert.fail).catch(function (error) {
          assert.include(error.message, 'only voter can call')
        })
      })
    })

    it('mint over voting should be ok', async()=>{
      const mintAmount = 100
      await this.hkdcContract.openAddVoterProposal(accountA).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid)
      }).then(async()=>{
        const accountAIsVoter = await this.hkdcContract.voters(accountA)
        assert.isTrue(accountAIsVoter)
      }).then(async()=>{
        await this.hkdcContract.openMintProposal(accountA, mintAmount)
      }).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid+1)
      }).then(async()=>{
        const balanceOfAccountABeforeMintDone = await this.hkdcContract.balanceOf(accountA)
        assert.equal(balanceOfAccountABeforeMintDone, 0)
      }).then(async()=>{
        await this.hkdcContract.voteProposal(initialVotePid+1,{from:accountA})
      }).then(async()=>{
        const balanceOfAccountAAfterMintDone = await this.hkdcContract.balanceOf(accountA)
        assert.equal(balanceOfAccountAAfterMintDone, mintAmount)
      })

    })
  })

// destroyBlackFunds

})
