const UserService = require('../../services/user.service');
const models = require('../../models');
const bcrypt = require('bcryptjs');

describe('UserService unit tests', () => {

    describe('findAllUsers()', () => {

        it('suceeds and returns an empty array when no users are found', async () => {
            const mockReturnValue = [];
            models.User.findAll = jest.fn().mockReturnValue(mockReturnValue);

            const result = await UserService.findAllUsers();

            expect(result).toEqual(mockReturnValue);
        });

        it('suceeds and returns an array of users when users are found', async () => {
            const mockReturnValue = [{ id: 1 }, { id: 2 }, { id: 3 }];
            models.User.findAll = jest.fn().mockReturnValue(mockReturnValue);

            const result = await UserService.findAllUsers();

            expect(result).toEqual(mockReturnValue);
        });

    });

    describe('findUserByUserName', () => {

        it('succeeds and returns a false value when no user is found', async () => {
            const mockReturnValue = undefined;
            models.User.findOne = jest.fn().mockReturnValue(mockReturnValue);

            const result = await UserService.findUserByUserName();

            expect(result).toEqual(mockReturnValue);
        });

        it('succeeds and returns a user object when one is found', async () => {
            const mockReturnValue = { id: 3 };
            models.User.findOne = jest.fn().mockReturnValue(mockReturnValue);

            const result = await UserService.findUserByUserName('test');

            expect(result).toEqual(mockReturnValue);
        });

    });

    describe('createNewUser()', () => {

        it('succeeds and returns a new user object with the proper data', async () => {
            const mockReturnValue = { id: 3 };
            models.User.create = jest.fn(() => mockReturnValue);

            const result = await UserService.createNewUser({}, 'test');

            expect(result).toEqual(mockReturnValue);
        });

    });

    describe('validateCreationData()', () => {

        it('succeeds and returns false when no validation error is encountered', async () => {
            UserService.findUserByUserName = jest.fn().mockReturnValue(undefined);
            const data = {
                userName: 'test',
                bandRole: ['BASS'],
                password: 'test',
            };

            const result = await UserService.validateCreationData(data);

            expect(result).toEqual(false);
        });

        it('fails and returns error message when a required field is missing', async () => {
            UserService.findUserByUserName = jest.fn().mockReturnValue(undefined);
            const data = {
                userName: 'test',
                bandRole: ['BASS'],
            };

            const result = await UserService.validateCreationData(data);

            expect(result).toBeTruthy();
            expect(typeof result).toEqual('string');
        });

        it('fails and returns error message when a required field has no value', async () => {
            UserService.findUserByUserName = jest.fn().mockReturnValue(undefined);
            const data = {
                userName: 'test',
                bandRole: ['BASS'],
                password: undefined,
            };

            const result = await UserService.validateCreationData(data);

            expect(result).toBeTruthy();
            expect(typeof result).toEqual('string');
        });

        it('fails and returns error message when a user already exists with the prospective username', async () => {
            UserService.findUserByUserName = jest.fn().mockReturnValue({ id: 1 });
            const data = {
                userName: 'test',
                bandRole: ['BASS'],
                password: 'test',
            };

            const result = await UserService.validateCreationData(data);

            expect(result).toBeTruthy();
            expect(typeof result).toEqual('string');
        });

        it('fails and returns error message when an invalid band role choice is specified', async () => {
            UserService.findUserByUserName = jest.fn().mockReturnValue({ id: 1 });
            const data = {
                userName: 'test',
                bandRole: ['BADROLE'],
                password: 'test',
            };

            const result = await UserService.validateCreationData(data);

            expect(result).toBeTruthy();
            expect(typeof result).toEqual('string');
        });

    });

    describe('hashPassword()', () => {

        it('succeeds and returns a properly hashed password', async () => {
            const testPassword = 'test';

            const result = await UserService.hashPassword(testPassword);

            expect(bcrypt.compare(testPassword, result)).toBeTruthy();
        });

    });

    describe('updateUsersAfterJamEnd()', () => {

        it('succeeds and calls update on each user found', async () => {
            models.User.update = jest.fn();
            const mockUsers = [
                { id: 1, pastJamIds: [], update: models.User.update },
                { id: 2, pastJamIds: [], update: models.User.update },
                { id: 3, pastJamIds: [], update: models.User.update },
            ];
            models.User.findAll = jest.fn().mockReturnValue(mockUsers);

            await UserService.updateUsersAfterJamEnd(1, [1, 2, 3])

            expect(models.User.update).toHaveBeenCalledTimes(3);
        });

        it('succeeds when no users are found', async () => {
            models.User.update = jest.fn();
            const mockUsers = [];
            models.User.findAll = jest.fn().mockReturnValue(mockUsers);

            await UserService.updateUsersAfterJamEnd(1, [1, 2, 3])

            expect(models.User.update).toHaveBeenCalledTimes(0);
        });

    });

});