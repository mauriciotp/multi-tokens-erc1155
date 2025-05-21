import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const multiTokenModule = buildModule('MultiTokenModule', m => {
  const multiToken = m.contract('MultiToken')

  return { multiToken }
})

export default multiTokenModule
