/* eslint-env jest */

import { jest } from '@jest/globals'

// TODO change to MEGSItem
/**
 * MEGSItem
 */
global.dccItemRollSpellCheckMock = jest.fn((options) => {})
class MEGSItem {
  constructor (name = null, type = undefined, systemData = {}) {
    this.name = name
    this.type = type
    this.system = systemData
  }
}
global.MEGSItem = MEGSItem
