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

export type ChatwootWidgetOptions = {
  enabled: boolean
  websiteToken: string
  baseUrl: string
}

/**
 * Appended to /client-config.js so the register app loads Chatwoot after login.
 * Identifies the OpenCRVS user via IndexedDB USER_DETAILS (no core changes).
 */
export function buildChatwootWidgetScript(options: ChatwootWidgetOptions): string {
  if (!options.enabled || !options.websiteToken) {
    return ''
  }

  const websiteToken = JSON.stringify(options.websiteToken)
  const baseUrl = JSON.stringify(options.baseUrl)

  return `
;(function () {
  if (window.__opencrvsChatwootBootstrapped) {
    return;
  }
  window.__opencrvsChatwootBootstrapped = true;

  var CHATWOOT_WEBSITE_TOKEN = ${websiteToken};
  var CHATWOOT_BASE_URL = ${baseUrl};
  var USER_DETAILS_KEY = 'USER_DETAILS';
  var IDB_NAME = 'OpenCRVS';
  var IDB_STORE = 'keyvaluepairs';
  var POLL_MS = 1500;
  var lastUserId = null;

  window.chatwootSettings = {
    position: 'right',
    type: 'standard',
    launcherTitle: ''
  };

  function formatName(user) {
    if (!user) {
      return '';
    }
    // OpenCRVS v2 USER_DETAILS: { name: { firstname, surname } }
    if (user.name && !Array.isArray(user.name)) {
      return [user.name.firstname, user.name.surname]
        .filter(Boolean)
        .join(' ')
        .trim();
    }
    // Legacy GraphQL USER_DETAILS: name is HumanName[]
    if (user.name && user.name.length) {
      var preferred =
        user.name.find(function (n) {
          return n && n.use === 'en';
        }) || user.name[0];
      if (preferred) {
        return [preferred.firstNames, preferred.familyName]
          .filter(Boolean)
          .join(' ')
          .trim();
      }
    }
    return user.username || user.email || '';
  }

  function roleLabel(user) {
    if (!user || user.role == null) {
      return '';
    }
    // v2: role is a string e.g. "LOCAL_REGISTRAR"
    if (typeof user.role === 'string') {
      return user.role;
    }
    if (user.role.label && user.role.label.defaultMessage) {
      return user.role.label.defaultMessage;
    }
    return user.role.id || '';
  }

  function officeLabel(user) {
    if (!user) {
      return '';
    }
    if (user.primaryOffice && user.primaryOffice.name) {
      return user.primaryOffice.name;
    }
    // v2 stores office id only
    return user.primaryOfficeId || '';
  }

  function readUserDetails() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      var openReq = indexedDB.open(IDB_NAME);
      openReq.onerror = function () {
        resolve(null);
      };
      openReq.onsuccess = function () {
        var db = openReq.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.close();
          resolve(null);
          return;
        }
        try {
          var tx = db.transaction(IDB_STORE, 'readonly');
          var store = tx.objectStore(IDB_STORE);
          var getReq = store.get(USER_DETAILS_KEY);
          getReq.onsuccess = function () {
            db.close();
            var raw = getReq.result;
            if (!raw) {
              resolve(null);
              return;
            }
            try {
              resolve(typeof raw === 'string' ? JSON.parse(raw) : raw);
            } catch (e) {
              resolve(null);
            }
          };
          getReq.onerror = function () {
            db.close();
            resolve(null);
          };
        } catch (e) {
          db.close();
          resolve(null);
        }
      };
    });
  }

  function identifyUser(user) {
    if (!window.$chatwoot || !user) {
      return;
    }
    var id = user.userMgntUserID || user.id;
    if (!id) {
      return;
    }
    if (lastUserId === id) {
      return;
    }
    lastUserId = id;
    var payload = { name: formatName(user) };
    if (user.email) {
      payload.email = user.email;
    }
    if (user.mobile) {
      payload.phone_number = user.mobile;
    }
    window.$chatwoot.setUser(String(id), payload);
    window.$chatwoot.setCustomAttributes({
      role: roleLabel(user),
      office: officeLabel(user)
    });
  }

  function clearUser() {
    if (!window.$chatwoot || !lastUserId) {
      lastUserId = null;
      return;
    }
    lastUserId = null;
    window.$chatwoot.reset();
  }

  function syncUserFromStorage() {
    readUserDetails().then(function (user) {
      if (user) {
        identifyUser(user);
      } else {
        clearUser();
      }
    });
  }

  function startUserSync() {
    syncUserFromStorage();
    setInterval(syncUserFromStorage, POLL_MS);
  }

  window.addEventListener('chatwoot:ready', function () {
    startUserSync();
  });

  ;(function (d, t) {
    var g = d.createElement(t);
    var s = d.getElementsByTagName(t)[0];
    g.src = CHATWOOT_BASE_URL + '/packs/js/sdk.js';
    g.async = true;
    s.parentNode.insertBefore(g, s);
    g.onload = function () {
      window.chatwootSDK.run({
        websiteToken: CHATWOOT_WEBSITE_TOKEN,
        baseUrl: CHATWOOT_BASE_URL
      });
    };
  })(document, 'script');
})();
`
}
