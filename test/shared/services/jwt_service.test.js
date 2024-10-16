import 'dotenv/config'
import { expect, test } from "vitest";
import JwtService from "../../../src/shared/services/jwt_service.js";

test.each([
    ['123e4567-e89b-12d3-a456-426614174000'],
    ['123e4567-e89b-12d3-a456-426614174001'],
    ['123e4567-e89b-12d3-a456-426614174002'],
])('JwtService.sign valid', async (sub) => {
    const token = JwtService.sign(sub);
    const user = JwtService.verifyAndDecodeString(token);

    expect(user.sub).toBe(sub);
});


test.each([
    [undefined, 'Sub is required.'],
    [null, 'Sub is required.'],
    [0, 'Sub is required.'], // if (0) is the same as if (false)
    [1, 'Sub must be a string.'], // if (1) is the same as if (true)
    [-1, 'Sub must be a string.'],
    ['invalid', 'Sub must be a valid UUID.'],
])('JwtService.sign invalid partitions', async (sub, expected) => {
    expect(() => JwtService.sign(sub)).toThrowError(expected);
});


test.each([
    ['123e4567-e89b-12d3-a456-426614174000'],
    ['123e4567-e89b-12d3-a456-426614174001'],
    ['123e4567-e89b-12d3-a456-426614174002'],
])('JwtService.verifyAndDecodeHTTPHeader valid', async (sub) => {
    const token = JwtService.sign(sub);
    const user = JwtService.verifyAndDecodeHTTPHeader({ authorization: `Bearer ${token}` });

    expect(user.sub).toBe(sub);
});


test.each([
    [undefined],
    [null],
    [0],
    [1],
    [-1],
    ['invalid'],
    ['Bearer invalid'],
    ['Bearer '],
    ['Bearer Hello'],
    ['Bearer 123e4567-e89b-12d3-a456-426614174000'],    
])('JwtService.verifyAndDecodeHTTPHeader invalid partitions', async (options) => {
    const user = JwtService.verifyAndDecodeHTTPHeader(options);
    expect(user).toBe(null);
});


test.each([
    [undefined, 'Token is required.'],
    [null, 'Token is required.'],
    [0, 'Token is required.'], // if (0) is the same as if (false)
    [1, 'Token must be a string.'], // if (1) is the same as if (true)
    [-1, 'Token must be a string.'],
    ['invalid', 'Token must be a valid JWT.'],
    ['Bearer invalid', 'Token must be a valid JWT.'],
    ['Bearer ', 'Token must be a valid JWT.'],
    ['Bearer Hello', 'Token must be a valid JWT.'],
    ['Bearer 123e4567-e89b-12d3-a456-426614174000', 'Token must be a valid JWT.'],    
])('JwtService.verifyAndDecodeString invalid partitions', async (token, expected) => {
    expect(() => JwtService.verifyAndDecodeString(token)).toThrowError(expected);
});

test('JwtService.verifyAndDecodeHTTPHeader valid', async () => {
    const token = JwtService.sign('123e4567-e89b-12d3-a456-426614174000');
    const user = JwtService.verifyAndDecodeHTTPHeader({ authorization: `Bearer ${token}` });

    expect(user.sub).toBe('123e4567-e89b-12d3-a456-426614174000');
});
