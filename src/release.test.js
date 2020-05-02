import { defaultConfig } from './'
import { changelog } from './changelog'
import { release } from './release'
import { commitRelease, updateVersion } from './utils'

jest.mock('./changelog', () => ({
  changelog: jest.fn()
}))
jest.mock('./utils', () => ({
  commitRelease: jest.fn(),
  updateVersion: jest.fn()
}))
jest.mock('console', () => ({
  error: jest.fn()
}))

describe('release', () => {
  beforeEach(() => jest.resetAllMocks())

  it('should throw if no version passed', () => {
    expect(release()).rejects.toThrow('Relese requires a version')
  })

  it('should throw if incorrect version passed', () => {
    const mockedVersion = 'version'

    expect(release(mockedVersion)).rejects.toThrow(
      "Version 'version' doesn't look right"
    )
  })

  it('should execute release', async () => {
    const mockedVersion = '2.2.2'

    await release(mockedVersion, {}, defaultConfig)

    expect(changelog).toBeCalledTimes(1)
    expect(changelog).toBeCalledWith(
      mockedVersion,
      { write: true },
      defaultConfig
    )
    expect(commitRelease).toBeCalledTimes(1)
    expect(commitRelease).toBeCalledWith(mockedVersion)
    expect(updateVersion).toBeCalledTimes(1)
    expect(updateVersion).toBeCalledWith(mockedVersion)
  })
})
