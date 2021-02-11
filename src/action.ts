import {context} from '@actions/github'
import {iif, Observable, of} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {Octokit} from './octokit'

export class Actions {
  constructor(private octo = new Octokit()) {}

  updateLatestTag(): Observable<boolean> {
    const {repo, sha} = context
    // first check if the commit's status state is success
    return this.octo.stateIsSuccess().pipe(
      // if it is, then check if the latest tag exists
      switchMap(success => iif(() => success, this.octo.latestTagExists())),
      // if the latest tag exists, delete it
      switchMap(latestExists => {
        if (latestExists) {
          return this.octo.deleteTag()
        }
        return of(true)
      }),
      // and finally, if the delete (if any) was successful, create the latest tag
      switchMap(deleteSuccess =>
        iif(() => deleteSuccess, this.octo.createTag(repo, sha))
      )
    )
  }
}
