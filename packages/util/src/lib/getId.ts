import v4 from 'uuid/v4'

export function getId(type = '') {
	if (type === 'short') {
		return makeShortId(4)
	}
	return v4()
}

function makeShortId(length = 6) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}