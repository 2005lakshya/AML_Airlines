import { Issuer, generators } from 'openid-client'

let _issuer = null

function required(name, val) {
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

export async function getOidcClient() {
  const issuerUrl = required('COGNITO_ISSUER', process.env.COGNITO_ISSUER)
  const clientId = required('COGNITO_CLIENT_ID', process.env.COGNITO_CLIENT_ID)
  const clientSecret = process.env.COGNITO_CLIENT_SECRET || undefined
  const redirectUri = required('COGNITO_REDIRECT_URI', process.env.COGNITO_REDIRECT_URI)

  // Discover issuer metadata from Cognito (cache issuer only)
  if (!_issuer) {
    _issuer = await Issuer.discover(issuerUrl)
  }

  // Always create a fresh client to pick up current redirect_uri from env
  const client = new _issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ['code'],
    token_endpoint_auth_method: clientSecret ? 'client_secret_basic' : 'none'
  })

  return client
}

export function newState() {
  return generators.state()
}

export function newNonce() {
  return generators.nonce()
}
