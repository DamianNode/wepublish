import {initClient} from './client'
import {ExtensionConfig} from './interfaces/extensionConfig'

const config: ExtensionConfig = {}
if (document.readyState !== 'loading') {
  initClient(config)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initClient(config)
  })
}
