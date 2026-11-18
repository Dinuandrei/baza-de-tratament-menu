import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'w6d4ck0i',
    dataset: 'production',
  },
  deployment: {
    // Set by `sanity deploy`; keeps future deploys non-interactive.
    appId: 'f3y36yyu05kyfnr9u4ls2bxq',
    autoUpdates: false,
  },
})
