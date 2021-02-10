import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

const latestTagRef = 'latest'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github_token')
    const octokit = getOctokit(token)
    const {repo, sha} = context
    const {data: combinedStatus} = await octokit.repos.getCombinedStatusForRef({
      ...repo,
      ref: sha
    })
    core.debug(`Status state for sha ${sha} is ${combinedStatus.state}.`)
    if (combinedStatus.state === 'success') {
      const tagsList = await octokit.repos.listTags({
        ...repo,
        per_page: 100
      })
      const {data: tags} = tagsList
      const latestTag = tags.find(tag => tag.name === latestTagRef)
      if (latestTag) {
        octokit.git.deleteRef({
          ...repo,
          ref: latestTagRef
        })
      }
      octokit.git.createRef({
        ...repo,
        ref: latestTagRef,
        sha
      })
      core.debug(`Commit ${sha} tagged with 'latest'`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
