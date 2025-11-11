// Small client helper used by pages to call internal API routes.
export async function queryDatabase(path, body = {}) {
	try {
		const res = await fetch(path, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		const data = await res.json()
		return data
	} catch (err) {
		console.error('queryDatabase error calling', path, err)
		throw err
	}
}