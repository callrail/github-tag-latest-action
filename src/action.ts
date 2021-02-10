import * as core from '@actions/core'
import {context} from '@actions/github'
import {from, iif, Observable, throwError} from 'rxjs'
import {catchError, map, switchMap, tap} from 'rxjs/operators'
import {latestTagRef, Octokit} from './octokit'

export class Actions {
  constructor(private octo = new Octokit()) {}

  updateLatestTag(): Observable<boolean> {
    const {repo, sha} = context
    return this.octo.stateIsSuccess().pipe(
      switchMap(success => iif(() => success, this.octo.latestTagExists())),
      switchMap(latestTagExists =>
        iif(() => latestTagExists, this.deleteTag(repo))
      ),
      switchMap(deleteSuccess =>
        iif(() => deleteSuccess, this.createTag(repo, sha))
      )
    )
  }

  private deleteTag(repo: {owner: string; repo: string}): Observable<boolean> {
    return from(
      this.octo.octokit.git.deleteRef({
        ...repo,
        ref: latestTagRef
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
    return from(
      this.octo.octokit.git.createRef({
        ...repo,
        ref: latestTagRef,
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
