import * as core from '@actions/core'
import {context} from '@actions/github'
import {from, iif, Observable, of, throwError} from 'rxjs'
import {catchError, map, switchMap, tap} from 'rxjs/operators'
import {latestTagRef, Octokit} from './octokit'

export class Actions {
  constructor(private octo = new Octokit()) {}

  updateLatestTag(): Observable<boolean> {
    const {repo, sha} = context
    return this.octo.stateIsSuccess().pipe(
      switchMap(success => iif(() => success, this.octo.latestTagExists())),
      switchMap(latestExists => {
        core.debug(`latestExists: ${latestExists}`)
        if (latestExists) {
          return this.deleteTag(repo)
        }
        return of(true)
      }),
      switchMap(deleteSuccess =>
        iif(() => deleteSuccess, this.createTag(repo, sha))
      )
    )
  }

  private deleteTag(repo: {owner: string; repo: string}): Observable<boolean> {
    const latestTag = `tags/${latestTagRef}`
    core.debug(`Attempting to delete tag ${latestTag}`)
    return from(
      this.octo.octokit.git.deleteRef({
        ...repo,
        ref: `tags/${latestTagRef}`
      })
    ).pipe(
      map(resp => resp.status === 204),
      catchError(err =>
        throwError(`Something went wrong removing the tag! ${err.message}`)
      )
    )
  }

  private createTag(
    repo: {owner: string; repo: string},
    sha: string
  ): Observable<boolean> {
    const ref = `tags/${latestTagRef}`
    core.debug(`Attempting to create ref ${ref} for sha ${sha}`)
    return from(
      this.octo.octokit.git.createRef({
        ...repo,
        ref,
        sha
      })
    ).pipe(
      tap(() => {
        core.debug(`Commit ${sha} tagged with 'latest'`)
      }),
      map(resp => resp.status === 201),
      catchError(err => throwError(`Couldn't create the tag! ${err.message}`))
    )
  }
}
