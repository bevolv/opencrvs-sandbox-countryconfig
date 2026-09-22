/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import { describe, expect, it } from 'vitest'
import { buildChatwootWidgetScript } from './widgetScript'

describe('buildChatwootWidgetScript', () => {
  it('returns empty string when disabled', () => {
    expect(
      buildChatwootWidgetScript({
        enabled: false,
        websiteToken: 'token',
        baseUrl: 'https://app.chatwoot.com'
      })
    ).toBe('')
  })

  it('returns empty string when token is missing', () => {
    expect(
      buildChatwootWidgetScript({
        enabled: true,
        websiteToken: '',
        baseUrl: 'https://app.chatwoot.com'
      })
    ).toBe('')
  })

  it('emits SDK bootstrap and setUser sync when enabled', () => {
    const script = buildChatwootWidgetScript({
      enabled: true,
      websiteToken: 'jCdSWWgw6AUwnHb4DfdH78Ux',
      baseUrl: 'https://app.chatwoot.com'
    })

    expect(script).toContain('jCdSWWgw6AUwnHb4DfdH78Ux')
    expect(script).toContain('https://app.chatwoot.com')
    expect(script).toContain('chatwootSDK.run')
    expect(script).toContain('setUser')
    expect(script).toContain('setCustomAttributes')
    expect(script).toContain('USER_DETAILS')
    expect(script).toContain('$chatwoot.reset')
    expect(script).toContain('firstname')
    expect(script).toContain('surname')
    expect(script).toContain('primaryOfficeId')
  })
})
