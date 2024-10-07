const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

/**
 * # IMPORTANT #
 * DO NOT CHANGE THE FILE NAMES.
 * Otherwise, the token file will be committed to the repository.
 * The token file is ignored by git.
 * The credentials file is not ignored by git.
 */
const TOKEN_FILE = 'gmail_token.json';
const CREDENTIALS_FILE = 'gmail_credentials.json';

const TOKEN_PATH = path.join(process.cwd(), TOKEN_FILE);
const CREDENTIALS_PATH = path.join(process.cwd(), CREDENTIALS_FILE);

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

let auth = null;
async function loadAuth() {
  auth = await loadSavedCredentialsIfExist();
  if (!auth) {
    console.warn('WARNING: No saved credentials found. Run "npm run configure:gmail" to set up Gmail API access.');
    console.warn('WARNING: No emails will be sent. However, for testing, you can find the e-mail content in the console.');
    return;
  }

  console.log('INFO: Gmail API access configured and ready to send e-mails.');
}

async function sendMail(textContent, subject, to) {
  console.warn(`DEBUG: Sending new e-mail...`);
  console.warn(`DEBUG: Email subject: ${subject}`);
  console.warn(`DEBUG: Email content: ${textContent}`);
  console.warn(`DEBUG: Email to: ${to}`);

  const environment = process.env.NODE_ENV || 'development';
  if (environment !== 'production') {
    console.warn('WARNING: E-mails are only sent in production mode.');
    return;
  }

  if (!auth) {
    console.warn('WARNING: No saved credentials found. Run "npm run configure:gmail" to set up Gmail API access.');
    console.warn('WARNING: Unable to send e-mail.');
    return;
  }

  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(
    `To: ${to}\n` +
    `Subject: ${subject}\n\n` +
    `${textContent}`
  ).toString('base64');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
    },
  });
}

module.exports = {
  authorize,
  sendMail,
  loadAuth,
};
