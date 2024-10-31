import 'dotenv/config'
import { expect, test } from "vitest";
import { getJoinMessage } from "../../../src/shared/utils/join_message_utils.js";

test.each([
    ['hello {name}', 'name', 'John Doe', 'hello John Doe'],
    ['hello {name}', 'name', 'Jane Doe', 'hello Jane Doe'],
    ['hello {world}', 'world', 'Jane Doe', 'hello Jane Doe'],
])('getJoinMessage valid partitions', async (body, key, value, expected) => {
    const result = getJoinMessage(body, [{ key, value }]);
    expect(result).toBe(expected);
});

test.each([
    [undefined, { key: 'name', value: 'John Doe' }, 'No body provided'],
    [null, { key: 'name', value: 'John Doe' }, 'No body provided'],
    [0, { key: 'name', value: 'John Doe' }, 'No body provided'],
    ["", { key: 'name', value: 'John Doe' }, 'No body provided'],
    ["hello {name}", undefined, 'No replacements provided'],
    ["hello {name}", null, 'No replacements provided'],
    ["hello {name}", 0, 'No replacements provided'],
    ["hello {name}", "", 'No replacements provided'],
    ["hello {name}", {}, 'Replacements must be an array'],
    ["hello {name}", [], 'Replacements must contain at least one object'],
    ["hello {name}", [{}], 'Replacements must contain an object with key and value'],
    ["hello {name}", [{ key: 'key' }], 'Replacements must contain an object with key and value'],
    ["hello {name}", [{ value: 'value' }], 'Replacements must contain an object with key and value'],
])('getJoinMessage invalid partitions', async (body, replacements, expected) => {
    expect(() => getJoinMessage(body, replacements)).toThrowError(expected);
});
