import authMiddleware from '../middlewares/auth_middleware.js';
import csrfMiddleware from '../middlewares/csrf_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!CLIENT_ID) console.error('GOOGLE_CLIENT_ID is not set in the .env file');

const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!CLIENT_SECRET) console.error('GOOGLE_CLIENT_SECRET is not set in the .env file');

const CLIENT_REDIRECT = process.env.OAUTH_CLIENT_REDIRECT_URL;
if (!CLIENT_REDIRECT) console.error('OAUTH_CLIENT_REDIRECT_URL is not set in the .env file');

export default (crudService, signupRedirectPath, loginRedirectPath, addExistingUserRedirectPath) => {
    const router = express.Router();
    const ctrl = { router };
    const signupClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, signupRedirectPath);
    const loginClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, loginRedirectPath);
    const addExistingUserClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, addExistingUserRedirectPath);
     
    ctrl.signup = () => {
        router.get('/user/signup/google', [originMiddleware], async (req, res) => {
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
        router.get('/user/login/google', [originMiddleware, csrfMiddleware], async (req, res) => {
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
    
    ctrl.addToExistingUser = () => {
        router.get('/user/add/google', [originMiddleware, csrfMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                
                const url = addExistingUserClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: ['email'],
                });

                res.redirect(url);
            });
        });
    }

    ctrl.addToExistingUserCallback = () => {
        router.get('/user/add/google/callback', [], async (req, res) => {
            await errorHandler(res, async () => {
                const { code } = req.query;
                const { tokens } = await addExistingUserClient.getToken(code);
                addExistingUserClient.setCredentials(tokens);
                const info = await google.oauth2({ version: 'v2', auth: addExistingUserClient }).userinfo.get();
                res.redirect(`${CLIENT_REDIRECT}/confirm?third_party_id=${info.data.id}&type=Google`);
            });
        });
    }

    ctrl.addToExistingUserConfirm = () => {
        router.post('/user/add/google/confirm', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { third_party_id, type } = req.body;
                await crudService.addToExistingUser({ third_party_id, type, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
