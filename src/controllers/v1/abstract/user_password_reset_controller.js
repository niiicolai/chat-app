import errorHandler from '../../_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.create = () => {
        router.post('/user_password_reset', async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.create({ body: req.body });
                res.sendStatus(204);
            });
        });
    }

    ctrl.resetPasswordEdit = () => {
        router.get('/user_password_reset/:uuid/reset_password', async (req, res) => {
            await errorHandler(res, async () => {
                // Quick solution to show a form to reset password
                const html = `
                    <html><head><title>Reset Password</title></head><body>
                        <h1>Reset Password</h1>
                        <form action="/user_password_reset/${req.params.uuid}/reset_password" method="post">
                            <input type="password" name="password" placeholder="Password" required>
                            <button type="submit">Reset Password</button>
                        </form>

                        <script>
                            document.querySelector('form').addEventListener('submit', async (e) => {
                                e.preventDefault();
                                const password = document.querySelector('input[name="password"]').value;
                                if (!password || password.length < 8) {
                                    alert('Password is required and must be at least 8 characters');
                                    return;
                                }
                                const response = await fetch('/api/v1/mysql/user_password_reset/${req.params.uuid}/reset_password', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ password }),
                                });
                             
                                const result = await response.json();
                                alert(JSON.stringify(result));
                            });
                        </script>
                    </body></html>
                `;
                res.send(html);
            });
        });
    }

    ctrl.resetPassword = () => {
        router.patch('/user_password_reset/:uuid/reset_password', async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.resetPassword({ uuid: req.params.uuid, body: req.body });
                res.json({ message: 'Password reset. You can close this page now.' });
            });
        });
    }

    return ctrl;
};
