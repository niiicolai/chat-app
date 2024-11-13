
export function getJoinMessage(body, replacements) {
    if (!body) throw new Error('No body provided');
    if (!replacements) throw new Error('No replacements provided');
    if (!Array.isArray(replacements)) throw new Error('Replacements must be an array');
    if (replacements.length === 0) throw new Error('Replacements must contain at least one object');
    if (!replacements.every(replacement => replacement.key && replacement.value)) {
        throw new Error('Replacements must contain an object with key and value');
    }

    for (const replacement of replacements) {
        if (body.includes(`{${replacement.key}}`)) {
            body = body.replace(`{${replacement.key}}`, replacement.value);
        }
    }

    return body;
}
