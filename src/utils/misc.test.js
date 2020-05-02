import { exec } from 'child_process'
import { readFileSync } from 'fs'
import { defaultConfig } from '../'
import {
  defineVersion,
  groupCommits,
  isObjectEmpty,
  updateVersion
} from './misc'

jest.mock('fs', () => ({ readFileSync: jest.fn() }))
jest.mock('child_process', () => ({
  exec: jest.fn()
}))

describe('misc', () => {
  beforeEach(() => jest.resetAllMocks())

  describe('defineVersion', () => {
    it('should throw if incorrect version passed', () => {
      const mockedInput = 'version'

      expect(() => defineVersion(mockedInput)).toThrow(
        "Version 'version' doesn't look right"
      )
    })

    it('should bump the version', () => {
      const mockedInput = 'major'
      const mockedFile = '{ "version": "3.3.3" }'
      const mockedOutput = '4.0.0'

      readFileSync.mockImplementation(() => mockedFile)

      const version = defineVersion(mockedInput)

      expect(version).toBe(mockedOutput)
    })

    it('should define the version', () => {
      const mockedInput = '3.3.3'

      const version = defineVersion(mockedInput)

      expect(version).toBe(mockedInput)
    })
  })

  describe('groupCommits', () => {
    it('should group commits with no releases', async () => {
      const mockedInput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
      ]
      const mockedOutput = [
        {
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore: update dependencies'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits', async () => {
      const mockedInput = [
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]
      const mockedOutput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits with custom config', async () => {
      const config = {
        ...defaultConfig,
        groups: [
          ['## Feat', 'feat', 'feature'],
          ['## Fix', 'fix'],
          ['## Custom', 'custom']
        ],
        ignoredScopes: ['ignored']
      }
      const mockedInput = [
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor(ignored): rewrite legacy code',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 custom: make changelog customizable',
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
      ]
      const mockedOutput = [
        {
          breaking: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 chore!: generate changelog',
            '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore!: version releases'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file'
          ],
          custom: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 custom: make changelog customizable'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ]
        },
        {
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions'
          ],
          feat: [
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, config)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should skip changelog scope', async () => {
      const mockedInput = [
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
      ]
      const mockedOutput = [
        {
          fix: [
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 fix: support other conventions',
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 fix: a bug'
          ],
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
            'b2f5901922505efbfb6dd684252e8df0cdffeeb2 tests: add core tests'
          ]
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })

    it('should group commits with no unreleased', async () => {
      const mockedInput = [
        'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0',
        'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
        '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature',
        'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec',
        '2ea04355c1e81c5088eeabc6e242fb1ade978524 chore(changelog): update CHANGELOG'
      ]
      const mockedOutput = [
        {
          feat: [
            'aa805ce71ee103965ce3db46d4f6ed2658efd08d feat: add option to write to local CHANGELOG file',
            '4e02179cae1234d7083036024080a3f25fcb52c2 feat: add execute release feature'
          ],
          misc: [
            'bffc2f9e8da1c7ac133689bc9cd14494f3be08e3 refactor: extract line generating logic to function and promisify exec'
          ],
          release:
            'f2191200bf7b6e5eec3d61fcef9eb756e0129cfb chore(release): 0.1.0'
        }
      ]
      const grouped = await groupCommits(mockedInput, defaultConfig)

      expect(grouped).toEqual(mockedOutput)
    })
  })

  describe('isObjectEmpty', () => {
    it('should return false if object is not empty', () => {
      expect(isObjectEmpty({ key: 'value' })).toBe(false)
    })

    it('should return true if object is empty', () => {
      expect(isObjectEmpty({})).toBe(true)
    })
  })

  describe('updateVersion', () => {
    it('should update version', async () => {
      exec.mockImplementation((_, cb) => cb(null))
      const version = '3.3.3'
      await updateVersion(version)

      expect(exec).toBeCalledTimes(1)
      expect(exec).toBeCalledWith(
        `npm version ${version} --no-git-tag-version`,
        expect.any(Function)
      )
    })
  })
})
