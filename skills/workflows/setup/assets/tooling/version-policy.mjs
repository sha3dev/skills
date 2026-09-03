export function parseStableVersion(version, label) {
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
	if (!match)
		throw new Error(`${label} must be an exact stable semantic version`);
	return match.slice(1).map(Number);
}

export function assertMinimumVersion(actual, minimum, label) {
	const actualParts = parseStableVersion(actual, label);
	const minimumParts = parseStableVersion(minimum, `${label} minimum`);

	for (let index = 0; index < actualParts.length; index += 1) {
		if (actualParts[index] > minimumParts[index]) return;
		if (actualParts[index] < minimumParts[index]) {
			throw new Error(
				`${label} must be at least ${minimum}; received ${actual}`,
			);
		}
	}
}
