import { expect } from 'chai'
import hre from 'hardhat'

describe('MultiToken', function () {
  async function deployFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners()

    const MultiToken = await hre.ethers.getContractFactory('MultiToken')
    const multiToken = await MultiToken.deploy()

    return { multiToken, owner, otherAccount }
  }

  it('should return true', async () => {
    const { multiToken } = await deployFixture()

    expect(true).to.equal(true)
  })
})
