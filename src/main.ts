import * as core from '@actions/core'
import {Actions} from './action'
import {Octokit} from './octokit'

async function run(): Promise<boolean | undefined> {
  try {
    const wrapper = new Octokit()
    const success = await wrapper.stateIsSuccess().toPromise()
    if (success) {
      core.debug('State for status is success!')
      return new Actions().updateLatestTag().toPromise()
    }
    core.debug('State was not success yet')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
