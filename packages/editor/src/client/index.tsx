import 'core-js/stable'
import 'regenerator-runtime/runtime'

import {ApolloClient, ApolloLink, ApolloProvider, InMemoryCache} from '@apollo/client'
import {onError} from '@apollo/client/link/error'
import {createUploadLink} from 'apollo-upload-client'
import React from 'react'
import ReactDOM from 'react-dom'
import {IconContext} from 'react-icons'

import {ElementID} from '../shared/elementID'
import {ClientSettings} from '../shared/types'
import {HotApp} from './app'
import {AuthProvider} from './authContext'
import {FacebookProvider} from './blocks/embeds/facebook'
import {InstagramProvider} from './blocks/embeds/instagram'
import {TwitterProvider} from './blocks/embeds/twitter'
import {initI18N} from './i18n'
import {LocalStorageKey} from './utility'

// See: https://www.apollographql.com/docs/react/data/fragments/#fragments-on-unions-and-interfaces
export async function fetchIntrospectionQueryResultData(url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      variables: {},
      query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `
    })
  })

  const result = await response.json()

  const possibleTypes: any = {}

  result.data.__schema.types.forEach((supertype: any) => {
    if (supertype.possibleTypes) {
      possibleTypes[supertype.name] = supertype.possibleTypes.map((subtype: any) => subtype.name)
    }
  })

  return possibleTypes
}

const onDOMContentLoaded = async () => {
  const {apiURL}: ClientSettings = JSON.parse(
    document.getElementById(ElementID.Settings)!.textContent!
  )

  const adminAPIURL = `${apiURL}/admin`

  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem(LocalStorageKey.SessionToken)
    const context = operation.getContext()

    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : '',
        ...context.headers
      },
      credentials: 'include',
      ...context
    })

    return forward(operation)
  })

  const authErrorLink = onError(({graphQLErrors, /* networkError, */ operation, forward}) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({/* message, locations, path, */ extensions}) => {
        if (
          ['UNAUTHENTICATED', 'TOKEN_EXPIRED'].includes(extensions?.code) &&
          !(
            window.location.pathname.includes('/logout') ||
            window.location.pathname.includes('/login')
          )
        ) {
          localStorage.removeItem(LocalStorageKey.SessionToken)
          // TODO: implement this handling console.warn()
        }
      })
      // if (networkError) console.log(`[Network error]: ${networkError}`)
    }
    return forward(operation)
  })

  const mainLink = createUploadLink({uri: adminAPIURL})

  const client = new ApolloClient({
    link: authLink.concat(authErrorLink).concat(mainLink),
    cache: new InMemoryCache({
      possibleTypes: await fetchIntrospectionQueryResultData(adminAPIURL)
    })
  })

  window.addEventListener('dragover', e => e.preventDefault())
  window.addEventListener('drop', e => e.preventDefault())

  ReactDOM.render(
    <ApolloProvider client={client}>
      <AuthProvider>
        <IconContext.Provider value={{className: 'react-icons'}}>
          <FacebookProvider sdkLanguage={'en_US'}>
            <InstagramProvider>
              <TwitterProvider>
                <HotApp />
              </TwitterProvider>
            </InstagramProvider>
          </FacebookProvider>
        </IconContext.Provider>
      </AuthProvider>
    </ApolloProvider>,
    document.getElementById(ElementID.ReactRoot)
  )
}

initI18N()

if (document.readyState !== 'loading') {
  onDOMContentLoaded()
} else {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded)
}
