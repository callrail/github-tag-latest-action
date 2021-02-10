import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {from, Observable} from 'rxjs'
import {map, tap} from 'rxjs/operators'

export const latestTagRef = 'latest'
const token = core.getInput('github_token')
export const octo = getOctokit(token)

export class Octokit {
  constructor(public octokit = octo) {}

  latestTagExists(): Observable<boolean> {
    const {repo} = context
    return from(
      this.octokit.repos.listTags({
        ...repo,
        per_page: 100
      })
    ).pipe(map(resp => !!resp.data.find(tag => tag.name === latestTagRef)))
  }

  stateIsSuccess(): Observable<boolean> {
    const {repo, sha} = context
    return from(
      this.octokit.repos.getCombinedStatusForRef({
        ...repo,
        ref: sha
      })
    ).pipe(
      tap(({data: combinedStatus}) => {
        core.debug(`Status state for sha ${sha} is ${combinedStatus.state}.`)
      }),
      map(({data: combinedStatus}) => combinedStatus.state === 'success')
    )
  }
}
