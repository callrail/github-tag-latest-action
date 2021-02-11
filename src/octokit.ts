import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {from, Observable, throwError} from 'rxjs'
import {catchError, map, tap} from 'rxjs/operators'

const token = core.getInput('github_token')
const octo = getOctokit(token)

export class Octokit {
  private latestTagName: string = core.getInput('latest_tag_name') || 'latest'

  constructor(public octokit = octo) {}

  latestTagExists(): Observable<boolean> {
    const {repo} = context
    return from(
      this.octokit.repos.listTags({
        ...repo,
        per_page: 100
      })
    ).pipe(
      map(resp => !!resp.data.find(tag => tag.name === this.latestTagName)),
      tap(found => {
        if (found) {
          core.debug(`Found tag ${this.latestTagName}!`)
        } else {
          core.debug(`Couldn't find tag ${this.latestTagName}.`)
        }
      })
    )
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

  deleteTag(): Observable<boolean> {
    const {repo} = context
    const ref = `tags/${this.latestTagName}`
    core.debug(`Attempting to delete tag ${ref}`)
    return from(
      this.octokit.git.deleteRef({
        ...repo,
        ref
      })
    ).pipe(
      map(resp => resp.status === 204),
      catchError(err => {
        core.setFailed(`Something went wrong removing the tag! ${err.message}`)
        return throwError(
          `Something went wrong removing the tag! ${err.message}`
        )
      })
    )
  }

  createTag(
    repo: {owner: string; repo: string},
    sha: string
  ): Observable<boolean> {
    const ref = `refs/tags/${this.latestTagName}`
    core.debug(`Attempting to create ref ${ref} for sha ${sha}`)
    return from(
      this.octokit.git.createRef({
        ...repo,
        ref,
        sha
      })
    ).pipe(
      tap(() => {
        core.debug(`Commit ${sha} tagged with '${this.latestTagName}'`)
      }),
      map(resp => resp.status === 201),
      catchError(err => {
        core.setFailed(`Couldn't create the tag! ${err.message}`)
        return throwError(`Couldn't create the tag! ${err.message}`)
      })
    )
  }
}
