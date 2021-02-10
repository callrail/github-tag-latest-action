import {of} from 'rxjs'
import {Actions} from '../src/action'
import {Octokit} from '../src/octokit'

jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('../src/octokit')

describe('Actions', () => {
  let action: Actions
  let octoMock: any

  beforeEach(() => {
    octoMock = {
      octokit: {
        git: {
          deleteRef: jest.fn(() => Promise.resolve({status: 204})),
          createRef: jest.fn(() => Promise.resolve({status: 201}))
        }
      },
      stateIsSuccess: jest.fn(),
      latestTagExists: jest.fn(() => of(true))
    }
    action = new Actions(octoMock)
  })

  describe('updateLatestTag', () => {
    describe('when state is success', () => {
      beforeEach(() => {
        octoMock.stateIsSuccess.mockImplementation(() => {
          return of(true)
        })
      })
      describe('when latest tag exists', () => {
        beforeEach(async () => {
          octoMock.latestTagExists.mockImplementation(() => {
            return of(true)
          })
        })

        it('deletes the latest tag', () => {
          action.updateLatestTag().subscribe(success => {
            expect(success).toBe(true)
            expect(octoMock.octokit.git.deleteRef).toHaveBeenCalled()
            expect(octoMock.octokit.git.createRef).toHaveBeenCalled()
          })
        })
      })

      describe('when latest tag does not exist', () => {
        beforeEach(() => {
          octoMock.latestTagExists.mockImplementation(() => {
            return of(false)
          })
        })
        it('does not call deleteRef', () => {
          action.updateLatestTag().subscribe(success => {
            expect(success).toBe(true)
            expect(octoMock.octokit.git.deleteRef).not.toHaveBeenCalled()
            expect(octoMock.octokit.git.createRef).toHaveBeenCalled()
          })
        })
      })
    })

    describe('when state is not success', () => {
      beforeEach(() => {
        octoMock.stateIsSuccess.mockImplementation(() => {
          return of(false)
        })
      })

      it('returns false', () => {
        action.updateLatestTag().subscribe(result => {
          expect(result).toBe(false)
          expect(octoMock.octokit.git.deleteRef).not.toHaveBeenCalled()
          expect(octoMock.octokit.git.createRef).not.toHaveBeenCalled()
        })
      })
    })
  })
})
