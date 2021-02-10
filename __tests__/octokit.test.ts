import {Octokit} from '../src/octokit'

jest.mock('@actions/github')

describe('Octokit', () => {
  let octo: Octokit
  let octokitMock: {repos: any}

  beforeEach(() => {
    octokitMock = {
      repos: {
        listTags: jest.fn(),
        getCombinedStatusForRef: jest.fn()
      }
    }
    octo = new Octokit(octokitMock as any)
  })

  describe('latestTagExists', () => {
    describe('when latest tag exists', () => {
      it('returns true', () => {
        octokitMock.repos.listTags.mockImplementation(() => {
          return Promise.resolve({data: [{name: 'latest'}]})
        })
        octo.latestTagExists().subscribe(exists => {
          expect(exists).toBe(true)
        })
      })
    })

    describe('when latest tag does not exist', () => {
      it('returns false', () => {
        octokitMock.repos.listTags.mockImplementation(() => {
          return Promise.resolve({data: []})
        })
        octo.latestTagExists().subscribe(exists => {
          expect(exists).toBe(false)
        })
      })
    })
  })

  describe('stateIsSuccess', () => {
    describe('when state for a commit is success', () => {
      it('returns true', () => {
        octokitMock.repos.getCombinedStatusForRef.mockImplementation(() => {
          return Promise.resolve({data: {state: 'success'}})
        })
        octo.stateIsSuccess().subscribe(result => {
          expect(result).toBe(true)
        })
      })
    })

    describe('when state for a commit is not success', () => {
      it('returns false', () => {
        octokitMock.repos.getCombinedStatusForRef.mockImplementation(() => {
          return Promise.resolve({data: {state: 'failure'}})
        })
        octo.stateIsSuccess().subscribe(result => {
          expect(result).toBe(false)
        })
      })
    })
  })
})
