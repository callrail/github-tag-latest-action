import {Octokit} from '../src/octokit'

jest.mock('@actions/github')

describe('Octokit', () => {
  let octo: Octokit
  let octokitMock: {repos: any; git: any}
  const contextMock = {
    repo: {owner: 'callrail', repo: 'test'}
  }
  const inputMock = jest.fn(() => {
    return 'latest'
  })

  beforeEach(() => {
    octokitMock = {
      repos: {
        listTags: jest.fn(),
        getCombinedStatusForRef: jest.fn()
      },
      git: {
        createRef: jest.fn(() => Promise.resolve({status: 201})),
        deleteRef: jest.fn(() => Promise.resolve({status: 204}))
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

  describe('deleteTag', () => {
    describe('when successful', () => {
      it('returns true', () => {
        octokitMock.git.deleteRef.mockImplementation(() => {
          return Promise.resolve({status: 204})
        })
        octo.deleteTag().subscribe(success => {
          expect(success).toBe(true)
          expect(octokitMock.git.deleteRef).toHaveBeenCalled()
        })
      })
    })

    describe('when not successful', () => {
      it('returns false', () => {
        octokitMock.git.deleteRef.mockImplementation(() => {
          return Promise.resolve({status: 500})
        })
        octo.deleteTag().subscribe(success => {
          expect(success).toBe(false)
          expect(octokitMock.git.deleteRef).toHaveBeenCalled()
        })
      })
    })
  })

  describe('createTag', () => {
    describe('when successful', () => {
      it('returns true', () => {
        octokitMock.git.createRef.mockImplementation(() => {
          return Promise.resolve({status: 201})
        })
        octo
          .createTag({owner: 'callrail', repo: 'test'}, 'abc123')
          .subscribe(success => {
            expect(success).toBe(true)
            expect(octokitMock.git.createRef).toHaveBeenCalledWith({
              owner: 'callrail',
              repo: 'test',
              ref: 'refs/tags/latest',
              sha: 'abc123'
            })
          })
      })
    })

    describe('when not successful', () => {
      it('returns false', () => {
        octokitMock.git.createRef.mockImplementation(() => {
          return Promise.resolve({status: 500})
        })
        octo
          .createTag({owner: 'callrail', repo: 'test'}, 'abc123')
          .subscribe(success => {
            expect(success).toBe(false)
            expect(octokitMock.git.createRef).toHaveBeenCalledWith({
              owner: 'callrail',
              repo: 'test',
              ref: 'refs/tags/latest',
              sha: 'abc123'
            })
          })
      })
    })
  })
})
