import * as core from '@actions/core'
import {Actions} from './action'

async function run(): Promise<boolean | undefined> {
  try {
    return new Actions().updateLatestTag().toPromise()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
