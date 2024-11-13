import errorHandler from './_error_handler.js';
import express from 'express';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!CLIENT_ID) console.error('GOOGLE_CLIENT_ID is not set in the .env file');

const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!CLIENT_SECRET) console.error('GOOGLE_CLIENT_SECRET is not set in the .env file');

const CLIENT_REDIRECT = process.env.OAUTH_CLIENT_REDIRECT_URL;
if (!CLIENT_REDIRECT) console.error('OAUTH_CLIENT_REDIRECT_URL is not set in the .env file');

export default (crudService, signupRedirectPath, loginRedirectPath) => {
    const router = express.Router();
    const ctrl = { router };
    const signupClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, signupRedirectPath);
    const loginClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, loginRedirectPath);

    ctrl.signup = () => {
        router.get('/user/signup/google', [], async (req, res) => {
            await errorHandler(res, async () => {
                
                const url = signupClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: ['email'],
                });

                res.redirect(url);
            });
        });
    }

    ctrl.signupCallback = () => {
        router.get('/user/signup/google/callback', [], async (req, res) => {
            await errorHandler(res, async () => {
                const { code } = req.query;
                const { tokens } = await signupClient.getToken(code);
                signupClient.setCredentials(tokens);
                const info = await google.oauth2({ version: 'v2', auth: signupClient }).userinfo.get();
                const result = await crudService.create({ info });
                signupClient.revokeToken(tokens.access_token);
                
                res.redirect(`${CLIENT_REDIRECT}?token=${result.token}`);
            });
        });
    }

    ctrl.login = () => {
        router.get('/user/login/google', [], async (req, res) => {
            await errorHandler(res, async () => {
                
                const url = loginClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: ['email'],
                });

                res.redirect(url);
            });
        });
    }

    ctrl.loginCallback = () => {
        router.get('/user/login/google/callback', [], async (req, res) => {
            await errorHandler(res, async () => {
                const { code } = req.query;
                const { tokens } = await loginClient.getToken(code);
                loginClient.setCredentials(tokens);
                const info = await google.oauth2({ version: 'v2', auth: loginClient }).userinfo.get();
                const result = await crudService.login({ info });
                loginClient.revokeToken(tokens.access_token);

                res.redirect(`${CLIENT_REDIRECT}?token=${result.token}`);
            });
        });
    }

    return ctrl;
};
