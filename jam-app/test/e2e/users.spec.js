const request = require('supertest')
const models = require('../../models');
const AuthService = require('../../services/auth.service');
const app = require('../../app');

describe('UserService end to end tests', () => {

    describe('GET `/users`', () => {

        it('succeeds and returns a rendered template when no users are defined', async () => {
            models.User.findAll = jest.fn().mockReturnValue([]);

            return await request(app)
                .get(`/users`)
                .set('Cookie', [`accessToken=${AuthService.generateJWTAccessToken({ id: 1, userName: 'test' })}`])
                .expect(200)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

        it('succeeds and returns a rendered template when there are users defined', async () => {
            models.User.findAll = jest.fn().mockReturnValue([
                {
                    id: 1,
                    userName: 'test1',
                    bandRole: ['BASS'],
                    password: 'test1',
                    pasJamIds: [],
                },
                {
                    id: 2,
                    userName: 'test2',
                    bandRole: ['BASS'],
                    password: 'test2',
                    pasJamIds: [],
                }
            ]);
            
            return await request(app)
                .get(`/users`)
                .set('Cookie', [`accessToken=${AuthService.generateJWTAccessToken({ id: 1, userName: 'test' })}`])
                .expect(200)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

    });

    describe('POST `/users`', () => {

        it('should succeed, set an auth cookie and redirect to pending jams page when no errors are encountered', async () => {
            models.User.findOne = jest.fn().mockReturnValue();
            models.User.create = jest.fn().mockReturnValue({ id: 1, userName: 'test' });

            return await request(app)
                .post(`/users`)
                .send({ userName: 'test', bandRole: ['BASS'], password: 'test' })
                .expect(302)
                .then(res => {
                    expect(res.text).toBeDefined();
                    expect(res.redirect).toBeTruthy();
                    expect(res.header.location).toEqual('/jams/pending');
                })
        });

        it('should fail an return error message when a required field is missing', async () => {
            models.User.findOne = jest.fn().mockReturnValue();
            models.User.create = jest.fn().mockReturnValue({ id: 1, userName: 'test' });

            return await request(app)
                .post(`/users`)
                .send({ userName: 'test', bandRole: ['BASS'] })
                .expect(500)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

        it('should fail an return error message when a required field has an empty value', async () => {
            models.User.findOne = jest.fn().mockReturnValue();
            models.User.create = jest.fn().mockReturnValue({ id: 1, userName: 'test' });

            return await request(app)
                .post(`/users`)
                .send({ userName: 'test', bandRole: ['BASS'], password: undefined })
                .expect(500)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

        it('should fail when a user with the specified username can already be found', async () => {
            models.User.findOne = jest.fn().mockReturnValue({ id: 2 });
            models.User.create = jest.fn().mockReturnValue({ id: 1, userName: 'test' });

            return await request(app)
                .post(`/users`)
                .send({ userName: 'test', bandRole: ['BASS'], password: 'test' })
                .expect(500)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

        it('should fail when the user has chosen an invalid band role', async () => {
            models.User.findOne = jest.fn().mockReturnValue();
            models.User.create = jest.fn().mockReturnValue({ id: 1, userName: 'test' });

            return await request(app)
                .post(`/users`)
                .send({ userName: 'test', bandRole: ['INVALID'], password: 'test' })
                .expect(500)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

    });

    describe('GET `/users/signup`', () => {

        it('should have status 200 and return the rendered signup page template when the user is not authenticated', async () => {
            return await request(app)
                .get(`/users/signup`)
                .set('Cookie', [`accessToken=NONE`])
                .expect(200)
                .then(res => {
                    expect(res.text).toBeDefined();
                    expect(res.redirect).toBeFalsy();
                })
        });

        it('should have status 302 and redirect to the pending jams page if the user is authenticated', async () => {
            return await request(app)
                .get(`/users/signup`)
                .set('Cookie', [`accessToken=${AuthService.generateJWTAccessToken({ id: 1, userName: 'test' })}`])
                .expect(302)
                .then(res => {
                    expect(res.text).toBeDefined();
                    expect(res.redirect).toBeTruthy();
                    expect(res.header.location).toEqual('/jams/pending');
                })
        });

    });

    describe('POST `/users/login`', () => {

        it('should succeed, return an access token and redirect to pending jams page when no problems are encountered', async () => {
            models.User.findOne = jest.fn().mockReturnValue({
                id: 1,
                password: '$2a$12$y5vlI/AR1crF//41eyGKE.FmAYojKFYok2CUjgjk5BiwB2MOFf2s.',
            });

            return await request(app)
                .post(`/users/login`)
                .send({ userName: 'test', password: 'test' })
                .expect(302)
                .then(res => {
                    expect(res.text).toBeDefined();
                    expect(res.redirect).toBeTruthy();
                    expect(res.header.location).toEqual('/jams/pending');
                    expect(res.header['set-cookie'][0]).toContain('accessToken');
                })
        });

        it('should fail and return a server error when password checking fails', async () => {
            models.User.findOne = jest.fn().mockReturnValue({
                id: 1,
                password: '$2a$12$y5vlI/AR1crF//41eyGKE.FmAYojKFYok2CUjgjk5BiwB2MOFf2s.',
            });

            return await request(app)
                .post(`/users/login`)
                .send({ userName: 'test', password: 'INVALID' })
                .expect(500)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

        it('should fail and return a server error when the user cannot be found', async () => {
            models.User.findOne = jest.fn().mockReturnValue();

            return await request(app)
                .post(`/users/login`)
                .send({ userName: 'test', password: 'test' })
                .expect(500)
                .then(res => {
                    expect(res.text).toBeDefined();
                })
        });

    });

    describe('GET `/users/logout`', () => {

        it('should succeed and redirect to login page', async () => {
            return await request(app)
                .get(`/users/logout`)
                .set('Cookie', [`accessToken=${AuthService.generateJWTAccessToken({ id: 1, userName: 'test' })}`])
                .expect(302)
                .then(res => {
                    expect(res.text).toBeDefined();
                    expect(res.redirect).toBeTruthy();
                    expect(res.header.location).toEqual('/');
                })
        });

    });

});
