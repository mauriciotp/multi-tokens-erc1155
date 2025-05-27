import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { parseEther } from 'ethers'
import hre from 'hardhat'

describe('MultiToken', function () {
  async function deployFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners()

    const MultiToken = await hre.ethers.getContractFactory('MultiToken')
    const multiToken = await MultiToken.deploy()

    return { multiToken, owner, otherAccount }
  }

  it('should mint', async () => {
    const { multiToken, owner } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    const balance = await multiToken.balanceOf(owner.address, 0)
    const supply = await multiToken.currentSupply(0)

    expect(balance).to.equal(1, 'Cannot mint')
    expect(supply).to.equal(49, 'Cannot mint')
  })

  it('should NOT mint (exists)', async () => {
    const { multiToken } = await loadFixture(deployFixture)

    await expect(
      multiToken.mint(3, { value: parseEther('0.01') })
    ).to.be.revertedWith('This token does not exist')
  })

  it('should NOT mint (payment)', async () => {
    const { multiToken } = await loadFixture(deployFixture)

    await expect(
      multiToken.mint(0, { value: parseEther('0.001') })
    ).to.be.revertedWith('Insufficient payment')
  })

  it('should NOT mint (supply)', async () => {
    const { multiToken } = await loadFixture(deployFixture)

    for (let i = 0; i < 50; i++) {
      await multiToken.mint(0, { value: parseEther('0.01') })
    }

    await expect(
      multiToken.mint(0, { value: parseEther('0.01') })
    ).to.be.revertedWith('Max supply reached')
  })

  it('should burn', async () => {
    const { multiToken, owner } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    await multiToken.burn(owner.address, 0, 1)

    const balance = await multiToken.balanceOf(owner.address, 0)
    const supply = await multiToken.currentSupply(0)

    expect(balance).to.equal(0, 'Cannot burn')
    expect(supply).to.equal(49, 'Cannot burn')
  })

  it('should burn (approved)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    await multiToken.setApprovalForAll(otherAccount.address, true)
    const approved = await multiToken.isApprovedForAll(
      owner.address,
      otherAccount.address
    )

    const instance = multiToken.connect(otherAccount)

    await instance.burn(owner.address, 0, 1)

    const balance = await multiToken.balanceOf(owner.address, 0)
    const supply = await multiToken.currentSupply(0)

    expect(balance).to.equal(0, 'Cannot burn (approved)')
    expect(supply).to.equal(49, 'Cannot burn (approved)')
    expect(approved).to.equal(true, 'Cannot burn (approved)')
  })

  it('should NOT burn (balance)', async () => {
    const { multiToken, owner } = await loadFixture(deployFixture)

    await expect(
      multiToken.burn(owner.address, 0, 1)
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155InsufficientBalance')
  })

  it('should NOT burn (permission)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    const instance = multiToken.connect(otherAccount)

    await expect(
      instance.burn(owner.address, 0, 1)
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155MissingApprovalForAll')
  })

  it('should safeTransferFrom', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    await multiToken.safeTransferFrom(
      owner.address,
      otherAccount.address,
      0,
      1,
      '0x00000000'
    )

    const balances = await multiToken.balanceOfBatch(
      [owner.address, otherAccount.address],
      [0, 0]
    )

    const supply = await multiToken.currentSupply(0)

    expect(balances[0]).to.equal(0, 'Cannot safe transfer')
    expect(balances[1]).to.equal(1, 'Cannot safe transfer')
    expect(supply).to.equal(49, 'Cannot safe transfer')
  })

  it('should emit transfer event', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    await expect(
      multiToken.safeTransferFrom(
        owner.address,
        otherAccount.address,
        0,
        1,
        '0x00000000'
      )
    )
      .to.emit(multiToken, 'TransferSingle')
      .withArgs(owner.address, owner.address, otherAccount.address, 0, 1)
  })

  it('should NOT safeTransferFrom (balance)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await expect(
      multiToken.safeTransferFrom(
        owner.address,
        otherAccount.address,
        0,
        1,
        '0x00000000'
      )
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155InsufficientBalance')
  })

  it('should NOT safeTransferFrom (exists)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await expect(
      multiToken.safeTransferFrom(
        owner.address,
        otherAccount.address,
        10,
        1,
        '0x00000000'
      )
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155InsufficientBalance')
  })

  it('should NOT safeTransferFrom (permission)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    const instance = multiToken.connect(otherAccount)

    await expect(
      instance.safeTransferFrom(
        owner.address,
        otherAccount.address,
        0,
        1,
        '0x00000000'
      )
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155MissingApprovalForAll')
  })

  it('should NOT safeBatchTransferFrom (array mismatch)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })
    await multiToken.mint(1, { value: parseEther('0.01') })

    await expect(
      multiToken.safeBatchTransferFrom(
        owner.address,
        otherAccount.address,
        [0, 1],
        [1],
        '0x00000000'
      )
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155InvalidArrayLength')
  })

  it('should NOT safeBatchTransferFrom (permission)', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })
    await multiToken.mint(1, { value: parseEther('0.01') })

    const instance = multiToken.connect(otherAccount)

    await expect(
      instance.safeBatchTransferFrom(
        owner.address,
        otherAccount.address,
        [0, 1],
        [1, 1],
        '0x00000000'
      )
    ).to.be.revertedWithCustomError(multiToken, 'ERC1155MissingApprovalForAll')
  })

  it('should supports interface', async () => {
    const { multiToken } = await loadFixture(deployFixture)

    const support = await multiToken.supportsInterface('0xd9b67a26')

    expect(support).to.equal(true, 'Does not support ERC-1155')
  })

  it('should withdraw', async () => {
    const { multiToken, owner, otherAccount } = await loadFixture(deployFixture)

    const instance = multiToken.connect(otherAccount)
    await instance.mint(0, { value: parseEther('0.01') })

    const multiTokenAddress = await multiToken.getAddress()

    const contractBalanceBefore =
      await hre.ethers.provider.getBalance(multiTokenAddress)
    const ownerBalanceBefore = await hre.ethers.provider.getBalance(
      owner.address
    )

    await multiToken.withdraw()

    const contractBalanceAfter =
      await hre.ethers.provider.getBalance(multiTokenAddress)
    const ownerBalanceAfter = await hre.ethers.provider.getBalance(
      owner.address
    )

    expect(contractBalanceBefore).to.equal(
      parseEther('0.01'),
      'Cannot withdraw'
    )
    expect(contractBalanceAfter).to.equal(0, 'Cannot withdraw')
    expect(ownerBalanceAfter).to.greaterThan(
      ownerBalanceBefore,
      'Cannot withdraw'
    )
  })

  it('should not withdraw (permission)', async () => {
    const { multiToken, otherAccount } = await loadFixture(deployFixture)

    const instance = multiToken.connect(otherAccount)

    await expect(instance.withdraw()).to.be.revertedWith(
      'You do not have permission'
    )
  })

  it('should have URI metadata', async () => {
    const { multiToken } = await loadFixture(deployFixture)

    await multiToken.mint(0, { value: parseEther('0.01') })

    const uri = await multiToken.uri(0)

    expect(uri).to.equal(
      'ipfs://bafybeif3moyh3indmueoidvodhrwwsdlipdmsnoedgykxg22nciqzxowei/0.json',
      'Does not have URI metadata'
    )
  })

  it('should NOT have URI metadata', async () => {
    const { multiToken } = await loadFixture(deployFixture)

    await expect(multiToken.uri(10)).to.be.revertedWith(
      'This token does not exist'
    )
  })
})
